# Redesign A proposal: dark premium sport

Date: 2026-11-17. Builder A (task chat 8.19). Research: [RESEARCH.md](RESEARCH.md). Media: [MEDIA.md](MEDIA.md). Screens: `screens/` (37 screens, each `-dark` and `-light`, 375 x 812 at 2x; `-full` = whole scrolled page).

## 1. Style in one line
Near-black canvas, heavy bold numbers, ONE volt-yellow accent kept for progress and the main action, glowing rings in dark mode, short "cinematic" motion. Light mode: white cards, black main button with volt text.

## 2. Tokens
- Dark: canvas #08090c, cards #121419, raised #1a1d24, text #f5f6f8, muted #a0a6b2, accent volt #d7ff3c (text on it #0a0b0d). Light: canvas #f2f3f5, cards #fff, text #0b0c0f, muted #545a66, accent graphics #5a8f00, accent text #3f6b00, main button #0b0c0f with volt text.
- Status (always with words): success, warning amber, error coral. Contrast not machine-checked yet (see section 6).
- Type: system font only. Display numbers 800 weight with tight tracking (timer 92 px, steppers 42 px, h1 32 px); small caps "eyebrow" labels.
- Shape: radius 14 inputs, 16 buttons, 20 cards, 24 hero cards. Main button 58 px. Glass blur on bottom bars.
- Motion (CSS + Web Animations, transform/opacity only; all off with Reduce Motion): screen slide-in only on a NEW screen; set tile pops and turns volt on Done; ring empties smoothly with a breathing glow; 12-week bar grows in; numbers count up on Finish; chart line draws in; sheets slide up; "Go" flash scales in.

## 3. Screens (see `screens/`)
01 first start (photo hero) · 02 intake (progress bar) · 03 targets · 04 Today (week bar, photo hero of the day's exercises, block timeline, Mon-Fri strip, tiles) · 05-07 walk (treadmill photo, speed/slope tiles, ring, result) · 08 change-over · 09 lift warm-up (each move with moving photo, tap for info) · 10-11, 14 pair (moving photo with Tips / Video / Swap on it, target, last time, "where it is" line, set tiles, steppers, next exercise card) · 12 "how many more" · 13 rest (full ring, round -30/+30, next with photo) · 15 exercise info (big flip-book, start/end photos, tips, Watch video, machine row, settings note) · 16 machine card · 17-18 swap · 19 end sheet · 20 finish (ring draws, counters) · 21 Today after save · 22 weigh-in · 23 progress (glowing chart with fill, exercise rows with photos and bests) · 24 weekly · 25 plan (tap any exercise for photos and video; Machines button) · 26 settings (new "Look": Auto/Light/Dark) · 27-28 machines list and first-visit "where" entry · 29 week 1 learn · 30 rest day.

## 4. Taken from
Whoop / Apple Fitness: dark canvas, one accent, glowing rings. Nike Training Club: volt-on-black, bold type, photo heroes. Hevy / Strong: last time on the set screen, rest timer with next set, set state at a glance. Fitbod / JEFIT: exercise demo on the exercise screen, machine pictures. Details per app in RESEARCH.md.

## 5. Data and tests
- New saved data: `machine_notes` list (one record per machine, id `g-<machine>`), additive. Tests first (commit fc6d754), then the change (71ba4dd). Old data and files load unchanged; merge, sync, backup, restore and the validator handle it. One of my own new tests was changed before the code commit: it first expected the validator to add an empty list, which broke the existing "valid document comes back unchanged" test; the code now leaves a missing list missing.
- Engine, sync, store and validator logic unchanged except that list. Theme choice is device-only (`trn.device.v1.theme`).
- `node --test`: 268 pass, 0 fail (246 old + 16 machine-note + 6 media tests).
- Size of `app/`: 287 KB before, 5.7 MB after (5.3 MB photos). All precached by `sw.js` for offline (version 0.4.0-a).

## 6. Not checked
Real iPhone (Safari, home screen, wake lock, sound, safe areas); text one step larger; 320 px width; landscape; WCAG contrast numbers for the new colours; print of the plan sheet with thumbnails hidden; the videos' content beyond title and channel; timing smoothness on a real phone.
