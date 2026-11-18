# Trainer decisions (worker 8.36, personal trainer)

Started 2026-11-18. Owner of these decisions: the personal-trainer worker. Rosario asked not to be asked about the plan, amounts, weights or the walk, so the trainer decides from the evidence and writes it here. Each decision has: what, why, the sources (with the date read), and old value against new value.

Privacy: no body numbers, calories, protein or private walk settings are in this file. "The starting rows" are the three public rows of intake question 36 in `app/js/plan/plan-v2.js`.

Not medical advice. Stop and get help for chest pain, dizziness, trouble breathing or sharp pain.

Words used here:
- **MET**: a measure of effort. 1 MET is sitting still. Moderate effort is 3 to 5.9 METs; vigorous is 6 or more (CDC).
- **Effort 0 to 10**: how hard it feels. Moderate is 5 or 6; vigorous starts at 7 or 8 (CDC).
- **Main / helper muscle**: main does most of the work (counts 1 per set); a helper does real work but less (counts half).

## Summary

| # | Decision | Old | New |
|---|---|---|---|
| D1 | Walk before the weights | before | before (no change) |
| D2 | Walk length | 30 min (3 build-up + 27); short day 15; first walk 20 for the "no" row | no change |
| D3 | Top of the walk | 12 % slope and 6 km/h | 12 % slope and **5 km/h** |
| D4 | Effort rule | 5 to 6 of 10 (leg days 4 to 5) | no change |
| D5 | Suggestion never above the top | the next walk copies a saved walk, even above the top | the suggestion stays at or under the top (engine change sent to worker 8.35) |
| D6 | Result screen limits | speed 2 to 8 km/h, slope 0 to 15 % | speed 2 to **7** km/h, slope 0 to 15 % |
| D7 | Change before the walk | not possible | **"Change speed or slope"**: up to 0.5 km/h and 2 % either way, never above the top; no minutes change |
| M1 to M9 | Muscle data | see section 2 | 13 exercises fixed, 2 rows waiting for a code change |
| P1 | Sets, reps, rest in `plan-v2.js` | – | checked against the plan doc and sources: no clear mistake, no change |

## 1. The walk

### What the evidence says (read 2026-11-18)

- **Cardio and weights together do not cost muscle or maximum strength over weeks.** A review of 43 studies found no loss of muscle size or maximum strength; only jumping-type power dropped, more when both were in one session. [Schumann et al. 2022, Sports Medicine (Europe PMC)](https://europepmc.org/article/MED/34757594). The order (cardio or weights first) did not change muscle or fat; weights first gave a little more leg strength only. [Eddens et al. 2018, Sports Medicine](https://link.springer.com/doi/10.1007/s40279-017-0784-1).
- **Right after cardio, strength is lower for a while, more so after harder and longer cardio.** A review of 15 studies: moderate drops in strength after cardio; bigger after moderate-to-high effort than after easy effort, and bigger after more than 30 minutes than after 30 or less. [Markov et al. 2022, Sports Medicine (Europe PMC)](https://europepmc.org/article/MED/34878640). In one study, 30 minutes of leg-only cardio at about 70 % of maximum heart rate cut back-squat reps but not bench-press reps. [Tan et al. 2014, J Strength Cond Res (Europe PMC)](https://europepmc.org/article/MED/24531438).
- **Effort bands.** 3 to 5.9 METs is moderate, 6 or more is vigorous. On a 0 to 10 scale, moderate is 5 or 6, vigorous starts at 7 or 8. Talk test: moderate = you can talk but not sing; vigorous = only a few words before a breath. [CDC, How to Measure Physical Activity Intensity, updated 2025-12-04](https://www.cdc.gov/physical-activity-basics/measuring/index.html). Same MET bands in the [ACSM Guidelines, 12th edition excerpt](https://acsm.org/wp-content/uploads/2025/03/GETP12_excerpt.pdf).
- **Energy of slope walking** (ACSM walking formula, the same one in `engine/walk.js`): 12 % at 4.8 km/h (the "12-3-30" walk) is about 8.2 METs; 12 % at 5 km/h about 8.5; 12 % at 6 km/h about 10. The formula is meant for about 3 to 6 km/h ([open-exam-prep ACSM equations summary](https://open-exam-prep.com/study-guides/acsm-cep/exercise-physiology/metabolic-calculations); [PMC7896743](https://pmc.ncbi.nlm.nih.gov/articles/PMC7896743)).
- **The 12-3-30 walk** has one small lab study: 16 adults, 12 %, about 4.8 km/h, 30 minutes; it burned energy more slowly than running and used more fat. [Wong et al. 2025, Int J Exerc Sci](https://digitalcommons.wku.edu/ijes/vol18/iss6/1). Experts call it good low-impact cardio, not a starting point for people who are not already active. [Healthline experts](https://www.healthline.com/health-news/what-experts-think-of-the-12-3-30-tiktok-treadmill-workout).
- **Minutes a week.** At least 150 minutes of moderate cardio a week plus weights 2 or more days ([CDC, same page](https://www.cdc.gov/physical-activity-basics/measuring/index.html); [AHA statement highlights](https://newsroom.heart.org/news/move-more-for-your-health-not-just-for-the-scale)). Under 150 minutes gives little weight loss; diet matters more ([ACSM 2009 position, NCBI Bookshelf](https://www.ncbi.nlm.nih.gov/books/NBK565813/)).
- **Choosing your own effort.** A meta-analysis found better feelings with self-chosen than imposed intensity; the gap grows the harder the imposed effort is. [Oliveira, Deslandes and Santos 2015, Frontiers in Psychology (Europe PMC)](https://europepmc.org/article/MED/26300805). A review of 10 years of studies: pleasure drops mainly above the breathing threshold, and self-chosen intensity seems to make higher effort easier to accept. [Ekkekakis, Parfitt and Petruzzello 2011, Sports Medicine (Europe PMC)](https://europepmc.org/article/MED/21780850).
- **Walking or running.** On a slope, people switch from walking to running at a lower speed, about 1 % slower per 1 % of slope. [Hubel and Usherwood 2013 (PMC3639764)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3639764); [Brill and Kram 2021, J Exp Biol](https://zendy.io/pdf-viewer/10.1242/jeb.233056).

The research helper's longer check is in [the walk check](../research/2026-11-18-walk-check.md).

### D1. Keep the walk before the weights (no change)

- **Why:** Rosario chose it (intake 35 b). Over weeks it does not cost muscle (Schumann 2022, Eddens 2018). The short-term strength drop is real but smaller after easier, shorter cardio (Markov 2022), and it hits the legs, not the upper body (Tan 2014). So the plan keeps the protections it already has: easier walk on leg days, effort 5 to 6 at most, 2 to 3 minutes of rest before the first heavy set.
- **Old → new:** walk first → walk first.

### D2. Keep 30 minutes (no change)

- **Why:** 5 × 30 minutes = 150 minutes a week, the standard minimum (CDC, AHA). Longer than 30 minutes before weights gives a bigger strength drop (Markov 2022), so the walk does not get longer. Shorter is possible any day: "Done walking" saves the real minutes.
- **Old → new:** 30 (3 + 27), short day 15, first walk 20 for the "no" row → same.

### D3. Top of the walk: 12 % and 5 km/h (was 12 % and 6 km/h)

- **Why:** 12 % at 6 km/h is about 10 METs: vigorous for nearly everyone, far above "talk in short sentences", and the harder the cardio, the bigger the strength drop before the weights (Markov 2022). 12 % at 5 km/h is about 8.5 METs, close to the tested 12-3-30 walk (Wong 2025, about 8.2 METs). The effort rule (D4) still decides how fast the walk climbs; the top is a safety net if effort scores drift. Leg days stay 2 % lower, so their top is 10 % at 5 km/h (about 7.7 METs).
- **What it means:** the walk first gets steeper (1 % at a time, up to 12 %), then faster (0.2 km/h at a time) only up to 5 km/h. A walk that starts at 5 km/h only gets steeper. Reaching the top is not a goal.
- **Old → new:** `walkRules.maxSpeed_kmh` 6 → 5; `maxSlope_pct` 12 → 12.
- **Code:** `app/js/plan/plan-v2.js`, tests in `tests/walk.test.mjs` (commits 1cd09ee tests, 9c851b1 change).

### D4. Keep the effort rule (no change)

- **Why:** effort 5 to 6 of 10 is exactly the CDC "moderate" band; leg days 4 to 5 sit just under it. Progress only after two walks at 5 or easier; 1 % less steep after a walk that ended out of breath. These match the evidence above.
- **Old → new:** same.

### D5. The suggestion never goes above the top (engine change, sent to worker 8.35)

- **Why:** today the next walk copies the last saved walk. If a walk is saved faster or steeper than the top, every later suggestion stays above the top, and D3 would not protect anything.
- **Exact change** (in `app/js/engine/workout.js`, function `walkSuggestion`, just before `const day = walkForDay(base, legDay);`):

  ```js
  base = { speed_kmh: Math.min(base.speed_kmh, walkRules.maxSpeed_kmh), slope_pct: Math.min(base.slope_pct, walkRules.maxSlope_pct) };
  ```

  With a test: a saved walk at 5.8 km/h and 14 % gives a suggestion of 5 km/h and 12 % (leg day 10 %). Sent to worker 8.35 on 2026-11-18, who owns that file tonight (details in the shared notes, `8.36-trainer-walk-clamp-for-8.35.md`).
- **Old → new:** no limit → at or under the top.

### D6. Result screen: walking speeds only (7 km/h, was 8)

- **Why:** the result screen records what really happened, so it may go above the plan's top (D5 keeps the next suggestion safe). But 8 km/h is a run, not a walk; on a slope people start running at lower speeds still (Hubel and Usherwood 2013; Brill and Kram 2021). 7 km/h leaves room for a fast walk and a treadmill that runs a little slow. Slope stays 0 to 15 %, the top of most treadmills.
- **Old → new:** speed 2–8 → 2–7 km/h; slope 0–15 % → same.
- **Code:** `app/js/ui/walk.js` (commit 9c851b1).

### D7. A small change before the walk: yes, speed and slope only

- **Why:** days differ (tired legs, a sore calf, a treadmill that reads differently), and Rosario would change the treadmill anyway; it is better that the app knows. Self-chosen effort feels better, and people accept more effort when they choose it (Oliveira 2015; Ekkekakis 2011). Limits keep it small: speed up to 0.5 km/h either way (0.1 steps), slope up to 2 % either way (1 % steps), never above the top (D3; leg days 10 %). No minutes change: "Done walking" already ends early and saves the real minutes, and a shorter default would cut the weekly 150.
- **How it works:** the walk screen shows the plan's pick. A small text button, "Change speed or slope", opens two steppers. After a change the tiles show the new numbers and a line "Plan's pick: …". The running walk and the result screen start from the changed numbers. The next walk follows what is saved (as before), so a lighter day makes the next suggestion lighter too: honest, and the effort rule moves it up again.
- **Old → new:** no change possible before the walk → a small change.
- **Code:** `app/js/ui/walk.js` (`adjustRange`, `walkTarget`; the change is kept on the phone in the running workout as `walk_adjust`), tests W1 to W4 in `tests/walk.test.mjs`.

### Note for the private plan

The private plan (`private/plan-v2-personal.md`, section 5) still says "up to about 6 km/h". The trainer reads it only and does not edit it; it should say 5 km/h next time someone updates it.

## 2. Muscle data (from the muscle-map check)

Source of the findings: [the muscle-map check](../research/2026-11-18-muscle-map-check.md) (each exercise against 2 sources, read 2026-11-18: mainly the [StrengthLog exercise directory](https://www.strengthlog.com/exercise-directory/) plus a second independent source per exercise: Wikipedia with its citations, NASM, Catalyst Athletics or an EMG study through Europe PMC). The trainer applies a fix only where 2 sources agree. Code: `app/js/plan/muscles.js`, each changed exercise carries `own: { reason }`; test in `tests/muscles.test.mjs`.

| # | Exercises | Old | New | Sources that agree |
|---|---|---|---|---|
| M1 | leg press, hip thrust, dumbbell glute bridge | calves as a helper | no calves (the ankle does not move) | StrengthLog (no calves); [Contreras 2015 EMG](https://europepmc.org/article/MED/26214739); [NASM floor bridge](https://www.nasm.org/resource-center/exercise-library/floor-bridge); [Wikipedia Leg press](https://en.wikipedia.org/wiki/Leg_press) |
| M2 | leg press, goblet squat, Smith squat | hamstrings as a helper; no inner thighs | no hamstrings (they only steady the leg); inner thighs (adductors) as a helper | [StrengthLog leg press](https://www.strengthlog.com/leg-press/); [Wikipedia Squat](https://en.wikipedia.org/wiki/Squat_(exercise)); [Kubo 2019 training study](https://europepmc.org/article/MED/31230110): squats grew quads, adductors, glutes, not hamstrings; [Escamilla 2001 EMG](https://europepmc.org/article/MED/11528346) |
| M3 | goblet squat | front shoulders as a helper | removed (they only hold the dumbbell still) | [StrengthLog goblet squat](https://www.strengthlog.com/goblet-squat/); [Wikipedia Squat](https://en.wikipedia.org/wiki/Squat_(exercise)) |
| M4 | seated row machine | helpers biceps, mid back | adds rear shoulders, like the other rows | [StrengthLog seated machine row](https://www.strengthlog.com/seated-machine-row/); [Lehman 2004 EMG](https://europepmc.org/article/MED/15228624) |
| M5 | hammer curl, cable curl | no helper | forearms as a helper | [StrengthLog hammer curl](https://www.strengthlog.com/hammer-curl/); [Catalyst Athletics](https://catalystathletics.com/exercise/841/Hammer-Curl); [Wikipedia Biceps curl](https://en.wikipedia.org/wiki/Biceps_curl) |
| M6 | side plank | side shoulders as a helper | glutes (gluteus medius) as a helper | [Wikipedia Plank](https://en.wikipedia.org/wiki/Plank_(exercise)); [Youdas 2014 EMG](https://europepmc.org/article/MED/25177418); StrengthLog (no shoulders) |
| M7 | cable lateral raise | helpers mid back, traps | no helpers, same as the dumbbell lateral raise | [StrengthLog cable lateral raise](https://www.strengthlog.com/cable-lateral-raise/); [Wikipedia Lateral raise](https://en.wikipedia.org/wiki/Lateral_raise) |
| M8 | dumbbell rear-delt raise | no helper | mid back as a helper | [StrengthLog reverse flyes](https://www.strengthlog.com/reverse-dumbbell-flyes/); [Ekstrom 2003 EMG](https://europepmc.org/article/MED/12774999) |
| M9 | shoulder press machine, seated dumbbell shoulder press | helper triceps | helpers triceps and side shoulders | [StrengthLog machine shoulder press](https://www.strengthlog.com/machine-shoulder-press/); [Saeterbakken 2013 EMG](https://europepmc.org/article/MED/23096062) |

**Agreed but waiting (rows, part of M4).** Both sources say the lats are a main muscle of the one-arm dumbbell row and the seated cable row, next to the mid back ([StrengthLog dumbbell row](https://www.strengthlog.com/dumbbell-row/); [Lehman 2004](https://europepmc.org/article/MED/15228624)). The app's muscle check adds lats and mid back into one "Back" row and counts every main muscle, on the rule "one main muscle per exercise". Two main muscles would show a 3-set row as 6 back sets. So tonight the rows keep mid back as main and lats as a helper, and the Back numbers stay right. Fix later: let the check count a set once per row even when an exercise has two main muscles, then make the rows `main: ["lats", "mid_back"]`. Sent to the Training master as a follow-up.

**Where sources disagree, the trainer's pick** (no change in all cases):
- Lateral raises: traps or front shoulders as helpers? StrengthLog names the front delt, one EMG study the traps, Wikipedia neither. Pick: no helpers; the front shoulders get plenty from presses.
- Face pull: side shoulders as a helper? StrengthLog and Hevy yes, NASM no. Pick: no (the main point is the rear shoulders and mid back).
- Romanian deadlift: inner thighs as a helper? Only StrengthLog. Pick: no.
- Hip thrust and glute bridge: quads as a helper? StrengthLog yes; the EMG study shows quads holding still, not moving. Pick: no.
- Cable pull-through: hamstrings as a second main muscle? The 2023 EMG study says nearly as much as the Romanian deadlift; StrengthLog keeps them secondary. Pick: keep glutes main, hamstrings helper.
- Calves in squats: StrengthLog (secondary) and Wikipedia (soleus) both name them. Kept, though generous.
- Goblet squat lower back, leg curl calves: one source or none. Pick: no.

**The weekly numbers on the plan page move a little:** calves and hamstrings lose some helper half-sets (leg press, squats, hip thrust); inner thighs gain some; forearms, glutes (side plank), mid back (rear-delt raise) and side shoulders (presses) gain helper half-sets. Direct (main-muscle) sets do not change.

**Body drawing (not data, not changed):** the front-shoulder strip is small on the front map, so presses look weaker than lateral raises (check section 3). This is drawing code (`bodymap.js`), not the trainer's file. Sent as a follow-up.

## 3. Sets, reps and rest in `plan-v2.js` (P1)

- **Checked:** every day's slots (exercise, sets, rest) and every exercise's rep range and kind against plan v2 sections 5, 6 and 17. All match. Weights are not numbers in the plan: they come from week 1 (find the weight with about 3 reps left) and the double-progression rule.
- **Against the evidence:** 2 to 3 sets per exercise, 8 to 15 reps, stopping 2 to 3 reps before failure, each muscle twice a week, about 8 to 12 hard sets per muscle a week. The 2026 ACSM position stand favours progressive training of all major muscles at least 2 days a week, with flexible sets and reps, and found that training to failure did not consistently help ([ACSM 2026 resistance training update](https://acsm.org/resistance-training-guidelines-update-2026/); [Newswise summary](https://www.newswise.com/articles/acsm-unveils-landmark-2026-resistance-training-guidelines-first-update-in-17-years)). A dose-response meta-regression found more weekly sets give more growth with smaller gains as sets rise ([Pelland et al. preprint, SportRxiv](https://sportrxiv.org/index.php/server/preprint/view/460)). The plan sits in a sensible beginner range.
- **Decision:** no clear mistake, no change.
- **Small note, no change:** `plan-v2.js` calls the cable pull-through `muscle: "hamstrings"`, while the muscle data says glutes main. Words only; both muscles work.

## 4. Not verified

- Study full texts were not read; numbers come from abstracts (Europe PMC), official pages and search summaries. A 2024 review on self-chosen effort (University of Murcia journal) could not be opened as text, so it is not used.
- MET numbers are formula estimates; people and treadmills differ by 10 to 20 %.
- The walk screen change was tested on a pretend page (tests W1 to W4), not on a phone.
- D5 needs worker 8.35's engine change; until then a walk saved above the top is copied into later suggestions.

## 5. Notes for later (the trainer stays Rosario's trainer)

- Diet numbers come next (planned for 2026-11-19).
- If calves or shins hurt on walk days, hold the slope for a week (plan v2 section 17 "Watch").
- Rows: switch to two main muscles once the check counts a set once (section 2).
