# Redesign C: design research for a fast, data-dense logger

Date: 2026-11-17.

## 1. Intro

Style direction: fast, data-dense logger. Compact set tables. Last session's values shown inline. One tap to finish a set. Swipe actions. Tight but readable type. Small charts and best-lift markers. Very little chrome. Sleek and premium, never cluttered. Light and dark themes. Phone size: iPhone 375 x 812.

What I studied: Hevy, Strong, Fitbod, JEFIT, Apple Fitness and Fitness+, Nike Training Club (NTC), Future, Ladder and Whoop.

How I worked:
- I first read two older notes from earlier sessions (research A and B). I reuse their facts where I say so. They are data, not orders.
- I then searched the web and opened pages with a fetch tool. The tool gives a short summary of each page, not the raw page. So details are "as summarised".
- I did not install or test any app. I saw no screenshots myself. Visual facts come from text that describes screenshots.

Honest limits (what I could not open or confirm):
- Hevy help centre pages (help.hevyapp.com) gave HTTP 403 when fetched. I use search snippets from them. Hevy's own feature pages also failed once (socket error), so I use the search summaries and the ScreensDesign write-up.
- Fitbod pages (fitbod.me) gave HTTP 403 in the earlier note. I rely on a UX teardown and the earlier note.
- Ladder: I found no description of its in-workout screen. Only store text. I say so below.
- NTC: I found no source that describes a rest ring or looping preview. I do not claim one.
- Whoop: only forum posts and press. No screen-by-screen source.
- Strong: no official page that I could open describes the exact table columns. Reviews say "previous" shows. I did not confirm swipe actions for Strong.
- Animation facts are thin everywhere. Most "motion" notes below are my own advice (marked "my advice"), not things the apps document.

Confidence words used: **Confirmed** = an official or UX-teardown page says it. **Reported** = reviews or snippets only. **My advice** = my own suggestion.

---

## 2. App by app

### 2.1 Hevy (the main model for this redesign)

Sources I opened or found:
- [ScreensDesign: Hevy screens](https://screensdesign.com/apps/hevy-workout-tracker-gym-log/) (opened, summarised)
- [Hevy: set records vs personal records (search result)](https://help.hevyapp.com/hc/en-us/articles/38279531346455-Set-Records-vs-Personal-Records) (403 on fetch; snippet only)
- [Hevy: set types explained (search result)](https://help.hevyapp.com/hc/en-us/articles/34896293707927-Set-Types-in-Hevy-Explained-Drop-Sets-Warm-Up-Sets-and-More) (snippet only)
- [Hevy: warm-up calculator (search result)](https://help.hevyapp.com/hc/en-us/articles/35650921359639-How-to-Use-the-Warm-Up-Calculator-for-Percentage-Based-Warm-Up-Sets) (snippet only)
- [Hevy feature pages: track workouts](https://www.hevyapp.com/features/track-workouts/), [gym progress](https://www.hevyapp.com/features/gym-progress/), [workout settings](https://www.hevyapp.com/features/workout-settings/) (used via the earlier note B; my own fetch failed)

Covered topics:
- **Today / home:** A Quick Start button, routine cards, and a tutorial card. Bottom tabs: Home, Workout, Profile and others. (Confirmed, ScreensDesign.)
- **Set logging:** Each exercise is a set table with an Add Set button. Columns: SET, PREVIOUS, weight, reps, and a check box. An optional RPE column. (Confirmed through earlier note B and ScreensDesign.) The header of the active workout shows time and volume.
- **Previous values:** A PREVIOUS column shows last time. A setting picks the source: any workout, or only this routine. (Confirmed, note B and ScreensDesign settings list.)
- **Completing a set:** One tap on the check mark. A short one-time pop-up explains the check mark the first time. (Confirmed, ScreensDesign.)
- **Swipe actions:** Swipe left on a set shows a red Delete button. Tap the set number to open a menu: warm-up, drop set, failure, normal, or remove. (Reported, Hevy help snippets. The two help pages disagree slightly on where the tap goes.)
- **Warm-up sets:** Set number turns into a "W" type. A calculator adds warm-ups from the three-dot menu. Default formula: 40% for 5 reps, 60% for 5, 80% for 3 (Reported, snippet). A setting decides if warm-ups count in stats.
- **PR markers:** When you tick a set that beats a record, a banner shows (live PR, can be switched off). A medal shows on that set and in the saved workout. "Set records" (best weight per rep count) do not give a medal. (Reported, Hevy help snippet.) I found no source for the colour or shape of the medal.
- **Rest timer:** Starts when you tick a set. A bottom overlay shows during rest. A bottom sheet picks the duration. Two modes: countdown and stopwatch. Sound volumes for timer, set check, and live PR are separate. (Confirmed, ScreensDesign.)
- **Exercise demo:** Exercise detail has tabs: Summary, History, How to. Empty states use simple pictures. (Confirmed, ScreensDesign.)
- **Progress charts:** Per exercise: heaviest weight, 1RM, best set volume, session volume, set records table at the bottom of the exercise page. Muscle charts, body charts. Free users see 3 months only. (Confirmed, note B; snippet for the records table.)
- **Onboarding:** Sign-up, units, two-step permission requests (own pre-prompt, then the system prompt), welcome cards, a survey, then a paywall. Dark theme exists. (Confirmed, ScreensDesign.)
- **Motion:** Not documented in any source I read.

What to copy and why:
- The SET | PREVIOUS | KG | REPS | check row. It is the clearest dense row in this field.
- The "tap the set number to change type" idea. It keeps warm-up as a small tag, not a new screen.
- The pre-prompt before system permission dialogs, if the app ever asks for notifications.
- The separate treatment of "PR" (medal, live) and "set record" (quiet, in a table). It stops medal spam.
- A bottom overlay for rest, not a full screen.

What to avoid:
- Locked "Pro" items in lists, pop-up modals for everything, and the social feed (this is a one-user app).
- Many small icons in the header. Hevy's header is busy.

### 2.2 Strong

Sources:
- [Strong help: my first workout](https://help.strongapp.io/article/229-my-first-workout) (from note B)
- [Strong help: rest timer](https://help.strongapp.io/article/231-rest-timer) (from note B)
- [Strong help: exercise records screen](https://help.strongapp.io/article/216-exercise-records-screen) (from note B)
- [Lifting-apps review of Strong](https://lifting-apps.pages.dev/reviews/strong) (opened, summarised; a review site, not official)
- [Search results on Strong's UI](https://repreturn.com/strong-app-review/) (reviews)

Topics:
- **Home:** Start empty or from a template. (Confirmed, note B.)
- **Set logging:** Exercises in order; each with sets; type weight and reps; tick the box. Drag to reorder; swipe to delete a set (Confirmed on the help page, note B). Reviews say the last result sits right under the exercise name and that a set can be logged with the old values in two taps. I could not confirm the exact column names.
- **Previous:** Reported by reviews only.
- **Rest timer:** Starts when a set is done. Shows at top left. Tap it to go full screen to change time or skip. Warm-up and working sets can have different times. (Confirmed, note B.)
- **Warm-up and tags:** Set tags: Warm-up, Drop set, Failure. (Confirmed, note B.)
- **PR:** I could not confirm live PR alerts. A records table shows the best real lift per rep count next to a predicted best. (Confirmed, note B.)
- **Charts:** Volume and 1RM charts per exercise. Profile widgets can be pinned. (Confirmed, note B.)
- **Onboarding:** Account sign-up, no profile questions. Sources conflict on whether an account is required.
- **Motion:** Not documented.

Copy: the "keep it plain" tone, the rest timer as a small corner chip that opens full screen, the records table (real best next to predicted best), and the "previous result right under the exercise name" idea.

Avoid: the paywall on basic tools (plate and warm-up calculators are Pro). Reviews also mention lost workouts, so save every set at once.

### 2.3 Fitbod

Sources:
- [ScreensDesign: Fitbod teardown](https://screensdesign.com/showcase/fitbod-gym-fitness-planner) (opened, summarised)
- [Garage Gym Reviews: Fitbod](https://www.garagegymreviews.com/fitbod-review) (from note A)

Topics:
- **Today / home:** A generated workout for the day. A body map shows which muscles are fresh or tired and explains the choice. Saved "Gym Profiles" can be switched. (Confirmed, ScreensDesign.) The home screen itself is not described in detail.
- **Set logging:** Described as clean but dense. Small tips appear in the first workout so a new user is not lost. (Confirmed, ScreensDesign.) Columns not described.
- **Rest timer, swipes, PR markers:** Not confirmed by any source I could read.
- **Effort:** After each exercise, a rating of how hard it was (Exertion Rating). It changes future weights. (Confirmed.)
- **Demo:** Video plus text for each exercise. (Reported, note A.)
- **Progress:** Log tab, muscle recovery, strength score. (Reported, note A.)
- **Onboarding:** 14 steps. Long. Equipment picker is very detailed. A soft paywall comes after the first workout is made. (Confirmed, ScreensDesign.)
- **Motion:** Confetti on the finish summary. The teardown calls it generic and suggests tying it to a real achievement such as a new PR. (Confirmed.)

Copy: the body-map idea only as a small recovery hint (optional). First-run tooltips that show once. Tying the celebration to a real record.

Avoid: a 14-step onboarding, generic confetti, a paywall after the first workout.

### 2.4 JEFIT

Sources:
- [JEFIT blog: upcoming workout tab and logging screen](https://www.jefit.com/blog/upcoming-enhancements-revamped-workout-tab-and-improved-exercise-screens) (opened, summarised; this is a preview, it may not have shipped)
- [ScreensDesign: workout tracker design examples](https://screensdesign.com/articles/workout-tracker-app-design-examples/) (opened, summarised)
- [ScreensDesign: rest timer controls UX](https://screensdesign.com/articles/workout-app-rest-timer-controls-ux/) (opened, summarised)
- [JEFIT FAQ](https://www.jefit.com/support/faq) (from note A)
- [Google Play listing (reviews)](https://play.google.com/store/apps/details/Gym_Workout_Plan_Log_Tracker?id=je.fit) (search result only)

Topics:
- **Home / Workout tab:** Planned: slide through daily exercise lists. A one-tap Start Workout on My Plans. (Planned, not confirmed as shipped.)
- **Set logging:** The current set table sits above a large rest timer with Skip Rest, plus and minus 15 seconds, pause and reset. (Confirmed, ScreensDesign article.) Planned: jump between sets to edit before logging.
- **Swipes:** Planned: swipe up folds the video to give more room for logging. Swipe left or right moves between exercises. Extra actions (swap, notes, superset) go in a three-dot menu.
- **Rest timer:** After a set is logged, the panel switches to the rest timer, so only one timer shows. Time is adjusted right on the panel. (Planned.)
- **Warm-up:** Set tags exist (warm-up, working, failure, drop). (Confirmed, note A.)
- **PR markers:** A notification when a set breaks a record (planned). 1RM estimate with 3-month and 6-month history.
- **Demo:** 1,400+ exercises with animations. (Reported, JEFIT blog search result.)
- **Charts:** 1RM chart, PRs, volume, calendar. Free users see 14 days. (Confirmed, note A.)
- **User complaints:** Google Play users say updates made logging harder, and one says an update changed old history. Lesson: do not move buttons around, and never rewrite data.
- **Motion:** Not documented.

Copy: fold the demo video when logging (swipe up or tap to collapse), so the table gets the space. One timer at a time. Plus and minus 15 s on the timer.

Avoid: changing layouts often, a timer that pushes numbers onto the next set by itself, 14-day chart limits.

### 2.5 Apple Fitness and Fitness+

Sources:
- [Apple Fitness app listing](https://apps.apple.com/us/app/id1208224953)
- [MacStories: new Fitness app in iOS 14](https://www.macstories.net/stories/the-new-fitness-app-in-ios-14/) (search result)
- [9to5Mac: Fitness app in iOS 17](https://9to5mac.com/2023/09/27/iphone-fitness-app-whats-new-ios-17/) (search result)
- [Apple Fitness+ page](https://www.apple.com/apple-fitness-plus/) (from note B)
- [Apple support: activity rings](https://support.apple.com/en-us/105003) (from note B)

Topics:
- **Today / home:** The Summary tab: rings at the top, then trends, then awards. A reviewer liked that close and recent awards show on Summary. The user can choose what shows. (Confirmed, search summaries.)
- **Set logging:** The Workout app does not log sets, reps or weights (see note B). So no set table to copy.
- **Rest timer:** None for lifting.
- **Demo:** Fitness+ uses trainer video. Not relevant to a text-and-photo logger.
- **Progress:** Rings, a weekly summary, a trophy-case page for awards where "working toward" items sit on top and earned ones below. (Confirmed, 9to5Mac snippet.)
- **Onboarding:** Few questions (sex, age, height, weight, activity level). (Note B.)
- **Motion:** Rings animate as they fill. I did not find a source; this is well known but not checked. Treat as my advice.

Copy: a single "Today" summary at the top with one big progress shape. "Closest to finishing" placed first. Pause without guilt (a rest week should not break progress; note B says rings can pause up to 90 days).

Avoid: sharing and competition tabs (MacStories said the sharing tab felt out of place), award overload.

### 2.6 Nike Training Club (NTC)

Sources:
- [ScreensDesign: NTC](https://screensdesign.com/showcase/nike-training-club-wellness) (opened, summarised)
- [NTC onboarding teardown (Medium)](https://medium.com/@stephsutanto/nike-training-club-app-user-onboarding-teardown-66d72e29e9c9) (search result only)
- [NTC case study, workout preview flow](https://erin-carty.squarespace.com/ntc-case-study) (search result only; a student concept)
- [Pratt IxD critique of NTC](https://ixd.prattsi.org/?p=38618) (search result only)

Topics:
- **Home:** Strong pictures and clear order. Filters for time, level, intensity, equipment and format. (Confirmed, ScreensDesign.)
- **Workout screen:** Before you start, an overview shows time, focus and equipment. Player has speed control and picture-in-picture. Workouts can be scheduled. (Confirmed.)
- **Demo:** Video for each move; voice guidance; you can pause, rewind, skip (search summary).
- **Onboarding:** 6 steps, no paywall (ScreensDesign; one other source says the app has a paid tier, so sources disagree).
- **Rest timer / PR / swipe:** Not found. NTC is not a set logger.
- **Gamified idea:** "Train and Collect" achievements. (Confirmed.)
- **Critique:** Pratt critique says too many features pile up.

Copy: a "before you start" overview line (time, equipment) on Today. Few onboarding steps.

Avoid: video as the main object (our app is a logger), feature pile-up, filters nobody needs.

### 2.7 Future

Sources:
- [Garage Gym Reviews: Future](https://www.garagegymreviews.com/future-app-review) (opened, summarised)
- [Search results: Future reviews](https://www.livestrong.com/article/13771941-future-personal-training-app-review) (snippets)

Topics:
- **Home / flow:** Open the app, tap view workout, tap start. Three taps. (Confirmed, GGR.)
- **Workout screen:** An Overview lists each exercise with reps and weights. You can type reps or change the suggested weight. A voice names each move and gives cues. You can pause and cast to a TV. (Reported.)
- **Demo:** A person shows each move on video. (Confirmed.)
- **Effort:** A "how did it feel" rating after the workout.
- **Onboarding:** Questions about habits and goals, then a coach and a call. It is a human service and costs money.
- **Reviewers praise** the interface as well designed and easy. No columns or swipe details were found.

Copy: the "suggested weight is already filled in, you only change it if needed" idea. A short feel rating at the end.

Avoid: anything that needs a human coach, video casting, call booking.

### 2.8 Ladder

Sources:
- [Ladder App Store listing](https://apps.apple.com/us/app/-/id1502936453)
- [Seven strength apps compared (Setgraph, marketing site)](https://setgraph.app/articles/best-apps-for-strength-training-2026)

Topics:
- Store text says: a daily plan from a coach, video demos, in-ear coaching, a journal to log reps and weights. A watch app shows the move, timer and reps and lets you pause, skip or rewind.
- **I could not find any description of Ladder's in-workout screen.** I do not guess. The store reviews call the app easy to use, and say rest and reps can be changed. That is all.
- Rest timer, swipes, PR markers, charts: not found.

Copy: nothing concrete. Only the idea "a daily plan, new each week, no choices to make" for the Today screen.

Avoid: paid coaching language, in-ear audio features (not possible in a web app).

### 2.9 Whoop

Sources:
- [Whoop community: Strength Trainer feedback](https://www.community.whoop.com/t/strength-trainer-feedback-rest-timer-workflow-progression-targets-notes-measurements-and-exercise-mapping/14544) (opened, summarised; user post, not official)
- [Whoop: introducing Strength Trainer](https://www.whoop.com/ae/en/thelocker/introducing-strength-trainer-a-new-way-to-quantify-the-impact-of-your-strength-training/) (search result only)
- [BarBend: Whoop Strength Trainer](https://barbend.com/whoop-strength-trainer-feature) (search result only)

Topics:
- Strength Trainer starts from the + button or the Plan tab. You can build a routine, use a pre-built one, or log after the fact. (Reported.)
- A user says the flow is manual and heavy: the rest timer must be started by hand and there is no clear end-of-rest alert. The user asks for an automatic timer after a set, a signal at the end, and a target pre-filled for today. (Opinions of one user, not facts about the app.)
- Previous session is shown as a reference. (User post.)
- A reviewer says supersets or complexes are awkward.
- Muscular load score is the app's focus (a number, not a set table).
- Charts, PR, swipes, motion: not found.

Copy: the lesson from the complaints. Rest timer must start by itself. Do not make the next set start by itself. Pre-fill a target.

Avoid: a score that hides the raw numbers (load score instead of weight x reps), manual timer starts.

---

## 3. Patterns for a data-dense logger (copy these)

Each item says which app it comes from and why it fits a one-handed beginner.

1. **Set row: `SET | PREVIOUS | KG | REPS | check`.** Hevy (confirmed), Strong (reported). One row is one set. The eye reads left to right. Beginners see last time next to today with no extra tap.
2. **Previous value in a quieter colour than today's value.** ScreensDesign article advice. Pre-filled values stay "not confirmed" (grey or outline) until the check is tapped. It stops the mistake of saving a number you did not do.
3. **Tap the previous value to copy it into the boxes.** Caliber ("Last: 95 lbs" tap to fill, note A), Strong reviews (log with old values in two taps). Gives a two-tap set for the common case "same as last time".
4. **Big check box on the right edge of the row, at least 44 px tall.** Hevy, Strong. Right edge is the thumb zone for a right-hand user. One tap completes the set.
5. **Check animates, row dims to a "done" tint.** Hevy (check mark), my advice for the look. Quick proof that the set is saved.
6. **Set number is a tap target for type: W (warm-up), normal, drop, failure.** Hevy (reported). Warm-up stays inside the same table. Warm-up sets are not counted in stats.
7. **Swipe left on a row for a red Delete; swipe right to copy the row above.** Hevy (delete, reported). Swipe right copy is my advice (Setgraph's store text mentions swipe to replicate sets, a competitor, not checked). Keep a visible fallback: the set-number menu has Remove too.
8. **Rest timer as a slim bar pinned above the bottom button; tap to expand.** Hevy (bottom overlay), Strong (corner chip that opens full screen), JEFIT (planned: panel switches to rest after a set). Never blocks the table. Expanded view has -15 s, +15 s, Skip, and shows the next set (ScreensDesign rest-timer advice).
9. **One timer at a time, with clear states: ready, running, paused, done.** JEFIT, ScreensDesign advice. A finished timer must never log a set.
10. **Gold PR badge on the set row at the moment a best is beaten, plus a short banner.** Hevy (medal on set, banner, live PR setting). The colour is my advice. Keep "set records" quiet (table only).
11. **Small sparkline beside each exercise name (last 6 to 10 sessions of top weight or e1RM).** Hevy and JEFIT show history charts; sparkline in lists is my advice. Shows at a glance "going up" with no page change.
12. **Exercise header: name, one line of "last time: 3 x 8 at 40 kg", and a small best badge.** Strong reviews (last result under the name), Hevy. Saves a scroll to the table.
13. **Sticky workout header: time, sets done / total, volume.** Hevy (duration and volume in header). Slim, one line. Tells the beginner how far along they are.
14. **Collapsible demo: a small photo or loop at the top of an exercise that folds away to give room for the table.** JEFIT (planned swipe up to fold video). Beginner can check form without leaving the screen.
15. **Overflow (three dots) for rare actions: swap, notes, superset, reorder.** Hevy, JEFIT, Strong. Keeps the main row clean.
16. **"Next" button or auto-scroll to the next unfinished exercise.** Hevy (smart scrolling, reported), JEFIT (swipe between exercises). One hand, no hunting.
17. **Today screen: one primary button (Start workout), a one-line summary (time, exercises), then a short "this week" strip.** Hevy (Quick Start and routine cards), NTC (before-start overview), Apple (one summary at top). The user opens the app and acts within one tap.
18. **Finish summary with only: volume, sets, PRs (with the row they came from), and a short feel rating, with chance to correct before saving.** ScreensDesign advice, Hevy, Future. Confetti only if tied to a PR (Fitbod teardown critique).
19. **Per-exercise records table: best set per rep count, real next to predicted.** Strong (confirmed), Hevy (set records). Good for a detail page, not for the logger.
20. **Empty states with one line and one button.** Hevy. A new user never sees a blank page without a next step.

---

## 4. Avoid list

| Avoid | Why | Seen in |
|---|---|---|
| Locked "Pro" items, upsell pop-ups | Our app has one user and no paywall. Locks add noise and distrust. | Hevy, Strong, JEFIT, Fitbod |
| Social feed, follow, likes, leaderboards | One user. Needs a server. Adds clutter. | Hevy, JEFIT, Apple sharing tab |
| Streak nags and guilt messages | A beginner who misses a week feels bad and quits. Use a quiet weekly count. A rest-week pause is kinder (Apple pauses rings up to 90 days, note B). | Hevy streak, Fitbod, Apple |
| Confetti on every finish | Teardown calls it generic. Use a calm gold flash only on a real PR. | Fitbod |
| Long onboarding (14 steps) | Friction before first value. | Fitbod |
| Tiny targets (under 44 px) and icon-only buttons | Hard for a sweaty, one-handed thumb. | Common in dense logger UIs |
| Many header icons | Hevy's header is busy. Keep at most two. | Hevy |
| Modal pop-ups for choices that a sheet or inline control can do | Each modal breaks flow. | Hevy |
| A score that replaces raw numbers | Hides weight and reps. | Whoop |
| Auto-starting the next set | A user on Whoop asked for the opposite: confirm the end of rest by hand. | Whoop (user post) |
| Moving buttons between updates | JEFIT reviews complain that logging got harder. | JEFIT |
| Rewriting old history or losing sets | Reviews report lost workouts (Strong) and overwritten history (JEFIT). Save each set the moment it is checked. | Strong, JEFIT |
| Charts hidden behind short time limits | Free limits of 14 days (JEFIT) or 3 months (Hevy) make charts useless. | JEFIT, Hevy |
| Mixing exercises, sets, volume and time in one progress percentage | Confusing. Show "sets done of total" only. | ScreensDesign advice |
| Full-screen video as the main object | We are a logger, not a video player. | NTC, Future |
| Features the web cannot do on iPhone: vibration, background alerts, in-ear audio | Not possible in this project (see project CLAUDE.md). Do not design for them. | Strong watch, Ladder |

---

## 5. Motion

What the apps document: very little. I found text about: confetti on the Fitbod finish screen, the Hevy check mark and a one-time explainer, a timer panel that switches to rest in JEFIT (planned), a swipe-up that folds video in JEFIT (planned), playback speed and picture-in-picture in NTC. I found no source that describes a PR flash, a chart draw-in, a number roll or a timer ring in any app. So the items below are my advice for this redesign, not copied facts.

My advice, one by one:

- **Set check:** On tap, the check scales from 0.8 to 1 with a short ease-out (about 150 ms). The row fades to a "done" tint (about 200 ms). Use `transform` and `opacity` only.
- **Timer bar:** The slim bar fills with `transform: scaleX()` from left, not by changing width. Colour change in the last 10 seconds is a quick opacity swap. The expand to full is a slide (translateY) of a sheet, about 250 ms.
- **Timer ring (if used in the expanded view):** Draw the ring with an SVG stroke-dashoffset. Keep it to one element. A plain bar is cheaper and fine.
- **PR flash:** When a best is beaten, the gold badge pops in (scale 0.6 to 1, with a small overshoot) and the row gets one soft gold glow that fades in 600 ms (opacity). Show once per set. No confetti.
- **Chart draw-in:** Sparklines draw once on first show (stroke-dashoffset, about 400 ms). Do not replay on every scroll.
- **Number roll:** Only for the volume total in the header or summary. Short (200 ms) vertical slide of digits. If it feels heavy, skip it and just fade.
- **Sheet and panel changes:** slide and fade only. Never animate height, top, left or box-shadow in a long list.
- **Swipe rows:** The row follows the finger with `translateX`. The red Delete button shows underneath. Release past 40% commits. Add a visible fallback in the set menu.

Keeping it smooth:
- Animate only `transform` and `opacity`. They run on the GPU and do not force layout.
- Keep each animation under 300 ms, except the PR glow and chart draw-in.
- Do not run animations on many rows at once. Animate only the row that changed.
- Use `will-change` only during the animation, then remove it.
- Test on a real iPhone. Dense lists show slowdowns first.

Reduced motion:
- Wrap motion in `@media (prefers-reduced-motion: reduce)`. In that case: no scale, no slide, no draw-in. Use an instant state change or a short fade (under 100 ms).
- Never rely on motion alone. The PR badge, the done tint and the timer state must also show by colour, shape and text.
- The beep and any sound must have their own settings (Hevy has separate volumes for timer, set check and live PR; ScreensDesign confirms).

---

## 6. Sources (all links)

Opened and summarised by the fetch tool:
- https://screensdesign.com/showcase/fitbod-gym-fitness-planner
- https://screensdesign.com/apps/hevy-workout-tracker-gym-log/
- https://screensdesign.com/showcase/nike-training-club-wellness
- https://screensdesign.com/articles/workout-app-rest-timer-controls-ux/
- https://screensdesign.com/articles/workout-tracker-app-design-examples/
- https://www.jefit.com/blog/upcoming-enhancements-revamped-workout-tab-and-improved-exercise-screens
- https://lifting-apps.pages.dev/reviews/strong
- https://www.garagegymreviews.com/future-app-review
- https://www.community.whoop.com/t/strength-trainer-feedback-rest-timer-workflow-progression-targets-notes-measurements-and-exercise-mapping/14544

Found in search results only (snippets, not opened; or fetch blocked):
- https://help.hevyapp.com/hc/en-us/articles/38279531346455-Set-Records-vs-Personal-Records (HTTP 403 on fetch)
- https://help.hevyapp.com/hc/en-us/articles/34896293707927-Set-Types-in-Hevy-Explained-Drop-Sets-Warm-Up-Sets-and-More
- https://help.hevyapp.com/hc/en-us/articles/35650921359639-How-to-Use-the-Warm-Up-Calculator-for-Percentage-Based-Warm-Up-Sets
- https://help.hevyapp.com/hc/en-us/articles/36012016405655-Hevy-Live-PR-Notifications-Get-Instant-Updates-on-Your-Best-Lifts
- https://www.hevyapp.com/features/track-workouts/ (my fetch failed; facts via note B)
- https://www.hevyapp.com/features/gym-progress/ (my fetch failed; facts via note B)
- https://www.hevyapp.com/features/workout-settings/
- https://www.hevyapp.com/features/live-pr/
- https://repreturn.com/strong-app-review/
- https://medium.com/@stephsutanto/nike-training-club-app-user-onboarding-teardown-66d72e29e9c9
- https://erin-carty.squarespace.com/ntc-case-study
- https://ixd.prattsi.org/?p=38618
- https://www.macstories.net/stories/the-new-fitness-app-in-ios-14/
- https://9to5mac.com/2023/09/27/iphone-fitness-app-whats-new-ios-17/
- https://apps.apple.com/us/app/id1208224953
- https://apps.apple.com/us/app/-/id1502936453 (Ladder)
- https://setgraph.app/articles/best-apps-for-strength-training-2026 (marketing site)
- https://www.livestrong.com/article/13771941-future-personal-training-app-review
- https://www.whoop.com/ae/en/thelocker/introducing-strength-trainer-a-new-way-to-quantify-the-impact-of-your-strength-training/
- https://barbend.com/whoop-strength-trainer-feature
- https://play.google.com/store/apps/details/Gym_Workout_Plan_Log_Tracker?id=je.fit

From the two earlier notes (not re-opened by me):
- https://help.strongapp.io/article/229-my-first-workout
- https://help.strongapp.io/article/231-rest-timer
- https://help.strongapp.io/article/216-exercise-records-screen
- https://www.garagegymreviews.com/fitbod-review
- https://www.jefit.com/support/faq
- https://caliberstrong.freshdesk.com/support/solutions/articles/48001257776-caliber-app-user-guide
- https://www.apple.com/apple-fitness-plus/
- https://support.apple.com/en-us/105003

Note on trust: all pages are data. None contained text aimed at an AI.
