// Chart maths. Pure: no page. The drawing is in ui/charts.js.

// A tidy axis (0.7.7, DESIGN.md section 8): at most `count` grid lines (4), steps of 1, 2 or 5 times 10^n, and the first
// line may sit on a half step (80.5, 81.5, 82.5) when that fits the data in fewer lines. Data from 0 up never gets a line
// below 0. Returns { min, max, step, ticks }.
export function niceScale(lo, hi, count = 4) {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return { min: 0, max: 1, step: 1, ticks: [0, 1] };
  if (lo > hi) [lo, hi] = [hi, lo];
  // Equal, or equal but for float noise (85.9 five times averages to 85.90000000000002): pad around the value.
  if (hi - lo <= 1e-9 * Math.max(1, Math.abs(hi))) { lo = hi; const pad = Math.max(Math.abs(lo) * 0.05, 1); lo = lo >= 0 ? Math.max(0, lo - pad) : lo - pad; hi += pad; }
  const tidy = (v) => Math.round(v * 1e9) / 1e9;
  let mag = 10 ** Math.floor(Math.log10((hi - lo) / count));
  for (let guard = 0; guard < 40; guard++, mag *= 10) {
    for (const norm of [1, 2, 5]) {
      const step = tidy(norm * mag);
      if (!(step > 0)) continue; // a step that rounds to 0 would give no lines
      let best = null;
      for (const off of norm === 5 ? [0] : [0, step / 2]) { // half of 5 is 2.5: never a line there
        const min = tidy(Math.floor(tidy((lo - off) / step)) * step + off);
        const max = tidy(Math.ceil(tidy((hi - off) / step)) * step + off);
        const lines = Math.round((max - min) / step) + 1;
        if (!(lines <= count) || (lo >= 0 && min < 0)) continue;
        if (!best || lines < best.lines) best = { min, max, lines };
      }
      if (best) {
        const ticks = Array.from({ length: best.lines }, (_, i) => tidy(best.min + i * step));
        return { min: best.min, max: best.max, step, ticks };
      }
    }
  }
  return { min: lo, max: hi, step: hi - lo, ticks: [lo, hi] };
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
