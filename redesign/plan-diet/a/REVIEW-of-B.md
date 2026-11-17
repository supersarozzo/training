# Review of builder B (commit 3fcfa48) by builder A

Read-only review of commit 3fcfa48. Nothing in `redesign/plan-diet/b/` was changed by me (B was editing its own files during my review; the bugs below were seen on 3fcfa48 as served at that time). I ran B from the repo root on 127.0.0.1 at 375 x 812,
dark and light, with Animations off (the Browser pane was hidden, which pauses entrance animations; B's slide-in froze
half-way until I turned motion off, the same as mine). I read B's REPORT.md and grepped its code.
Real Open Food Facts calls I made through B: 1 (the Nutella sample).

## Summary

B is the stronger **"see your body"** design and has a more complete Diet tab. Mine is faster at the gym and has
fewer data bugs. B has two real bugs in permanent editing (both put the same exercise twice in a day). Both are easy to
fix, but they are in a delicate area.

## What B does better than A (honest)

1. **Body map on every exercise card** (front or back view, wherever the main muscle is) and on every swap row. It
   costs no taps and makes the muscle visible at a glance. Mine only had words on the card.
2. **Previous / Next inside the exercise layer**, card by card, with the "Day so far" map building up as you go
   ("Day so far · 4 of 7"). This is the best reading of "the right map shows the day up to this card": you can walk
   the day without closing the layer.
3. **A day map at the top of each day** with "Works most: Quads 6 · Glutes 6 …" and "Less: calves …". It answers
   "what does today train?" in one look.
4. **Day strip shows each day's focus** ("Upper A", "Lower A", "Full"). Mine showed only the day names.
5. **Swap list marks "Plan's pick"** (the plan's own swap), so the safe choice is obvious.
6. **Four big "ways" on the Diet screen** (Scan, Search, Digits, Quick). Search, typed digits and quick add are one tap
   from the Diet tab; mine needed "Add food" first.
7. **Check step says so when the numbers are fine** ("The numbers add up."). Both prototypes run the same add-up test
   (4 × protein + 4 × carbs + 9 × fat against the calories); mine only speaks when something is wrong.
8. **Scanner demo covers more cases**: saved food, real product, unknown barcode, product with no numbers, misread
   (misread keeps the camera open with a clear message).
9. **Meals** (breakfast, lunch, dinner, snacks) in the Diet list and a meal picker when adding; carbs and fat shown.
10. **"Back to the plan's day" has a confirm step** that lists what goes away. Safer than my Undo-only approach for the
    biggest change on the tab.
11. Smaller good ideas: a sets stepper on each card in Edit mode; a warm-up step on the day page; filter chips on Gym
    › Exercises; a 20 s timeout on Open Food Facts calls; the whole-plan check names "Not trained on purpose: traps,
    forearms, neck, inner thighs".

## What B does worse

1. **Swap is deep in the layer.** "Swap for good" sits about 1,560 px down the exercise layer (2 screens of scrolling,
   after photos, tips, video and machine). Mine puts Swap / Remove chips at the top of the layer.
2. **First exercise below the fold.** The day map card takes about half the screen, then walk and warm-up. At the
   gym the first exercise is not visible without scrolling. Mine shows the walk and the first exercise at once.
3. **Day map and whole-plan check disagree.** Tuesday says "Works most: Hamstrings 6" (helpers counted half), while
   the whole-plan check says "Hamstrings 3 · Under 10". For a non-developer this reads as a contradiction.
4. **Whole-plan check alarms too much.** It lists 6 muscles under 10 (including biceps 5 and triceps 8, which reach 11
   and 15.5 with helpers) and shows "Lower back 0 sets · Under 10" although lower back is not a target. Mine flags 4
   and greys the helper-only cases.
5. **Label mismatch in the swap list**: swapping Smith machine squat shows "Similar equipment (smith machine)" but
   lists Leg press (a machine) under it.
6. **Edits do not reach Today** in B's prototype: Today is a stub, so it cannot show that a swapped Tuesday changes
   the workout. Mine wires the edit into the real Today screen and workout.
7. **Undo lasts 5 s** (mine 8 s). Short for a gym, with a phone in one hand.
8. **New-food portion starts at 100 g** (Nutella: "539 kcal · this portion"), not the pack's serving size. Easy to log
   too much by mistake.
9. **Body shapes come from body-muscles (Apache-2.0)**, not react-body-highlighter named in my brief. B kept the
   licence and NOTICE files correctly, so it is legal; the master should just know the two use different shapes.

## Bugs found (with steps)

**B-1 · Swap can put the same exercise twice in a day (medium, delicate area).**
1. `?reset=1`, Plan › Tuesday. Tap Leg press › "Swap for good" › Smith machine squat.
2. Tap Smith machine squat › "Swap for good". Leg extension is listed with the tag "Already on Tuesday" but is a
   normal, tappable button.
3. Tap it. Result in `plan_days`: `A1=leg_extension … D=leg_extension`. Tuesday now has Leg extension twice (6 sets).
Expected: rows already in the day are not offered, or are disabled.

**B-2 · Add offers an exercise already in the day and puts it in an abs place (medium, delicate area).**
1. `?reset=1`, Plan › Tuesday › "Edit Tuesday" › "Add an exercise" (the sheet offers "Abs, first / Abs, second").
2. Pick Hamstrings. The only choice is Romanian deadlift, which is already on Tuesday (B1).
3. Tap it. Result: `Abs1=romanian_deadlift`, shown under "Abs and holds · Short rests". So the day has the deadlift
   twice, and the second one gets the short abs rests.
Expected: exercises already in the day are left out; a non-abs exercise should not take an abs place (or the place
should take that exercise's normal rest).

**B-3 · Minor:** the whole-plan check marks "Lower back 0 sets · Under 10" (not a target muscle; it should be in "Not
trained on purpose" or shown without a verdict).

Checked and fine in B: no `innerHTML` and no style attributes (grep), Reduce Motion and Settings › Animations off
respected in its motion code, OFF calls on submit only with `app_name=TrainingApp`, OFF credit on the Diet tab and the
check step, tap on a card opens the layer, "Back to the plan's day" + confirm + Undo works, light and dark both
readable, no sideways scroll.

## Measured tap counts (B, from another tab)

| Task | B | A (mine) |
|---|---|---|
| See Thursday | **2** (Plan › Thu) | **2** |
| Swap an exercise | **4 + about 2 screens of scrolling** (Plan › card › scroll › "Swap for good" › pick), or **4** via Plan › "Edit Tuesday" › Swap › pick | **4** (Plan › card › Swap › pick), 3 from the day page |
| Log a scanned food (new product) | **3 + the scan** (Diet › "Scan a barcode" › read › "Save food and add"), checked with the real Nutella lookup | **3 + the scan** |

## What I will take, in my own way

- A small body map on each exercise card (one view, the side with the main muscle).
- Previous / Next in the exercise layer, with "Day so far · n of N".
- The focus under each day in the strip.
- "Plan's pick" in the swap list.
- The ways (Search, Digits, Quick add, Copy yesterday) right on the Diet screen.

Not taken: the big day map at the top (it pushes the first exercise below the fold, which goes against "fastest at the
gym"), the confirm step on "Back to the plan's day" (Undo stays, fewer taps), meals (more taps per entry).
