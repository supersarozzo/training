// Charts in plain SVG, drawn by our own code (no library). One accent line with a soft fill under it, single points as
// small muted dots, gold dots for new bests, at most 5 grid lines, axis labels in small muted text.
// The line draws itself in from left to right (Web Animations, stroke only); with animations off it is just there.
import { h } from "../h.js";
import { s } from "./svg.js";
import { niceScale, layoutPoints, linePath } from "../chartmath.js";
import { motionOk } from "./prefs.js";

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

// series: [{ points: [{ date, y, pr? }], line: true | false, area?: true }]. A series with line:true is drawn as a line
// (needs 2 points); every point of a series with line:false is a dot. Points with pr:true get a gold dot.
// With 1 point the dot sits in the middle. With no points at all it returns the empty-state text.
export function lineChart({ series, unit, label, emptyText = "No data yet.", width = 343, height = 200 }) {
  const all = series.flatMap((x) => x.points.map((p) => ({ x: dayNumber(p.date), y: p.y })));
  if (!all.length) return h("p", { class: "muted" }, emptyText);
  const xMin = Math.min(...all.map((p) => p.x));
  const xMax = Math.max(...all.map((p) => p.x));
  const scale = niceScale(Math.min(...all.map((p) => p.y)), Math.max(...all.map((p) => p.y)), 4);
  const box = { left: 40, right: width - 8, top: 18, bottom: height - 24 };
  const range = { xMin, xMax, yMin: scale.min, yMax: scale.max };

  const grid = scale.ticks.map((t) => {
    const y = box.bottom - ((t - scale.min) / (scale.max - scale.min)) * (box.bottom - box.top);
    return [
      s("line", { x1: box.left, x2: box.right, y1: y, y2: y, class: "chart-grid" }),
      s("text", { x: box.left - 6, y: y + 4, "text-anchor": "end", class: "chart-text" }, String(Math.round(t * 100) / 100)),
    ];
  });
  const lines = [];
  const marks = series.map((one) => {
    const pts = layoutPoints(one.points.map((p) => ({ x: dayNumber(p.date), y: p.y, pr: Boolean(p.pr) })), range, box);
    const prDots = pts.filter((p) => p.pr).map((p) => s("circle", { cx: p.px, cy: p.py, r: 5, class: "chart-pr" }));
    if (one.line && pts.length >= 2) {
      const d = linePath(pts);
      const first = pts[0], last = pts[pts.length - 1];
      const area = one.area ? s("path", { d: `${d} L${last.px},${box.bottom} L${first.px},${box.bottom} Z`, class: "chart-area" }) : null;
      const line = s("path", { d, class: "chart-line", fill: "none" });
      const len = Math.ceil(pts.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.px - pts[i].px, p.py - pts[i].py), 0)) + 1;
      lines.push([line, len]);
      return [area, line, s("circle", { cx: last.px, cy: last.py, r: 4, class: "chart-dot-main" }), prDots];
    }
    return [pts.map((p) => s("circle", { cx: p.px, cy: p.py, r: one.line ? 4 : 2.5, class: one.line ? "chart-dot-main" : "chart-dot" })), prDots];
  });
  const svg = s("svg", { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": label },
    grid, marks,
    s("text", { x: box.left, y: height - 6, "text-anchor": "start", class: "chart-text" }, shortDate(xMin)),
    xMax !== xMin ? s("text", { x: box.right, y: height - 6, "text-anchor": "end", class: "chart-text" }, shortDate(xMax)) : null,
    s("text", { x: 2, y: 10, class: "chart-text" }, unit));
  if (motionOk()) {
    for (const [line, len] of lines) {
      line.style.strokeDasharray = `${len} ${len}`; // script styles are allowed by the page's CSP
      const run = line.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 900, easing: "cubic-bezier(.2,.8,.2,1)" });
      run.onfinish = () => { line.style.strokeDasharray = ""; };
    }
  }
  return h("div", { class: "chart" }, svg);
}
