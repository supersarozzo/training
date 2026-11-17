// Exercise pictures and form videos (redesign B, Rosario's choices 53 a and 54 a). Public plan data.
// photos: the free-exercise-db entry whose two photos (start, end) are saved unchanged at
//   media/exercises/<our id>/0.jpg and 1.jpg (public domain, The Unlicense; see MEDIA.md).
// art: an original drawing in js/ui/art.js, where the library has no good match.
// video: a trusted form video, opened in Safari as a plain link (no embed, no third-party script).
//   Checked to answer (HTTP 200) on the date in MEDIA.md.

export const photoSource = {
  chest_press: "Leverage_Chest_Press",
  pulldown: "Wide-Grip_Lat_Pulldown",
  shoulder_press_machine: "Machine_Shoulder_Military_Press",
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
  db_glute_bridge: "Barbell_Glute_Bridge",
  calf_raise_leg_press: "Calf_Press_On_The_Leg_Press_Machine",
  lat_pulldown_machine: "Close-Grip_Front_Lat_Pulldown",
  seated_row_machine: "Leverage_Iso_Row",
  leg_curl_machine: "Lying_Leg_Curls",
  calf_raise_machine: "Standing_Calf_Raises",
  // warm-up moves and the walk
  arm_circles: "Arm_Circles",
  arm_swings: "Dynamic_Chest_Stretch",
  cat_cow: "Cat_Stretch",
  bodyweight_squats: "Bodyweight_Squat",
  glute_bridges: "Butt_Lift_Bridge",
  pushups_bench: "Incline_Push-Up",
  treadmill_walk: "Walking_Treadmill",
};

// Original drawings for what the library does not have.
export const artFor = { hip_hinge: "hip_hinge" };

// Where a photo shows a close match rather than the exact move, a short honest caption.
export const photoNote = {
  romanian_deadlift: "Photo: stiff-legged version. Keep a soft bend in your knees.",
  hip_thrust: "Photo: barbell version. The Glute Drive works the same way.",
  cable_lateral_raise: "Photo: two-cable version. Do one arm at a time.",
  db_glute_bridge: "Photo: barbell version. Use one dumbbell on your hips.",
  calf_raise_standing: "Photo: the Smith machine version from the plan.",
  pulldown: "Photo: seated on a pulldown seat. Kneeling at the cable works the same way.",
};

// Form videos (checked 2026-11-17 with the YouTube oEmbed check: HTTP 200, title matches). id -> { url, channel }.
// The walk uses treadmill_walk. Titles and the weaker matches are listed in MEDIA.md.
export const videos = {
  chest_press: { url: "https://www.youtube.com/watch?v=xUm0BiZCWlQ", channel: "ScottHermanFitness" },
  pulldown: { url: "https://www.youtube.com/watch?v=CAwf7n6Luuc", channel: "ScottHermanFitness" },
  shoulder_press_machine: { url: "https://www.youtube.com/watch?v=Wqq43dKW1TU", channel: "ScottHermanFitness" },
  one_arm_db_row: { url: "https://www.youtube.com/watch?v=KRN38chlkds", channel: "ScottHermanFitness" },
  db_curl: { url: "https://www.youtube.com/watch?v=sAq_ocpRh_I", channel: "ScottHermanFitness" },
  triceps_pushdown: { url: "https://www.youtube.com/watch?v=_w-HpW70nSQ", channel: "ScottHermanFitness" },
  plank: { url: "https://www.youtube.com/watch?v=pSHjTRCQxIw", channel: "ScottHermanFitness" },
  dead_bug: { url: "https://www.youtube.com/watch?v=ZSYRZKYOf28", channel: "PureGym" },
  leg_press: { url: "https://www.youtube.com/watch?v=oujca3_Shgw", channel: "ScottHermanFitness" },
  cable_crunch: { url: "https://www.youtube.com/watch?v=2fbujeH3F0E", channel: "ScottHermanFitness" },
  romanian_deadlift: { url: "https://www.youtube.com/watch?v=FQKfr1YDhEk", channel: "ScottHermanFitness" },
  face_pull: { url: "https://www.youtube.com/watch?v=rep-qVOkqgk", channel: "ScottHermanFitness" },
  hip_thrust: { url: "https://www.youtube.com/watch?v=SEdqd1n0cvg", channel: "ScottHermanFitness" },
  leg_extension: { url: "https://www.youtube.com/watch?v=YyvSfVjQeL0", channel: "ScottHermanFitness" },
  goblet_squat: { url: "https://www.youtube.com/watch?v=MeIiIdhvXT4", channel: "ScottHermanFitness" },
  db_bench_press: { url: "https://www.youtube.com/watch?v=VmB1G1K7v94", channel: "ScottHermanFitness" },
  lateral_raise: { url: "https://www.youtube.com/watch?v=3VcKaXpzqRo", channel: "ScottHermanFitness" },
  hammer_curl: { url: "https://www.youtube.com/watch?v=zC3nLlEvin4", channel: "ScottHermanFitness" },
  overhead_triceps_ext: { url: "https://www.youtube.com/watch?v=9wxRhONFsRA", channel: "PureGym" },
  side_plank: { url: "https://www.youtube.com/watch?v=Oe9Tp9SvTCE", channel: "PureGym" },
  incline_db_press: { url: "https://www.youtube.com/watch?v=8iPEnn-ltC8", channel: "ScottHermanFitness" },
  seated_cable_row: { url: "https://www.youtube.com/watch?v=GZbfZ033f74", channel: "ScottHermanFitness" },
  seated_db_shoulder_press: { url: "https://www.youtube.com/watch?v=qEwKCR5JCog", channel: "ScottHermanFitness" },
  smith_squat: { url: "https://www.youtube.com/watch?v=AHnX-aimA4E", channel: "ScottHermanFitness" },
  reverse_crunch: { url: "https://www.youtube.com/watch?v=XY8KzdDcMFg", channel: "PureGym" },
  cable_pull_through: { url: "https://www.youtube.com/watch?v=pv8e6OSyETE", channel: "Renaissance Periodization" },
  calf_raise_standing: { url: "https://www.youtube.com/watch?v=hh5516HCu4k", channel: "Renaissance Periodization" },
  cable_curl: { url: "https://www.youtube.com/watch?v=GNlopToAZyg", channel: "PureGym" },
  cable_lateral_raise: { url: "https://www.youtube.com/watch?v=Z5FA9aq3L6A", channel: "PureGym" },
  rear_delt_raise: { url: "https://www.youtube.com/watch?v=6I6AlMABLL8", channel: "ScottHermanFitness" },
  db_glute_bridge: { url: "https://www.youtube.com/watch?v=cruqsnAyU6A", channel: "PureGym" },
  calf_raise_leg_press: { url: "https://www.youtube.com/watch?v=dhRz1Ns60Zg", channel: "PureGym" },
  lat_pulldown_machine: { url: "https://www.youtube.com/watch?v=X5n55mMqSUs", channel: "ScottHermanFitness" },
  seated_row_machine: { url: "https://www.youtube.com/watch?v=8MKGArS7w7c", channel: "ScottHermanFitness" },
  leg_curl_machine: { url: "https://www.youtube.com/watch?v=1Tq3QdYUuHs", channel: "ScottHermanFitness" },
  calf_raise_machine: { url: "https://www.youtube.com/watch?v=YMmgqO8Jo-k", channel: "ScottHermanFitness" },
  arm_circles: { url: "https://www.youtube.com/watch?v=3STTSi_jdHk", channel: "Nuffield Health" },
  arm_swings: { url: "https://www.youtube.com/watch?v=p7EnbCprr5w", channel: "NHS inform" },
  cat_cow: { url: "https://www.youtube.com/watch?v=CE_5RWjFA3Q", channel: "PureGym" },
  bodyweight_squats: { url: "https://www.youtube.com/watch?v=l83R5PblSMA", channel: "PureGym" },
  glute_bridges: { url: "https://www.youtube.com/watch?v=8bbE64NuDTU", channel: "ScottHermanFitness" },
  hip_hinge: { url: "https://www.youtube.com/watch?v=2W_gXhut5S8", channel: "Hinge Health" },
  pushups_bench: { url: "https://www.youtube.com/watch?v=yAbg3_pJKvw", channel: "PureGym" },
  treadmill_walk: { url: "https://www.youtube.com/watch?v=NAsObfFJXvE", channel: "Live Lean TV Daily Exercises" },
};

export const hasPhotos = (id) => Object.hasOwn(photoSource, id);
export const photoUrl = (id, n = 0) => `media/exercises/${id}/${n}.jpg`;
export const videoFor = (id) => (Object.hasOwn(videos, id) ? videos[id] : null);
