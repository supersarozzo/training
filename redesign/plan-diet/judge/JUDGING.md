# Judging 8.30 · Plan, Gym and Diet: builder A vs builder B

Worker 8.30 (Opus), the judge. Date 2026-11-17. Read-only on `a/` and `b/`; nothing in `app/`, `tests/`, `docs/` or
`STATUS.md` was changed. Versions judged: **A at 2b37e94** ("fastest at the gym") and **B at 1f0b752** ("see your body").
The live app is **0.4.1** (`app/`). Mock-up page for Rosario: `mockup.html`, published as a private artifact
(https://claude.ai/artifact/3PXi5fxUPPUCou1D4Hfw52), built by `build/build.py` from `build/mockup.template.html`
(`python redesign/plan-diet/judge/build/build.py`). Checker brief: `build/checker-brief.md`. Checker result: `CHECK.md`.

## 0. How I judged

- Served the repo root with `python -m http.server 8830 --bind 127.0.0.1`. A ran at `localhost:8830`, B at
  `127.0.0.1:8830` (two origins, so their saved data never mixed). The live 0.4.1 app ran at `localhost:8830/app/` with
  A's made-up sample data (A copies the app's data format), so the OLD screenshots show the real Plan and Gym tabs.
- 375 x 812, light and dark, in the app's browser pane. The pane was hidden, which pauses entrance animations, so
  screenshots were taken with Animations off (Reduce Motion on). Motion on was checked in the code (section 6).
- Taps measured by script in the page (each `click()` counted), not taken from the builders' reports.
- Muscles checked against the free-exercise-db table in research side note A (section 4 there).
- Safety by `grep` over both `js/` folders and the CSP in each `index.html`.
- One real Open Food Facts lookup through B (barcode 3017620422003, only the barcode sent). A's lookup was not repeated
  (A's own report and B's review both ran it).
- Builders' own screenshots were compared side by side as contact sheets (light and dark).

## 1. Scores (1 = poor, 5 = very good)

| Criterion | A | B | Why |
|---|---|---|---|
| Nothing lost (against live Plan tab, print excepted) | 5 | 5 | Both carry every item: day lists, focus, walk, sets × reps, rest, the "Swap:" line, the 12 weeks, RIR line, Exercises, Machines, the exercise sheet. Slot letters (A1, B2) become pair headers in both. |
| Speed at the gym (measured) | 5 | 4 | Swap = 3 taps from the day page in both (measured). A shows the walk and the first exercise without scrolling; B's day map pushes the first exercise below the fold. A's floating arrow bar lets cards show through (bug A-2). |
| Clarity on a phone | 4 | 3.5 | A: dense cards in plain words ("Front thighs · helps calves…"), two numbers per muscle row, a calm "4 things stand out". A's map legend mixes two scales ("main / 6+ sets"). B: clear tiles and "Day so far · 3 of 7", but its day map says "Hamstrings 6" while its check says "Hamstrings 3", and the check flags 7 muscles "Under 10" (lower back included). |
| Look and motion | 3.5 | 4.5 | B's body drawing reads as a body at 375 px; day slide, glow-in on the build-up map, dark toast in both looks. A's polygon figures are small and angular. Both respect Reduce Motion and Animations off. |
| Body maps: accuracy | 4.5 | 4.5 | Both match free-exercise-db exactly for all 27 plan exercises. The 9 swap-only exercises are the builders' own reading in both (A marks them `own: true`; B does not mark them, and its readings differ from A's, e.g. seated row machine main muscle lats vs mid back). A's "Day so far" words drop lower back 1.5 after the Romanian deadlift. |
| Body maps: at 375 px | 3 | 4.5 | A cannot tell lats from mid back (one region) or side from rear shoulder. B splits front / side / rear shoulders and lats / mid back / traps, as the plan counts them. |
| Diet flow | 4 | 4.5 | Both: scan layer on one route, digits with a check-digit test before any lookup, one search box for words or digits, Log again with one-tap add and Undo, check step, OFF credit. A: portion starts at the pack's serving (43.1 g), "Only the barcode number is sent" while looking up. B: more scan cases (misread keeps the camera open), "The numbers add up", meals preselected by the clock, 20 s timeout. B's portion starts at 100 g (Nutella: 539 kcal by default). A has no timeout on the lookup. |
| Safety | 4.5 | 4.5 | No `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval` or style attributes in either. Sizes through CSSOM. OFF calls: `credentials: "omit"`, `referrerPolicy: "no-referrer"`, `cache: "no-store"`, only the barcode or word. CSP equals research section 7 minus `'wasm-unsafe-eval'` (no decoder yet, correct for a prototype). B's CSP drops `api.github.com` (no sync in B): the build must keep it. A copied the whole app, sync and token code included, into a public folder: delete both prototype folders after the build. |
| Edit correctness (delicate) | 4 | 2.5 | B has two bugs that put the same exercise twice in a day (B-1, B-2), still there at 1f0b752. A hides the plan's own swap for the Romanian deadlift (A-1) and prints "null" in the Add sheet (A-3, new). |

**Overall pick: a mix.** A's Plan day and A's edit rules (fast and correct), B's body drawing and B's exercise layer,
B's Diet scan and check step with A's fixes, and B's gear on every tab. A gives the base for speed and data safety; B
gives the look of the body.

## 2. Tap counts (measured by script, from the screen named)

| Task | A | B |
|---|---|---|
| See Thursday (from another tab) | 2 (Plan, Thu) | 2 (Plan, Thu) |
| Swap an exercise (from the day page) | **3** (card, Swap, pick) | **3** (card, Swap, pick) |
| Swap from another tab | 4 | 4 |
| Log a new scanned food | 3 + the read (Diet, Scan, Save and add) | 3 + the read (Diet, Scan a barcode, Save food and add), checked with a real lookup |
| Log a usual food again | 2 (Diet, +) | 2 (Diet, +) |

The camera read is a stand-in tap in both prototypes ("Try a sample scan" in A, "pretend read" chips in B) and is not
counted.

## 3. Bugs

| # | Version | Severity | Steps (reproduced by me) | What happens | Fix in the merge |
|---|---|---|---|---|---|
| B-1 | B 1f0b752 | Medium, delicate | `?reset=1`, Plan, Tuesday, Leg press, Swap, tap "Leg extension · Already on Tuesday" | `plan_days` Tuesday = `A1=leg_extension … D=leg_extension`: Leg extension twice (toast "Tuesday changed for good: Leg press → Leg extension"). The row is a normal button. | Exercises already in the day are named but never offered (A's rule). Unit test: no exercise twice in a day. |
| B-2 | B 1f0b752 | Medium, delicate | `?reset=1`, Plan, Edit Tuesday, Add an exercise, Hamstrings, Romanian deadlift | `Abs1=romanian_deadlift`: the deadlift twice, the second in an abs place with abs rests. | Add never offers an exercise already in the day; an added exercise gets its own rest, not the place's (question 72). |
| B-3 | B 1f0b752 | Low | Plan, Whole plan check | "Lower back 0 sets · Under 10", although lower back is not a target. | A's wording: "No own exercise; fine for a beginner", no verdict. |
| A-1 | A 2b37e94 | Medium | `?reset=1`, Plan, Tuesday, Romanian deadlift, Swap | "No other exercise in the app works the back thighs…". Cable pull-through, the plan's own swap, only appears under "other muscles", unmarked. | The plan's own swaps are always offered first, marked "Plan's pick" (B's rule). |
| A-2 | A 2b37e94 | Low | Plan, any day, look at the bottom | The "‹ Monday · Wednesday ›" bar has no background: card text shows through between the buttons. | A solid frosted bar like the tab bar (drawn on the mock-up). |
| A-3 | A 2b37e94 | Low (new) | Plan, Edit, Add an exercise | A literal "null" is printed under the exercise list (shot `shots/bug-a3-null-add-sheet.jpg`). | A null child is turned into text: render nothing. |
| A-4 | A 2b37e94 | Low | Exercise layer, Romanian deadlift | "Day so far" words leave out lower back 1.5 (B lists every helper). | Words list every group with sets, as B does. |
| A-5 | A 2b37e94 | Low | Diet lookup | No timeout on the Open Food Facts fetch (B gives up after 20 s). | 20 s timeout with "Open Food Facts did not answer" text. |
| B-4 | B 1f0b752 | Low | Scan a new product (Nutella) | The portion starts at 100 g, not the pack's serving. | Start at the pack's serving when known (A's way), else the last amount, else 100 g. |
| S-1 | both | Low (shared, from 0.4.1) | Settings, Animations switch | 34 px tall, under the 44 px rule. | Fix in the app. |

The builders' claims checked: A's B-1, B-2 and B-3 are real in B's latest version. B's bug 1 (A-1) and bug 2 (A-2) are
real in A's latest version. B's bug 3 ("no gear on Plan, Gym, Diet in A") is a design point, handled by question 67.

Not a bug: B's Gym says "3 of 14 noted" against 0.4.1's "2 of 15": B's sample data marks the pec deck as not in the
gym, and the Gym list hides such machines (the app's own rule).

## 4. Per-screen pick

| Screen or layer | Pick | Why |
|---|---|---|
| Tab bar and Settings | **B** (gear on every tab), order: question 68 | Same place on every tab; A had a "Settings" pill on Today, a gear on Progress and nothing on Plan, Gym and Diet. |
| Plan day | **A**, plus B's focus words and done ticks in the strip (A already took them), B's "Whole plan check" card at the end of the day | First exercise visible without scrolling; plain muscle words on the cards; A's arrow bar gets a solid background. The Muscles chip moves to the end of the day because the top row now holds the week chip, Edit and the gear (no room for 4 buttons at 375 px). |
| Exercise card (closed) | **A** (photo, sets × reps, "Front thighs · helps …", small map) | Both now have the small map; A's words are plainer. |
| Exercise layer (open) | **B** layout with A's words | Bigger maps, "A little / More / Most" legend (one scale), number tiles, "Day so far · 3 of 7", Previous / Next named after the neighbour (A). |
| Body drawing | **B** (question 71) | Reads as a body at 375 px; shoulder parts and back parts the plan counts. |
| The 12 weeks | **A = B** (same sheet, live words) | Picking a week shows its real sets on every day. |
| Edit mode | **A** | Swap / Remove on every card, "Add an exercise (2 of 2 left)", "Done editing"; edits reach Today (wired in A). B's sets stepper is not taken: Rosario asked for add, remove and swap. |
| Swap sheet | **A + B's rule** | A excludes exercises already in the day; B always offers the plan's own swaps ("Plan's pick"). |
| Add sheet | **A** (question 72) | Add at the end, on its own; B's free places are mostly abs places (bug B-2). |
| Changed day | **A** card ("Changed by you · 17 Nov") **+ B's confirm** on "Back to the plan's Tuesday" (question 73) + A's 8 s Undo | The biggest change on the tab gets one question; every other edit keeps Undo only. |
| Running workout | **A = B** | Both lock the running day with the same card. |
| Whole-plan muscle check | **A** rows ("9 · 9") and "4 things stand out", **plus B's** shoulder part rows and "Not trained on purpose" | A does not cry wolf; B shows the shoulder split without calling one part "Under 10". |
| Gym · Machines | **A = B = 0.4.1** under a Machines / Exercises switch | Unchanged list and cards. |
| Gym · Exercises | **A** (question 75) | Grouped by main muscle, the same groups as the swap list and the check. B's mini map per row is added. |
| Diet day | **A** layout (4 ways row, Log again list with "had today", bottom bar "Your foods · Scan") with the totals card and food list of question 76/77 | No second Scan button (B had Scan in the row and at the bottom). |
| Scan layer | **B** (misread keeps the camera open, camera note) + A's "Looking it up · Only the barcode number is sent" | More real cases covered. |
| Type the digits | **A = B** | Both test the check digit before any lookup. |
| Search | **A** sheet (Scan / Quick add / Copy yesterday, search box, Your foods offline, Make a new food) | One box for words or digits; saved foods first, search on submit only. |
| Check step | **Mix**: A's header and soft warnings, B's fields and "The numbers add up.", A's serving default, B's meal row if question 76 b | Fixes B-4; keeps B's reassurance line. |

Where A and B are both good and I could not pick firmly: totals as rings or bars (question 77), food list by meal or by
time (question 76), Gym exercises grouped or A to Z (question 75).

## 5. Questions for Rosario (on the mock-up page, numbered from 67)

67 Settings off the tab bar (gear on every tab / "More" tab / 6 tabs) · 68 tab order · 69 day arrows bottom or top ·
70 big day map at the top of the Plan day · 71 body drawing A or B · 72 where "Add" puts an exercise · 73 confirm on
"Back to the plan's day" · 74 plan cross-check gaps (calves, back thighs, abs): keep the plan or ask for a review ·
75 Gym exercises grouped or A to Z · 76 Diet list by meal or by time · 77 totals as rings or bars · 78 food in its own
synced file or in `progress.json` · 79 Open Food Facts search UK only or all countries.
Each has options and a "Recommended" answer on the page.

## 6. Motion and Reduce Motion

Both keep the app's rule (`html[data-motion="off"]` and `prefers-reduced-motion`: every animation and transition 1 ms,
one iteration). A's new motion: toast rise, bar grow on the check, scan line, spinner. B's: day slide from the side it
came from, card stagger, glow-in on the build-up map, toast, scan laser (B also sets `animation: none` on the laser),
a shake on a misread. All only `transform` and `opacity`. Not seen frame by frame (the pane was hidden).

## 7. Merge plan for the build steps

One chat per step, each with its gap list against the approved mock-up, checker + auditor PASS, Rosario's OK, commit.
Delicate steps (marked ⚠) are Opus with tests first in their own commit (ARCHITECTURE section 12).

1. **Muscle and equipment data** ⚠ (public plan data): `muscles` (main, helpers) and an equipment class per exercise in
   `plan-v2.js` or a new `plan/muscles.js`; front / side / rear shoulder split as ours. A unit test checks the 27 plan
   exercises against free-exercise-db and the 9 swap-only ones get their real database entries (or a marked own
   reading). Body drawing files copied with their licence (body-muscles: LICENSE + NOTICE + "what we changed").
2. **Plan day page, read-only**: strip with focus and ticks, week chip and the 12 weeks sheet (real sets per week), walk
   card, pair headers, cards with small maps, exercise layer with two maps, tiles and Previous / Next, the "Whole plan
   check" entry. Print button and print CSS removed (PRD F3 print part). Exercises and Machines move to Gym. Settings
   to a gear on every tab, 5 tabs (questions 67, 68).
3. **Plan edits, data and engine** ⚠: `plan_days` records (one whole day per record, id `p-plan-v2-<day>`, tombstone
   for "back to the plan's day"), optional list in `validate.js`, `LISTS` in `merge.js`, counted by `hasData`;
   `daySlots()` / `setsFor()` read the edited day; slot grammar for added exercises (question 72 a: `E1`, `E2` with
   their own rest, every week rule and the short day tested); records an older app cannot read are kept, not used.
   Rules with tests: never the same exercise twice in a day; the plan's own swaps always offered; past and running
   workouts never change.
4. **Edit UI**: Edit mode, Swap sheet (same muscle, other equipment, Plan's pick, "Already in Tuesday", machines not
   found hidden with a line, "Show exercises for other muscles"), Add sheet, Remove, 8 s Undo toasts, "Changed by you"
   card, confirm on "Back to the plan's day" (question 73), running-workout lock.
5. **Whole-plan muscle check** screen (A rows + B's shoulder parts + "Not trained on purpose"); counts from the same
   function as the layer's "Day so far". Plan review only if Rosario answers 74 b, in its own chat.
6. **Food data and sync** ⚠: `food_log` and `foods` (research 9.2, 9.3: numbers worked out once and stored, barcode
   in the id, no counters); its own synced file `food.json` if question 78 a (second sync path, same 409/422 retry, round
   trip with the fake GitHub, never PUT over an unreadable file).
7. **Diet tab UI**: day view (questions 76, 77), 4 ways, Log again with Undo, Quick add, Copy yesterday, search on
   submit only (question 79), Your foods offline, check step with soft warnings and the add-up line, OFF credit on every
   sheet with their data. CSP `connect-src` adds `https://world.openfoodfacts.org`. OFF text only through `h()`,
   clipped to 120 letters, numbers range-checked (research 9.5). 20 s timeout, 10 reads and 8 searches a minute.
8. **Barcode** ⚠: self-hosted zxing-wasm 3.1.7 reader build with its licences, `prepareZXingModule` pointed at our own
   `.wasm`, CSP `script-src 'self' 'wasm-unsafe-eval'`, files in the `sw.js` offline list (and its test), scanner on one
   route, camera stopped before any route change, check digit before lookup.
9. **Device check** on Rosario's iPhone (camera permission per launch, `capture="environment"`, decode speed, Home
   Screen gaps), then version bump and push only on Rosario's typed yes.
10. Delete `redesign/plan-diet/a/` and `b/` after the build (A holds a copy of the sync and token code). Done by worker
   8.43 on 2026-11-18 (Rosario's answer 96 a); the files stay in the git history before that commit.

## 8. Not verified

- Real camera and barcode decoding (both prototypes draw the camera).
- Motion on, frame by frame (pane hidden); VoiceOver; a real iPhone or Safari; widths under 375 px.
- Sync of `plan_days`, `foods`, `food_log` (no sync in either prototype).
- The 9 swap-only exercises' muscles against free-exercise-db.
- Open Food Facts search limited to UK products (question 79): not tested by anyone.
- A's Diet "Make a new food" and "Copy yesterday" end to end (A's own report says so too).
