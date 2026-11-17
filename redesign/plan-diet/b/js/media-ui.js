// Exercise pictures, copied from app/js/ui/media.js with one change: the photos are linked from the app's own folder
// (../../../app/media/...) instead of being copied into this prototype. Same motion rules (Reduce Motion: still photo).
import { h } from "./app/h.js";
import { photosFor, media } from "./app/plan-media.js";
import { exercises } from "./app/plan-v2.js";
import { reduced } from "./app/motion.js";

export const APP = "../../../app/";
export function nameOf(id) { return exercises[id]?.name ?? (id === "uphill_walk" ? "Uphill walk" : id === "pec_deck" ? "Pec deck" : id); }
const PORTRAIT = new Set(["calf_raise_standing"]);
export function photos(id) { const p = photosFor(id); return p ? p.map((x) => APP + x) : null; }

function frames(id, alt, lazy = true) {
  const p = photos(id);
  if (!p) return [];
  return p.map((src, i) => h("img", { class: `f${i}`, src, alt: i === 0 ? alt : "", loading: lazy ? "lazy" : "eager", decoding: "async", draggable: "false", width: 850, height: 567 }));
}

export function flip(id, { cls = "", tag = false, interactive = true, cover = false } = {}) {
  const name = nameOf(id);
  const still = reduced();
  const alt = `${name}: start and end position.`;
  const portrait = PORTRAIT.has(id) && photos(id);
  const el = h("div", {
    class: `flip ${cover ? "cover" : "contain"} ${portrait ? "portrait" : ""} ${cls}`,
    role: interactive ? "button" : "img", tabindex: interactive ? "0" : null,
    "aria-label": interactive ? `${alt} ${still ? "Tap to see the end position." : "Tap to pause."}` : alt,
  },
  portrait ? h("img", { class: "band", src: photos(id)[0], alt: "", "aria-hidden": "true", decoding: "async" }) : null,
  frames(id, alt, cover));
  if (interactive) {
    const toggle = () => { if (reduced()) el.classList.toggle("show-end"); else el.classList.toggle("paused-by-tap"); };
    el.addEventListener("click", toggle);
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
  }
  if (tag) el.append(h("span", { class: "flip-tag", "aria-hidden": "true" }, still ? "Start · tap for end" : "Start · End"));
  return el;
}
export function thumb(id, { small = false, moving = false, cls = "" } = {}) {
  return flip(id, { cls: `thumb ${small ? "sm" : ""} ${moving ? "" : "paused"} ${cls}`, interactive: false, cover: true });
}
export function photoPair(id) {
  const [a, b] = frames(id, nameOf(id));
  if (!a) return null;
  const box = (el, label) => { el.classList.remove("f1"); el.classList.add("f0"); return h("figure", {}, h("div", { class: "flip paused contain" }, el), h("figcaption", {}, label)); };
  return h("div", { class: "photo-pair" }, box(a, "Start"), box(b, "End"));
}
export function photoNote(id) {
  const m = media[id];
  if (!m || m.match !== "close" || !m.matchNote) return null;
  return h("p", { class: "photo-note small muted" }, m.matchNote);
}
