// Start-up and router. Hash routes: #/today, #/progress, #/plan, #/settings (with tabs),
// and #/setup, #/intake, #/targets (the first-start flow, no tabs).
import { mount, h } from "./h.js";
import { renderToday } from "./ui/today.js";
import { renderProgress } from "./ui/progress.js";
import { renderPlan } from "./ui/plansheet.js";
import { renderSettings } from "./ui/settings.js";
import { renderSetup } from "./ui/setup.js";
import { renderIntake } from "./ui/intake.js";
import { renderTargets } from "./ui/targets.js";
import { renderWorkout } from "./ui/workout.js";
import { renderWeighin } from "./ui/weighin.js";
import { renderWeekly } from "./ui/weekly.js";
import { tabBar, errorState } from "./ui/parts.js";
import { model, setRedraw } from "./ui/app.js";
import { clearTickers } from "./timer.js";
import { closeSheets, openSheet } from "./ui/parts.js";
import { setSoundOn } from "./sound.js";
import { soundOn } from "./active.js";
import { registerWorker, updateBanner } from "./ui/update.js";
import { syncer } from "./syncer.js";
import { startAutoSync } from "./autosync.js";
import { getActive } from "./active.js";
import { watchStoreErrors } from "./errors.js";

const tabRoutes = { today: renderToday, progress: renderProgress, plan: renderPlan, settings: renderSettings };
const flowRoutes = { setup: renderSetup, intake: renderIntake, targets: renderTargets, workout: renderWorkout, weighin: renderWeighin, weekly: renderWeekly };
const DEFAULT_ROUTE = "today";

function routeName(hash) {
  const name = hash.replace(/^#\/?/, "").split("/")[0];
  return Object.hasOwn(tabRoutes, name) || Object.hasOwn(flowRoutes, name) ? name : DEFAULT_ROUTE;
}

// Where the app really goes: no profile -> first start; profile without confirmed targets -> targets.
function guard(name) {
  const doc = model.doc();
  if (!doc.profile) return name === "setup" || name === "intake" ? name : "setup";
  if (!doc.profile.targets) return "targets";
  if (name === "setup" || name === "intake") return DEFAULT_ROUTE;
  return name;
}

function render() {
  const root = document.getElementById("app");
  clearTickers(); // timers of the old screen stop
  closeSheets();
  try {
    const wanted = routeName(location.hash);
    const name = guard(wanted);
    if (name !== wanted) history.replaceState(null, "", `#/${name}`);
    if (Object.hasOwn(flowRoutes, name)) mount(root, flowRoutes[name]());
    else mount(root, tabRoutes[name](), updateBanner(), tabBar(name));
    window.scrollTo(0, 0);
  } catch (e) {
    mount(root, errorState(e && e.message ? e.message : "The app could not start."));
  }
}

// A save that failed because the phone is full (or blocks storage) says so, instead of doing nothing (review F2).
watchStoreErrors(window, (text) => {
  const close = openSheet(h("h2", {}, "Not saved"), h("p", {}, text), h("button", { class: "button", type: "button", onclick: () => close() }, "OK"));
});

try { setSoundOn(soundOn()); } catch { /* storage blocked: default sound on */ }
setRedraw(render);
window.addEventListener("hashchange", render);
render();
registerWorker();
// Sync when the app opens, comes to the front, or gets signal back. Never during a workout.
startAutoSync({ syncer, win: window, inWorkout: () => getActive() !== null });
// When a sync ends, redraw the quiet screens so the status line is right (never a workout or a form being filled in).
syncer.subscribe(() => { if (["#/today", "#/settings", "#/progress"].includes(location.hash) || location.hash === "") render(); });
