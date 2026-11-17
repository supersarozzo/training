# Research: Plan tab redesign and the new Diet tab

Date: 2026-11-17. Worker 8.26 (Opus), research step of the Plan + Diet redesign (Rosario's answer 66). No app code, no mock-ups, no library downloads.
Asked by: chat 8 · Training Agent. Rosario's answers this builds on: 62 a (food logging back in scope), 63 a (self-hosted decoder; "no scripts loaded from other sites"), 64 a (Open Food Facts, only the barcode or search word sent, plus own saved foods), 65 "forever" (Plan edits are permanent for that plan day), 66 (research → 2 builders → 1 reviewer → Rosario picks → build). Recorded in [DECISIONS.md](../DECISIONS.md) and [OPEN_QUESTIONS.md](../OPEN_QUESTIONS.md).

**Method.** Our own code and docs were read first (app 0.4.1: `ui/parts.js`, `ui/plansheet.js`, `ui/today.js`, `ui/swap.js`, `ui/machines.js`, `model.js`, `sync/merge.js`, `engine/schedule.js`, `engine/workout.js`, `engine/nutrition.js`, `plan/plan-v2.js`, `plan/media.js`, `sw.js`, the CSP in `index.html`). Three read-only web helpers then read official pages, help centres, repos, registries and bug trackers; their full notes (every row with a link and date) are in the shared side-session notes folder of chat 8 (`research-8.26-A-plan-apps-muscle-maps.md`, `research-8.26-B-food-apps.md`, `research-8.26-C-barcode-off.md`). Earlier research is reused where it fits ([2026-11-16-fitness-apps.md](2026-11-16-fitness-apps.md)). Nothing was installed, bought or signed into. Three Open Food Facts requests and two GitHub API reads were made with a generic app name and no personal data.

**Confidence key.** High = the official page, spec, repo, registry or our own test says it. Medium = a search snippet of an official page, a reputable review, or a vendor's own blog. Low = forum, one user report.

**Words.** *Body map*: a front-and-back drawing of the body with muscles coloured. *Set*: one round of an exercise. *Weekly sets*: how many hard sets a muscle gets in a week. *Decoder*: code that reads a barcode from a camera picture. *WASM (WebAssembly)*: a fast, compiled kind of code a browser can run. *CSP*: the page's security rules that say what it may load and contact. *Open Food Facts (OFF)*: a free, crowd-filled food database. *Tombstone*: a record marked deleted instead of removed, so a sync cannot bring it back.

Ideas below are in our own words. No other app's look, logo or text is copied.

## Contents

1. Pattern table
2. What is wrong with our Plan tab (blunt)
3. Day plan screens: what apps do and what it means for us
4. Muscle maps
5. Plan cross-check: weekly sets per muscle
6. Food tracking: what apps do and what it means for us
7. Barcode verdict
8. Open Food Facts facts
9. Data model notes for the 2 builders
10. Not verified / blocked
11. Constraints for the 2 builders

---

## 1. Pattern table

All rows read on 2026-11-17.

| App | What it does (own words) | Link | Conf. |
|---|---|---|---|
| Hevy | Saved routines can be edited: add, remove, reorder, replace exercises; add or remove sets; targets, rest timers, notes | [hevyapp.com routines](https://www.hevyapp.com/features/gym-workout-routines/) | High |
| Hevy plan generator | "Replace exercise" shows 4 suggested matches first, then the whole library; asks "only this session or permanent?"; can hide a move from future picks. Matching rule not stated | [hevyapp.com plan generator](https://www.hevyapp.com/features/workout-plan-generator/) | High |
| Hevy | Body diagram of the last 7 days; sets per muscle per calendar week, arrows between weeks | [muscle chart](https://www.hevyapp.com/features/muscle-group-workout-chart/), [sets per muscle](https://www.hevyapp.com/features/sets-per-muscle-group-per-week/) | High |
| Boostcamp | Swap: "just this workout" or "this and future workouts"; offers the coach's list or similar exercises, keeps sets and reps, the original stays to switch back | [boostcamp.app swap](https://www.boostcamp.app/features/swap-exercises) | High |
| Boostcamp | Muscle tracker: front-and-back heat map (pale = little), radar, table; each set split by muscle share (press = 1 chest, 0.5 triceps); front and back map per session | [boostcamp.app muscle tracker](https://www.boostcamp.app/features/muscle-tracker) | High |
| JEFIT | Plans up to 31 days; day details with an edit button and drag to reorder; body map per plan day; paid: tap a muscle to add an exercise for it | [JEFIT FAQ](https://www.jefit.com/support/faq), [BodyMap blog](https://www.jefit.com/blog/introducing-bodymap-a-smarter-way-to-visualize-your-training) | High (reorder: Medium) |
| Alpha Progression | Own plans fully editable; a swap can be for today or kept in the plan | [alphaprogression.com](https://alphaprogression.com/en) | High |
| Fitbod | Replace an exercise with one for the same muscle group; equipment set elsewhere | [Fitbod help (snippet)](https://help.fitbod.me/hc/en-us/articles/360006335593-Editing-Workouts-in-Fitbod) | Medium (help pages refused) |
| Strong | Templates and a muscle heat map listed as features; no readable detail | [strong.app](https://www.strong.app/) | High (names only) |
| MacroFactor | After adding a food, goes back to search; remembers the last portion; favourites and "foods you log at this hour" on top; quick add (not saved); 24-hour timeline, no meal buckets | [new food logger](https://macrofactor.com/new-food-logger/), [help: how to log](https://help.macrofactorapp.com/en/articles/215-how-to-log-food-in-macrofactor) | High |
| MacroFactor | Dashboard flips "eaten / left"; calorie and protein bars turn bolder at target, no red; week view | [help: dashboard widgets](https://help.macrofactorapp.com/en/articles/225-understanding-the-widgets-at-the-top-of-the-dashboard) | High |
| MacroFactor | Own tap-count test: quick add 3, barcode 5, search 10 (vendor's own test) | [fastest food logger 2025](https://macrofactor.com/fastest-food-logger-2025/) | Medium (fairness) |
| Cronometer | Scan, then the food page with a portion box; unknown barcode: create food, photo of the label fills the numbers, or type the barcode | [Cronometer barcode blog](https://cronometer.com/blog/how-to-use-the-barcode-scanner/) | High |
| Cronometer | Copy an entry or a day, custom meals, multi-add | [log food fast](https://cronometer.com/blog/log-food-fast) | High |
| MyNetDiary | Grams, ounces, cups or pack servings with a default unit; favourites, staples, recent one tap; copy an entry, meal or day; meals can be renamed or removed | [MyNetDiary logging help](https://www.mynetdiary.com/help/logging-food/) | High |
| Nutracheck (UK) | Scan, pick serving, add; most-added foods per meal; copy forward | [Nutracheck blog](https://www.nutracheck.com/Blog/ExpertView/5-hacks-to-speed-up-diary-entries) | Medium |
| MyFitnessPal | Copy a meal; recent and frequent lists per meal; unknown barcode: create an entry | [MFP blog (snippet)](https://blog.myfitnesspal.com/copy-and-remember-meals/) | Medium (pages refused) |
| Lose It! | Unknown barcode: create a custom food; wrong data: edit and save as your own | [Lose It! custom foods (snippet)](https://loseit.zendesk.com/hc/en-us/articles/49209748140052-Custom-Foods) | Medium (pages refused) |
| Yazio | Create food from any meal; store foods can be public, home foods private | [Yazio help (snippet)](https://help.yazio.com/hc/en-us/articles/360000629817) | Medium (pages refused) |

---

## 2. What is wrong with our Plan tab (blunt)

Read in `app/js/ui/plansheet.js` (app 0.4.1) on 2026-11-17.

1. **It is one long scroll, not a day.** The Week part stacks all 5 days (37 exercise rows) and then the 12 weeks under each other. There is no "this day" page, no arrows, and today is not marked. To see Thursday you scroll past Monday to Wednesday.
2. **The day summary rows do nothing.** The first card lists Monday to Friday as rows that look tappable but are static: no jump to the day.
3. **It shows the wrong number of sets for most weeks.** Rows print the base sets from the day table ("3 × 8-12"). In week 1 Today does 2 sets, in weeks 6 and 12 one set less, in weeks 7 to 11 pair A gets a 4th set and D drops to 2. The Plan tab never says which week it is showing, so it disagrees with Today in 7 of 12 weeks.
4. **One crammed grey line per exercise.** Slot code, sets × reps, rest and the swap list share one small muted line, for example "A1 · 3 × 8-12 · 30 s to move · Swap: Dumbbell bench press". "A1" and "30 s to move" are not explained on the page.
5. **The walk is listed last but done first.** "Walk first: normal…" sits under the exercise list of each day.
6. **Exercises and Machines duplicate the Gym tab.** The Machines part even says "The Gym tab has the same cards". Two places to keep in step; Rosario asked to move both into Gym.
7. **The Print button and the A4 tables.** A top-right button on a phone screen for a job Rosario does not do. About 70 of the file's 170 lines exist only for print. Rosario asked to remove it.
8. **No muscles anywhere.** The data has one word per exercise (`muscle: "back"`), never shown. There is no body map and no way to see what a day or the week works.
9. **No editing.** The plan is fixed code. If the gym lacks a machine or Rosario hates an exercise, the only tool is the mid-workout swap, which lasts one workout and is asked again every time.
10. **Swaps are 1 or 2 hand-picked names.** There is no "matching exercise" logic (same muscle, same kind of equipment). The catalogue is 37 exercises, so a matching list would be short.
11. **The 12-week table is buried** at the bottom of the long scroll, after Friday.

Good parts to keep: photo thumbs on each row, tap opens the exercise sheet (photos, tips, video, machine), the plain RIR explanation, data from one source (`plan-v2.js`).

---

## 3. Day plan screens: what apps do and what it means for us

What the pages say (details and links in section 1):
- **"Only this time, or for good?"** Hevy's plan generator, Boostcamp and Alpha Progression all ask this when you swap. Rosario already chose (answer 65): in the Plan tab an edit is always for good; the mid-workout swap stays for one workout. So the Plan Edit screen needs no question, but it must **say clearly** that the change lasts ("Changes every Monday from now on") and offer a way back ("Back to the plan's Monday").
- **Suggested matches first, then everything.** Hevy shows 4 suggestions on top of the full list; Boostcamp shows a coach list or similar moves and keeps the sets and reps. No page states a hard "same muscle **and** same equipment" filter (Fitbod says "same muscle group"). Our rule is stricter than any app documents, so with our small catalogue it will often give 1 or 2 names. Idea: list "Same muscle, same kind of equipment" first, then "Same muscle, other equipment", always with the photo.
- **Keep the numbers on a swap.** Boostcamp keeps sets and reps when a move is swapped. For us: a swap keeps the slot's sets and rest; reps come from the new exercise's range (each exercise has its own range in `plan-v2.js`).
- **Body map per day.** JEFIT puts a body map on each plan day. That is close to Rosario's idea; Rosario's version (per card, plus "the day so far") is more detailed than anything found.
- **Not found:** how apps move between days (arrows, tabs) and what an expanded exercise card holds. No readable page describes it (would need screenshots or the apps). Our own Today screen is the model: the Plan day page should read like Today, with the day name, week and phase at the top and arrows to the previous and next day.

What this means for the Plan day page (for the builders, not a design):
- One day per page, arrows left and right (Monday ↔ Friday, wrapping or stopping is a builder choice), today's day opened first, the week shown and changeable, so the sets match Today (problem 3 in section 2).
- Walk first, then pairs as cards in the real order (problem 5).
- Each card: photo, name, "3 sets · 8-12 reps · rest 90 s" in words (no bare "A1"), tap to open the two body maps and the exercise sheet.
- An Edit button that changes the cards to edit mode: remove, swap (matching list), add (rules in section 9.1).

## 4. Muscle maps

### 4.1 Licensed drawings we could copy into the app

Read 2026-11-17 (side-session note A; the first row's licence, size and date also checked through the GitHub API by this worker).

| Candidate | Licence | Front + back | Regions | Size, last update | What we must do | Link |
|---|---|---|---|---|---|---|
| **react-body-highlighter** | **MIT** | Yes | About 20 named regions: chest, obliques, abs, biceps, triceps, neck, front deltoids, back deltoids, forearm, trapezius, upper back, lower back, gluteal, abductors, adductor, quadriceps, hamstring, calves, soleus, knees, head | Shapes are polygon point lists in one 6,352-byte file; pushed 2026-11-01; not archived | Keep the MIT notice. We copy the point lists into our own SVG (no React, no npm) | [github.com/giavinh79/react-body-highlighter](https://github.com/giavinh79/react-body-highlighter) |
| react-native-body-highlighter | MIT | Yes (male, female) | Similar (it is where the polygons came from) | pushed 2026-10-18 | Keep the MIT notice. The original artist was not traced | [github.com/HichamELBSI/react-native-body-highlighter](https://github.com/HichamELBSI/react-native-body-highlighter) |
| body-muscles | Apache-2.0 with a NOTICE file | Yes | 70+ muscles (upper, mid and lower lats and traps, left and right) | about 12 to 13 KB per side; 2026-04-16 | Keep licence and NOTICE, say what we changed; group the 70 parts into our 17 | [github.com/vulovix/body-muscles](https://github.com/vulovix/body-muscles) |
| Wikimedia "Muscles front and back.svg" | CC BY-SA 4.0 | Yes | Not listed | 342 KB | Credit, and our changed copy must stay CC BY-SA. Too big and the wrong licence fit | [commons.wikimedia.org](https://commons.wikimedia.org/wiki/File:Muscles_front_and_back.svg) |
| Draw our own | ours | - | About 20 to 25 shapes and 2 outlines for our 17 muscles | - | Days of careful drawing to look good | - |

**Recommendation: react-body-highlighter's shapes (MIT), copied as point lists into our own SVG drawn by `ui/svg.js`.** Smallest, permissive, regions match free-exercise-db almost one to one. Risk: polygon art can look angular next to the photos. Nobody rendered it in this research (not verified), so the builders should draw it at 375 px, light and dark, early. Runner-up for a finer look: body-muscles (Apache-2.0).

### 4.2 From exercise to map region

Our app does **not** keep the muscle lists today. `media.js` stores only the free-exercise-db entry name (`lib`), and `plan-v2.js` one `muscle` word per exercise. free-exercise-db (public domain) has, for each entry, `primaryMuscles` and `secondaryMuscles` from a fixed list of 17 names, with no weighting and no front / side / rear shoulder split ([schema.json](https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/schema.json), read 2026-11-17, High). The lists for all 27 plan exercises were read from `dist/exercises.json` (side-session note A, table in section 4). The builders should copy them into our public plan data (a small `muscles` field per exercise), checked by a unit test.

| free-exercise-db name | Map region (react-body-highlighter) | Note |
|---|---|---|
| abdominals | abs (+ obliques) | |
| abductors | abductors | |
| adductors | adductor | |
| biceps | biceps | |
| calves | calves (+ soleus on the back) | |
| chest | chest | |
| forearms | forearm | |
| glutes | gluteal | |
| hamstrings | hamstring | |
| lats | upper back | shares a region with middle back |
| lower back | lower back | |
| middle back | upper back | shares a region with lats |
| neck | neck | |
| quadriceps | quadriceps | |
| shoulders | front deltoids + back deltoids | free-exercise-db has no split. Suggest our own override per exercise: presses = front, lateral raise = side (light both), face pull and rear-delt raise = back |
| traps | trapezius | |
| triceps | triceps | |

Two free-exercise-db oddities to know: the cable pull-through is listed as a **glute** move (hamstrings only as helper), and the leg press and squats list **calves** as a helper. Our own override may correct these; the cross-check in section 5 uses the database as it is.

### 4.3 Showing it honestly

- Left map (this exercise): main muscles strong, helpers light. Right map (the day so far): shade by sets so far, in 3 steps at most.
- Never colour alone (DESIGN.md rule): under each map a line of words, for example "Main: chest · Helpers: front shoulders, triceps".
- Colours from DESIGN.md tokens; volt is the accent, so a soft volt for helpers and full volt for main is one natural choice (builders decide).


---

## 5. Plan cross-check: weekly sets per muscle

### 5.1 The yardstick

| Source | What it says (own words) | Link | Read | Confidence |
|---|---|---|---|---|
| ACSM position stand 2026 (press copy; acsm.org refused) | About 10 sets per muscle group per week for growth; each major muscle on at least 2 days a week; machines or free weights both fine | [newswise copy](https://www.newswise.com/articles/acsm-unveils-landmark-2026-resistance-training-guidelines-first-update-in-17-years) | 2026-11-17 | Medium |
| Schoenfeld, Ogborn, Krieger 2017 meta-analysis | More weekly sets give more growth; the evidence reaches only about 10 sets per muscle | [PubMed 27433992](https://pubmed.ncbi.nlm.nih.gov/27433992/) (earlier research, side-session note C); [summary](https://biolayne.com/reps/issue-31/the-king-of-volume-metas/) | 2026-11-16/17 | Medium |
| Pelland et al. 2024 (preprint) | Counting an indirect set as half a set fits the growth data best; more volume helps, with smaller returns | [SportRxiv 460](https://sportrxiv.org/index.php/server/preprint/view/460) | 2026-11-17 | Medium (not peer reviewed when read) |
| Hevy article | 10 to 20 sets for growth; beginners can grow on 5 to 9; count a secondary muscle as 0.5 | [hevyapp.com/how-many-sets](https://www.hevyapp.com/how-many-sets/) | 2026-11-17 | High that Hevy says it (a marketing article, not research) |
| Boostcamp muscle tracker | About 10 to 20 hard sets a week; each set split by how much it hits a muscle (press = 1 chest, 0.5 triceps) | [boostcamp.app muscle tracker](https://www.boostcamp.app/features/muscle-tracker) | 2026-11-17 | High |

**Band used below:** at least 10 sets a week and at least 2 days a week for each main muscle; 10 to 20 is the normal range; above about 20 is "more than needed" for a beginner. Two counts: **direct** (sets where the muscle is the main one) and **weighted** (direct + 0.5 per set where it is a helper).

### 5.2 How the count was made

- Plan data: `app/js/plan/plan-v2.js` with its own `setsFor()` (so week rules are exact), read 2026-11-17.
- Muscles: the free-exercise-db entry each exercise uses for its photo (`app/js/plan/media.js` `lib`), with that entry's `primaryMuscles` and `secondaryMuscles` (read from `dist/exercises.json` on 2026-11-17, side-session note A). **Our app does not keep these muscle lists today:** `media.js` stores only the entry name and `plan-v2.js` one `muscle` word. The builders must add them.
- Script: a throw-away Node script in the worker's scratch folder (not committed). "Back" = lats + middle back. Shoulders are one region in free-exercise-db (no front / side / rear split); the split line below is ours, by exercise.
- **Caution:** free-exercise-db lists calves, hamstrings and glutes as helpers of the leg press and squats. That is generous (calves do little work in a squat). So the weighted column flatters calves and hamstrings. Trust the direct column for those two.

### 5.3 Our plan v2: muscle vs weekly sets

| Muscle (free-exercise-db) | Week 1 direct | Weeks 2-5 direct | Weeks 2-5 weighted | Weeks 7-11 direct | Days a week | Verdict |
|---|---|---|---|---|---|---|
| Chest | 6 | 9 | 9 | 12 | Mon, Wed, Thu | Just under 10 in weeks 2-5, fine from week 7. OK |
| Back (lats + middle back) | 8 | 12 | 15 | 14 | Mon, Wed, Thu | Good |
| Shoulders, all | 14 | 20 | 34.5 | 20 | all 5 | Plenty. Split: front 6 direct (+ about 4.5 from chest presses), side 8 (lateral raise on Wed, Thu, Fri), rear 6 (face pulls; + rows). **Excess on the whole shoulder** if counted weighted |
| Biceps | 4 | 5 | 11 | 5 | Mon, Wed | Low direct, fine weighted (rows and pulldowns help). Acceptable for a beginner |
| Triceps | 6 | 8 | 15.5 | 8 | Mon, Wed, Thu | Good |
| Quadriceps | 8 | 12 | 12 | 14 | Tue, Wed, Fri | Good |
| Hamstrings | 2 | **3** | 12 | **3** | **Tue only** | **Gap.** free-exercise-db counts the cable pull-through as a glute move, so only the Romanian deadlift (3 sets, Tuesday) is hamstring-first. The plan text counts 6. Either way: no knee-bend hamstring move at all (a leg curl is only a swap for a machine the gym may not have), and only 1 to 2 days |
| Glutes | 6 | 9 | 15 | 9 | Tue, Fri | Good (hip thrust twice, pull-through, plus squats and leg press) |
| Calves | 2 | **3** | 10.5 | **2** | **Fri only** | **Biggest gap.** 3 sets a week on one day, and only 2 in weeks 7-11 (D drops to 2 sets). The daily uphill walk is endurance work, not hard sets. The weighted 10.5 comes from free-exercise-db's generous helper list |
| Abdominals | 20 | **27** | 27 | **29** | all 5 | **Excess.** About 3 times the 10-set floor, more than chest and back together in weeks 2-5. Low fatigue, but about 7 minutes a day that could go to calves or hamstrings |
| Lower back | 0 | 0 | 4.5 | 0 | - | OK for a beginner (helped by the Romanian deadlift and squats) |
| Traps, forearms, neck, adductors, abductors | 0 | 0 | 0 to 1.5 | 0 | - | Not needed in a beginner plan; mid traps work in rows and face pulls although free-exercise-db does not list them |

Weeks 6 and 12 (easier weeks) have one set less everywhere, as planned. Week 1 has 2 sets per exercise, as planned.

### 5.4 Blunt summary

1. **Calves: 3 sets a week on 1 day (2 sets in weeks 7-11).** Far under any guideline. The plan says the walk works the calves; the walk is not resistance training.
2. **Hamstrings: 3 to 6 direct sets, no knee-bend move, 1 to 2 days.** Hip-hinge moves only. A seated or lying leg curl is the usual fix, but the plan has it only as a machine swap the first visit has not confirmed.
3. **Abs: 27 to 29 sets a week.** Far above need; the easiest place to free time for 1 and 2.
4. Smaller points: chest 9 in weeks 2-5 (fine from week 7); biceps 5 direct (fine counting rows); shoulders get a lot of total work (face pulls on a leg day plus 3 days of lateral raises).

These are research findings, not plan changes. Rosario's plan is not changed here; the master decides whether to ask Rosario (plan v2 section 14 already allows "add about 2 sets per muscle" at a new block).

### 5.5 How apps show balance (for the "whole plan" view)

- Hevy: a body diagram of the last 7 days with trained parts highlighted, and sets per muscle per calendar week with arrows between weeks ([muscle chart](https://www.hevyapp.com/features/muscle-group-workout-chart/), [sets per muscle](https://www.hevyapp.com/features/sets-per-muscle-group-per-week/), read 2026-11-17, High).
- Boostcamp: a front-and-back heat map (pale = little), a radar chart and a table, each set split by muscle share ([muscle tracker](https://www.boostcamp.app/features/muscle-tracker), read 2026-11-17, High).
- JEFIT: a body map per plan day, a percentage breakdown, and (paid) tap a muscle to add an exercise for it ([BodyMap blog](https://www.jefit.com/blog/introducing-bodymap-a-smarter-way-to-visualize-your-training), read 2026-11-17, High).
- None of the pages read draws a target band on the chart. A simple, honest version for us: one row per muscle with the weekly set count, a mark at 10 and 20, and words ("under 10", "in range", "a lot"), never colour alone.

---

## 6. Food tracking: what apps do and what it means for us

Facts are in the pattern table (section 1); full notes in side-session note B.

- **Logging the same food again is the fast path.** Every app read puts favourites and recent foods one step from the add screen; MacroFactor also sorts by "what you log at this hour" and goes straight back to search after each add. MyNetDiary claims one tap for a recent food.
- **Remember the last portion.** Only MacroFactor documents it, and it is the app that claims the fewest taps.
- **After a scan: one confirm page.** Name, portion box (pre-filled), Add. Unknown barcode: create a food with the barcode already filled in, so the next scan finds it (MacroFactor links own foods to a barcode; Cronometer lets you type the barcode when the camera fails; label photos fill numbers in Cronometer and MacroFactor).
- **Quick add** (calories and protein only, optional name) exists everywhere; MacroFactor does not save it as a food.
- **Meals:** most apps use fixed meals; MacroFactor uses a plain time list; MyNetDiary lets meals be renamed or removed. For one person, either works; it is a design choice for the mock-up.
- **Daily view:** MacroFactor and Cronometer flip "eaten / left"; MacroFactor makes the bar bolder at target and uses no red. No page found says how apps highlight protein.
- **Evidence on what helps people keep logging is thin** (small studies: people log less from Thursday to Sunday; steady logging early goes with more weight loss). "Show a weekly average" and "no red" are **design choices**, not proven facts.
- **Crowd data is often wrong.** Cronometer marks verified foods; Lose It! lets you fix a wrong entry and keep your fix. Our own Open Food Facts test returned a UK barcode named as an ice cream with a pack size of "1 gram" (section 8).

What this means for the Diet tab (for the builders, not a design):
1. First thing on the screen: today's calorie and protein numbers against the targets (from `profile.targets`, already on Today), then "Log again": Rosario's own recent foods, one tap adds with the last portion.
2. Scan, search, quick add and "copy yesterday" as the add ways. Search only when a word is submitted, never while typing (OFF limit, section 8).
3. Protein shown at least as clearly as calories (it is the number Rosario's goal depends on). Plain words for over or under ("120 kcal left", "15 g protein to go"); no red, no shame words; a 7-day average next to today.
4. Every food from the database is shown as "from Open Food Facts, check the numbers" until Rosario saves it; a soft warning when the numbers do not add up (kcal far from 4 × protein + 4 × carbs + 9 × fat).
5. Works offline: saved foods and the log are on the phone; only a new barcode or a search needs signal.

## 7. Barcode verdict

**Verdict: barcode scanning works in Rosario's Home Screen app, but only with our own decoder. Safari's built-in `BarcodeDetector` is off.**

| Question | Answer | Source (read 2026-11-17) | Conf. |
|---|---|---|---|
| Does Safari on iOS have `BarcodeDetector`? | **No, off by default** from Safari 17 to iOS 27.2 (only behind a hidden "Shape Detection API" feature flag). An open WebKit bug says it fails on iOS 18 even with the flag on | [caniuse](https://caniuse.com/mdn-api_barcodedetector); [MDN compat data](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/BarcodeDetector.json); [WebKit bug 281848](https://bugs.webkit.org/show_bug.cgi?id=281848) | High |
| Camera in a Home Screen app (`getUserMedia`) | Works since iOS 13.4 | [WebKit bug 185448](https://bugs.webkit.org/show_bug.cgi?id=185448) | High |
| How often is camera permission asked? | **Expect once per app launch.** An open bug (2026-10-12) says Home Screen apps ask on every launch with no way to keep it; the Safari camera setting does not cover Home Screen apps | [WebKit bug 327237](https://bugs.webkit.org/show_bug.cgi?id=327237); [WebKit bug 215884](https://bugs.webkit.org/show_bug.cgi?id=215884) | High (bug status) / Medium (behaviour) |
| ⚠️ Our hash routes | In standalone mode a change of the URL hash used to stop the camera. Our app routes by hash (`#/today`, `#/plan`). The scanner must stay on one route while the camera runs, and stop the camera before any route change | [WebKit bug 215884](https://bugs.webkit.org/show_bug.cgi?id=215884) | Medium |
| Video element | Needs `playsinline` and `muted` (and `autoplay`) or iOS goes full screen | [WebKit blog](https://webkit.org/blog/6784/new-video-policies-for-ios/) | High |
| Photo fallback `<input type="file" accept="image/*" capture="environment">` | Behaviour differs by report (camera or a choice sheet; a 2024 beta bug). Fine as a fallback; the decoder reads a still photo; no page camera permission needed | [WebKit bug 272571](https://bugs.webkit.org/show_bug.cgi?id=272571); [web.dev](https://web.dev/articles/media-capturing-images) | Low to Medium |
| WASM under our CSP | Blocked unless `script-src` has `'wasm-unsafe-eval'`; Safari supports it since Safari 16 | [MDN script-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src); [MDN compat data](https://raw.githubusercontent.com/mdn/browser-compat-data/main/http/headers/Content-Security-Policy.json) | High |
| Speed on an iPhone | No measured number found. Desktop: median 70 ms per hard still photo (vendor test). A cropped video band is smaller. **Measure on the phone** | [Dynamsoft benchmark](https://www.dynamsoft.com/codepool/benchmark-barcode-reading-javascript-zxing-wasm-dynamsoft-barcode-reader.html) | Medium (vendor) |

### 7.1 Decoders compared

Numbers from the npm registry, GitHub API and jsDelivr file lists, read 2026-11-17 (High).

| Decoder | Licence | Latest | Maintained? | Ready files to copy (raw bytes) | Verdict |
|---|---|---|---|---|---|
| **zxing-wasm** (reader build) | MIT wrapper; bundles zxing-cpp (Apache-2.0) and zint (BSD-3-Clause) | 3.1.7, 2026-11-15 | **Yes**, very active | `es/reader/index.js` 40,593 + `es/share.js` 11,435 + `reader/zxing_reader.wasm` 946,598 ≈ **1.0 MB** (or one IIFE file 37,020 + the wasm) | **Pick** |
| barcode-detector (same engine, standard API shape) | MIT | 3.2.4, 2026-11-15 | Yes | ponyfill 42,827 + the same wasm | Runner-up (only if we want to switch to Safari's own detector if Apple ever turns it on) |
| @zxing/library (pure JS) | Apache-2.0 | 0.23.0, 2026-04-29 | Maintenance mode, maintainer wanted | 362,150 | No |
| @zxing/browser | MIT | 0.2.1, 2026-07-06 | Slow | 441,121 | No |
| zbar-wasm | LGPL-2.1 | 0.11.0, 2024-05-22 | No push since 2024 | 12,938 + 238,653 | No (stale, LGPL) |
| quagga2 (pure JS, 1D only) | MIT | 1.13.0, 2026-10-21 | Yes | 157,403 | Fallback only if WASM ever fails (no CSP change, no evidence it reads as well) |
| html5-qrcode | Apache-2.0 | 2.3.8, 2023-04-15 | Maintenance mode, looking for owners | 375,364 | No |

**Recommended decoder: zxing-wasm 3.1.7, reader-only build, copied into the app (for example `app/vendor/zxing-wasm/`) with its LICENSE files.** Reads EAN-13, UPC-A and EAN-8 from video frames and from photos; no `eval`, no Worker, no blob links inside (checked in the file by helper C); it falls back if the server sends the wrong file type for `.wasm`.

Must-knows for the builder:
- **By default it fetches the `.wasm` from jsDelivr.** Our CSP would block that (good). The app must call `prepareZXingModule({ overrides: { locateFile } })` and point it to our own `.wasm` file ([zxing-wasm README](https://github.com/Sec-ant/zxing-wasm), High).
- The JS and `.wasm` versions must match (the library exports a version and a SHA-256 to check).
- Load it only when the scanner opens. Add the files to the `sw.js` offline list (a unit test checks that list against `app/`), so the scanner works offline after the first visit. About 1 MB more in the phone cache (photos are already about 5.4 MB).
- Check the EAN check digit before any lookup; a misread costs one of the 15 lookups a minute.
- Typing the digits is always offered (camera denied, dark room, damaged code).

**Exact CSP change (decoder + Open Food Facts, no product images):**

```
script-src 'self' 'wasm-unsafe-eval';
connect-src 'self' https://api.github.com https://world.openfoodfacts.org;
```

Everything else in the CSP stays the same. The `.wasm` fetch is covered by `connect-src 'self'`. No `worker-src` needed unless a builder moves the decoder into a Worker. `'wasm-unsafe-eval'` allows WebAssembly only, not JavaScript `eval()`.

## 8. Open Food Facts facts

| Topic | Fact | Source (read 2026-11-17) | Conf. |
|---|---|---|---|
| Barcode lookup | `GET https://world.openfoodfacts.org/api/v3/product/{barcode}?fields=…` is current and recommended; v2 (`/api/v2/product/…`) still works but is deprecated | [OFF API docs](https://openfoodfacts.github.io/openfoodfacts-server/api/) | High |
| Name search | Full-text search only in v1: `/cgi/search.pl?search_terms=…&search_simple=1&action=process&json=1&page_size=…&fields=…`; or the newer `search.openfoodfacts.org/search?q=…` (not tested) | [OFF API tutorial](https://openfoodfacts.github.io/openfoodfacts-server/api/tutorial-off-api/); [search-a-licious openapi.json](https://search.openfoodfacts.org/openapi.json) | High |
| CORS | **Open.** All 3 test requests answered `200 OK` with `Access-Control-Allow-Origin: *` (v2 product, v1 search, v3 on the UK host). A fetch from GitHub Pages works with no proxy | Helper C's test, 2026-11-17 18:17 GMT, sent with `User-Agent: TrainingApp/0.5 (personal web app)` and a dummy Origin | High |
| Rate limits | **15 product reads a minute per IP, 10 searches a minute per IP**; over the limit gives HTTP 503. Do not search while typing | [OFF API docs](https://openfoodfacts.github.io/openfoodfacts-server/api/) | High |
| User-agent rule | "Always use a custom User-Agent" (`AppName/Version (contact)`). A web page cannot set `User-Agent` in `fetch`. Practical: add `app_name=TrainingApp&app_version=…` to the URL (documented for writes) and/or an `X-User-Agent: TrainingApp/<version> (<public app repo link>)` header (the server allows it; it causes one pre-flight request, cached 20 days). **Never Rosario's name or email**; the public repo link is the contact | [OFF API docs](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/); test headers | High (rule) / not verified (whether OFF reads `X-User-Agent`) |
| Licence and attribution | Database ODbL, contents DbCL, product images CC BY-SA. Show "Contains data from Open Food Facts, available under the Open Database License" with links to openfoodfacts.org and the ODbL, where the data is shown | [OFF data page](https://world.openfoodfacts.org/data); [terms of use](https://world.openfoodfacts.org/terms-of-use) | High |
| UK coverage | uk.openfoodfacts.org: 200,983 products; "porridge oats" found 508 products. No official figure for how complete UK nutrition data is | [uk.openfoodfacts.org](https://uk.openfoodfacts.org/); test | High |
| Data quality | The UK test barcode came back as "Twix glacé" with pack size "1 gram". Crowd data can be wrong: Rosario must be able to check and edit before saving | Test 3 | High (one example) |
| Fields | Per 100 g: `energy-kcal_100g`, `energy-kj_100g`, `proteins_100g`, `carbohydrates_100g`, `fat_100g` (plus sugars, fibre, salt); per serving when known: `energy-kcal_serving`, `proteins_serving`, …; also `serving_size` (text), `serving_quantity` (number), `nutrition_data_per`, `product_name`, `brands`, `quantity`. Ask only for the fields needed (`fields=`); one test also sent a large unasked `nutriments_estimated` block | Tests 1 and 3 | High |
| Offline copy | Not possible on a phone: the food CSV is about 0.9 GB packed, about 9 GB unpacked | [OFF data page](https://world.openfoodfacts.org/data) | High |
| Product images | **Recommend none.** Each image would tell OFF Rosario's IP again, cost data, need CC BY-SA credit, and is not needed to log food. `img-src` stays as it is | Helper C's reasoning | - |

**Open Food Facts verdict: usable straight from the phone.** CORS is open, the limits are fine for one person (one call per scan), the UK has about 200,000 products, and the only data sent is the barcode or search word. Wrong crowd data is the real risk, so every looked-up food is checked by Rosario before it is saved, and saved foods then work offline.


---

## 9. Data model notes for the 2 builders (design notes, not code)

All new data follows ARCHITECTURE 4.1: a text `id`, `updated_at` on every change, tombstones (`deleted`, `deleted_at`) instead of removal, unknown fields kept. New lists are **optional lists** in `validate.js` (like `gym_spots`): an old file without them validates and comes back unchanged. Every new list must be added to `LISTS` in `sync/merge.js` and counted by `hasData`. An older app that meets a new list keeps it (merge.js already treats an unknown list of records as a list), but cannot show it.

### 9.1 Permanent plan edits (Rosario's answer 65: "forever" for that day of the plan)

Where the plan is read today: `engine/schedule.js daySlots()` reads `days[dayId].slots` from `plan-v2.js`, and `setsFor()` looks the slot up there again. Every screen (Today, the workout, Week 1, the Plan tab, the short day) goes through these two functions. That is the one place an edit must enter.

**Recommended shape: one record per plan day, holding the whole edited day (a snapshot).**

```
plan_days: [ {
  id: "p-plan-v2-mon",         // fixed per plan and day: two phones make the SAME id, so they merge into one record
  updated_at: "...",
  plan_id: "plan-v2", day: "mon",
  slots: [ { slot: "A1", ex: "chest_press", sets: 3, rest: null }, ... ],   // same shape as plan-v2.js days[].slots
  changes: [ { at: "...", what: "swap", slot: "A1", from: "chest_press", to: "db_bench_press" } ]   // optional, for "what did I change" text only
} ]
```

- **Why a whole-day snapshot and not one record per add/remove/swap:** the merge picks the later `updated_at` per record. Separate change records would need an order and could clash (remove A1 on one phone, swap A1 on the other). A whole day merges as one unit, like a session does today. For one person this is enough; two phones editing the same day at the same moment is not expected.
- **"Back to the plan's version" = tombstone** the record (`deleted: true`). The day falls back to `plan-v2.js`. Nothing in `plan-v2.js` is ever edited, so the plan test (`tests/plan.test.mjs`) stays valid.
- **The plan id is inside the id.** A future plan v3 (new block, week 12 review) does not inherit plan-v2 edits by accident.
- **History stays true.** A session already stores `plan_exercise` (what the plan said that day) and `done_exercise` per slot. Edits apply only to workouts **started after** the edit. A running workout is never changed by a Plan edit (the mid-workout swap stays for that, answer 65).
- **Progression carries over by exercise.** `exercise_state` is keyed by exercise (`x-<exercise id>`), and suggestions read the history of the exercise done. A permanently swapped-in exercise starts from its own history, or from the week-1 rules if it has none (the same rule as the mid-workout swap, DECISIONS row of 2026-11-17).
- **The slot grammar is a trap (delicate).** The engine knows only `A1 … C2` (pairs, regex `^[A-C][12]$`), `Abs1`, `Abs2` and `D`. Week rules hang on the names: weeks 7 to 11 add a 4th set to `A1`/`A2` and cut `D` to 2; the short day keeps `^[AB][12]$` and `Abs1`. So "add an exercise" has nowhere to go without an engine change (for example `A3` would not be treated as part of pair A, and a pair `D1` clashes with `D`). The builders must choose and show the rule on screen. Options: (a) adds only fill an empty slot of the grammar (for example `Abs2` on a leg day, or a third pair `C` where missing); (b) extend the grammar to `A3`/`B3`/`C3` and a pair letter `E`, with tests for every week rule and the short day. Either way: **tests first, in their own commit** (engine files are on the JUDGING "must not change" list; this is a deliberate, reviewed change).
- **Validation.** Every `ex` must exist in the exercise catalogue, `sets` between 1 and 5, `rest` from a fixed list, slot names from the grammar, no slot twice. A record that fails (for example from a newer app with an exercise this app does not know) is **kept in the file but not used**: the day shows the plan's version with a quiet line "This day was changed on a newer app version". Never drop it.
- **Time check.** The session is planned at about 90 minutes. Adding exercises adds about 2.5 minutes per set (work plus rest). The Edit screen should show "About N minutes" from the same `dayLayout` call Today uses.
- **Matching swaps need more data.** Today each exercise has one `muscle` word and free-text `equipment`. "Same muscle, same equipment" needs, per exercise: `primary` and `secondary` muscle regions (section 4) and an equipment class (`machine`, `cable`, `dumbbell`, `smith`, `bodyweight`). Public plan data, no body data. Machines the first visit did not find (`extra_machines`) stay hidden, as today.
- **The catalogue is small (37 exercises).** A matching list from 37 exercises is often 1 or 2 names. Growing it means adding photos (about 60 to 160 KB per exercise pair at 850 px; the app already caches about 5.4 MB). A curated 10 to 20 more exercises (for example a leg curl, a seated calf raise, a pec deck fly, a cable fly, a back extension) is enough; free-exercise-db is public domain and has photos for them.

### 9.2 Food log entries

```
food_log: [ {
  id: "f-20261117-k3f9qz", updated_at: "...",
  date: "2026-11-17",          // the local day it counts for
  meal: "breakfast" | "lunch" | "dinner" | "snack" | null,
  food: "fb-5000159484695" | "fo-…" | null,   // the saved food it came from (null for a quick add)
  name: "Porridge oats",       // a copy of the name at the time (clipped), so history reads right even if the food changes
  amount_g: 40, servings: null,
  kcal: 150, protein_g: 4.4, carbs_g: 24, fat_g: 3.2,   // worked out ONCE when logged and stored
  source: "off" | "own" | "quick"
} ]
```

- **Store the worked-out numbers in the entry.** If a saved food is corrected later, old days do not change silently. Totals for a day = the sum of that day's entries.
- One record per eaten item. Edit = new `updated_at`; delete = tombstone. Two phones never touch the same entry, so merges are clean.
- Placeholders only in tests and fixtures: never Rosario's real calorie or protein numbers.

### 9.3 Saved foods

```
foods: [ {
  id: "fb-5000159484695"       // barcode foods: the barcode in the id, so a scan on two phones makes ONE record
     | "fo-20261117-abc123",   // own foods without a barcode
  updated_at: "...",
  name: "...", brand: "...", barcode: "5000159484695" | null,
  per100g: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  serving_g: 40 | null, serving_label: "40 g" | null,
  last_amount_g: 40,           // "remember the last portion" (fast apps do this)
  fav: false,
  source: "off" | "own", off_fetched_at: "..." | null, edited: false
} ]
```

- **Do not store counters** ("used 12 times"). Two phones adding 1 each would lose one (the later record wins). Work out "recent" and "often" from `food_log` instead.
- The Open Food Facts reply is turned into this shape at once; only these fields are kept (no raw reply, no image links).
- Saved foods are the offline food list: a food scanned once works with no signal afterwards.

### 9.4 File growth (delicate: sync)

Rough sizes, measured with the example entry above on 2026-11-17: 251 bytes on the phone (compact JSON), 304 bytes in the GitHub file (the sync writes it with 2-space indents, `sync.js` line 142). At 6 entries a day that is about 0.55 to 0.67 MB a year of food entries, plus saved foods and tombstones (never removed). ARCHITECTURE 5.1 says the workout log is about 200 to 300 KB per 12-week block (so about 1 MB a year on its own), the app warns at 800 KB, and GitHub's contents API returns the file in the normal answer only up to 1 MB.

So **food in `progress.json` reaches the warning in months, not years.** Recommended for the builders and the master to decide before the Diet build: keep food in **its own file in the same private repo** (for example `food.json`), with its own sha, synced by the same code (`mergeDocs` is generic over lists, `sync.js` takes a path). A split by year (`food-2026.json`) can come later. This is a sync design change: tests first, Opus review (ARCHITECTURE section 12, items 2 and 3).

localStorage (about 5 MB) holds several years of both; ARCHITECTURE 6 already says move to IndexedDB only past about 2 MB.

### 9.5 Delicate parts (mark for Opus review)

1. **Data loss:** a food entry and a plan edit are saved at once on tap, like a set (`model.js`). A plan edit must never touch past or running sessions.
2. **Sync merge:** the new lists (`plan_days`, `food_log`, `foods`) in `LISTS`, optional in the validator, round-trip tests with the fake GitHub, "an old app keeps the new lists" test. If food gets its own file: a second sync path, the same 409/422 retry, never PUT over an unreadable file.
3. **Untrusted Open Food Facts text:** product names, brands and serving text are typed by strangers. Only through `h()` / `textContent`, never `innerHTML`; clip to a short length (for example 120 letters) and to `MAX_TEXT`; numbers checked (finite, not negative, kcal per 100 g at most about 900, each macro per 100 g at most 100, protein + carbs + fat per 100 g at most about 100); if kcal is missing but kJ is there, kcal = kJ / 4.184; if numbers look odd, show "Check these numbers" and let Rosario fix them before saving.
4. **Nothing personal leaves the phone:** an Open Food Facts call sends only the barcode or the search word. The GitHub token is added only by `sync/github.js` for `api.github.com`; the food lookup must be a separate fetch with no `Authorization` header and no stored data in the URL.
5. **Body data never in the public repo:** targets stay in `profile.targets`; tests and mock-ups use made-up numbers.

---

## 10. Not verified / blocked

Sites that refused automated reading (facts from them come from search snippets and are marked Medium or Low):
- help.hevyapp.com (2 articles, HTTP 403); help.fitbod.me and the Fitbod blog (403); acsm.org (403; ACSM numbers from press copy).
- MyFitnessPal support and blog (403); Lose It! help (403); Yazio help (403); one Cronometer support page (403) and one old address that did not resolve; MacroFactor features page (404).
- wiki.openfoodfacts.org (bot-protection page); search.openfoodfacts.org/docs (empty page; the openapi.json was read instead).

Not checked or not found:
- How training apps move between days, and what an expanded exercise card shows: no readable page says. Would need screenshots or the apps.
- The exact "matching exercise" rule of Hevy, Boostcamp, JEFIT and Alpha Progression: not stated anywhere read.
- Colour schemes of app body maps beyond "blue" (Hevy) and "pale = little" (Boostcamp); how food apps highlight protein; "last portion remembered" in apps other than MacroFactor.
- The body-map shapes were not drawn: region counts come from reading the source files. The original artist of the MIT polygons was not traced.
- Full texts of Schoenfeld 2017 and Pelland 2024 (summaries and abstracts only); the ACSM 2026 paper itself.
- Zxing-wasm's decode speed on an iPhone (no source); `capture="environment"` on iOS 27.2.1 in a Home Screen app (sources disagree); whether camera permission now survives a relaunch on iOS 27 (bug reports up to 2026-10-12 say no). All three: test on Rosario's phone.
- Whether GitHub Pages serves `.wasm` with the `application/wasm` type (zxing-wasm falls back anyway; check with one header request after deploy).
- Whether Open Food Facts reads `X-User-Agent` or `app_name` on reads; search-a-licious CORS and limits (not tested); the product image host.
- Gzip sizes of the decoder files (raw sizes only).
- Apple's advice on how many tabs an iPhone tab bar should hold (about five) was not re-read today; it matters because Diet would be a 6th tab (section 11).

No page contained text aimed at an AI.

## 11. Constraints for the 2 builders

Rules that do not change:
1. **Stack:** plain HTML, CSS and JavaScript modules in `app/`, no framework, no build step, no npm. The only outside code allowed is the self-hosted zxing-wasm reader (answer 63 a), copied with its licences. No script, font or image loaded from another site.
2. **CSP:** only the two changes in section 7. No `style` attributes (blocked): set sizes through CSSOM. SVG built with our own helpers (`ui/svg.js`).
3. **Never `innerHTML` with data.** Open Food Facts names, brands and serving text are typed by strangers: only through `h()`, clipped, numbers checked (section 9.5).
4. **Look:** DESIGN.md tokens (volt accent), 375 × 812, light and dark, Animations off and Reduce Motion, 44 px targets, one main button at the bottom, words with every colour, no celebrations or emoji. Ideas in our own words: never copy another app's look, logo or text.
5. **Body data never in the public repo:** mock-ups and tests use made-up calorie and protein numbers.
6. **The engine and sync files are on the "must not change" list** (redesign/JUDGING.md 3.1). Plan edits need `engine/schedule.js` to read the edited day (section 9.1), and food may need its own synced file (section 9.4). Both are deliberate, delicate changes: tests first in their own commit, then the change, then an Opus review (ARCHITECTURE section 12). The builders' mock-ups may show them; the build happens later in steps (answer 66).

What Rosario asked for (must be in both versions):
7. **Plan tab:** no Print button and no print tables; one day per page like Today, arrows to other days; exercise cards that open to show two body maps (left: this exercise; right: everything the day has worked up to this card); an Edit button to add, remove or swap for a matching exercise; a place to cross-check the whole plan's muscles (section 5.5 gives honest ways).
8. **Edits are for good** (answer 65): no "just today" choice in Plan edit; say plainly that the change lasts; a way back to the plan's version of the day; past and running workouts never change; the mid-workout swap stays as it is.
9. **Exercises and Machines move into the Gym tab** (the Machines list is already a duplicate of Gym).
10. **Diet tab:** food log, barcode scan that adds the food, own saved foods (offline), Open Food Facts lookup sending only the barcode or search word, the daily view against the calorie and protein targets, the OFF attribution line.

Things the builders must solve and show (open design points):
11. **A 6th tab.** The tab bar has 5 (Today, Progress, Plan, Gym, Settings). Diet makes 6, and more than about 5 crowds an iPhone tab bar. Each builder proposes a way (for example Settings moving off the bar) and the reviewer puts it to Rosario as a question.
12. **Which week the Plan day shows:** today's week by default, with the week's real sets (fixes problem 3 in section 2).
13. **Where "add" puts an exercise** (the slot grammar in section 9.1), and the "About N minutes" check.
14. **Matching list when the catalogue is small:** what shows when there is no same-equipment match.
15. **Camera:** the scanner stays on one route while the camera runs; expect one camera question per app launch; always offer "type the digits" and "take a photo"; one lookup per good scan, search only on submit.
16. **Crowd data:** a check step before a looked-up food is saved; a soft warning when numbers do not add up.
17. **Food file growth:** show in the notes whether food sits in `progress.json` or its own file; the reviewer turns it into a question for the master and Rosario.
18. **The plan cross-check findings** (calves, hamstrings, abs in section 5.4) are for the master to raise with Rosario. Builders must not change the plan; the cross-check screen simply shows the numbers.
