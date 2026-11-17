# Redesign D: coach style with big guide cards

Builder D, 2026-11-17. Everything is in `redesign/d/` only. Not pushed.

## In one sentence

Every step of the workout is one big card: a photo loop of the move on top, what to do now in big type, and a thin progress bar that shows where you are in the session.

## Style choices

| Choice | What it is | Why |
|---|---|---|
| One guide card per step | Walk, change-over, warm-up, each set and rest get their own card. Demo on top, name and target below, one main button at the bottom. | You can read it from arm's length with sweaty hands (Ladder, Future). |
| Session bar | 8 thin segments at the top of every workout screen (walk, change-over, warm-up, pairs A to C, abs, finish). The current one fills as you go. | You always know how much is left (Ladder, NTC). |
| Photo loop | Start and end photo crossfade every 2.6 s. Off with Reduce Motion or the new Animations switch: then a tap flips the photo. | Shows the move without video or data use. |
| Warm, calm colours | Light: warm stone background, white cards, one teal accent. Dark: near-black, teal-mint accent, no shadows. | Premium and calm, one accent only (Strong, Apple Fitness+). |
| Big numbers | Weight and reps in 36 to 40 px figures, timers in a ring. | Peloton: big number in the thumb zone. |
| Coach lines | One short tip on the card or the rest screen. | Future and Ladder cue each set. |
| "Up next" card | On the rest screen, with a photo of the next move and its first tip. | You get ready while you rest (NTC). |
| Calm finish | A ring that closes and a check that draws itself, count-up tiles, new bests, next time. No confetti. | Research said: avoid gimmick summaries. |
| Machine cards and Gym tab | A 5th tab "Gym" lists every machine by area, with photo, usual sign name and your own "Where it is in my gym" note. | Finding the machine is a real beginner problem. |
| Motion | Screen slide-in, segment fill, ring, check draw, chart draw-in, number bump. CSS and the Web Animations API only. All off with Reduce Motion or Settings > Animations. | Feels alive, never needed to use the app. |

Rosario's standing taste (homeappdesign skill) was followed: no double-tap zoom (`touch-action: manipulation`), fixed sizes, one bottom sheet at a time, nothing invented (sign names are marked as "usual UK names"), nothing lost, and animations have an off switch.

## Screens (375 x 812, light and dark)

All screenshots are in [screens/](screens/). Light on the left, dark on the right.

| Screen | Light | Dark |
|---|---|---|
| First start | [01 light](screens/01-first-start-light.jpg) | [01 dark](screens/01-first-start-dark.jpg) |
| Intake (progress bar) | [02 light](screens/02-intake-light.jpg) | [02 dark](screens/02-intake-dark.jpg) |
| Today | [04 light](screens/04-today-light.jpg), [after saving](screens/04b-today-saved-light.jpg) | [04 dark](screens/04-today-dark.jpg) |
| Walk card | [05 light](screens/05-walk-light.jpg) | [05 dark](screens/05-walk-dark.jpg) |
| Walk timer | [05b light](screens/05b-walk-timer-light.jpg) | [05b dark](screens/05b-walk-timer-dark.jpg) |
| Walk result | [06 light](screens/06-walk-result-light.jpg) | [06 dark](screens/06-walk-result-dark.jpg) |
| Change-over | [07 light](screens/07-changeover-light.jpg) | [07 dark](screens/07-changeover-dark.jpg) |
| Lift warm-up | [08 light](screens/08-warmup-light.jpg) | [08 dark](screens/08-warmup-dark.jpg) |
| Set (pair) card | [09 light](screens/09-set-light.jpg) | [09 dark](screens/09-set-dark.jpg) |
| "How many more?" sheet | [10a light](screens/10a-how-many-more-light.jpg) | [10a dark](screens/10a-how-many-more-dark.jpg) |
| Rest | [10 light](screens/10-rest-light.jpg) | [10 dark](screens/10-rest-dark.jpg) |
| Swap sheet | [11 light](screens/11-swap-light.jpg) | not taken |
| Finish | [12 light](screens/12-finish-light.jpg) | [12 dark](screens/12-finish-dark.jpg) |
| Weigh-in | [13 light](screens/13-weighin-light.jpg) | [13 dark](screens/13-weighin-dark.jpg) |
| Progress | [14 light](screens/14-progress-light.jpg) | [14 dark](screens/14-progress-dark.jpg) |
| Last week | [15 light](screens/15-weekly-light.jpg) | [15 dark](screens/15-weekly-dark.jpg) |
| Plan | [16 light](screens/16-plan-light.jpg) | [16 dark](screens/16-plan-dark.jpg) |
| Settings | [17 light](screens/17-settings-light.jpg) | [17 dark](screens/17-settings-dark.jpg) |
| Gym tab | [18 light](screens/18-gym-light.jpg) | [18 dark](screens/18-gym-dark.jpg) |
| Machine card | [19 light](screens/19-machine-card-light.jpg) | [19 dark](screens/19-machine-card-dark.jpg) |

Screenshots use made-up data (a test person: 30 years, 175 cm, 80 kg, from the test fixtures). The Animations switch was off while taking them, so photos show the start position with the label "Tap to see the end position".

```
 set card at 375 x 812
 +---------------------------+
 | Pair A . A1 . set 1 of 3  |  session bar
 | ===  ===  ===  -   -   -  |
 | [  photo loop (132 px) ]  |
 | Leg press                 |
 | Tips Swap Video Machine   |
 | 3 sets . 10-12 . 2 left   |
 | pin: where it is          |
 | Set 1 | Set 2 | Set 3     |
 | Weight 40 kg | Reps 10    |
 |  [-] [+]     |  [-] [+]   |
 | [         Done          ] |
 +---------------------------+
```

## Taps in the set flow

Same as the current app: adjust weight or reps if needed, tap Done, answer "How many more?" (or Skip). Done saves the set first, then shows "Saved" with a check, then the rest ring starts by itself. Weight and reps are visible without scrolling at 375 x 812 (checked by measuring: the dials end at the button bar).

## What came from which app

From [RESEARCH.md](RESEARCH.md) (28 sources, read 2026-11-17):

- **Ladder, Future:** one big card per exercise with a demo on top; looping demo; short cue per set; swap on the card; calm start and finish.
- **Hevy:** Done starts the rest by itself; big −/+ time buttons and "Skip rest"; last time's numbers filled in; per-exercise line chart.
- **Strong:** quiet logbook look; rest controls on the card, not in a menu.
- **NTC:** session progress bar and "up next" preview; duration and equipment on the workout card; visible back button.
- **Apple Fitness+:** one recommended thing on Today with one Start button; rings that fill.
- **Peloton:** big numbers in the thumb zone; short summary after the workout.
- **Whoop:** one ring, one number.
- **Avoided:** tiny tap targets, swipe-only actions, upsell banners, confetti, streak guilt, dense set screens.

All look and motion choices are my own drawing and wording. No other app's art, logos or text was copied.

## New data (additive)

- New synced list `machine_spots`: `{ id: "g-<machine>", updated_at, machine, where }`.
- Tests first (commit 751ac21), then the change (cb83746): validate (optional list, old files come back unchanged), merge, backup and restore, sync between two phones through the fake GitHub. 17 new tests.
- New device-only setting `motion_off` (in the existing device box, never synced).

## App size

- Before: 285,691 bytes (about 0.3 MB).
- After: 5,753,967 bytes (about 5.5 MB). 5.1 MB of that is the 88 exercise photos.
- The service worker precaches all 160 files, so the app works offline. Version 0.4.0-d.
- Details: [MEDIA.md](MEDIA.md).

## Test result

`cd redesign/d && node --test`: **263 tests, 263 pass, 0 fail** (2026-11-17). 246 old tests plus 17 new ones for `machine_spots`.

## Checked in a browser

Built-in browser at 375 x 812, light and dark, test server on port 8104 with `?fake-github=1`:

- First start, intake, targets, Today, a full workout (walk, walk result, change-over, warm-up, two sets, "how many more", move timer, rest, swap sheet, end and finish, save), weigh-in, progress with charts, last week, plan, settings, Gym tab, machine card with a saved note.
- No console errors on any of these screens.
- Fixed during the check: set card was too tall (dials hidden under Done); chips cut off; stepper unit far from the number; plan tables too narrow on a phone; pale bands next to photos in dark mode; title touching its tag on timers; "Nice walk" shown after a skipped walk.

## What could not be checked

- **Real iPhone:** not checked. The emulator cannot show Home Screen gaps, Safari's bars or real tap feel. Needs Rosario's phone.
- **Week 1 screen** (two sets, find your weight): restyled but not opened in the browser (the test data was in week 3).
- **Targets screen:** only restyled through CSS; looked fine, no screenshot saved.
- **Swap sheet in dark, sync screens with a connected GitHub, restore from file or GitHub, print of the plan:** not opened.
- **Animations on:** screenshots were taken with animations off. Motion was written to the research notes but not watched frame by frame.
- **Sign names and gym areas:** the usual UK names, not checked at Rosario's gym.
- **Video picks:** all links answered HTTP 200, but 7 are weak picks (see MEDIA.md). Nobody watched every video end to end.
- **Real sweat test:** most tap targets are 44 px or more and main buttons 56 px or more. The four chips on the set card (Tips, Swap, Video, Machine) and the −/+ buttons there are smaller (40 px and 52 px) so weight and reps fit on screen. Not tried in a gym.

## Known issue found (not fixed, outside the brief)

- Today's timeline says the walk is 30 minutes, but the walk screen says 20 minutes in week 3. The same mismatch is in the current app (`app/`), so it comes from the plan data, not from this redesign.
