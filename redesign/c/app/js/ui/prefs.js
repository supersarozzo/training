// Look settings kept on this phone only (never synced, never in a backup): theme and animations.
// theme: "auto" | "light" | "dark". motion: "on" | "off" (the phone's "Reduce Motion" also turns animations off).
import { store } from "./app.js";

export function prefs() {
  let d = {};
  try { d = store.loadDevice(); } catch { /* storage blocked: defaults */ }
  return { theme: ["light", "dark"].includes(d.theme) ? d.theme : "auto", motion: d.motion === "off" ? "off" : "on" };
}

export function applyPrefs(root = document.documentElement) {
  const p = prefs();
  if (p.theme === "auto") delete root.dataset.theme; else root.dataset.theme = p.theme;
  if (p.motion === "off") root.dataset.motion = "off"; else delete root.dataset.motion;
  const dark = p.theme === "dark" || (p.theme === "auto" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0b0c10" : "#f2f3f7");
}

export function setPref(key, value) {
  try { store.saveDevice({ ...store.loadDevice(), [key]: value }); } catch { /* storage blocked: only this visit */ }
  applyPrefs();
}

// True when animations should run (Settings switch on and the phone does not ask for less motion).
export function motionOk() {
  if (document.documentElement.dataset.motion === "off") return false;
  return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
