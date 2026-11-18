// Checks the plan data against plan v2 (docs/plan/2026-11-16-training-plan-v2.md).
// Expected values below are written out by hand from the plan's tables (sections 5, 6, 10), not computed from the data.
import test from "node:test";
import assert from "node:assert/strict";
import { exercises, days, weeks, setsFor, rirFor, DAY_IDS, extraMachines, weekInfo } from "../app/js/plan/plan-v2.js";
import { cues } from "../app/js/plan/cues.js";

// Plan v2 section 6: slot, exercise, sets, reps, rest after pair, swaps. Tuesday and Friday changed by trainer D18 (0.7.5,
// docs/plan/2026-11-18-trainer-weekly-plan.md): machines instead of awkward moves; sets and rest unchanged.
const SECTION_6 = {
  mon: [
    ["A1", "chest_press", 3, [8, 12], null, ["db_bench_press"]],
    ["A2", "pulldown", 3, [10, 12], 90, ["one_arm_db_row", "lat_pulldown_machine"]],
    ["B1", "shoulder_press_machine", 3, [8, 12], null, ["seated_db_shoulder_press"]],
    ["B2", "one_arm_db_row", 3, [8, 12], 90, ["seated_cable_row", "seated_row_machine"]],
    ["C1", "db_curl", 3, [10, 15], null, ["cable_curl"]],
    ["C2", "triceps_pushdown", 3, [10, 15], 60, ["overhead_triceps_ext"]],
    ["Abs1", "plank", 2, [20, 40], 30, ["dead_bug"]], // changed 2026-11-18 (answer 80 a): 3 -> 2 sets
    ["D", "calf_raise_leg_press", 3, [12, 15], 60, ["calf_raise_machine", "calf_raise_standing", "one_leg_db_calf_raise"]], // was Abs2 dead bug
  ],
  tue: [
    ["A1", "leg_press", 3, [10, 12], null, ["smith_squat"]],
    ["A2", "weighted_crunch", 3, [10, 15], 90, ["ab_crunch_machine", "cable_crunch", "reverse_crunch"]], // D18: was cable_crunch
    ["B1", "romanian_deadlift", 3, [8, 12], null, ["cable_pull_through"]],
    ["B2", "face_pull", 3, [12, 15], 90, ["rear_delt_raise", "reverse_pec_deck"]], // D18: reverse pec deck if the gym has a pec deck
    ["C1", "booty_builder_hip_thrust", 3, [8, 12], null, ["hip_thrust", "db_glute_bridge"]], // D18: was hip_thrust
    ["C2", "plank", 3, [20, 40], 75, ["dead_bug"]], // D18: was dead_bug
    ["D", "leg_extension", 3, [12, 15], 60, ["goblet_squat"]],
  ],
  wed: [
    ["A1", "goblet_squat", 3, [8, 12], null, ["leg_press"]],
    ["A2", "db_bench_press", 3, [8, 12], 90, ["chest_press"]],
    ["B1", "pulldown", 3, [10, 12], null, ["one_arm_db_row", "lat_pulldown_machine"]],
    ["B2", "lateral_raise", 2, [12, 15], 75, ["cable_lateral_raise"]],
    ["C1", "hammer_curl", 2, [10, 15], null, ["db_curl"]],
    ["C2", "overhead_triceps_ext", 2, [10, 15], 60, ["triceps_pushdown"]],
    ["Abs1", "side_plank", 2, [15, 30], 30, ["plank"]], // changed 2026-11-18: 3 -> 2 sets
    ["D", "calf_raise_leg_press", 3, [12, 15], 60, ["calf_raise_machine", "calf_raise_standing", "one_leg_db_calf_raise"]], // was Abs2 dead bug
  ],
  thu: [
    ["A1", "incline_db_press", 3, [8, 12], null, ["chest_press"]],
    ["A2", "seated_cable_row", 3, [8, 12], 90, ["one_arm_db_row", "seated_row_machine"]],
    ["B1", "seated_db_shoulder_press", 3, [8, 12], null, ["shoulder_press_machine"]],
    ["B2", "face_pull", 3, [12, 15], 75, ["rear_delt_raise", "reverse_pec_deck"]], // D18
    ["C1", "lateral_raise", 3, [12, 15], null, ["cable_lateral_raise"]],
    ["C2", "triceps_pushdown", 3, [10, 15], 60, ["overhead_triceps_ext"]],
    ["Abs1", "plank", 2, [20, 40], 30, ["dead_bug"]], // changed 2026-11-18: 3 -> 2 sets
    ["D", "db_lying_leg_curl", 3, [10, 15], 60, ["leg_curl_machine", "cable_leg_curl", "romanian_deadlift"]], // was Abs2 cable crunch
  ],
  fri: [
    ["A1", "smith_squat", 3, [8, 12], null, ["leg_press"]],
    ["A2", "reverse_crunch", 3, [10, 15], 90, ["dead_bug"]],
    ["B1", "booty_builder_hip_thrust", 3, [8, 12], null, ["hip_thrust", "db_glute_bridge"]], // D18: was hip_thrust
    ["B2", "lateral_raise", 3, [12, 15], 75, ["cable_lateral_raise"]],
    ["C1", "cable_pull_through", 3, [12, 15], null, ["romanian_deadlift", "leg_curl_machine"]],
    ["C2", "side_plank", 2, [15, 30], 60, ["plank"]],
    ["D", "calf_raise_leg_press", 3, [12, 15], 60, ["calf_raise_machine", "calf_raise_standing", "one_leg_db_calf_raise"]], // D18: was calf_raise_standing
  ],
};

// Hand-computed total sets per day for each phase (plan v2 sections 5, 6, 10).
const DAY_TOTALS = {
  //          week 1, weeks 2-5, week 6 (and 12), weeks 7-11
  // Changed 2026-11-18 (answers 80-83): Mon, Wed, Thu abs slot = Abs1 (2 sets) + D (3 sets; 2 in weeks 7-11).
  mon: [16, 23, 15, 24],
  tue: [14, 21, 14, 22],
  wed: [16, 20, 12, 21],
  thu: [16, 23, 15, 24],
  fri: [14, 20, 13, 21],
};
const WEEK_TOTALS = [76, 107, 69, 112]; // sums of the columns above

const phaseColumn = (week) => (week === 1 ? 0 : week <= 5 ? 1 : week === 6 || week === 12 ? 2 : 3);
const sumDay = (week, day) => days[day].slots.reduce((n, s) => n + setsFor(week, day, s.slot), 0);

test("five days, Monday to Friday", () => {
  assert.deepEqual(DAY_IDS, ["mon", "tue", "wed", "thu", "fri"]);
  assert.equal(days.tue.walk, "easy");
  assert.equal(days.fri.walk, "easy");
  for (const d of ["mon", "wed", "thu"]) assert.equal(days[d].walk, "normal");
});

test("every day matches the tables in plan v2 section 6", () => {
  for (const [day, rows] of Object.entries(SECTION_6)) {
    const slots = days[day].slots;
    assert.equal(slots.length, rows.length, `${day}: number of slots`);
    rows.forEach(([slot, ex, sets, range, rest, swaps], i) => {
      const s = slots[i];
      assert.equal(s.slot, slot, `${day} slot name`);
      assert.equal(s.ex, ex, `${day} ${slot} exercise`);
      assert.equal(s.sets, sets, `${day} ${slot} sets`);
      assert.equal(s.rest, rest, `${day} ${slot} rest`);
      assert.deepEqual(exercises[ex].range, range, `${day} ${slot} reps`);
      assert.deepEqual(exercises[ex].swaps.map((x) => x.id), swaps, `${day} ${slot} swaps`);
    });
  }
});

test("sets per week: totals per day and week match the hand calculation", () => {
  for (let week = 1; week <= 12; week++) {
    let total = 0;
    for (const day of DAY_IDS) {
      const expected = DAY_TOTALS[day][phaseColumn(week)];
      assert.equal(sumDay(week, day), expected, `week ${week} ${day}`);
      total += expected;
    }
    assert.equal(total, WEEK_TOTALS[phaseColumn(week)], `week ${week} total`);
  }
});

test("sets per week: named rows", () => {
  assert.equal(setsFor(1, "mon", "A1"), 2); // week 1: two sets
  assert.equal(setsFor(1, "mon", "D"), 2); // the new D move starts like week 1
  assert.equal(setsFor(3, "mon", "A1"), 3);
  assert.equal(setsFor(6, "mon", "A1"), 2); // easier week: one less
  assert.equal(setsFor(6, "wed", "B2"), 1);
  assert.equal(setsFor(7, "mon", "A1"), 4); // pair A gets a 4th set
  assert.equal(setsFor(7, "mon", "A2"), 4);
  assert.equal(setsFor(7, "mon", "B1"), 3); // other pairs unchanged
  assert.equal(setsFor(11, "thu", "A1"), 4);
  assert.equal(setsFor(7, "tue", "D"), 2); // leg extension drops to 2 sets
  assert.equal(setsFor(12, "tue", "A1"), 2); // week 12 is like week 6 (not build 2)
  assert.equal(setsFor(12, "mon", "C1"), 2);
});

test("effort rules: RIR per week, Wednesday RIR 3", () => {
  assert.equal(rirFor(1, "mon"), 3);
  assert.equal(rirFor(2, "mon"), 2);
  assert.equal(rirFor(2, "wed"), 3);
  assert.equal(rirFor(6, "mon"), 4);
  assert.equal(rirFor(6, "wed"), 4);
  assert.equal(rirFor(8, "thu"), 2);
  assert.deepEqual(rirFor(11, "mon"), [1, 2]);
  assert.equal(rirFor(12, "fri"), 4);
});

test("12 weeks: phases, progression and walk progress", () => {
  assert.equal(weeks.length, 12);
  weeks.forEach((w, i) => assert.equal(w.week, i + 1));
  const phases = weeks.map((w) => w.phase);
  assert.equal(phases[0], "Learn, find weights");
  for (const i of [1, 2, 3, 4]) assert.equal(phases[i], "Build 1");
  assert.equal(phases[5], "Easier week (deload)");
  for (const i of [6, 7, 8, 9]) assert.equal(phases[i], "Build 2");
  assert.equal(phases[10], "Push");
  assert.equal(phases[11], "Easier week + review");
  // no lift progression in week 1 and the easier weeks; walk progress only in build weeks
  assert.deepEqual(weeks.map((w) => w.progression), [false, true, true, true, true, false, true, true, true, true, true, false]);
  assert.deepEqual(weeks.map((w) => w.walkProgress), [false, true, true, true, true, false, true, true, true, true, false, false]);
  assert.equal(weekInfo(0).week, 1);
  assert.equal(weekInfo(99).week, 12);
});

test("every swap points to a real exercise; Q17 swaps name a known machine", () => {
  for (const [id, ex] of Object.entries(exercises)) {
    for (const sw of ex.swaps) {
      assert.ok(exercises[sw.id], `${id}: swap ${sw.id} exists`);
      if (sw.needsMachine) assert.ok(extraMachines.includes(sw.needsMachine), `${id}: machine ${sw.needsMachine}`);
    }
  }
  const needing = Object.values(exercises).flatMap((e) => e.swaps.filter((s) => s.needsMachine).map((s) => s.needsMachine));
  assert.deepEqual([...new Set(needing)].sort(), ["ab_crunch", "calf_raise", "lat_pulldown", "leg_curl", "pec_deck", "seated_row"]); // ab_crunch, pec_deck: trainer D18 (0.7.5)
});

test("every exercise has a form cue and every plan exercise appears in a day", () => {
  for (const id of Object.keys(exercises)) assert.ok(cues[id] && cues[id].length > 20, `cue for ${id}`);
  assert.ok(cues.uphill_walk && cues.lift_warmup);
  const used = new Set(Object.values(days).flatMap((d) => d.slots.map((s) => s.ex)));
  for (const id of used) assert.ok(exercises[id], `${id} defined`);
});

test("exercise data is well formed", () => {
  for (const [id, ex] of Object.entries(exercises)) {
    assert.ok(["reps", "hold"].includes(ex.kind), `${id} kind`);
    assert.ok(Array.isArray(ex.range) && ex.range[0] <= ex.range[1], `${id} range`);
    assert.ok(["dumbbell", "stack", "smith_2x2.5", "bodyweight"].includes(ex.step), `${id} step`);
  }
});
