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
State in one line: The redesign is merged into `app/` (task chat 8.24, app 0.4.0), committed, not pushed. It waits for an Opus safety review and Rosario's look on the iPhone.
Done since last handover: Build step 12 set-up done earlier (push still waiting). Redesign judged (8.23; Rosario: "All recommended" for 55 to 61). Swap fix and `gym_spots` done tests-first. UI merged: base A plus parts of B, C, D; volt accent; Gym tab with machine notes; Look and Animations in Settings; photos for every move (offline); 44 video links checked. Docs: DESIGN (rewritten), PRD F22 to F24, ARCHITECTURE, DECISIONS, OPEN_QUESTIONS, MEDIA.md, redesign-final/LOOK.md with 26 screenshots.
Next step: Opus safety review of the merge (ARCHITECTURE section 12 list, plus machines.js, pair.js, rest.js, prefs/boot). Then Rosario looks on the iPhone (LOOK.md steps). Then, after Rosario's typed yes, the push.
Waiting on Rosario: the look on the iPhone; the yes to push.
Traps to avoid: never put the token in chat, a file, a commit or a URL; no force-push; the sw.js file list must list every file in `app/` (a test checks it) and the version must go up with every app change; styles from data go through CSSOM, never a style attribute (CSP); never `innerHTML` with data. Not checked in the browser yet: timed holds, short day, update banner, finish screen, week 1 live, backup and restore by clicking, Reduce Motion, print preview.
