# Change notes

What is new in each app version, in plain words. Newest first. Older versions: see `docs/HANDOVER.md` and the git log.

## 0.7.4 · 2026-11-18

The editable walk and the food counter, built by chat 8.41. Not pushed yet.

- **You can change a day's warm-up walk.** In Plan, tap Edit, then Change on the walk card. Set the speed, the slope
  and the minutes. Your trainer's limits apply: 2 to 5 km/h, slope up to 12 % (10 % on Tuesday and Friday, the leg
  days), 10 to 30 minutes. The change lasts for that day every week, like your other Plan changes, and you can undo
  it for 8 seconds. "Back to the plan's walk" gives the app's walk back.
- A changed day says so: "Your own walk. The walk rule does not change this day." Under 30 minutes, one line reminds
  you that the week then has less than 150 minutes of walking. After a break of 2 weeks or more, the app still makes
  that day's walk easier for one week.
- Today and the Plan show the same changed walk. A workout that is already running keeps the walk it started with.
- A changed walk stays the same every week: the app no longer makes that day's walk harder by itself. Other days still
  follow the walk rule. Before you start, the walk screen still lets you change speed and slope a little.
- **Grams or Pieces for food.** "How much did you have?" has a switch: Grams | Pieces. Pieces works for every food: so
  you can put 2 eggs instead of 125 g. The first time, the app asks how much 1 piece weighs and keeps it on the food
  (you can change it later). The sheet opens in the way you used last for that food. The app still saves grams.
- Two safety fixes found by the reviewers: a walk you reset can no longer come back from a phone still on 0.7.3, and the
  walk sheet no longer saves a break week's easier numbers for good.
- **No double-tap zoom, second guard.** A quick second tap no longer zooms the screen, and it still counts as a tap
  (for example a fast second + on a number). Typing fields work as before, and pinch zoom still works.
- For later builders: a test now fails when an app file changes but the version number does not.

## 0.7.3 · 2026-11-18

The update fix, built by chat 8.40. Live since 2026-11-18 16:23. The editable walk moves to 0.7.4.

- Your iPhone did not get 0.7.1 and 0.7.2: the "New version ready" bar never showed and the app stayed old. Two
  mistakes in the app's offline helper (the service worker) caused it:
  - It looked for each app file in every saved copy of the app, oldest first. Safari can switch to a new version
    without running the step that deletes the old copy, so the old files kept winning.
  - When it downloaded a new version, the phone could hand it files it had kept from a few minutes before, so the
    "new" copy could hold old files.
- Now the app uses only the copy of its own version, downloads every file fresh, checks that it really got the new
  version, and tries a file again if the signal drops. If a download still fails, the old version keeps working and
  the app tries again later. Your saved data is never touched by any of this.
- The fix is in the helper itself, so your phone picks it up by itself the next time the app opens with internet.
- Settings starts with a new card: **Version 0.7.3** and an **Update** button. The button looks on the website for a
  newer version and, if there is one, gets it and restarts the app. It says "You have the newest version.", "No
  signal. Try again later." or "The website is still updating. Try again in 10 minutes." when there is nothing to do. It is off during a workout. It is part of the new version,
  so it helps from the next update on.
- The bar can still stay away if you close the app before the download ends. Then the next open, or the one after,
  runs the new version or shows the bar.

## 0.7.2 · 2026-11-18

Automatic sync, built by chat 8.39 on top of 0.7.1. Not pushed yet.

- The app sends your changes to GitHub by itself while it is open: about 10 seconds after you change something, and
  when you leave the app. A burst of changes is sent as one. You do not need to press anything.
- It can not send while the app is closed: that is an iPhone limit. Open the app and it sends what is waiting.
- During a workout nothing is sent; the workout goes when you finish it, as before.
- No signal: nothing changes for you ("Saved on phone"). It sends when the signal is back or the next time you open the app.
- Settings is simpler: one line says "Synced 12:25", "Not sent yet, will send automatically" or the problem in plain
  words, and one button says "Sync now". "Get from GitHub" and "Send to GitHub" are still there, under "More".
- Today's sync line uses the same words. The food line in Settings and on the Diet tab says "Food synced 12:25." or
  "Food: not sent yet, will send automatically."
- When a sync fails, the app does not keep trying every few seconds. It tries again when you open the app or come
  back to it, when the signal is back, or when you tap "Sync now". If the GitHub key is wrong or the GitHub file
  looks damaged, it waits until you tap "Sync now" or save a new key. The line says what is wrong.
- Closing the app sends once, not twice. While you type in Settings, a finished sync no longer closes the keyboard.

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
- After "It hurts", the new exercise starts lighter in its own kind of weight. Before, the app took 30 % off the old
  exercise's kilos, even from a machine to dumbbells (chest press 40 gave 28 kg dumbbells; now 14). With nothing logged
  yet, it starts about 30 % below its own first-try weight (or at it, when that is already the lightest), never at 0.
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
