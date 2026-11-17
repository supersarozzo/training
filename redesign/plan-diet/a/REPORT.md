# Prototype A · "fastest at the gym" (worker 8.28, builder A)

A working phone prototype of the new **Plan** tab, the **Gym** tab with Exercises and Machines moved in, and the new
**Diet** tab. It is a design version for judging, not the real app: `app/`, `tests/`, `docs/` and `STATUS.md` were not
touched. Sample data only; the calorie and protein numbers are made up (target 2,300 kcal, 140 g protein).

How to open it (computer only):

```
python -m http.server 8128 --bind 127.0.0.1 --directory C:/Users/Rosario/Documents/training
```

then `http://localhost:8128/redesign/plan-diet/a/` at 375 x 812. `?reset=1` puts the sample data back.
Photos are linked from `app/media/`, so the repo root must be served.

## 1. The angle in one line

Calm, dense, one-hand use, few taps: the Plan tab is **one day per page that looks like the Today screen**, and every
change is one tap away from an Undo.

```
Tab bar:  Today  Plan  Gym  Diet  Progress
                  |     |    |
   day page ------+     |    +-- today vs targets, Log again,
   (strip Mon-Fri,      |        Add food / Scan at the bottom
    arrows at bottom)   |
     |                  +-- Machines | Exercises
     +-- tap card -> exercise layer (2 body maps)
     +-- Edit -> Swap / Remove / Add (lasts)
     +-- Muscles -> whole-plan cross-check
     +-- Week chip -> 12-week sheet
Settings: gear button on Today and Progress
```

## 2. Design choices

**Plan tab (research 11 items 7-10)**
- One day per page. A strip Mon-Fri at the top (done days ticked, today ringed, changed days get a small dot) and
  big "‹ Monday / Wednesday ›" buttons in the bottom bar, where the thumb is. The page opens on today.
- The page header copies Today: eyebrow "Week 3 · Build 1", big day name, a TODAY tag, focus line, then
  "about 90 min · 21 sets · stop with 2 left".
- The sets are the **real sets of the week shown** (week rules applied: week 1 = 2 sets, easier weeks one less, week 7+
  Pair A gets a 4th set). The week chip opens a 12-week sheet; picking another week shows a plain note "Showing week 7.
  This week is week 3." with "Back to this week".
- Cards are grouped the way the workout runs: "Pair A · back and forth · 3 rounds · rest 90 s after each round", walk
  card first. Each card: photo, name, sets × reps, main muscle and helpers in words.
- No Print button and no print tables (Rosario's answer).
- Tap a card: the exercise layer. Dose line, Swap / Remove / Video chips, **two body maps side by side**: left "This
  exercise" (main muscle dark, helpers light), right "Day so far" (sets per muscle from the first card up to this one,
  helpers count ½), then photos, tips, video, machine row and the plan's own swap.

**Edit (items 11-13, answer 65)**
- Two ways in: the Swap / Remove chips in the exercise layer (fastest: 3 taps from the day page), or the Edit chip,
  which puts Swap and Remove buttons on every card and an "Add an exercise" button at the end.
- Every edit **saves at once and lasts**: the swap sheet says in a green box "Lasts: every Tuesday from now on. Past
  workouts stay as they were. You can go back to the plan's day at any time." After the change: a toast with **Undo**
  (8 s) and a "Changed by you · 17 Nov" card on the day with the list of changes and **"Back to the plan's Tuesday"**
  (which itself has an Undo).
- No "are you sure?" step: the Undo and the way back replace it. This keeps a swap at 3 taps.
- Swap list: "Same muscle (front thighs), other equipment" / "same equipment", with photos and reps. Exercises
  already in the day are named ("Already in Tuesday: Leg extension") and not offered twice.
- **When no match exists** (example: Romanian deadlift; the only other back-thigh exercise is the leg curl machine,
  which the first gym visit has not confirmed): a card says "No other exercise in the app works the back thighs as the
  main muscle with the machines your gym is known to have. Keep Romanian deadlift, remove it, or pick from another
  muscle below." plus "Not shown: Leg curl machine. Your first visit has not found this machine yet (Settings > Gym)."
  and a "Show exercises for other muscles" button.
- Add: the sheet says where it goes before you pick: "at the end, after the abs, done on its own. 3 sets this week,
  60 s rest. At most 2 added exercises a day. Adds about 8 minutes." Muscle chips carry a "low" badge when the
  cross-check finds that muscle short.
- **Past and running workouts never change.** Past workouts keep what they stored. While a day's workout is running,
  the Edit chip is hidden and a card says "Tuesday's workout is running. It keeps its exercises. You can change this
  day after you finish it." (screenshot 16).
- Edits reach the Today screen and the workout: a swapped Tuesday shows Smith machine squat on Today (checked).

**Muscle cross-check (item 14)**
- The "Muscles" chip opens a whole-plan screen: phase choice (Week 1 / 2-5 / 6 / 7-11 / 12, dot on this week),
  a "4 things stand out" card, a weekly body map, then one row per muscle with two numbers: **direct sets** (muscle is
  the main one) and **with helpers** (helping counts ½), a bar with the 10-20 band, and the days.
- Numbers match research 5.3 exactly (chest 9 · 9, back 12 · 15, shoulders 20 · 34.5, biceps 5 · 11, triceps 8 · 15.5,
  quads 12, hamstrings 3 · 12, glutes 9 · 15, calves 3 · 10.5, abs 27). Flags: chest low, back thighs low, calves low,
  abs a lot. Biceps and triceps show "Under 10 direct; 10+ counting helpers" in grey, not as a warning, so the card
  does not cry wolf.
- It says plainly: "This screen only shows numbers. It never changes the plan." It includes Rosario's own edits.

**Gym tab (item 15)**
- A switch at the top: **Machines** (the Gym list as today, "2 of 15 noted", where each one is) | **Exercises** (every
  exercise grouped by main muscle, with "In the plan: Mon" or "Swap only", helpers, tap = the same exercise layer with
  its body map).

**Diet tab (items 16-17)**
- Top card: protein first (bigger number), then calories, each with target, bar and "76 g to go" / "1,550 kcal left".
  A 7-day average line under it.
- "Log again · one tap": the foods you eat most, those not yet had today first; the "+" adds the usual amount at once,
  with an Undo toast. Tapping the name opens the amount sheet.
- Today's list with times; tap a row to change the amount or remove it.
- Bottom bar: "Add food" and **"Scan"** (the main button).
- Scan: a full-screen layer with a drawn camera picture (prototype), frame corners and a scan line (no line with
  Reduce Motion). "Try a sample scan" does a real Open Food Facts lookup; "Type the digits" checks the barcode check
  digit before sending; "Take a photo" is a placeholder.
- **Check before saving**: every looked-up food opens an editable sheet (name, per 100 g numbers, portion) with soft
  warnings ("The pack size says 1 gram. That is likely wrong."). "Save and add 43.1 g" or "Save without adding".
- Add food sheet: Scan / Quick add (just kcal and protein, for a meal out) / Copy yesterday, a search box (digits =
  barcode lookup, words = name search), saved foods that work offline, "Make a new food".
- Credit line on the Diet screen and on every looked-up food: "Contains data from Open Food Facts, available under the
  Open Database License."

**6th tab problem (item 18)**: five tabs only: Today · Plan · Gym · Diet · Progress. Settings moves to a **gear
button** at the top right of Today and Progress (route `#/settings` kept, with a "‹ Today" back link). Settings is
rarely used; the gym tabs are used every day.

**Rules (item 19)**: DESIGN.md tokens and components reused; one new token `--map-base` / `--map-line` for the body
map's grey (light and dark). Reduce Motion respected (scan line, staggers). Tap targets 44 px or more. No `innerHTML`
with data, no style attributes (bar widths are set through CSSOM because of the CSP). Data from Open Food Facts is
clipped and checked before it is shown or saved; it is only ever put in text nodes and input values.

## 3. Tap counts

| Task | Taps | How |
|---|---|---|
| See Thursday | **2** | Plan tab → "Thu" in the strip (or "Wednesday ›" twice from Tuesday) |
| Swap an exercise | **4** from anywhere, **3** from the day page | Plan → card → Swap → pick. Undo is 1 more tap if wanted |
| Log a scanned food | **3 + the scan** | Diet → Scan → (camera reads) → "Save and add". A food scanned before skips the check: Diet → Scan → "Add" |
| Log a usual food again | **2** | Diet → "+" |

## 4. Inventory: where every old Plan tab item lives now

| Old Plan tab item | Now |
|---|---|
| Week part: day list with photos | Plan day page (one day per page), same photos |
| Day focus ("Lower body A") | Day page, under the day name |
| Walk text (easier / normal, slope, effort) | Walk card at the top of each day |
| Slot letter, sets × reps, rest | Pair header ("Pair A · 3 rounds · rest 90 s") + card "3 sets × 10-12 reps". The letters A1/A2 are replaced by the pair header |
| "Swap: …" line | Exercise layer ("The plan's swap") and the Swap list |
| 12 weeks list (phase, sets, RIR, walk note) | Week chip → "The 12 weeks" sheet (same lines, this week marked) |
| RIR explanation | Bottom of the 12-weeks sheet |
| Exercises part (every exercise, tap = how to do it) | Gym tab → Exercises (grouped by muscle, with where it is in the plan) |
| Machines part (where each machine is) | Gym tab → Machines |
| Exercise sheet: photos, tips, video, machine | Exercise layer (same content + body maps + Swap/Remove) |
| Print button and A4 tables | **Removed** (Rosario's answer; the only item gone) |

**0 missing except the print sheet.**

## 5. Data notes for the real build (delicate: Opus + review, tests first)

- **Plan edits**: one record per plan day in `plan_days`, id `p-plan-v2-<day>`, holding the whole edited day
  (snapshot of slots), a short change log, and a tombstone for "Back to the plan's version" (research 9.1). Records
  that fail checks are kept but not used.
- **Engine change needed**: a day-override hook (`dayOf(day)`) so Today, the workout and `setsFor` read the edited day,
  and the slot grammar must accept `E1`/`E2` (added exercises, done on their own). In the prototype this is a 6-line
  hook in a copied `plan-v2.js`; the real build needs tests first.
- **Food**: `food_log` entries store the computed numbers (so later edits to a food do not change past days), `foods`
  with id `fb-<barcode>` for scanned foods. Recommend the food data syncs to **its own file** (research 9.4), so a
  merge problem in food never touches the workout log.
- **Muscle data**: main and helping muscles come from the free exercise database. **9 swap-only exercises are my own
  reading** (marked `own: true` in `js/proto/muscles.js`): cable curl, cable lateral raise, rear-delt raise, dumbbell
  glute bridge, calf raise on the leg press, lat pulldown machine, seated row machine, leg curl machine, calf raise
  machine. To check against the database before the build. Shoulders front/side/rear is also our own split.
- **Matching swaps**: same main muscle; equipment classes machine / cable / dumbbell / Smith / body. Machines the first
  visit has not confirmed are left out (as the mid-workout swap does today).

## 6. Open Food Facts findings

- Real lookups made: 3 product lookups by barcode (the sample barcode), 3 name searches from the page, 1 by hand to
  check the server headers. All on submit only, only the barcode or the search word, `app_name=TrainingApp`, no name or
  email, `credentials: omit`, no referrer. Well under 15 a minute (the app also limits itself to 10 a minute).
- The barcode lookup took **about 8 seconds** once; the "Looking it up" sheet with "Only the barcode number is sent"
  covers the wait (screenshot 27).
- One name search failed once with a browser CORS error and worked on retry; the app showed "No answer" correctly.
- **Name search quality is poor**: "skyr" returned French fromage blanc first, then an Arabic-named product, then one
  real skyr (screenshot 30). The barcode path and saved foods are the reliable ways; name search should be the last
  resort, or filtered by country or language in the build.
- The sample product (Twix glacé) has pack size "1 gram" in Open Food Facts: the soft warning caught it. This shows
  why the check step is needed.

## 7. Where I disagree (gently) with Rosario's choices

1. **Body maps not on every card.** They are in the exercise layer (1 tap away) and on the Muscles screen. On every
   card they would double the page length at the gym. Words "Front thighs · helps calves, glutes" stay on the card.
2. **No confirm before a lasting change.** Answer 65 says edits last forever. I kept that, but with Undo and "Back to
   the plan's day" instead of an "Are you sure?" step, so a swap stays 3 taps.
3. **The plan itself**: the cross-check honestly shows abs at 27 direct sets (more than needed) and chest, back thighs
   and calves low. The screen does not change the plan, as asked, but a short plan review may be worth a decision.
4. **Name search** is weak in Open Food Facts; I put Scan and "Log again" first and search below them.

## 8. Open questions for Rosario (for the mock-up)

- A1. Is the **gear button for Settings** on Today and Progress OK, so the tab bar keeps 5 tabs?
- A2. **Added exercises go at the end**, done on their own, 3 sets, 60 s rest, at most 2 a day. OK, or should they join
  a pair?
- A3. Should the **Smith machine count as "other equipment"** next to free weights in the swap list (today: yes)?
- A4. **"Log again" adds with one tap** (with Undo). OK, or should it always ask for the amount?
- A5. **Food in its own synced file** (recommended) or in the same file as the workouts?
- A6. Day arrows **at the bottom** (thumb) and the day strip at the top: OK, or arrows at the top too?
- A7. Cross-check wording: "4 things stand out" with "low" / "a lot". Clear enough?

## 9. Screenshots (`shots/`)

33 dark and 22 light, at 375 x 812, with Animations off (the Browser pane was hidden, which pauses the entrance
animations; motion was checked in the code). Light versions were not taken for: 02 plan bottom, 04 layer photos,
13 week 7, 16 running block, 22 amount sheet, 24 quick add, 26 type digits, 27 looking up, 29 check bottom,
30 search results, 33 Progress. The scan layer is dark in both modes on purpose (camera view).
Three files were captured at device scale (600 x 1299 instead of 375 x 812): 01-plan-day-light, 16-running-block-dark,
19-gym-exercise-layer-light; same 375 x 812 layout, just a larger picture. Shrinking them by script was blocked by
the permission check, so they are left as captured.

## 10. Checked and not checked

Checked in the browser: swap (3 taps, lasting text, Undo toast, changed card, reaches Today), remove + Undo, add +
the "Added" card, "Back to the plan's day" + Undo, running-workout block, no-match swap, week sheet and week 7 view,
cross-check numbers against research 5.3, Gym both parts, Diet one-tap add + Undo, amount sheet, quick add sheet,
scanner layer, typed digits form, real barcode lookup → check step, real name search, gear → Settings → back.

Not checked: a real camera and barcode reader (drawn picture only), real sync of `plan_days` and food, VoiceOver,
a real iPhone, "Copy yesterday" and "Make a new food" end to end, the 10-a-minute limit message.
