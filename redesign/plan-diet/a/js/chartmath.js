// Chart maths. Pure: no page. The drawing is in ui/charts.js.

// A tidy axis: about `count` steps with round numbers. Returns { min, max, step, ticks }.
export function niceScale(lo, hi, count = 4) {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return { min: 0, max: 1, step: 1, ticks: [0, 1] };
  if (lo === hi) { const pad = Math.max(Math.abs(lo) * 0.05, 1); lo -= pad; hi += pad; }
  const raw = (hi - lo) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const min = Math.floor(lo / step) * step;
  const max = Math.ceil(hi / step) * step;
  const ticks = [];
  for (let v = min; v <= max + step / 1000; v += step) ticks.push(Math.round(v / step) * step);
  return { min, max, step, ticks };
}

// Map data to pixels. points: [{ x, y }] with x as any number (a day number).
// box: { left, right, top, bottom } is the drawing area. With one point it sits in the middle.
export function layoutPoints(points, { xMin, xMax, yMin, yMax }, box) {
  const w = box.right - box.left;
  const h = box.bottom - box.top;
  return points.map((p) => ({
    px: xMax === xMin ? box.left + w / 2 : box.left + ((p.x - xMin) / (xMax - xMin)) * w,
    py: yMax === yMin ? box.top + h / 2 : box.bottom - ((p.y - yMin) / (yMax - yMin)) * h,
    ...p,
  }));
}

const round = (n) => Math.round(n * 10) / 10;

// "M10,20 L30,40" for a line through the pixel points (needs 2 or more).
export function linePath(pixelPoints) {
  return pixelPoints.map((p, i) => `${i === 0 ? "M" : "L"}${round(p.px)},${round(p.py)}`).join(" ");
}
