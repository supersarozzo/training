# App workflow: from first questions to every 12 weeks

Date: 2026-11-16. Written by the task chat "training-workflow" (Opus, high effort).
Based on: [fitness app research](research/2026-11-16-fitness-apps.md), [watch, sync and offline research](research/2026-11-16-watch-sync-offline.md), [gym equipment](research/2026-11-16-gym-equipment.md), and the [first plan](plan/2026-11-16-training-plan.md).
Status: design. The training plan will be redone from this flow by a later worker.

> **Not medical advice.** The numbers here are general guidance for healthy adults, taken from sports-science sources and common app practice. If a health question (section A, question 20) gets a "yes", talk to a doctor before hard training.

## 0. Words you need

- **Intake**: the first set of questions about you. The app uses the answers to build your plan.
- **Plan / block**: 12 weeks of training. After 12 weeks a new block starts.
- **Session**: one gym visit (about 90 minutes).
- **Set, rep, rest, pair, RIR, deload**: see the [first plan](plan/2026-11-16-training-plan.md), section 1. Short version: a *rep* is one movement, a *set* is a group of reps, *RIR* is "reps in reserve" (how many more good reps you could still do).
- **Pair (superset)**: two exercises for different muscles done one after the other, then a rest.
- **Double progression**: first you add reps, then you add weight.
- **Trend weight**: the average of your recent weigh-ins. One weigh-in jumps around with water and food; the average shows the real direction.
- **Maintenance calories**: the calories that keep your weight the same.
- **Surplus / deficit**: eating more (surplus) or less (deficit) than maintenance.
- **Lean bulk**: slow weight gain to build muscle with little fat.
- **Cut**: slow weight loss while keeping muscle.
- **Recomposition ("recomp")**: weight stays about the same; fat goes down and muscle goes up. This works best for beginners.
- **Sync up / sync down**: send the log to the private GitHub file / get it back from there.

## Where your data lives (privacy)

This repo will be public one day. So your body data never goes into it.

```
 On the iPhone (app storage)
   profile: intake answers
   log: sessions, sets, weigh-ins
        |
        | sync up / sync down
        v
 Private data repo (GitHub)
   progress.json
   (profile + log, no photos)

 Phone Photos app
   progress photos (never synced)

 Public app repo: code only, no data
```

- **Intake answers** (age, height, weight, goals): in the app on the phone, and in `progress.json` in the **private** data repo. Never in the public app repo, never in the docs.
- **Weigh-ins and measurements**: same place as the log.
- **Progress photos**: only in the phone's Photos app (an album, for example "Training"). The app does not store or upload photos in version 1.
- **For now (before the app exists)**: the master turns section A into one tap-to-answer page. Your answers are written only into the private data, or kept in chat. They are not written into this repo. See question 20 onward in [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) for the questions themselves.

## The whole flow at a glance

```
 A. Intake questions (once)
        |
 B. App builds the plan
        |
 C. Week 1: find starting weights
        |
 D. Each workout (Mon-Fri)
        |
 E. Progression after each workout
        |
 F. Weekly check-in (weight trend)
        |
 G. Every 12 weeks: review, new block
```

D, E and F repeat every week. G happens every 12 weeks and goes back to B.

---

## A. Intake questions

**One complete set, asked all at once** (Rosario's wish). For now the master turns this list into a tap-to-answer page. Later the app asks the same questions on its first start. Every answer can be changed later in Settings.

The order goes from safety, to body facts, to goals, to daily life, to training choices, to app setup. It takes about 5 to 8 minutes. Most good apps ask the first group (see the research file, section 2.1). Answers already given are listed at the end of this section and are not asked again.

Each row: the question, why it matters, the answer type and safe range, the options, and the **recommended** answer where one makes sense.

### Safety and body facts

| # | Question | Why it matters | Answer type, safe range | Options (recommended in bold) |
|---|---|---|---|---|
| 20 | Health check: the 7 questions of the official PAR-Q+ form (topics below) | Safety first. Any "yes" means: see a doctor before hard training. | Choice: all "no" / at least one "yes" | Any "yes": the app shows "talk to a doctor first" and waits for your OK. |
| 21 | Your age | Changes the calorie estimate and recovery. | Number, years. 16 to 90. Under 16: the app stops. 65 or more: a safety note. | Number |
| 22 | Sex used for body formulas | The calorie formula and waist limits differ for men and women. | Choice | Male / female / prefer not to say (the app uses the average and says so) |
| 23 | Your height | Needed for the calorie estimate and BMI (body mass index: a rough size check from height and weight). | Number. 120 to 230 cm. | cm, or feet and inches |
| 24 | Your body weight now | Starting point for calories, protein and the weight goal. | Number. 35 to 250 kg. Weigh in the morning, after the toilet, before food. | Number |
| 25 | Unit for body weight | UK scales often show stones. Gym weights stay in kg. | Choice | **kg** / stones and pounds |

### Goals

| # | Question | Why it matters | Answer type, safe range | Options (recommended in bold) |
|---|---|---|---|---|
| 26 | Weight goal | Decides calories and the weekly weight target (B4). | Choice | a) gain slowly (lean bulk) / b) stay about the same (recomp) / c) lose fat slowly (cut) / **d) not sure: the app suggests one from BMI and waist** |
| 27 | Goal weight (optional) | Shows how long it takes at a safe speed. | Number, kg, or "no target". Must be in BMI 18.5 to 30. The app never offers a faster rate than B4 allows. | **No target for the first 12 weeks** / a number |
| 28 | Waist at the belly button (optional) | Tells fat from muscle better than BMI. Helps choose bulk, recomp or cut. | Number. 50 to 200 cm. | **Yes, measure it** / skip |
| 29 | Muscle area to focus on | Lets the plan add 2 to 4 sets a week for one area. | Choice, at most one | **Balanced** / arms / chest / back / shoulders / legs and glutes |

### Daily life

| # | Question | Why it matters | Answer type, safe range | Options (recommended in bold) |
|---|---|---|---|---|
| 30 | Activity outside the gym (job and walking) | Changes maintenance calories. | Choice | a) mostly sitting / b) on my feet some of the day / c) on my feet most of the day / d) physical job |
| 31 | Sleep on a normal night | Sleep changes recovery and muscle gain. | Number. 3 to 12 hours. Under 6: a short tip, and effort stays a little easier (RIR 3). | Number |
| 32 | What should the app do about food? | Not everyone wants to count calories. | Choice | a) calorie and protein targets / **b) protein target only** / c) nothing about food |
| 33 | Diet style | Changes protein food ideas, not the targets. | Choice | **No limits** / vegetarian / vegan / other (text, kept on the phone only) |
| 34 | Scale at home? | Decides daily weigh-ins at home, or weekly at the gym. | Yes / no | No: weigh once a week on the gym scale, same day and time. |

### Training choices

| # | Question | Why it matters | Answer type, safe range | Options (recommended in bold) |
|---|---|---|---|---|
| 35 | Where does the 30-minute fast uphill walk go? (replaces question 18) | Its place changes how much you can lift (B5). | Choice | **a) after weights** / b) before weights / c) 15 minutes before + 15 minutes after / d) at another time of day |
| 36 | Can you walk fast for 30 minutes without stopping today? | Sets the starting treadmill speed and slope (B5). | Choice | Yes / not sure / no |
| 37 | Exercises you do not want (optional) | Swaps them out from the start. | Text or tick list | **None** / list them |
| 38 | Progress photos every 4 weeks? | Photos show change the scale misses. | Choice | **a) yes, kept only in the phone's Photos app** / b) no. Never synced, never in GitHub. |

### App setup

| # | Question | Why it matters | Answer type, safe range | Options (recommended in bold) |
|---|---|---|---|---|
| 39 | Your iPhone's iOS version (Settings > General > About) | Keeping the screen awake in a home-screen app needs iOS 18.4 or later. | Text, for example "26.1" | If under 18.4: update iOS, or set Auto-Lock to "Never" during workouts. |
| 40 | Apple Watch link (replaces question 11) | A web app cannot talk to the Watch or Apple Health. | Choice | **a) start a Strength workout on the Watch by hand (free, no setup)** / b) a) plus a Shortcuts "Log to Health" button (about 15 minutes of setup, needs a phone test) |
| 41 | GitHub account name, and names for the two repos (replaces question 12) | Needed to create the public app repo and the private data repo. | Text | Account: yours. **Repos: "training" (public app) and "training-data" (private)** |
| 42 | How long the GitHub key (token) lasts | You paste a key into the app once. When it ends you make a new one. | Choice | a) 90 days / **b) 1 year** (it reaches only the private data repo) |
| 43 | Auto sync | Keeps the log safe without thinking about it. | Choice | **a) after each workout and when the app opens, plus buttons** / b) buttons only |
| 44 | Backup file button in Settings | A second copy of the log, in case GitHub or the phone fails. | Choice | **a) yes** / b) no |

**Already answered (not asked again):** goal = build muscle; level = beginner; gym = The Gym Group York Foss Island; days = Monday to Friday; session = about 90 minutes; injuries = none; cardio = a 30-minute fast uphill treadmill walk (its place is question 35); pairs vs circuits = no preference, so the expert choice is used (B6).

**Not a question, a first-visit check:** question 17 (which extra machines the gym has, and the dumbbell steps). It stays open until the first visit.

**Health check (question 20).** The official PAR-Q+ form (free at [eparmedx.com](https://eparmedx.com/)) is copyrighted, so the app links to it and does not copy it. Its 7 yes/no questions cover these topics:
1. A heart condition or high blood pressure.
2. Chest pain (at rest, in daily life, or during exercise).
3. Dizziness, loss of balance or fainting in the last 12 months.
4. Another long-term health condition.
5. Medicine for a long-term condition.
6. A bone, joint or soft-tissue problem that exercise could make worse.
7. Being told to exercise only with medical supervision.

All "no": go ahead. Any "yes": answer the form's follow-up pages, then talk to a doctor or a qualified exercise professional before hard training. The tap-to-answer page asks one thing: "I did the PAR-Q+ and all answers were no" (yes / no, or "I have a yes").

---

## B. From answers to plan

These are the rules the app uses. **General guidance, not medical advice.**

### B1. The week (split)

Keep the first plan's week: it fits 5 days and a beginner.

| Day | Focus |
|---|---|
| Monday | Upper body A |
| Tuesday | Lower body A |
| Wednesday | Full body (a bit lighter) |
| Thursday | Upper body B |
| Friday | Lower body B |

Each muscle gets trained about 2 times a week. Most training apps and the evidence agree that 2 times a week is good for muscle gain (research file, section 3).

### B2. One session (about 90 minutes)

```
 0     5 min  easy warm-up (bike)
 5    45 min  weights: 3 pairs
50     8 min  abs (2 exercises)
58     2 min  move to treadmill, water
60    30 min  uphill walk
90     done, auto sync up
```

This is the layout for answer 35 a) (walk after weights). If you pick b), c) or d), the app moves the walk block. Rosario chose b) (walk before weights): the layout is in [plan v2](plan/2026-11-16-training-plan-v2.md), section 4. The weights block never gets shorter than 40 minutes.

**Short day** (a busy day): the app offers a 60-minute version. It keeps pairs A and B and one abs exercise, and shortens the walk to 15 minutes. Cut exercises, never rest times.

### B3. Weights: sets, reps, effort, rest

| Thing | Rule | Why |
|---|---|---|
| Sets per muscle per week | Start at about 8 to 10 hard sets. Go up to about 12 to 14 in weeks 7 to 11. | Beginners grow well on about 10 sets a week. More sets help a little more, but recovery limits a beginner. |
| Reps, big exercises (presses, rows, squats, leg press) | 8 to 12 | Easy to learn, safe, and good for muscle. |
| Reps, small exercises (curls, raises, calf raises) | 10 to 15 or 12 to 20 | Light weights are safer for small joints. Muscle grows in a wide rep range if sets are hard. |
| Effort | Stop with 1 to 3 reps left (RIR 1 to 3). Week 1: RIR 3. Never train to the point where form breaks. | Close to failure builds muscle. Going all the way to failure adds tiredness and risk for a beginner. |
| Rest | Big exercises: about 2 minutes before the same exercise comes back. Small exercises: 60 to 90 seconds. | Longer rest lets you lift more. In a pair, the other exercise uses part of the rest. |
| Exercises per session | 6 weights (3 pairs) + 2 abs | Fits 45 + 8 minutes. |

### B4. The weight goal: calories and protein

The app does this only if answer 32 is a) or b).

**Step 1: estimate maintenance calories.** The app uses the Mifflin-St Jeor formula (a common formula for daily energy use, from age, sex, height and weight), times an activity number from answer 30. It adds a little for the 5 gym sessions. This is only a first guess. After 2 to 3 weeks of weigh-ins, the weekly check-in (section F) corrects it from your real trend. MacroFactor works the same way (research file, sections 1.9 and 2.5).

**Step 2: pick the goal and the weekly target.**

| Goal (answer 26) | Calories | Target weight change | Protein |
|---|---|---|---|
| a) Lean bulk | Maintenance + about 10 % (about 200 to 300 kcal a day) | Gain about 0.25 % of body weight a week; the allowed band is 0.2 to 0.5 % (for 70 kg: about 0.15 to 0.35 kg a week) | 1.6 to 2.2 g per kg of body weight a day |
| b) Recomp | About maintenance | Stays within about 1 kg | 1.6 to 2.2 g per kg |
| c) Cut | Maintenance minus about 300 to 500 kcal a day | Lose about 0.5 % of body weight a week, never more than 1 % | 2.0 to 2.4 g per kg (higher protein keeps muscle in a cut) |

**"Not sure" (answer 26 d).** The app suggests:
- BMI under 20 → lean bulk.
- BMI 20 to 27 → recomp for the first block (beginners can gain muscle without gaining weight), or lean bulk if you prefer.
- BMI over 27, or waist over about 94 cm (men) / 80 cm (women) → cut or recomp.
These are rough rules. BMI does not see muscle. The app always shows the suggestion and lets you choose.

**Safe-rate rules (hard limits in the app):**
- The app never offers a weight loss target above 1 % of body weight a week, or a gain target above 0.5 % a week.
- The app never sets calories under 1,500 kcal a day (men) or 1,200 kcal a day (women). (Common guidance; MyFitnessPal is reported to use a 1,200 floor. Not checked on an official page.)
- No cut is offered if BMI is under 20.
- If the trend shows a loss of more than 1 % a week for 2 weeks in a row, the app suggests eating more.

**Protein in practice:** the app shows one number (the middle of the range, rounded), split into 3 to 5 meals. If your weight is high (BMI over 30), the app uses the weight at BMI 25 for your height instead, so the number is not too big.

### B5. Cardio: the 30-minute fast uphill walk

**What it is:** treadmill, walking (not running), with a slope (incline). Effort: you can talk in short sentences, about 5 to 6 out of 10. Hold the handrails only for balance (general advice; the sources did not cover it).

**Where it goes (answer 35):**
- a) **After weights (recommended).** Weights come first while you are fresh, so you lift more and build more muscle. Walking is gentle; after weights it also works as a cool-down. Research shows low-effort cardio like walking hurts muscle gain very little, much less than running or hard intervals.
- b) Before weights: possible, but tired legs on Tuesday and Friday (leg days) mean lighter lifts. If you choose it, the walk on Tuesday and Friday is kept easier.
- c) Half before (15 minutes, also the warm-up), half after (15 minutes). A fair middle way: it gives you cardio at both ends, as you first asked.
- d) At another time of day: best for lifting, but it needs a second trip or a home treadmill.

**Starting settings (from answer 36):**

| Answer 36 | Speed | Slope |
|---|---|---|
| Yes | 5.0 to 5.5 km/h | 6 to 8 % |
| Not sure | 4.5 to 5.0 km/h | 4 to 5 % |
| No | 4.0 to 4.5 km/h | 2 to 3 %, and build up from 20 minutes |

**Progress:** if the walk felt 5 out of 10 or easier two times in a row, add 1 % slope (up to 12 %), then 0.2 km/h speed (up to about 6 km/h, still walking). The well-known "12-3-30" treadmill workout (12 % slope, 3 mph = about 4.8 km/h, 30 minutes) is a good later target, not a start.

**How the weight goal changes cardio:**
- Lean bulk and recomp: keep the 30 minutes as it is. Count it in the calories (step 1 above).
- Cut: keep the 30 minutes. Do not add more cardio in the first block; the diet does the work. Steps outside the gym are the first thing to raise if weight loss stalls.

### B6. Pairs, not circuits (the expert choice)

Rosario has no preference, so the expert choice applies: **pairs (supersets) of two exercises for different muscles, with rest after the pair.** Example: chest press, then a row, then rest.

Why:
- Pairs save a lot of time, with the same strength and muscle gain as normal sets (a 2025 meta-analysis of 19 studies; research file, section 3).
- One muscle rests while the other works, so the weights stay heavy.
- Non-stop circuits leave too little rest. Weights must go down, and lighter weights build less muscle.
- Exception: on leg days, two hard leg exercises are not paired (for example leg press with Romanian deadlift tires the whole body). Leg days pair a leg exercise with an abs or upper-body-light exercise, or rest normally. A later worker checks this when redoing the plan.

### B7. Equipment and swaps

- The plan uses only equipment the gym lists (see the equipment research). Machines that are not confirmed get a cable or dumbbell version.
- Each exercise has 1 to 2 swaps for "machine busy", "I don't like it", or "it hurts".
- The app knows the smallest weight step for each exercise (dumbbell size, one plate on a stack). Question 17 asks you to check this at the gym.

---

## C. First week: find your starting weights

Week 1 teaches each exercise and finds a good weight. Nobody tests a maximum lift. Good apps either guess a careful weight from your answers (Fitbod, StrongLifts), fill in what you did last time (JEFIT, Hevy, Strong), or let you find it with light test sets (Alpha Progression). Nobody has a "last time" yet, and the gym's machines differ, so finding it with light test sets is safer and more accurate.

**Practice days before the plan's start (0.7.1, trainer D11):** every day before the block's first Monday is a practice day. Today shows the day's workout with Start and the day picker, as in week 1 (Saturday and Sunday: the rest card, the picker can still start any day). The label is "Practice week · Learn, find weights", never "Week 0", with the line "Your plan starts on Monday <date>. Practice now: find your weights and learn the moves." Practice uses the week-1 rules below and is saved with week 0. The start date never moves. Week 1 starts a practised exercise at the weight found in practice and may adjust it once more. Practice workouts are not in the week-1 check-in; the missed-time rules count them.

**First-try weights (0.7.1, trainer D12):** before an exercise has any weight (none set in the Plan, none logged, none found), the app shows "Try <kg>" with "First try. Set 1 tells us if it is right." on Today, the Plan cards, the opened exercise and the set screen. The weights come from the trainer's table (`plan-v2.js firstTryKg`), times 0.6 for a profile that is not "male", always rounded down to the gym's dumbbells, stack step or 5 kg plates, never 0. No body weight is read. In week 1 and practice the warm-up starts at about half of it and set 1 at it; the find-your-weight steps below then correct it.

**Soreness note (0.7.1, trainer D13):** in the practice week and weeks 1-3, the A1 card of Wednesday and Thursday (on the Plan and in the workout) says to use one step lighter when those muscles are still very sore, and to skip it on joint pain. By the workout day and slot, so it follows a Plan swap and a day picked on another date. A note only.

**Rules for week 1:**
- 2 working sets per exercise, not 3.
- Stop every set with about 3 reps left. It will feel easy. That is on purpose.
- No progression yet. Normal walk and abs.
- Ask the staff to show a machine if you are unsure.

**The guided screen, for each exercise:**

```
 1. Learn: form tips + "how to set
    the machine" (seat, pin)
 2. Warm-up: light weight, 10 reps
 3. Set 1: pick a weight
    -> do reps, stop with ~3 left
    -> tap reps done
    -> tap "how many more could
       you do?"  0-1 / 2-3 / 4-6 / 7+
 4. App suggests set 2 weight
 5. Set 2 -> app saves the
    starting weight for week 2
```

**How the app picks the next weight (step 4):**

| After set 1 | Next set |
|---|---|
| Reached the top of the rep range with 7 or more left | Add 2 steps |
| Reached the top with 4 to 6 left | Add 1 step |
| In the range with 2 to 3 left | Keep it. This is the starting weight. |
| In the range with 0 to 1 left | Remove 1 step |
| Could not reach the bottom of the range | Remove 1 to 2 steps |

If set 2 is still off, the app saves its best guess and fixes it in week 2 with the normal rule (section E). The app also saves the machine settings (seat height, pin position) as a note, so you do not have to find them again.

**First visit check (question 17):** the app shows a short list: which extra machines exist, and the dumbbell steps. Your answers update the swaps and the smallest steps.

---

## D. Each workout: screen by screen

The app must work offline, keep the screen on, and save after every set (so a closed app does not lose the workout). See the watch, sync and offline research for the iPhone limits: no vibration, beeps only while the app is open, no alerts when the app is closed.

```
 Today -> Warm-up -> Exercise/sets
   ^                   |  (rest timer
   |                   |   after sets)
   |                 Abs
   |                   |
   |               Uphill walk
   |                   |
   +-- next day ---- Finish + sync
```

**1. Today screen**
- Shows: day name, week number and phase (for example "Week 3 · Build"), the blocks of the day, the expected time.
- Shows sync status ("Saved to GitHub at 18:42" or "3 workouts not synced yet").
- A Monday to Friday day picker (0.6.0): any day of this week can be picked (done days have a tick); the screen shows the picked day.
- Buttons: **Start** and **Short day (60 min)** train the picked day. A day that is not the calendar's day is saved as a swap.
- In a set: **Stop this exercise here** moves on with the sets done so far (asks first, Undo for 8 s). The question also says "Does it hurt? Use Swap › It hurts instead." (0.7.1, trainer D10: pain goes through Swap). Stopped twice in a row on an exercise, with a set below the range both times: next time it is one smallest step lighter (weeks 2-5 and 7-11 only; never for bodyweight or timed exercises).
- Reminder text: "Start a Strength workout on your Apple Watch now" (the free Watch option from the research).
- If you missed days, the app says so in plain words and applies the rule in E3.

**2. Warm-up**
- 5-minute countdown timer, big numbers. Bike or treadmill, easy.

**3. Exercise screen (one pair at a time)**
- Name, equipment, the target (for example "3 sets · 8 to 12 reps · stop with 2 left"), and the **suggested weight**.
- "Last time" next to each set: the weight and reps from your last session. Strong and Hevy show this; it is the most useful number on the screen.
- **Warm-up sets** for the first exercise of a pair (0.7.1, trainer L1): a big lift whose muscle is the first of the day gets two (about 50 % x 10 reps, then about 75 % x 5 reps); a small exercise gets one light set (about 50 % x 10); an exercise whose main muscle was already worked earlier that day gets none. Rounded to the gym's weights.
- **Form tips** behind a tap.
- **Machine note** (seat height, pin) from week 1.
- **Each set row:** weight (filled in), reps (filled in with the target), a big **Done** button.
- After Done: an optional quick tap "How many more could you do?" (0 / 1 / 2 / 3 / 4+). This helps progression.

**4. Rest timer**
- Starts by itself after Done.
- In a pair: after A1, a 30-second "move to A2" timer. After A2, the pair's rest (60 to 120 seconds).
- Big countdown, +30 s and −30 s buttons, **Skip**. The next set is shown under the timer.
- At zero: the screen flashes and beeps (if sound is on). No vibration on iPhone web apps.

**5. Swap**
- Button on each exercise: "Machine busy", "Don't like it", "It hurts".
- Shows the 1 to 2 swaps. The log saves which exercise you really did.
- "It hurts": the app says stop, suggests the swap with a lighter weight, and asks for a note.

**6. Abs**
- Same set screen. Timed holds (plank) use a countdown timer instead of reps.

**7. Uphill walk**
- Shows the suggested speed and slope from last time.
- 30-minute timer. At the end: confirm the speed and slope you used, how hard it felt (1 to 10), optional distance and average heart rate (from the Watch, typed in).

**8. Finish**
- Summary: time, sets done, any new best (for example "Chest press: 12 reps at 30 kg, a new best"), and what changes next time.
- Optional: how hard the whole session felt (1 to 10) and a note.
- **Save** → the app saves on the phone and runs **auto sync up**. It shows "Saved to GitHub" or "Saved on phone, will sync later".
- A **Download backup** button lives in Settings.

**If the app closes mid-workout:** on reopening, it offers "Continue today's workout". Every set is already saved on the phone.

---

## E. Progression and adjustments

### E1. The rule: keep double progression

The research shows two good beginner rules (research file, sections 2.3 and 3):
- **Linear progression** (StrongLifts): add weight every session. Simple, but built for barbell lifts with small 2.5 kg steps. Machines and dumbbells often jump 2 to 5 kg at a time, so a beginner fails quickly.
- **Double progression** (Alpha Progression, Hevy, JEFIT-style suggestions, many coaches): add reps first inside a range, then weight. It copes with big weight steps.

So the app **keeps the first plan's double progression rule**, with the RIR tap and the "big jump" rule as small extras. One bad set does not lower the weight (JEFIT does the same); only two bad sessions in a row do:

| Last session | Next session |
|---|---|
| All sets at the top of the range, form good, 1 or more reps left | Add the smallest step. Back to the bottom of the range. |
| Some sets in the range, not all at the top | Same weight. Aim for 1 more rep per set. |
| A set 1 to 2 reps below the range | Same weight. Check rest and form. |
| A set 3 or more reps below the range, two sessions in a row | Lower the weight about 10 % (to the next size the gym has). Restart at the bottom of the range. |
| Pain or form broke down | Lower the weight. No increase until form is good. |
| "How many more?" said 4+ on every set, at the top of the range | Add 2 steps instead of 1 (only in weeks 2 to 4). |
| The next step is a big jump (more than about 10 % heavier, for example 7.5 to 10 kg dumbbells) | First aim for 2 extra reps above the range at the old weight, then move up. (Alpha Progression does this.) |

The app shows the next weight as a **suggestion**. You can always change it. Bodyweight and timed abs: add 2 reps or 5 seconds when all sets reach the top.

### E2. The 12-week rhythm

Keep the first plan's rhythm: week 1 learn, weeks 2-5 build, week 6 easier week (deload), weeks 7-10 build with a little more volume, week 11 push, week 12 easier week plus review.

Extra rule (auto-deload): if 3 or more exercises have needed a 10 % drop within 2 weeks, or session effort is 9 or 10 out of 10 for a whole week, the app suggests bringing the easier week forward.

### E3. Missed sessions

| Time away | What the app does |
|---|---|
| 1 to 4 days (one week cut short) | Carry on with the next workout in order. Do not try to "catch up" two workouts in one day. |
| 5 to 13 days | Repeat the last weights. No increase in the first session back. |
| 2 to 4 weeks | All weights about 10 % lower for one week, then normal progression. |
| More than 4 weeks | All weights about 20 % lower, and one week with 2 sets per exercise, like week 1. |
| Ill (fever, chest cold) | Rest. Back with the 5-to-13-days rule. |

The day order stays Monday to Friday. A missed Monday does not move the week; any day of the week can be picked on Today (0.6.0).

---

## F. Check-ins

### F1. Weigh-ins

- **How often:** every morning if you have a scale (answer 34), or at least 3 times a week. Without a scale: once a week on the gym scale, same day and time.
- **How:** after the toilet, before food and drink, light clothes.
- **What the app shows:** the trend weight (7-day average) as a line, with single weigh-ins as small dots. One day up or down means nothing.

### F2. Weekly summary (Monday, before the workout)

The app shows one screen:
- Workouts done this week (out of 5), sets done, new bests.
- Walk minutes this week.
- Trend weight change this week, compared to your target band from B4.
- Sleep is not tracked in version 1.

### F3. What the app changes if the weight trend is off target

The app waits for **2 weeks in a row** off target before it changes anything (weight changes from water are common).

| Goal | Trend for 2 weeks | Change |
|---|---|---|
| Lean bulk | Below target (not gaining) | +150 kcal a day |
| Lean bulk | Above target (gaining too fast) | −150 kcal a day |
| Recomp | Up more than 0.5 kg a week | −150 kcal a day |
| Recomp | Down more than 0.5 kg a week | +150 kcal a day |
| Cut | Losing less than 0.25 % a week | −150 kcal a day, or add 2,000 steps a day |
| Cut | Losing more than 1 % a week | +150 to 250 kcal a day |

If you chose "protein only" or "nothing about food" (answer 32), the app shows the trend and a plain tip ("Eat a bit more, for example one extra snack") instead of numbers.

If lifts go down for 2 weeks in a cut, the app suggests a slower cut. If you are gaining fast and lifts are not rising, the app suggests a smaller surplus.

### F4. Measurements and photos (every 4 weeks)

- **Measurements:** waist (at the belly button), chest, upper arm, thigh. Same time and way each time. Typed into the app, stored with the log in the private data repo.
- **Photos:** front, side and back, same light and place. Kept **only** in the phone's Photos app. The app shows a reminder; it does not take or store photos in version 1.

---

## G. Every 12 weeks: review and new block

In week 12 (the easier week), the app runs a review:

1. **Compare week 1 and week 12:** weights and reps for each main exercise, trend weight, measurements. Photos you compare yourself.
2. **Short re-intake:** body weight, weight goal (still the same?), days and time (still 5 x 90 minutes?), any pain or injury, exercises you liked or disliked, the walk (keep 30 minutes? harder?).
3. **Health check again** (question 20) once a year, or after any illness or injury.
4. **New block rules:**
   - Swap about a third of the exercises for similar ones (new stimulus, less boredom). Keep the main lifts you still enjoy.
   - Start the new block about 1 to 2 steps below your week-11 weights, then progress as normal.
   - Raise weekly sets by about 2 per muscle if recovery was good (no auto-deloads, effort under 9/10).
   - Re-check the weight goal against the trend: for example a lean bulk that reached the goal weight moves to recomp.
5. The app saves the old block in the log (nothing is deleted) and starts week 1 of the new block, but with a shorter "check weights" week instead of full learning.

---

## H. Version 1 vs later

Version 1 must be small enough to build and test on one iPhone.

**Version 1 (must have)**

| Area | In version 1 |
|---|---|
| Intake | Questions 20 to 38 on first start (stored on the phone and in the private file); 39 to 44 are one-time setup choices |
| Plan | The 12-week plan from the later "plan v2" worker, fixed in the app (not generated by code) |
| Week 1 | Guided "find your weight" screen (section C) |
| Workout | Today, warm-up, pairs with sets, rest timer, swap, abs timer, walk timer, finish (section D) |
| Progression | Double progression rule, missed-session rule, deload weeks (section E) |
| Weight | Weigh-in entry, 7-day trend line, weekly summary (F1, F2) |
| Food | One calorie and one protein number from B4, if you chose them |
| Sync | Auto sync up after finish, sync up / down buttons, backup download |
| Offline | Works with no signal; keeps the screen on |
| Charts | One chart per exercise (best set over time) and the weight trend |

**Later (version 2 and on)**

- Automatic calorie changes from the trend (F3). In version 1 the weekly screen shows the suggestion; you decide.
- Measurements chart, the 12-week review screen (G) and the new-block generator. In version 1 the master chat does the review with you.
- Readiness check before a workout ("tired / sore / good") that lowers sets on bad days (like Fitbod's recovery idea).
- Shortcuts button "Log to Apple Health" (Watch research, option A). Rosario chose it (answer 40 b); the app design step decides if it moves into version 1.
- Streaks and badges (all can run on the phone without a server).
- Reminders when the app is closed: not possible without a server (see the Watch research). Use the iPhone Clock or Calendar app instead.
- Food logging: not planned. Use MyFitnessPal or similar if you want it.
- Photos inside the app: not planned (privacy and storage).

**Habit features that work without a server:** streak counter ("4 weeks in a row with 5 workouts"), weekly goal ring, personal-best badges, the Monday summary. All run on the phone.

## Other notes for later workers

- The plan v2 worker redoes the plan from section B: 3 pairs plus 2 abs in about 50 minutes, the walk block, pairs that do not tire the same muscle, and leg-day pairing (B6).
- The app design worker uses section D as the screen list and section H as the scope.
- Rosario's body data is never written into this repo (see "Where your data lives").
