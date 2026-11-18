// Version 0.7.6 (worker 8.43): trainer decision D19, the lowest weight (docs/plan/2026-11-18-trainer-weekly-plan.md, D19;
// trainer worker 8.37, commit 18c52fb). No suggestion for a weighted exercise ever goes below its smallest step:
// dumbbells the lightest dumbbell in Settings (no list: 2 kg); stacks one stack step (fallback 5 kg); Smith and
// plate-loaded moves 5 kg. Bodyweight and timed exercises stay at 0. It applies to every lowering (break rule, lower10,
// pain swap D15, every step down), through `lowerBy` and `stepDown`. Already at the floor and a rule asks for less: the
// weight holds, the suggestion says `atFloor: true`, the card says "Lightest weight already. Stop with 3 reps left
// today." and uses at least 3 reps left. A weight Rosario sets is used exactly as set.
// D19-1 to D19-8 are the trainer's 8 tests; B-... are the builder's own. Written before the build (they fail until it).
// Expected values are written out by hand from D19, not computed from the code. All values are made up; no body data.
import test from "node:test";
import assert from "node:assert/strict";
import { install } from "./fixtures/sheet-dom.mjs";

const { body } = install();
globalThis.requestAnimationFrame = () => 0;
globalThis.window.navigator = { standalone: true, onLine: true };
globalThis.window.matchMedia = () => ({ matches: true, addEventListener() {} });
const { store } = await import("../app/js/ui/app.js");
const { validDoc } = await import("./fixtures/profiles.mjs");
const P = await import("../app/js/engine/progression.js");
const { suggestFor, painSwapStart, lighterFor, targetText } = await import("../app/js/engine/workout.js");
const { exercises } = await import("../app/js/plan/plan-v2.js");
const { renderWorkout } = await import("../app/js/ui/workout.js");
const { setActive, clearActive } = await import("../app/js/active.js");

const NOTE = "Lightest weight already. Stop with 3 reps left today.";
const DB = { dumbbell_steps_kg: [2, 4, 6], stack_step_kg: { default: 5 } };
const NO_LIST = { stack_step_kg: { default: 5 } };
const NOTHING = {};
const BREAK_20 = { kind: "minus_20", weightFactor: 0.8, noIncrease: false };
const BREAK_10 = { kind: "minus_10", weightFactor: 0.9, noIncrease: false };

// A finished workout with one exercise at one weight (the reps decide the rule that fires).
let n = 0;
function done(date, exId, kg, reps, extra = {}) {
  n += 1;
  return {
    id: `s-${date.replaceAll("-", "")}-${n}`, updated_at: `${date}T10:00:00.000Z`, date, plan_day: "tue", week: 3, kind: "full", swapped_from: null,
    status: "finished", started_at: `${date}T08:00:00.000Z`, finished_at: `${date}T10:00:00.000Z`, walk: null, note: "",
    exercises: [{ slot: "B2", plan_exercise: exId, done_exercise: exId, swap_reason: null, note: "", planned_sets: 3, planned_rest: 90,
      sets: reps.map((r) => ({ type: "work", weight_kg: kg, reps: r, rir: 2 })), ...extra }],
  };
}
function docWith(settings, sessions, state = []) {
  const doc = validDoc();
  doc.shared_settings = { ...doc.shared_settings, dumbbell_steps_kg: undefined, ...settings };
  if (!("dumbbell_steps_kg" in settings)) delete doc.shared_settings.dumbbell_steps_kg;
  doc.sessions = sessions;
  doc.exercise_state = state;
  return doc;
}
const sugg = (doc, exId, missed = null, week = 3) =>
  suggestFor(doc, exId, { week, missed, exerciseState: doc.exercise_state.find((x) => x.id === `x-${exId}`) });

// ---------- the trainer's 8 tests ----------

test("D19-1 a cable at 5 kg (stack step 5), break factor 0.8: 5 kg, atFloor, the note, stop with 3 reps left", () => {
  assert.equal(P.weightAfterBreak(5, 0.8, "face_pull", DB), 5);
  assert.equal(P.lowerBy(5, 0.2, "face_pull", DB), 5);
  const doc = docWith(DB, [done("2026-02-03", "face_pull", 5, [12, 12, 12])]);
  const s = sugg(doc, "face_pull", BREAK_20);
  assert.equal(s.weight_kg, 5);
  assert.equal(s.atFloor, true);
  assert.equal(s.note, NOTE);
  // The card's effort: at least 3 reps left, whatever the week plans (2, or 1-2 in week 11).
  assert.equal(P.floorRir(2), 3);
  assert.equal(P.floorRir(3), 3);
  assert.equal(P.floorRir(4), 4);
  assert.equal(P.floorRir([1, 2]), 3);
  assert.match(targetText("face_pull", 2, P.floorRir(2)), /stop with 3 left$/);
});

test("D19-1 on the real workout card: the note and 'stop with 3 left' (week 2 plans 2 left)", () => {
  // Back after more than 4 weeks (2026-10-01 to 2026-11-18): the break rule asks for 20 % less; 5 kg is the floor.
  const doc = docWith(DB, [done("2026-10-01", "face_pull", 5, [12, 12, 12])]);
  doc.block.start_monday = "2026-11-09";
  const s = {
    id: "s-20261118-tue", updated_at: "2026-11-18T08:00:00.000Z", date: "2026-11-18", plan_day: "tue", week: 2, kind: "full", swapped_from: null,
    status: "in_progress", started_at: "2026-11-18T08:00:00.000Z", finished_at: null, walk: null, note: "",
    exercises: [{ slot: "B2", plan_exercise: "face_pull", done_exercise: "face_pull", swap_reason: null, note: "", planned_sets: 3, planned_rest: 90, sets: [] }],
  };
  doc.sessions.push(s);
  store.save(doc);
  store.saveDevice({});
  setActive({ session_id: s.id, phase: "weights", rest: null, hold: null });
  globalThis.location.hash = "#/workout";
  const out = renderWorkout();
  const text = (Array.isArray(out) ? out : [out]).map((x) => x.textContent).join(" ");
  clearActive();
  assert.ok(text.includes(NOTE), "the D19 note on the card");
  assert.match(text, /stop with 3 left/);
  assert.ok(!/stop with 2 left/.test(text), "not the week's 2 reps left");
  assert.ok(!text.includes("about 20 % lower"), "no untrue 'lower' note");
});

test("D19-2 dumbbells [2, 4, 6]: from 2 kg, lower10 gives 2 kg; no dumbbell list: from 2 kg gives 2 kg", () => {
  assert.equal(P.lowerBy(2, 0.1, "lateral_raise", DB), 2);
  assert.equal(P.lowerBy(2, 0.1, "lateral_raise", NO_LIST), 2);
  assert.equal(P.lowerBy(2, 0.1, "lateral_raise", NOTHING), 2);
  // Through the rule itself: two hard sessions in a row (a set 3 or more under the range) at the lightest dumbbell.
  for (const settings of [DB, NO_LIST]) {
    const doc = docWith(settings, [done("2026-02-03", "lateral_raise", 2, [8, 8, 8]), done("2026-02-06", "lateral_raise", 2, [8, 8, 8])]);
    const s = sugg(doc, "lateral_raise");
    assert.equal(s.action, "lower10");
    assert.equal(s.weight_kg, 2);
    assert.equal(s.atFloor, true);
    assert.equal(s.note, NOTE);
  }
});

test("D19-3 Smith squat at 5 kg added, break 0.8: 5 kg (also the hip thrust, the other plate-loaded move)", () => {
  assert.equal(P.weightAfterBreak(5, 0.8, "smith_squat", DB), 5);
  assert.equal(P.weightAfterBreak(5, 0.8, "hip_thrust", DB), 5);
  const doc = docWith(DB, [done("2026-02-03", "smith_squat", 5, [10, 10, 10])]);
  const s = sugg(doc, "smith_squat", BREAK_20);
  assert.equal(s.weight_kg, 5);
  assert.equal(s.atFloor, true);
});

test("D19-4 stepDown with n from 1 to 5 never goes below the floor, for every step type", () => {
  const cases = [
    ["face_pull", DB, 5], ["face_pull", { stack_step_kg: { default: 5, face_pull: 2.5 } }, 2.5], ["face_pull", NOTHING, 5],
    ["lateral_raise", DB, 2], ["lateral_raise", { dumbbell_steps_kg: [4, 6, 8] }, 4], ["lateral_raise", NO_LIST, 2],
    ["smith_squat", DB, 5], ["hip_thrust", NOTHING, 5],
  ];
  for (const [id, settings, floor] of cases) {
    for (const start of [floor, floor + 2, 7.5, 10, 12.5, 20]) {
      if (start < floor) continue;
      let prev = start;
      for (let k = 1; k <= 5; k++) {
        const w = P.stepDown(start, id, settings, k);
        assert.ok(w >= floor, `${id} from ${start} down ${k}: ${w} >= ${floor}`);
        assert.ok(w <= prev, `${id} from ${start} down ${k}: never heavier`);
        prev = w;
      }
    }
    assert.equal(P.stepDown(floor, id, settings, 1), floor, `${id} at the floor stays`);
  }
});

test("D19-5 the pain swap (D15) never returns 0 and never goes below the floor for a weighted exercise", () => {
  // The rule since 0.5 (30 % under a weight), used when there is no first-try table: a 5 kg cable used to give 0.
  assert.equal(lighterFor("face_pull", 5, DB), 5);
  assert.equal(lighterFor("cable_lateral_raise", 5, DB), 5);
  assert.equal(lighterFor("rear_delt_raise", 2, DB), 2);
  assert.equal(lighterFor("rear_delt_raise", 2, NOTHING), 2);
  const light = { weight_kg: 5, last: { weight_kg: 5 } };
  const combos = [
    ["face_pull", "rear_delt_raise", 5], ["face_pull", "reverse_pec_deck", 5], ["triceps_pushdown", "overhead_triceps_ext", 5],
    ["lateral_raise", "cable_lateral_raise", 2], ["db_curl", "cable_curl", 2], ["leg_press", "smith_squat", 5],
    ["cable_crunch", "weighted_crunch", 5], ["one_arm_db_row", "seated_cable_row", 2],
  ];
  for (const settings of [DB, NO_LIST, NOTHING]) {
    for (const [orig, next, kg] of combos) {
      const floor = P.minWeight(next, settings);
      assert.ok(floor > 0, `${next} is weighted`);
      for (const input of [
        { origId: orig, lastWorkKg: kg, origSugg: light, newSugg: { weight_kg: floor } },
        { origId: orig, lastWorkKg: null, origSugg: light, newSugg: { weight_kg: floor } },
        { origId: orig, lastWorkKg: null, origSugg: { weight_kg: null }, newSugg: { weight_kg: floor } },
        { origId: orig, lastWorkKg: 1, origSugg: light, newSugg: null },
      ]) {
        const w = painSwapStart(next, input, settings);
        assert.ok(w !== 0, `${orig} -> ${next}: never 0`);
        assert.ok(w >= floor, `${orig} -> ${next}: ${w} >= ${floor}`);
      }
    }
  }
});

test("D19-6 above the floor, lowering works as today: a cable at 20 kg (step 5), factor 0.8 gives 15 kg, atFloor false", () => {
  assert.equal(P.weightAfterBreak(20, 0.8, "face_pull", DB), 15);
  assert.equal(P.lowerBy(20, 0.1, "face_pull", DB), 15, "at least one step lower");
  assert.equal(P.lowerBy(6, 0.1, "lateral_raise", DB), 4);
  assert.equal(P.stepDown(20, "face_pull", DB), 15);
  assert.equal(P.stepDown(6, "lateral_raise", DB, 2), 2);
  const doc = docWith(DB, [done("2026-02-03", "face_pull", 20, [12, 12, 12])]);
  const s = sugg(doc, "face_pull", BREAK_20);
  assert.equal(s.weight_kg, 15);
  assert.equal(s.atFloor, false);
  assert.equal(s.note, "Back from a long break: about 20 % lower.");
  // One step above the floor still lowers to the floor: a real lowering, so no "lightest weight" note.
  const doc2 = docWith(DB, [done("2026-02-03", "face_pull", 10, [12, 12, 12])]);
  const s2 = sugg(doc2, "face_pull", BREAK_10);
  assert.equal(s2.weight_kg, 5);
  assert.equal(s2.atFloor, false);
  assert.equal(s2.note, "Back from a break: about 10 % lower.");
});

test("D19-7 bodyweight and timed exercises still give 0", () => {
  for (const id of ["plank", "side_plank", "reverse_crunch", "dead_bug"]) {
    assert.equal(P.minWeight(id, DB), 0, id);
    assert.equal(P.lowerBy(0, 0.2, id, DB), 0, id);
    assert.equal(P.stepDown(0, id, DB, 3), 0, id);
    assert.equal(P.weightAfterBreak(0, 0.8, id, DB), 0, id);
  }
  const doc = docWith(DB, [done("2026-02-03", "reverse_crunch", 0, [12, 12, 12])]);
  const s = sugg(doc, "reverse_crunch", BREAK_20);
  assert.equal(s.weight_kg, 0);
  assert.ok(!s.atFloor, "no floor note on a bodyweight exercise");
});

test("D19-8 a Plan weight set by Rosario below the floor is shown exactly as set", () => {
  const state = [{ id: "x-face_pull", updated_at: "2026-02-04T09:00:00.000Z", my_weight_kg: 2.5, my_weight_at: "2026-02-04", my_weight_time: "2026-02-04T09:00:00.000Z" }];
  const doc = docWith(DB, [done("2026-02-03", "face_pull", 5, [12, 12, 12])], state);
  const s = sugg(doc, "face_pull", BREAK_20);
  assert.equal(s.weight_kg, 2.5);
  assert.equal(s.action, "mine");
  assert.ok(!s.atFloor);
  const db = [{ id: "x-lateral_raise", updated_at: "2026-02-04T09:00:00.000Z", my_weight_kg: 1, my_weight_at: "2026-02-04", my_weight_time: "2026-02-04T09:00:00.000Z" }];
  assert.equal(sugg(docWith(DB, [], db), "lateral_raise").weight_kg, 1);
});

// ---------- the builder's own ----------

test("B-1 minWeight: the lightest dumbbell (else 2), one stack step (else 5), Smith and hip thrust 5, bodyweight 0", () => {
  assert.equal(P.minWeight("lateral_raise", DB), 2);
  assert.equal(P.minWeight("lateral_raise", { dumbbell_steps_kg: [6, 3, 9] }), 3);
  assert.equal(P.minWeight("lateral_raise", NOTHING), 2);
  assert.equal(P.minWeight("face_pull", DB), 5);
  assert.equal(P.minWeight("face_pull", { stack_step_kg: { default: 5, face_pull: 2.5 } }), 2.5);
  assert.equal(P.minWeight("face_pull", { stack_step_kg: { default: 7 } }), 7);
  assert.equal(P.minWeight("face_pull", NOTHING), 5);
  assert.equal(P.minWeight("smith_squat", NOTHING), 5);
  assert.equal(P.minWeight("hip_thrust", DB), 5);
  assert.equal(P.minWeight("plank", DB), 0);
  assert.equal(P.minWeight("not_an_exercise", DB), 0, "an id this app does not know: no floor, no crash");
});

test("B-2 a weight below the floor (set by Rosario) is never raised by a lowering, and never goes to 0", () => {
  assert.equal(P.stepDown(2.5, "face_pull", DB), 2.5);
  assert.equal(P.stepDown(1, "lateral_raise", DB, 3), 1);
  assert.equal(P.lowerBy(2.5, 0.2, "face_pull", DB), 2.5);
  assert.equal(P.lowerBy(1, 0.1, "lateral_raise", NOTHING), 1);
});

test("B-3 atFloor on every lowering rule: stopped twice, pain or form, the week-1 start after a break", () => {
  // Stopped early twice in a row below the range (D10 rule 2), in a progress week, at the lightest stack step.
  const stop = { stopped_after: 1 };
  const doc = docWith(DB, [done("2026-02-03", "face_pull", 5, [9], stop), done("2026-02-06", "face_pull", 5, [9], stop)]);
  const s = sugg(doc, "face_pull");
  assert.equal(s.weight_kg, 5);
  assert.equal(s.atFloor, true);
  assert.equal(s.note, NOTE);
  // Pain (swap reason hurts) on the last workout of this exercise at its floor.
  const pain = docWith(DB, [done("2026-02-03", "lateral_raise", 2, [12, 12, 12], { swap_reason: "hurts" })]);
  const p = sugg(pain, "lateral_raise");
  assert.equal(p.weight_kg, 2);
  assert.equal(p.atFloor, true);
  // The starting weight found in week 1, after a break: lowered by the break rule, held at the floor.
  const st = [{ id: "x-face_pull", updated_at: "2026-01-20T09:00:00.000Z", start_weight_kg: 5 }];
  const wk1 = docWith(DB, [{ ...done("2026-01-15", "face_pull", 5, [12, 12]), week: 1 }], st);
  const w = sugg(wk1, "face_pull", BREAK_20, 2);
  assert.equal(w.weight_kg, 5);
  assert.equal(w.atFloor, true);
  assert.equal(w.note, NOTE);
  // No lowering asked: no atFloor, whatever the weight.
  const plain = docWith(DB, [done("2026-02-03", "face_pull", 5, [13, 13, 13])]);
  assert.ok(!sugg(plain, "face_pull").atFloor);
});

test("B-4 the plan data has a floor for every weighted exercise and none for bodyweight ones", () => {
  for (const [id, ex] of Object.entries(exercises)) {
    const f = P.minWeight(id, DB);
    if (ex.step === "bodyweight") assert.equal(f, 0, id);
    else assert.ok(f > 0, id);
  }
  assert.ok(body, "fake page ready");
});

// ---------- trainer answers to 8.43 (commit 68d7f32) ----------

// Answer 1: after a pain swap that starts at the floor, the card uses at least 3 reps left and one combined note.
function painCard(swapKg) {
  const doc = docWith(DB, [done("2026-11-16", "face_pull", 10, [12, 12, 12])]);
  doc.block.start_monday = "2026-11-09";
  const s = {
    id: "s-20261118-tue-pain", updated_at: "2026-11-18T08:00:00.000Z", date: "2026-11-18", plan_day: "tue", week: 2, kind: "full", swapped_from: null,
    status: "in_progress", started_at: "2026-11-18T08:00:00.000Z", finished_at: null, walk: null, note: "",
    exercises: [{ slot: "B2", plan_exercise: "face_pull", done_exercise: "rear_delt_raise", swap_reason: "hurts", swap_weight_kg: swapKg, note: "Shoulder", planned_sets: 3, planned_rest: 90, sets: [] }],
  };
  doc.sessions.push(s);
  store.save(doc);
  store.saveDevice({});
  setActive({ session_id: s.id, phase: "weights", rest: null, hold: null });
  globalThis.location.hash = "#/workout";
  const out = renderWorkout();
  clearActive();
  return (Array.isArray(out) ? out : [out]).map((x) => x.textContent).join(" ");
}

test("A-1 a pain swap that starts at the floor: one combined note and stop with 3 reps left (trainer answer 1)", () => {
  const text = painCard(2); // the lightest dumbbell in [2, 4, 6]
  assert.ok(text.includes("You swapped because it hurt. Lightest weight already: stop with 3 reps left today."));
  assert.ok(!text.includes("Start light."), "one note, not two");
  assert.match(text, /stop with 3 left/);
  assert.ok(!/stop with 2 left/.test(text));
});

test("A-2 a pain swap above the floor keeps the old warning and the week's reps left", () => {
  const text = painCard(4);
  assert.ok(text.includes("You swapped because it hurt. Start light."));
  assert.ok(!text.includes("Lightest weight already"));
  assert.match(text, /stop with 2 left/);
});
