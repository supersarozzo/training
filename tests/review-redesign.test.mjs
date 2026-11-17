// Safety review of the redesign merge (docs/REVIEW-2026-11-17-redesign.md). One test block per finding, written
// before the fix (each fails on the code it was written against).
import test from "node:test";
import assert from "node:assert/strict";
import { planForDay } from "../app/js/engine/schedule.js";
import * as workout from "../app/js/engine/workout.js";
import { week1Stage } from "../app/js/engine/week1.js";
import { exercises } from "../app/js/plan/plan-v2.js";
import { createStore } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { fakeStorage, validDoc } from "./fixtures/profiles.mjs";

// ---------- R1: a swap in the middle of a week-1 exercise ----------
// Since the swap fix (33557cc) a mid-exercise swap leaves the old record in the workout and puts a new record for the
// same slot in front of it. The week-1 screen walked the WHOLE list of records, so after the new exercise was done it
// went back to the exercise Rosario had swapped away from (for example a busy machine), at "set 2", and the count
// said "Exercise 2 of 8" in a 7-exercise workout. The guided list must hold the current record of each slot only.
function week1Setup() {
  const store = createStore(fakeStorage());
  store.save(validDoc());
  let tick = 0;
  const model = createModel(store, () => new Date(Date.UTC(2026, 0, 5, 8, 0, tick++)));
  const plan = planForDay("mon", 1);
  const s = model.startSession({ planDay: "mon", week: 1, kind: "full", slots: plan.slots });
  return { store, model, s, plan };
}
const weighted = (rec) => exercises[rec.done_exercise].step !== "bodyweight";

test("R1 week 1: after a mid-exercise swap, the guided list has one record per slot, the new one", () => {
  const { store, model, s, plan } = week1Setup();
  assert.equal(typeof workout.currentRecords, "function", "engine/workout.js exports currentRecords(session)");
  // Set 1 of the first exercise, with its "how many more" answer, then the machine is busy: swap.
  model.flagExercise(s.id, "A1", { w1_ready: true });
  model.skipWarmup(s.id, "A1");
  model.logSet(s.id, "A1", { type: "work", weight_kg: 20, reps: 10 });
  model.setLastRir(s.id, "A1", 2, "2-3");
  model.swapExercise(s.id, "A1", "db_bench_press", "busy");
  const session = store.load().sessions[0];
  const recs = workout.currentRecords(session);
  assert.equal(recs.length, plan.slots.length, "the count stays the plan's number of exercises");
  assert.deepEqual(recs.map((r) => r.slot), plan.slots.map((x) => x.slot), "plan order, each slot once");
  assert.equal(recs[0].done_exercise, "db_bench_press");
  assert.equal(recs[0].sets.length, 0);
  // The old set is still in the workout (nothing lost).
  assert.equal(session.exercises.filter((r) => r.done_exercise === "chest_press" && r.sets.length === 1).length, 1);
});

test("R1 week 1: once the swapped-in exercise is done, the screen moves on, never back to the swapped-out one", () => {
  const { store, model, s } = week1Setup();
  model.flagExercise(s.id, "A1", { w1_ready: true });
  model.skipWarmup(s.id, "A1");
  model.logSet(s.id, "A1", { type: "work", weight_kg: 20, reps: 10 });
  model.setLastRir(s.id, "A1", 2, "2-3");
  model.swapExercise(s.id, "A1", "db_bench_press", "busy");
  // The swapped-in exercise: learn, no warm-up, two sets with answers, result saved.
  model.flagExercise(s.id, "A1", { w1_ready: true });
  model.skipWarmup(s.id, "A1");
  model.logSet(s.id, "A1", { type: "work", weight_kg: 10, reps: 10 });
  model.setLastRir(s.id, "A1", 2, "2-3");
  model.logSet(s.id, "A1", { type: "work", weight_kg: 10, reps: 10 });
  model.setLastRir(s.id, "A1", 2, "2-3");
  model.flagExercise(s.id, "A1", { w1_saved: true });
  const session = store.load().sessions[0];
  const recs = workout.currentRecords(session);
  const next = recs.find((r) => week1Stage(r, weighted(r)) !== "done");
  assert.equal(next.slot, "A2", "the next exercise is the second one of the plan");
  assert.notEqual(next.done_exercise, "chest_press");
});

test("R1: currentRecords on a workout without swaps is the list itself, and ignores nothing else", () => {
  const { store, s } = week1Setup();
  const session = store.load().sessions.find((x) => x.id === s.id);
  assert.deepEqual(workout.currentRecords(session), session.exercises);
});
