// When sync runs by itself (docs/ARCHITECTURE.md section 5.4). Only while the app is open: an iPhone web app
// can not run code when it is closed. Never while a workout runs (it waits for Finish, also when the app is hidden).
// 0.7.2 (automatic sync, Rosario via the Training Agent):
//  - after every save of synced data, a quiet time of QUIET_MS; then one full sync if something is not sent yet, so a
//    burst of changes is one sync (a new save starts the quiet time again);
//  - going to the background (visibilitychange to hidden, pagehide): the sync runs at once if something is not sent
//    (best effort: iOS may cut it short; nothing is lost, the phone's data is the queue). Both events fire when the
//    app closes: the second one adds no round unless a save came in between (review M1);
//  - open, coming to the front: at once if something is not sent, else at most once every 5 minutes (news only). If a
//    sync is still running (iOS paused it in the background), the front sync waits for it to end (review, checker 2);
//  - signal back (online): at once if something is not sent.
//  - back-off (Training Agent): after a failed sync (`problem()` from the saved last result, sync.js syncProblem), the
//    quiet time and the way out send nothing. "retry": open, front, signal back or "Sync now" try again. "wait" (wrong
//    key, no access, damaged GitHub file): nothing automatic until "Sync now" or a new key clears the saved result.
// The one-sync-at-a-time and "again" rules live in the syncer (sync/both.js, sync/docsync.js).
const FIVE_MINUTES = 5 * 60 * 1000;
export const QUIET_MS = 10_000;

// A store whose save also signals "synced data changed". The screens and models save through it; the syncers use the
// plain store, so the sync's own merge saves are not changes (a record dated ahead by another phone's clock would
// otherwise start a sync every 10 s for ever). The store saves first; a failed save (phone full) signals nothing.
export function withSaveSignal(store, signal) {
  return {
    ...store,
    save(doc) {
      store.save(doc);
      try { signal(); } catch { /* a signal problem must never break a save */ }
    },
  };
}

// The page's one signal: app.js and foodapp.js call noteSaved after a save; main.js hands it to startAutoSync.
const savedListeners = new Set();
export function noteSaved() { savedListeners.forEach((fn) => { try { fn(); } catch { /* never break a save */ } }); }
export function onDataSaved(fn) { savedListeners.add(fn); return () => savedListeners.delete(fn); }

// After a sync ends, which screen may redraw (so its status line is right)? Only the quiet ones, never a workout or
// the Plan, never the Diet tab with a sheet or the scanner open, and never while a text field is being typed in (a
// redraw would close the keyboard; review, checker 4). `doc` is the page's document (a pretend one in tests).
export function redrawAfterSync(hash, doc) {
  const el = doc.activeElement;
  const tag = el?.tagName ?? "";
  const typing = tag === "TEXTAREA" || tag === "SELECT" || (tag === "INPUT" && !/^(checkbox|radio|button|submit|reset|range)$/.test(String(el.type ?? "")));
  if (typing) return false;
  if (["", "#/today", "#/settings", "#/progress"].includes(hash)) return true;
  return hash === "#/diet" && !doc.querySelector("[data-sheet], [data-scan]");
}

// `win` has addEventListener and a document with visibilityState. `inWorkout()` says if a workout is running.
// `problem()` says "none", "retry" or "wait" (the back-off above).
export function startAutoSync({ syncer, win, inWorkout, problem = () => "none", now = Date.now, setTimer = (fn, ms) => setTimeout(fn, ms), clearTimer = (id) => clearTimeout(id) }) {
  let last = -Infinity; // the last automatic sync started
  let timer = null;
  let savedSinceRun = false; // a save came in after the last automatic sync started
  let frontWaits = false; // open or front found a sync still running: try again when it ends
  const allowed = () => { try { return syncer.isConfigured() && !inWorkout(); } catch { return false; } };
  // A damaged box must never stop the app: it then counts as "nothing to send".
  const unsent = () => { try { return syncer.hasUnsynced(); } catch { return false; } };
  // A problem that can not be read counts as "retry": never on the timer, open and front still try.
  const kind = () => { try { return problem(); } catch { return "retry"; } };
  const running = () => { try { return Boolean(syncer.isRunning?.()); } catch { return false; } };
  const run = () => { last = now(); savedSinceRun = false; syncer.request("full"); return true; };
  const cancel = () => { if (timer !== null) { clearTimer(timer); timer = null; } };
  // The quiet time and the way out: only with no problem, and no second round for nothing.
  const sendQuietly = () => {
    if (!allowed() || kind() !== "none" || !unsent()) return;
    if (running() && !savedSinceRun) return; // the running sync already carries everything saved before it
    run();
  };

  // Open, front, signal back. `force`: skip the 5-minute limit.
  function attempt({ force = false } = {}) {
    if (!allowed()) return false;
    const k = kind();
    if (k === "wait") return false;
    if (!force && k === "none" && !unsent() && now() - last < FIVE_MINUTES) return false;
    if (running()) { frontWaits = true; return false; } // a failed round would drop an "again": wait for the end
    return run();
  }
  // After a save of synced data: start (or start again) the quiet time.
  function changed() {
    savedSinceRun = true;
    cancel();
    timer = setTimer(() => { timer = null; sendQuietly(); }, QUIET_MS);
  }
  // Going to the background: do not wait for the quiet time.
  function flush() {
    cancel();
    sendQuietly();
  }

  const onVisibility = () => { if (win.document.visibilityState === "visible") attempt(); else flush(); };
  const onOnline = () => { if (unsent()) attempt({ force: true }); };
  const onPageHide = () => flush();
  const onResult = () => { if (frontWaits) { frontWaits = false; attempt(); } };
  win.addEventListener("visibilitychange", onVisibility);
  win.addEventListener("online", onOnline);
  win.addEventListener("pagehide", onPageHide);
  let unsubscribe = () => {};
  try { unsubscribe = syncer.subscribe?.(onResult) ?? unsubscribe; } catch { /* no results: the front sync just does not wait */ }
  attempt(); // the app just opened
  return {
    attempt,
    changed,
    flush,
    stop() {
      cancel();
      win.removeEventListener("visibilitychange", onVisibility);
      win.removeEventListener("online", onOnline);
      win.removeEventListener("pagehide", onPageHide);
      try { unsubscribe(); } catch { /* ignore */ }
    },
  };
}
