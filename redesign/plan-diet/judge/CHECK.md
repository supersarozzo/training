# CHECK · mock-up page (judge 8.30)

Date 2026-11-17. Page: `mockup.html`, published as a private artifact (https://claude.ai/artifact/3PXi5fxUPPUCou1D4Hfw52,
version 3). Checker: an independent Opus subagent that did not make the page. Brief: `build/checker-brief.md`.
It tested a local copy of the page in the same skeleton the artifact host adds (`build/preview.html`, not committed),
at 375 x 812 in the in-app browser plus full-page headless Edge pictures, against the live app 0.4.1 on this PC.

## Result: PASS (6 of 6 checks, after one fix)

| # | Check | Result | Counts |
|---|---|---|---|
| 1 | Every screen present | PASS | screens 13/13: 11 with OLD screenshots, 4 dashed "0.4.1 has no ..." boxes; 20 NEW screens x light + dark = 40 frames |
| 2 | OLD matches the live app | PASS | 9/9 pairs (18 screenshots): words, order and tabs match the live app at 375 x 812 |
| 3 | Nothing cut off at 375 px | PASS | page width 375, no sideways scroll; 0 cut-offs in 40/40 frames over 17 answer states; 4 frames run past 812 px as a normal scroll (Plan day top, Exercise open, Edit mode, Muscles top) |
| 4 | Light and dark readable | PASS | 0 low-contrast items in about 1,550 texts per look (light page, dark page, dark with other answers); text over photos and maps checked by eye |
| 5 | Question widgets | PASS | questions 13/13 (67-79), each with exactly 1 Recommended; starts hidden; 13 rings + 13 cards when shown; pick and re-pick work on screen and in the list; variants switch for 10 questions; copy text 13/13 lines; open count 13 -> 0; 0 cards overlapping, 27/27 answer buttons free in all 17 states |
| 6 | Page safety | PASS | 0 outside scripts, styles or links to load; 0 alert/confirm/prompt |

## Planted mistake (proves the checker catches errors)

- Planted: in a copy (`build/preview-x.html`, not committed), "Copy my picks" left out the last question (79).
- The checker was not told what or where. **Caught**, as its most serious problem: "Q79 is missing from Copy my picks
  and from the Your picks text box", with the cause. The real page was never changed for the plant.

## Runs

| Run | Page | Result | Problems found -> what the maker did |
|---|---|---|---|
| 1 | planted copy | FAIL (check 5: copy 12/13) | Q79 missing from copy (the plant) -> real page unchanged. Also real: Q67 changed nothing on screens -> tab bars and gear now follow 67; "changed" badge 1.00:1 contrast in dark -> solid badge; Q74 said "3 gaps" next to a "4 things" card -> reworded; questions only on light frames -> on purpose, intro now says so |
| 2 | real page | 5/6 PASS, check 5 with 1 problem | Q78's card covered Q76's answers on "Diet, scrolled down" (a tap on 76 b picked 78 a) -> Q78 moved to "Check before saving", ring on "Save and add"; tab bar note now says NEW follows question 67 |
| 3 | real page, targeted (checks 3, 5, overlaps) | PASS | none |

## Known and accepted

- With question 69 = b (arrows at the top), the Q69 ring has no target on "Plan day, scrolled down" (that screen has
  no arrows in that answer). The card still shows.
- Below 640 px the toolbar hides its "Copy my picks" button; the button under "Your picks" works.

## Not checked

A real iPhone, VoiceOver, the real clipboard (blocked in the test browser; the text-box fallback works).
