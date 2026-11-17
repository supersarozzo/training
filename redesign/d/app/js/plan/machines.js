// Machines and stations the plan uses (redesign D, Rosario's choice 55 a). Public plan data, no body data.
// Each machine: the usual name on its sign, the gym area, what it looks like, and the exercise whose photo shows it.
// The sign names are the usual names in UK gyms. They were NOT checked at The Gym Group York Foss Island:
// Rosario writes "Where it is in my gym" on the first visit (saved as a machine_spots record, see model.setMachineSpot).
import { exercises, warmupMoves, upperDayWarmupExtra } from "./plan-v2.js";

export const AREAS = {
  cardio: "Cardio",
  free_weights: "Free weights",
  cables: "Cables",
  machines: "Machines",
  functional: "Functional and stretch",
};
export const AREA_ORDER = ["cardio", "machines", "cables", "free_weights", "functional"];

// photo: an exercise id with photos in media/exercises/. extra: the question 17 setting this machine depends on.
export const machines = {
  treadmill: { name: "Treadmill", sign: "Treadmill", area: "cardio", photo: "uphill_walk",
    look: "A running belt with a screen and handrails. Buttons for speed and incline (slope).", tip: "Clip the safety key to your top before you start." },
  chest_press: { name: "Chest press machine", sign: "Chest Press", area: "machines", photo: "chest_press",
    look: "A seat with a back pad and two handles at chest height that you push forward. A weight stack with a pin.", tip: "Seat height: handles at mid-chest." },
  shoulder_press: { name: "Shoulder press machine", sign: "Shoulder Press", area: "machines", photo: "shoulder_press_machine",
    look: "A seat with an upright back pad and two handles at ear height that you push up.", tip: "Seat height: handles at ear level." },
  leg_press: { name: "Leg press machine", sign: "Leg Press", area: "machines", photo: "leg_press",
    look: "A reclined seat facing a large foot plate. You push the plate away with your legs.", tip: "Back flat on the pad. Never lock your knees." },
  leg_extension: { name: "Leg extension machine", sign: "Leg Extension", area: "machines", photo: "leg_extension",
    look: "A seat with a padded roller in front of your lower shins. You straighten your legs.", tip: "Knee in line with the machine's pivot." },
  hip_thrust: { name: "Glute Drive or hip thrust bench", sign: "Glute Drive / Hip Thrust", area: "machines", photo: "hip_thrust",
    look: "A low padded bench for your upper back and a belt or pad across your hips.", tip: "Chin tucked, ribs down, squeeze at the top." },
  cable_station: { name: "Cable station (pulleys)", sign: "Cable Crossover / Functional Trainer", area: "cables", photo: "triceps_pushdown",
    look: "A tall frame with two weight stacks and pulleys you slide up or down. Ropes and handles hang on hooks.", tip: "Set the pulley height first, then clip on the rope or handle." },
  dumbbells_bench: { name: "Dumbbells and adjustable bench", sign: "Dumbbells / Free Weights", area: "free_weights", photo: "db_bench_press",
    look: "A rack of dumbbells in pairs, sorted by weight, with benches whose back can be raised.", tip: "Put the dumbbells back on the rack in order." },
  smith_machine: { name: "Smith machine", sign: "Smith Machine", area: "free_weights", photo: "smith_squat",
    look: "A bar that slides up and down on two fixed rails, with safety stops and hooks you twist to lock.", tip: "Set the safety stops just below your lowest point." },
  mats: { name: "Mats and stretch area", sign: "Stretch / Functional Area", area: "functional", photo: "plank",
    look: "An open floor with mats, often near mirrors, with foam rollers and small kit.", tip: "Wipe the mat before and after." },
  // Question 17 machines: only used once the first visit finds them (Settings > Gym weights).
  lat_pulldown: { name: "Lat pulldown machine", sign: "Lat Pulldown", area: "machines", photo: "lat_pulldown_machine", extra: "lat_pulldown",
    look: "A seat with thigh pads and a long bar hanging from a high pulley.", tip: "Thigh pads snug, so you do not lift off." },
  seated_row: { name: "Seated row machine", sign: "Seated Row", area: "machines", photo: "seated_row_machine", extra: "seated_row",
    look: "A seat with a chest pad and handles in front that you pull towards you.", tip: "Chest on the pad, pull with your elbows." },
  leg_curl: { name: "Leg curl machine", sign: "Leg Curl", area: "machines", photo: "leg_curl_machine", extra: "leg_curl",
    look: "A seat or bench with a padded roller behind your lower legs. You bend your knees.", tip: "Knee in line with the pivot." },
  pec_deck: { name: "Pec deck", sign: "Pec Deck / Rear Delt Fly", area: "machines", photo: "pec_deck", extra: "pec_deck",
    look: "A seat with two arms or handles out to the sides that you bring together in front of you.", tip: "Handles at shoulder height." },
  calf_raise: { name: "Calf raise machine", sign: "Calf Raise", area: "machines", photo: "calf_raise_machine", extra: "calf_raise",
    look: "Shoulder pads above a small raised step. You rise up on your toes.", tip: "Full stretch at the bottom, pause at the top." },
};

// Which machine or station each exercise needs. Floor and warm-up moves use the mats.
export const exerciseMachine = {
  uphill_walk: "treadmill",
  chest_press: "chest_press",
  shoulder_press_machine: "shoulder_press",
  leg_press: "leg_press",
  calf_raise_leg_press: "leg_press",
  leg_extension: "leg_extension",
  hip_thrust: "hip_thrust",
  pulldown: "cable_station", triceps_pushdown: "cable_station", face_pull: "cable_station", cable_crunch: "cable_station",
  overhead_triceps_ext: "cable_station", seated_cable_row: "cable_station", cable_pull_through: "cable_station",
  cable_curl: "cable_station", cable_lateral_raise: "cable_station",
  one_arm_db_row: "dumbbells_bench", db_curl: "dumbbells_bench", romanian_deadlift: "dumbbells_bench", goblet_squat: "dumbbells_bench",
  db_bench_press: "dumbbells_bench", lateral_raise: "dumbbells_bench", hammer_curl: "dumbbells_bench", incline_db_press: "dumbbells_bench",
  seated_db_shoulder_press: "dumbbells_bench", rear_delt_raise: "dumbbells_bench", db_glute_bridge: "dumbbells_bench",
  smith_squat: "smith_machine", calf_raise_standing: "smith_machine",
  plank: "mats", dead_bug: "mats", side_plank: "mats", reverse_crunch: "mats",
  lat_pulldown_machine: "lat_pulldown", seated_row_machine: "seated_row", leg_curl_machine: "leg_curl", calf_raise_machine: "calf_raise",
};
for (const m of [...warmupMoves, upperDayWarmupExtra]) exerciseMachine[m.id] = "mats";

export function machineFor(exerciseId) {
  const id = exerciseMachine[exerciseId];
  return id ? { id, ...machines[id] } : null;
}

// Exercises of the plan done on a machine (names, for the machine card).
export function exercisesOn(machineId) {
  return Object.keys(exercises).filter((id) => exerciseMachine[id] === machineId);
}

// The machines to show: everything, or (with settings) without the question 17 machines the gym does not have.
export function machineList(settings = null) {
  return AREA_ORDER.flatMap((area) => Object.entries(machines)
    .filter(([, m]) => m.area === area)
    .filter(([, m]) => !m.extra || settings?.extra_machines?.[m.extra] !== false)
    .map(([id, m]) => ({ id, ...m })));
}

// The "Where it is in my gym" note of one machine, from the data document (or "").
export function spotFor(doc, machineId) {
  const rec = (doc.machine_spots ?? []).find((x) => x.id === `g-${machineId}` && !x.deleted);
  return rec && typeof rec.where === "string" ? rec.where : "";
}
