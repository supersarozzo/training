// Version 0.7.8 (worker 8.45): trainer decision D20, no hip thrust movement and abs on benches and machines
// (docs/plan/2026-11-18-trainer-weekly-plan.md, D20; trainer worker 8.37, commit c47b55e).
// Tuesday C1 and Friday B1: hip thrust machine -> Smith machine split squat (fallback: dumbbell step-up).
// Tuesday A2: crunch with a dumbbell -> reverse crunch on a flat bench (as Friday A2). New first-visit checks
// captain_chair and ab_bench (appended, never inserted), each with a one-tap offer, plus the D18 check ab_crunch.
// D20's 9 tests (D20-1 to D20-9) plus the builder's own (E-...). Written before the build. Expected values are written
// out by hand from D20, not computed from the data. All values are made up; no body data.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { exercises, days, DAY_IDS, firstTryKg, extraMachines, BIG_LIFTS } from "../app/js/plan/plan-v2.js";
import * as plan from "../app/js/plan/plan-v2.js";
import { exerciseMuscles } from "../app/js/plan/muscles.js";
import { cues } from "../app/js/plan/cues.js";
import { media, photosFor, videoFor, machines, machineOf } from "../app/js/plan/media.js";
import { MACHINE_IDS } from "../app/js/plan/machine-ids.js";
import * as edits from "../app/js/engine/planedits.js";
import { setsForSlot, effectiveDay, checkPlanDay, planSwapChoices, planDayId, machineOffers } from "../app/js/engine/planedits.js";
import { planForSession, planForDay, daySlots } from "../app/js/engine/schedule.js";
import { suggestFor, performances, buildSequence, warmupCount } from "../app/js/engine/workout.js";
import { defaultSettings, validateDocument } from "../app/js/validate.js";
import { validDoc } from "./fixtures/profiles.mjs";

const NEW_IDS = ["smith_split_squat", "db_step_up", "captain_chair_knee_raise", "decline_bench_crunch"];
const OLD_IDS = ["booty_builder_hip_thrust", "hip_thrust", "weighted_crunch"];
const row = (d) => days[d].slots.map((s) => [s.slot, s.ex, s.sets, s.rest]);

// Tuesday and Friday after D18 and before D20 (0.7.5 to 0.7.7), as tests/trainer-plan.test.mjs kept them.
const BEFORE = {
  tue: [["A1", "leg_press", 3, null], ["A2", "weighted_crunch", 3, 90], ["B1", "romanian_deadlift", 3, null], ["B2", "face_pull", 3, 90], ["C1", "booty_builder_hip_thrust", 3, null], ["C2", "plank", 3, 75], ["D", "leg_extension", 3, 60]],
  fri: [["A1", "smith_squat", 3, null], ["A2", "reverse_crunch", 3, 90], ["B1", "booty_builder_hip_thrust", 3, null], ["B2", "lateral_raise", 3, 75], ["C1", "cable_pull_through", 3, null], ["C2", "side_plank", 2, 60], ["D", "calf_raise_leg_press", 3, 60]],
};
// Monday, Wednesday and Thursday do not change in D20.
const UNCHANGED = {
  mon: [["A1", "chest_press", 3, null], ["A2", "pulldown", 3, 90], ["B1", "shoulder_press_machine", 3, null], ["B2", "one_arm_db_row", 3, 90], ["C1", "db_curl", 3, null], ["C2", "triceps_pushdown", 3, 60], ["Abs1", "plank", 2, 30], ["D", "calf_raise_leg_press", 3, 60]],
  wed: [["A1", "goblet_squat", 3, null], ["A2", "db_bench_press", 3, 90], ["B1", "pulldown", 3, null], ["B2", "lateral_raise", 2, 75], ["C1", "hammer_curl", 2, null], ["C2", "overhead_triceps_ext", 2, 60], ["Abs1", "side_plank", 2, 30], ["D", "calf_raise_leg_press", 3, 60]],
  thu: [["A1", "incline_db_press", 3, null], ["A2", "seated_cable_row", 3, 90], ["B1", "seated_db_shoulder_press", 3, null], ["B2", "face_pull", 3, 75], ["C1", "lateral_raise", 3, null], ["C2", "triceps_pushdown", 3, 60], ["Abs1", "plank", 2, 30], ["D", "db_lying_leg_curl", 3, 60]],
};

// ---------- D20-1 the three day changes ----------

test("D20-1 the three day changes: Tuesday A2 and C1, Friday B1; sets and rest unchanged; Friday A2 is still the reverse crunch", () => {
  assert.deepEqual(row("tue"), [
    ["A1", "leg_press", 3, null], ["A2", "reverse_crunch", 3, 90], ["B1", "romanian_deadlift", 3, null], ["B2", "face_pull", 3, 90],
    ["C1", "smith_split_squat", 3, null], ["C2", "plank", 3, 75], ["D", "leg_extension", 3, 60],
  ]);
  assert.deepEqual(row("fri"), [
    ["A1", "smith_squat", 3, null], ["A2", "reverse_crunch", 3, 90], ["B1", "smith_split_squat", 3, null], ["B2", "lateral_raise", 3, 75],
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
  // No hip thrust movement anywhere in the plan's days.
  for (const d of DAY_IDS) for (const s of days[d].slots) assert.ok(!/hip_thrust/.test(s.ex), `${d} ${s.slot}: ${s.ex}`);
});

// ---------- D20-2 weekly sets per muscle (the script check, weeks 1 to 12) ----------

function weekly(dayRows, week) {
  const direct = {};
  const frac = {};
  for (const d of DAY_IDS) for (const [slot, ex, sets] of dayRows[d]) {
    const n = setsForSlot(week, { slot, sets }, d);
    const m = exerciseMuscles[ex];
    for (const x of m.main) { direct[x] = (direct[x] || 0) + n; frac[x] = (frac[x] || 0) + n; }
    for (const x of m.helpers) frac[x] = (frac[x] || 0) + n / 2;
  }
  return { direct, frac };
}

test("D20-2 weeks 1-12: glutes, abs and hamstrings unchanged; quads and adductors +3 fractional (weeks 2-5, 7-11), +2 in weeks 1, 6 and 12", () => {
  const before = { ...UNCHANGED, ...BEFORE };
  const now = Object.fromEntries(DAY_IDS.map((d) => [d, row(d)]));
  // Written out by hand from D20: the split squat (3 sets on Tuesday and on Friday; 2 + 2 in weeks 1, 6 and 12) adds
  // half a set per set to quads and adductors as a helper.
  const PLUS = { 1: 2, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 3, 8: 3, 9: 3, 10: 3, 11: 3, 12: 2 };
  for (let week = 1; week <= 12; week++) {
    const a = weekly(before, week);
    const b = weekly(now, week);
    for (const m of ["glutes", "abs", "hamstrings"]) {
      assert.equal(b.direct[m] || 0, a.direct[m] || 0, `week ${week}: ${m} direct`);
      assert.equal(b.frac[m] || 0, a.frac[m] || 0, `week ${week}: ${m} fractional`);
    }
    for (const m of ["quads", "adductors"]) {
      assert.equal((b.frac[m] || 0) - (a.frac[m] || 0), PLUS[week], `week ${week}: ${m} fractional +${PLUS[week]}`);
      assert.equal(b.direct[m] || 0, a.direct[m] || 0, `week ${week}: ${m} direct unchanged`);
    }
    // Every other muscle: unchanged.
    for (const m of new Set([...Object.keys(a.frac), ...Object.keys(b.frac)])) {
      if (["quads", "adductors"].includes(m)) continue;
      assert.equal(b.frac[m] || 0, a.frac[m] || 0, `week ${week}: ${m} unchanged`);
    }
  }
  // D20's numbers for the front of the thighs: weeks 2-5 12 -> 15 fractional, direct 12 stays.
  assert.equal(weekly(before, 3).frac.quads, 12);
  assert.equal(weekly(now, 3).frac.quads, 15);
  assert.equal(weekly(now, 3).direct.quads, 12);
  assert.equal(weekly(now, 8).frac.quads, 17);
  assert.equal(weekly(now, 1).frac.quads, 10);
  // Glutes: 9 direct sets in weeks 2-5 and 7-11.
  for (const week of [2, 3, 4, 5, 7, 8, 9, 10, 11]) assert.equal(weekly(now, week).direct.glutes, 9, `week ${week} glutes direct`);
  // The check can fail: a planted swap to an exercise with other muscles changes the numbers.
  const planted = { ...now, tue: now.tue.map((r) => (r[0] === "C1" ? ["C1", "leg_extension", r[2], r[3]] : r)) };
  assert.notEqual(weekly(planted, 3).frac.glutes, weekly(before, 3).frac.glutes);
});

// ---------- D20-3 the new exercises ----------

test("D20-3 the new exercises: D20's exact data (name, equipment, kind, range, per side, step, muscle group, swaps)", () => {
  const e = exercises;
  assert.deepEqual(
    NEW_IDS.map((id) => [e[id].name, e[id].equipment, e[id].kind, e[id].range, e[id].step, e[id].perSide === true]),
    [
      ["Smith machine split squat", "Smith press station, safety stops set", "reps", [8, 12], "smith_2x2.5", true],
      ["Dumbbell step-up", "Bench at knee height or lower + dumbbells", "reps", [8, 12], "dumbbell", true],
      ["Knee raise on the captain's chair", "Captain's chair: back pad and arm rests (first visit check)", "reps", [10, 15], "bodyweight", false],
      ["Crunch on a decline abs bench", "Decline abs bench with foot rollers (first visit check)", "reps", [10, 15], "bodyweight", false],
    ]);
  assert.deepEqual(NEW_IDS.map((id) => e[id].muscle), ["glutes", "glutes", "abs", "abs"]);
  assert.deepEqual(e.smith_split_squat.swaps, [{ id: "db_step_up" }, { id: "booty_builder_hip_thrust" }, { id: "hip_thrust" }]);
  assert.deepEqual(e.db_step_up.swaps, [{ id: "smith_split_squat" }]);
  assert.deepEqual(e.captain_chair_knee_raise.swaps, []);
  assert.deepEqual(e.decline_bench_crunch.swaps, []);
  for (const id of NEW_IDS) for (const s of e[id].swaps) assert.ok(e[s.id], `${id}: swap ${s.id} exists`);
});

test("D20-3 the changed reverse crunch: on a flat bench, with the abs machines and benches as swaps", () => {
  const r = exercises.reverse_crunch;
  assert.deepEqual([r.name, r.equipment, r.kind, r.range, r.step], ["Reverse crunch", "Flat bench: lie on it, hold its top end behind your head", "reps", [10, 15], "bodyweight"]);
  assert.deepEqual(r.swaps, [
    { id: "captain_chair_knee_raise", needsMachine: "captain_chair" },
    { id: "decline_bench_crunch", needsMachine: "ab_bench" },
    { id: "ab_crunch_machine", needsMachine: "ab_crunch" },
    { id: "weighted_crunch" },
    { id: "dead_bug" },
  ]);
  assert.equal(cues.reverse_crunch, "Lie on a flat bench and hold its top end behind your head, knees bent. Curl your hips up off the bench, bringing your knees toward your chest, then lower slowly. Do not swing.");
  assert.deepEqual([exerciseMuscles.reverse_crunch.main, exerciseMuscles.reverse_crunch.helpers], [["abs"], []], "muscles unchanged");
});

test("D20-3 the new exercises: muscles (main; helpers; equipment) as D20, with own.reason where they differ from free-exercise-db", () => {
  const m = (id) => [exerciseMuscles[id].main, exerciseMuscles[id].helpers, exerciseMuscles[id].equip];
  assert.deepEqual(m("smith_split_squat"), [["glutes"], ["quads", "hamstrings", "adductors"], "smith"]);
  assert.deepEqual(m("db_step_up"), [["glutes"], ["quads", "hamstrings", "adductors"], "dumbbell"]);
  assert.deepEqual(m("captain_chair_knee_raise"), [["abs"], [], "machine"]);
  assert.deepEqual(m("decline_bench_crunch"), [["abs"], [], "bodyweight"]);
  assert.equal(exerciseMuscles.smith_split_squat.own?.reason, "Trainer D20: a long step with a slight forward lean makes the glutes a main mover (Neto 2020 review: split squat over 60 % MVIC; Farrokhi 2008 EMG: forward lean raises glute work)");
  assert.equal(exerciseMuscles.db_step_up.own?.reason, "Trainer D20: step-ups gave the highest glute work in the Neto 2020 review");
});

test("D20-3 the new exercises: D20's cues word for word", () => {
  assert.equal(cues.smith_split_squat, "Bar on your upper back, one foot forward and one back, a long step. Bend both knees until the back knee is near the floor, lean slightly forward, and push up through the front heel. Do all reps, then switch legs. Set the safety stops just below your lowest point.");
  assert.equal(cues.db_step_up, "Dumbbells at your sides, your whole foot on the bench. Push through that heel to stand up on the bench, then step down slowly. Do all reps, then switch legs. Use a lower bench if your knee comes above your hip.");
  assert.equal(cues.captain_chair_knee_raise, "Back against the pad, forearms on the rests. Lift your knees to hip height or higher, curling your hips up a little, then lower slowly. No swinging.");
  assert.equal(cues.decline_bench_crunch, "Hook your feet under the rollers and lie back on the slope. Breathe out and curl your shoulders up, pause, lower slowly. Hands across your chest; do not pull your head.");
});

test("D20-3 first try (D12) for the weighted ones, none for bodyweight; the split squat is a big lift", () => {
  assert.deepEqual(NEW_IDS.map((id) => firstTryKg[id] ?? null), [5, 6, null, null]);
  assert.ok(BIG_LIFTS.includes("smith_split_squat"));
  assert.ok(!BIG_LIFTS.includes("db_step_up"), "D20 names only the split squat");
  assert.ok(BIG_LIFTS.includes("booty_builder_hip_thrust") && BIG_LIFTS.includes("hip_thrust"), "the old ids stay big lifts for swaps and old workouts");
});

test("D20-3 the new exercises: two photos, a video, and a machine or station each", () => {
  for (const id of NEW_IDS) {
    assert.equal(photosFor(id)?.length, 2, `${id}: two photos`);
    assert.match(videoFor(id)?.url ?? "", /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/, `${id}: video`);
    assert.ok(machines[machineOf[id]], `${id}: a machine or station`);
  }
  assert.deepEqual(NEW_IDS.map((id) => machineOf[id]), ["smith_machine", "dumbbells_bench", "captain_chair", "ab_bench"]);
});

test("E-1 Tuesday C1 and Friday B1: the split squat gets both warm-up sets (no glute main lift earlier that day)", () => {
  for (const [day, slot] of [["tue", "C1"], ["fri", "B1"]]) {
    const { units, seq } = buildSequence(daySlots(day, 3, null));
    const first = seq.find((e) => e.slot === slot && e.setNumber === 1);
    assert.equal(warmupCount(first, units), 2, `${day} ${slot}`);
  }
});

// ---------- D20-4 the old ids stay valid ----------

test("D20-4 the old ids keep their data (exercise, muscles, first try, cue, photos, video) and stay reachable as swaps", () => {
  for (const id of OLD_IDS) {
    assert.ok(exercises[id], `${id} still exists`);
    assert.ok(exerciseMuscles[id], `${id} muscles`);
    assert.ok(cues[id], `${id} cue`);
    assert.ok(photosFor(id), `${id} photos`);
    assert.ok(videoFor(id), `${id} video`);
    assert.ok(!DAY_IDS.some((d) => days[d].slots.some((s) => s.ex === id)), `${id} left the plan's days`);
  }
  assert.deepEqual(OLD_IDS.map((id) => firstTryKg[id] ?? null), [20, 20, 2]);
  assert.ok(planSwapChoices("tue", "C1", null, {}).includes("booty_builder_hip_thrust"));
  assert.ok(planSwapChoices("tue", "C1", null, {}).includes("hip_thrust"));
  assert.ok(planSwapChoices("tue", "C1", null, {}).includes("db_step_up"), "the fallback when the Smith machine is busy");
  assert.ok(planSwapChoices("fri", "B1", null, {}).includes("booty_builder_hip_thrust"));
  assert.ok(planSwapChoices("tue", "A2", null, {}).includes("weighted_crunch"));
});

// A made-up finished Tuesday from 0.7.5-0.7.7, with hip thrust machine and crunch with a dumbbell logs.
const w = (n, kg, reps) => ({ n, type: "work", weight_kg: kg, reps, seconds: null, rir: 2, done_at: "2026-02-03T09:00:00.000Z" });
function d18Tuesday(date, { hip = 40, crunch = 4, status = "finished", planned = true, hipId = "booty_builder_hip_thrust" } = {}) {
  const rec = (slot, ex, sets, rest, workSets) => ({ slot, plan_exercise: ex, done_exercise: ex, swap_reason: null, sets: workSets, note: "",
    ...(planned ? { planned_sets: sets, planned_rest: rest } : {}) });
  return {
    id: `s-${date.replaceAll("-", "")}-t1`, updated_at: `${date}T10:00:00.000Z`, date, plan_day: "tue", week: 3, kind: "full",
    swapped_from: null, status, started_at: `${date}T08:00:00.000Z`, finished_at: status === "finished" ? `${date}T10:00:00.000Z` : null, walk: null,
    exercises: [
      rec("A1", "leg_press", 3, null, [w(1, 60, 10), w(2, 60, 10), w(3, 60, 10)]),
      rec("A2", "weighted_crunch", 3, 90, [w(1, crunch, 12), w(2, crunch, 12), w(3, crunch, 12)]),
      rec("B1", "romanian_deadlift", 3, null, [w(1, 12, 10)]),
      rec("B2", "face_pull", 3, 90, [w(1, 15, 12)]),
      rec("C1", hipId, 3, null, [w(1, hip, 10), w(2, hip, 10), w(3, hip, 10)]),
      rec("C2", "plank", 3, 75, [{ n: 1, type: "work", weight_kg: 0, reps: null, seconds: 30, rir: 2, done_at: "2026-02-03T09:00:00.000Z" }]),
      rec("D", "leg_extension", 3, 60, [w(1, 20, 12)]),
    ],
    note: "",
  };
}
const BEFORE_TUE_IDS = BEFORE.tue.map((r) => r[1]);

test("D20-4 a saved Tuesday with hip thrust machine and crunch with a dumbbell logs keeps its history and its own day", () => {
  const doc = validDoc();
  doc.sessions = [d18Tuesday("2026-02-03")];
  assert.equal(validateDocument(doc).ok, true, "the old workout still passes the file check");
  for (const id of ["booty_builder_hip_thrust", "weighted_crunch"]) {
    assert.equal(performances(doc.sessions, id).length, 1, `${id}: its log is read`);
    assert.match(suggestFor(doc, id, { week: 4, missed: null, exerciseState: undefined }).lastText ?? "", /^Last time: /, `${id}: "Last time" shows`);
  }
  assert.match(suggestFor(doc, "booty_builder_hip_thrust", { week: 4, missed: null, exerciseState: undefined }).lastText, /40 kg × 10, 10, 10/);
  assert.deepEqual(planForSession(doc.sessions[0]).slots.map((s) => [s.slot, s.ex, s.sets, s.rest]), BEFORE.tue, "a past workout never changes");
  const older = planForSession(d18Tuesday("2026-02-03", { planned: false }));
  assert.deepEqual(older.slots.map((s) => [s.slot, s.ex]), BEFORE.tue.map((r) => [r[0], r[1]]), "also one saved before planned_sets existed");
});

test("D20-4 a running Tuesday started before D20 keeps the hip thrust machine and the crunch with a dumbbell", () => {
  const run = d18Tuesday("2026-02-10", { status: "in_progress" });
  run.exercises.forEach((r) => { r.sets = r.sets.slice(0, 1); });
  assert.deepEqual(planForSession(run).slots.map((s) => s.ex), BEFORE_TUE_IDS);
});

test("D20-4 a saved Plan edit naming the hip thrust machine still uses it: your own choice wins", () => {
  const record = { id: planDayId("tue"), updated_at: "2026-02-01T10:00:00.000Z", plan_id: "plan-v2", day: "tue", slots: BEFORE.tue.map(([slot, ex, sets, rest]) => ({ slot, ex, sets: slot === "A1" ? 4 : sets, rest })) };
  assert.equal(checkPlanDay(record, "tue").ok, true);
  const eff = effectiveDay("tue", record);
  assert.equal(eff.edited, true);
  assert.deepEqual(eff.slots.map((s) => s.ex), BEFORE_TUE_IDS);
  assert.equal(planForDay("tue", 3, "full", record).slots.find((s) => s.slot === "C1").ex, "booty_builder_hip_thrust");
});

// ---------- D20-5 machines and benches only after the first-visit check ----------

test("D20-5 captain's chair knee raise, decline abs bench crunch and ab crunch machine are hidden until their check says yes", () => {
  const ids = ["captain_chair_knee_raise", "decline_bench_crunch", "ab_crunch_machine"];
  for (const v of [undefined, null, false]) {
    const settings = { extra_machines: { captain_chair: v, ab_bench: v, ab_crunch: v } };
    for (const d of ["tue", "fri"]) for (const id of ids) assert.ok(!planSwapChoices(d, "A2", null, settings).includes(id), `${d} A2 ${id} hidden (${v})`);
  }
  const yes = { extra_machines: { captain_chair: true, ab_bench: true, ab_crunch: true } };
  for (const d of ["tue", "fri"]) for (const id of ids) assert.ok(planSwapChoices(d, "A2", null, yes).includes(id), `${d} A2 ${id} shown`);
  assert.ok(!planSwapChoices("tue", "A2", null, { extra_machines: { ab_crunch: true } }).includes("captain_chair_knee_raise"), "each by its own check");
});

test("D20-5 the new checks captain_chair and ab_bench: appended to the checks, the defaults, the machine ids and the cards", () => {
  assert.deepEqual(extraMachines, ["lat_pulldown", "seated_row", "leg_curl", "pec_deck", "calf_raise", "ab_crunch", "captain_chair", "ab_bench"]);
  assert.deepEqual(Object.keys(defaultSettings().extra_machines), extraMachines);
  assert.equal(defaultSettings().extra_machines.captain_chair, null);
  assert.equal(defaultSettings().extra_machines.ab_bench, null);
  assert.deepEqual(MACHINE_IDS.slice(-4), ["booty_builder", "ab_crunch", "captain_chair", "ab_bench"], "appended, never inserted or renamed");
  assert.equal(machines.captain_chair.check, "captain_chair");
  assert.equal(machines.ab_bench.check, "ab_bench");
  // A document from before 0.7.8 (no captain_chair or ab_bench key) still passes and reads as "not checked".
  const doc = validDoc();
  assert.equal("captain_chair" in doc.shared_settings.extra_machines, false);
  assert.equal(validateDocument(doc).ok, true);
  assert.ok(!planSwapChoices("tue", "A2", null, doc.shared_settings).includes("captain_chair_knee_raise"));
});

const at = (day, settings, answered = {}, record = null) => machineOffers(day, record, { extra_machines: settings }, answered).map((o) => `${o.slot}:${o.to}`);

test("D20-5 the one-tap offers: Tuesday captain's chair, Friday decline abs bench, the ab crunch machine on both", () => {
  assert.deepEqual(at("tue", { captain_chair: true }), ["A2:captain_chair_knee_raise"]);
  assert.deepEqual(at("fri", { captain_chair: true }), [], "the captain's chair is Tuesday's offer");
  assert.deepEqual(at("fri", { ab_bench: true }), ["A2:decline_bench_crunch"]);
  assert.deepEqual(at("tue", { ab_bench: true }), [], "the abs bench is Friday's offer");
  assert.deepEqual(at("tue", { ab_crunch: true }), ["A2:ab_crunch_machine"]);
  assert.deepEqual(at("fri", { ab_crunch: true }), ["A2:ab_crunch_machine"]);
  for (const v of [undefined, null, false]) {
    assert.deepEqual(at("tue", { captain_chair: v, ab_bench: v, ab_crunch: v }), [], `no offer (${v})`);
    assert.deepEqual(at("fri", { captain_chair: v, ab_bench: v, ab_crunch: v }), []);
  }
  for (const d of ["mon", "wed", "thu"]) assert.deepEqual(at(d, { captain_chair: true, ab_bench: true }), [], `${d}: no abs offer`);
});

test("E-2 one offer per place at a time: offer 1 first; offer 2 only after Keep on offer 1; Use it ends both", () => {
  const both = { captain_chair: true, ab_crunch: true };
  assert.deepEqual(at("tue", both), ["A2:captain_chair_knee_raise"]);
  assert.deepEqual(at("tue", both, { "tue:A2:captain_chair_knee_raise": "kept" }), ["A2:ab_crunch_machine"]);
  assert.deepEqual(at("tue", both, { "tue:A2:captain_chair_knee_raise": "kept", "tue:A2:ab_crunch_machine": "kept" }), []);
  assert.deepEqual(at("fri", { ab_bench: true, ab_crunch: true }), ["A2:decline_bench_crunch"]);
  assert.deepEqual(at("fri", { ab_bench: true, ab_crunch: true }, { "fri:A2:decline_bench_crunch": "kept" }), ["A2:ab_crunch_machine"]);
  // After Use it the place holds the captain's chair: the ab crunch offer (from the reverse crunch) does not apply.
  const used = { id: planDayId("tue"), updated_at: "2026-02-01T10:00:00.000Z", plan_id: "plan-v2", day: "tue",
    slots: days.tue.slots.map((s) => ({ slot: s.slot, ex: s.slot === "A2" ? "captain_chair_knee_raise" : s.ex, sets: s.sets, rest: s.rest })) };
  assert.deepEqual(at("tue", both, { "tue:A2:captain_chair_knee_raise": "used" }, used), []);
});

// ---------- D20-6 the one-time offer for a saved Tuesday or Friday edit ----------

const recordOf = (day, rows) => ({ id: planDayId(day), updated_at: "2026-02-01T10:00:00.000Z", plan_id: "plan-v2", day, slots: rows.map(([slot, ex, sets, rest]) => ({ slot, ex, sets, rest })) });

test("D20-6 the D20 places: Tuesday A2 and C1, Friday B1; old (D18's move first, then the one before 0.7.5, trainer answer 3) -> new", () => {
  assert.deepEqual(plan.d20Changes, {
    tue: { A2: { from: ["weighted_crunch", "cable_crunch"], to: "reverse_crunch" }, C1: { from: ["booty_builder_hip_thrust", "hip_thrust"], to: "smith_split_squat" } },
    fri: { B1: { from: ["booty_builder_hip_thrust", "hip_thrust"], to: "smith_split_squat" } },
  });
});

test("D20-6 an edited Tuesday still holding the hip thrust machine in C1 gets the one-time offer (and A2 if it holds the crunch with a dumbbell)", () => {
  const { d20Offer } = edits;
  const tue = recordOf("tue", BEFORE.tue.map((r) => (r[0] === "A1" ? ["A1", r[1], 4, r[3]] : r)));
  const o = d20Offer("tue", tue, {});
  assert.equal(o.key, "tue:D20:plan");
  assert.deepEqual(o.swaps, [{ slot: "A2", from: "weighted_crunch", to: "reverse_crunch" }, { slot: "C1", from: "booty_builder_hip_thrust", to: "smith_split_squat" }]);
  // Only C1 still old (A2 already swapped by Rosario to something else). D20 answer 3 (0.7.8): the cable crunch is an
  // old exercise of A2 now, so the "something else" is the dead bug.
  const onlyC1 = recordOf("tue", BEFORE.tue.map((r) => (r[0] === "A2" ? ["A2", "dead_bug", 3, 90] : r)));
  assert.deepEqual(d20Offer("tue", onlyC1, {}).swaps, [{ slot: "C1", from: "booty_builder_hip_thrust", to: "smith_split_squat" }]);
  assert.deepEqual(d20Offer("fri", recordOf("fri", BEFORE.fri.map((r) => (r[0] === "D" ? ["D", r[1], 2, r[3]] : r))), {}).swaps, [{ slot: "B1", from: "booty_builder_hip_thrust", to: "smith_split_squat" }]);
  assert.equal(d20Offer("tue", tue, { "tue:D20:plan": "kept" }), null, "Keep mine is final");
  assert.equal(d20Offer("tue", tue, { "tue:D20:plan": "used" }), null);
  assert.equal(d20Offer("tue", null, {}), null, "the plan's own Tuesday: nothing to offer");
  assert.equal(d20Offer("tue", { ...tue, deleted: true }, {}), null, "back to the plan (tombstone)");
  assert.equal(d20Offer("tue", recordOf("tue", row("tue").map((r) => (r[0] === "A1" ? ["A1", r[1], 4, r[3]] : r))), {}), null, "an edit made on the new plan");
  assert.equal(d20Offer("mon", recordOf("mon", UNCHANGED.mon.map((r) => (r[0] === "A1" ? ["A1", r[1], 4, r[3]] : r))), {}), null, "Monday has no D20 places");
  assert.equal(d20Offer("tue", { ...tue, slots: [{ slot: "Z9", ex: "plank", sets: 1, rest: 30 }] }, {}), null, "a record from a newer app");
  // The new exercise already elsewhere in the day: that place cannot change, the other still can.
  const withSplit = recordOf("tue", [...BEFORE.tue, ["E1", "smith_split_squat", 3, 60]]);
  assert.deepEqual(d20Offer("tue", withSplit, {}).swaps.map((s) => s.slot), ["A2"]);
  // A place Rosario put back to the old exercise on 0.7.8 is never offered back.
  assert.deepEqual(d20Offer("tue", tue, { "tue:C1:smith_split_squat": "kept" }).swaps.map((s) => s.slot), ["A2"]);
});

test("D20-6 Use it: only those places change; all other edits, sets and rest stay; the pure call changes nothing", () => {
  const { d20Offer, withD20 } = edits;
  const rows = BEFORE.tue.map((r) => (r[0] === "A1" ? ["A1", r[1], 4, r[3]] : r[0] === "C1" ? ["C1", r[1], 2, r[3]] : r[0] === "D" ? ["D", "goblet_squat", 3, 60] : r));
  const tue = recordOf("tue", rows);
  const out = withD20(tue.slots, d20Offer("tue", tue, {}).swaps);
  assert.deepEqual(out.map((s) => [s.slot, s.ex, s.sets, s.rest]), [
    ["A1", "leg_press", 4, null], ["A2", "reverse_crunch", 3, 90], ["B1", "romanian_deadlift", 3, null], ["B2", "face_pull", 3, 90],
    ["C1", "smith_split_squat", 2, null], ["C2", "plank", 3, 75], ["D", "goblet_squat", 3, 60],
  ]);
  assert.deepEqual(tue.slots.map((s) => s.ex), rows.map((r) => r[1]), "the record itself is not changed");
});

test("E-3 trainer answer 3: a Tuesday edited before 0.7.5 gets the D20 card for C1 and A2; the D18 card keeps only C2", () => {
  // hip thrust, cable crunch, dead bug: the D20 card offers C1 and A2 from the moves before 0.7.5; D18's card only C2.
  const old = recordOf("tue", [["A1", "leg_press", 4, null], ["A2", "cable_crunch", 3, 90], ["B1", "romanian_deadlift", 3, null], ["B2", "face_pull", 3, 90], ["C1", "hip_thrust", 3, null], ["C2", "dead_bug", 3, 75], ["D", "leg_extension", 3, 60]]);
  assert.deepEqual(edits.d20Offer("tue", old, {}), { key: "tue:D20:plan", swaps: [{ slot: "A2", from: "cable_crunch", to: "reverse_crunch" }, { slot: "C1", from: "hip_thrust", to: "smith_split_squat" }] });
  assert.deepEqual(edits.d18Offer("tue", old, {}), { key: "tue:D18:plan", swaps: [{ slot: "C2", from: "dead_bug", to: "plank" }] });
  // A D18 "Keep mine" does not block the D20 card (a new question); the D18 card does not come back.
  assert.equal(edits.d20Offer("tue", old, { "tue:D18:plan": "kept" })?.swaps.length, 2);
  assert.equal(edits.d18Offer("tue", old, { "tue:D18:plan": "kept" }), null);
  // Keep mine on the D20 card is final; what is left of D18 stays its own question.
  assert.equal(edits.d20Offer("tue", old, { "tue:D20:plan": "kept" }), null);
  assert.deepEqual(edits.d18Offer("tue", old, { "tue:D20:plan": "kept" })?.swaps.map((s) => s.slot), ["C2"]);
});

test("E-3 trainer answer 3: a Friday edited before 0.7.5: the D20 card B1; the D18 card only D, and none when D is already the leg press", () => {
  const fri = (d) => recordOf("fri", [["A1", "smith_squat", 3, null], ["A2", "reverse_crunch", 3, 90], ["B1", "hip_thrust", 3, null], ["B2", "lateral_raise", 2, 75], ["C1", "cable_pull_through", 3, null], ["C2", "side_plank", 2, 60], ["D", d, 3, 60]]);
  assert.deepEqual(edits.d20Offer("fri", fri("calf_raise_standing"), {})?.swaps, [{ slot: "B1", from: "hip_thrust", to: "smith_split_squat" }]);
  assert.deepEqual(edits.d18Offer("fri", fri("calf_raise_standing"), {})?.swaps, [{ slot: "D", from: "calf_raise_standing", to: "calf_raise_leg_press" }]);
  assert.equal(edits.d18Offer("fri", fri("calf_raise_leg_press"), {}), null, "no D18 place left: no D18 card");
  // Use it changes only the places its card lists: B1; the lateral raise's 2 sets and D stay.
  const after = edits.withD20(fri("calf_raise_standing").slots, edits.d20Offer("fri", fri("calf_raise_standing"), {}).swaps);
  assert.deepEqual(after.map((s) => [s.slot, s.ex, s.sets]), [["A1", "smith_squat", 3], ["A2", "reverse_crunch", 3], ["B1", "smith_split_squat", 3], ["B2", "lateral_raise", 2], ["C1", "cable_pull_through", 3], ["C2", "side_plank", 2], ["D", "calf_raise_standing", 3]]);
});

// ---------- D20-7 the first weight of the split squat ----------

const sug = (doc, id, week = 4, missed = null, exerciseState) => suggestFor(doc, id, { week, missed, exerciseState });

test("D20-7 first weight: a hip thrust machine log of 40 and no own log -> the split squat starts at 40 x 5/20 = 10 kg", () => {
  const doc = validDoc();
  doc.sessions = [d18Tuesday("2026-02-03", { hip: 40 })];
  const s = sug(doc, "smith_split_squat");
  assert.equal(s.weight_kg, 10);
  assert.match(s.note, /hip thrust machine/i, "the note says where the number comes from");
});

test("D20-7 first weight after a break of more than 4 weeks: 40 lowered first (x 0.8 = 32 -> 30 on a 5 kg stack), then 30 x 5/20 = 7.5 -> 5 kg", () => {
  const doc = validDoc();
  doc.sessions = [d18Tuesday("2026-02-03", { hip: 40 })];
  const s = sug(doc, "smith_split_squat", 4, { weightFactor: 0.8 });
  assert.equal(s.weight_kg, 5);
});

test("D20-7 first weight: no logs at all -> the first try, 5 kg", () => {
  const s = sug(validDoc(), "smith_split_squat");
  assert.equal(s.weight_kg, 5);
  assert.equal(s.action, "first_try");
});

test("E-4 first weight: once the split squat has its own log, its own suggestion decides; a Plan weight still wins", () => {
  const doc = validDoc();
  const own = d18Tuesday("2026-02-10", { hip: 40 });
  const c1 = own.exercises.find((e) => e.slot === "C1");
  c1.plan_exercise = "smith_split_squat";
  c1.done_exercise = "smith_split_squat";
  c1.sets = [w(1, 25, 9), w(2, 25, 9), w(3, 25, 8)];
  doc.sessions = [d18Tuesday("2026-02-03", { hip: 40 }), own];
  assert.equal(sug(doc, "smith_split_squat").last.weight_kg, 25, "its own log is read");
  assert.notEqual(sug(doc, "smith_split_squat").weight_kg, 10, "not the converted weight");
  const fresh = validDoc();
  fresh.sessions = [d18Tuesday("2026-02-03", { hip: 40 })];
  const mine = { id: "e-smith_split_squat", exercise: "smith_split_squat", my_weight_kg: 15, my_weight_at: "2026-02-05" };
  assert.equal(sug(fresh, "smith_split_squat", 4, null, mine).weight_kg, 15);
});

test("E-7 first weight: only an older hip thrust log (before 0.7.5) -> converted from it, 40 x 5/20 = 10; the newest log of the two wins", () => {
  const doc = validDoc();
  doc.sessions = [d18Tuesday("2026-02-03", { hip: 40, hipId: "hip_thrust" })];
  const s = sug(doc, "smith_split_squat");
  assert.equal(s.weight_kg, 10);
  assert.match(s.note, /^From your hip thrust weight./);
  // A newer hip thrust machine log (60) wins over the older hip thrust log (40): 60 x 5/20 = 15.
  doc.sessions = [d18Tuesday("2026-02-03", { hip: 40, hipId: "hip_thrust" }), { ...d18Tuesday("2026-02-10", { hip: 60 }), id: "s-20260210-t2" }];
  assert.equal(sug(doc, "smith_split_squat").weight_kg, 15);
  // And the other way round: a newer hip thrust log (80) wins over an older machine log (60): 80 x 5/20 = 20.
  doc.sessions = [d18Tuesday("2026-02-03", { hip: 60 }), { ...d18Tuesday("2026-02-10", { hip: 80, hipId: "hip_thrust" }), id: "s-20260210-t2" }];
  assert.equal(sug(doc, "smith_split_squat").weight_kg, 20);
});

test("E-8 trainer answer 1 (48f90b5): a hip thrust log of 30 -> 7.5 -> 5 kg; both logs on the same date -> the hip thrust machine log wins", () => {
  const doc = validDoc();
  doc.sessions = [d18Tuesday("2026-02-03", { hip: 30, hipId: "hip_thrust" })];
  assert.equal(sug(doc, "smith_split_squat").weight_kg, 5);
  // Same date: the machine log (40 -> 10) wins, even when the hip thrust workout (80 -> 20) finished later that day.
  const later = { ...d18Tuesday("2026-02-03", { hip: 80, hipId: "hip_thrust" }), id: "s-20260203-t2", finished_at: "2026-02-03T12:00:00.000Z", updated_at: "2026-02-03T12:00:00.000Z" };
  doc.sessions = [d18Tuesday("2026-02-03", { hip: 40 }), later];
  assert.equal(sug(doc, "smith_split_squat").weight_kg, 10);
  doc.sessions = [later, d18Tuesday("2026-02-03", { hip: 40 })];
  assert.equal(sug(doc, "smith_split_squat").weight_kg, 10, "the order in the file does not matter");
});

test("E-5 the reverse crunch on Tuesday is bodyweight: no weight, no conversion from the crunch with a dumbbell", () => {
  const doc = validDoc();
  doc.sessions = [d18Tuesday("2026-02-03", { crunch: 6 })];
  const s = sug(doc, "reverse_crunch");
  assert.equal(s.weight_kg, 0);
});

// ---------- D20-8 pictures show the real equipment, or say "Similar move:" ----------

test("D20-8 every exercise in the plan has a photo with match 'same', or a note that starts with 'Similar move:'", () => {
  const planIds = new Set(DAY_IDS.flatMap((d) => days[d].slots.map((s) => s.ex)));
  for (const id of planIds) {
    const m = media[id];
    assert.ok(m && m.lib, `${id}: a photo`);
    assert.ok(m.match === "same" || (typeof m.matchNote === "string" && m.matchNote.startsWith("Similar move:")), `${id}: same, or "Similar move:" (${m.matchNote})`);
  }
  for (const id of ["smith_split_squat", "reverse_crunch", "booty_builder_hip_thrust"]) {
    assert.equal(media[id].match, "close", id);
    assert.ok(media[id].matchNote.startsWith("Similar move:"), id);
    assert.ok(media[id].matchNote.length < 140, `${id}: one line`);
  }
  assert.match(media.reverse_crunch.matchNote, /flat bench/);
  assert.match(media.smith_split_squat.matchNote, /both feet on the floor/);
  // The new swaps show their own equipment.
  for (const id of ["db_step_up", "captain_chair_knee_raise", "decline_bench_crunch"]) assert.equal(media[id].match, "same", id);
});

// ---------- D20-9 the trainer's lock test moved to the new days ----------

test("D20-9 tests/trainer-plan.test.mjs locks the new days and knows the four new ids (trainer's agreement in D20)", () => {
  const src = readFileSync(new URL("./trainer-plan.test.mjs", import.meta.url), "utf8");
  for (const id of NEW_IDS) assert.ok(src.includes(`"${id}"`), `trainer 1 lists ${id}`);
  assert.ok(src.includes('["A2", "reverse_crunch", 3, 90], ["B1", "romanian_deadlift", 3, null]'), "KEPT_DAYS has the new Tuesday A2");
  assert.ok(src.includes('["C1", "smith_split_squat", 3, null]'), "KEPT_DAYS has the new Tuesday C1");
  assert.ok(src.includes('["B1", "smith_split_squat", 3, null]'), "KEPT_DAYS has the new Friday B1");
});

// ---------- release ----------

test("E-6 version 0.7.8 in js/version.js, at the top of sw.js and in the stamp; every new photo is in the sw.js file list", async () => {
  const { APP_VERSION } = await import("../app/js/version.js");
  assert.equal(APP_VERSION, "0.7.8");
  const sw = readFileSync(new URL("../app/sw.js", import.meta.url), "utf8");
  assert.equal(sw.match(/const APP_VERSION = "([^"]+)"/)[1], "0.7.8");
  for (const id of NEW_IDS) for (const n of [0, 1]) assert.ok(sw.includes(`media/exercises/${id}/${n}.jpg`), `${id}/${n}.jpg in sw.js`);
  assert.equal(JSON.parse(readFileSync(new URL("./fixtures/app-stamp.json", import.meta.url), "utf8")).version, "0.7.8", "the stamp is recorded for 0.7.8 (RUNBOOK step 2b)");
});
