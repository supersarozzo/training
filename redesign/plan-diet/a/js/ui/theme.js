// Look (Auto / Light / Dark) and Animations (on / off): device-only settings (prefs.js; boot.js applies them before
// the first paint). Auto follows the phone. Animations off stops CSS motion, the JS motion helpers and the photo loop.
import { store } from "./app.js";
import { readPrefs, savePrefs } from "../prefs.js";

export const THEMES = [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]];

export function currentTheme() { return readPrefs(store).theme; }
export function motionOff() { return readPrefs(store).motionOff; }

export function applyTheme(theme = currentTheme()) {
  const root = document.documentElement;
  if (theme === "auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", theme);
  const dark = theme === "dark" || (theme === "auto" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#08090c" : "#f2f3f5");
}
export function applyMotion(off = motionOff()) {
  document.documentElement.setAttribute("data-motion", off ? "off" : "on");
}

export function setTheme(theme) {
  try { savePrefs(store, { theme }); } catch { /* storage blocked: the choice lasts until the app closes */ }
  applyTheme(theme);
}
export function setMotionOff(off) {
  try { savePrefs(store, { motionOff: off }); } catch { /* storage blocked: lasts until the app closes */ }
  applyMotion(off);
}
