// Body maps (build step 2, docs/DESIGN.md 15.4; answer 71 b): the body-muscles drawing by Ivan Vulović, Apache-2.0
// (app/vendor/body-muscles/, see CHANGES.md there), drawn by our own code as inline SVG. Each muscle part gets a step
// from its muscle group: 0 = not worked, 1 = A little, 2 = More, 3 = Most. Colours are CSS classes on the map tokens
// (app.css). Never colour alone: every map on screen has a line of words next to it, and the small card map is
// decorative (the card says the muscles in words). No innerHTML; sizes come from CSS.
import { h } from "../h.js";
import { s } from "./svg.js";
import { FRONT, BACK, VIEWBOX } from "../../vendor/body-muscles/shapes.js";
import { partMuscle } from "../plan/muscles.js";
import { exerciseLevels, mainView } from "../engine/planpage.js";

// levels: { group: 0..3 }. view: "front" | "back" | "both". label: words for screen readers (null = decorative).
export function bodyMap(levels, { view = "both", label = null, cls = "" } = {}) {
  const parts = view === "front" ? FRONT : view === "back" ? BACK : [...FRONT, ...BACK];
  return s("svg", {
    class: `bmap ${view} ${cls}`.trim(), viewBox: VIEWBOX[view], preserveAspectRatio: "xMidYMid meet",
    role: label ? "img" : null, "aria-label": label, "aria-hidden": label ? null : "true", focusable: "false",
  }, parts.map(([id, d]) => {
    const g = partMuscle(id);
    return s("path", { d, class: g ? `l${levelOf(levels, g)}` : "body" });
  }));
}

// In the drawing the big front shoulder cap is the "side" part and the front part is a thin strip, so a press (front
// shoulders) looked weaker than a lateral raise. Both shoulder parts show the higher of the two (0.6.0, muscle-map check
// docs/research/2026-11-18-muscle-map-check.md). The counts and the words are not changed.
const SHOULDER_CAP = new Set(["front_delts", "side_delts"]);
export function levelOf(levels, group) {
  if (SHOULDER_CAP.has(group)) return Math.max(levels.front_delts ?? 0, levels.side_delts ?? 0);
  return levels[group] ?? 0;
}

// The legend: one scale in 3 steps, with words (mock-up).
export function mapLegend() {
  const key = (lv, text) => h("span", {}, h("i", { class: `k${lv}`, "aria-hidden": "true" }), text);
  return h("div", { class: "map-legend" }, key(1, "A little"), key(2, "More"), key(3, "Most"), h("span", {}, "Helpers count half"));
}

// The small map on a card or a list row (about 26 px wide): the side where the exercise's main muscles are.
export function miniMap(exId) {
  const lv = exerciseLevels(exId);
  return h("span", { class: "bmap-mini", "aria-hidden": "true" }, bodyMap(lv, { view: mainView(lv) }));
}
