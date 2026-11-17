// Motion helpers: Web Animations API only, transform and opacity only (smooth on an iPhone).
// Every helper does nothing when the phone asks for less motion (Settings > Accessibility > Reduce Motion).
export const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
export const SPRING = "cubic-bezier(0.34, 1.4, 0.64, 1)";

// Animations are off when the phone asks for less motion, or when Settings > Animations is off (device only).
// Saved in the device box (trn.device.v1, never synced), like the sound setting.
import { store } from "./app.js";
export function motionSetting() {
  try { return store.loadDevice().motion_off !== true; } catch { return true; }
}
export function setMotionSetting(on) {
  try { store.saveDevice({ ...store.loadDevice(), motion_off: !on }); } catch { /* storage blocked: stays on */ }
  applyMotionSetting();
}
export function applyMotionSetting() {
  try { document.documentElement.dataset.motion = motionSetting() ? "on" : "off"; } catch { /* no page */ }
}
export function reduced() {
  if (!motionSetting()) return true;
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
}

export function play(el, frames, opts = {}) {
  if (!el || reduced() || typeof el.animate !== "function") return null;
  try { return el.animate(frames, { duration: 280, easing: EASE, fill: "none", ...opts }); } catch { return null; }
}

// A new screen comes in: a short slide and fade. `back` slides from the left.
export function screenIn(el, { back = false } = {}) {
  return play(el, [{ opacity: 0, transform: `translateX(${back ? -18 : 18}px)` }, { opacity: 1, transform: "none" }], { duration: 300 });
}

// A small "pop" on a value that just changed (stepper numbers, a saved set).
export function bump(el, scale = 1.08) {
  return play(el, [{ transform: "scale(1)" }, { transform: `scale(${scale})` }, { transform: "scale(1)" }], { duration: 240, easing: SPRING });
}

// Count a number up from 0 (metrics on Finish and the weekly summary). Text only; the final text is set at once
// for screen readers and when motion is reduced.
export function countUp(el, to, { decimals = 0, ms = 700 } = {}) {
  const final = decimals ? to.toFixed(decimals) : String(Math.round(to));
  el.textContent = final;
  if (reduced() || !Number.isFinite(to) || to === 0 || typeof requestAnimationFrame !== "function") return;
  const start = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - start) / ms);
    const eased = 1 - (1 - k) ** 3;
    el.textContent = k >= 1 ? final : (to * eased).toFixed(decimals);
    if (k < 1 && el.isConnected) requestAnimationFrame(step);
  };
  el.textContent = (0).toFixed(decimals);
  requestAnimationFrame(step);
}

// Grow a progress segment from its old fill to the new one.
export function fillFrom(el, from, to) {
  return play(el, [{ transform: `scaleX(${from})` }, { transform: `scaleX(${to})` }], { duration: 520 });
}
