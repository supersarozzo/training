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
State in one line: App 0.7.0 is pushed to `main` and live (chat 8.38, on Rosario's "push", 2026-11-18; the live version.js says 0.7.0): the Diet tab (two rings protein first, foods by meal, Search UK only, Digits, Quick add, Copy yesterday, Log again, Undo), barcode scan with our own zxing-wasm 3.1.7 reader, Open Food Facts lookups (only the barcode or the word is sent, "Check before saving"), food backup and restore, and food sync in its own `food.json`. 0.6.0 (chat 8.35) is already pushed. What is new for Rosario: docs/CHANGES.md. Checks: docs/checks/2026-11-18-wave3.md.
Done since last handover: Diet build steps 6, 7 and 8 (redesign/plan-diet/judge/JUDGING.md section 7), tests first for every delicate part; independent Opus checker and auditor, both PASS after fixes.
Next step: on the iPhone: Update on "New version ready", open Diet, try a real barcode scan (the camera is not checked on a real iPhone yet).
Waiting on Rosario: tap Update on the phone; a real barcode scan on the phone.
Later list: "Send now" in Settings says "Synced" when only food.json failed (the Diet tab shows the food line) - give Settings a food line; after Undo with a sheet open the Diet list behind it is redrawn only on the next redraw; entry rows show kcal bold where the mock-up shows protein bold and the time; the Diet foot says "Set up GitHub in Settings" while Settings is a button on Progress; from 0.6.0: trainer's D10 second rule, `my_weight_at` is a date, the screen checker's open minors (docs/checks/2026-11-18-v060.md).
Traps to avoid: food never goes into the workout box or progress.json (its own box trn.food.v1 and food.json); every new app file goes into the sw.js list (vendor/zxing-wasm too); text from Open Food Facts is untrusted (text nodes only, 120 letters, numbers range-checked); the CSP allows WebAssembly and world.openfoodfacts.org only; the camera must stop before any route change. Never put the token in chat, a file, a commit or a URL; no force-push; the sw.js file list must list every file in `app/` (a test checks it) and the version must go up with every app change; styles from data go through CSSOM, never a style attribute (CSP); never `innerHTML` with data. Since the swap fix two records can share a slot: screens that step through exercises must use `currentRecords` (or `slotRecord`), never the raw `session.exercises` list. The built-in browser cannot run service workers: test the update banner on the phone. Later: review findings R6 to R8 (theme-color on phone theme change, big offline update, "Last time" with the same exercise twice). Plan edits: save only through the model calls (swapPlanSlot, removePlanSlot, addPlanSlot, savePlanDay for Undo, resetPlanDay); Undo saves the day as stored (record slots), never the slots as shown; a day saved by a newer app is never changed from this app.
