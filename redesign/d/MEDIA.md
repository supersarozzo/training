# Media used in redesign D

Last updated: 2026-11-17. Everything here is inside `redesign/d/app/` and works offline.

## Exercise photos

- **Source:** [free-exercise-db](https://github.com/yuhonas/free-exercise-db) by yuhonas.
- **Licence:** The Unlicense (public domain). No credit needed; we give it anyway.
- **Files:** 88 JPEG files, 5.1 MB, at `app/media/exercises/<exercise-id>/0.jpg` (start position) and `1.jpg` (end position).
- **Saved unchanged:** the files are the library's own JPEGs, not resized or edited. Sizes differ (for example 850 x 567, 1280 x 720, 500 x 750).
- **In the app:** the two photos crossfade as a short loop. With Reduce Motion on (or the app's Animations switch off) the loop stops and a tap shows the other position. The side bands next to a narrow photo show a blurred copy of the same file (CSS only, no extra file).
- **Map:** `tools/media-map.json` (also in `app/js/plan/media.js`). Some matches are the closest library move, not the exact same move:
  - romanian_deadlift uses Stiff-Legged_Dumbbell_Deadlift.
  - side_plank uses Side_Bridge.
  - uphill_walk uses Walking_Treadmill.
  - arm_swings uses Dynamic_Chest_Stretch.
  - pec_deck uses Butterfly.
- **No match:** hip_hinge. It is an original SVG drawing made for this app (`app/js/ui/demo.js`, two frames: standing, then hinged).

| App exercise id | free-exercise-db folder |
|---|---|
| arm_circles | [Arm_Circles](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Arm_Circles) |
| arm_swings | [Dynamic_Chest_Stretch](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Dynamic_Chest_Stretch) |
| bodyweight_squats | [Bodyweight_Squat](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Bodyweight_Squat) |
| cable_crunch | [Cable_Crunch](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Cable_Crunch) |
| cable_curl | [Standing_Biceps_Cable_Curl](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Standing_Biceps_Cable_Curl) |
| cable_lateral_raise | [Cable_Seated_Lateral_Raise](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Cable_Seated_Lateral_Raise) |
| cable_pull_through | [Pull_Through](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Pull_Through) |
| calf_raise_leg_press | [Calf_Press_On_The_Leg_Press_Machine](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Calf_Press_On_The_Leg_Press_Machine) |
| calf_raise_machine | [Standing_Calf_Raises](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Standing_Calf_Raises) |
| calf_raise_standing | [Smith_Machine_Calf_Raise](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Smith_Machine_Calf_Raise) |
| cat_cow | [Cat_Stretch](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Cat_Stretch) |
| chest_press | [Leverage_Chest_Press](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Leverage_Chest_Press) |
| db_bench_press | [Dumbbell_Bench_Press](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Dumbbell_Bench_Press) |
| db_curl | [Dumbbell_Bicep_Curl](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Dumbbell_Bicep_Curl) |
| db_glute_bridge | [Butt_Lift_Bridge](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Butt_Lift_Bridge) |
| dead_bug | [Dead_Bug](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Dead_Bug) |
| face_pull | [Face_Pull](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Face_Pull) |
| glute_bridges | [Butt_Lift_Bridge](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Butt_Lift_Bridge) |
| goblet_squat | [Goblet_Squat](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Goblet_Squat) |
| hammer_curl | [Hammer_Curls](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Hammer_Curls) |
| hip_thrust | [Barbell_Hip_Thrust](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Barbell_Hip_Thrust) |
| incline_db_press | [Incline_Dumbbell_Press](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Incline_Dumbbell_Press) |
| lat_pulldown_machine | [Full_Range-Of-Motion_Lat_Pulldown](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Full_Range-Of-Motion_Lat_Pulldown) |
| lateral_raise | [Side_Lateral_Raise](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Side_Lateral_Raise) |
| leg_curl_machine | [Seated_Leg_Curl](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Seated_Leg_Curl) |
| leg_extension | [Leg_Extensions](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Leg_Extensions) |
| leg_press | [Leg_Press](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Leg_Press) |
| one_arm_db_row | [One-Arm_Dumbbell_Row](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/One-Arm_Dumbbell_Row) |
| overhead_triceps_ext | [Cable_Rope_Overhead_Triceps_Extension](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Cable_Rope_Overhead_Triceps_Extension) |
| pec_deck | [Butterfly](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Butterfly) |
| plank | [Plank](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Plank) |
| pulldown | [Wide-Grip_Lat_Pulldown](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Wide-Grip_Lat_Pulldown) |
| pushups_bench | [Incline_Push-Up](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Incline_Push-Up) |
| rear_delt_raise | [Lying_Rear_Delt_Raise](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Lying_Rear_Delt_Raise) |
| reverse_crunch | [Reverse_Crunch](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Reverse_Crunch) |
| romanian_deadlift | [Stiff-Legged_Dumbbell_Deadlift](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Stiff-Legged_Dumbbell_Deadlift) |
| seated_cable_row | [Seated_Cable_Rows](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Seated_Cable_Rows) |
| seated_db_shoulder_press | [Seated_Dumbbell_Press](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Seated_Dumbbell_Press) |
| seated_row_machine | [Leverage_High_Row](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Leverage_High_Row) |
| shoulder_press_machine | [Leverage_Shoulder_Press](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Leverage_Shoulder_Press) |
| side_plank | [Side_Bridge](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Side_Bridge) |
| smith_squat | [Smith_Machine_Squat](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Smith_Machine_Squat) |
| triceps_pushdown | [Triceps_Pushdown](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Triceps_Pushdown) |
| uphill_walk | [Walking_Treadmill](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Walking_Treadmill) |

## Form videos

- A plain "Watch video" link that opens Safari or the YouTube app. No video is embedded and nothing is downloaded.
- Each link was checked on 2026-11-17 with YouTube's public oEmbed address: all 44 answered HTTP 200.
- Stored in plan data: `app/js/plan/videos.js`. Full check record: `tools/videos-checked.json`.
- Video titles are not shown in the app (one title has a mild swear word).
- Weak picks (the channel is less known, or the video is not a perfect match): uphill_walk, arm_swings, calf_raise_machine, cable_curl, cable_crunch, plank, side_plank. Worth replacing after a look on the phone.

| App exercise id | Video | Channel | HTTP | Checked | Note |
|---|---|---|---|---|---|
| arm_circles | [How To Arm Circles / Nuffield Health](https://www.youtube.com/watch?v=3STTSi_jdHk) | Nuffield Health | 200 | 2026-11-17 |  |
| arm_swings | [How To Do STANDING CROSS BODY ARM SWINGS / Exercise Demonstration Video and Guide](https://www.youtube.com/watch?v=AsMMF3YWIIM) | Live Lean TV Daily Exercises | 200 | 2026-11-17 | weak pick, replace later |
| bodyweight_squats | [Leg exercise - How to bodyweight squat](https://www.youtube.com/watch?v=l83R5PblSMA) | PureGym | 200 | 2026-11-17 |  |
| cable_crunch | [The Kneeling Cable Rope Crunch (Awesome 6-Pack Ab Exercise)](https://www.youtube.com/watch?v=jBtiDLz0y7s) | Sean Nalewanyj | 200 | 2026-11-17 | weak pick, replace later |
| cable_curl | [How To Do Cable Bicep Curls - Full Video Tutorial and Step-by-Step Guide](https://www.youtube.com/watch?v=NFzTWp2qpiE) | Fit Father Project - Fitness For Busy Fathers | 200 | 2026-11-17 | weak pick, replace later |
| cable_lateral_raise | [How To Do Cable Lateral Raises](https://www.youtube.com/watch?v=Z5FA9aq3L6A) | PureGym | 200 | 2026-11-17 |  |
| cable_pull_through | [Cable Pull Through](https://www.youtube.com/watch?v=pv8e6OSyETE) | Renaissance Periodization | 200 | 2026-11-17 |  |
| calf_raise_leg_press | [How To Do Calf Raises On The Leg Press](https://www.youtube.com/watch?v=dhRz1Ns60Zg) | PureGym | 200 | 2026-11-17 |  |
| calf_raise_machine | [How to PROPERLY Standing Calf Raise / Tips & Common Mistakes](https://www.youtube.com/watch?v=SVtg-1loH4c) | Colossus Fitness | 200 | 2026-11-17 | weak pick, replace later |
| calf_raise_standing | [Smith Machine Calves](https://www.youtube.com/watch?v=hh5516HCu4k) | Renaissance Periodization | 200 | 2026-11-17 |  |
| cat_cow | [How to Do a Cat Cow Stretch: A Guide from Physical Therapists](https://www.youtube.com/watch?v=1Y0YjXS9sKI) | Hinge Health | 200 | 2026-11-17 |  |
| chest_press | [How To Use The Chest Press Machine](https://www.youtube.com/watch?v=sqNwDkUU_Ps) | PureGym | 200 | 2026-11-17 |  |
| db_bench_press | [How To: Dumbbell Chest Press](https://www.youtube.com/watch?v=VmB1G1K7v94) | ScottHermanFitness | 200 | 2026-11-17 |  |
| db_curl | [Dumbbell Bicep Curl / Nuffield Health](https://www.youtube.com/watch?v=cBSD6mQIPQk) | Nuffield Health | 200 | 2026-11-17 |  |
| db_glute_bridge | [How To Do A Glute Bridge With A Dumbbell](https://www.youtube.com/watch?v=cruqsnAyU6A) | PureGym | 200 | 2026-11-17 |  |
| dead_bug | [How to Do a Dead Bug: A Guide from Physical Therapists](https://www.youtube.com/watch?v=GbSC02oU3To) | Hinge Health | 200 | 2026-11-17 |  |
| face_pull | [STOP F*cking Up Face Pulls (PROPER FORM!)](https://www.youtube.com/watch?v=ljgqer1ZpXg) | ATHLEAN-X™ | 200 | 2026-11-17 |  |
| glute_bridges | [How to do a glute bridge / Bupa Health](https://www.youtube.com/watch?v=XLXGydU5DdU) | Bupa Health | 200 | 2026-11-17 |  |
| goblet_squat | [How To Do A Goblet squat](https://www.youtube.com/watch?v=zBV3ceGyAxw) | PureGym | 200 | 2026-11-17 |  |
| hammer_curl | [HOW TO: Dumbbell Hammer Curl (BICEPS PEAK BUILDER!) // PERFECT FORM](https://www.youtube.com/watch?v=8XLxfXROrTo) | ScottHermanFitness | 200 | 2026-11-17 |  |
| hip_hinge | [How to Do a Hip Hinge: A Guide from Physical Therapists](https://www.youtube.com/watch?v=2W_gXhut5S8) | Hinge Health | 200 | 2026-11-17 |  |
| hip_thrust | [How To: Hip Thrust](https://www.youtube.com/watch?v=SEdqd1n0cvg) | ScottHermanFitness | 200 | 2026-11-17 |  |
| incline_db_press | [How To: Dumbbell Incline Chest Press](https://www.youtube.com/watch?v=8iPEnn-ltC8) | ScottHermanFitness | 200 | 2026-11-17 |  |
| lat_pulldown_machine | [Beginner's Guide: Lat Pulldown](https://www.youtube.com/watch?v=AOpi-p0cJkc) | SilverSneakers | 200 | 2026-11-17 |  |
| lateral_raise | [How to do a Dumbbell Lateral Raise](https://www.youtube.com/watch?v=XPPfnSEATJA) | National Academy of Sports Medicine (NASM) | 200 | 2026-11-17 |  |
| leg_curl_machine | [How To: Seated Leg Curl (Cybex)](https://www.youtube.com/watch?v=ELOCsoDSmrg) | ScottHermanFitness | 200 | 2026-11-17 |  |
| leg_extension | [How To: Leg Extension (Cybex)](https://www.youtube.com/watch?v=YyvSfVjQeL0) | ScottHermanFitness | 200 | 2026-11-17 |  |
| leg_press | [How To Use The Leg Press Machine](https://www.youtube.com/watch?v=p5dCqF7wWUw) | PureGym | 200 | 2026-11-17 |  |
| one_arm_db_row | [How To: Dumbbell Single-Arm Row (On Bench)](https://www.youtube.com/watch?v=KRN38chlkds) | ScottHermanFitness | 200 | 2026-11-17 |  |
| overhead_triceps_ext | [Rope Overhead Triceps Extension](https://www.youtube.com/watch?v=kqidUIf1eJE) | Renaissance Periodization | 200 | 2026-11-17 |  |
| plank | [How to do a plank](https://www.youtube.com/watch?v=rerKy2AEHz4) | MassGeneralHospital | 200 | 2026-11-17 | weak pick, replace later |
| pulldown | [How to do Lat Pulldowns (AVOID MISTAKES!)](https://www.youtube.com/watch?v=SALxEARiMkw) | ATHLEAN-X™ | 200 | 2026-11-17 |  |
| pushups_bench | [How to do an Incline Push-Up](https://www.youtube.com/watch?v=Gvm5Q29UHbk) | National Academy of Sports Medicine (NASM) | 200 | 2026-11-17 |  |
| rear_delt_raise | [How To: Dumbbell Bent-Over Raise](https://www.youtube.com/watch?v=ttvfGg9d76c) | ScottHermanFitness | 200 | 2026-11-17 |  |
| reverse_crunch | [How To Do A Reverse Crunch](https://www.youtube.com/watch?v=XY8KzdDcMFg) | PureGym | 200 | 2026-11-17 |  |
| romanian_deadlift | [How To: Dumbbell Romanian Deadlift](https://www.youtube.com/watch?v=FQKfr1YDhEk) | ScottHermanFitness | 200 | 2026-11-17 |  |
| seated_cable_row | [How To: Seated Cable Low-Row // PERFECT FORM](https://www.youtube.com/watch?v=7o2oolbmzeI) | ScottHermanFitness | 200 | 2026-11-17 |  |
| seated_db_shoulder_press | [Seated Dumbbell Shoulder Press](https://www.youtube.com/watch?v=HzIiNhHhhtA) | Renaissance Periodization | 200 | 2026-11-17 |  |
| seated_row_machine | [How To Use The Seated Row Machine](https://www.youtube.com/watch?v=TeFo51Q_Nsc) | PureGym | 200 | 2026-11-17 |  |
| shoulder_press_machine | [How To Use The Shoulder Press Machine](https://www.youtube.com/watch?v=TnhIyp4kmO8) | PureGym | 200 | 2026-11-17 |  |
| side_plank | [How to Do a Side Plank / Ab Workout](https://www.youtube.com/watch?v=NXr4Fw8q60o) | Howcast | 200 | 2026-11-17 | weak pick, replace later |
| smith_squat | [How To: Smith Machine- Squat](https://www.youtube.com/watch?v=AHnX-aimA4E) | ScottHermanFitness | 200 | 2026-11-17 |  |
| triceps_pushdown | [HOW TO: Cable Triceps Pushdown // 3 Golden Rules (FOR GROWTH)](https://www.youtube.com/watch?v=_w-HpW70nSQ) | ScottHermanFitness | 200 | 2026-11-17 |  |
| uphill_walk | [How To: Incline Treadmill Walk (12-3-30 Workout)](https://www.youtube.com/watch?v=NAsObfFJXvE) | Live Lean TV Daily Exercises | 200 | 2026-11-17 | weak pick, replace later |

## Machine cards

- 15 machines in `app/js/plan/machines.js`. Each card uses the exercise photo of its main move (same files as above), no extra pictures.
- **Sign names** are the usual names in UK gyms. They were **not** checked at the gym. The card says so.
- **Gym area** groups (Cardio, Free weights, Cables, Machines, Functional) are a typical gym layout, **not** checked at Rosario's gym.
- "Where it is in my gym" is typed by Rosario on the phone and synced (new list `machine_spots`).

## App size

- App copy before the redesign: 285,691 bytes (about 0.3 MB).
- App copy now: 5,753,967 bytes (about 5.5 MB). Photos are 5.1 MB of that.
- The download limit in the brief was 250 MB.
