// Theme override (redesign A): Auto follows the phone, or always Light / always Dark. A device-only choice:
// it lives in the device box (never synced, never in a backup). DESIGN.md section 3 asked for this override.
import { store } from "./app.js";

export const THEMES = [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]];

export function currentTheme() {
  try { const t = store.loadDevice().theme; return t === "light" || t === "dark" ? t : "auto"; } catch { return "auto"; }
}

export function applyTheme(theme = currentTheme()) {
  const root = document.documentElement;
  if (theme === "auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", theme);
  const dark = theme === "dark" || (theme === "auto" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#08090c" : "#f2f3f5");
}

export function setTheme(theme) {
  try { store.saveDevice({ ...store.loadDevice(), theme }); } catch { /* storage blocked: the choice lasts until the app closes */ }
  applyTheme(theme);
}
