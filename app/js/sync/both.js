// The page's sync runs both files, one after the other: progress.json first, then food.json.
// It has the same shape as one syncer (request, isRunning, subscribe, isConfigured, hasUnsynced, test), so the
// screens and autosync.js need no change. The result is the workout result (the status line on Today and in
// Settings stays about the workout log) with the food result in `food`. Only "not sent yet" (hasUnsynced) also
// counts new food, so unsent food is never hidden.
// A problem with one file never stops or changes the other, except when the problem is the connection itself
// (no signal, wrong key, no access, rate limit, not set up): then the food call is skipped, so GitHub is not asked
// twice for nothing.
const SKIP_FOOD = new Set(["not_set_up", "offline", "auth", "no_access", "rate"]);

const safe = (fn) => { try { return fn(); } catch { return false; } };

export function combineSyncers(progress, food) {
  let running = null;
  let again = null;
  const listeners = new Set();

  async function once(mode) {
    const res = await progress.request(mode);
    const foodRes = SKIP_FOOD.has(res.result) ? { result: res.result, skipped: true } : await food.request(mode);
    return { ...res, food: foodRes };
  }

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
        } while (m && res.result === "ok"); // like the workout sync: a failed round is not run again
      } catch {
        res = { result: "error", food: { result: "error" } };
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
    isRunning: () => running !== null || progress.isRunning() || food.isRunning(),
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    isConfigured: () => progress.isConfigured(),
    // A damaged or too-new food box must never stop Today or Settings from drawing: it then counts as "nothing new".
    hasUnsynced: () => progress.hasUnsynced() || safe(() => food.hasUnsynced()),
    test: (...a) => progress.test(...a),
    progress,
    food,
  };
}
