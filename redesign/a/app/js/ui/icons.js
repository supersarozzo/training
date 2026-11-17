// Small line icons drawn for this app (original, 24 x 24, stroke = currentColor). No icon font, no third-party art.
import { s } from "./svg.js";

const PATHS = {
  today: ["M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"],
  progress: ["M4 19h16", "M5 15l4-5 4 3 6-8", "M19 5v4", "M19 5h-4"],
  plan: ["M7 4h10a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "M9 9h6", "M9 13h6", "M9 17h3"],
  settings: ["M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z", "M19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7.6 7.6 0 0 1-2.1 1.2L14.7 21h-4l-.3-2.4a7.6 7.6 0 0 1-2.1-1.2l-1.9.7-2-3.4 1.6-1.2a7.4 7.4 0 0 1 0-2.4L4.4 9.9l2-3.4 1.9.7a7.6 7.6 0 0 1 2.1-1.2L10.7 3h4l.3 2.4a7.6 7.6 0 0 1 2.1 1.2l1.9-.7 2 3.4-1.6 1.2a7.4 7.4 0 0 1 0 2.4z"],
  play: ["M8 5.5v13l11-6.5z"],
  info: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 11v5", "M12 8h.01"],
  swap: ["M7 7h11l-3-3", "M17 17H6l3 3"],
  pin: ["M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z", "M12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z"],
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  chevron: ["M9 5l7 7-7 7"],
  back: ["M15 5l-7 7 7 7"],
  external: ["M14 4h6v6", "M20 4l-9 9", "M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"],
  machine: ["M5 20V4", "M5 6h9", "M14 4v16", "M9 10h5", "M9 14h5", "M17 20h4", "M19 20V9"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 7v5l3 2"],
  bolt: ["M13 3 5 14h6l-1 7 8-11h-6z"],
  scale: ["M5 20h14l-1.5-12h-11z", "M9 8a3 3 0 0 1 6 0", "M12 12l2-2"],
  sync: ["M20 12a8 8 0 0 1-14 5.3", "M4 12a8 8 0 0 1 14-5.3", "M18 3v4h-4", "M6 21v-4h4"],
  // gym areas
  cardio: ["M3 18h13l3-6", "M6 18l2-8h8", "M17 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z", "M19 18h2"],
  machines: ["M5 20V4", "M5 6h9", "M14 4v16", "M9 10h5", "M9 14h5", "M17 20h4", "M19 20V9"],
  cables: ["M5 3v18", "M19 3v18", "M5 5h14", "M12 5v7", "M10 12h4l-1 4h-2z"],
  free_weights: ["M3 9v6", "M6 7v10", "M18 7v10", "M21 9v6", "M6 12h12"],
  functional: ["M4 18h16", "M6 18c0-3 2-5 6-5s6 2 6 5", "M12 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"],
};

export function icon(name, size = 22, { strokeWidth = 2, fill = false } = {}) {
  const paths = PATHS[name] ?? PATHS.info;
  return s("svg", { viewBox: "0 0 24 24", width: size, height: size, fill: fill ? "currentColor" : "none", stroke: "currentColor", "stroke-width": strokeWidth, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", focusable: "false" },
    paths.map((d) => s("path", { d })));
}
