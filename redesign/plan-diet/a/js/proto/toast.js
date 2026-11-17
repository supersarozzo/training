// PROTOTYPE 8.28 (builder A). A short message just above the bottom bar (in the thumb zone), with an optional Undo.
// It goes away by itself after 8 seconds. Text only through h().
import { h } from "../h.js";

let current = null;
export function undoToast(text, onUndo = null, ms = 8000) {
  if (current) current.remove();
  const el = h("div", { class: "undo-toast", role: "status" },
    h("span", { class: "grow" }, text),
    onUndo ? h("button", { class: "text-button", type: "button", onclick: () => { el.remove(); current = null; onUndo(); } }, "Undo") : null);
  document.body.append(el);
  current = el;
  setTimeout(() => { if (current === el) { el.remove(); current = null; } }, ms);
  return el;
}
export function clearToast() { if (current) { current.remove(); current = null; } }
