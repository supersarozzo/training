// Shared screen parts, Apple style (redesign B). Data is only ever set as text (h() and s()), never innerHTML.
import { h } from "../h.js";
import { s } from "./svg.js";
import { icon } from "./icons.js";
import { art } from "./art.js";
import { pop, reduced } from "./motion.js";
import { addTicker, remainingMs, formatClock, ringFraction, endedLongAgo } from "../timer.js";
import { beep } from "../sound.js";
import { hasPhotos, photoUrl, artFor } from "../plan/media.js";

const TABS = [["today", "Today", "today"], ["progress", "Progress", "progress"], ["plan", "Plan", "plan"], ["settings", "Settings", "settings"]];

export function tabBar(active) {
  return h("nav", { class: "bar", "aria-label": "Main" },
    h("div", { class: "tabs" },
      TABS.map(([id, label, ic]) =>
        h("a", { class: "tab", href: `#/${id}`, "aria-current": id === active ? "page" : false }, icon(ic, 26, { filled: id === active, stroke: 1.8 }), label))));
}

// A standard tab screen (room for the tab bar).
export function screen(...children) {
  return h("main", { class: "screen has-tabs" }, ...children);
}

// A screen without tabs, with room for the bottom action bar (setup, intake, targets, weigh-in).
export function flowScreen(...children) {
  return h("main", { class: "screen has-bar" }, ...children);
}

// Large title with a small eyebrow line above it, and a frosted compact title that shows once the large one
// scrolls away (like an iOS navigation bar). The compact bar is a sibling of the screen, so it is fixed.
export function navHead(title, eyebrow = null, trailing = null) {
  const big = h("h1", { class: "large-title" }, title);
  const compact = h("div", { class: "nav-compact", "aria-hidden": "true" }, title);
  const head = h("header", { class: "nav-head" },
    eyebrow ? h("p", { class: "eyebrow" }, eyebrow) : null,
    trailing ? h("div", { class: "row-2" }, big, h("div", { class: "nav-trailing" }, trailing)) : big,
    compact);
  if (typeof IntersectionObserver === "function") {
    const io = new IntersectionObserver(([e]) => compact.classList.toggle("show", !e.isIntersecting), { rootMargin: "-44px 0px 0px 0px" });
    requestAnimationFrame(() => { if (big.isConnected) io.observe(big); });
  }
  return head;
}

// The fixed bottom bar with the main action (and an optional second button under it).
export function actionBar(...buttons) {
  return h("div", { class: "bar action-bar no-tabs" }, h("div", { class: "bar-inner" }, ...buttons));
}
// The same bar, floating above the tab bar (Today).
export function tabActionBar(...buttons) {
  return h("div", { class: "bar action-bar" }, h("div", { class: "bar-inner" }, ...buttons));
}

export function mainButton(label, onclick, { disabled = false, iconName = null } = {}) {
  return h("button", { class: "button", type: "button", disabled, onclick }, iconName ? icon(iconName, 20, { stroke: 2.4 }) : null, label);
}
export function secondaryButton(label, onclick, { iconName = null, kind = "secondary" } = {}) {
  return h("button", { class: `button ${kind}`, type: "button", onclick }, iconName ? icon(iconName, 19) : null, label);
}

export function emptyState(title, text) {
  return h("div", { class: "card center" }, h("div", { class: "headline" }, title), h("p", { class: "muted subhead" }, text));
}

export function errorState(message) {
  return h("main", { class: "screen" },
    h("div", { class: "hero-icon small", "aria-hidden": "true" }, icon("info", 36)),
    h("h1", { class: "center" }, "Something is wrong"),
    h("div", { class: "card warn" }, h("p", {}, message)),
    h("p", { class: "muted small center" }, "Your data was not changed."));
}

// ---------- grouped inset lists (iOS Settings look) ----------
export function section(head, ...children) {
  return h("section", { class: "section" }, head ? h("h2", { class: "group-head" }, head) : null, ...children);
}
export function group(...rows) { return h("div", { class: "group" }, ...rows); }
export function foot(text) { return h("p", { class: "group-foot" }, text); }

// One row. `href` makes a link, `onclick` a button; `chevron` adds ›.
export function row({ title, sub = null, value = null, lead = null, href = null, onclick = null, chevron = false, cls = "", trailing = null, label = null }) {
  const tag = href ? "a" : onclick ? "button" : "div";
  return h(tag, { class: `row ${lead ? (lead.classList?.contains("media") ? "with-thumb" : "with-icon") : ""} ${cls}`, href, type: tag === "button" ? "button" : null, onclick, "aria-label": label },
    lead,
    h("span", { class: "grow" }, title, sub ? h("span", { class: "sub" }, sub) : null),
    value !== null && value !== undefined ? h("span", { class: "value" }, value) : null,
    trailing,
    chevron ? h("span", { class: "chev" }, icon("chevron", 16, { stroke: 2.4 })) : null);
}
export function iconTile(name, color = "") {
  return h("span", { class: `icon-tile ${color}`, "aria-hidden": "true" }, icon(name, 19, { stroke: 2.2 }));
}

// iOS switch row.
export function switchRow({ title, sub = null, on, onToggle, lead = null }) {
  const sw = h("button", { class: "switch", type: "button", role: "switch", "aria-checked": on ? "true" : "false", "aria-label": title, onclick: onToggle });
  return h("div", { class: `row switch-row ${lead ? "with-icon" : ""}` }, lead, h("span", { class: "grow" }, title, sub ? h("span", { class: "sub" }, sub) : null), sw);
}

// Segmented control. items: [[value, label]]; with `href` items are links.
export function segmented(items, selected, onPick, { links = false, label = "Choose" } = {}) {
  return h("div", { class: "seg", role: "group", "aria-label": label },
    items.map(([value, text]) => links
      ? h("a", { href: value, "aria-current": value === selected ? "page" : false }, text)
      : h("button", { type: "button", "aria-pressed": value === selected ? "true" : "false", onclick: () => onPick(value) }, text)));
}

export function tile({ label, value, unit = null, note = null, color = "", iconName = null }) {
  return h("div", { class: `tile ${color}` },
    h("div", { class: "label" }, iconName ? icon(iconName, 14, { stroke: 2.4 }) : null, label),
    h("div", { class: "value" }, value, unit ? h("span", { class: "unit" }, ` ${unit}`) : null),
    note ? h("div", { class: "note" }, note) : null);
}

export function chip(label, onclick, iconName = null, cls = "") {
  return h("button", { class: `chip ${cls}`, type: "button", onclick }, iconName ? icon(iconName, 17, { stroke: 2.2 }) : null, label);
}

// ---------- exercise pictures ----------
// The two library photos (start, end) cross-fade in a loop: a short "how it moves" animation.
// size: "thumb" (lists, no loop), "strip", "mid" (exercise screen), "hero" (exercise sheet).
// With reduced motion the photos do not loop; a tap shows the other position.
export function exerciseMedia(id, name, size = "mid", { onclick = null } = {}) {
  // Thumbnails in list rows are pictures only (the row itself is the button); bigger ones are buttons.
  const passive = (size === "thumb" || size === "strip") && !onclick;
  const tag = passive ? "span" : "button";
  const type = passive ? null : "button";
  let el;
  if (hasPhotos(id)) {
    const lazy = size === "thumb" || size === "strip" ? "lazy" : "eager";
    el = h(tag, { class: `media ${size}`, type, role: passive ? "img" : null, "aria-label": onclick ? `${name}: show how to do it` : `${name}: start and end position. Tap to pause.` },
      h("img", { src: photoUrl(id, 0), alt: "", loading: lazy, decoding: "async", width: 850, height: 567 }),
      size === "thumb" ? null : h("img", { src: photoUrl(id, 1), alt: "", loading: lazy, decoding: "async", width: 850, height: 567 }));
  } else {
    el = h(tag, { class: `media ${size} art-only`, type, role: passive ? "img" : null, "aria-label": onclick ? `${name}: show how to do it` : `${name}: drawing` }, art(artFor[id] ?? "figure"));
  }
  if (passive) return el;
  el.addEventListener("click", () => {
    if (onclick) return onclick();
    if (reduced()) el.classList.toggle("show-end"); else el.classList.toggle("paused");
  });
  return el;
}
// A machine's picture: a photo folder or an original drawing.
export function machineMedia(m, size = "mid", opts = {}) {
  if (m.photo) return exerciseMedia(m.photo, m.name, size, opts);
  const passive = (size === "thumb" || size === "strip") && !opts.onclick;
  const el = h(passive ? "span" : "button", { class: `media ${size} art-only`, type: passive ? null : "button", role: passive ? "img" : null, "aria-label": opts.onclick ? `${m.name}: open the machine card` : `${m.name}: drawing` }, art(m.art));
  if (opts.onclick) el.addEventListener("click", opts.onclick);
  return el;
}

// ---------- workout parts ----------

// Top bar of a workout screen: End on the left, what we are doing in the middle, a thin progress line under it.
export function topBar(label, onEnd, progress = null) {
  const bar = h("div", { class: "topbar" },
    h("div", { class: "topbar-side" }, onEnd ? h("button", { class: "text-button danger", type: "button", onclick: onEnd }, "End") : null),
    h("div", { class: "topbar-label" }, label),
    h("div", { class: "topbar-side right" }));
  if (progress !== null) {
    const fill = h("span", {});
    fill.style.transform = `scaleX(${Math.max(0, Math.min(1, progress))})`; // CSSOM, allowed by the page's CSP
    bar.append(h("div", { class: "topbar-progress", "aria-hidden": "true" }, fill));
  }
  return bar;
}

export function workoutScreen(...children) {
  return h("main", { class: "screen has-bar workout" }, ...children);
}

// Bottom sheet over a scrim. Returns close(). Sheets live outside #app; the router closes them when it draws a screen.
// Drag the top of the sheet down to close it.
export function openSheet(...children) {
  closeSheets();
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    if (reduced()) { wrap.remove(); return; }
    wrap.classList.add("closing");
    sheet.classList.add("closing");
    setTimeout(() => wrap.remove(), 230);
  };
  const head = h("div", { class: "sheet-head" }, h("span", { class: "grabber", "aria-hidden": "true" }),
    h("button", { class: "text-button bold", type: "button", onclick: close, "aria-label": "Close" }, "Close"));
  const sheet = h("div", { class: "sheet", role: "dialog", "aria-modal": "true" }, head, ...children);
  const wrap = h("div", { class: "sheet-wrap", dataset: { sheet: "1" } }, h("div", { class: "scrim", onclick: close }), sheet);
  // swipe down on the head to close
  let y0 = null;
  head.addEventListener("pointerdown", (e) => { y0 = e.clientY; head.setPointerCapture?.(e.pointerId); });
  head.addEventListener("pointermove", (e) => { if (y0 === null) return; const dy = Math.max(0, e.clientY - y0); sheet.style.transform = `translateY(${dy}px)`; });
  const end = (e) => {
    if (y0 === null) return;
    const dy = e.clientY - y0; y0 = null;
    if (dy > 90) close();
    else if (sheet.animate) sheet.animate([{ transform: sheet.style.transform || "none" }, { transform: "none" }], { duration: 220, easing: "cubic-bezier(0.32,0.72,0,1)" });
    sheet.style.transform = "";
  };
  head.addEventListener("pointerup", end);
  head.addEventListener("pointercancel", end);
  document.body.append(wrap);
  return close;
}
export function closeSheets() {
  document.querySelectorAll("[data-sheet]").forEach((el) => el.remove());
}

// Full-screen flash when a timer ends: "Go" for 2 seconds. With reduced motion: the colour only, no scaling.
export function showFlash(text = "Go", ms = 2000, sub = null) {
  return new Promise((resolve) => {
    const el = h("div", { class: "flash", role: "status" }, h("div", { class: "display" }, text), sub ? h("div", { class: "flash-sub" }, sub) : null);
    document.body.append(el);
    setTimeout(() => {
      if (reduced() || !el.animate) { el.remove(); resolve(); return; }
      el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "ease-in" }).onfinish = () => { el.remove(); resolve(); };
    }, ms);
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
// `extra(now)` runs on every tick. `variant`: "" (accent), "cardio", "green". `sub`: a small line under the digits.
export function timerView({ end, total, onEnd, extra, big = true, variant = "", sub = null, flashSub = null }) {
  const R = 120;
  const C = 2 * Math.PI * R;
  const stroke = big ? 18 : 16;
  const arc = s("circle", { class: "arc", cx: 140, cy: 140, r: R, fill: "none", "stroke-width": stroke, "stroke-linecap": "round", "stroke-dasharray": C, transform: "rotate(-90 140 140)" });
  const digits = h("div", { class: big ? "timer" : "display", role: "timer", "aria-live": "off" }, "");
  const el = h("div", { class: `ring ${big ? "" : "small"} ${variant}` },
    s("svg", { viewBox: "0 0 280 280", "aria-hidden": "true" },
      s("circle", { class: "track", cx: 140, cy: 140, r: R, fill: "none", "stroke-width": stroke }), arc),
    h("div", { class: "ring-digits" }, digits, sub ? h("div", { class: "ring-sub" }, sub) : null));
  let fired = false;
  let first = true;
  addTicker((now) => {
    const rem = remainingMs(end, now);
    digits.textContent = formatClock(rem);
    // The arc empties as time passes (like a countdown); the first draw has no transition.
    const off = C * ringFraction(end, total, now);
    if (first) { arc.style.transition = "none"; arc.style.strokeDashoffset = `${off}`; requestAnimationFrame(() => { arc.style.transition = ""; }); first = false; }
    else arc.style.strokeDashoffset = `${off}`;
    el.classList.toggle("ending", rem > 0 && rem <= 5000);
    if (extra) extra(now);
    if (rem === 0 && !fired) {
      fired = true;
      if (endedLongAgo(end, now)) { if (onEnd) onEnd(); return; }
      beep({ long: true });
      showFlash("Go", 2000, flashSub).then(() => { if (onEnd) onEnd(); });
    }
  });
  return el;
}

// The number control for weights and reps: big rounded value between round − and + buttons. `next(value, direction)`
// can be given when the step changes with the value (dumbbell sizes). Tap the value to type it.
export function stepper({ label, unit, value, step = 1, next, min = 0, max = 999, decimals = 1, onChange }) {
  let v = value ?? 0;
  const fmt = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 10 ** decimals) / 10 ** decimals));
  const input = h("input", {
    type: "number", class: "step-input", inputmode: decimals ? "decimal" : "numeric", step: "any", value: fmt(v), "aria-label": label,
    oninput: (e) => { const n = parseFloat(e.target.value); if (Number.isFinite(n)) { v = n; onChange(v); } },
    onfocus: (e) => { try { e.target.select(); } catch { /* some inputs can not select */ } },
  });
  const set = (n) => {
    v = Math.min(max, Math.max(min, Math.round(n * 10 ** decimals) / 10 ** decimals));
    input.value = fmt(v);
    onChange(v);
    pop(input, 1.07);
  };
  const move = (dir) => set(next ? next(v, dir) : v + dir * step);
  return h("div", { class: "stepper-block" },
    h("div", { class: "label" }, label),
    h("div", { class: "stepper" },
      h("button", { class: "step-btn", type: "button", "aria-label": `Less ${label}`, onclick: () => move(-1) }, icon("minus", 24, { stroke: 2.6 })),
      h("div", { class: "step-value" }, input, unit ? h("span", { class: "unit" }, unit) : null),
      h("button", { class: "step-btn", type: "button", "aria-label": `More ${label}`, onclick: () => move(1) }, icon("plus", 24, { stroke: 2.6 }))));
}

// A row of choice buttons, one chosen. items: [[value, label]]. Used for effort 1 to 10 and "how many more".
export function choiceRow(items, selected, onPick, { columns = items.length } = {}) {
  const row = h("div", { class: "choice-row" },
    items.map(([value, label]) =>
      h("button", { class: "pick", type: "button", "aria-pressed": value === selected ? "true" : "false", onclick: (e) => { pop(e.currentTarget, 1.1); onPick(value); } }, label)));
  row.style.gridTemplateColumns = `repeat(${columns}, 1fr)`; // set by script: the page's CSP blocks style attributes
  return row;
}

// Coloured dot plus words, for status lines (never colour alone).
export function statusDot(kind) { return h("span", { class: `dot ${kind}`, "aria-hidden": "true" }); }
