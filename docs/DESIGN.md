# Training app design system

Date: 2026-11-18 (first version 2026-11-16; section 15 added by worker 8.31 on 2026-11-17; build step 2 marks and the body-map values added by worker 8.33 on 2026-11-18). Rewritten by task chat 8.24 for the redesign merge (redesign/JUDGING.md section 3; Rosario's answers 55 to 61 in [DECISIONS.md](DECISIONS.md)). Agents follow this file for all UI work in `app/`. What the app does: [PRD.md](PRD.md). Screens and flow: [WORKFLOW.md](WORKFLOW.md), section D. Before and after pictures: [redesign-final/LOOK.md](redesign-final/LOOK.md).

## 1. Overview

- **Product and audience:** a workout guide and log for one beginner (Rosario), used on an iPhone at the gym, one hand, often between sets, sometimes sweaty, the phone on a bench or treadmill shelf.
- **Visual character:** "dark premium sport" (base: redesign A). A deep near-black canvas, bold heavy numbers, one **volt** accent (#d7ff3c, a bright yellow-green) for progress and the main action, glowing rings in dark mode, real photos of every move, short motion. Light mode is a full second map of the same roles: white cards on a light grey canvas, a black main button with volt text, a darker olive-green accent for graphics and links.
- **Principles:**
  - **Readable at arm's length.** The number you need now (weight, reps, time left) is the biggest thing on the screen.
  - **One main action per screen**, at the bottom, under the thumb.
  - **Big targets.** Main buttons 58 px tall; steppers 56 px; nothing tappable under 44 px.
  - **One accent.** Volt marks progress, the current set, the running timer and the main button. Everything else is neutral.
  - **Pictures help, words decide.** Every exercise and machine has a photo; the words next to it (name, sign, where it is) carry the meaning.
  - No greeting filler, no emoji, no confetti. Plain words.

## 2. Tokens (machine-readable)

The live values are the custom properties at the top of `app/css/app.css`; this block is the same set in one place.

```yaml
colors:
  volt:      "#d7ff3c"     # the accent in dark mode; text colour of the black main button in light mode
  volt_deep: "#b8e000"     # pressed main button, dark mode
  ink:       "#0a0b0d"     # text on volt
  light:
    canvas: "#f2f3f5"   surface: "#ffffff"   subtle: "#e9ebef"
    text: "#0b0c0f"     muted: "#545a66"     border_strong: "#737985"   border: "rgba(10,12,16,.09)"
    accent: "#4d7c0f"   accent_text: "#3f6212"   accent_soft: "rgba(77,124,15,.12)"   accent_on_soft: "#365314"
    gold: "#a16207"
    button: { bg: "#0b0c0f", text: volt, pressed: "#2a2d33" }
    status: { success: "#15803d", warning: "#b45309", error: "#c62828" }
    photo_plate: "#ffffff"   photo_band: "#e9ebef"
    map: { base: "#e3e6eb", muscle: "#cfd4dc", line: "#ffffff" }   # body maps (section 15.4, mock-up)
  dark:
    canvas: "#08090c"   surface: "#121419"   raised: "#1a1d24"   subtle: "#23272f"
    text: "#f5f6f8"     muted: "#a0a6b2"     border_strong: "#6b7280"   border: "rgba(255,255,255,.08)"
    accent: volt        accent_text: volt     accent_soft: "rgba(215,255,60,.12)"   accent_on_soft: volt
    gold: "#fbbf24"
    button: { bg: volt, text: ink, pressed: volt_deep }
    status: { success: "#4ade80", warning: "#fbbf24", error: "#ff6b6b" }
    photo_plate: "#1a1d24"   photo_band: "#121419"
    map: { base: "#1c1f26", muscle: "#2c313b", line: "#121419" }
    glow: "drop-shadow(0 0 10px rgba(215,255,60,.35))"   # rings and the main button only
  scrim_text: "linear-gradient(180deg, transparent 0%, rgba(8,9,12,.55) 40%, rgba(8,9,12,.82) 100%)"  # under any text on a photo, both looks
  flash: { bg: volt, text: ink }
typography:
  family: system font (-apple-system, "SF Pro"); no web fonts
  timer:   { size: 88-96px, weight: 800, numerals: tabular }
  display: { size: 40px, weight: 800, numerals: tabular }
  h1:      { size: 26-28px, weight: 800 }     # 22px beside the exercise photo on the set screen
  h2:      { size: 20px, weight: 700 }
  body:    { size: 17px, weight: 400 }
  small:   { size: 14px }
  eyebrow: { size: 12px, weight: 700, uppercase, letter-spacing: .08em }
spacing: { s1: 4px, s2: 8px, s3: 12px, s4: 16px, s5: 20px, s6: 24px, s8: 32px, s12: 48px }
radius:  { chip: 999px, input: 14px, button: 16px, card: 20px, hero: 24px }
tap:     { min: 44px, main: 58px, stepper: 56px }
motion:  { fast: 160ms, normal: 280ms, slow: 460ms, flash: 2000ms, ease: "cubic-bezier(.2,.8,.2,1)", spring: "cubic-bezier(.34,1.4,.64,1)" }
```

Body text is 17 px (the iPhone's own default). Inputs are never under 16 px, or the iPhone zooms in on tap.

## 3. Colors (by job)

Components use only the role properties (`--bg-canvas`, `--text-primary`, `--accent`, …). Dark mode is a second map of the same roles. The app follows the phone setting (`prefers-color-scheme`), with an override in **Settings > Look** (Auto / Light / Dark).

How the look reaches every part (dark-mode check, 2026-11-18, `docs/checks/2026-11-18-dark-mode.md`):

- Each of the three maps in `app.css` also sets the CSS `color-scheme` property (light / dark), so the phone's own parts (keyboard, scroll bars, date and list wheels) follow the Look choice, not only the phone.
- The bar colour (`theme-color`) is the page canvas of each look: two tags in `index.html`, one per phone setting. `boot.js` (before the first paint) and `js/theme.js` write a fixed Light or Dark into both. iOS home-screen apps take the top strip's colour from the page; `apple-mobile-web-app-status-bar-style` stays `default` (never the translucent black style).
- The manifest has no `theme_color` (one colour cannot be right in both looks).
- With Auto, the app listens for the phone turning light or dark (`ui/theme.js`). A switch is instant: `html.theme-switching` turns transitions off for two frames.
- Picking Auto / Light / Dark marks the button in place: no redraw, no jump to the top of Settings.
- No colour is written in JavaScript (a test checks it); new style files use the tokens only (a test checks it).

| Role | Use |
|---|---|
| `--bg-canvas` | page background, one plain colour (0.7.1: the faint glow at the top is gone; iOS blurred it into fog) |
| `--bg-surface` / `--bg-raised` | cards, sheets / chips and raised controls |
| `--bg-subtle` | done sets, secondary fills, empty bars |
| `--border-default` / `--border-strong` | hairlines / input and stepper outlines (needs 3:1) |
| `--text-primary` / `--text-muted` | body and all numbers / labels, captions, "last time" |
| `--accent` | rings, progress bars, the current set's edge, chart line: graphics |
| `--accent-text` | links and accent words (light mode uses a darker green than `--accent` so small text passes 7:1) |
| `--accent-soft` + `--accent-on-soft` | soft accent fill (picked chip, "Saved" pill) and the words on it |
| `--btn-bg` / `--btn-text` | the main button: volt with black text in dark mode, black with volt text in light mode |
| `--gold` | "best" (personal record) dots and badges only |
| `--status-*` | sync state, warnings, "It hurts"; always with words |
| `--photo-plate` / `--photo-band` | the plate behind a photo; the band that fills the side of a portrait photo |
| `--scrim-text` | the dark fade under white text on a photo (the same in both looks) |

Balance: about 60 % neutral, 30 % surfaces and photos, 10 % accent. Status colours mark state only, never decoration, and always come with words ("Not synced"), never colour alone.

**Checked contrast pairs** (WCAG ratio, computed 2026-11-17 from the values above):
- Light: text on canvas 17.62, on surface 19.56; muted on surface 6.93, on canvas 6.24; accent (graphics) on surface 4.99, on canvas 4.50; accent text on surface 7.08; accent-on-soft on its fill 7.46; volt text on the black button 17.01; gold on surface 4.92; border-strong on surface 4.37; success 5.02, warning 5.02, error 5.62 on surface.
- Dark: text on canvas 18.41, on surface 17.04; muted on surface 7.54, on canvas 8.15; volt on surface 16.02, on canvas 17.31; ink on volt 17.12; volt on its soft fill 11.86; gold 11.04; border-strong 3.81; success 10.57, warning 11.04, error 6.64 on surface.
- Text on a photo: white on the scrim's 82 % part 12.26 (titles sit there); at the 55 % point 4.42, so text never sits above that point.
- Flash: ink on volt 17.12.

## 4. Typography

- **Family:** the phone's system font. No web fonts (nothing to download, works offline, no third party).
- **Scale:** only the sizes in the tokens. Heavy weights (800) for numbers and titles; `eyebrow` (small capitals) for section labels.
- **Numbers:** always `font-variant-numeric: tabular-nums`, so timers and weights do not jump as digits change.
- Sentence case for headings and buttons ("Start workout", not "START WORKOUT"). Eyebrows are the only capitals, and they come from CSS, not from the text.
- Units in smaller, muted text next to the number: **32.5** kg, **10** reps, **1:30** left.

## 5. Layout and spacing

- **One column**, full width, side gutters 16 px. Max content width 520 px, centred on bigger screens.
- **Safe areas:** pad top and bottom with `env(safe-area-inset-*)` (notch and home bar). In the Home Screen app every top also adds `--top-clear` (20 px, `display-mode: standalone`): iOS 26+ draws its own soft blur under the status bar (the scroll edge effect, which a page can not turn off), so the first line starts below it (0.7.1, iPhone P1).
- **No double-tap zoom** anywhere (Rosario's taste): `touch-action: manipulation` on every element; pinch-zoom and scrolling stay (0.7.1, iPhone P4).
- **Thumb zone:** the main action sits in a fixed bottom bar (58 px button plus padding plus the safe area), on a frosted glass bar. Back and End sit at the top.
- **One focus per screen:** the current set or the timer. Everything else is smaller and muted.
- **No horizontal scrolling** anywhere, at 320 px wide too. Chip rows wrap or shrink.
- **The set screen must fit at 375 × 812 without scrolling** down to the reps stepper (measured 2026-11-17: the reps stepper ends at about 691 px, above the Done bar). This is why the exercise photo sits beside the name, not above it.

## 6. Elevation and shape

| Level | Treatment | Use |
|---|---|---|
| 0 flat | surface + hairline; a soft card shadow in light mode only | cards, set tiles, inputs, chips |
| 1 overlay | `--shadow-overlay` + hairline | the update banner, toasts |
| 2 modal | overlay shadow + scrim | bottom sheets (swap, exercise info, machine card, end workout), confirm dialogs |

Radius grows with size: chip full round, input 14 < button 16 < card 20 < hero photo 24. Glow (dark mode only) is kept for the timer ring when it is ending and for the main button.

## 7. Motion

Motion explains what changed; it never decorates. All of it is CSS or the Web Animations API (`app/js/ui/motion.js`), and only `transform` and `opacity` move, so it stays smooth on the phone.

- **What moves:** screens fade and slide in (`--t-normal`); sheets slide up; list rows come in one after another (`stagger`, 45 ms apart); a changed stepper number pops (`bump`); totals count up once (`countUp`); chart lines draw in (`drawIn`); the rest ring runs down and glows in its last seconds; exercise photos flip between the start and end position (two real photos, 1.6 s each way).
- **Turned off** when either: the phone asks for less motion (Settings > Accessibility > Motion > Reduce Motion), or **Settings > Look > Animations** is off. The app setting lives on the phone only (the device box, never synced) and is put on `<html data-motion="off">` by `boot.js` before the first paint, so nothing flashes. When off, every animation and transition takes 1 ms, and photos show the start position (a tap shows the end position).
- **Never:** motion that blocks a tap, loops that do not stop (except the photo flip, which a tap pauses), bounce on anything you read, or animation of layout (width, height, top, left).

## 8. Components

- **Main button:** `--btn-bg` fill, `--btn-text` text, 17 px weight 800, 58 px tall, full width, radius `button`. One per screen. Pressed: `--btn-pressed`. Disabled: `--bg-subtle`, muted text. A "locked" main button (Done, Skip) ignores taps for 400 ms after the screen changes, so the second tap of a double tap never hits the next screen's button; it shows "Saved" for a moment after a set.
- **Secondary button:** hairline `--border-strong`, no fill, 48 to 58 px.
- **Text button:** `--accent-text` words, no border, at least 44 × 44 px.
- **Chip:** full round, 44 px tall, raised fill, an icon and a word (Tips, Video, Where?, Swap). A picked chip uses the soft accent fill.
- **Choice row:** equal buttons in one row (0 / 1 / 2 / 3 / 4+ for "How many more?"; Auto / Light / Dark), 56 px tall, the picked one in the soft accent fill.
- **Switch:** `role="switch"` button with a knob, 44 px tall, for Animations.
- **Stepper (weight and reps):** the big value between − and + (each 56 × 56 px). The label (Weight, Reps) sits inside the box. Weight steps by the exercise's smallest step; reps by 1. Tapping the value opens the number keypad.
- **"Last time" button:** under the steppers on the set screen: "Last time 30 kg × 12, 12, 11 · Use". One tap copies last time's weight and reps for this set.
- **Set tiles:** one small tile per set; done ones show a check, the current one has the accent edge.
- **Exercise header (set screen):** the moving photo (half the width, 3:2) with the name and equipment beside it; under it the chip row Tips · Video · Where? · Swap; under that, when the photo is a close match and not the exact machine, a one-line note.
- **Photo (flip):** two real photos on `--photo-plate`. Portrait photos get `--photo-band` at the sides. Any text on a photo sits on `--scrim-text` and is white.
- **Timer:** a ring (accent on `--ring-track`) around timer-size digits. Under it −30 s and +30 s as round buttons. On the rest screen: the "Saved · 12 kg × 8" line above the ring, the optional "How many more could you do?" choice row, the Next card (moving thumb, name, and the next machine's where-note), and "Undo that set" kept at least 40 px away from Skip.
- **Flash:** when a timer ends, the screen turns volt with "Go" for 2 seconds. With motion off: the colour without the blink.
- **Bottom sheet:** slides up, radius `card` on the top corners, a 44 px close area, scrim behind.
- **Card:** `--bg-surface`, hairline, radius `card`, padding 16 px. A card head is an icon plus a short title.
- **Machine row and card:** the photo thumb, the name, "Usual sign: …", and either Rosario's where-note (with a pin icon) or "Add where it is". The card adds the big photo, Usual sign and Usual area with the caveat that the sign may differ, one set-up tip, and the "Where it is in my gym" box with quick-word chips.
- **Badge:** small round count or slot label (A1, B2); gold "Best" badge for a personal record.
- **Sync status line:** one line of small text with a dot and words. Always words, never only a dot.
- **Tiles (Today, Weekly, Progress):** label in eyebrow style above a big number; changes name their baseline ("−0.4 kg vs last week"). The weekly tiles carry a 5-segment bar.
- **Chart:** SVG drawn by our own code, one accent line, 2 px, drawn in once; best points as gold dots; axis labels small and muted; at most 4 grid lines. Empty state: "No data yet. Log a weigh-in to start the line."
- **Inputs:** `--bg-surface`, `--border-strong`, radius `input`, 48 px, 17 px text, label above. Focus ring 2 px accent. Error text below with words.
- **Empty, loading, error states:** every list and chart has all three (section 11).

## 9. Screens (from WORKFLOW D and the PRD)

| Screen | The one big thing | Main action (bottom bar) |
|---|---|---|
| First start | "Start fresh" / "Restore" choice, app tile | Continue |
| Intake (one question per page) | the question | Next |
| Targets | calorie, protein and walk tiles | Looks right |
| Today | day and week, the day's blocks with minutes, the exercise list with photos and suggested weights, food numbers, sync line | Start workout |
| Walk | timer; speed and slope above it | Done walking |
| Lift warm-up | timer; move list with moving thumbs | Start weights |
| Set screen (pair) | the current set's weight and reps steppers | Done |
| Rest | timer ring, "How many more?" inline | Skip rest |
| Week 1 "find your weight" | the step | Done |
| Finish | summary: time, sets, new bests, next time | Save |
| Weigh-in | one number with keypad, last weigh-in | Save |
| Progress | totals, weight chart, exercise list with chart and the last 3 workouts | – |
| Weekly summary | tiles with a 5-segment bar | Got it |
| Plan | one day per page: week chip, day strip, walk card, pairs in words, exercise cards with a small map (section 15.3; built in step 2) | ‹ day · day › arrows on a frosted bar |
| Gym | Machines \| Exercises switch: machines by area, "x of N noted", where-notes; every exercise by main muscle (section 15.7; built in step 2) | – |
| Settings | Sync, Backup, Look (theme, Animations), Gym, Sound, Shortcuts | – |

**Navigation:** a bottom tab bar outside a workout (icon plus label) plus a Settings gear at the top right of every tab (section 15.2). Since build step 2: Today · Plan · Gym · Progress; Diet joins between Gym and Progress in build step 7. During a workout the tab bar is hidden; the top bar shows the progress and an "End" button (44 px, with a confirm sheet).

## 10. Do / Don't

Do
- Use tokens for every colour, size, space and radius.
- Keep the accent for progress, the main action, the current set and the running timer.
- Put the main action at the bottom.
- Show units, the baseline of every change, and words with every status colour.
- Set sizes that come from data (bar widths) through CSSOM (`el.style.width`), never a `style` attribute: the page's security rules (CSP) block style attributes.
- Test at 375 × 812, light and dark, motion on and off.

Don't
- Gradients other than the photo scrim; shadows on cards in dark mode.
- Tiny tap targets, swipe-only actions, buttons near the top edge for frequent actions.
- Rely on sound, colour or a picture alone for anything important.
- Use `innerHTML` with data (security rule in ARCHITECTURE.md). All text goes in through `h()`.
- Celebrations, streak nags, or emoji in the interface.
- Third-party fonts, scripts or images from other sites at run time. Photos ship inside the app (`app/media/`).

## 11. Copy (words on screen)

- Short and plain. Verbs on buttons ("Save walk", "Start weights", "Save where it is").
- Errors say what happened and what to do: "GitHub key expired. Make a new one in Settings."
- Empty states say how to fill them: "No weigh-ins yet. Weigh in tomorrow morning."
- Machine signs are "usual" names, never stated as fact: "Usual sign: Chest Press" plus the caveat that the gym's sign may differ.
- Numbers keep their units. Body weight follows the chosen unit; gym weights are always kg.

## 12. Responsive behaviour

| Name | Width | Changes |
|---|---|---|
| phone | < 640 px | the only target; one column, bottom bar, bottom sheets |
| tablet / desktop | ≥ 640 px | same layout, centred at 520 px |

## 13. Known gaps

- The app icon is still the old teal one; it should move to volt (follow-up, `logo-design` skill).
- Landscape layouts are not designed; screens scroll.
- Text-size scaling above "one step larger" is not checked.
- The phone's Reduce Motion setting was checked in code and CSS, not on the phone. (Print is gone since build step 2.)

## 14. Iteration guide

1. Change a token here first, then in `app/css/app.css` (all three maps: light, dark by phone setting, dark by choice; the two dark maps must stay the same, a test checks it). If `--bg-canvas` changes, change the bar colours too (`js/theme.js`, `js/boot.js`, `index.html`; a test checks they match).
2. Never add a one-off value in a component; add a token or reuse one.
3. Re-check contrast after any colour change and update the list in section 3.
4. Date this file when edited.

## 15. Plan, Gym and Diet (Rosario approved 2026-11-17)

**The contract.** The approved mock-up page is the contract for these screens: https://claude.ai/artifact/3PXi5fxUPPUCou1D4Hfw52 (source `redesign/plan-diet/judge/mockup.html`; judge report and build steps `redesign/plan-diet/judge/JUDGING.md`; research `docs/research/2026-11-17-plan-diet-research.md`). Rosario picked every recommended answer, questions 67 to 79 (2026-11-17, "All recommended"; [DECISIONS.md](DECISIONS.md)). **Rosario's newer words win over the mock-up.** Where this section and the mock-up disagree, the mock-up wins until this section is fixed. Values marked **(mock-up)** are new to this file and approved through the mock-up page. Everything else uses the tokens and components above. Built in the steps of JUDGING.md section 7; each build step checks its screens against the mock-up (gap list).

### 15.1 What goes, what moves

- The Print button, the printable Plan sheet and the print styles go (PRD F3 print part, removed by Rosario). **Done in build step 2** (2026-11-18): no print button, no `@media print`, no print-only code.
- Exercises and Machines leave the Plan tab and live in the Gym tab (15.7).
- Nothing else of the 0.4.1 Plan tab is lost: day focus, walk text, sets × reps, rest, the plan's swaps, the 12 weeks and the RIR line all stay (mock-up "Nothing lost").

### 15.2 Tab bar and Settings (questions 67 a, 68 a)

- **5 tabs, in this order:** Today · Plan · Gym · Diet · Progress (icon plus label). Until Diet is built (step 7) the bar has 4: Today · Plan · Gym · Progress, never a Diet tab that leads nowhere.
- **Settings is a gear button at the top right of every tab** (44 × 44 px), always in the same place. Settings keeps its own page, with a "‹ Today" back link.
- During a workout the tab bar stays hidden, as now.

### 15.3 Plan day page

- One day per page, read like Today, opened on today, with the real sets of this week.
- **Top:** the week chip ("Week 3 · Build 1 ›", opens the 12 weeks sheet), Edit, the gear. Then the big day name with a "Today" mark, the focus words and a meta line: "about 90 min · 21 sets · stop with 2 left".
- **Day strip:** the 5 days with their focus words and done ticks; one tap jumps to any day.
- **Order on the page:** the walk card first ("Walk first · 20 min uphill" with the real minutes, then the speed and slope the app gives that day and week, "4 km/h · 2 % slope", then the leg-day easier line; 0.7.1), then the pairs, then the abs, then the "Whole plan check" card at the end of the day.
- **Pair headers in words**, not slot letters: "Pair A · back and forth · 3 rounds · rest 90 s after each round"; "On its own · rest 60 s between sets".
- **Day arrows at the bottom** (question 69 a): "‹ Monday · Wednesday ›" on a **solid frosted bar** above the tab bar, the same frost as the tab bar, so cards never show through.
- **No big day map at the top** (question 70 a). The first exercise shows without scrolling at 375 × 812.
- **The 12 weeks sheet:** the 0.4.1 lines (phase, sets rule, RIR, walk note). Picking a week shows that week's real sets on every day; the day page then says "Showing week 7. This week is week 3." with "Back to this week".

### 15.4 Exercise card (closed) and opened exercise

- **Closed card:** photo, name, sets × reps, the muscles in plain words ("Front thighs · helps calves, glutes, back thighs") and a **small body map** (about 26 px wide, **mock-up**).
- **Opened exercise** (a bottom sheet): Swap, Remove and Video at the top; then **two body maps side by side: "This exercise" and "Day so far"**.
  - "This exercise": main muscles strong, helpers light. Words under it: "Main: back thighs · Helps: glutes, lower back".
  - "Day so far": shaded by the sets from the first card down to this one, with "Day so far · 3 of 7" and words that list **every** muscle with sets ("Sets so far: back thighs 4.5, front thighs 3, glutes 3, abs 3, calves 1.5, lower back 1.5").
  - **Legend: one scale in 3 steps, "A little · More · Most", with "Helpers count half"** (**mock-up**). Map fills: plain body = map base; the 3 steps mix the accent into the map colour at about 30 %, 62 % and 100 % (**mock-up**). Never colour alone: the words always say the same.
  - **Counting and steps** (build step 2, `app/js/engine/planpage.js`): a main muscle counts 1 per set, a helper 0.5. "Day so far" step: under 3 = A little, 3 to under 6 = More, 6 or more = Most. "This exercise": main = Most, helpers = A little. The small card map shows the side (front or back) where the main muscles are.
  - 4 number tiles: Sets, Reps, Rest, "Stop with 2 reps left". A hold (plank, side plank) shows **Hold** "20–40 s" with "seconds each set" (or "seconds each side") instead of Reps, and "seconds left": a hold never says "reps" anywhere (0.7.4). Previous and Next are named after the neighbour exercise ("‹ Cable crunch · Face pull ›").
  - Below, unchanged from 0.4.1: the moving photo, start and end photos, How to do it, the video link, the machine row, plus "The plan's own swap: …".
- **Plain muscle words** everywhere on screen: "front thighs" (not quads), "back thighs" (not hamstrings), "inner thighs", "front / side / rear shoulders", "lats", "mid back". The data and its names: `app/js/plan/muscles.js`.
- **Body drawing:** body-muscles by Ivan Vulović, Apache-2.0 (question 71 b), files in `app/vendor/body-muscles/` with its LICENSE, NOTICE and our change note. Front / side / rear shoulders apart and lats / mid back apart. Drawn by our own code as inline SVG (no `innerHTML`, sizes through CSSOM).

### 15.5 Edit rules (questions 65, 72 a, 73 a)

- Edit mode: Swap and Remove on every card, "Add an exercise (2 of 2 left)", "Done editing". A line at the top: "Editing Tuesday. Each change saves at once and lasts: every Tuesday from now on, in every week. Past workouts stay as they were." plus the new minutes against the plan's.
- **Every edit saves at once and lasts for that day of the plan** (answer 65). **Past workouts and a running workout never change**; the running day shows a lock card.
- **Swap sheet:** "Same muscle (front thighs), other equipment" first; **the plan's own swaps are always offered and marked "Plan's pick"**; exercises already in the day are **named but never offered** ("Already in Tuesday: Leg extension."); machines the first visit has not found are hidden, with one line saying which; "Show exercises for other muscles" at the end. A swap keeps the slot's sets and rest; the reps come from the new exercise.
- **Add** (question 72 a): the new exercise goes **at the end of the day, on its own, 3 sets, 60 s rest, at most 2 added exercises a day** (**mock-up**). The Add sheet lists muscles (with "low" on the ones the muscle check finds short) and never offers an exercise already in the day. Never the same exercise twice in a day.
- **Undo:** every edit shows a toast with Undo for **8 s** (**mock-up**).
- A changed day shows the card "Changed by you · 17 Nov" with what changed and "Back to the plan's Tuesday".
- **No double-tap zoom** (0.7.4, second line after the CSS `touch-action`): `ui/tapzoom.js` cancels a quick second tap's zoom and replays the tap; typing fields, scrolls and pinches are left alone; pinch zoom stays (never `maximum-scale` or `user-scalable=no`).
- **The walk in Edit mode** (0.7.4): the walk card stays, in the exercise cards' edit look (`ecard`, one `ebtns` button "Change"). The walk sheet follows the Change sheet: title "Change Monday's walk", the `lasts` box, three standard steppers (Speed km/h, Slope %, Minutes min), two small muted lines (the plan's walk this week; the trainer's limits), Save, Cancel, and the text button "Back to the plan's walk" (the `back-plan` look) when the day has its own walk. A day's own walk carries the existing "Yours"-style `badge inline acc` next to "Walk first", and in Edit mode a small muted line under the card: "Your own walk. The walk rule does not change this day." (trainer D16 A; the walk screen shows it in its note line). Under the Minutes stepper, while the minutes are under 30, a small muted hint: "Under 30 minutes a day means under 150 minutes of walking a week." (D16 B: no warning colour). No new colours, sizes or classes.
- **"Back to the plan's Tuesday" asks first** (question 73 a): a sheet lists every change that goes away, says that done workouts, weights and history stay, and offers "Back to the plan's Tuesday" / "Keep my Tuesday"; then the 8 s Undo toast.

### 15.6 Whole-plan muscle check

- Reached from the "Whole plan check" card at the end of each Plan day. Week chips: Week 1 · Weeks 2–5 · Week 6 · Weeks 7–11 · Week 12.
- "N things stand out" first, then one row per muscle with **two numbers: direct sets · with helpers (½)**. Bands (**mock-up**): 10 or more = fine; 5–9 = low; under 5 or helping only = low, grey when only helpers reach 10 ("Under 10 direct; 10+ counting helpers"); 10–20 is the normal range; well above 20 = "a lot".
- Shoulder parts as "Part of shoulders" rows. One line: "Not trained on purpose in this plan: traps, forearms, neck and inner thighs." Lower back has no warning.
- "This screen only shows numbers. It never changes the plan." A plan change only comes from a plan review in its own chat, approved by Rosario (question 74 b).
- The numbers come from the same function as the opened exercise's "Day so far", so the two never disagree.

### 15.7 Gym tab (question 75 a)

- One switch at the top: **Machines | Exercises**.
- Machines: the 0.4.1 list and machine cards, word for word.
- Exercises: every exercise, **grouped by main muscle** (the same groups as the swap list and the muscle check), each row with equipment, "In the plan: Mon" or "Swap only", the helper words and a small map. A tap opens the same exercise sheet with one map.

### 15.8 Diet tab (questions 76 b, 77 b, 78 a, 79 a)

- **Top:** "Food · Tuesday 17 Nov". **Two rings, protein first, then calories** (the rest timer's ring look), "76 g to go", "1,550 kcal left", then a line with **carbs and fat**, then "Last 7 days, average: …". Targets come from the plan (Today shows the same numbers).
- **The 4 ways row:** Search · Digits · Quick add · Copy yesterday. **"Log again · one tap"** list with "had today". A bottom bar: "Your foods · Scan" (one Scan button only).
- **Today's foods by meal:** Breakfast, Lunch, Dinner, Snacks, each with its kcal and protein; the meal is picked for you from the clock and can be changed.
- **Scanner** on one route only; the camera stops when it closes or the route changes. A misread keeps the camera open ("That read looks wrong. Hold the phone still and try again."). While a good barcode is looked up: "Looking it up · Only the barcode number is sent." "Type the digits" is always offered; the **check digit is tested before any lookup** ("No lookup was made").
- **Search runs only when you tap Search**, never while typing; **UK products only** (question 79 a); "Your foods" come first and work offline; "Make a new food".
- Food syncs in **its own file `food.json`** in the private repo (question 78 a), not inside `progress.json`.

### 15.9 Check step before saving a food

- Every food from Open Food Facts is checked by Rosario before it is saved: "Check before saving. Anyone can add products to Open Food Facts, so numbers can be wrong. Compare with the pack. You can change anything."
- Fields: name, brand · pack · barcode line, per 100 g: calories, protein, carbs, fat (4 fields in a grid). "✓ The numbers add up." or soft warnings in words ("The pack size says 1 gram. That is likely wrong."); warnings never block saving.
- **Portion starts at the pack's serving** when known, else the last amount, else 100 g. **Grams | Pieces** (0.7.4): under "How much did you have?" the existing two-part switch (`segmented two`, as on the Gym tab). Grams: the Portion stepper. Pieces: a standard stepper "Pieces" (+ and − by whole pieces, typed halves allowed), a small muted live line "= 125 g", and a text button "1 piece = 62.5 g · Change" (the pack's own "1 bar (30 g)" as it is). A food with no piece weight shows instead the field "How much does 1 piece weigh? (g)" (a text box with the decimal keypad, so a comma works), the secondary button "Use this weight" and, when a weight exists, the text button "Keep the old weight". The sheet opens in the mode used last for that food. No new colours, sizes or classes. The meal row (Breakfast, Lunch, Dinner, Snacks). Main button "Save and add 43.1 g".
- Open Food Facts text goes in only through `h()`, clipped to **120 letters**; numbers are range-checked; lookups give up after **20 s** with "Open Food Facts did not answer" (**mock-up** and JUDGING.md section 7).

### 15.10 Open Food Facts credit

- The line "Contains data from Open Food Facts, available under the Open Database License." with both names as links, **on every sheet that shows their data and at the foot of the Diet tab**.
