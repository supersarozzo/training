# Hand-over

## End-of-session checklist (every session, including the master before a long break)
1. Work committed (or backed up on a branch). Nothing half-done left in the working tree.
2. Tracker updated; docs updated in the same commit.
3. STATUS.md current; DECISIONS.md has every decision from this session.
4. Servers and background tasks stopped.
5. Finished workers detached; their ids sent to the master-of-masters.
6. Latest handover below rewritten.

## Latest handover
Date: 2026-11-18
State in one line: App 0.5.0 is ready to ship but NOT pushed: the Plan and Gym part of the Plan, Gym and Diet redesign (build steps 1 to 5: muscle data, Plan day page, saved Plan edits, Edit UI, whole-plan muscle check) plus the plan change of 2026-11-18. Live is still 0.4.1 (origin/main = 97d86f2). Push only when Rosario types "push" in chat 8.35 (worker 8.35).
Done since last handover: step 1 muscle data (8.31); step 2 Plan day page, Gym Machines | Exercises, Settings gear, Print removed (8.33, docs/checks/2026-11-17-step2.md); wave 1 (8.34): step 3 saved Plan edits engine (`plan_days`, E1/E2) and the plan change (calf raises Mon/Wed, leg curl Thu), resume fix (docs/checks/2026-11-18-wave1.md); wave 2 (8.35): step 4 Edit UI (Edit mode, Swap, Add, Remove, 8 s Undo, Changed by you, Back to the plan's day with confirm, running-day lock) and step 5 muscle check (`#/plan/muscles`), answer 85 a words, version 0.5.0. New pure file `app/js/planview.js`. Checks: docs/checks/2026-11-18-wave2.md. What is new for Rosario: docs/CHANGES.md. 422 tests pass (`node --test "tests/*.test.mjs"`).
Next step: Rosario looks at the wave 2 step page and types "push" in chat 8.35; then 8.35 pushes main (no force), waits for the Pages run, checks live `js/version.js` = 0.5.0. Then on the iPhone: Update on "New version ready". Tomorrow: build steps 6 to 8 (food data and sync, Diet tab, barcode), each in its own chat.
Waiting on Rosario: the look at the step page and the typed "push".
Traps to avoid: never put the token in chat, a file, a commit or a URL; no force-push; the sw.js file list must list every file in `app/` (a test checks it) and the version must go up with every app change; styles from data go through CSSOM, never a style attribute (CSP); never `innerHTML` with data. Since the swap fix two records can share a slot: screens that step through exercises must use `currentRecords` (or `slotRecord`), never the raw `session.exercises` list. The built-in browser cannot run service workers: test the update banner on the phone. Later: review findings R6 to R8 (theme-color on phone theme change, big offline update, "Last time" with the same exercise twice). Plan edits: save only through the model calls (swapPlanSlot, removePlanSlot, addPlanSlot, savePlanDay for Undo, resetPlanDay); Undo saves the day as stored (record slots), never the slots as shown; a day saved by a newer app is never changed from this app.
