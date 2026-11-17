# Judge 3: exercise media and finding machines

Lens: exercise photos, start/end loop, video links, machine cards and the "Where it is in my gym" note, photo size.
Date: 2026-11-17. Judge 3 of 4. I only read and ran things. No app code was changed.

## 1. What I did

- **Tests:** `node --test` in each build: A 268 pass / 0 fail, B 260 / 0, C 268 / 0, D 263 / 0.
  - Media tests: A has 6 (every move has a picture, every file exists and is a JPEG, every exercise has a machine, every extra machine has a card, a video per exercise). C has 4 (same idea). **B and D have no media tests** (only tests for the saved where-note).
  - My own check (script in my scratchpad, all 4 builds): every plan exercise (36), warm-up move and the walk has photos or a drawing, every photo file exists, every exercise has a valid machine, every machine photo exists, every plan exercise has a video, and `sw.js` precaches all photos. **All 4 pass.**
- **Images viewed:** every exercise where builds chose different library entries (7 exercises, 15 photo pairs), plus 15 shared pairs (chest press, pulldown, cable crunch, Romanian deadlift, face pull, hip thrust, overhead triceps, pull-through, standing calf raise, cable lateral raise, Smith squat, pushdown, seated cable row, calf machine, walk). Also one extra library entry (Machine_Bench_Press).
- **Videos:** all 103 distinct links across the 4 builds read through YouTube oEmbed (title, channel) plus the watch page (length). All 103 answer. I did not watch the videos.
- **Live screens (built-in browser, 375 x 812, light and dark, made-up setup values only):** B plan > Machines list, machine card with quick words, where-note saved and shown, exercise sheet (light + dark); A machines list and machine card, exercise info sheet (dark); C Gym tab, machine card, exercise sheet (portrait photo); D Gym tab and machine card. Set and rest screens were judged from the builders' own screenshots and the code (I did not run a full workout live). Servers stopped, tab closed.

## 2. Scores

| Sub-point | A | B | C | D |
|---|---|---|---|---|
| Photo match | 7 — best rear-delt photo; no in-app note on close matches | 8 — stack-type shoulder press, honest photo notes in the app | 7.5 — best seated DB press, notes in app; rear-delt is standing | 6 — two wrong machine photos (lat pulldown, seated row), no notes |
| Start/end loop | 7 — 2.6 s crossfade, start+end side by side in sheet; no tap-to-pause; set-screen hero crops photo under text | 8.5 — 2.6 s crossfade, tap pauses, reduced motion: tap shows end; calm still thumbnails | 6.5 — hard cut every 1.2 s; photo cropped (cover); set-screen photo only 72 px | 8 — crossfade, big demo on set screen, blurred side bands for odd shapes, reduced motion tap + label |
| Video picks | 6 — many small channels, several 4-5 min | 7.5 — mostly ScottHerman/PureGym, exact equipment, some long | 7 — almost all PureGym, very short; 1 photo/video mismatch; calf link generic | 7 — reputable mix (NASM, Hinge, RP) but ATHLEAN-X picks are 6 min, one swear title |
| Machine cards and where-note | 7 — 15 machines, note on set screen and walk, not on rest; "Sign says" shown as fact | 9 — 15 machines, quick-word chips, note on set, rest "next", walk, week 1, sheet, list, settings | 7 — 14 machines, Gym tab with count, note on set/walk/week 1, not rest; no caveat | 8 — 15 machines, quick words, honest sign caveat on card, tip per machine; not on rest |
| Coverage and tests | 9 — 6 media tests, all covered | 6 — all covered, but no media tests | 9 — 4 media tests, all covered | 6 — all covered, but no media tests |
| Photo size and quality | 6 — originals unchanged (5.3 MB) | 6.5 — same photos; width/height set, lazy thumbs, thumbs load 1 image | 6.5 — same; thumbs load 1 image | 5.5 — same; loads first photo twice and blurs it on every demo |
| **Lens total (average)** | **7.0** | **7.6** | **7.3** | **6.8** |

## 3. Photo matches

All four builds use free-exercise-db (public domain) and saved the files unchanged. I checked by file hash that the files match each build's mapping. Builds differ on 7 exercises:

| Exercise | A | B | C | D | My pick |
|---|---|---|---|---|---|
| shoulder_press_machine | Leverage_Shoulder_Press (plate-loaded) | **Machine_Shoulder_Military_Press** (pin stack) | Leverage | Leverage | B: the plan uses "stack" steps; a pin machine is what a budget gym usually has |
| rear_delt_raise | **Dumbbell_Lying_Rear_Lateral_Raise** (chest on incline bench) | Lying_Rear_Delt_Raise (flat bench, frames reversed) | Bent_Over..._Head_On_Bench (standing) | Lying_Rear_Delt_Raise | A: matches "lie face down on a bench set to a low slope" |
| db_glute_bridge | Barbell_Glute_Bridge | Barbell + note | Barbell + note | Butt_Lift_Bridge (no weight) | Barbell_Glute_Bridge WITH the note ("use one dumbbell") |
| lat_pulldown_machine | Close-Grip_Front_Lat_Pulldown | same | same | Full_Range-Of-Motion (single handles at a cable tower) | A/B/C: a seat, thigh pad and bar, which is what the card describes |
| seated_row_machine | Leverage_Iso_Row | same | same | Leverage_High_Row (pulls down from above: a different move) | A/B/C |
| leg_curl_machine | Seated_Leg_Curl | Lying_Leg_Curls | Seated | Seated | Either, but pair it with a matching video. Lying fits the plan cue "do not lift your hips" |
| seated_db_shoulder_press | Seated_Dumbbell_Press (stool, frames reversed) | same | **Dumbbell_Shoulder_Press** (upright back, start at bottom) | same as A | C: matches "back on the upright bench" |

Shared photos (all builds): all 15 I sampled show the right move and kit. Close matches all builds share and admit: pulldown (seated at the cable, plan says kneel or sit), Romanian deadlift (stiff-legged photo, soft knees visible), hip thrust (barbell on a bench, not the Glute Drive), cable lateral raise (seated, two cables), walk (flat, not uphill), cable pull-through (the two frames come from different shoots, so the loop "jumps").

Mismatches per build:
- **A:** start/end reversed on seated DB shoulder press (end shown first, under a "Start · End" tag). Close matches are only in MEDIA.md, not shown to Rosario in the app. Chest press card text says "pin-loaded weight stack" under a plate-loaded photo.
- **B:** start/end reversed on rear-delt raise and seated DB shoulder press. Chest press "look" text says "weight stack" but photo is plate-loaded.
- **C:** rear-delt photo is a standing bent-over move, marked "same" in media.js. Leg curl photo is seated but the video is the prone (lying) machine. Chest press look text says stack.
- **D:** lat pulldown machine and seated row machine show the wrong kind of machine. Glute bridge shows no weight. No close-match notes in the app. Seated DB press reversed.

Extra idea for all: the library has **Machine_Bench_Press**, a pin-stack seated chest press (I viewed it). It is a closer match to a budget-gym chest press than Leverage_Chest_Press (plate-loaded), which all four use.

Own drawings: A, B, C and D all draw the hip hinge (two SVG frames). B also draws the dumbbell rack, the bench and the mat area for machine cards (the others reuse an exercise photo, which is fine).

## 4. Best video per exercise (where builds differ or a pick is weak)

Lengths are from the YouTube watch page. "Short demo" = under about 2 minutes.

| Exercise | Best pick | Channel | Length | Why |
|---|---|---|---|---|
| chest_press | How To Use The Chest Press Machine (sqNwDkUU_Ps) | PureGym | 1:00 | UK gym chain, machine set-up, short (C, D) |
| pulldown | How To Do Kneeling Lat Pulldowns (VIJPZ8m0EDM) | PureGym | 0:11 | Exactly the plan's kneeling cable version (C). A/B pick is 5:41, D is 5:55 |
| shoulder_press_machine | How To Use The Shoulder Press Machine (TnhIyp4kmO8) | PureGym | 0:55 | Set-up and move, short (C, D) |
| one_arm_db_row | How To: Dumbbell Single-Arm Row (On Bench) (KRN38chlkds) | ScottHermanFitness | 2:56 | Exact bench version (B, D); PureGym clip is 0:10 |
| db_curl | Dumbbell Bicep Curl (cBSD6mQIPQk) | Nuffield Health | 0:35 | UK health charity, plain demo (A, D) |
| triceps_pushdown | How To Do A Tricep Pushdown (LXkCrxn3caQ) | PureGym | 0:16 | Short; A/B/D pick is 4:31 |
| plank | How to do a plank (rerKy2AEHz4) | MassGeneralHospital | 0:56 | Hospital source, beginner level (D) |
| dead_bug | How to Do a Dead Bug (GbSC02oU3To) | Hinge Health | 1:12 | Physio-led (A, D) |
| cable_crunch | Cable Crunch: Do It Right! (ToJeyhydUxU) | Testosterone Nation | 0:26 | Known magazine, short, kneeling rope (C). Others 1:33 to 4:45 |
| romanian_deadlift | How To: Dumbbell Romanian Deadlift (FQKfr1YDhEk) | ScottHermanFitness | 1:58 | Dumbbells as in the plan (B, D) |
| face_pull | Rope Face Pull (eFxMixk_qPQ) | Men's Health | 1:25 | Rope, short, known brand (A). D's pick is 6:21 with a swear word in the title |
| hip_thrust | How To: Hip Thrust (SEdqd1n0cvg) | ScottHermanFitness | 2:31 | A, B, D agree |
| leg_extension | How To: Leg Extension (Cybex) (YyvSfVjQeL0) | ScottHermanFitness | 2:40 | A, B, D agree; machine set-up shown |
| goblet_squat | How To Do A Goblet squat (zBV3ceGyAxw) | PureGym | 0:22 | Short (C, D) |
| lateral_raise | How to do a Dumbbell Lateral Raise (XPPfnSEATJA) | NASM | 0:18 | Trainer certification body, short (D) |
| hammer_curl | How To: Dumbbell Hammer Curl (zC3nLlEvin4) | ScottHermanFitness | 2:02 | Plain demo (B) |
| overhead_triceps_ext | Rope Overhead Triceps Extension (kqidUIf1eJE) | Renaissance Periodization | 0:12 | Exactly the cable rope version (D); B itself doubted its PureGym pick |
| side_plank | How To Do A Side Plank (Oe9Tp9SvTCE) | PureGym | 0:18 | Short (B, C) |
| seated_cable_row | How To: Seated Low Row (LF Cable) (GZbfZ033f74) | ScottHermanFitness | 2:06 | Low cable, moderate length (B). D's pick is 6:05 |
| seated_db_shoulder_press | Seated Dumbbell Shoulder Press (HzIiNhHhhtA) | Renaissance Periodization | 0:13 | Title says seated (D) |
| reverse_crunch | How To Do A Reverse Crunch (XY8KzdDcMFg) | PureGym | 0:20 | B, C, D agree |
| cable_pull_through | Cable Pull Through (pv8e6OSyETE) | Renaissance Periodization | 0:10 | B, C, D agree; very short |
| calf_raise_standing | Smith Machine Calves (hh5516HCu4k) | Renaissance Periodization | 0:12 | Smith machine as in the plan (B, D). C's generic calf clip is shared with the calf machine |
| cable_curl | How To Do A Cable Curl (GNlopToAZyg) | PureGym | 0:20 | B, C |
| rear_delt_raise | Incline Rear Delt Fly (X5kmqWnprvI) | Dr. Bridger Cutler | 0:43 | Only pick on an incline bench (A); small channel, worth a look |
| db_glute_bridge | How To Do A Glute Bridge With A Dumbbell (cruqsnAyU6A) | PureGym | 0:22 | B, C, D agree |
| calf_raise_leg_press | How To Do Calf Raises On The Leg Press (dhRz1Ns60Zg) | PureGym | 0:14 | B, C, D agree |
| lat_pulldown_machine | Beginner's Guide: Lat Pulldown (AOpi-p0cJkc) | SilverSneakers | 2:17 | Beginner channel (A, D) |
| seated_row_machine | How To Use The Seated Row Machine (TeFo51Q_Nsc) | PureGym | 1:00 | A, C, D agree |
| leg_curl_machine | Seated: ELOCsoDSmrg (ScottHerman, 3:09). Lying: QjNFk4F5dAs (PureGym, 1:00) | — | — | Must match the photo chosen |
| calf_raise_machine | How To: Standing Calf (BM) (YMmgqO8Jo-k) | ScottHermanFitness | 2:23 | Machine version (B); A/D pick is a small channel |
| arm_swings (warm-up) | Arm swings side to side (p7EnbCprr5w) | NHS inform | 0:19 | Public health source (B) |
| uphill_walk | How To Use The Treadmill (HxsFneJFM2c) | PureGym | 1:01 | Teaches the controls a beginner needs (C); others are a "12-3-30" workout or a tiny channel |

All four open videos as a plain link (`target="_blank"`, `rel="noopener noreferrer"`), no embed, no third-party script. A shows the video title and channel in the sheet; D hides titles on purpose (good, because of the swear word); B shows the channel only; C shows the channel only.

## 5. Photo shrink recommendation

- **Now:** 88 photos (A, D) or 86 (B, C), 5.15 to 5.39 MB per build. Sizes: 80 photos 850 x 567, 4 at 850 x 569, 2 at 500 x 750 (portrait, standing calf raise), 2 at 1280 x 720 (dead bug). About 60 KB each.
- **Largest shown size:** the exercise sheet / machine card photo is about 343 CSS px wide in all builds (D's set-screen demo too). On an iPhone (3x screen) that is about 1030 real pixels, so 850 px is already below "full sharpness". Shrinking is a trade, not free.
- **Tests I ran (scratchpad only, Windows' built-in JPEG encoder, A's 88 photos):** 850 px q80 = 4.93 MB (-7%); 850 px q75 = 4.62 MB (-13%); 700 px q78 = 3.81 MB (-28%); 640 px q75 = 3.11 MB (-41%). I viewed a 640 px q75 result (leg curl): clean at phone size, no visible blocks.
- **Proposal:** long side 720 px, quality 78, strip metadata: about **3.9 MB (save about 1.4 MB, ~27%)**. Fix the 1280 x 720 dead bug files first (they are the only oversize ones).
- **Optional:** tiny 128 px thumbnails for list rows (now every list row decodes the 850 px photo); about 88 x 6 KB = 0.5 MB extra, but faster lists.
- **Risk:** slightly softer photos on a 3x iPhone in the big sheet; a one-time re-encode must keep start/end pairs aligned and is a new copy step to document. Low risk. The saving is modest; it is not urgent.

## 6. Best build per element (my lens only)

| Element | Best | Why |
|---|---|---|
| Today | D | Big moving photo of the first exercise in the day card (A has a photo strip too) |
| Set screen | D | Full-width demo plus "where" line under the name; B close second (moving photo + where + "Where is it?" chip) |
| Rest | B | Only build whose "Next up" shows the moving photo AND the where-note |
| Walk | B | Treadmill photo, where-note, machine card link (A and C also have the treadmill row) |
| Warm-up | A | Each move with a moving photo; tap for info |
| Swap | B | Photo thumbnail for every swap choice |
| Finish | n/a | |
| Week 1 | B | Photo, where-note and machine chip (C and D also show where) |
| Weigh-in | n/a | |
| Progress and charts | n/a (B/A show thumbnails in rows) | |
| Weekly | n/a | |
| Plan sheet | B | Exercises tab with thumbnails, every exercise opens the sheet; Machines tab |
| Machines list and card | B | Grouped by area, "x of 15 done", quick words, note shown everywhere; D close second (honest sign caveat, tip, hides machines the gym lacks) |
| Exercise sheet | B | Photo + honest close-match note + tips + video + machine row with where; A's side-by-side start/end is worth copying |
| Settings | C / D | In-app "Animations off" switch that also stops the photo loop |
| Setup and intake | n/a | |
| Targets | n/a | |
| Update banner | n/a | |
| Motion system (photo loop part) | B | Crossfade, tap to pause, reduced motion tap to see the end |
| Colour tokens | n/a (photo plate: B/D grey plate in dark mode; A's light plate shows bright bars in dark mode) | |
| Icons | B | Own drawings for rack, bench, mat |

## 7. Must-fix problems per build

**A**
1. Close-match photos have no note in the app (hip thrust, Romanian deadlift, glute bridge, cable lateral raise, lat pulldown). Add B/C-style one-line captions.
2. "Sign says" and area hints ("often by the windows", "usually by the mirrors") read as facts about the York gym. Say "usual sign" and add D's caveat.
3. Set-screen hero crops the photo and covers it with the name and chips: the move is hard to see. Show the full photo (contain) or move the text below.
4. Machine card opens the keyboard at once when no note is saved (auto-focus). On a phone this hides the card.
5. No "where" on the rest "Next" card. Swap to the better videos in section 4 (pulldown 5:41, cable lateral raise "DB vs cable" 4:51, small channels).
6. Fix reversed frames (seated DB shoulder press).

**B**
1. No media tests: add "every exercise has photos or a drawing, every file exists, every machine id valid, every plan exercise has a video" (copy A's media.test.mjs).
2. Reversed start/end frames: rear-delt raise and seated DB shoulder press. Better: use A's rear-delt and C's seated press entries.
3. Passive list thumbnails say "Tap to pause" to screen readers, but they cannot be tapped.
4. Chest press card text says "weight stack" under a plate-loaded photo (or switch to Machine_Bench_Press).
5. Long videos to shorten: pulldown (5:41), triceps pushdown (4:31), rear-delt (4:31, single-arm), cable crunch "Ab Pulldown" (3:53).

**C**
1. **Big photos use `object-fit: cover`: the portrait standing-calf-raise photo loses the feet and the step (checked live).** Use contain with a plate, or D's blurred side bands.
2. Hard cut every 1.2 s is jumpy; use a crossfade at about 2.6 s. Allow tap-to-pause when animations are on.
3. Set-screen photo is only 72 x 72 px: too small to learn the move from in the gym.
4. Leg curl: seated photo with a prone (lying) video. Calf machine and standing calf raise share one generic PureGym clip that is not the Smith machine.
5. No where-note on the rest "Next" card; no "usual sign" caveat. Rear-delt photo is marked "same" but is a standing move.

**D**
1. Wrong machine photos: lat_pulldown_machine (single handles at a cable tower) and seated_row_machine (high row). Use Close-Grip_Front_Lat_Pulldown and Leverage_Iso_Row.
2. No close-match notes in the app (glute bridge shows no weight; hip thrust shows a barbell).
3. No media tests (copy A's or C's).
4. Long and harsh video picks: face pull ATHLEAN-X 6:21 (swear word in title), pulldown 5:55, seated cable row 6:05, cable crunch 4:45.
5. Every demo loads the start photo twice and runs an 18 px blur: check smoothness on the real phone; consider a plain grey plate for 3:2 photos and blur only for portrait ones.
6. No where-note on the rest "Up next" card.

## 8. Recommended source for the media layer

**Take B as the base** for media.js, machines.js, the exercise sheet and the machine card:
- B already shows the where-note on every screen where Rosario needs it (set, rest, walk, week 1, sheet, list, settings), has quick-word chips, honest photo captions, own drawings for rack/bench/mat, and the best loop behaviour (crossfade, tap to pause, reduced-motion tap).

Take from the others:
- **A:** media.test.mjs (6 tests); the start/end side-by-side pair in the exercise sheet; the pec deck machine card (15th machine, the first visit checks it); the rear-delt photo (Dumbbell_Lying_Rear_Lateral_Raise).
- **C:** the media tests; the seated DB shoulder press photo (Dumbbell_Shoulder_Press); the `match: same/close` + `matchNote` data shape; the in-app "Animations off" switch that also stops the photo loop.
- **D:** the honest sign caveat line on the card; the per-machine tip; hiding question-17 machines the gym does not have; blurred side bands for the 2 portrait photos; hiding video titles; `tools/videos-checked.json` as a check record.
- **Videos:** use the "best pick" list in section 4 (a mix of B, C and D picks).
- **Photos:** shoulder press from B (pin stack); consider Machine_Bench_Press for the chest press; re-encode per section 5 only if Rosario wants the smaller download.

## 9. Not checked

- **The real gym:** sign names, areas and machine brands at The Gym Group York Foss Island could not be checked. All builds' sign names and area groups are typical UK-gym guesses; only D says so on screen. Whether the gym has a seated or lying leg curl, a pin or plate chest press, a Glute Drive, is unknown.
- **Video content:** I read titles, channels and lengths only. I did not watch any video, so exact form, equipment shown and language inside the videos are not verified.
- **A full workout live:** set and rest screens were judged from the builders' screenshots and the code, not by running a workout in the browser.
- **Real iPhone:** loop smoothness, D's blur cost, photo sharpness at 3x, Safari opening YouTube links, and offline photo caching were not tested on a phone.
- **Re-encoding:** done with Windows' built-in JPEG encoder in my scratchpad only; a different tool gives different sizes. Only one shrunk photo was looked at closely.
- **Every photo pair:** 30 of about 44 pairs viewed (all disputed ones plus 15 shared); the rest were checked by name and file hash only.
- Library photos' licence was taken from the builders' MEDIA files (The Unlicense); I did not re-check it.
