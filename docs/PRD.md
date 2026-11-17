# Training app: product requirements (PRD)

Date: 2026-11-16 (F25 to F30 and the F3 print removal added 2026-11-17 by worker 8.31). Written by the task chat "training-app-design" (Opus, high effort).
Based on: [WORKFLOW.md](WORKFLOW.md) (section H is the scope, section D the screens), [plan v2](plan/2026-11-16-training-plan-v2.md), [watch, sync and offline research](research/2026-11-16-watch-sync-offline.md), [DECISIONS.md](DECISIONS.md).
How it is built: [ARCHITECTURE.md](ARCHITECTURE.md). How it looks: [DESIGN.md](DESIGN.md).

## 1. What it is, in one line

A phone web app that walks Rosario through each gym session of the 12-week plan, saves every set, suggests the next weights, tracks body weight, and keeps a safe copy of the log in a private GitHub repo.

## 2. Why

- Rosario is a beginner with a full plan (plan v2). Reading a plan on paper at the gym is slow, and it is easy to forget last week's weights.
- The app shows **what to do now**, **what you lifted last time**, and **what to lift next**. It runs the rest timers. It applies the plan's rules (double progression, easier weeks, missed days), so Rosario does not have to remember them.
- Commercial apps cost money, show ads, or keep the data. This app is free, has no ads, and the data stays Rosario's: on the phone and in a private GitHub repo.

## 3. Who uses it, and where

- **One user:** Rosario. Not a developer.
- **One device:** an iPhone (iOS 27.2.1), the app installed on the home screen. Apple Watch on the wrist, used separately.
- **Where:** at the gym (The Gym Group York Foss Island), Monday to Friday, about 90 minutes. One hand, often sweaty, the phone on a bench or a treadmill shelf, sometimes no phone signal. At home: the morning weigh-in.

Words used below:
- **Web app**: a website that behaves like an app. "Installed on the home screen" means it opens full-screen with its own icon.
- **Offline**: works with no internet.
- **Sync**: copy the log between the phone and the private GitHub file (`progress.json`), both ways, without losing anything.
- **Token**: a long password-like key from GitHub that lets the app write to the one private repo. Rosario pastes it into the phone once.

## 4. Version 1 features

Each feature has a "done when" line: the test that says it is finished. The screens are listed in [DESIGN.md](DESIGN.md), section 7.

| # | Feature | Done when |
|---|---|---|
| F1 | **First start: setup.** Choose "Start fresh" (intake questions 20 to 38 on the phone) or "Restore" (from GitHub or a backup file). | On an empty phone, both routes end on the Today screen with a profile saved; nothing is sent anywhere unless sync is set up. |
| F2 | **Your targets.** The app works out a calorie and a protein number from the intake (plan v2, section 12 formulas, WORKFLOW B4 safety limits), plus the starting walk speed and slope. Rosario can confirm or change each number. | The numbers follow the formulas, never break the safety limits (calorie floor, safe weekly rate), and a changed number is kept. |
| F3 | **The plan inside the app.** Plan v2 (5 days, 12 weeks, exercises, sets, reps, rest, swaps, form tips) is built into the app as data. ~~A printable "Plan sheet" page shows it all.~~ **Print part removed by Rosario** (2026-11-17, Plan tab redesign; goes in build step 2). | Every day and week of plan v2 appears with the right sets and reps. ~~The Plan sheet prints on A4 without cut-off tables.~~ (Removed with the print part.) |
| F4 | **Today screen.** Day, week and phase ("Week 3 · Build 1"), blocks of the day, expected time, sync status, the Watch reminder, today's food numbers. Buttons: Start, Short day (60 min), Swap day. Missed-days message. | Opening the app on any date shows the right day and week, and the missed-days rule (E3) when there was a gap. |
| F5 | **Walk block (first).** Treadmill walk with build-up: suggested speed and slope (leg days 2 % less), 30-minute timer, then confirm speed, slope, effort 1 to 10, optional distance and heart rate. | The timer survives the screen dimming and the app closing; the walk result is saved; the next walk's suggestion follows the walk rule. |
| F6 | **Change-over and lift warm-up.** 3-minute change-over timer, then the 4-minute warm-up move list (upper days add push-ups). | Both can be skipped; both show big timers. |
| F7 | **Pairs and sets.** One pair at a time: name, equipment, target ("3 sets · 8 to 12 reps · stop with 2 left"), suggested weight, last time's weight and reps, warm-up sets for the first exercise of each pair, form tips, machine note. Each set: weight and reps filled in, big Done, then an optional "How many more could you do?" tap. | Every Done is saved on the phone at once; closing the app and opening it again offers "Continue today's workout" with all sets kept. |
| F8 | **Rest timer.** Starts by itself after Done: about 30 s "move to the next exercise" inside a pair, the pair's rest after the second exercise. Big countdown, +30 s, −30 s, Skip, next set shown below. At zero: the screen flashes and beeps (if sound is on). | The countdown stays right after the phone was locked and unlocked; the flash always shows; the beep plays when the ring switch is on and the app is open. |
| F9 | **Swap.** "Machine busy", "Don't like it", "It hurts" on each exercise; shows the plan's swaps; "It hurts" says stop, suggests the swap with a lighter weight, and asks for a note. | The log saves the exercise really done and the reason; progression continues on the exercise done. |
| F10 | **Abs and timed holds.** Same set screen; holds (plank, side plank) use a countdown in place of reps. On leg days the "on its own" exercise (D) sits in this slot. | A timed hold saves its seconds; the D exercise works like any other exercise. |
| F11 | **Week 1: find your weights.** The guided screen from WORKFLOW C: learn, warm-up, set 1, "how many more?" (0-1 / 2-3 / 4-6 / 7+), suggested set 2 weight, save the starting weight and the machine note. | After week 1 every exercise has a starting weight and week 2 suggests from it. |
| F12 | **Progression.** Double progression (plan v2, section 9), big-jump rule, the 12-week rhythm with easier weeks 6 and 12, the 4th set in weeks 7 to 11, missed-time rules (section 11). Suggestions only; Rosario can always change the weight. | Unit tests cover every row of the plan's progression and missed-time tables, and pass. |
| F13 | **Finish.** Summary (time, sets, new bests, what changes next time), optional effort and note, Save, then auto sync. | After Save the screen says "Saved to GitHub" or "Saved on phone, will sync later", and that is true. |
| F14 | **Weigh-in.** Enter body weight in under 10 seconds (kg or stones and pounds), one per day. Measurements (waist, chest, arm, thigh) every 4 weeks. | A weigh-in for today replaces the earlier one of the same day; the trend line updates. |
| F15 | **Trend and weekly summary.** 7-day trend weight line with single weigh-ins as dots. Monday summary: workouts done (out of 5), sets, new bests, walk minutes, trend change against the target band, and the suggested food change (Rosario decides). | With test data, the trend and the band check match a hand calculation. |
| F16 | **Charts.** One chart per exercise (best working set over time) and the weight trend. | Charts draw with 0, 1 and many points without errors. |
| F17 | **Sync.** Auto sync after Finish and when the app opens; "Get from GitHub" and "Send to GitHub" buttons; sync status always visible. Merge by record, newest change wins, never a blind overwrite. | The sync tests in ARCHITECTURE.md (fake GitHub: conflict, offline, expired token, broken file) all pass, and a real test with Rosario's repo works. |
| F18 | **Backup file.** "Download backup" in Settings (the whole log as one file, no token inside); "Restore from file" merges a backup into the phone. | A downloaded backup restored on an empty phone gives back the same log. |
| F19 | **Offline and screen on.** The app opens and works with no signal after the first visit; the screen stays awake during a workout. | With the network off the whole workout works; the screen does not lock during a workout. |
| F20 | **Update banner.** A new app version shows "New version ready" and installs on a tap, never in the middle of a workout. | Changing the version number shows the banner; tapping it loads the new version with no data lost. |
| F21 | **Shortcuts "Log to Health" button** (Rosario's choice, question 40 b). Off by default. When on, the Finish screen shows a button that opens Rosario's Shortcut with the workout's start time and minutes. | After Rosario builds the Shortcut, one test workout appears in Apple Health with the right length. If the phone test fails, the button stays off and the Watch workout by hand is enough. |
| F22 | **Gym tab and machine notes** (redesign, 2026-11-17, Rosario's choice 55 a). A Gym tab lists every machine and station the plan uses, grouped by gym area, with its photo, the usual name on its sign (with a note that the gym's sign may differ) and a "x of N noted" counter. Each machine card has one set-up tip and Rosario's own "Where it is in my gym" note (quick-word chips, typed text). The set and rest screens show the note of the current and next machine. Machines the first visit said the gym does not have are hidden. | A note saved on a machine shows on its card, in the Gym list, on the set screen and on the rest screen; it is synced and backed up like other records (`gym_spots`); a file without notes still opens. |
| F23 | **Look and Animations** (redesign, 2026-11-17). Settings > Look: Auto / Light / Dark and an Animations switch. Both stay on the phone (never synced). Animations off, or the phone's Reduce Motion, stops every animation. | The chosen look shows from the first frame after a reload; with Animations off nothing moves and photos are still. |
| F24 | **Exercise photos and videos** (redesign, 2026-11-17). Every exercise and machine has two real photos (start and end position) that flip to show the move, shipped inside the app so they work offline; a "Video" chip opens a checked YouTube video outside the app. | Every exercise in the plan has photos; all video links answer (record in docs/redesign-final/videos-checked.json); with the network off the photos still show. |
| F25 | **Plan day page** (Plan, Gym and Diet redesign, approved 2026-11-17; DESIGN.md section 15). The Plan tab shows one day per page like Today: week chip with the 12 weeks sheet (real sets per week), day strip, walk card, pairs in words, exercise cards with a small body map, an opened exercise with two maps ("This exercise" and "Day so far"), day arrows at the bottom. Exercises and Machines move to the Gym tab (grouped by main muscle); Settings becomes a gear on every tab; tabs Today · Plan · Gym · Diet · Progress (answers 67, 68, 69, 70, 75). | Every item of the 0.4.1 Plan tab (print excepted) is on the new screens; any week picked shows the same sets as `setsFor()`; the muscles shown for each exercise come from the checked muscle data (build step 1 test). |
| F26 | **Permanent plan edits** (answers 65, 72 a, 73 a). Edit a day of the plan: swap for an exercise of the same muscle (the plan's own swaps always offered as "Plan's pick"), remove, add at the end (3 sets, 60 s rest, at most 2 a day), 8 s Undo, "Back to the plan's day" with a confirm. The change lasts for that day of the plan; past and running workouts never change. | Unit tests: never the same exercise twice in a day; the plan's swaps always offered; past and running workouts unchanged; edited days sync and merge like other records, and an older app keeps records it cannot read. |
| F27 | **Muscle check** (answer 74 b). A whole-plan screen with weekly sets per muscle (direct and with helpers at half), shoulder parts apart, "N things stand out", for each week type. Only shows numbers; plan changes come only from a plan review Rosario approves. | Its numbers equal the opened exercise's "Day so far" for the same day (one function); with plan v2 they match research section 5.3. |
| F28 | **Diet tab** (answers 62, 64, 76 b, 77 b, 79 a). Today's food against the targets (protein and calorie rings, carbs and fat), the food list by meal, Log again with one tap, Quick add, Copy yesterday, Rosario's own foods offline, Open Food Facts search (UK only, on tap only), a check step before saving any Open Food Facts food, the Open Food Facts credit on every sheet with their data. | A food added by each way shows in the right meal and the totals add up; only the barcode or the search word is sent; Open Food Facts text is clipped and goes in only through `h()`. |
| F29 | **Barcode scan** (answer 63 a). A self-hosted open-source barcode reader (served from our own site, licence kept), on one screen; "Type the digits" always offered; the check digit is tested before any lookup. | On Rosario's iPhone a real pack barcode is read and looked up; a wrong check digit makes no lookup; the camera stops when the scanner closes. |
| F30 | **Food sync** (answer 78 a). The food log and saved foods sync in their own file `food.json` in the private repo, with the same merge and conflict rules as `progress.json`. | The sync tests run for `food.json` with the fake GitHub (conflict, offline, expired key, broken file); a food sync problem never changes `progress.json`. |

## 5. Later (version 2 and on)

From WORKFLOW H, unchanged:
- Automatic calorie changes from the trend (F3 of WORKFLOW). In version 1 the weekly summary only suggests.
- Measurements chart, the 12-week review screen and the new-block generator. In version 1 the master chat runs the week-12 review with Rosario.
- Readiness check before a workout ("tired / sore / good").
- Streaks, weekly goal ring, personal-best badges.
- Walk-after-weights layout (intake 35 a, c, d). Version 1 builds the layout Rosario chose (walk first); the order is stored as plan data, so a later change is a data edit.

## 6. Out of scope (not planned)

- Reading or writing Apple Health directly, or a Watch app (a web app cannot; see the research).
- Reminders or "rest over" alerts while the app is closed (needs a server).
- Vibration (iPhones do not allow it for web apps).
- ~~Food logging~~ **moved into scope by Rosario on 2026-11-17** (answer 62 a): a Diet tab with food logging and barcode scan, designed with the Plan tab redesign and built after it. Its feature rows are F28 to F30 (design picked 2026-11-17, answers 67 to 79). Research: [2026-11-17-plan-diet-research.md](research/2026-11-17-plan-diet-research.md).
- Progress photos inside the app (they stay in the Photos app; the exercise photos of F24 are different).
- The printable Plan sheet (the print part of F3): **removed by Rosario** (request of 2026-11-17, Plan tab redesign). F3's "plan inside the app" stays; F3's "prints on A4" test goes when build step 2 removes the print code.
- More than one user, accounts, log-in pages, social features.
- Any paid service, any server of our own, any script loaded from another site, any tracker. (Rule changed by Rosario's answer 63 a on 2026-11-17: one open-source barcode decoder may be copied into the app and served from our own site.)
- An Android or desktop version (it may work in a browser, but it is not tested).

## 7. Success measures

- **Used:** Rosario logs at least 4 of 5 sessions a week with the app in the first 4 weeks.
- **Fast at the gym:** logging a set takes one tap when the suggestion was right (Done), and at most 3 taps when it was not.
- **Nothing lost:** zero lost sets or weigh-ins in 12 weeks, including after the app was closed, the phone had no signal, or two syncs clashed.
- **Safe copy:** at the end of each training day, the private GitHub file holds that day's workout (when there was signal at some point that day).
- **Plan followed:** the suggested weight is accepted without change in most sets after week 2 (the suggestions fit).
- **Private:** no body data and no token ever appear in the public app repo.
