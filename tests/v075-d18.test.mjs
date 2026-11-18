// Version 0.7.5 (worker 8.42): trainer decision D18, machines instead of awkward moves
// (docs/plan/2026-11-18-trainer-weekly-plan.md, D18; trainer worker 8.37, commit aa42645).
// In the plan, with confirmed equipment: hip thrust -> hip thrust machine (Booty Builder) on Tuesday C1 and Friday B1,
// cable crunch -> crunch with a dumbbell (Tuesday A2), dead bug -> plank (Tuesday C2), Smith standing calf raise ->
// calf raise on the leg press (Friday D). After the first-visit machine check, one-tap offers for machines the gym's
// website does not confirm. D18's 7 tests (D18-1 to D18-7) plus the builder's own (B-...). Written before the build.
// Expected values are written out by hand from D18, not computed from the data. All values are made up; no body data.
import test from "node:test";
import assert from "node:assert/strict";
import { exercises, days, DAY_IDS, firstTryKg, extraMachines, BIG_LIFTS } from "../app/js/plan/plan-v2.js";
import { exerciseMuscles } from "../app/js/plan/muscles.js";
import { cues } from "../app/js/plan/cues.js";
import { media, photosFor, videoFor, machines, machineOf } from "../app/js/plan/media.js";
import { MACHINE_IDS } from "../app/js/plan/machine-ids.js";
import { setsForSlot, effectiveDay, checkPlanDay, planSwapChoices, planDayId } from "../app/js/engine/planedits.js";
import { planForSession, planForDay } from "../app/js/engine/schedule.js";
import { suggestFor, performances } from "../app/js/engine/workout.js";
import { defaultSettings, validateDocument } from "../app/js/validate.js";
import { validDoc } from "./fixtures/profiles.mjs";

const NEW_IDS = ["booty_builder_hip_thrust", "weighted_crunch", "ab_crunch_machine", "reverse_pec_deck"];
const OLD_IDS = ["hip_thrust", "cable_crunch", "dead_bug", "calf_raise_standing"];
const row = (d) => days[d].slots.map((s) => [s.slot, s.ex, s.sets, s.rest]);

// Tuesday and Friday before D18 (0.7.4), as the trainer kept them in tests/trainer-plan.test.mjs before this change.
const BEFORE = {
  tue: [["A1", "leg_press", 3, null], ["A2", "cable_crunch", 3, 90], ["B1", "romanian_deadlift", 3, null], ["B2", "face_pull", 3, 90], ["C1", "hip_thrust", 3, null], ["C2", "dead_bug", 3, 75], ["D", "leg_extension", 3, 60]],
  fri: [["A1", "smith_squat", 3, null], ["A2", "reverse_crunch", 3, 90], ["B1", "hip_thrust", 3, null], ["B2", "lateral_raise", 3, 75], ["C1", "cable_pull_through", 3, null], ["C2", "side_plank", 2, 60], ["D", "calf_raise_standing", 3, 60]],
};
// Monday, Wednesday and Thursday did not change in D18.
const UNCHANGED = {
  mon: [["A1", "chest_press", 3, null], ["A2", "pulldown", 3, 90], ["B1", "shoulder_press_machine", 3, null], ["B2", "one_arm_db_row", 3, 90], ["C1", "db_curl", 3, null], ["C2", "triceps_pushdown", 3, 60], ["Abs1", "plank", 2, 30], ["D", "calf_raise_leg_press", 3, 60]],
  wed: [["A1", "goblet_squat", 3, null], ["A2", "db_bench_press", 3, 90], ["B1", "pulldown", 3, null], ["B2", "lateral_raise", 2, 75], ["C1", "hammer_curl", 2, null], ["C2", "overhead_triceps_ext", 2, 60], ["Abs1", "side_plank", 2, 30], ["D", "calf_raise_leg_press", 3, 60]],
  thu: [["A1", "incline_db_press", 3, null], ["A2", "seated_cable_row", 3, 90], ["B1", "seated_db_shoulder_press", 3, null], ["B2", "face_pull", 3, 75], ["C1", "lateral_raise", 3, null], ["C2", "triceps_pushdown", 3, 60], ["Abs1", "plank", 2, 30], ["D", "db_lying_leg_curl", 3, 60]],
};

// ---------- D18-1 the five day changes ----------

test("D18-1 the five day changes: Tuesday A2, C1, C2 and Friday B1, D; sets and rest unchanged on every slot", () => {
  assert.deepEqual(row("tue"), [
    ["A1", "leg_press", 3, null], ["A2", "weighted_crunch", 3, 90], ["B1", "romanian_deadlift", 3, null], ["B2", "face_pull", 3, 90],
    ["C1", "booty_builder_hip_thrust", 3, null], ["C2", "plank", 3, 75], ["D", "leg_extension", 3, 60],
  ]);
  assert.deepEqual(row("fri"), [
    ["A1", "smith_squat", 3, null], ["A2", "reverse_crunch", 3, 90], ["B1", "booty_builder_hip_thrust", 3, null], ["B2", "lateral_raise", 3, 75],
    ["C1", "cable_pull_through", 3, null], ["C2", "side_plank", 2, 60], ["D", "calf_raise_leg_press", 3, 60],
  ]);
  for (const d of ["tue", "fri"]) {
    days[d].slots.forEach((s, i) => {
      assert.equal(s.slot, BEFORE[d][i][0], `${d} slot ${i}`);
      assert.equal(s.sets, BEFORE[d][i][2], `${d} ${s.slot} sets unchanged`);
      assert.equal(s.rest, BEFORE[d][i][3], `${d} ${s.slot} rest unchanged`);
    });
  }
  for (const d of ["mon", "wed", "thu"]) assert.deepEqual(row(d), UNCHANGED[d], `${d} unchanged`);
});

// ---------- D18-2 weekly sets per muscle unchanged ----------

function fractionalSets(dayRows, week) {
  const out = {};
  for (const d of DAY_IDS) for (const [slot, ex, sets] of dayRows[d]) {
    const n = setsForSlot(week, { slot, sets }, d);
    const m = exerciseMuscles[ex];
    for (const x of m.main) out[x] = (out[x] || 0) + n;
    for (const x of m.helpers) out[x] = (out[x] || 0) + n / 2;
  }
  return out;
}

test("D18-2 every muscle, every week 1-12: the fractional sets per muscle are the same before and after", () => {
  const before = { ...UNCHANGED, ...BEFORE };
  const now = Object.fromEntries(DAY_IDS.map((d) => [d, row(d)]));
  for (let week = 1; week <= 12; week++) {
    const a = fractionalSets(before, week);
    const b = fractionalSets(now, week);
    assert.deepEqual(Object.keys(b).sort(), Object.keys(a).sort(), `week ${week}: the same muscles`);
    for (const m of Object.keys(a)) assert.equal(b[m], a[m], `week ${week}: ${m}`);
  }
  // The check can fail: a planted swap to an exercise with other muscles changes the numbers.
  const planted = { ...now, tue: now.tue.map((r) => (r[0] === "C1" ? ["C1", "leg_extension", r[2], r[3]] : r)) };
  assert.notDeepEqual(fractionalSets(planted, 3), fractionalSets(before, 3));
});

// ---------- D18-3 the new exercises ----------

test("D18-3 the new exercises: D18's exact data (name, equipment, kind, range, step, muscle group, swaps)", () => {
  const e = exercises;
  assert.deepEqual(
    NEW_IDS.map((id) => [e[id].name, e[id].equipment, e[id].kind, e[id].range, e[id].step]),
    [
      ["Hip thrust machine", "Booty Builder (glutes area)", "reps", [8, 12], "stack"],
      ["Crunch with a dumbbell", "Mat or flat bench, 1 dumbbell on the chest", "reps", [10, 15], "dumbbell"],
      ["Ab crunch machine", "Ab crunch machine (first visit check)", "reps", [10, 15], "stack"],
      ["Reverse pec deck", "Pec deck, facing the pad (first visit check)", "reps", [12, 15], "stack"],
    ]);
  assert.deepEqual(NEW_IDS.map((id) => e[id].muscle), ["glutes", "abs", "abs", "back"]);
  for (const id of NEW_IDS) assert.ok(!e[id].perSide, `${id}: not per side`);
  assert.deepEqual(e.booty_builder_hip_thrust.swaps, [{ id: "hip_thrust" }, { id: "db_glute_bridge" }]);
  assert.deepEqual(e.weighted_crunch.swaps, [{ id: "ab_crunch_machine", needsMachine: "ab_crunch" }, { id: "cable_crunch" }, { id: "reverse_crunch" }]);
  assert.deepEqual(e.ab_crunch_machine.swaps, []);
  assert.deepEqual(e.reverse_pec_deck.swaps, []);
});

test("D18-3 the new exercises: muscles (main; helpers; equipment) as D18", () => {
  const m = (id) => [exerciseMuscles[id].main, exerciseMuscles[id].helpers, exerciseMuscles[id].equip];
  assert.deepEqual(m("booty_builder_hip_thrust"), [["glutes"], ["hamstrings"], "machine"]);
  assert.deepEqual(m("weighted_crunch"), [["abs"], [], "dumbbell"]);
  assert.deepEqual(m("ab_crunch_machine"), [["abs"], [], "machine"]);
  assert.deepEqual(m("reverse_pec_deck"), [["rear_delts"], ["mid_back"], "machine"]);
  // Each new planned exercise has exactly the muscles of the one it replaces (D18: "the same muscle data").
  for (const [neu, old] of [["booty_builder_hip_thrust", "hip_thrust"], ["weighted_crunch", "cable_crunch"], ["plank", "dead_bug"], ["calf_raise_leg_press", "calf_raise_standing"]]) {
    assert.deepEqual([exerciseMuscles[neu].main, exerciseMuscles[neu].helpers], [exerciseMuscles[old].main, exerciseMuscles[old].helpers], `${neu} = ${old}`);
  }
});

test("D18-3 the new exercises: D18's cues word for word", () => {
  assert.equal(cues.booty_builder_hip_thrust, "Upper back on the pad, belt over your hips, feet flat on the plate. Push through your heels until your hips are straight, squeeze your glutes, ribs down. Lower slowly.");
  assert.equal(cues.weighted_crunch, "Lie on your back, knees bent, a dumbbell held on your chest. Breathe out and curl your shoulders off the mat, pause, lower slowly. Lower back stays down.");
  assert.equal(cues.ab_crunch_machine, "Feet hooked, hold the handles. Breathe out and curl your chest toward your hips, return slowly. Do not pull with your arms.");
  assert.equal(cues.reverse_pec_deck, "Face the pad, handles at shoulder height, arms almost straight. Open your arms out and back, squeeze your shoulder blades, return slowly.");
});

test("D18-3 the new exercises: first try (D12 table), every swap exists, photos, a video and a machine card", () => {
  assert.deepEqual(NEW_IDS.map((id) => firstTryKg[id]), [20, 2, 15, 10]);
  for (const id of NEW_IDS) {
    for (const s of exercises[id].swaps) assert.ok(exercises[s.id], `${id}: swap ${s.id} exists`);
    assert.equal(photosFor(id)?.length, 2, `${id}: two photos`);
    assert.ok(media[id].match === "same" || (media[id].match === "close" && media[id].matchNote), `${id}: match`);
    assert.match(videoFor(id)?.url ?? "", /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/, `${id}: video`);
    assert.ok(machines[machineOf[id]], `${id}: a machine or station`);
  }
  assert.deepEqual(NEW_IDS.map((id) => machineOf[id]), ["booty_builder", "mat_area", "ab_crunch", "pec_deck"]);
});

test("B-1 the hip thrust machine is a big lift (Tuesday C1 keeps both warm-up sets, as the hip thrust did under T2)", () => {
  assert.ok(BIG_LIFTS.includes("booty_builder_hip_thrust"));
  assert.ok(BIG_LIFTS.includes("hip_thrust"), "the old id stays a big lift for swaps and old workouts");
  assert.ok(!BIG_LIFTS.includes("weighted_crunch"));
});

// ---------- D18-4 the old ids stay valid ----------

test("D18-4 the old ids keep their data: exercise, muscles, first try, cue, photos, video; they are swaps now", () => {
  for (const id of OLD_IDS) {
    assert.ok(exercises[id], `${id} still exists`);
    assert.ok(exerciseMuscles[id], `${id} muscles`);
    assert.ok(cues[id], `${id} cue`);
    assert.ok(photosFor(id), `${id} photos`);
    assert.ok(videoFor(id), `${id} video`);
    assert.ok(!DAY_IDS.some((d) => days[d].slots.some((s) => s.ex === id)), `${id} left the plan's days`);
  }
  assert.deepEqual(OLD_IDS.map((id) => firstTryKg[id] ?? null), [20, 20, null, 10]);
  // D18 swap additions on old exercises.
  assert.deepEqual(exercises.hip_thrust.swaps.map((s) => s.id), ["booty_builder_hip_thrust", "db_glute_bridge"]);
  assert.deepEqual(exercises.cable_crunch.swaps.map((s) => s.id), ["weighted_crunch", "reverse_crunch"]);
  assert.deepEqual(exercises.face_pull.swaps, [{ id: "rear_delt_raise" }, { id: "reverse_pec_deck", needsMachine: "pec_deck" }]);
  // Each old id is reachable from the slot it left (the plan's swaps of the new exercise there).
  const swapsOf = (id) => exercises[id].swaps.map((s) => s.id);
  assert.ok(swapsOf("booty_builder_hip_thrust").includes("hip_thrust"));
  assert.ok(swapsOf("weighted_crunch").includes("cable_crunch"));
  assert.ok(swapsOf("plank").includes("dead_bug"));
  assert.ok(swapsOf("calf_raise_leg_press").includes("calf_raise_standing"));
});

// A made-up finished Tuesday from before D18, with hip thrust, cable crunch and dead bug logs.
const w = (n, kg, reps) => ({ n, type: "work", weight_kg: kg, reps, seconds: null, rir: 2, done_at: "2026-02-03T09:00:00.000Z" });
function oldTuesday(date, { hip = 30, crunch = 25, status = "finished", planned = true } = {}) {
  const rec = (slot, ex, sets, rest, workSets) => ({ slot, plan_exercise: ex, done_exercise: ex, swap_reason: null, sets: workSets, note: "",
    ...(planned ? { planned_sets: sets, planned_rest: rest } : {}) });
  return {
    id: `s-${date.replaceAll("-", "")}-t1`, updated_at: `${date}T10:00:00.000Z`, date, plan_day: "tue", week: 3, kind: "full",
    swapped_from: null, status, started_at: `${date}T08:00:00.000Z`, finished_at: status === "finished" ? `${date}T10:00:00.000Z` : null, walk: null,
    exercises: [
      rec("A1", "leg_press", 3, null, [w(1, 60, 10), w(2, 60, 10), w(3, 60, 10)]),
      rec("A2", "cable_crunch", 3, 90, [w(1, crunch, 12), w(2, crunch, 12), w(3, crunch, 12)]),
      rec("B1", "romanian_deadlift", 3, null, [w(1, 12, 10)]),
      rec("B2", "face_pull", 3, 90, [w(1, 15, 12)]),
      rec("C1", "hip_thrust", 3, null, [w(1, hip, 10), w(2, hip, 10), w(3, hip, 10)]),
      rec("C2", "dead_bug", 3, 75, [w(1, 0, 8), w(2, 0, 8), w(3, 0, 8)]),
      rec("D", "leg_extension", 3, 60, [w(1, 20, 12)]),
    ],
    note: "",
  };
}

test("D18-4 a saved Tuesday with hip thrust, cable crunch and dead bug logs keeps its history and its own day", () => {
  const doc = validDoc();
  doc.sessions = [oldTuesday("2026-02-03")];
  assert.equal(validateDocument(doc).ok, true, "the old workout still passes the file check");
  for (const id of ["hip_thrust", "cable_crunch", "dead_bug"]) {
    assert.equal(performances(doc.sessions, id).length, 1, `${id}: its log is read`);
    const sg = suggestFor(doc, id, { week: 4, missed: null, exerciseState: undefined });
    assert.match(sg.lastText ?? "", /^Last time: /, `${id}: "Last time" shows`);
  }
  assert.match(suggestFor(doc, "hip_thrust", { week: 4, missed: null, exerciseState: undefined }).lastText, /30 kg × 10, 10, 10/);
  // The past workout keeps its own exercises, sets and rest (a plan change never changes it).
  const plan = planForSession(doc.sessions[0]);
  assert.deepEqual(plan.slots.map((s) => [s.slot, s.ex, s.sets, s.rest]), BEFORE.tue);
  // A workout saved before planned_sets existed: the same, read from the plan's places (sets and rest did not change).
  const older = planForSession(oldTuesday("2026-02-03", { planned: false }));
  assert.deepEqual(older.slots.map((s) => [s.slot, s.ex]), BEFORE.tue.map((r) => [r[0], r[1]]));
  assert.deepEqual(older.slots.map((s) => s.rest), BEFORE.tue.map((r) => r[3]));
});

test("D18-4 a running Tuesday started before D18 keeps hip thrust, cable crunch and dead bug", () => {
  const run = oldTuesday("2026-02-10", { status: "in_progress" });
  run.exercises.forEach((r) => { r.sets = r.sets.slice(0, 1); });
  assert.deepEqual(planForSession(run).slots.map((s) => s.ex), BEFORE.tue.map((r) => r[1]));
});

test("D18-4 a saved Plan edit naming hip_thrust (and the other old ids) still uses them: your own choice wins", () => {
  const record = { id: planDayId("tue"), updated_at: "2026-02-01T10:00:00.000Z", plan_id: "plan-v2", day: "tue", slots: BEFORE.tue.map(([slot, ex, sets, rest]) => ({ slot, ex, sets: slot === "A1" ? 4 : sets, rest })) };
  assert.equal(checkPlanDay(record, "tue").ok, true);
  const eff = effectiveDay("tue", record);
  assert.equal(eff.edited, true);
  assert.equal(eff.newerVersion, false);
  assert.deepEqual(eff.slots.map((s) => s.ex), BEFORE.tue.map((r) => r[1]));
  // Only C1 swapped back to the old hip thrust: the rest of the day is the new plan's.
  const one = { ...record, slots: row("tue").map(([slot, ex, sets, rest]) => ({ slot, ex: slot === "C1" ? "hip_thrust" : ex, sets, rest })) };
  assert.deepEqual(effectiveDay("tue", one).slots.map((s) => s.ex), ["leg_press", "weighted_crunch", "romanian_deadlift", "face_pull", "hip_thrust", "plank", "leg_extension"]);
  assert.equal(planForDay("tue", 3, "full", one).slots.find((s) => s.slot === "C1").ex, "hip_thrust");
  // The Friday edit too.
  const fri = { id: planDayId("fri"), updated_at: "2026-02-01T10:00:00.000Z", plan_id: "plan-v2", day: "fri", slots: BEFORE.fri.map(([slot, ex, sets, rest]) => ({ slot, ex, sets, rest: slot === "D" ? 90 : rest })) };
  assert.deepEqual(effectiveDay("fri", fri).slots.map((s) => s.ex), BEFORE.fri.map((r) => r[1]));
});

test("B-2 the plan's own pick: the old hip thrust is offered back on the slot it left", () => {
  assert.ok(planSwapChoices("tue", "C1", null, {}).includes("hip_thrust"));
  assert.ok(planSwapChoices("tue", "A2", null, {}).includes("cable_crunch"));
  assert.ok(planSwapChoices("tue", "C2", null, {}).includes("dead_bug"));
  assert.ok(planSwapChoices("fri", "D", null, {}).includes("calf_raise_standing"));
});

// ---------- D18-5 machines only after the first-visit check ----------

test("D18-5 ab crunch machine and reverse pec deck are hidden unless the first-visit check says yes", () => {
  for (const v of [undefined, null, false]) {
    const settings = { extra_machines: { ab_crunch: v, pec_deck: v } };
    assert.ok(!planSwapChoices("tue", "A2", null, settings).includes("ab_crunch_machine"), `ab crunch hidden (${v})`);
    assert.ok(!planSwapChoices("tue", "B2", null, settings).includes("reverse_pec_deck"), `reverse pec deck hidden (${v})`);
    assert.ok(!planSwapChoices("thu", "B2", null, settings).includes("reverse_pec_deck"));
  }
  const yes = { extra_machines: { ab_crunch: true, pec_deck: true } };
  assert.ok(planSwapChoices("tue", "A2", null, yes).includes("ab_crunch_machine"));
  assert.ok(planSwapChoices("tue", "B2", null, yes).includes("reverse_pec_deck"));
  assert.ok(planSwapChoices("thu", "B2", null, yes).includes("reverse_pec_deck"));
});

test("D18-5 the new first-visit check 'ab_crunch': appended to the checks, the defaults, the machine ids and the cards", () => {
  assert.deepEqual(extraMachines, ["lat_pulldown", "seated_row", "leg_curl", "pec_deck", "calf_raise", "ab_crunch"]);
  assert.deepEqual(Object.keys(defaultSettings().extra_machines), extraMachines);
  assert.equal(defaultSettings().extra_machines.ab_crunch, null, "not checked yet");
  assert.deepEqual(MACHINE_IDS.slice(-2), ["booty_builder", "ab_crunch"], "new gym-spot ids are appended, never renamed");
  assert.equal(machines.ab_crunch.check, "ab_crunch");
  assert.equal(machines.booty_builder.check, undefined, "the Booty Builder is confirmed by the gym's website: no check");
  // A document from before 0.7.5 (no ab_crunch key) still passes and reads as "not checked".
  const doc = validDoc();
  assert.equal("ab_crunch" in doc.shared_settings.extra_machines, false);
  assert.equal(validateDocument(doc).ok, true);
  assert.ok(!planSwapChoices("tue", "A2", null, doc.shared_settings).includes("ab_crunch_machine"));
});

// ---------- D18-6 the first weight of a new exercise ----------

const sug = (doc, id, week = 4, exerciseState) => suggestFor(doc, id, { week, missed: null, exerciseState });

test("D18-6 first weight: a hip thrust log of 30 and no own log -> the hip thrust machine starts at 30 x 20/20 = 30", () => {
  const doc = validDoc();
  doc.sessions = [oldTuesday("2026-02-03", { hip: 30 })];
  const s = sug(doc, "booty_builder_hip_thrust");
  assert.equal(s.weight_kg, 30);
  assert.match(s.note, /hip thrust/i, "the note says where the number comes from");
});

test("D18-6 first weight: rounded down to the stack (32.5 -> 30 with 5 kg steps; a 2.5 kg step keeps 32.5)", () => {
  const doc = validDoc();
  doc.sessions = [oldTuesday("2026-02-03", { hip: 32.5 })];
  assert.equal(sug(doc, "booty_builder_hip_thrust").weight_kg, 30);
  doc.shared_settings.stack_step_kg = { default: 2.5 };
  assert.equal(sug(doc, "booty_builder_hip_thrust").weight_kg, 32.5);
});

test("D18-6 first weight: no logs at all -> the D12 first try (20)", () => {
  const doc = validDoc();
  const s = sug(doc, "booty_builder_hip_thrust");
  assert.equal(s.weight_kg, 20);
  assert.equal(s.action, "first_try");
});

test("B-3 first weight: the crunch from the cable crunch log, 25 x 2/20 = 2.5, rounded down to the dumbbells (2)", () => {
  const doc = validDoc();
  doc.sessions = [oldTuesday("2026-02-03", { crunch: 25 })];
  assert.equal(sug(doc, "weighted_crunch").weight_kg, 2);
  doc.sessions = [oldTuesday("2026-02-03", { crunch: 45 })]; // 4.5 -> 4
  assert.equal(sug(doc, "weighted_crunch").weight_kg, 4);
});

test("B-4 first weight: no 30 % cut (D15's cut is only for pain), and never heavier than the conversion", () => {
  const doc = validDoc();
  doc.sessions = [oldTuesday("2026-02-03", { hip: 40 })];
  assert.equal(sug(doc, "booty_builder_hip_thrust").weight_kg, 40);
});

test("B-5 first weight: once the new exercise has its own log, its own suggestion decides", () => {
  const doc = validDoc();
  const own = oldTuesday("2026-02-10", { hip: 30 });
  const c1 = own.exercises.find((e) => e.slot === "C1");
  c1.plan_exercise = "booty_builder_hip_thrust";
  c1.done_exercise = "booty_builder_hip_thrust";
  c1.sets = [w(1, 50, 9), w(2, 50, 9), w(3, 50, 8)];
  doc.sessions = [oldTuesday("2026-02-03", { hip: 30 }), own];
  const s = sug(doc, "booty_builder_hip_thrust");
  assert.equal(s.last.weight_kg, 50, "its own log is read");
  assert.notEqual(s.weight_kg, 30, "not the converted hip thrust weight");
});

test("B-6 first weight: a weight set in the Plan, or a week-1 start weight, still wins over the conversion", () => {
  const doc = validDoc();
  doc.sessions = [oldTuesday("2026-02-03", { hip: 30 })];
  const mine = { id: "e-booty_builder_hip_thrust", exercise: "booty_builder_hip_thrust", my_weight_kg: 45, my_weight_at: "2026-02-05" };
  assert.equal(sug(doc, "booty_builder_hip_thrust", 4, mine).weight_kg, 45);
  const start = { id: "e-booty_builder_hip_thrust", exercise: "booty_builder_hip_thrust", start_weight_kg: 35 };
  assert.equal(sug(doc, "booty_builder_hip_thrust", 4, start).weight_kg, 35);
});

test("B-7 the plank and the calf raise on the leg press keep their own history when they have one", () => {
  const doc = validDoc();
  const fri = { ...oldTuesday("2026-02-06"), id: "s-20260206-f1", plan_day: "fri" };
  fri.exercises = [{ slot: "D", plan_exercise: "calf_raise_standing", done_exercise: "calf_raise_standing", swap_reason: null, sets: [w(1, 20, 12)], note: "", planned_sets: 3, planned_rest: 60 }];
  const mon = { ...oldTuesday("2026-02-09"), id: "s-20260209-m1", plan_day: "mon" };
  mon.exercises = [{ slot: "D", plan_exercise: "calf_raise_leg_press", done_exercise: "calf_raise_leg_press", swap_reason: null, sets: [w(1, 70, 12), w(2, 70, 12), w(3, 70, 11)], note: "", planned_sets: 3, planned_rest: 60 }];
  doc.sessions = [fri, mon];
  const s = sug(doc, "calf_raise_leg_press");
  assert.equal(s.last.weight_kg, 70, "its own Monday log decides");
});

// ---------- D18-7 the trainer's lock test moved to the new days ----------

test("D18-7 tests/trainer-plan.test.mjs locks the new days and knows the four new ids (trainer's agreement in D18)", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("./trainer-plan.test.mjs", import.meta.url), "utf8");
  for (const id of NEW_IDS) assert.ok(src.includes(`"${id}"`), `trainer 1 lists ${id}`);
  assert.ok(src.includes('["A2", "weighted_crunch", 3, 90]'), "KEPT_DAYS has the new Tuesday");
  assert.ok(src.includes('["D", "calf_raise_leg_press", 3, 60]]'), "KEPT_DAYS has the new Friday D");
});

// 0.7.6 (worker 8.43): "0.7.5 or later", the same in both files; tests/v076-release.test.mjs V0 pins 0.7.6.
test("V0 version: 0.7.5 or later in js/version.js, the same at the top of sw.js", async () => {
  const { readFileSync } = await import("node:fs");
  const { APP_VERSION } = await import("../app/js/version.js");
  const n = APP_VERSION.split(".").map(Number);
  assert.ok(n[0] > 0 || n[1] > 7 || (n[1] === 7 && n[2] >= 5), APP_VERSION);
  assert.equal(readFileSync(new URL("../app/sw.js", import.meta.url), "utf8").match(/const APP_VERSION = "([^"]+)"/)[1], APP_VERSION);
});

// ---------- trainer's answers to 8.42 (commit 8ba08e5, D18 "Answers to 8.42") ----------

test("A-1 first weight: the calf raise on the leg press with no log of its own converts from a standing calf raise log (x 40/10)", () => {
  const doc = validDoc();
  const fri = { ...oldTuesday("2026-02-06"), id: "s-20260206-f1", plan_day: "fri" };
  fri.exercises = [{ slot: "D", plan_exercise: "calf_raise_standing", done_exercise: "calf_raise_standing", swap_reason: null, sets: [w(1, 20, 12), w(2, 20, 12)], note: "", planned_sets: 3, planned_rest: 60 }];
  doc.sessions = [fri];
  assert.equal(sug(doc, "calf_raise_leg_press").weight_kg, 80, "20 x 40/10 = 80");
  fri.exercises[0].sets = [w(1, 7.5, 12)]; // 30 -> 30 with 5 kg steps
  assert.equal(sug(doc, "calf_raise_leg_press").weight_kg, 30);
  fri.exercises[0].sets = [w(1, 1, 12)]; // 4 -> at least one step (5)
  assert.equal(sug(doc, "calf_raise_leg_press").weight_kg, 5);
});

const { d18Offer, withD18 } = await import("../app/js/engine/planedits.js");
const { d18Changes } = await import("../app/js/plan/plan-v2.js");
const recordOf = (day, rows) => ({ id: planDayId(day), updated_at: "2026-02-01T10:00:00.000Z", plan_id: "plan-v2", day, slots: rows.map(([slot, ex, sets, rest]) => ({ slot, ex, sets, rest })) });

test("A-2 the D18 slots: Tuesday A2, C1, C2 and Friday B1, D, each old -> new", () => {
  assert.deepEqual(d18Changes, {
    tue: { A2: { from: "cable_crunch", to: "weighted_crunch" }, C1: { from: "hip_thrust", to: "booty_builder_hip_thrust" }, C2: { from: "dead_bug", to: "plank" } },
    fri: { B1: { from: "hip_thrust", to: "booty_builder_hip_thrust" }, D: { from: "calf_raise_standing", to: "calf_raise_leg_press" } },
  });
});

test("A-3 a saved Tuesday or Friday edit still holding old D18 exercises gets one offer; never otherwise", () => {
  const tue = recordOf("tue", BEFORE.tue.map((r) => (r[0] === "A1" ? ["A1", r[1], 4, r[3]] : r)));
  const o = d18Offer("tue", tue, {});
  assert.equal(o.key, "tue:D18:plan");
  assert.deepEqual(o.swaps, [{ slot: "A2", from: "cable_crunch", to: "weighted_crunch" }, { slot: "C1", from: "hip_thrust", to: "booty_builder_hip_thrust" }, { slot: "C2", from: "dead_bug", to: "plank" }]);
  assert.deepEqual(d18Offer("fri", recordOf("fri", BEFORE.fri), {}).swaps.map((s) => s.slot), ["B1", "D"]);
  assert.equal(d18Offer("tue", tue, { "tue:D18:plan": "kept" }), null, "Keep mine is final");
  assert.equal(d18Offer("tue", tue, { "tue:D18:plan": "used" }), null);
  assert.equal(d18Offer("tue", null, {}), null, "the plan's own Tuesday: nothing to offer");
  assert.equal(d18Offer("tue", { ...tue, deleted: true }, {}), null, "back to the plan (tombstone)");
  assert.equal(d18Offer("tue", recordOf("tue", row("tue").map((r) => (r[0] === "A1" ? ["A1", r[1], 4, r[3]] : r))), {}), null, "an edit made on the new plan");
  assert.equal(d18Offer("mon", recordOf("mon", UNCHANGED.mon.map((r) => (r[0] === "A1" ? ["A1", r[1], 4, r[3]] : r))), {}), null, "Monday has no D18 slots");
  assert.equal(d18Offer("tue", { ...tue, slots: [{ slot: "Z9", ex: "plank", sets: 1, rest: 30 }] }, {}), null, "a record from a newer app");
  // Only the slots still holding the old exercise; a slot swapped to something else by Rosario is left alone.
  const mixed = recordOf("tue", BEFORE.tue.map((r) => (r[0] === "C1" ? ["C1", "db_glute_bridge", 3, null] : r)));
  assert.deepEqual(d18Offer("tue", mixed, {}).swaps.map((s) => s.slot), ["A2", "C2"]);
  // A new exercise already elsewhere in the day (an added plank): that slot cannot change, the others still can.
  const withPlank = recordOf("tue", [...BEFORE.tue, ["E1", "plank", 3, 60]]);
  assert.deepEqual(d18Offer("tue", withPlank, {}).swaps.map((s) => s.slot), ["A2", "C1"]);
});

test("A-4 Use them: only those slots change; Rosario's sets and rest stay", () => {
  const rows = BEFORE.tue.map((r) => (r[0] === "A1" ? ["A1", r[1], 4, r[3]] : r[0] === "C2" ? ["C2", r[1], 2, 60] : r));
  const tue = recordOf("tue", rows);
  const out = withD18(tue.slots, d18Offer("tue", tue, {}).swaps);
  assert.deepEqual(out.map((s) => [s.slot, s.ex, s.sets, s.rest]), [
    ["A1", "leg_press", 4, null], ["A2", "weighted_crunch", 3, 90], ["B1", "romanian_deadlift", 3, null], ["B2", "face_pull", 3, 90],
    ["C1", "booty_builder_hip_thrust", 3, null], ["C2", "plank", 2, 60], ["D", "leg_extension", 3, 60],
  ]);
  assert.deepEqual(tue.slots.map((s) => s.ex), BEFORE.tue.map((r) => r[1]), "the record itself is not changed by the pure call");
});
