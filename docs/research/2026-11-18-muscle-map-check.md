# Muscle map check (2026-11-18)

An independent check of the muscle data behind the body maps. Read-only for app code: nothing under `app/` or `tests/` was changed.

Checked against: `app/js/plan/muscles.js` (MUSCLES, `exerciseMuscles`, `partMuscle`), `app/js/plan/plan-v2.js` (`exercises`, `days`), `app/js/ui/bodymap.js`, `app/js/engine/planpage.js` (`exerciseLevels`, `setsByMuscle`) and `app/vendor/body-muscles/shapes.js`, as they were on 2026-11-18 (commit 1819097).

Words used here:
- **Main**: the muscle does most of the work. It counts 1 per set and shows strong on the map.
- **Helper**: the muscle does real work, but less. It counts ½ per set and shows light on the map.
- **Stabiliser**: the muscle only holds still to keep the body steady. It should not be a helper.
- **EMG**: a study that measures how hard a muscle works, with sensors on the skin.

No body data is in this file.

---

## 1. Summary

- **Exercises checked:** 39 (29 in the plan's days, 10 swap-only). Every exercise in `exercises` was checked.
- **OK as they are:** 24.
- **Need a change:** 15 (the exact new lists are in section 2 and in the list at the end of this section).
- **Body drawing:** 18 groups checked. 15 light the right place. 1 is wrong in a way you can see (front shoulders). 2 are small or too long (rear shoulders, lower back).

Top problems, one line each:

1. **Calves are listed as helpers where the ankle does not move** (leg press, hip thrust, glute bridge). No source supports it. Remove.
2. **Hamstrings are listed as helpers of squats and the leg press.** They only steady the leg there. A training study found no hamstring growth from squats. Remove.
3. **Inner thighs (adductors) are missing from squats and the leg press.** Both sources and a training study say they work hard. Add as helper.
4. **Rows have the mid back as the only main muscle.** Both sources say the lats are main too. Make lats and mid back both main.
5. **The front shoulders light only a thin strip on the front body map.** The big shoulder shape on the front view belongs to "side shoulders". So a shoulder press looks weaker on the map than a lateral raise. This is a drawing-map problem, not a data problem.
6. **Hammer curl and cable curl miss forearms** as a helper (the dumbbell curl already has it).
7. **Side plank lists side shoulders as a helper.** The shoulder only holds still. The side glute muscle (gluteus medius) works hard instead.
8. **Cable lateral raise lists mid back and traps.** No source supports mid back. Remove both, to match the dumbbell lateral raise.
9. **Rear-delt raise misses the mid back** (the muscles that pull the shoulder blades together). The face pull already has it.
10. **Shoulder presses miss side shoulders** as a helper (medium confidence).

The 15 exact data fixes (our group ids):

| Exercise id | main | helpers |
|---|---|---|
| leg_press | [quads] | [glutes, adductors] |
| goblet_squat | [quads] | [glutes, adductors, calves] |
| smith_squat | [quads] | [glutes, adductors, calves, lower_back] |
| hip_thrust | [glutes] | [hamstrings] |
| db_glute_bridge | [glutes] | [hamstrings] |
| one_arm_db_row | [lats, mid_back] | [biceps, rear_delts] |
| seated_cable_row | [lats, mid_back] | [biceps, rear_delts] |
| seated_row_machine | [lats, mid_back] | [biceps, rear_delts] |
| hammer_curl | [biceps] | [forearms] |
| cable_curl | [biceps] | [forearms] |
| side_plank | [abs] | [glutes] |
| cable_lateral_raise | [side_delts] | [] |
| rear_delt_raise | [rear_delts] | [mid_back] |
| shoulder_press_machine | [front_delts] | [triceps, side_delts] |
| seated_db_shoulder_press | [front_delts] | [triceps, side_delts] |

⚠️ **Each of these differs from free-exercise-db.** `tests/muscles.test.mjs` (the test "every exercise matches free-exercise-db, or marks its own reading with a reason") needs an `own: { reason }` of 20 or more characters on each changed exercise. The reasons can be copied from the verdict column in section 2.

⚠️ **The weekly muscle counts will change.** Lats get more direct sets (rows now count). Calves and hamstrings lose some helper half-sets. Inner thighs gain some. Rosario should know that the numbers on the plan page will move.

---

## 2. Exercise by exercise

How sources were picked:
- **Source 1:** the StrengthLog exercise directory for every exercise where it has one. StrengthLog lists "primary" and "secondary" muscles. It does not copy free-exercise-db.
- **Source 2:** a different source for each exercise: a Wikipedia exercise page (with its citations), the NASM or ACE exercise library, a Catalyst Athletics page, or a peer-reviewed study (abstract read through Europe PMC).
- ExRx.net could not be opened (see section 4).

"Prim." means primary. "Sec." means secondary. Sources were read on 2026-11-18.

### Exercises in the plan's days

| # | Exercise (id) | Ours: main / helpers | Source 1 | Source 2 | Verdict | Exact fix |
|---|---|---|---|---|---|---|
| 1 | Chest press (chest_press) | chest / front_delts, triceps | [StrengthLog](https://www.strengthlog.com/machine-chest-press/): prim. chest, front delt; sec. triceps | [Wikipedia Bench press](https://en.wikipedia.org/wiki/Bench_press): prime movers pec major, front delts, triceps | OK | none |
| 2 | Pulldown (pulldown) | lats / biceps, mid_back, rear_delts | [StrengthLog](https://www.strengthlog.com/lat-pulldown-with-pronated-grip/): prim. lats; sec. biceps, rear delts, forearm flexors, rotator cuff | [Wikipedia Pulldown](https://en.wikipedia.org/wiki/Pulldown_exercise): lats; helped by lower traps, rhomboids, rear delts, elbow flexors. [Lusk 2010 EMG](https://europepmc.org/article/MED/20543740) measured lats, mid traps, biceps | OK | none |
| 3 | Shoulder press, machine (shoulder_press_machine) | front_delts / triceps | [StrengthLog](https://www.strengthlog.com/machine-shoulder-press/): prim. front delt; sec. triceps, **lateral delt** | [Saeterbakken 2013 EMG](https://europepmc.org/article/MED/23096062): measured front, side and rear delts and triceps in presses; side delt clearly active. [Wikipedia Overhead press](https://en.wikipedia.org/wiki/Overhead_press) names only the front delt | Helper missing (medium confidence) | main [front_delts], helpers [triceps, side_delts] |
| 4 | One-arm dumbbell row (one_arm_db_row) | mid_back / biceps, lats, rear_delts | [StrengthLog](https://www.strengthlog.com/dumbbell-row/): prim. **lats**, trapezius, rear delts; sec. biceps, forearm flexors | [Wikipedia Bent-over row](https://en.wikipedia.org/wiki/Bent-over_row): lats "best targeted with the elbow close to the torso" (as in this row) | Main wrong: lats should be main too | main [lats, mid_back], helpers [biceps, rear_delts] |
| 5 | Dumbbell curl (db_curl) | biceps / forearms | [StrengthLog](https://www.strengthlog.com/dumbbell-curl/): prim. biceps; sec. forearm flexors | [Wikipedia Biceps curl](https://en.wikipedia.org/wiki/Biceps_curl): biceps, brachialis, brachioradialis (a forearm muscle) | OK | none |
| 6 | Triceps pushdown (triceps_pushdown) | triceps / none | [StrengthLog](https://www.strengthlog.com/tricep-pushdown-with-bar/): prim. triceps; no sec. | [Wikipedia Pushdown](https://en.wikipedia.org/wiki/Pushdown_(exercise)): triceps | OK | none |
| 7 | Plank (plank) | abs / none | [StrengthLog](https://www.strengthlog.com/plank/): prim. abs; sec. obliques (part of our "abs") | [Wikipedia Plank](https://en.wikipedia.org/wiki/Plank_(exercise)): abs muscles main; shoulders, glutes, thighs only steady the body | OK | none |
| 8 | Dead bug (dead_bug) | abs / none | [StrengthLog](https://www.strengthlog.com/dead-bugs/): prim. abs; sec. obliques | [NASM](https://www.nasm.org/resource-center/exercise-library/dead-bug): prim. rectus and transverse abdominis; sec. obliques | OK | none |
| 9 | Leg press (leg_press) | quads / calves, glutes, hamstrings | [StrengthLog](https://www.strengthlog.com/leg-press/): prim. quads, glutes, **adductors**; sec. hamstrings. No calves | [Escamilla 2001 EMG](https://europepmc.org/article/MED/11528346): the squat works the hamstrings more than the leg press. [Kubo 2019 training study](https://europepmc.org/article/MED/31230110): squats grew quads, adductors, glutes; hamstrings "did not change". [Wikipedia Leg press](https://en.wikipedia.org/wiki/Leg_press): calves only "partially" | Helper extra: calves (the ankle does not move), hamstrings (only steady). Helper missing: adductors | main [quads], helpers [glutes, adductors] |
| 10 | Cable crunch (cable_crunch) | abs / none | [StrengthLog](https://www.strengthlog.com/cable-crunch/): prim. abs; sec. obliques | [Wikipedia Crunch](https://en.wikipedia.org/wiki/Crunch_(exercise)): rectus abdominis | OK | none |
| 11 | Romanian deadlift (romanian_deadlift) | hamstrings / glutes, lower_back | [StrengthLog](https://www.strengthlog.com/romanian-deadlift/): prim. glutes, lower back, hamstrings; sec. adductors, traps, forearm flexors | [McAllister 2014 EMG](https://europepmc.org/article/MED/24149748): hamstring work highest in the RDL. [Wikipedia RDL](https://en.wikipedia.org/wiki/Romanian_deadlift): hamstrings and glutes | OK | none (adductors: see "could add" below) |
| 12 | Face pull (face_pull) | rear_delts / mid_back | [StrengthLog](https://www.strengthlog.com/face-pull/): prim. rear delt, rotator cuff; sec. trapezius, lateral delt | [NASM](https://www.nasm.org/resource-center/exercise-library/face-pull): prim. rear delt, rhomboids; sec. middle trapezius, infraspinatus, biceps | OK | none (side delts: see "could add") |
| 13 | Hip thrust (hip_thrust) | glutes / calves, hamstrings | [StrengthLog](https://www.strengthlog.com/hip-thrust-machine/): prim. glutes; sec. adductors, quads. No calves | [Contreras 2015 EMG](https://europepmc.org/article/MED/26214739): glutes and biceps femoris (a hamstring) work more than in a squat. Calves not part of the move | Helper extra: calves (the ankle does not move) | main [glutes], helpers [hamstrings] |
| 14 | Leg extension (leg_extension) | quads / none | [StrengthLog](https://www.strengthlog.com/leg-extension/): prim. quads only | [Wikipedia Leg extension](https://en.wikipedia.org/wiki/Leg_extension): quadriceps, isolation | OK | none |
| 15 | Goblet squat (goblet_squat) | quads / calves, glutes, hamstrings, front_delts | [StrengthLog](https://www.strengthlog.com/goblet-squat/): prim. quads, glutes, **adductors**; sec. lower back, calves. No hamstrings, no shoulders | [Wikipedia Squat](https://en.wikipedia.org/wiki/Squat_(exercise)): prime movers quads, glute max, adductor magnus (+ soleus); hamstrings and gastrocnemius only steady. [Kubo 2019](https://europepmc.org/article/MED/31230110): no hamstring growth | Helper extra: front_delts (only hold the dumbbell still), hamstrings (only steady). Helper missing: adductors | main [quads], helpers [glutes, adductors, calves] |
| 16 | Dumbbell bench press (db_bench_press) | chest / front_delts, triceps | [StrengthLog](https://www.strengthlog.com/dumbbell-chest-press/): prim. chest, front delt; sec. triceps | [Wikipedia Bench press](https://en.wikipedia.org/wiki/Bench_press): pec major, front delts, triceps | OK | none |
| 17 | Lateral raise (lateral_raise) | side_delts / none | [StrengthLog](https://www.strengthlog.com/dumbbell-lateral-raise/): prim. lateral delt; sec. front delt | [Wikipedia Lateral raise](https://en.wikipedia.org/wiki/Lateral_raise): mainly the middle delt; front and rear delts co-contract | OK | none (front delts or traps: see "could add") |
| 18 | Hammer curl (hammer_curl) | biceps / none | [StrengthLog](https://www.strengthlog.com/hammer-curl/): prim. biceps; sec. **forearm flexors** | [Catalyst Athletics](https://catalystathletics.com/exercise/841/Hammer-Curl): "an exercise for the forearms and biceps" | Helper missing: forearms (the thumb-up grip works the brachioradialis, a forearm muscle) | main [biceps], helpers [forearms] |
| 19 | Overhead triceps extension (overhead_triceps_ext) | triceps / none | [StrengthLog](https://www.strengthlog.com/overhead-cable-triceps-extension/): prim. triceps; no sec. | [Catalyst Athletics](https://catalystathletics.com/exercise/817/Cable-Overhead-Tricep-Extension): all three triceps heads | OK | none |
| 20 | Side plank (side_plank) | abs / side_delts | [StrengthLog](https://www.strengthlog.com/side-plank/): prim. obliques; sec. abs (both in our "abs"). No shoulders | [Wikipedia Plank](https://en.wikipedia.org/wiki/Plank_(exercise)): side plank prim. obliques, transverse abdominis, **gluteus medius and minimus**; no shoulder. [Youdas 2014 EMG](https://europepmc.org/article/MED/25177418): gluteus medius over 69% of max in side-bridge moves | Helper extra: side_delts (the shoulder only holds still). Helper missing: glutes (gluteus medius) | main [abs], helpers [glutes] |
| 21 | Incline dumbbell press (incline_db_press) | chest / front_delts, triceps | [StrengthLog](https://www.strengthlog.com/dumbbell-incline-press/): prim. chest, front delt; sec. triceps | [Rodríguez-Ridao 2020 EMG](https://europepmc.org/article/MED/33049982): at 30 degrees, upper chest highest; front delt rises with the angle; triceps the same at all angles | OK | none |
| 22 | Seated cable row (seated_cable_row) | mid_back / biceps, lats, rear_delts | [StrengthLog](https://www.strengthlog.com/cable-close-grip-seated-row/): prim. **lats**, trapezius, rear delts; sec. biceps, forearm flexors | [Lehman 2004 EMG](https://europepmc.org/article/MED/15228624): the seated row has one of the highest lat-to-biceps ratios and the highest mid trap / rhomboid work | Main wrong: lats should be main too | main [lats, mid_back], helpers [biceps, rear_delts] |
| 23 | Seated dumbbell shoulder press (seated_db_shoulder_press) | front_delts / triceps | [StrengthLog](https://www.strengthlog.com/seated-dumbbell-shoulder-press/): prim. front delt; sec. triceps, **lateral delt** | [Saeterbakken 2013 EMG](https://europepmc.org/article/MED/23096062): side delt active in seated and standing dumbbell presses | Helper missing (medium confidence) | main [front_delts], helpers [triceps, side_delts] |
| 24 | Smith machine squat (smith_squat) | quads / calves, glutes, hamstrings, lower_back | [StrengthLog](https://www.strengthlog.com/smith-machine-squat/): prim. quads, glutes, **adductors**, lower back; sec. calves. No hamstrings | [Wikipedia Squat](https://en.wikipedia.org/wiki/Squat_(exercise)): adductor magnus a prime mover; hamstrings only steady. [Kubo 2019](https://europepmc.org/article/MED/31230110): no hamstring growth | Helper extra: hamstrings. Helper missing: adductors | main [quads], helpers [glutes, adductors, calves, lower_back] |
| 25 | Reverse crunch (reverse_crunch) | abs / none | [ACE library](https://acefitness.org/exerciselibrary/76): target abs (hip flexors also named; not one of our groups) | [Catalyst Athletics](https://catalystathletics.com/exercise/320/Reverse-Crunch/): abdominals | OK | none |
| 26 | Cable pull-through (cable_pull_through) | glutes / hamstrings, lower_back | [StrengthLog](https://www.strengthlog.com/cable-pull-through/): prim. glutes; sec. lower back, hamstrings, adductors | [IJES 2023 EMG](https://europepmc.org/article/MED/37113509): compared with the RDL, the pull-through works hamstrings a little less (about 7 to 13 percent) and the lower back a little less (11 percent); glutes not different | OK (see note) | none |
| 27 | Standing calf raise (calf_raise_standing) | calves / none | [StrengthLog](https://www.strengthlog.com/standing-calf-raise/): prim. calves | [Wikipedia Calf raises](https://en.wikipedia.org/wiki/Calf_raises): gastrocnemius and soleus | OK | none |
| 28 | Dumbbell lying leg curl (db_lying_leg_curl) | hamstrings / none | [StrengthLog](https://www.strengthlog.com/lying-leg-curl/): prim. hamstrings | [Wikipedia Leg curl](https://en.wikipedia.org/wiki/Leg_curl): hamstrings, isolation | OK | none |
| 29 | Calf raise on the leg press (calf_raise_leg_press) | calves / none | [StrengthLog](https://www.strengthlog.com/calf-raise-in-leg-press/): prim. calves | [Wikipedia Calf raises](https://en.wikipedia.org/wiki/Calf_raises): leg press = a straight-knee calf raise | OK | none |

### Swap-only exercises

| # | Exercise (id) | Ours: main / helpers | Source 1 | Source 2 | Verdict | Exact fix |
|---|---|---|---|---|---|---|
| 30 | Cable curl (cable_curl) | biceps / none | [StrengthLog](https://www.strengthlog.com/cable-curl-with-bar/): prim. biceps; sec. **forearm flexors** | [Wikipedia Biceps curl](https://en.wikipedia.org/wiki/Biceps_curl): biceps, brachialis, brachioradialis | Helper missing: forearms (same as the dumbbell curl) | main [biceps], helpers [forearms] |
| 31 | Cable lateral raise (cable_lateral_raise) | side_delts / mid_back, traps | [StrengthLog](https://www.strengthlog.com/cable-lateral-raise/): prim. lateral delt; sec. front delt. No mid back, no traps | [Wikipedia Lateral raise](https://en.wikipedia.org/wiki/Lateral_raise): middle delt; upper traps only when the reps are jerky | Helper extra: mid_back, traps (and it should match the dumbbell lateral raise) | main [side_delts], helpers [] |
| 32 | Dumbbell rear-delt raise (rear_delt_raise) | rear_delts / none | [StrengthLog](https://www.strengthlog.com/reverse-dumbbell-flyes/): prim. rear delt, rotator cuff; sec. trapezius | [Wikipedia Lateral raise, reverse fly part](https://en.wikipedia.org/wiki/Lateral_raise): rhomboids and trapezius pull the shoulder blades together. [Ekstrom 2003 EMG](https://europepmc.org/article/MED/12774999): middle trapezius among the highest in this move | Helper missing: mid_back | main [rear_delts], helpers [mid_back] |
| 33 | Dumbbell glute bridge (db_glute_bridge) | glutes / calves, hamstrings | [StrengthLog](https://www.strengthlog.com/glute-bridge/): prim. glutes; sec. quads. No calves | [NASM Floor bridge](https://www.nasm.org/resource-center/exercise-library/floor-bridge): prim. glutes (erector spinae steady); sec. hamstrings, adductors. No calves | Helper extra: calves | main [glutes], helpers [hamstrings] |
| 34 | Lat pulldown machine (lat_pulldown_machine) | lats / biceps, mid_back, rear_delts | [StrengthLog](https://www.strengthlog.com/machine-lat-pulldown/): prim. lats; sec. biceps, rear delts, forearm flexors, rotator cuff | [Wikipedia Pulldown](https://en.wikipedia.org/wiki/Pulldown_exercise): lats; helped by rhomboids, lower traps, rear delts, elbow flexors | OK | none |
| 35 | Seated row machine (seated_row_machine) | lats / biceps, mid_back | [StrengthLog](https://www.strengthlog.com/seated-machine-row/): prim. lats, **trapezius, rear delts**; sec. biceps, forearm flexors | [Lehman 2004 EMG](https://europepmc.org/article/MED/15228624): seated row gives the highest mid trap / rhomboid work | Main wrong: mid_back should be main too. Helper missing: rear_delts (and it should match the other rows) | main [lats, mid_back], helpers [biceps, rear_delts] |
| 36 | Leg curl machine (leg_curl_machine) | hamstrings / none | [StrengthLog](https://www.strengthlog.com/seated-leg-curl/): prim. hamstrings | [Wikipedia Leg curl](https://en.wikipedia.org/wiki/Leg_curl): hamstrings | OK | none |
| 37 | Calf raise machine (calf_raise_machine) | calves / none | [StrengthLog](https://www.strengthlog.com/standing-calf-raise/): prim. calves | [Wikipedia Calf raises](https://en.wikipedia.org/wiki/Calf_raises): gastrocnemius and soleus | OK | none |
| 38 | One-leg dumbbell calf raise (one_leg_db_calf_raise) | calves / none | [Hevy](https://www.hevyapp.com/exercises/how-to-single-leg-standing-calf-raise-dumbbell/): prim. gastrocnemius and soleus; others only hold still | [Wikipedia Calf raises](https://en.wikipedia.org/wiki/Calf_raises): standing raises work gastrocnemius and soleus | OK | none |
| 39 | Standing cable leg curl (cable_leg_curl) | hamstrings / none | [StrengthLog](https://www.strengthlog.com/standing-leg-curl/): prim. hamstrings | [Wikipedia Leg curl](https://en.wikipedia.org/wiki/Leg_curl): hamstrings | OK | none |

### Could add, but not needed (judgement calls, not in the fix list)

These have some support, but the extra work is small or the sources disagree. Leave them unless Rosario wants more detail.

- **Lateral raises (both):** StrengthLog names the front delt as secondary. One EMG study ([Andersen 2008](https://europepmc.org/article/MED/18339796)) found trapezius work near maximum in lateral raises. StrengthLog and Wikipedia do not count the traps. Front shoulders already get plenty of work from presses.
- **Face pull:** StrengthLog (secondary) and Hevy ([hevyapp.com face pull](https://www.hevyapp.com/exercises/face-pull/)) name the side delt. NASM does not.
- **Romanian deadlift:** StrengthLog names adductors as secondary.
- **Hip thrust and glute bridge:** StrengthLog names quads (and adductors for the hip thrust) as secondary. Contreras 2015 found the quads working as hard as in a squat in the hip thrust, but holding still, not moving.
- **Cable pull-through:** the 2023 EMG study found the hamstrings work almost as hard as in the RDL. Hamstrings could be a second main muscle. StrengthLog keeps them secondary, so this check keeps ours. Note: `plan-v2.js` calls this exercise `muscle: "hamstrings"`, but the data says the glutes are the main muscle. The two disagree in words only.
- **Calves in squats:** StrengthLog (secondary) and Wikipedia (soleus) both name them, so the fix list keeps them. This is generous: the calves do little work in a squat.
- **Goblet squat:** StrengthLog names lower back as secondary.
- **Leg curls:** the gastrocnemius (calf) also bends the knee ([JSCR 2021 prone leg curl EMG, PMID 31469769](https://europepmc.org/article/MED/31469769)). Sources do not count it as a helper.

---

## 3. Body drawing: does each group light the right place?

How this was checked: every part id in `shapes.js` was matched with `partMuscle`. Each part's position was measured from its path. The two views were drawn with one colour per group on a test page (a scratch copy served on this PC only, not the app) and looked at. The part names were compared with the source library's own names (vulovix/body-muscles, `src/data/muscles.front.ts` and `muscles.back.ts`, same commit as ours).

| Group | Drawn parts | Where it shows | Verdict |
|---|---|---|---|
| chest | chest-upper-*, chest-lower-* | Front, upper and lower chest | OK |
| front_delts | shoulder-front-* | Front, a **thin strip on top of the shoulder, next to the neck** | ⚠️ **Region weak.** The big shoulder shape on the front view is `shoulder-side-*`, which goes to side_delts. So a shoulder press or chest press lights a thin strip, and a lateral raise lights the whole front shoulder. The source calls the strip "Shoulder (Front)", but it sits where the upper traps show from the front. Fix idea (code, not data): let the front shoulder cap (`shoulder-side-*`) show the higher of front_delts and side_delts. |
| side_delts | shoulder-side-* | Front, the whole shoulder cap | OK, but it also has to stand in for the front shoulder (see above) |
| rear_delts | deltoid-rear-* | Back, a small piece at the outer edge of the shoulder | Right place, but small. Most of the back of the shoulder is drawn as `lats-upper-*`, so a face pull lights only a small piece. Source drawing limit; no fix needed. |
| biceps | biceps-* | Front, upper arm | OK |
| triceps | triceps-long-*, triceps-lateral-* | Back, upper arm | OK |
| forearms | forearm-* (front), forearm-flexors-*, forearm-extensors-* (back) | Both views, lower arm | OK |
| abs | abs-upper-*, abs-lower-*, obliques-* | Front, belly and sides | OK |
| lats | lats-upper-*, lats-mid-*, lats-lower-* | Back, wide area from armpit to waist | OK. The upper piece also covers the shoulder-blade area. Source drawing limit. |
| mid_back | traps-mid-*, traps-lower-* | Back, the triangle between the shoulder blades | OK |
| traps | traps-upper-* | Back, top of the back next to the neck | OK |
| lower_back | lower-back-erectors-*, lower-back-ql-*, spine | Back, low back band **plus a stripe up the middle of the whole back** | Minor. The `spine` part runs from the neck to the belt. So "lower back" also lights a stripe up to the neck. The back muscles do run that long, so it is not wrong. Fix idea: leave `spine` as plain body. |
| glutes | gluteus-maximus-*, gluteus-medius-* | Back, buttocks and upper side of the hip | OK (and right for the side plank fix: gluteus medius is drawn) |
| quads | quads-* | Front thigh | OK |
| hamstrings | hamstrings-medial-*, hamstrings-lateral-* | Back thigh | OK |
| calves | calves-gastroc-medial-*, calves-gastroc-lateral-*, calves-soleus-* | **Back, lower leg** | OK. The front shin (`tibialis-anterior-*`) is plain body, which is right: it is not a calf muscle. |
| adductors | adductors-* | Front, inner thigh | OK |
| neck | neck-* (front), nape (back) | Both views | OK |

Parts drawn as plain body: head, face, hands, feet, knees, elbows, shins, hip flexors, serratus. None of our 18 groups is left without a drawn part.

`MUSCLES[...].view` (which side the small card map shows) matches where each group is drawn. With the row fix, rows still show the back view (lats and mid back are both back groups).

---

## 4. Not checked, and sources that could not be opened

Sources that could not be opened (reported, not guessed around):
- **ExRx.net:** HTTP 403 (refused) on the first page. Not retried with tricks.
- **MuscleWiki:** HTTP 403.
- **Muscle & Strength:** HTTP 403.
- **Fitbod:** HTTP 403.
- **PubMed and PMC pages:** they showed a cookie or "are you a robot" page. The study abstracts were read through the Europe PMC public API instead. The links in this file go to Europe PMC.
- **The Contreras 2016 PDF** (bretcontreras.com) could not be read as text. The 2015 abstract was used instead.
- **ACE exercise library:** opened, but it names body parts only ("Chest", "Abs"), not muscles. Used only for the reverse crunch.
- **Hevy and NASM:** several guessed page addresses gave 404 (not found). Only the pages linked above were read.
- **StrengthLog** has no page for the reverse crunch or the one-leg dumbbell calf raise. ACE and Hevy were used for those.

Not checked:
- ⚠️ **Full texts of the studies.** Only abstracts were read. The numbers quoted come from the abstracts.
- ⚠️ **The real app screen.** The drawing check used a scratch test page with the same shapes and the same `partMuscle`, not the app's own body map, and only in light colours.
- ⚠️ **Whether the fixes pass the tests.** No code was changed. The fixes need `own: { reason }` marks, and the muscle test that lists shoulder helpers for pulls (rows and pulldowns = rear) should still pass, because the row fixes keep rear_delts.
- **The weekly count numbers** after the fixes were not recalculated.
- **Sources disagree in places.** StrengthLog lists more "primary" muscles than most (for example front delt as primary in chest presses, glutes as primary in squats). This check kept our main lists where a helper is the more common reading.
