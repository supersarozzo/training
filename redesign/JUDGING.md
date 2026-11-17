# Redesign judging: verdict and merge plan

Date: 2026-11-17. Task chat 8.23 (judging panel lead, Opus). No app code was changed.
Inputs: four independent Opus judges, each with one lens, who could not see each other's verdicts:
- [judging/looks-and-motion.md](judging/looks-and-motion.md) (Judge 1)
- [judging/speed-at-the-gym.md](judging/speed-at-the-gym.md) (Judge 2)
- [judging/media-and-machines.md](judging/media-and-machines.md) (Judge 3)
- [judging/nothing-lost-and-safety.md](judging/nothing-lost-and-safety.md) (Judge 4)

Builds: A = dark premium sport, B = clean Apple style, C = fast data-dense logger, D = coach style (`redesign/<x>/`).
Tests (`node --test` in each folder, all four judges got the same counts): A 268/0, B 260/0, C 268/0, D 263/0 (pass/fail). Old app: 246/0.

## 1. Scores

Each cell is the judge's lens total (average of 6 sub-scores, 1-10).

| Lens | A | B | C | D |
|---|---|---|---|---|
| Looks and motion | **8.0** | 7.7 | 7.7 | **8.0** |
| Speed at the gym | **7.7** | 6.0 | 6.8 | 6.8 |
| Media and machines | 7.0 | **7.6** | 7.3 | 6.8 |
| Nothing lost and safety | 8.8 | **9.3** | 8.5 | 9.2 |
| **Average** | **7.88** | 7.65 | 7.58 | 7.70 |

**Ranking: 1. A (7.88) · 2. D (7.70) · 3. B (7.65) · 4. C (7.58).** The gap is small. No build is best at everything, so the final app is a merge, not a pick.

What each build does best:
- **A** is the only build where every set meets the PRD speed goal (1 tap if right, at most 3 if not) with big numbers and no scrolling. It has the most premium look, and its colours pass WCAG AA everywhere. Two judges independently chose it as the base.
- **B** has the best media layer (the where-note shows on every screen that needs it, honest photo captions, crossfade loop with tap to pause), the best light mode and the safest note data code. Its set screen fails the no-scroll rule.
- **C** has the best charts, weekly tiles, icons and the Look settings group, plus the fastest logging ideas (numbers on the Done button, PREVIOUS copies last time, "How many more?" on the rest screen). Its faint grey fails contrast and its steppers are the smallest.
- **D** has the best motion system (purposeful, in-app off switch), clean contrast, the widest note tests and an honest "signs may differ" line on machine cards. It shows two wrong machine photos, and its set screen fails the no-scroll rule.

Nothing is lost in any build: Judge 4 found all of F1-F21 and 0 missing pieces of information in each (358 old screen texts, 113 old engine calls, live Today check). Engine and sync code are byte-identical to `app/` in all four, apart from the added note list.

## 2. Pick per screen and element

| Element | Chosen | Why |
|---|---|---|
| Today | **A**, plus C's list of today's exercises with suggested weights | A's photo strip, 12-week bar and timeline look most premium (J1). C's list helps Rosario get ready and shows more information (J2, J4). |
| Set screen | **A**, plus C's numbers on Done and PREVIOUS button, D's 170 ms Done lock, B's "Where is it?" chip | A is the only one that fits at 375 x 812 with 42 px numbers and 58 px steppers (J1, J2). The photo must show the whole move (J3 fix below). |
| Rest | **A**, plus C's inline "How many more?", B's moving photo and where-note on "Next", B's "Saved · 55 kg × 10" line | 92 px timer, round ±30, Undo far from Skip (J2). No sheet over the timer (J2). B is the only one showing where the next machine is (J3). |
| Walk | **A**, plus B's where-note and machine link | A's treadmill hero and tiles (J1); B's media (J3). Fix A's light-mode text over the photo. |
| Warm-up | **B's inset list with A's moving photo per move** | Cleanest list (J1); each move with a moving photo (J3). |
| Swap | **B** | Photo for each swap choice, coloured reason icons always with a word, 44 px rows (J1, J2, J3). |
| Finish | **A** | Ring and counters draw in, calm (J1). Save is 1 tap in all. |
| Week 1 | **A styling, B's photo + where-note + machine chip**; C's screenshots as the reference for every step | Only C shot every step (J1); B has the best media there (J3). No judge walked week 1 live: the merge worker must. |
| Weigh-in | **B's layout with D's wide −/+ buttons** | B looks best (J1); D's 146 x 56 buttons and Save far from other buttons are fastest (J2). |
| Progress and charts | **C**, with A's photo thumbnails in exercise rows | Draw-in charts, gold best dots, trend line per exercise (J1). |
| Weekly | **C** | Number tiles with a 5-segment workout bar (J1). |
| Plan sheet | **B** | Week / Exercises / Machines segments, photo lists, print-only A4 tables kept (J1, J3, J4). Not C: its day tables became tap rows (J4). |
| Machines list and card | **B's card and list**, reached from a **Gym tab** (C/D) with C's "x of 15 noted" counter; D's sign caveat, per-machine tip and hiding of machines the gym does not have | B shows the note everywhere and has quick-word chips (J3); C's Gym tab and counter look best (J1); D is the only honest one about sign names (J3). |
| Exercise sheet | **B**, plus A's start/end side-by-side pair | Big photo, how-to, honest close-match note, video pill, machine row (J1, J3). |
| Settings | **C's Look group (Auto/Light/Dark) and a real Animations switch**, in B's inset-list style; sync card unchanged | J1, J3, J4. C's sync card is byte-identical to the reviewed one. |
| Setup and intake | **D** | App icon tile, photo strip, card per choice, thin progress bar (J1). |
| Targets | **B** | Number tiles with small icons (J1). |
| Update banner | **Keep `ui/update.js` identical; style in A's tokens** | All four are the same; nobody saw it live (J1, J4). |
| Motion system | **D's** (purposeful, in-app off switch, crossfade photo loop) with **B's 1 ms Reduce Motion technique**, applied to A's motions | J1, J3, J4. |
| Colour tokens | **A** (all pairs pass), with D's contrast discipline for any new value | J1. See question 1 in section 4 about the accent. |
| Icons | **C's set** (original, always with a word), with B's rack/bench/mat drawings redrawn in the same stroke | J1, J3. One icon set only. |

## 3. Merge plan (for the merge worker)

### 3.1 Base and rules

- **Base: `redesign/a/app/`.** Copy it to `app/` as the starting point. Then bring in the parts in 3.2, each restyled in A's tokens so all screens look like one piece.
- Model: Opus, high effort. The note data model is a delicate area (ARCHITECTURE section 12): tests first, in their own commit, then the change, then the Opus safety review.
- The master may split this into steps (one chat each: data model, media layer, screens, fixes). In any case, follow this order: data tests → data change → media layer → screens → fixes → checks.
- **Must not change** (beyond the one note list): `js/engine/*`, `js/sync/*`, `backup.js`, `syncer.js`, `autosync.js`, `active.js`, `errors.js`, `clock.js`, `timer.js`, `wakelock.js`, `shortcuts.js`, `h.js`, `plan/plan-v2.js`, `plan/cues.js`, `ui/update.js`, `ui/flow.js`, the key handling in `ui/settings-sync.js`, the CSP line, the `sw.js` fetch rules. Never edit an old test.
- Run tests as `node --test "tests/*.test.mjs"`. A bare `node --test` in the root now also runs the four redesign copies (1,305 tests), so its count means nothing.
- Never put data into `innerHTML`. No third-party scripts, fonts or embeds. Videos stay plain links (`target="_blank" rel="noopener noreferrer"`).

### 3.2 Which part comes from which build

| From | Take |
|---|---|
| A (base) | Tokens, type, Today, set screen, rest, walk, finish, motion pieces (ring draw, counters, set tile pop), media tests (`tests/media.test.mjs`, 6 tests), rear-delt photo, pec deck machine card, start/end side-by-side pair in the exercise sheet, device key `theme`. |
| B | Media layer: `js/plan/media.js` + `js/plan/machines.js` content, exercise sheet, machine card, where editor, quick-word chips, where-note on set/rest "Next"/walk/week 1/sheet/list, swap sheet, warm-up list, weigh-in layout, plan sheet (segments + print-only A4 tables), targets tiles, shoulder-press photo, rack/bench/mat drawings, Reduce Motion "1 ms" technique, note model code (`setGymSpot` with the id check and unknown fields kept), `OPTIONAL_LISTS` in the validator, sync round-trip test and "old app keeps the list" test. |
| C | Inline "How many more?" on the rest screen; numbers on the Done button; PREVIOUS button (copy last time in 1 tap); today's exercise list on Today; progress charts (draw-in, gold best dots, per-exercise trend line); weekly tiles; Gym tab and its counter; Look settings group; icon set; seated DB shoulder press photo; `match: same/close` + `matchNote` data shape; media tests (4); catalogue check in the model (id must exist). |
| D | Animations off switch (device key `motion_off`, also stops JS helpers and the photo loop); crossfade loop with "tap to see the end" when motion is off; blurred side bands for the 2 portrait photos; 170 ms Done lock with a "Saved" tick (also on rest Skip); wide weigh-in −/+ buttons; setup and intake look; sign caveat line, per-machine tip, hiding machines the first visit did not find; note tests (17, the widest set); `tools/videos-checked.json` as the video check record. |

### 3.3 ONE machine-note data model

Recommended by Judge 4; it combines the safe parts of all four.

- **List name:** `gym_spots`. B and C already use it. Not `machine_notes` (too close to the existing `exercise_state.machine_note`, which means seat settings).
- **Record:** `{ id: "g-<machine>", updated_at, machine, where }`, plus `deleted` / `deleted_at` on a tombstone. Unknown fields are kept.
- **Id:** `g-<machine>`, made by one helper in `ids.js`. Machine ids come from **one frozen catalogue using A/D's ids** (they match `shared_settings.extra_machines` and the plan's exercise ids: `lat_pulldown`, `seated_row`, `leg_curl`, `pec_deck`, `calf_raise`, …). B's media layer uses `_machine` suffixes: rename them to the A/D ids when B's `machines.js` is brought in. The ids must be fixed before Rosario saves any note; a later rename orphans notes.
- **Model:** `setGymSpot(machineId, where)`. Refuse an id that is not in the catalogue (C's guard) or does not match `^[a-z0-9_]{1,50}$` (B's guard). Keep the old record's unknown fields and drop `deleted`/`deleted_at` (B/D). Save `clipText(String(where ?? "").trim())`. Keep the catalogue id list in a tiny module so `model.js` does not import the big media file (C's problem).
- **Validator:** B's `OPTIONAL_LISTS` (an old file without the list comes back exactly unchanged). `machine` is text 1-60, not empty. `where` is optional text up to `MAX_TEXT` (2000), not required (C's mistake).
- **Plugs into:** `emptyDoc`, `merge.js LISTS`, `validate.js` LISTS + CHECKS, `store.js hasData` (C forgot this). Backup and sync need no other change. UI: `maxlength: MAX_TEXT` on the box; text set only with `h()`.
- **Tests to write first** (own commit, must fail before the code; full wording in Judge 4's file, section 3): (1) `emptyDoc` has the list and `LISTS` includes it; (2) old document validates unchanged; (3) first note on an old phone adds the list, keeps the rest; (4) saving twice keeps one record, newer `updated_at`; (5) empty note saved as `""`; (6) a 2001+ letter note is cut and still valid; (7) bad ids refused (`""`, `"Leg Press!"`, 70 letters, not in catalogue); (8) validator accepts good notes, tombstones, unknown fields, and refuses bad `where`/`machine` with plain messages; (9) `<img onerror>` text stays plain text; (10) merge: one-side kept, later edit wins, symmetric, idempotent, one side without the list; (11) a tombstone is never revived by an older copy; (12) re-saving a tombstoned machine clears `deleted`, keeps unknown fields; (13) `hasChangesSince` and `hasData` see a note; (14) backup holds notes and no token, restore on an empty phone and into a phone with data; (15) sync round trip through the fake GitHub; (16) the old 0.3.1 merge keeps a `gym_spots` list it does not know; (17) catalogue ids snapshot.
- **Also test first:** the device keys `theme` and `motion_off` are on the device only (never in the synced document, never in a backup); the walk minutes on Today equal the walk screen's (3.6 item 1); media tests merged from A and C (every plan exercise, warm-up move and the walk has photos or a drawing; every file exists and is a JPEG; every exercise has a valid machine; every machine has a card; every plan exercise has a video; `sw.js` lists every photo).

### 3.4 Photos

- **Decision: keep the current size (850 px wide, about 60 KB each).** On a 3x iPhone the big sheet photo shows at about 1,030 real pixels, so 850 px is already a little below full sharpness (J3). Shrinking to 720 px at quality 78 would save about 1.4 MB (27%) at the cost of softer photos. The download happens once and the log is safe either way. See question 2 in section 4.
- Do now: shrink only the two 1280 x 720 dead-bug photos to 850 px wide (the only oversize files).
- Library entries (J3, section 3): shoulder press = B's `Machine_Shoulder_Military_Press` (pin stack); rear-delt raise = A's `Dumbbell_Lying_Rear_Lateral_Raise`; seated DB shoulder press = C's `Dumbbell_Shoulder_Press`; lat pulldown machine = `Close-Grip_Front_Lat_Pulldown`; seated row machine = `Leverage_Iso_Row` (never D's two); glute bridge = `Barbell_Glute_Bridge` with the note "use one dumbbell"; leg curl = seated, with a seated video; chest press = keep `Leverage_Chest_Press` with a close-match note, and fix the card text that says "weight stack" under a plate-loaded photo (the first gym visit decides pin or plate; `Machine_Bench_Press` is the pin-stack option).
- Check every start/end pair plays start first: rear-delt raise and seated DB shoulder press were reversed in some builds.
- Show a one-line note under every close-match photo (hip thrust, Romanian deadlift, glute bridge, cable lateral raise, pulldown, walk), using C's `match`/`matchNote` shape.
- Big photos show the whole move: no crop of the feet or the body (C's calf raise lost the feet; A's set-screen hero covers the move with text). Use contain with D's blurred side bands for portrait photos, and keep text off the body.

### 3.5 Look setting

- Settings → **Look: Auto / Light / Dark**, default **Auto** (follows the phone). Device key `trn.device.v1.theme` (A), never synced or backed up. Applied before first paint, so there is no flash.
- Settings → **Animations: on / off** switch (D's `motion_off`), device only. Off stops CSS motion, the JS helpers and the photo loop (tap to see the end). The phone's Reduce Motion also turns motion off (B's 1 ms technique, so end states still show).
- Update docs/DESIGN.md with the new tokens and these two settings, and add a row to docs/DECISIONS.md (the old "one flat teal accent" row changes only with Rosario's answer to question 1).

### 3.6 Fixes to include

1. **Walk minutes mismatch** (found by builder D; also in the live `app/`). Today's timeline takes the walk minutes from `sessionMinutes.full.walk` (30) in `plan/plan-v2.js`. The walk screen takes them from `walkSuggestion()` in `engine/workout.js`, which gives 20 minutes (the "No" row of intake question 36, WORKFLOW B5 "build up from 20 minutes") until a walk with an effort score is saved, then jumps to 30. Fix in the UI only: Today's walk line and its "About N minutes" total use `walkSuggestion(...).minutes`, so both screens show the same number. No engine change. (How 20 should grow to 30 is question 3 in section 4.)
2. **Weak video picks:** use Judge 3's "best video per exercise" table (section 4 of media-and-machines.md) for every exercise listed there: mostly PureGym, ScottHermanFitness, Renaissance Periodization, NASM, Hinge Health, NHS inform, short demos with exact equipment. Drop the 5-6 minute picks and the face-pull video with a swear word in its title. Do not show video titles (D's choice); show the channel. Keep `tools/videos-checked.json` as the record (oEmbed 200 + title, date).
3. **Speed (J2), on the merged screens:**
   - Weight and reps steppers visible without scrolling on the FIRST exercise of a pair, with warm-up sets and the where line shown (the case B and D failed). Write it as a browser check at 375 x 812.
   - "How many more?" sits inline on the rest screen; no sheet over the timer, and no Skip on top of the rest Skip.
   - 170 ms lock after Done and after rest Skip, so a double tap cannot skip the rest.
   - "Undo that set" at least about 40 px away from "Skip rest".
   - Workout "End" button at least 44 x 44 (A's is 63 x 36). "How many more?" buttons 56 px tall. Chips 44 px tall.
   - Steppers at least 56 px and numbers at least 40 px (not C's 44 px / 26 px).
4. **Looks (J1):**
   - Dark photo plate must be dark (A's `--photo-plate: #eceef1` draws pale frames).
   - Light mode: a dark scrim under any text on a photo, or the text goes below the photo (A's walk and week 1 heroes).
   - Ring "breathe" glow only in the last 10 s, not forever.
   - Animate only transform and opacity (A's `set-in`, C's `glow`).
   - No faint grey for real data (C's `--text-3`). Every text pair at least 4.5:1, UI parts at least 3:1, in both themes; a token used must be defined (B's missing `--accent-text`); no white tick on light green (B, 2.22).
   - One close position for sheets: top right.
5. **Media (J3):** where-note on the rest "Next" card; machine card does not open the keyboard by itself; "Usual sign" wording plus D's caveat ("signs and areas may differ at your gym"), never stated as fact; passive thumbnails do not say "Tap to pause" to screen readers.
6. **Safety (J4):** everything in 3.3, plus: `sw.js` list = every file in `app/`, `APP_VERSION` bumped in `sw.js` and `version.js`; no `redesign/*/screens`, seed scripts or RESEARCH files copied into `app/`; nothing from `private/`.

### 3.7 Not in this merge (separate task)

- **Swap in the middle of an exercise** (J2; in all four builds AND the live app): `model.js swapExercise` relabels the sets already saved for that slot, and the stepper carries the old weight over. Live example: a 35 kg chest press set became "Dumbbell bench press: 8 reps at 35 kg, a new best", and "next time" said 35 kg. This is a data bug in a delicate file, not a look change. It needs its own chat: tests first, then the fix, then an Opus review.
- After Rosario approves the merged app: decide whether to delete `redesign/*/app` and `redesign/*/tests` (about 23 MB of copies, and they make the root `node --test` run 1,305 tests). Keep the docs, judging files and screenshots as the record.

### 3.8 Checks before the merge worker says "done"

1. `node --test "tests/*.test.mjs"`: all pass; count = 246 + new tests.
2. `diff -r --strip-trailing-cr` of the must-not-change files against the old `app/` shows only the planned list lines.
3. `grep -rnE "innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function" app/js` finds only comments.
4. CSP meta equals the old one. No host in the code except `api.github.com`, `www.youtube.com` (plain links), and the existing credit links.
5. Offline test passes (sw list = files, version bumped).
6. No `ghp_` / `github_pat_`; private numbers searched by a script that reads `private/` and never prints it; fixtures and screenshots use made-up people.
7. Browser at 375 x 812, light and dark, motion on and off: a full Monday workout, week 1, a timed hold, swap, short day, update banner, weigh-in, progress, Gym tab, machine card, sync with `?fake-github=1`, backup and restore, an old document without the list, a note with `<b>` shown as text.
8. Screenshots of every screen (light and dark) for the Opus safety review and for Rosario.

## 4. Questions for Rosario (through the master)

1. **Accent colour.** A's look uses a bright volt yellow-green accent. docs/DECISIONS.md (2026-11-16) says "one flat teal accent". a) Volt (A's look, the judges' choice for "premium"). b) Teal-mint (D's, closest to the old decision). Recommended: a, because it is the look that won; Rosario sees it on the phone before the push.
2. **Photo size.** a) Keep sharp photos (about 5.4 MB, downloaded once). b) Smaller photos (about 3.9 MB, a little softer). Recommended: a, because the download is once and the photos are already below full sharpness on an iPhone.
3. **Walk build-up.** For the "No" answer to intake question 36, WORKFLOW says "build up from 20 minutes", but the engine jumps from 20 to 30 minutes after the first walk. a) Fix only the display now (both screens show the same number); keep the engine. b) Also add a slow build-up (for example +5 minutes a week until 30): an engine change with tests and an Opus review, as its own task. Recommended: a, because the redesign must not change engine logic; b can follow if Rosario wants it.

## 5. What no judge could check

- **A real iPhone:** Safari, Home Screen install, safe areas, frosted blur, real frame rate and touch, sound, the "Go" flash, wake lock, the timer after locking the phone, offline photo caching, opening YouTube links. Desktop browser at phone size only.
- **The gym itself:** sign names, gym areas, machine brands, whether the gym has a pin or plate chest press, a seated or lying leg curl, a Glute Drive. All builds' sign names and areas are typical UK-gym guesses.
- **Video content:** judges read titles, channels and lengths of all 103 links; nobody watched the videos.
- **Animations frame by frame:** the browser pane was hidden, so frame-driven animations stalled; motion was judged from code and by counting running animations. Reduce Motion emulation was not possible.
- **Not walked live in any build:** week 1, timed holds, short day, swap day, missed days, update banner, print of the plan sheet, sync screens in the browser. Their code is present (J4's inventory), but nobody saw them drawn.
- Text one size larger, 320 px width, landscape, bright-gym glare.
