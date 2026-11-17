// Shared screen parts for builder B's prototype (8.29). Copied in spirit from app/js/ui/parts.js (sheet, toast,
// screen wrappers), plus the new 5-tab bar with Diet and the Settings gear. All text goes in through h(): never innerHTML.
import { h } from "./app/h.js";
import { icon } from "./app/icons.js";
import { reduced } from "./app/motion.js";

// The answer to the 6th-tab problem: Settings leaves the bar and becomes a gear at the top right of every tab screen.
export const TABS = [["today", "Today", "today"], ["diet", "Diet", "diet"], ["plan", "Plan", "plan"], ["gym", "Gym", "gym"], ["progress", "Progress", "progress"]];

let redraw = () => {};
export function setRedraw(fn) { redraw = fn; }
export function rerender() { redraw(); }
export function go(hash) { if (location.hash === hash) rerender(); else location.hash = hash; }

export function tabBar(active) {
  return h("nav", { class: "bar", "aria-label": "Main" },
    h("div", { class: "tabs" },
      TABS.map(([id, label, ic]) =>
        h("a", { class: "tab", href: `#/${id}`, "aria-current": id === active ? "page" : false }, icon(ic, 26, { strokeWidth: id === active ? 2.2 : 1.8 }), label))));
}

export function gearButton() {
  return h("a", { class: "gear", href: "#/settings", "aria-label": "Settings" }, icon("settings", 24, { strokeWidth: 1.9 }));
}

// Screen head: eyebrow + big title on the left, optional extra buttons and the gear on the right.
export function head(eyebrow, title, ...right) {
  return h("div", { class: "today-head b-head" },
    h("div", { class: "b-head-text" }, eyebrow ? h("span", { class: "eyebrow accent" }, eyebrow) : null, h("h1", {}, title)),
    h("div", { class: "b-head-right" }, ...right, gearButton()));
}

export function screen(...children) { return h("main", { class: "screen has-tabs" }, ...children); }
export function screenWithBar(...children) { return h("main", { class: "screen has-bar" }, ...children); }
export function tabActionBar(...buttons) { return h("div", { class: "bar action-bar" }, h("div", { class: "bar-inner" }, ...buttons)); }
export function mainButton(label, onclick, { disabled = false, cls = "" } = {}) {
  return h("button", { class: `button ${cls}`, type: "button", disabled, onclick }, label);
}
export function secondaryButton(label, onclick, cls = "") {
  return h("button", { class: `button secondary ${cls}`, type: "button", onclick }, label);
}

// Bottom sheet over a scrim (same as the app's openSheet). `opts.tall` makes it fill most of the screen.
export function openSheet(children, { tall = false, label = "Details", onClose = null } = {}) {
  closeSheets();
  let closing = false;
  const close = () => {
    if (closing) return;
    closing = true;
    if (onClose) onClose();
    const sheet = wrap.querySelector(".sheet");
    if (reduced() || !sheet || !sheet.animate) { wrap.remove(); return; }
    wrap.querySelector(".scrim")?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" });
    const a = sheet.animate([{ transform: "none" }, { transform: "translateY(100%)" }], { duration: 220, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" });
    a.onfinish = () => wrap.remove();
    setTimeout(() => wrap.remove(), 400);
  };
  const body = h("div", { class: "sheet-body" });
  const wrap = h("div", { class: "sheet-wrap", dataset: { sheet: "1" } },
    h("div", { class: "scrim", onclick: close }),
    h("div", { class: `sheet ${tall ? "tall" : ""}`, role: "dialog", "aria-modal": "true", "aria-label": label },
      h("div", { class: "sheet-head" }, h("button", { class: "text-button", type: "button", onclick: close, "aria-label": "Close" }, "Close")),
      body));
  const fill = (kids) => { body.replaceChildren(); for (const k of [kids].flat(Infinity)) if (k) body.append(k); wrap.querySelector(".sheet").scrollTop = 0; };
  fill(children);
  document.body.append(wrap);
  return { close, fill, el: wrap };
}
export function closeSheets() { document.querySelectorAll("[data-sheet]").forEach((el) => el.remove()); }

// A short message at the bottom with an optional Undo. Goes away by itself.
let toastTimer = null;
export function toast(text, undo = null, ms = 5000) {
  document.querySelectorAll(".b-toast").forEach((el) => el.remove());
  const el = h("div", { class: "b-toast", role: "status" },
    h("span", { class: "grow" }, text),
    undo ? h("button", { class: "text-button", type: "button", onclick: () => { el.remove(); undo(); } }, "Undo") : null);
  document.body.append(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), ms);
}

// A choice row (segmented control). items: [[value, label]].
export function segmented(items, current, onPick, label) {
  const el = h("div", { class: "segmented", role: "tablist", "aria-label": label },
    items.map(([value, text]) => h("button", { type: "button", role: "tab", "aria-selected": value === current ? "true" : "false", onclick: () => onPick(value) }, text)));
  el.style.gridTemplateColumns = `repeat(${items.length}, 1fr)`;
  return el;
}

export function pill(text, cls = "") { return h("span", { class: `b-pill ${cls}` }, text); }

// Numbers: "1,420".
export const fmt = (n, d = 0) => Number(n).toLocaleString("en-GB", { maximumFractionDigits: d, minimumFractionDigits: 0 });
