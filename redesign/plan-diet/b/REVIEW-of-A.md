# Review of builder A (commit c12984e) by builder B

Worker 8.29, 2026-11-17. Read-only review: nothing in `redesign/plan-diet/a/` was changed.

How I tested:
- A ran from the repo root at 375 x 812 in headless Edge, light and dark, with Reduce Motion on.
- I took 29 screens per look (58 in all): Plan day, Thursday, exercise layer, swap, swapped day, Romanian deadlift
  swap, edit, add, 12 weeks, Muscles check, Gym (both parts), Diet, Add food, scanner, a real sample scan, a bad
  barcode, Today and Settings. These review shots stay on my computer; A's own `shots/` folder is the record.
- I checked sideways scroll and tap sizes in the browser pane on 8 screens and sheets.
- I searched the code for `innerHTML` and style attributes.
- I compared A against research section 11, items 7-18, and Rosario's request.

## Verdict in one line

A is the calmer, faster tool at the gym, and it is wired into the real app. B shows the body better. A has one real
logic bug in swaps (the plan's own swap is hidden).

## What A does better than B (honest)

1. **Swap, Remove and Video sit at the top of the exercise layer.** A swap is 3 taps from the day page with no
   scrolling. In B the "Swap for good" button was at the very bottom of a long layer. *Taken into B.*
2. **Pair headers say how the workout runs:** "Pair A · back and forth · 3 rounds · rest 90 s after each round".
   B said only "Back to back, then rest". *Taken into B.*
3. **It is wired into the real app.** A copied the whole app, so a swapped Tuesday really shows on Today and in the
   workout. A running workout locks its day with a clear card. B had the rule ("running workouts never change") but
   no screen for it. *The lock is taken into B.*
4. **Done days are ticked in the day strip.** *Taken into B.*
5. **A way out of the matches:** "Show exercises for other muscles" in the swap sheet. B had no way to pick another
   muscle. *Taken into B, with a warning that it changes what the day works.*
6. **Denser day page.** About 4 or 5 cards fit on a screen, against about 3 in B. Helpers are written on each card
   ("Front thighs · helps calves, glutes"). It is quicker to scan between sets. *Not taken: it goes against B's
   "see your body" angle. Rosario should compare the two side by side.*
7. **The Muscles check shows both numbers on every row** ("9 · 9", "3 · 12") and starts with a "4 things stand out"
   card. B makes you switch "Main muscle only / Helpers count half". A's is clearer. *Not taken this round (B's
   hero map already gives a summary). It is a good candidate for the merged version.*
8. **Diet details:**
   - one search box that takes a food name or barcode digits;
   - "Save without adding" on the check step;
   - a time on each entry of the day.

   *All three taken into B.*
9. **Day arrows at the bottom, with the day names** ("‹ Monday · Wednesday ›"), where the thumb is. *Not taken: B's
   bottom bar holds "Edit Tuesday". B has the arrows at the top, plus the strip and swipe.*
10. **"Changed by you · 17 Nov"** puts a date on the changed-day card. *Not taken; small, worth keeping in the merge.*

## What A does worse

1. **The body is less visible.** There is no body map for the day on the day page, and no map on the cards. The
   two maps in the layer are small. The words under "Day so far" are crowded: "(helping)" is repeated after each
   muscle in a narrow column. A says this is on purpose (its disagreement 1). It meets the request, but it is the
   weaker version of "see your body".
2. **Swap logic hides the plan's own swap** (bug 1 below).
3. **Settings is hard to reach from 3 tabs.** Today has a "Settings" pill and Progress has a gear. Plan, Gym and
   Diet have neither, so from those tabs Settings takes 2 taps, and the button looks different on each tab. B puts
   the same gear on every tab.
4. **Adding an exercise needs an engine change.** Added exercises go at the end as new slots `E1` / `E2`, "at most 2
   a day". A itself says the real build needs a new slot grammar and a change to `setsFor`. B fills the day's free
   places (the abs and "on its own" places), so the week set rules keep working with no new rules.
5. **The screenshot set is incomplete** (A's own report). 11 screens have no light version, and 3 files have the
   wrong size.
6. **A copied the whole app** (about 90 files, including the sync and token code) into a folder of the public repo.
   That is safe today, because the app code is public anyway. But it leaves a second copy of delicate code to keep
   in step. Both prototype folders should be removed after judging.

## Bugs found (with steps)

| # | Severity | Steps | What happens | Expected |
|---|---|---|---|---|
| 1 | Medium | Plan → Tuesday → Romanian deadlift → Swap | The sheet says "No other exercise in the app works the back thighs as the main muscle with the machines your gym is known to have". Cable pull-through only shows behind "Show exercises for other muscles", without a "plan's pick" mark. | The plan lists cable pull-through as the swap for Romanian deadlift (`plan-v2.js`, no machine needed), and A's own layer says "The plan's own swap". It should be offered first. B had the same bug and fixed it: the plan's swaps are always offered. |
| 2 | Low | Plan → any day, look at the bottom | The floating "‹ Monday · Wednesday ›" bar has no background. Card text shows through the gap between the two buttons and under them ("12", "he" in the screenshot). | A solid or blurred bar background, like the tab bar. |
| 3 | Low | Plan, Gym or Diet → look for Settings | There is no gear. You must go to Today first. | The same gear on every tab (B's way), or at least on every tab that has a header. |
| 4 | Low (shared) | Settings → Animations switch | The switch is 34 px tall (under 44 px). | Copied from app 0.4.1, so B has the same. Fix it in the app. |

Checked and fine in A:
- no sideways scroll on any tab, the layer or the swap sheet;
- every other target is 44 px or more;
- no `innerHTML`, no style attributes;
- the Open Food Facts credit is there;
- the sample scan did a real lookup, and the check step caught "pack: 1 gram";
- a bad barcode gives a clear message with no lookup;
- light and dark both work;
- the Muscles numbers match research 5.3 (chest 9, back 12 · 15, shoulders 20 · 36, abs 27).

## Measured tap counts (same 3 tasks, from another tab)

| Task | A | B before review | B after review |
|---|---|---|---|
| See Thursday | **2** (Plan → Thu) | 2 | 2 |
| Swap an exercise | **4** (Plan → card → Swap → pick), no scrolling | 4, plus a long scroll to the bottom of the layer | **4**, no scrolling (Swap is now at the top) |
| Log a scanned food (new) | **3** (Diet → Scan → camera reads → Save and add) | 3 | 3 |
| Log a scanned food (saved before) | 3 (Diet → Scan → Add) | 3 | 3 |

In both prototypes the camera read is a stand-in tap ("Try a sample scan" in A, "pretend read" chips in B). It is
not counted, because the real reader reads by itself.

## Against the request (research 11, items 7-18)

| Item | A | B |
|---|---|---|
| Plan: one day per page, arrows, today marked, real week sets, no print | Yes (arrows at bottom) | Yes (arrows at top) |
| Cards with all information; layer with photos, tips, 2 maps | Yes, smaller maps | Yes, maps lead |
| Edit: add, remove, swap with matching, the no-match text | Yes; bug 1 | Yes |
| Edits last, said plainly, way back to the plan's day | Yes (Undo instead of confirm) | Yes (Undo, and confirm on "back to plan") |
| Past and running workouts never change | Yes, with a running lock | Rule only → now with a running lock |
| Whole-plan muscle check, honest, does not change the plan | Yes, clearer rows | Yes |
| Gym with Exercises and Machines | Yes (grouped by muscle) | Yes (A-Z with filter chips) |
| Diet: targets, scan, digits, search, saved and recent, check step, credit | Yes | Yes |
| 6th-tab answer | Settings to a gear on Today and Progress | Settings to a gear on every tab |
| Reduce Motion, tokens, 375 x 812 light and dark, 44 px, no innerHTML | Yes (shots incomplete) | Yes |
| Nothing lost (inventory, 0 missing except print) | Yes | Yes |
