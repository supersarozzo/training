# Builder B · Plan, Gym and Diet prototype · "see your body"

Worker 8.29, builder B. Date 2026-11-17. A design version for judging, not the real app.
Nothing in `app/`, `tests/`, `docs/` or `STATUS.md` was changed.

## How to open it

```bash
python -m http.server 8792 --bind 127.0.0.1
```

Run it from the repo root. Then open http://localhost:8792/redesign/plan-diet/b/index.html at 375 x 812.

- `?reset=1` puts the sample data back.
- `?nomatch=1` shows the "nothing matches" swap state. No real exercise reaches it today.
- The date is fixed at Tuesday 17 November 2026 (week 3), so "today" always looks the same.
- All data is sample data. The calorie and protein targets (2,000 kcal, 140 g) and every food number are made up.

It uses the same saved-data keys as the app: `trn.data.v1` and `trn.device.v1`. It adds three new lists to the
document: `plan_days`, `foods` and `food_log`.

## Screenshots

`shots/` has 46 screens and opened layers in light and dark (92 files). Size: 375 x 812, taken at 2x. Every one was
taken with Reduce Motion on, so no frame is caught half-way through an animation.

| Prefix | What |
|---|---|
| p01-p18 | Plan: day page, Thursday, exercise layer (maps, numbers, photos, build-up, machine), swap (normal, nothing similar, nothing at all), edit mode, add, the changed day, "back to the plan", the 12 weeks, week 9 |
| p19-p21 | Whole plan check |
| g01-g06 | Gym: machines, machine card, exercises, filter, exercise layer |
| d01-d16 | Diet: totals, meals, scanner, misread, saved food, real Open Food Facts product, unknown barcode, product with no numbers, digits, search (own and Open Food Facts), quick add, copy yesterday, edit entry, "log again" with Undo |
| o01-o03 | Today stub, Settings (now behind the gear), Progress stub |

## My design choices

**1. The body is the hero.** Every day page opens with a big front and back body map of what the day works. It has
three steps of colour, and words next to it ("Works most: Quads 6 · Glutes 6 …", "Less: calves …"). Colour is never
the only signal. Every exercise card has a small map too. It shows the view (front or back) where the main muscle is.

**2. Two maps in the exercise layer.** Tap a card and the layer opens.
- Left map: this exercise (main muscle and helpers).
- Right map: "Day so far · 4 of 7". It shows everything the day has worked up to and with this card.
- Previous and Next walk card by card. The right map builds up, and muscles that just got stronger glow in.

The day maps count helper sets as half a set.

**3. One day per page, like Today.** A big day name with round arrows, a Mon-Fri strip with each day's focus, and
today marked with a bar. Swiping works too, but it is never the only way. The week chip at the top right opens the
12 weeks; pick a week and every day shows that week's real sets. This replaces the old 12-week table. A note says
when you are not on this week.

**4. Cards with all the facts, still fast.** Each card shows: photo, sets × reps, rest (or "Then 30 s to move on"
for the first of a pair), main muscle and the mini map. The layer adds:
- 4 number tiles: Sets, Reps, Rest, and "Stop with 2 reps left";
- the start/end photos, how-to tips and the video;
- the machine with Rosario's where-note;
- the plan's own swaps.

**5. Edits last for good, said plainly (answer 65).** Every edit sheet starts with the same box: "This changes every
Tuesday from now on, in all weeks. Workouts already done, and a workout you have started, stay as they were."

- A changed day shows "Your version" and a "You changed Tuesday" card listing each change.
- The card has a "Back to the plan's Tuesday" button with a confirm step.
- Every swap, remove and set change gets a 5-second Undo.
- There is no "just today" choice. The one-workout swap stays in the running workout, as decided.
- Past and running workouts never change: an edit only writes a `plan_days` record, never a session.

**6. Swaps that match.** "Swap for good" shows exercises whose main muscle is the same (lats and mid back count as
"back"), plus the plan's own swaps.
- Two groups: "Similar equipment (machine)" and "Other equipment".
- Each row shows its main muscle and a mini map.
- The plan's pick is marked. One already on that day is marked "Already on Tuesday".
- Exercises that need a machine your first visit has not confirmed are hidden, with a line that says which and why.
- When nothing is similar, the sheet says: "No other exercise in the app works the chest with this kind of equipment.
  The ones below use other equipment."
- When nothing matches at all, it says: "Nothing in the app matches Leg press. You can remove it, or ask the Training
  chat to add a new exercise (with photos) for the quads." Today no exercise reaches this; `?nomatch=1` shows it.
- The new exercise keeps the slot's sets and rest. Reps come from the new exercise.

**7. Add fills a free place.** A day has places for 3 pairs, 1 exercise on its own and 2 abs exercises. An add only
fills a free place, so the week rules (2 sets in week 1, 1 less in week 6, the 4th set on pair A) keep working
without new rules. The add sheet:
- marks the plan's lowest muscles as "few" (hamstrings 3, calves 3);
- says how many minutes the day will take.

**8. The whole plan check only shows numbers.** It shows weekly hard sets per muscle for a chosen week band (1,
2-5, 6, 7-11, 12). Each muscle has a bar with marks at 10 and 20, a verdict ("Under 10", "In range", "A lot"), and
on which days it is trained.
- "Main muscle only" and "Helpers count half" both show.
- Shoulders show as one total row (20, in range), then front, side and rear as "Part of shoulders". That way one
  part is not called "under 10" on its own.
- "Not trained on purpose" lists traps, forearms, neck and inner thighs.
- "How to read it" gives the sources (research 5.3-5.5).
- The plan is never changed from here. It says "Includes your changes to Tuesday" when there are edits.
- The numbers match research 5.3: chest 9, back 12 (15 with helpers), shoulders 20 (34.5), biceps 5, triceps 8,
  quads 12, hamstrings 3, abs 27, lower back 0.

**9. Gym tab holds Machines and Exercises.** It has a segmented control: Machines | Exercises.
- Machines is as in app 0.4.1, with the noted counter (3 of 14) and the where-note editor.
- Exercises has filter chips (Chest, Back, Shoulders, Arms, Legs, Abs), a mini map per row, and "In the plan: Tue,
  Thu" or "Swap only".
- Tapping an exercise opens the same layer with one map and "In your plan on Tuesday, Thursday."

**10. Diet: today against the targets, then add fast.** At the top:
- two rings: protein (left, the one that matters most for the plan) and calories, with "56 g to go" / "1,078 kcal
  left" in words;
- carbs and fat;
- the last 7 days' average.

Then the ways to add food:
- 4 big ways: Scan, Search, Digits, Quick.
- "Log again" tiles for recent foods. Tap + to add the last amount at once, with Undo; tap the name to choose the amount.
- "Copy yesterday".
- The meals list. Tap an entry to change or delete it.
- The bottom button is "Scan a barcode".

**11. Scan.**
- The scanner is a full-screen layer over `#/diet`, never its own page. On iPhone a page change can stop the camera
  (research 7).
- The camera view is drawn; real decoding is a later build step (answer 63 a).
- It shows "Type the digits" and "Take a photo" as fallbacks, and a note that the iPhone may ask for the camera each time.
- A good read closes the camera, then:
  - a saved food → the amount sheet;
  - a new barcode → Open Food Facts → the check step;
  - not found → "your own food", with the barcode kept, so next time it is found offline.
- A misread (wrong check digit) keeps the camera open with "That read looks wrong. Hold the phone still and try again."

**12. The check step before saving.**
- Name and the per-100 g numbers can be edited.
- Missing numbers are named.
- Numbers that do not add up get a warning (4 × protein + 4 × carbs + 9 × fat against kcal).
- Then the amount, the meal, and "Save food and add".
- The Open Food Facts credit line is on every sheet that shows their data, and at the foot of the Diet tab.

**13. Open Food Facts, carefully.**
- Requests are sent only on submit: a barcode read or the Search button.
- Only the barcode or the search word is sent, with `app_name=TrainingApp`. No cookies, no referrer.
- Caps of my own: 10 product reads and 8 searches a minute.
- Text from Open Food Facts is cleaned and cut to 120 characters, and numbers are range-checked. It is put on the
  page as text only, never as HTML.
- A request gives up after 20 s. In my tests Open Food Facts took 8-13 s per product, and a gym has weak signal.

**14. Motion.** These animations exist:
- the day slides in from the side it came from;
- cards come in one after another;
- muscles glow in on the build-up map;
- the toast rises;
- the scanner line moves.

All of them are cut by Reduce Motion or Settings > Animations off (the app's existing rule).

**15. New tokens.** `--map-body`, `--map-muscle`, `--map-line`, `--map-l1`, `--map-l2` for the maps in light and dark.
Everything else uses DESIGN.md tokens. The toast is dark (#1f232b) in both looks, because volt "Undo" was unreadable
on a light toast.

## The 6th-tab answer

Diet would make 6 tabs. **Settings leaves the tab bar.** It becomes a round gear button at the top right of every tab
screen. The tabs are:

```
Today · Diet · Plan · Gym · Progress
```

Why this answer:
- Settings is the least-used place.
- Phone apps often put it behind a gear.
- 5 tabs keep each target wide (75 px) and the words readable.

Diet sits next to Today because both are used every day.

## Tap counts (from any other tab)

| Task | Taps | Path |
|---|---|---|
| See Thursday | **2** | Plan tab → "Thu" in the strip (or the → arrow twice) |
| Swap an exercise | **4** | Plan → the card → "Swap for good" → pick one. Edit mode: Plan → Edit → Swap → pick = 4 too |
| Log a scanned food (saved before) | **3** | Diet → Scan a barcode → (camera reads by itself) → Add |
| Log a scanned food (new) | **3** | Diet → Scan a barcode → (lookup) → Save food and add. Plus a few taps if numbers need fixing |

## Inventory: the old Plan tab (app 0.4.1, `app/js/ui/plansheet.js`)

| Old Plan tab item | Where it is now |
|---|---|
| Header "Plan v2 · 12 weeks" | Plan header "Plan · Build 1" with the week chip |
| Week part: Mon-Fri list with each day's focus | Day strip (Mon-Fri with focus) at the top of Plan |
| Each day's exercise list (photo, slot, sets × reps, rest) | One day per page: exercise cards in pairs, with the same facts |
| Per-row "Swap: …" text | Exercise layer "The plan's swaps: …" and the swap sheet ("Plan's pick") |
| Walk-first line (easy or normal, slope and effort) | "Walk first" step at the top of each day |
| Tap an exercise → how to do it (photos, tips, video, machine) | Exercise layer (all of it, plus the two maps and the number tiles) |
| "The 12 weeks" list (phase, sets rule, RIR, walk note) | Week chip → "The 12 weeks" sheet, same lines, and it picks the week shown |
| RIR explanation line | Under the 12 weeks list, and the "Stop with … reps left" tile |
| Exercises part (every exercise A-Z, equipment, tap for info) | Gym → Exercises (A-Z, filter chips, mini map, tap for the layer) |
| Machines part (by area, photo, where-note or usual sign, machine card) | Gym → Machines (already there in 0.4.1; same cards and note editor) |
| Print button and the A4 print tables | **Removed, as Rosario decided.** The only item not carried over |

**Missing: 0** (apart from the print sheet Rosario removed).

## body-muscles (Apache-2.0)

- The shapes come from body-muscles by Ivan Vulović. The source is GitHub `vulovix/body-muscles`.
- Copied as-is into `vendor/body-muscles/`: `LICENSE`, `NOTICE`, and the 3 source data files (front, back, groups).
- What I changed is written at the top of `js/data/bodyshapes.js` (Apache 4b):
  - only each part's id and SVG path are kept, with whitespace squeezed (the numbers are unchanged);
  - the parts are grouped into our 18 muscle groups in `js/data/muscles.js`;
  - they are drawn by our own SVG code in `js/bodymap.js`.
- None of its components or scripts are used.

## Where I disagree with Rosario

Little.

1. **Name search should not be the main way.** I agree with answer 64 a: send only the barcode or the word. But on
   2026-11-17 the Open Food Facts name search answered "temporarily unavailable" (503) once. When it did work, "skyr"
   gave French and Arabic products first. Their newer search service is fast, but it sends no CORS header, so a web
   page cannot use it. So the design leads with scan and Rosario's own foods. Name search is the third way, and when
   it fails it says "Scan or type the barcode instead".
2. **"For good" edits.** I kept them exactly as decided. I would only add that the "Back to the plan's day" button
   should never be hidden, because "for good" plus a missed tap is the riskiest thing on this tab. It is never hidden here.

## Open questions for Rosario (to draw on the mock-up)

The master gives them numbers. B1 to B6 are my labels.

- **B1. Settings behind a gear** at the top right of every tab, so the bar keeps 5 tabs with Diet? Or a "More" tab?
  Recommended: gear.
- **B2. Where food data is synced:** its own `food.json` file in the private repo, or inside the main log file?
  Recommended: its own file. Food is logged many times a day; the workout log should not get sync conflicts from
  every banana.
- **B3. Limit Open Food Facts name search to UK products?** Recommended: yes. It gives fewer wrong-country results.
  Not tested yet.
- **B4. A small body map on every exercise card,** or only in the opened layer? Recommended: on every card. It is
  the "see your body" idea, and it costs no taps.
- **B5. When a day has no free place, add is not offered** (the day already has 3 pairs, 1 on its own and 2 abs).
  Is that fine, or should a day be able to grow? Recommended: fine. Growing the day breaks the week set rules and
  makes the day longer than 90 minutes.
- **B6. Protein ring on the left (first), calories on the right?** Recommended: yes. Protein is the number the plan
  asks Rosario to hit every day.

## Checked and not checked

✅ Checked:
- Every screen and layer in the table above, at 375 x 812, light and dark. The screenshots were taken with headless
  Edge, because the app's browser pane could not take screenshots while hidden.
- No sideways scroll on any tab, sheet or the scanner.
- Every tap target is at least 44 px. The one exception is the Animations switch (34 px tall), copied unchanged from
  the app.
- No `innerHTML` and no style attributes.
- No console errors.
- Real Open Food Facts lookups: Nutella (3017620422003) found and checked, "add up" passed. The made-up unknown code
  gave "not found". A code with no numbers showed the "Missing" warning. One name search ("skyr") gave 8 results.
  All lookups stayed well under the limits: about 25 requests over the whole session, never more than about 6 in
  one minute.
- The weekly volume numbers match research 5.3.

⚠️ Not checked:
- A real camera and barcode decoder (later build step).
- An iPhone or Safari. Everything ran in Chromium-based browsers on Windows.
- VoiceOver.
- Motion on, frame by frame (the screenshots all have motion off).
- Widths under 375 px.
- Sync of the new lists. There is no sync in this prototype.

## Follow-ups noticed (not fixed)

- `openAddMenu` in `js/diet.js` is not used any more (the 4 big "ways" replaced it). It is harmless.
- The app's Settings switch is 34 px tall. A taller hit area would meet the 44 px rule.
