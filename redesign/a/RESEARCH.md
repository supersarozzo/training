# Redesign A research: dark premium sport

Date: 2026-11-17

## Method

I searched the web and read pages for nine apps: Hevy, Strong, Fitbod, JEFIT, Apple Fitness+ and the Apple Fitness app, Nike Training Club (NTC), Future, Ladder and Whoop. I also read general guides on dark mode, touch targets and fitness app UX. Most sources are screenshot-library write-ups (Screensdesign), review sites, official feature pages and Apple's design guidelines. I could not open the apps themselves. So the notes show what these sources say, not what I saw on a phone. Many review sites are affiliate or promotional. I mark guesses with "(guess)". Some sites blocked me (see the end of "Sources"). I paraphrase everything. Numbers like "3 taps" come from reviewers, not from tests.

Our app, in short: one beginner user, iPhone, gym, one hand, a plain web app (no framework, no video hosting, no background code). So "Copy" notes below favour things a web page can do.

---

## Hevy

- **Today/home:** The Workout tab has a "start empty workout" button, then cards for saved routines, and a tutorial card for new users. A separate Explore area lists programs with filters for level, goal and equipment. [S1]
- **Set logging:** A stack of exercise cards. Each card is a table of sets with an "Add set" button. A tick mark completes a set. Duration and volume show at the top. Rows can be dragged, grouped as supersets, swapped or removed. [S1] Reviewers say adding a set is one tap and editing weight or reps is about two taps. [S3] The previous result is shown next to each set. [S3] (reviewer claims)
- **Rest timer:** Starts by itself when you tick a set. You can change it by 15 seconds up or down, or skip it. It can be set per exercise (5 seconds to 5 minutes) or switched off. [S2] It also shows on the lock screen widget with the current set, next set, last result and a button to tick a set without unlocking. [S4] There is also a bottom overlay and a full timer screen with a stopwatch mode. [S1]
- **Exercise demo:** A detail view with Summary, History and "How to" tabs. "How to" has a 3D illustration and numbered steps. Some moves show a short looping motion clip. [S1]
- **Progress charts:** Many charts: duration, a muscle radar chart, a body map, monthly reports and a calendar heat map for streaks. A time-range sheet ("Last 30 days") filters them. [S1]
- **Onboarding:** Splash, a few feature slides, sign-up, units, notification and Apple Health permissions, then a paywall and a short survey. [S1]
- **Motion:** Sources say little. The one clearly described motion is the looping demo. A first-use tip points at the tick mark. [S1] (No claim about a check animation; that part of the brief is a guess.)
- **Copy:**
  - Tick-to-complete per set row, with the timer starting by itself.
  - Rest timer with plus and minus 15 seconds and a skip.
  - "Previous" result beside each set, so the user knows what to beat.
  - Detail on a second screen (tabs), so the log stays clean.
  - One small tip, shown once, that explains the tick.
- **Avoid:** A paywall inside onboarding. Notification and Health permission requests up front. A big number of chart types for one beginner.

## Strong

- **Today/home:** Sources do not describe a home screen. A design write-up says the first screen can feel empty to new users and suggests a ready "first workout" template. [S5]
- **Set logging:** Fast and plain. Reviewers say a set takes about three taps. Last weight and reps show up automatically. There is a plate calculator and a warm-up calculator. [S6] [S7]
- **Rest timer:** Appears inline after a set and starts by itself. [S5] A listing site describes a circular countdown with manual adjust buttons. [S8] Times can differ per exercise. [S6]
- **Exercise demo:** One write-up says each exercise has a looping form animation, and a tap opens a detail screen with the demo, records and charts. [S5] A review of the app does not mention video, so sources disagree. [S6]
- **Progress charts:** Per-exercise weight history and a 1RM estimate (estimated best single lift). Volume by muscle and frequency heat maps are behind the paid plan. [S6] [S5]
- **Onboarding:** Minimal. Two steps, small pop-ups when you first use a feature. The write-up flags the forced sign-up as early friction. [S5] Another review says you can skip an account. [S6]
- **Motion:** Little. Mostly the looping demos and the timer starting by itself. [S5]
- **Copy:**
  - "Restraint": almost no decoration on the logging screen.
  - Weight and rep fields pre-filled from last time.
  - Circular countdown with adjust buttons.
  - Two-step onboarding with first-use pop-ups.
- **Avoid:** Crown icons and locked charts. A blank first screen.

## Fitbod

- **Today/home:** Not described in the sources I could read. A review says the app builds the plan from the quiz answers. [S9]
- **Set logging / timer / demo / charts:** Sources do not cover these. I did not find reliable details. (Not found.)
- **Onboarding:** The best documented part. It has value slides, then questions on training frequency, experience, goals, location and equipment (the longest step). It asks for a weekly goal. It shows a "warm-up" screen before the system notification prompt, then asks about recent muscle use and Health sync. It shows "projected gains", then account creation, then a "Building your plan" step. [S10] A review credits the quiz for making workouts feel personal. [S9] Contextual tooltips appear in the first workout. [S10]
- **Motion:** The "Building your plan" step is a loading moment that makes the plan feel made for you. (Guess about the look; the step itself is documented.) [S10]
- **Copy:**
  - Explain why before the system permission prompt (a short warm-up screen).
  - A "Building your plan" moment at the end of setup.
  - Tooltips in the first workout, when they are useful.
- **Avoid:** An "Unlock Pro" tag on most screens, including setup. [S10] Reviewers complain that everything locks after the trial. [S9]

## JEFIT

- **Today/home:** Not described in what I found.
- **Set logging:** Each set can be tagged warm-up, working, drop or failure. Supersets, notes and instant workouts are supported. An "autoplay" mode records weight and reps. [S11] A write-up notes that Jefit keeps the set table above a timer with skip, plus and minus 15 seconds, pause and a one-minute button. [S12]
- **Rest timer:** Timer, stopwatch or countdown per exercise. Interval timers can log a set when the countdown ends, then start rest. The lock screen shows set count and rest. [S11]
- **Exercise demo:** A library of 1,400+ exercises with animations and video. [S11] [S13] One user says some routines show the wrong picture. [S11]
- **Progress charts:** Volume, muscle focus, weekly sets per muscle, a muscle map and a recovery chart, and 1RM estimates. A 2020 reviewer found it hard to see one lift as a simple line. [S11]
- **Onboarding:** A newer flow with entrance animations and haptics (phone buzz), aimed at reaching the first workout fast. [S11]
- **Motion:** Entrance animations in onboarding. Users complain about delays in animations when switching exercises. [S11] [S13]
- **Copy:** Set type tags (warm-up vs working) only if they stay optional. A single line chart per lift.
- **Avoid:** Forced timer or tracker modes. Animations that make you wait. Too many features on one screen. [S13]

## Apple Fitness+ and the Apple Fitness / Activity apps

- **Today/home:** The Fitness app Summary tab leads with the activity rings. Below are steps, distance, workouts and awards. [S14] Apple Fitness+ is a video library with a Custom Plans feature for scheduling. [S15]
- **Set logging:** Not a lifting logger. Not applicable.
- **Rest timer:** Not applicable (the trainer sets the pace on video).
- **Exercise demo:** Trainer video with a person doing the moves. A review says you can stay focused on the trainer without looking at a watch. [S15] [S16]
- **Progress:** Rings for Move, Exercise and Stand. Trends compares the last 90 days with the last 365. It needs 180 days of data to start. Awards cover records and streaks. [S14] A reviewer said the nearly empty awards page made them want to act. [S14] (reviewer opinion)
- **Onboarding:** Not covered by my sources.
- **Metrics on screen:** During Fitness+ the user can show or hide live numbers. A "Burn Bar" shows how you rank against others, for some workout types. [S15] One review said the three rings on the workout screen were distracting. [S15]
- **Motion:** Not documented in my sources. (Rings filling is well known, but I did not find a source in this research.)
- **Official ring rules (useful for glowing rings):**
  - Rings sit on a black background with margin around them.
  - Rings only show Move, Exercise and Stand, never other data, and never decoration.
  - Do not change the ring colours or add gradients and shadows.
  - Design the rest of the screen around the rings. [S17]
  - Apple's ring colours are red, lime and cyan. [S17]
  - Our app cannot use Apple's ring look for its own data. Use our own ring style with our own colour. (Guess, based on the rules above.)
- **Workout screens (Apple's rules):** In a workout, show only what matters. Use large text and high contrast for people in motion. Make controls easy to find and tap. Show a summary at the end. [S18]
- **Copy:**
  - Black background, one ring with a bright colour, labels in the same colour as the ring.
  - A short summary screen at the end of a session.
  - An empty award or goal slot as a gentle pull.
- **Avoid:** Showing everything during the workout. Rankings against strangers. Copying Apple's three-ring look.

## Nike Training Club (NTC)

- **Today/home:** A big hero photo with overlay text and a clear button, plus a bottom tab bar. [S19]
- **Set logging:** NTC is mostly guided video. Logging means adding an activity, date and duration. [S19]
- **Rest timer:** No separate timer screen was found. Time shows in the video progress bar. [S19]
- **Exercise demo:** Video with an instructor. An older teardown notes that demo videos have spoken form tips. [S20] The player has speed, subtitles and music choice before you start. [S19]
- **Progress:** Program dashboards, activity history with stats, and an Achievements tab. [S19]
- **Onboarding:** Short. Two questions (gear and weekly frequency) with a progress indicator. [S19] [S21] A case study says a designer cut the workout preview from five screens to one. [S22]
- **Motion:** Sources describe only a splash screen and a loading circle. [S19]
- **Copy:**
  - Two-question setup with a visible progress bar.
  - One preview screen before a session: length, difficulty, equipment, a start button.
  - Big photo hero on the home screen.
- **Avoid:** Heavy sign-up forms. A library that feels like "just videos" (a user complaint). [S21] Gated screens.

## Future

- **Today/home:** The coach builds a weekly plan. The user opens the app, taps "view workout", then "start". [S23]
- **Set logging:** You can log reps or adjust suggested weights. [S24] After the workout, you rate how it felt, and the coach adapts the plan. [S23]
- **Rest timer:** Not found.
- **Exercise demo:** A person on screen shows each move, and a voice names the equipment and gives cues. [S23]
- **Progress charts:** The review does not describe charts.
- **Onboarding:** Questions about habits and goals, then a coach match and a video call. Reviewers praise it. [S23] [S24]
- **Motion:** Not found.
- **Copy:** "Open, view, start" in three taps. A "how did it feel" rating after each session, which could drive the next session. A guide voice and a clear next step.
- **Avoid:** Anything that needs a human coach or an expensive plan (about $150 to $199 a month by two reviewers). [S23] [S24] Promotional reviews: take with care.

## Ladder

- **Today/home:** A "plan unlocked" message, a trial banner, a "View weekly plan" button, a calendar strip, workout cards and a progress summary of about 20 percent. [S25]
- **Workout screen:** Full-screen video behind the workout page, a bright yellow start button, a routine preview with exercise list, and a swap sheet that suggests alternatives. [S25]
- **Set logging:** Input rows per exercise, a "Track results" toggle, ticks for completed items, a star rating at the end, and a journal drawer. [S25]
- **Rest timer:** A countdown (for example 0:30 rest). Settings include a "pause never" pace. The audio panel has separate volume sliders for coach, voice and timer. [S25]
- **Exercise demo:** A video per exercise. [S25]
- **Progress:** Round metrics for workouts and calories, a calendar, badges for streaks and totals, a weekly streak card, and a community "wall" with photos. [S25]
- **Onboarding:** Black splash, tracking prompt, Sign in with Apple, intro video, coach picker, paywall, then permissions. [S25]
- **Motion:** Video-led. Details of transitions not documented.
- **Copy:** Dark, video-led look with one bright accent colour on the main button (yellow). A weekly calendar strip. A summary with weekly streak at the end.
- **Avoid:** Trial and upgrade banners on the home screen. Social wall and photos. Reports of crashes and a hard-to-use calendar (a machine-written source, so low trust). [S26]

## Whoop

- **Today/home:** Three dials at the top: Sleep, Recovery and Strain. Each opens a deeper page. [S27] An agency breakdown says the app shows three levels: overview, trends, then deep graphs. [S28]
- **Set logging / rest timer / exercise demo:** Not Whoop's focus. Not found.
- **Progress charts:** Weekly trend charts, then deep graphs on request. [S28] Strain is a 0 to 21 score. [S29]
- **Onboarding:** Not covered by my sources.
- **Colour:** A narrow palette where each colour means one thing: green for good recovery, yellow for the middle, red for strain or low recovery. No decorative colour. [S28]
- **Type:** Key numbers are very large, support text is small. [S28]
- **Dark theme:** Near-black background that makes colour-coded data stand out and cuts glare when checked early or late. [S28]
- **Motion:** Smooth transitions between the levels, so the user keeps their place. [S28]
- **Copy:**
  - One huge number per dial, one colour meaning per colour.
  - Three levels: today, trend, details.
  - Smooth transitions that keep the user's place.
- **Avoid:** Too many dials on one screen for a beginner. A fixed green/yellow/red scale that implies "you did badly" on a rest day. (Guess.)

---

## General articles (dark mode, fitness UX, reach)

- **Black or dark grey:** Backgrounds do not have to be pure black. Many big apps use dark grey (#181818 to #1E1E1E). Apple prefers black on OLED but allows grey. Spotify layers three dark levels to show depth. [S30]
- **Near-black compromise:** A design article says near-black (not pure black) can stop smearing on OLED when scrolling, and light grey text is easier to read than pure white. Another source says power savings from pure black are small. Forum and blog sources: treat as opinion. [S31]
- **Contrast:** Apple says at least 4.5:1, and aim for 7:1 for small text. [S32] Another guide says use a dark grey (like #121212) with off-white text (like #E0E0E0). [S33]
- **Saturation:** Mute bright colours in dark mode. Highly saturated text is hard to read. [S30] [S33]
- **Depth and glow:** Shadows hardly show on dark backgrounds. Use faint highlights or a soft, blurred glow in a softer tone of the element's colour. [S33] Apple uses a "base" and "elevated" dark level for layered sheets. [S32]
- **Both modes:** Apple says an app should look good in both modes and follow the phone's setting. [S32] Another guide notes dark mode can hurt readability in bright light and for some low-vision users. [S33]
- **Soften white images:** Darken images with white backgrounds a little so they do not glow. [S32]
- **Touch targets:** Apple says 44 by 44 points. Material says 48 by 48 dp. WCAG's strict level asks 44 by 44 CSS px. Put main actions in the bottom third of the screen and test with a thumb. [S34]
- **Fitness UX:** Get to the first workout quickly (about 60 seconds). Keep controls big and always visible. Keep key actions in reach with a bottom bar. Use small, rewarding micro-feedback (a ring that fills, a buzz) after a set or session. [S35]
- **Workout screens:** Show only what matters during a workout. Use big, high-contrast text. [S18]
- **Design write-up on tracker patterns:** Show a preview before starting. Show clearly what is done and what is left. Make "target", "last time" and "confirmed" look different so a tap does not save a false value. Start rest from a confirmed set, with adjust, pause and skip. Allow adding sets or notes mid-session. Allow saving a partly finished session. [S36]

---

## Patterns to copy for redesign A

1. **Near-black background with two or three dark levels, not pure black.** Use something like a very dark grey base, a lighter card level, and a lighter sheet level. This avoids OLED smearing, keeps depth, and keeps the premium look. (Whoop, Apple dark mode, Spotify example, LookUp article)
2. **One strong accent colour, kept for progress and the main action only.** Rings, the Start button, the Done tick. Everything else is white, grey or a quiet tint. (Whoop, Ladder's yellow start button, Apple ring rules)
3. **Off-white text, never pure white. Body text at least 4.5:1, small text close to 7:1.** No mid-grey on black for anything the user must read in the gym. (Apple dark mode, UX Design Institute)
4. **Muted accent in dark, a deeper accent in light.** Pick the accent twice so each mode keeps contrast. The light mode follows the phone setting. (Apple, UX Design Institute, LogRocket)
5. **Huge numbers, small labels.** Weight and reps are the biggest text on the logging screen. (Whoop, Apple workout rules)
6. **Today screen: one big ring or card and one big button.** Show today's session, how long it takes, and "Start". Everything else is a tap away. (NTC preview, Future's open-view-start, Whoop three levels, Ladder)
7. **Set row turns solid with a check animation on Done, and the row's value styles change.** Target, last time and confirmed look different. (Hevy tick, tracker-pattern write-up). The check animation itself is our design idea.
8. **Pre-fill each set from last time and show "previous" beside it.** One tap to accept. (Strong, Hevy)
9. **Rest timer as a full-width ring with the next set under it, starting by itself on Done, with minus 15, plus 15 and skip.** (Hevy, Strong, Jefit). Beeps only with the app open (our own limit).
10. **Exercise demo as a looping start/end photo pair or a short loop on a detail view, with numbered steps.** Keep it behind a tap so the log stays clean. (Strong, Hevy, Jefit)
11. **Big thumb targets, 48 px or more, main actions in the bottom third.** Add spacing between them so a sweaty thumb does not hit the wrong one. (Apple 44 pt, Material 48 dp, Stormotion)
12. **Three levels of progress: today (ring), trend (one simple line), detail (a list).** One line chart per lift with the best result marked. (Whoop, Strong, Jefit complaint about hard-to-read lifts)
13. **A soft glow only on the ring and the main button, in a lighter tone of the accent.** Shadows do not work on dark, so use glow for depth and keep it small. (UX Design Institute, Apple ring rules: keep the ring itself clean)
14. **Short, purposeful motion: rings fill, numbers count up, sheets slide.** Under about 300 ms, never blocking taps, and honour "reduce motion". (Whoop smooth transitions, Jefit animation delay complaint)
15. **A short finish screen:** a ring that closes, the session's totals, a "how did it feel" rating. (Apple workout summary, Future rating, Ladder summary)
16. **Setup in two questions at most, with a progress bar, and a first-use tip that appears once.** (NTC, Strong, Fitbod tooltips)

## Things to avoid

- **Ads, upgrade banners, trial bars, crown icons and locked charts.** Hevy, Fitbod, Strong and Ladder all show some form of this. This app has no paid plan.
- **Forced sign-up or permission pop-ups before the first workout.** (Strong, Hevy, Fitbod)
- **Social feeds, photo walls, leaderboards and rankings.** (Ladder wall, Apple Burn Bar) One user only.
- **Gamification nags:** streak guilt, push-style reminders, shame colours on a rest day. The app cannot send alerts anyway.
- **Low-contrast grey text on black.** Especially for units, "previous" values and timers.
- **Pure white on pure black, and neon, over-saturated colours.** They hurt in a dark gym and glow on OLED.
- **Tiny targets and close-together buttons.** Under 44 px, or without spacing.
- **Motion that blocks input,** such as slow entrance animations or animations on every exercise switch. (Jefit complaints)
- **Too many chart types and too many dials.** (Hevy, Whoop)
- **Everything on screen during a workout.** (Apple workout guidance; the Fitness+ rings complaint)
- **Copying Apple's three-ring look, or using rings for decoration.** Apple's rules forbid it. Use our own ring.
- **Forced timer modes and features that cannot be switched off.** (Jefit complaints)
- **A blank first screen.** Always show a ready "first session". (Strong write-up)
- **Anything the iPhone web app cannot do:** vibration, alerts when closed, background timers. Do not design around them.

---

## Sources

Not every link was opened in full. "Search" means I only saw the search summary, not the whole page.

- S1: Hevy screens and flows (Screensdesign) https://screensdesign.com/apps/hevy-workout-tracker-gym-log/
- S2: Hevy rest timer feature page https://www.hevyapp.com/features/workout-rest-timer/
- S3: Hevy review, set logging speed (Search) https://repreturn.com/?p=1625
- S4: Hevy live activity widget https://www.hevyapp.com/features/live-activity/
- S5: Strong design breakdown (Screensdesign) https://screensdesign.com/showcase/strong-workout-tracker-gym-log
- S6: Strong app review (RepReturn) https://repreturn.com/strong-app-review/
- S7: Strong on the App Store (Search) https://apps.apple.com/gb/app/id464254577
- S8: Strong, rest timer listing (Search) https://spark.mwm.ai/en/apps/strong-workout-tracker-gym-log/464254577
- S9: Fitbod review summaries (Search) https://www.techradar.com/health-fitness/fitbod-app-review
- S10: Fitbod onboarding and flow (Screensdesign) https://screensdesign.com/apps/fitbod-gym-fitness-planner/
- S11: JEFIT on the App Store https://apps.apple.com/us/app/jefit-workout-planner-gym-log/id449810000
- S12: Workout tracker design patterns (Screensdesign) https://screensdesign.com/articles/workout-tracker-app-design-examples/
- S13: JEFIT user reviews (Search) https://grand-screen.com/apps/jefit-gym-workout-tracker/reviews/
- S14: Apple Fitness app summary, trends, awards (Search) https://www.tomsguide.com/news/ios-16-fitness
- S15: Apple Fitness+ on-screen metrics and Burn Bar (Search) https://support.apple.com/guide/fitness-plus/apdf8a229f34/ios
- S16: Apple Fitness+ review (Search) https://t3.com/reviews/apple-fitness-plus-review
- S17: Apple HIG, Activity rings https://developer.apple.com/design/human-interface-guidelines/activity-rings.md
- S18: Apple HIG, Workouts https://developer.apple.com/design/human-interface-guidelines/workouts.md
- S19: Nike Training Club screens (Screensdesign) https://screensdesign.com/apps/nike-training-club-wellness/
- S20: NTC onboarding teardown, Medium (Search only; page blocked) https://medium.com/@stephsutanto/nike-training-club-app-user-onboarding-teardown-66d72e29e9c9
- S21: NTC product teardown (Search) https://trailsofcuriosity.notion.site/Product-Teardown-Nike-Training-Club-Mobile-App-iOS-5e0cc8f9162c4089a5dde85f0d658f4f
- S22: NTC case study (Search) https://erin-carty.squarespace.com/ntc-case-study
- S23: Future app review (Garage Gym Reviews) https://www.garagegymreviews.com/future-app-review
- S24: Future app review (Gear Patrol) (Search) https://www.gearpatrol.com/?p=1397
- S25: Ladder screens and flow (Screensdesign) https://screensdesign.com/apps/ladder-strength-training-plans/
- S26: Ladder review, machine-written analysis, low trust (Search) https://www.sensai.fit/blog/ladder-app-review-2026
- S27: Whoop home screen post (Search only; page blocked) https://www.whoop.com/thelocker/the-all-new-whoop-home-screen
- S28: Whoop design breakdown (925 Studios) https://www.925studios.co/blog/whoop-design-breakdown
- S29: Whoop strain playbook, UX Collective (Search only; page blocked) https://uxdesign.cc/whoop-or-how-to-gamify-training-3-6-billion-product-playbook-2a1380971b88
- S30: Dark mode best practices (LogRocket) https://blog.logrocket.com/ux-design/dark-mode-ui-design-best-practices-and-examples/
- S31: Designing a dark theme for OLED iPhones (Search only; page blocked) https://medium.com/lookup-design/designing-a-dark-theme-for-oled-iphones-e13cdfea7ffe
- S32: Apple HIG, Dark Mode https://developer.apple.com/design/human-interface-guidelines/dark-mode.md
- S33: How to design for dark mode (UX Design Institute) https://www.uxdesigninstitute.com/blog/dark-mode/
- S34: Touch target sizes guide (Search) https://blog.openreplay.com/improving-tap-targets-mobile-ux/
- S35: Fitness app UX (Stormotion) https://stormotion.io/blog/fitness-app-ux/
- S36: See S12 (same page, tracker patterns list) https://screensdesign.com/articles/workout-tracker-app-design-examples/
- S37: Touch targets reference (WCAG) https://www.w3.org/WAI/GL/mobile-a11y-tf/wiki/Proposed_SC_Target_Size
- S38: Material dark theme (page returned no text) https://m2.material.io/design/color/dark-theme.html
- S39: Hevy Apple Watch/Strength UI comparison (Search) https://feedback.bevel.health/feature-requests/p/strength-trainer-ui
- S40: Fitness app design guide (Fireart) (Search) https://fireart.studio/blog/user-interface-design-for-a-fitness-app/

### Blocked or unreachable

- 403 Forbidden: whoop.com Locker posts (two pages), the LookUp Medium article.
- Could not verify domain (blocked): apple.com product page, macstories.net, medium.com (NTC teardown), uxdesign.cc.
- Returned no useful text: Material Design dark theme page.
- Apps themselves and App Store screenshots could not be viewed. Strong, Fitbod, Future, Whoop and Apple Fitness+ rest-timer, set-logging and motion details are therefore thin or marked "not found".
