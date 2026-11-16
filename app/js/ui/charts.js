// Charts in plain SVG, drawn by our own code (no library). One flat accent line, single points as small muted dots,
// at most 5 grid lines, axis labels in small muted text (docs/DESIGN.md section 7).
import { h } from "../h.js";
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
    if (one.line && pts.length >= 2) return s("path", { d: linePath(pts), class: "chart-line", fill: "none" });
    return pts.map((p) => s("circle", { cx: p.px, cy: p.py, r: one.line ? 4 : 3, class: one.line ? "chart-dot-main" : "chart-dot" }));
  });
  const first = shortDate(xMin);
  const last = shortDate(xMax);
  return h("div", { class: "chart" },
    s("svg", { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": label },
      grid, marks,
      s("text", { x: box.left, y: height - 6, "text-anchor": "start", class: "chart-text" }, first),
      xMax !== xMin ? s("text", { x: box.right, y: height - 6, "text-anchor": "end", class: "chart-text" }, last) : null,
      s("text", { x: 4, y: 10, class: "chart-text" }, unit)));
}
