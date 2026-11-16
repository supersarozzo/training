# Decisions

Rosario's decisions are not reopened without asking. Never delete a row: mark it superseded.
State: pending (not decided yet) / active / superseded (by which row).

| Date | Decision | Reason | State |
|---|---|---|---|
| 2026-11-16 | Project master template used as the starting point | Same working method across all projects | active |
| 2026-11-16 | No tracker; STATUS.md is the tracker | Rosario's choice for this project | active |
| 2026-11-16 | The app is a web app hosted on GitHub Pages | Rosario's choice: works on the phone, no app store | active |
| 2026-11-16 | The app guides workouts and tracks progress, like a normal fitness app | Rosario's choice | active |
| 2026-11-16 | Sync up / sync down buttons push and pull the progress log to a file on GitHub; sync up also runs automatically | Rosario's choice: keeps the log safe and shared between devices | active |
| 2026-11-16 | Rosario has no circuit: the project designs the full training plan (exercises, sets, reps, weights) | Rosario's choice: the plan is built from scratch | active |
| 2026-11-16 | The "training sheet" is a page inside the app that shows the full plan and can be printed | Master's assumption; Rosario may change it | active |
| 2026-11-16 | No files outside the project folder, so no change ledger | Rosario's choice: the project touches nothing outside its folder | active |
| 2026-11-16 | Apple Watch link | Research 8.2 done; now intake question 40 | superseded by "Apple Watch: Strength workout by hand plus a Shortcuts button" (2026-11-16) |
| 2026-11-16 | Where the private progress file lives: a second, private GitHub repo | Research 8.2 recommends it; names are intake question 41 | superseded by "Repo names: training and training-data" (2026-11-16) |
| 2026-11-16 | Goal: build muscle | Rosario's answer (question 6) | active |
| 2026-11-16 | Level: beginner, no training experience | Rosario's answer (question 7) | active |
| 2026-11-16 | Gym: The Gym Group York Foss Island (UK) | Rosario's answer (question 8); equipment in docs/research/2026-11-16-gym-equipment.md | active |
| 2026-11-16 | 5 days a week, Monday to Friday | Rosario's answer (question 9) | active |
| 2026-11-16 | No injuries or health problems | Rosario's answer (question 10) | active |
| 2026-11-16 | Cardio placement: Rosario asked for a big block at the start and the end; the plan proposes 8 min easy at the start and 15 min steady at the end | Big hard cardio before weights lowers lifting quality (question 15) | superseded by "Cardio = a 30-minute fast uphill treadmill walk" (2026-11-16) |
| 2026-11-16 | Session length: plan designed for about 75 minutes, with a 60-minute version | Default until Rosario answers question 13 | superseded by "Session length: about 90 minutes" (2026-11-16) |
| 2026-11-16 | Weights are done as pairs (supersets) with rest, not non-stop circuits | Beginner muscle goal needs rest to lift heavy enough (question 16) | superseded by "Pairs vs circuits: expert choice" (2026-11-16) |
| 2026-11-16 | Session length: about 90 minutes | Rosario's answer (question 13) | active |
| 2026-11-16 | Safe-commands list approved as it is | Rosario's answer (question 14) | active |
| 2026-11-16 | Cardio = a 30-minute fast uphill treadmill walk in every session; where it goes in the session is still open (intake question 35; recommended: after weights) | Rosario's answer (question 15) | active; placement decided: before weights (row "Walk before weights", 2026-11-16) |
| 2026-11-16 | Pairs vs circuits: expert choice = pairs (supersets) of two exercises for different muscles, rest after the pair; no non-stop circuits; no two hard leg exercises paired | Rosario has no preference (question 16). A 2025 meta-analysis shows pairs save much time with the same gains; circuits force lighter weights. See docs/WORKFLOW.md B6 | active |
| 2026-11-16 | Models: Opus / high effort for research, design, the plan and code review; cheaper models for mechanical steps | Rosario's answer (question 19 a) | active |
| 2026-11-16 | The intake is one complete set of questions asked all at once (WORKFLOW.md section A, questions 20 to 44), turned into one tap-to-answer page | Rosario's wish, passed on by the master | active |
| 2026-11-16 | Body data (height, weight, age, measurements, photos) is never written into this repo; it lives on the phone and in the private data repo; progress photos stay only in the phone's Photos app | This repo will become public | active |
| 2026-11-16 | Progression keeps double progression (reps first, then weight), plus: a guided "find your weight" week, extra reps before a big weight jump, missed-time rules | Fits machines and dumbbells with big weight steps; used by JEFIT, Hevy and Alpha Progression (docs/research/2026-11-16-fitness-apps.md). Worker's expert choice; Rosario may change it | active |
| 2026-11-16 | Intake answers 20 to 38 stay private: the raw answers and the personal numbers live only in the git-ignored `private/` folder (and later on the phone and in the private data repo). Committed files show formulas, never values. Training choices that are not body data (walk placement, food-target type, scale, photos, muscle focus, exercises to avoid) may be named in the plan and here | Body-data rule above; the repo will be public | active |
| 2026-11-16 | Training plan v2 replaces plan v1 (docs/plan/2026-11-16-training-plan-v2.md); personal numbers in private/plan-v2-personal.md | Built from Rosario's 25 intake answers and WORKFLOW.md B, C, E, F | active |
| 2026-11-16 | Walk before weights: the 30-minute fast uphill walk opens every session | Rosario's answer (question 35 b). Not to be reopened | active |
| 2026-11-16 | How the plan protects lifting with the walk first: leg-day walks 2 % less steep and effort 4-5/10; 2-3 min break; 4-min lift warm-up; machines first on leg days; calves last (none on Tuesday); leg exercises paired with abs or light upper-body work | WORKFLOW B5 and B6; research finds walking barely affects muscle growth. Plan worker's expert choice; Rosario may change it | active |
| 2026-11-16 | Muscle focus: balanced (no extra sets for one area) | Rosario's answer (question 29 a) | active |
| 2026-11-16 | Food: the plan gives a daily calorie target and a daily protein target | Rosario's answer (question 32 a) | active |
| 2026-11-16 | Weight goal, calorie target, protein target, check-in limits: set from private intake, see private/plan-v2-personal.md | Rosario asked the app to suggest the goal (question 26 d); WORKFLOW B4 rules | active |
| 2026-11-16 | Calorie method: Mifflin-St Jeor × a daily-life number from question 30 (a 1.2, b 1.3, c 1.4, d 1.5), plus gym calories averaged over 7 days, cross-checked with × 1.55; same target every day | WORKFLOW B4 names the formula, not the numbers. Plan worker's choice; the weigh-in trend corrects it after about 3 weeks | active |
| 2026-11-16 | Starting walk speed and slope: set from private intake, see private/plan-v2-personal.md | Question 36 and WORKFLOW B5 | active |
| 2026-11-16 | Weigh-ins: every morning on the home scale (at least 3 a week); the Monday check uses the 7-day average | Rosario's answer (question 34 a); WORKFLOW F1 | active |
| 2026-11-16 | Progress photos every 4 weeks (weeks 1, 4, 8, 12), kept only in the phone's Photos app; measurements on the same days | Rosario's answer (question 38 a); WORKFLOW F4 | active |
| 2026-11-16 | No exercises excluded | Rosario's answer (question 37 a) | active |
| 2026-11-16 | iPhone runs iOS 27.2.1, so the app can keep the screen awake (needs 18.4 or later) | Rosario's answer (question 39) | active |
| 2026-11-16 | Apple Watch: Strength workout started by hand, plus a Shortcuts "Log to Health" button | Rosario's answer (question 40 b). WORKFLOW H lists the button under "later"; the app design step decides when it comes | active |
| 2026-11-16 | Repo names: "training" (public app) and "training-data" (private data); no GitHub account yet: Rosario creates one at the repo step, when the app is ready to go online | Rosario's answers (question 41 a, question 45 b) | active |
| 2026-11-16 | GitHub key (token) lasts 1 year | Rosario's answer (question 42 b) | active |
| 2026-11-16 | Auto sync after each workout and when the app opens, plus sync buttons | Rosario's answer (question 43 a) | active |
| 2026-11-16 | Backup file button in Settings | Rosario's answer (question 44 a) | active |
| 2026-11-16 | App stack: plain HTML, CSS and JavaScript (ES modules), no framework, no build step, no npm packages, no third-party scripts, no paid service | GitHub Pages serves files as they are; no third-party code keeps the token safer; about 15 screens do not need a framework; tests run with tools already on the computer (Node 24, Python 3.14). Design worker's choice; see docs/ARCHITECTURE.md section 1 | active |
| 2026-11-16 | App files live in `app/`; a copy-only GitHub Actions workflow publishes only that folder to Pages (address `https://<account>.github.io/training/`) | Pages can only publish the repo root or `docs/`, and `docs/` holds the project docs | active |
| 2026-11-16 | Data on the phone: localStorage, three boxes: the log (same shape as `progress.json`), device-only settings (token, sync state), and a copy from before the last merge. IndexedDB only if the data passes about 2 MB | A localStorage save is finished at once, so a set is safe the moment Done is tapped; one 12-week block is about 200 to 300 KB | active |
| 2026-11-16 | Personal numbers reach the phone by being typed in at first start (intake on the phone, targets computed by the public formulas, then confirmed or changed by Rosario), or by restoring from the private repo or a backup file. Never from the public repo | The public repo must hold no body data, and the app must work before Rosario has a GitHub account | active |
| 2026-11-16 | Sync rules: the whole log is merged (no action queue); GET without cache, merge by record id, the newer `updated_at` wins, deletes kept as tombstones, one sync at a time, retry up to 3 times on a clash (409/422), never write over a GitHub file that cannot be read; "Get from GitHub" and "Send to GitHub" both merge, neither overwrites | Nothing can be lost offline or in a clash; research section 3; details in docs/ARCHITECTURE.md section 5 | active |
| 2026-11-16 | Restoring (from GitHub or a backup file) merges into the phone; it never deletes what is on the phone | Data-loss safety | active |
| 2026-11-16 | Shortcuts "Log to Health" button: in version 1 as a late step, off by default, turned on after Rosario's phone test; if the test fails it stays off | Rosario chose it (question 40 b); the app part is small, but research found reports of 0-minute workouts, so it needs a real test | active |
| 2026-11-16 | Version 1 builds only the walk-first session layout (Rosario's choice 35 b); the block order is stored as plan data | Keeps version 1 small; another layout later is a data change | active |
| 2026-11-16 | Week numbers follow the calendar from the block's first Monday; long breaks lower the weights by the missed-time rules; Settings can move the block start | Plan v2 sections 10 and 11 ("a missed Monday does not move the week") | active |
| 2026-11-16 | Look: dark-first with a light mode, one flat teal accent, the phone's own font, main buttons 56 px tall at the bottom, timer digits 96 px; tokens in docs/DESIGN.md | One-hand use at the gym, readable at arm's length; contrast checked | active |
| 2026-11-16 | Workers test without Rosario: unit tests with `node --test`, the app on a local server at phone size, and a fake GitHub; no real GitHub until build step 12; test data is made up | Rosario has no GitHub account yet, and body data must never reach the repo | active |
