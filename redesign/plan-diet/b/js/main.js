// Router of builder B's prototype. Hash routes: #/today #/diet #/plan #/plan/check #/gym #/progress #/settings.
// The scanner is a layer over #/diet, never a route of its own (camera rule, research 7).
import { mount, h } from "./app/h.js";
import { tabBar, setRedraw, closeSheets } from "./ui.js";
import { renderPlan, renderCheck, resetPlanState } from "./plan.js";
import { renderDiet } from "./diet.js";
import { renderGym } from "./machines-b.js";
import { renderToday, renderProgress, renderSettings } from "./misc.js";
import { openExerciseLayer } from "./exlayer.js";
import { closeScanner } from "./scanner.js";
import { loadDoc } from "./store.js";

const ROUTES = {
  today: () => renderToday(), diet: () => renderDiet(), plan: () => renderPlan(), "plan/check": () => renderCheck(),
  gym: () => renderGym((id) => openExerciseLayer(id)), progress: () => renderProgress(), settings: () => renderSettings(),
};
const TAB_OF = { today: "today", diet: "diet", plan: "plan", "plan/check": "plan", gym: "gym", progress: "progress", settings: null };

let last = "";
function render() {
  const root = document.getElementById("app");
  let name = location.hash.replace(/^#\/?/, "");
  if (!Object.hasOwn(ROUTES, name)) name = "plan";
  const routeChanged = name !== last;
  if (routeChanged) { closeSheets(); closeScanner(); if (last === "plan") resetPlanState(); }
  try {
    loadDoc();
    mount(root, ROUTES[name](), tabBar(TAB_OF[name]));
    if (routeChanged) { root.querySelector(".screen")?.classList.add("enter"); window.scrollTo(0, 0); }
  } catch (e) {
    mount(root, h("main", { class: "screen" }, h("h1", {}, "Something is wrong"), h("p", {}, String(e && e.message ? e.message : e))));
    console.error(e);
  }
  last = name;
}
setRedraw(render);
window.addEventListener("hashchange", render);
render();
