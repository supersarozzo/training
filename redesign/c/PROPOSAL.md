# Redesign C: fast, data-dense logger

Builder C, task chat 8.21. Date: 2026-11-17. Everything lives in `redesign/c/`. Nothing in `app/`, `docs/` or the other redesign folders was changed.

How to try it: from `redesign/c`, run `python -m http.server 8103 --directory app`, open http://localhost:8103/ at phone size. For the demo data (made up, not a real person), run `screens/seed-demo.js` in the page's console, then reload.

## 1. The idea in one line

A gym logger you can read at a glance between sets: one table per exercise with last time's numbers in each row, one tap to save a set, and pictures of every exercise and machine.

## 2. Style choices

| Choice | What it is | Why |
|---|---|---|
| Set table | Columns SET · PREVIOUS · KG · REPS · ✓. Warm-ups are rows W1, W2. | Everything about the exercise on one screen. |
| Steppers open under the current row | The row you are on opens and shows −/+ for weight and reps. | No scrolling, no extra tap. The Done button and the row check both save. |
| PREVIOUS is a button | Tap "35 × 12" to copy last time's numbers into the steppers. | One tap instead of several stepper taps. |
| Live PR mark | A small gold "PR" shows under the set number as soon as the numbers beat your best. After saving, a gold toast says "New best". | Rewards progress the moment it happens. |
| Swipe to undo | Swipe the last saved row left to show Undo. "Undo last set" link stays too. | Fast fix without a menu. |
| Small trend lines | A tiny line next to each exercise (Today, set screen, Progress). | Shows the direction without opening a chart. |
| Rings with words | Timer rings always say what they count: LEFT, REST, MOVE, CHANGE-OVER, WARM-UP. | Never a number without a meaning. |
| Pictures everywhere | Start and end photo of each move (free-exercise-db), loop on the set screen; a hip-hinge drawing of our own where no photo fits. | Rosario can check the move and find the machine. |
| Machine cards and a Gym tab | Picture, the name on the sign, gym area, and "Where it is in my gym" (Rosario's own note). | Find the machine on the first visits. |
| Colours | Deep blue for actions, green for done, gold for bests. Light and dark. System font with rounded numbers. No web fonts. | Calm, premium, readable in a gym. |
| Icons | One own icon set (thin lines), always with a word. | Rosario's rule: icons with words. |
| Animations | Set check pops, done row glows, rings run smoothly, charts and trend lines draw in, sheets slide, screens fade in. Transform and opacity only (and line drawing). | Rosario wants animations. Off with the new Settings switch or the phone's Reduce Motion. |
| One sheet at a time | Exercise, machine, swap and "how many more" are bottom sheets. No `confirm()`. | Rosario's rule. |
| No double-tap zoom | `touch-action: manipulation` on all controls. | Rosario's rule. |

## 3. What came from which app (ideas only, nothing copied)

Sources and their limits are in [RESEARCH.md](RESEARCH.md).

- **Hevy:** the set table with a PREVIOUS column, warm-up rows, one check per set, a gold record mark, the rest timer starting by itself. (Confirmed by a UX teardown; Hevy help pages were blocked, HTTP 403.)
- **Strong:** "previous" values in the row; a calm, very plain table. (Reported in reviews only.)
- **JEFIT:** exercise pictures and a library feel; the per-exercise history table. (Reported.)
- **Apple Fitness:** rings with a clear label and a round end cap; stat tiles; the inset grouped look in Settings. (Confirmed, Apple pages.)
- **Fitbod:** small trend lines per exercise. (Teardown; Fitbod pages blocked.)
- **Own ideas:** steppers that open under the current row, PREVIOUS as a copy button, the Gym tab with "Where it is in my gym", the machine sign name, the hip-hinge drawing, the colour set.

## 4. Screens

All at 375 × 812, 2x, light and dark (`*-light.jpg`, `*-dark.jpg`). Long screens are full-page pictures. The pictures were made with reduced motion on, so nothing is caught mid-animation.

| # | Screen | Light | Dark |
|---|---|---|---|
| 01 | Today: day, week strip, session bar, today's exercises with trend and suggested weight, body and food tiles | [light](screens/01-today-light.jpg) | [dark](screens/01-today-dark.jpg) |
| 02 | Progress: totals, body weight chart, exercise rows, measurements, recent workouts | [light](screens/02-progress-light.jpg) | [dark](screens/02-progress-dark.jpg) |
| 03 | Progress, one exercise open: chart with bests in gold, last three workouts | [light](screens/03-progress-exercise-light.jpg) | [dark](screens/03-progress-exercise-dark.jpg) |
| 04 | Gym tab: machines by area, sign names, where noted | [light](screens/04-gym-light.jpg) | [dark](screens/04-gym-dark.jpg) |
| 05 | Machine card with "Where it is in my gym" | [light](screens/05-machine-card-light.jpg) | [dark](screens/05-machine-card-dark.jpg) |
| 06 | Machine card, where not noted yet (type it once) | [light](screens/06-machine-card-add-where-light.jpg) | [dark](screens/06-machine-card-add-where-dark.jpg) |
| 07 | Plan: the week, each day with photos, the 12 weeks, Print | [light](screens/07-plan-light.jpg) | [dark](screens/07-plan-dark.jpg) |
| 08 | Exercise sheet from the plan | [light](screens/08-exercise-sheet-light.jpg) | [dark](screens/08-exercise-sheet-dark.jpg) |
| 09 | Settings with the new Look group (colours, animations) | [light](screens/09-settings-light.jpg) | [dark](screens/09-settings-dark.jpg) |
| 10 | Weigh-in | [light](screens/10-weigh-in-light.jpg) | [dark](screens/10-weigh-in-dark.jpg) |
| 11 | Weekly summary | [light](screens/11-weekly-light.jpg) | [dark](screens/11-weekly-dark.jpg) |
| 12 | Your numbers (targets) | [light](screens/12-your-numbers-light.jpg) | [dark](screens/12-your-numbers-dark.jpg) |
| 13 | Walk, before start | [light](screens/13-walk-light.jpg) | [dark](screens/13-walk-dark.jpg) |
| 14 | Walk running (ring with the build-up mark) | [light](screens/14-walk-running-light.jpg) | [dark](screens/14-walk-running-dark.jpg) |
| 15 | Walk result | [light](screens/15-walk-result-light.jpg) | [dark](screens/15-walk-result-dark.jpg) |
| 16 | Change-over | [light](screens/16-change-over-light.jpg) | [dark](screens/16-change-over-dark.jpg) |
| 17 | Lift warm-up with move photos | [light](screens/17-lift-warm-up-light.jpg) | [dark](screens/17-lift-warm-up-dark.jpg) |
| 18 | Set table, warm-up rows | [light](screens/18-set-table-warm-up-light.jpg) | [dark](screens/18-set-table-warm-up-dark.jpg) |
| 19 | Set table, steppers open under set 1 | [light](screens/19-set-table-light.jpg) | [dark](screens/19-set-table-dark.jpg) |
| 20 | Set table, live PR mark | [light](screens/20-set-table-new-best-light.jpg) | [dark](screens/20-set-table-new-best-dark.jpg) |
| 21 | Exercise sheet from the set screen (photos, video, machine, settings note) | [light](screens/21-exercise-sheet-tips-light.jpg) | [dark](screens/21-exercise-sheet-tips-dark.jpg) |
| 22 | Swap: why | [light](screens/22-swap-why-light.jpg) | [dark](screens/22-swap-why-dark.jpg) |
| 23 | Swap: pick | [light](screens/23-swap-pick-light.jpg) | [dark](screens/23-swap-pick-dark.jpg) |
| 24 | Rest: ring, ±30 s, "how many more" inline, next set card | [light](screens/24-rest-light.jpg) | [dark](screens/24-rest-dark.jpg) |
| 25 | Pair partner set table (A2) | [light](screens/25-set-table-partner-light.jpg) | [dark](screens/25-set-table-partner-dark.jpg) |
| 26 | Finish: tiles, new bests, what you did, next time | [light](screens/26-finish-light.jpg) | [dark](screens/26-finish-dark.jpg) |
| 27 | Today after the workout (saved message) | [light](screens/27-today-after-workout-light.jpg) | [dark](screens/27-today-after-workout-dark.jpg) |
| 28 | Today in week 1 | [light](screens/28-today-week-1-light.jpg) | [dark](screens/28-today-week-1-dark.jpg) |
| 29 | Week 1: learn the move | [light](screens/29-week-1-learn-light.jpg) | [dark](screens/29-week-1-learn-dark.jpg) |
| 30 | Week 1: warm-up | [light](screens/30-week-1-warm-up-light.jpg) | [dark](screens/30-week-1-warm-up-dark.jpg) |
| 31 | Week 1: set 1 | [light](screens/31-week-1-set-1-light.jpg) | [dark](screens/31-week-1-set-1-dark.jpg) |
| 32 | Week 1: how many more | [light](screens/32-week-1-how-many-more-light.jpg) | [dark](screens/32-week-1-how-many-more-dark.jpg) |
| 33 | First start | [light](screens/33-first-start-light.jpg) | [dark](screens/33-first-start-dark.jpg) |
| 34 | Intake with progress bar | [light](screens/34-intake-light.jpg) | [dark](screens/34-intake-dark.jpg) |

The pictures are remade by `node screens/shoot.mjs <outDir> light|dark screens/seed-demo.js` (Chrome headless, Node only, no packages) with the local server running on port 8103.

## 5. Nothing lost, and no extra taps

- Every old screen and every feature (PRD F1-F21) is still there. Old texts were kept; new texts were added around them.
- Set flow taps are the same or fewer: Done saves one set in one tap, as before. The row check is a second way. PREVIOUS copies last time's numbers in one tap. "How many more" is now on the rest screen (one tap, optional) instead of a separate sheet, so it costs no extra tap.
- The old Tips sheet (machine settings note) is now inside the exercise sheet, opened by the Tips chip.
- New saved data: `gym_spots` (one "where it is" note per machine). It was added with tests first, in a separate commit. Old files without it load unchanged. It syncs by record (newest wins) and goes into backups.
- New device-only settings: colours (Auto, Light, Dark) and Animations on/off. They are never synced and never in a backup.

## 6. Size

| | Bytes |
|---|---|
| App copy before (code only, no pictures) | 286,836 |
| App now, total | 5,541,712 |
| of which exercise photos (86 jpg, 43 folders) | 5,155,170 |
| of which code, CSS and icons | 386,542 |

The photos are about 60 KB each. All of it is in the offline list (sw.js, version 0.4.0, 154 files), so the app works with no signal in the gym.

## 7. Tests

`node --test` from `redesign/c`: **268 tests, 268 pass, 0 fail.**
- 259 old tests (copied app and tests), plus
- 13 tests for `gym_spots` (in the 259 count above, committed first), plus
- 9 new tests for the exercise media, machine cards, videos and the logger numbers (`tests/media-stats.test.mjs`).

## 8. What could not be checked

- **Real iPhone:** not checked. All checks were in Chrome (headless and the in-app browser) at 375 × 812. Safari details (rounded number font, sheet feel, Home Screen) need Rosario's phone.
- **Animations by eye:** the screenshots are taken with reduced motion. The animations were seen briefly in the in-app browser; their feel on a phone is not checked.
- **Swipe to undo:** written with pointer events; not tried with a real finger.
- **Videos:** all 44 links answered HTTP 200 and their titles were checked on 2026-11-17. YouTube can remove videos later.
- **Photo matches:** some photos are close matches, not the exact machine (marked "close match" in the sheet and in [MEDIA.md](MEDIA.md)). Rosario's gym may look different.
- **Sync with a real GitHub repo:** not touched (rule: fake GitHub only). The sync code was not changed.
- **Print of the plan:** print rules kept and thumbnails hidden in print; not printed on paper.
- **Some sites were blocked during research** (Hevy help, Fitbod, ExRx, ACE, MuscleWiki). See RESEARCH.md.
