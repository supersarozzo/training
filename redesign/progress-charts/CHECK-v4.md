# Check of the Progress charts mock-up, v4

Date: 2026-11-18. Checker: the same independent check chat as for v1 to v3 (read-only on `app/` and `tests/`).

- **Page checked:** `redesign/progress-charts/preview-v4.html` on http://localhost:8745/. It stands for the published version 1795044451-39ba.
- **Compared with:** CHECK-v3.md (H1, H2), `app/js/diet/sheets.js` (openCheck), `app/js/food/foodmath.js:130`, `app/css/diet.css` (`.okline`), `app/css/app.css` (inputs, `.step-btn`, `.stepper`, `h2`) and `docs/DESIGN.md` section 2 (status tokens).

## What I did

- Read the v3 to v4 changes (`diff`). Only these changed:
  - the status-success token in both phone looks;
  - `.field .inp` is now 52 px;
  - `.okline` is new;
  - `.sheet .h2` is now 21 px;
  - `.stepbtn` is now 58 px;
  - the new okline element;
  - the db version labels.
- Measured the drawn page in the built-in browser: 1180 px light, 1180 px dark (the dark phones), and 390 px dark. I took about 40 measurements on 4 sheets, plus a Progress regression sample.

## H1 and H2

| v3 | Status | Measured |
|---|---|---|
| H1 numbers check line | ✅ fixed | "✓ The numbers add up." sits under the Per 100 g fields (just after `grid2`) and before the OGL credit, as in the live openCheck. It is 15 px weight 700. Colour #15803d in light and #4ade80 in dark: the DESIGN.md status-success tokens, with words. |
| H2 sizes | ✅ fixed | The field boxes are 52 px (5 of 5, light and dark). The stepper buttons are 58 px. The sheet heading is 21 px on all 4 sheets, including OLD and NEW search, which matches the live sheet h2. |

## Nothing else moved

- **Progress:** trend 80.9 kg, 3 weight grid lines, bars of 2050, 2200, 2450, 1980 and 2100 kcal, today outline present, rows 64 px, phone frames 375 x 812.
- **Questions:** the switch reads "Show questions (4 open)".
- **Sheets:**
  - the OLD sheet is 420 px tall at the bottom with its 52 px search box;
  - the NEW sheets are capped at 713 px (top 98 px);
  - the NEW food sheet scroll height grew from 1,011 to 1,046 px (the new line and the taller fields).
- **At 390 px dark:** no sideways scroll (390 = 390). No box overflow, the okline included. All 8 question bubbles are inside their frames and on their targets.

## Note (not a failure)

- The stepper box padding is still 4 px, so the box is 68 px. The live `.stepper` has 6 px padding (about 72 px). That is a 4 px difference, with nothing wrong in look or layout.

## Not checked

- Whether the published version 1795044451-39ba is byte-equal to the local copy.
- Saving to the artifact db in claude.ai.
- The live saved-food sheet drawn in the browser (no saved foods in the live copy), so I compared it with the code only.
- A real iPhone.

VERDICT: PASS. H1 and H2 are fixed in light and dark. Nothing else changed, and all v1 to v3 results still hold. Only the 4 px stepper padding note remains, as an optional polish.
