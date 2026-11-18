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
State in one line: App 0.6.0 is pushed to `main` (chat 8.35, on Rosario's "Execute all these change, commit and push the new version"): Rosario's batch of 2026-11-18. Today is the gym day (pick any day of the week, Start, Stop this exercise here); Plan is the plan to edit (no day buttons, the weight on every card, Change for sets/reps/weight, photo before the maps, back of the head); Look (light/dark) reaches every part; Settings is a worded button on Progress; the personal trainer's walk and muscle decisions (docs/plan/2026-11-18-trainer-decisions.md). What is new for Rosario: docs/CHANGES.md. Checks: docs/checks/2026-11-18-v060.md.
Done since last handover: 0.5.0 live; then 0.6.0 by 8.35 with the Today worker, the dark-mode worker and the trainers 8.36/8.37; independent auditor and screen checker, every blocker and major fixed.
Next step: on the iPhone: Update on "New version ready". Then 0.7.0 (Diet, worker 8.38), which builds on 0.6.0.
Waiting on Rosario: tap Update on the phone; look at Today and Plan (not checked on a real iPhone yet; Look = Auto not checked).
Later list (not done in 0.6.0): trainer's D10 second rule (stopped twice and below the range: one step lighter; exact code in docs/plan/2026-11-18-trainer-weekly-plan.md); `my_weight_at` is a date, so a weight set on the morning of a workout keeps winning after it; rows could count lats and mid back as main once the muscle check counts a set once per row; the Plan card weight leaves out the missed-days cut on purpose (Plan shows the plan, Today the weight for today); the screen checker's open minors (docs/checks/2026-11-18-v060.md).
Traps to avoid: never put the token in chat, a file, a commit or a URL; no force-push; the sw.js file list must list every file in `app/` (a test checks it) and the version must go up with every app change; styles from data go through CSSOM, never a style attribute (CSP); never `innerHTML` with data. Since the swap fix two records can share a slot: screens that step through exercises must use `currentRecords` (or `slotRecord`), never the raw `session.exercises` list. The built-in browser cannot run service workers: test the update banner on the phone. Later: review findings R6 to R8 (theme-color on phone theme change, big offline update, "Last time" with the same exercise twice). Plan edits: save only through the model calls (swapPlanSlot, removePlanSlot, addPlanSlot, savePlanDay for Undo, resetPlanDay); Undo saves the day as stored (record slots), never the slots as shown; a day saved by a newer app is never changed from this app.
