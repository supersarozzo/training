// Exercise pictures, form videos and the gym machines the plan uses. Plain data, no body data.
//
// Pictures: free-exercise-db (https://github.com/yuhonas/free-exercise-db, Unlicense = public domain).
// Each entry has two photos (start, end), saved unchanged at media/exercises/<our id>/0.jpg and 1.jpg.
// `src` is the free-exercise-db entry the photos come from. `match`: "same" (the same move) or "close"
// (a very similar move, for example a barbell photo for a dumbbell move); `matchNote` says what differs.
// `svg: true` means no library photo fits: the app draws its own simple figure (ui/figures.js).
//
// Videos: a plain link that opens in Safari (no embed, no third-party script). Sources in MEDIA.md.
//
// Machines: one card per machine or station. `area` is the gym area; `sign` is the usual name on the sign
// (a typical name, not checked at the York gym yet: the "Where it is in my gym" note fixes that on the first visit).

export const AREAS = {
  cardio: "Cardio",
  machines: "Resistance machines",
  cables: "Cables",
  free: "Free weights",
  functional: "Functional and stretch",
};

export const machines = {
  treadmill: { name: "Treadmill", sign: "Treadmill", area: "cardio", photo: "uphill_walk", look: "A running belt with a screen in front. Speed and incline buttons on the screen or the hand rails." },
  chest_press: { name: "Chest press machine", sign: "Chest Press", area: "machines", photo: "chest_press", look: "A seat with a back pad and two handles at chest height that you push forward. A weight stack with a pin at the back or side." },
  shoulder_press: { name: "Shoulder press machine", sign: "Shoulder Press", area: "machines", photo: "shoulder_press_machine", look: "An upright seat with two handles beside your shoulders that you push up. A weight stack with a pin." },
  leg_press: { name: "Leg press machine", sign: "Leg Press", area: "machines", photo: "leg_press", look: "A reclined seat and a big foot plate in front. You push the plate away with your legs. Weight stack or plates." },
  leg_extension: { name: "Leg extension machine", sign: "Leg Extension", area: "machines", photo: "leg_extension", look: "A seat with a padded roller in front of your shins. You straighten your knees to lift it. A weight stack with a pin." },
  hip_thrust: { name: "Glute Drive or hip thrust bench", sign: "Glute Drive / Hip Thrust", area: "machines", photo: "hip_thrust", look: "A low bench or seat for your upper back and a pad or bar across your hips. You push your hips up. Takes plates or has a stack." },
  cable_station: { name: "Cable machine (functional trainer)", sign: "Dual Adjustable Pulley / Functional Trainer", area: "cables", photo: "triceps_pushdown", look: "A tall frame with two pulleys you can slide up and down, a weight stack on each side, and clip-on handles: rope, bar, single handle." },
  smith: { name: "Smith machine", sign: "Smith Machine", area: "free", photo: "smith_squat", look: "A bar fixed on two rails, so it only moves straight up and down. Hooks to rack it and safety stops at the bottom." },
  dumbbells_bench: { name: "Dumbbells and adjustable bench", sign: "Dumbbells / Adjustable Bench", area: "free", photo: "db_bench_press", look: "A rack of dumbbells in pairs, numbered in kg, and a padded bench whose back can be set flat, inclined or upright." },
  mat_area: { name: "Mats and stretch area", sign: "Stretch / Functional Area", area: "functional", photo: "plank", look: "An open floor space with exercise mats, often near the cables or at the side of the gym." },
  lat_pulldown: { name: "Lat pulldown machine", sign: "Lat Pulldown", area: "machines", photo: "lat_pulldown_machine", optional: true, look: "A seat with a thigh pad and a long bar hanging from a cable above you. You pull the bar down to your chest." },
  seated_row: { name: "Seated row machine", sign: "Seated Row", area: "machines", photo: "seated_row_machine", optional: true, look: "A seat with a chest pad and handles in front that you pull towards you. A weight stack with a pin." },
  leg_curl: { name: "Leg curl machine", sign: "Leg Curl", area: "machines", photo: "leg_curl_machine", optional: true, look: "A seat (or a bench you lie on) with a padded roller behind your ankles. You bend your knees to move it." },
  calf_raise: { name: "Calf raise machine", sign: "Calf Raise", area: "machines", photo: "calf_raise_machine", optional: true, look: "Shoulder pads (standing) or knee pads (seated) and a step for the balls of your feet. You rise onto your toes." },
};

// Plan exercise id -> pictures, video and machine. Every exercise in plan-v2.js has an entry (tests check this).
export const exerciseMedia = {
  chest_press: { src: "Leverage_Chest_Press", match: "same", machine: "chest_press" },
  pulldown: { src: "Wide-Grip_Lat_Pulldown", match: "close", matchNote: "Photo shows a pulldown seat; the plan uses the high cable, kneeling or seated. Same pull.", machine: "cable_station" },
  shoulder_press_machine: { src: "Leverage_Shoulder_Press", match: "same", machine: "shoulder_press" },
  one_arm_db_row: { src: "One-Arm_Dumbbell_Row", match: "same", machine: "dumbbells_bench" },
  db_curl: { src: "Dumbbell_Bicep_Curl", match: "same", machine: "dumbbells_bench" },
  triceps_pushdown: { src: "Triceps_Pushdown", match: "same", machine: "cable_station" },
  plank: { src: "Plank", match: "same", machine: "mat_area" },
  dead_bug: { src: "Dead_Bug", match: "same", machine: "mat_area" },
  leg_press: { src: "Leg_Press", match: "same", machine: "leg_press" },
  cable_crunch: { src: "Cable_Crunch", match: "same", machine: "cable_station" },
  romanian_deadlift: { src: "Stiff-Legged_Dumbbell_Deadlift", match: "close", matchNote: "Photo shows a stiff-legged dumbbell deadlift. For the Romanian deadlift keep a small bend in the knees.", machine: "dumbbells_bench" },
  face_pull: { src: "Face_Pull", match: "same", machine: "cable_station" },
  hip_thrust: { src: "Barbell_Hip_Thrust", match: "close", matchNote: "Photo shows a barbell on a bench. The Glute Drive machine is the same move with a pad.", machine: "hip_thrust" },
  leg_extension: { src: "Leg_Extensions", match: "same", machine: "leg_extension" },
  goblet_squat: { src: "Goblet_Squat", match: "same", machine: "dumbbells_bench" },
  db_bench_press: { src: "Dumbbell_Bench_Press", match: "same", machine: "dumbbells_bench" },
  lateral_raise: { src: "Side_Lateral_Raise", match: "same", machine: "dumbbells_bench" },
  hammer_curl: { src: "Hammer_Curls", match: "same", machine: "dumbbells_bench" },
  overhead_triceps_ext: { src: "Cable_Rope_Overhead_Triceps_Extension", match: "same", machine: "cable_station" },
  side_plank: { src: "Side_Bridge", match: "same", machine: "mat_area" },
  incline_db_press: { src: "Incline_Dumbbell_Press", match: "same", machine: "dumbbells_bench" },
  seated_cable_row: { src: "Seated_Cable_Rows", match: "same", machine: "cable_station" },
  seated_db_shoulder_press: { src: "Dumbbell_Shoulder_Press", match: "same", machine: "dumbbells_bench" },
  smith_squat: { src: "Smith_Machine_Squat", match: "same", machine: "smith" },
  reverse_crunch: { src: "Reverse_Crunch", match: "same", machine: "mat_area" },
  cable_pull_through: { src: "Pull_Through", match: "same", machine: "cable_station" },
  calf_raise_standing: { src: "Smith_Machine_Calf_Raise", match: "same", machine: "smith" },
  cable_curl: { src: "Standing_Biceps_Cable_Curl", match: "same", machine: "cable_station" },
  cable_lateral_raise: { src: "Cable_Seated_Lateral_Raise", match: "close", matchNote: "Photo shows it seated; standing works the same way.", machine: "cable_station" },
  rear_delt_raise: { src: "Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench", match: "same", machine: "dumbbells_bench" },
  db_glute_bridge: { src: "Barbell_Glute_Bridge", match: "close", matchNote: "Photo shows a barbell. Hold one dumbbell on your hips instead.", machine: "mat_area" },
  calf_raise_leg_press: { src: "Calf_Press_On_The_Leg_Press_Machine", match: "same", machine: "leg_press" },
  lat_pulldown_machine: { src: "Close-Grip_Front_Lat_Pulldown", match: "close", matchNote: "Photo shows a close grip. Any grip the machine has is fine.", machine: "lat_pulldown" },
  seated_row_machine: { src: "Leverage_Iso_Row", match: "same", machine: "seated_row" },
  leg_curl_machine: { src: "Seated_Leg_Curl", match: "same", machine: "leg_curl" },
  calf_raise_machine: { src: "Standing_Calf_Raises", match: "same", machine: "calf_raise" },
};

// The walk and the lift warm-up moves (plan-v2.js warmupMoves and upperDayWarmupExtra).
export const otherMedia = {
  uphill_walk: { src: "Walking_Treadmill", match: "same", machine: "treadmill" },
  arm_circles: { src: "Arm_Circles", match: "same" },
  arm_swings: { src: "Dynamic_Chest_Stretch", match: "close", matchNote: "Swing your arms open and across, like this stretch." },
  cat_cow: { src: "Cat_Stretch", match: "same" },
  bodyweight_squats: { src: "Bodyweight_Squat", match: "same" },
  glute_bridges: { src: "Butt_Lift_Bridge", match: "same" },
  hip_hinge: { svg: true },
  pushups_bench: { src: "Incline_Push-Up", match: "same" },
};

// Form videos: one trusted link per exercise (filled in from MEDIA.md; every link was checked to answer).
export const videos = {};

// The photos of one id, or null (an id with `svg: true`, or an unknown id).
export function photosFor(id) {
  const m = exerciseMedia[id] ?? otherMedia[id];
  if (!m || m.svg) return null;
  return [`media/exercises/${id}/0.jpg`, `media/exercises/${id}/1.jpg`];
}

export function machineFor(exerciseId) {
  const m = exerciseMedia[exerciseId] ?? otherMedia[exerciseId];
  return m && m.machine ? m.machine : null;
}
