// The gym's machines and stations: ONE frozen list of ids (JUDGING.md 3.3).
// A "Where it is in my gym" note is saved as g-<id>, so an id must never be renamed once a note exists:
// a rename would orphan the note (tests/gym-spots.test.mjs checks this list).
// lat_pulldown to calf_raise, and ab_crunch (0.7.5), match shared_settings.extra_machines (the first-visit check).
// booty_builder and ab_crunch were appended by trainer D18 (0.7.5), never inserted. Kept tiny so model.js
// does not import the big photo and video data (plan/media.js).
export const MACHINE_IDS = Object.freeze([
  "treadmill", "chest_press", "shoulder_press", "leg_press", "leg_extension", "cable_station", "smith_machine",
  "hip_thrust", "dumbbells_bench", "mat_area", "lat_pulldown", "seated_row", "leg_curl", "pec_deck", "calf_raise",
  "booty_builder", "ab_crunch",
]);
