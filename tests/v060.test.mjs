// Version 0.6.0 (worker 8.35, 2026-11-18), Rosario's batch typed in chat 8.35:
//  1. Plan Edit can change the sets of an exercise on that day (planedits withSets, saved through savePlanDay), and the
//     reps and the weight of an exercise (exercise_state my_range, my_weight_kg, my_weight_at; they count on every day).
//  2. The workout reads them: suggestFor uses my_range and the weight set in the Plan until a newer workout exists.
//  3. "Stop this exercise here": a workout can move on after fewer sets (model.stopExercise; nextPosition skips the rest).
//  4. Today is the gym day: it can show and start any plan day of this week (planview dayChoices). Plan is the plan to
//     edit and the overview: no Start there.
//  5. Screens: no day arrows at the bottom of the Plan day; no Settings gear on Today, Plan, Gym (Progress has a
//     Settings button in words); the exercise photo comes before the muscle maps; the back
//     view of the body map shows the back of the head, not a face.
// All values are made up. No body data.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as edits from "../app/js/engine/planedits.js";
import * as workout from "../app/js/engine/workout.js";
import { nextSuggestion } from "../app/js/engine/progression.js";
import { days } from "../app/js/plan/plan-v2.js";
import { createStore } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { validateDocument } from "../app/js/validate.js";
import * as view from "../app/js/planview.js";
import { BACK } from "../app/vendor/body-muscles/shapes.js";
import { validDoc, fakeStorage } from "./fixtures/profiles.mjs";

const T = "2026-03-02T09:00:00.000Z";
const copy = (v) => JSON.parse(JSON.stringify(v));
const planSlots = (day) => copy(days[day].slots).map(({ slot, ex, sets, rest }) => ({ slot, ex, sets, rest }));
const src = (p) => readFileSync(new URL(`../app/js/${p}`, import.meta.url), "utf8");

function setup(doc = validDoc(), at = T) {
  const store = createStore(fakeStorage());
  let ms = Date.parse(at);
  store.save(doc);
  return { store, model: createModel(store, () => new Date((ms += 1000))) };
}

const work = (n, kg, reps, rir = 2, date = "2026-02-23") => ({ n, type: "work", weight_kg: kg, reps, seconds: null, rir, done_at: `${date}T09:00:00.000Z` });
function finished(date, week, exId, sets) {
  return {
    id: `s-${date.replaceAll("-", "")}-x${exId.length}`, updated_at: `${date}T10:00:00.000Z`, date, plan_day: "tue", week, kind: "full",
    swapped_from: null, status: "finished", started_at: `${date}T08:00:00.000Z`, finished_at: `${date}T10:00:00.000Z`, walk: null,
    exercises: [{ slot: "A1", plan_exercise: exId, done_exercise: exId, swap_reason: null, sets, note: "" }], note: "",
  };
}

// ---------- 1. sets, reps and weight edits ----------

test("V1 withSets changes the sets of one exercise of a day and keeps the rest; 1 to 5 sets only", () => {
  const slots = planSlots("tue");
  const out = edits.withSets(slots, "A1", 4);
  assert.equal(out.find((s) => s.slot === "A1").sets, 4);
  assert.deepEqual(out.filter((s) => s.slot !== "A1"), slots.filter((s) => s.slot !== "A1"));
  assert.equal(slots.find((s) => s.slot === "A1").sets, days.tue.slots.find((s) => s.slot === "A1").sets, "the input is not changed");
  assert.throws(() => edits.withSets(slots, "A1", 0), /1 to 5/);
  assert.throws(() => edits.withSets(slots, "A1", 6), /1 to 5/);
  assert.throws(() => edits.withSets(slots, "A1", 2.5), /1 to 5/);
  assert.throws(() => edits.withSets(slots, "Z9", 3), /No exercise/);
  assert.ok(edits.checkSlots(out).ok);
});

test("V2 sets saved through savePlanDay show on the day and follow the week rule (week 1: at most 2)", () => {
  const { model } = setup();
  const slots = edits.withSets(model.effectivePlanDay("tue").slots, "A1", 5);
  model.savePlanDay("tue", slots);
  const doc = model.doc();
  const v3 = view.viewDay(doc, "tue", 3);
  assert.equal(v3.slots.find((s) => s.slot === "A1").sets, 5);
  assert.equal(view.viewDay(doc, "tue", 1).slots.find((s) => s.slot === "A1").sets, 2);
  assert.deepEqual(view.dayChanges("tue", view.editOf(doc, "tue")), [`Sets: ${"Leg press"} 3 → 5`]);
});

test("V3 suggestFor: reps set in the Plan (my_range) replace the plan's reps; with no history the weight set there is used", () => {
  const doc = validDoc();
  doc.exercise_state = [{ id: "x-leg_press", updated_at: T, start_weight_kg: null, machine_note: "", fail_streak: 0, my_range: [6, 8], my_weight_kg: 50, my_weight_at: "2026-03-01" }];
  const st = doc.exercise_state[0];
  const s = workout.suggestFor(doc, "leg_press", { week: 3, missed: null, exerciseState: st });
  assert.deepEqual(s.range, [6, 8]);
  assert.equal(s.reps, 6);
  assert.equal(s.weight_kg, 50);
  assert.equal(s.action, "mine");
  assert.match(s.note, /Plan/);
});

test("V4 the weight set in the Plan wins until a newer workout; after that the normal steps take over", () => {
  const doc = validDoc();
  doc.sessions = [finished("2026-02-23", 3, "leg_press", [work(1, 40, 12), work(2, 40, 12), work(3, 40, 12)])];
  doc.exercise_state = [{ id: "x-leg_press", updated_at: T, start_weight_kg: null, machine_note: "", fail_streak: 0, my_weight_kg: 60, my_weight_at: "2026-02-24" }];
  let s = workout.suggestFor(doc, "leg_press", { week: 3, missed: null, exerciseState: doc.exercise_state[0] });
  assert.equal(s.weight_kg, 60, "set after the last workout: used");
  doc.exercise_state[0].my_weight_at = "2026-02-20";
  s = workout.suggestFor(doc, "leg_press", { week: 3, missed: null, exerciseState: doc.exercise_state[0] });
  assert.notEqual(s.action, "mine", "set before the last workout: the steps decide");
  assert.ok(s.weight_kg > 40, "all sets at the top with reps left: heavier");
});

test("V5 with my_range the top of the new range decides when to add weight", () => {
  const last = { weight_kg: 40, sets: [{ reps: 8, rir: 2 }, { reps: 8, rir: 2 }, { reps: 8, rir: 2 }], date: "2026-02-23", week: 3 };
  const s = nextSuggestion(last, null, { exerciseId: "leg_press", week: 3, settings: validDoc().shared_settings, range: [6, 8], planRange: [6, 8] });
  assert.ok(s.weight_kg > 40, "8 reps is the top of 6 to 8");
  assert.deepEqual(s.range, [6, 8]);
  const plain = nextSuggestion(last, null, { exerciseId: "leg_press", week: 3, settings: validDoc().shared_settings });
  assert.equal(plain.weight_kg, 40, "without my_range 8 reps is below 10 to 12");
});

test("V6 targetText and rangeFor use my_range", () => {
  assert.match(workout.targetText("leg_press", 3, 2, [6, 8]), /6 to 8 reps/);
  assert.match(workout.targetText("leg_press", 3, 2), /10 to 12 reps/);
  const doc = validDoc();
  assert.deepEqual(view.rangeFor(doc, "leg_press"), [10, 12]);
  doc.exercise_state = [{ id: "x-leg_press", updated_at: T, start_weight_kg: null, machine_note: "", fail_streak: 0, my_range: [6, 8] }];
  assert.deepEqual(view.rangeFor(doc, "leg_press"), [6, 8]);
  doc.exercise_state[0].my_range = [9, 3];
  assert.deepEqual(view.rangeFor(doc, "leg_press"), [10, 12], "a broken range is ignored");
});

test("V7 the file check accepts my_range and my_weight_kg and refuses bad ones", () => {
  const doc = validDoc();
  doc.exercise_state = [{ id: "x-leg_press", updated_at: T, start_weight_kg: null, machine_note: "", fail_streak: 0, my_range: [6, 8], my_weight_kg: 52.5, my_weight_at: "2026-03-01" }];
  assert.doesNotThrow(() => validateDocument(copy(doc)));
  const bad1 = copy(doc); bad1.exercise_state[0].my_weight_kg = 5000;
  assert.throws(() => validateDocument(bad1));
  const bad2 = copy(doc); bad2.exercise_state[0].my_range = ["a", 8];
  assert.throws(() => validateDocument(bad2));
  const bad3 = copy(doc); bad3.exercise_state[0].my_range = [12, 6];
  assert.throws(() => validateDocument(bad3));
});

test("V8 model.setExercisePrefs saves reps and weight with the date, and clears them", () => {
  const { model } = setup();
  model.setExercisePrefs("leg_press", { range: [6, 8], weightKg: 50 });
  let st = model.doc().exercise_state.find((x) => x.id === "x-leg_press");
  assert.deepEqual(st.my_range, [6, 8]);
  assert.equal(st.my_weight_kg, 50);
  assert.match(st.my_weight_at, /^\d{4}-\d{2}-\d{2}$/);
  model.setExercisePrefs("leg_press", { range: null, weightKg: null });
  st = model.doc().exercise_state.find((x) => x.id === "x-leg_press");
  assert.equal(st.my_range, null);
  assert.equal(st.my_weight_kg, null);
  assert.throws(() => model.setExercisePrefs("nope", { range: [6, 8] }));
  assert.throws(() => model.setExercisePrefs("leg_press", { range: [8, 6] }));
});

// ---------- 3. stop an exercise early ----------

test("V9 Stop this exercise here: after 1 of 3 sets the workout moves on; Undo brings the sets back", () => {
  const { model } = setup();
  const session = model.startSession({ planDay: "tue", week: 3, kind: "full" });
  const plan = { slots: session.exercises.map((e) => ({ slot: e.slot, ex: e.plan_exercise, sets: e.planned_sets, rest: e.planned_rest })) };
  const { seq } = workout.buildSequence(plan.slots);
  model.logSet(session.id, "A1", { type: "work", weight_kg: 40, reps: 5 });
  let s = model.doc().sessions.find((x) => x.id === session.id);
  assert.equal(workout.nextPosition(s, seq).entry.slot, "A2");
  model.logSet(session.id, "A2", { type: "work", weight_kg: 10, reps: 10 });
  s = model.doc().sessions.find((x) => x.id === session.id);
  assert.equal(workout.nextPosition(s, seq).entry.slot, "A1", "round 2 starts with A1");
  model.stopExercise(session.id, "A1", true);
  s = model.doc().sessions.find((x) => x.id === session.id);
  assert.equal(s.exercises.find((e) => e.slot === "A1").stopped_after, 1);
  const pos = workout.nextPosition(s, seq);
  assert.equal(pos.entry.slot, "A2", "A1 is skipped from now on");
  assert.ok(seq.slice(pos.index).every((e) => e.slot !== "A1"), "no A1 set is asked again");
  model.stopExercise(session.id, "A1", false);
  s = model.doc().sessions.find((x) => x.id === session.id);
  assert.equal(workout.nextPosition(s, seq).entry.slot, "A1");
  assert.doesNotThrow(() => validateDocument(copy(model.doc())));
});

// ---------- 4. start any day ----------

test("V10 dayChoices lists every plan day of this week, marks the ones done, and works on a weekend", () => {
  const doc = validDoc(); // block starts Monday 2026-01-12
  doc.sessions = [finished("2026-01-13", 1, "leg_press", [work(1, 40, 10, 2, "2026-01-13")])];
  const tue = view.dayChoices(doc, "2026-01-15"); // Thursday of week 1
  assert.deepEqual(tue.map((d) => d.day), ["mon", "tue", "wed", "thu", "fri"]);
  assert.equal(tue.find((d) => d.day === "tue").done, true);
  assert.equal(tue.find((d) => d.day === "mon").done, false);
  assert.equal(tue.find((d) => d.day === "thu").today, true);
  const sat = view.dayChoices(doc, "2026-01-17");
  assert.equal(sat.length, 5);
  assert.ok(sat.every((d) => !d.today));
  assert.deepEqual(view.dayChoices(doc, "2026-01-05"), [], "before the plan starts: none");
});

// ---------- 5. screens ----------

test("V11 Plan is the plan to edit: no day arrows at the bottom and no Start; Today picks the day and starts it", () => {
  const s = src("ui/planday.js");
  assert.doesNotMatch(s, /Previous day:/);
  assert.doesNotMatch(s, /day-nav/);
  assert.doesNotMatch(s, /startWorkout/);
  const t = src("ui/today.js");
  assert.match(t, /dayChoices\(/);
  assert.match(t, /startWorkout\(\{[^}]*planDay: shown/);
});

test("V14 the Settings icon is gone from Today, Plan and Gym; Progress has a Settings button in words", () => {
  for (const f of ["ui/today.js", "ui/planday.js", "ui/machines.js", "ui/gymexercises.js"]) {
    let s = "";
    try { s = src(f); } catch { continue; }
    assert.doesNotMatch(s, /gearLink\(\)/, `${f} still shows the gear`);
  }
  assert.match(src("ui/progress.js"), /settingsButton\(\)/);
  assert.match(src("ui/parts.js"), /"Settings"/);
});

test("V12 the opened exercise shows the photo before the muscle maps", () => {
  const s = src("ui/exlayer.js");
  const body = s.slice(s.indexOf("return openSheet("));
  assert.ok(body.indexOf("flip(exId") > 0 && body.indexOf("flip(exId") < body.indexOf("maps,"), "flip comes before maps");
});

test("V13 the back view draws the back of the head (a plain rounded shape), not a face", () => {
  const head = BACK.find(([id]) => id === "head-back")[1];
  assert.match(head, /^M 52\.43,0\.55 C/);
  assert.doesNotMatch(head, /1\.48163,4\.0475101/, "the old jaw line is gone");
});
