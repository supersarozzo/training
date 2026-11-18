// Exercise pictures, form videos and the gym's machines. Plan data: public, no body data.
// Merged from the four redesign builds (redesign/JUDGING.md 3.2-3.4): A's structure and machine ids, B's and C's
// photo picks where the judges chose them, C's match / matchNote shape, D's per-machine tips and sign caveat,
// Judge 3's best video per exercise. Sources and licences: docs/MEDIA.md.
//
// Photos: free-exercise-db (https://github.com/yuhonas/free-exercise-db), public domain (The Unlicense).
// Each plan exercise or warm-up move has two photos at media/exercises/<id>/0.jpg (start) and 1.jpg (end), saved unchanged
// except the two dead_bug photos (shrunk from 1280 to 850 px wide, Rosario's question 59 a).
// `lib` is the library entry they came from. `match`: "same" (the same move) or "close" (a very similar move);
// `matchNote` says in one line what differs and is shown under the photo. `svg` marks a move with no library photo:
// the app draws its own picture (js/ui/drawings.js). Videos open in Safari as plain links (no embed, no third-party
// script); the app shows the channel, never the video title.

export const PHOTO_SOURCE = { name: "free-exercise-db", url: "https://github.com/yuhonas/free-exercise-db", licence: "The Unlicense (public domain)" };

// id -> { lib, match, matchNote?, svg? }
export const media = {
  chest_press: { lib: "Leverage_Chest_Press", match: "close", matchNote: "Photo shows a plate-loaded machine. Your gym's may have a weight stack with a pin; the move is the same." },
  pulldown: { lib: "Wide-Grip_Lat_Pulldown", match: "close", matchNote: "Photo shows a pulldown seat; the plan uses the high cable, kneeling or seated. Same pull." },
  shoulder_press_machine: { lib: "Machine_Shoulder_Military_Press", match: "same" },
  one_arm_db_row: { lib: "One-Arm_Dumbbell_Row", match: "same" },
  db_curl: { lib: "Dumbbell_Bicep_Curl", match: "same" },
  triceps_pushdown: { lib: "Triceps_Pushdown", match: "same" },
  plank: { lib: "Plank", match: "same" },
  dead_bug: { lib: "Dead_Bug", match: "same" },
  leg_press: { lib: "Leg_Press", match: "same" },
  cable_crunch: { lib: "Cable_Crunch", match: "same" },
  romanian_deadlift: { lib: "Stiff-Legged_Dumbbell_Deadlift", match: "close", matchNote: "Photo shows a stiff-legged deadlift. For the Romanian deadlift keep a small bend in the knees." },
  face_pull: { lib: "Face_Pull", match: "same" },
  hip_thrust: { lib: "Barbell_Hip_Thrust", match: "close", matchNote: "Photo shows a barbell on a bench. The Glute Drive machine is the same move with a pad." },
  leg_extension: { lib: "Leg_Extensions", match: "same" },
  goblet_squat: { lib: "Goblet_Squat", match: "same" },
  db_bench_press: { lib: "Dumbbell_Bench_Press", match: "same" },
  lateral_raise: { lib: "Side_Lateral_Raise", match: "same" },
  hammer_curl: { lib: "Hammer_Curls", match: "same" },
  overhead_triceps_ext: { lib: "Cable_Rope_Overhead_Triceps_Extension", match: "same" },
  side_plank: { lib: "Side_Bridge", match: "same" },
  incline_db_press: { lib: "Incline_Dumbbell_Press", match: "same" },
  seated_cable_row: { lib: "Seated_Cable_Rows", match: "same" },
  seated_db_shoulder_press: { lib: "Dumbbell_Shoulder_Press", match: "same" },
  smith_squat: { lib: "Smith_Machine_Squat", match: "same" },
  reverse_crunch: { lib: "Reverse_Crunch", match: "same" },
  cable_pull_through: { lib: "Pull_Through", match: "same" },
  calf_raise_standing: { lib: "Smith_Machine_Calf_Raise", match: "same" },
  cable_curl: { lib: "Standing_Biceps_Cable_Curl", match: "same" },
  cable_lateral_raise: { lib: "Cable_Seated_Lateral_Raise", match: "close", matchNote: "Photo shows it seated; standing works the same way." },
  rear_delt_raise: { lib: "Dumbbell_Lying_Rear_Lateral_Raise", match: "same" },
  db_glute_bridge: { lib: "Barbell_Glute_Bridge", match: "close", matchNote: "Photo shows a barbell. Hold one dumbbell on your hips instead." },
  calf_raise_leg_press: { lib: "Calf_Press_On_The_Leg_Press_Machine", match: "same" },
  lat_pulldown_machine: { lib: "Close-Grip_Front_Lat_Pulldown", match: "close", matchNote: "Photo shows a close grip. Any grip the machine has is fine." },
  seated_row_machine: { lib: "Leverage_Iso_Row", match: "same" },
  leg_curl_machine: { lib: "Seated_Leg_Curl", match: "same" },
  calf_raise_machine: { lib: "Standing_Calf_Raises", match: "same" },
  // added 2026-11-18 (plan change): no exact library entry for these three, so each is a close match with a note
  db_lying_leg_curl: { lib: "Lying_Leg_Curls", match: "close", matchNote: "Photo shows the leg curl machine. Lie the same way on a flat bench, a dumbbell between your feet." },
  one_leg_db_calf_raise: { lib: "Standing_Dumbbell_Calf_Raise", match: "close", matchNote: "Photo shows two legs. Do one leg at a time, a dumbbell in one hand, and hold a rail." },
  cable_leg_curl: { lib: "Standing_Leg_Curl", match: "close", matchNote: "Photo shows the standing leg curl machine. With the cable, strap on one ankle and curl that leg." },
  // warm-up moves and the walk
  arm_circles: { lib: "Arm_Circles", match: "same" },
  arm_swings: { lib: "Dynamic_Chest_Stretch", match: "close", matchNote: "Swing your arms open and across, like this stretch." },
  cat_cow: { lib: "Cat_Stretch", match: "same" },
  bodyweight_squats: { lib: "Bodyweight_Squat", match: "same" },
  glute_bridges: { lib: "Butt_Lift_Bridge", match: "same" },
  hip_hinge: { lib: null, svg: "hip_hinge" },
  pushups_bench: { lib: "Incline_Push-Up", match: "same" },
  uphill_walk: { lib: "Walking_Treadmill", match: "close", matchNote: "Photo shows a flat walk. Set the slope the app suggests." },
  // machine-only picture (the pec deck has no plan exercise; the first visit checks it)
  pec_deck: { lib: "Butterfly", match: "same" },
};

// Form videos: Judge 3's best pick per exercise (redesign/judging/media-and-machines.md section 4), the rest from A.
// Short demos with the plan's equipment, mostly PureGym, ScottHermanFitness, Renaissance Periodization, NASM,
// Hinge Health, NHS inform. `title` is kept only to check the link (docs/redesign-final/videos-checked.json);
// the app shows the channel, never the title.
export const VIDEOS = {
  chest_press: { url: "https://www.youtube.com/watch?v=sqNwDkUU_Ps", title: "How To Use The Chest Press Machine", channel: "PureGym" },
  pulldown: { url: "https://www.youtube.com/watch?v=VIJPZ8m0EDM", title: "How To Do Kneeling Lat Pulldowns", channel: "PureGym" },
  shoulder_press_machine: { url: "https://www.youtube.com/watch?v=TnhIyp4kmO8", title: "How To Use The Shoulder Press Machine", channel: "PureGym" },
  one_arm_db_row: { url: "https://www.youtube.com/watch?v=KRN38chlkds", title: "How To: Dumbbell Single-Arm Row (On Bench)", channel: "ScottHermanFitness" },
  db_curl: { url: "https://www.youtube.com/watch?v=cBSD6mQIPQk", title: "Dumbbell Bicep Curl | Nuffield Health", channel: "Nuffield Health" },
  triceps_pushdown: { url: "https://www.youtube.com/watch?v=LXkCrxn3caQ", title: "How To Do A Tricep Pushdown", channel: "PureGym" },
  plank: { url: "https://www.youtube.com/watch?v=rerKy2AEHz4", title: "How to do a plank", channel: "MassGeneralHospital" },
  dead_bug: { url: "https://www.youtube.com/watch?v=GbSC02oU3To", title: "How to Do a Dead Bug: A Guide from Physical Therapists", channel: "Hinge Health" },
  leg_press: { url: "https://www.youtube.com/watch?v=p5dCqF7wWUw", title: "How To Use The Leg Press Machine", channel: "PureGym" },
  cable_crunch: { url: "https://www.youtube.com/watch?v=ToJeyhydUxU", title: "Cable Crunch: Do It Right!", channel: "Testosterone Nation" },
  romanian_deadlift: { url: "https://www.youtube.com/watch?v=FQKfr1YDhEk", title: "How To: Dumbbell Romanian Deadlift", channel: "ScottHermanFitness" },
  face_pull: { url: "https://www.youtube.com/watch?v=eFxMixk_qPQ", title: "Rope Face Pull", channel: "Men's Health" },
  hip_thrust: { url: "https://www.youtube.com/watch?v=SEdqd1n0cvg", title: "How To: Hip Thrust", channel: "ScottHermanFitness" },
  leg_extension: { url: "https://www.youtube.com/watch?v=YyvSfVjQeL0", title: "How To: Leg Extension (Cybex)", channel: "ScottHermanFitness" },
  goblet_squat: { url: "https://www.youtube.com/watch?v=zBV3ceGyAxw", title: "How To Do A Goblet squat", channel: "PureGym" },
  db_bench_press: { url: "https://www.youtube.com/watch?v=VmB1G1K7v94", title: "How To: Dumbbell Chest Press", channel: "ScottHermanFitness" },
  lateral_raise: { url: "https://www.youtube.com/watch?v=XPPfnSEATJA", title: "How to do a Dumbbell Lateral Raise", channel: "National Academy of Sports Medicine (NASM)" },
  hammer_curl: { url: "https://www.youtube.com/watch?v=zC3nLlEvin4", title: "How To: Dumbbell Hammer Curl", channel: "ScottHermanFitness" },
  overhead_triceps_ext: { url: "https://www.youtube.com/watch?v=kqidUIf1eJE", title: "Rope Overhead Triceps Extension", channel: "Renaissance Periodization" },
  side_plank: { url: "https://www.youtube.com/watch?v=Oe9Tp9SvTCE", title: "How To Do A Side Plank", channel: "PureGym" },
  incline_db_press: { url: "https://www.youtube.com/watch?v=8iPEnn-ltC8", title: "How To: Dumbbell Incline Chest Press", channel: "ScottHermanFitness" },
  seated_cable_row: { url: "https://www.youtube.com/watch?v=GZbfZ033f74", title: "How To: Seated Low Row (LF Cable)", channel: "ScottHermanFitness" },
  seated_db_shoulder_press: { url: "https://www.youtube.com/watch?v=HzIiNhHhhtA", title: "Seated Dumbbell Shoulder Press", channel: "Renaissance Periodization" },
  smith_squat: { url: "https://www.youtube.com/watch?v=AHnX-aimA4E", title: "How To: Smith Machine- Squat", channel: "ScottHermanFitness" },
  reverse_crunch: { url: "https://www.youtube.com/watch?v=XY8KzdDcMFg", title: "How To Do A Reverse Crunch", channel: "PureGym" },
  cable_pull_through: { url: "https://www.youtube.com/watch?v=pv8e6OSyETE", title: "Cable Pull Through", channel: "Renaissance Periodization" },
  calf_raise_standing: { url: "https://www.youtube.com/watch?v=hh5516HCu4k", title: "Smith Machine Calves", channel: "Renaissance Periodization" },
  cable_curl: { url: "https://www.youtube.com/watch?v=GNlopToAZyg", title: "How To Do A Cable Curl", channel: "PureGym" },
  cable_lateral_raise: { url: "https://www.youtube.com/watch?v=Z5FA9aq3L6A", title: "How To Do Cable Lateral Raises", channel: "PureGym" },
  rear_delt_raise: { url: "https://www.youtube.com/watch?v=X5kmqWnprvI", title: "Incline Rear Delt Fly", channel: "Dr. Bridger Cutler, DC, MS" },
  db_glute_bridge: { url: "https://www.youtube.com/watch?v=cruqsnAyU6A", title: "How To Do A Glute Bridge With A Dumbbell", channel: "PureGym" },
  calf_raise_leg_press: { url: "https://www.youtube.com/watch?v=dhRz1Ns60Zg", title: "How To Do Calf Raises On The Leg Press", channel: "PureGym" },
  lat_pulldown_machine: { url: "https://www.youtube.com/watch?v=AOpi-p0cJkc", title: "Beginner's Guide: Lat Pulldown", channel: "SilverSneakers" },
  seated_row_machine: { url: "https://www.youtube.com/watch?v=TeFo51Q_Nsc", title: "How To Use The Seated Row Machine", channel: "PureGym" },
  leg_curl_machine: { url: "https://www.youtube.com/watch?v=ELOCsoDSmrg", title: "How To: Seated Leg Curl (Cybex)", channel: "ScottHermanFitness" },
  calf_raise_machine: { url: "https://www.youtube.com/watch?v=YMmgqO8Jo-k", title: "How To: Standing Calf (BM)", channel: "ScottHermanFitness" },
  // added 2026-11-18: YouTube oEmbed answered 200 with this title and channel on 2026-11-18 (docs/MEDIA.md)
  db_lying_leg_curl: { url: "https://www.youtube.com/watch?v=aPUtiouhcQQ", title: "Dumbbell Lying Leg Curl | How To | Proper Form & Technique", channel: "FITTR" },
  one_leg_db_calf_raise: { url: "https://www.youtube.com/watch?v=PTn6icEeH3Y", title: "Standing single leg dumbbell calf raises", channel: "FITTR" },
  cable_leg_curl: { url: "https://www.youtube.com/watch?v=QerRbPE55D8", title: "Standing Cable Leg Curls", channel: "WABBA" },
  arm_circles: { url: "https://www.youtube.com/watch?v=3STTSi_jdHk", title: "How To Arm Circles | Nuffield Health", channel: "Nuffield Health" },
  arm_swings: { url: "https://www.youtube.com/watch?v=p7EnbCprr5w", title: "Arm swings side to side", channel: "NHS inform" },
  cat_cow: { url: "https://www.youtube.com/watch?v=1Y0YjXS9sKI", title: "How to Do a Cat Cow Stretch: A Guide from Physical Therapists", channel: "Hinge Health" },
  bodyweight_squats: { url: "https://www.youtube.com/watch?v=P-yaD24bUE8", title: "Bodyweight Squat Tutorial - Proper Form and Technique", channel: "Runna" },
  glute_bridges: { url: "https://www.youtube.com/watch?v=SKOMwg1JLrU", title: "How to do a Glute bridge", channel: "National Academy of Sports Medicine (NASM)" },
  hip_hinge: { url: "https://www.youtube.com/watch?v=2W_gXhut5S8", title: "How to Do a Hip Hinge: A Guide from Physical Therapists", channel: "Hinge Health" },
  pushups_bench: { url: "https://www.youtube.com/watch?v=49jfZ_z7-us", title: "Incline Push Ups // Learn to Push Up for Beginners!", channel: "Tom Morrison" },
  uphill_walk: { url: "https://www.youtube.com/watch?v=HxsFneJFM2c", title: "How To Use The Treadmill", channel: "PureGym" },
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
// The keys are the frozen ids in machine-ids.js: a "Where it is in my gym" note is saved under them (g-<id>).
// area: the kind of area it stands in, in many UK gyms. The areas, signs and looks are typical, NOT checked at
// The Gym Group York Foss Island: SIGN_CAVEAT says so on every card, and Rosario's own note fixes it.
export const SIGN_CAVEAT = "Usual sign name and area in UK gyms. Signs and areas may differ at your gym.";
export const AREA_ORDER = ["cardio", "machines", "cables", "free_weights", "functional"];
export const AREAS = {
  cardio: { name: "Cardio", hint: "Rows of treadmills, bikes and cross-trainers." },
  machines: { name: "Resistance machines", hint: "Machines with a seat, most with a weight stack and a pin." },
  cables: { name: "Cables", hint: "Tall frames with pulleys you can move up and down (functional trainer)." },
  free_weights: { name: "Free weights", hint: "Dumbbell racks, benches and the Smith machine." },
  functional: { name: "Functional and stretch", hint: "Matted floor space for planks, warm-ups and stretching." },
};

// photo: the media id whose start photo shows the machine in use. sign: the usual words on the machine's sign.
// tip: one set-up tip (from builder D). check: one of the extra machines the first visit checks
// (shared_settings.extra_machines key); a card whose check answer is "no" (false) is hidden in the lists.
export const machines = {
  treadmill: { name: "Treadmill", sign: "Treadmill", area: "cardio", photo: "uphill_walk", tip: "Clip the safety key to your top before you start.", look: "A running belt with a screen; set speed and incline with the buttons or quick keys." },
  chest_press: { name: "Chest press machine", sign: "Chest Press", area: "machines", photo: "chest_press", tip: "Seat height: handles at mid-chest.", look: "A seat with a back pad and two handles at chest height that you push forward. Some load plates on the sides; others have a weight block behind." },
  shoulder_press: { name: "Shoulder press machine", sign: "Shoulder Press", area: "machines", photo: "shoulder_press_machine", tip: "Seat height: handles at ear level.", look: "A seat with handles at ear height that you push up." },
  leg_press: { name: "Leg press", sign: "Leg Press", area: "machines", photo: "leg_press", tip: "Back flat on the pad. Never lock your knees.", look: "A reclined seat with a big foot plate in front; you push the plate away with your legs." },
  leg_extension: { name: "Leg extension machine", sign: "Leg Extension", area: "machines", photo: "leg_extension", tip: "Knee in line with the machine's pivot.", look: "A seat with a padded bar in front of your lower shins that you lift by straightening your legs." },
  cable_station: { name: "Cable station (functional trainer)", sign: "Functional Trainer / Dual Adjustable Pulley", area: "cables", photo: "triceps_pushdown", tip: "Set the pulley height first, then clip on the rope or handle.", look: "A tall frame with two weight stacks and pulleys that slide up and down; ropes and handles hang on hooks." },
  smith_machine: { name: "Smith machine", sign: "Smith Machine", area: "free_weights", photo: "smith_squat", tip: "Set the safety stops just below your lowest point.", look: "A barbell fixed on two vertical rails, with hooks and safety stops." },
  hip_thrust: { name: "Glute Drive or hip thrust bench", sign: "Glute Drive / Hip Thrust", area: "free_weights", photo: "hip_thrust", tip: "Chin tucked, ribs down, squeeze at the top.", look: "A low padded bench for your upper back, with a belt or pad over the hips." },
  dumbbells_bench: { name: "Dumbbells and adjustable bench", sign: "Dumbbells", area: "free_weights", photo: "db_bench_press", tip: "Put the dumbbells back on the rack in order.", look: "Racks of dumbbells in pairs, and benches whose back can be set flat, sloped or upright." },
  mat_area: { name: "Mats and stretch area", sign: "Stretching / Functional", area: "functional", photo: "plank", tip: "Wipe the mat before and after.", look: "Open floor with mats. Take a mat for planks, dead bugs and the warm-up." },
  lat_pulldown: { name: "Lat pulldown machine", sign: "Lat Pulldown", area: "machines", photo: "lat_pulldown_machine", check: "lat_pulldown", tip: "Thigh pads snug, so you do not lift off.", look: "A seat with a thigh pad and a long bar hanging from above." },
  seated_row: { name: "Seated row machine", sign: "Seated Row", area: "machines", photo: "seated_row_machine", check: "seated_row", tip: "Chest on the pad, pull with your elbows.", look: "A seat with a chest pad and handles in front that you pull back." },
  leg_curl: { name: "Leg curl machine", sign: "Leg Curl", area: "machines", photo: "leg_curl_machine", check: "leg_curl", tip: "Knee in line with the pivot.", look: "A seat (or bench) with a pad behind your lower legs that you curl down." },
  pec_deck: { name: "Pec deck", sign: "Pec Fly / Rear Delt", area: "machines", photo: "pec_deck", check: "pec_deck", tip: "Handles at shoulder height.", look: "A seat with two arms at the sides that you bring together in front of your chest." },
  calf_raise: { name: "Calf raise machine", sign: "Calf Raise", area: "machines", photo: "calf_raise_machine", check: "calf_raise", tip: "Full stretch at the bottom, pause at the top.", look: "Shoulder pads over a small step; you rise up on your toes." },
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
  db_lying_leg_curl: "dumbbells_bench", one_leg_db_calf_raise: "dumbbells_bench", cable_leg_curl: "cable_station",
  uphill_walk: "treadmill", arm_circles: "mat_area", arm_swings: "mat_area", cat_cow: "mat_area", bodyweight_squats: "mat_area",
  glute_bridges: "mat_area", hip_hinge: "mat_area", pushups_bench: "mat_area",
};

// Exercises that use a machine (for the machine card's "Used for" line).
export function exercisesOn(machineId) {
  return Object.keys(machineOf).filter((id) => machineOf[id] === machineId);
}
