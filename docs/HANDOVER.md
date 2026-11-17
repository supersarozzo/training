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
State in one line: Build step 12 (GitHub set-up) is nearly done; the push waits for Rosario's typed yes in the master chat.
Done since last handover: Account `supersarozzo` (two-factor sign-in still OFF, Rosario was told to turn it on); public `training` (empty) and private `training-data` (with README) made by Rosario; 23 commits rewritten to the noreply address (tree unchanged, 246 tests pass); branch renamed `main`; remote `origin` added; history scanned (no token, no body data).
Next step: After the yes, push `main`, check the Actions run and the Pages address https://supersarozzo.github.io/training/. Then build step 13 (phone test, token made in Safari on the iPhone).
Waiting on Rosario: the yes to push; Pages source set to "GitHub Actions" (check it works).
Traps to avoid: never put the token in chat, a file, a commit or a URL; no force-push; the GitHub connector in Claude cannot create repos and cannot see `training-data`.
