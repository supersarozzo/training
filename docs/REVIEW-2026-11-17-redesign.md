# Safety review of the redesign merge (app 0.4.0 → 0.4.1)

Date: 2026-11-17. Done by task chat 8.25 (Opus, high effort).
Scope: everything in `app/`, `tests/` and `docs/` between `4f1e315` (the live version 0.3.1) and `566dbf3` (merge 8.24: commits 4ad6120, 33557cc, 361b713, adc3f15, 2ceb18a, ecc0e4a, 566dbf3), with a focus on [ARCHITECTURE.md](ARCHITECTURE.md) section 12. The `redesign/` folder was used only as reference.
Same format as the last review: [REVIEW-2026-11-16.md](REVIEW-2026-11-16.md).

Plain words used here:
- **Finding**: a problem the review found.
- **Severity**: **High** = can lose data or block sync. **Medium** = a rule from the design is broken, or a workout can get stuck. **Low** = rare, cosmetic, or only with odd data.
- **Record**: one exercise inside a saved workout (its sets live in it).

## Result in short

- **0 high, 3 medium, 5 low** (plus 2 notes that are not problems).
- Fixed: the 3 mediums (each with a test first, in its own commit) and 2 lows. Listed for later: 3 lows.
- Every section 12 item: **pass**. See the checklist below.
- Tests: **302 pass** with `node --test "tests/*.test.mjs"` (296 before the review, 6 new; no old test changed).
- App version **0.4.1** in `sw.js` and `version.js` (0.4.0 was never released).
- No GitHub key and no body data in any changed file (checked, see "How it was checked").
- **Safe to show Rosario and to push**, after Rosario's look on the iPhone. Nothing was pushed.

## How it was checked

1. Code read line by line for every delicate file in the diff: `model.js` (swap fix, `setGymSpot`), `ids.js`, `plan/machine-ids.js`, `store.js`, `sync/merge.js`, `validate.js`, `boot.js`, `prefs.js`, `main.js`, `ui/theme.js`, `ui/parts.js` (`lockedButton`), `ui/pair.js`, `ui/rest.js`, `ui/week1.js`, `ui/machines.js`, `ui/media.js`, `ui/exinfo.js`, `ui/finish.js`, `ui/settings.js`, `sw.js`, `index.html`. Every reader of `session.exercises` was checked against the swap fix (two records can now share a slot).
2. `git diff 4f1e315..HEAD` of the files the merge plan says must not change (`js/engine/*`, `js/sync/*`, `backup.js`, `syncer.js`, `autosync.js`, `active.js`, `errors.js`, `clock.js`, `timer.js`, `wakelock.js`, `shortcuts.js`, `h.js`, `plan-v2.js`, `cues.js`, `ui/update.js`, `ui/flow.js`, `ui/settings-sync.js`): only the planned `LISTS` line in `merge.js`, and this review's additive `currentRecords` in `engine/workout.js`. `sw.js`: only the file list and the version changed; the fetch rules are the same.
3. No old test file was changed or deleted (`git diff --diff-filter=MD 4f1e315..HEAD -- tests` is empty).
4. Commit order: each delicate change of 8.24 has its tests in the commit before it (4ad6120 → 33557cc; 361b713 → adc3f15; 2ceb18a → ecc0e4a). This review did the same for R1, R2, R3.
5. Searches: `innerHTML|outerHTML|insertAdjacentHTML|document.write|eval(|new Function` in `app/js` finds only comments. Styles from code use the CSSOM (`el.style.x`), never a style attribute. The CSP line in `index.html` is byte-for-byte the live one. The only hosts in `app/` are `api.github.com`, `www.youtube.com` (plain links, all `target="_blank" rel="noopener noreferrer"`), `github.com` and the existing `eparmedx.com` credit link. The only scripts are `js/boot.js` and `js/main.js`, both from the site. No fonts, no embeds.
6. Keys: no `ghp_` or `github_pat_` in the diff or the history of the range.
7. Body data: a script read Rosario's private intake on this computer (never printed) and searched every changed text file for the height, weight, age, waist and the other numbers. The only matches were unrelated numbers (a `180deg` gradient, a `180` s change-over, an icon size, CSS pixel sizes). Tests and screenshots use made-up people.
8. A browser check in the built-in browser at 375 × 812, dark and light, with made-up data and `?date=` (localhost only). Screenshots: [redesign-final/screens/review/](redesign-final/screens/review/).

## Findings

| Id | Severity | File and line | What | Fix |
|---|---|---|---|---|
| R1 | **Medium** | `app/js/ui/week1.js` 33 (with `app/js/model.js` 124–132) | The swap fix keeps the old record (with its saved sets) behind a new record for the same slot. The week-1 screen walked **every** record. So after a swap in the middle of a week-1 exercise (for example a busy machine after set 1), the screen first did the new exercise, then went **back** to the swapped-out exercise at "set 2", and the count said "Exercise 1 of 9" on an 8-exercise day (shown by the tests; the fix was in before the browser check). The only way out was to do the exercise Rosario had swapped away from, or End. Week 1 is the first week Rosario will use. | Test `056d6f5`, fix `fba41d3`. New `engine/workout.js currentRecords(session)`: the record `slotRecord` finds, once per slot, in plan order. Week 1 uses it. Checked in the browser: after the swap the count stays "1 of 8", the bench press is done, then "Exercise 2 of 8: Pulldown"; the chest press set (20 kg × 8) is kept. |
| R2 | **Medium** | `app/js/ui/parts.js` 51–61 (`lockedButton`) | The new double-tap lock turns Done off **before** it saves. When the save fails (phone full or storage blocked), the "Not saved" sheet shows (review F2), but Done stayed off, so after freeing space it could not be tapped again; only leaving the screen helped. In 0.3 the plain button could simply be tapped again. Same for warm-up Done and rest Skip. | Test `8b0e05c` (with `tests/fixtures/fake-dom.mjs`, a tiny pretend page), fix `62839e7`. A failed save turns the button back on and the error still reaches the "Not saved" sheet. A good save keeps the lock. |
| R3 | **Medium** | `app/css/app.css` 82 (body), 251 (table) | A note with a long run of letters and no space (for example a pasted web link) in "Where it is in my gym" made the set screen **864 px wide** at 375 px, and the fixed Done bar moved to y = 1788, **below the screen**. The where-note shows on the set, rest, week-1 and walk screens; the old machine settings note had the same risk. The machine card scrolled sideways too. | Test `aa1721d`, fix `3db7e94` (`body { overflow-wrap: anywhere }`). The print check then showed short words broken in the plan tables ("Sl-ot"): test `a6675a5`, fix `6eb489d` (`table { overflow-wrap: normal }`; tables hold plan text only). Checked in the browser: page 375 px, Done at y = 729, tables wrap normally. |
| R4 | Low | `app/js/ui/finish.js` 24 | The Finish ring drew itself even with Settings > Animations off: it checked only the phone's Reduce Motion. | Fixed in `4d5ef0d` (uses `motion.js reduced()`). |
| R5 | Low | `app/css/app.css` 91 | In a Gym row with a note, the pin icon was squeezed to 3 px (it showed as a dot). | Fixed in `4d5ef0d` (`svg.ic { flex-shrink: 0 }`). Checked in the browser: 15 px. |
| R6 | Low | `app/js/ui/theme.js` 11–16 | With Look = Auto, the phone's status-bar colour (`theme-color`) is set only when the app opens or Look changes. If the phone switches dark/light while the app is open, the status bar keeps the old colour until the next start. | Later (cosmetic). |
| R7 | Low | `app/sw.js` (164 files, about 6 MB) | The offline list now holds every photo. An update over weak signal may fail to finish; the phone then keeps the old version and tries again next time (nothing breaks, the banner just comes later). | Later: watch it on the phone after the push. |
| R8 | Low | `app/js/ui/stats.js` 15, `app/js/ui/progress.js` 102 | If the same exercise is done twice in one workout (swap A → B → back to A), "Last time" and the progress rows show only one of the two records. `performances()` (the engine) counts both, so suggestions are right. | Later (rare). |

Notes (not problems):
- In week 1, an exercise swapped away after set 1 keeps its one saved set but gets no week-1 starting weight; week 2 starts it from that one set with the normal rule. This follows from Rosario's answer 61 a; recorded in DECISIONS.md.
- The `lockedButton` ignores taps for 0.4 s after a new screen appears (so the second tap of a double tap does nothing). A very fast tap on a brand-new screen does nothing and says nothing; tapping again works. By design (JUDGING.md 3.6 item 3).

## Section 12 checklist

| Item | Result | What was checked |
|---|---|---|
| 1. Token handling | **Pass** | `ui/settings-sync.js`, `sync/*`, `syncer.js` unchanged. The new device keys `theme` and `motion_off` are saved by reading the device box and writing it back whole (`prefs.js`), so the key stays; `boot.js` only reads. Browser: a pretend key in the device box was **not** in the backup file, nor were `theme` or `motion_off`. CSP unchanged; no third-party script, font or embed; video links are plain links. |
| 2. Sync merge | **Pass** | `gym_spots` added to `merge.js LISTS` only; same join-by-id, later-edit-wins, tombstone and tie rules (tests 10–12 of `gym-spots.test.mjs`, plus the 0.3.1 merge fixture keeps the list it does not know). Browser restore: a file with an older copy of a note lost to the newer phone copy; a new note with an unknown field kept the field. |
| 3. Sync flow | **Pass** (unit tests only) | `sync.js`, `github.js` unchanged; the round trip through the pretend GitHub with notes passes (`gym-spots.test.mjs`). Not clicked through `?fake-github=1` in the browser this time. |
| 4. Data loss on the phone | **Pass** (after R1, R2) | Every set is still saved the moment Done is tapped: `lockedButton` runs the save at once; only the redraw waits 170 ms. "How many more" moved inline to the rest screen and saves on tap. Swap fix: saved sets keep their exercise (browser: chest press 20 kg × 8 stayed; the bench press started at its own 10 kg, set 1 of 3, its own warm-up). Old data without `gym_spots` validates unchanged and merges (browser: an old backup file restored fine). Restore on an empty phone and into a phone with data both worked, a safety copy was kept, and a damaged file was refused with "Gym spot 1 machine is empty." |
| 5. Untrusted data in the page | **Pass** (after R3) | All new text goes in through `h()` (text only). Browser: a note `<img src=x onerror=alert(1)> <b>bold</b>` shows as plain text on the Gym tab, the machine card and the set screen; no element was made. Notes are cut to 2000 letters (`clipText`, `maxlength`); machine names come from the app, not from data; the validator checks `machine` (1–60) and `where` (text up to 2000); `setGymSpot` refuses ids outside the frozen list. R3 stops a long note from widening the screen. |
| 6. Body data never in the public repo | **Pass** | Script search of every changed text file against the private intake: no match (only unrelated numbers). Fixtures and screenshots use made-up people. `private/` untouched. |
| Offline (`sw.js`) | **Pass** (unit tests) | `offline.test.mjs`: the list equals the files in `app/`, versions match (0.4.1). Fetch rules unchanged (same-site GET only). |

## What could not be checked

- **The "New version ready" banner, live.** The built-in browser refuses to start any service worker ("unknown error when fetching the script", while the file itself loads fine), so the banner could not be shown. `ui/update.js` and the banner rules are unchanged from 0.3.1 (only on the tab screens, never in a workout); the Gym tab is a tab screen, so the banner can show there too. Check on the iPhone after the push.
- **The phone's own Reduce Motion.** It cannot be switched on in this browser. The CSS rule (all animations 1 ms) and `motion.js reduced()` were read. The app's own Animations switch **was** checked: it sets `data-motion="off"`, stays after a reload, is saved in the device box only, and no animation runs on the plan screen.
- **The real print dialog.** The print rules were applied on screen at phone width instead: the screen parts hide and the A4 tables show (screenshot 14). A real A4 print was not made.
- **A real file on disk.** The backup file was made by the app and read before saving (it has the notes, no key); the save to Downloads itself was skipped. Restore used the app's own file box, given a file by script (no file picker in this browser).
- **Sync clicked through `?fake-github=1`** (unit tests only, see item 3).
- **iPhone Safari itself:** home-screen install, wake lock, sound, the real update. That is Rosario's look ([redesign-final/LOOK.md](redesign-final/LOOK.md)).
- Two oddities of the test set-up, not of the app: the Finish screen said "1442 min" because `?date=` pretends a different day than the real clock (localhost only, same code as 0.3.1); and once, after test data was deleted by hand in the middle of a screen change, it came back. This could not be repeated: deleting it again kept it deleted and the app went to the first-start screen.

## Screenshots

In [redesign-final/screens/review/](redesign-final/screens/review/): Today week 1 (dark), week-1 learn, week-1 rest, week 1 after the swap ("2 of 8"), Finish, Gym note shown as text, the machine card and set screen with a long note before the R3 fix (Done off the screen) and after, the swap mid-exercise fixed, the plank countdown, rest after a hold, Gym (light), plan print view (simulated), Today (light).

## For later (not blockers)

- R6: update `theme-color` when the phone switches dark/light (a `matchMedia` change listener).
- R7: after the push, check that the update finishes on the phone over mobile data; if it often fails, cache photos on first use instead of at install.
- R8: make "Last time" and the progress rows read every record of an exercise in a workout.
- From the last review, still open: F7 (undo a bad merge), F8 (run migrations in the validator when format 2 comes), F10 (file over 1 MB message).
