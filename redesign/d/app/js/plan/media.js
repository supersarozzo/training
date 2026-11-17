// Exercise photos (redesign D, Rosario's choice 53 a). Public plan data.
// Photos: free-exercise-db by yuhonas (https://github.com/yuhonas/free-exercise-db), released under the Unlicense
// (public domain). Saved unchanged at media/exercises/<id>/0.jpg (start position) and 1.jpg (end position).
// SOURCE maps our exercise id to the library entry. Ids without a photo get an original drawing (ui/demo.js).
export const SOURCE = {
  chest_press: "Leverage_Chest_Press",
  pulldown: "Wide-Grip_Lat_Pulldown",
  shoulder_press_machine: "Leverage_Shoulder_Press",
  one_arm_db_row: "One-Arm_Dumbbell_Row",
  db_curl: "Dumbbell_Bicep_Curl",
  triceps_pushdown: "Triceps_Pushdown",
  plank: "Plank",
  dead_bug: "Dead_Bug",
  leg_press: "Leg_Press",
  cable_crunch: "Cable_Crunch",
  romanian_deadlift: "Stiff-Legged_Dumbbell_Deadlift",
  face_pull: "Face_Pull",
  hip_thrust: "Barbell_Hip_Thrust",
  leg_extension: "Leg_Extensions",
  goblet_squat: "Goblet_Squat",
  db_bench_press: "Dumbbell_Bench_Press",
  lateral_raise: "Side_Lateral_Raise",
  hammer_curl: "Hammer_Curls",
  overhead_triceps_ext: "Cable_Rope_Overhead_Triceps_Extension",
  side_plank: "Side_Bridge",
  incline_db_press: "Incline_Dumbbell_Press",
  seated_cable_row: "Seated_Cable_Rows",
  seated_db_shoulder_press: "Seated_Dumbbell_Press",
  smith_squat: "Smith_Machine_Squat",
  reverse_crunch: "Reverse_Crunch",
  cable_pull_through: "Pull_Through",
  calf_raise_standing: "Smith_Machine_Calf_Raise",
  cable_curl: "Standing_Biceps_Cable_Curl",
  cable_lateral_raise: "Cable_Seated_Lateral_Raise",
  rear_delt_raise: "Lying_Rear_Delt_Raise",
  db_glute_bridge: "Butt_Lift_Bridge",
  calf_raise_leg_press: "Calf_Press_On_The_Leg_Press_Machine",
  lat_pulldown_machine: "Full_Range-Of-Motion_Lat_Pulldown",
  seated_row_machine: "Leverage_High_Row",
  leg_curl_machine: "Seated_Leg_Curl",
  calf_raise_machine: "Standing_Calf_Raises",
  uphill_walk: "Walking_Treadmill",
  arm_circles: "Arm_Circles",
  arm_swings: "Dynamic_Chest_Stretch",
  cat_cow: "Cat_Stretch",
  bodyweight_squats: "Bodyweight_Squat",
  glute_bridges: "Butt_Lift_Bridge",
  pushups_bench: "Incline_Push-Up",
  pec_deck: "Butterfly",
};

// Drawn by this project (original SVG), because the library has no good match.
export const DRAWN = ["hip_hinge"];

export const LIBRARY_URL = "https://github.com/yuhonas/free-exercise-db";

// [start, end] photo paths for an exercise id, or null.
export function photosFor(id) {
  return Object.hasOwn(SOURCE, id) ? [`media/exercises/${id}/0.jpg`, `media/exercises/${id}/1.jpg`] : null;
}
