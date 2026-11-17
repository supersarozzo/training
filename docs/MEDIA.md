# Media: photos, drawings, icons and videos

Date: 2026-11-17. Written by task chat 8.24 (redesign merge). Data source: `app/js/plan/media.js`. Decisions: [DECISIONS.md](DECISIONS.md) (questions 59 a and the video row).

## Exercise photos

- **Source:** free-exercise-db, https://github.com/yuhonas/free-exercise-db. Licence: The Unlicense, which puts the photos in the **public domain** (no credit needed; we give it anyway). Checked by the redesign builders on 2026-11-17.
- **What ships:** 88 photos for 44 moves (exercises, warm-up moves, the walk and the pec deck) at `app/media/exercises/<plan id>/0.jpg` (start position) and `1.jpg` (end position). About 5.4 MB. All are in the offline list of `sw.js`.
- **Changes to the files:** none, except the two `dead_bug` photos, shrunk from 1280 × 720 to 850 × 478 (Rosario's question 59 a: keep the sharp 850 px photos, shrink only the oversized two). The other photos are 850 or 500 px wide.
- **Close matches:** "close" in the table means the library has a very similar move, not the exact one. The app then shows a one-line note under the photo (`matchNote`) saying what differs.
- **hip_hinge** has no library photo: the app draws its own two-frame line drawing (`app/js/ui/drawings.js`, original work).
- **Machine cards** reuse the photo of an exercise done on that machine.

| Plan id | Library entry | Match |
|---|---|---|
| chest_press | [Leverage_Chest_Press](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Leverage_Chest_Press) | close |
| pulldown | [Wide-Grip_Lat_Pulldown](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Wide-Grip_Lat_Pulldown) | close |
| shoulder_press_machine | [Machine_Shoulder_Military_Press](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Machine_Shoulder_Military_Press) | same |
| one_arm_db_row | [One-Arm_Dumbbell_Row](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/One-Arm_Dumbbell_Row) | same |
| db_curl | [Dumbbell_Bicep_Curl](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Dumbbell_Bicep_Curl) | same |
| triceps_pushdown | [Triceps_Pushdown](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Triceps_Pushdown) | same |
| plank | [Plank](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Plank) | same |
| dead_bug | [Dead_Bug](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Dead_Bug) | same |
| leg_press | [Leg_Press](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Leg_Press) | same |
| cable_crunch | [Cable_Crunch](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Cable_Crunch) | same |
| romanian_deadlift | [Stiff-Legged_Dumbbell_Deadlift](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Stiff-Legged_Dumbbell_Deadlift) | close |
| face_pull | [Face_Pull](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Face_Pull) | same |
| hip_thrust | [Barbell_Hip_Thrust](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Barbell_Hip_Thrust) | close |
| leg_extension | [Leg_Extensions](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Leg_Extensions) | same |
| goblet_squat | [Goblet_Squat](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Goblet_Squat) | same |
| db_bench_press | [Dumbbell_Bench_Press](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Dumbbell_Bench_Press) | same |
| lateral_raise | [Side_Lateral_Raise](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Side_Lateral_Raise) | same |
| hammer_curl | [Hammer_Curls](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Hammer_Curls) | same |
| overhead_triceps_ext | [Cable_Rope_Overhead_Triceps_Extension](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Cable_Rope_Overhead_Triceps_Extension) | same |
| side_plank | [Side_Bridge](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Side_Bridge) | same |
| incline_db_press | [Incline_Dumbbell_Press](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Incline_Dumbbell_Press) | same |
| seated_cable_row | [Seated_Cable_Rows](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Seated_Cable_Rows) | same |
| seated_db_shoulder_press | [Dumbbell_Shoulder_Press](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Dumbbell_Shoulder_Press) | same |
| smith_squat | [Smith_Machine_Squat](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Smith_Machine_Squat) | same |
| reverse_crunch | [Reverse_Crunch](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Reverse_Crunch) | same |
| cable_pull_through | [Pull_Through](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Pull_Through) | same |
| calf_raise_standing | [Smith_Machine_Calf_Raise](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Smith_Machine_Calf_Raise) | same |
| cable_curl | [Standing_Biceps_Cable_Curl](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Standing_Biceps_Cable_Curl) | same |
| cable_lateral_raise | [Cable_Seated_Lateral_Raise](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Cable_Seated_Lateral_Raise) | close |
| rear_delt_raise | [Dumbbell_Lying_Rear_Lateral_Raise](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Dumbbell_Lying_Rear_Lateral_Raise) | same |
| db_glute_bridge | [Barbell_Glute_Bridge](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Barbell_Glute_Bridge) | close |
| calf_raise_leg_press | [Calf_Press_On_The_Leg_Press_Machine](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Calf_Press_On_The_Leg_Press_Machine) | same |
| lat_pulldown_machine | [Close-Grip_Front_Lat_Pulldown](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Close-Grip_Front_Lat_Pulldown) | close |
| seated_row_machine | [Leverage_Iso_Row](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Leverage_Iso_Row) | same |
| leg_curl_machine | [Seated_Leg_Curl](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Seated_Leg_Curl) | same |
| calf_raise_machine | [Standing_Calf_Raises](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Standing_Calf_Raises) | same |
| arm_circles | [Arm_Circles](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Arm_Circles) | same |
| arm_swings | [Dynamic_Chest_Stretch](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Dynamic_Chest_Stretch) | close |
| cat_cow | [Cat_Stretch](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Cat_Stretch) | same |
| bodyweight_squats | [Bodyweight_Squat](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Bodyweight_Squat) | same |
| glute_bridges | [Butt_Lift_Bridge](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Butt_Lift_Bridge) | same |
| hip_hinge | (none: own drawing) | – |
| pushups_bench | [Incline_Push-Up](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Incline_Push-Up) | same |
| uphill_walk | [Walking_Treadmill](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Walking_Treadmill) | close |
| pec_deck | [Butterfly](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Butterfly) | same |

## Icons

All interface icons and the gym-area icons are original inline SVG written for this app (`app/js/ui/icons.js`). No icon font, no third-party icon set. The app icon (`app/icons/`) is still the old generated teal one (follow-up).

## Form videos

- One YouTube link per move (44), in `app/js/plan/media.js` (`VIDEOS`). The "Video" chip opens the link in Safari: no embed, no YouTube script in the page, so the page's security rules (CSP) are unchanged. The app shows the channel name, not the video title.
- **Checked 2026-11-17** by task chat 8.24 with YouTube's public oEmbed address: every link answered 200 and the title and channel matched the app's data. Full record: [redesign-final/videos-checked.json](redesign-final/videos-checked.json).
- Videos belong to their channels; we only link to them.
- The check proves each link works and its title and channel match. It does not judge the teaching: a person should watch each video once.

| Plan id | Video | Channel | oEmbed |
|---|---|---|---|
| chest_press | [How To Use The Chest Press Machine](https://www.youtube.com/watch?v=sqNwDkUU_Ps) | PureGym | 200, same title and channel |
| pulldown | [How To Do Kneeling Lat Pulldowns](https://www.youtube.com/watch?v=VIJPZ8m0EDM) | PureGym | 200, same title and channel |
| shoulder_press_machine | [How To Use The Shoulder Press Machine](https://www.youtube.com/watch?v=TnhIyp4kmO8) | PureGym | 200, same title and channel |
| one_arm_db_row | [How To: Dumbbell Single-Arm Row (On Bench)](https://www.youtube.com/watch?v=KRN38chlkds) | ScottHermanFitness | 200, same title and channel |
| db_curl | [Dumbbell Bicep Curl / Nuffield Health](https://www.youtube.com/watch?v=cBSD6mQIPQk) | Nuffield Health | 200, same title and channel |
| triceps_pushdown | [How To Do A Tricep Pushdown](https://www.youtube.com/watch?v=LXkCrxn3caQ) | PureGym | 200, same title and channel |
| plank | [How to do a plank](https://www.youtube.com/watch?v=rerKy2AEHz4) | MassGeneralHospital | 200, same title and channel |
| dead_bug | [How to Do a Dead Bug: A Guide from Physical Therapists](https://www.youtube.com/watch?v=GbSC02oU3To) | Hinge Health | 200, same title and channel |
| leg_press | [How To Use The Leg Press Machine](https://www.youtube.com/watch?v=p5dCqF7wWUw) | PureGym | 200, same title and channel |
| cable_crunch | [Cable Crunch: Do It Right!](https://www.youtube.com/watch?v=ToJeyhydUxU) | Testosterone Nation | 200, same title and channel |
| romanian_deadlift | [How To: Dumbbell Romanian Deadlift](https://www.youtube.com/watch?v=FQKfr1YDhEk) | ScottHermanFitness | 200, same title and channel |
| face_pull | [Rope Face Pull](https://www.youtube.com/watch?v=eFxMixk_qPQ) | Men's Health | 200, same title and channel |
| hip_thrust | [How To: Hip Thrust](https://www.youtube.com/watch?v=SEdqd1n0cvg) | ScottHermanFitness | 200, same title and channel |
| leg_extension | [How To: Leg Extension (Cybex)](https://www.youtube.com/watch?v=YyvSfVjQeL0) | ScottHermanFitness | 200, same title and channel |
| goblet_squat | [How To Do A Goblet squat](https://www.youtube.com/watch?v=zBV3ceGyAxw) | PureGym | 200, same title and channel |
| db_bench_press | [How To: Dumbbell Chest Press](https://www.youtube.com/watch?v=VmB1G1K7v94) | ScottHermanFitness | 200, same title and channel |
| lateral_raise | [How to do a Dumbbell Lateral Raise](https://www.youtube.com/watch?v=XPPfnSEATJA) | National Academy of Sports Medicine (NASM) | 200, same title and channel |
| hammer_curl | [How To: Dumbbell Hammer Curl](https://www.youtube.com/watch?v=zC3nLlEvin4) | ScottHermanFitness | 200, same title and channel |
| overhead_triceps_ext | [Rope Overhead Triceps Extension](https://www.youtube.com/watch?v=kqidUIf1eJE) | Renaissance Periodization | 200, same title and channel |
| side_plank | [How To Do A Side Plank](https://www.youtube.com/watch?v=Oe9Tp9SvTCE) | PureGym | 200, same title and channel |
| incline_db_press | [How To: Dumbbell Incline Chest Press](https://www.youtube.com/watch?v=8iPEnn-ltC8) | ScottHermanFitness | 200, same title and channel |
| seated_cable_row | [How To: Seated Low Row (LF Cable)](https://www.youtube.com/watch?v=GZbfZ033f74) | ScottHermanFitness | 200, same title and channel |
| seated_db_shoulder_press | [Seated Dumbbell Shoulder Press](https://www.youtube.com/watch?v=HzIiNhHhhtA) | Renaissance Periodization | 200, same title and channel |
| smith_squat | [How To: Smith Machine- Squat](https://www.youtube.com/watch?v=AHnX-aimA4E) | ScottHermanFitness | 200, same title and channel |
| reverse_crunch | [How To Do A Reverse Crunch](https://www.youtube.com/watch?v=XY8KzdDcMFg) | PureGym | 200, same title and channel |
| cable_pull_through | [Cable Pull Through](https://www.youtube.com/watch?v=pv8e6OSyETE) | Renaissance Periodization | 200, same title and channel |
| calf_raise_standing | [Smith Machine Calves](https://www.youtube.com/watch?v=hh5516HCu4k) | Renaissance Periodization | 200, same title and channel |
| cable_curl | [How To Do A Cable Curl](https://www.youtube.com/watch?v=GNlopToAZyg) | PureGym | 200, same title and channel |
| cable_lateral_raise | [How To Do Cable Lateral Raises](https://www.youtube.com/watch?v=Z5FA9aq3L6A) | PureGym | 200, same title and channel |
| rear_delt_raise | [Incline Rear Delt Fly](https://www.youtube.com/watch?v=X5kmqWnprvI) | Dr. Bridger Cutler, DC, MS | 200, same title and channel |
| db_glute_bridge | [How To Do A Glute Bridge With A Dumbbell](https://www.youtube.com/watch?v=cruqsnAyU6A) | PureGym | 200, same title and channel |
| calf_raise_leg_press | [How To Do Calf Raises On The Leg Press](https://www.youtube.com/watch?v=dhRz1Ns60Zg) | PureGym | 200, same title and channel |
| lat_pulldown_machine | [Beginner's Guide: Lat Pulldown](https://www.youtube.com/watch?v=AOpi-p0cJkc) | SilverSneakers | 200, same title and channel |
| seated_row_machine | [How To Use The Seated Row Machine](https://www.youtube.com/watch?v=TeFo51Q_Nsc) | PureGym | 200, same title and channel |
| leg_curl_machine | [How To: Seated Leg Curl (Cybex)](https://www.youtube.com/watch?v=ELOCsoDSmrg) | ScottHermanFitness | 200, same title and channel |
| calf_raise_machine | [How To: Standing Calf (BM)](https://www.youtube.com/watch?v=YMmgqO8Jo-k) | ScottHermanFitness | 200, same title and channel |
| arm_circles | [How To Arm Circles / Nuffield Health](https://www.youtube.com/watch?v=3STTSi_jdHk) | Nuffield Health | 200, same title and channel |
| arm_swings | [Arm swings side to side](https://www.youtube.com/watch?v=p7EnbCprr5w) | NHS inform | 200, same title and channel |
| cat_cow | [How to Do a Cat Cow Stretch: A Guide from Physical Therapists](https://www.youtube.com/watch?v=1Y0YjXS9sKI) | Hinge Health | 200, same title and channel |
| bodyweight_squats | [Bodyweight Squat Tutorial - Proper Form and Technique](https://www.youtube.com/watch?v=P-yaD24bUE8) | Runna | 200, same title and channel |
| glute_bridges | [How to do a Glute bridge](https://www.youtube.com/watch?v=SKOMwg1JLrU) | National Academy of Sports Medicine (NASM) | 200, same title and channel |
| hip_hinge | [How to Do a Hip Hinge: A Guide from Physical Therapists](https://www.youtube.com/watch?v=2W_gXhut5S8) | Hinge Health | 200, same title and channel |
| pushups_bench | [Incline Push Ups // Learn to Push Up for Beginners!](https://www.youtube.com/watch?v=49jfZ_z7-us) | Tom Morrison | 200, same title and channel |
| uphill_walk | [How To Use The Treadmill](https://www.youtube.com/watch?v=HxsFneJFM2c) | PureGym | 200, same title and channel |
