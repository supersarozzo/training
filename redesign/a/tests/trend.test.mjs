import test from "node:test";
import assert from "node:assert/strict";
import { addDays, activeWeighins, trendAt, trendSeries, weeklyChange, bandKg, checkBand, foodChange, weeklySummary } from "../app/js/engine/trend.js";
import { niceScale, layoutPoints, linePath } from "../app/js/chartmath.js";
import { validDoc } from "./fixtures/profiles.mjs";

const w = (date, kg, extra = {}) => ({ id: `w-${date}`, updated_at: `${date}T07:00:00.000Z`, date, kg, ...extra });
const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} is not ${b}`);

// Made-up numbers. Hand calculation:
//  week A (5 to 11 January): 80.0 + 80.4 + 79.8 + 80.2 + 80.0 + 79.6 + 79.8 = 559.8, over 7 days = 79.9714...
//  week B (12 to 18 January): 79.6 + 79.4 + 79.8 + 79.2 + 79.4 + 79.0 + 79.2 = 555.6, over 7 days = 79.3714...
//  change = (555.6 - 559.8) / 7 = -0.6 kg
const weekA = [80.0, 80.4, 79.8, 80.2, 80.0, 79.6, 79.8].map((kg, i) => w(addDays("2026-01-05", i), kg));
const weekB = [79.6, 79.4, 79.8, 79.2, 79.4, 79.0, 79.2].map((kg, i) => w(addDays("2026-01-12", i), kg));

test("trend weight is the 7-day average (hand calculation)", () => {
  close(trendAt(weekA, "2026-01-11"), 559.8 / 7);
  close(trendAt([...weekA, ...weekB], "2026-01-18"), 555.6 / 7);
  assert.equal(trendAt(weekA, "2026-01-04"), null); // nothing yet
  // a day in the middle uses only the days that exist
  close(trendAt(weekA, "2026-01-07"), (80.0 + 80.4 + 79.8) / 3);
});

test("trend change over a week matches the hand calculation: -0.6 kg", () => {
  close(weeklyChange([...weekA, ...weekB], "2026-01-18"), -0.6, 1e-9);
  assert.equal(weeklyChange(weekA, "2026-01-11"), null); // no earlier week yet
});

test("missed days: the average uses the weigh-ins that exist", () => {
  const some = [w("2026-01-12", 79.6), w("2026-01-14", 79.8), w("2026-01-18", 79.0)];
  close(trendAt(some, "2026-01-18"), (79.6 + 79.8 + 79.0) / 3);
});

test("one weigh-in per day: the newer record wins; deleted ones never count", () => {
  const list = [w("2026-01-05", 80.0), w("2026-01-05", 81.0, { updated_at: "2026-01-05T09:00:00.000Z" }), w("2026-01-06", 70, { deleted: true }), w("2026-01-07", 79)];
  assert.deepEqual(activeWeighins(list).map((x) => [x.date, x.kg]), [["2026-01-05", 81], ["2026-01-07", 79]]);
  assert.equal(trendSeries(list).length, 2);
});

test("addDays crosses month and year ends", () => {
  assert.equal(addDays("2026-12-30", 3), "2027-01-02");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("target band: cut 0.25 to 1 % a week, bulk 0.1 to 0.5 %, recomp within 0.5 kg", () => {
  const cut = bandKg("cut", 80);
  close(cut.low, -0.8); close(cut.high, -0.2);
  const bulk = bandKg("bulk", 80);
  close(bulk.low, 0.08); close(bulk.high, 0.4);
  assert.deepEqual(bandKg("recomp", 80), { low: -0.5, high: 0.5 });
  assert.equal(checkBand("cut", 80, -0.6), "on");
  assert.equal(checkBand("cut", 80, -1.0), "below"); // losing faster than 1 %
  assert.equal(checkBand("cut", 80, -0.1), "above"); // losing slower than 0.25 %
  assert.equal(checkBand("bulk", 80, 0.0), "below"); // not gaining
  assert.equal(checkBand("bulk", 80, 0.6), "above");
  assert.equal(checkBand("recomp", 80, 0.7), "above");
  assert.equal(checkBand("recomp", 80, -0.7), "below");
  assert.equal(checkBand("cut", 80, null), null);
});

test("food change: nothing in weeks 1 and 2, then only after 2 weeks in a row off target (WORKFLOW F3 table)", () => {
  assert.equal(foodChange("cut", "above", "above", 2), null);
  assert.equal(foodChange("cut", "above", "on", 4), null); // only one week off
  assert.equal(foodChange("cut", "above", "below", 4), null); // not the same direction
  assert.equal(foodChange("cut", "on", "on", 4), null);
  assert.equal(foodChange("bulk", "below", "below", 4).kcal, 150);
  assert.equal(foodChange("bulk", "above", "above", 4).kcal, -150);
  assert.equal(foodChange("recomp", "above", "above", 4).kcal, -150);
  assert.equal(foodChange("recomp", "below", "below", 4).kcal, 150);
  const slow = foodChange("cut", "above", "above", 4);
  assert.deepEqual([slow.kcal, slow.steps], [-150, 2000]);
  assert.equal(foodChange("cut", "below", "below", 4).kcal, 200); // "+150 to 250": the middle
});

test("weekly summary: counts the 7 days before this Monday", () => {
  const doc = validDoc();
  doc.profile.targets = { kcal: 2000, protein_g: 120, goal: "cut", source: "computed", walk_start: { speed_kmh: 5, slope_pct: 6 } };
  doc.block.start_monday = "2026-01-05";
  doc.weighins = [...weekA, ...weekB];
  const ses = (date, reps, weight, walkMin) => ({
    id: `s-${date}`, updated_at: `${date}T10:00:00.000Z`, date, plan_day: "mon", week: 1, kind: "full", status: "finished",
    started_at: `${date}T08:00:00.000Z`, finished_at: `${date}T09:30:00.000Z`, walk: { speed_kmh: 5, slope_pct: 6, minutes: walkMin, effort: 5 },
    exercises: [{ slot: "A1", plan_exercise: "chest_press", done_exercise: "chest_press", swap_reason: null, note: "", sets: reps.map((r, i) => ({ n: i + 1, type: "work", weight_kg: weight, reps: r, seconds: null, rir: 2 })) }],
  });
  doc.sessions = [ses("2026-01-05", [10, 10], 30, 30), ses("2026-01-12", [10, 10, 10], 35, 30), ses("2026-01-14", [9, 9], 35, 30)];
  // today is Monday 19 January = week 3, so the summary covers 12 to 18 January
  const s = weeklySummary(doc, { startMonday: "2026-01-05", today: "2026-01-19" });
  assert.deepEqual([s.week, s.from, s.to], [3, "2026-01-12", "2026-01-18"]);
  assert.equal(s.workouts, 2);
  assert.equal(s.sets, 5);
  assert.equal(s.walkMinutes, 60);
  assert.equal(s.newBests, 1); // chest press went from 30 kg to 35 kg
  close(s.change, -0.6);
  assert.equal(s.status, "on");
  assert.equal(s.food, null);
  assert.equal(weeklySummary(doc, { startMonday: "2026-01-05", today: "2026-01-12" }).workouts, 1); // week 2 looks at week 1
  assert.equal(weeklySummary(doc, { startMonday: "2026-01-05", today: "2026-01-07" }), null); // week 1: nothing to look back on
});

test("chart maths: a tidy axis, 0, 1 and many points", () => {
  const s = niceScale(79.0, 80.4, 4);
  assert.ok(s.min <= 79.0 && s.max >= 80.4);
  assert.ok(s.ticks.length >= 2 && s.ticks.length <= 8);
  const flat = niceScale(80, 80);
  assert.ok(flat.min < 80 && flat.max > 80); // never a zero-height axis
  assert.deepEqual(niceScale(NaN, 1).ticks, [0, 1]);

  const box = { left: 0, right: 100, top: 0, bottom: 50 };
  const none = layoutPoints([], { xMin: 0, xMax: 1, yMin: 0, yMax: 1 }, box);
  assert.deepEqual(none, []);
  const one = layoutPoints([{ x: 5, y: 80 }], { xMin: 5, xMax: 5, yMin: 80, yMax: 80 }, box);
  assert.deepEqual([one[0].px, one[0].py], [50, 25]); // a single point sits in the middle
  const many = layoutPoints([{ x: 0, y: 0 }, { x: 10, y: 10 }], { xMin: 0, xMax: 10, yMin: 0, yMax: 10 }, box);
  assert.deepEqual([many[0].px, many[0].py, many[1].px, many[1].py], [0, 50, 100, 0]);
  assert.equal(linePath(many), "M0,50 L100,0");
});
