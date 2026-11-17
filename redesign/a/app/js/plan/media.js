// Exercise pictures, form videos and the gym's machines (redesign A). Plan data: public, no body data.
//
// Photos: free-exercise-db (https://github.com/yuhonas/free-exercise-db), public domain (The Unlicense).
// Each plan exercise or warm-up move has two photos saved unchanged at media/exercises/<id>/0.jpg (start) and 1.jpg (end).
// `lib` is the library entry they came from (see MEDIA.md). `svg` marks a move with no library photo: the app draws
// its own picture (js/ui/drawings.js). Videos open in Safari as plain links (no embed, no third-party script).

export const PHOTO_SOURCE = { name: "free-exercise-db", url: "https://github.com/yuhonas/free-exercise-db", licence: "The Unlicense (public domain)" };

// id -> { lib, svg?, video, videoBy }
export const media = {
  chest_press: { lib: "Leverage_Chest_Press" },
  pulldown: { lib: "Wide-Grip_Lat_Pulldown" },
  shoulder_press_machine: { lib: "Leverage_Shoulder_Press" },
  one_arm_db_row: { lib: "One-Arm_Dumbbell_Row" },
  db_curl: { lib: "Dumbbell_Bicep_Curl" },
  triceps_pushdown: { lib: "Triceps_Pushdown" },
  plank: { lib: "Plank" },
  dead_bug: { lib: "Dead_Bug" },
  leg_press: { lib: "Leg_Press" },
  cable_crunch: { lib: "Cable_Crunch" },
  romanian_deadlift: { lib: "Stiff-Legged_Dumbbell_Deadlift" },
  face_pull: { lib: "Face_Pull" },
  hip_thrust: { lib: "Barbell_Hip_Thrust" },
  leg_extension: { lib: "Leg_Extensions" },
  goblet_squat: { lib: "Goblet_Squat" },
  db_bench_press: { lib: "Dumbbell_Bench_Press" },
  lateral_raise: { lib: "Side_Lateral_Raise" },
  hammer_curl: { lib: "Hammer_Curls" },
  overhead_triceps_ext: { lib: "Cable_Rope_Overhead_Triceps_Extension" },
  side_plank: { lib: "Side_Bridge" },
  incline_db_press: { lib: "Incline_Dumbbell_Press" },
  seated_cable_row: { lib: "Seated_Cable_Rows" },
  seated_db_shoulder_press: { lib: "Seated_Dumbbell_Press" },
  smith_squat: { lib: "Smith_Machine_Squat" },
  reverse_crunch: { lib: "Reverse_Crunch" },
  cable_pull_through: { lib: "Pull_Through" },
  calf_raise_standing: { lib: "Smith_Machine_Calf_Raise" },
  cable_curl: { lib: "Standing_Biceps_Cable_Curl" },
  cable_lateral_raise: { lib: "Cable_Seated_Lateral_Raise" },
  rear_delt_raise: { lib: "Dumbbell_Lying_Rear_Lateral_Raise" },
  db_glute_bridge: { lib: "Barbell_Glute_Bridge" },
  calf_raise_leg_press: { lib: "Calf_Press_On_The_Leg_Press_Machine" },
  lat_pulldown_machine: { lib: "Close-Grip_Front_Lat_Pulldown" },
  seated_row_machine: { lib: "Leverage_Iso_Row" },
  leg_curl_machine: { lib: "Seated_Leg_Curl" },
  calf_raise_machine: { lib: "Standing_Calf_Raises" },
  // warm-up moves and the walk
  arm_circles: { lib: "Arm_Circles" },
  arm_swings: { lib: "Dynamic_Chest_Stretch" },
  cat_cow: { lib: "Cat_Stretch" },
  bodyweight_squats: { lib: "Bodyweight_Squat" },
  glute_bridges: { lib: "Butt_Lift_Bridge" },
  hip_hinge: { lib: null, svg: "hip_hinge" },
  pushups_bench: { lib: "Incline_Push-Up" },
  uphill_walk: { lib: "Walking_Treadmill" },
  // machine-only picture (the pec deck has no plan exercise; the first visit checks it)
  pec_deck: { lib: "Butterfly" },
};

// Form videos (filled from VIDEOS below). Kept apart so the list is easy to check and change.
// Checked on 2026-11-17: each link answered HTTP 200 and YouTube confirmed the title and channel (see MEDIA.md).
export const VIDEOS = {
  chest_press: { url: "https://www.youtube.com/watch?v=xUm0BiZCWlQ", title: "How To: Chest Press (Cybex)", channel: "ScottHermanFitness" },
  pulldown: { url: "https://www.youtube.com/watch?v=CAwf7n6Luuc", title: "How To: Lat Pulldown | 3 GOLDEN RULES", channel: "ScottHermanFitness" },
  shoulder_press_machine: { url: "https://www.youtube.com/watch?v=Wqq43dKW1TU", title: "How To: Overhead Press (Cybex)", channel: "ScottHermanFitness" },
  one_arm_db_row: { url: "https://www.youtube.com/watch?v=roCP6wCXPqo", title: "How to Perfect Your Dumbbell Row | Form Check | Men's Health", channel: "Men's Health" },
  db_curl: { url: "https://www.youtube.com/watch?v=cBSD6mQIPQk", title: "Dumbbell Bicep Curl | Nuffield Health", channel: "Nuffield Health" },
  triceps_pushdown: { url: "https://www.youtube.com/watch?v=_w-HpW70nSQ", title: "HOW TO: Cable Triceps Pushdown || 3 Golden Rules (FOR GROWTH)", channel: "ScottHermanFitness" },
  plank: { url: "https://www.youtube.com/watch?v=6LqqeBtFn9M", title: "How to do the perfect PLANK: technique and common mistakes", channel: "Get Exercise Confident" },
  dead_bug: { url: "https://www.youtube.com/watch?v=GbSC02oU3To", title: "How to Do a Dead Bug: A Guide from Physical Therapists", channel: "Hinge Health" },
  leg_press: { url: "https://www.youtube.com/watch?v=p5dCqF7wWUw", title: "How To Use The Leg Press Machine", channel: "PureGym" },
  cable_crunch: { url: "https://www.youtube.com/watch?v=0KEP6A1deBE", title: "Exercise Tutorial: Kneeling Cable Crunch", channel: "Travis Tarrant" },
  romanian_deadlift: { url: "https://www.youtube.com/watch?v=uUjqvxEWcbo", title: "Dumbbell Romanian Deadlift (RDL) | TECHNIQUE for Beginners", channel: "Mobility Doc" },
  face_pull: { url: "https://www.youtube.com/watch?v=eFxMixk_qPQ", title: "Rope Face Pull", channel: "Men's Health" },
  hip_thrust: { url: "https://www.youtube.com/watch?v=SEdqd1n0cvg", title: "How To: Hip Thrust", channel: "ScottHermanFitness" },
  leg_extension: { url: "https://www.youtube.com/watch?v=YyvSfVjQeL0", title: "How To: Leg Extension (Cybex)", channel: "ScottHermanFitness" },
  goblet_squat: { url: "https://www.youtube.com/watch?v=6mf0oa2GGUc", title: "Goblet Squat Tutorial - Proper Form and Technique", channel: "Runna" },
  db_bench_press: { url: "https://www.youtube.com/watch?v=VmB1G1K7v94", title: "How To: Dumbbell Chest Press", channel: "ScottHermanFitness" },
  lateral_raise: { url: "https://www.youtube.com/watch?v=PzsMitRdI_8", title: "How to do the DUMBBELL LATERAL RAISE! | 2 Minute Tutorial", channel: "Max Euceda" },
  hammer_curl: { url: "https://www.youtube.com/watch?v=BRVDS6HVR9Q", title: "How To Perform HAMMER CURLS | Biceps Exercise Tutorial", channel: "Buff Dudes Workouts" },
  overhead_triceps_ext: { url: "https://www.youtube.com/watch?v=57fWTQID-1Y", title: "How to PROPERLY Overhead Cable Tricep Extension (FIX THIS NOW!)", channel: "Colossus Fitness" },
  side_plank: { url: "https://www.youtube.com/watch?v=NXr4Fw8q60o", title: "How to Do a Side Plank | Ab Workout", channel: "Howcast" },
  incline_db_press: { url: "https://www.youtube.com/watch?v=8iPEnn-ltC8", title: "How To: Dumbbell Incline Chest Press", channel: "ScottHermanFitness" },
  seated_cable_row: { url: "https://www.youtube.com/watch?v=vwHG9Jfu4sw", title: "How to do the SEATED CABLE ROW! | 2 Minute Tutorial", channel: "Max Euceda" },
  seated_db_shoulder_press: { url: "https://www.youtube.com/watch?v=qEwKCR5JCog", title: "How To: Dumbbell Shoulder Press", channel: "ScottHermanFitness" },
  smith_squat: { url: "https://www.youtube.com/watch?v=AHnX-aimA4E", title: "How To: Smith Machine- Squat", channel: "ScottHermanFitness" },
  reverse_crunch: { url: "https://www.youtube.com/watch?v=7rRWy7-Gokg", title: "How to Do a Reverse Crunch | Ab Workout", channel: "Howcast" },
  cable_pull_through: { url: "https://www.youtube.com/watch?v=yXopOhzEoeo", title: "How to PROPERLY Perform a Glute Pull Through | Fix Your Cable Pull Through Form NOW!", channel: "Colossus Fitness" },
  calf_raise_standing: { url: "https://www.youtube.com/watch?v=rtiRoUtESHE", title: "Smith Machine Standing Calf Raise - RCA Fitness", channel: "RCA Fitness" },
  cable_curl: { url: "https://www.youtube.com/watch?v=2MUEL4nL6hA", title: "How to PROPERLY Cable Bicep Curl For Bigger Biceps (EASY FIX)", channel: "Colossus Fitness" },
  cable_lateral_raise: { url: "https://www.youtube.com/watch?v=Sp8be0IFNvk", title: "How to Fix your Cable Lateral Raise | DB vs. CABLE", channel: "John Jewett" },
  rear_delt_raise: { url: "https://www.youtube.com/watch?v=X5kmqWnprvI", title: "Incline Rear Delt Fly", channel: "Dr. Bridger Cutler, DC, MS" },
  db_glute_bridge: { url: "https://www.youtube.com/watch?v=E6VLOEz7tWE", title: "Dumbbell Glute Bridge Tutorial (for Beginners)", channel: "Tim Bullici" },
  calf_raise_leg_press: { url: "https://www.youtube.com/watch?v=PYZY00hI43w", title: "How to PROPERLY Calf Raise on The Leg Press Machine (FIX THIS!)", channel: "Colossus Fitness" },
  lat_pulldown_machine: { url: "https://www.youtube.com/watch?v=AOpi-p0cJkc", title: "Beginner's Guide: Lat Pulldown", channel: "SilverSneakers" },
  seated_row_machine: { url: "https://www.youtube.com/watch?v=TeFo51Q_Nsc", title: "How To Use The Seated Row Machine", channel: "PureGym" },
  leg_curl_machine: { url: "https://www.youtube.com/watch?v=ELOCsoDSmrg", title: "How To: Seated Leg Curl (Cybex)", channel: "ScottHermanFitness" },
  calf_raise_machine: { url: "https://www.youtube.com/watch?v=SVtg-1loH4c", title: "How to PROPERLY Standing Calf Raise | Tips & Common Mistakes", channel: "Colossus Fitness" },
  arm_circles: { url: "https://www.youtube.com/watch?v=3STTSi_jdHk", title: "How To Arm Circles | Nuffield Health", channel: "Nuffield Health" },
  arm_swings: { url: "https://www.youtube.com/watch?v=uTMB1SdxDpY", title: "Get Ready with Phelp's Arm Swings: The Perfect Upper Body Warm Up No Equipment Needed | PhysioSpace", channel: "PhysioSpace" },
  cat_cow: { url: "https://www.youtube.com/watch?v=1Y0YjXS9sKI", title: "How to Do a Cat Cow Stretch: A Guide from Physical Therapists", channel: "Hinge Health" },
  bodyweight_squats: { url: "https://www.youtube.com/watch?v=P-yaD24bUE8", title: "Bodyweight Squat Tutorial - Proper Form and Technique", channel: "Runna" },
  glute_bridges: { url: "https://www.youtube.com/watch?v=SKOMwg1JLrU", title: "How to do a Glute bridge", channel: "National Academy of Sports Medicine (NASM)" },
  hip_hinge: { url: "https://www.youtube.com/watch?v=2W_gXhut5S8", title: "How to Do a Hip Hinge: A Guide from Physical Therapists", channel: "Hinge Health" },
  pushups_bench: { url: "https://www.youtube.com/watch?v=49jfZ_z7-us", title: "Incline Push Ups // Learn to Push Up for Beginners!", channel: "Tom Morrison" },
  uphill_walk: { url: "https://www.youtube.com/watch?v=9ccVxEvWtpA", title: "How to properly walk on incline on a treadmill", channel: "VIVEHealthandFitness" },
};

export function videoFor(id) {
  const v = VIDEOS[id];
  return v && v.url ? v : null;
}

// Photo paths of an exercise, or null when the app draws its own picture.
export function photosFor(id) {
  const m = media[id];
  if (!m || !m.lib) return null;
  return [`media/exercises/${id}/0.jpg`, `media/exercises/${id}/1.jpg`];
}

// ---------- the gym's machines and stations ----------
// area: where it usually stands in a gym like The Gym Group York Foss Island.
export const AREAS = {
  cardio: { name: "Cardio", hint: "Rows of treadmills, bikes and cross-trainers, often by the windows." },
  machines: { name: "Resistance machines", hint: "Machines with a seat and a pin-loaded weight stack." },
  cables: { name: "Cables", hint: "Tall frames with pulleys you can move up and down (functional trainer)." },
  free_weights: { name: "Free weights", hint: "Dumbbell racks, benches and the Smith machine, usually by the mirrors." },
  functional: { name: "Functional and stretch", hint: "Matted floor space for planks, warm-ups and stretching." },
};

// photo: the media id whose start photo shows the machine in use. sign: the usual words on the machine's sign.
// check: one of the extra machines the first visit checks (shared_settings.extra_machines key).
export const machines = {
  treadmill: { name: "Treadmill", sign: "Treadmill", area: "cardio", photo: "uphill_walk", look: "A running belt with a screen; set speed and incline with the buttons or quick keys." },
  chest_press: { name: "Chest press machine", sign: "Chest Press", area: "machines", photo: "chest_press", look: "A seat with a back pad and two handles at chest height that you push forward." },
  shoulder_press: { name: "Shoulder press machine", sign: "Shoulder Press", area: "machines", photo: "shoulder_press_machine", look: "A seat with handles at ear height that you push up." },
  leg_press: { name: "Leg press", sign: "Leg Press", area: "machines", photo: "leg_press", look: "A reclined seat with a big foot plate in front; you push the plate away with your legs." },
  leg_extension: { name: "Leg extension machine", sign: "Leg Extension", area: "machines", photo: "leg_extension", look: "A seat with a padded bar in front of your lower shins that you lift by straightening your legs." },
  cable_station: { name: "Cable station (functional trainer)", sign: "Functional Trainer / Dual Adjustable Pulley", area: "cables", photo: "triceps_pushdown", look: "A tall frame with two weight stacks and pulleys that slide up and down; ropes and handles hang on hooks." },
  smith_machine: { name: "Smith machine", sign: "Smith Machine", area: "free_weights", photo: "smith_squat", look: "A barbell fixed on two vertical rails, with hooks and safety stops." },
  hip_thrust: { name: "Glute Drive or hip thrust bench", sign: "Glute Drive / Hip Thrust", area: "free_weights", photo: "hip_thrust", look: "A low padded bench for your upper back, with a belt or pad over the hips." },
  dumbbells_bench: { name: "Dumbbells and adjustable bench", sign: "Dumbbells", area: "free_weights", photo: "db_bench_press", look: "Racks of dumbbells in pairs, and benches whose back can be set flat, sloped or upright." },
  mat_area: { name: "Mats and stretch area", sign: "Stretching / Functional", area: "functional", photo: "plank", look: "Open floor with mats. Take a mat for planks, dead bugs and the warm-up." },
  lat_pulldown: { name: "Lat pulldown machine", sign: "Lat Pulldown", area: "machines", photo: "lat_pulldown_machine", check: "lat_pulldown", look: "A seat with a thigh pad and a long bar hanging from above." },
  seated_row: { name: "Seated row machine", sign: "Seated Row", area: "machines", photo: "seated_row_machine", check: "seated_row", look: "A seat with a chest pad and handles in front that you pull back." },
  leg_curl: { name: "Leg curl machine", sign: "Leg Curl", area: "machines", photo: "leg_curl_machine", check: "leg_curl", look: "A seat (or bench) with a pad behind your lower legs that you curl down." },
  pec_deck: { name: "Pec deck", sign: "Pec Fly / Rear Delt", area: "machines", photo: "pec_deck", check: "pec_deck", look: "A seat with two arms at the sides that you bring together in front of your chest." },
  calf_raise: { name: "Calf raise machine", sign: "Calf Raise", area: "machines", photo: "calf_raise_machine", check: "calf_raise", look: "Shoulder pads over a small step; you rise up on your toes." },
};

// Which machine or station each exercise uses.
export const machineOf = {
  chest_press: "chest_press", pulldown: "cable_station", shoulder_press_machine: "shoulder_press", one_arm_db_row: "dumbbells_bench",
  db_curl: "dumbbells_bench", triceps_pushdown: "cable_station", plank: "mat_area", dead_bug: "mat_area", leg_press: "leg_press",
  cable_crunch: "cable_station", romanian_deadlift: "dumbbells_bench", face_pull: "cable_station", hip_thrust: "hip_thrust",
  leg_extension: "leg_extension", goblet_squat: "dumbbells_bench", db_bench_press: "dumbbells_bench", lateral_raise: "dumbbells_bench",
  hammer_curl: "dumbbells_bench", overhead_triceps_ext: "cable_station", side_plank: "mat_area", incline_db_press: "dumbbells_bench",
  seated_cable_row: "cable_station", seated_db_shoulder_press: "dumbbells_bench", smith_squat: "smith_machine", reverse_crunch: "mat_area",
  cable_pull_through: "cable_station", calf_raise_standing: "smith_machine", cable_curl: "cable_station", cable_lateral_raise: "cable_station",
  rear_delt_raise: "dumbbells_bench", db_glute_bridge: "mat_area", calf_raise_leg_press: "leg_press", lat_pulldown_machine: "lat_pulldown",
  seated_row_machine: "seated_row", leg_curl_machine: "leg_curl", calf_raise_machine: "calf_raise",
  uphill_walk: "treadmill", arm_circles: "mat_area", arm_swings: "mat_area", cat_cow: "mat_area", bodyweight_squats: "mat_area",
  glute_bridges: "mat_area", hip_hinge: "mat_area", pushups_bench: "mat_area",
};

// Exercises that use a machine (for the machine card's "Used for" line).
export function exercisesOn(machineId) {
  return Object.keys(machineOf).filter((id) => machineOf[id] === machineId);
}
