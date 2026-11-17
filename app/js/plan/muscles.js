// Muscles and equipment class of every exercise in plan v2 (build step 1, redesign/plan-diet/judge/JUDGING.md section 7).
// Public plan data, no body data. Read by the body maps, the swap list and the muscle check (later build steps).
//
// Source: free-exercise-db (https://github.com/yuhonas/free-exercise-db, public domain), the entry each exercise already
// uses for its photo (media.js `lib`): its primaryMuscles become `main`, its secondaryMuscles become `helpers`.
// Read from dist/exercises.json, commit f00c92c, on 2026-11-17 (copy: tests/fixtures/free-exercise-db-muscles.json).
// Our one change everywhere: free-exercise-db has one "shoulders"; we name the part (research 4.2): presses = front,
// lateral raises = side, face pull and rear-delt raise = rear, rows and pulldowns as helpers = rear, a weight held at the
// chest (goblet squat) = front, the side plank's held-out shoulder = side.
// Anything else that differs from free-exercise-db must carry `own: { reason }` (tests/muscles.test.mjs checks this).
// Known generosity kept as the database has it (research 5.2): calves, glutes and hamstrings as helpers of squats and
// the leg press; calves as helpers of the hip thrust and glute bridge.

// Our muscle groups. `name`: plain words for the screen (DESIGN.md 15.4). `fedb`: the free-exercise-db name it comes from.
// `view`: where the group is drawn best on the body map.
export const MUSCLES = {
  chest: { name: "Chest", fedb: "chest", view: "front" },
  front_delts: { name: "Front shoulders", fedb: "shoulders", view: "front" },
  side_delts: { name: "Side shoulders", fedb: "shoulders", view: "front" },
  rear_delts: { name: "Rear shoulders", fedb: "shoulders", view: "back" },
  biceps: { name: "Biceps", fedb: "biceps", view: "front" },
  triceps: { name: "Triceps", fedb: "triceps", view: "back" },
  forearms: { name: "Forearms", fedb: "forearms", view: "front" },
  abs: { name: "Abs", fedb: "abdominals", view: "front" },
  lats: { name: "Lats", fedb: "lats", view: "back" },
  mid_back: { name: "Mid back", fedb: "middle back", view: "back" },
  traps: { name: "Traps", fedb: "traps", view: "back" },
  lower_back: { name: "Lower back", fedb: "lower back", view: "back" },
  glutes: { name: "Glutes", fedb: "glutes", view: "back" },
  quads: { name: "Front thighs", fedb: "quadriceps", view: "front" },
  hamstrings: { name: "Back thighs", fedb: "hamstrings", view: "back" },
  calves: { name: "Calves", fedb: "calves", view: "back" },
  adductors: { name: "Inner thighs", fedb: "adductors", view: "front" },
  neck: { name: "Neck", fedb: "neck", view: "front" },
};

// Equipment class. `family`: "other equipment" in the swap list means another family.
export const EQUIPMENT = {
  machine: { name: "Machine", family: "fixed" },
  smith: { name: "Smith machine", family: "fixed" },
  cable: { name: "Cable", family: "cable" },
  dumbbell: { name: "Dumbbells", family: "free" },
  bodyweight: { name: "Body weight", family: "body" },
};

// main: main muscles; helpers: muscles that help (a helper set counts half in the muscle check); equip: equipment class.
export const exerciseMuscles = {
  // In the plan's days
  chest_press: { main: ["chest"], helpers: ["front_delts", "triceps"], equip: "machine" },
  pulldown: { main: ["lats"], helpers: ["biceps", "mid_back", "rear_delts"], equip: "cable" },
  shoulder_press_machine: { main: ["front_delts"], helpers: ["triceps"], equip: "machine" },
  one_arm_db_row: { main: ["mid_back"], helpers: ["biceps", "lats", "rear_delts"], equip: "dumbbell" },
  db_curl: { main: ["biceps"], helpers: ["forearms"], equip: "dumbbell" },
  triceps_pushdown: { main: ["triceps"], helpers: [], equip: "cable" },
  plank: { main: ["abs"], helpers: [], equip: "bodyweight" },
  dead_bug: { main: ["abs"], helpers: [], equip: "bodyweight" },
  leg_press: { main: ["quads"], helpers: ["calves", "glutes", "hamstrings"], equip: "machine" },
  cable_crunch: { main: ["abs"], helpers: [], equip: "cable" },
  romanian_deadlift: { main: ["hamstrings"], helpers: ["glutes", "lower_back"], equip: "dumbbell" },
  face_pull: { main: ["rear_delts"], helpers: ["mid_back"], equip: "cable" },
  hip_thrust: { main: ["glutes"], helpers: ["calves", "hamstrings"], equip: "machine" },
  leg_extension: { main: ["quads"], helpers: [], equip: "machine" },
  goblet_squat: { main: ["quads"], helpers: ["calves", "glutes", "hamstrings", "front_delts"], equip: "dumbbell" },
  db_bench_press: { main: ["chest"], helpers: ["front_delts", "triceps"], equip: "dumbbell" },
  lateral_raise: { main: ["side_delts"], helpers: [], equip: "dumbbell" },
  hammer_curl: { main: ["biceps"], helpers: [], equip: "dumbbell" },
  overhead_triceps_ext: { main: ["triceps"], helpers: [], equip: "cable" },
  side_plank: { main: ["abs"], helpers: ["side_delts"], equip: "bodyweight" },
  incline_db_press: { main: ["chest"], helpers: ["front_delts", "triceps"], equip: "dumbbell" },
  seated_cable_row: { main: ["mid_back"], helpers: ["biceps", "lats", "rear_delts"], equip: "cable" },
  seated_db_shoulder_press: { main: ["front_delts"], helpers: ["triceps"], equip: "dumbbell" },
  smith_squat: { main: ["quads"], helpers: ["calves", "glutes", "hamstrings", "lower_back"], equip: "smith" },
  reverse_crunch: { main: ["abs"], helpers: [], equip: "bodyweight" },
  cable_pull_through: { main: ["glutes"], helpers: ["hamstrings", "lower_back"], equip: "cable" },
  calf_raise_standing: { main: ["calves"], helpers: [], equip: "smith" },

  // Swap-only exercises
  cable_curl: { main: ["biceps"], helpers: [], equip: "cable" },
  cable_lateral_raise: { main: ["side_delts"], helpers: ["mid_back", "traps"], equip: "cable" },
  rear_delt_raise: { main: ["rear_delts"], helpers: [], equip: "dumbbell" },
  db_glute_bridge: { main: ["glutes"], helpers: ["calves", "hamstrings"], equip: "dumbbell" },
  calf_raise_leg_press: { main: ["calves"], helpers: [], equip: "machine" },
  lat_pulldown_machine: { main: ["lats"], helpers: ["biceps", "mid_back", "rear_delts"], equip: "machine" },
  seated_row_machine: { main: ["lats"], helpers: ["biceps", "mid_back"], equip: "machine" },
  leg_curl_machine: { main: ["hamstrings"], helpers: [], equip: "machine" },
  calf_raise_machine: { main: ["calves"], helpers: [], equip: "machine" },
};

// Body drawing part (app/vendor/body-muscles/shapes.js) -> our muscle group, by the start of the part id.
// Parts not listed (head, hands, feet, knees, shins, hip flexors, serratus) are plain body.
const PART_RULES = [
  ["chest-", "chest"], ["shoulder-front-", "front_delts"], ["shoulder-side-", "side_delts"], ["deltoid-rear-", "rear_delts"],
  ["biceps-", "biceps"], ["triceps-", "triceps"], ["forearm-", "forearms"], ["abs-", "abs"], ["obliques-", "abs"],
  ["lats-", "lats"], ["traps-upper-", "traps"], ["traps-mid-", "mid_back"], ["traps-lower-", "mid_back"],
  ["lower-back-", "lower_back"], ["spine", "lower_back"], ["gluteus-", "glutes"], ["quads-", "quads"],
  ["hamstrings-", "hamstrings"], ["calves-", "calves"], ["adductors-", "adductors"], ["neck-", "neck"], ["nape", "neck"],
];

export function partMuscle(partId) {
  const rule = PART_RULES.find(([start]) => partId.startsWith(start));
  return rule ? rule[1] : null;
}
