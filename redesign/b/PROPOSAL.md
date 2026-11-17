# Redesign B: clean Apple style

Builder B, 2026-11-17. Folder: `redesign/b/` (a full copy of `app/` and `tests/`). Nothing outside this folder was changed.
Research behind every choice: [RESEARCH.md](RESEARCH.md). Media sources and licences: [MEDIA.md](MEDIA.md). Screenshots: [screens/](screens/).

## 1. The idea in one paragraph

The app should feel like it came with the iPhone: the look of Apple Fitness, Health and Settings.
That means a grey page with white rounded cards and inset lists, the phone's own font, large titles that shrink into a frosted bar when you scroll, one blue capsule button per screen, and soft spring motion.
Light mode comes first; dark mode is a full second theme, not an afterthought.
In the gym the most-used things stay big and in thumb reach: the photo of the exercise, the weight and reps steppers, and the Done button.

## 2. Style choices

| Part | Choice | Why (source in RESEARCH.md) |
|---|---|---|
| Page and cards | Light: page #F2F2F7, cards white, no borders. Dark: page black, cards #1C1C1E. | Apple grouped backgrounds |
| Accent | Light: buttons #0071E3, blue text #0066CC. Dark: #409CFF. One accent only. | HIG colour; contrast below |
| Status colours | Green = done, orange = warning, red = end or delete only, cyan = the walk (cardio). | HIG colour; Fitness uses its own colour for cardio |
| Font | Phone system font (SF on iPhone). Big numbers use `ui-rounded` where the phone has it. Numbers are tabular (they do not jump). No web fonts. | Brief; HIG typography |
| Titles | 34 px large title on tab screens; it turns into a small frosted bar title when you scroll. | iOS navigation bars |
| Lists | Inset grouped lists with small grey caps headers, hairline lines, an icon tile or photo on the left, a chevron on the right. | iOS Settings, Health |
| Buttons | Full-width blue capsule at the bottom (Done, Start, Save). Grey capsule for the second choice. Chips for small actions (How to, Video, Machine, Swap). | HIG buttons |
| Steppers | Round − and + buttons (56 px), the number big and centred, weight and reps in one card. | Strong and Hevy speed; HIG tap size |
| Timers | One thick ring with big digits; round −30 s and +30 s buttons; the whole screen flashes green with "Go" at zero. | Apple Fitness rings; Hevy rest timer |
| Sheets | One bottom sheet at a time, with a grabber, "Close" on the right, swipe down to close. No browser pop-ups. | HIG sheets; Rosario's standing taste |
| Motion | Springs of 250 to 450 ms, only `transform` and `opacity`. Screen push/fade, list rise, numbers count up, chart line draws in, Done tick draws itself. All cut to almost nothing under Reduce Motion. | HIG motion; brief |
| Photos | Two photos per exercise flip like a short loop on big views, still thumbnails in lists. | JEFIT, Fitbod |

### 2.1 Contrast (checked with the WCAG formula)

All text pairs pass 4.5 : 1.

| Pair | Ratio |
|---|---|
| White text on the blue button | 4.70 |
| Blue text on white / on the grey page | 5.57 / 4.99 |
| Grey helper text on white / on the grey page | 5.07 / 4.54 |
| Green / orange / red / cyan text on white | 5.33 / 5.28 / 5.38 / 4.87 |
| Dark mode: blue / grey / green / orange / red / cyan on a card | 6.01 / 6.61 / 8.42 / 8.28 / 4.99 / 9.89 |
| Black "Go" on the green flash | 10.39 |

## 3. The screens

All screenshots are at phone size (375 × 812) with **made-up test data** (a made-up 30-year-old, 175 cm, 80 kg; no real body data).

| Screen | What changed | Light | Dark |
|---|---|---|---|
| First start | App icon, big title, Start fresh as the main button, the two restores as a list; GitHub form opens in place. | [01](screens/light-01-first-start.jpg) | – |
| Intake | Thin progress bar, large question title, iOS tick rows; Next and Back at the bottom. | [02](screens/light-02-intake.jpg) | – |
| Your numbers | Goal card, number tiles (kcal orange, protein green, walk cyan); edit mode as an inset list. | [03](screens/light-03-targets.jpg) | – |
| Today | Date and large title, 12-week bar, workout card with a strip of the day's exercise photos and coloured blocks, floating Start button. | [04](screens/light-04-today.jpg), [19 after save](screens/light-19-today-saved.jpg) | [01](screens/dark-01-today.jpg) |
| Walk | Treadmill photo, speed and slope tiles, Watch card, "Where is it?" chip; cyan ring while walking; result with steppers and 1–10 picks. | [05](screens/light-05-walk-start.jpg), [06](screens/light-06-walk-timer.jpg), [07](screens/light-07-walk-result.jpg) | [02](screens/dark-02-walk-start.jpg) |
| Change-over | Green ring, water and Watch reminder, Start or Skip warm-up. | [08](screens/light-08-change-over.jpg) | – |
| Lift warm-up | Small ring, the moves as a list with photos (tap one to see how). | [09](screens/light-09-lift-warm-up.jpg) | – |
| Set screen | Photo, name and chips at the top; last time, suggestion, machine note and "where" as icon lines; warm-up sets and sets as lists with round numbers; steppers card; Done. | [10](screens/light-10-set-warm-up-sets.jpg), [11](screens/light-11-set-steppers.jpg) | [03](screens/dark-03-set.jpg) |
| "How many more?" | Sheet with a drawn tick, "Set saved", 0–4+ picks, Skip. | [12](screens/light-12-reps-left-sheet.jpg) | – |
| Rest | "Saved · 55 kg × 10" chip, big ring, round −30 s / +30 s, "Next up" card with the next photo and where its machine is, Undo, Skip rest. | [13](screens/light-13-rest.jpg) | [04](screens/dark-04-rest.jpg) |
| Swap | Reasons as an icon list; swaps as a list with photos; "It hurts" asks for the note first. | [14](screens/light-14-swap-reason.jpg), [15](screens/light-15-swap-pick.jpg) | – |
| Exercise sheet | Big flipping photo, how-to card, Watch video link, the machine(s) it uses. | [16](screens/light-16-exercise-sheet.jpg) | – |
| Machine card | Photo or drawing, usual sign name, gym area, short description, **"Where it is in my gym"** box, exercises that use it. | [17](screens/light-17-machine-sheet.jpg) | [08 editor](screens/dark-08-where-it-is-editor.jpg) |
| Finish | Drawn green tick, time and sets counting up, new bests, next time, effort 1–10, note, Watch reminder. | [18](screens/light-18-finish.jpg) | [05](screens/dark-05-finish.jpg) |
| Weigh-in | Scale icon, date row, one big stepper; measurements as a list with cm on the right. | [20](screens/light-20-weigh-in.jpg) | – |
| Progress | Last weigh-in and trend tiles, filled trend chart (newest point bigger), measurements list, each exercise as a row with photo and a tiny line; tap a row for its chart. | [21](screens/light-21-progress.jpg) | [06](screens/dark-06-progress.jpg) |
| Weekly summary | Four tiles counting up (workouts, sets, new bests, walk), trend card (green when on target), food suggestion card. | [22](screens/light-22-weekly.jpg) | – |
| Plan | Segmented control: Week, Exercises, **Machines**. Days as photo lists. Print still prints the old A4 tables. | [23](screens/light-23-plan-week.jpg), [24](screens/light-24-plan-machines.jpg) | [07](screens/dark-07-plan-machines.jpg) |
| Settings | iOS Settings layout: Sync, Backup, My gym (link to Machines), body unit as a segmented control, Sound and the Health button as switches. | [25](screens/light-25-settings.jpg) | [09](screens/dark-09-settings.jpg) |
| Week 1 | Same header as the set screen (photo, chips), steppers card, the "how many more?" step with a drawn tick, the starting weight big in blue. | not shot | not shot |

### 3.1 New: where each machine is in my gym

- Every machine card has a "Where it is in my gym" box: quick words to tap (Front, Back, Left side, By the mirrors…) plus free text.
- It is new **additive** data: a list `gym_spots` with one record per machine (`{ id: "g-<machine>", updated_at, machine, where }`).
- It is merged record by record like the other lists, kept in backups, and sent with sync. Old files without it still load unchanged.
- Tests first, in their own commit: `tests/gym-spots.test.mjs` (14 tests: validation, merge both ways, sync round trip with the fake GitHub, backup and restore, old files).
- The note shows on the set screen ("Where: …"), on the rest screen's "Next up" card, and on the walk start (treadmill).
- Settings and the Plan tab show "X of 15 filled in".

### 3.2 Nothing lost

- Every feature F1 to F21 from docs/PRD.md is still there. Only the look and the order on screen changed.
- No extra taps in the set flow: Done → (optional "how many more?") → rest starts by itself → Skip or wait → next set.
- Logic files are unchanged except the additive note: `js/engine/`, `js/sync/`, `store.js`, `syncer.js`, `validate.js` (only the new list), `model.js` (only `setGymSpot`).
- The GitHub key handling in `settings-sync.js` is unchanged; only the card heading got an icon and a status dot.
- Data never goes into `innerHTML`; the page uses `textContent` and DOM nodes only.

## 4. Size

| | Before (`app/`) | After (`redesign/b/app/`) |
|---|---|---|
| Whole app | 427 KB | 5.8 MB (5,795 KB) |
| Of which exercise photos | – | 5.2 MB (86 JPEGs) |
| Code and styles without photos | 427 KB | 535 KB |
| Entries in the offline list | – | 156 (every file except sw.js, plus "./") |

The photos are downloaded once on the first visit (they are in the offline list) and then work without signal.
⚠️ On a slow connection the first visit takes longer. A later step could shrink the photos (they are 850 px wide; 400 px would be enough, about a quarter of the size).

## 5. Tests

- `node --test` in `redesign/b`: **260 pass, 0 fail** (246 from before + 14 new for the gym-spots note).
- App version: `0.4.1-b` in both `sw.js` and `js/version.js` (the offline test checks they match and that every file is in the offline list).
- All 44 video links answered HTTP 200 on YouTube's oEmbed check (2026-11-17).

## 6. Checked in the browser

At 375 × 812, light and dark, in the desktop app's built-in browser (Chromium), with made-up data and the pretend clock (`?date=`):

- First start → intake question 1 → your numbers → Today.
- Start workout → walk (start, timer, result) → change-over → lift warm-up → set screen with warm-up sets → work set → "how many more?" sheet → rest → next exercise → swap sheet (reason, pick) → exercise sheet → machine card → finish → save → Today "Workout saved".
- Weigh-in, Progress (with an exercise chart opened), weekly summary, Plan (Week and Machines), Settings, Settings → Machines link.
- The "where it is" note: tapped two quick words, saved, checked it is stored in the phone data and shown in the list.
- Fixed while checking: date field cut off on the weigh-in screen; Plan tab icon invisible when picked; Print button not at the right edge; thin lines on small photos in dark mode; content showing through under the floating Start button; two cards touching in Settings.

## 7. Not checked

- ⚠️ **A real iPhone.** Everything was checked in a Chromium browser on Windows. Not seen: the SF Rounded digits (Windows shows a plain font), the frosted blur on iOS Safari, the Home Screen safe areas, real touch feel.
- ⚠️ **Week 1 screens** (learn, find your weights): redesigned and tests pass, but not walked through in the browser.
- **Timed holds** (plank countdown on the set screen) and the **abs / "on its own"** slot: not walked through.
- **Intake past question 1**, the **targets edit mode**, the **short day** and **swap day** sheets, the **missed days** card, the **update banner**: not walked through after the restyle.
- **GitHub sync from the Settings form** and **Restore from GitHub** on first start: the code is unchanged, but not run against the fake GitHub in the browser this time (the unit tests do cover sync).
- **Print** of the Plan on A4: the print-only tables are there, but no print preview was made.
- **Reduce Motion**: the CSS rules are in place, but the setting was not switched on in the browser.
- Screenshots were taken with animations switched off from the test side (the browser pane was hidden, so animations stalled mid-way). Some light shots were taken before the last small CSS fixes in section 6.
- The video links were checked to exist, not watched one by one for quality.

## 8. Strongest and weakest points

Strongest:
1. The set screen: photo, last time, suggestion, machine note and where the machine is, all on one screen, with big steppers and Done in thumb reach.
2. The new "where it is in my gym" note on every machine, shown at the moment it is needed (set screen, rest "Next up", walk).
3. Real exercise photos (public domain) on every exercise, plus checked video links, with no third-party script.

Weakest:
1. App size grows from 427 KB to 5.8 MB because of the photos (they could be shrunk later).
2. Not tried on a real iPhone; the rounded digits and the frosted bars only show there.
3. Some photos are close matches, not exact (noted under each photo), and some screens (week 1, holds) were not walked through in the browser.
