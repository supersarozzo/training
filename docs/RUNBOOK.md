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

Test another day: add `?date=2026-11-17` to the address (only works on localhost). The app then behaves as if it were that day, so you can test every weekday and week. With a later day, changes are dated ahead of the computer's clock, so automatic sync (0.7.2) does not send them by itself: use "Sync now" in Settings.

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
6. On a phone that already has data, the file is checked and then **merged** in (nothing on the phone is removed; a safety copy is kept first).

## Back up

- **The code and docs:** git (every build step is one commit). The GitHub copy is made at the first push (build step 12).
- **Your private files** (`private/`): they are NOT in git on purpose. Copy the `private` folder to a safe place of your own now and then (for example a USB stick or your cloud drive). Nobody else has these files.
- **The phone data:** Settings > Backup and restore > **Download backup** makes a file (on iPhone it goes to the Files app). It never holds the GitHub key. Make one now and then, and keep it outside the phone.

## Restore

- The code: `git log` shows the steps. `git checkout <commit>` goes back to one. Ask the Training chat for help.
- The phone: Settings or first start > **Restore from file** (merges into the phone; an empty phone takes it as it is), or **Restore from GitHub** once sync is set up.
- Date of last tested restore: never on a real phone (tested only in the computer browser and in automatic tests, 2026-11-16).

## Release / deploy

GitHub set-up (build step 12, 2026-11-17), as done:
1. GitHub account `supersarozzo` (free plan). Turn on two-factor sign-in (Settings > Password and authentication). Status on 2026-11-17: **off**, Rosario was advised to turn it on.
2. Settings > Emails: tick "Keep my email addresses private" and "Block command line pushes that expose my email". The noreply address is `151270675+supersarozzo@users.noreply.github.com`. This repo uses it (`git config user.email`, this repo only).
3. Public repo `training`, made EMPTY (no README, licence or .gitignore). Settings > Pages > Source: **GitHub Actions**.
4. Private repo `training-data`, made WITH "Add a README file" (so `main` exists; review F9).
5. The local branch is `main`. Remote: `origin` = https://github.com/supersarozzo/training.git. Push only after Rosario says yes. Git Credential Manager opens a GitHub sign-in in the browser: Rosario signs in there.

**Pages address:** https://supersarozzo.github.io/training/ . First push 2026-11-17: Actions run "Publish app to Pages" passed, the address opens (HTTP 200), `sw.js` opens, and `private/` files are not on the site (404). Not yet tested on the iPhone (build step 13).

### Token recipe (build step 13: make it in Safari on the iPhone, paste it straight into the app)
It never touches the computer. Never put it in chat, a file, a commit, a URL or a log.
1. In Safari on the iPhone: github.com > your picture > Settings > Developer settings > Personal access tokens > **Fine-grained tokens** > Generate new token.
2. Name: `training-app`. Expiration: **1 year** (custom date). Resource owner: `supersarozzo`.
3. Repository access: **Only select repositories** > `training-data` only.
4. Repository permissions: **Contents: Read and write**. Nothing else (Metadata: Read-only is added by GitHub and is fine).
5. Generate token, copy it, open the app > Settings > GitHub sync, paste it, Save and test.
6. Put a reminder in your calendar for 1 year later. When it expires, make a new token the same way.

### Restore the old history from the bundle
Before the rewrite to the noreply address, all commits were saved in `private/training-before-rewrite-2026-11-17.bundle` (old head `90d9cf4`, tree `25ae3de`; the new head has the same tree). To look at it: `git clone private/training-before-rewrite-2026-11-17.bundle old-copy` in a new empty folder outside this project. The bundle holds the personal Gmail, so it stays in the git-ignored `private/` folder and never goes to GitHub.

## When something breaks

1. Run `node --test`. If a test fails, the line names what broke.
2. The app shows "Something is wrong" with a plain message: your data was not changed. Tell the Training chat what the message says.
3. "Not saved. Phone storage full" (a sheet after a tap): the tap was not saved. Download a backup (Settings) and tell the Training chat. If sync says "Some data on this phone does not pass the app's own check. Nothing was sent.", the GitHub copy is safe and unchanged: do the same.
4. A blank page: open the browser console (F12 > Console) and copy the red text to the Training chat.

## Rollback of a change

Git project: revert the commit (`git revert <commit>`). Nothing outside this folder is changed by the project, so no change ledger is needed.

## Releasing a new version of the app (step 8)
1. Change `APP_VERSION` in `app/js/version.js` **and** at the top of `app/sw.js` (same text). `node --test` fails if they differ.
2. Add any new file in `app/` to the `FILES` list in `app/sw.js`. `node --test` fails if the list and the folder differ.
3. On the phone the banner "New version ready" appears; tap Update.
4. To try the worker on your computer: open `http://localhost:8000/?sw=1`. Remove it afterwards in the browser's site data. The built-in preview pane of the Claude app cannot run service workers: test offline in real Chrome or Safari.

## Trying sync on the computer (no real GitHub)
1. `python -m http.server 8000 --directory app`, then open `http://localhost:8000/?fake-github=1#/settings` at phone size.
2. Settings > GitHub sync shows the test account (`rosa-test`) and test key (`fake-token-ok`). Use them. Another key gives "GitHub key expired or wrong".
3. In the browser console, `fakeGithub` is the pretend GitHub: `fakeGithub.readDoc()` shows its file, `fakeGithub.setBlocked(true)` = no signal, `fakeGithub.fail("put", 409, 3)` = three clashes, `fakeGithub.putDoc(doc)` = another phone saved. `fakeGithub.reset()` empties it.
4. This works on localhost only. On the real site the address option does nothing.

## The Log to Health button (optional)
1. Settings > Log to Health button: type the name of your Shortcut, tap the button until it says "Button is on".
2. After you save a workout, Today shows **Log to Health**. It opens Shortcuts and passes the start time and the minutes, like `2026-11-16T09:00:00.000Z|62`. Your Shortcut must split that text and run "Log Workout". Not tested on a real phone yet (build step 13). If it does not work, turn it off: the Watch workout already logs to Health.

