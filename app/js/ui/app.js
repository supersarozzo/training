// Shared handles for the screens: the store, the model and a redraw hook.
import { createStore } from "../store.js";
import { createModel } from "../model.js";
import { now } from "../clock.js";
import { withSaveSignal, noteSaved } from "../autosync.js";

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

// Two handles on the same box (0.7.2, automatic sync): the syncer saves its merge results through the plain one;
// everything else saves through `store`, whose saves start the automatic sync's quiet time (autosync.js).
export const syncStore = createStore(pickStorage());
export const store = withSaveSignal(syncStore, noteSaved);
export const model = createModel(store, now);

let redraw = () => {};
export function setRedraw(fn) { redraw = fn; }
export function rerender() { redraw(); }
export function go(hash) {
  if (location.hash === hash) rerender();
  else location.hash = hash;
}
