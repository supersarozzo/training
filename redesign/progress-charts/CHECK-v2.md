# Check of the Progress charts mock-up, v2

Date: 2026-11-18. Checker: the same independent check chat as for v1 (read-only on `app/` and `tests/`).

- **Page checked:** `redesign/progress-charts/preview-v2.html` on http://localhost:8745/. It stands for the published version 1795043880-557a of https://claude.ai/artifact/Y2WQ8xGZS7EntFb9QrsmfV.
- **Compared with:**
  - the live app at http://localhost:8744/: `#/progress`, and `#/diet` > Search with "chick" typed (nothing tapped or saved);
  - `app/js/diet/sheets.js` (openSearch, openCheck), `app/js/ui/parts.js` (openSheet, stepper), `app/js/food/foodmath.js` (averageLast7);
  - `app/css/diet.css` and `app/css/app.css`;
  - `docs/DESIGN.md` sections 8 and 15.5 to 15.10;
  - `docs/research/2026-11-18-uk-food-tables.md`.
- **Previous report:** CHECK-v1.md.

## What I did

- Opened the page in the built-in browser at 1180 px (light) and at 390 px (dark and light), and measured the drawn page with JavaScript.
- Read the v1 to v2 changes (`diff preview.html preview-v2.html`) to know what to look at. Every result below is measured on the drawn page.
- Measured about 230 values:
  - 20 trend points against the live app;
  - grid ticks and dot range;
  - 3 tile sizes, the eyebrow and the row alignment;
  - 12 row heights;
  - 5 bar heights, the target line and the 30-day labels;
  - 4 averages;
  - text overlap on all 14 charts;
  - 56 question-bubble placements: 8 bubbles in 5 answer combinations, plus 8 at 390 px dark and 8 at 390 px light;
  - about 50 positions and sizes on the 3 sheet mock-ups;
  - about 12 values on the live search sheet;
  - every font size on the sheets.
- Checked for horizontal scroll at 390 px: none (scrollWidth 390 = clientWidth 390), in dark and in light.
- Did not plant-test again (the coordinator said round 1 proved the check works).

## v1 findings: are they fixed?

| v1 | Status | Measured |
|---|---|---|
| F1 claim "both charts without scrolling" | ✅ fixed | The text now says the weight chart is on the first screen and calories is one short scroll. True: the weight chart is at 236 to 407 px and the calories chart starts at 783 px; the visible area ends at 731 px. |
| F2 labels on bars | ✅ fixed | The 30-day view has no "so far". The target line runs 44 to 333 with no number. 0 text overlaps in all 14 charts. |
| F3 trend formula | ✅ fixed | Now matches trendAt. "80.9 kg" on OLD and NEW, as in the live app. All 20 line points equal the live app's within 0.01 kg. |
| F4 tiles | ✅ fixed | Tiles are 24 px. The note says 24 px. |
| F5 OLD parts | ⚠️ partly | Fixed: eyebrow 13 px / .09em, `.row` centred, recent workouts with the live date box and words ("21 sets · 3420 kg lifted · walk 20 min"). **Not fixed: the rows are 81 px tall, not 64** (G2). |
| F6 undeclared | ✅ fixed for Progress | Units, Open Diet (as a new value), the kept live values, the h2 at 20 against 21 px, and Average equal to Diet's averageLast7 (checked in foodmath.js:92) are all declared. |
| F7 answers pre-picked | ✅ fixed | No button is pressed at the start; each card says "Not answered yet". The switch went from "Show questions (4 open)" to "(2 open)" after 2 answers. |
| F8 bubble out of sight | ✅ fixed | Bubble 103 sits on the "Body weight" title (y 92, visible). |
| F9 weight scale | ✅ fixed | 3 lines (80.5, 81.5, 82.5). The dots span y 46 to 167 inside the 24 to 174 plot. The new scale rule is marked for Rosario to approve. |

The 7-day calories chart still has its today outline with "so far", 5 bars of the right height (2050, 2200, 2450, 1980 and 2100 kcal), 2 gaps, and averages of 2,156 and 2,164 kcal.

## New scope: Diet search with built-in UK foods

What passed:

- **Credit line:** it matches the research notes word for word: "Contains public sector information licensed under the Open Government Licence v3.0. Common foods: McCance and Widdowson's Composition of Foods Integrated Dataset 2021, Public Health England." The licence name is drawn as a link. It shows on the search sheet and on the built-in food sheet. The Open Food Facts line stays on the search sheet.
- **The NEW group:** "Common UK foods (built in, work offline)" comes under Your foods (DESIGN.md 15.8: Your foods first). It has 8 rows and "Show all 23". The online search still runs only on Search, and "UK products only" stays.
- **Question 104:** bubble 104 sits on the new group (inside the frame, on target, in all 9 placements I checked). Answer 104 b redraws the list with takeaway dishes mixed in and "Show all 61"; answer a puts it back.
- **Light and dark:** colours look right in both. No emoji inside the phones.

## Findings

**G1 (major): the built-in food sheet is not "the food sheet as for a saved food". The page says it is.**
- Where: `builtinSheet` (preview-v2.html, "after a tap" phones), compared with openCheck in sheets.js.
- `Save without adding` is missing. DESIGN.md 15.5 says "Save and add" and "Save without adding" come first.
- Several differences from the live sheet are not declared:
  - The title is the food name. The live title is "Your food", and the name sits in Food details.
  - Food details is one line of text. Live has editable Name and Per 100 g fields.
  - The meal row is drawn as wrapping chips (44 px, 15 px, soft accent when picked; "Snacks" falls to a second line). Live uses the `.meals` 4-column grid of `.pick` buttons (48 px, 14 px, picked in the button colour).
  - The stepper is drawn as 3 separate boxes with "PORTION" inside. Live has the label above and one surface box.
  - A new line "= 222 kcal · 48 g protein" appears, which live does not have. The maths is right: 150 g x 148/100 = 222 kcal, and 150 x 32/100 = 48 g.
- The research notes say "opens like a saved food".
- Fix: either draw it like the live saved-food sheet with only the source line changed, or declare each change (read-only details, chips, stepper, the kcal line) as a new value for Rosario to approve. Add "Save without adding" either way.

**G2 (minor): the box sizing differs from the app, so rows are too tall.**
- The mock-up has no `box-sizing: border-box`. The app has it on every element (app.css:87).
- Exercise and recent-workout rows draw at 81 px on OLD and NEW (64 min-height + 16 padding + 1 border). Live is 64 px. So the v1 F5 fix "rows 64 px" is not true on screen.
- Sheet food rows `.fl` draw at 75 px against the live 58 px.
- Fix: add `*, *::before, *::after { box-sizing: border-box }` inside `.ph`.

**G3 (minor): the OLD search sheet is drawn unlike the live app.**
- The close control is "×". Live is the text button "Close".
- The sheet fills the phone from 57 px down. Live is only as tall as its content and sits at the bottom: measured 381 px tall with no saved foods, with the Diet rings showing above it.
- The search box is 50 px with the surface colour. Live is 52 px with the raised colour.
- Behind the sheet only the "Diet" title is drawn.
- NEW repeats the "×".
- Fix: copy the live sheet.

**G4 (minor): the example order breaks the research's own ranking rule.**
- The research says rows starting with the first word come first, "then shorter names".
- Every example row starts with "Chick", yet "Chicken, mince, raw" (the shortest) is 6th, after much longer names, and the Chickpeas rows are mixed in.
- The mock-up is the builder's contract. Fix: sort the examples the way the rule says, or change the rule.

**G5 (minor): question 104 states an estimate as fact.**
- The recommendation says "Both fit under 500 KB". The research marks the food count and size as not verified: they need the download.
- Fix: write "both should fit under 500 KB (estimate)".

**G6 (minor): the Diet-search frames are narrower than 375.** At 1180 px there are 3 frames per row, each 363 px wide, not 375. The Progress frames are 375 (377 with the border).
- Fix: allow 2 per row, or fix the width at 375.

**Notes (not failures):**
- There are 4 questions, more than the first brief's "at most 3". The coordinator added question 104 for the new scope.
- The research also puts the OGL line at the foot of the Diet tab; the page does not draw it.
- The sub line "UK food tables · per 100 g" next to "148 kcal / 100 g" says "per 100 g" twice.

## Not checked

- Whether the published version 1795043880-557a is byte-equal to preview-v2.html. I checked the local copy only.
- Saving to the artifact db in claude.ai. There is no `window.claude` locally; the code still uses `claude.use("db")` with v2 keys and no localStorage.
- The live check sheet for a saved food, drawn in the browser. The live copy has no saved foods, so I compared it with the code only.
- The live Diet foot.
- A real iPhone and motion.
- The CoFID numbers. The page says its example kcal values are made up, not taken from the tables.

VERDICT: FAIL. F1 to F4 and F6 to F9 are fixed, and F5 is mostly fixed. But the new food sheet drops "Save without adding" (DESIGN.md 15.5) and differs from the live saved-food sheet in undeclared ways (G1, major). A box-sizing gap makes the OLD rows and sheet rows taller than the app (G2), and the OLD search sheet is drawn unlike the live app (G3).
