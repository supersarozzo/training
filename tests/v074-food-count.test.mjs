// Version 0.7.4 (worker 8.41), part B: the food "how many" counter (Rosario to the trainer: "how many or how much
// grams ... every item i scan gets added to the list"). Written BEFORE the change (tests first, a separate commit).
//
// On the check step ("Your food", a scanned product, a new food), when the food has a serving (serving_g and
// serving_label), a count stepper (1, 2, 3 ...) sits next to the grams: grams = count x serving_g. Grams still work as
// before, and changing either one updates the other. Saved entries keep grams as the truth: no new saved field
// (food_log.servings stays null, as in 0.7.0). All values are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as fmath from "../app/js/food/foodmath.js";
import { createFoodModel } from "../app/js/food/foodmodel.js";

const src = (p) => readFileSync(new URL(`../app/${p}`, import.meta.url), "utf8").replaceAll("\r\n", "\n");

test("F1 servingOf: a usable serving needs grams (above 0, at most 2000) and words; else null (grams only, as before)", () => {
  assert.deepEqual(fmath.servingOf({ serving_g: 30, serving_label: "1 bar (30 g)" }), { g: 30, label: "1 bar (30 g)" });
  for (const f of [{}, { serving_g: 30 }, { serving_g: 30, serving_label: "" }, { serving_g: 30, serving_label: "   " },
    { serving_g: 0, serving_label: "1 bar" }, { serving_g: -5, serving_label: "1 bar" }, { serving_g: NaN, serving_label: "x" },
    { serving_g: "30", serving_label: "1 bar" }, { serving_g: 30, serving_label: 7 }, null, undefined]) {
    assert.equal(fmath.servingOf(f), null, JSON.stringify(f));
  }
});

test("F2 grams = count x serving, rounded to 0.1 g; count from grams, rounded to 0.1", () => {
  assert.equal(fmath.gramsForCount(2, 30), 60);
  assert.equal(fmath.gramsForCount(3, 12.5), 37.5);
  assert.equal(fmath.gramsForCount(1, 33.3), 33.3);
  assert.equal(fmath.gramsForCount(3, 33.3), 99.9);
  assert.equal(fmath.countForGrams(60, 30), 2);
  assert.equal(fmath.countForGrams(45, 30), 1.5);
  assert.equal(fmath.countForGrams(100, 30), 3.3);
  for (const bad of [0, -1, NaN, Infinity, null, "2"]) {
    assert.equal(fmath.gramsForCount(bad, 30), null, String(bad));
    assert.equal(fmath.countForGrams(bad, 30), null, String(bad));
  }
  assert.equal(fmath.gramsForCount(2, 0), null);
  assert.equal(fmath.countForGrams(60, 0), null);
});

test("F3 the count steps by whole servings: up to the next whole number, down to the one before, never below 1", () => {
  assert.equal(fmath.stepCount(1, 1), 2);
  assert.equal(fmath.stepCount(2, -1), 1);
  assert.equal(fmath.stepCount(1, -1), 1, "never below 1 by the minus button");
  assert.equal(fmath.stepCount(1.5, 1), 2);
  assert.equal(fmath.stepCount(1.5, -1), 1);
  assert.equal(fmath.stepCount(3.3, 1), 4);
  assert.equal(fmath.stepCount(3.3, -1), 3);
  assert.equal(fmath.stepCount(0.5, 1), 1);
  assert.equal(fmath.stepCount(0.5, -1), 0.5, "under 1 the minus button changes nothing");
  assert.equal(fmath.stepCount(2.0000001, 1), 3, "floating point: 2 stays a whole number");
});

test("F4 the most servings keep the portion at or under 5000 g (the portion stepper's top)", () => {
  assert.equal(fmath.maxCount(30), 166);
  assert.equal(fmath.maxCount(2000), 2);
  assert.ok(fmath.gramsForCount(fmath.maxCount(33.3), 33.3) <= 5000);
});

test("F5 a portion logged by count is saved as grams only: food_log.servings stays null (no new saved field)", () => {
  const map = new Map();
  const store = { load: () => map.get("d") ?? { format: 1, app: "training-food", foods: [], food_log: [] }, save: (d) => { map.set("d", JSON.parse(JSON.stringify(d))); return d; } };
  const fm = createFoodModel(store, () => new Date("2026-01-26T12:00:00.000Z"));
  const food = { name: "Test bar", per100g: { kcal: 400, protein_g: 20, carbs_g: 50, fat_g: 10 }, serving_g: 30, serving_label: "1 bar (30 g)", source: "own" };
  const r = fm.saveAndLog(food, { date: "2026-01-26", meal: "snack", amount_g: fmath.gramsForCount(3, 30) });
  assert.equal(r.entry.amount_g, 90);
  assert.equal(r.entry.servings, null);
  assert.equal(r.entry.kcal, 360);
});

test("F6 the check step shows the count stepper only for a food with a serving, and both steppers update each other", () => {
  const t = src("js/diet/sheets.js");
  assert.match(t, /servingOf\(src\)/, "the counter depends on the food's serving");
  assert.match(t, /label: "How many"/);
  assert.match(t, /gramsForCount\(/);
  assert.match(t, /countForGrams\(/);
  assert.match(t, /stepCount\(/);
  assert.match(t, /\.setValue\(/, "a change in one stepper sets the other without a redraw");
  const parts = src("js/ui/parts.js");
  assert.match(parts, /\.setValue = \(n\) =>/, "the shared stepper can be set from outside (no onChange loop)");
});

test("F7 the shared stepper's setValue shows the new number and the next +/- starts from it, without calling onChange", async () => {
  const { installFakeDom } = await import("./fixtures/fake-dom.mjs").catch(() => ({}));
  if (!installFakeDom) { assert.fail("tests/fixtures/fake-dom.mjs has no installFakeDom"); return; }
  installFakeDom();
  const { stepper } = await import("../app/js/ui/parts.js");
  const seen = [];
  const el = stepper({ label: "How many", value: 1, step: 1, min: 1, max: 10, decimals: 1, onChange: (v) => seen.push(v) });
  el.setValue(3);
  assert.deepEqual(seen, [], "setValue does not call onChange");
  const all = (n) => [n, ...(n.childNodes ?? []).flatMap(all)];
  const input = all(el).find((n) => n.tagName === "INPUT");
  assert.equal(input.value, "3");
  all(el).filter((n) => n.tagName === "BUTTON")[1].click();
  assert.deepEqual(seen, [4]);
});

test("F8 under one serving, the count's minus changes nothing (the grams never jump up); plus goes to 1", async () => {
  const { installFakeDom } = await import("./fixtures/fake-dom.mjs");
  installFakeDom();
  const { stepper } = await import("../app/js/ui/parts.js");
  const { stepCount, countForGrams } = await import("../app/js/food/foodmath.js");
  const { readFileSync } = await import("node:fs");
  const sheets = readFileSync(new URL("../app/js/diet/sheets.js", import.meta.url), "utf8");
  const min = Number(sheets.match(/label: "How many"[^\n]*?min: ([\d.]+)/)[1]);
  const seen = [];
  const c = countForGrams(100, 300); // 0.3 of a 300 g serving
  const el = stepper({ label: "How many", value: c, min, max: 16, decimals: 1, next: stepCount, onChange: (v) => seen.push(v) });
  const all = (n) => [n, ...(n.childNodes ?? []).flatMap(all)];
  const [minus, plus] = all(el).filter((n) => n.tagName === "BUTTON");
  minus.click();
  assert.ok(seen.every((v) => v <= c), `minus gave ${seen}`);
  plus.click();
  assert.equal(seen.at(-1), 1);
});
