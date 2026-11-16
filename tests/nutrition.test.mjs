import test from "node:test";
import assert from "node:assert/strict";
import { bmi, bmr, suggestGoal, proteinTarget, kcalForGoal, safetyCheck, computeTargets, maintenance, kgToStonesPounds, stonesPoundsToKg, KCAL_FLOOR } from "../app/js/engine/nutrition.js";
import { startWalk, walkMets } from "../app/js/engine/walk.js";
import { intake, smallWoman, heavyPerson, slimPerson } from "./fixtures/profiles.mjs";

test("BMI", () => {
  assert.equal(Math.round(bmi(80, 175) * 10) / 10, 26.1);
  assert.equal(bmi(45, 150), 20);
});

test("resting energy (Mifflin-St Jeor): man, woman, unspecified", () => {
  assert.equal(bmr({ sex: "male", kg: 80, cm: 175, age: 30 }), 800 + 1093.75 - 150 + 5);
  assert.equal(bmr({ sex: "female", kg: 80, cm: 175, age: 30 }), 800 + 1093.75 - 150 - 161);
  assert.equal(bmr({ sex: "unspecified", kg: 80, cm: 175, age: 30 }), 800 + 1093.75 - 150 - 78);
});

test("walk start by answer 36, normal day and leg day", () => {
  assert.deepEqual([startWalk("yes").speed_kmh, startWalk("yes").slope_pct], [5.0, 6]);
  assert.equal(startWalk("yes", true).slope_pct, 4); // leg day: 2 % less
  assert.deepEqual([startWalk("not_sure").speed_kmh, startWalk("not_sure").slope_pct], [4.5, 4]);
  assert.equal(startWalk("not_sure", true).slope_pct, 2);
  assert.deepEqual([startWalk("no").speed_kmh, startWalk("no").slope_pct, startWalk("no").minutes], [4.0, 2, 20]);
  assert.equal(startWalk("no", true).slope_pct, 0); // never below flat
  assert.equal(startWalk("yes").minutes, 30);
  assert.throws(() => startWalk("maybe"));
});

test("walk energy in METs (ACSM formula)", () => {
  assert.ok(Math.abs(walkMets(5.25, 7) - 6.65) < 0.06);
  assert.ok(walkMets(5, 0) < walkMets(5, 6)); // steeper costs more
});

test("goal suggestion from BMI and waist (WORKFLOW B4)", () => {
  assert.equal(suggestGoal({ bmi: 18, waist_cm: null, sex: "male" }), "bulk");
  assert.equal(suggestGoal({ bmi: 24, waist_cm: null, sex: "male" }), "recomp");
  assert.equal(suggestGoal({ bmi: 28, waist_cm: null, sex: "male" }), "cut");
  assert.equal(suggestGoal({ bmi: 24, waist_cm: 99, sex: "male" }), "cut"); // waist over 94
  assert.equal(suggestGoal({ bmi: 24, waist_cm: 90, sex: "male" }), "recomp");
  assert.equal(suggestGoal({ bmi: 24, waist_cm: 85, sex: "female" }), "cut"); // waist over 80
  assert.equal(suggestGoal({ bmi: 24, waist_cm: 78, sex: "female" }), "recomp");
});

test("protein: middle of the range, rounded to 10 g; BMI over 30 uses the BMI 25 weight", () => {
  assert.equal(proteinTarget({ goal: "cut", kg: 80, cm: 175 }), 180); // 2.2 x 80 = 176
  assert.equal(proteinTarget({ goal: "bulk", kg: 80, cm: 175 }), 150); // 1.9 x 80 = 152
  assert.equal(proteinTarget({ goal: "recomp", kg: 80, cm: 175 }), 150);
  const heavy = heavyPerson();
  // BMI 34.9: reference weight 25 x 1.65^2 = 68.06 kg, so 2.2 x 68.06 = 149.7
  assert.equal(proteinTarget({ goal: "cut", kg: heavy.q24_weight_kg, cm: heavy.q23_height_cm }), 150);
  // with the real weight it would be 209: the rule makes the number smaller
  assert.ok(150 < 2.2 * heavy.q24_weight_kg);
});

test("calories: cut is 300 to 500 below maintenance, bulk about 10 % above, recomp at maintenance", () => {
  const cut = kcalForGoal({ goal: "cut", maintenanceKcal: 2700, kg: 80 });
  assert.ok(2700 - cut >= 300 - 25 && 2700 - cut <= 500 + 25, `cut ${cut}`);
  assert.equal(kcalForGoal({ goal: "cut", maintenanceKcal: 3100, kg: 200 }), 2600); // big person: capped at 500
  assert.equal(kcalForGoal({ goal: "cut", maintenanceKcal: 3100, kg: 40 }), 2800); // small person: at least 300
  assert.equal(kcalForGoal({ goal: "bulk", maintenanceKcal: 2600, kg: 80 }), 2850); // +10 % = 260
  assert.equal(kcalForGoal({ goal: "bulk", maintenanceKcal: 4000, kg: 80 }), 4300); // capped at +300
  assert.equal(kcalForGoal({ goal: "recomp", maintenanceKcal: 2600, kg: 80 }), 2600);
});

test("safety limits: floor and weekly rate", () => {
  assert.equal(safetyCheck({ kcal: 2600, maintenanceKcal: 3100, kg: 90, sex: "male" }).ok, true);
  const low = safetyCheck({ kcal: 1400, maintenanceKcal: 1500, kg: 90, sex: "male" });
  assert.equal(low.ok, false); // under 1,500 for men
  assert.match(low.problems[0], /1500/);
  assert.equal(safetyCheck({ kcal: 1300, maintenanceKcal: 1400, kg: 60, sex: "female" }).ok, true); // floor 1,200 for women
  assert.equal(safetyCheck({ kcal: 1150, maintenanceKcal: 1400, kg: 60, sex: "female" }).ok, false);
  const fast = safetyCheck({ kcal: 1600, maintenanceKcal: 3600, kg: 60, sex: "male" });
  assert.equal(fast.ok, false); // 2,000 kcal a day is about 1.8 kg a week, 3 % of 60 kg
  assert.ok(fast.problems.some((p) => /too fast/.test(p)));
  const gain = safetyCheck({ kcal: 3000, maintenanceKcal: 2000, kg: 60, sex: "male" }); // +1,000 a day: 0.9 kg a week, 1.5 %
  assert.equal(gain.ok, false);
});

test("computed targets for a normal person stay inside every limit", () => {
  const t = computeTargets(intake());
  assert.equal(t.source, "computed");
  assert.equal(t.goal, "cut");
  assert.ok(t.kcal >= KCAL_FLOOR.male);
  assert.ok(t.maintenance_kcal - t.kcal >= 275 && t.maintenance_kcal - t.kcal <= 525);
  assert.equal(t.protein_g, 180);
  assert.deepEqual(t.walk_start, { speed_kmh: 4.0, slope_pct: 2 });
  const check = safetyCheck({ kcal: t.kcal, maintenanceKcal: t.maintenance_kcal, kg: 80, sex: "male" });
  assert.equal(check.ok, true);
});

test("computed targets: the formula never goes under the calorie floor", () => {
  const t = computeTargets(smallWoman());
  assert.equal(t.kcal, 1200);
  assert.ok(t.notes.some((n) => /safe minimum/.test(n)));
});

test("computed targets: no cut when BMI is under 20", () => {
  const t = computeTargets(slimPerson());
  assert.equal(t.goal, "recomp");
  assert.equal(t.kcal, Math.round(t.maintenance_kcal / 50) * 50);
  assert.ok(t.notes.some((n) => /under 20/.test(n)));
});

test("computed targets: 'suggest' uses the BMI and waist rule", () => {
  assert.equal(computeTargets(intake({ q26_goal: "suggest" })).goal, "recomp"); // BMI 26
  assert.equal(computeTargets(intake({ q26_goal: "suggest", q28_waist_cm: 99 })).goal, "cut");
  assert.equal(computeTargets(intake({ q26_goal: "suggest", q24_weight_kg: 60 })).goal, "bulk");
  assert.equal(computeTargets(heavyPerson()).suggested_goal, "cut");
});

test("food answer decides what is shown (32 a, b, c)", () => {
  const protein = computeTargets(intake({ q32_food: "protein" }));
  assert.equal(protein.kcal, null);
  assert.equal(protein.protein_g, 180);
  const none = computeTargets(intake({ q32_food: "none" }));
  assert.equal(none.kcal, null);
  assert.equal(none.protein_g, null);
});

test("maintenance: daily-life number changes it (a 1.2, b 1.3, c 1.4, d 1.5)", () => {
  const walk = startWalk("yes");
  const m = (a) => maintenance(intake({ q30_activity: a }), walk).wayA;
  assert.ok(m("a") < m("b") && m("b") < m("c") && m("c") < m("d"));
  assert.throws(() => maintenance(intake({ q30_activity: "z" }), walk));
});

test("stones and pounds round trip; gym weights stay in kg", () => {
  assert.deepEqual(kgToStonesPounds(80), { stones: 12, pounds: 8.4 });
  assert.equal(stonesPoundsToKg(12, 8.4), 80);
  // 63.5 kg is 139.9994 lb: it rounds up to exactly 10 st 0 lb (never "9 st 14 lb")
  assert.deepEqual(kgToStonesPounds(63.5), { stones: 10, pounds: 0 });
});
