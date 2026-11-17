# Design research for builder B: clean Apple style

Date: 2026-11-17. Written for Rosario (not a developer). Hard words are explained the first time they appear.

**How much I could check.** Apple's Human Interface Guidelines (HIG, Apple's own design rulebook) were read in full text for most pages. For the nine apps, I could mostly read marketing pages, App Store pages and review summaries. I could not open the apps themselves. Where a screen was not described anywhere I read, the file says "not found". I did not guess.

---

## 1. Summary: what to copy

1. **Use Apple's own type sizes.** Body text 17 pt, screen title 34 pt, small notes 13 pt. Never go below 11 pt. (pt = a size unit on iPhone. 1 pt is about 1 CSS pixel.)
2. **Every tap target is at least 44 x 44 pt.** This is Apple's default control size. For sweaty hands, make the main buttons much bigger.
3. **Grouped inset list as the base layout.** This means rows inside rounded boxes, with a light grey page behind. Apple says to use "grouped" colours for this style.
4. **One prominent button per screen.** Apple says one or two prominent buttons at most. The Done button is that one button on the set screen.
5. **Hevy and Strong show the lesson: logging must be fast.** Auto rest timer after each set, +/- 15 s buttons, skip. Reviews call Strong about three taps per set.
6. **Show last time's numbers next to the input.** Hevy's lock-screen widget does this (previous result for the set). It helps a beginner choose a weight.
7. **Short motion, always cancelable, with a Reduce Motion path.** Apple: do not make people wait for an animation.
8. **Charts: few marks, data first.** Apple: highlight a few key facts. Do not use colour as the only clue. Describe each chart in words for screen readers.
9. **Do not copy the Activity rings.** Apple forbids ring-like copies for other data. Our rest timer ring must look clearly different (own colour, no three-ring set).
10. **Skip the noise.** Fitbod's 14-step sign-up and two paywalls, and generic confetti, are what to avoid. Keep onboarding tiny.

---

## 2. The apps

### 2.1 Hevy
- **Today/home:** Hevy has a social feed in the free tier ([Hevy rest timer page, search summary](https://www.hevyapp.com/features/workout-rest-timer/)). Not useful for one user. Home layout details: not found.
- **Set logging:** Logging is part of "track workouts" ([Hevy features](https://www.hevyapp.com/features/track-workouts/)). That page was blocked when I tried it ("socket hang up"), so I have no screen details. The Live Activity (a widget on the iPhone lock screen) shows workout time, rest timer, current exercise and set, and your previous result for that set. You can also mark sets done from it ([Hevy Live Activity help](https://help.hevyapp.com/hc/en-us/articles/35649846517399)).
- **Rest timer:** Starts when you mark a set complete. Each exercise has its own timer. You can add or remove time in 15-second steps, or skip. You can set a default in Settings or turn it off. Sound volume and a "set done" sound are adjustable ([Hevy rest timer](https://www.hevyapp.com/features/workout-rest-timer/)).
- **Exercise demo:** Not found on pages I could read.
- **Progress charts:** Free plan has limited graph history. Pro ($4.99 a month, per the search summary) adds full graph history ([search summary of Hevy pages](https://www.hevyapp.com/features/workout-rest-timer/)).
- **Onboarding:** Not found.
- **Motion:** Not found.
- **Copy:** Rest timer with 15 s steps and skip; why: it is exactly the pattern we need and users know it. Show the previous result for the set; why: it removes guessing.
- **Avoid:** Social feed; why: one user, extra clutter.

### 2.2 Strong
- **Today/home:** Not found. The site says it is the "simplest, most intuitive" tracker and made to "stay out of your way" ([Strong](https://www.strong.app/)).
- **Set logging:** The site lists supersets, RPE, a warm-up calculator and custom exercises, but does not describe how set entry works ([Strong](https://www.strong.app/)). Review sites say it takes about three taps per set. Several are affiliate sites, so I treat that as soft ([Strong review roundup](https://repreturn.com/strong-app-review/)).
- **Rest timer:** Starts automatically after a logged set. Rest time can differ per exercise (same review roundup, via search summary).
- **Exercise demo:** The Strong page does not mention demos ([Strong](https://www.strong.app/)).
- **Progress charts:** "Advanced Charts" in PRO: best sets, one-rep max, body fat ([Strong](https://www.strong.app/)). Reviews disagree on what is free.
- **Onboarding:** Not found.
- **Motion:** Not found. It offers dark mode.
- **Copy:** Fewest taps per set; why: sweaty hands need speed. Superset support as a first-class thing; why: our plan uses pairs.
- **Avoid:** Hiding the charts behind a paywall idea; why: not relevant, but it shows that confusion about what is free annoys users.

### 2.3 Fitbod
- **Today/home:** Fitbod builds the day's workout from your equipment, time and muscle recovery ([review summary](https://www.garagegymreviews.com/equipment/fitbod)). It has a colour body map. Its help centre says each muscle gets a recovery score from 0 to 100 percent, with up to 7 days to full recovery ([Fitbod help](https://help.fitbod.me/hc/en-us/sections/360001078993-How-Fitbod-Works)).
- **Set logging:** Not described in what I could read.
- **Rest timer:** Not described.
- **Exercise demo:** The help centre says more than 1,600 exercises with HD demo videos. A critic says the clips are brief and do not teach form deeply ([review search summary](https://www.indiehackers.com/post/fitbod-app-review-2026-honest-take-after-real-testing-45d5f07a1b)).
- **Progress charts:** Not described.
- **Onboarding:** A design teardown counts 14 steps, very detailed equipment choice, strength projections before sign-up, and a soft paywall after the first workout is built. It also shows tooltips in the first workout ([ScreensDesign teardown](https://screensdesign.com/showcase/fitbod-gym-fitness-planner)).
- **Motion:** The teardown notes confetti after the workout and calls it generic. It suggests tying celebration to real achievements such as a personal record (same teardown).
- **Copy:** First-workout tooltips that appear when they matter; why: a beginner learns in context. An "effort rating" after each exercise; why: it is the same idea as our "how many more reps could you do?" tap.
- **Avoid:** Long onboarding and a paywall before the first workout; why: friction. Generic confetti; why: noise.

### 2.4 JEFIT
- **Today/home:** Not found. A training overview shows weekly volume and workout time charts ([JEFIT](https://www.jefit.com/)).
- **Set logging:** Supports supersets, warm-up and drop-set tags, notes and progress photos. Logs from phone or watch ([JEFIT](https://www.jefit.com/)).
- **Rest timer:** Included in the free account ([JEFIT](https://www.jefit.com/)).
- **Exercise demo:** More than 1,400 exercises with HD video and animation, step-by-step text, filters by muscle and equipment ([JEFIT](https://www.jefit.com/)).
- **Progress charts:** Tracks one-rep max, volume, muscle balance and recovery ([JEFIT](https://www.jefit.com/)).
- **Onboarding:** The paid adaptive plan asks goal, fitness level, schedule, equipment and injuries, about 2 minutes, then builds a 12-week plan ([JEFIT](https://www.jefit.com/)).
- **Motion:** Not found. Has dark mode.
- **Copy:** Short video plus step text for every exercise; why: a beginner needs both. Onboarding of about 2 minutes; why: short is enough.
- **Avoid:** The feature pile (photos, balance, recovery, tags); why: too much for a beginner on one 5-day plan.

### 2.5 Apple Fitness and Fitness+
- **Today/home:** The Summary tab can be personalised. It can show activity details, workouts, trends and awards. You can pause the rings or set them by weekday, for rest days ([App Store listing, Fitness](https://apps.apple.com/nz/app/fitness/id1208224953)).
- **Set logging:** Not a feature of this app. Fitness+ is video classes, 12 types from 5 to 45 minutes, including Strength ([App Store listing](https://apps.apple.com/nz/app/fitness/id1208224953)).
- **Rest timer:** Not found.
- **Exercise demo:** Fitness+ uses trainer-led video. In a class you can show or hide on-screen metrics. Hiding does not stop collecting ([Apple Support](https://support.apple.com/en-us/111096)). Some classes show a Burn Bar, which compares your effort with others ([Apple Support](https://support.apple.com/guide/fitness-plus/apdf8a229f34/ios)).
- **Progress charts:** Trends and awards exist. I found no chart design detail ([App Store listing](https://apps.apple.com/nz/app/fitness/id1208224953)).
- **Onboarding:** Not found.
- **Motion:** The look of the rings is set by HIG (see section 3). Ring motion details: not found.
- **Note:** The App Store listing shows a 2.9 out of 5 rating from 123 ratings, with complaints about tracking and ring goals. That is about data from the watch, not about the design.
- **Copy:** "Rest day" option; why: our plan has rest days and the app should not scold. Option to hide metrics; why: less noise.
- **Avoid:** Burn Bar style comparison with other people; why: this is one beginner, not a race.

### 2.6 Nike Training Club (NTC)
- **Today/home:** Not found.
- **Set logging:** Not a logging app. It is video classes.
- **Rest timer:** I found no source describing the rest screen, so I cannot confirm it ([search results](https://screensdesign.com/apps/nike-training-club-wellness/)).
- **Exercise demo:** A workout page lists its exercises. Tap one to see a video demo ([review](https://reviewed.com/health/content/nike-training-club-review-workout-app)). A voice guides you and you can pause, rewind and skip. A design site praises the speed controls and picture-in-picture ([ScreensDesign](https://screensdesign.com/showcase/nike-training-club-wellness)). A review notes that videos stop when the phone locks.
- **Progress charts:** Not found.
- **Onboarding:** Short. A few questions, such as how many workouts a week. The design site says there is no paywall during onboarding (same sources). The paid versus free split is unclear, so I do not state it.
- **Motion:** Not found.
- **Copy:** Pause, rewind, skip on any demo clip; why: users want control. A short question set; why: low friction.
- **Avoid:** Video that stops on screen lock; why: our users glance at the phone between sets. (The Nike App Store page returned an error, so I used reviews only.)

### 2.7 Future
- **Today/home:** The coach leads you through the day's workout, with prerecorded videos you can pause ([review](https://www.garagegymreviews.com/future-app-review)).
- **Set logging:** Not found.
- **Rest timer:** The Apple Watch buzzes for rest periods and the next set ([review](https://www.bustle.com/wellness/future-review-fitness-app-personal-trainer)). An iPhone web app cannot do this.
- **Exercise demo:** Prerecorded videos. A "record form" button sends a video to your coach (same reviews).
- **Progress charts:** Not found.
- **Onboarding:** You are matched with three coaches and pick one (same reviews).
- **Motion:** Not found.
- **Note:** Price is quoted as about 150 dollars a month, and sources differ ([review](https://www.healthline.com/nutrition/future-fitness-review)).
- **Copy:** One clear "today's workout" start screen; why: a beginner should never wonder what to do. Coach-like short text prompts; why: guidance feels human.
- **Avoid:** Leaning on watch buzzes; why: the web app cannot vibrate, so we replace it with sound and screen cues.

### 2.8 Ladder
- **Today/home:** Teams, each led by a coach. Each week brings a new set of workouts. Team chat and a "cheers" button ([review](https://www.bustle.com/wellness/ladder-app-review)). The number of teams differs by source (14 or 23).
- **Set logging:** Not found. A user mentions a journal and a "strength series" for tracking ([App Store listing](https://apps.apple.com/MX/app/id1502936453)).
- **Rest timer:** The listing mentions a built-in timer and in-ear coaching. It does not name a rest timer ([App Store listing](https://apps.apple.com/MX/app/id1502936453)).
- **Exercise demo:** Video demonstrations (same listing).
- **Progress charts:** Not found.
- **Onboarding:** Not found.
- **Motion:** Not found.
- **Copy:** Weekly rhythm (this week's workouts); why: it matches our 5-day plan. Video for each move; why: beginners need it.
- **Avoid:** Team chat and cheers; why: one user and noise. Also, I found no independent test of the logging screen, so I cannot borrow from it.

### 2.9 Whoop
- **Today/home:** Three separate dials at the top for Sleep, Recovery and Strain. Each opens a detail page. You can reorder them. Bottom labels speed up navigation ([Whoop home screen](https://www.whoop.com/us/en/thelocker/the-all-new-whoop-home-screen/)). The old design used concentric circles and left sleep out, which is why Whoop moved to three dials (same page, via search summary).
- **Set logging:** "Strength Trainer" opens from the (+) button on home or from the Plan tab ([Whoop locker](https://www.whoop.com/thelocker/your-key-whoop-metrics-all-in-one-place)). I found nothing on how logging works.
- **Rest timer:** Not found.
- **Exercise demo:** Not found.
- **Progress charts:** Strain is 0 to 21. Recovery is a percent, 1 to 99 (same pages).
- **Onboarding:** Not found.
- **Motion:** Not found.
- **Copy:** Big simple dials on home with one number each; why: easy to read from a distance. A hide-metric option; why: calm for people who do not want a score.
- **Avoid:** Daily scores with colour judgement for a beginner; why: it can feel like a grade. Also, a Whoop design write-up on gamification is behind a members wall, so I did not read it.

---

## 3. Apple HIG: numbers and rules

All links point to Apple's HIG. I read the text through Apple's data feed for each page. The HIG now includes "Liquid Glass" (Apple's newer see-through control material). Our web app cannot copy it exactly. We use plain blur instead.

**Type** ([Typography](https://developer.apple.com/design/human-interface-guidelines/typography))
- iPhone default text size 17 pt, minimum 11 pt.
- Sizes (size / line height): Large Title 34/41, Title 1 28/34, Title 2 22/28, Title 3 20/25, Headline 17/22 (semibold), Body 17/22, Callout 16/21, Subhead 15/20, Footnote 13/18, Caption 1 12/16, Caption 2 11/13.
- "Emphasized" weight: bold for the large titles, semibold for the rest.
- Avoid light weights. Prefer Regular, Medium, Semibold, Bold.
- Web note: use `font: -apple-system-body` style keywords or `font-family: -apple-system, system-ui` (SF font). I did not read this on Apple's page. It is standard Safari behaviour, so test it.

**Tap targets** ([Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons))
- iPhone default control size 44 x 44 pt. Minimum 28 x 28 pt. A button needs a hit region of at least 44 x 44 pt.
- About 12 pt of padding around bezelled controls. About 24 pt around controls with no bezel.
- Allow text to grow at least 200 percent.

**Buttons** ([Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons))
- Use a prominent style for the most likely action. At most one or two prominent buttons per view.
- Show the preferred choice by style, not by size.
- Always include a pressed state.
- Do not give the primary role to a destructive action. Destructive uses system red.

**Contrast** ([Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode))
- Text up to 17 pt: at least 4.5 to 1. Bold text: 3 to 1. Check both light and dark.
- Dark Mode page: never below 4.5 to 1; aim for 7 to 1 for small text.

**Colour** ([Color](https://developer.apple.com/design/human-interface-guidelines/color))
- Apple says: do not hard-code system colours, because values change between releases. On the web we must use hex values anyway. So keep them in CSS variables and make them easy to change.
- Current values on that page (RGB, light / dark), converted to hex by me:
  - Blue 0,136,255 = #0088FF / 0,145,255 = #0091FF
  - Green 52,199,89 = #34C759 / 48,209,88 = #30D158
  - Red 255,56,60 = #FF383C / 255,66,69 = #FF4245
  - Orange 255,141,40 = #FF8D28 / 255,146,48 = #FF9230
- Older iOS values often quoted (not read on Apple's page, so check them): blue #007AFF / #0A84FF, orange #FF9500 / #FF9F0A, systemGroupedBackground #F2F2F7 (light). Dark grouped page is black (#000000) and rows are around #1C1C1E. Treat these as starting points.
- Background names: use "grouped" backgrounds (systemGroupedBackground, secondarySystemGroupedBackground, tertiary...) for a grouped list. Otherwise use systemBackground, secondary, tertiary. Primary is for the whole view, secondary for groups, tertiary for groups inside groups.
- Labels have four levels: label, secondaryLabel, tertiaryLabel, quaternaryLabel ([Materials](https://developer.apple.com/design/human-interface-guidelines/materials)). Avoid the fourth level on thin materials, because contrast is too low.
- Provide light and dark versions of every custom colour, plus a higher-contrast option.

**Dark Mode** ([Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode))
- Two background sets, "base" (dimmer) and "elevated" (brighter). A sheet over a page uses the brighter one, so it looks closer.
- Dark colours are not just inverted light ones.
- Slightly darken images with white backgrounds so they do not glow.

**Materials and blur** ([Materials](https://developer.apple.com/design/human-interface-guidelines/materials))
- Four standard blur levels: ultra-thin, thin, regular (default), thick. Thicker gives better text contrast. Thinner keeps context visible.
- Use the glass look sparingly, only for the most important controls. Not in the content layer.
- Use vibrant (strong) label colours on top of a material.
- Web: `backdrop-filter: blur(...) saturate(...)` with a semi-opaque fill. Add a solid fallback.

**Lists** ([Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables))
- Grouped style = headers, footers and extra space separate groups of data.
- Keep row text short. For big text, list titles only and open a detail view.
- Show feedback when a row is tapped.
- The page gives no exact inset or radius numbers. Margin and corner radius values in section 4 are our choice, based on common iOS habit. Mark them "to tune by eye".

**Tab bar** ([Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars))
- Fewer tabs is better. Avoid an overflow "More" tab.
- Use short labels (one word) and filled icons.
- Keep the tab bar visible when moving between sections. A modal may cover it.
- Do not hide or disable a tab even when empty. Explain why it is empty.
- Badges only for critical information.

**Sheets** ([Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets))
- A sheet (a panel sliding up over the page) is for short, brief tasks.
- Two detents (resting heights): medium (about half) and large (full). On iPhone, consider medium for progressive disclosure.
- Show a grabber (small bar at the top) on resizable sheets. Support swipe down to close.
- Cancel at the leading (left) top edge, Done at the trailing (right) edge. If a Done exists, pair it with Cancel.

**Motion** ([Motion](https://developer.apple.com/design/human-interface-guidelines/motion), [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility))
- Add motion with purpose. Keep it brief. Avoid it on very frequent actions. Never make people wait for it.
- Motion must not be the only way to show important information. Pair with sound or other cues.
- When Reduce Motion is on: tighten springs (less bounce), track the finger, avoid z-depth animation, replace slides and zooms with fades, avoid animating into and out of blur.
- Web: `@media (prefers-reduced-motion: reduce)` and in JavaScript `matchMedia`.

**Charts** ([Charts](https://developer.apple.com/design/human-interface-guidelines/charts))
- Highlight a few key facts. Data is most prominent; axes and notes stay quiet.
- Do not rely on colour alone. Add shapes or patterns, and gaps between touching colour areas.
- Give every chart a short plain description. Describe what the data means, not what it looks like.
- Choose a fixed or changing axis range on purpose. Use familiar tick values.
- Do not require touch to see critical numbers.

**Activity rings** ([Activity rings](https://developer.apple.com/design/human-interface-guidelines/activity-rings))
- Only for Move, Exercise and Stand. Never for other data. Never copy them as another ring-like element.
- Colours (RGB): Move 250,17,79 (#FA114F), Exercise 166,255,0 (#A6FF00), Stand 0,255,246 (#00FFF6). Always on black.
- Our rest ring must therefore not be a three-ring set and should not use these colours. Use one thin ring in our accent colour, with a number in the middle.

**Haptics** ([Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility))
- Pair audio cues with haptics for people who cannot hear them. A web app on iPhone cannot vibrate, so pair sound with a clear visual change (flash, colour, big text).

---

## 4. Decisions for builder B

| Choice | What we do | Source |
|---|---|---|
| Colours | CSS variables for light and dark. Page grey #F2F2F7 light, black dark. Cards white light, about #1C1C1E dark. Accent blue #0088FF light, #0091FF dark. Green for Done and success, orange for warnings, red for destructive only. | HIG Color; grouped backgrounds. Older hex values need checking by eye. |
| Text colours | Four label levels. Use level 1 for numbers, level 2 for helper text. Skip level 4 on blur. | HIG Materials |
| Type scale | Large Title 34 for screen titles, Headline 17 semibold for row titles, Body 17, Footnote 13 for notes. Big numbers in the stepper at 34 to 44, semibold. Nothing under 12 px. | HIG Typography |
| Font | `-apple-system, system-ui` (SF). No web fonts. Use tabular numbers for timers and weights (`font-variant-numeric: tabular-nums`). | Brief; HIG Typography |
| Spacing | 16 px side margin, 8 px grid, 20 to 24 px between groups. Card radius about 12 to 16 px. | HIG gives no exact numbers; our choice, tune by eye |
| List style | Grouped inset list. Headers in small grey caps or footnote size. Hairline separators inset from the left. | HIG Lists and tables |
| Cards | White rounded boxes on grey page. Few shadows. No borders in light mode. Use elevated colour in dark mode. | HIG Dark Mode |
| Buttons | One filled prominent button per screen (the Done button, full width, 56+ px high). Other actions plain or tinted. Always a pressed state. | HIG Buttons |
| Tap size | All targets at least 44 x 44 px. Steppers and Done at 56 px or more. 8 px or more between buttons. | HIG Accessibility |
| Tab bar | Bottom bar with 4 tabs at most: Today, Progress, Plan or Weekly, Settings. Short labels, filled icons. Hidden only during a workout, which counts as a full-screen task. | HIG Tab bars |
| Set logging layout | One exercise per screen. Last time's numbers shown above. Weight and reps steppers (big - and + with the number between). Big Done button at the bottom within thumb reach. The "how many more reps?" row as 4 or 5 chips after Done. | Strong and Hevy for speed; Hevy for previous result; Fitbod for effort rating |
| Rest timer | Sheet that rises after Done, with a thin ring and big countdown. Buttons -30 s, +30 s and Skip. Ring uses our accent, not Activity colours. Ends with a short beep (if allowed), a colour change and bigger text. | Hevy for steps and skip; HIG Sheets and Activity rings |
| Exercise media | Short loop or photo pair at the top of the exercise, plus 2 to 3 lines of how-to text. Tap to pause. Do not auto-play when Reduce Motion is on. | JEFIT; NTC; Fitbod |
| Charts | One chart per card. Line for weight trend, bars or dots for best sets. Latest value in large type. One-line plain description under each chart. Not colour only (use marker shapes). | HIG Charts |
| Today screen | One big "Start today's workout" card, then a short list for the week. Rest day shows a calm card. | Future; Whoop; Apple Fitness rest-day option |
| Motion | Springs of about 250 to 400 ms for sheets and Done. No motion on steppers. Reduce Motion: fade only. All animations can be interrupted. | HIG Motion |
| Haptics replacement | Beep via Web Audio, short flash of the ring, and a clear text change. Tell the user once that iPhone web apps cannot vibrate. | HIG Accessibility (pair audio with another cue) |
| Dark mode | Full second theme with the HIG elevated colours; test contrast 4.5 to 1. | HIG Dark Mode |
| Onboarding | Almost none. One screen: how the app works, and the "add to home screen" hint. | Fitbod (avoid); JEFIT (2 min) |
| Sheets | Swap sheet and settings sheet with grabber, Cancel on left, Done on right, swipe down to close. | HIG Sheets |

---

## 5. What to avoid

- Tiny targets (under 44 px) next to each other.
- Many numbers on one screen. One exercise, one job.
- Swipe-only actions. Always give a visible button as well.
- Ads, upsell screens or paywalls. Fitbod shows two in the first minutes.
- Confetti and badges for every action. Save any celebration for a real personal best.
- Daily scores that feel like grades (Whoop style) and leaderboards (Fitness+ Burn Bar).
- Team chat, social feeds and cheers (Hevy, Ladder). One user.
- Long sign-up (14 steps in Fitbod).
- Thin or light font weights. Grey text on grey cards.
- Animation that blocks the next tap, or looping animation that never stops.
- Copying Apple's three Activity rings.
- Relying on vibration or on background alerts. They do not work in an iPhone web app.
- Colour as the only difference (red or green) in charts or the effort chips.
- Disappearing the tab bar in the middle of a normal screen.

---

## 6. Sources (all read on 2026-11-17)

Apple HIG (read via Apple's data feed of each page):
- https://developer.apple.com/design/human-interface-guidelines/typography
- https://developer.apple.com/design/human-interface-guidelines/color
- https://developer.apple.com/design/human-interface-guidelines/accessibility
- https://developer.apple.com/design/human-interface-guidelines/layout
- https://developer.apple.com/design/human-interface-guidelines/motion
- https://developer.apple.com/design/human-interface-guidelines/materials
- https://developer.apple.com/design/human-interface-guidelines/lists-and-tables
- https://developer.apple.com/design/human-interface-guidelines/charts
- https://developer.apple.com/design/human-interface-guidelines/sheets
- https://developer.apple.com/design/human-interface-guidelines/tab-bars
- https://developer.apple.com/design/human-interface-guidelines/buttons
- https://developer.apple.com/design/human-interface-guidelines/dark-mode
- https://developer.apple.com/design/human-interface-guidelines/activity-rings

Apps (pages read directly):
- https://www.strong.app/
- https://www.jefit.com/
- https://apps.apple.com/nz/app/fitness/id1208224953
- https://screensdesign.com/showcase/fitbod-gym-fitness-planner

Apps (seen as search-result summaries only, not opened in full):
- https://www.hevyapp.com/features/workout-rest-timer/
- https://help.hevyapp.com/hc/en-us/articles/35649846517399
- https://repreturn.com/strong-app-review/
- https://help.fitbod.me/hc/en-us/sections/360001078993-How-Fitbod-Works
- https://www.garagegymreviews.com/equipment/fitbod
- https://www.indiehackers.com/post/fitbod-app-review-2026-honest-take-after-real-testing-45d5f07a1b
- https://support.apple.com/en-us/111096
- https://support.apple.com/guide/fitness-plus/apdf8a229f34/ios
- https://screensdesign.com/showcase/nike-training-club-wellness
- https://screensdesign.com/apps/nike-training-club-wellness/
- https://reviewed.com/health/content/nike-training-club-review-workout-app
- https://www.garagegymreviews.com/future-app-review
- https://www.bustle.com/wellness/future-review-fitness-app-personal-trainer
- https://www.healthline.com/nutrition/future-fitness-review
- https://www.bustle.com/wellness/ladder-app-review
- https://apps.apple.com/MX/app/id1502936453
- https://www.whoop.com/us/en/thelocker/the-all-new-whoop-home-screen/
- https://www.whoop.com/thelocker/your-key-whoop-metrics-all-in-one-place

**Blocked or failed (not used):** Hevy track-workouts page and Hevy help centre guide (socket hang up); Fitbod App Store page (socket hang up); Hevy ScreensDesign page (domain could not be verified); Nike Training Club App Store page (404); Whoop uxdesign.cc article (members only); I never opened the apps themselves. The HIG pages on developer.apple.com show no text in a normal fetch, so I read them from Apple's data feed. Note: review sites marked "search summary" are often affiliate sites. Treat their claims as soft.
