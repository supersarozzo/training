// Charts in plain SVG, drawn by our own code (no library). One accent line that draws itself in (off with animations
// off), single points as small muted dots, gold dots for new bests (builder C), at most 5 grid lines, axis labels in
// small muted text (docs/DESIGN.md section 7).
import { h } from "../h.js";
import { s } from "./svg.js";
import { niceScale, layoutPoints, linePath } from "../chartmath.js";
import { drawIn, stagger, onMount } from "./motion.js";

let chartCount = 0; // each chart gets its own gradient id

const MS_DAY = 86400000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function dayNumber(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / MS_DAY;
}
export function shortDate(day) {
  const t = new Date(day * MS_DAY);
  return `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]}`;
}

// series: [{ points: [{ date, y, pr? }], line: true | false }]. Points with pr:true get a gold dot. A series with line:true is drawn as a line (needs 2 points);
// every point of a series with line:false is a dot. With 1 point the dot sits in the middle.
// Returns an element. With no points at all it returns the empty-state text.
export function lineChart({ series, unit, label, emptyText = "No data yet.", width = 343, height = 200 }) {
  const all = series.flatMap((x) => x.points.map((p) => ({ x: dayNumber(p.date), y: p.y })));
  if (!all.length) return h("p", { class: "muted" }, emptyText);
  const xMin = Math.min(...all.map((p) => p.x));
  const xMax = Math.max(...all.map((p) => p.x));
  const scale = niceScale(Math.min(...all.map((p) => p.y)), Math.max(...all.map((p) => p.y)), 4);
  const box = { left: 44, right: width - 10, top: 24, bottom: height - 26 };
  const range = { xMin, xMax, yMin: scale.min, yMax: scale.max };

  const grid = scale.ticks.map((t) => {
    const y = box.bottom - ((t - scale.min) / (scale.max - scale.min)) * (box.bottom - box.top);
    return [
      s("line", { x1: box.left, x2: box.right, y1: y, y2: y, class: "chart-grid" }),
      s("text", { x: box.left - 6, y: y + 4, "text-anchor": "end", class: "chart-text" }, String(Math.round(t * 100) / 100)),
    ];
  });
  // Redesign A: the main line glows, has a soft fill under it, draws itself in, and its last point is marked.
  const gid = `chart-fill-${++chartCount}`;
  const lines = [];
  const dots = [];
  const marks = series.map((one) => {
    const pts = layoutPoints(one.points.map((p) => ({ x: dayNumber(p.date), y: p.y, pr: Boolean(p.pr) })), range, box);
    const prDots = pts.filter((p) => p.pr).map((p) => s("circle", { cx: p.px, cy: p.py, r: 5.5, class: "chart-pr" }));
    dots.push(...prDots);
    if (one.line && pts.length >= 2) {
      const d = linePath(pts);
      const area = s("path", { d: `${d} L${pts[pts.length - 1].px},${box.bottom} L${pts[0].px},${box.bottom} Z`, fill: `url(#${gid})`, stroke: "none" });
      const line = s("path", { d, class: "chart-line", fill: "none" });
      lines.push(line);
      const last = pts[pts.length - 1];
      return [area, line, s("circle", { cx: last.px, cy: last.py, r: 5, class: "chart-last" }), prDots];
    }
    const made = pts.map((p) => s("circle", { cx: p.px, cy: p.py, r: one.line ? 5 : 3, class: one.line ? "chart-last" : "chart-dot" }));
    dots.push(...made);
    return [made, prDots];
  });
  onMount(() => { lines.forEach((l) => drawIn(l)); stagger(dots, { step: 15, ms: 300 }); });
  const first = shortDate(xMin);
  const last = shortDate(xMax);
  return h("div", { class: "chart" },
    s("svg", { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": label },
      s("defs", {}, s("linearGradient", { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 },
        s("stop", { offset: "0%", class: "chart-fill-top" }), s("stop", { offset: "100%", class: "chart-fill-bottom" }))),
      grid, marks,
      s("text", { x: box.left, y: height - 6, "text-anchor": "start", class: "chart-text" }, first),
      xMax !== xMin ? s("text", { x: box.right, y: height - 6, "text-anchor": "end", class: "chart-text" }, last) : null,
      s("text", { x: 4, y: 10, class: "chart-text" }, unit)));
}
