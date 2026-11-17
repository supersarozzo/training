# Design research: coach style with big guide cards

Date: 2026-11-17. For: the phone workout app redesign (direction "d").
How to read this file: lines marked **[source]** come from a page I read. Lines marked **[my knowledge]** are my own background knowledge of these apps and are NOT checked on a page. Lines marked **[our proposal]** are my advice, not a fact about any app.

Honest warning: most web pages about these apps are affiliate reviews. App Store pages gave feature lists but no screenshot captions. Few pages describe colours, type or motion timings. So Sections 4 and 5 lean on [my knowledge] and [our proposal]. See "Could not check".

Prompt-injection check: I read about 20 pages. None had text addressed to an AI. Nothing was acted on.

---

## 0. Quick map

```
 App type             Apps
 -------------------  ------------------------
 Loggers (you lead)   Hevy, Strong, JEFIT
 Planner (app leads)  Fitbod
 Coach-led, guided    Future, Ladder, NTC,
                      Apple Fitness+, Peloton
 Body-data first      Whoop
```

Our app is a guided app for ONE beginner. So the best lessons come from the coach-led group (big cards, demo, voice) mixed with the logger group (fast set logging, rest timer).

---

## 1. App notes

### Hevy (logger)
- Today/home: the pages I read do not describe it. It has a feed, a calendar and streak views. **[source: App Store]**
- Set logging: each set is a row with weight and reps. Last session's numbers show for each exercise. Adding a set is one tap. Editing weight or reps takes about two taps. **[source: WhistleOut review, search summary]**
- Rest timer: starts by itself when you tick a set. You set 5 s to 5 min per exercise. Buttons -15 and +15 change it during rest. It can be off per exercise. It sits at the top of each exercise, under the notes. **[source: Hevy feature page]**
- Lock screen: a Live Activity shows the timer and the next set. You can tick sets from it. **[source: Hevy site, search summary]** (Not possible for us: web apps cannot do this.)
- Demo: a free library with video and steps. Placement is not described on the pages I read. I believe it is a small thumbnail by the exercise name, tap to open. **[my knowledge]**
- Charts: graphs per exercise for strength and records, plus volume, body weight, photos. **[source: App Store]**
- Onboarding: not found. **[could not check]**
- Motion: not described anywhere I could read. **[could not check]**
- Look: reviewers call it clean. **[source, weak]**
- Lesson: the tick on a set is the whole interaction. Rest starts from the tick.

### Strong (logger)
- Set logging: a quiet logbook, built for speed. Warm-up, drop and failure set types. **[source: App Store]**
- Rest timer: an automatic countdown after each logged set. Newer versions add Live Activity and Dynamic Island. Some users say the timer is hard to find or pause. **[source: App Store, review summary]**
- Plate calculator: helps load a bar. Limited to common bar weights. **[source]**
- Charts: personal records, estimated one-rep max, volume over time. **[source: App Store]**
- Look: reviewers call it a "quiet, mature logbook" with best-in-class strength UX. One review says it is more polished than Hevy. These are affiliate-style reviews. **[source, weak]**
- Lesson: calm and plain is a strength. Hidden timer controls make users complain.

### Fitbod (planner)
- Home: workouts, body data, goals. Records are hard to find (user review). **[source: App Store reviews]**
- Workout screen: suggests weight and reps. You can change them mid-workout. Countdown between sets. You cannot leave the active workout to browse until you end it. **[source: App Store reviews]**
- Demo: "Hi-res, multi-angle videos" for 1000+ exercises, with written steps. **[source: App Store]**
- Recovery: reviews mention a muscle recovery percentage setting and a recovery-based plan. **[source: search summary]**
- Onboarding: pick level (beginner to advanced), goal, workout time, equipment, exercises to skip. **[source: App Store]**
- Lesson: one short intake, then the app decides.

### JEFIT (logger plus big library)
- Onboarding: 28 steps, very long. A "Personalizing your plan" screen with testimonials. Then a soft paywall and a "Newcomer Offer" countdown. **[source: screensdesign]**
- Logging: suggested weights and reps are pre-filled and editable. Timers for rest and intervals. **[source: screensdesign]**
- Post-workout: a summary that compares total weight lifted to elephants, with a share button. **[source: screensdesign]**
- Charts: muscle breakdown chart, a muscle recovery map on the Body tab, 1RM tracking. Some are locked behind upgrade pop-ups. **[source: screensdesign]**
- Demo: about 1,400 exercises with animation and video. Some users report slow animations. **[source: search summary]**
- Lesson: mostly what to avoid: long quiz, countdown offer, locked charts, gimmick comparisons.

### Apple Fitness+ and the Workout app
- Fitness+ tabs: For You (one recommended workout big at the top), Explore, Plans (active plan at the top with a Start button), Library. **[source: Apple support]**
- During a class: metrics on screen (heart rate, calories, time, Activity rings). You choose which show. Timer can be elapsed, remaining or hidden. The Burn Bar is NOT shown for Strength. **[source: Apple support]**
- Before a class: the detail view shows playlist, music genre, equipment needed. **[source: Apple support]**
- Look and motion: full-screen instructor video, big numerals, rings that fill. **[my knowledge]**
- Apple Watch Workout app UI: no page found. **[could not check]**
- Lesson: one recommended thing at the top. Let the user choose which numbers to see.

### Nike Training Club (NTC)
- Onboarding: welcome photo with "Join Us" and "Sign In", then gear preference and weekly workout frequency. Sign-up is long (code, date of birth, legal boxes). **[source: screensdesign]**
- Home: hero image with a "Move With Us" button, a "What's New" note, then workout cards with duration, equipment and level. **[source: screensdesign]**
- Detail: instructor, details, video preview, "Start Workout" button. **[source: screensdesign]**
- Player: progress bar, pause, picture-in-picture, AirPlay, speed, subtitles. You pick music before you start. **[source: screensdesign]**
- Demos: trainer video classes, and whiteboard-style workouts for small spaces. **[source: App Store]**
- Critique: start, end and progress buttons look tappable (contrast, borders). A progress page with no back button, only swipe-back, felt inconsistent. Trophies and many filters felt like "featuritis". **[source: Pratt IxD critique]**
- A designer's concept cut the workout preview from 5 screens to 1 to match Nike Run Club. **[source: search snippet; the page itself returned 404]**
- Lesson: fewer screens before Start. Always show a visible back button.

### Future (personal training app)
- Daily flow: open the app, tap "view workout", then "start". **[source: Garage Gym Reviews page, see Could not check]**
- Workout screen: a person demonstrates each exercise on video, with a voice for setup and cues. You can pause and cast to a TV. A watch can move you to the next step. **[source: Garage Gym Reviews page and search summaries]**
- Logging: after a workout you rate how it felt, and the coach adjusts the plan. **[source: Garage Gym Reviews page]**
- Form check: record a set and send it to the coach. **[source: search summary]**
- Look: reviewers call it "very well designed and intuitive". No detail on colours. **[source, weak]**
- Lesson: "how did it feel?" after the session is a cheap way to feel coached. Voice plus video, hands free.

### Ladder (strength app)
- Onboarding: a short filter quiz matches you to a coach and team by goal and equipment. Four steps. Then a 7-day trial. **[source: screensdesign]**
- Detail screen: a full-screen video background with a "Start Workout" button. **[source: App Store screens listing, search result]**
- Player: a coach demo, a countdown timer, a progress bar, an exercise list, a voice that announces the next move. You can swap an exercise for a coach-picked alternative. **[source: Bustle via search, screensdesign]**
- Demo loops during the set. The coach gives cues before each set. Intro and outro videos. **[source: the garagegymreviews page I could read; see Could not check]**
- Logging: a journal for sets, reps and weight. **[source: screensdesign]**
- Progress: weekly streaks and badges. **[source: same page]**
- Home: a reviewer says the dashboard has many cards and could point to the next step more clearly. **[source: screensdesign]**
- Problems: some users report crashes and videos that start silent. **[source: search summary, weak]**
- Lesson: closest match to our style. But keep our Today screen to ONE next step.

### Whoop
- Start: tap plus, choose Strength Trainer, pick your workout, tap Start. **[source: search summary]**
- Idea: a daily target based on recovery, shown on a ring. A user asked for low, medium and high targets on the ring. **[source: Whoop community title]**
- Strength Trainer turns exercises, reps and weight into muscular load. A 2026 update estimates load from wrist motion. **[source: press, search summaries]**
- Limits noted at launch: no copy or edit of workouts, no history view, no custom exercises. **[source: search summary]**
- Look: dark UI, one colour per metric, big numbers. **[my knowledge]**
- Lesson: one ring, one target, one number. We have no sensors, so do not copy the data depth.

### Peloton (Strength+ and guided classes)
- Strength+ app: a workout builder with filter chips (duration, muscles, equipment, difficulty). You can reorder blocks and swap exercises. **[source: screensdesign]**
- The in-workout screen was called "quite dense with information". **[source: screensdesign]**
- A running timer shows how long a rep should take. Weight and reps are on the honour system. **[source: PelotonBuddy and Tom's Guide, search summaries]**
- On the Guide device the rep count shows at the bottom centre. It is camera-based and not for phones. **[source: Peloton pages, search summary]**
- Post-workout summary shows volume, time and exercises done. **[source: screensdesign]**
- Lesson: a dense in-workout screen is what to avoid. One big number at the bottom centre is good.

---

## 2. What to copy and why

1. **Ladder and Future: one full-height card per exercise.** Demo loop on the top 40% of the screen. Target in big type below. The user sees what to do from arm's length.
2. **Ladder: a full-screen demo background on the "start" card.** One big button at the bottom. It feels calm and clear.
3. **Ladder and Future: a looping demo during the set.** The loop keeps playing while the user works. No tap needed.
4. **Hevy: the tick on a set starts the rest.** One action, not two. Our "Done" button should start the rest ring by itself.
5. **Hevy: +15 and -15 second buttons on the rest timer.** Big and easy to hit with sweaty hands. Also a clear "Skip rest".
6. **Hevy and Strong: show last time's numbers, pre-filled.** The beginner only adjusts. It saves taps and shows progress.
7. **Hevy: rest time per exercise, and allow off.** Warm-ups and circuits do not need the same rest as heavy sets.
8. **Strong: a quiet, calm logbook look.** No clutter during a set. Strong is praised for polish, not for features.
9. **Strong (as a warning): keep rest controls easy to find and pause.** Users complain they are hidden. Put them on the card, not in a menu.
10. **Future: ask "How did it feel?" after the session.** Three big words or faces. It gives a coach feeling for almost no work.
11. **Future and Ladder: a voice or short text cue before each set.** Our version: one friendly line on the card, like "Slow down. Count three on the way down."
12. **Ladder and NTC: a progress bar and a "next up" preview.** The user always knows how much is left. We need session progress always visible.
13. **Apple Fitness+: ONE recommended thing at the top of Today.** One Start button. Not a feed.
14. **Apple Fitness+: let the user choose which numbers show.** Keep our default simple, but allow hiding the timer.
15. **Apple Fitness+: rings that fill.** A ring for the session or the week is a known, simple shape.
16. **NTC concept: fewer screens before Start.** Plan view and Start on one screen.
17. **NTC critique: a clear back button on every screen.** Swipe-only back was flagged as inconsistent.
18. **NTC: show duration, equipment and level on the workout card.** Three small facts on one line.
19. **Fitbod: one short intake, then decide for the user.** Ask only what changes the plan.
20. **Hevy and Strong: a per-exercise line chart of weight over time.** A simple line with the latest point marked is enough for a beginner.
21. **Whoop: one ring, one target, one number.** Today can show "Week: 2 of 3 sessions" as one ring.
22. **Peloton: a big number at the bottom centre for reps or time.** Thumb zone, readable from a distance.
23. **Ladder: swap an exercise for an easier one.** A beginner may feel pain or lack equipment. One tap on the card: "Swap".
24. **Ladder: a warm start and a warm finish.** Our version: "Ready? Today is legs." and a friendly finish card.
25. **Hevy and Peloton: a short summary after the workout.** Time, sets done, one highlight. Skip the elephants.

---

## 3. What to avoid and why

1. **Tiny tap targets.** Logger rows are small and built for fast lifters. Our user is a beginner with sweaty hands. Use at least 48 px, and 56 px for the main button.
2. **Swipe-only actions.** NTC's swipe-back with no button was flagged. Always offer a visible button next to any swipe.
3. **Dense screens during a set.** Peloton Strength+ was called dense. During a set show: exercise name, demo, target, one button.
4. **Long onboarding quizzes.** JEFIT has 28 steps. Ladder has 4. Ask only what changes the plan.
5. **Upsell banners, countdown offers, locked charts.** JEFIT and NTC show these. We have none. Never add a "locked" look.
6. **Confetti and gimmick summaries.** JEFIT's elephant comparison, NTC's trophies ("featuritis"). Keep the finish calm: one check, one line.
7. **Many cards on Today.** Ladder's dashboard was said to hide the next step. One next step only.
8. **Hidden or hard-to-pause timers.** Strong users report this. Keep Pause and Skip visible.
9. **Locking the user into the workout screen.** Fitbod users cannot browse until they end it. Allow "Back to plan" without losing data.
10. **Videos that start silent or break.** Ladder reviews mention this. Our demos should be muted loops that always work, with a still image if they fail to load.
11. **Too many filters and tabs.** NTC critique. We have one user and one plan.
12. **Anything that needs the app to run in the background.** Live Activity and lock-screen timers are not possible for a web app. Show a clear "keep screen on" note instead.
13. **Streak guilt.** Streaks and weekly badges can feel bad after a missed week. Our plan puts streaks in v2. Skip for now.

---

## 4. Motion notes

Honest note: I found no real timings on the pages I could read. The Apple and Material motion pages loaded as a title only. The values below are **[our proposal]**, based on common practice of about 200 to 400 ms for screen changes. Keep them short and calm.

### Card slide between exercises
- Guided apps (Ladder, Future, NTC player) move between steps with a slide or fade. **[my knowledge]**
- Do: the old card slides left 24 to 40 px and fades out. The new card slides in from the right and fades in. About 280 to 350 ms. Ease-out, for example `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Web Animations API: `el.animate([{transform:'translateX(32px)',opacity:0},{transform:'none',opacity:1}], {duration:300, easing:'cubic-bezier(0.2,0.8,0.2,1)', fill:'both'})`.
- Allow a swipe, but always keep a visible "Next" button.

### Check mark when a set is done
- Hevy and Strong fill a circle or tick when you mark a set. **[my knowledge]**
- Do: the circle fills with the accent colour (120 ms). The tick draws (180 ms, `stroke-dashoffset`). A tiny scale pop 1.0 to 1.08 to 1.0 (160 ms). Total under 300 ms.
- No haptics on iPhone web apps. Use the visual change only.

### Rest ring
- Apple Fitness+ and Whoop use rings. **[source: Apple support lists rings; animation is my knowledge]**
- Do: a ring that empties over the rest time. Use an SVG circle with `stroke-dashoffset`. Use a linear animation for the whole rest, because a linear timer feels honest. The seconds sit in the middle in big type.
- Drive it from the real clock (end time minus now), not from frame counts. It stays right if the page is throttled.
- Last 3 seconds: a soft pulse (opacity 0.7 to 1, 600 ms). No shaking.

### Number change
- Do: when weight or reps change with + and -, the number moves 8 px up or down and fades (140 ms). Keep it small.

### Session progress bar
- Ladder and NTC show a progress bar. **[source]**
- Do: a thin bar at the top, one segment per exercise. When a step ends, its segment fills left to right in 250 ms.

### Chart draw-in
- Do: the line draws in over 600 to 800 ms with `stroke-dashoffset`, once, when the screen opens. Not on every redraw.

### Demo loops
- Short muted loops (2 to 4 s) on the top 40% of the card. A tap on the demo pauses it. Use a small `<video muted loop playsinline>` or an animated image. Keep files small. Show a still image if the file fails. **[our proposal]**

### Finish screen
- Do: one soft check draws in (500 ms), then the summary fades up (300 ms). No confetti. No sound.

### Reduced-motion rule (must have)
- The CSS feature `prefers-reduced-motion: reduce` tells you the user wants less motion. It matters for people with vestibular problems. Big sliding and scaling are the main triggers. **[source: MDN]**
- MDN advice: keep your normal animations, then replace the heavy ones inside a `reduce` query with gentler ones, such as a fade. **[source: MDN]**
- Our rule **[our proposal]**:
  - With reduce on: no slides, no scale pops, no number movement, no chart draw. Use a plain fade of 120 ms, or an instant change.
  - The rest ring still counts down, because it carries information. Remove only the pulse.
  - In JavaScript, check `matchMedia('(prefers-reduced-motion: reduce)').matches` before every `animate()` call. Listen for changes.
  - Motion is never the only signal. A done set also changes colour and shows a tick.

---

## 5. Colour and type notes

Most pages gave no colours. What follows is mainly **[my knowledge]** and **[our proposal]**. Check it in the browser at 375 x 812.

### What these apps do
- Hevy, Strong, Whoop and Fitness+ are known for dark UIs with one strong accent. Whoop uses a colour per metric. Fitness+ uses the Activity ring colours. **[my knowledge]**
- Hevy and Strong are described as clean and quiet. **[source: reviews, weak]**
- Big numerals for the one thing that matters (time, reps, weight). **[my knowledge]**
- A photo or video as the hero (Ladder detail with full-screen video, NTC hero image). **[source: screensdesign]**

### Our proposal: premium and calm
Light mode:
- Background: warm off-white, for example `#F6F4EF`. Cards: white `#FFFFFF` with a very soft shadow, or a 1 px border at 8% black.
- Text: near black `#16181A`. Secondary text: `#5E646B` (check contrast is 4.5:1 or more).
- ONE accent: deep teal or green, for example `#0F7B6C`. Use it only for the main button, the progress, the done tick and the rest ring.
- Warning or pain: a warm amber, used rarely.

Dark mode:
- Background: not pure black. Deep charcoal, for example `#0E1113`. Cards one step lighter, `#171B1E`.
- Text: `#ECEEEF`. Secondary: `#9AA1A8`.
- Accent: the same hue but lighter, for example `#3CC9B0`, so it keeps contrast on dark.
- Fewer shadows in dark mode. Use a lighter card colour for depth.

Both modes:
- Define colours as CSS variables. Switch with `prefers-color-scheme`.
- Never use colour alone for meaning. Pair it with an icon or a word.
- Put demos on a plain neutral stage that works in both modes.

### Type
- System font only: `font-family: system-ui, -apple-system, "SF Pro Text", sans-serif`. On iPhone this is SF Pro.
- Sizes **[our proposal]**: exercise name 28 to 32 px bold. Target ("3 sets of 10") 44 to 56 px bold. Coaching line 17 to 18 px regular. Labels 13 to 14 px medium in the secondary colour.
- Numbers: `font-variant-numeric: tabular-nums` so timers do not jitter.
- Short lines. One idea per line.
- Use `rem` so text follows the user's size setting. Test at the largest size.

### Layout (thumb zone)
- Main button fixed at the bottom, full width, 56 px high, with `env(safe-area-inset-bottom)` padding.
- Progress at the top (small). Exercise name and demo in the middle. Target and button at the bottom.
- Card corners 20 to 28 px. Calm, rounded, lots of space.

---

## 6. Sources

All read on 2026-11-17. "Search only" means I saw it only as a search result summary, not as a full page.

https://www.hevyapp.com/features/workout-rest-timer/ (read 2026-11-17)
https://apps.apple.com/us/app/hevy-workout-tracker-gym-log/id1458862350 (read 2026-11-17)
https://www.whistleout.com/CellPhones/Apps/hevy-app-review (search only, 2026-11-17)
https://www.hevyapp.com/features/live-activity/ (search only, 2026-11-17)
https://apps.apple.com/us/app/strong-workout-tracker-gym-log/id464254577 (read 2026-11-17)
https://repreturn.com/strong-app-review/ (search only, 2026-11-17)
https://apps.apple.com/us/app/fitbod-workout-fitness-plans/id1041517543 (read 2026-11-17)
https://www.techradar.com/health-fitness/fitbod-app-review (text did not load; search only, 2026-11-17)
https://screensdesign.com/showcase/jefit-workout-planner-gym-log (read 2026-11-17)
https://www.jefit.com/blog/best-workout-apps-for-2026-top-options-tested-and-reviewed-by-pro (search only, 2026-11-17)
https://support.apple.com/guide/fitness-plus/apdf8a229f34/ios (read 2026-11-17)
https://support.apple.com/108761 (search only, 2026-11-17)
https://apps.apple.com/us/app/nike-training-club-workouts/id301521403 (read 2026-11-17)
https://screensdesign.com/apps/nike-training-club-wellness/ (read 2026-11-17)
https://ixd.prattsi.org/?p=38618 (read 2026-11-17)
https://erin-carty.squarespace.com/ntc-case-study (404; search snippet only, 2026-11-17)
https://www.garagegymreviews.com/future-app-review (read 2026-11-17)
https://www.active.com/fitness/articles/future-app-review (search only, 2026-11-17)
https://www.bustle.com/wellness/future-review-fitness-app-personal-trainer (search only, 2026-11-17)
https://connectthewatts.com/2021/09/27/future-app-review (search only, 2026-11-17)
https://screensdesign.com/showcase/ladder-strength-training-plans (read 2026-11-17)
https://www.bustle.com/wellness/ladder-app-review (search only, 2026-11-17)
https://www.wareable.com/fitness-trackers/whoop-launches-strength-trainer (search only, 2026-11-17)
https://www.community.whoop.com/t/displaying-low-medium-and-high-strain-targets-on-the-home-screen-strain-ring/14398 (search only, 2026-11-17)
https://screensdesign.com/showcase/peloton-strength (read 2026-11-17)
https://www.pelobuddy.com/?p=10346 (search only, 2026-11-17)
https://www.onepeloton.com/blog/peloton-iq-strength-training-features (search only, 2026-11-17)
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion (read 2026-11-17)

Count: 28 links. Read as full pages: 12. Search-result summary only (or failed to load): 16.

---

## 7. Could not check

- **Whoop Locker article** (whoop.com/thelocker/the-research-and-development-behind-strength-trainer): blocked with 403. Whoop facts come from search summaries only.
- **Ladder review on Garage Gym Reviews** (garagegymreviews.com/ladder-app-review): blocked with 403. I used screensdesign and search summaries for Ladder.
- **Mix-up risk:** the page I fetched at garagegymreviews.com/future-app-review described a weekly plan released on Sunday, a coach intro and outro, looping demos, a team group chat and badges. Some of that sounds like Ladder, not Future. So treat those details as "guided strength apps" in general, not as proof for one app.
- **Erin Carty NTC case study:** 404. Only a search snippet.
- **Apple Human Interface Guidelines (Motion)** and **Material Design 3 easing and duration:** the pages loaded as a title only. I could NOT confirm any timing from them. All timings in Section 4 are [our proposal].
- **TechRadar Fitbod review:** text did not load.
- **No screenshots:** App Store pages gave no screenshot captions. I could not see any screen. All "look" notes (colours, type, layout) come from text or from my own memory of the apps, and are marked.
- **Exact demo placement** in Hevy, Strong, JEFIT and Fitbod: not described on any page I could read.
- **Rest timer** in Fitbod, Peloton Strength+, Ladder and Whoop: not described on pages I could read.
- **Apple Workout app (Watch) UI:** no page found. Only Fitness+ pages.
- **Onboarding** for Hevy, Strong, Whoop, Peloton and Future: not found.
- **Fitbod recovery map:** I did not find a page that shows it for Fitbod. The map I read about was for JEFIT.
- **Dribbble, Behance, Mobbin:** I did not search these directly. Not checked.
- Many review sites are affiliate or low quality (several "pages.dev" pages looked templated). I did not use those as fact.
- App features and prices change. Everything is as of the pages read today. Reviews from 2020 to 2021 may be old.

---

## 8. Short list for the builder

1. One big card per step. Demo loop on the top 40%. Target in huge type. One main button at the bottom.
2. Tick a set and the rest ring starts. Show +15 s, -15 s and Skip as big buttons.
3. Progress bar at the top with one segment per exercise.
4. Today screen: ONE next step and one Start button.
5. After the session: "How did it feel?" then one calm finish card.
6. Motion under 350 ms, only transform and opacity. Honour `prefers-reduced-motion`.
7. Light and dark with one accent, system font, tabular numbers.
