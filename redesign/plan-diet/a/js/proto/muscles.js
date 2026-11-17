// PROTOTYPE 8.28 (builder A). Muscles and equipment kind per exercise. Public plan data, no body data.
// Source for the 27 plan exercises: free-exercise-db (public domain) primaryMuscles / secondaryMuscles of the entry each
// exercise uses for its photo (research 2026-11-17 section 4.2, side note A table). The 9 swap-only exercises are the
// builder's own reading of the same database style (marked `own: true`): to be checked against dist/exercises.json in
// the real build, with a unit test (research 4.2).
// Shoulders: the database has one "shoulders" value; `sh` is our own split (presses = front, raises = side,
// face pull / rear-delt raise / rows = rear), as research 4.2 suggests.
// eq: equipment kind for "matching" swaps: machine, cable, dumbbell, smith, body (bodyweight).

export const EX = {
  chest_press: { p: ["chest"], s: ["shoulders", "triceps"], eq: "machine", sh: "front" },
  pulldown: { p: ["lats"], s: ["biceps", "middle back", "shoulders"], eq: "cable", sh: "rear" },
  shoulder_press_machine: { p: ["shoulders"], s: ["triceps"], eq: "machine", sh: "front" },
  one_arm_db_row: { p: ["middle back"], s: ["biceps", "lats", "shoulders"], eq: "dumbbell", sh: "rear" },
  db_curl: { p: ["biceps"], s: ["forearms"], eq: "dumbbell" },
  triceps_pushdown: { p: ["triceps"], s: [], eq: "cable" },
  plank: { p: ["abdominals"], s: [], eq: "body" },
  dead_bug: { p: ["abdominals"], s: [], eq: "body" },
  leg_press: { p: ["quadriceps"], s: ["calves", "glutes", "hamstrings"], eq: "machine" },
  cable_crunch: { p: ["abdominals"], s: [], eq: "cable" },
  romanian_deadlift: { p: ["hamstrings"], s: ["glutes", "lower back"], eq: "dumbbell" },
  face_pull: { p: ["shoulders"], s: ["middle back"], eq: "cable", sh: "rear" },
  hip_thrust: { p: ["glutes"], s: ["calves", "hamstrings"], eq: "machine" },
  leg_extension: { p: ["quadriceps"], s: [], eq: "machine" },
  goblet_squat: { p: ["quadriceps"], s: ["calves", "glutes", "hamstrings", "shoulders"], eq: "dumbbell", sh: "front" },
  db_bench_press: { p: ["chest"], s: ["shoulders", "triceps"], eq: "dumbbell", sh: "front" },
  lateral_raise: { p: ["shoulders"], s: [], eq: "dumbbell", sh: "side" },
  hammer_curl: { p: ["biceps"], s: [], eq: "dumbbell" },
  overhead_triceps_ext: { p: ["triceps"], s: [], eq: "cable" },
  side_plank: { p: ["abdominals"], s: ["shoulders"], eq: "body", sh: "side" },
  incline_db_press: { p: ["chest"], s: ["shoulders", "triceps"], eq: "dumbbell", sh: "front" },
  seated_cable_row: { p: ["middle back"], s: ["biceps", "lats", "shoulders"], eq: "cable", sh: "rear" },
  seated_db_shoulder_press: { p: ["shoulders"], s: ["triceps"], eq: "dumbbell", sh: "front" },
  smith_squat: { p: ["quadriceps"], s: ["calves", "glutes", "hamstrings", "lower back"], eq: "smith" },
  reverse_crunch: { p: ["abdominals"], s: [], eq: "body" },
  cable_pull_through: { p: ["glutes"], s: ["hamstrings", "lower back"], eq: "cable" },
  calf_raise_standing: { p: ["calves"], s: [], eq: "smith" },
  // swap-only exercises (builder's own reading, to be checked)
  cable_curl: { p: ["biceps"], s: ["forearms"], eq: "cable", own: true },
  cable_lateral_raise: { p: ["shoulders"], s: [], eq: "cable", sh: "side", own: true },
  rear_delt_raise: { p: ["shoulders"], s: ["middle back"], eq: "dumbbell", sh: "rear", own: true },
  db_glute_bridge: { p: ["glutes"], s: ["hamstrings"], eq: "dumbbell", own: true },
  calf_raise_leg_press: { p: ["calves"], s: [], eq: "machine", own: true },
  lat_pulldown_machine: { p: ["lats"], s: ["biceps", "middle back", "shoulders"], eq: "machine", sh: "rear", own: true },
  seated_row_machine: { p: ["middle back"], s: ["biceps", "lats", "shoulders"], eq: "machine", sh: "rear", own: true },
  leg_curl_machine: { p: ["hamstrings"], s: ["calves"], eq: "machine", own: true },
  calf_raise_machine: { p: ["calves"], s: [], eq: "machine", own: true },
};

// Our muscle groups (what the screens name and count). Order = the order on the cross-check screen.
export const GROUPS = [
  ["chest", "Chest"], ["back", "Back"], ["shoulders_front", "Front shoulders"], ["shoulders_side", "Side shoulders"],
  ["shoulders_rear", "Rear shoulders"], ["biceps", "Biceps"], ["triceps", "Triceps"], ["quads", "Front thighs"],
  ["hamstrings", "Back thighs"], ["glutes", "Glutes"], ["calves", "Calves"], ["abs", "Abs"], ["lower_back", "Lower back"],
  ["forearms", "Forearms"],
];
export const GROUP_NAME = Object.fromEntries(GROUPS);
// Longer words for the cross-check rows (the plain name plus the gym word).
export const GROUP_LONG = { back: "Back (lats, middle back)", quads: "Front thighs (quads)", hamstrings: "Back thighs (hamstrings)" };

const DB_TO_GROUP = {
  chest: "chest", lats: "back", "middle back": "back", biceps: "biceps", triceps: "triceps", quadriceps: "quads",
  hamstrings: "hamstrings", glutes: "glutes", calves: "calves", abdominals: "abs", "lower back": "lower_back", forearms: "forearms",
};
function groupOf(db, sh) {
  if (db === "shoulders") return `shoulders_${sh ?? "front"}`;
  return DB_TO_GROUP[db] ?? null;
}

// { main: [group], helpers: [group] } for one exercise. Duplicates removed (lats + middle back are both "back").
export function musclesOf(exId) {
  const e = EX[exId];
  if (!e) return { main: [], helpers: [] };
  const main = [...new Set(e.p.map((m) => groupOf(m, e.sh)).filter(Boolean))];
  const helpers = [...new Set(e.s.map((m) => groupOf(m, e.sh)).filter(Boolean))].filter((g) => !main.includes(g));
  return { main, helpers };
}
export const mainGroup = (exId) => musclesOf(exId).main[0] ?? null;
export const eqOf = (exId) => EX[exId]?.eq ?? null;
export const EQ_NAME = { machine: "machine", cable: "cable", dumbbell: "dumbbells", smith: "Smith machine", body: "bodyweight" };

// Body-map regions (react-body-highlighter names) for each group. Side shoulders light both views.
export const REGIONS = {
  chest: ["chest"], back: ["upper_back"], shoulders_front: ["front_deltoids"], shoulders_side: ["front_deltoids", "back_deltoids"],
  shoulders_rear: ["back_deltoids"], biceps: ["biceps"], triceps: ["triceps"], quads: ["quadriceps"], hamstrings: ["hamstring"],
  glutes: ["gluteal"], calves: ["calves", "left_soleus", "right_soleus"], abs: ["abs", "obliques"], lower_back: ["lower_back"],
  forearms: ["forearm"],
};

// Words for one exercise: "Main: chest · Helps: front shoulders, triceps".
export function muscleWords(exId) {
  const { main, helpers } = musclesOf(exId);
  const lc = (g) => GROUP_NAME[g].toLowerCase();
  return { main: main.map(lc).join(", "), helpers: helpers.map(lc).join(", ") };
}
