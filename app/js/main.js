// Start-up and router. Hash routes: #/today, #/progress, #/plan, #/settings.
import { mount } from "./h.js";
import { renderToday } from "./ui/today.js";
import { renderProgress } from "./ui/progress.js";
import { renderPlan } from "./ui/plansheet.js";
import { renderSettings } from "./ui/settings.js";
import { tabBar } from "./ui/parts.js";

const routes = {
  today: renderToday,
  progress: renderProgress,
  plan: renderPlan,
  settings: renderSettings,
};
const DEFAULT_ROUTE = "today";

function routeName(hash) {
  const name = hash.replace(/^#\/?/, "").split("/")[0];
  return Object.hasOwn(routes, name) ? name : DEFAULT_ROUTE;
}

function render() {
  const name = routeName(location.hash);
  mount(document.getElementById("app"), routes[name](), tabBar(name));
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", render);
render();
