// Version 0.7.4 (worker 8.41), part B refined (Training Agent, Rosario: "on diet how much did you have should allow me
// to change between weight or individual amounts so i can put 2 eggs instead of 125g of eggs"). Written BEFORE the
// change (tests first, a separate commit).
//
// "How much did you have?" gets a two-way switch, Grams | Pieces, for EVERY food. A food with no piece weight asks once
// "How much does 1 piece weigh? (g)" (1 to 2000 g); the weight is saved on the food (serving_g, with serving_label
// "piece" if there are no words) through the normal food save, so it syncs. Saved entries keep grams as the truth.
// The last mode per food is remembered on this phone only (device box, key food_amount_mode): no new synced field.
// All values are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as fmath from "../app/js/food/foodmath.js";
import { createFoodModel } from "../app/js/food/foodmodel.js";
import { validateFoodDoc } from "../app/js/food/foodvalidate.js";

const modes = await import("../app/js/food/foodmodes.js");
const src = (p) => readFileSync(new URL(`../app/${p}`, import.meta.url), "utf8").replaceAll("\r\n", "\n");
const egg = (over = {}) => ({ name: "Test egg", per100g: { kcal: 140, protein_g: 12, carbs_g: 1, fat_g: 10 }, source: "own", ...over });
function foodModel() {
  const map = new Map();
  const store = { load: () => map.get("d") ?? { format: 1, app: "training-food", foods: [], food_log: [] }, save: (d) => { map.set("d", JSON.parse(JSON.stringify(d))); return d; } };
  return { fm: createFoodModel(store, () => new Date("2026-01-26T12:00:00.000Z")), store };
}

test("P1 pieceOf: a piece weight of 1 to 2000 g; the words default to 'piece'; anything else is no piece weight", () => {
  assert.deepEqual(fmath.pieceOf(egg({ serving_g: 62.5, serving_label: "egg" })), { g: 62.5, label: "egg" });
  assert.deepEqual(fmath.pieceOf(egg({ serving_g: 62.5, serving_label: null })), { g: 62.5, label: "piece" });
  assert.deepEqual(fmath.pieceOf(egg({ serving_g: 30, serving_label: "  " })), { g: 30, label: "piece" });
  for (const g of [null, undefined, 0, 0.5, 2001, NaN, "60", -5]) assert.equal(fmath.pieceOf(egg({ serving_g: g, serving_label: "egg" })), null, String(g));
  assert.equal(fmath.pieceOf(null), null);
});

test("P2 checkPieceWeight: the typed weight of one piece, 1 to 2000 g, rounded to 0.1 g; refusals in plain words", () => {
  assert.deepEqual(fmath.checkPieceWeight("62.5"), { ok: true, g: 62.5 });
  assert.deepEqual(fmath.checkPieceWeight("62,5"), { ok: true, g: 62.5 }, "a comma works too");
  assert.deepEqual(fmath.checkPieceWeight(" 1 "), { ok: true, g: 1 });
  assert.deepEqual(fmath.checkPieceWeight("2000"), { ok: true, g: 2000 });
  assert.deepEqual(fmath.checkPieceWeight("62.54"), { ok: true, g: 62.5 });
  for (const bad of ["", "0.9", "2001", "abc", "-3", null, "Infinity"]) {
    const r = fmath.checkPieceWeight(bad);
    assert.equal(r.ok, false, String(bad));
    assert.match(r.reason, /1 to 2000 g/);
  }
});

test("P3 the conversion: 2 eggs of 62.5 g = 125 g; 125 g = 2 eggs; halves work; grams stay the truth", () => {
  assert.equal(fmath.gramsForCount(2, 62.5), 125);
  assert.equal(fmath.countForGrams(125, 62.5), 2);
  assert.equal(fmath.gramsForCount(1.5, 62.5), 93.8);
  assert.equal(fmath.countForGrams(100, 62.5), 1.6);
  assert.equal(fmath.piecesLine(2, 62.5), "= 125 g");
  assert.equal(fmath.piecesLine(1.5, 62.5), "= 93.8 g");
  assert.equal(fmath.piecesLine(0, 62.5), "");
});

test("P4 withPieceWeight: a new weight is saved as serving_g; the words stay when they still fit, else 'piece'", () => {
  assert.deepEqual(fmath.withPieceWeight(egg(), 60), { ...egg(), serving_g: 60, serving_label: "piece" });
  const named = fmath.withPieceWeight(egg({ serving_g: 55, serving_label: "egg" }), 60);
  assert.equal(named.serving_label, "egg", "words without a number still fit");
  const bar = fmath.withPieceWeight(egg({ serving_g: 30, serving_label: "1 bar (30 g)" }), 35);
  assert.equal(bar.serving_label, "piece", "the pack's words name the old weight: replaced");
  const same = fmath.withPieceWeight(egg({ serving_g: 30, serving_label: "1 bar (30 g)" }), 30);
  assert.equal(same.serving_label, "1 bar (30 g)", "same weight: words kept");
  assert.throws(() => fmath.withPieceWeight(egg(), 0.5), /1 to 2000 g/);
});

test("P5 a new piece weight is saved on the food through the normal save, the file check accepts it, the entry is grams", () => {
  const { fm, store } = foodModel();
  const r = fm.saveAndLog(fmath.withPieceWeight(egg(), 62.5), { date: "2026-01-26", meal: "breakfast", amount_g: fmath.gramsForCount(2, 62.5) });
  const food = store.load().foods.find((f) => f.id === r.entry.food);
  assert.equal(food.serving_g, 62.5);
  assert.equal(food.serving_label, "piece");
  assert.equal(r.entry.amount_g, 125);
  assert.equal(r.entry.servings, null, "no new saved field: grams are the truth");
  assert.equal(validateFoodDoc(store.load()).ok, true);
  // Next time: one tap. The weight can be changed later on the same sheet (same save path).
  fm.saveFood({ ...fmath.withPieceWeight(food, 60), id: food.id });
  assert.equal(store.load().foods.find((f) => f.id === food.id).serving_g, 60);
  assert.equal(store.load().foods.length, 1, "the same food, not a copy");
});

test("P6 the last mode per food is remembered on this phone only (device box), and the rest of the box is kept", () => {
  const id = "fo-20260126-abc123";
  assert.equal(modes.readMode(null, id), null);
  assert.equal(modes.readMode({}, id), null);
  const device = { token_note: "kept", sync: { a: 1 } };
  const next = modes.withMode(device, id, "pieces");
  assert.equal(modes.readMode(next, id), "pieces");
  assert.equal(next.token_note, "kept");
  assert.deepEqual(next.sync, { a: 1 });
  assert.equal(device.food_amount_mode, undefined, "the old box object is not changed in place");
  assert.equal(modes.readMode(modes.withMode(next, id, "grams"), id), "grams");
  assert.equal(modes.readMode(modes.withMode(next, "fb-4006381333931", "grams"), "fb-4006381333931"), "grams", "barcode foods too");
  assert.deepEqual(modes.withMode(next, id, "cups"), next, "an unknown mode is not saved");
  assert.deepEqual(modes.withMode(next, "../x", "grams"), next, "an odd id is not saved");
  assert.equal(modes.readMode({ food_amount_mode: { [id]: "cups" } }, id), null, "an odd saved value reads as nothing");
  assert.equal(modes.readMode({ food_amount_mode: "x" }, id), null);
  let box = {};
  for (let i = 0; i < modes.MAX_MODES + 20; i++) box = modes.withMode(box, `fo-20260126-a${String(i).padStart(5, "0")}`, "pieces");
  assert.equal(Object.keys(box.food_amount_mode).length, modes.MAX_MODES, "a capped list");
  assert.equal(modes.readMode(box, "fo-20260126-a00000"), null, "the oldest go first");
  assert.equal(modes.readMode(box, `fo-20260126-a${String(modes.MAX_MODES + 19).padStart(5, "0")}`), "pieces");
});

test("P7 the sheet opens in the mode used last; with no memory, Pieces when the food has a piece weight, else Grams", () => {
  assert.equal(modes.startMode(egg({ serving_g: 62.5 }), "grams"), "grams");
  assert.equal(modes.startMode(egg(), "pieces"), "pieces", "Pieces works for every food (it asks for the weight)");
  assert.equal(modes.startMode(egg({ serving_g: 62.5 }), null), "pieces");
  assert.equal(modes.startMode(egg(), null), "grams");
});

test("P8 the sheet: Grams | Pieces in the existing two-part switch, the one question, the live grams line, the phone-only memory", () => {
  const t = src("js/diet/sheets.js");
  assert.match(t, /class: "segmented two"/, "the existing segmented look (DESIGN), no new look");
  assert.match(t, /"Grams"/);
  assert.match(t, /"Pieces"/);
  assert.match(t, /How much does 1 piece weigh\? \(g\)/);
  assert.match(t, /checkPieceWeight\(/);
  assert.match(t, /withPieceWeight\(/);
  assert.match(t, /piecesLine\(/);
  assert.match(t, /readMode\(/);
  assert.match(t, /withMode\(/);
  assert.match(t, /store\.saveDevice\(/, "the memory goes in the device box, never in the synced food file");
  const code = t.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  assert.doesNotMatch(code, /innerHTML|outerHTML|insertAdjacentHTML/);
  assert.doesNotMatch(code, /\bstyle\s*[:=]/);
  assert.match(src("sw.js"), /"js\/food\/foodmodes\.js",/, "in the offline list");
});

// ---------- Browser check findings (worker 8.41, 2026-11-18) ----------
test("P9 the piece words read well; the weight box takes a comma (text box with the decimal keypad)", () => {
  assert.equal(fmath.pieceWords({ g: 62.5, label: "piece" }), "1 piece = 62.5 g");
  assert.equal(fmath.pieceWords({ g: 62.5, label: "egg" }), "1 egg = 62.5 g");
  assert.equal(fmath.pieceWords({ g: 30, label: "1 bar (30 g)" }), "1 bar (30 g)", "the pack's words already say one piece");
  assert.equal(fmath.pieceWords({ g: 25, label: "2 biscuits (25 g)" }), "1 piece = 25 g (2 biscuits (25 g))");
  const t = src("js/diet/sheets.js");
  assert.match(t, /pieceWords\(piece\)/);
  assert.match(t, /type: "text", inputmode: "decimal"[^\n]*"aria-label": "Weight of 1 piece"/, "a number box drops a typed comma");
});

// ---------- Review findings (auditor, 2026-11-18) ----------
test("P10 the phone box is read before the mode is written (the token, sync state and a running workout stay)", () => {
  const t = src("js/diet/sheets.js");
  const at = t.indexOf("function remember(");
  const body = t.slice(at, t.indexOf("\n  }", at));
  assert.match(body, /store\.saveDevice\(withMode\(device\(\), foodId, amountMode\)\)/, "built from the saved box, never from {}");
  assert.doesNotMatch(body, /withMode\(\{\}/);
  // The same with the real store: a food save's mode write keeps every other key.
  const map = new Map();
  const storage = { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
  return import("../app/js/store.js").then(({ createStore }) => {
    const store = createStore(storage);
    store.saveDevice({ token: "made-up", repo: "x", active: { session_id: "s-1" }, sound_on: false });
    store.saveDevice(modes.withMode(store.loadDevice(), "fo-20260126-abc123", "pieces"));
    const d = store.loadDevice();
    assert.deepEqual([d.token, d.repo, d.active.session_id, d.sound_on], ["made-up", "x", "s-1", false]);
    assert.equal(modes.readMode(d, "fo-20260126-abc123"), "pieces");
  });
});

test("P11 a count that would round to 0 starts at 1 piece; a serving named only in grams reads as '1 piece = 30 g'", () => {
  assert.deepEqual(fmath.piecesStart(125, 62.5), { count: 2, grams: 125 });
  assert.deepEqual(fmath.piecesStart(1, 2000), { count: 1, grams: 2000 }, "0.0005 pieces: start at 1 piece");
  assert.deepEqual(fmath.piecesStart(null, 62.5), { count: 1, grams: 62.5 });
  assert.equal(fmath.pieceWords({ g: 30, label: "30 g" }), "1 piece = 30 g");
  assert.equal(fmath.pieceWords({ g: 30, label: "30g" }), "1 piece = 30 g");
  assert.match(src("js/diet/sheets.js"), /piecesStart\(/);
});

test("P12 piecesStart keeps the count and the grams in step (100 g of a 30 g piece: 3.3 pieces = 99 g)", () => {
  assert.deepEqual(fmath.piecesStart(100, 30), { count: 3.3, grams: 99 });
});
