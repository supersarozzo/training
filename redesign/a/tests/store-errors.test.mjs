// Review finding F2 (docs/REVIEW-2026-11-16.md): when the phone can not save (storage full or blocked), the tap
// used to do nothing and say nothing. ARCHITECTURE section 6 asks for "Phone storage full. Download a backup".
// The page listens for storage errors that no screen caught and shows them. All values are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { createStore, StoreError } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { storeErrorText, watchStoreErrors } from "../app/js/errors.js";
import { fakeStorage, intake } from "./fixtures/profiles.mjs";

test("a full phone gives the plain 'storage full' text; other errors give none", () => {
  const full = new StoreError("full", "Phone storage full. Download a backup, then tell the Training chat.");
  assert.match(storeErrorText(full), /not saved/i);
  assert.match(storeErrorText(full), /Phone storage full/);
  assert.match(storeErrorText(new StoreError("unavailable", "This browser blocks storage. The app can not save your data.")), /blocks storage/);
  assert.equal(storeErrorText(new Error("some bug")), null);
  assert.equal(storeErrorText(undefined), null);
});

test("a set saved on a full phone throws a storage error (so the page can show it)", () => {
  const store = createStore(fakeStorage(4000));
  const model = createModel(store, () => new Date("2026-03-02T09:00:00.000Z"));
  model.setProfile(intake());
  const s = model.startSession({ planDay: "mon", week: 2, kind: "full", slots: [{ slot: "A1", ex: "chest_press" }] });
  let caught = null;
  try { for (let i = 0; i < 200; i++) model.logSet(s.id, "A1", { type: "work", weight_kg: 20, reps: 10 }); } catch (e) { caught = e; }
  assert.ok(caught, "the phone should fill up");
  assert.match(storeErrorText(caught), /Phone storage full/);
});

test("an uncaught storage error in a tap (error event) or a promise (unhandledrejection) is shown once", () => {
  const win = new EventTarget();
  const shown = [];
  watchStoreErrors(win, (text) => shown.push(text));
  const tap = new Event("error", { cancelable: true });
  tap.error = new StoreError("full", "Phone storage full. Download a backup, then tell the Training chat.");
  win.dispatchEvent(tap);
  const later = new Event("unhandledrejection", { cancelable: true });
  later.reason = new StoreError("unavailable", "This browser blocks storage. The app can not save your data.");
  win.dispatchEvent(later);
  assert.equal(shown.length, 2);
  assert.match(shown[0], /Phone storage full/);
  assert.match(shown[1], /blocks storage/);
  assert.equal(tap.defaultPrevented, true);
});

test("other errors are left alone (no message for a normal bug)", () => {
  const win = new EventTarget();
  const shown = [];
  watchStoreErrors(win, (text) => shown.push(text));
  const e = new Event("error", { cancelable: true });
  e.error = new TypeError("x is undefined");
  win.dispatchEvent(e);
  assert.equal(shown.length, 0);
  assert.equal(e.defaultPrevented, false);
});
