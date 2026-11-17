// Exercise demo: the start and end photos as a short loop (crossfade), or an original drawing when the library has
// no match. With "Reduce Motion" on, the loop stops and a tap flips between the two positions.
import { h } from "../h.js";
import { s } from "./svg.js";
import { photosFor } from "../plan/media.js";
import { exercises, warmupMoves, upperDayWarmupExtra } from "../plan/plan-v2.js";
import { reduced } from "./motion.js";
import { icon } from "./icons.js";

const moveNames = Object.fromEntries([...warmupMoves, upperDayWarmupExtra].map((m) => [m.id, m.name]));
export const nameOf = (id) => exercises[id]?.name ?? moveNames[id] ?? (id === "uphill_walk" ? "Uphill walk" : id === "pec_deck" ? "Pec deck" : "Exercise");

// Original drawing of a hip hinge (hands on hips): standing, then hinged at the hips with soft knees.
function hingeFrames() {
  const fig = { fill: "none", "stroke-width": 9, "stroke-linecap": "round", "stroke-linejoin": "round", class: "drawn-figure" };
  const floor = s("path", { d: "M80 176H220", stroke: "#c9d3d1", "stroke-width": 3, "stroke-linecap": "round" });
  const up = s("svg", { viewBox: "0 0 300 200", "aria-hidden": "true" }, floor.cloneNode(),
    s("circle", { cx: 150, cy: 40, r: 15, fill: "#1d3b38" }),
    s("path", { ...fig, d: "M150 60V112M150 112L141 172M150 112L159 172M150 66L128 90L146 108M150 66L172 90L154 108" }));
  const down = s("svg", { viewBox: "0 0 300 200", class: "b", "aria-hidden": "true" }, floor.cloneNode(),
    s("circle", { cx: 106, cy: 60, r: 15, fill: "#1d3b38" }),
    s("path", { ...fig, d: "M124 74L166 108M166 108L153 140L143 172M166 108L170 140L161 172M126 76L140 98L162 104" }),
    s("path", { d: "M196 70q22 26 4 52", fill: "none", stroke: "#0f766e", "stroke-width": 4, "stroke-linecap": "round", "stroke-dasharray": "2 8" }));
  return [up, down];
}

export function demo(id, { label = true, cls = "" } = {}) {
  const name = nameOf(id);
  const pics = photosFor(id);
  let el;
  if (pics) {
    el = h("div", { class: `demo ${cls}`, role: "img", "aria-label": `${name}: start and end position` },
      h("img", { src: pics[0], alt: "", class: "fill", decoding: "async" }),
      h("img", { src: pics[0], alt: "", decoding: "async" }),
      h("img", { src: pics[1], alt: "", class: "b", decoding: "async" }));
  } else if (id === "hip_hinge") {
    el = h("div", { class: `demo ${cls}`, role: "img", "aria-label": `${name}: drawing of the start and end position` }, ...hingeFrames());
  } else {
    el = h("div", { class: `demo ${cls} demo-empty`, role: "img", "aria-label": name }, icon("weights", "demo-icon"));
  }
  if (reduced()) {
    el.classList.add("paused");
    el.addEventListener("click", () => el.classList.toggle("show-b"));
    if (label && (pics || id === "hip_hinge")) el.append(h("span", { class: "demo-label" }, "Tap to see the end position"));
  }
  return el;
}

export function thumb(id, cls = "") {
  const pics = photosFor(id);
  if (pics) return h("div", { class: `thumb ${cls}` }, h("img", { src: pics[0], alt: "", decoding: "async", loading: "lazy" }));
  if (id === "hip_hinge") return h("div", { class: `thumb ${cls}` }, hingeFrames()[1]);
  return h("div", { class: `thumb ${cls}` }, icon("weights"));
}
