# Change notes

What is new in each app version, in plain words. Newest first. Older versions: see `docs/HANDOVER.md` and the git log.

## 0.7.1 · 2026-11-18

Leftovers wave, built by chat 8.39 on top of 0.7.0. The trainer (8.37) decided every training rule. Not pushed yet.

**What you found on the iPhone**
- The top of the app is sharp again. The soft blur under the clock is drawn by iOS itself and a web app can not turn it
  off. The app no longer puts a green glow there, and each screen starts a little lower, below that blur.
- You can start a workout before the plan's first Monday. Those days are practice days: "Practice week · Learn, find
  weights", with the same Start button and day picker as week 1, 2 sets, about 3 reps left. The plan's start date does
  not move. In week 1 an exercise you practised starts at the weight you found.
- Every exercise shows a weight to try, for example "Try 20 kg", with "First try. Set 1 tells us if it is right." The
  find-your-weight steps then correct it. The numbers come from the trainer's table and never from your body weight.
  An exercise you first do in week 2 or later says instead: "Set 1 too easy (4 or more reps left) or too hard? Change
  the weight one step for the next set."
- After "It hurts" with nothing logged yet, the new exercise starts below its own first-try weight, never above it.
- A double tap no longer zooms the page. Pinch to zoom still works.
- Plan: the Edit button sits at the top right again, in line with the cards.
- The walk shows its real numbers for each day and week, for example "4 km/h · 2 % slope", on the Plan day page and on
  Today. Tuesday and Friday (leg days) are 2 % less steep. Today's walk tile shows the walk of the day on screen, the same
  numbers as the Plan. Changing the walk in Plan Edit comes in a later version.

**From the trainer**
- In the practice week and weeks 1 to 3, the first exercise on Wednesday and Thursday has a short note: if those
  muscles are still very sore, use one step lighter; joint pain, skip it today.

**Workouts**
- Warm-up sets are shorter: a big lift gets two warm-up sets only when its muscle is the first of the day; a small
  exercise (curls, raises, pushdowns) gets one light set; an exercise whose muscle you already worked that day gets
  none. Saves about 2 minutes a day.
- Stopped an exercise early twice in a row, and missed the reps both times? Next time it is one small step lighter.
  This never happens in week 1 or the easier weeks, and never for planks, crunches or other bodyweight moves.
- The Stop question now says: "Does it hurt? Use Swap › It hurts instead."
- Weeks 7 to 11: on Monday, Wednesday and Thursday the last exercise (calf raise, leg curl) keeps 3 sets, and the
  plank or side plank has 1 set. Leg days do not change. (Workouts already started keep their sets.)
- A weight you set in the Plan on the morning of a workout no longer wins after that workout. The app now saves the
  time, not only the day.
- "Last time" and the Progress rows show all your sets when you did the same exercise twice in one workout.

**Plan and Gym**
- The cable pull-through is listed under Glutes, as its muscle data says.
- The Muscles screen counts each set once per row: rows now count for the lats and the middle back, and "Back" does
  not count them twice.
- The Add sheet and the Change sheet say "in week 8" when you look at another week, not "this week".
- The Change sheet's weight box is empty when the app has no weight yet (no more "0 kg"). The Plan says "Pick a light
  weight" in one way only.

**Settings, Today and Diet**
- Settings shows a food line ("Food synced …" or what went wrong). "Send to GitHub" says "Workouts synced. Food did
  not sync: …" when only the food failed.
- "Set up GitHub" now says where: "in Progress › Settings" outside Settings, "below" inside Settings.
- Today: the Start workout button no longer covers the last line.
- Diet: each food shows its protein in bold, then the calories, and the time it was added (or last changed).
  After Undo, the whole Diet screen behind an open sheet updates at once (rings, "Log again", the food line).
- Small fixes: the week chip stays on one line; the small "Settings" link on Today is easier to tap; the walk shows
  "5" in both places; the body map outline is easier to see in dark mode.

## 0.7.0 · 2026-11-18

The Diet part of the Plan, Gym and Diet redesign (build steps 6, 7 and 8 of `redesign/plan-diet/judge/JUDGING.md`
section 7), built by chat 8.38 on top of 0.6.0. Rosario's answers 62, 63 a, 64 a, 76 b, 77 b, 78 a, 79 a.
Pushed on Rosario's "push" (0.6.0 was already live).

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
