// Machines and stations the plan uses (redesign B, Rosario's choice 55 a). Public plan data, no body data.
// Each machine: the usual name on its sign, the gym area, and a picture: a photo folder in media/exercises/
// (the start photo of an exercise done on it) or an original drawing (js/ui/art.js).
// "Where it is in my gym" is Rosario's own note, saved as a gym_spots record (model.setGymSpot), never here.
// Sign names are the usual ones at UK gyms; the real sign at the gym may differ a little.

export const AREAS = {
  cardio: "Cardio",
  free_weights: "Free weights",
  cables: "Cables",
  machines: "Machines",
  functional: "Functional and stretch",
};

export const machines = {
  treadmill: { name: "Treadmill", sign: "Treadmill", area: "cardio", photo: "treadmill_walk", look: "A moving belt with a screen. Speed and incline buttons on the screen or the handles." },
  chest_press_machine: { name: "Chest press machine", sign: "Chest Press", area: "machines", photo: "chest_press", look: "A seat with a back pad and two handles in front of the chest. A weight stack with a pin at the side." },
  shoulder_press_machine: { name: "Shoulder press machine", sign: "Shoulder Press", area: "machines", photo: "shoulder_press_machine", look: "A seat with handles at ear height that you push up. A weight stack behind." },
  leg_press_machine: { name: "Leg press machine", sign: "Leg Press", area: "machines", photo: "leg_press", look: "A reclined seat and a big foot plate in front of you. Weight stack or plates at the side." },
  leg_extension_machine: { name: "Leg extension machine", sign: "Leg Extension", area: "machines", photo: "leg_extension", look: "A seat with a padded roller in front of your lower shins." },
  cable_station: { name: "Cable station", sign: "Functional Trainer or Cable Crossover", area: "cables", photo: "face_pull", look: "Two tall towers with pulleys you slide up and down, a weight stack in each. Handles and ropes hang nearby." },
  smith_machine: { name: "Smith machine", sign: "Smith Machine", area: "free_weights", photo: "smith_squat", look: "A barbell fixed on two rails, with hooks to lock it and safety stops. Plates go on the bar ends." },
  hip_thrust_station: { name: "Hip thrust station", sign: "Glute Drive or Hip Thrust", area: "machines", photo: "hip_thrust", look: "A low padded bench for your upper back and a belt or pad over the hips. Sometimes a machine with a lever arm." },
  dumbbell_rack: { name: "Dumbbell rack", sign: "Dumbbells", area: "free_weights", art: "dumbbells", look: "Rows of dumbbells in pairs, lightest at one end. The weight is printed on each end." },
  bench: { name: "Adjustable bench", sign: "Adjustable Bench", area: "free_weights", art: "bench", look: "A padded bench with a back you can raise from flat to upright. Usually near the dumbbells." },
  mat_area: { name: "Mat and stretch area", sign: "Stretch Area or Functional Zone", area: "functional", art: "mat", look: "An open floor with mats. Often foam rollers, kettlebells and boxes nearby." },
  lat_pulldown_machine: { name: "Lat pulldown machine", sign: "Lat Pulldown", area: "machines", photo: "lat_pulldown_machine", look: "A seat with thigh pads and a long bar hanging from above. Check on the first visit if the gym has one." },
  seated_row_machine: { name: "Seated row machine", sign: "Seated Row", area: "machines", photo: "seated_row_machine", look: "A seat with a chest pad and handles in front that you pull back. Check on the first visit." },
  leg_curl_machine: { name: "Leg curl machine", sign: "Leg Curl", area: "machines", photo: "leg_curl_machine", look: "A bench or seat with a padded roller behind your heels. Check on the first visit." },
  calf_raise_machine: { name: "Calf raise machine", sign: "Calf Raise", area: "machines", photo: "calf_raise_machine", look: "Shoulder pads above you and a block under the balls of your feet. Check on the first visit." },
};

// Which machines each exercise uses (first = the main one). The walk uses the treadmill.
export const exerciseMachines = {
  walk: ["treadmill"],
  chest_press: ["chest_press_machine"],
  pulldown: ["cable_station"],
  shoulder_press_machine: ["shoulder_press_machine"],
  one_arm_db_row: ["dumbbell_rack", "bench"],
  db_curl: ["dumbbell_rack"],
  triceps_pushdown: ["cable_station"],
  plank: ["mat_area"],
  dead_bug: ["mat_area"],
  leg_press: ["leg_press_machine"],
  cable_crunch: ["cable_station"],
  romanian_deadlift: ["dumbbell_rack"],
  face_pull: ["cable_station"],
  hip_thrust: ["hip_thrust_station"],
  leg_extension: ["leg_extension_machine"],
  goblet_squat: ["dumbbell_rack"],
  db_bench_press: ["dumbbell_rack", "bench"],
  lateral_raise: ["dumbbell_rack"],
  hammer_curl: ["dumbbell_rack"],
  overhead_triceps_ext: ["cable_station"],
  side_plank: ["mat_area"],
  incline_db_press: ["dumbbell_rack", "bench"],
  seated_cable_row: ["cable_station"],
  seated_db_shoulder_press: ["dumbbell_rack", "bench"],
  smith_squat: ["smith_machine"],
  reverse_crunch: ["mat_area"],
  cable_pull_through: ["cable_station"],
  calf_raise_standing: ["smith_machine"],
  cable_curl: ["cable_station"],
  cable_lateral_raise: ["cable_station"],
  rear_delt_raise: ["dumbbell_rack", "bench"],
  db_glute_bridge: ["dumbbell_rack", "mat_area"],
  calf_raise_leg_press: ["leg_press_machine"],
  lat_pulldown_machine: ["lat_pulldown_machine"],
  seated_row_machine: ["seated_row_machine"],
  leg_curl_machine: ["leg_curl_machine"],
  calf_raise_machine: ["calf_raise_machine"],
};

export const machinesFor = (exerciseId) => (exerciseMachines[exerciseId] ?? []).filter((id) => machines[id]);

// Exercises (ids) that use a machine, in plan order.
export function exercisesOn(machineId) {
  return Object.entries(exerciseMachines).filter(([, list]) => list.includes(machineId)).map(([id]) => id);
}
