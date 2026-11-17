# Media sources and licences (redesign C)

Checked 2026-11-17.

## Exercise photos
- Source: free-exercise-db, https://github.com/yuhonas/free-exercise-db (licence: Unlicense, public domain; checked with the GitHub licence API).
- Saved unchanged at `app/media/exercises/<id>/0.jpg` and `1.jpg` (start and end photo). 43 entries, 86 photos, 5.2 MB.
- The mapping (our id -> library entry, same or close move) is in `app/js/plan/media.js`. `hip_hinge` has no library photo: an original SVG drawing is planned.

## Videos (plain links, open in Safari)
Each link answered HTTP 200 and its title and channel were read through YouTube's oEmbed service.

| Exercise | Channel | Title | Link |
|---|---|---|---|
| chest_press | PureGym | How To Use The Chest Press Machine | https://www.youtube.com/watch?v=sqNwDkUU_Ps |
| pulldown | PureGym | How To Do Kneeling Lat Pulldowns | https://www.youtube.com/watch?v=VIJPZ8m0EDM |
| shoulder_press_machine | PureGym | How To Use The Shoulder Press Machine | https://www.youtube.com/watch?v=TnhIyp4kmO8 |
| one_arm_db_row | PureGym | How To Do Single Arm Dumbbell Rows | https://www.youtube.com/watch?v=ZRSGpBUVcNw |
| db_curl | PureGym | How To Double Arm Curl (Dumbbell Bicep Curl) | https://www.youtube.com/watch?v=MtXdEcW3Eog |
| triceps_pushdown | PureGym | How To Do A Tricep Pushdown | https://www.youtube.com/watch?v=LXkCrxn3caQ |
| plank | PureGym | How To Do A Plank | https://www.youtube.com/watch?v=q4rDeHYMcIg |
| dead_bug | PureGym | Deadbug Demo: How To Do Deadbugs & Form Tips | https://www.youtube.com/watch?v=ZSYRZKYOf28 |
| leg_press | PureGym | How To Use The Leg Press Machine | https://www.youtube.com/watch?v=p5dCqF7wWUw |
| cable_crunch | Testosterone Nation | Cable Crunch: Do It Right! | https://www.youtube.com/watch?v=ToJeyhydUxU |
| romanian_deadlift | PureGym | Leg exercise - How To Do A Romanian Deadlift | https://www.youtube.com/watch?v=zU-f6DMCdAI |
| face_pull | PureGym | How To Do Cable Face Pulls | https://www.youtube.com/watch?v=0Po47vvj9g4 |
| hip_thrust | PureGym | How To Do A Barbell Hip Thrust | https://www.youtube.com/watch?v=aweBS7K71l8 |
| leg_extension | PureGym | How To Do A Leg Extension | https://www.youtube.com/watch?v=4ZDm5EbiFI8 |
| goblet_squat | PureGym | How To Do A Goblet squat | https://www.youtube.com/watch?v=zBV3ceGyAxw |
| db_bench_press | PureGym | How To Do A Dumbbell Bench Press | https://www.youtube.com/watch?v=AduT4Eq-iP0 |
| lateral_raise | PureGym | How To Do Lateral Raises | https://www.youtube.com/watch?v=z-kOn7flIZg |
| hammer_curl | PureGym | How To Do Hammer Curls | https://www.youtube.com/watch?v=B4RznoFvTl4 |
| overhead_triceps_ext | PureGym | How To Do An Overhead Tricep Extension | https://www.youtube.com/watch?v=9wxRhONFsRA |
| side_plank | PureGym | How To Do A Side Plank | https://www.youtube.com/watch?v=Oe9Tp9SvTCE |
| incline_db_press | PureGym | How To Do A Dumbbell Incline Press | https://www.youtube.com/watch?v=oZVCBM9f8Eo |
| seated_cable_row | PureGym | How To Do A Seated Cable Row | https://www.youtube.com/watch?v=lJoozxC0Rns |
| seated_db_shoulder_press | PureGym | How To Do A Seated Shoulder Press | https://www.youtube.com/watch?v=TsduLWuhlFM |
| smith_squat | ScottHermanFitness | How To: Smith Machine- Squat | https://www.youtube.com/watch?v=AHnX-aimA4E |
| reverse_crunch | PureGym | How To Do A Reverse Crunch | https://www.youtube.com/watch?v=XY8KzdDcMFg |
| cable_pull_through | Renaissance Periodization | Cable Pull Through | https://www.youtube.com/watch?v=pv8e6OSyETE |
| calf_raise_standing | PureGym | How To Do Calf Raises | https://www.youtube.com/watch?v=Zep-wKHWkNM |
| cable_curl | PureGym | How To Do A Cable Curl | https://www.youtube.com/watch?v=GNlopToAZyg |
| cable_lateral_raise | PureGym | How To Do Cable Lateral Raises | https://www.youtube.com/watch?v=Z5FA9aq3L6A |
| rear_delt_raise | PureGym | How To Do A Rear Delt Fly | https://www.youtube.com/watch?v=nlkF7_2O_Lw |
| db_glute_bridge | PureGym | How To Do A Glute Bridge With A Dumbbell | https://www.youtube.com/watch?v=cruqsnAyU6A |
| calf_raise_leg_press | PureGym | How To Do Calf Raises On The Leg Press | https://www.youtube.com/watch?v=dhRz1Ns60Zg |
| lat_pulldown_machine | PureGym | How To Do A Lat Pulldown | https://www.youtube.com/watch?v=JGeRYIZdojU |
| seated_row_machine | PureGym | How To Use The Seated Row Machine | https://www.youtube.com/watch?v=TeFo51Q_Nsc |
| leg_curl_machine | PureGym | How To Use The Prone Leg Curl Machine | https://www.youtube.com/watch?v=QjNFk4F5dAs |
| calf_raise_machine | PureGym | How To Do Calf Raises | https://www.youtube.com/watch?v=Zep-wKHWkNM |
| uphill_walk | PureGym | How To Use The Treadmill | https://www.youtube.com/watch?v=HxsFneJFM2c |
| arm_circles | Sworkit | Arm Circles Exercise | https://www.youtube.com/watch?v=UVMEnIaY8aU |
| arm_swings | PhysiHub Library | Arm Swings (lateral) | https://www.youtube.com/watch?v=BHmBWVRDbXw |
| cat_cow | PureGym | How To Do Cat Cow Stretch | https://www.youtube.com/watch?v=CE_5RWjFA3Q |
| bodyweight_squats | PureGym | Leg exercise - How to bodyweight squat | https://www.youtube.com/watch?v=l83R5PblSMA |
| glute_bridges | PureGym | How To Do A Glute Bridge | https://www.youtube.com/watch?v=tqp5XQPpTxY |
| hip_hinge | Cambridge University Sport | Bodyweight Hip Hinge | https://www.youtube.com/watch?v=3znqI4AXmn0 |
| pushups_bench | PureGym | How To Do An Incline Push Up | https://www.youtube.com/watch?v=yAbg3_pJKvw |

Mostly PureGym (a UK gym chain: short official how-to clips). Others: ScottHermanFitness, Renaissance Periodization, Testosterone Nation, Sworkit, PhysiHub Library, Cambridge University Sport.

## Machines
Machine cards reuse the exercise photos (no extra files). Sign names are typical names, not checked at the gym yet.
