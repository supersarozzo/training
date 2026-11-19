# Check of the Progress charts mock-up, v1

Date: 2026-11-18. Checker: an independent check chat (read-only on `app/` and `tests/`). Page checked: `redesign/progress-charts/preview.html` on http://localhost:8745/. It is the same as the published artifact https://claude.ai/artifact/Y2WQ8xGZS7EntFb9QrsmfV, version 1795043229-e336 (read with the Artifact tool; only the page wrapper differs, and the db capability is declared). Live app compared: http://localhost:8744/#/progress at 375 x 812, dark, made-up data, plus `app/js/ui/progress.js`, `app/js/ui/charts.js`, `app/js/engine/trend.js` and `app/css/app.css`. Rules: `docs/DESIGN.md`, read in full (318 lines).

## What I did

- Opened the page in the built-in browser at 1180 px and at 390 px, with the page in light and in dark (colorScheme emulation). I measured the drawn page with JavaScript (SVG getBBox, computed styles, element boxes) and took screenshots.
- Measured about 240 values:
  - 78 bar heights against their kcal values: 5 bars x 6 seven-day charts, and 24 bars x 2 thirty-day charts.
  - The target line y on 6 charts, the today outline on 8 charts, the gap marks on 10 charts and the grid-line count on 14 charts.
  - The line width, glow and shaded area on 4 weight charts, plus answer 98 b.
  - 4 averages recomputed from the drawn bars.
  - Text overlap on 11 charts.
  - 54 question-bubble placements: 6 bubbles x 7 answer combinations at 1180 px, then 6 at 390 dark and 6 at 390 light.
  - Every text colour and size inside the NEW phones, compared with the tokens and the type scale.
  - 20 weigh-in dots and 20 trend points, plus about 12 CSS values, on the live app.
- Checked for horizontal scroll at 390 px (none: scrollWidth 390 = clientWidth 390).
- Checked the page code for storage. It uses `window.claude.use("db")` and has no localStorage or sessionStorage (grep: 0 hits).
- Checked that the key made-up numbers (2200, 2,200, 80.8, 82.0, 9840) do not appear in any file under `private/` (counted matches only: 0; no private values read out).

## Step 1: the planted mistake (planted-preview.html)

**Found: on NEW, today's calories bar is drawn as a solid, finished bar.** It has no dashed outline and no "so far" label. Measured on both NEW phones and on all 7-day and 30-day state cards:

- There are 0 `.c-today` elements and no "so far" text.
- The last solid bar (62 px high = 1,240 kcal) sits exactly under the "Today" label (centre x 314.94 against 314.97).
- In preview.html the same slot is a 2 px dashed 4/3 outline with no fill, plus "so far".

This breaks the task ("today marked as not finished"). It also breaks the page's own legend ("Today is not finished and not in the average") and its new-values row "Today's bar: outline only". I found it from the drawn page, not from comparing the two files.

## Step 2: findings

The core of the task is met on NEW, in light and dark, in 375-wide phone frames at 1180 px:

- one bar per day for 7 days plus today;
- the target as a dashed line at the right height (2,200 kcal at y 64 = 174 - 2200 x 0.05);
- today as an outline with "so far";
- days with no food as gaps (2 in 7 days, 6 in 30 days), never 0 bars;
- the 7/30 switch asked as question 97.

Other checks that passed:

- Every bar height matches its value. The averages match the drawn bars: 2,156 kcal (5 days) and 2,164 kcal (24 days), both without today.
- NEW charts have 4 grid lines; the NEW line is 2 px with no glow.
- All NEW colours are token values. No status colours are used and there is no emoji inside the phones.
- Tap sizes: switch 44 px, buttons 52 px, Settings 44 px, tabs 58 px.

The findings below stop a PASS.

**F1 (major): the page says both charts are visible without scrolling. They are not.**
- Where: the "In short" bullet 3 ("Both charts go to the top of Progress, so you see them without scrolling (question 99)"), mockup.html:161. Question 99 builds on it.
- Measured in the NEW 375 x 812 phone: the visible area ends at 731 px (top of the tab bar). The Calories chart starts at 782 px and ends at 954 px, so it is fully below the tab bar. Only the Calories title, the switch and part of the average row show on the first screen. The weight chart (234 to 406 px) is visible.
- Fix: either make the text true ("the weight chart is on the first screen; calories is one short scroll"), or make the Calories card shorter so its bars start above 731 px. For example, put the switch in the card head row, or put Average and Target on one line.

**F2 (minor): in the 30-day view, the "so far" label is drawn over bars.**
- Where: the states section "Calories, 30 days picked", dark and light, from `kcalChart`, mockup.html:366.
- Measured: "so far" covers x 298 to 329 and y 93 to 109. It crosses the bar 3 days ago (x 297 to 303, top 75) and the bar for yesterday (x 316 to 322, top 69). The muted text sits on accent bars and is hard to read. The "2,200" label (y 55 to 71) also touches yesterday's bar top (69).
- Fix: in the 30-day view, put "so far" above the tallest of the last 3 slots, or leave it out and let the legend line say it. Lift the target label above its line.

**F3 (minor): OLD (and NEW) use a different trend formula from the app.**
- Where: `TREND` in mockup.html:289-290 (exponential average, factor 0.25). The app uses `trendAt` in `app/js/engine/trend.js` (the mean of the weigh-ins from day minus 6 to day).
- On the same 20 weigh-ins, OLD shows "Trend (7 days) 81.0 kg". The live app shows 80.9 kg (last trend point 80.87, against 80.95 in the mock-up). The line shape is up to about 0.09 kg off: at 4 Nov, 81.51 against 81.42.
- NEW repeats this and calls it "the 7-day trend".
- Fix: compute the trend like `trendAt`.

**F4 (minor): OLD draws the totals tiles at the wrong size.**
- Where: mockup.html:79 (`.tile .value` 30 px). The live app has `.tiles.three .tile .value { font-size: 24px }` (app.css:637).
- Because of this, "kg" wraps under "9840" on OLD.
- The "Where NEW differs" note (mockup.html:262) also says "the totals tiles (30 px numbers)", which is wrong.
- Fix: use 24 px and correct the note.

**F5 (minor): OLD draws other parts unlike the live app.** NEW says these parts are "the same as today", so it inherits the same errors.
- Recent workouts:
  - Live (progress.js, app.css:643): a 44 px date box with the day number above the month, the plan-day name, and "21 sets · 3420 kg lifted · walk 20 min" (no thousands comma, no date in the line).
  - Mock-up: a grey photo square and "17 Nov · 21 sets · 3,420 kg lifted …".
- Exercise rows: live is at least 64 px tall (app.css:463); the mock-up is 56 px.
- Eyebrows: live is 13 px with .09em letter spacing (app.css:130); the mock-up is 12 px with .08em.
- `.row`: live centres the items (app.css:233); the mock-up does not.
- Fix: copy the live values. Where DESIGN.md differs (eyebrow 12 px), say so in "Where NEW differs".

**F6 (minor): some differences from the live app are not declared.**
- Where: mockup.html:259-262.
- NEW splits the units into small muted 14 px text ("80.8" with "kg"). In the live app, "80.8 kg" is one 40 px string, and OLD draws it that way correctly. This follows DESIGN.md section 4, but it is not listed.
- NEW adds an "Open Diet" secondary button, a second action on Progress. It is not listed.
- NEW keeps live values that are not in DESIGN.md and does not list them as kept:
  - the secondary button: 18 px weight 650, surface fill and soft border, while DESIGN.md section 8 says a hairline in `--border-strong` and no fill;
  - the Settings pill: 15 px;
  - the switch labels: 15 px.
- Fix: add these to "Where NEW differs" (or to the new-values table).

**F7 (minor): the question layer starts with answers already picked, and the count never changes.**
- Where: `state` (mockup.html:296) and `qtoggle` (mockup.html:520).
- Every question starts with "a" pressed (aria-pressed true) before Rosario has tapped anything. A recommended answer then looks the same as a saved answer, and nothing goes to the db unless Rosario taps.
- The switch says "Show questions (3 open)" even after all 3 are answered.
- What works: the layer starts hidden. There are 3 numbered questions, each with a recommendation. Each a/b button redraws NEW: 97 b removes the switch and moves its ring to the title; 98 b adds the shaded area; 99 b puts the totals first.
- All 54 bubble placements were inside their phone frame and on their target, at 1180 px and at 390 px.
- Fix: start with no answer picked and show the recommendation only as text. Count the unanswered questions.

**F8 (minor): bubble 99 is out of sight on first view.** With the default order, the bubble for question 99 sits on the totals tiles at 1,101 px inside the phone's scroll. That is below the visible 731 px, so on first view only 2 of the 3 bubbles show.
- Fix: say "scroll inside the phone for 99" in the switch status line, or put bubble 99 on the Body weight title (the order question).

**F9 (minor): the NEW weight chart wastes height.**
- Where: mockup.html:321.
- The ticks are 80, 81, 82 and 83 kg, but the data spans 80.6 to 82.2 kg. The line uses only about half the plot height, and the 83 label names a value the data never reaches.
- Fix: use ticks that fit the data within 4 lines, for example 80.5, 81.5 and 82.5 (3 lines, range 2 kg instead of 3).

## Things on the page nobody asked for

These are not failures.
- "Where I disagree with you", "How well-made apps do it" and "One-tap pick": part of the usual mock-up process; justified.
- The card title "Body weight" as h2, the date as "18 Nov", the empty chart frame and the legend lines: justified by the problems list and by DESIGN.md sections 1 and 8.
- The "no target" state: reasonable, but the task did not ask for it.
- The "Open Diet" button on the filled Calories card: not asked for, and undeclared (F6). It is justified only in the empty state (DESIGN.md section 11: empty states say how to fill them).
- The error state is described in words only, not drawn.

## Not checked

- Saving to the artifact db in the real claude.ai page. Locally there is no `window.claude`, so the page showed "Picked on this screen only". I checked the db code by reading it only.
- A real iPhone; motion; text-size scaling.
- The published page at 390 px. The local preview has the browser's default 8 px body margin, so the phone frames are 344 px wide there. The published wrapper resets the margin, so they should be 358 px.
- The live app with workouts logged. The local live copy has none, so the totals, the exercise rows (including gold "best" badges) and the recent workouts were compared with the code only.
- Whether "Average a day" on Progress equals Diet's "Last 7 days, average" (with or without today).
- `mockup.html` on disk changed while I was checking: it went from 565 to 672 lines, with food-search sheet styles added. I checked the v1 preview and the published version, not the newer file.

VERDICT: FAIL. The task's core is met: bars per day, the target line, today as not finished, gaps not 0, the 7/30 question, light and dark, 375 frames. But the page makes a false claim that decides question 99 (F1, major). OLD is drawn unlike the live app in several places (F3, F4, F5), and some differences are undeclared (F6). The task rules count each of these as a FAIL item.
