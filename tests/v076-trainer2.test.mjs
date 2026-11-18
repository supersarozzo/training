// Version 0.7.6 (worker 8.43): trainer 8.37's answers 4 and 5 to 8.43 (commit 71d3aa5), from the checker's round-1
// notes. Written BEFORE the change (tests first). All values are made up.
// (4) A D18 move's first workout after a break: when the break lowering applies and the converted start equals the new
//     move's floor, it counts as at the floor (the note, and at least 3 reps left). Without a break: a plain new start.
// (5) Week 1, "too heavy" at the floor: the weight holds and the note says "Lightest weight already. Do the reps you can
//     with good form, or swap the exercise."
import test from "node:test";
import assert from "node:assert/strict";
import { suggestFor, missedRule, fromReplaced } from "../app/js/engine/workout.js";
import { minWeight, FLOOR_NOTE, WEEK1_FLOOR_NOTE } from "../app/js/engine/progression.js";
import { week1NextSet } from "../app/js/engine/week1.js";
import { validDoc } from "./fixtures/profiles.mjs";

const w = (n, kg) => ({ n, type: "work", weight_kg: kg, reps: 12, seconds: null, rir: 2, done_at: "2026-02-03T09:00:00.000Z" });
function docWith(exId, slot, day, kg) {
  const doc = validDoc();
  doc.shared_settings = { ...doc.shared_settings, dumbbell_steps_kg: [2, 4, 6, 8, 10], stack_step_kg: { default: 5 } };
  doc.sessions = [{ id: "s-20260203-t2", updated_at: "2026-02-03T10:00:00.000Z", date: "2026-02-03", plan_day: day, week: 3, kind: "full", swapped_from: null, status: "finished", started_at: "2026-02-03T08:00:00.000Z", finished_at: "2026-02-03T10:00:00.000Z", walk: null,
    exercises: [{ slot, plan_exercise: exId, done_exercise: exId, swap_reason: null, sets: [w(1, kg), w(2, kg), w(3, kg)], note: "", planned_sets: 3, planned_rest: null }] }];
  return doc;
}
const LONG = missedRule("2026-02-03", "2026-03-12");

test("T2-4a after a break, a D18 start that equals the new move's floor is at the floor: the D19 note", () => {
  assert.ok(LONG.weightFactor < 1);
  const doc = docWith("cable_crunch", "A2", "tue", 5); // one stack step: the break cannot lower it
  const conv = fromReplaced(doc, "weighted_crunch", LONG.weightFactor);
  assert.equal(conv.weight_kg, minWeight("weighted_crunch", doc.shared_settings), "the converted start is the lightest dumbbell");
  const sg = suggestFor(doc, "weighted_crunch", { week: 8, missed: LONG });
  assert.equal(sg.weight_kg, conv.weight_kg);
  assert.equal(sg.atFloor, true);
  assert.equal(sg.note, FLOOR_NOTE);
});

test("T2-4b no break: the same floor start is a plain new start (no floor flag, the 'From your ...' note)", () => {
  const doc = docWith("cable_crunch", "A2", "tue", 5);
  const sg = suggestFor(doc, "weighted_crunch", { week: 8, missed: null });
  assert.ok(!sg.atFloor);
  assert.match(sg.note, /^From your cable crunch weight\./);
});

test("T2-4c after a break, a D18 start above the new move's floor keeps the 'From your ...' note", () => {
  const doc = docWith("hip_thrust", "C1", "tue", 50);
  const sg = suggestFor(doc, "booty_builder_hip_thrust", { week: 8, missed: LONG });
  assert.ok(sg.weight_kg > minWeight("booty_builder_hip_thrust", doc.shared_settings));
  assert.ok(!sg.atFloor);
  assert.match(sg.note, /^From your hip thrust weight\./);
});

test("T2-5 week 1, too heavy at the floor: the weight holds and the week-1 floor note", () => {
  assert.equal(WEEK1_FLOOR_NOTE, "Lightest weight already. Do the reps you can with good form, or swap the exercise.");
  const s = { dumbbell_steps_kg: [2, 4, 6], stack_step_kg: { default: 5 } };
  const at = week1NextSet({ weight_kg: 5, reps: 1, left: "0-1" }, "chest_press", s);
  assert.deepEqual([at.weight_kg, at.note, at.atFloor], [5, WEEK1_FLOOR_NOTE, true]);
  assert.equal(week1NextSet({ weight_kg: 20, reps: 1, left: "0-1" }, "chest_press", s).note, "Too heavy. Remove 2 steps.");
});
