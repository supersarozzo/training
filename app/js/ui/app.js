// Shared handles for the screens: the store, the model and a redraw hook.
import { createStore } from "../store.js";
import { createModel } from "../model.js";
import { now } from "../clock.js";

function pickStorage() {
  try {
    const s = window.localStorage;
    s.getItem("trn.probe");
    return s;
  } catch {
    const blocked = () => { throw new Error("blocked"); };
    return { getItem: blocked, setItem: blocked, removeItem: blocked };
  }
}

export const store = createStore(pickStorage());
export const model = createModel(store, now);

let redraw = () => {};
export function setRedraw(fn) { redraw = fn; }
export function rerender() { redraw(); }
export function go(hash) {
  if (location.hash === hash) rerender();
  else location.hash = hash;
}
