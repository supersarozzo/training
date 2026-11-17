// Original line drawings (made for this app, no copied art) for what the photo library does not have:
// the dumbbell rack, the bench, the mat area, and the hip hinge warm-up move. Drawn with currentColor.
import { s } from "./svg.js";

const line = (d, w = 3) => s("path", { d, fill: "none", stroke: "currentColor", "stroke-width": w, "stroke-linecap": "round", "stroke-linejoin": "round" });
const disc = (cx, cy, r) => s("circle", { cx, cy, r, fill: "currentColor" });

const DRAW = {
  dumbbells: () => [
    line("M20 82h120", 3), line("M28 82v14M132 82v14", 3), line("M20 56h120", 3), line("M28 56v26M132 56v26", 3),
    ...[38, 70, 102].map((x, i) => [line(`M${x} ${50 - i}h${18 + i * 2}`, 4), line(`M${x} ${44 - i * 2}v${12 + i * 4}M${x + 18 + i * 2} ${44 - i * 2}v${12 + i * 4}`, 7)]),
    ...[38, 70, 102].map((x, i) => [line(`M${x} ${76 - i}h${18 + i * 2}`, 4), line(`M${x} ${70 - i * 2}v${12 + i * 4}M${x + 18 + i * 2} ${70 - i * 2}v${12 + i * 4}`, 7)]),
  ],
  bench: () => [
    line("M30 78h70", 8), line("M100 78l26-30", 8), line("M44 82v16M88 82v16", 4), line("M36 98h60", 4), line("M120 56l6 42", 4), line("M112 98h22", 4),
  ],
  mat: () => [
    line("M22 84l30-22h88l-30 22z", 3), line("M28 80l26-19M40 84l30-22M58 84l30-22M76 84l30-22M94 84l30-22", 1.5),
    disc(118, 44, 9), line("M118 53v10", 3), line("M106 70c4-4 8-6 12-7 4 1 8 3 12 7", 3),
  ],
  hip_hinge: () => [
    // standing figure, hands on hips, hips pushed back with a flat back
    disc(100, 30, 9), line("M96 39L62 54", 5), line("M62 54l-2 18 4 26", 5), line("M60 72l14 6 2 20", 5),
    line("M84 44l-8 10 -14 0", 4), line("M48 98h22M68 98h14", 3),
    line("M112 24c10 10 10 24 0 34", 2), line("M108 58l4 0 0-4", 2),
  ],
  figure: () => [disc(80, 30, 10), line("M80 40v32M80 50l-18 12M80 50l18 12M80 72l-12 26M80 72l12 26", 5)],
};

// A drawing in a 160 x 112 box (same shape as the photos, 3:2 with room).
export function art(name) {
  const draw = DRAW[name] ?? DRAW.figure;
  return s("svg", { class: "art", viewBox: "0 0 160 112", "aria-hidden": "true", preserveAspectRatio: "xMidYMid meet" }, draw());
}
