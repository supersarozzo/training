// Service worker start-up, the "New version ready" banner, and the install hint.
// The banner shows only on the main screens (Today, Progress, Plan, Settings), never in a workout or a flow.
import { h } from "../h.js";
import { store, rerender } from "./app.js";
import { createUpdater, workerWanted, updateWords, mayRedraw } from "../updater.js";
import { APP_VERSION } from "../version.js";
import { getActive } from "../active.js";

// One updater for the page (app/js/updater.js has the rules; 0.7.3 fixed the iPhone never showing the bar).
let updater = null;

export function registerWorker() {
  const on = workerWanted(location, navigator);
  updater = createUpdater({
    sw: on ? navigator.serviceWorker : null, doc: document, win: window,
    // Redraw only where it is safe (updater.js mayRedraw), and keep the scroll position (render() scrolls to the top).
    onChange: () => { if (mayRedraw(location.hash, document)) { const y = window.scrollY; rerender(); window.scrollTo(0, y); } },
    fetch: (...args) => fetch(...args), caches: window.caches ?? null, version: APP_VERSION,
    inWorkout: () => getActive() !== null,
  });
  if (on) updater.start();
}

export function updateBanner() {
  const waiting = updater?.waiting();
  if (!waiting) return null;
  return h("div", { class: "update-banner", role: "status" },
    h("span", {}, "New version ready"),
    h("button", { class: "button", type: "button", onclick: () => updater.apply() }, "Update"));
}

// The Settings version card: the Update button and what the last tap found.
export function updateNow() { if (updater) updater.updateNow(); }
export function updateStatusWords() { return updater ? updateWords(updater.status()) : ""; }

// Safari can delete a web page's data after 7 days without use; an app on the home screen is safe.
export function isInstalled() {
  return window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}
export function installHintShown() {
  if (isInstalled()) return false;
  try { return !store.loadDevice().install_hint_dismissed; } catch { return true; }
}
export function dismissInstallHint() {
  try { store.saveDevice({ ...store.loadDevice(), install_hint_dismissed: true }); } catch { /* storage blocked */ }
}
