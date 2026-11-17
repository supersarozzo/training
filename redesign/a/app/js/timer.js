// Timers store an END TIME (epoch milliseconds). The screen shows end - now, so the time is right after
// the phone was locked or the tab was hidden (docs/ARCHITECTURE.md section 8). Never count ticks.

// ---- pure part (unit tests) ----
export const remainingMs = (end, now) => Math.max(0, end - now);
export const startTimer = (seconds, now) => now + seconds * 1000;
// +30 s / -30 s. The end never goes before `now`.
export const adjustTimer = (end, deltaSeconds, now) => Math.max(now, end + deltaSeconds * 1000);
// 0 to 1: how much of the ring is used up.
export function ringFraction(end, totalMs, now) {
  if (totalMs <= 0) return 1;
  return Math.min(1, Math.max(0, 1 - remainingMs(end, now) / totalMs));
}
// m:ss, rounded UP to whole seconds (so 0:00 only shows when the time is really over).
export function formatClock(ms) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
// A timer that ended long ago (the phone was locked) must not flash and beep when the app comes back.
export const FLASH_GRACE_MS = 3000;
export const endedLongAgo = (end, now) => now - end > FLASH_GRACE_MS;

// ---- page part: one ticker for every live timer on the screen ----
const tickers = new Set();
let interval = null;

function tickAll() {
  const now = Date.now();
  for (const fn of [...tickers]) fn(now);
}
function ensureRunning() {
  if (interval === null && tickers.size) interval = setInterval(tickAll, 250);
  if (interval !== null && !tickers.size) { clearInterval(interval); interval = null; }
}
if (typeof document !== "undefined") {
  // When the tab comes back, show the right time at once (do not wait for the next tick).
  document.addEventListener("visibilitychange", () => { if (!document.hidden) tickAll(); });
  window.addEventListener("pageshow", tickAll);
}

// Call `fn(now)` about 4 times a second, and once at once. Returns a function that stops it.
export function addTicker(fn) {
  tickers.add(fn);
  ensureRunning();
  fn(Date.now());
  return () => { tickers.delete(fn); ensureRunning(); };
}
// The router calls this before drawing a new screen.
export function clearTickers() { tickers.clear(); ensureRunning(); }
