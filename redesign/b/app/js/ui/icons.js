// Small line icons (original drawings, SF Symbols-like weight). 24 x 24, drawn with currentColor.
import { s } from "./svg.js";

const P = {
  today: "M12 3.5l2.4 5 5.4.6-4 3.7 1.1 5.4L12 15.5l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z",
  progress: "M4 19.5h16M6 15l4-4.5 3.5 3L19 7",
  plan: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  settings: "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7 7 0 0 1-2 1.2L14.8 21h-4l-.3-2.4a7 7 0 0 1-2-1.2l-2 .7-2-3.4 1.6-1.2a7 7 0 0 1 0-2.6L4.6 9.6l2-3.4 1.9.7a7 7 0 0 1 2-1.2L10.8 3h4l.3 2.4a7 7 0 0 1 2 1.2l1.9-.7 2 3.4-1.6 1.2a7 7 0 0 1 0 2.4z",
  chevron: "M9 5l7 7-7 7",
  back: "M15 5l-7 7 7 7",
  check: "M5 12.5l4.5 4.5L19 7.5",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  close: "M6 6l12 12M18 6L6 18",
  play: "M8 5.5v13l10.5-6.5z",
  video: "M3.5 7.5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2zM15.5 10.5l5-3v9l-5-3",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.6v.01",
  swap: "M7 4L3.5 7.5 7 11M3.5 7.5h13M17 13l3.5 3.5L17 20M20.5 16.5h-13",
  pin: "M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  machine: "M2.5 9.5v5M5.5 7v10M18.5 7v10M21.5 9.5v5M5.5 12h13",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.5 2",
  watch: "M8 6.5h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM9 6.5L9.6 3h4.8l.6 3.5M9 17.5l.6 3.5h4.8l.6-3.5M12 9.5V12l1.5 1",
  scale: "M5 4h14a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 19 20H5a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 5 4zM8 9.5a4 4 0 0 1 8 0zM12 9.5l1.5-2",
  cloud: "M7 18.5h10a4 4 0 0 0 .6-8 5.5 5.5 0 0 0-10.7 1A3.5 3.5 0 0 0 7 18.5z",
  heart: "M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z",
  bolt: "M13 3L5 13.5h6L10.5 21 19 10.5h-6z",
  star: "M12 3.5l2.4 5 5.4.6-4 3.7 1.1 5.4L12 15.5l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z",
  walk: "M13 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM10 21l2-6.5 3 3V21M8 11l2.5-3.5L14 9l2 3 3 1M10.5 7.5L9 14",
  timer: "M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4M9.5 2.5h5M18.5 6.5l1.5-1.5",
  note: "M6 3.5h8.5L19 8v12.5H6zM14 3.5V8h5M9 12.5h7M9 16h5",
  flame: "M12 21c3.6 0 6-2.5 6-6 0-4-3-6-4-10-2 1.5-3 3.5-3 5.5-1-.5-1.8-1.5-2-2.5C7.5 9.5 6 11.8 6 15c0 3.5 2.4 6 6 6z",
  food: "M7 3v7a2 2 0 0 0 2 2v9M11 3v7a2 2 0 0 1-2 2M9 3v6M16.5 21V3c-2 1-3 4-3 7.5 0 1.5.8 2.5 3 2.5",
  download: "M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14",
  upload: "M12 15V4M7.5 8.5L12 4l4.5 4.5M5 19.5h14",
  sound: "M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  key: "M14.5 9.5a4 4 0 1 0-3.6 4L9 15.5v2.5H6.5v2.5H3.5v-3l6.4-6.4M15 7.5h.01",
  ruler: "M4 15.5L15.5 4 20 8.5 8.5 20zM8 11.5l2 2M11 8.5l2 2M14 5.5l2 2",
  list: "M4 6.5h16M4 12h16M4 17.5h10",
  calendar: "M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V7A1.5 1.5 0 0 1 5 5.5zM3.5 10h17M8 3.5v4M16 3.5v4",
  print: "M7 9V3.5h10V9M7 17.5H4.5v-7A1.5 1.5 0 0 1 6 9h12a1.5 1.5 0 0 1 1.5 1.5v7H17M7 14.5h10v6H7z",
  stop: "M7 7h10v10H7z",
  undo: "M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3",
  dumbbell: "M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
};

const FILLED = new Set(["play", "star", "today", "heart", "bolt", "flame"]);

export function icon(name, size = 20, { filled = FILLED.has(name), stroke = 2 } = {}) {
  return s("svg", { viewBox: "0 0 24 24", width: size, height: size, "aria-hidden": "true", fill: filled ? "currentColor" : "none", stroke: filled ? "none" : "currentColor", "stroke-width": stroke, "stroke-linecap": "round", "stroke-linejoin": "round" },
    s("path", { d: P[name] ?? P.info }));
}
