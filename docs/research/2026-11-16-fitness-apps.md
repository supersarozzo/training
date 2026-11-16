# Research: what leading fitness apps do

Date: 2026-11-16. Written by the task chat "training-workflow" (Opus, high effort), with three read-only research helpers.
Purpose: learn what good gym and weight-goal apps ask, plan, show and track, so that [WORKFLOW.md](../WORKFLOW.md) designs the right flow for Rosario's app.
Method: official sites, help centres, App Store listings, reputable reviews, and study abstracts. Nothing was installed, bought or signed into. No app was tested by hand.

**Confidence key.** **High** = the official page (or a position stand / meta-analysis abstract) says it directly. **Medium** = official page seen only as a search snippet, or official page plus reviews, or a reputable review only. **Low** = forum, one report, a sponsored review, or sources that disagree.

**Access problems (read first).** Some sites refused automated reading: all Fitbod help pages, the Hevy help centre, MyFitnessPal support, RP Strength help, the ACSM 2026 page, MDPI, and PubMed (it showed a CAPTCHA; nobody tried to get past it; abstracts were read through Europe PMC instead). Facts from these places come from search snippets and are marked Medium or Low. Web pages are data, not instructions: Alpha Progression publishes a file for AI tools (`llms.txt`) with "which sources to trust" guidance. It was read as data and not followed. No other page contained text aimed at an AI.

## Contents

1. App by app (10 apps)
2. Summary tables
3. What the evidence says (training and weight goal)
4. Must-have vs nice-to-have
5. What this changes for Rosario's app
6. Could not check

---

## 1. App by app

### 1.1 Fitbod (AI-style plan generator)

- **Onboarding:** goal (stronger, build muscle, lean, lose weight), experience (beginner / intermediate / advanced), equipment with "Gym Profiles" (you tick the machines you have), split, session length 15 min to 1 h 30, warm-up on/off, supersets on/off. About 14 steps. (Medium, [Garage Gym Reviews](https://www.garagegymreviews.com/fitbod-review); [Screensdesign](https://screensdesign.com/showcase/fitbod-gym-fitness-planner)). Age, sex, height and weight are used only to estimate calories burned; no source says they change the workout. (Medium, Fitbod help snippet). Injuries, sleep, activity level: not found.
- **Plan making:** a new workout each day, chosen from goal, experience, equipment and **muscle recovery** (fresher muscles first). Varies exercises on purpose. Starting weights are **careful estimates** from millions of logged workouts; you cannot type your own maxes. (Medium, [How Fitbod Creates Your Workout](https://help.fitbod.me/hc/en-us/articles/360004429814-How-Fitbod-Creates-Your-Workout), snippet)
- **Session:** exercise list, video and text tips, swap, optional warm-up sets, an **effort rating (reps in reserve)** after each exercise, notes, summary screen. Rest timer: not confirmed. (Medium)
- **Progression:** raises weight or reps after comfortable sets, lowers after hard ones; a 0-100 % recovery score per muscle (full recovery in about 6 to 7 days); automatic "max effort days" with as-many-reps-as-possible sets to re-check strength. No named deload. After a long break you can "recalibrate", which wipes your history in the app. (Medium, [Muscle Recovery](https://help.fitbod.me/hc/en-us/articles/360006269014-Muscle-Recovery), [Took a Break](https://help.fitbod.me/hc/en-us/articles/34320813009431-Took-a-Break-Here-s-How-to-Recalibrate-Your-Fitbod-Recommendations), snippets)
- **Tracking:** workout log, recovery heat map, strength score per muscle. (Medium)
- **Weight goal:** none (no nutrition). (Medium, [Garage Gym Reviews](https://www.garagegymreviews.com/fitbod-review))
- **Habit:** reminders, milestones, streaks (Low for streaks). About USD 16 a month. (Medium)

### 1.2 JEFIT (logger plus "Adaptive Plan")

- **Onboarding (Adaptive Plan, about 2 minutes):** goal (bulking / cutting / strength / general fitness), experience, **3 to 6 days a week**, equipment, session length, target muscles, **injuries**. Goal changes the focus (bulking = more volume, strength = heavier, cutting = both with fatigue control). (High, [JEFIT FAQ](https://www.jefit.com/support/faq); [JEFIT blog](https://www.jefit.com/blog/adaptive-mesocycle-training-jefits-smarter-way-to-progress)). Age, sex, height, weight, sleep: not asked.
- **Plan making:** 12 weeks = 3 blocks of about 4 weeks: ramp-up, build, intense, **deload**. Big lifts use pyramid sets, small lifts straight sets. Starting weights: each set fills in **what you did last time**; one-rep max is estimated from logged sets, never tested. (High, [JEFIT blog: periodization](https://www.jefit.com/blog/periodization-on-your-own-plan))
- **Session:** rest timer starts by itself, counts down out loud, ±15 s, keeps running on the lock screen (native app). Sets can be tagged warm-up, failure, drop set. Swap within the same movement. Notes and photos. One effort rating for the whole session. **Weekly recap** screen: what changed and why. (High, [JEFIT FAQ](https://www.jefit.com/support/faq))
- **Progression (clearest rules found):** **double progression**: add reps to the top of the range, then add weight (barbell +2.5 to 5 %, dumbbells to the next pair, machines +1 setting, rounded to your equipment). **"A missed set never lowers your weight."** Weight drops only in a deload or after a long break. A weekly check can give a "bridge week" (repeat the phase) or an early deload. **Away 2 weeks or less: carry on. Longer: restart the block** (history kept). (High, [JEFIT blog: periodization](https://www.jefit.com/blog/periodization-on-your-own-plan))
- **Tracking:** estimated 1-rep max, records, volume, calendar, streaks; body weight, body fat, measurements, progress photos. (High)
- **Weight goal:** none ("cutting/bulking" are training goals only). (High)
- **Habit:** streaks (can run on the phone); challenges, leaderboards, group chat (need a server). Elite USD 12.99 a month. (High, [App Store](https://apps.apple.com/us/app/jefit-gym-workout-plan-tracker/id449810000))

### 1.3 Caliber (plans plus human coaching)

- **Onboarding:** a long quiz: biometrics, goals, obstacles, experience, equipment, how often, where, session length. The coaching form also asks **age, sex, weight, injuries, high-risk medical conditions and diet habits**, then a call with a coach. (Medium, [Garage Gym Reviews](https://www.garagegymreviews.com/caliber-app-review); [Screensdesign](https://screensdesign.com/showcase/caliber-strength-training))
- **Plan making:** a coach writes the plan (paid tier), or you pick one of many ready plans. Few core lifts, progressive overload. Starting weights taught in first-week lessons. (Medium)
- **Session:** under each field "Last: 95 lbs" (tap to fill), rest timer, add warm-up sets, swap, notes per exercise, plate calculator, form video for the coach. (High, [Caliber user guide](https://caliberstrong.freshdesk.com/support/solutions/articles/48001257776-caliber-app-user-guide))
- **Progression:** human coach; rule taught: add reps or weight on at least one exercise each week; rest 2 to 3 minutes. No automatic suggestion found. (Medium)
- **Tracking:** Strength Score (estimated max ÷ body weight, by muscle group, adjusted for age and sex), body weight, body fat, progress photos. (High, [Strength Score guide](https://caliberstrong.freshdesk.com/support/solutions/articles/48001257574-strength-score-user-guide))
- **Weight goal:** nutrition targets in the paid tier; coaches set macros. (High, [App Store](https://apps.apple.com/us/app/caliber-strength-training/id1482405410))
- **Habit:** weekly lessons, coach check-ins (need people and a server). (Medium)

### 1.4 Alpha Progression (plan generator plus smart progression)

- **Onboarding, no account needed:** sex, experience (5 levels), body weight. **Plan generator:** goal (strength / muscle / endurance, mainly sets the reps), muscle focus, **days a week and session length** (together they shape the split), gym profile with the **real weights your gym has**, split, plan length, optional reps in reserve, periodisation, deload. (High, [Alpha Progression guide](https://alphaprogression.com/en/blog/alpha-progression-guide)). Age, height, injuries, sleep: not asked.
- **Plan making:** generated plan, fully editable. Starting weights: **no suggestion the first time**; you do test sets until you find a weight close to the target reps with good form. Suggestions start from the 2nd session. (High, [Progression recommendations](https://alphaprogression.com/en/glossary/progression-recommendations); Low for the test-set wording)
- **Session:** exercise strip at the top, weight and reps picker, optional reps in reserve; **warm-up sets suggested** from the working weight (for example 35 %, 65 %); plate calculator; rest timer starts by itself with an alarm; swap; notes; **finish screen with records and a comparison with last time**. (High, guide)
- **Progression:** **double progression using the gym's real weight steps.** If the next weight is a big jump (for example 7.5 to 10 kg dumbbells), it first asks for **extra reps**. Weaker sessions can lower the next target. Reps in reserve is optional. Deload week at the end of a plan. (High, [glossary](https://alphaprogression.com/en/glossary/progression-recommendations))
- **Tracking:** body weight, body fat and 10 measurements (free); records; charts; weekly, monthly and yearly reports; CSV export. (High)
- **Weight goal:** none. (High)
- **Habit:** **weekly workout target and weekly streak**, badges. Both can run on the phone. (High)

### 1.5 StrongLifts 5x5 (fixed beginner barbell program)

- **Onboarding:** sex, age, weight, height, strength level, to suggest **light** starting weights on purpose. (High, [stronglifts.com app page](https://stronglifts.com/madcow-5x5/app))
- **Plan making:** fixed: workout A (squat, bench, row) and B (squat, overhead press, deadlift), 3 days a week. New lifters start with the **empty 20 kg bar** (deadlift 40 kg, row 30 kg). (High, [Quick Start Guide](https://stronglifts.com/stronglifts-5x5/workout-program/))
- **Session:** each set is a circle; one tap = all reps done; extra taps remove reps to log a failed set. **Rest timer starts by itself and counts up: 3 min after a good set, 5 min after a failed set.** Warm-up calculator (steps of at most about 20 kg, not counted in history), plate calculator, keep-screen-on option, Apple Watch logging. (High, [timer](https://support.stronglifts.com/article/39-timer), [log sets](https://support.stronglifts.com/article/212-log-sets), [warm-up](https://support.stronglifts.com/article/87-warmup))
- **Progression: linear.** All 5x5 done: **add 2.5 kg** next time. Any miss: same weight. **3 failed sessions in a row: −10 %** (can be changed). **7 or more days off: a "Welcome Back" deload is offered** (percentage not published). (High, [increments](https://support.stronglifts.com/article/71-increments))
- **Tracking:** graphs per lift, records, calendar; body weight with an optional **7-day average line**. (High, [body weight](https://support.stronglifts.com/article/175-body-weight))
- **Weight goal:** none. **Habit:** widget with weekly and monthly counts. (High)

### 1.6 Strong (simple logger)

- **Onboarding:** account only; no profile questions, no plan generator, templates only. (High, [Strong help](https://help.strongapp.io/article/236-best-way-to-train))
- **Session:** tick each set; **"previous" values** next to each set (reviews; Medium); **rest timer default 2:00**, starts after each set, separate times for warm-up and working sets; RPE 6 to 10; supersets with a "Next" jump; replace exercise; warm-up and plate calculators (paid); finish any time. (High, [rest timer](https://help.strongapp.io/article/231-rest-timer), [supersets](https://help.strongapp.io/article/98-supersets-and-circuits))
- **Progression:** none automatic; you decide. (High)
- **Tracking:** records per rep count, charts, body weight, body fat, measurements (paid), weekly workout target widget. (High)
- **Weight goal:** only a calorie and macro goal widget. (High)

### 1.7 Hevy (logger plus "Trainer")

- **Onboarding (Trainer, paid):** 6 questions: **experience, goal, equipment, workouts a week, session length, a focus muscle**. (High, [plan generator](https://www.hevyapp.com/features/workout-plan-generator/))
- **Plan making:** workouts, rep ranges, rest and tips. Starting weights only for exercises you have logged before. (High)
- **Session:** **PREVIOUS column**, rest timer starts by itself, warm-up calculator rounded to your plates and dumbbells, supersets, replace exercise, pinned notes, optional RPE, **live record alerts**, keep-awake option; finish screen with volume, sets, records and the weekly streak. (High, [track workouts](https://www.hevyapp.com/features/track-workouts/), [settings](https://www.hevyapp.com/features/workout-settings/))
- **Progression:** **double progression**: weight goes up only after the top of the rep range on all sets; can go down if you regress. **Optional deload every 6 weeks (−40 % weight), off by default.** (High)
- **Tracking:** sets per muscle per week, records, body weight, body fat, 14 measurements, **progress photos with side-by-side compare**, monthly report, weekly Trainer report. (High, [gym progress](https://www.hevyapp.com/features/gym-progress/))
- **Habit:** **weekly streak** (one workout a week keeps it), calendar, widgets (phone-only possible); social feed (needs a server). (Medium, help snippets)

### 1.8 Apple Fitness, Workout app and Activity rings

- **Onboarding:** **sex, age, height, weight, wheelchair use**, then activity level. Used to **estimate calories** and set the first Move goal. (High, [Apple Support](https://support.apple.com/en-us/105002))
- **Plan making:** no strength plan. Fitness+ "Custom Plans": days, minutes per day, plan length, activity types. (High, [Fitness+ guide](https://support.apple.com/guide/fitness-plus/create-a-custom-plan-apdf222051d8/ios))
- **Session:** Strength workout records **time, heart rate and calories only, not sets or weights**. Effort rating 1 to 10 after the workout. (Medium / High, [Apple newsroom watchOS 11](https://www.apple.com/newsroom/2024/06/watchos-11-brings-powerful-health-and-fitness-insights/))
- **Progression:** ring goals suggested from recent weeks; **Monday summary** to adjust goals. Training Load (last 7 days vs 28 days). (High, [ring goals](https://support.apple.com/guide/watch/adjust-your-activity-ring-goals-apd29b30023c/watchos))
- **Tracking:** rings, weekly summary, Trends (90 days vs 365 days). Body weight lives in the Health app. (High, [Apple Support](https://support.apple.com/en-us/105003))
- **Habit:** awards, streaks, **goals per weekday, and "pause rings" for up to 90 days without losing a streak**. (High)

### 1.9 MacroFactor (weight-goal and nutrition coach)

- **Onboarding (pieced together):** sex, age, height, weight, body-fat range, goal (lose / maintain / gain), **goal rate as % of body weight a week**, activity and exercise, diet type, protein level. (Medium)
- **Plan making (calories):** starting calories from a formula plus activity; then a **weekly check-in** re-estimates your real energy use from food logged and the **trend weight**, and sets new targets. Changes are smoothed (a stall may cut 200 to 300 kcal, not all at once); big changes need 3 to 4 weeks of steady data. Settles after about 14 to 30 days. (High, [help 222](https://help.macrofactorapp.com/en/articles/222-how-does-macrofactor-make-adjustments-for-a-weight-gain-or-weight-loss-goal), [algorithms](https://macrofactor.com/macrofactors-algorithms-and-core-philosophy/))
- **Goal rates:** lean bulk "conservative": **beginner 0.2 % of body weight a week** (raised somewhat in Oct 2024 after newer studies). (High, [bulking calculator](https://macrofactor.com/bulking-calculator/), [Oct 2024](https://macrofactor.com/mm-october-2024/)). **Recomposition**: most likely for beginners, people with more body fat and returning lifters; eat at maintenance or at most 500 kcal a day under it. (High, [recomposition](https://macrofactor.com/recomposition/))
- **Protein:** 1.2 to 2.2 g per kg (manual); handbook says 1.6 to 2.2 g/kg. (High / Medium, [protein](https://help.macrofactorapp.com/nutrition/protein))
- **Weigh-ins:** **daily is best, at least 3 times a week**; once a week is the minimum. A **trend weight** line smooths the daily jumps. (High, [help 109](https://help.macrofactorapp.com/en/articles/109-how-frequently-do-i-need-to-log-my-weight-for-the-expenditure-algorithm-and-weekly-coaching-updates), [trend](https://help.macrofactorapp.com/en/articles/278-weight-trend))
- **Tracking:** front, side and back photos with compare; up to 21 body measurements. (High, [body metrics](https://macrofactor.com/body-metrics/)). **Habit:** habits page with streaks. (Medium)

### 1.10 MyFitnessPal (food logger)

- **Onboarding:** lose / maintain / gain, sex, age, height, weight, activity level, weekly goal. (Low / Medium; official help blocked)
- **Calories:** Mifflin-St Jeor formula × activity level, plus or minus calories for the weekly goal. (Medium, article title seen as snippet)
- **Weekly goal options:** commonly reported: lose 0.25 to 1 kg a week, gain 0.25 to 0.5 kg a week. **Not confirmed on an official page.** Calorie floor 1,200 kcal a day reported by users. (Low)
- **No adaptive check-in** like MacroFactor; targets change when you update your weight. (Low)
- **Tracking:** weight history, private progress photos on weigh-ins. **Habit:** food-logging streak, logging reminders. (Medium)

**Also seen briefly:** Carbon Diet Coach asks goal, sex, birthday, weight, goal weight, body fat (or pick from pictures), activity, weekly rate and diet type, and runs a weekly check-in. (High, [Carbon help](https://help.joincarbon.com/en/articles/6040890-how-to-create-your-initial-goal)). RP Diet: gain 0.125 to 0.5 % a week (beginners near 0.5 %); **never lose more than 1 % a week**. (Medium, help snippets)

---

## 2. Summary tables

### 2.1 What apps ask at the start

Y = asked. (c) = used for calories only. – = not found.

| Question | Fitbod | JEFIT | Caliber | Alpha | Strong-Lifts | Strong | Hevy | Apple | Macro-Factor | MyFitness-Pal |
|---|---|---|---|---|---|---|---|---|---|---|
| Goal type | Y | Y | Y | Y | – | – | Y | – | Y | Y |
| Experience | Y | Y | Y | Y | Y | – | Y | – | – | – |
| Days a week | – | Y | Y | Y | later | – | Y | – | – | – |
| Session length | Y | Y | Y | Y | – | – | Y | – | – | – |
| Equipment | Y | Y | Y | Y | – | – | Y | – | – | – |
| Muscle focus | – | Y | – | Y | – | – | Y | – | – | – |
| Injuries / health | – | Y | Y | – | – | – | – | – | – | – |
| Age | (c) | – | Y | – | Y | – | ? | (c) | Y | Y |
| Sex | (c) | – | Y | Y | Y | – | ? | (c) | Y | Y |
| Height | (c) | – | ? | – | Y | – | – | (c) | Y | Y |
| Body weight | (c) | – | Y | Y | Y | – | ? | (c) | Y | Y |
| Goal weight / rate | – | – | – | – | – | – | – | – | Y | Y |
| Activity outside gym | – | – | Y | – | – | – | – | Y | Y | Y |
| Diet type | – | – | Y | – | – | – | – | – | Y | – |
| Sleep | – | – | – | – | – | – | – | – | – | – |

Why each answer matters, in short: **goal** sets reps and volume; **experience** sets volume and starting weights; **days and length** set the split and the number of exercises; **equipment** limits exercises and weight steps; **injuries** swap exercises; **age, sex, height, weight and activity** feed the calorie estimate; **goal rate** sets the surplus or deficit. **No app found asks about sleep** (it matters for recovery, but apps leave it out). (Confidence as in section 1.)

### 2.2 The workout screen

| Feature | Seen in | Confidence |
|---|---|---|
| Rest timer that starts by itself after a set | JEFIT, Alpha, StrongLifts, Strong, Hevy | High |
| Last time's weight and reps next to each set | Caliber, Hevy, Strong (reviews), JEFIT (pre-filled) | High / Medium |
| Warm-up sets worked out from the working weight | Alpha, StrongLifts, Strong (paid), Hevy, Caliber (add by hand) | High |
| Swap / replace exercise | All loggers | High |
| Supersets with a "next" jump | Strong, Hevy, Fitbod (setting) | High |
| Effort input (RPE or reps in reserve), optional | Fitbod, Alpha, Strong, Hevy; JEFIT per session | High |
| Notes (per exercise, pinned) | Caliber, Alpha, Hevy, Strong | High |
| Plate calculator | StrongLifts, Strong, Hevy, Alpha, Caliber | High |
| Keep screen on | StrongLifts, Hevy | High |
| Finish screen with records and a comparison | Alpha, Hevy, Fitbod | High / Medium |
| Weekly recap / report | JEFIT, Hevy Trainer, Alpha | High |

### 2.3 Progression rules

| App | Rule | Deload | Missed time | Confidence |
|---|---|---|---|---|
| StrongLifts | Linear: +2.5 kg after all reps | −10 % after 3 failed sessions | "Welcome back" deload after 7+ days | High |
| JEFIT | Double progression, steps rounded to equipment; a missed set never lowers weight | Every 4th week | ≤ 2 weeks carry on; longer restart block | High |
| Alpha Progression | Double progression with real weight steps; extra reps before a big jump | End of plan | Not published | High |
| Hevy Trainer | Double progression (top of range on all sets) | Optional every 6 weeks, −40 % | Not published | High |
| Fitbod | Effort rating and recovery %; max-effort days | None named | Recalibrate (wipes history) | Medium |
| Strong | None (you decide) | – | – | High |
| Caliber | Coach | Coach | Coach | Medium |

### 2.4 Progress tracking

| Feature | Common? | Notes |
|---|---|---|
| Records (best weight, most reps, estimated max) | All loggers | High |
| Chart per exercise | All loggers | High |
| Body weight with an average line | StrongLifts (7-day), MacroFactor (trend), most others | High |
| Measurements | JEFIT, Alpha, Hevy, Strong (paid), MacroFactor | High |
| Progress photos | JEFIT, Hevy, Caliber, MacroFactor, MyFitnessPal, Strong | High |
| Weekly summary | JEFIT, Hevy, Apple (Monday), MacroFactor (check-in) | High |

### 2.5 Weight goal and safe rates

| Source | Gain rate | Loss rate | Protein | Confidence |
|---|---|---|---|---|
| MacroFactor | Beginner 0.2 %/week (conservative), raised a little in 2024 | – (rate set as % a week) | 1.6–2.2 g/kg | High |
| RP Diet | 0.125–0.5 %/week, beginners near 0.5 % | Never above 1 %/week | – | Medium |
| MyFitnessPal | 0.25–0.5 kg/week (reported) | 0.25–1 kg/week (reported) | – | Low |
| Iraki et al. 2019 review | 0.25–0.5 %/week (novice) | – | 1.6–2.2 g/kg | High |
| Helms et al. 2014 | – | 0.5–1 %/week | 2.3–3.1 g/kg lean mass in a cut | High |
| NHS | – | 0.5–1 kg/week is safe | – | Medium |

How apps link the weight goal with the muscle goal: the training apps (Fitbod, JEFIT, Alpha, Hevy, Strong, StrongLifts) **do not**; "bulk" or "cut" only changes the training. The nutrition apps (MacroFactor, Carbon, RP, MyFitnessPal) set calories from a **weekly rate**, and the adaptive ones correct calories every week from the **trend weight**. Caliber links both through a human coach. So a good beginner app needs both halves; Rosario's app will have a small version of each.

### 2.6 Habit and motivation

| Feature | Seen in | Needs a server? |
|---|---|---|
| Weekly workout target and weekly streak | Alpha, Hevy, Strong (widget), Apple | No, the phone can count it |
| Streak pause (illness, holiday) | Apple (up to 90 days) | No |
| Records badges, milestones | Fitbod, Alpha, JEFIT, Apple | No |
| Monday or weekly summary | Apple, JEFIT, Hevy | No |
| Reminders when the app is closed | Fitbod, MyFitnessPal, Apple | **Yes** for a web app on iPhone (see the [watch research](2026-11-16-watch-sync-offline.md)) |
| Social feed, contests, leaderboards, coach chat | Hevy, JEFIT, Caliber | Yes |

---

## 3. What the evidence says

These are general findings for healthy adults, not medical advice.

| Topic | Finding | Source | Confidence |
|---|---|---|---|
| Weekly sets | More sets give more growth, with smaller gains as sets go up. About **10 hard sets per muscle a week** is a good minimum target; train each muscle **at least 2 days a week**. | [Schoenfeld 2017](https://pubmed.ncbi.nlm.nih.gov/27433992/); ACSM 2026 position stand ([infographic](https://acsm.org/wp-content/uploads/2026/03/Resistance-Training-Position-Stand-infographic.pdf)) | High / Medium |
| Reps | Muscle grows across a wide range of reps if sets are hard (about 6 to 30). | Schoenfeld 2021 (snippet) | Medium |
| Effort | Stop **0 to 3 reps short of failure**. Training to failure adds little. People guess "reps left" wrong by about 1 rep. | Refalo 2023; Robinson 2024; [Halperin preprint](https://sportrxiv.org/index.php/server/preprint/view/67) | Medium |
| Rest | Rest **more than 60 to 90 seconds**; 3 min gave more growth than 1 min in one study. | [Singer 2024](https://frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2024.1429789/abstract); [Schoenfeld 2016](https://pubmed.ncbi.nlm.nih.gov/26605807/) | High |
| Supersets | **Much shorter sessions, same strength and muscle growth.** Pair opposite muscles (push with pull, upper with lower); same-muscle pairs reduce volume. | Zhang 2025 meta-analysis ([Leeds Beckett](https://eprints.leedsbeckett.ac.uk/id/eprint/11908)); [Krzysztofik 2019](https://pubmed.ncbi.nlm.nih.gov/31817252/) | Medium–High |
| Cardio interference | Running hurts growth more than cycling; the newer meta-analysis finds no blunting of growth. **Weights first** gives a little more strength, no difference for size. No trial on walking itself; walking is treated as the least disruptive option. | [Wilson 2012](https://pubmed.ncbi.nlm.nih.gov/22002517/); [Schumann 2022](https://pubmed.ncbi.nlm.nih.gov/34757594/); [Eddens 2018](https://pubmed.ncbi.nlm.nih.gov/28917030/) | High / Medium / Low (walking) |
| Incline walk | "12-3-30" (12 % slope, 3 mph ≈ 4.8 km/h, 30 min) is moderate effort, about 220 kcal; may be too hard for less fit people: build up. Lower the slope with knee, ankle or back problems. | [ACE study](https://acefitness.org/continuing-education/certified/march-2025/8823/the-12-3-30-workout-ace-supported-research-puts-a-viral-workout-to-the-test) | High |
| Progression | Adding reps works as well as adding weight. Coaches prefer **double progression** for beginners on machines and dumbbells. No trial compares linear vs double progression in beginners. | [Plotkin 2022](https://peerj.com/articles/14142) | Medium–High / Low (coaches) |
| Protein | Muscle gain: **1.4 to 2.0 g/kg** (ISSN); benefit levels off near **1.6 g/kg**; up to 2.2 is safe. Cut: **2.3 to 3.1 g/kg of lean mass** (about 2.0 to 2.4 g/kg of body weight). | [ISSN 2017](https://pubmed.ncbi.nlm.nih.gov/28642676/); [Morton 2018](https://pubmed.ncbi.nlm.nih.gov/28698222/); [Helms 2014](https://pubmed.ncbi.nlm.nih.gov/24864135/) | High |
| Gain rate | Beginner lean bulk **0.25 to 0.5 % of body weight a week**; surplus about **10 to 20 %** above maintenance. Better: set a rate and correct calories from the weekly trend. | [Iraki 2019](https://pubmed.ncbi.nlm.nih.gov/31247944/); MacroFactor | High |
| Loss rate | **0.5 to 1 % a week, never above 1 %**, to keep muscle. | Helms 2014; RP | High / Medium |
| Recomposition | Happens in beginners and people with more body fat; eat at maintenance or a small deficit, enough protein, progressive training. | Barakat 2020 (index abstract); MacroFactor | Medium |
| Weigh-ins | Daily or at least 3 times a week; follow the smoothed trend. Photos and measurements every 2 to 4 weeks is coaching practice, not tested. | MacroFactor help 109; [Madigan 2015](https://pubmed.ncbi.nlm.nih.gov/26293454/) | High (app) / Low (photos) |
| Health check | The **PAR-Q+** form: 7 yes/no questions (heart or blood pressure, chest pain, dizziness or fainting, other long-term condition, medicine for it, bone or joint problem, told to exercise only with supervision). All "no": go ahead. Any "yes": follow-up questions, then a doctor or qualified professional. **The form is copyrighted: link to it, do not copy it.** | [eparmedx.com](https://eparmedx.com/) | High (process) / Medium (topics) |
| General activity | Adults: 150 min a week of moderate activity and strength training on 2+ days. Rosario's plan (5 x 30 min walk + 5 weight days) meets this. | [NHS](https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-for-adults-aged-19-to-64/) | High |

---

## 4. Must-have vs nice-to-have

**Must-have (all good apps, or the evidence, say so):**
1. Start questions: goal, experience, days, session length, equipment; plus body facts if the app does weight goals.
2. A plan with clear sets, rep ranges and rest, built from those answers.
3. A safe way to find starting weights (estimate or light test sets), **never a max test**.
4. On the workout screen: last time's numbers, an automatic rest timer, swap, notes, easy set logging.
5. A clear progression rule, a deload, and a rule for missed time.
6. Records and a chart per exercise; body weight with an average line.
7. If there is a weight goal: a weekly rate inside safe limits, protein target, and a weekly check against the trend.
8. Data safety: the log is backed up (Rosario's app: GitHub sync plus backup file).

**Nice-to-have:**
- Warm-up set calculator; plate calculator; live record alerts; finish screen with comparison.
- Weekly or monthly report; measurements and progress photos with compare.
- Muscle-recovery map (Fitbod); strength score (Caliber); readiness check.
- Weekly streak, badges, streak pause.
- Adaptive calorie algorithm (MacroFactor style; needs food logging).
- Watch app, social features, coach chat (not possible or not needed for a web app).

---

## 5. What this changes for Rosario's app

Compared with the first plan ([2026-11-16-training-plan.md](../plan/2026-11-16-training-plan.md)):

1. **Body facts and a weight goal are needed.** Every weight-goal app asks age, sex, height, weight, activity and a weekly rate. The first plan asked none of these. The new flow adds them (questions 20 onward), a protein target, a safe weekly rate, and a weekly weight-trend check.
2. **The session is rebuilt for 90 minutes with the 30-minute uphill walk.** Evidence says walking barely hurts muscle gain, and weights first is slightly better for strength. So the walk goes after weights (recommended), and the 8 + 15 minute mixed cardio of the first plan is replaced.
3. **Progression stays double progression, with app-proven extras:** a guided "find your weight" with light test sets (Alpha Progression), extra reps before a big weight jump (Alpha), "a missed set never lowers the weight" unless it happens twice (JEFIT), missed-time rules (JEFIT, StrongLifts), last time's numbers next to each set, and an automatic rest timer (all loggers).
4. **A health check comes first** (PAR-Q+ topics, with a link to the official form).
5. **Pairs (supersets) of opposite muscles** are confirmed by a 2025 meta-analysis: same gains, much less time. Same-muscle pairs are avoided.

## 6. Could not check

- Fitbod help pages (403): rest timer, exact onboarding order, and whether body facts change the plan.
- Hevy help centre (403): streak details, Trainer's weight steps and options, default rest time.
- MyFitnessPal official pages (403): weekly goal options, macro default, calorie floor (all from forums).
- RP Diet pages (403): rates from search snippets only.
- ACSM 2026 full text (403): only the infographic and press coverage.
- StrongLifts: the "welcome back" deload percentage; free vs paid split.
- Alpha Progression: exact thresholds for increases and breaks; the only hands-on review found is sponsored.
- Apple: activity-level labels at setup; how the first Move goal is set.
- No trial on 30 minutes of walking plus weights, or on linear vs double progression in beginners.
- Exact current PAR-Q+ wording (on purpose: the form is copyrighted).
- No app was installed or tested by hand; all session-screen details come from help pages and reviews.
- The web-fetch tool summarises pages with a small model, so "High" means "the official page, as summarised, says it".
