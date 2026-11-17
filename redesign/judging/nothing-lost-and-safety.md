# Judge 4 of 4: nothing lost and safety

Lens: nothing lost (features and information) and safety (data, sync, token, untrusted data, offline, body data).
Date: 2026-11-17. Judge 4 (Opus). Read and run only; no app file was changed. Scripts used live in the judge's scratchpad.

## What I did

- Read CLAUDE.md, docs/PRD.md (F1-F21), docs/ARCHITECTURE.md (sections 4-7, 10, 12), docs/REVIEW-2026-11-16.md, docs/DESIGN.md and the four PROPOSAL.md files.
- Ran `node --test` in each folder. Results: **old app 246 pass / 0 fail** (`node --test "tests/*.test.mjs"`), **A 268/0**, **B 260/0**, **C 268/0**, **D 263/0**.
  Note: a bare `node --test` in the root now finds 1305 tests, because it also runs the four redesign copies. The merge must remove `redesign/*/tests` from that run (or delete the copies), or the root count means nothing.
- Diffed every logic file against `app/` with line endings ignored (old files are CRLF, the copies LF: cosmetic only).
- Text inventory: a script pulled every visible text (358 strings of 10+ letters, plus short labels) from the old `app/js/ui/*.js` and searched each build. Every "missing" hit was checked by hand.
- Call inventory: every engine, model, store and syncer function the old screens use (113 names) was searched in each build.
- Probed each build's new note code with a scratch script (empty phone, odd machine ids, unknown fields, tombstones, old files).
- Served all four builds (ports 8241-8244) in my own browser tab: drew every chart with 0, 1, 2 and 30 points, loaded the same made-up profile, and read the Today screen. No console errors. Servers stopped and tab closed.
- Searched new and changed files in `redesign/` for Rosario's private numbers (read from `private/`, never printed), and looked at 3 screenshots with body numbers.

Tests passing does not prove the screens are complete. That is why the text, call and live checks were added.

## 1. Scores (1-10)

| Sub-point | A | B | C | D |
|---|---|---|---|---|
| Features F1-F21 kept | 9 - all present; engine identical | 9 - all present; engine identical | 8 - all present, but the plan sheet's day tables became tap rows (A4 print not checked) | 9 - all present; engine identical |
| Information kept | 9 - 0 missing (text and call inventory, live Today) | 9 - 0 missing (18 texts reworded, all still shown) | 9 - 0 missing; Today shows even more | 9 - 0 missing (7 texts reworded) |
| Machine-note data safety and test-first | 6 - tests first; but any machine id is saved (bad id blocks sync), unknown fields dropped on edit, name clashes with `machine_note` | 9 - tests first; id checked, unknown fields kept, sync round trip and old-app test | 6 - tests first; but `hasData` ignores the list, unknown fields dropped, `where` made required, fewest tests | 8 - tests first, widest tests (17); but any machine id is saved, like A |
| Engine and sync untouched | 10 - only the additive list | 10 - only the additive list | 9 - only the list, but `model.js` now imports the big media data file | 10 - only the additive list |
| Untrusted data, CSP, no third party | 10 - no HTML sinks, CSP identical, videos are plain links | 10 - same | 10 - same | 10 - same |
| Offline precache and no body data | 9 - list = files, version bumped; 5.5 MB precache | 9 - same, 5.4 MB | 9 - same, 5.4 MB | 9 - same, 5.6 MB |
| **Lens total (average)** | **8.8** | **9.3** | **8.5** | **9.2** |

## 2. Features F1-F21

Common evidence for all four: `js/engine/*`, `js/sync/*`, `backup.js`, `syncer.js`, `autosync.js`, `active.js`, `timer.js`, `wakelock.js`, `sound.js`, `shortcuts.js`, `errors.js`, `clock.js`, `h.js`, `ui/update.js`, `ui/flow.js`, `ui/units.js`, `plan/plan-v2.js` and `plan/cues.js` are byte-identical to `app/` (line endings aside). All 113 old screen calls are still used. All old texts are still in the code.

| # | Feature | A | B | C | D |
|---|---|---|---|---|---|
| F1 | First start, intake, restore | present (setup.js, intake.js) | present (restore as list rows) | present | present |
| F2 | Targets | present (targets.js unchanged) | present (tiles + edit list) | present | present (CSS only) |
| F3 | Plan in app + printable sheet | present (tables kept) | present (print-only A4 tables kept) | partly: same facts, day tables now rows; print not checked | present (tables kept) |
| F4 | Today (week/phase, time, sync, Watch, food, Start/Short/Swap, missed days) | present (live check) | present (live check) | present (live check) | present (live check) |
| F5 | Walk, build-up, result | present | present | present | present |
| F6 | Change-over, lift warm-up | present | present | present | present |
| F7 | Pairs and sets (target, suggestion, last time, warm-up sets, tips, machine note, save per set) | present (pair.js:175 machine note) | present (pair.js:151) | present (pair.js:272) | present (pair.js:184) |
| F8 | Rest (+30/-30, skip, next set, flash) | present | present | present ("how many more" moved here; sheet still used when there is no rest) | present |
| F9 | Swap with reasons, "it hurts" note | present | present | present | present |
| F10 | Abs and timed holds | present | present | present | present |
| F11 | Week 1 (find weights, start weight, machine note) | present (week1.js) | present (not walked in a browser by B) | present | present (not walked by D) |
| F12 | Progression rules | present (engine identical) | present | present | present |
| F13 | Finish (time, sets, new bests, next time, effort, note, sync message) | present | present | present | present |
| F14 | Weigh-in, kg and st/lb, measurements every 4 weeks | present | present (reworded headers) | present | present |
| F15 | Trend and weekly summary (band, food suggestion) | present | present | present | present |
| F16 | Charts with 0, 1, many points | present (live: no error) | present (live; sparkline too) | present (live) | present (live) |
| F17 | Sync, buttons, status | present (settings-sync.js identical) | present (head restyled only) | present (identical) | present (head restyled only) |
| F18 | Backup and restore from file | present (backup.js identical) | present | present | present |
| F19 | Offline, screen on | present (sw list ok; wakelock identical) | present | present | present |
| F20 | Update banner, never in a workout | present (update.js identical, class exists in CSS) | present | present | present |
| F21 | Shortcuts "Log to Health" | present (today, finish, settings) | present | present | present |

### Information-missing list per build

Checked items: week and phase, expected time, sync status, Watch reminder (Today, walk, finish), food numbers, starting walk, missed-days message, continue-workout card, last time weight and reps, target line, suggested weight, warm-up sets, form tips, machine settings note, "you swapped because it hurt", next set under rest, new bests, what changes next time, trend band, food suggestion, Shortcuts button, update banner, install hint, key-ends-soon line, short day, swap day, measurements every 4 weeks, kg and st/lb, "Not saved" sheet.

- **A: 0 missing.** Only text hit was a template false alarm ("Every set you did is saved" now adds a count).
- **B: 0 missing.** 18 texts reworded, each checked: Watch line now its own row; "Measurements · every 4 weeks"; labels lost "(cm)" but a "cm" unit sits beside each field; "See last week" is now a "Last week is ready" row; "Save note" is now "Save setting".
- **C: 0 missing.** The old Tips sheet (machine settings note) now lives in the exercise sheet; the machine note still shows on the set screen.
- **D: 0 missing.** 7 texts reworded: "Every 4 weeks" eyebrow + "Measurements"; finish header "Well done" replaced; "Machine:" became "Machine settings:".

## 3. The machine "where" note

| | A | B | C | D |
|---|---|---|---|---|
| List name | `machine_notes` | `gym_spots` | `gym_spots` | `machine_spots` |
| Record | id, updated_at, machine, where | same | same | same |
| Id | `g-<machine>` (ids.js) | `g-<machine>` (inline) | `g-<machine>` (inline) | `g-<machine>` (ids.js) |
| Machine id check in model | none | regex `[a-z0-9_]{1,50}` | must exist in machines table | none |
| Empty or 70-letter id | saved, then fails the check (sync stops "local_invalid") | refused | refused | saved, then fails the check |
| Unknown fields kept on edit | no (record replaced) | yes | no (record replaced) | yes |
| Re-save clears a tombstone | yes (replaced) | yes | yes (replaced) | yes |
| Trim + clipText (2000) | clip only | yes | yes | yes |
| `emptyDoc` | yes | yes | yes | yes |
| merge LISTS | yes | yes | yes | yes |
| Validator: optional list, old file unchanged | yes | yes (generic OPTIONAL_LISTS set) | yes | yes |
| Validator: machine 1-60, where text | where optional | where optional | **where required** | where optional |
| `hasData` counts it | yes | yes | **no** | yes |
| Backup / restore / sync | yes (no code change needed) | yes | yes | yes |
| Tests (count) | 16 | 14 | 13 | 17 |
| Tests first (commits) | fc6d754 then 71ba4dd | d1b6f03 (copy + tests) then fc3b5d9 | e3a5bc5 then cfd4a73 | 751ac21 then cb83746 |
| Fake-GitHub round trip test | no | yes | no | yes (two phones) |
| Tombstone never revived test | yes | no | no | yes |
| Restore into a phone with data test | yes | no | no | yes |
| Unknown-field test | no | yes, plus "old app keeps the list" | no | yes |

Test-first check: in all four the code commit also touched the new test file. Each change made the test **stricter**, not weaker: "old file gets an empty list" became "old file comes back exactly unchanged", to match the existing validate test. All four said so in the commit message. Old test files are identical to `tests/` in all four.

Old app on a second phone: its merge keeps an unknown record list ("a list from a newer app") and its validator keeps unknown fields, so a phone still on 0.3.1 does not drop the notes. B has a test for this.

**Machine ids differ between builds.** Only `treadmill` and `cable_station` exist in all four catalogues (union 28 ids). A and D are almost the same and match the existing `extra_machines` keys (`lat_pulldown`, `seated_row`, `leg_curl`, `pec_deck`, `calf_raise`); B adds `_machine` suffixes; C lacks `pec_deck` and uses `smith`. Once Rosario saves a note, the id is frozen: renaming a machine later orphans its note.

### Recommended model (one)

- **Name:** `gym_spots` (two builds already agree; `machine_notes` is too close to the existing `exercise_state.machine_note`, which means seat settings).
- **Record:** `{ id: "g-<machine>", updated_at, machine, where }`, plus `deleted` / `deleted_at` on a tombstone. Unknown fields kept.
- **Id:** `g-<machine>`, made by one helper in `ids.js` (as A and D). Machine ids from ONE frozen catalogue; use the A/D ids (they match `extra_machines` and the plan's exercise ids). Write the catalogue ids into a test so a rename fails loudly.
- **Model:** `setGymSpot(machineId, where)`: refuse an id that is not in the catalogue (C's guard) and not `^[a-z0-9_]{1,50}$` (B's guard); keep the old record's unknown fields with a spread and drop `deleted`/`deleted_at` (B/D); `clipText(String(where ?? "").trim())`.
- **Validator:** B's `OPTIONAL_LISTS` set (skip when missing, so an old file comes back unchanged); `machine` text 1-60, not empty; `where` optional text up to `MAX_TEXT` (A/B/D, not C's required).
- **Plugs in:** `emptyDoc`, `merge.js LISTS`, `validate.js LISTS + CHECKS`, `store.js hasData`. Backup and sync need no other change. UI: `maxlength: MAX_TEXT` on the box, text set only with `h()`.

### Tests the merge worker writes first (own commit, must fail before the code)

1. `emptyDoc().gym_spots` is `[]`; `LISTS` includes it.
2. An old document without the list validates and comes back exactly unchanged (`deepEqual`).
3. A phone saved by the old app (no list): the first note adds the list and keeps everything else.
4. Saving twice for one machine keeps one record with a newer `updated_at`.
5. Empty note saved as `""` (record kept, so the clear syncs).
6. A 2001+ letter note is cut to `MAX_TEXT` and the document still passes the check.
7. Ids refused: `""`, `"Leg Press!"`, 70 letters, an id not in the catalogue. Nothing saved.
8. Validator: accepts good notes, tombstones without `where`, unknown fields; refuses non-text `where`, too-long `where`, missing or empty `machine`, with plain messages.
9. A note holding `<img onerror>` text is kept as plain text.
10. Merge: one-side records kept; later edit wins; symmetric; merging twice changes nothing; one side with no list keeps the other's notes.
11. Merge: an older copy never revives a tombstone.
12. Re-saving a tombstoned machine clears `deleted`; unknown fields survive the edit.
13. `hasChangesSince` sees a new note; `hasData` is true for a phone holding only a note.
14. Backup holds the notes and no token; restore on an empty phone gives them back; restore into a phone with data merges and drops none.
15. Sync round trip through the fake GitHub to a second phone.
16. The 0.3.1 merge (copy of the old function) keeps a `gym_spots` list it does not know.
17. Catalogue ids are fixed (snapshot list), so a rename breaks the test.

## 4. Engine and sync diffs found

Byte-identical in all four (line endings aside): `js/engine/*`, `js/sync/sync.js`, `js/sync/github.js`, `js/sync/fake-github.js`, `backup.js`, `syncer.js`, `autosync.js`, `active.js`, `errors.js`, `clock.js`, `timer.js`, `wakelock.js`, `sound.js`, `shortcuts.js`, `h.js`, `chartmath.js`, `plan/plan-v2.js`, `plan/cues.js`, `ui/update.js`, `ui/flow.js`. `sw.js` changed only in the file list and version.

- **A:** `ids.js` +`machineNoteId`; `model.js` +`setMachineWhere` and import; `store.js hasData` + list; `merge.js LISTS` + list (comment too); `validate.js` LISTS, emptyDoc, CHECKS, skip-if-missing. Device key `theme` (read-modify-write, keeps the token). Manifest colours changed.
- **B:** `model.js` +`setGymSpot`; `store.js hasData`; `merge.js LISTS`; `validate.js` (+`OPTIONAL_LISTS`). `ui/settings-sync.js`: icon, status dot, red "Forget" button; key handling unchanged. `ui/workout.js`: adds a screen key for animation only. No new device keys.
- **C:** `model.js` +`setGymSpot` and `import { machines } from "./plan/media.js"`; `merge.js LISTS`; `validate.js`. `store.js` unchanged, so **`hasData` misses `gym_spots`**. Device keys `theme`, `motion`. `settings-sync.js` identical.
- **D:** `ids.js` +`machineSpotId`; `model.js` +`setMachineSpot`; `store.js hasData`; `merge.js LISTS`; `validate.js`. `settings-sync.js`: icon only. Device key `motion_off`. `main.js` syncer refresh list lacks the new `#/gym` (harmless).

No non-cosmetic change outside the note in any build.

## 5. Best build per element (this lens only)

| Element | Best | Why (lens view) |
|---|---|---|
| Today | C | keeps every old line and adds weight, trend and food tiles |
| Set screen | n/a | all keep target, last time, suggestion, warm-up sets, tips, machine note |
| Rest | n/a | all keep +/-30, skip, next set |
| Walk, warm-up, swap, finish, weigh-in, weekly | n/a | all complete |
| Week 1 | n/a | all keep start weight and machine-note saving; B and D not walked in a browser |
| Progress and charts | n/a | all draw 0, 1, many points without error |
| Plan sheet | A, B or D | keep the A4 tables (B keeps print-only tables); C changed them to rows |
| Machines list and card | B | safest data path (id guard, keeps unknown fields, sync and old-app tests) |
| Exercise sheet | n/a | video links are plain `target=_blank rel=noopener` in all |
| Settings | C | sync card byte-identical to the reviewed one; B and D only restyle the head |
| Setup and intake, targets | n/a | all complete |
| Update banner | n/a | `update.js` identical in all |
| Motion system | C or D | an in-app off switch plus Reduce Motion; A and B rely on Reduce Motion only |
| Colour tokens, icons | n/a | icons built with DOM calls, no HTML strings, in all |

## 6. Must-fix problems per build

**A**
1. `app/js/model.js:177-183` `setMachineWhere`: no machine-id check. An empty or 61+ letter id saves a record that `validate.js` refuses, so every later sync stops with "local_invalid" (the same class as review F1). Add the catalogue check.
2. `app/js/model.js:181`: the record is replaced, so unknown fields from a newer app are lost on edit. Spread the old record.
3. Name `machine_notes` sits next to `exercise_state.machine_note` (seat settings): easy to mix up. Rename if A's model is kept.
4. Tests miss a fake-GitHub round trip and an unknown-field case.

**B**
1. `app/js/model.js:184-186`: works, but sets `deleted: undefined` then deletes it again. Simplify to one clear path (D's pattern).
2. `tests/gym-spots.test.mjs`: add tombstone-revival and restore-into-a-phone-with-data tests.
3. Machine ids carry a `_machine` suffix that does not match `shared_settings.extra_machines` keys. Align before Rosario saves notes.

**C**
1. `app/js/store.js:86` `hasData` lacks `gym_spots`: a phone holding only notes is treated as empty, so Restore replaces instead of merging, and sync says "nothing to send".
2. `app/js/validate.js:239` `text(x.where, …)`: `where` is required, unlike the other three. A note from another version without `where` makes the whole file "damaged". Use `x.where ?? ""`.
3. `app/js/model.js:185`: record replaced; unknown fields lost on edit.
4. `app/js/model.js:7`: the delicate `model.js` now depends on `plan/media.js` (104+ lines of photo data). Pass the catalogue in, or keep the id list in a tiny module.
5. Tests miss sync round trip, tombstone revival and restore-merge.
6. `app/js/ui/plansheet.js`: the day tables became tap rows; check the A4 print before merging.

**D**
1. `app/js/model.js:176-185` `setMachineSpot`: no machine-id check (same failure as A 1).
2. Otherwise the data path is good; keep its tests as the base set.

**All builds**
- Precache grew from about 280 KB to 5.4-5.6 MB (`cache.addAll`, all-or-nothing). On a weak first visit the install can fail and retry; data is safe (localStorage), but offline photos are not there until it succeeds. Consider smaller photos (B suggests 400 px).
- Root `node --test` now also runs the four copies (1305 tests).

## 7. Safety rules for the merge worker

Must not change (beyond adding the one note list): `js/engine/*`, `js/sync/*`, `backup.js`, `syncer.js`, `autosync.js`, `active.js`, `errors.js`, `clock.js`, `timer.js`, `wakelock.js`, `shortcuts.js`, `h.js`, `plan/plan-v2.js`, `plan/cues.js`, `ui/update.js`, `ui/flow.js`, `ui/settings-sync.js` key handling, the CSP line, the sw.js fetch rules. Never edit an old test.

Before each commit:
1. `node --test "tests/*.test.mjs"` all pass; count = 246 + new tests.
2. `diff -r --strip-trailing-cr` of the files above against `app/` shows only the planned list lines.
3. `grep -rnE "innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function"` in `app/js` finds only comments.
4. CSP meta equals the old one; no `http` host in the code except `api.github.com`, `www.youtube.com` (plain links), `eparmedx.com`, `github.com` (credits).
5. Offline test passes: sw list = every file, `APP_VERSION` bumped in `sw.js` and `version.js`.
6. No `ghp_` / `github_pat_`; search new files for Rosario's private numbers (script reading `private/`, never printing); fixtures and screenshots use made-up people.
7. Do not copy `redesign/*/screens`, seeds or RESEARCH into `app/`; never copy anything from `private/`.
8. Browser: old document (no list) loads unchanged; save a note; backup; restore on an empty phone; sync with `?fake-github=1`; a note with `<b>` shows as text.
9. Delicate parts (ARCHITECTURE section 12): Opus review of the note's model, validator and merge change.

## 8. Not checked

- No real iPhone; no Safari; no Home Screen install; no offline test in a browser with the network cut.
- Did not walk any build through a full workout, week 1, holds, swap day, short day, missed days or the update banner in the browser. Those are proved only by code and text inventory, which shows the code is there, not that each screen draws it well.
- Did not print any plan sheet.
- Did not run the sync screens against the fake GitHub in a browser (unit tests cover sync, and sync code is unchanged).
- Looked at 3 of about 220 screenshots. No private numbers found. One protein value seen in a screenshot equals a number in the private plan, but it is the public formula's output for the made-up 80 kg test person, so it is a coincidence, not a leak.
- Did not check photo licences or video content (other judges' lenses).
- Did not read every line of the new UI files; the safety greps and inventories stand in for that.
