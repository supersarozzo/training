// One sync of ONE file, step by step (docs/ARCHITECTURE.md section 5.2), for any synced document:
// progress.json (sync.js) and food.json (foodsync.js) both run through this one flow.
//   GET the file -> check it -> merge with the phone -> save on the phone -> PUT (with the sha) -> remember the sha.
// Rules that matter (section 12, item 3):
//  - one sync at a time (a second request waits for one more round at the end);
//  - an edit made while the network call waits is kept (the merge result is merged again with what is stored now);
//  - never PUT when the GitHub file could not be read or checked; never PUT a file this app could not read back;
//  - 409 and 422 start again from the GET, up to 3 times;
//  - the time of "last synced" is the time the sync STARTED;
//  - the token is only handed to github.js. It never appears in a result, a message or a log.
import { createGithub, SyncError } from "./github.js";

const MAX_TRIES = 3;
const codeOf = (e) => (e instanceof SyncError ? e.code : "error");
const storeCode = (e) => (e && e.code === "full" ? "full" : "local_problem");

// kind = {
//   connection(device)  -> { token, owner, repo, branch, path } or null
//   keys                -> device box names: { sha, at, result, attempt }
//   messages            -> { code: words }
//   load(), save(doc), savePrev()  -> the phone box of this document (throw StoreError on trouble)
//   validate(raw)       -> { ok, doc } | { ok: false, tooNew? }
//   empty()             -> an empty document
//   merge(a, b), canonical(doc), hasData(doc), changesSince(doc, iso)
//   commitMessage(startedAt)
// }
// device = { loadDevice(), saveDevice(d) } (the device box: the key and the sync state)
const AHEAD_MS = 10 * 60 * 1000;

export function createDocSyncer({ kind, device, getFetch, nowIso = () => new Date().toISOString() }) {
  let running = null;
  let again = null;
  const listeners = new Set();
  const K = kind.keys;

  function patchDevice(patch) {
    try { device.saveDevice({ ...device.loadDevice(), ...patch }); } catch { /* a full phone must not hide the sync result */ }
  }

  function done(result, extra = {}, devicePatch = {}) {
    patchDevice({ [K.result]: result, [K.attempt]: nowIso(), ...devicePatch });
    return { result, message: kind.messages[result], ...extra };
  }

  // Read GitHub's file text into a clean document, or say what is wrong with it.
  function readRemote(file) {
    if (!file.found) return { ok: true, doc: kind.empty() };
    let raw;
    try { raw = JSON.parse(file.text); } catch { return { ok: false, code: "broken_remote" }; }
    const checked = kind.validate(raw);
    if (!checked.ok) return { ok: false, code: checked.tooNew ? "too_new" : "broken_remote" };
    return { ok: true, doc: checked.doc };
  }

  async function once(mode) {
    const cfg = kind.connection(device.loadDevice());
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
        const local = kind.load();
        merged = kind.merge(local, remote.doc);
        if (kind.canonical(merged) !== kind.canonical(kind.merge(local, local))) {
          kind.savePrev();
          // Merge again with what is stored right now, so nothing typed in the meantime is lost.
          kind.save(kind.merge(kind.load(), merged));
        }
      } catch (e) { return done(storeCode(e)); }

      const found = file.found;
      if (mode === "get") return done("ok", { merged: true, found }, file.sha ? { [K.sha]: file.sha } : {});
      if (!kind.hasData(merged)) return done("ok", { found }); // nothing to send yet
      if (found && kind.canonical(merged) === kind.canonical(remote.doc)) {
        return done("ok", { found }, { [K.sha]: file.sha, [K.at]: startedAt }); // GitHub already has everything
      }

      // Never write a file that this app could not read back: the next GET would call it damaged (review F1).
      if (!kind.validate(JSON.parse(JSON.stringify(merged))).ok) return done("local_invalid");

      try {
        const sent = await gh.putFile({ text: `${JSON.stringify(merged, null, 2)}\n`, sha: file.sha, message: kind.commitMessage(startedAt) });
        return done("ok", { found, sent: true }, { ...(sent.sha ? { [K.sha]: sent.sha } : {}), [K.at]: startedAt });
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
    // The saved result of the last sync of this file (both.js: a stuck food file does not count as "not sent").
    lastResult: () => device.loadDevice()[K.result] ?? null,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    isConfigured: () => kind.connection(device.loadDevice()) !== null,
    // Is there something on the phone that was changed after the last good sync? A record dated more than 10 minutes
    // ahead came from a phone whose clock is wrong: it is not this phone's change, and counting it would say "Not sent
    // yet" for ever and sync on every front (0.7.2 review M3). This phone's own changes carry its own time.
    hasUnsynced() {
      const dev = device.loadDevice();
      if (!kind.connection(dev)) return false;
      return kind.changesSince(kind.load(), dev[K.at], new Date(Date.parse(nowIso()) + AHEAD_MS).toISOString());
    },
  };
}
