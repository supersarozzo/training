// Version 0.7.1 (worker 8.39, 2026-11-18): the trainer's later list and the data fixes. Exact rules: the trainer's
// section 7.1 in docs/plan/2026-11-18-trainer-weekly-plan.md (answers T1-T5 to 8.39) and decision D10.
//  B1 D10 rule 2: stopped twice in a row, with a set below the range both times -> one smallest step lighter;
//     only in weeks with progress (T1); bodyweight never lighter; the 10 % rule and pain come first.
//  B2 L1 warm-up sets: by "big lift" and "first main muscle of the day" (T2).
//  B3 L2: weeks 7-11, days that are not leg days keep D at 3 sets and Abs1 has one set less (T3).
//  B4 L4: the cable pull-through is labelled glutes (T4).
//  C4 a weight set in the Plan carries its time (my_weight_time): the morning of a workout no longer wins after it.
//  C5 the muscle check counts a set once per row; the rows have main lats + mid back (T5).
// All values are made up. No body data.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { nextSuggestion, warmupSets } from "../app/js/engine/progression.js";
import * as workout from "../app/js/engine/workout.js";
import * as schedule from "../app/js/engine/schedule.js";
import * as pe from "../app/js/engine/planedits.js";
import * as plan from "../app/js/plan/plan-v2.js";
import { exerciseMuscles } from "../app/js/plan/muscles.js";
import { gymGroupOf } from "../app/js/engine/planpage.js";
import * as pv from "../app/js/planview.js";
import { createStore } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { validateDocument } from "../app/js/validate.js";
import { localDate } from "../app/js/ids.js";
import { validDoc, fakeStorage } from "./fixtures/profiles.mjs";

const { exercises, days, DAY_IDS, setsFor } = plan;
const copy = (v) => JSON.parse(JSON.stringify(v));
const src = (p) => readFileSync(new URL(`../app/js/${p}`, import.meta.url), "utf8");
const WEEKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// A made-up gym: dumbbells in 2 kg steps, stacks in 5 kg steps.
const settings = { dumbbell_steps_kg: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20], stack_step_kg: { default: 5 } };
const sets = (reps, rir = 2) => reps.map((r) => ({ reps: r, rir }));
const perf = (weight, reps, extra = {}) => ({ weight_kg: weight, sets: sets(reps), ...extra });
const suggest = (last, previous, opts) => nextSuggestion(last, previous, { settings, week: 3, exerciseId: "chest_press", ...opts });

// ---------- B1: D10 rule 2 ----------

test("B1-1 stopped twice, a set below the range both times -> one smallest step lighter, back to the bottom", () => {
  const r = suggest(perf(60, [8, 7], { stopped: true }), perf(60, [9, 6], { stopped: true }));
  assert.equal(r.action, "lower");
  assert.equal(r.weight_kg, 55);
  assert.deepEqual(r.range, [8, 12]);
  assert.equal(r.note, "You stopped early twice and missed the range. One step lighter.");
});

test("B1-2 stopped twice but every set in the range -> same weight (the stop hold)", () => {
  const r = suggest(perf(60, [9, 8], { stopped: true }), perf(60, [10, 8], { stopped: true }));
  assert.equal(r.action, "hold");
  assert.equal(r.weight_kg, 60);
});

test("B1-3 stopped once (the time before was a full workout) -> same weight", () => {
  const r = suggest(perf(60, [8, 7], { stopped: true }), perf(60, [9, 7, 6]));
  assert.equal(r.action, "hold");
  assert.equal(r.weight_kg, 60);
  const r2 = suggest(perf(60, [8, 7]), perf(60, [9, 6], { stopped: true }));
  assert.notEqual(r2.action, "lower", "the last one was not stopped");
});

test("B1-4 only one of the two stops missed the range -> same weight", () => {
  const r = suggest(perf(60, [8, 7], { stopped: true }), perf(60, [9, 8], { stopped: true }));
  assert.equal(r.action, "hold");
  assert.equal(r.weight_kg, 60);
});

test("B1-5 bodyweight and timed exercises never go lighter", () => {
  const r = suggest(perf(0, [9, 8], { stopped: true }), perf(0, [9, 9], { stopped: true }), { exerciseId: "reverse_crunch" });
  assert.notEqual(r.action, "lower");
  assert.equal(r.weight_kg, 0);
  const hold = (s) => ({ weight_kg: 0, sets: s.map((x) => ({ seconds: x, reps: x, rir: 2 })), stopped: true });
  const p = suggest(hold([18]), hold([19]), { exerciseId: "plank" });
  assert.notEqual(p.action, "lower");
});

test("B1-6 week 1 and the easier weeks 6 and 12: no lower, same weight (T1)", () => {
  for (const week of [1, 6, 12]) {
    const r = suggest(perf(60, [8, 7], { stopped: true }), perf(60, [9, 6], { stopped: true }), { week });
    assert.equal(r.action, "hold", `week ${week}`);
    assert.equal(r.weight_kg, 60, `week ${week}`);
  }
  for (const week of [2, 5, 7, 11]) {
    assert.equal(suggest(perf(60, [8, 7], { stopped: true }), perf(60, [9, 6], { stopped: true }), { week }).action, "lower", `week ${week}`);
  }
});

test("B1-7 the 10 % rule and pain still come first", () => {
  const ten = suggest(perf(60, [5], { stopped: true }), perf(60, [4], { stopped: true }));
  assert.equal(ten.action, "lower10");
  const pain = suggest(perf(60, [8, 7], { stopped: true, pain: true }), perf(60, [9, 6], { stopped: true }));
  assert.equal(pain.action, "lower");
  assert.equal(pain.noIncrease, true, "the pain rule, not the stop rule");
});

test("B1-8 a range set in the Plan decides what 'below the range' means", () => {
  const r = suggest(perf(60, [6, 5], { stopped: true }), perf(60, [6, 5], { stopped: true }), { planRange: [5, 8] });
  assert.equal(r.action, "hold", "5 and 6 are inside 5 to 8");
});

test("B1-9 suggestFor reads two stopped workouts from the log and goes one step lighter", () => {
  const doc = validDoc();
  const w = (n, kg, reps) => ({ n, type: "work", weight_kg: kg, reps, seconds: null, rir: 2, done_at: "2026-02-23T09:00:00.000Z" });
  const s = (date, reps) => ({
    id: `s-${date.replaceAll("-", "")}-x1`, updated_at: `${date}T10:00:00.000Z`, date, plan_day: "mon", week: 3, kind: "full",
    swapped_from: null, status: "finished", started_at: `${date}T08:00:00.000Z`, finished_at: `${date}T10:00:00.000Z`, walk: null,
    exercises: [{ slot: "A1", plan_exercise: "chest_press", done_exercise: "chest_press", swap_reason: null, sets: reps.map((r, i) => w(i + 1, 60, r)), note: "", stopped_after: reps.length }], note: "",
  });
  doc.sessions = [s("2026-02-02", [9, 6]), s("2026-02-09", [8, 7])];
  const out = workout.suggestFor(doc, "chest_press", { week: 4, missed: null, exerciseState: undefined });
  assert.equal(out.action, "lower");
  assert.equal(out.weight_kg, 55);
});

test("B1-10 the Stop question points pain to Swap › It hurts", () => {
  assert.match(src("ui/pair.js"), /Does it hurt\? Use Swap › It hurts instead\./);
});

// ---------- B2: L1 warm-up sets (T2) ----------

// The warm-up count of the first set of every pair-first exercise of a day: { A1: n, B1: n, C1: n }.
function counts(dayId, week = 3, record = null, exOf) {
  const slots = schedule.daySlots(dayId, week, record);
  const { units, seq } = workout.buildSequence(slots);
  const out = {};
  for (const e of seq) if (e.setNumber === 1) out[e.slot] = workout.warmupCount(e, units, exOf);
  return out;
}

test("B2-1 the big lifts list is the trainer's", () => {
  assert.deepEqual([...plan.BIG_LIFTS].sort(), ["chest_press", "db_bench_press", "incline_db_press", "shoulder_press_machine", "seated_db_shoulder_press",
    "pulldown", "lat_pulldown_machine", "one_arm_db_row", "seated_cable_row", "seated_row_machine", "leg_press", "smith_squat", "goblet_squat",
    "hip_thrust", "db_glute_bridge", "romanian_deadlift",
    "booty_builder_hip_thrust", // trainer D18 (0.7.5): the hip thrust machine takes the hip thrust's place and its warm-up sets
  ].sort());
});

test("B2-2 every plan day: big lift first for its muscle = 2, small = 1, muscle already worked = 0; others 0", () => {
  assert.deepEqual(counts("mon"), { A1: 2, A2: 0, B1: 2, B2: 0, C1: 1, C2: 0, Abs1: 0, D: 0 });
  assert.deepEqual(counts("tue"), { A1: 2, A2: 0, B1: 2, B2: 0, C1: 2, C2: 0, D: 0 });
  assert.deepEqual(counts("wed"), { A1: 2, A2: 0, B1: 2, B2: 0, C1: 1, C2: 0, Abs1: 0, D: 0 });
  assert.deepEqual(counts("thu"), { A1: 2, A2: 0, B1: 2, B2: 0, C1: 1, C2: 0, Abs1: 0, D: 0 });
  assert.deepEqual(counts("fri"), { A1: 2, A2: 0, B1: 2, B2: 0, C1: 0, C2: 0, D: 0 }, "Friday's pull-through comes after the hip thrust (glutes)");
});

test("B2-3 the day as it really is: a Plan edit removes Friday's hip thrust -> the pull-through gets one light set", () => {
  const slots = pe.planDaySlots("fri").filter((s) => s.slot !== "B1");
  const rec = { id: pe.planDayId("fri"), updated_at: "2026-03-02T09:00:00.000Z", plan_id: "plan-v2", day: "fri", slots };
  assert.equal(counts("fri", 3, rec).C1, 1);
});

test("B2-4 the day as it really is: a swap during the workout counts the exercise really done", () => {
  // Friday B1 swapped to a lateral raise (made up): the glutes are not worked before C1 any more.
  const exOf = (slot) => (slot.slot === "B1" ? "lateral_raise" : slot.ex);
  assert.equal(counts("fri", 3, null, exOf).C1, 1);
  // Monday C1 swapped to a chest press would be a big lift whose muscle was already worked: none.
  const exOf2 = (slot) => (slot.slot === "C1" ? "db_bench_press" : slot.ex);
  assert.equal(counts("mon", 3, null, exOf2).C1, 0);
});

test("B2-5 a pair exercise left on its own by a Plan edit still follows the rule", () => {
  const slots = pe.planDaySlots("fri").filter((s) => s.slot !== "B1");
  const rec = { id: pe.planDayId("fri"), updated_at: "2026-03-02T09:00:00.000Z", plan_id: "plan-v2", day: "fri", slots };
  assert.equal(counts("fri", 3, rec).B2, 1, "the lateral raise is now first of its pair place and small");
});

test("B2-6 warmupSets with a count of 1 gives only the light set (about 50 % x 10); the default stays 2 sets", () => {
  const two = warmupSets(60, "chest_press", settings);
  assert.deepEqual(two, [{ weight_kg: 30, reps: 10 }, { weight_kg: 45, reps: 5 }]);
  assert.deepEqual(warmupSets(60, "chest_press", settings, 2), two);
  assert.deepEqual(warmupSets(20, "db_curl", settings, 1), [{ weight_kg: 10, reps: 10 }]);
  assert.deepEqual(warmupSets(20, "db_curl", settings, 0), []);
});

test("B2-7 the workout screen asks the engine for the count", () => {
  const t = src("ui/pair.js");
  assert.match(t, /warmupCount\(/);
  assert.match(t, /warmupSets\([^)]*,\s*wCount\)/);
});

// ---------- B3: L2 sets in weeks 7-11 (T3) ----------

const setOf = (w, d, slot) => setsFor(w, d, slot);

test("B3-1 weeks 7-11: Monday, Wednesday, Thursday keep D at 3 and Abs1 drops to 1; leg days keep D at 2", () => {
  for (const w of [7, 8, 9, 10, 11]) {
    for (const d of ["mon", "wed", "thu"]) {
      assert.equal(setOf(w, d, "D"), 3, `${d} D week ${w}`);
      assert.equal(setOf(w, d, "Abs1"), 1, `${d} Abs1 week ${w}`);
    }
    for (const d of ["tue", "fri"]) assert.equal(setOf(w, d, "D"), 2, `${d} D week ${w}`);
  }
});

test("B3-2 weeks 1-6 and 12 are unchanged for D and Abs1", () => {
  for (const d of ["mon", "wed", "thu"]) {
    assert.deepEqual([1, 2, 3, 4, 5, 6, 12].map((w) => setOf(w, d, "D")), [2, 3, 3, 3, 3, 2, 2], d);
    assert.deepEqual([1, 2, 3, 4, 5, 6, 12].map((w) => setOf(w, d, "Abs1")), [2, 2, 2, 2, 2, 1, 1], d);
  }
});

test("B3-3 setsForSlot with the day matches setsFor for every slot, day and week", () => {
  for (const d of DAY_IDS) for (const s of days[d].slots) for (const w of [0, ...WEEKS, 13]) assert.equal(pe.setsForSlot(w, s, d), setsFor(w, d, s.slot), `${d} ${s.slot} week ${w}`);
});

test("B3-4 added exercises E1 and E2 stay at 2 sets in weeks 7-11 on every day", () => {
  for (const d of DAY_IDS) for (const slot of ["E1", "E2"]) assert.equal(pe.setsForSlot(8, { slot, ex: "x", sets: 3, rest: 60 }, d), 2, `${d} ${slot}`);
});

test("B3-5 the engine's day (plain and edited) uses the new rule", () => {
  assert.equal(schedule.daySlots("mon", 8).find((s) => s.slot === "D").sets, 3);
  assert.equal(schedule.daySlots("mon", 8).find((s) => s.slot === "Abs1").sets, 1);
  const slots = pe.planDaySlots("thu").map((s) => (s.slot === "C2" ? { ...s, ex: "overhead_triceps_ext" } : s));
  const rec = { id: pe.planDayId("thu"), updated_at: "2026-03-02T09:00:00.000Z", plan_id: "plan-v2", day: "thu", slots };
  assert.equal(schedule.daySlots("thu", 9, rec).find((s) => s.slot === "D").sets, 3);
  assert.equal(schedule.daySlots("thu", 9, rec).find((s) => s.slot === "Abs1").sets, 1);
  assert.equal(schedule.daySlots("fri", 9, rec).find((s) => s.slot === "D").sets, 2, "a leg day: no change");
});

test("B3-6 past and running workouts keep the sets they were started with", () => {
  const session = { plan_day: "mon", week: 8, kind: "full", exercises: [
    { slot: "Abs1", plan_exercise: "plank", sets: [], planned_sets: 2, planned_rest: 30 },
    { slot: "D", plan_exercise: "calf_raise_leg_press", sets: [], planned_sets: 2, planned_rest: 60 },
  ] };
  const p = schedule.planForSession(session);
  assert.deepEqual(p.slots.map((s) => s.sets), [2, 2]);
});

test("B3-7 the Change sheet's week line and the Add sheet pass the day", () => {
  assert.match(src("ui/planedit.js"), /setsForSlot\(week, \{ \.\.\.slot, sets: draft\.sets \}, day\)/);
  assert.match(src("planview.js"), /setsForSlot\(clampWeek\(week\), probe, dayId\)/);
});

// ---------- B4: L4 (T4) ----------

test("B4-1 the cable pull-through is labelled glutes, as its muscle data; its swaps stay", () => {
  assert.equal(exercises.cable_pull_through.muscle, "glutes");
  assert.deepEqual(exerciseMuscles.cable_pull_through.main, ["glutes"]);
  assert.equal(gymGroupOf("cable_pull_through"), "glutes");
  assert.deepEqual(exercises.cable_pull_through.swaps.map((s) => s.id), ["romanian_deadlift", "leg_curl_machine"]);
});

// ---------- C4: a weight set in the Plan carries its time ----------

const at = (y, mo, d, h, mi = 0) => new Date(y, mo - 1, d, h, mi); // local time, like the phone
function modelAt(date) {
  const store = createStore(fakeStorage());
  store.save(validDoc());
  let ms = date.getTime();
  return createModel(store, () => new Date((ms += 1000)));
}
// One finished workout of leg_press at 100 kg x 12 x 3, started and finished at local times.
function withWorkout(doc, start, end) {
  const date = localDate(start);
  doc.sessions = [{
    id: "s-20260224-x1", updated_at: end.toISOString(), date, plan_day: "tue", week: 3, kind: "full", swapped_from: null,
    status: "finished", started_at: start.toISOString(), finished_at: end.toISOString(), walk: null, note: "",
    exercises: [{ slot: "A1", plan_exercise: "leg_press", done_exercise: "leg_press", swap_reason: null, note: "",
      sets: [1, 2, 3].map((n) => ({ n, type: "work", weight_kg: 100, reps: 12, seconds: null, rir: 2, done_at: start.toISOString() })) }],
  }];
  return doc;
}
const stateOf = (kg, when, dateOverride) => ({ id: "x-leg_press", updated_at: when.toISOString(), start_weight_kg: null, machine_note: "", fail_streak: 0,
  my_weight_kg: kg, my_weight_at: dateOverride ?? localDate(when), my_weight_time: when.toISOString() });
const sug = (doc, st) => workout.suggestFor(doc, "leg_press", { week: 3, missed: null, exerciseState: st });

test("C4-1 setExercisePrefs saves the time with the date; clearing clears both", () => {
  const model = modelAt(at(2026, 2, 24, 7, 30));
  model.setExercisePrefs("leg_press", { weightKg: 60 });
  let st = model.doc().exercise_state.find((x) => x.id === "x-leg_press");
  assert.match(st.my_weight_time, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  assert.equal(localDate(new Date(st.my_weight_time)), st.my_weight_at, "the time belongs to the saved day");
  model.setExercisePrefs("leg_press", { weightKg: null });
  st = model.doc().exercise_state.find((x) => x.id === "x-leg_press");
  assert.equal(st.my_weight_kg, null);
  assert.equal(st.my_weight_at, null);
  assert.equal(st.my_weight_time, null);
  model.setExercisePrefs("leg_press", { range: [6, 8] });
  st = model.doc().exercise_state.find((x) => x.id === "x-leg_press");
  assert.equal(st.my_weight_time, null, "a reps change alone does not touch the weight's time");
});

test("C4-2 set in the morning, workout later that day -> after the workout the normal steps decide", () => {
  const doc = withWorkout(validDoc(), at(2026, 2, 24, 9), at(2026, 2, 24, 10, 30));
  const s = sug(doc, stateOf(60, at(2026, 2, 24, 7, 30)));
  assert.notEqual(s.action, "mine");
  assert.ok(s.weight_kg > 100, "all sets at the top with reps left: heavier");
});

test("C4-3 set the same day after the workout finished -> the Plan's weight is used", () => {
  const doc = withWorkout(validDoc(), at(2026, 2, 24, 9), at(2026, 2, 24, 10, 30));
  const s = sug(doc, stateOf(60, at(2026, 2, 24, 20)));
  assert.equal(s.action, "mine");
  assert.equal(s.weight_kg, 60);
});

test("C4-4 old data with only the date keeps the old rule (same day counts as newer)", () => {
  const doc = withWorkout(validDoc(), at(2026, 2, 24, 9), at(2026, 2, 24, 10, 30));
  const st = stateOf(60, at(2026, 2, 24, 7, 30));
  delete st.my_weight_time;
  assert.equal(sug(doc, st).action, "mine");
  st.my_weight_time = null;
  assert.equal(sug(doc, st).action, "mine");
});

test("C4-5 a time from another day than my_weight_at (an older app changed the weight) is ignored: the date rule", () => {
  const doc = withWorkout(validDoc(), at(2026, 2, 24, 9), at(2026, 2, 24, 10, 30));
  // The time says 20 Feb (before the workout), the date says 25 Feb (after it): the date wins.
  const st = stateOf(60, at(2026, 2, 20, 7), localDate(at(2026, 2, 25, 8)));
  assert.equal(sug(doc, st).action, "mine");
  // The time says 26 Feb (after), the date says 20 Feb (before): the date wins, not used.
  const st2 = stateOf(60, at(2026, 2, 26, 7), localDate(at(2026, 2, 20, 8)));
  assert.notEqual(sug(doc, st2).action, "mine");
});

test("C4-6 no workout yet: the Plan's weight is used, with or without a time", () => {
  assert.equal(sug(validDoc(), stateOf(60, at(2026, 2, 24, 7))).action, "mine");
});

test("C4-7 the file check accepts my_weight_time (a time or null) and refuses anything else", () => {
  const doc = validDoc();
  doc.exercise_state = [stateOf(52.5, at(2026, 3, 1, 8))];
  assert.equal(validateDocument(copy(doc)).ok, true);
  const n = copy(doc); n.exercise_state[0].my_weight_time = null;
  assert.equal(validateDocument(n).ok, true);
  for (const bad of ["banana", "2026-03-01", 12, "2026-13-01T08:00:00.000Z"]) {
    const b = copy(doc); b.exercise_state[0].my_weight_time = bad;
    assert.equal(validateDocument(b).ok, false, String(bad));
  }
});

test("C4-8 the Change sheet's Undo puts the old time back too", () => {
  const t = src("ui/planedit.js");
  assert.match(t, /my_weight_time: stNow\?\.my_weight_time \?\? null/);
  assert.match(t, /my_weight_time: stOld\.my_weight_time \?\? null/);
});

// ---------- C5: rows count lats and mid back, once per set (T5) ----------

test("C5-1 the rows have main lats + mid back; the pulldowns stay lats only", () => {
  for (const id of ["one_arm_db_row", "seated_cable_row", "seated_row_machine"]) {
    assert.deepEqual(exerciseMuscles[id].main, ["lats", "mid_back"], id);
    assert.deepEqual(exerciseMuscles[id].helpers, ["biceps", "rear_delts"], id);
    assert.equal(gymGroupOf(id), "back", id);
  }
  for (const id of ["pulldown", "lat_pulldown_machine"]) assert.deepEqual(exerciseMuscles[id].main, ["lats"], id);
});

// The row numbers worked out here, on their own: a set counts 1 for a row if a main muscle is in the row, else 0.5 if
// a helper is (never both, never twice).
function rowByHand(doc, week, muscles) {
  let direct = 0;
  let weighted = 0;
  for (const d of DAY_IDS) {
    for (const s of schedule.daySlots(d, week, pv.editOf(doc, d))) {
      const m = exerciseMuscles[s.ex];
      if (m.main.some((g) => muscles.includes(g))) { direct += s.sets; weighted += s.sets; }
      else if (m.helpers.some((g) => muscles.includes(g))) weighted += s.sets / 2;
    }
  }
  return { direct, weighted };
}

test("C5-2 the Back row counts each set once, not once per main muscle", () => {
  for (const week of [2, 7]) {
    const rows = Object.fromEntries(pv.checkRows(validDoc(), week).map((r) => [r.id, r]));
    const hand = rowByHand(validDoc(), week, ["lats", "mid_back"]);
    assert.equal(rows.back.direct, hand.direct, `week ${week}`);
    assert.equal(rows.back.weighted, hand.weighted, `week ${week}`);
    const m = pv.weekMuscles(validDoc(), week);
    assert.ok(rows.back.direct < (m.direct.lats ?? 0) + (m.direct.mid_back ?? 0), "the rows' sets are not counted twice");
  }
});

test("C5-3 every row follows the once-per-row rule (shoulders included)", () => {
  const rows = pv.checkRows(validDoc(), 2);
  const ROWS = { chest: ["chest"], back: ["lats", "mid_back"], shoulders: ["front_delts", "side_delts", "rear_delts"], biceps: ["biceps"], quads: ["quads"], glutes: ["glutes"], calves: ["calves"], abs: ["abs"] };
  for (const [id, muscles] of Object.entries(ROWS)) {
    const r = rows.find((x) => x.id === id);
    const hand = rowByHand(validDoc(), 2, muscles);
    assert.equal(r.direct, hand.direct, id);
    assert.equal(r.weighted, hand.weighted, id);
  }
});

test("C5-4 lats get the trainer's direct sets: 12 in weeks 2-5, 14 in weeks 7-11", () => {
  assert.equal(pv.weekMuscles(validDoc(), 2).direct.lats, 12);
  assert.equal(pv.weekMuscles(validDoc(), 7).direct.lats, 14);
});
