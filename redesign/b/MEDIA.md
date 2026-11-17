# Redesign B: media sources and licences

Builder B (clean Apple style), checked on 2026-11-17.
Every picture and link in this redesign is listed here, with where it came from and under which licence.

## 1. Exercise photos

- **Source:** free-exercise-db by yuhonas, https://github.com/yuhonas/free-exercise-db (the `exercises/<name>/0.jpg` and `1.jpg` files).
- **Licence:** The Unlicense (public domain). No credit is needed, but we give it here anyway.
- **How they are used:** two photos per exercise (start and end position), copied unchanged to `app/media/exercises/<our id>/0.jpg` and `1.jpg`.
  - On a big view they flip between the two photos (a CSS animation, which stops under Reduce Motion).
  - In lists they show as small still thumbnails.
- **Size:** 43 exercises × 2 photos = 86 files, about 5.2 MB. They are in the offline list (`sw.js`), so they work in the gym without signal.
- **Mapping:** `app/js/plan/media.js`, object `photoSource` (our id → library folder).

### 1.1 Close matches (the photo is not exactly our exercise)

The app shows a one-line note under the photo for each of these (`photoNote` in media.js).

| Our exercise | Library photo used | Note shown |
|---|---|---|
| Cable lateral raise | Cable_Seated_Lateral_Raise | Two-cable version. Do one arm at a time. |
| Standing calf raise | Smith_Machine_Calf_Raise | The Smith machine version from the plan. |
| Dumbbell glute bridge | Barbell_Glute_Bridge | Barbell version. Use one dumbbell on your hips. |
| Hip thrust | Barbell_Hip_Thrust | Barbell version. The Glute Drive works the same way. |
| Pulldown | Wide-Grip_Lat_Pulldown | Seated on a pulldown seat. Kneeling at the cable works the same way. |
| Romanian deadlift | Stiff-Legged_Dumbbell_Deadlift | Stiff-legged version. Keep a soft bend in your knees. |

Other matches that are close but have no note (judged good enough):

| Our id | Library photo used | Why it is close, not exact |
|---|---|---|
| arm_swings | Dynamic_Chest_Stretch | Same arm swing across the chest, slightly different start. |
| cat_cow | Cat_Stretch | Shows the "cat" half only. |
| glute_bridges (warm-up) | Butt_Lift_Bridge | Same move, older name. |
| pushups_bench | Incline_Push-Up | Hands on a raised surface, as in the plan. |
| side_plank | Side_Bridge | Same hold, older name. |
| seated_row_machine | Leverage_Iso_Row | A plate-loaded row; Rosario's gym may have a stack machine. |
| treadmill_walk | Walking_Treadmill | Flat walk; the plan's walk is uphill. |
| calf_raise_machine | Standing_Calf_Raises | A standing machine; the gym's machine may be seated. |

### 1.2 Original drawings (no matching photo)

Drawn by builder B as plain SVG in `app/js/ui/art.js` (our own work, no licence issue):

- **Hip hinge, hands on hips** (warm-up move): a simple figure bending at the hips.
- **Dumbbell rack**, **adjustable bench** and **mat area** (machine cards): simple line drawings in the accent colour.

## 2. "Watch video" links

- **What they are:** plain links that open YouTube in a new tab (`target="_blank"`, `rel="noopener noreferrer"`). Nothing from YouTube is loaded inside the app, so the app's security rules (CSP) are unchanged and no third-party script runs.
- **Where they are stored:** `app/js/plan/media.js`, object `videos` (44 entries: 36 plan exercises, 7 warm-up moves, the treadmill walk).
- **Check:** on 2026-11-17 all 44 links answered HTTP 200 on YouTube's public oEmbed address, which only answers 200 for a public, existing video.
- **Licence:** we only link; we do not copy any video. Each video stays under its owner's terms.

| Channel | Links | Kind |
|---|---|---|
| ScottHermanFitness | 27 | Personal trainer, short form demos |
| PureGym | 11 | UK gym chain, short demos |
| Renaissance Periodization | 2 | Sports scientists |
| Nuffield Health | 1 | UK health charity |
| NHS inform | 1 | Scottish NHS public site |
| Hinge Health | 1 | Physio company |
| Live Lean TV Daily Exercises | 1 | Fitness channel |

### 2.1 Weaker matches (worth a look by Rosario)

- **Arm swings** (NHS inform) and **treadmill walk** (Live Lean TV): fine, but generic.
- **Cable pull-through** and **standing calf raise** (Renaissance Periodization): very short clips with fast talk.
- **Overhead triceps extension** (PureGym): check that it is the cable version, as in the plan.
- **Machine videos** (chest press, shoulder press, seated row): the brand in the video may differ from the machines in Rosario's gym. The movement is the same.

## 3. Icons

All icons are our own simple SVG paths in `app/js/ui/icons.js` (drawn for this redesign, in the style of thin rounded line icons). No icon font, no copied Apple SF Symbols. The app icon is the existing one in `app/icons/`.

## 4. Fonts

No web fonts. The app uses the phone's own system font (`-apple-system`, SF Pro on iPhone; `ui-rounded` for big numbers where the phone has it).
