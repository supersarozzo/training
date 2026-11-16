// Start-up and router. Hash routes: #/today, #/progress, #/plan, #/settings (with tabs),
// and #/setup, #/intake, #/targets (the first-start flow, no tabs).
import { mount } from "./h.js";
import { renderToday } from "./ui/today.js";
import { renderProgress } from "./ui/progress.js";
import { renderPlan } from "./ui/plansheet.js";
import { renderSettings } from "./ui/settings.js";
import { renderSetup } from "./ui/setup.js";
import { renderIntake } from "./ui/intake.js";
import { renderTargets } from "./ui/targets.js";
import { tabBar, errorState } from "./ui/parts.js";
import { model, setRedraw } from "./ui/app.js";

const tabRoutes = { today: renderToday, progress: renderProgress, plan: renderPlan, settings: renderSettings };
const flowRoutes = { setup: renderSetup, intake: renderIntake, targets: renderTargets };
const DEFAULT_ROUTE = "today";

function routeName(hash) {
  const name = hash.replace(/^#\/?/, "").split("/")[0];
  return Object.hasOwn(tabRoutes, name) || Object.hasOwn(flowRoutes, name) ? name : DEFAULT_ROUTE;
}

// Where the app really goes: no profile -> first start; profile without confirmed targets -> targets.
function guard(name) {
  const doc = model.doc();
  if (!doc.profile) return Object.hasOwn(flowRoutes, name) && name !== "targets" ? name : "setup";
  if (!doc.profile.targets) return "targets";
  if (name === "setup" || name === "intake") return DEFAULT_ROUTE;
  return name;
}

function render() {
  const root = document.getElementById("app");
  try {
    const wanted = routeName(location.hash);
    const name = guard(wanted);
    if (name !== wanted) history.replaceState(null, "", `#/${name}`);
    if (Object.hasOwn(flowRoutes, name)) mount(root, flowRoutes[name]());
    else mount(root, tabRoutes[name](), tabBar(name));
    window.scrollTo(0, 0);
  } catch (e) {
    mount(root, errorState(e && e.message ? e.message : "The app could not start."));
  }
}

setRedraw(render);
window.addEventListener("hashchange", render);
render();
