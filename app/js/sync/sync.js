// One sync, step by step (docs/ARCHITECTURE.md section 5.2). The flow is:
//   GET the file -> check it -> merge with the phone -> save on the phone -> PUT (with the sha) -> remember the sha.
// Rules that matter (section 12, item 3):
//  - one sync at a time (a second request waits for one more round at the end);
//  - an edit made while the network call waits is kept (the merge result is merged again with what is stored now);
//  - never PUT when the GitHub file could not be read or checked;
//  - 409 and 422 start again from the GET, up to 3 times;
//  - the time of "last synced" is the time the sync STARTED;
//  - the token is only handed to github.js. It never appears in a result, a message or a log.
import { createGithub, SyncError, validName } from "./github.js";
import { mergeDocs, canonical, hasChangesSince } from "./merge.js";
import { validateDocument, emptyDoc } from "../validate.js";
import { hasData } from "../store.js";

export const MESSAGES = {
  ok: "Synced.",
  not_set_up: "Only on this phone. Set up GitHub in Settings.",
  offline: "Saved on phone. Will sync when online.",
  auth: "GitHub key expired or wrong. Make a new one.",
  no_access: "Can't reach training-data. Check the repo name and key.",
  rate: "GitHub says wait a bit.",
  conflict: "Sync clash. Tap to try again.",
  broken_remote: "The GitHub file looks damaged. Not changed. Ask the Training chat.",
  too_new: "Update the app first.",
  full: "Phone storage full. Download a backup.",
  local_problem: "The data on this phone could not be read. Nothing was sent. Ask the Training chat.",
  local_invalid: "Some data on this phone does not pass the app's own check. Nothing was sent. Ask the Training chat.",
  error: "Saved on phone. Will sync later.",
};

const DEFAULTS = { repo: "training-data", branch: "main", path: "progress.json" };
const MAX_TRIES = 3;

export function connectionOf(device) {
  if (!device || typeof device.token !== "string" || !device.token || !device.owner) return null;
  return { token: device.token, owner: device.owner, repo: device.repo || DEFAULTS.repo, branch: device.branch || DEFAULTS.branch, path: device.path || DEFAULTS.path };
}

// Save the connection details in the device box. The token is only ever stored there.
export function saveConnection(store, { owner, repo, token, token_expires }) {
  owner = String(owner ?? "").trim();
  repo = String(repo ?? "").trim() || DEFAULTS.repo;
  if (!validName(owner)) return { ok: false, error: "The GitHub account name looks wrong. Use letters, numbers, - and _ only." };
  if (!validName(repo)) return { ok: false, error: "The repo name looks wrong. Use letters, numbers, - and _ only." };
  const device = store.loadDevice();
  const next = { ...device, owner, repo, branch: device.branch || DEFAULTS.branch, path: device.path || DEFAULTS.path };
  const t = String(token ?? "").trim();
  if (t) {
    if (!/^[\x21-\x7e]{8,300}$/.test(t)) return { ok: false, error: "That key does not look right. Paste it again, without spaces." };
    next.token = t;
  } else if (!device.token) {
    return { ok: false, error: "Paste your GitHub key first." };
  }
  if (token_expires !== undefined) {
    if (token_expires === "" || token_expires === null) delete next.token_expires;
    else if (/^\d{4}-\d{2}-\d{2}$/.test(token_expires) && !Number.isNaN(Date.parse(token_expires))) next.token_expires = token_expires;
    else return { ok: false, error: "The end date must look like 2027-11-16." };
  }
  delete next.last_sha; // a new connection starts clean
  store.saveDevice(next);
  return { ok: true };
}

// "Forget GitHub key": the token and the sync state leave the phone. The data stays.
export function forgetKey(store) {
  const device = { ...store.loadDevice() };
  for (const k of ["token", "last_sha", "last_sync_at", "last_sync_result", "last_sync_attempt_at", "token_expires"]) delete device[k];
  store.saveDevice(device);
}

const codeOf = (e) => (e instanceof SyncError ? e.code : "error");
function storeCode(e) {
  if (e && e.code === "full") return "full";
  return "local_problem";
}

// store: createStore(...). getFetch: () => fetch-like function. nowIso: () => ISO time.
export function createSyncer({ store, getFetch, nowIso = () => new Date().toISOString() }) {
  let running = null;
  let again = null;
  const listeners = new Set();

  function patchDevice(patch) {
    try { store.saveDevice({ ...store.loadDevice(), ...patch }); } catch { /* a full phone must not hide the sync result */ }
  }

  function done(result, extra = {}, devicePatch = {}) {
    patchDevice({ last_sync_result: result, last_sync_attempt_at: nowIso(), ...devicePatch });
    return { result, message: MESSAGES[result], ...extra };
  }

  // Read GitHub's file text into a clean document, or say what is wrong with it.
  function readRemote(file) {
    if (!file.found) return { ok: true, doc: emptyDoc() };
    let raw;
    try { raw = JSON.parse(file.text); } catch { return { ok: false, code: "broken_remote" }; }
    const checked = validateDocument(raw);
    if (!checked.ok) return { ok: false, code: checked.tooNew ? "too_new" : "broken_remote" };
    return { ok: true, doc: checked.doc };
  }

  async function once(mode) {
    const cfg = connectionOf(store.loadDevice());
    if (!cfg) return done("not_set_up");
    const startedAt = nowIso();
    let gh;
    try { gh = createGithub({ fetch: getFetch(), ...cfg }); } catch (e) { return done(codeOf(e)); }

    for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
      let file;
      try { file = await gh.getFile(); } catch (e) { return done(codeOf(e)); }

      const remote = readRemote(file);
      if (!remote.ok) return done(remote.code); // never PUT over a file we could not read

      let merged;
      try {
        const local = store.load();
        merged = mergeDocs(local, remote.doc);
        if (canonical(merged) !== canonical(mergeDocs(local, local))) {
          store.savePrev();
          // Merge again with what is stored right now, so nothing typed in the meantime is lost.
          store.save(mergeDocs(store.load(), merged));
        }
      } catch (e) { return done(storeCode(e)); }

      const found = file.found;
      if (mode === "get") return done("ok", { merged: true, found }, file.sha ? { last_sha: file.sha } : {});
      if (!hasData(merged)) return done("ok", { found }); // nothing to send yet
      if (found && canonical(merged) === canonical(remote.doc)) {
        return done("ok", { found }, { last_sha: file.sha, last_sync_at: startedAt }); // GitHub already has everything
      }

      // Never write a file that this app could not read back: the next GET would call it damaged (review F1).
      if (!validateDocument(JSON.parse(JSON.stringify(merged))).ok) return done("local_invalid");

      try {
        const sent = await gh.putFile({ text: `${JSON.stringify(merged, null, 2)}\n`, sha: file.sha, message: `Training log ${startedAt}` });
        return done("ok", { found, sent: true }, { ...(sent.sha ? { last_sha: sent.sha } : {}), last_sync_at: startedAt });
      } catch (e) {
        if (e instanceof SyncError && e.code === "conflict" && attempt < MAX_TRIES) continue;
        return done(codeOf(e));
      }
    }
    return done("conflict");
  }

  // mode "full" = get, merge, send. mode "get" = get and merge only (never sends).
  function request(mode = "full") {
    if (running) {
      again = again === "full" || mode === "full" ? "full" : "get";
      return running;
    }
    running = (async () => {
      let res;
      let m = mode;
      try {
        do {
          again = null;
          res = await once(m);
          m = again;
        } while (m && res.result === "ok");
      } catch {
        res = done("error");
      } finally {
        running = null;
        again = null;
      }
      listeners.forEach((fn) => { try { fn(res); } catch { /* a screen problem must not stop sync */ } });
      return res;
    })();
    return running;
  }

  return {
    request,
    isRunning: () => running !== null,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    isConfigured: () => connectionOf(store.loadDevice()) !== null,
    // Is there something on the phone that was changed after the last good sync?
    hasUnsynced() {
      const device = store.loadDevice();
      if (!connectionOf(device)) return false;
      return hasChangesSince(store.load(), device.last_sync_at);
    },
    // "Test connection": calls the repo only. The answer is a plain code.
    async test() {
      const cfg = connectionOf(store.loadDevice());
      if (!cfg) return { result: "not_set_up", message: MESSAGES.not_set_up };
      try {
        await createGithub({ fetch: getFetch(), ...cfg }).testRepo();
        return { result: "ok", message: "Connected. The key works." };
      } catch (e) {
        const code = codeOf(e);
        return { result: code, message: MESSAGES[code] };
      }
    },
  };
}

// ---------- plain-words status for the screens (pure) ----------

// A short line for Today and Settings. `unsynced` = something changed after the last good sync.
export function statusText(device, unsynced = false) {
  if (!connectionOf(device)) return MESSAGES.not_set_up;
  const r = device.last_sync_result;
  if (r && r !== "ok") return MESSAGES[r] ?? MESSAGES.error;
  if (!device.last_sync_at) return "GitHub is set up. Not synced yet.";
  const when = new Date(device.last_sync_at);
  const text = `Synced ${when.toLocaleDateString(undefined, { day: "numeric", month: "short" })}, ${when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}.`;
  return unsynced ? `${text} Newer changes not sent yet.` : text;
}

// The GitHub key ends soon (within 14 days) or has ended: { date, days } (days is negative when it has ended), else null.
export function keyEndsSoon(device, todayDate) {
  if (!connectionOf(device) || !device.token_expires) return null;
  const days = Math.round((Date.parse(device.token_expires) - Date.parse(todayDate)) / 86400000);
  return days <= 14 ? { date: device.token_expires, days } : null;
}
