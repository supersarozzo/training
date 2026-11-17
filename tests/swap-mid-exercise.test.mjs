// Swap in the middle of an exercise (JUDGING.md 3.7, Rosario's answer 61 a, 2026-11-17).
// Bug: model.swapExercise relabelled the sets already saved for that slot, so a 35 kg chest press set
// became "Dumbbell bench press 35 kg, a new best", and the stepper carried 35 kg over.
// Rule: saved sets keep the exercise they were done on; the new exercise starts from its own history
// (or the week-1 rules) with its own sets.
import test from "node:test";
import assert from "node:assert/strict";
import { planForDay } from "../app/js/engine/schedule.js";
import { buildSequence, nextPosition, slotRecord, workSets, performances } from "../app/js/engine/workout.js";
import { createStore } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { validateDocument } from "../app/js/validate.js";
import { fakeStorage, validDoc } from "./fixtures/profiles.mjs";

function setup() {
  const store = createStore(fakeStorage());
  store.save(validDoc());
  let tick = 0;
  const model = createModel(store, () => new Date(Date.UTC(2026, 0, 12, 8, 0, tick++)));
  const plan = planForDay("mon", 2);
  const s = model.startSession({ planDay: "mon", week: 2, kind: "full", slots: plan.slots });
  return { store, model, s, plan };
}

test("swap after one saved set: the saved set keeps the exercise it was done on", () => {
  const { store, model, s } = setup();
  model.logSet(s.id, "A1", { type: "work", weight_kg: 35, reps: 8 });
  model.swapExercise(s.id, "A1", "db_bench_press", "busy");
  const saved = store.load().sessions[0];
  const chest = saved.exercises.filter((e) => e.done_exercise === "chest_press");
  assert.equal(chest.length, 1, "the chest press record is still there");
  assert.deepEqual(workSets(chest[0]).map((x) => [x.weight_kg, x.reps]), [[35, 8]]);
  const bench = saved.exercises.filter((e) => e.done_exercise === "db_bench_press" && e.plan_exercise === "chest_press");
  assert.equal(bench.length, 1, "one record for the new exercise");
  assert.equal(bench[0].sets.length, 0, "the new exercise has no sets yet");
  assert.equal(bench[0].swap_reason, "busy");
});

test("swap after one saved set: the slot now points at the new exercise, from its set 1", () => {
  const { store, model, s, plan } = setup();
  model.logSet(s.id, "A1", { type: "work", weight_kg: 35, reps: 8 });
  model.swapExercise(s.id, "A1", "db_bench_press", "busy");
  const saved = store.load().sessions[0];
  const rec = slotRecord(saved, "A1");
  assert.equal(rec.done_exercise, "db_bench_press");
  assert.equal(workSets(rec).length, 0, "no old weight to carry into the stepper");
  const { seq } = buildSequence(plan.slots);
  const pos = nextPosition(saved, seq);
  assert.equal(pos.entry.slot, "A1");
  assert.equal(pos.entry.setNumber, 1);
});

test("after finishing, history is honest: chest press 35 kg, bench press only its own sets", () => {
  const { store, model, s } = setup();
  model.logSet(s.id, "A1", { type: "work", weight_kg: 35, reps: 8 });
  model.swapExercise(s.id, "A1", "db_bench_press", "busy");
  model.logSet(s.id, "A1", { type: "work", weight_kg: 12, reps: 10 });
  model.finishSession(s.id, {});
  const sessions = store.load().sessions;
  const chest = performances(sessions, "chest_press");
  assert.equal(chest.length, 1);
  assert.equal(chest[0].weight_kg, 35);
  const bench = performances(sessions, "db_bench_press").filter((p) => p.date === sessions[0].date);
  assert.equal(bench.length, 1);
  assert.equal(bench[0].weight_kg, 12);
  assert.deepEqual(bench[0].sets.map((x) => x.reps), [10]);
});

test("warm-up sets saved before the swap stay with the old exercise; the new one offers its own warm-up", () => {
  const { store, model, s } = setup();
  model.logSet(s.id, "A1", { type: "warmup", weight_kg: 15, reps: 10 });
  model.skipWarmup(s.id, "A1");
  model.swapExercise(s.id, "A1", "db_bench_press", "dislike");
  const saved = store.load().sessions[0];
  const old = saved.exercises.find((e) => e.done_exercise === "chest_press");
  assert.ok(old, "the warm-up record is kept");
  assert.deepEqual(old.sets.map((x) => x.type), ["warmup"]);
  const rec = slotRecord(saved, "A1");
  assert.equal(rec.done_exercise, "db_bench_press");
  assert.equal(rec.sets.length, 0);
  assert.equal(rec.warmup_skipped, false);
});

test("swap before any set still changes the one record (no extra record)", () => {
  const { store, model, s } = setup();
  const before = store.load().sessions[0].exercises.length;
  model.swapExercise(s.id, "A2", "one_arm_db_row", "hurts", "left shoulder", 4);
  const saved = store.load().sessions[0];
  assert.equal(saved.exercises.length, before);
  const a2 = slotRecord(saved, "A2");
  assert.deepEqual([a2.plan_exercise, a2.done_exercise, a2.swap_reason, a2.swap_weight_kg, a2.note], ["pulldown", "one_arm_db_row", "hurts", 4, "left shoulder"]);
});

test("a second swap mid-exercise keeps both earlier exercises' sets, and the file passes the checker", () => {
  const { store, model, s } = setup();
  model.logSet(s.id, "A1", { type: "work", weight_kg: 35, reps: 8 });
  model.swapExercise(s.id, "A1", "db_bench_press", "busy");
  model.logSet(s.id, "A1", { type: "work", weight_kg: 12, reps: 10 });
  model.swapExercise(s.id, "A1", "incline_db_press", "dislike");
  model.logSet(s.id, "A1", { type: "work", weight_kg: 10, reps: 9 });
  const saved = store.load().sessions[0];
  const byEx = (id) => saved.exercises.filter((e) => e.slot === "A1" && e.done_exercise === id).flatMap((e) => workSets(e).map((x) => x.weight_kg));
  assert.deepEqual(byEx("chest_press"), [35]);
  assert.deepEqual(byEx("db_bench_press"), [12]);
  assert.deepEqual(byEx("incline_db_press"), [10]);
  assert.equal(slotRecord(saved, "A1").done_exercise, "incline_db_press");
  const checked = validateDocument(store.load());
  assert.equal(checked.ok, true, checked.error);
});
