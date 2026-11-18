# Change notes

What is new in each app version, in plain words. Newest first. Older versions: see `docs/HANDOVER.md` and the git log.

## 0.5.0 · 2026-11-18 (live since 2026-11-18, commit 20cdbbd)

The Plan and Gym part of the Plan, Gym and Diet redesign (build steps 1 to 5 of
`redesign/plan-diet/judge/JUDGING.md` section 7). Diet, food sync and the barcode reader come later (steps 6 to 8).

**Plan tab**
- One day per page, like Today: day strip with done ticks, walk first, pairs in words, small body map on every card,
  arrows to the day before and after at the bottom. The 12 weeks sheet shows each week's real sets.
- Tap an exercise: two body maps ("This exercise" and "Day so far"), Sets, Reps, Rest, Stop with, Previous and Next.
- **Edit** a day: Swap, Remove, Add an exercise (at the end, 3 sets, 60 s, at most 2 a day). Each change saves at once
  and lasts for that day of the plan, every week. Past workouts and a running workout never change.
- Every change shows an Undo button for 8 seconds.
- A changed day shows "Changed by you" with what changed, and "Back to the plan's Tuesday" (it asks first).
- Today shows the changed day too (exercises and minutes).
- **Muscles**: the "Whole plan check" card opens weekly sets per muscle for the whole plan, with what stands out.
  It only shows numbers and never changes the plan.

**Plan change** (answers 80 to 83): calf raises on the leg press on Monday and Wednesday, a dumbbell lying leg curl on
Thursday, one abs exercise less on those days. New moves start with 2 sets in their first workout.

**Gym tab**: Machines (as before) and Exercises (every exercise grouped by muscle).

**Settings** is the gear at the top right of every tab. The Print button is gone.

**Words**: the 12 weeks list says "Sets as shown on each day" (answer 85 a).

**Behind the scenes**: saved Plan edits sync as one record per day (`plan_days`); a day saved by a newer app version is
kept and shown as the plan, never overwritten. 422 tests.
