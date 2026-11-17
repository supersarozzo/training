// Service worker start-up, the "New version ready" banner, and the install hint.
// The banner shows only on the main screens (Today, Progress, Plan, Settings), never in a workout or a flow.
import { h } from "../h.js";
import { store, rerender } from "./app.js";

let waiting = null; // a new worker that is ready and waits for the tap on Update
let updating = false; // true only after the tap on Update, so the page never reloads by itself

// The worker runs on GitHub Pages (https). On localhost it runs only with ?sw=1, so development files never get stuck in the cache.
function wanted() {
  if (!("serviceWorker" in navigator)) return false;
  if (location.protocol === "https:") return true;
  return location.hostname === "localhost" && new URLSearchParams(location.search).has("sw");
}

export function registerWorker() {
  if (!wanted()) return;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (updating) location.reload();
  });
  navigator.serviceWorker.register("sw.js").then((reg) => {
    const check = (worker) => {
      if (worker && worker.state === "installed" && navigator.serviceWorker.controller) { waiting = worker; rerender(); }
    };
    check(reg.waiting);
    reg.addEventListener("updatefound", () => {
      const worker = reg.installing;
      if (worker) worker.addEventListener("statechange", () => check(worker));
    });
    // Look for a new version when the app comes back to the front.
    document.addEventListener("visibilitychange", () => { if (!document.hidden) reg.update().catch(() => {}); });
  }).catch(() => { /* no worker: the app still works online */ });
}

export function updateBanner() {
  if (!waiting) return null;
  return h("div", { class: "update-banner", role: "status" },
    h("span", {}, "New version ready"),
    h("button", { class: "button", type: "button", onclick: () => { updating = true; waiting.postMessage("SKIP_WAITING"); } }, "Update"));
}

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
