// When sync runs by itself (docs/ARCHITECTURE.md section 5.4). Only while the app is open: an iPhone web app
// can not run code when it is closed. Never during a workout.
const FIVE_MINUTES = 5 * 60 * 1000;

// `win` has addEventListener and a document with visibilityState. `inWorkout()` says if a workout is running.
export function startAutoSync({ syncer, win, inWorkout, now = Date.now }) {
  let last = -Infinity;
  function attempt({ force = false } = {}) {
    if (!syncer.isConfigured() || inWorkout()) return false;
    if (!force && now() - last < FIVE_MINUTES) return false;
    last = now();
    syncer.request("full");
    return true;
  }
  const onVisible = () => { if (win.document.visibilityState === "visible") attempt(); };
  const onOnline = () => { if (syncer.hasUnsynced()) attempt({ force: true }); };
  win.addEventListener("visibilitychange", onVisible);
  win.addEventListener("online", onOnline);
  attempt(); // the app just opened
  return { attempt, stop() { win.removeEventListener("visibilitychange", onVisible); win.removeEventListener("online", onOnline); } };
}
