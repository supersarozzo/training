// Version 0.7.4 (worker 8.41): the food sheet's Grams | Pieces, driven through the real openCheck with a fake page
// (both reviewers: no test drove the sheet itself). Written before the fixes (tests first). All values are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { install, byText } from "./fixtures/sheet-dom.mjs";

const { body } = install();
const S = await import("../app/js/diet/sheets.js");
const { food: fm } = await import("../app/js/diet/foodapp.js");
const { store } = await import("../app/js/ui/app.js");
const sheet = () => body.querySelector("[data-sheet]");
const inputVal = (label) => sheet().querySelector(`[aria-label="${label}"]`)?.value;
const mainText = () => sheet().querySelector(".btn-main").textContent;
const lineText = () => sheet().querySelectorAll("p").map((p) => p.textContent).find((t) => t.startsWith("= ")) ?? "";
const tab = () => sheet().querySelectorAll("[role]").filter((n) => n.getAttribute("aria-selected") === "true").map((n) => n.textContent).join();
const tap = (text) => byText(sheet(), "button", text).click();
const closeAll = () => { while (sheet()) { const c = byText(sheet(), "button", "Close"); if (!c) break; c.click(); sheet()?.remove(); } };
const typeNumbers = () => { for (const [lab, v] of [["Calories (kcal)", "140"], ["Protein (g)", "12"], ["Carbs (g)", "1"], ["Fat (g)", "10"]]) sheet().querySelector(`[aria-label="${lab}"]`).input(v); };

store.saveDevice({ token: "made-up", repo: "x", sound_on: false });

test("S1 a new food: Pieces asks for the weight, 62,5 works, 2 pieces = 125 g; the weight is saved on the food and the mode on the phone", () => {
  S.openCheck({ mode: "own", prefill: { name: "Test egg" } });
  typeNumbers();
  tap("Pieces");
  assert.equal(tab(), "Pieces");
  sheet().querySelector('[aria-label="Weight of 1 piece"]').value = "62,5";
  tap("Use this weight");
  assert.equal(inputVal("Pieces"), "1");
  sheet().querySelector('[aria-label="More Pieces"]').click();
  assert.equal(lineText(), "= 125 g");
  assert.match(mainText(), /125 g/);
  sheet().querySelector(".btn-main").parent.click();
  const doc = fm.doc();
  const egg = doc.foods.find((f) => f.name === "Test egg");
  assert.equal(egg.serving_g, 62.5, "the typed weight reaches the saved food");
  assert.equal(egg.serving_label, "piece");
  const entry = doc.food_log.at(-1);
  assert.deepEqual([entry.amount_g, entry.servings], [125, null]);
  const dev = store.loadDevice();
  assert.equal(dev.food_amount_mode[egg.id], "pieces");
  assert.deepEqual([dev.token, dev.repo, dev.sound_on], ["made-up", "x", false], "the rest of the phone box stays");
  closeAll();
  S.openCheck({ mode: "saved", food: egg });
  assert.equal(tab(), "Pieces", "opens in the mode used last");
  assert.equal(inputVal("Pieces"), "1", "one tap next time");
  closeAll();
});

test("S2 Close saves nothing: a typed weight on a saved food is dropped when the sheet is closed", () => {
  const rice = fm.saveFood({ name: "Test rice", per100g: { kcal: 130, protein_g: 3, carbs_g: 28, fat_g: 0 }, source: "own" });
  S.openCheck({ mode: "saved", food: rice });
  assert.equal(tab(), "Grams", "no piece weight and no memory: Grams");
  tap("Pieces");
  sheet().querySelector('[aria-label="Weight of 1 piece"]').value = "40";
  tap("Use this weight");
  closeAll();
  assert.equal(fm.doc().foods.find((f) => f.id === rice.id).serving_g, null);
});

test("S3 switching keeps the amount; the count and the saved grams always agree (100 g of a 30 g piece = 3.3 pieces = 99 g)", () => {
  const bar = fm.saveFood({ name: "Test bar", per100g: { kcal: 400, protein_g: 10, carbs_g: 60, fat_g: 12 }, serving_g: 30, serving_label: "1 bar (30 g)", source: "own" });
  S.openCheck({ mode: "saved", food: bar });
  tap("Grams");
  sheet().querySelector('[aria-label="Portion"]').input("100");
  tap("Pieces");
  assert.equal(inputVal("Pieces"), "3.3");
  assert.equal(lineText(), "= 99 g");
  assert.match(mainText(), /99 g/, "the button saves what the line says");
  tap("Grams");
  assert.equal(inputVal("Portion"), "99");
  closeAll();
});

test("S4 changing the piece weight keeps the count: 2 eggs, then 1 piece = 60 g, gives 2 pieces = 120 g", () => {
  const egg = fm.doc().foods.find((f) => f.name === "Test egg");
  S.openCheck({ mode: "saved", food: egg });
  sheet().querySelector('[aria-label="More Pieces"]').click();
  assert.equal(inputVal("Pieces"), "2");
  tap("· Change");
  sheet().querySelector('[aria-label="Weight of 1 piece"]').value = "60";
  tap("Use this weight");
  assert.equal(inputVal("Pieces"), "2");
  assert.equal(lineText(), "= 120 g");
  closeAll();
});
