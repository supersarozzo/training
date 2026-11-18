# Change notes

What is new in each app version, in plain words. Newest first. Older versions: see `docs/HANDOVER.md` and the git log.

## 0.7.0 · 2026-11-18

The Diet part of the Plan, Gym and Diet redesign (build steps 6, 7 and 8 of `redesign/plan-diet/judge/JUDGING.md`
section 7), built by chat 8.38 on top of 0.6.0. Rosario's answers 62, 63 a, 64 a, 76 b, 77 b, 78 a, 79 a.
0.6.0 is already on GitHub; 0.7.0 is not pushed until Rosario types "push": that one push sends 0.7.0.

**A Diet tab** (5 tabs now: Today · Plan · Gym · Diet · Progress)
- Today's food against your targets: two rings, protein first, then calories ("76 g to go", "1,550 kcal left"),
  a carbs and fat line, and the average of the last 7 days. The targets are the same numbers Today shows.
- Today's foods by meal: Breakfast, Lunch, Dinner, Snacks. The meal is picked from the clock; you can change it.
- Four ways to add food: Search, Digits, Quick add, Copy yesterday. "Log again" adds a usual food with one tap.
  Every add has Undo for 8 seconds. Tap a food to change the amount or the meal, or remove it.
- Your foods work with no signal. "Make a new food" for anything without a barcode.
- Download a food backup and restore it from a file (food is only on this phone until GitHub sync is set up).

**Scan a barcode**
- The camera reads the barcode on the pack (EAN-13, EAN-8, UPC-A). The reader is open source and lives in the app
  itself (zxing-wasm 3.1.7), so it works offline after the first open and nothing is loaded from other sites.
- The last digit of a barcode is checked first: a misread keeps the camera open and makes no lookup.
- "Type the digits" and "Take a photo" are always there, also when the camera is refused.
- The camera stops when the scanner closes, when a barcode is read, and when the app goes to the back.

**Open Food Facts**
- A scanned barcode or a searched name is looked up on Open Food Facts. Only the barcode number or the search
  word is sent. Name search shows UK products only.
- Every food from Open Food Facts is checked by you before it is saved ("Check before saving"), with soft warnings
  when the numbers look wrong (for example "The pack size says 1 gram"). The credit line for their data is on
  every sheet that shows it.

**Food sync**
- Food syncs in its own file, `food.json`, in the same private GitHub repo, with the same rules as the workout log.
  A food sync problem never changes the workout log, and a damaged food box never stops Today or Settings.

## 0.6.0 · 2026-11-18

Rosario's batch of 2026-11-18 (chat 8.35). Decisions: `docs/DECISIONS.md` (rows dated 2026-11-18) and the personal
trainer's `docs/plan/2026-11-18-trainer-decisions.md`.

**Today is the gym day**
- A Monday to Friday picker at the top: pick any day of this week (done days have a tick). Start or Short day trains
  the picked day, step by step. A day that is not the calendar's day is saved as a swap.
- The list shows each exercise's reps and the weight to use.
- In a set, **Stop this exercise here** moves on with the sets done so far (it asks first, Undo for 8 seconds).
  Fewer reps than the target are saved as typed.
  After a stop, the next workout keeps the same weight for that exercise.

**Plan is the plan to edit and the overview**
- No day buttons at the bottom any more: the day strip at the top picks the day.
- Every card shows the weight to use ("40 kg", or "Find it in week 1" / "Pick a light weight" before your first log).
- **Edit** has a new **Change** button: sets for that day, reps (low and high) and weight for that exercise.
  One Save, one Undo. A weight you set is used next time; after that the app counts up from what you log.
  While a workout is running, Change waits until it ends (a running workout never changes).
- The opened exercise shows the how-to photo first and the muscle maps under it, plus a Weight tile.
- The back view of the body map shows the back of the head (no face). Presses now light the front of the shoulder.

**The walk** (decided by the personal trainer from cross-checked sources, not asked of Rosario)
- Walk first, 30 minutes: kept. Top speed 5 km/h (was 6), top slope 12 % kept; the suggestion never goes above the top.
- "Change speed or slope" before the walk: a small change (0.5 km/h, 2 %), never above the top.
- Muscle data: the trainer checked all exercises against 2 sources and fixed the ones that were wrong.

**Light and dark**
- Settings > Look (Auto, Light, Dark) now reaches every part: page, bars, form controls, the phone's top strip.
  Switching is instant, with no fade.
- The gear icon (read as a brightness button) is gone from Today, Plan, Gym and Muscles. Settings is a button with the
  word "Settings" on Progress.

## 0.5.0 · 2026-11-18 (live since 2026-11-18, commit 20cdbbd)

The Plan and Gym part of the Plan, Gym and Diet redesign (build steps 1 to 5 of
`redesign/plan-diet/judge/JUDGING.md` section 7). Diet, food sync and the barcode reader come later (steps 6 to 8).

**Plan tab**
- One day per page, like Today: day strip with done ticks, walk first, pairs in words, small body map on every card,
  arrows to the day before and after at the bottom. The 12 weeks sheet shows each week's real sets.
- Tap an exercise: two body maps ("This exercise" and "Day so far"), Sets, Reps, Rest, Stop with, Previous and Next.
- **Edit** a day: Swap, Remove, Add an exercise (at the end, 3 sets, 60 s, at most 2 a day). Each change saves at once
  and lasts for that day of the plan, every week. Past workouts and a running workout never change.
- Every change shows an Undo button for 8 seconds.
- A changed day shows "Changed by you" with what changed, and "Back to the plan's Tuesday" (it asks first).
- Today shows the changed day too (exercises and minutes).
- **Muscles**: the "Whole plan check" card opens weekly sets per muscle for the whole plan, with what stands out.
  It only shows numbers and never changes the plan.

**Plan change** (answers 80 to 83): calf raises on the leg press on Monday and Wednesday, a dumbbell lying leg curl on
Thursday, one abs exercise less on those days. New moves start with 2 sets in their first workout.

**Gym tab**: Machines (as before) and Exercises (every exercise grouped by muscle).

**Settings** is the gear at the top right of every tab. The Print button is gone.

**Words**: the 12 weeks list says "Sets as shown on each day" (answer 85 a).

**Behind the scenes**: saved Plan edits sync as one record per day (`plan_days`); a day saved by a newer app version is
kept and shown as the plan, never overwritten. 422 tests.
