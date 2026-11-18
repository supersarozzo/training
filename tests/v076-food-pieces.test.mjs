// Version 0.7.6 (worker 8.43): food P1 from the Training Agent (Rosario, 2026-11-18: "minihashbrowns was 8 pieces for 30
// grams"). A serving named only by its weight in grams ("30 g", "100g", "25 gr") or with no words says nothing about
// pieces, so Pieces asks "How much does 1 piece weigh? (g)" instead of taking the whole serving as one piece.
// Counted labels ("4 bites", "2 eggs"), "1 teaspoon"-style labels and a weight typed with Change work as in 0.7.5.
// Saved foods need no data change. Written BEFORE the change (tests first). All foods and values are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { install, byText } from "./fixtures/sheet-dom.mjs";
import * as fmath from "../app/js/food/foodmath.js";
import * as modes from "../app/js/food/foodmodes.js";

const { body } = install();
globalThis.location.hash = "#/diet";
globalThis.requestAnimationFrame = () => 0;
await import("../app/js/ui/app.js");
const S = await import("../app/js/diet/sheets.js");
const { food: fm } = await import("../app/js/diet/foodapp.js");
const per100g = { kcal: 200, protein_g: 3, carbs_g: 25, fat_g: 9 };
const sheet = () => body.querySelector("[data-sheet]");
const tap = (text) => byText(sheet(), "button", text).click();
const closeAll = () => { for (const s of body.querySelectorAll("[data-sheet]")) s.remove(); };

test("PW-1 a serving named only in grams is no piece weight: '30 g', '100 g', '25 g', '100g', '25 gr', '50 g.', '30 Gramm'", () => {
  for (const [label, g] of [["30 g", 30], ["100 g", 100], ["25 g", 25], ["100g", 100], ["25 gr", 25], ["50 g.", 50], ["30 Gramm", 30], ["40 grammes", 40], ["12,5 g", 12.5]]) {
    assert.equal(fmath.pieceOf({ serving_g: g, serving_label: label }), null, label);
  }
});

test("PW-2 no words is no piece weight: empty, spaces, null, missing", () => {
  for (const label of ["", "   ", null, undefined]) assert.equal(fmath.pieceOf({ serving_g: 30, serving_label: label }), null, String(label));
});

test("PW-3 counted, '1 teaspoon'-style, named and other labels keep working as in 0.7.5", () => {
  assert.deepEqual(fmath.pieceOf({ serving_g: 125, serving_label: "4 bites" }), { g: 31.25, label: "bite" });
  assert.deepEqual(fmath.pieceOf({ serving_g: 120, serving_label: "2 eggs" }), { g: 60, label: "egg" });
  assert.deepEqual(fmath.pieceOf({ serving_g: 30, serving_label: "8 pieces" }), { g: 3.75, label: "piece" });
  assert.deepEqual(fmath.pieceOf({ serving_g: 5, serving_label: "1 teaspoon" }), { g: 5, label: "1 teaspoon" });
  assert.deepEqual(fmath.pieceOf({ serving_g: 62.5, serving_label: "egg" }), { g: 62.5, label: "egg" });
  assert.deepEqual(fmath.pieceOf({ serving_g: 60, serving_label: "piece" }), { g: 60, label: "piece" });
  assert.deepEqual(fmath.pieceOf({ serving_g: 30, serving_label: "1 bar (30 g)" }), { g: 30, label: "1 bar (30 g)" });
  assert.deepEqual(fmath.pieceOf({ serving_g: 30, serving_label: "30 g serving" }), { g: 30, label: "30 g serving" }, "more words than a weight: as before");
  assert.deepEqual(fmath.pieceOf({ serving_g: 250, serving_label: "250 ml" }), { g: 250, label: "250 ml" }, "a volume: as before");
});

test("PW-4 a weight typed with Change wins on a grams-only or empty label, also when it equals the serving", () => {
  for (const label of ["30 g", "", null]) {
    assert.deepEqual(fmath.pieceOf(fmath.withPieceWeight({ serving_g: 30, serving_label: label }, 3.75)), { g: 3.75, label: "piece" }, String(label));
    assert.deepEqual(fmath.pieceOf(fmath.withPieceWeight({ serving_g: 30, serving_label: label }, 30)), { g: 30, label: "piece" }, `${label}: typed the same 30 g`);
  }
  assert.deepEqual(fmath.pieceOf(fmath.withPieceWeight({ serving_g: 125, serving_label: "4 bites" }, 31)), { g: 31, label: "bite" }, "as in 0.7.5");
});

test("PW-5 the sheet: a '30 g' food opens in Grams; Pieces asks the weight of 1 piece, with no guess filled in", () => {
  const food = fm.saveFood({ name: "Test mini rounds PW5", per100g, serving_g: 30, serving_label: "30 g", source: "own" });
  assert.equal(modes.startMode(food, null), "grams", "no piece weight: Grams first");
  S.openCheck({ mode: "saved", food });
  tap("Pieces");
  const input = sheet().querySelector('[aria-label="Weight of 1 piece"]');
  assert.ok(input, "the ask view");
  assert.equal(input.value, "", "no guess from the whole serving");
  assert.ok(byText(sheet(), "label", "How much does 1 piece weigh? (g)") || /How much does 1 piece weigh\? \(g\)/.test(sheet().textContent));
  assert.ok(!/1 piece = 30 g/.test(sheet().textContent), "never '1 piece = 30 g'");
  assert.ok(!byText(sheet(), "button", "Keep the old weight"), "there is no old weight");
  input.input("3,75");
  tap("Use this weight");
  assert.match(sheet().textContent, /1 piece = 3\.8 g · Change/);
  tap("Save without adding");
  const saved = fm.doc().foods.find((f) => f.id === food.id);
  assert.deepEqual([saved.serving_g, saved.serving_label], [3.8, "piece"], "the typed weight is saved through the normal save");
  closeAll();
});

test("PW-6 saved foods need no data change: a counted food still opens in Pieces with its piece", () => {
  const food = fm.saveFood({ name: "Test bites PW6", per100g, serving_g: 125, serving_label: "4 bites", source: "own" });
  assert.equal(modes.startMode(food, null), "pieces");
  S.openCheck({ mode: "saved", food });
  assert.match(sheet().textContent, /1 bite = 31\.3 g · Change/);
  closeAll();
});
