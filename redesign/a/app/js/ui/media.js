// Exercise pictures on screen (redesign A): the start/end photos as a short looping flip-book, and small thumbnails.
// Photos are files in the app (they work offline). Reduced motion: no loop, the start photo stays (the info sheet shows both).
import { h } from "../h.js";
import { photosFor, media } from "../plan/media.js";
import { hasDrawing, drawingFrames } from "./drawings.js";
import { exercises, warmupMoves, upperDayWarmupExtra } from "../plan/plan-v2.js";

const extraNames = Object.fromEntries([...warmupMoves, upperDayWarmupExtra].map((m) => [m.id, m.name]));
export function nameOf(id) { return exercises[id]?.name ?? extraNames[id] ?? (id === "uphill_walk" ? "Uphill walk" : id); }

function frames(id, alt) {
  const photos = photosFor(id);
  if (photos) {
    return photos.map((src, i) => h("img", { class: `f${i}`, src, alt: i === 0 ? alt : "", loading: "lazy", decoding: "async", draggable: "false" }));
  }
  const svg = media[id]?.svg;
  if (svg && hasDrawing(svg)) {
    const [a, b] = drawingFrames(svg);
    a.classList.add("f0"); b.classList.add("f1");
    return [a, b];
  }
  return [];
}

// The flip-book: two frames stacked; CSS shows the end frame every other beat. `smooth`: cross-fade in place of a cut.
export function flip(id, { cls = "", smooth = false, tag = false } = {}) {
  const alt = `${nameOf(id)}: start and end position`;
  const el = h("div", { class: `flip ${smooth ? "smooth" : ""} ${cls}`, role: "img", "aria-label": alt }, frames(id, alt));
  if (tag) el.append(h("span", { class: "flip-tag", "aria-hidden": "true" }, media[id]?.lib ? "Start · End" : "Drawing"));
  return el;
}

export function thumb(id, { small = false, still = false } = {}) {
  return flip(id, { cls: `thumb ${small ? "sm" : ""} ${still ? "paused" : ""}`, smooth: true });
}

// Start and end side by side, labelled (the info sheet; also what reduced-motion users rely on).
export function photoPair(id) {
  const [a, b] = frames(id, nameOf(id));
  if (!a) return null;
  const box = (el, label) => {
    el.classList.remove("f1"); el.classList.add("f0");
    return h("figure", {}, h("div", { class: "flip paused" }, el), h("figcaption", {}, label));
  };
  return h("div", { class: "photo-pair" }, box(a, "Start"), box(b, "End"));
}
