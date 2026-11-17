import { h } from "../h.js";
import { s } from "./svg.js";
import { addTicker, remainingMs, formatClock, ringFraction, endedLongAgo } from "../timer.js";
import { beep } from "../sound.js";
import { icon } from "./icons.js";
import { bump } from "./motion.js";

const TABS = [["today", "Today"], ["progress", "Progress"], ["plan", "Plan"], ["settings", "Settings"]];

export function tabBar(active) {
  return h("nav", { class: "bar", "aria-label": "Main" },
    h("div", { class: "tabs" },
      TABS.map(([id, label]) =>
        h("a", { class: "tab", href: `#/${id}`, "aria-current": id === active ? "page" : false }, icon(id, 26, { strokeWidth: id === active ? 2.2 : 1.8 }), label))));
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

export function mainButton(label, onclick, { disabled = false } = {}) {
  return h("button", { class: "button", type: "button", disabled, onclick }, label);
}

export function secondaryButton(label, onclick) {
  return h("button", { class: "button secondary", type: "button", onclick }, label);
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

// ---------- workout parts ----------

// Top bar of a workout screen: what we are doing on the left, a small End button on the right.
// `progress`: { done, total } draws a thin segmented bar of the whole workout under it (redesign A).
export function topBar(label, onEnd, progress = null) {
  const bar = h("div", { class: "topbar" },
    h("div", { class: "topbar-label" }, label),
    onEnd ? h("button", { class: "text-button", type: "button", onclick: onEnd }, "End") : null);
  if (!progress || !progress.total) return bar;
  const segs = [];
  for (let i = 0; i < progress.total; i++) segs.push(h("span", { class: i < progress.done ? "done" : i === progress.done ? "now" : "" }));
  return [bar, h("div", { class: "seg", role: "progressbar", "aria-label": "Workout progress", "aria-valuemin": "0", "aria-valuemax": String(progress.total), "aria-valuenow": String(progress.done) }, segs)];
}

// A workout screen: no tab bar, room for the bottom bar.
export function workoutScreen(...children) {
  return h("main", { class: "screen has-bar workout" }, ...children);
}

// Bottom sheet over a scrim. Returns close(). Sheets live outside #app; the router closes them when it draws a screen.
export function openSheet(...children) {
  closeSheets();
  const close = () => { wrap.remove(); };
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
export function toast(text, ms = 6000) {
  const el = h("div", { class: "toast", role: "status" }, text);
  document.body.append(el);
  setTimeout(() => el.remove(), ms);
}

// Ring plus big m:ss digits. `end` is epoch milliseconds. Calls onEnd once when the time is up
// (after the flash and beep). If the phone was locked past the end, it calls onEnd quietly with no flash.
// `extra(now)` runs on every tick (for labels that change with the time).
// Redesign A: a thick glowing ring that empties as the time runs out, with a soft breathing glow behind it.
export function timerView({ end, total, onEnd, extra, big = true, sub = null }) {
  const R = 124;
  const C = 2 * Math.PI * R;
  const arc = s("circle", { class: "arc", cx: 140, cy: 140, r: R, fill: "none", stroke: "var(--accent)", "stroke-width": big ? 14 : 12, "stroke-linecap": "round", "stroke-dasharray": C, "stroke-dashoffset": 0, transform: "rotate(-90 140 140)" });
  const time = h("span", {}, "");
  const digits = h("div", { class: big ? "timer ring-digits" : "display ring-digits", role: "timer" }, time, sub ? h("span", { class: "ring-sub" }, sub) : null);
  const el = h("div", { class: big ? "ring" : "ring small" },
    h("div", { class: "ring-glow", "aria-hidden": "true" }),
    s("svg", { viewBox: "0 0 280 280", "aria-hidden": "true" },
      s("circle", { cx: 140, cy: 140, r: R, fill: "none", stroke: "var(--ring-track)", "stroke-width": big ? 14 : 12 }), arc),
    digits);
  let fired = false;
  addTicker((now) => {
    const rem = remainingMs(end, now);
    time.textContent = formatClock(rem);
    arc.setAttribute("stroke-dashoffset", String(C * ringFraction(end, total, now)));
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
  const set = (n) => {
    v = Math.min(max, Math.max(min, Math.round(n * 10 ** decimals) / 10 ** decimals));
    input.value = fmt(v);
    bump(input);
    onChange(v);
  };
  const move = (dir) => set(next ? next(v, dir) : v + dir * step);
  return h("div", { class: "stepper-block" },
    h("div", { class: "label" }, label),
    h("div", { class: "stepper" },
      h("button", { class: "step-btn", type: "button", "aria-label": `Less ${label}`, onclick: () => move(-1) }, "−"),
      h("div", { class: "step-value" }, input, unit ? h("span", { class: "unit" }, unit) : null),
      h("button", { class: "step-btn", type: "button", "aria-label": `More ${label}`, onclick: () => move(1) }, "+")));
}

// A row of choice buttons, one chosen. items: [[value, label]]. Used for effort 1 to 10 and "how many more".
export function choiceRow(items, selected, onPick, { columns = items.length } = {}) {
  const row = h("div", { class: "choice-row" },
    items.map(([value, label]) =>
      h("button", { class: "pick", type: "button", "aria-pressed": value === selected ? "true" : "false", onclick: () => onPick(value) }, label)));
  row.style.gridTemplateColumns = `repeat(${columns}, 1fr)`; // set by script: the page's CSP blocks style attributes
  return row;
}
