// PROTOTYPE 8.28 (builder A). Body maps drawn with our own SVG code (ui/svg.js) from the MIT point lists in
// bodyshapes.js (react-body-highlighter). Never colour alone: every map comes with a line of words (DESIGN.md).
// Levels: 0 = not worked, 1 = light, 2 = medium, 3 = strong. Colours are CSS classes on DESIGN.md tokens (proto.css).
import { h } from "../h.js";
import { s } from "../ui/svg.js";
import { FRONT, BACK } from "./bodyshapes.js";
import { REGIONS, musclesOf } from "./muscles.js";

const NEUTRAL = new Set(["head", "knees"]);

function side(shapes, levels, label) {
  return s("svg", { class: "bm-side", viewBox: "-10 -10 1020 2230", role: "img", "aria-label": label },
    shapes.map((r) => r.polys.map((pts) => s("polygon", { points: pts, class: NEUTRAL.has(r.muscle) ? "bm-neutral" : `bm-${levels[r.muscle] ?? 0}` }))));
}

// groupLevels: { group: level } -> one figure with front and back.
export function bodyMap(groupLevels, { title, words, cls = "" } = {}) {
  const levels = {};
  for (const [g, lv] of Object.entries(groupLevels)) for (const r of REGIONS[g] ?? []) levels[r] = Math.max(levels[r] ?? 0, lv);
  return h("figure", { class: `bm ${cls}` },
    title ? h("figcaption", { class: "bm-title" }, title) : null,
    h("div", { class: "bm-pair", "aria-hidden": "true" }, side(FRONT, levels, "Front"), side(BACK, levels, "Back")),
    h("div", { class: "bm-labels", "aria-hidden": "true" }, h("span", {}, "Front"), h("span", {}, "Back")),
    words ? h("div", { class: "bm-words small" }, words) : null);
}

// Small one-view map for an exercise card or a swap row (idea taken from builder B's review, drawn our way): the view
// (front or back) where the main muscle is. Decorative: the card says the muscles in words next to it.
export function miniMap(exId) {
  const lv = exerciseLevels(exId);
  const levels = {};
  for (const [g, l] of Object.entries(lv)) for (const r of REGIONS[g] ?? []) levels[r] = Math.max(levels[r] ?? 0, l);
  const strong = new Set(Object.entries(levels).filter(([, l]) => l === 3).map(([r]) => r));
  const onFront = FRONT.some((r) => strong.has(r.muscle));
  return h("span", { class: "bm-mini", "aria-hidden": "true" }, side(onFront ? FRONT : BACK, levels, onFront ? "Front" : "Back"));
}

// This exercise: main muscles strong (3), helpers light (1).
export function exerciseLevels(exId) {
  const { main, helpers } = musclesOf(exId);
  const out = {};
  helpers.forEach((g) => { out[g] = 1; });
  main.forEach((g) => { out[g] = 3; });
  return out;
}

// Sets per group from a list of { ex, sets }: main = 1 per set, helper = 0.5 per set (research 5.1).
export function setsByGroup(items) {
  const direct = {}; const weighted = {};
  for (const it of items) {
    const { main, helpers } = musclesOf(it.ex);
    for (const g of main) { direct[g] = (direct[g] ?? 0) + it.sets; weighted[g] = (weighted[g] ?? 0) + it.sets; }
    for (const g of helpers) weighted[g] = (weighted[g] ?? 0) + 0.5 * it.sets;
  }
  return { direct, weighted };
}

// 3 steps by weighted sets (research 4.3: "3 steps at most").
export function levelFor(sets, { low = 3, high = 6 } = {}) {
  if (!sets) return 0;
  if (sets < low) return 1;
  if (sets < high) return 2;
  return 3;
}

export function legend(items) {
  return h("div", { class: "bm-legend small", "aria-hidden": "true" },
    items.map(([lv, text]) => h("span", {}, h("i", { class: `bm-key bm-k${lv}` }), text)));
}
