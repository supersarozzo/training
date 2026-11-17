# Check: build step 1, muscle and equipment data

Date: 2026-11-17. Worker 8.31. Checker: an independent Opus subagent (did not see the tests, the fixture or the worker's conclusions).
What was checked: `app/js/plan/muscles.js` at commit b437275 (data) against free-exercise-db, fetched fresh by the checker.

**Result: PASS.** 36 of 36 exercises match, 82 of 82 muscle entries match, 0 wrong muscles, 0 shoulder-part doubts, 0 equipment misfits, 0 own-reading marks.

## 1. Proof that the checker catches a wrong muscle

Before its verdict counted, the checker got two copies of the file, X and Y, with no word on which one (if any) was wrong.

| Copy | What it was | Checker's result |
|---|---|---|
| X | A copy with **one planted fault**: `seated_row_machine` main muscle changed from lats to mid back (lats moved to helpers) | **FAIL**: found it ("main: file says mid_back, free-exercise-db says lats, entry Leverage_Iso_Row"; it counted the swap as 2 entries, 1 exercise). 35 of 36 exercises match. Nothing else flagged. |
| Y | Byte-identical to the committed `app/js/plan/muscles.js` (checked with `cmp`) | **PASS**: 36 of 36 match, 82 of 82 entries. |

The planted fault was found, and nothing that was right was flagged. So the PASS on Y means something.

## 2. Numbers (copy Y = the committed file)

| Item | Count |
|---|---|
| Exercises checked | 36 (27 in the plan's days, 9 swap-only) |
| Muscle entries compared (main + helpers) | 82 |
| Exercises fully matching free-exercise-db | 36 |
| Wrong muscles | 0 |
| Shoulder parts against the rule (research 4.2) | 15 exercises, 0 doubts (front: 6, side: 3, rear: 6) |
| Equipment class misfits | 0 (one borderline note below) |
| Own-reading marks | 0 (none needed) |

## 3. How the checker worked

- Read `media.js` (the free-exercise-db entry per exercise) and `plan-v2.js` (36 exercise ids) by file URL.
- Fetched `dist/exercises.json` itself from raw.githubusercontent.com (one plain GET). free-exercise-db main branch: commit `f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5` (2026-09-27), the same commit `muscles.js` and the test fixture cite.
- A script mapped main and helpers through `MUSCLES[..].fedb` and compared them as sets with `primaryMuscles` and `secondaryMuscles`; then every row was read by eye, with the equipment class against the plan's equipment words and weight step.

## 4. Notes

- Borderline, not a fault: `hip_thrust` is class "machine". The plan says "Glute Drive or hip thrust bench"; the class fits the Glute Drive. The bench option (barbell) has no class of its own.
- The unit test `tests/muscles.test.mjs` checks the same thing on every run, against the copy in `tests/fixtures/free-exercise-db-muscles.json`. Tests: 302 before step 1, 312 after; 312 of 312 pass.

## 5. Not checked

- Whether each `lib` in `media.js` is the best free-exercise-db entry for the exercise (taken as given; chosen and checked in the redesign, docs/MEDIA.md).
- The drawing part → muscle rules (`partMuscle`) and the equipment family table: covered by the unit test, not by this checker.
- How the maps look on screen: no screen uses the data yet (build step 2).
