// Muscles and equipment class of every exercise in plan v2 (build step 1, redesign/plan-diet/judge/JUDGING.md section 7).
// Public plan data, no body data. Read by the body maps, the swap list and the muscle check (later build steps).
//
// Source: free-exercise-db (https://github.com/yuhonas/free-exercise-db, public domain), the entry each exercise already
// uses for its photo (media.js `lib`): its primaryMuscles become `main`, its secondaryMuscles become `helpers`.
// Read from dist/exercises.json, commit f00c92c, on 2026-11-17 (copy: tests/fixtures/free-exercise-db-muscles.json).
// Our one change everywhere: free-exercise-db has one "shoulders"; we name the part (research 4.2): presses = front,
// lateral raises = side, face pull and rear-delt raise = rear, rows and pulldowns as helpers = rear.
// Anything else that differs from free-exercise-db must carry `own: { reason }` (tests/muscles.test.mjs checks this).
// Trainer fixes 2026-11-18 (docs/plan/2026-11-18-trainer-decisions.md, M1 to M9; evidence in
// docs/research/2026-11-18-muscle-map-check.md): 15 exercises read differently from free-exercise-db, each with 2+ sources.
// Kept generosity: calves as helpers of squats (2 sources name them; they do little work there).
// Two main muscles are fine since 0.7.1: the muscle check counts a set once per row (planview.js checkRows), so the
// rows have main lats + mid back (trainer M4, answer T5 to 8.39) and the Back row does not count them twice.

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
  shoulder_press_machine: { main: ["front_delts"], helpers: ["triceps", "side_delts"], equip: "machine", own: { reason: "Trainer M9: the side shoulders help in presses (StrengthLog lateral delt; Saeterbakken 2013 EMG)" } },
  one_arm_db_row: { main: ["lats", "mid_back"], helpers: ["biceps", "rear_delts"], equip: "dumbbell", own: { reason: "Trainer T5 (0.7.1): the lats are a main muscle of rows too (StrengthLog dumbbell row; Lehman 2004 EMG); the muscle check counts a set once per row" } },
  db_curl: { main: ["biceps"], helpers: ["forearms"], equip: "dumbbell" },
  triceps_pushdown: { main: ["triceps"], helpers: [], equip: "cable" },
  plank: { main: ["abs"], helpers: [], equip: "bodyweight" },
  dead_bug: { main: ["abs"], helpers: [], equip: "bodyweight" },
  leg_press: { main: ["quads"], helpers: ["glutes", "adductors"], equip: "machine", own: { reason: "Trainer M1/M2: inner thighs work hard (StrengthLog; Kubo 2019); the ankle does not move, so no calves; hamstrings only steady the leg (Escamilla 2001; Kubo 2019)" } },
  cable_crunch: { main: ["abs"], helpers: [], equip: "cable" },
  romanian_deadlift: { main: ["hamstrings"], helpers: ["glutes", "lower_back"], equip: "dumbbell" },
  face_pull: { main: ["rear_delts"], helpers: ["mid_back"], equip: "cable" },
  hip_thrust: { main: ["glutes"], helpers: ["hamstrings"], equip: "machine", own: { reason: "Trainer M1: the ankle does not move, so no calves (StrengthLog; Contreras 2015 EMG)" } },
  leg_extension: { main: ["quads"], helpers: [], equip: "machine" },
  goblet_squat: { main: ["quads"], helpers: ["glutes", "adductors", "calves"], equip: "dumbbell", own: { reason: "Trainer M2/M3: inner thighs work hard, hamstrings only steady (StrengthLog; Wikipedia Squat; Kubo 2019); the shoulders only hold the dumbbell still" } },
  db_bench_press: { main: ["chest"], helpers: ["front_delts", "triceps"], equip: "dumbbell" },
  lateral_raise: { main: ["side_delts"], helpers: [], equip: "dumbbell" },
  hammer_curl: { main: ["biceps"], helpers: ["forearms"], equip: "dumbbell", own: { reason: "Trainer M5: the thumb-up grip works the forearm (brachioradialis) (StrengthLog; Catalyst Athletics)" } },
  overhead_triceps_ext: { main: ["triceps"], helpers: [], equip: "cable" },
  side_plank: { main: ["abs"], helpers: ["glutes"], equip: "bodyweight", own: { reason: "Trainer M6: the shoulder only holds still; the side glute (gluteus medius) works hard (Wikipedia Plank; Youdas 2014 EMG)" } },
  incline_db_press: { main: ["chest"], helpers: ["front_delts", "triceps"], equip: "dumbbell" },
  seated_cable_row: { main: ["lats", "mid_back"], helpers: ["biceps", "rear_delts"], equip: "cable", own: { reason: "Trainer T5 (0.7.1): the lats are a main muscle of rows too (StrengthLog dumbbell row; Lehman 2004 EMG); the muscle check counts a set once per row" } },
  seated_db_shoulder_press: { main: ["front_delts"], helpers: ["triceps", "side_delts"], equip: "dumbbell", own: { reason: "Trainer M9: the side shoulders help in presses (StrengthLog lateral delt; Saeterbakken 2013 EMG)" } },
  smith_squat: { main: ["quads"], helpers: ["glutes", "adductors", "calves", "lower_back"], equip: "smith", own: { reason: "Trainer M2: inner thighs work hard, hamstrings only steady the leg (StrengthLog; Wikipedia Squat; Kubo 2019)" } },
  reverse_crunch: { main: ["abs"], helpers: [], equip: "bodyweight" },
  cable_pull_through: { main: ["glutes"], helpers: ["hamstrings", "lower_back"], equip: "cable" },
  calf_raise_standing: { main: ["calves"], helpers: [], equip: "smith" },
  // Added 2026-11-18 (plan change), planned in the D slot. Muscles copied from the free-exercise-db entry used for the photo.
  // calf_raise_leg_press moved here from the swap-only part (data unchanged).
  db_lying_leg_curl: { main: ["hamstrings"], helpers: [], equip: "dumbbell" }, // Lying_Leg_Curls (machine version of the same move)
  calf_raise_leg_press: { main: ["calves"], helpers: [], equip: "machine" },

  // Swap-only exercises
  cable_curl: { main: ["biceps"], helpers: ["forearms"], equip: "cable", own: { reason: "Trainer M5: forearms help, as in the dumbbell curl (StrengthLog; Wikipedia Biceps curl)" } },
  cable_lateral_raise: { main: ["side_delts"], helpers: [], equip: "cable", own: { reason: "Trainer M7: no source names mid back or traps for a smooth lateral raise; same as the dumbbell lateral raise (StrengthLog; Wikipedia Lateral raise)" } },
  rear_delt_raise: { main: ["rear_delts"], helpers: ["mid_back"], equip: "dumbbell", own: { reason: "Trainer M8: the muscles between the shoulder blades help (StrengthLog trapezius; Ekstrom 2003 EMG: middle trapezius)" } },
  db_glute_bridge: { main: ["glutes"], helpers: ["hamstrings"], equip: "dumbbell", own: { reason: "Trainer M1: the ankle does not move, so no calves (StrengthLog; NASM floor bridge)" } },
  lat_pulldown_machine: { main: ["lats"], helpers: ["biceps", "mid_back", "rear_delts"], equip: "machine" },
  seated_row_machine: { main: ["lats", "mid_back"], helpers: ["biceps", "rear_delts"], equip: "machine", own: { reason: "Trainer M4 and T5 (0.7.1): lats and mid back are main, rear shoulders help, as in the other rows (StrengthLog: rear delts; Lehman 2004 EMG: high mid-back work in the seated row)" } },
  leg_curl_machine: { main: ["hamstrings"], helpers: [], equip: "machine" },
  calf_raise_machine: { main: ["calves"], helpers: [], equip: "machine" },
  // Added 2026-11-18 (plan change); muscles copied from the free-exercise-db entry used for the photo (no own reading needed).
  one_leg_db_calf_raise: { main: ["calves"], helpers: [], equip: "dumbbell" }, // Standing_Dumbbell_Calf_Raise
  cable_leg_curl: { main: ["hamstrings"], helpers: [], equip: "cable" }, // Standing_Leg_Curl (one leg at a time)
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
