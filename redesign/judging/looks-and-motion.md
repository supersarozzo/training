# Judge 1 · Looks and motion

Lens: looks and motion (premium feel, hierarchy, type, colour and contrast, light and dark, icons, animations, consistency).
Date: 2026-11-17. Judge 1 of 4, working alone. Read and run only; no app code changed.

## 1. What I did

- **Read:** CLAUDE.md, docs/DESIGN.md, docs/PRD.md, all four PROPOSAL.md files, each build's `css/app.css` (tokens, keyframes, reduced-motion rules), `js/ui/motion.js` (A, B, D), `prefs.js` (C), `icons.js` (all), photo-loop code.
- **Unit tests** (`node --test` inside each folder):

| Build | Tests | Pass | Fail |
|---|---|---|---|
| A | 268 | 268 | 0 |
| B | 260 | 260 | 0 |
| C | 268 | 268 | 0 |
| D | 263 | 263 | 0 |

- **Screenshots:** looked at every non-"full" screenshot in all four `screens/` folders (A 30 screens x 2 themes, B 25 light + 9 dark, C 34 x 2, D 20 light + 19 dark), put side by side light over dark.
- **Live, in the built-in browser at 375 x 812** (own no-store servers on 8211-8214, own tab, made-up demo data from C's seed script adapted per build, `?date=2026-11-23&fake-github=1`):
  - First start (A, B), Today, Progress, Plan, Settings, Weigh-in, plus Gym tab (C, D), in light and dark.
  - A script measured the real contrast of every visible text element (text over photos skipped) on those screens, both themes.
  - Checked the in-app "Animations off" switch on C and D by counting running animations.
  - Checked B's undefined colour token live.
- **Not live:** workout screens (walk, set, rest, sheets, finish, week 1) were judged from the builders' screenshots and the code only.
- The browser pane was hidden for the whole session. Animations driven by the browser's frame timer stalled, so live screenshots caught things half-faded. I did not use those live screenshots for scoring; I used them only for DOM and colour measurements.

## 2. Scores (1-10)

| Sub-point | A dark sport | B Apple | C logger | D coach |
|---|---|---|---|---|
| Premium feel, hierarchy, type | 9 — boldest; 800-weight numbers, photo heroes, chips on the photo, one strong accent | 8 — polished native iOS, large titles, inset lists; looks "stock iPhone"; on the set screen you must scroll to reach the steppers | 7 — neat and calm, but the stepper numbers are small (about 28 px) and there is a lot of small text | 7 — calm, big guide cards; letterboxed photos and button-style toggles feel less finished |
| Colour and contrast (WCAG) | 9 — every token pair passes; live scan found 0 fails; only weak spot is light text over photo heroes | 6 — tab labels 3.23, secondary buttons 4.38, white tick on green 2.22, one colour token missing | 6 — the "faint" grey is used for real data: PREVIOUS column 3.15, tab labels 3.15/3.89, day letters 2.84 | 9 — every pair passes in both themes; live scan found 0 fails |
| Dark mode quality | 9 — a real dark design (near-black, volt glow rings); but light photo plates frame the pictures | 8 — true iOS dark (black + #1c1c1e), accents lifted; only 9 dark shots | 8 — real dark, soft blue accent with dark text on buttons | 8 — real dark, teal-mint accent, no shadows; light letterbox plates behind photos |
| Light mode quality | 7 — black button with volt text stands out; the olive green (#5a8f00) looks cheaper; hero text over photos is weak | 9 — the best light mode: grey page, white cards, crisp blue | 8 — crisp and clean, a strong blue | 8 — warm stone page, white cards, calm teal |
| Motion and reduced motion | 6 — rich, short motion, Reduce Motion respected; **no in-app off switch**; glow "breathes" forever on timers | 7 — the best spring system, sheets slide out when closed, Reduce Motion keeps final states; **no in-app off switch** | 8 — off switch (checked live: 29 animations, then 0 with it off) plus Reduce Motion; the photo loop cuts hard | 9 — off switch plus Reduce Motion; photos crossfade, then tap to flip when motion is off; purposeful segment fill, ring and check |
| Consistency and icons | 8 — one accent, original line icons, same look on every screen | 8 — very consistent; but the Today icon is a star and there are many accent colours (blue, green, orange, cyan, red tiles) | 9 — one own icon set, always with a word, the same table language everywhere | 7 — consistent cards; mixed photo framing (cover on Today, letterbox on the set card); sheet "Close" sits on the left |
| **Lens total (average)** | **8.0** | **7.7** | **7.7** | **8.0** |

## 3. Contrast (WCAG ratio, computed from each build's CSS tokens)

AA rule: 4.5 for normal text, 3.0 for large text and UI parts (borders, rings, icons).

| Build · theme | Main text on page / card | Muted text on card | Accent text on card | Main button text | Status (ok / warn / error) on card | UI border | Result |
|---|---|---|---|---|---|---|---|
| A light | 17.62 / 19.56 | 6.93 | 6.34 (#3f6b00) | 17.01 (volt on black) | 5.02 / 5.02 / 5.62 | 4.37 | PASS (accent graphics #5a8f00 3.92 = UI pass) |
| A dark | 18.41 / 17.04 | 7.54 | 16.02 (volt) | 17.12 (ink on volt) | 10.57 / 11.04 / 6.64 | 3.81 | PASS |
| B light | 18.82 / 21.00 | 5.07 (4.54 on grey page) | 5.57 (4.99 on page) | 4.70 (white on #0071e3) | 5.33 / 5.28 / 5.38 | — | **FAIL**: label-3 #8a8a8e 3.44 (live tab labels 3.23), green fill #34c759 2.22 (UI), secondary button 4.38 (live) |
| B dark | 21.00 / 17.01 | 6.61 | 6.01 | 4.70 | 8.42 / 8.28 / 4.99 | — | PASS (live: all text passed except one disabled button) |
| C light | 17.16 / 19.03 | 6.18 | 6.89 | 6.89 | 5.02 / 5.02 / 5.90 | 3.15 | **FAIL**: text-3 #8b91a1 3.15 (live: tab labels 3.15, day letters 2.84; also PREVIOUS column, future sets, table header) |
| C dark | 17.77 / 16.29 | 6.92 | 6.36 | 6.94 | 10.10 / 10.73 / 7.12 | 3.88 | **FAIL**: text-3 #6e7585 3.88 (live tab labels 3.89) |
| D light | 16.58 / 17.92 | 6.56 | 5.47 | 5.47 | 5.02 / 5.02 / 6.47 | 4.56 | PASS |
| D dark | 17.74 / 16.43 | 7.86 | 9.74 | 9.10 | 10.40 / 10.86 / 6.55 | 4.83 | PASS |

Flash "Go" screens: A 17.12, B 10.39, C 11.92, D 11.92. All pass.

## 4. Best build per element (looks only)

- **Today:** A. The photo strip of today's exercises, the 12-week bar and the timeline make it feel like a premium sport app.
- **Set screen:** A. Tips/Video/Swap chips sit on the photo, set tiles, 42 px steppers and Done all fit on one screen. (C is denser, but its numbers are smaller.)
- **Rest:** A. The glowing ring, round −30/+30 buttons and a "Next" card with a photo.
- **Walk:** A. Treadmill hero, big speed and slope tiles, glow ring (in light mode, fix the text that sits over the photo).
- **Warm-up:** B. A clean inset list with photos, reps and a chevron, under a small ring.
- **Swap:** B. Reasons as a coloured icon list, and the swap choices show photos (A shows none).
- **Finish:** A. The ring and check draw in, numbers count up, and it stays calm.
- **Week 1:** C. The only build with every week-1 step shot in both themes, in the same table look.
- **Weigh-in:** B. A scale icon, one big stepper and measurements as an inset list.
- **Progress and charts:** C. Charts draw in, gold "best" dots, a small trend line on each exercise row.
- **Weekly:** C. Number tiles with a 5-segment workout bar.
- **Plan sheet:** B. A segmented control (Week / Exercises / Machines) and photo lists.
- **Machines list and card:** C. Area groups, "sign" names, a "where noted" counter tile and a clear "where" box.
- **Exercise sheet:** B. A big photo, a how-to card and a "Watch video" pill.
- **Settings:** C. A "Look" group with Auto/Light/Dark and a real switch for animations.
- **Setup and intake:** D. App icon tile, photo strip, card per choice, thin progress bar.
- **Targets:** B. Number tiles with small coloured icons.
- **Update banner:** n/a. Not seen live in any build; all four style it the same way (a floating card with an accent border).
- **Motion system:** D. Purposeful motion, an in-app off switch and Reduce Motion support. Also take B's technique of shortening animations to 1 ms, which keeps final states.
- **Colour tokens:** D. All pairs pass and it stays closest to the old checked tokens. A comes a close second.
- **Icons:** C. One original set, always shown with a word.

## 5. Must-fix problems per build

**A — dark premium sport**
1. No in-app "Animations off" switch (Rosario's standing rule). Settings has only Look: Auto/Light/Dark (`js/ui/settings.js`, `js/ui/motion.js` reads only Reduce Motion).
2. In dark mode the photo plate is light (`--photo-plate: #eceef1`). It draws pale frames round photos in the exercise sheet and machine card (`15-exercise-info-dark`, `16-machine-card-dark`). Use a dark plate or `object-fit: cover`.
3. Light mode: text sits over darkish photos under a white fade (`--hero-fade`). The walk hero eyebrow "BLOCK 1 · TREADMILL" and the exercise name on the pair hero are hard to read (`05-walk-light`, `29-week1-learn-light`). Use a dark scrim under the text in light mode too, or put the text below the photo.
4. The ring glow `breathe` runs forever (3.2 s loop) on every timer screen. Limit it, for example to the last 10 s, to save battery and cut distraction.
5. Minor: `@keyframes set-in` animates `background` (not transform/opacity only). The floating Start button covers the timeline with no fade (`04-today-light`).

**B — clean Apple style**
1. `--accent-text` is used but never defined (`css/app.css` lines 596, 599, 611). Checked live: back links render black, not blue, and so would the Week 1 starting weight.
2. The light tab labels (`--label-3` #8a8a8e, 11 px) measure 3.23. Blue text on the pale-blue secondary buttons measures 4.38. Both fail AA. Use `--label-2` for the tabs and darken the secondary button text.
3. The white tick on a green set number (#34c759) measures 2.22, below 3.0 for UI parts. Use the darker `--green` or a black tick.
4. No in-app "Animations off" switch.
5. The Today tab icon is a star, so its meaning is unclear. The first-start icon tile is teal and off-palette. Week 1 is not shot, and only 9 dark screenshots exist.

**C — fast data-dense logger**
1. `--text-3` (light #8b91a1 = 3.15, dark #6e7585 = 3.88) is used for real data: the PREVIOUS column (last time's numbers), future set values, table header, tab labels, week-strip day letters (2.84 live). Use `--text-2` for any text.
2. The steppers in the set table show about 28 px numbers, against 40 px in DESIGN.md. This is the weakest arm's-length hierarchy of the four.
3. The photo loop is a hard cut (`steps(1)`), which flickers. B and D crossfade.
4. `@keyframes glow` animates `filter` and `background` (not transform/opacity).
5. Minor: the full-width gold "New best" banner is loud next to the calm palette.

**D — coach style**
1. Photos use `object-fit: contain`, so the set card and the Today-after-save hero get letterbox bands (`09-set-*`, `04b-today-saved-light`). Use `cover` with a focus point.
2. Settings toggles are outlined text buttons ("Sound is on", "Animations are off"). They read as actions, not states. Use a switch.
3. Sheets put "Close" top-left, while A, B and C (and the iOS habit) put it top-right.
4. Set-card chips are 40 px and steppers 52 px (smaller than the 56 px main size). The builder admits this.
5. The dark swap sheet and Week 1 were never shot or opened.

## 6. Recommended base for looks

**Base: A (dark premium sport).** It best matches Rosario's words "sleek, premium, modern". Its dark mode is a real design, and its contrast already passes everywhere. A and D tie on points; A wins on premium feel, which was the main ask.

Take from the others:
1. **From D:** the in-app Animations switch (stored on the device only, also turning off the JS helpers) and the crossfade photo loop with "tap to see the end position" when motion is off.
2. **From B:** the light-mode polish (white grouped cards, the inset-list look for Settings, Weigh-in and the Exercise sheet), the sheet-close animation, and the Reduce Motion technique (shorten animations to 1 ms so final states still show).
3. **From C:** the "Look" settings group, the draw-in charts with gold best dots and per-exercise trend lines, and the Gym tab and machine card layout.
4. **From D:** contrast discipline in light mode. Keep accent text at 5:1 or more, and replace A's olive light accent (#5a8f00) with something cleaner, for example a deeper green-black pairing.
5. **From B:** swap choices with photos, and coloured reason icons, as long as each colour carries a word.

## 7. Not checked

- ⚠️ A real iPhone: SF Rounded digits, frosted blur, safe areas, real frame rate and touch feel.
- ⚠️ Animations watched frame by frame: the pane was hidden, so frame-driven animations stalled. Motion was judged from code (durations, eased properties, reduced-motion paths) and from counting live animations.
- Reduce Motion emulation: the tool cannot switch it on. Checked in CSS and JS only.
- Live workout screens (walk, set, rest, sheets, finish, week 1) and the update banner: judged from screenshots and code only.
- Text over photos: skipped by the contrast script, judged by eye.
- Text one step larger, 320 px width, landscape, print.
