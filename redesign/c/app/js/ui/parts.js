import { h } from "../h.js";
import { s } from "./svg.js";
import { icon } from "./icons.js";
import { addTicker, remainingMs, formatClock, ringFraction, endedLongAgo } from "../timer.js";
import { beep } from "../sound.js";
import { motionOk } from "./prefs.js";

export { icon };

const TABS = [["today", "Today", "today"], ["progress", "Progress", "progress"], ["gym", "Gym", "gym"], ["plan", "Plan", "plan"], ["settings", "Settings", "settings"]];

export function tabBar(active) {
  return h("nav", { class: "bar", "aria-label": "Main" },
    h("div", { class: "tabs" },
      TABS.map(([id, label, ic]) =>
        h("a", { class: "tab", href: `#/${id}`, "aria-current": id === active ? "page" : false }, icon(ic), label))));
}

// A standard screen wrapper (with room for the tab bar).
export function screen(...children) {
  return h("main", { class: "screen has-tabs" }, ...children);
}

// A screen without tabs, with room for the bottom action bar (setup, intake, targets).
export function flowScreen(...children) {
  return h("main", { class: "screen has-bar" }, ...children);
}

// The fixed bottom bar with the one main action (and an optional secondary button above it).
export function actionBar(...buttons) {
  return h("div", { class: "bar action-bar no-tabs" }, h("div", { class: "bar-inner" }, ...buttons));
}

// The same bar, but sitting above the tab bar (screens with tabs, like Today).
export function tabActionBar(...buttons) {
  return h("div", { class: "bar action-bar" }, h("div", { class: "bar-inner" }, ...buttons));
}

export function mainButton(label, onclick, { disabled = false, sub = null, ic = null } = {}) {
  return h("button", { class: "button", type: "button", disabled, onclick }, ic ? icon(ic) : null, label, sub ? h("span", { class: "sub" }, sub) : null);
}

export function secondaryButton(label, onclick, { ic = null, cls = "" } = {}) {
  return h("button", { class: `button secondary ${cls}`.trim(), type: "button", onclick }, ic ? icon(ic) : null, label);
}

// A small pill button: icon + word (never an icon alone).
export function chip(ic, label, onclick, { href = null, cls = "" } = {}) {
  if (href) return h("a", { class: `chip ${cls}`.trim(), href, target: "_blank", rel: "noopener noreferrer" }, icon(ic, "sm"), label);
  return h("button", { class: `chip ${cls}`.trim(), type: "button", onclick }, icon(ic, "sm"), label);
}

export function emptyState(title, text) {
  return h("div", { class: "card" }, h("h2", {}, title), h("p", { class: "muted" }, text));
}

export function errorState(message) {
  return h("main", { class: "screen" },
    h("h1", {}, "Something is wrong"),
    h("div", { class: "card warn" }, h("p", {}, message)),
    h("p", { class: "muted small" }, "Your data was not changed."));
}

// A small number tile: label, value (with unit), optional detail line and sparkline.
export function stat(k, v, unit = null, { d = null, spark = null } = {}) {
  return h("div", { class: "stat" },
    h("div", { class: "k" }, k),
    h("div", { class: "v" }, String(v), unit ? h("span", { class: "unit" }, unit) : null),
    d ? h("div", { class: "d" }, d) : null,
    spark);
}

// Tiny line of the last values. `values` are numbers, oldest first. Flat or single values draw a calm line.
export function sparkline(values, { w = 64, h: ht = 22, area = false } = {}) {
  const v = values.filter((x) => Number.isFinite(x));
  if (!v.length) return null;
  const lo = Math.min(...v), hi = Math.max(...v);
  const pts = v.map((y, i) => [v.length === 1 ? w / 2 : (i / (v.length - 1)) * w, hi === lo ? ht / 2 : ht - 2 - ((y - lo) / (hi - lo)) * (ht - 4)]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const svg = s("svg", { class: `spark${hi === lo ? " flat" : ""}`, width: w, height: ht, viewBox: `0 0 ${w} ${ht}`, "aria-hidden": "true" },
    area && v.length > 1 ? s("path", { class: "area", d: `${d} L${w} ${ht} L0 ${ht} Z` }) : null,
    v.length > 1 ? s("path", { d }) : null,
    s("circle", { cx: last[0], cy: last[1], r: 2.6 }));
  if (motionOk() && v.length > 1) {
    const path = svg.querySelector("path:not(.area)");
    // The line's real length from its points (pathLength is not scaled the same way in every browser).
    const len = Math.ceil(pts.slice(1).reduce((sum, [x, y], i) => sum + Math.hypot(x - pts[i][0], y - pts[i][1]), 0)) + 1;
    path.style.strokeDasharray = `${len} ${len}`; // set by script: the page's CSP blocks style attributes, not script styles
    const run = path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 700, easing: "cubic-bezier(.2,.8,.2,1)" });
    run.onfinish = () => { path.style.strokeDasharray = ""; };
  }
  return svg;
}

// ---------- workout parts ----------

// Top bar of a workout screen: label (and the time since the start) on the left, a small End button on the right.
export function topBar(label, onEnd, { startedAt = null } = {}) {
  let clock = null;
  if (startedAt) {
    clock = h("span", { class: "clock" }, "");
    const t0 = Date.parse(startedAt);
    addTicker((now) => { clock.textContent = formatClock(Math.max(0, now - t0)); });
  }
  return h("div", { class: "topbar" },
    h("div", { class: "topbar-label" }, clock ? [icon("clock", "sm"), clock, h("span", {}, "·")] : null, h("span", { class: "ellipsis" }, label)),
    onEnd ? h("button", { class: "text-button", type: "button", onclick: onEnd }, "End") : null);
}

// Thin bar: how much of the workout is done (0 to 1).
export function progressBar(fraction) {
  const i = h("i", {});
  i.style.transform = `scaleX(${Math.max(0, Math.min(1, fraction))})`;
  return h("div", { class: "progress", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(Math.round(fraction * 100)) }, i);
}

// A workout screen: no tab bar, room for the bottom bar. `key` names the screen, so the entry animation plays only
// when the screen really changes (not on every redraw).
export function workoutScreen(...children) {
  return h("main", { class: "screen has-bar workout" }, ...children);
}

// Bottom sheet over a scrim. One at a time. Returns close(). Sheets live outside #app; the router closes them.
export function openSheet(...children) {
  closeSheets();
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    if (!motionOk()) { wrap.remove(); return; }
    wrap.classList.add("closing");
    setTimeout(() => wrap.remove(), 150);
  };
  const wrap = h("div", { class: "sheet-wrap", dataset: { sheet: "1" } },
    h("div", { class: "scrim", onclick: close }),
    h("div", { class: "sheet", role: "dialog", "aria-modal": "true" },
      h("div", { class: "sheet-head" }, h("button", { class: "text-button", type: "button", onclick: close, "aria-label": "Close" }, "Close")),
      ...children));
  document.body.append(wrap);
  return close;
}
export function closeSheets() {
  document.querySelectorAll("[data-sheet]").forEach((el) => el.remove());
}

// Full-screen flash when a timer ends: "Go" for 2 seconds. Colour only, no blinking.
export function showFlash(text = "Go", ms = 2000) {
  return new Promise((resolve) => {
    const el = h("div", { class: "flash", role: "status" }, h("div", { class: "display" }, text));
    document.body.append(el);
    setTimeout(() => { el.remove(); resolve(); }, ms);
  });
}

// A short message at the top that goes away by itself.
export function toast(text, ms = 6000, { pr = false } = {}) {
  const el = h("div", { class: `toast${pr ? " pr" : ""}`, role: "status" }, pr ? icon("star", "fill") : null, text);
  document.body.append(el);
  setTimeout(() => el.remove(), ms);
}

// Ring plus big m:ss digits. `end` is epoch milliseconds. Calls onEnd once when the time is up
// (after the flash and beep). If the phone was locked past the end, it calls onEnd quietly with no flash.
// `extra(now)` runs on every tick. `cap` is a word under the digits. `marks`: [[from, to]] parts of the ring
// (0 to 1 of the total time) drawn in a second colour, for example the walk's build-up.
export function timerView({ end, total, onEnd, extra, big = true, cap = null, marks = [] }) {
  const R = 124;
  const C = 2 * Math.PI * R;
  const arc = s("circle", { class: "arc", cx: 140, cy: 140, r: R, fill: "none", stroke: "var(--accent)", "stroke-width": 12, "stroke-linecap": "round", "stroke-dasharray": C, "stroke-dashoffset": 0, transform: "rotate(-90 140 140)" });
  const segs = marks.map(([a, b]) => s("circle", { class: "seg", cx: 140, cy: 140, r: R + 12, fill: "none", "stroke-width": 4, "stroke-dasharray": `${2 * Math.PI * (R + 12) * (b - a)} ${2 * Math.PI * (R + 12)}`, "stroke-dashoffset": -2 * Math.PI * (R + 12) * a, transform: "rotate(-90 140 140)" }));
  const digits = h("div", { class: big ? "timer" : "display", role: "timer" }, "");
  const el = h("div", { class: `ring${big ? "" : " small"}` },
    s("svg", { viewBox: "-6 -6 292 292", "aria-hidden": "true" },
      s("circle", { cx: 140, cy: 140, r: R, fill: "none", stroke: "var(--subtle)", "stroke-width": 12 }), segs, arc),
    h("div", { class: "ring-digits" }, digits, cap ? h("div", { class: "cap" }, cap) : null));
  let fired = false;
  addTicker((now) => {
    const rem = remainingMs(end, now);
    digits.textContent = formatClock(rem);
    arc.setAttribute("stroke-dashoffset", String(C * ringFraction(end, total, now)));
    el.classList.toggle("ending", rem > 0 && rem <= 5000);
    if (extra) extra(now);
    if (rem === 0 && !fired) {
      fired = true;
      if (endedLongAgo(end, now)) { if (onEnd) onEnd(); return; }
      beep({ long: true });
      showFlash("Go").then(() => { if (onEnd) onEnd(); });
    }
  });
  return el;
}

// The number control for weights and reps: big value between - and +. `next(value, direction)` can be given
// when the step changes with the value (dumbbell sizes). Tap the value to type it.
export function stepper({ label, unit, value, step = 1, next, min = 0, max = 999, decimals = 1, onChange }) {
  let v = value ?? 0;
  const fmt = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 10 ** decimals) / 10 ** decimals));
  const input = h("input", {
    type: "number", class: "step-input", inputmode: decimals ? "decimal" : "numeric", step: "any", value: fmt(v), "aria-label": label,
    oninput: (e) => { const n = parseFloat(e.target.value); if (Number.isFinite(n)) { v = n; onChange(v); } },
  });
  const set = (n, dir = 0) => {
    v = Math.min(max, Math.max(min, Math.round(n * 10 ** decimals) / 10 ** decimals));
    input.value = fmt(v);
    onChange(v);
    if (dir && motionOk()) {
      input.classList.remove("bump");
      input.style.setProperty("--dir", dir > 0 ? "8px" : "-8px");
      void input.offsetWidth; // restart the animation
      input.classList.add("bump");
    }
  };
  const move = (dir) => set(next ? next(v, dir) : v + dir * step, dir);
  return h("div", { class: "stepper-block" },
    h("div", { class: "label" }, label),
    h("div", { class: "stepper" },
      h("button", { class: "step-btn", type: "button", "aria-label": `Less ${label}`, onclick: () => move(-1) }, "−"),
      h("div", { class: "step-value" }, input, unit ? h("span", { class: "unit" }, unit) : null),
      h("button", { class: "step-btn", type: "button", "aria-label": `More ${label}`, onclick: () => move(1) }, "+")));
}

// A row of choice buttons, one chosen. items: [[value, label]]. Used for effort 1 to 10 and "how many more".
export function choiceRow(items, selected, onPick, { columns = items.length, cls = "" } = {}) {
  const row = h("div", { class: `choice-row ${cls}`.trim() },
    items.map(([value, label]) =>
      h("button", { class: "pick", type: "button", "aria-pressed": value === selected ? "true" : "false", onclick: () => onPick(value) }, label)));
  row.style.gridTemplateColumns = `repeat(${columns}, 1fr)`; // set by script: the page's CSP blocks style attributes
  return row;
}

// An on/off switch with its words.
export function toggleRow(title, on, onToggle, sub = null) {
  return h("div", { class: "toggle-row" },
    h("div", {}, h("div", { class: "title" }, title), sub ? h("div", { class: "small muted" }, sub) : null),
    h("button", { class: "switch", type: "button", role: "switch", "aria-checked": on ? "true" : "false", "aria-label": title, onclick: onToggle }));
}
