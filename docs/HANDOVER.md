# Hand-over

## End-of-session checklist (every session, including the master before a long break)
1. Work committed (or backed up on a branch). Nothing half-done left in the working tree.
2. Tracker updated; docs updated in the same commit.
3. STATUS.md current; DECISIONS.md has every decision from this session.
4. Servers and background tasks stopped.
5. Finished workers detached; their ids sent to the master-of-masters.
6. Latest handover below rewritten.

## Latest handover
Date: 2026-11-17
State in one line: The redesign (app 0.4.1) passed the Opus safety review (task chat 8.25): 0 high, 3 medium (all fixed, test first), 5 low (2 fixed, 3 for later). Pushed on 2026-11-17 (97d86f2, after Rosario typed "push" in chat 8.25); Pages run green; https://supersarozzo.github.io/training/ serves 0.4.1.
Done since last handover: Safety review of the merge: docs/REVIEW-2026-11-17-redesign.md (findings, section 12 checklist, what was not checked). Fixes: R1 week 1 no longer returns to a swapped-out exercise (`engine/workout.js currentRecords`); R2 Done works again after a "Not saved" error (`ui/parts.js lockedButton`); R3 long words in notes wrap, so Done never leaves the screen (`app.css`); R4 Finish ring obeys the Animations switch; R5 Gym-row pin icon size. Version 0.4.1. 302 tests pass (`node --test "tests/*.test.mjs"`). Browser check screenshots: docs/redesign-final/screens/review/. OPEN_QUESTIONS answered rows 51 to 57 added.
Next step: on the iPhone, open the installed app and tap Update on "New version ready". Check on the phone: the "New version ready" banner and that the 6 MB update finishes over mobile data (not checkable in the built-in browser).
Waiting on Rosario: the look at the live app on the iPhone.
Traps to avoid: never put the token in chat, a file, a commit or a URL; no force-push; the sw.js file list must list every file in `app/` (a test checks it) and the version must go up with every app change; styles from data go through CSSOM, never a style attribute (CSP); never `innerHTML` with data. Since the swap fix two records can share a slot: screens that step through exercises must use `currentRecords` (or `slotRecord`), never the raw `session.exercises` list. The built-in browser cannot run service workers: test the update banner on the phone. Later: review findings R6 to R8 (theme-color on phone theme change, big offline update, "Last time" with the same exercise twice).
