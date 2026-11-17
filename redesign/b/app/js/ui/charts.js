// Charts in plain SVG, drawn by our own code (no library). One flat accent line, single points as small muted dots,
// at most 5 grid lines, axis labels in small muted text (docs/DESIGN.md section 7).
// Redesign B: a soft fill under the line (like Apple Health), the newest point drawn bigger, and the line draws in
// from left to right when the chart appears (motion.js drawIn; skipped with reduced motion).
import { h } from "../h.js";
import { drawIn } from "./motion.js";
import { s } from "./svg.js";
import { niceScale, layoutPoints, linePath } from "../chartmath.js";

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

// series: [{ points: [{ date, y }], line: true | false }]. A series with line:true is drawn as a line (needs 2 points);
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
  const marks = series.map((one) => {
    const pts = layoutPoints(one.points.map((p) => ({ x: dayNumber(p.date), y: p.y })), range, box);
    if (one.line && pts.length >= 2) {
      const end = pts[pts.length - 1];
      const area = `${linePath(pts)} L${end.px.toFixed(1)},${box.bottom} L${pts[0].px.toFixed(1)},${box.bottom} Z`;
      return [
        s("path", { d: area, class: "chart-area" }),
        s("path", { d: linePath(pts), class: "chart-line", fill: "none" }),
        s("circle", { cx: end.px, cy: end.py, r: 5, class: "chart-last" }),
      ];
    }
    return pts.map((p) => s("circle", { cx: p.px, cy: p.py, r: one.line ? 4 : 3, class: one.line ? "chart-dot-main" : "chart-dot" }));
  });
  const first = shortDate(xMin);
  const last = shortDate(xMax);
  const svg = s("svg", { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": label },
    grid, marks,
    s("text", { x: box.left, y: height - 6, "text-anchor": "start", class: "chart-text" }, first),
    xMax !== xMin ? s("text", { x: box.right, y: height - 6, "text-anchor": "end", class: "chart-text" }, last) : null,
    s("text", { x: 4, y: 10, class: "chart-text" }, unit));
  // Draw in only when the chart is new on the screen: a redraw (a tap elsewhere) must not replay it.
  // The old screen is still in the page while the new one is built, so a chart with the same label means "already shown".
  const shown = typeof document !== "undefined" && [...document.querySelectorAll(".chart svg")].some((x) => x.getAttribute("aria-label") === label);
  if (!shown) drawIn(svg);
  return h("div", { class: "chart" }, svg);
}

// A tiny line for a list row (no axes, no text): the shape of the progress at a glance. Hidden from screen readers;
// the row's own text says the numbers.
export function sparkline(points, { width = 64, height = 28 } = {}) {
  if (points.length < 2) return null;
  const xs = points.map((p) => dayNumber(p.date));
  const ys = points.map((p) => p.y);
  const range = { xMin: Math.min(...xs), xMax: Math.max(...xs), yMin: Math.min(...ys), yMax: Math.max(...ys) };
  const box = { left: 3, right: width - 3, top: 3, bottom: height - 3 };
  const pts = layoutPoints(points.map((p, i) => ({ x: xs[i], y: p.y })), range, box);
  const end = pts[pts.length - 1];
  return s("svg", { viewBox: `0 0 ${width} ${height}`, class: "sparkline", "aria-hidden": "true", width, height },
    s("path", { d: linePath(pts), class: "chart-line", fill: "none" }),
    s("circle", { cx: end.px, cy: end.py, r: 2.5, class: "chart-dot-main" }));
}
