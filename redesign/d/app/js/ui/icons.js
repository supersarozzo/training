// Small line icons, drawn for this app (original SVG paths, no icon font, no download).
import { s } from "./svg.js";

const P = {
  today: ["M4 7h16v13H4z", "M4 11h16", "M8 4v4", "M16 4v4"],
  progress: ["M4 19h16", "M5 15l4-5 4 3 6-7"],
  plan: ["M9 6h11", "M9 12h11", "M9 18h11", "M4.5 6h.01", "M4.5 12h.01", "M4.5 18h.01"],
  gym: ["M6.5 7v10", "M17.5 7v10", "M3.5 9.5v5", "M20.5 9.5v5", "M6.5 12h11"],
  settings: ["M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", "M12 3v2.5", "M12 18.5V21", "M3 12h2.5", "M18.5 12H21", "M5.6 5.6l1.8 1.8", "M16.6 16.6l1.8 1.8", "M5.6 18.4l1.8-1.8", "M16.6 7.4l1.8-1.8"],
  tips: ["M9 18h6", "M10 21h4", "M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"],
  swap: ["M7 7h12l-3-3", "M17 17H5l3 3"],
  video: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M10 8.5v7l6-3.5z"],
  pin: ["M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z", "M12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"],
  walk: ["M3 19l6-6 4 3 8-8", "M15 8h6v6"],
  timer: ["M12 7v5l3 2", "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"],
  warmup: ["M12 21c3.9 0 6-2.6 6-6 0-3-2-5-3-7-1 2-2 3-3.5 3 0-3 1-5-1.5-8C8 6 6 9 6 14c0 4 2.1 7 6 7z"],
  weights: ["M6.5 7v10", "M17.5 7v10", "M3.5 9.5v5", "M20.5 9.5v5", "M6.5 12h11"],
  abs: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M12 11.5v1"],
  flag: ["M5 21V4", "M5 4h11l-2 4 2 4H5"],
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  star: ["M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"],
  coach: ["M4 5h16v11H9l-5 4z", "M8 10h8"],
  chevron: ["M9 6l6 6-6 6"],
  external: ["M14 4h6v6", "M20 4l-9 9", "M18 14v6H4V6h6"],
  download: ["M12 4v11", "M7 10l5 5 5-5", "M5 20h14"],
  sparkle: ["M12 3v6", "M12 15v6", "M3 12h6", "M15 12h6"],
  scale: ["M5 4h14v16H5z", "M9 9a3 3 0 0 1 6 0", "M12 9l1.5-2"],
  github: ["M8 20c-4 1.2-4-2-5.5-2.5", "M16 22v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6.2 0C7.6 3.8 6.6 4.1 6.6 4.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 5.2 10.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V22"],
  sound: ["M4 9v6h4l5 4V5L8 9z", "M17 9a4 4 0 0 1 0 6"],
  ruler: ["M4 17L17 4l3 3L7 20z", "M8 13l2 2", "M11 10l2 2", "M14 7l2 2"],
};

export function icon(name, cls = "ico") {
  const paths = P[name] ?? P.sparkle;
  return s("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round", class: cls, "aria-hidden": "true" },
    paths.map((d) => s("path", { d })));
}

// The app mark: a ring two-thirds closed with a check (session progress + done).
export function logo(cls = "logo") {
  return s("svg", { viewBox: "0 0 84 84", class: cls, "aria-hidden": "true" },
    s("rect", { x: 0, y: 0, width: 84, height: 84, rx: 22, fill: "var(--brand-primary)" }),
    s("circle", { cx: 42, cy: 42, r: 24, fill: "none", stroke: "var(--brand-on-primary)", "stroke-opacity": 0.3, "stroke-width": 7 }),
    s("path", { d: "M42 18a24 24 0 1 1-22.6 16", fill: "none", stroke: "var(--brand-on-primary)", "stroke-width": 7, "stroke-linecap": "round" }),
    s("path", { d: "M33 42l6.5 6.5L52 36", fill: "none", stroke: "var(--brand-on-primary)", "stroke-width": 6, "stroke-linecap": "round", "stroke-linejoin": "round" }));
}
