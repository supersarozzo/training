// One icon set for the whole app, drawn for this app (original simple strokes on a 24 x 24 grid, stroke = currentColor).
// From builder C's set (redesign/JUDGING.md: "C's set, always with a word"), called the way builder A's screens call
// it, plus area drawings for the machine cards (dumbbell rack, bench, mat) in the same stroke. No icon font, no
// third-party art. Every icon is shown next to a word; alone it is hidden from screen readers.
import { s } from "./svg.js";

const PATHS = {
  // tabs
  today: ["M4 6.5h16v13H4z", "M4 10h16", "M8 4v4", "M16 4v4"],
  progress: ["M4 19h16", "M6 15l4-5 3 3 5-7"],
  plan: ["M8 6h12", "M8 12h12", "M8 18h12", "M4 6h.01", "M4 12h.01", "M4 18h.01"],
  gym: ["M3 10v4", "M6 7v10", "M18 7v10", "M21 10v4", "M6 12h12"],
  settings: ["M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z", "M12 2.8v2.4", "M12 18.8v2.4", "M2.8 12h2.4", "M18.8 12h2.4", "M5.5 5.5l1.7 1.7", "M16.8 16.8l1.7 1.7", "M5.5 18.5l1.7-1.7", "M16.8 7.2l1.7-1.7"],
  // actions and lines
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  info: ["M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z", "M12 11v5", "M12 7.5h.01"],
  play: ["M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z", "M10 8.5l5.5 3.5L10 15.5z"],
  pin: ["M12 21s-6.5-6.2-6.5-11A6.5 6.5 0 0 1 18.5 10c0 4.8-6.5 11-6.5 11z", "M12 7.8a2.2 2.2 0 1 0 0 4.4a2.2 2.2 0 1 0 0-4.4z"],
  swap: ["M7 4L4 7l3 3", "M4 7h13", "M17 20l3-3-3-3", "M20 17H7"],
  undo: ["M9 7L5 11l4 4", "M5 11h9a5 5 0 0 1 0 10h-2"],
  star: ["M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"],
  clock: ["M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z", "M12 7.5V12l3 2"],
  close: ["M6 6l12 12", "M18 6L6 18"],
  chevron: ["M9 6l6 6-6 6"],
  back: ["M15 6l-6 6 6 6"],
  external: ["M14 4h6v6", "M20 4l-9 9", "M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"],
  machine: ["M5 3v18", "M5 6h9", "M14 4v4", "M5 18h14", "M17 8v10", "M14 12h6"],
  note: ["M5 4h10l4 4v12H5z", "M14 4v5h5", "M8 13h8", "M8 17h5"],
  scale: ["M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z", "M9 11a3 3 0 0 1 6 0", "M12 11l1.5-1.5"],
  sync: ["M4 12a8 8 0 0 1 13.7-5.6L20 9", "M20 4v5h-5", "M20 12a8 8 0 0 1-13.7 5.6L4 15", "M4 20v-5h5"],
  walk: ["M13 4.5a1.5 1.5 0 1 0 0 .01", "M10 21l2-6 3 3v3", "M12 15l-1-5 4 1 2 3", "M11 10l-3 2v3"],
  flame: ["M12 21c-4 0-6-2.7-6-6 0-4 4-6 4-10 2 1 6 4.5 6 9 0-1.2.6-2.3 1.4-3 .4 1.2.6 2.3.6 4 0 3.3-2 6-6 6z"],
  watch: ["M8 7h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z", "M9 7l1-4h4l1 4", "M9 17l1 4h4l1-4", "M12 10v2.5l1.5 1"],
  warn: ["M12 4l9 16H3z", "M12 10v4", "M12 17h.01"],
  plus: ["M12 5v14", "M5 12h14"],
  food: ["M7 3v8", "M5 3v5a2 2 0 0 0 4 0V3", "M7 11v10", "M16 3c-2 2-2.5 5-2.5 8h4V3z", "M17.5 11v10"],
  print: ["M7 9V4h10v5", "M6 18H4v-7h16v7h-2", "M7 14h10v6H7z"],
  bolt: ["M13 3 5 14h6l-1 7 8-11h-6z"],
  busy: ["M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z", "M8 12h8"],
  dislike: ["M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z", "M8.5 15.5c1.8-1.6 5.2-1.6 7 0", "M9 9.5h.01", "M15 9.5h.01"],
  hurt: ["M12 21s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7.5 2.8C19.5 16.4 12 21 12 21z", "M12 11v3", "M12 16.5h.01"],
  // gym areas (machine cards and the Gym tab)
  cardio: ["M3 18h13l3-6", "M6 18l2-8h8", "M17 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z", "M19 18h2"],
  machines: ["M5 3v18", "M5 6h9", "M14 4v4", "M5 18h14", "M17 8v10", "M14 12h6"],
  cables: ["M5 3v18", "M19 3v18", "M5 5h14", "M12 5v7", "M10 12h4l-1 4h-2z"],
  free_weights: ["M3 8h18", "M3 16h18", "M5 8v8", "M19 8v8", "M8 6v4", "M11 6v4", "M14 14v4", "M17 14v4"], // dumbbell rack
  bench: ["M3 13h12l5-6", "M5 13v6", "M13 13v6", "M3 19h4", "M11 19h4"],
  functional: ["M3 17h18", "M4 14h16v3H4z", "M12 11a2 2 0 1 0 0-4a2 2 0 0 0 0 4z"], // a mat
};

export function icon(name, size = 22, { strokeWidth = 2, fill = false } = {}) {
  const paths = PATHS[name] ?? PATHS.info;
  return s("svg", { class: "ic", viewBox: "0 0 24 24", width: size, height: size, fill: fill ? "currentColor" : "none", stroke: "currentColor", "stroke-width": strokeWidth, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", focusable: "false" },
    paths.map((d) => s("path", { d })));
}
