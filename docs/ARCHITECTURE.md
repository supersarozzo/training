# Training app: architecture and build steps

Date: 2026-11-16. Written by the task chat "training-app-design" (Opus, high effort).
What the app does: [PRD.md](PRD.md). How it looks: [DESIGN.md](DESIGN.md). Screens and rules: [WORKFLOW.md](WORKFLOW.md) and [plan v2](plan/2026-11-16-training-plan-v2.md). Limits of iPhone web apps: [research](research/2026-11-16-watch-sync-offline.md).

Plain words used here:
- **Static web app**: plain files (HTML, CSS, JavaScript) that a free host just hands out. No server program of our own.
- **Service worker**: a small helper file the browser keeps; it stores the app files on the phone so the app opens with no internet.
- **localStorage**: a small storage box inside the browser, one per website. The app keeps its data there.
- **API**: the "door" GitHub opens for programs. The app uses it to read and write one file.
- **sha**: GitHub's fingerprint of one version of a file. Writing needs the fingerprint of the version you are replacing, so nobody overwrites a newer version by mistake.
- **Merge**: put two copies of the log together, keeping every record from both.
- **Tombstone**: a deleted record that is kept with a "deleted" mark, so the delete reaches the other copy.

---

## 1. Stack: plain HTML, CSS and JavaScript, no framework, no build

**Choice:** hand-written HTML, CSS and modern JavaScript (ES modules, which every current iPhone runs). No framework (React, Vue, Svelte), no build tool (Vite, webpack), no npm packages, no third-party scripts, no paid service.

**Why:**
- **No build server.** GitHub Pages hands out the files exactly as they are. What is in the folder is what runs on the phone. Nothing to install, nothing to break.
- **Safety of the token.** The token sits in the browser. Any script on the page could read it. With zero third-party code, the only code that runs is ours, in our repo (research, section 2).
- **Size of the job.** About 15 screens and a few rules. A framework saves little at this size and adds updates, tooling and new failure points.
- **Easy for the next worker.** Plain modules can be read, changed and tested one at a time.
- **Offline is simple.** The service worker caches a fixed list of about 30 files.

**What we give up:** a framework would make screen updates a bit shorter to write. We cover that with one tiny helper, `h()`, that builds page elements (section 3), and a simple "redraw this screen" rule.

**Tools already on Rosario's computer (nothing to install):** Python 3.14 (local web server) and Node.js 24 (runs the unit tests with its built-in test runner).

## 2. Where things live (boundaries)

```
 PUBLIC repo "training"
  app/  code + plan (no data)
  docs/ plan, design (no body data)
      |
      | GitHub Pages serves app/
      v
 iPhone home-screen app
  localStorage:
   data   = the log + profile
   device = token, sync state
   prev   = copy before last merge
      |            |
      | sync       | backup file
      v            v
 PRIVATE repo     Files app /
 "training-data"  iCloud Drive
  progress.json   (Rosario's)

 Apple Watch: own Strength workout
 Shortcuts: optional "Log to Health"
```

| Kind of data | On the phone | Private repo (`progress.json`) | Public repo |
|---|---|---|---|
| App code, plan v2 (exercises, sets, reps, rules, form tips) | cached by the service worker | no | **yes** |
| Formulas (calories, protein, walk start) | in the code | no | **yes** (formulas only) |
| Profile: intake answers, body facts | yes | yes | **never** |
| Targets: calorie, protein, walk start numbers | yes | yes | **never** |
| Workouts, sets, walk results, notes | yes | yes | **never** |
| Weigh-ins and measurements | yes | yes | **never** |
| Machine notes and starting weights | yes | yes | **never** |
| GitHub token | yes (device box only) | **never** | **never** |
| Progress photos | no (Photos app only) | no | no |

### How personal numbers reach the phone (decided)

**Typed in on the phone at first start, or restored from the private repo or a backup file. Never from the public repo.**

- First start shows two choices: **Start fresh** or **Restore**.
- **Start fresh** runs the intake (questions 20 to 38, about 5 minutes, with the plan's defaults filled in). The app computes the targets with the public formulas, then shows them for Rosario to confirm or change. Rosario can type the numbers from the private plan if they differ.
- **Restore** reads `progress.json` from the private repo (needs the token) or a backup file. The profile comes with it. Nothing to retype on a new or reset phone.
- **The starter file route (Rosario's choice 47 a, 2026-11-16):** to avoid retyping the intake, `node tools/make-starter.mjs` reads the private intake answers (`private/intake-2026-11-16.json`) and writes `private/starter-backup.json` in the backup format (profile and settings answers only: no token, no sessions, no targets). Both files are git-ignored. Rosario moves the starter file to the phone by a private route (AirDrop, iCloud Drive or Files; never GitHub) and chooses **Restore from file** at first start. The app then computes the targets from the answers and shows them to confirm. The tool itself holds no data and is committed.
- Why not a file in the public repo: it would publish body data. Why not "always from the private repo": Rosario has no GitHub account yet, and the app must work before sync is set up.

## 3. File layout

The app lives in `app/`. Only `app/` is published (see "Publishing" below). Tests live outside it.

```
app/
  index.html             one page; loads js/main.js
  manifest.webmanifest   name, icons, colors, start_url
  sw.js                  service worker (cache list, version)
  icons/                 180, 192, 512 px PNG, maskable 512
  media/                 exercise and machine photos (two per move, 850 px, public domain), see docs/MEDIA.md
  css/app.css            tokens from DESIGN.md + components
  js/
    boot.js              runs first (plain script): puts the Look theme and Animations setting on <html> before paint
    main.js              start-up, router (#/today, #/progress, #/plan, #/gym, #/settings ...)
    prefs.js             reads and saves theme / motion_off in the device box (pure, tested)
    dayplan.js           Today's blocks and minutes, walk minutes from walkSuggestion() (pure, tested)
    version.js           APP_VERSION (same as in sw.js)
    updater.js           the page side of updates: update checks, the waiting worker, Check for update (pure, tested; 0.7.3)
    h.js                 h(tag, props, ...children) helper
    store.js             load/save, schema, migrations
    validate.js          checks a data document (backup, synced file) before use
    ids.js               new ids, now() in UTC
    model.js             create/update/delete records
    plan/plan-v2.js      the plan as data (no body data)
    plan/cues.js         form tips, warm-up moves
    plan/machine-ids.js  the one frozen list of machine ids (gym_spots notes use them)
    plan/media.js        which photos, machine, area, usual sign, tip and video belong to each exercise (public data)
    engine/schedule.js   week, day, short day, swap, gaps
    engine/workout.js    pair order, resume position, suggestions, walk suggestion
    engine/planedits.js  saved Plan edits (plan_days): slot rules, week rule per slot, edited day, swap choices
    engine/planpage.js   Plan day page logic: which day and week opens, real sets, pair headers in words,
                         muscle counts ("Day so far", map steps), Gym exercise groups (build step 2)
    active.js            the running workout screen and timer end times (device box)
    clock.js             now() and today(); ?date= test override on localhost only
    engine/progression.js  next weight and reps
    engine/week1.js      "find your weight" steps
    engine/walk.js       walk start and walk progress
    engine/nutrition.js  calories, protein, safety limits
    engine/trend.js      7-day trend, weekly summary
    sync/github.js       GET and PUT calls only
    sync/merge.js        pure merge of two documents
    sync/docsync.js      the one sync flow for any synced file (one sync at a time, retries); used by sync.js and foodsync.js
    sync/sync.js         progress.json: its messages, connection, key handling; createSyncer = docsync with the progress kind
    sync/foodsync.js     food.json: same repo and key, its own sync state (food_last_*) and phone box (build step 6)
    sync/both.js         the page's syncer: progress.json, then food.json; same shape as one syncer
    sync/fake-github.js  in-browser fake (localhost only; tests/fake-github.mjs re-exports it)
    syncer.js            the page's one syncer (both files; picks the fakes with ?fake-github=1 on localhost)
    food/foodvalidate.js checks a food document (phone box or food.json) before use
    food/foodmerge.js    pure merge of two food documents (same pick as merge.js)
    food/foodstore.js    the food box trn.food.v1 (+ trn.foodprev.v1), apart from the workout box
    food/foodmodel.js    create / change / delete food records; saves at once
    food/foodmath.js     pure: numbers for a portion, totals, meals, recent foods, 7-day average, the check step's warnings
    food/barcode.js      pure: check digit, clean barcode, fb-<barcode> ids
    food/off.js          Open Food Facts lookup and UK search (only the barcode or the word is sent)
    food/scanner.js      the camera scanner around zxing-wasm (loaded only when it opens)
    diet/                the Diet tab screens (build step 7): diet.js, sheets.js, scan.js, foodapp.js (the page's food model)
    vendor/zxing-wasm/   the zxing-wasm 3.1.7 reader build, byte for byte, with its licences (CHANGES.md says what and why)
    autosync.js          when sync runs by itself (open, front, signal back; never in a workout)
    backup.js            make the backup file (data only, never the key), download it
    (restore itself is model.restore: check, then merge)
    timer.js             timers based on end time
    wakelock.js          keep the screen on
    sound.js             beep (Web Audio)
    shortcuts.js         "Log to Health" link
    ui/                  one file per screen + parts (workout.js picks the workout screen; flow.js shares its helpers)
                         redesign helpers: icons.js (inline SVG icons), media.js (photo flip, thumbs), drawings.js
                         (line drawings for warm-up moves without photos), exinfo.js (exercise sheet, video link),
                         machines.js (Gym tab: Machines | Exercises switch, machine card, where-notes), motion.js, theme.js,
                         stats.js (last time, bests). Build step 2: planday.js (Plan day page, 12 weeks sheet),
                         exlayer.js (opened exercise with 2 maps), bodymap.js (body-muscles drawing, legend, small map),
                         gymexercises.js (Gym › Exercises by main muscle). plansheet.js and print are gone
tests/
  *.test.mjs             node --test (pure modules)
  fake-github.mjs        fake GitHub contents API
  fixtures/              made-up profiles and logs
.github/workflows/pages.yml   publishes app/ to Pages
```

**Rules for the code:**
- Pure modules (`engine/*`, `sync/merge.js`, `ids.js`, `nutrition`) never touch the page, storage or network. They take data and return data. They get unit tests.
- Screens never write storage directly. They call `model.js`, which stamps `updated_at` and saves at once.
- **Never put data into `innerHTML`.** Build elements with `h()` and set text with `textContent`. The synced file is untrusted data: a note could contain HTML or script.
- One Content Security Policy line in `index.html`: scripts and styles only from our own site, network only to our site, `https://api.github.com` and (since 0.7.0, the Diet tab) `https://world.openfoodfacts.org`, no inline scripts. WebAssembly is allowed for the barcode reader (`'wasm-unsafe-eval'` allows WebAssembly only, never JavaScript `eval`): `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data:; connect-src 'self' https://api.github.com https://world.openfoodfacts.org; object-src 'none'; base-uri 'none'; form-action 'none'`. `tests/barcode.test.mjs` B14 checks the whole line.
- Test values in tests and fixtures are made up. Never Rosario's numbers.

**Publishing:** GitHub Pages can only publish the repo root or a `docs/` folder from a branch, and `docs/` is taken by the project docs. So a small official workflow (`actions/upload-pages-artifact` + `actions/deploy-pages`, free for public repos) publishes only `app/`. No build happens in it; it copies the folder. The site address will be `https://<account>.github.io/training/`. All paths in the app are relative, so this address works.

## 4. Data model

One JSON document holds everything that syncs. It has the same shape on the phone (`localStorage` key `trn.data.v1`) and in the private repo (`progress.json`).

### 4.1 Common rules for every record

- `id`: text, unique, made on the device. Format `<kind>-<yyyymmdd>-<6 random letters/digits>` from `crypto.getRandomValues`, for example `s-20261117-k3f9qz`. Exceptions: weigh-ins use `w-<yyyy-mm-dd>` (one per day, so two devices merge into one); exercise state uses `x-<exercise id>`.
- `updated_at`: UTC time with milliseconds, `2026-11-17T18:42:07.311Z`, set by `model.js` on every change.
- `deleted`: `true` on a tombstone, plus `deleted_at`. Records are never removed from the arrays. Screens hide tombstones.
- Unknown fields are kept as they are (a newer app version may add some).

### 4.2 The `progress.json` shape

```json
{
  "format": 1,
  "app": "training",
  "profile": {
    "updated_at": "…",
    "intake": { "q20_parq_all_no": true, "q21_age": 0, "q22_sex": "…",
                "q23_height_cm": 0, "q24_weight_kg": 0, "q25_unit": "kg",
                "q26_goal": "…", "q27_goal_weight_kg": null,
                "q28_waist_cm": null, "q29_focus": "balanced",
                "q30_activity": "…", "q31_sleep_h": 0, "q32_food": "…",
                "q33_diet": "…", "q34_scale": true, "q35_walk": "before",
                "q36_walk_fit": "…", "q37_avoid": [], "q38_photos": true },
    "targets": { "kcal": 0, "protein_g": 0, "goal": "…",
                 "source": "computed | manual",
                 "walk_start": { "speed_kmh": 0, "slope_pct": 0 } }
  },
  "shared_settings": {
    "updated_at": "…",
    "body_unit": "kg | st",
    "dumbbell_steps_kg": [],
    "stack_step_kg": { "default": 0 },
    "extra_machines": { "lat_pulldown": null, "seated_row": null,
                        "leg_curl": null, "pec_deck": null,
                        "calf_raise": null },
    "shortcut": { "on": false, "name": "Log Training" }
  },
  "block": { "updated_at": "…", "plan_id": "plan-v2",
             "number": 1, "start_monday": "2026-11-23" },
  "sessions": [ {
    "id": "s-…", "updated_at": "…",
    "date": "2026-11-23", "plan_day": "mon", "week": 1,   // 0 = a practice day before the block (0.7.1, D11)
    "kind": "full | short", "swapped_from": null,
    "status": "in_progress | finished | abandoned",
    "started_at": "…", "finished_at": "…",
    "walk": { "speed_kmh": 0, "slope_pct": 0, "minutes": 30,
              "effort": 0, "distance_km": null, "avg_hr": null },
    "planned_walk": { "speed_kmh": 0, "slope_pct": 0, "minutes": 0 },   // 0.7.4, optional: the day's Plan walk at the start
    "exercises": [ {
      "slot": "A1", "plan_exercise": "chest_press",
      "done_exercise": "chest_press", "swap_reason": null,
      "sets": [ { "n": 1, "type": "warmup | work",
                  "weight_kg": 0, "reps": 0, "seconds": null,
                  "rir": null, "done_at": "…" } ],
      "note": "" } ],
    "effort": null, "note": "" } ],
  "weighins": [ { "id": "w-2026-11-23", "updated_at": "…",
                  "date": "2026-11-23", "kg": 0 } ],
  "measurements": [ { "id": "m-…", "updated_at": "…", "date": "…",
                      "waist_cm": 0, "chest_cm": 0, "arm_cm": 0,
                      "thigh_cm": 0 } ],
  "exercise_state": [ { "id": "x-chest_press", "updated_at": "…",
                        "start_weight_kg": 0, "machine_note": "",
                        "fail_streak": 0,
                        "my_range": [8, 12], "my_weight_kg": 0,
                        "my_weight_at": "yyyy-mm-dd",
                        "my_weight_time": "…" } ],
  "gym_spots": [ { "id": "g-leg_press", "updated_at": "…",
                   "machine": "leg_press", "where": "…" } ]
}
```

**`exercise_state` Plan fields** (0.6.0, 0.7.1): `my_range`, `my_weight_kg`, `my_weight_at` (a date) and, since 0.7.1, `my_weight_time` (the full time it was set, or null). The workout uses the Plan weight until a workout newer than it exists (`engine/workout.js planWeightNewer`): with a time, newer = finished after that time; the time counts only when it falls on `my_weight_at` (an older app changes the weight and the date but keeps the old time, and then the date rule of 0.6.0 decides). Optional: old files without it validate unchanged; older apps keep the field (unknown fields are kept).

**The muscle check counts a set once per row** (0.7.1, `planview.js rowSets`): 1 when one of the exercise's main muscles is in the row, else 0.5 when one of its helpers is. So the rows can have two main muscles (lats and mid back, trainer T5) without counting their sets twice in "Back". The map and "Day so far" still count per muscle.

**`gym_spots`** (added 2026-11-17, app 0.4.0, same format 1): the "Where it is in my gym" note, one record per machine or station. `id` is `g-<machine>` (`ids.js gymSpotId`); `machine` is an id from the ONE frozen list in `plan/machine-ids.js` (15 ids, the last five equal the `extra_machines` keys); `where` is optional text up to `MAX_TEXT`; a tombstone has `deleted` / `deleted_at`; unknown fields are kept. `model.setGymSpot(machineId, where)` refuses an id that is not in the list or not `^[a-z0-9_]{1,50}$`, trims and clips the text, keeps the old record's unknown fields and clears a tombstone. The list is optional: a file without it validates and comes back unchanged (`OPTIONAL_LISTS` in `validate.js`); the first saved note adds it. It is merged like every list, counted by `hasData`, and backed up and synced with no other change. Not the same as `exercise_state.machine_note` (seat and pin settings of one exercise). A machine id must never be renamed once a note exists (tests/gym-spots.test.mjs test 17).

**`plan_days`** (added 2026-11-18, build step 3, same format 1): saved Plan edits, "forever" for that day of the plan (answer 65). One record per edited day holds the whole day: `{ id: "p-plan-v2-<day>", updated_at, plan_id: "plan-v2", day, slots: [{ slot, ex, sets, rest }], changes?: [{ at, what, slot, from, to }] }`; `sets` are the base sets, the week rule is applied when read. The fixed id means two phones make the same record, so it merges as one unit (later `updated_at` wins). "Back to the plan's day" is a tombstone that keeps the fields; the day then falls back to `plan/plan-v2.js`, which is never edited. Rules live in `engine/planedits.js`: slot names `A1`-`C2`, `Abs1`, `Abs2`, `D`, and `E1`, `E2` for added exercises (at the end, on their own, 3 sets, 60 s rest, at most 2 a day, answer 72 a; E follows the D week rule and is skipped on the short day); every exercise from the catalogue, never twice in a day; sets 1 to 5; rest null or 30/45/60/75/90/120. `validate.js` checks only the record itself (optional list like `gym_spots`): a record this app cannot use (for example from a newer app) is kept and synced, never dropped, but not used: the day shows the plan and the engine says `newerVersion: true`. The engine reads an edit through an optional last argument: `daySlots(day, week, edit)`, `shortDaySlots(day, week, edit)`, `planForDay(day, week, kind, edit)` (`edit` = the day's record, `planedits.findPlanDay(doc, day)`); without it they behave exactly as before. Model calls: `effectivePlanDay`, `swapPlanSlot`, `removePlanSlot`, `addPlanSlot`, `savePlanDay` (Undo), `resetPlanDay`; they refuse a duplicate, a third added exercise and edits over a newer app's record. Past and running workouts never change: `startSession` stores `planned_sets` and `planned_rest` on each exercise record, and `schedule.planForSession(session)` rebuilds a started workout from the workout itself (older workouts without them read their place in the plan; a place the plan no longer has, like `Abs2`, never throws).

**The day's own walk** (0.7.4, worker 8.41, iPhone P5 part 2; same format 1): a `plan_days` record may carry `walk: { speed_kmh, slope_pct, minutes }`, set in Plan > Edit. It is fixed for that day in every week (the walk rule no longer moves it) until "Back to the plan's walk" (`model.resetPlanWalk`, removes only the walk) or "Back to the plan's day" (tombstone). Limits in `engine/planedits.js WALK_LIMITS` / `walkLimits(day)`, from the walk engine and the trainer: speed 2.0 to 5.0 km/h in 0.1 steps (D6 floor, D3 top), slope 0 to 12 % (leg days 10 %) in 1 % steps (D3), minutes 10 to 30 in 1-minute steps (D2: never longer than 30). `checkWalk` is part of `checkPlanDay`: a record whose walk this app cannot use (for example a newer app with other limits) is kept and synced but not used (`newerVersion`), and no edit here changes it. `validate.js` checks only the record itself, as before, so a file is never refused for such a walk. A missing or `null` walk is "no walk edit" (every record before 0.7.4 reads as before). Writes: only model calls (`setPlanWalk`, `resetPlanWalk`, `savePlanDay(day, slots, change, walk)` for Undo, where a left-out walk keeps the saved one, plus the slot calls, which keep it). Only a live record's walk is carried into a new write, never a tombstone's. A day whose slots are the plan's but has a walk stays a record; it becomes a tombstone only when both are the plan's. Reading: `effectiveDay(...).walk`; `dayplan.js dayLayout` passes it to `walkSuggestion(doc, { ..., edit })`, which returns those numbers with `edited: true` (trainer D16: short day at most 15 minutes; back from 2 to 4 weeks, the slope 2 % lower, never below 0; back from more than 4 weeks, each of speed, slope and minutes the lower of the edit and the starting settings; the note carries `OWN_WALK_LINE`, "Your own walk. The walk rule does not change this day."). The walk sheet starts from `dayplan.planWalkForEdit` (the walk rule without the break lowering and the short day). A tombstone of a day this app can use never holds `walk` (0.7.3 copies the old record when it edits a day, so a walk left in a tombstone would come back); a newer app's walk is kept. Today and the Plan both read `dayLayout`, so they match. **A running workout keeps its walk:** `startSession` stores the day's walk as `planned_walk` on the session (only when the day has one); `flow.js buildCtx` and `dayplan.js sessionWalk` read it through `planedits.plannedWalk(session)` (loose limits, like the file check: speed 0 to 20, slope 0 to 30, minutes 1 to 300). `validate.js` checks `planned_walk` with those loose limits when it is there. **Older apps** (0.7.3, frozen copies in `tests/fixtures/app-0.7.3/`, test V18): they accept the file, keep `walk` when they edit the day (they spread the old record) and keep `planned_walk` on a session; they ignore both, so on a 0.7.3 phone the day shows the plan's walk and a walk-only day shows "Changed by you" with no line (known limit, DECISIONS 2026-11-18).

All `0` and `"…"` above are placeholders, not real values. Body weight is always stored in kg; stones and pounds are only for display.

### 4.2b The `food.json` shape (build step 6, app 0.7.0, answer 78 a)

Food lives in its **own document**: on the phone in its own box `trn.food.v1` (safety copy `trn.foodprev.v1`), in the private repo in its own file `food.json`. Never inside `progress.json` (research 9.4: food would fill the 800 KB warning in months), and a food problem never touches the workout log.

```json
{
  "format": 1,
  "app": "training-food",
  "foods": [ {
    "id": "fb-5000000000012", "updated_at": "…",
    "name": "…", "brand": "…", "barcode": "5000000000012",
    "per100g": { "kcal": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0 },
    "serving_g": 0, "serving_label": "…", "last_amount_g": 0,
    "fav": false, "source": "off | own", "off_fetched_at": "…", "edited": false } ],
  "food_log": [ {
    "id": "f-20261118-k3f9qz", "updated_at": "…",
    "date": "2026-11-18", "meal": "breakfast | lunch | dinner | snack | null",
    "food": "fb-… | fo-… | null", "name": "…",
    "amount_g": 0, "servings": null,
    "kcal": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0,
    "per100g": { "kcal": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0 },
    "source": "off | own | quick" } ]
}
```

- **Ids:** a barcode food is `fb-<barcode>` (the barcode passes its check digit; UPC-A is kept in its 13-digit form), so a scan on two phones makes ONE record; an own food is `fo-<yyyymmdd>-<6>`; an entry is `f-<yyyymmdd>-<6>`.
- **Numbers are worked out once** when a food is logged and stored in the entry (kcal whole, grams to 0.1), with a copy of the numbers per 100 g so the portion can be changed later. A later fix of a saved food never changes a day already logged. A quick add has no amount and no numbers per 100 g; its carbs and fat may be `null`.
- **No counters** ("used 12 times"): two phones would lose one. "Log again" and "had today" come from `food_log`.
- **Checks** (`food/foodvalidate.js`): text up to 200 letters (the model cuts names to 120), kcal per 100 g 0 to 900, each macro per 100 g 0 to 100, an entry's kcal 0 to 20000 and each macro 0 to 2000 g (the model refuses a portion that would go over, in words, so the phone never holds an entry that would stop the food sync), barcode 8 to 14 digits, dates and meals from fixed lists. A tombstone needs only `id` and `updated_at`. Unknown fields are kept; `token` and `device` are dropped; a newer `format` says "Update the app first".
- **Model** (`food/foodmodel.js`): `saveFood`, `saveAndLog` (the check step's one button: save the food and log the portion in one save), `logAgain` (last portion, else the serving, else 100 g), `quickAdd`, `updateEntry`, `removeEntry` / `undoRemove` (tombstone; undo is a newer edit), `copyDay` / `undoCopy`, `removeFood`, `setFav`. Each loads, changes and saves at once, like a set.

### 4.3 Device-only data (never synced, never in a backup)

`localStorage` key `trn.device.v1`:
- `token`, `owner`, `repo` (default `training-data`), `branch` (default `main`), `path` (default `progress.json`).
- `token_expires` (date, typed by Rosario or read from GitHub if possible), `device_id`.
- `last_sha`, `last_sync_at`, `last_sync_result` (`ok`, `offline`, `auth`, `conflict`, `broken_remote`, `too_new`, `error`).
- `sound_on`, `active` (the running workout: session id, screen, timer end time), `last_backup_at`.
- `theme` (`auto` / `light` / `dark`) and `motion_off` (true when Settings > Look > Animations is off), added 2026-11-17 (`prefs.js`). Read by `boot.js` before the first paint.
- `food_amount_mode` (0.7.4, `food/foodmodes.js`): `{ <food id>: "grams" | "pieces" }`, the mode the food sheet used last for each food, at most 300 foods (the oldest go first). Phone-only on purpose: no synced field, so no file format, merge or older app is touched. Written as a new copy of the whole box (the token and the other keys stay).

`localStorage` key `trn.prev.v1`: a full copy of the data from just before the last merge or restore (one-step safety net).

### 4.4 Plan data (public, in the code)

`plan/plan-v2.js` exports plain objects, no body data:
- `exercises`: id, name, equipment, kind (`reps` or `hold`), rep range (or seconds range), per side or not, step type (`dumbbell`, `stack`, `smith_2x2.5`, `bodyweight`), swaps (ids, with `needs_machine` for the Q17 machines), cue id.
- `days`: mon to fri, each a list of slots (`A1`, `A2`, …, `Abs1`, `D`) with exercise id, sets, rest after, and RIR rule (Wednesday RIR 3).
- `weeks`: 1 to 12 with phase name, set changes (week 1: 2 sets; weeks 6 and 12: one set less; weeks 7 to 11: pair A gets a 4th set, and exercise D (the leg exercise done on its own, on both leg days: Tuesday's leg extension and Friday's calf raise) drops to 2 sets, as plan v2 section 4 says), RIR, progression on or off, walk progress on or off.
- `firstTryKg` (0.7.1, trainer D12): the first-try weight of each of the 35 weighted exercises; `engine/progression.js firstTryWeight` rounds it down to the gym (only the profile's sex answer is read, never a body number). `suggestFor` uses it last: Plan weight, then the logs, then the found weight, then this table (action `first_try`).
- Practice days (0.7.1, trainer D11): before `block.start_monday` `engine/schedule.js canTrain` lets Today start a workout; `sessionWeek` saves it with week 0 and `weekInfo` treats week 0 as week 1. Week 0 is never shown as a number (`PRACTICE_LABEL`). `validate.js` accepts week 0 from 0.7.1 on: **an older app (0.7.0 or before) rejects a file with a week-0 workout**, so a phone that syncs must have 0.7.1 first.
- `session_order`: `["walk", "changeover", "lift_warmup", "pairs", "abs"]` (Rosario's walk-first choice), and the short-day version.
- `walk_rules`, `warmup_moves`.

**Week number:** whole weeks since `block.start_monday`, plus 1 (it follows the calendar). A missed day or a long break does not pause the block; the missed-time rules (plan v2, section 11) lower the weights instead. Settings can move the block start (for example to repeat a week after an illness).

A unit test checks the plan data against plan v2's tables (sets per week, every swap exists, every cue exists).

## 5. Sync design (delicate)

Sync is **state-based**: the whole log is merged, not a list of actions. The phone's own data is the offline queue: if a sync fails, nothing is lost, and the next sync sends everything that is newer.

### 5.1 The calls (GitHub REST contents API)

- `GET https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branch}` with headers `Authorization: Bearer <token>`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`, and fetch option `cache: "no-store"` (GitHub's answers can be cached for 60 seconds; a cached old sha would cause endless conflicts).
- `PUT` the same address with JSON body `{ message, content, sha, branch }`. `content` is the document as UTF-8, base64-encoded. `sha` is left out only when the file does not exist yet.
- Decode with `TextDecoder` and encode with `TextEncoder` (plain `atob`/`btoa` break on letters like "é"). Strip line breaks from GitHub's base64.
- A file under 1 MB comes back in the normal answer. The app warns in Settings when the file passes 800 KB (years away); splitting by year is a later job.

### 5.2 One sync, step by step

```
 start (only if no sync is running)
   |
 GET file --404--> remote = empty doc
   |  401/403/net error -> stop, show state
   v
 parse + check shape
   |  broken -> stop, never PUT
   |  format too new -> stop
   v
 merged = merge(local now, remote)
 save prev copy; save merged locally
   |
 merged same as remote? -> done (ok)
   |
 PUT merged with sha
   |  409/422 -> back to GET (max 3)
   v
 store new sha, last_sync_at -> ok
```

Rules:
1. **One sync at a time.** A `running` flag; a second request while running sets `again = true`, and one more sync runs at the end.
2. **Never lose an edit made during a sync.** The page keeps working while the network call waits. So every time the app saves a merge result, it merges with the **current** local data again: `save(merge(load(), merged))`. Merge is safe to repeat.
3. **Mark synced only what was sent.** Remember the time the sync started. After a good PUT, `last_sync_at` = that start time. Records changed after it still count as "not synced".
4. **Never PUT when the remote file could not be read or checked.** A broken or unknown file is reported, not overwritten. GitHub keeps the history, so Rosario can fix it with help. **And never PUT a file the app could not read back:** the merged document must pass `validate.js` first, or the sync stops with "Some data on this phone does not pass the app's own check" (review F1, 2026-11-16).
5. **Retry on conflict** (409 or 422): GET again, merge again, PUT again, up to 3 times. Then stop with "conflict, try again".
6. **Network errors and 5xx:** stop quietly, show "Saved on phone, will sync later". The next trigger tries again.

### 5.3 Merge rules (`sync/merge.js`, pure)

- **Lists** (`sessions`, `weighins`, `measurements`, `exercise_state`, `gym_spots`, `plan_days`): join by `id`. A record on one side only is kept. On both sides: the later `updated_at` wins. Same time: the tombstone wins; still the same: the one whose JSON text sorts first (so both devices pick the same).
- **Single objects** (`profile`, `shared_settings`, `block`): the later `updated_at` wins, as a whole.
- **`format`:** if the remote `format` is higher than the app knows, stop ("Update the app first").
- **Properties the merge must have** (unit tests): nothing is ever dropped; merging twice gives the same result; `merge(a, b)` equals `merge(b, a)`; a tombstone is never brought back to life by an older copy.
- A session is merged as one unit (all its sets together). Two devices editing the same workout at the same moment is not expected for one person; the later edit wins.

### 5.4 When sync runs

Automatic sync (0.7.2, Rosario: "the sync is too complicated"; `autosync.js`). Every trigger runs the same full sync of 5.2 for both files (`sync/both.js`), with the one-sync-at-a-time and "again" rules; the merge rules do not change.
- **After every save of synced data** (a set, Finish, a weigh-in, a food entry, a Plan edit, a synced setting): a quiet time of 10 s (`QUIET_MS`); a new save starts it again, so a burst of changes is one sync. When it ends, the sync runs if GitHub is set up, no workout is running and something is not sent yet.
- **Going to the background** (`visibilitychange` to hidden, `pagehide`): the waiting sync runs at once, if something is not sent. Best effort: iOS may stop it; nothing is lost (the phone's data is the queue). Both events fire when the app closes: the second adds no round while the first sync runs, unless a save came in between (review M1).
- When the app **opens** or comes back to the front: at once when something is not sent; when nothing is to send, at most once every 5 minutes (to get news from another device). If a sync is still running (iOS paused it in the background), the front sync waits for it to end and then runs, so a paused round that fails can not swallow it (review, checker 2).
- When the phone gets signal back (`online` event), if something is not sent.
- After **Save** on the Finish screen (Rosario's choice 43 a), as before.
- **During a workout:** no automatic sync at all, also when the app is hidden: the per-set saves stay on the phone and Finish sends them (no network work while timers run).
- **Back-off after a failed sync** (Training Agent): `sync.js syncProblem` reads the saved workout result (`last_sync_result`; no new data, it holds after a restart). With any problem, the 10 s quiet time and the way out send nothing. **"retry"** (sync clash, rate limit, server error, no signal, phone full, update the app, phone data problems): the next open or front, signal back, or **Sync now** try again. **"wait"** (wrong key, no access, damaged GitHub file): nothing automatic, also not on open, until **Sync now** or a new key (saving a key clears the saved result). Only the workout result counts, like the status line: a food problem does not stop the workout sync (the food line in Settings and Diet shows it), and a damaged `progress.json` stops automatic food sync too. Food that is stuck (a damaged or too-new `food.json`, a key or access problem, phone food data that fails the check) does not count as "not sent" (`both.js FOOD_STUCK`, review round 2): no sync after every food save, no "will send automatically" for ever; the news check, Finish and Sync now still try it. The status line says the problem in words. Finish and "Save and test" are the person's own actions: Finish still syncs once with a problem, and "Save and test" (also with the key field empty) clears the saved result, so one automatic sync runs after the next save.
- **A record dated far ahead** (another phone's clock more than 10 minutes ahead) does not count as "not sent" (`docsync.js hasUnsynced`, upper limit in `hasChangesSince` and `foodChangesSince`): it is not this phone's change; counting it would say "Not sent yet" for ever and sync on every front (review M3). This phone's own changes carry its own time. A manual sync still merges and sends everything. Limits: if this phone's clock was ahead and is then set back, changes saved under the wrong time look sent until the next full sync; on localhost, `?date=` set to a later day stamps records ahead, so the quiet time does not send them (use "Sync now" when testing).
- **Loop guard:** the screens save through `withSaveSignal(store)` (`ui/app.js store`, `diet/foodapp.js foodStore`); the syncers save their merge results through the plain handles (`syncStore`, `foodSyncStore`), so a sync never starts the next one. Without it, a record dated ahead by another phone's clock would look "not sent" for ever and start a sync every 10 s. An edit made during a sync starts the quiet time by its own save.
- **Settings:** one status line ("Synced 12:25." / "Not sent yet, will send automatically." / the problem in words) and **Sync now** (the full sync at once). **Get from GitHub** (GET and merge into the phone, no PUT) and **Send to GitHub** (the full sync) stay under a "More" fold. Both merge; neither overwrites. Today uses the same words (`sync.js statusText`). The food line (Settings and Diet) uses the same words and order: "Food synced 12:25." / "Food: not sent yet, will send automatically." / the food problem (`foodsync.js foodStatusText`). After a sync ends, only the quiet screens redraw, and never while a text field is being typed in (`autosync.js redrawAfterSync`: a redraw would close the keyboard).
- Never while the app is closed: iPhone web apps cannot run code then (research, section 4). The PRD, Settings and the step page say so honestly.

### 5.4b Food sync: `food.json` (build step 6, delicate)

- **Same flow, one code path.** `sync/docsync.js` holds the flow of 5.2 for any file. `sync/sync.js` gives it the progress "kind" (messages, `validate.js`, `merge.js`, the workout box); `sync/foodsync.js` gives it the food kind (`foodvalidate.js`, `foodmerge.js`, the food box). So `food.json` has exactly the same rules: one sync at a time, edits during a sync kept, never PUT over a file it cannot read, never PUT what it could not read back, 409/422 retry up to 3 times, `cache: "no-store"`, last sync time = the start time.
- **Same repo, branch and key; file `food.json`.** Its sync state has its own names in the device box: `food_last_sha`, `food_last_sync_at`, `food_last_sync_result`, `food_last_sync_attempt_at`. "Forget GitHub key" and a new connection clear them too.
- **Both files in turn** (`sync/both.js`): every sync (automatic (5.4), Finish, the Settings buttons) runs progress.json first, then food.json. The result is the workout result (the status lines on Today and in Settings stay about the workout log) with the food result in `food`. Only "not sent yet" also counts new food, so unsent food is never hidden; a damaged food box counts as "nothing new" there, so it never stops Today or Settings from drawing. A failed round is not run again (same as 5.2). A damaged `food.json` never stops or changes the workout sync, and a damaged `progress.json` never stops the food sync. When the problem is the connection itself (no signal, wrong key, no access, rate limit, not set up), the food call is skipped. The Diet tab shows the food line ("Food synced …" or the food problem in words).
- **Merge:** `food/foodmerge.js` uses the same `pick` as `merge.js` (later `updated_at`, then the tombstone, then the JSON text), lists by id, sorted.
- **Not before there is food:** a phone with no food never creates `food.json`.
- **Tests:** `tests/food-sync.test.mjs` (27 tests against the pretend GitHub, with one pretend repo holding both files) and `tests/food-data.test.mjs`. In the browser, `?fake-github=1` on localhost gives the food file its own pretend GitHub (`trn.fake.food.v1`).

### 5.4c Open Food Facts and the barcode reader (build steps 7 and 8, delicate)

- **Open Food Facts** (`food/off.js`): `GET https://world.openfoodfacts.org/api/v3/product/<barcode>?fields=…&app_name=TrainingApp&app_version=<version>` and the UK-only name search `GET /cgi/search.pl?search_terms=<word>&…&tagtype_0=countries&tag_contains_0=contains&tag_0=en:united-kingdom` (checked on 2026-11-18: 5 of 5 results for "skyr" were UK products). Only the barcode or the word is sent; `credentials: "omit"`, `referrerPolicy: "no-referrer"`, no headers (no pre-flight, no key). 20 s limit (a lookup: "Open Food Facts did not answer"; a name search that gets an answer it cannot use, or none in 20 s: "Online search is not working right now. Try again later, or make a new food.", 0.7.6; no signal keeps the no-signal words, and the limit and the 2-letter minimum keep their own words). The newer search address `search.openfoodfacts.org` is not used and not in the CSP: it sends no CORS header, so a browser can not read its answers (checked with curl and headless Chrome on 2026-11-18); at most 10 lookups and 8 searches a minute (their limits: 15 and 10). The check digit is tested before any lookup. Their text is cleaned (control and direction letters out) and cut to 120 letters, every number is range-checked (a bad one becomes empty and the check step asks for it; kJ becomes kcal when kcal is missing), and only our fields are kept. The page shows their text with `h()` / text nodes only. Every sheet with their data shows the ODbL credit line.
- **Barcode reader:** zxing-wasm 3.1.7, reader build, copied byte for byte into `app/vendor/zxing-wasm/` (npm integrity and the `.wasm` SHA-256 checked by a test), with its MIT licence, the Apache licences of zxing-cpp and NOTICE. `food/scanner.js` loads it only when the scanner opens and calls `prepareZXingModule` with `locateFile` pointed at our own `.wasm` (the library's default is jsDelivr; the CSP would block it too). It reads EAN-13, EAN-8 and UPC-A, one code at a time, from the middle band of the video. The video plays inline and muted. A good code stops every camera track before it is passed on; a misread keeps the camera open. The scanner is an overlay on the Diet route (the hash never changes while the camera runs), and the camera is also stopped on Close, on a route change (`main.js` stops it first in `render()`), on `pagehide` and when the app goes to the back. A test reads a drawn EAN-13 with the real copied files in Node.

### 5.5 Token on the phone (delicate)

- **Kind:** fine-grained personal access token, only the repo `training-data`, only "Contents: Read and write", expires after 1 year (Rosario's choice 42 b).
- **Entry:** pasted once in Settings > Sync. The field is a password field. A **Test connection** button calls `GET /repos/{owner}/{repo}` and reports "OK", "token wrong or expired" (401), or "repo not found or no access" (403/404).
- **Storage:** only in `trn.device.v1`. Never in `progress.json`, never in a backup file, never in a URL, never in a log line or error message, never sent anywhere except `api.github.com` in the `Authorization` header.
- **Risks:** any script running on the page could read it, and anyone with the unlocked phone could use it. **Limits on the damage:** no third-party scripts and a strict CSP; the token reaches one private repo with training data only; GitHub keeps the file history, so a bad write can be undone; Rosario can revoke the token on github.com at any time.
- **Expiry:** Settings shows the expiry date. From 14 days before, the Today screen shows a quiet "GitHub key ends on …" line. A 401 shows "GitHub key expired or wrong. Make a new one" with the steps from the runbook.
- **Remove:** "Forget GitHub key" in Settings deletes it from the phone.

## 6. Storage on the phone

- **localStorage**, not IndexedDB. The log is small (one 12-week block is about 200 to 300 KB; the box holds about 5 MB). A localStorage write finishes before the next line of code runs, so a set is safe the moment Done is tapped. Move to IndexedDB only if the data passes about 2 MB (a later decision).
- **Save on every change** (`model.js`), not on a timer.
- **Quota error** (box full): show "Phone storage full. Download a backup, then tell the Training chat." Never drop data to make room. Done by `errors.js`: any storage error that no screen caught shows a "Not saved" sheet (review F2).
- **Text limit:** notes are cut to `MAX_TEXT` (2000 letters, from `validate.js`) when saved, so the phone never holds what the validator refuses (review F1).
- **Install to the home screen is required** (research: Safari tabs can lose data after 7 days without use; home-screen apps have their own counter). The app shows an install hint when it is opened in a normal Safari tab.
- **Schema changes:** `store.js` has a `migrations` list keyed by `format`. Data is never rewritten without a `prev` copy first. **When format 2 is made:** `validateDocument` must run the same migrations on an older backup or GitHub file; today it only relabels the format (review F8).

## 7. Service worker and updates

- `sw.js` keeps a cache named `training-<APP_VERSION>` with a fixed list of every app file. **Cache first** for app files, and **only from this version's own cache** (never a search across all caches); **network only, never cached** for `api.github.com`.
- On a new version: the new service worker installs and waits. The app shows **"New version ready · Update"**, but only on the main tab screens, never during a workout. Tapping Update tells the worker to take over, then reloads. If the app is closed instead, the browser makes the new worker active by itself and the next open runs the new version (normal service-worker behaviour, no tap needed). Old caches are deleted once the new one is complete.
- **Update rules since 0.7.3** (the iPhone never showed the bar and kept old files; check record [checks/2026-11-18-v073-update.md](checks/2026-11-18-v073-update.md)):
  1. **Install fetches every file fresh:** a new address per version (`?v=<APP_VERSION>`) and `cache: "reload"`, so a copy in the phone's HTTP cache (GitHub Pages sends `max-age=600`) or on GitHub's CDN from before the push can never fill the new cache. Before 0.7.3 `cache.addAll` could fill a "new" cache with old files. `js/version.js` is fetched first and must say `APP_VERSION`, else the install stops.
  2. **Never a half-filled cache:** each file gets 3 tries (0.5 s, then 1 s apart), at most 6 at a time; a 404, a 500 or a redirect is a failure. One file that still fails fails the install: the new cache is deleted (only if this install made it), the old version keeps working, and the next update check tries again. After every file, the install writes a **completion mark** (`sw-cache-complete`) last; if the new cache vanished during the install (the activate of a 0.7.2-or-older worker deletes every other app cache), the install fails.
  3. **Own cache only; old caches go from activate or the first fetch:** Safari (WebKit) stores a worker on disk when its install ends and, after its background process restarts, loads it back as the *active* worker without running `activate`. So the old cache could stay, and the old fetch code (`caches.match` over all caches, oldest first) served the old files with no bar shown. Now `activate` and the first fetch of the active worker both delete *older* `training-*` caches (one cleanup at a time), and only when this version's cache holds its completion mark. Offline, a file missing from the own cache comes from the newest older app cache, if one is left (better than no app). A newer version's cache (it may be installing) and other caches are never touched.
  4. **The page (`js/updater.js`, drawn by `ui/update.js`):** registers with `updateViaCache: "none"`; asks for an update at start, and on coming to the front and on `pageshow` at most every 15 minutes (a failing install would otherwise download again at every unlock); follows a worker that was already installing when the page registered; shows the bar whenever a worker waits (with a controller) and hides it when that worker took over by itself (a tap on a bar still drawn then reloads); redraws only where `mayRedraw` allows (the sync's rule `redrawAfterSync` plus no open sheet: never a workout, the Plan, a sheet, the scanner or typing) and keeps the scroll position. It never reloads unless the user tapped Update.
  5. **The Settings version card (first card; Rosario's wish via the Training Agent):** "Version X" and an **Update** button, off while a workout runs. The tap reads the live `js/version.js` with `cache: "no-store"` and `?live=<time>` in the address (the worker lets a non-navigation request with no-store or `live=` go to the network; `live=` in case Safari does not pass the cache mode on to the worker). Same or older: "You have the newest version." No signal or no good answer: "No signal. Try again later." and nothing changes. Newer: `reg.update()`, then wait for a worker that is ready (20 s, up to 90 s while one downloads); it takes over ("Starting the new version…") and the page reloads once (on the new controller, or after 10 s anyway). A workout started at any point after the tap (during the wait, the sw.js check or the 10 s before the reload): nothing is deleted and nothing reloads ("Finish the workout first, then tap Update."); a reload held back this way is all the next Update tap does; the bar's Update does nothing during a workout either. A new install that started and failed (a file keeps failing on the site): "The website is still updating. Try again in 10 minutes." and nothing changes. No worker in time: first the live `sw.js` (no-store, `live=`) must declare the live version in its `APP_VERSION` line (not just mention it), else "The website is still updating. Try again in 10 minutes." and nothing changes; then delete the `training-<number>` caches (never another project's cache on the same github.io address), unregister the worker and reload from the network (the next start registers and installs again). Known limits: the sw.js check runs just before the fallback, so a CDN copy that changes between the check and the new install can still leave the app online-only until the next start installs again; a failing install downloads the app again at each start and at most every 15 minutes (about 7.7 MB on mobile data); a stale CDN `sw.js` older than the phone's version can be installed and offered by the bar (a downgrade until the CDN catches up, about 10 minutes). Old caches: `isOlder` counts only names `training-<number>.<number>…`. Saved data (localStorage) is never touched. The button lives in the page code, so it helps only after one update reached the phone.
  - Reach: rules 1-3 are in `sw.js`, and only the NEW worker's install, activate and fetch code runs during an update, so they reach a phone on 0.7.0-0.7.2 with no action. Rule 4 is page code: it runs only after one update has landed.
- `APP_VERSION` lives in `js/version.js` and at the top of `sw.js`. A unit test checks that both match and that every file in `app/` is in the cache list.
- Since 0.7.0 the list also holds the zxing-wasm reader (about 1 MB: the `.wasm` is 946,598 bytes), so the scanner works offline after the first open.
- Since 0.4.0 (redesign) the list has 164 files, including every photo in `app/media/` (about 5.4 MB of the 5.9 MB app), so the photos work offline. The first open downloads all of it once (Rosario's question 59 a: keep the sharp photos).
- Exercise videos are plain links to YouTube that open outside the app; nothing from YouTube loads in the page, so the CSP line is unchanged.
- The data lives in localStorage, not in the cache, so an update never touches it.

## 8. Timers, screen and sound

- **Timers store an end time** (`Date.now()` + length), and the screen shows `end − now`. When the phone locks, the page pauses; when it wakes, the time left is still right. The running timer's end time is saved in `trn.device.v1.active`, so a closed app comes back to the same timer.
- **Screen Wake Lock** (`navigator.wakeLock.request("screen")`) on workout start; asked again when the app comes back to the front; released on Finish. Works in home-screen apps on iOS 18.4 and later (Rosario has 27.2.1). If it fails, show once: "Set Auto-Lock to Never during workouts".
- **Beep:** a short Web Audio tone, made ready by the first tap on Start (iPhones only allow sound after a tap). The ring/silent switch mutes it; the screen flash always works. No vibration on iPhone web apps. Sound on/off in Settings.
- **Flash:** at zero the whole timer screen switches to the warning colour for 2 seconds, then shows "Go".

## 9. Apple Watch and Shortcuts

- **Watch:** the Today screen and the walk screen remind Rosario to start a **Strength** workout on the Watch at minute 0; the Finish screen reminds to stop it. No data link (not possible for web apps).
- **Shortcuts "Log to Health" (F21, off by default):** when on, the "Workout saved" message on Today (shown right after Save on Finish) has a **Log to Health** button that opens `shortcuts://run-shortcut?name=<name>&input=text&text=<start time>|<minutes>`. Rosario's Shortcut splits the text and runs "Log Workout" (Traditional Strength Training). The link carries only times, no body data. Research found reports of 0-minute workouts and a Health permission step, so this needs a phone test (build step 13). If it fails, it stays off: the Watch workout by hand already logs to Health.

## 10. Backup and restore

- **Download backup** (Settings): the data document as a file `training-backup-YYYY-MM-DD.json` (through a download link; on iPhone it goes to the Files app). Never contains the token. The app remembers `last_backup_at` and shows it.
- **Restore from file** and **Restore from GitHub** (first start or Settings): read the file, check its shape, then **merge** it into the phone with the sync merge rules. A restore never deletes what is on the phone. A `prev` copy is saved first.
- **Done in build step 9:** Restore from file and Restore from GitHub check the data first (`validate.js`; the file is untrusted data). An **empty** phone takes it as it is. A phone **with data** merges it in with the sync rules (`model.restore`, using `sync/merge.js`) after saving the `prev` copy. Nothing on the phone is dropped; a tombstone or a later edit in the file follows the normal merge rules. Restoring the same file twice changes nothing.
- The private repo's git history is the long-term backup: every sync is a commit.

## 11. Error states (what Rosario sees)

| Situation | Message (plain) | What the app does |
|---|---|---|
| No signal | "Saved on phone. Will sync when online." | Keeps working; syncs later. |
| Sync not set up yet | "Only on this phone. Set up GitHub in Settings." | Normal; shown on Today in small text. |
| Token wrong or expired (401) | "GitHub key expired or wrong. Make a new one." | Stops syncing; link to Settings > Sync. |
| Repo not found / no access (403, 404 on repo) | "Can't reach training-data. Check the repo name and key." | Stops syncing. |
| Too many requests (403/429 with rate limit) | "GitHub says wait a bit." | Tries again later. |
| Conflict after 3 tries | "Sync clash. Tap to try again." | Nothing lost; next sync tries again. |
| Remote file broken or unknown shape | "The GitHub file looks damaged. Not changed. Ask the Training chat." | Never PUTs over it. |
| Remote format newer | "Update the app first." | Never PUTs. |
| Phone storage full | "Phone storage full. Download a backup." | Never drops data. |
| Wake lock refused | "Set Auto-Lock to Never during workouts." | Shown once per workout. |
| App closed mid-workout | "Continue today's workout?" | Every set is already saved. |
| Opened in a Safari tab | "Add to Home Screen to keep your data safe." | Install hint with 3 steps. |

## 12. Delicate parts (Opus code review before the phone test)

Reviewed on 2026-11-16 (build step 11): every item passes, some after fixes. Findings, fixes and the checklist: [REVIEW-2026-11-16.md](REVIEW-2026-11-16.md). The redesign merge (app 0.4.0, then 0.4.1) was reviewed again on 2026-11-17: [REVIEW-2026-11-17-redesign.md](REVIEW-2026-11-17-redesign.md); every item passes.

1. **Token handling:** storage key, never in backup/sync/URL/logs/errors; password field; CSP; no third-party code; "forget key" works.
2. **Sync merge** (`sync/merge.js`): the merge properties in 5.3, tombstones, tie-breaks, unknown fields kept.
3. **Sync flow** (`sync/sync.js`, `sync/github.js`): one sync at a time; edits made during a sync are kept; never PUT over an unreadable file; 409/422 retry; `cache: "no-store"`; UTF-8 base64; `last_sync_at` from the start time.
4. **Data loss on the phone** (`store.js`, `model.js`): save on every set; quota errors; migrations with a `prev` copy; resume after close; restore merges, never replaces.
5. **Untrusted data in the page:** no `innerHTML` with data anywhere; the synced file and backup files are checked before use.
6. **Body data never in the public repo:** fixtures made up; no personal numbers in code, comments or docs.
7. **Food data and food sync** (build step 6, 0.7.0): `food/*` and `sync/docsync.js`, `foodsync.js`, `both.js`: food saved at once, its own box and file, the same sync rules as 5.2, a food problem never touches `progress.json`.
8. **Open Food Facts and the barcode reader** (build steps 7 and 8, 0.7.0): only the barcode or word leaves the phone; their text only as text, cut to 120 letters, numbers range-checked; the reader from our own site with its licences; the camera always stopped. Wave 3 check record: [checks/2026-11-18-wave3.md](checks/2026-11-18-wave3.md).
9. **Updates and offline files** (0.7.3): `sw.js` install, activate and fetch, `updater.js`: a new version never fills its cache with old files, never keeps a half-filled cache, answers only from its own cache, deletes only older caches and only when its own is complete, never reloads the page by itself, never touches localStorage. Check record: [checks/2026-11-18-v073-update.md](checks/2026-11-18-v073-update.md).

---

## 13. Build steps

Small phases, one task chat each, in this order. Each phase ends with its own commit (not pushed) and updates the docs it touches. **Model:** Sonnet for normal build work, Opus for the review. Steps that need Rosario are marked **[Rosario]**.

**How workers test without Rosario:**
- **Unit tests:** `node --test` (Node 24, built in; no install). Pure modules only.
- **Run the app locally:** `python -m http.server 8000 --directory app`, then open `http://localhost:8000/` in the built-in browser at phone size (preset "mobile", 375 × 812), in light and in dark mode. Service workers work on `localhost`.
- **Fake GitHub:** `tests/fake-github.mjs` imitates the contents API in memory (sha, 404, 401, 403, 409, 422, network failure, broken file). The sync code takes `fetch` as a parameter, so tests pass the fake. In the browser, `?fake-github=1` on `localhost` only switches the app to `sync/fake-github.js`, so the sync screens can be tested by hand.
- **No real GitHub** until step 12. No real body data, ever: tests use made-up profiles.

| # | Phase | Model | Files | Done when | Test method |
|---|---|---|---|---|---|
| 1 | **Skeleton** | Sonnet | `app/index.html`, `css/app.css` (tokens from DESIGN.md), `js/main.js`, `h.js`, `version.js`, `ids.js`, `tests/` set-up, `.github/workflows/pages.yml` | Empty screens reachable by hash routes; light and dark tokens work; `node --test` runs | Local server + browser at 375 px, both themes; unit test for `ids.js` |
| 2 | **Plan data + Plan sheet** | Sonnet | `plan/plan-v2.js`, `plan/cues.js`, `ui/plansheet.js`, `tests/plan.test.mjs` | Plan v2 fully in data (5 days, 12 weeks, swaps, cues); Plan sheet shows it and prints (replaced by the Plan day page in redesign build step 2, 2026-11-18; print removed by Rosario) | Plan test checks sets per week and swaps against plan v2; print preview |
| 3 | **Storage, model, first start, targets** | Sonnet | `store.js`, `model.js`, `engine/nutrition.js`, `engine/walk.js` (start), `ui/setup.js`, `ui/intake.js`, `ui/targets.js` | Start fresh → intake → targets → Today; data in `trn.data.v1`; formulas and safety limits pass tests | Unit tests with made-up profiles (floors, BMI over 30 rule, safe rates); browser run |
| 4 | **Rules engines** | Sonnet | `engine/schedule.js`, `engine/progression.js`, `engine/week1.js`, `engine/walk.js` (progress), tests | Every row of plan v2 tables (sections 8, 9, 10, 11) has a passing test | `node --test` |
| 5 | **Workout screens** (Today, walk, change-over, warm-up, pairs and sets, rest timer, swap, abs/holds, finish without sync, resume) | Sonnet | `ui/today.js`, `ui/walk.js`, `ui/warmup.js`, `ui/pair.js`, `ui/rest.js`, `ui/swap.js`, `ui/finish.js`, `timer.js`, `wakelock.js`, `sound.js` | A full Monday and a full Tuesday can be clicked through; closing the tab mid-set and reopening continues; timers right after a pause | Browser at 375 px; reload mid-workout; change the computer clock or fake `Date.now` in a test |
| 6 | **Week 1 guided screen** | Sonnet | `ui/week1.js`, uses `engine/week1.js` | Week 1 flow saves start weights and machine notes; week 2 suggests from them | Browser with the date set to week 1 and week 2 (a dev date override on localhost) |
| 7 | **Weigh-in, trend, weekly summary, charts, food numbers** | Sonnet | `ui/weighin.js`, `ui/progress.js`, `ui/weekly.js`, `engine/trend.js`, SVG chart helper | Trend and band check match a hand calculation; charts draw with 0, 1, many points | Unit tests for `trend.js`; browser with fixture data |
| 8 | **Offline + update banner + install hint** | Sonnet | `sw.js`, `manifest.webmanifest`, `icons/`, `ui/update.js` | App opens with the network off (browser offline mode); version change shows the banner; never during a workout | Browser devtools offline; version test (`sw.js` list = files in `app/`) |
| 9 | **Sync core** (delicate) | Sonnet, then Opus review in step 11 | `sync/merge.js`, `sync/github.js`, `sync/sync.js`, `sync/fake-github.js`, `ui/settings-sync.js`, `tests/merge.test.mjs`, `tests/sync.test.mjs` | All merge properties and all error rows of section 11 pass against the fake | `node --test` with `fake-github.mjs`; browser with `?fake-github=1` |
| 10 | **Backup and restore; Shortcuts button** | Sonnet | `backup.js`, `ui/settings.js`, `shortcuts.js` | Backup → empty storage → restore gives the same data; token never in the file; Shortcuts button hidden until turned on | Unit test (round trip, no token); browser |
| 11 | **Opus review** (done 2026-11-16: [REVIEW-2026-11-16.md](REVIEW-2026-11-16.md); the review chat also made the fixes) | **Opus** | all, focus on section 12 | Every "Delicate parts" item checked; findings fixed by a Sonnet chat; tests still pass | Code review + `node --test` + a grep for personal numbers |
| 12 | **[Rosario] GitHub set-up** | Sonnet guide chat with Rosario | `docs/RUNBOOK.md` (steps) | Rosario has an account, the public `training` repo with Pages on (source: GitHub Actions), the private `training-data` repo, a fine-grained token; code pushed **after Rosario says yes** | Rosario follows plain steps; the chat checks the Pages address opens |
| 13 | **[Rosario] Phone test** | Sonnet guide chat with Rosario | `docs/RUNBOOK.md` (results) | On the iPhone: installed to home screen; offline works; screen stays on; beep with ring on; first real sync and a sync clash test; backup to Files; Shortcut test (or left off) | Rosario follows a checklist; results written down |
| 14 | **[Rosario] First gym week** | Training Agent chat | `docs/OPEN_QUESTIONS.md` (question 17), fixes list | Week 1 done with the app; the first-visit check (machines, dumbbell steps) entered in Settings | Rosario's feedback |

Phases 2, 3 and 4 do not depend on each other's code and could run one after another in any order after phase 1. Phase 5 needs 2, 3 and 4. Phase 9 needs 3. Phase 10 needs 9.
