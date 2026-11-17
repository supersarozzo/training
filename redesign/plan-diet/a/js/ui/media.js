// Exercise pictures on screen: the start/end photos as a short looping crossfade, small thumbnails, the start/end
// pair side by side, and the one-line "close match" note. Photos are files in the app (they work offline).
// Motion (builder D's system with B's tap to pause): with animations on, the big photo crossfades every 2.6 s and a tap
// pauses it; with animations off (Settings or the phone's Reduce Motion) it shows the start, and a tap shows the end.
// Small thumbnails are passive pictures: no loop words for screen readers, no tap.
import { h } from "../h.js";
import { photosFor, media } from "../plan/media.js";
import { hasDrawing, drawingFrames } from "./drawings.js";
import { exercises, warmupMoves, upperDayWarmupExtra } from "../plan/plan-v2.js";
import { reduced } from "./motion.js";

const extraNames = Object.fromEntries([...warmupMoves, upperDayWarmupExtra].map((m) => [m.id, m.name]));
export function nameOf(id) { return exercises[id]?.name ?? extraNames[id] ?? (id === "uphill_walk" ? "Uphill walk" : id === "pec_deck" ? "Pec deck" : id); }

// Photos taller than wide: shown whole (contain) over a blurred copy of themselves (builder D's side bands).
const PORTRAIT = new Set(["calf_raise_standing"]);

function frames(id, alt, lazy = true) {
  const photos = photosFor(id);
  if (photos) {
    return photos.map((src, i) => h("img", { class: `f${i}`, src, alt: i === 0 ? alt : "", loading: lazy ? "lazy" : "eager", decoding: "async", draggable: "false", width: 850, height: 567 }));
  }
  const svg = media[id]?.svg;
  if (svg && hasDrawing(svg)) {
    const [a, b] = drawingFrames(svg);
    a.classList.add("f0"); b.classList.add("f1");
    return [a, b];
  }
  return [];
}

// The big moving picture. `interactive` (default): a tap pauses the loop, or shows the end when motion is off.
// `cover`: fill the box (thumbnails, strips); otherwise the whole move is shown (contain).
export function flip(id, { cls = "", tag = false, interactive = true, cover = false } = {}) {
  const name = nameOf(id);
  const still = reduced();
  const tapWords = still ? "Tap to see the end position." : "Tap to pause.";
  const alt = `${name}: start and end position.`;
  const portrait = PORTRAIT.has(id) && photosFor(id);
  const el = h("div", {
    class: `flip ${cover ? "cover" : "contain"} ${portrait ? "portrait" : ""} ${cls}`,
    role: interactive ? "button" : "img", tabindex: interactive ? "0" : null,
    "aria-label": interactive ? `${alt} ${tapWords}` : alt,
  },
  portrait ? h("img", { class: "band", src: photosFor(id)[0], alt: "", "aria-hidden": "true", decoding: "async" }) : null,
  frames(id, alt, cover));
  if (interactive) {
    const toggle = () => {
      if (reduced()) el.classList.toggle("show-end");
      else el.classList.toggle("paused-by-tap");
    };
    el.addEventListener("click", toggle);
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
  }
  if (tag) el.append(h("span", { class: "flip-tag", "aria-hidden": "true" }, media[id]?.lib ? (still ? "Start · tap for end" : "Start · End") : "Drawing"));
  return el;
}

// A small passive picture for lists (still unless `moving`).
export function thumb(id, { small = false, moving = false } = {}) {
  return flip(id, { cls: `thumb ${small ? "sm" : ""} ${moving ? "" : "paused"}`, interactive: false, cover: true });
}

// Start and end side by side, labelled (exercise sheet; also what the start/end loop shows when motion is off).
export function photoPair(id) {
  const [a, b] = frames(id, nameOf(id));
  if (!a) return null;
  const box = (el, label) => {
    el.classList.remove("f1"); el.classList.add("f0");
    return h("figure", {}, h("div", { class: "flip paused contain" }, el), h("figcaption", {}, label));
  };
  return h("div", { class: "photo-pair" }, box(a, "Start"), box(b, "End"));
}

// The one-line note under a photo that is a close match, not the exact move (builder C's match / matchNote).
export function photoNote(id) {
  const m = media[id];
  if (!m || m.match !== "close" || !m.matchNote) return null;
  return h("p", { class: "photo-note small muted" }, m.matchNote);
}
