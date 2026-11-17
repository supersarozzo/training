// Draws the body maps with our own SVG code (app/js/ui/svg.js), from the body-muscles shapes (Apache-2.0,
// js/data/bodyshapes.js). Each muscle part gets a level 0-3 from its group: 0 = not worked, 1 = a little (helper),
// 2 = more, 3 = main. Colour is never alone: every map has a words line next to it (DESIGN.md rule).
import { s } from "./app/svg.js";
import { h } from "./app/h.js";
import { FRONT, BACK } from "./data/bodyshapes.js";
import { groupOfPart, GROUPS, names, joinWords } from "./data/muscles.js";

const BOXES = { front: "0 0 35 93", back: "37 0 35 93", both: "0 0 72 93" };

// levels: { group: 0..3 }. view: "front" | "back" | "both". `fresh`: groups that just came in (they get a short glow-in).
export function bodyMap(levels, { view = "both", cls = "", label = "Body map", fresh = [] } = {}) {
  const parts = view === "front" ? FRONT : view === "back" ? BACK : [...FRONT, ...BACK];
  const svg = s("svg", { viewBox: BOXES[view], class: `bmap ${view} ${cls}`, role: "img", "aria-label": label, preserveAspectRatio: "xMidYMid meet" },
    parts.map(([id, d]) => {
      const g = groupOfPart(id);
      const lv = g ? (levels[g] ?? 0) : null;
      return s("path", { d, class: g ? `m l${lv}${fresh.includes(g) && lv ? " fresh" : ""}` : "body" });
    }));
  return svg;
}

// Which single view shows an exercise best (for the small map on a card).
export function bestView(levels) {
  // The view of the strongest muscles wins; helpers only break a tie.
  let front = 0, back = 0;
  for (const [g, lv] of Object.entries(levels)) {
    if (!lv) continue;
    const w = lv === 3 ? 10 : lv === 2 ? 3 : 1;
    if (GROUPS[g]?.view === "back") back += w; else front += w;
  }
  return back > front ? "back" : "front";
}

// "Main: chest · Helpers: front shoulders, triceps"
export function exerciseWords(m) {
  const main = joinWords(names(m.p));
  const help = m.s.length ? joinWords(names(m.s)) : "none";
  return { main, help, line: `Main: ${main} · Helpers: ${help}` };
}

// The three steps as a legend, with words.
export function legend(words = ["A little", "More", "Most"]) {
  const sw = (lv, text) => h("span", { class: "lg" }, s("svg", { viewBox: "0 0 10 10", class: "lg-sw", "aria-hidden": "true" }, s("rect", { x: 0, y: 0, width: 10, height: 10, rx: 3, class: `m l${lv}` })), text);
  // An empty word drops that step (an exercise on its own has only helpers and main muscles, no "more").
  return h("div", { class: "bmap-legend" }, words[0] ? sw(1, words[0]) : null, words[1] ? sw(2, words[1]) : null, words[2] ? sw(3, words[2]) : null);
}

// Groups with a level, strongest first, as words.
export function levelWords(levels, load = null) {
  const list = Object.entries(levels).filter(([, lv]) => lv > 0).sort((a, b) => (b[1] - a[1]) || ((load?.[b[0]] ?? 0) - (load?.[a[0]] ?? 0)));
  return list.map(([g]) => (load ? `${GROUPS[g].name} ${fmtSets(load[g])}` : GROUPS[g].name));
}
export function fmtSets(n) { return Number.isInteger(n) ? String(n) : n.toFixed(1); }
