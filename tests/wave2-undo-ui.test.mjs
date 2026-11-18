// Wave 2 (build step 4): the Undo toast of the Plan tab really puts the day back (data safety of edits made from the
// screen). Drives app/js/ui/planedit.js on a small pretend page (tests/fixtures/fake-dom.mjs) with a pretend storage.
// This is the mistake the auditor's calibration planted (the day copied AFTER the edit, so Undo saved the edit again):
// the model tests cannot see it, this test can. All values are made up. No body data.
import test from "node:test";
import assert from "node:assert/strict";
import { installFakeDom } from "./fixtures/fake-dom.mjs";
import { validDoc, fakeStorage } from "./fixtures/profiles.mjs";

installFakeDom();
const storage = fakeStorage();
globalThis.window = { addEventListener: () => {}, localStorage: storage, matchMedia: () => ({ matches: true, addEventListener: () => {} }) };
const body = new Node("body");
body.querySelector = () => null;
document.body = body;
document.querySelectorAll = () => [];
globalThis.location = { hash: "#/plan" };
// Elements need remove() for the toast and the sheets.
Node.prototype.remove = function remove() { body.childNodes = body.childNodes.filter((x) => x !== this); };
Node.prototype.querySelector = function querySelector() { return null; };
Node.prototype.querySelectorAll = function querySelectorAll() { return []; };

const { store, model } = await import("../app/js/ui/app.js");
const pe = await import("../app/js/ui/planedit.js");
const { days } = await import("../app/js/plan/plan-v2.js");

const plain = () => days.tue.slots.map(({ slot, ex, sets, rest }) => ({ slot, ex, sets, rest }));
const all = (n, out = []) => { out.push(n); for (const c of n.childNodes ?? []) all(c, out); return out; };
const text = (n) => all(n).filter((x) => x.tagName === "#TEXT").map((x) => x.textContent).join("");
function undoButton() {
  const toast = body.childNodes.find((n) => n.className && n.className.includes("undo-toast"));
  assert.ok(toast, "an Undo toast is shown");
  return { toast, button: all(toast).find((n) => n.tagName === "BUTTON" && text(n) === "Undo") };
}
const fresh = () => { body.childNodes = []; store.save(validDoc()); };

test("U1 Remove from the Plan tab, then Undo in the toast: the plan's day is back, no edit left", () => {
  fresh();
  pe.removeSlot("tue", "A1");
  assert.equal(model.effectivePlanDay("tue").edited, true);
  const { toast, button } = undoButton();
  assert.match(text(toast), /^Removed .+ from Tuesday\./);
  button.click();
  assert.equal(model.effectivePlanDay("tue").edited, false);
  assert.deepEqual(model.effectivePlanDay("tue").slots, plain());
});

test("U2 two edits, Undo the second: the first stays", () => {
  fresh();
  model.swapPlanSlot("tue", "A1", "goblet_squat");
  const afterFirst = model.effectivePlanDay("tue").slots;
  pe.removeSlot("tue", "B1");
  undoButton().button.click();
  assert.deepEqual(model.effectivePlanDay("tue").slots, afterFirst);
});

test("U3 a refused edit (the last exercise) shows the message and saves nothing", () => {
  fresh();
  const one = [{ slot: "A1", ex: "leg_press", sets: 3, rest: 90 }];
  model.savePlanDay("tue", one);
  const before = JSON.stringify(store.load().plan_days);
  pe.removeSlot("tue", "A1");
  assert.equal(JSON.stringify(store.load().plan_days), before);
  assert.ok(!body.childNodes.some((n) => n.className && n.className.includes("undo-toast")), "no Undo toast for a refused edit");
  assert.ok(body.childNodes.some((n) => /at least one exercise/.test(text(n))), "the plain-words message is shown");
});
