// Plan v2 section 8: week 1, "After set 1 -> Set 2".
import test from "node:test";
import assert from "node:assert/strict";
import { week1NextSet, week1StartingWeight, LEFT_CHOICES } from "../app/js/engine/week1.js";
import { weeks, setsFor, rirFor } from "../app/js/plan/plan-v2.js";

const settings = { dumbbell_steps_kg: [2, 4, 6, 8, 10, 12, 14, 16], stack_step_kg: { default: 5 } };
const next = (weight_kg, reps, left, id = "chest_press") => week1NextSet({ weight_kg, reps, left }, id, settings); // chest press: range 8-12

test("table row 1: reached the top with 7 or more left -> add 2 steps", () => {
  const r = next(40, 12, "7+");
  assert.equal(r.stepsChange, 2);
  assert.equal(r.weight_kg, 50);
  assert.equal(r.keep, false);
});

test("table row 2: reached the top with 4 to 6 left -> add 1 step", () => {
  const r = next(40, 12, "4-6");
  assert.equal(r.stepsChange, 1);
  assert.equal(r.weight_kg, 45);
});

test("table row 3: in the range with 2 to 3 left -> keep, this is the starting weight", () => {
  for (const reps of [8, 10, 12]) {
    const r = next(40, reps, "2-3");
    assert.equal(r.stepsChange, 0, `${reps} reps`);
    assert.equal(r.weight_kg, 40);
    assert.equal(r.keep, true);
  }
});

test("table row 4: in the range with 0 to 1 left -> remove 1 step", () => {
  for (const reps of [8, 10, 12]) {
    const r = next(40, reps, "0-1");
    assert.equal(r.stepsChange, -1, `${reps} reps`);
    assert.equal(r.weight_kg, 35);
  }
});

test("table row 5: could not reach the bottom -> remove 1 to 2 steps (2 when 3 or more short)", () => {
  assert.equal(next(40, 7, "0-1").stepsChange, -1); // 1 short
  assert.equal(next(40, 6, "2-3").stepsChange, -1); // 2 short
  const far = next(40, 5, "0-1"); // 3 short
  assert.equal(far.stepsChange, -2);
  assert.equal(far.weight_kg, 30);
  assert.equal(next(40, 2, "0-1").stepsChange, -2);
});

test("dumbbells use the gym's sizes", () => {
  const r = week1NextSet({ weight_kg: 8, reps: 15, left: "7+" }, "db_curl", settings); // curl: range 10-15
  assert.equal(r.weight_kg, 12);
  const down = week1NextSet({ weight_kg: 8, reps: 6, left: "0-1" }, "db_curl", settings);
  assert.equal(down.weight_kg, 4); // 4 short -> 2 steps down
});

test("the starting weight for week 2 is the weight that fits after set 2", () => {
  const fits = week1StartingWeight({ weight_kg: 45, reps: 10, left: "2-3" }, "chest_press", settings);
  assert.equal(fits.start_weight_kg, 45);
  assert.equal(fits.fits, true);
  const off = week1StartingWeight({ weight_kg: 40, reps: 12, left: "7+" }, "chest_press", settings);
  assert.equal(off.start_weight_kg, 50); // best guess; week 2 fixes it with the normal rule
  assert.equal(off.fits, false);
});

test("unknown 'how many more' answer is refused", () => {
  assert.throws(() => next(40, 10, "lots"));
  assert.deepEqual(LEFT_CHOICES, ["0-1", "2-3", "4-6", "7+"]);
});

test("week 1 rules: 2 working sets, RIR 3, no progression", () => {
  const w1 = weeks[0];
  assert.equal(w1.progression, false);
  assert.equal(w1.walkProgress, false);
  assert.equal(rirFor(1, "mon"), 3);
  for (const day of ["mon", "tue", "wed", "thu", "fri"]) {
    for (const slot of ["A1", "A2", "B1", "B2", "C1", "C2"]) assert.equal(setsFor(1, day, slot), 2, `${day} ${slot}`);
  }
});

// ---------- the guided flow of one exercise (build step 6) ----------
import { week1Stage, week1Result, LEFT_TO_RIR } from "../app/js/engine/week1.js";

const rec = (sets, flags = {}) => ({ slot: "A1", sets, ...flags });
const work = (n, weight, reps, left) => ({ type: "work", n, weight_kg: weight, reps, ...(left ? { left } : {}) });

test("week 1 stage: learn, warm-up, set 1, how many more, set 2, how many more, result, done", () => {
  assert.equal(week1Stage(rec([]), true), "learn");
  assert.equal(week1Stage(rec([], { w1_ready: true }), true), "warmup");
  assert.equal(week1Stage(rec([{ type: "warmup", n: 1 }], { w1_ready: true }), true), "set1");
  assert.equal(week1Stage(rec([], { w1_ready: true, warmup_skipped: true }), true), "set1");
  assert.equal(week1Stage(rec([work(1, 20, 12)], { w1_ready: true, warmup_skipped: true }), true), "left1");
  assert.equal(week1Stage(rec([work(1, 20, 12, "2-3")], { w1_ready: true }), true), "set2");
  assert.equal(week1Stage(rec([work(1, 20, 12, "2-3"), work(2, 20, 11)], { w1_ready: true }), true), "left2");
  assert.equal(week1Stage(rec([work(1, 20, 12, "2-3"), work(2, 20, 11, "2-3")], { w1_ready: true }), true), "result");
  assert.equal(week1Stage(rec([work(1, 20, 12, "2-3"), work(2, 20, 11, "2-3")], { w1_ready: true, w1_saved: true }), true), "done");
});

test("week 1 stage for bodyweight and timed exercises: learn, set 1, set 2, done (no weight steps)", () => {
  assert.equal(week1Stage(rec([]), false), "learn");
  assert.equal(week1Stage(rec([], { w1_ready: true }), false), "set1");
  assert.equal(week1Stage(rec([{ type: "work", n: 1, reps: 8 }], { w1_ready: true }), false), "set2");
  assert.equal(week1Stage(rec([{ type: "work", n: 1, reps: 8 }, { type: "work", n: 2, reps: 8 }], { w1_ready: true }), false), "done");
});

test("week 1 result: the weight that fits after set 2 is saved as the starting weight; an off weight is a best guess", () => {
  const settings = { dumbbell_steps_kg: [], stack_step_kg: { default: 5 } };
  const fits = week1Result(rec([work(1, 30, 10, "2-3"), work(2, 30, 10, "2-3")]), "chest_press", settings);
  assert.deepEqual([fits.start_weight_kg, fits.fits], [30, true]);
  const light = week1Result(rec([work(1, 30, 12, "7+"), work(2, 40, 12, "7+")]), "chest_press", settings);
  assert.equal(light.start_weight_kg, 50); // top of range with 7+ left: add 2 steps (10 kg)
  assert.equal(light.fits, false);
  assert.equal(LEFT_TO_RIR["0-1"], 0);
  assert.equal(LEFT_TO_RIR["7+"], 4);
});

test("set 2 weight comes from the table after set 1 (stack step 5)", () => {
  const settings = { dumbbell_steps_kg: [], stack_step_kg: { default: 5 } };
  const next = week1NextSet({ weight_kg: 30, reps: 12, left: "4-6" }, "chest_press", settings);
  assert.equal(next.weight_kg, 35);
});
