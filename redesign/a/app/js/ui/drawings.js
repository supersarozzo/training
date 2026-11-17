// Original drawings for moves that have no public-domain photo (today: the hip hinge drill).
// Two frames (start, end) like the photos, so the same flip-book shows them. Simple stick figures, drawn for this app.
import { s } from "./svg.js";

const FIGURE = {
  // Hip hinge, hands on hips: standing tall, then hips back with a flat back and soft knees.
  hip_hinge: [
    { head: [100, 38], neck: [100, 54], hip: [100, 112], knee: [100, 152], foot: [100, 190], elbow: [82, 92], hand: [92, 110] },
    { head: [148, 70], neck: [134, 78], hip: [84, 108], knee: [96, 150], foot: [92, 190], elbow: [118, 108], hand: [92, 110] },
  ],
};

function frame(p) {
  const line = (a, b, w = 9) => s("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: "currentColor", "stroke-width": w, "stroke-linecap": "round" });
  return s("svg", { viewBox: "0 0 200 210", role: "img", "aria-hidden": "true", class: "drawing" },
    s("line", { x1: 30, y1: 194, x2: 170, y2: 194, stroke: "currentColor", "stroke-width": 3, opacity: 0.25 }),
    line(p.neck, p.hip, 11), line(p.hip, p.knee), line(p.knee, p.foot), line(p.foot, [p.foot[0] + 18, p.foot[1]], 7),
    line(p.neck, p.elbow, 7), line(p.elbow, p.hand, 7),
    s("circle", { cx: p.head[0], cy: p.head[1], r: 15, fill: "currentColor" }));
}

export function hasDrawing(name) { return Object.hasOwn(FIGURE, name); }
export function drawingFrames(name) { return FIGURE[name].map(frame); }
