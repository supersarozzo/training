// Training plan v2 as data. Source: docs/plan/2026-11-16-training-plan-v2.md (sections 2 to 6, 10).
// No body data in this file. Public, formulas and rules only.
//
// kind: "reps" or "hold" (seconds). range: [low, high]. perSide: reps/seconds are for each side.
// step: how the weight moves: "dumbbell" (next size), "stack" (one plate), "smith_2x2.5" (2.5 kg each side), "bodyweight".
// swaps: [{ id, needsMachine? }]. needsMachine marks the Q17 machines (use only if the first visit finds them).

export const PLAN_ID = "plan-v2";
export const DAY_IDS = ["mon", "tue", "wed", "thu", "fri"];

export const exercises = {
  chest_press: { name: "Chest press", equipment: "Chest press machine", kind: "reps", range: [8, 12], step: "stack", muscle: "chest", swaps: [{ id: "db_bench_press" }] },
  pulldown: { name: "Pulldown", equipment: "Cable, high pulley (kneel or sit)", kind: "reps", range: [10, 12], step: "stack", muscle: "back", swaps: [{ id: "one_arm_db_row" }, { id: "lat_pulldown_machine", needsMachine: "lat_pulldown" }] },
  shoulder_press_machine: { name: "Shoulder press", equipment: "Shoulder press machine", kind: "reps", range: [8, 12], step: "stack", muscle: "shoulders", swaps: [{ id: "seated_db_shoulder_press" }] },
  one_arm_db_row: { name: "One-arm dumbbell row", equipment: "Dumbbell + bench", kind: "reps", range: [8, 12], perSide: true, step: "dumbbell", muscle: "back", swaps: [{ id: "seated_cable_row" }, { id: "seated_row_machine", needsMachine: "seated_row" }] },
  db_curl: { name: "Dumbbell curl", equipment: "Dumbbells", kind: "reps", range: [10, 15], step: "dumbbell", muscle: "biceps", swaps: [{ id: "cable_curl" }] },
  triceps_pushdown: { name: "Triceps pushdown", equipment: "Cable, high pulley", kind: "reps", range: [10, 15], step: "stack", muscle: "triceps", swaps: [{ id: "overhead_triceps_ext" }] },
  plank: { name: "Plank", equipment: "Floor", kind: "hold", range: [20, 40], step: "bodyweight", muscle: "abs", swaps: [{ id: "dead_bug" }] },
  dead_bug: { name: "Dead bug", equipment: "Floor", kind: "reps", range: [8, 8], perSide: true, step: "bodyweight", muscle: "abs", swaps: [{ id: "plank" }] },
  leg_press: { name: "Leg press", equipment: "Leg press machine", kind: "reps", range: [10, 12], step: "stack", muscle: "quads", swaps: [{ id: "smith_squat" }] },
  cable_crunch: { name: "Cable crunch", equipment: "Cable, high pulley", kind: "reps", range: [10, 15], step: "stack", muscle: "abs", swaps: [{ id: "reverse_crunch" }] },
  romanian_deadlift: { name: "Romanian deadlift", equipment: "Dumbbells", kind: "reps", range: [8, 12], step: "dumbbell", muscle: "hamstrings", swaps: [{ id: "cable_pull_through" }] },
  face_pull: { name: "Face pull", equipment: "Cable, high pulley", kind: "reps", range: [12, 15], step: "stack", muscle: "back", swaps: [{ id: "rear_delt_raise" }] },
  hip_thrust: { name: "Hip thrust", equipment: "Glute Drive or hip thrust bench", kind: "reps", range: [8, 12], step: "smith_2x2.5", muscle: "glutes", swaps: [{ id: "db_glute_bridge" }] },
  leg_extension: { name: "Leg extension", equipment: "Leg extension machine", kind: "reps", range: [12, 15], step: "stack", muscle: "quads", swaps: [{ id: "goblet_squat", note: "light" }] },
  goblet_squat: { name: "Goblet squat", equipment: "1 dumbbell or kettlebell", kind: "reps", range: [8, 12], step: "dumbbell", muscle: "quads", swaps: [{ id: "leg_press" }] },
  db_bench_press: { name: "Dumbbell bench press", equipment: "Dumbbells + flat bench", kind: "reps", range: [8, 12], step: "dumbbell", muscle: "chest", swaps: [{ id: "chest_press" }] },
  lateral_raise: { name: "Lateral raise", equipment: "Dumbbells", kind: "reps", range: [12, 15], step: "dumbbell", muscle: "shoulders", swaps: [{ id: "cable_lateral_raise" }] },
  hammer_curl: { name: "Hammer curl", equipment: "Dumbbells", kind: "reps", range: [10, 15], step: "dumbbell", muscle: "biceps", swaps: [{ id: "db_curl" }] },
  overhead_triceps_ext: { name: "Overhead triceps extension", equipment: "Cable, low pulley, rope", kind: "reps", range: [10, 15], step: "stack", muscle: "triceps", swaps: [{ id: "triceps_pushdown" }] },
  side_plank: { name: "Side plank", equipment: "Floor", kind: "hold", range: [15, 30], perSide: true, step: "bodyweight", muscle: "abs", swaps: [{ id: "plank" }] },
  incline_db_press: { name: "Incline dumbbell press", equipment: "Dumbbells + bench at about 30 degrees", kind: "reps", range: [8, 12], step: "dumbbell", muscle: "chest", swaps: [{ id: "chest_press" }] },
  seated_cable_row: { name: "Seated cable row", equipment: "Cable, low pulley (functional trainer)", kind: "reps", range: [8, 12], step: "stack", muscle: "back", swaps: [{ id: "one_arm_db_row" }, { id: "seated_row_machine", needsMachine: "seated_row" }] },
  seated_db_shoulder_press: { name: "Seated dumbbell shoulder press", equipment: "Dumbbells + upright bench", kind: "reps", range: [8, 12], step: "dumbbell", muscle: "shoulders", swaps: [{ id: "shoulder_press_machine" }] },
  smith_squat: { name: "Smith machine squat", equipment: "Smith press station, safety stops set", kind: "reps", range: [8, 12], step: "smith_2x2.5", muscle: "quads", swaps: [{ id: "leg_press" }] },
  reverse_crunch: { name: "Reverse crunch", equipment: "Bench or mat", kind: "reps", range: [10, 15], step: "bodyweight", muscle: "abs", swaps: [{ id: "dead_bug" }] },
  cable_pull_through: { name: "Cable pull-through", equipment: "Cable, low pulley, rope", kind: "reps", range: [12, 15], step: "stack", muscle: "glutes", swaps: [{ id: "romanian_deadlift" }, { id: "leg_curl_machine", needsMachine: "leg_curl" }] },
  calf_raise_standing: { name: "Standing calf raise", equipment: "Smith machine, step or plate under the toes", kind: "reps", range: [12, 15], step: "smith_2x2.5", muscle: "calves", swaps: [{ id: "calf_raise_leg_press" }, { id: "calf_raise_machine", needsMachine: "calf_raise" }] },
  // Added 2026-11-18 (plan change, answers 80-83): planned on Mon and Wed (calf raise) and Thu (leg curl) in the D slot.
  calf_raise_leg_press: { name: "Calf raise on the leg press", equipment: "Leg press machine", kind: "reps", range: [12, 15], step: "stack", muscle: "calves", swaps: [{ id: "calf_raise_machine", needsMachine: "calf_raise" }, { id: "calf_raise_standing" }, { id: "one_leg_db_calf_raise" }] },
  db_lying_leg_curl: { name: "Dumbbell lying leg curl", equipment: "Dumbbell + flat bench, lying face down", kind: "reps", range: [10, 15], step: "dumbbell", muscle: "hamstrings", swaps: [{ id: "leg_curl_machine", needsMachine: "leg_curl" }, { id: "cable_leg_curl" }, { id: "romanian_deadlift" }] },

  // Swap-only exercises (they appear only as a swap)
  cable_curl: { name: "Cable curl", equipment: "Cable, low pulley", kind: "reps", range: [10, 15], step: "stack", muscle: "biceps", swaps: [] },
  cable_lateral_raise: { name: "Cable lateral raise", equipment: "Cable, low pulley", kind: "reps", range: [12, 15], perSide: true, step: "stack", muscle: "shoulders", swaps: [] },
  rear_delt_raise: { name: "Dumbbell rear-delt raise", equipment: "Dumbbells + incline bench", kind: "reps", range: [12, 15], step: "dumbbell", muscle: "back", swaps: [] },
  db_glute_bridge: { name: "Dumbbell glute bridge", equipment: "Dumbbell, floor", kind: "reps", range: [8, 12], step: "dumbbell", muscle: "glutes", swaps: [] },
  lat_pulldown_machine: { name: "Lat pulldown machine", equipment: "Lat pulldown machine (first visit check)", kind: "reps", range: [10, 12], step: "stack", muscle: "back", swaps: [] },
  seated_row_machine: { name: "Seated row machine", equipment: "Seated row machine (first visit check)", kind: "reps", range: [8, 12], step: "stack", muscle: "back", swaps: [] },
  leg_curl_machine: { name: "Leg curl machine", equipment: "Leg curl machine (first visit check)", kind: "reps", range: [10, 15], step: "stack", muscle: "hamstrings", swaps: [] },
  calf_raise_machine: { name: "Calf raise machine", equipment: "Calf raise machine (first visit check)", kind: "reps", range: [12, 15], step: "stack", muscle: "calves", swaps: [] },
  // Added 2026-11-18 (plan change): swaps for the new D moves.
  one_leg_db_calf_raise: { name: "One-leg dumbbell calf raise", equipment: "On a step, one dumbbell in one hand", kind: "reps", range: [12, 15], perSide: true, step: "dumbbell", muscle: "calves", swaps: [] },
  cable_leg_curl: { name: "Standing cable leg curl", equipment: "Cable, low pulley, ankle strap (first visit check)", kind: "reps", range: [10, 15], perSide: true, step: "stack", muscle: "hamstrings", swaps: [] },
};

// The extra machines the first visit checks (question 17).
export const extraMachines = ["lat_pulldown", "seated_row", "leg_curl", "pec_deck", "calf_raise"];

// Days. slot: pair letter + 1 or 2 (A1, A2 ...), "Abs1", or "D" (on its own, after the pairs or after Abs1). "Abs2" is no longer used by any day (still understood by the engine).
// Plan change 2026-11-18: Monday, Wednesday and Thursday have Abs1 (2 sets) then D (no Abs2), so D is not only on leg days.
// rest: seconds after the slot. A first exercise in a pair has rest null (about 30 s to move: see MOVE_SECONDS).
// For D, rest is the rest between sets.
export const days = {
  mon: {
    name: "Monday", focus: "Upper body A", walk: "normal", upper: true, leg: false,
    slots: [
      { slot: "A1", ex: "chest_press", sets: 3, rest: null },
      { slot: "A2", ex: "pulldown", sets: 3, rest: 90 },
      { slot: "B1", ex: "shoulder_press_machine", sets: 3, rest: null },
      { slot: "B2", ex: "one_arm_db_row", sets: 3, rest: 90 },
      { slot: "C1", ex: "db_curl", sets: 3, rest: null },
      { slot: "C2", ex: "triceps_pushdown", sets: 3, rest: 60 },
      { slot: "Abs1", ex: "plank", sets: 2, rest: 30 }, // changed 2026-11-18: 3 -> 2 sets
      { slot: "D", ex: "calf_raise_leg_press", sets: 3, rest: 60 }, // 2026-11-18: replaces Abs2 (dead bug)
    ],
  },
  tue: {
    name: "Tuesday", focus: "Lower body A", walk: "easy", upper: false, leg: true,
    slots: [
      { slot: "A1", ex: "leg_press", sets: 3, rest: null },
      { slot: "A2", ex: "cable_crunch", sets: 3, rest: 90 },
      { slot: "B1", ex: "romanian_deadlift", sets: 3, rest: null },
      { slot: "B2", ex: "face_pull", sets: 3, rest: 90 },
      { slot: "C1", ex: "hip_thrust", sets: 3, rest: null },
      { slot: "C2", ex: "dead_bug", sets: 3, rest: 75 },
      { slot: "D", ex: "leg_extension", sets: 3, rest: 60 },
    ],
  },
  wed: {
    name: "Wednesday", focus: "Full body (a bit lighter)", walk: "normal", upper: false, leg: false,
    slots: [
      { slot: "A1", ex: "goblet_squat", sets: 3, rest: null },
      { slot: "A2", ex: "db_bench_press", sets: 3, rest: 90 },
      { slot: "B1", ex: "pulldown", sets: 3, rest: null },
      { slot: "B2", ex: "lateral_raise", sets: 2, rest: 75 },
      { slot: "C1", ex: "hammer_curl", sets: 2, rest: null },
      { slot: "C2", ex: "overhead_triceps_ext", sets: 2, rest: 60 },
      { slot: "Abs1", ex: "side_plank", sets: 2, rest: 30 }, // changed 2026-11-18: 3 -> 2 sets
      { slot: "D", ex: "calf_raise_leg_press", sets: 3, rest: 60 }, // 2026-11-18: replaces Abs2 (dead bug)
    ],
  },
  thu: {
    name: "Thursday", focus: "Upper body B", walk: "normal", upper: true, leg: false,
    slots: [
      { slot: "A1", ex: "incline_db_press", sets: 3, rest: null },
      { slot: "A2", ex: "seated_cable_row", sets: 3, rest: 90 },
      { slot: "B1", ex: "seated_db_shoulder_press", sets: 3, rest: null },
      { slot: "B2", ex: "face_pull", sets: 3, rest: 75 },
      { slot: "C1", ex: "lateral_raise", sets: 3, rest: null },
      { slot: "C2", ex: "triceps_pushdown", sets: 3, rest: 60 },
      { slot: "Abs1", ex: "plank", sets: 2, rest: 30 }, // changed 2026-11-18: 3 -> 2 sets
      { slot: "D", ex: "db_lying_leg_curl", sets: 3, rest: 60 }, // 2026-11-18: replaces Abs2 (cable crunch)
    ],
  },
  fri: {
    name: "Friday", focus: "Lower body B", walk: "easy", upper: false, leg: true,
    slots: [
      { slot: "A1", ex: "smith_squat", sets: 3, rest: null },
      { slot: "A2", ex: "reverse_crunch", sets: 3, rest: 90 },
      { slot: "B1", ex: "hip_thrust", sets: 3, rest: null },
      { slot: "B2", ex: "lateral_raise", sets: 3, rest: 75 },
      { slot: "C1", ex: "cable_pull_through", sets: 3, rest: null },
      { slot: "C2", ex: "side_plank", sets: 2, rest: 60 },
      { slot: "D", ex: "calf_raise_standing", sets: 3, rest: 60 },
    ],
  },
};

// The cable pull-through is labelled glutes, as its muscle data (trainer L4, answer T4 to 8.39, 0.7.1).

// First-try weights (trainer D12, 0.7.1): the weight shown before an exercise has any weight (none set in the Plan,
// none logged, none found). An adult man, beginner, aimed low (about half a typical beginner's maximum); the week-1
// steps correct it from set 1. Dumbbells: kg per dumbbell. Stacks: the number on the stack. smith_squat, hip_thrust
// and calf_raise_standing: the plates added in total, the bar not counted. Rounded down to the gym in
// engine/progression.js firstTryWeight. Bodyweight and timed exercises have none.
export const firstTryKg = Object.freeze({
  chest_press: 20, db_bench_press: 10, incline_db_press: 8, shoulder_press_machine: 15, seated_db_shoulder_press: 8,
  pulldown: 30, lat_pulldown_machine: 30, one_arm_db_row: 12, seated_cable_row: 30, seated_row_machine: 30,
  db_curl: 6, hammer_curl: 6, cable_curl: 10, triceps_pushdown: 15, overhead_triceps_ext: 10,
  lateral_raise: 4, cable_lateral_raise: 5, rear_delt_raise: 4, face_pull: 15,
  leg_press: 40, leg_extension: 20, goblet_squat: 12, smith_squat: 10, hip_thrust: 20, db_glute_bridge: 12,
  romanian_deadlift: 12, cable_pull_through: 15, calf_raise_leg_press: 40, calf_raise_standing: 10,
  calf_raise_machine: 30, one_leg_db_calf_raise: 6, db_lying_leg_curl: 6, leg_curl_machine: 15, cable_leg_curl: 5,
  cable_crunch: 20,
});

// Big lifts (plan v2 section 5; trainer L1, answer T2 to 8.39): the first exercise of a pair gets both warm-up sets
// only when it is a big lift whose main muscle was not worked earlier that day; a small one gets one light set.
export const BIG_LIFTS = Object.freeze([
  "chest_press", "db_bench_press", "incline_db_press", "shoulder_press_machine", "seated_db_shoulder_press",
  "pulldown", "lat_pulldown_machine", "one_arm_db_row", "seated_cable_row", "seated_row_machine",
  "leg_press", "smith_squat", "goblet_squat", "hip_thrust", "db_glute_bridge", "romanian_deadlift",
]);

// Seconds to move from the first to the second exercise of a pair (plan v2 section 5).
export const MOVE_SECONDS = 30;

// The 12 weeks (plan v2 section 10).
// setsMode: "two" (week 1), "table" (as in the day tables), "easier" (one set less), "build2" (pair A gets a 4th set).
// rir: effort for most days; wedRir: Wednesday. A pair [1, 2] means "RIR 1-2".
// progression: lift weights move up by the rules. walkProgress: the walk may get steeper or faster.
export const weeks = [
  { week: 1, phase: "Learn, find weights", setsMode: "two", rir: 3, wedRir: 3, progression: false, walkProgress: false, walkNote: "Starting settings" },
  { week: 2, phase: "Build 1", setsMode: "table", rir: 2, wedRir: 3, progression: true, walkProgress: true, walkNote: "Progress by the rule" },
  { week: 3, phase: "Build 1", setsMode: "table", rir: 2, wedRir: 3, progression: true, walkProgress: true, walkNote: "Progress by the rule" },
  { week: 4, phase: "Build 1", setsMode: "table", rir: 2, wedRir: 3, progression: true, walkProgress: true, walkNote: "Progress by the rule" },
  { week: 5, phase: "Build 1", setsMode: "table", rir: 2, wedRir: 3, progression: true, walkProgress: true, walkNote: "Progress by the rule" },
  { week: 6, phase: "Easier week (deload)", setsMode: "easier", rir: 4, wedRir: 4, progression: false, walkProgress: false, walkNote: "Same as week 5, no increase" },
  { week: 7, phase: "Build 2", setsMode: "build2", rir: 2, wedRir: 3, progression: true, walkProgress: true, walkNote: "Progress by the rule" },
  { week: 8, phase: "Build 2", setsMode: "build2", rir: 2, wedRir: 3, progression: true, walkProgress: true, walkNote: "Progress by the rule" },
  { week: 9, phase: "Build 2", setsMode: "build2", rir: 2, wedRir: 3, progression: true, walkProgress: true, walkNote: "Progress by the rule" },
  { week: 10, phase: "Build 2", setsMode: "build2", rir: 2, wedRir: 3, progression: true, walkProgress: true, walkNote: "Progress by the rule" },
  { week: 11, phase: "Push", setsMode: "build2", rir: [1, 2], wedRir: 3, progression: true, walkProgress: false, walkNote: "No increase" },
  { week: 12, phase: "Easier week + review", setsMode: "easier", rir: 4, wedRir: 4, progression: false, walkProgress: false, walkNote: "Same as week 11, no increase" },
];

export function weekInfo(weekNumber) {
  return weeks[Math.min(Math.max(weekNumber, 1), 12) - 1];
}

// Sets for one slot in one week. Pure.
// Weeks 7-11 (build2): pair A gets a 4th set. Trainer L2 (answer T3 to 8.39, 0.7.1): on leg days D drops to 2 sets
// (plan v2 section 4); on the other days D keeps its sets and Abs1 has one set less.
// engine/planedits.js setsForSlot is the same rule for a slot object (tests/plan-edits.test.mjs test 6).
export function setsFor(weekNumber, dayId, slotName) {
  const slot = days[dayId].slots.find((s) => s.slot === slotName);
  if (!slot) throw new Error(`No slot ${slotName} on ${dayId}`);
  const base = slot.sets;
  switch (weekInfo(weekNumber).setsMode) {
    case "two": return Math.min(base, 2);
    case "easier": return Math.max(base - 1, 1);
    case "build2":
      if (slot.slot === "A1" || slot.slot === "A2") return base + 1;
      if (slot.slot === "D") return days[dayId].leg ? Math.min(base, 2) : base;
      if (slot.slot === "Abs1" && !days[dayId].leg) return Math.max(base - 1, 1);
      return base;
    default: return base;
  }
}

// Effort (reps in reserve) for one day in one week.
export function rirFor(weekNumber, dayId) {
  const w = weekInfo(weekNumber);
  return dayId === "wed" ? w.wedRir : w.rir;
}

// How a session is laid out: Rosario's walk-first choice (intake question 35 b).
export const sessionOrder = ["walk", "changeover", "lift_warmup", "pairs", "abs"];
export const shortSessionOrder = ["walk", "changeover", "lift_warmup", "pairs_ab", "abs_first"];

// Minutes per block. Full session: 90 minutes (plan v2 section 4). Short day: 60 minutes.
export const sessionMinutes = {
  full: { walk: 30, walkBuildUp: 3, changeover: 3, lift_warmup: 4, pairs: 45, abs: 7, finish: 1 },
  short: { walk: 15, walkBuildUp: 2, changeover: 2, lift_warmup: 3, pairs_ab: 32, abs_first: 6, finish: 2 },
};

export const walkRules = {
  minutes: 30,
  buildUp: { speed_kmh: 4.0, slope_pct: 2 },
  legDaySlopeLess_pct: 2,
  legDayEffort: [4, 5],
  normalEffort: [5, 6],
  // Top of the walk. Trainer decision D3 (docs/plan/2026-11-18-trainer-decisions.md): 12 % and 5 km/h, about 8.5 METs,
  // close to the 12-3-30 walk. The old top speed was 6 km/h (12 % at 6 km/h is about 10 METs, vigorous).
  maxSlope_pct: 12,
  maxSpeed_kmh: 5,
  speedStep_kmh: 0.2,
  slopeStep_pct: 1,
  // starting settings by intake question 36 (WORKFLOW B5). The plan starts at the low end of each range.
  start: {
    yes: { speed_kmh: 5.0, slope_pct: 6, range: { speed_kmh: [5.0, 5.5], slope_pct: [6, 8] } },
    not_sure: { speed_kmh: 4.5, slope_pct: 4, range: { speed_kmh: [4.5, 5.0], slope_pct: [4, 5] } },
    no: { speed_kmh: 4.0, slope_pct: 2, range: { speed_kmh: [4.0, 4.5], slope_pct: [2, 3] }, startMinutes: 20 },
  },
};

export const warmupMoves = [
  { id: "arm_circles", name: "Arm circles", reps: 10, short: true },
  { id: "arm_swings", name: "Arm swings across the chest", reps: 10, short: false },
  { id: "cat_cow", name: "Cat-cow on the floor", reps: 8, short: false },
  { id: "bodyweight_squats", name: "Bodyweight squats", reps: 10, short: true },
  { id: "glute_bridges", name: "Glute bridges", reps: 10, short: false },
  { id: "hip_hinge", name: "Hip hinge, hands on hips", reps: 10, short: true },
];
export const upperDayWarmupExtra = { id: "pushups_bench", name: "Push-ups against a bench", reps: 10, short: true };

// Warm-up sets before the first exercise of each pair (plan v2 section 5).
export const warmupSets = [{ fraction: 0.5, reps: 10 }, { fraction: 0.75, reps: 5 }];

export const weekdayName = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday" };
