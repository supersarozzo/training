# Plan review proposal: fewer abs sets, more calves and back of the thighs

Date: 2026-11-17. Worker 8.32 (Opus), for chat 8 · Training Agent. Asked for by Rosario's answer 74 b.
**Status: proposal only. Nothing in the plan or the app changes until Rosario approves.**
Applies to: [plan v2](2026-11-16-training-plan-v2.md) (data: `app/js/plan/plan-v2.js`). Based on the set count in [research section 5](../research/2026-11-17-plan-diet-research.md).

> No body data in this file. Not medical advice: stop and get help for chest pain, dizziness, trouble breathing or sharp pain.

**Words.** *Set*: one round of an exercise. *Weekly sets*: hard sets a muscle gets in a week. *Back of the thighs*: the hamstrings. *Knee-bend move*: an exercise where the knee bends against a weight, like a leg curl (the heel curls toward the bottom). *Hip-hinge move*: you bend at the hips with the knees almost still, like the Romanian deadlift. *Calves*: the muscles at the back of the lower leg. *D*: the plan's name for an exercise "on its own, in the abs slot" at the end of the session. *RIR*: reps left in the tank when you stop. *Q17*: a machine not confirmed yet; the first gym visit checks it (open question 17).

## 1. In one paragraph

Today the plan gives abs about 27 sets a week, but calves only 3 (Friday only) and the back of the thighs only 3 direct sets (Romanian deadlift, Tuesday only, no knee-bend move). This proposal changes **only the abs slot at the end of Monday, Wednesday and Thursday**. On those days the first abs exercise drops from 3 sets to 2 and the second abs exercise goes. In its place: **calf raises on the leg press on Monday and Wednesday** (3 sets each), and **a leg curl on Thursday** (3 sets). Tuesday, Friday, the walk, the pairs, the 12-week rhythm and the short day rule stay as they are. Calves go from 3 to 9 sets a week, the back of the thighs from 3 to 6 direct sets on 2 days, and abs from 27 to 17 (still well above the usual 10). Monday and Wednesday get about 1 to 2 minutes longer; Thursday stays about the same.

```
 Mon  Tue  Wed  Thu  Fri
 calf  .   calf curl calf   <- after
  .    .    .    .   calf   <- before
 (calf = calves, curl = leg curl,
  Tue and Fri do not change)
```

## 2. What was read (step 1)

- **Plan v2** (sections 2 to 10) and its data file `app/js/plan/plan-v2.js` (slots, `setsFor()` week rules, `sessionMinutes`).
- **Research section 5** (set counts per muscle, from free-exercise-db muscle lists).
- **DECISIONS.md.** Rows this proposal respects: walk before weights, never reopened (2026-11-16, Rosario's 35 b); session about 90 minutes (question 13); muscle focus balanced (29 a); "calves last, none on Tuesday, leg exercises paired with abs or light upper work" (plan worker's choice, Rosario may change it); weeks 7 to 11 the D exercise drops to 2 sets; Plan edits are permanent (65). Exercises to avoid: none (intake 37 a, a training choice, not body data).
- **Gym equipment notes** ([2026-11-16-gym-equipment.md](../research/2026-11-16-gym-equipment.md)) and the gym's page again today: leg presses 2, leg extensions 3, chest and shoulder presses, 5 cable stations, 1 Smith station, dumbbells 2 to 50 kg, 22 benches, hip thrust bench, Glute Drive. **No leg curl, calf raise machine or ankle strap is named.** The page heading says "10+" resistance machines but lists only 9, so one more machine may exist (a weak hint, not a fact).

## 3. What the sources say (step 3)

All read on 2026-11-17. PubMed refused automated reading (cookie wall), so abstracts were read through Europe PMC, which shows the same PubMed record.

| Topic | What it says (own words) | Source | Confidence |
|---|---|---|---|
| Weekly sets | More weekly sets give more growth, step by step. In the 3-level split, 10+ sets per muscle did best (a trend, not firm) | Schoenfeld, Ogborn, Krieger 2017, J Sports Sci, [PMID 27433992](https://europepmc.org/article/MED/27433992), [doi](https://doi.org/10.1080/02640414.2016.1210197) | High (meta-analysis, 15 studies) |
| Weekly sets | 67 studies: growth rises with weekly sets, with smaller gains at high volume. A set where the muscle only helps counts best as half a set. At equal sets, training a muscle more days a week adds little growth, but more strength | Pelland et al. 2026, Sports Med, [PMID 41343037](https://europepmc.org/article/MED/41343037), [doi](https://doi.org/10.1007/s40279-025-02344-w) (the published form of the preprint in research section 5) | High |
| How often | Training a muscle 2 times a week beat once a week for growth | Schoenfeld, Ogborn, Krieger 2016, Sports Med, [PMID 27102172](https://europepmc.org/article/MED/27102172) | High (older; Pelland 2026 finds the effect small at equal sets) |
| Weekly sets, guideline | About 10 sets per muscle a week; each major muscle at least 2 days a week | ACSM 2026 position stand, [press copy](https://www.newswise.com/articles/acsm-unveils-landmark-2026-resistance-training-guidelines-first-update-in-17-years) (from research section 5; acsm.org refused then) | Medium |
| Knee-bend hamstring work | 12 weeks of leg curls: the **seated** leg curl grew the hamstrings more than the lying one (+14 % vs +9 %), because the hamstrings work in a longer position | Maeo et al. 2021, Med Sci Sports Exerc, [PMID 33009197](https://europepmc.org/article/MED/33009197), [doi](https://doi.org/10.1249/mss.0000000000002523) | High (one trial, 20 adults, MRI) |
| Knee-bend vs hip-hinge | Different hamstring exercises use different parts of the hamstrings: hip-extension moves favour the long outer part; knee-bend moves favour the inner part (semitendinosus) | Bourne et al. 2017, Br J Sports Med, [PMID 27467123](https://europepmc.org/article/MED/27467123), [doi](https://doi.org/10.1136/bjsports-2015-095739) | Medium (muscle activity, not growth) |
| Knee-bend growth | Hamstring growth depends on the exercise; knee-bend training with the hip bent (long position) grew the hamstrings more than Nordic curls | Maeo et al. 2024, Med Sci Sports Exerc, [PMID 38857522](https://europepmc.org/article/MED/38857522), [doi](https://doi.org/10.1249/mss.0000000000003490) | High (42 men, MRI) |
| Calves | Calves are hard to grow. **Standing (straight-knee) calf raises** grew the big calf muscle far more than seated ones (about +9 to +12 % vs +1 to +2 %); the deeper calf muscle grew about the same either way | Kinoshita et al. 2023, Front Physiol, [PMID 38156065](https://europepmc.org/article/MED/38156065), [full text](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2023.1272106/full) | High (14 untrained adults, MRI) |
| Rest | Short and longer rests between sets give similar growth, with a small edge to resting more than 60 seconds | Singer et al. 2024, Front Sports Act Living, [PMID 39205815](https://europepmc.org/article/MED/39205815) | Medium (9 studies, wide spread) |

**What this means for us.**
1. A beginner grows on fewer sets than an advanced lifter, but 3 sets a week is under every guideline read. Aim: calves and back of the thighs nearer 6 to 10 sets, on at least 2 days.
2. The back of the thighs needs **both** a hip-hinge move (we have it: Romanian deadlift) **and** a knee-bend move (missing). A **seated** leg curl is the best pick if the gym has one.
3. Calves: **straight-knee** calf raises (leg press, Smith, standing machine) fit the evidence. The daily uphill walk is endurance work, not hard sets.
4. Abs at 27 sets is far more than needed. Removing about 10 abs sets frees the time.

## 4. Before / after: weekly sets per muscle

Counted the same way as research section 5 ("direct" = the muscle is the main one, free-exercise-db lists). Only the rows that change are shown. Chest, back, shoulders, arms, quads and glutes do not change.

| Muscle | Week 1 before → after | Weeks 2-5 before → after | Weeks 6 and 12 before → after | Weeks 7-11 before → after | Days a week before → after |
|---|---|---|---|---|---|
| Calves | 2 → **6** | 3 → **9** | 2 → **6** | 2 → **6** | Fri → **Mon, Wed, Fri** |
| Back of the thighs, direct (Romanian deadlift + leg curl) | 2 → **4** | 3 → **6** | 2 → **4** | 3 → **5** | Tue → **Tue, Thu** |
| Back of the thighs, as plan v2 counts it (also the cable pull-through) | 4 → 6 | 6 → 9 | 4 → 6 | 6 → 8 | Tue, Fri → Tue, Thu, Fri |
| Abs | 20 → **14** | 27 → **17** | 17 → **10** | 29 → **19** | all 5 → all 5 |

How the week rules apply (no new rule needed): week 1 = 2 sets per exercise; weeks 6 and 12 = one set less; weeks 7 to 11 = pair A gets a 4th set and every **D** exercise drops to 2 sets. The new calf and leg-curl exercises sit in the **D** place, so they follow the D rule like Tuesday's leg extension and Friday's calf raise.

## 5. Per-day changes (weeks 2-5 sets; the week rules above change them in other weeks)

### Monday: Upper body A (pairs A to C do not change)

| | Before | After |
|---|---|---|
| Abs 1 | Plank, 3 × 20-40 s, rest 30 s | **Plank, 2 × 20-40 s, rest 30 s** |
| Abs 2 → D | Dead bug, 2 × 8 each side, rest 30 s | **Calf raise on the leg press, 3 × 12-15, 60 s between sets** |
| Swaps for the new move | – | Calf raise machine (Q17); standing calf raise on the Smith machine; one-leg dumbbell calf raise on a step (new exercise) |

### Tuesday: Lower body A
**No change.** Still no calf raises on Tuesday (the leg-day walk rule stays).

### Wednesday: Full body, RIR 3 (pairs A to C do not change)

| | Before | After |
|---|---|---|
| Abs 1 | Side plank, 3 × 15-30 s each side, rest 30 s | **Side plank, 2 × 15-30 s each side, rest 30 s** |
| Abs 2 → D | Dead bug, 2 × 8 each side, rest 30 s | **Calf raise on the leg press, 3 × 12-15, 60 s between sets (RIR 3, like the whole day)** |
| Swaps | – | Same as Monday |

### Thursday: Upper body B (pairs A to C do not change)

| | Before | After |
|---|---|---|
| Abs 1 | Plank, 3 × 20-40 s, rest 30 s | **Plank, 2 × 20-40 s, rest 30 s** |
| Abs 2 → D | Cable crunch, 3 × 10-15, rest 45 s | **Leg curl, 3 × 10-15, 60 s between sets** |
| Which leg curl (fallback order) | – | 1. Seated leg curl machine (Q17; best by Maeo 2021). 2. Lying leg curl machine (Q17). 3. Standing cable leg curl with an ankle strap, low pulley (only if the gym has an ankle strap; not confirmed). 4. Dumbbell lying leg curl: face down on a flat bench, a light dumbbell held between the feet (equipment confirmed; ask staff to hand you the dumbbell the first time). 5. If none feels safe: Romanian deadlift (dumbbells), 3 × 10-12, RIR 3 (a hip hinge, so no knee-bend benefit) |

The cable crunch (the only abs move with a weight) still stays in the week: Tuesday keeps it in pair A.

### Friday: Lower body B
**No change.** Plan v2's note "if the first visit finds a leg curl machine, add 2 sets of leg curls on Friday after D" is **replaced** by the Thursday leg curl (it had no time set aside for it).

### Why these days
- **Calves on Monday, Wednesday, Friday:** about 48 hours apart, never on Tuesday (plan rule), and never the day before a hard calf session. Monday and Wednesday are not leg days, so the calves are fresh, and the walk ended an hour earlier.
- **Leg curl on Thursday:** Tuesday (hip hinge) and Thursday (knee bend) are 48 hours apart. Thursday is an upper day, so the leg curl does not tire the legs before any leg exercise that day.
- **Calf raise on the leg press:** the gym has 2 leg presses (confirmed), it is a straight-knee calf raise (fits Kinoshita 2023), and it does not need the gym's only Smith station. The exercise is already in the app as a swap, with a photo and a video link.
- **Each new move sits on its own at the end** (the D place), never paired with a hard leg move (WORKFLOW B6).

## 6. Time check per day

**How minutes were estimated.** Same simple model for before and after: a 12-15 rep set takes about 45 seconds, a 10-15 rep set about 40 seconds, a hold the top of its range; plus the rest in the table; about 30 seconds to start the slot; 1 minute to change to a floor exercise, 1.5 minutes to set up a machine. Plan v2's own block numbers (abs slot 7 minutes, 5 in weeks 7-11) are rounded, so the totals below are "about".

| Day | Abs slot before (model) | Abs slot after (model) | Change | Session weeks 2-5 before → after | Session weeks 7-11 before → after |
|---|---|---|---|---|---|
| Monday | about 6.5 min | about 8 min | +1.5 | 90 → about **91.5** | 91 → about **93** |
| Tuesday | – | – | 0 | 90 → 90 | 91 → 91 |
| Wednesday | about 7.5 min | about 8.75 min | +1.25 | 90 → about **91** | 91 → about **92.5** |
| Thursday | about 8.5 min | about 7.75 min | −0.75 | 90 → about **90** | 91 → about **91** |
| Friday | – | – | 0 | 90 → 90 | 91 → 91 |

- Thursday gets no longer: the leg curl replaces the cable crunch, which also needed a machine set-up and 3 sets.
- Weeks 7-11: the D exercise drops to 2 sets then, but plan v2's trick ("do the abs back to back, 2 minutes less") no longer works with a machine in the slot, so Monday and Wednesday stay about 1.5 to 2 minutes over.
- Week 1 and the easier weeks have fewer sets, so they stay under 90.
- The walk (30 minutes first) and the 45-minute weights block do not change.
- **Short day (60 minutes):** the rule "pairs A and B, then the first abs exercise only" stays. On Monday, Wednesday and Thursday the short day does 2 plank sets and skips the new D move, exactly as leg days already skip D.
- If Rosario wants Monday and Wednesday to stay at about 90 / 91, question 81 b cuts the plank and side plank to 1 set on those two days.

## 7. Risks

1. **Calves and the walk.** Calves now get hard sets 3 days a week **and** an uphill walk every day. Early calf soreness can make the next walk feel harder. Week 1 starts at 2 sets with about 3 reps left, which helps. The plan's walk rule (finish breathing hard → 1 % less slope) still applies. If the calves are still sore on walk days after week 2, drop Monday and Wednesday calves to 2 sets for a week.
2. **Achilles tendon (heel cord).** A sudden rise in calf work can irritate it. Slow reps, full stretch at the bottom without bouncing, stop for sharp pain at the back of the heel (plan safety rule).
3. **Leg press calf raise: feet slipping.** Only the balls of the feet on the bottom edge of the plate, knees straight but not locked, light weight first, never let the plate go past the toes. Ask staff the first time.
4. **The leg curl machine is not confirmed.** The good versions (seated, then lying) need a Q17 machine. Fallbacks 3 and 4 are less comfortable, and fallback 5 is not a knee-bend move. The first visit (Monday of week 1) answers this before the first Thursday.
5. **Back of the thighs two days in a row.** Thursday leg curl, then Friday cable pull-through and Smith squat. The pull-through is light and mainly a glute move, so the risk is small; if the hamstrings are very sore on Friday, keep Thursday's leg curl at 3 reps left for a week.
6. **Abs fall from 27 to 17.** Still well above the usual 10, and the core also works in squats, Romanian deadlifts and the walk. Low risk.
7. **Slightly longer days** (about +1 to 2 minutes on Monday and Wednesday). Question 81.
8. **The 4th set in weeks 7-11 still goes to pair A only.** Calves and the back of the thighs do not grow in sets between week 2 and week 11 (D drops to 2). Plan v2 section 14 lets the next block add sets where recovery was good.
9. **Another worker (8.31) is editing `app/js/plan/` and `docs/` right now.** If Rosario approves, the master should make this change after 8.31 lands, in one step, to avoid clashing edits.

## 8. What the app must change if Rosario approves (for the master, not done here)

Data and docs, in one change, after worker 8.31:
1. **`app/js/plan/plan-v2.js`, days `mon`, `wed`, `thu`:** `Abs1` sets 3 → 2; remove `Abs2`; add `{ slot: "D", ex: …, sets: 3, rest: 60 }` after `Abs1` (Monday and Wednesday `calf_raise_leg_press`; Thursday the leg curl).
2. **Exercise list:** `calf_raise_leg_press` and `leg_curl_machine` become planned exercises (today they are swap-only, with photos, video links and machine-map entries already). Give them swap lists. New swap-only exercises for the fallbacks: one-leg dumbbell calf raise, dumbbell lying leg curl, standing cable leg curl (ankle strap; hide it unless the first visit finds one). Each new exercise needs a photo (free-exercise-db), a form cue, a video link and a `media.js` entry; the master checks the exact free-exercise-db names.
3. **A planned exercise that needs a Q17 machine is new.** Today only swaps carry `needsMachine`. Two ways: (a) plan the dumbbell lying leg curl and keep the leg curl machine as a Q17 swap, then Rosario makes the machine permanent with Plan edit (answer 65) once found; or (b) the engine picks the machine when Settings › Gym weights says the gym has it, else the fallback. (a) needs no engine change. (b) is nicer at the gym but touches the engine (tests first, in their own commit, per the project rules).
4. **Week rules:** no change. `setsFor()` already cuts every `D` to 2 sets in weeks 7-11 and takes one set off in weeks 6 and 12. `engine/workout.js` and `ui/today.js` already treat `D` generically (not only on leg days); the master should still run the full test suite.
5. **"About N minutes":** `sessionMinutes.full.abs` (7) and the weeks 7-11 rule (−2) were written for two abs exercises. Consider 8 and −1 for Monday, Wednesday and Thursday, or keep the rounded numbers. A display choice.
6. **Plan id:** decide whether this is still `plan-v2` (Plan edits, sessions' `plan_exercise` history and the Plan cross-check keep working) or a new id like `plan-v2.1` (Plan edits made under `plan-v2` would no longer apply). Keeping `plan-v2` looks simpler, since Plan edits are not built yet.
7. **Tests:** `tests/plan.test.mjs` lists every slot (for example `["Abs2", "dead_bug", 2, …]` on Monday and `setsFor(1, "mon", "Abs2")`); update it to the new slots. The new numbers are a planned change, not a test bent to pass.
8. **Docs, same change:** plan v2 sections 4 (weeks 7-11 note), 5 (weekly sets line), 6 (Monday, Wednesday, Thursday tables; remove the Friday leg curl note); DECISIONS row; STATUS; the Plan tab cross-check numbers (research section 5.3 stays as a dated record).
9. **Week 1:** two new exercises to learn (leg press calf raise, leg curl). The week 1 flow already handles any exercise; no change.

## 9. Questions for Rosario

**❓ 80. Should the plan move about 10 abs sets to calves and the back of the thighs, as in sections 4 and 5?**
- a) Yes, all of it: calf raises on Monday and Wednesday, a leg curl on Thursday, fewer abs sets on those days.
- b) Calves only for now; the leg curl waits until the first visit confirms a leg curl machine (Thursday keeps its cable crunch until then).
- c) No change; keep plan v2 as it is.

Recommended: a, because both gaps are far under every guideline read, and the fallback list in section 5 covers a gym without a leg curl machine.

**❓ 81. Monday and Wednesday get about 1 to 2 minutes longer (about 91 to 91.5 instead of 90; about 92.5 to 93 instead of 91 in weeks 7-11). Thursday stays about the same. What should happen?**
- a) Accept the extra 1 to 2 minutes; plank and side plank keep 2 sets.
- b) Keep Monday and Wednesday at about 90 / 91: the plank (Monday) and side plank (Wednesday) drop to 1 set (abs then 15 a week in weeks 2-5).
- c) More calves instead: keep the new moves at 3 sets in weeks 7-11 too (about 94 minutes on Monday and Wednesday then; needs a small app rule change).

Recommended: a, because 1 to 2 minutes is inside the plan's own rounding, and 2 short sets keep the abs practice useful.

**❓ 82. If the gym has no leg curl machine, what should Thursday's leg curl be?**
- a) The fallback order in section 5: cable leg curl with an ankle strap if there is one, else a light dumbbell lying leg curl, else a second Romanian deadlift.
- b) Skip the knee-bend move: always a second Romanian deadlift on Thursday (3 reps left).
- c) Nothing: Thursday keeps its cable crunch, and the back of the thighs stays at 3 direct sets.

Recommended: a, because a knee-bend move works a part of the hamstrings the Romanian deadlift misses, and the dumbbell version needs only kit the gym has.

**❓ 83. When should the change start?**
- a) As soon as the app is updated, even in the middle of the 12 weeks; the new moves start like week 1 (2 sets, find the weight).
- b) Only at the next 12-week block, after the week 12 review.

Recommended: a, because the calf and hamstring gaps would otherwise last 12 more weeks, and the app already starts any new exercise with the week 1 rules.

## 10. Not verified

- **PubMed pages refused automated reading** (cookie wall, 2026-11-17). The same records were read through Europe PMC; abstracts only, no full texts (except Kinoshita 2023, open access, read through a search summary of the Frontiers page).
- **acsm.org:** not retried; the ACSM numbers come from the press copy quoted in research section 5 (Medium).
- **Gym kit:** leg curl machine (seated or lying), calf raise machine, ankle strap for the cables, a step or platform for calf raises: none named on the gym's page (read again 2026-11-17). The "10+ resistance machines" heading with 9 listed is only a hint. The first visit must check.
- **Minutes per day** are estimates from a simple model (section 6), not timed at the gym.
- **Free-exercise-db names** for the new fallback exercises (one-leg dumbbell calf raise, dumbbell lying leg curl, cable leg curl) were not checked.
- No study read tested calf or leg-curl work done after a 30-minute uphill walk; the walk-first advice comes from plan v2 section 3.
- No page read contained text aimed at an AI.
