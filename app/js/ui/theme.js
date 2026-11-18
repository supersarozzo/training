// Look (Auto / Light / Dark) and Animations (on / off): device-only settings (prefs.js; boot.js applies them before
// the first paint). Auto follows the phone, also when the phone turns light or dark while the app is open.
// Animations off stops CSS motion, the JS motion helpers and the photo loop. docs/checks/2026-11-18-dark-mode.md.
import { store } from "./app.js";
import { readPrefs, savePrefs } from "../prefs.js";
import { applyThemeTo } from "../theme.js";

export const THEMES = [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]];

export function currentTheme() { return readPrefs(store).theme; }
export function motionOff() { return readPrefs(store).motionOff; }

// A switch is instant: transitions are off (app.css html.theme-switching) until the new colours are drawn, so no part
// fades on its own. Used by a Settings switch and by the phone turning light or dark (auditor m8).
function withoutFade(change) {
  const root = document.documentElement;
  root.classList.add("theme-switching");
  change();
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
}

let watching = false;
// The phone turning light or dark: CSS follows by itself; this applies the Look again so the data-theme and the bar
// colour tags stay right (a fixed Light or Dark stays as it is), with no fade.
function watchPhone() {
  if (watching) return;
  const phone = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (!phone?.addEventListener) return;
  phone.addEventListener("change", () => withoutFade(() => applyTheme()));
  watching = true;
}

export function applyTheme(theme = currentTheme()) {
  applyThemeTo(document, theme);
  watchPhone();
}
export function applyMotion(off = motionOff()) {
  document.documentElement.setAttribute("data-motion", off ? "off" : "on");
}

export function setTheme(theme) {
  try { savePrefs(store, { theme }); } catch { /* storage blocked: the choice lasts until the app closes */ }
  withoutFade(() => applyTheme(theme));
}
export function setMotionOff(off) {
  try { savePrefs(store, { motionOff: off }); } catch { /* storage blocked: lasts until the app closes */ }
  applyMotion(off);
}
