// Version 0.7.5 (worker 8.42): trainer 8.37's answer 1 a to the auditor's round-1 point (2026-11-18). Written BEFORE the
// change (tests first). A D18 move with no log of its own starts from the old move's weight. After a break, the old move's
// weight is lowered FIRST (the same break rule as for logged weights), then converted, rounded down, at least one step.
// Trainer: "Coming back after a break is when too heavy hurts most." All values are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { suggestFor, missedRule, fromReplaced } from "../app/js/engine/workout.js";
import { gymFloor } from "../app/js/engine/progression.js";
import { firstTryKg } from "../app/js/plan/plan-v2.js";
import { validDoc } from "./fixtures/profiles.mjs";

const w = (n, kg) => ({ n, type: "work", weight_kg: kg, reps: 10, seconds: null, rir: 2, done_at: "2026-02-03T09:00:00.000Z" });
function docWith(exId, slot, day, kg) {
  const doc = validDoc();
  doc.sessions = [{ id: "s-20260203-t1", updated_at: "2026-02-03T10:00:00.000Z", date: "2026-02-03", plan_day: day, week: 3, kind: "full", swapped_from: null, status: "finished", started_at: "2026-02-03T08:00:00.000Z", finished_at: "2026-02-03T10:00:00.000Z", walk: null,
    exercises: [{ slot, plan_exercise: exId, done_exercise: exId, swap_reason: null, sets: [w(1, kg), w(2, kg), w(3, kg)], note: "", planned_sets: 3, planned_rest: null }] }];
  return doc;
}

test("B-1 back after more than 4 weeks: the hip thrust machine starts from the LOWERED hip thrust weight, converted", () => {
  const doc = docWith("hip_thrust", "C1", "tue", 50);
  const missed = missedRule("2026-02-03", "2026-03-12");
  assert.ok(missed.weightFactor < 1, "a break that lowers weights");
  const lowered = suggestFor(doc, "hip_thrust", { week: 8, missed }).weight_kg;
  assert.ok(lowered < 50);
  const expected = gymFloor(lowered * (firstTryKg.booty_builder_hip_thrust / firstTryKg.hip_thrust), "booty_builder_hip_thrust", doc.shared_settings);
  const sg = suggestFor(doc, "booty_builder_hip_thrust", { week: 8, missed });
  assert.equal(sg.weight_kg, expected);
  assert.equal(sg.from, "hip_thrust");
  assert.ok(sg.weight_kg < fromReplaced(doc, "booty_builder_hip_thrust").weight_kg, "lower than without the break");
});

test("B-2 the leg press calf raise after a break: lowered standing calf raise weight x 40/10, at least one step", () => {
  const doc = docWith("calf_raise_standing", "D", "fri", 20);
  const missed = missedRule("2026-02-03", "2026-03-12");
  const lowered = suggestFor(doc, "calf_raise_standing", { week: 8, missed }).weight_kg;
  const expected = gymFloor(lowered * (firstTryKg.calf_raise_leg_press / firstTryKg.calf_raise_standing), "calf_raise_leg_press", doc.shared_settings);
  assert.equal(suggestFor(doc, "calf_raise_leg_press", { week: 8, missed }).weight_kg, expected);
});

test("B-3 no break: the converted weight is the same as before", () => {
  const doc = docWith("hip_thrust", "C1", "tue", 50);
  assert.equal(suggestFor(doc, "booty_builder_hip_thrust", { week: 4, missed: null }).weight_kg, fromReplaced(doc, "booty_builder_hip_thrust").weight_kg);
  const short = missedRule("2026-02-03", "2026-02-10");
  assert.equal(suggestFor(doc, "booty_builder_hip_thrust", { week: 4, missed: short }).weight_kg, fromReplaced(doc, "booty_builder_hip_thrust").weight_kg);
});
