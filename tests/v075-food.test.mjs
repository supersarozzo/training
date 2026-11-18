// Version 0.7.5 (worker 8.42): two food sheet fixes from Rosario (Training Agent, 2026-11-18, iPhone screenshots of 0.7.4).
// Written BEFORE the change (tests first, a separate commit). All foods are made up.
//
// F1 (bug): Pieces used the WHOLE serving as 1 piece. A food saved with serving_g 125 and serving_label "4 bites" showed
//    "1 piece = 125 g (4 bites)", so 4 pieces = 500 g. Rosario: "Pieces say 31g in the description but then 1 piece shows
//    up as 125g so that is wrong". Now: a label that starts with a count N > 1 ("4 bites", "2 eggs", "about 2 hash
//    browns") gives 1 piece = serving_g / N, named by the single unit ("1 bite = 31.3 g"). A label without a count, with
//    count 1 ("1 teaspoon") or a weight ("100 g") stays as before. A weight typed with Change always wins. Foods already
//    saved show the right weight with no data change. Grams stay the truth in the log.
// F2 (layout): the "Your food" sheet (also the scanned-food sheet) shows "How much did you have?", Meal and the two Save
//    buttons first; name, brand and barcode, Per 100 g and the numbers check move under them. Every field and check stays.
import test from "node:test";
import assert from "node:assert/strict";
import { install, byText } from "./fixtures/sheet-dom.mjs";
import * as fmath from "../app/js/food/foodmath.js";

const { body } = install();
const S = await import("../app/js/diet/sheets.js");
const { food: fm } = await import("../app/js/diet/foodapp.js");
const { store } = await import("../app/js/ui/app.js");
const sheet = () => body.querySelector("[data-sheet]");
const inputVal = (label) => sheet().querySelector(`[aria-label="${label}"]`)?.value;
const mainText = () => sheet().querySelector(".btn-main").textContent;
const tap = (text) => byText(sheet(), "button", text).click();
const closeAll = () => { while (sheet()) { const c = byText(sheet(), "button", "Close"); if (!c) break; c.click(); sheet()?.remove(); } };
const per100g = { kcal: 170, protein_g: 14, carbs_g: 8, fat_g: 9 };
const bites = () => ({ name: "Test chicken-style bites (1 bite = 31 g)", per100g, serving_g: 125, serving_label: "4 bites", source: "off", barcode: "5000000000005" });

store.saveDevice({ token: "made-up", repo: "x" });

// ---------- F1: the weight of one piece ----------

test("F1-1 '4 bites' of 125 g: 1 piece = 31.25 g named 'bite'; 4 pieces = 125 g, not 500 g", () => {
  const p = fmath.pieceOf(bites());
  assert.deepEqual(p, { g: 31.25, label: "bite" });
  assert.equal(fmath.pieceWords(p), "1 bite = 31.3 g");
  assert.equal(fmath.gramsForCount(4, p.g), 125);
  assert.equal(fmath.piecesLine(4, p.g), "= 125 g");
});

test("F1-2 other counts: '2 eggs', '2 sausages', 'about 2 hash browns', a pack's '2 biscuits (25 g)'", () => {
  assert.deepEqual(fmath.pieceOf({ serving_g: 120, serving_label: "2 eggs" }), { g: 60, label: "egg" });
  assert.deepEqual(fmath.pieceOf({ serving_g: 90, serving_label: "2 sausages" }), { g: 45, label: "sausage" });
  assert.deepEqual(fmath.pieceOf({ serving_g: 100, serving_label: "about 2 hash browns" }), { g: 50, label: "hash brown" });
  assert.deepEqual(fmath.pieceOf({ serving_g: 25, serving_label: "2 biscuits (25 g)" }), { g: 12.5, label: "biscuit" });
  assert.equal(fmath.pieceWords(fmath.pieceOf({ serving_g: 100, serving_label: "about 2 hash browns" })), "1 hash brown = 50 g");
});

test("F1-3 no count, count 1, or a weight: as before (the whole serving is 1 piece)", () => {
  assert.deepEqual(fmath.pieceOf({ serving_g: 5, serving_label: "1 teaspoon" }), { g: 5, label: "1 teaspoon" });
  assert.deepEqual(fmath.pieceOf({ serving_g: 100, serving_label: "100 g" }), { g: 100, label: "100 g" });
  assert.deepEqual(fmath.pieceOf({ serving_g: 100, serving_label: "100g" }), { g: 100, label: "100g" });
  assert.deepEqual(fmath.pieceOf({ serving_g: 250, serving_label: "250 ml" }), { g: 250, label: "250 ml" });
  assert.deepEqual(fmath.pieceOf({ serving_g: 62.5, serving_label: "egg" }), { g: 62.5, label: "egg" });
  assert.deepEqual(fmath.pieceOf({ serving_g: 30, serving_label: "1 bar (30 g)" }), { g: 30, label: "1 bar (30 g)" });
  assert.deepEqual(fmath.pieceOf({ serving_g: 30, serving_label: "" }), { g: 30, label: "piece" });
  assert.equal(fmath.pieceWords(fmath.pieceOf({ serving_g: 5, serving_label: "1 teaspoon" })), "1 teaspoon");
  assert.equal(fmath.pieceWords(fmath.pieceOf({ serving_g: 100, serving_label: "100 g" })), "1 piece = 100 g");
  // A piece under 1 g would be refused, so a count that gives one is not used.
  assert.deepEqual(fmath.pieceOf({ serving_g: 3, serving_label: "6 drops" }), { g: 3, label: "6 drops" });
});

test("F1-4 a weight typed with Change always wins, also when it equals the whole serving", () => {
  assert.deepEqual(fmath.pieceOf(fmath.withPieceWeight(bites(), 31)), { g: 31, label: "bite" });
  assert.deepEqual(fmath.pieceOf(fmath.withPieceWeight(bites(), 125)), { g: 125, label: "bite" }, "typed 125: 1 piece = 125 g");
  assert.deepEqual(fmath.pieceOf(fmath.withPieceWeight({ serving_g: 5, serving_label: "1 teaspoon" }, 5)), { g: 5, label: "1 teaspoon" });
  assert.deepEqual(fmath.pieceOf(fmath.withPieceWeight({ serving_g: 62.5, serving_label: "egg" }, 60)), { g: 60, label: "egg" });
});

test("F1-5 the saved food on the sheet: '1 bite = 31.3 g · Change', 4 pieces saves 125 g; the food itself is not changed", () => {
  const food = fm.saveFood(bites());
  S.openCheck({ mode: "saved", food });
  tap("Pieces");
  assert.ok(byText(sheet(), "button", "1 bite = 31.3 g · Change"), "the Change line names one bite");
  assert.equal(inputVal("Pieces"), "4", "the 125 g serving starts as 4 pieces");
  assert.match(mainText(), /125 g/);
  sheet().querySelector(".btn-main").parent.click();
  const saved = fm.doc().foods.find((f) => f.id === food.id);
  assert.deepEqual([saved.serving_g, saved.serving_label], [125, "4 bites"], "no data change");
  const entry = fm.doc().food_log.at(-1);
  assert.deepEqual([entry.amount_g, entry.servings], [125, null], "grams stay the truth");
  closeAll();
});

// ---------- F2: amount, meal and Save first; details under ----------

function order(mode, arg) {
  S.openCheck({ mode, ...arg });
  const nodes = [...sheet().walk()];
  const at = (n) => { assert.ok(n, "element exists"); return nodes.indexOf(n); };
  const h3 = (t) => sheet().querySelectorAll("h3").find((n) => n.textContent === t);
  const pos = {
    amount: at(h3("How much did you have?")),
    meal: at(sheet().querySelectorAll("div").find((n) => n.textContent === "Meal" && n.classList.contains("label"))),
    save: at(sheet().querySelector(".btn-main")),
    second: at(byText(sheet(), "button", "Save without adding")),
    name: at(sheet().querySelector('[maxlength="120"]')),
    per100: at(h3("Per 100 g")),
    kcal: at(sheet().querySelector('[aria-label="Calories (kcal)"]')),
    check: at(sheet().querySelector(".check-result")),
    close: at(byText(sheet(), "button", "Close")),
  };
  closeAll();
  return pos;
}

test("F2-1 'Your food' (saved): How much, Meal, Save and add, Save without adding first; then name, Per 100 g, the check", () => {
  const food = fm.saveFood({ ...bites(), name: "Test layout bites", barcode: undefined });
  const p = order("saved", { food });
  assert.ok(p.amount < p.meal && p.meal < p.save && p.save < p.second, "amount, meal, save");
  assert.ok(p.second < p.name && p.name < p.per100 && p.per100 < p.kcal && p.kcal < p.check, "details under");
});

test("F2-2 the scanned-food sheet (Open Food Facts) has the same order and keeps its warning and credit", () => {
  const product = { name: "Test scanned bites", brand: "Test brand", quantity: "250 g", barcode: "5000000000012", per100g, serving_g: 125, serving_label: "4 bites", source: "off", off_fetched_at: "2026-11-18T10:00:00.000Z" };
  S.openCheck({ mode: "off", product });
  const text = sheet().textContent;
  assert.match(text, /numbers can be wrong/);
  assert.match(text, /Test brand · 250 g · 5000000000012/);
  assert.match(text, /Open Food Facts/);
  closeAll();
  const p = order("off", { product });
  assert.ok(p.amount < p.meal && p.meal < p.save && p.save < p.second);
  assert.ok(p.second < p.name && p.name < p.per100 && p.per100 < p.check);
});

test("F2-3 every field and button is still on the sheet; Close still works", () => {
  const food = fm.saveFood({ ...bites(), name: "Test fields bites", barcode: undefined });
  S.openCheck({ mode: "saved", food });
  for (const lab of ["Calories (kcal)", "Protein (g)", "Carbs (g)", "Fat (g)"]) assert.ok(sheet().querySelector(`[aria-label="${lab}"]`), lab);
  assert.equal(sheet().querySelector('[maxlength="120"]').value, "Test fields bites");
  for (const t of ["Grams", "Pieces", "Save and add", "Save without adding", "Close"]) assert.ok(byText(sheet(), "button", t), t);
  closeAll();
  assert.equal(sheet(), null);
});
