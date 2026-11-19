# Check of the Progress charts mock-up, v3

Date: 2026-11-18. Checker: the same independent check chat as for v1 and v2 (read-only on `app/` and `tests/`).

- **Page checked:** `redesign/progress-charts/preview-v3.html` on http://localhost:8745/. It stands for the published version 1795044290-0c36.
- **Compared with:**
  - `app/js/diet/sheets.js` (openSearch, openCheck in "saved" mode);
  - `app/js/ui/parts.js` (openSheet, stepper);
  - `app/js/food/foodmath.js` (checkFood);
  - `app/css/app.css` (`.pick`, `.stepper`, `.step-btn`, `.sheet`, inputs) and `app/css/diet.css`;
  - the live search sheet I measured in round 2 (381 px tall, with "Close", a 52 px search box and the rings behind);
  - `docs/DESIGN.md` 15.5 to 15.10;
  - `docs/research/2026-11-18-uk-food-tables.md`.

## What I did

- Read the v2 to v3 changes (`diff`) to know where to look. Every result is measured on the drawn page in the built-in browser: at 1180 px light, 1180 px dark (screenshot), 390 px dark and 390 px light.
- Measured about 150 values:
  - the sheet geometry of 5 sheets;
  - about 60 positions, sizes and colours on the sheets;
  - 12 row heights;
  - the Progress trend, ticks, bars, target and averages;
  - text overlap on all 14 charts;
  - 40 bubble placements (8 bubbles in 3 answer combinations at 1180 px, plus 8 at 390 dark and 8 at 390 light);
  - overflow of every number, name and field box.
- Result at 390 px: no sideways scroll (390 = 390) in dark or light, no box overflow, and all 8 bubbles inside their frames.

## G1 to G6: are they fixed?

| v2 | Status | Measured |
|---|---|---|
| G1 food sheet | ⚠️ almost | **Fixed:** the order is the live saved-food order: heading, "How much did you have?", Grams / Pieces, "Portion" label above one surface box, "Meal" label, a `.meals` 4-column grid (48 px, 14 px, picked in the button colour), Save and add 150 g, Save without adding (52 px), Food details, the source line, the Name field, Per 100 g, 4 fields, the OGL credit. The "= 222 kcal" line is gone. Two differences are declared. **Left:** H1, plus small sizes in H2. |
| G2 box sizing | ✅ fixed | `border-box` inside the phones. Exercise and recent rows are 64 px (12 of 12). Phone frames are 375 x 812. |
| G3 OLD sheet | ✅ fixed | "Close" text button (44 px, accent words). The sheet sits at the bottom, sized to its content: 420 px tall (the live sheet is 381 px with no saved foods; the mock-up has 1 food row). The search box is 52 px with the raised colour (white light, #1a1d24 dark). The Diet rings are drawn behind. The NEW sheets reach the 88 % cap: top at 98 px, 713 px tall. |
| G4 order | ✅ fixed | Name lengths are 19, 30, 31, 37, 37, 42, 44, 48: shortest first. The sub line is "UK food tables". Answer 104 b is also sorted (23 to 48) and shows "Show all 61". |
| G5 estimate | ✅ fixed | Now reads "should fit under 500 KB (an estimate until the file is downloaded)". |
| G6 375 columns | ✅ fixed | All full phones are 375 px wide at 1180 px. The third sheet wraps to a new row (left 16 px). |

**Progress part: no regression.**
- F3: the trend reads 80.9 kg on OLD and NEW.
- F9: 3 weight grid lines (80.5, 81.5, 82.5).
- The NEW line is 2 px with no glow.
- F4: the tiles are 24 px.
- The bars are 2050, 2200, 2450, 1980 and 2100 kcal, with the today outline, 2 gaps and the target at y 64.
- The averages are 2,156 and 2,164 kcal.
- F2: 0 text overlaps in 14 charts.
- F1: the weight chart ends at 406 px and the calories chart starts at 781 px; the visible area ends at 730 px. That is still true to the text.
- F7: no answer is pressed at the start, and the count drops as you answer.
- All bubbles are on their targets after answering 101 b, 103 b and 104 b.

## Findings

**H1 (minor): one difference is not declared.**
- The live saved-food sheet shows the numbers check under the Per 100 g fields: "✓ The numbers add up." (`result`/okline in openCheck; foodmath.js:130). The NEW built-in sheet does not show it.
- The page says the sheet is "the live 'Your food' sheet, unchanged, with two differences".
- Fix: draw the okline under the 4 fields, or declare that built-in foods skip the check.

**H2 (minor): a few sizes differ from the live sheet.**
- The Name and Per 100 g field boxes are 49 px. Live inputs are 52 px (app.css:217).
- The stepper buttons are 56 px with 4 px padding (box 66 px). Live `.step-btn` uses `--tap-main` (58 px) with 6 px padding (about 72 px). Note: DESIGN.md section 8 says 56 x 56, so the live app and DESIGN.md disagree here.
- The sheet h2 is 20 px; the live sheet h2 is 21 px.
- Fix: copy the live values (or name these as kept differences).

## Not checked

- Whether the published version 1795044290-0c36 is byte-equal to preview-v3.html. I checked the local copy only.
- Saving to the artifact db in claude.ai (no `window.claude` locally; the code is unchanged apart from "v3").
- The live saved-food sheet drawn in the browser (the live copy has no saved foods), so I compared it with the code only.
- The OGL line at the Diet foot (the page says "not drawn").
- A real iPhone.

VERDICT: FAIL. Narrow: G1 to G6 are fixed and Progress has not regressed. One undeclared difference is left (H1: the missing "✓ The numbers add up." line), which the rules count as a FAIL item. Fixing H1 (and copying the live sizes in H2) is enough for a PASS.
