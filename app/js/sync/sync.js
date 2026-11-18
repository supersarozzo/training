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
import { createDocSyncer } from "./docsync.js";
import { mergeDocs, canonical, hasChangesSince } from "./merge.js";
import { validateDocument, emptyDoc } from "../validate.js";
import { hasData } from "../store.js";

export const MESSAGES = {
  ok: "Synced.",
  not_set_up: "Only on this phone. Set up GitHub in Progress › Settings.",
  not_set_up_here: "Only on this phone. Set up GitHub below.", // inside Settings itself
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

// The food file's sync state in the device box (sync/foodsync.js). Forget key and a new connection clear it too.
export const FOOD_SYNC_KEYS = ["food_last_sha", "food_last_sync_at", "food_last_sync_result", "food_last_sync_attempt_at"];

const DEFAULTS = { repo: "training-data", branch: "main", path: "progress.json" };

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
  delete next.food_last_sha;
  // The last result belongs to the old key or repo: a new key that works must not still show "key wrong" (review F3).
  delete next.last_sync_result;
  delete next.last_sync_attempt_at;
  delete next.food_last_sync_result;
  delete next.food_last_sync_attempt_at;
  if (owner !== device.owner || repo !== device.repo) { delete next.last_sync_at; delete next.food_last_sync_at; } // another repo: not synced there yet
  store.saveDevice(next);
  return { ok: true };
}

// "Forget GitHub key": the token and the sync state leave the phone. The data stays.
export function forgetKey(store) {
  const device = { ...store.loadDevice() };
  for (const k of ["token", "last_sha", "last_sync_at", "last_sync_result", "last_sync_attempt_at", "token_expires", ...FOOD_SYNC_KEYS]) delete device[k];
  store.saveDevice(device);
}

const codeOf = (e) => (e instanceof SyncError ? e.code : "error");

// What makes progress.json different from food.json; the flow itself lives in docsync.js.
export function progressKind(store) {
  return {
    connection: connectionOf,
    keys: { sha: "last_sha", at: "last_sync_at", result: "last_sync_result", attempt: "last_sync_attempt_at" },
    messages: MESSAGES,
    load: () => store.load(),
    save: (doc) => store.save(doc),
    savePrev: () => store.savePrev(),
    validate: validateDocument,
    empty: emptyDoc,
    merge: mergeDocs,
    canonical,
    hasData,
    changesSince: hasChangesSince,
    commitMessage: (startedAt) => `Training log ${startedAt}`,
  };
}

// store: createStore(...). getFetch: () => fetch-like function. nowIso: () => ISO time.
export function createSyncer({ store, getFetch, nowIso = () => new Date().toISOString() }) {
  const core = createDocSyncer({ kind: progressKind(store), device: store, getFetch, nowIso });
  return {
    ...core,
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
// 0.7.2 (automatic sync): a problem in words first; then "Not sent yet, will send automatically."; then
// "Synced 12:25." (today) or "Synced 18 Nov, 12:25." (another day). `now` is for tests.
export const NOT_SENT_YET = "Not sent yet, will send automatically.";

// Back-off for automatic sync (0.7.2, Training Agent), from the saved workout result (the one the status line shows):
// "none" = no problem; "wait" = a wrong key, no access or a damaged GitHub file: nothing automatic until "Sync now" or
// a new key (saveConnection clears the result); "retry" = any other problem: open, front, signal back or "Sync now"
// try again, never the 10 s quiet time or the way out. A food problem does not stop the workout sync.
const WAIT_FOR_PERSON = new Set(["auth", "no_access", "broken_remote"]);
export function syncProblem(device) {
  const r = device?.last_sync_result;
  if (!r || r === "ok" || r === "not_set_up") return "none";
  return WAIT_FOR_PERSON.has(r) ? "wait" : "retry";
}
export function statusText(device, unsynced = false, place = "elsewhere", now = new Date()) {
  if (!connectionOf(device)) return place === "settings" ? MESSAGES.not_set_up_here : MESSAGES.not_set_up;
  const r = device.last_sync_result;
  if (r && r !== "ok") return MESSAGES[r] ?? MESSAGES.error;
  if (unsynced) return NOT_SENT_YET;
  if (!device.last_sync_at) return "GitHub is set up. Not synced yet.";
  const when = new Date(device.last_sync_at);
  const time = when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const sameDay = when.toDateString() === now.toDateString();
  return sameDay ? `Synced ${time}.` : `Synced ${when.toLocaleDateString(undefined, { day: "numeric", month: "short" })}, ${time}.`;
}

// The GitHub key ends soon (within 14 days) or has ended: { date, days } (days is negative when it has ended), else null.
export function keyEndsSoon(device, todayDate) {
  if (!connectionOf(device) || !device.token_expires) return null;
  const days = Math.round((Date.parse(device.token_expires) - Date.parse(todayDate)) / 86400000);
  return days <= 14 ? { date: device.token_expires, days } : null;
}
