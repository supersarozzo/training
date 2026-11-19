// Trainer check 2026-11-18 (worker 8.37): docs/plan/2026-11-18-trainer-weekly-plan.md.
// Locks the trainer's decisions and protects saved data: logs, exercise_state and Plan edits (p-plan-v2-<day>)
// point to exercise ids and plan slots, so no id may vanish or be renamed and the plan's days stay as they are.
// No body data: all walk values are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { PLAN_ID, DAY_IDS, exercises, days, setsFor, walkRules } from "../app/js/plan/plan-v2.js";
import { exerciseMuscles } from "../app/js/plan/muscles.js";
import { nextWalkBase, walkForDay } from "../app/js/engine/walk.js";
import { planDayId } from "../app/js/engine/planedits.js";

// Every exercise id the app has shipped for plan v2 (0.5.0). Saved logs and edits may point to any of them.
const SHIPPED_IDS = [
  "chest_press", "pulldown", "shoulder_press_machine", "one_arm_db_row", "db_curl", "triceps_pushdown", "plank",
  "dead_bug", "leg_press", "cable_crunch", "romanian_deadlift", "face_pull", "hip_thrust", "leg_extension",
  "goblet_squat", "db_bench_press", "lateral_raise", "hammer_curl", "overhead_triceps_ext", "side_plank",
  "incline_db_press", "seated_cable_row", "seated_db_shoulder_press", "smith_squat", "reverse_crunch",
  "cable_pull_through", "calf_raise_standing", "calf_raise_leg_press", "db_lying_leg_curl", "cable_curl",
  "cable_lateral_raise", "rear_delt_raise", "db_glute_bridge", "lat_pulldown_machine", "seated_row_machine",
  "leg_curl_machine", "calf_raise_machine", "one_leg_db_calf_raise", "cable_leg_curl",
  // Trainer D18 (0.7.5)
  "booty_builder_hip_thrust", "weighted_crunch", "ab_crunch_machine", "reverse_pec_deck",
  // Trainer D20 (0.7.8)
  "smith_split_squat", "db_step_up", "captain_chair_knee_raise", "decline_bench_crunch",
];

// The plan's days as the trainer kept them: [slot, exercise id, sets, rest]. Tuesday and Friday: trainer D18 (0.7.5), with
// the trainer's agreement in D18 test 7 (hip thrust machine, crunch with a dumbbell, plank, calf raise on the leg press);
// then trainer D20 (0.7.8), with the trainer's agreement in D20 test 9 (Tuesday A2 reverse crunch, Tuesday C1 and
// Friday B1 Smith machine split squat).
const KEPT_DAYS = {
  mon: [["A1", "chest_press", 3, null], ["A2", "pulldown", 3, 90], ["B1", "shoulder_press_machine", 3, null], ["B2", "one_arm_db_row", 3, 90], ["C1", "db_curl", 3, null], ["C2", "triceps_pushdown", 3, 60], ["Abs1", "plank", 2, 30], ["D", "calf_raise_leg_press", 3, 60]],
  tue: [["A1", "leg_press", 3, null], ["A2", "reverse_crunch", 3, 90], ["B1", "romanian_deadlift", 3, null], ["B2", "face_pull", 3, 90], ["C1", "smith_split_squat", 3, null], ["C2", "plank", 3, 75], ["D", "leg_extension", 3, 60]],
  wed: [["A1", "goblet_squat", 3, null], ["A2", "db_bench_press", 3, 90], ["B1", "pulldown", 3, null], ["B2", "lateral_raise", 2, 75], ["C1", "hammer_curl", 2, null], ["C2", "overhead_triceps_ext", 2, 60], ["Abs1", "side_plank", 2, 30], ["D", "calf_raise_leg_press", 3, 60]],
  thu: [["A1", "incline_db_press", 3, null], ["A2", "seated_cable_row", 3, 90], ["B1", "seated_db_shoulder_press", 3, null], ["B2", "face_pull", 3, 75], ["C1", "lateral_raise", 3, null], ["C2", "triceps_pushdown", 3, 60], ["Abs1", "plank", 2, 30], ["D", "db_lying_leg_curl", 3, 60]],
  fri: [["A1", "smith_squat", 3, null], ["A2", "reverse_crunch", 3, 90], ["B1", "smith_split_squat", 3, null], ["B2", "lateral_raise", 3, 75], ["C1", "cable_pull_through", 3, null], ["C2", "side_plank", 2, 60], ["D", "calf_raise_leg_press", 3, 60]],
};

const BUILD_WEEKS = [2, 3, 4, 5, 7, 8, 9, 10, 11];

test("trainer 1: every shipped exercise id still exists, with a name, a kind and a rep range", () => {
  for (const id of SHIPPED_IDS) {
    const e = exercises[id];
    assert.ok(e, `${id} is still in the plan's exercise list`);
    assert.equal(typeof e.name, "string");
    assert.ok(e.kind === "reps" || e.kind === "hold", `${id} kind`);
    assert.ok(Array.isArray(e.range) && e.range[0] <= e.range[1], `${id} range`);
    for (const s of e.swaps) assert.ok(exercises[s.id], `${id}: swap ${s.id} exists`);
  }
});

test("trainer 2: the plan id and the Plan edit record ids stay the same", () => {
  assert.equal(PLAN_ID, "plan-v2");
  assert.deepEqual(DAY_IDS, ["mon", "tue", "wed", "thu", "fri"]);
  assert.deepEqual(DAY_IDS.map((d) => planDayId(d)), DAY_IDS.map((d) => `p-plan-v2-${d}`));
});

test("trainer 3: the plan's days are kept as they are (decisions D1-D7: no slot, exercise, set or rest changes)", () => {
  for (const d of DAY_IDS) assert.deepEqual(days[d].slots.map((s) => [s.slot, s.ex, s.sets, s.rest]), KEPT_DAYS[d], d);
});

test("trainer 4: every major muscle gets about 9 or more fractional sets in every build week (decision D2)", () => {
  const MAJOR = ["chest", "lats", "mid_back", "quads", "glutes", "hamstrings", "calves", "front_delts", "side_delts", "rear_delts", "biceps", "triceps"];
  for (const week of BUILD_WEEKS) {
    const frac = {};
    for (const d of DAY_IDS) for (const s of days[d].slots) {
      const n = setsFor(week, d, s.slot);
      const m = exerciseMuscles[s.ex];
      for (const x of m.main) frac[x] = (frac[x] || 0) + n;
      for (const x of m.helpers || []) frac[x] = (frac[x] || 0) + n / 2;
    }
    for (const muscle of MAJOR) assert.ok((frac[muscle] || 0) >= 9, `week ${week}: ${muscle} has ${frac[muscle] || 0} fractional sets`);
  }
});

test("trainer 5: calves and the back of the thighs get direct work on at least 2 days (decision D7, answers 80-82)", () => {
  for (const muscle of ["calves", "hamstrings"]) {
    const onDays = DAY_IDS.filter((d) => days[d].slots.some((s) => exerciseMuscles[s.ex].main.includes(muscle)));
    assert.ok(onDays.length >= 2, `${muscle} on ${onDays.join(", ")}`);
  }
  // The back of the thighs has a knee-bend move (leg curl) and a hip-hinge move (Romanian deadlift).
  const planned = new Set(DAY_IDS.flatMap((d) => days[d].slots.map((s) => s.ex)));
  assert.ok(planned.has("db_lying_leg_curl") && planned.has("romanian_deadlift"));
});

test("trainer 6: the walk tops out at 12 % and 5 km/h; leg days stay 2 % lower (decision D8, 8.36's D3)", () => {
  assert.equal(walkRules.maxSlope_pct, 12);
  assert.equal(walkRules.maxSpeed_kmh, 5);
  assert.equal(walkRules.minutes, 30);
  assert.equal(walkRules.legDaySlopeLess_pct, 2);
  assert.deepEqual(walkRules.normalEffort, [5, 6]);
  assert.equal(walkForDay({ speed_kmh: 5, slope_pct: 12 }, true).slope_pct, 10);
  const top = nextWalkBase({ speed_kmh: 5, slope_pct: 12 }, [{ effort: 4 }, { effort: 4 }]);
  assert.deepEqual([top.speed_kmh, top.slope_pct], [5, 12]);
});

test("trainer 7: a saved walk faster than the new top is kept as it is, never lowered or raised", () => {
  const saved = { speed_kmh: 5.6, slope_pct: 12 }; // made up
  const next = nextWalkBase(saved, [{ effort: 4 }, { effort: 4 }]);
  assert.deepEqual([next.speed_kmh, next.slope_pct], [5.6, 12]);
});
