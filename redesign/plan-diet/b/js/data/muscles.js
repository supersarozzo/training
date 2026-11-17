// Muscle data for the body maps, the matching swap list and the whole-plan check. Public plan data, no body data.
//
// Source of the muscle lists: free-exercise-db (public domain), the entry each exercise already uses for its photo
// (app/js/plan/media.js `lib`), its primaryMuscles and secondaryMuscles, read from dist/exercises.json on 2026-11-17.
// Our one change (research 4.2): free-exercise-db has one "shoulders" muscle. We split it by exercise:
// presses = front shoulders, lateral raises = side shoulders, face pull and rear-delt raise = rear shoulders,
// rows and pulldowns as helpers = rear shoulders. Everything else is as the database has it (including its generous
// helper lists: calves on squats and the leg press, research 5.2 caution).

// Our muscle groups, in the order they are listed. `view`: where the group is drawn best on the map.
export const GROUPS = {
  chest: { name: "Chest", view: "front" },
  front_delts: { name: "Front shoulders", view: "front" },
  side_delts: { name: "Side shoulders", view: "front" },
  rear_delts: { name: "Rear shoulders", view: "back" },
  biceps: { name: "Biceps", view: "front" },
  triceps: { name: "Triceps", view: "back" },
  forearms: { name: "Forearms", view: "front" },
  abs: { name: "Abs", view: "front" },
  lats: { name: "Lats", view: "back" },
  mid_back: { name: "Mid back", view: "back" },
  traps: { name: "Traps", view: "back" },
  lower_back: { name: "Lower back", view: "back" },
  glutes: { name: "Glutes", view: "back" },
  quads: { name: "Quads", view: "front" },
  hamstrings: { name: "Hamstrings", view: "back" },
  calves: { name: "Calves", view: "back" },
  adductors: { name: "Inner thighs", view: "front" },
  neck: { name: "Neck", view: "front" },
};

// body-muscles part id -> our group (by the start of the id). Parts not listed are drawn as plain body.
const PART_RULES = [
  ["chest-", "chest"], ["shoulder-front-", "front_delts"], ["shoulder-side-", "side_delts"], ["deltoid-rear-", "rear_delts"],
  ["biceps-", "biceps"], ["triceps-", "triceps"], ["forearm-", "forearms"], ["abs-", "abs"], ["obliques-", "abs"],
  ["lats-", "lats"], ["traps-upper-", "traps"], ["traps-mid-", "mid_back"], ["traps-lower-", "mid_back"],
  ["lower-back-", "lower_back"], ["spine", "lower_back"], ["gluteus-", "glutes"], ["quads-", "quads"],
  ["hamstrings-", "hamstrings"], ["calves-", "calves"], ["adductors-", "adductors"], ["neck-", "neck"], ["nape", "neck"],
];
export function groupOfPart(partId) {
  const rule = PART_RULES.find(([start]) => partId.startsWith(start));
  return rule ? rule[1] : null;
}

// equip: machine | smith | cable | dumbbell | bodyweight. Similar equipment = the same family below.
export const EQUIP = {
  machine: { name: "Machine", family: "fixed" },
  smith: { name: "Smith machine", family: "fixed" },
  cable: { name: "Cable", family: "cable" },
  dumbbell: { name: "Dumbbells", family: "free" },
  bodyweight: { name: "Body weight", family: "body" },
};

// p: main muscles, s: helpers.
export const EX_MUSCLES = {
  chest_press: { p: ["chest"], s: ["front_delts", "triceps"], equip: "machine" },
  pulldown: { p: ["lats"], s: ["biceps", "mid_back", "rear_delts"], equip: "cable" },
  shoulder_press_machine: { p: ["front_delts"], s: ["triceps"], equip: "machine" },
  one_arm_db_row: { p: ["mid_back"], s: ["biceps", "lats", "rear_delts"], equip: "dumbbell" },
  db_curl: { p: ["biceps"], s: ["forearms"], equip: "dumbbell" },
  triceps_pushdown: { p: ["triceps"], s: [], equip: "cable" },
  plank: { p: ["abs"], s: [], equip: "bodyweight" },
  dead_bug: { p: ["abs"], s: [], equip: "bodyweight" },
  leg_press: { p: ["quads"], s: ["calves", "glutes", "hamstrings"], equip: "machine" },
  cable_crunch: { p: ["abs"], s: [], equip: "cable" },
  romanian_deadlift: { p: ["hamstrings"], s: ["glutes", "lower_back"], equip: "dumbbell" },
  face_pull: { p: ["rear_delts"], s: ["mid_back"], equip: "cable" },
  hip_thrust: { p: ["glutes"], s: ["calves", "hamstrings"], equip: "machine" },
  leg_extension: { p: ["quads"], s: [], equip: "machine" },
  goblet_squat: { p: ["quads"], s: ["calves", "glutes", "hamstrings", "front_delts"], equip: "dumbbell" },
  db_bench_press: { p: ["chest"], s: ["front_delts", "triceps"], equip: "dumbbell" },
  lateral_raise: { p: ["side_delts"], s: [], equip: "dumbbell" },
  hammer_curl: { p: ["biceps"], s: [], equip: "dumbbell" },
  overhead_triceps_ext: { p: ["triceps"], s: [], equip: "cable" },
  side_plank: { p: ["abs"], s: ["side_delts"], equip: "bodyweight" },
  incline_db_press: { p: ["chest"], s: ["front_delts", "triceps"], equip: "dumbbell" },
  seated_cable_row: { p: ["mid_back"], s: ["biceps", "lats", "rear_delts"], equip: "cable" },
  seated_db_shoulder_press: { p: ["front_delts"], s: ["triceps"], equip: "dumbbell" },
  smith_squat: { p: ["quads"], s: ["calves", "glutes", "hamstrings", "lower_back"], equip: "smith" },
  reverse_crunch: { p: ["abs"], s: [], equip: "bodyweight" },
  cable_pull_through: { p: ["glutes"], s: ["hamstrings", "lower_back"], equip: "cable" },
  calf_raise_standing: { p: ["calves"], s: [], equip: "smith" },
  cable_curl: { p: ["biceps"], s: [], equip: "cable" },
  cable_lateral_raise: { p: ["side_delts"], s: ["mid_back", "traps"], equip: "cable" },
  rear_delt_raise: { p: ["rear_delts"], s: [], equip: "dumbbell" },
  db_glute_bridge: { p: ["glutes"], s: ["calves", "hamstrings"], equip: "dumbbell" },
  calf_raise_leg_press: { p: ["calves"], s: [], equip: "machine" },
  lat_pulldown_machine: { p: ["lats"], s: ["biceps", "mid_back", "rear_delts"], equip: "machine" },
  seated_row_machine: { p: ["lats"], s: ["biceps", "mid_back"], equip: "machine" },
  leg_curl_machine: { p: ["hamstrings"], s: [], equip: "machine" },
  calf_raise_machine: { p: ["calves"], s: [], equip: "machine" },
};

// For "same muscle": lats and mid back count as one back muscle.
export function matchGroup(g) { return g === "lats" || g === "mid_back" ? "back" : g; }

// Rows of the whole-plan check (research 5.3): Back = lats + mid back; shoulders split, plus their total.
export const CHECK_ROWS = [
  { id: "chest", name: "Chest", groups: ["chest"] },
  { id: "back", name: "Back", note: "lats + mid back", groups: ["lats", "mid_back"] },
  { id: "front_delts", name: "Front shoulders", groups: ["front_delts"] },
  { id: "side_delts", name: "Side shoulders", groups: ["side_delts"] },
  { id: "rear_delts", name: "Rear shoulders", groups: ["rear_delts"] },
  { id: "biceps", name: "Biceps", groups: ["biceps"] },
  { id: "triceps", name: "Triceps", groups: ["triceps"] },
  { id: "quads", name: "Quads", groups: ["quads"] },
  { id: "hamstrings", name: "Hamstrings", groups: ["hamstrings"] },
  { id: "glutes", name: "Glutes", groups: ["glutes"] },
  { id: "calves", name: "Calves", groups: ["calves"] },
  { id: "abs", name: "Abs", groups: ["abs"] },
  { id: "lower_back", name: "Lower back", groups: ["lower_back"] },
];
export const SHOULDERS_ALL = ["front_delts", "side_delts", "rear_delts"];

export const names = (ids) => ids.map((g) => GROUPS[g]?.name ?? g);
export function joinWords(list) {
  if (list.length <= 1) return list.join("");
  return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}
