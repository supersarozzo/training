# Runbook

How to run, check, back up and restore. Plain steps, copy-pasteable. Rosario is not a developer: each step says what it does.

## Run the app on your computer

What this does: starts a tiny web server on your computer, so you can open the app in a browser. Nothing goes on the internet.

1. Open a terminal in the project folder (`C:\Users\Rosario\Documents\training`).
2. Start the server:

```bash
python -m http.server 8000 --directory app
```

3. Open http://localhost:8000/ in a browser. To see it as on a phone, use the phone size 375 x 812 (in the Claude app's browser pane choose "Mobile").
4. Look at it in light mode and in dark mode.
5. Stop the server with Ctrl+C.

First start: the app shows **Start fresh**, **Restore from file** and **Restore from GitHub** (not ready yet). After you finish the questions (or restore a file), you see your numbers, then the empty Today screen. The Plan tab shows the whole plan.

Test another day: add `?date=2026-11-17` to the address (only works on localhost). The app then behaves as if it were that day, so you can test every weekday and week.

The workout (build step 5): Today > Start workout > walk > change-over > warm-up > pairs > abs > Finish > Save. Closing the tab or reloading in the middle continues in the same place.

To start again from an empty first screen: in the browser open the developer tools (F12), go to Application > Local storage > http://localhost:8000, and delete the keys that start with `trn.`. Do this only on your computer while testing.

## Run the tests

What this does: runs every automatic check (plan data, formulas, rules, storage, file checks). It takes a few seconds. No install is needed (Node 24).

```bash
node --test
```

Use it with no folder name. On Windows, `node --test tests/` fails with "Cannot find module".

Pass means every line starts with a tick and the summary says `fail 0`.

## The private starter file (your answers, no retyping)

What this does: makes a file from your private intake answers, so the phone does not need the 19 questions. The file is private and git-ignored (it never goes to GitHub).

1. Make it (or make it again if the answers changed):

```bash
node tools/make-starter.mjs
```

2. The file is `private/starter-backup.json`.
3. Check it is ignored by git (it must print the file name):

```bash
git check-ignore private/starter-backup.json
```

4. Move it to the phone by a private route (AirDrop, or iCloud Drive in the Files app). Never email it, never put it on GitHub.
5. On the phone: first screen > **Restore from file** > choose the file. The app shows your numbers. Tap **Looks right**.
6. It works only on a phone with no data yet. If the phone already has data, the app refuses and changes nothing (full merge-restore comes with the sync steps).

## Back up

- **The code and docs:** git (every build step is one commit). The GitHub copy comes at build step 12.
- **Your private files** (`private/`): they are NOT in git on purpose. Copy the `private` folder to a safe place of your own now and then (for example a USB stick or your cloud drive). Nobody else has these files.
- **The phone data:** from build step 10 the Settings screen has **Download backup**. Until then the data is only on the phone.

## Restore

- The code: `git log` shows the steps. `git checkout <commit>` goes back to one. Ask the Training chat for help.
- The phone: Restore from file works on an empty phone (see above).
- Date of last tested restore: never on a real phone (tested only in the computer browser and in automatic tests, 2026-11-16).

## Release / deploy

Not yet. Build step 12 (with Rosario): the GitHub account, the public `training` repo with Pages set to "GitHub Actions", the private `training-data` repo, and a key. Code is pushed only after Rosario says yes.

## When something breaks

1. Run `node --test`. If a test fails, the line names what broke.
2. The app shows "Something is wrong" with a plain message: your data was not changed. Tell the Training chat what the message says.
3. "Phone storage full": download a backup (from step 10) and tell the Training chat.
4. A blank page: open the browser console (F12 > Console) and copy the red text to the Training chat.

## Rollback of a change

Git project: revert the commit (`git revert <commit>`). Nothing outside this folder is changed by the project, so no change ledger is needed.
