// Checks the plan data against plan v2 (docs/plan/2026-11-16-training-plan-v2.md).
// Expected values below are written out by hand from the plan's tables (sections 5, 6, 10), not computed from the data.
import test from "node:test";
import assert from "node:assert/strict";
import { exercises, days, weeks, setsFor, rirFor, DAY_IDS, extraMachines, weekInfo } from "../app/js/plan/plan-v2.js";
import { cues } from "../app/js/plan/cues.js";

// Plan v2 section 6: slot, exercise, sets, reps, rest after pair, swaps
const SECTION_6 = {
  mon: [
    ["A1", "chest_press", 3, [8, 12], null, ["db_bench_press"]],
    ["A2", "pulldown", 3, [10, 12], 90, ["one_arm_db_row", "lat_pulldown_machine"]],
    ["B1", "shoulder_press_machine", 3, [8, 12], null, ["seated_db_shoulder_press"]],
    ["B2", "one_arm_db_row", 3, [8, 12], 90, ["seated_cable_row", "seated_row_machine"]],
    ["C1", "db_curl", 3, [10, 15], null, ["cable_curl"]],
    ["C2", "triceps_pushdown", 3, [10, 15], 60, ["overhead_triceps_ext"]],
    ["Abs1", "plank", 3, [20, 40], 30, ["dead_bug"]],
    ["Abs2", "dead_bug", 2, [8, 8], 30, ["plank"]],
  ],
  tue: [
    ["A1", "leg_press", 3, [10, 12], null, ["smith_squat"]],
    ["A2", "cable_crunch", 3, [10, 15], 90, ["reverse_crunch"]],
    ["B1", "romanian_deadlift", 3, [8, 12], null, ["cable_pull_through"]],
    ["B2", "face_pull", 3, [12, 15], 90, ["rear_delt_raise"]],
    ["C1", "hip_thrust", 3, [8, 12], null, ["db_glute_bridge"]],
    ["C2", "dead_bug", 3, [8, 8], 75, ["plank"]],
    ["D", "leg_extension", 3, [12, 15], 60, ["goblet_squat"]],
  ],
  wed: [
    ["A1", "goblet_squat", 3, [8, 12], null, ["leg_press"]],
    ["A2", "db_bench_press", 3, [8, 12], 90, ["chest_press"]],
    ["B1", "pulldown", 3, [10, 12], null, ["one_arm_db_row", "lat_pulldown_machine"]],
    ["B2", "lateral_raise", 2, [12, 15], 75, ["cable_lateral_raise"]],
    ["C1", "hammer_curl", 2, [10, 15], null, ["db_curl"]],
    ["C2", "overhead_triceps_ext", 2, [10, 15], 60, ["triceps_pushdown"]],
    ["Abs1", "side_plank", 3, [15, 30], 30, ["plank"]],
    ["Abs2", "dead_bug", 2, [8, 8], 30, ["plank"]],
  ],
  thu: [
    ["A1", "incline_db_press", 3, [8, 12], null, ["chest_press"]],
    ["A2", "seated_cable_row", 3, [8, 12], 90, ["one_arm_db_row", "seated_row_machine"]],
    ["B1", "seated_db_shoulder_press", 3, [8, 12], null, ["shoulder_press_machine"]],
    ["B2", "face_pull", 3, [12, 15], 75, ["rear_delt_raise"]],
    ["C1", "lateral_raise", 3, [12, 15], null, ["cable_lateral_raise"]],
    ["C2", "triceps_pushdown", 3, [10, 15], 60, ["overhead_triceps_ext"]],
    ["Abs1", "plank", 3, [20, 40], 30, ["dead_bug"]],
    ["Abs2", "cable_crunch", 3, [10, 15], 45, ["reverse_crunch"]],
  ],
  fri: [
    ["A1", "smith_squat", 3, [8, 12], null, ["leg_press"]],
    ["A2", "reverse_crunch", 3, [10, 15], 90, ["dead_bug"]],
    ["B1", "hip_thrust", 3, [8, 12], null, ["db_glute_bridge"]],
    ["B2", "lateral_raise", 3, [12, 15], 75, ["cable_lateral_raise"]],
    ["C1", "cable_pull_through", 3, [12, 15], null, ["romanian_deadlift", "leg_curl_machine"]],
    ["C2", "side_plank", 2, [15, 30], 60, ["plank"]],
    ["D", "calf_raise_standing", 3, [12, 15], 60, ["calf_raise_leg_press", "calf_raise_machine"]],
  ],
};

// Hand-computed total sets per day for each phase (plan v2 sections 5, 6, 10).
const DAY_TOTALS = {
  //          week 1, weeks 2-5, week 6 (and 12), weeks 7-11
  mon: [16, 23, 15, 25],
  tue: [14, 21, 14, 22],
  wed: [16, 20, 12, 22],
  thu: [16, 24, 16, 26],
  fri: [14, 20, 13, 21],
};
const WEEK_TOTALS = [76, 108, 70, 116]; // sums of the columns above

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
  assert.equal(setsFor(1, "mon", "Abs2"), 2);
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
  assert.deepEqual([...new Set(needing)].sort(), ["calf_raise", "lat_pulldown", "leg_curl", "seated_row"]);
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
