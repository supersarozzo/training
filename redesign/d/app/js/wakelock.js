// Keep the screen on during a workout (Screen Wake Lock). Works in home-screen apps on iOS 18.4 and later.
// Asked again when the app comes back to the front; released on Finish.
let lock = null;
let wanted = false;
let failedOnce = false;
let onFail = () => {};

async function request() {
  if (!wanted || lock) return;
  try {
    if (!("wakeLock" in navigator)) throw new Error("not supported");
    lock = await navigator.wakeLock.request("screen");
    lock.addEventListener("release", () => { lock = null; });
  } catch {
    lock = null;
    if (!failedOnce) { failedOnce = true; onFail(); } // tell once per workout
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => { if (!document.hidden) request(); });
}

// Call from a tap (Start) and again whenever a workout screen shows. `fail` runs once if the phone refuses.
export function keepScreenOn(fail) {
  if (fail) onFail = fail;
  wanted = true;
  request();
}
export function resetWakeLockNotice() { failedOnce = false; }
export async function releaseScreen() {
  wanted = false;
  failedOnce = false;
  const l = lock;
  lock = null;
  try { if (l) await l.release(); } catch { /* ignore */ }
}
