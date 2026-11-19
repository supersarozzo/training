// Charts in plain SVG, drawn by our own code (no library). One accent line, 2 px, no glow and no shaded area (0.7.7,
// answer 102 a), that draws itself in (off with animations off), single points as small muted dots, gold dots for new
// bests (builder C), at most 4 grid lines, axis labels in small muted text (docs/DESIGN.md section 8). 0.7.7 adds the
// empty chart frame and the calories bars.
import { h } from "../h.js";
import { s } from "./svg.js";
import { niceScale, layoutPoints, linePath } from "../chartmath.js";
import { drawIn, stagger, onMount } from "./motion.js";

const MS_DAY = 86400000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const W = 343;
const H = 200;
const BOX = { left: 44, right: W - 10, top: 24, bottom: H - 26 };
const fmtNum = (n) => Math.round(n).toLocaleString("en-GB");

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
  const scale = niceScale(Math.min(...all.map((p) => p.y)), Math.max(...all.map((p) => p.y)), 4); // at most 4 lines
  const box = { left: 44, right: width - 10, top: 24, bottom: height - 26 };
  const range = { xMin, xMax, yMin: scale.min, yMax: scale.max };

  const grid = scale.ticks.map((t) => {
    const y = box.bottom - ((t - scale.min) / (scale.max - scale.min)) * (box.bottom - box.top);
    return [
      s("line", { x1: box.left, x2: box.right, y1: y, y2: y, class: "chart-grid" }),
      s("text", { x: box.left - 6, y: y + 4, "text-anchor": "end", class: "chart-text" }, String(Math.round(t * 100) / 100)),
    ];
  });
  // The main line draws itself in and its last point is marked (0.7.7: no glow, no shaded area).
  const lines = [];
  const dots = [];
  const marks = series.map((one) => {
    const pts = layoutPoints(one.points.map((p) => ({ x: dayNumber(p.date), y: p.y, pr: Boolean(p.pr) })), range, box);
    const prDots = pts.filter((p) => p.pr).map((p) => s("circle", { cx: p.px, cy: p.py, r: 5.5, class: "chart-pr" }));
    dots.push(...prDots);
    if (one.line && pts.length >= 2) {
      const line = s("path", { d: linePath(pts), class: "chart-line", fill: "none" });
      lines.push(line);
      const last = pts[pts.length - 1];
      return [line, s("circle", { cx: last.px, cy: last.py, r: 5, class: "chart-last" }), prDots];
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
      grid, marks,
      s("text", { x: box.left, y: height - 6, "text-anchor": "start", class: "chart-text" }, first),
      xMax !== xMin ? s("text", { x: box.right, y: height - 6, "text-anchor": "end", class: "chart-text" }, last) : null,
      s("text", { x: 4, y: 10, class: "chart-text" }, unit)));
}

// An empty chart frame with two lines of words inside (0.7.7): a card with no data still looks like a chart.
export function emptyChart(words, label) {
  const ys = [0, 1, 2, 3].map((i) => BOX.top + (i * (BOX.bottom - BOX.top)) / 3);
  const mid = (BOX.left + BOX.right) / 2;
  const cy = (BOX.top + BOX.bottom) / 2;
  return h("div", { class: "chart" },
    s("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": label ?? words.join(" ") },
      ys.map((y) => s("line", { x1: BOX.left, x2: BOX.right, y1: y, y2: y, class: "chart-empty-grid" })),
      s("text", { x: mid, y: cy - 4, "text-anchor": "middle", class: "chart-text strong" }, words[0]),
      words[1] ? s("text", { x: mid, y: cy + 14, "text-anchor": "middle", class: "chart-text" }, words[1]) : null));
}

// The calories chart (0.7.7): one bar per day (accent, rounded top), today as a dashed outline ("so far" above it in the
// 7-day view), a day with no food as a small dash at the bottom (a gap, never a 0 bar), the target as a dashed line.
// days: [{ date, kcal | null, today }] oldest first (foodmath dailyKcal). target: kcal or null.
export function barChart({ days, target = null, label }) {
  const week = days.length <= 8;
  const top = Math.max(0, ...days.map((d) => d.kcal ?? 0), target ?? 0) || 1000;
  const scale = niceScale(0, top, 4);
  const y = (v) => BOX.bottom - (v / scale.max) * (BOX.bottom - BOX.top);
  const slot = (BOX.right - BOX.left) / days.length;
  const bw = week ? 20 : 6;
  const r0 = week ? 4 : 2;
  const grid = scale.ticks.map((t) => [
    s("line", { x1: BOX.left, x2: BOX.right, y1: y(t), y2: y(t), class: "chart-grid" }),
    s("text", { x: BOX.left - 6, y: y(t) + 4, "text-anchor": "end", class: "chart-text" }, fmtNum(t)),
  ]);
  const bars = [];
  let soFar = null; // drawn last, over the target line, with a halo (review round 1)
  const marks = days.map((d, i) => {
    const cx = BOX.left + slot * (i + 0.5);
    const out = [];
    if (d.kcal === null) {
      const gw = week ? 8 : 4;
      out.push(s("line", { x1: cx - gw / 2, x2: cx + gw / 2, y1: BOX.bottom - 1, y2: BOX.bottom - 1, class: "chart-gap" }));
    } else if (d.today) {
      const top1 = Math.min(y(d.kcal), BOX.bottom - 2); // 0 kcal so far still shows a thin outline
      out.push(s("rect", { x: cx - bw / 2 + 1, y: top1, width: bw - 2, height: BOX.bottom - top1, rx: r0, class: "chart-today" }));
      if (week) soFar = s("text", { x: cx, y: top1 - 6, "text-anchor": "middle", class: "chart-text halo" }, "so far");
    } else {
      const top1 = Math.min(y(d.kcal), BOX.bottom - 2); // a day with food but 0 kcal still shows a 2 px bar
      const r = Math.min(r0, (BOX.bottom - top1) / 2, bw / 2);
      const l = cx - bw / 2;
      const rt = cx + bw / 2;
      const bar = s("path", { d: `M${l},${BOX.bottom} V${top1 + r} Q${l},${top1} ${l + r},${top1} H${rt - r} Q${rt},${top1} ${rt},${top1 + r} V${BOX.bottom} Z`, class: "chart-bar" });
      bars.push(bar);
      out.push(bar);
    }
    if (week) {
      const wd = WEEKDAYS[new Date(dayNumber(d.date) * MS_DAY).getUTCDay()];
      out.push(s("text", { x: cx, y: H - 6, "text-anchor": "middle", class: d.today ? "chart-text strong" : "chart-text" }, d.today ? "Today" : wd));
    }
    return out;
  });
  onMount(() => stagger(bars, { step: 15, ms: 300 }));
  return h("div", { class: "chart" },
    s("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": label },
      grid, marks,
      target ? s("line", { x1: BOX.left, x2: BOX.right, y1: y(target), y2: y(target), class: "chart-target" }) : null,
      soFar,
      week ? null : [
        s("text", { x: BOX.left, y: H - 6, "text-anchor": "start", class: "chart-text" }, shortDate(dayNumber(days[0].date))),
        s("text", { x: BOX.right, y: H - 6, "text-anchor": "end", class: "chart-text strong" }, "Today")],
      s("text", { x: 4, y: 10, class: "chart-text" }, "kcal")));
}
