# Judge 2: speed at the gym

Lens: how fast and safe it is to use each build at the gym, with one sweaty hand and the phone on a bench.
Date: 2026-11-17. Judge 2 of 4. I only read and ran the builds; I changed no app code.

## 1. What I did

- **Tests:** `node --test` in each folder. A: 268 pass, 0 fail. B: 260 pass, 0 fail. C: 268 pass, 0 fail. D: 263 pass, 0 fail.
- **Live in the built-in browser** (375 x 812, dark mode, my own no-store server, `?date=2026-11-23` = Monday of week 4). I seeded made-up test data (3 weeks of finished workouts, weigh-ins, two "where it is" notes; no real body data).
- **Clicked live in all four builds:** Today → Start → Skip walk → Skip warm-up → 2 warm-up sets → set 1 with the right weight → "How many more?" → rest +30 s → Skip rest → set with +2.5 kg and −1 rep → Swap ("Machine busy") → close and reopen the app → Continue → End → Finish and save → Save → Progress → Weigh-in → +0.1 → Save.
- **Measured** every tap target and number size with `getBoundingClientRect` and computed font sizes. I measured again after animations ended.
- **Old app (`app/`)** clicked live up to the first rest screen, to compare.
- **Only from code or screenshots:** light mode (builder screenshots only), the natural finish after the last set, week 1, timed holds, walk and warm-up timers running.

## 2. Tap counts

"Sheet" = the "How many more?" bottom sheet in A, B, D and the old app. It opens over the rest screen after Done. If you ignore it, it closes by itself when the rest ends. If you want to use +30 s or Skip first, you must close it, which costs 1 more tap.

| Task | A | B | C | D | Old app |
|---|---|---|---|---|---|
| (a) Set, weight right | 1 (Done) | 1 | 1 | 1 | 1 |
| (b) +2.5 kg, −1 rep | 3 | 3 on the 2nd exercise; **scroll + 3** on the 1st exercise of a pair | 3 (or 1 tap on PREVIOUS when last time's numbers fit) | 3 on the 2nd; **scroll + 3** on the 1st | scroll + 3 on the 1st |
| (c) "How many more?" | 1 (sheet; it also closes the sheet) | 1 (sheet) | 1 (inline on the rest screen, no sheet) | 1 (sheet) | 1 (sheet) |
| (d) Rest +30 s / skip | 1 each; +1 while the sheet is open | 1 each; +1 with sheet | 1 each | 1 each; +1 with sheet | 1 each; +1 with sheet |
| (e) Swap, machine busy | 3 (Swap, Machine busy, pick) | 3 | 3 | 3 | 3 |
| (f) Finish and save | 1 after the last set (Save; effort optional); 3 if ended early (End, Finish and save, Save) | same | same | same | same |
| (g) Morning weigh-in | Progress, Weigh in, ~2 steps, Save = about 5 (Today card needs a scroll) | about 5 | about 5 | about 5 | about 5 (from code) |
| (h) Today → first set | 3 (Start, Skip walk, Skip warm-up); +2 warm-up Dones to the first work set | 3 (+2) | 3 (+2) | 3 (+2) | 3 (+2) |
| (i) Resume after closing | 1 (Continue workout; lands on the exact set, all sets kept) | 1 | 1 | 1 | 1 |

✅ The PRD goal (1 tap when right, 3 at most when not) is met by A and C on every set. B and D fail it on the first exercise of each pair, because the steppers are hidden under the Done bar (see section 5).

### Measured sizes (dark, 375 x 812)

| Item | A | B | C | D | Old |
|---|---|---|---|---|---|
| Done button | 343 x 58 | 343 x 56 | 343 x 56, shows "35 kg × 8" on it | 343 x 56, locks for 170 ms and shows "Saved" | 343 x 56 |
| Weight/reps −/+ | 58 x 58 | 56 x 56 | **44 x 48** | 66 x 52 | 56 x 56 |
| Weight/reps number | 42 px | 44 px | **26 px** (table 21 px) | 36 px | 40 px |
| Set 1 steppers visible without scroll (1st exercise, after warm-ups) | yes (ends y695; bar starts ~730) | **no** (weight y743-799 under the bar, reps y834 off screen) | yes (y561-609) | **no** (number y737, −/+ y793-845) | no (reps y731-787) |
| 2nd exercise (Pulldown) | yes | reps −/+ partly under the bar (y694-750) | yes | −/+ partly under the bar (y698-750, bar 732) | – |
| Rest timer digits | 92 px | 80 px | 76 px | 88 px | 96 px |
| Rest −30/+30 | 76 x 76 round | 64 x 64 round | 168 x 56 | 154 x 56 | 166 x 48 |
| "How many more?" buttons | 62 x 44 | 62 x 48 | 59 x 48 | 66 x 48 | 62 x 44 |
| "Undo that set" gap above Skip rest | 90 px | **3 px** | 12 px | hidden behind the bar (needs scroll) | far |
| Chips (Tips, Swap, …) height | 40 | 43-44 | 40 | 40 | 44 |
| Workout "End" button | **63 x 36** | 44 x 43 | 44 x 44 | 53 x 44 | 53 x 44 |
| Weigh-in −/+ and number | 58 x 58, 42 px | 56 x 56, 44 px | 48 x 52, 30 px | **146 x 56, 40 px** | – |

## 3. Scores (1-10)

| Sub-point | A | B | C | D |
|---|---|---|---|---|
| Set logging taps | 8 — 1 and 3 taps, no scroll; the sheet blocks the rest screen | 5 — scroll needed before changing weight on every first exercise | 9 — 1 tap, numbers on the Done button, PREVIOUS copies last time, no sheet | 6 — scroll on the first exercise; good 170 ms double-tap lock |
| Rest timer | 8 — 92 px digits, big round ±30, Undo far from Skip | 6 — 80 px; Undo 3 px above Skip rest | 7 — "How many more?" inline, wide ±30; 76 px digits; Undo 12 px above Skip | 8 — 88 px, wide ±30, Undo out of the thumb zone, "Up next" big |
| Swap and finish | 6 — 3 taps, but End is only 36 px tall | 8 — 3 taps, 44 px chips and End | 7 — 3 taps, 40 px chips | 7 — 3 taps, 40 px chips |
| Weigh-in | 7 — big stepper, 42 px number | 6 — "Save measurements" 7 px above "Save weigh-in" | 6 — 40 px Weigh in button, 30 px number, small steppers | 8 — very wide −/+, 40 px number, nothing near Save |
| Thumb reach and tap sizes | 8 — 58 px steppers and Done; End 36 px | 6 — steppers pushed under the bar; RIR 48 px | 6 — steppers at the 44 px minimum | 7 — 66 px wide steppers, but hidden on the first exercise |
| Readability and no-scroll set flow | 9 — fits at 375 x 812, 42 px numbers, 92 px timer | 5 — fails no-scroll; numbers big when you see them | 6 — fits, but 26 px numbers are hard at arm's length | 5 — fails no-scroll; 36 px numbers |
| **Lens total (average)** | **7.7** | **6.0** | **6.8** | **6.8** |

## 4. Best build per element (speed lens only)

- **Today:** tie: Start and Continue are 1 tap in all four. C also lists today's exercises with suggested weights, which helps you get ready.
- **Set screen:** A. It fits without scrolling, with big 42 px numbers and 58 px steppers. Add C's numbers on the Done button.
- **Rest:** A (92 px digits, big round ±30, Undo far away). Add C's inline "How many more?".
- **Walk:** n/a (only "Skip walk" measured: 1 tap in all).
- **Warm-up:** n/a (Skip warm-up is 1 tap in all; it skips both change-over and lift warm-up).
- **Swap:** B (same 3 taps everywhere; B's chips are the only ones at 44 px).
- **Finish:** tie (Save is 1 tap in all; the throw-away choice has a second confirm in all).
- **Week 1:** not checked.
- **Weigh-in:** D (146 x 56 −/+ buttons, 40 px number, Save measurements far from Save weigh-in).
- **Progress and charts, weekly, plan sheet, machines list and card, exercise sheet, settings, setup and intake, targets, update banner, colour tokens, icons:** n/a for this lens.
- **Motion system:** A (screens slide only when the screen is new; nothing delays the next tap). Keep D's 170 ms Done lock as a double-tap guard.

## 5. Must-fix problems

### A
1. `js/ui/pair.js` `askRir`: the "How many more?" sheet covers the rest screen. +30 s or Skip need one extra tap first. Move it inline on the rest screen, like C.
2. The workout top bar "End" button is 63 x 36 px (under the 44 px minimum).
3. The sheet's small "Skip" sits right on top of the rest screen's "Skip" main button. A quick double tap closes the sheet and then skips the rest.
4. "How many more?" buttons are 62 x 44; DESIGN.md asks for 56 px.
5. The chips on the photo (Tips, Video, Swap) are 40 px tall.

### B
1. Set screen, first exercise of each pair: the weight stepper is under the Done bar (y743-799) and reps is off screen (y834-889). You must scroll before you can change anything. The warm-up list also stays open after both warm-ups are done, which takes the space. (The proposal says "no extra taps"; that is not true here.)
2. Second exercise: the reps −/+ buttons are partly under the bar (y694-750).
3. Rest: "Undo that set" ends 3 px above "Skip rest". A slip deletes the set you just saved.
4. Weigh-in: "Save measurements" is 7 px above "Save weigh-in".
5. The "How many more?" sheet has a full-width Skip exactly over "Skip rest" (the same double-tap risk as A).

### C
1. The set steppers are 44 x 48 px with a 26 px number (the table digits are 21 px). They are the smallest of the four: hard to hit with a wet thumb and to read from a bench. Aim for at least 52-56 px buttons and 36 px or more numbers.
2. A double tap on Done lands on "Skip rest" (same place, no lock, no sheet in between), so the rest is lost. Add a short lock like D's.
3. Rest: "Undo that set" is 12 px above "Skip rest".
4. Progress: the "Weigh in" button is 103 x 40 px; the chips are 40 px.
5. The rest timer is 76 px, the smallest of the four (DESIGN.md says 96 px).

### D
1. Set screen, first exercise of each pair (with warm-ups and a "where" line): the weight and reps steppers are under the Done bar (number y737, −/+ y793-845). The proposal's "fits" check was made on a screen without warm-up sets and without a last-time line.
2. Second exercise: −/+ partly under the bar (y698-750, bar top 732).
3. Set-screen chips are 40 px; the steppers are only 52 px tall.
4. Rest: "Undo that set" sits behind the bar and needs a scroll (safe, but slow when you really need it).
5. The "How many more?" sheet covers the rest screen (the same as A).

### Shared (old app too, not caused by the redesigns)
- Swapping in the middle of an exercise changes the label of the sets already saved for that slot (`js/model.js` `swapExercise`). Live: a 35 kg chest press set became "Dumbbell bench press: 8 reps at 35 kg, a new best", and "next time" said 35 kg. The stepper also carries 35 kg over to the new exercise (the `draft` in `pair.js`). C's PREVIOUS button fixes the weight in 1 tap; in the others it takes many − taps.

## 6. Recommended base for speed

**A.** It is the only build where every set meets the PRD goal with big numbers and no scroll. It has the biggest steppers and Done, a 92 px timer, and Undo far from Skip.

Parts worth taking from the others:
1. **From C:** "How many more?" inline on the rest screen (no sheet over the timer).
2. **From C:** the numbers on the Done button ("Done 35 kg × 8"), so you confirm what you save at a glance, and the PREVIOUS button that copies last time's numbers in 1 tap.
3. **From D:** the 170 ms Done lock with a "Saved" tick, against double taps (apply it to rest Skip too).
4. **From D:** the wide 146 x 56 weigh-in −/+ buttons.
5. **From B:** the "Saved · 55 kg × 10" line at the top of the rest screen, and 44 px chips.

## 7. Not checked

- ⚠️ A real iPhone: real touch, a sweaty hand, Safari safe areas, the home-screen launch (I used a desktop browser at phone size).
- Sound, the "Go" flash at zero, screen wake lock, the timer after locking the phone.
- Light mode live: seen only in the builders' screenshots; bright-gym glare not tested.
- Week 1 flow, timed holds (plank), the natural finish after the last set (from code: the finish screen opens by itself), walk and warm-up timers running.
- 320 px width, larger text size, Reduce Motion.
- The browser pane was hidden while I worked, so some first measurements caught screens mid-animation. I measured again after waiting, and the numbers above are the settled ones.
