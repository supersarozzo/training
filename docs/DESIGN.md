# Training app design system

Date: 2026-11-16. Written by the task chat "training-app-design" from the `ui-design-principles` template. Agents follow this file for all UI work in `app/`. What the app does: [PRD.md](PRD.md). Screens and flow: [WORKFLOW.md](WORKFLOW.md), section D.

## 1. Overview

- **Product and audience:** a workout guide and log for one beginner (Rosario), used on an iPhone at the gym, one hand, often between sets, sometimes sweaty, the phone on a bench or treadmill shelf.
- **Visual character:** calm, high contrast, big numbers, dark-first, one flat teal accent.
- **Principles:**
  - **Readable at arm's length.** The number you need now (weight, reps, time left) is the biggest thing on the screen.
  - **One main action per screen**, at the bottom, under the thumb.
  - **Big targets.** Main buttons 56 px tall; nothing tappable under 44 px.
  - One flat accent (no gradients); hierarchy through size and weight; hairline borders; shadow only on overlays.
  - No greeting filler, no emoji, no confetti. Plain words.

## 2. Tokens (machine-readable)

```yaml
colors:
  brand:   { 50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4", 300: "#5eead4", 400: "#2dd4bf", 500: "#14b8a6", 600: "#0d9488", 700: "#0f766e", 800: "#115e59", 900: "#134e4a", 950: "#042f2e" }
  neutral: { 50: "#fafafa", 100: "#f4f4f5", 200: "#e4e4e7", 300: "#d4d4d8", 400: "#a1a1aa", 500: "#71717a", 600: "#52525b", 700: "#3f3f46", 800: "#27272a", 900: "#18181b", 950: "#09090b" }
  success: { 400: "#4ade80", 700: "#15803d" }
  warning: { 400: "#fbbf24", 700: "#b45309" }
  error:   { 400: "#f87171", 700: "#b91c1c" }
typography:
  timer:   { size: 96px, weight: 600, line-height: 1.0, tracking: -0.03em, numerals: tabular }
  display: { size: 40px, weight: 600, line-height: 1.1, tracking: -0.02em, numerals: tabular }
  h1:      { size: 28px, weight: 600, line-height: 1.2, tracking: -0.01em }
  h2:      { size: 20px, weight: 600, line-height: 1.3 }
  body:    { size: 17px, weight: 400, line-height: 1.5 }
  small:   { size: 14px, weight: 400, line-height: 1.4 }
spacing: { 1: 4px, 2: 8px, 3: 12px, 4: 16px, 6: 24px, 8: 32px, 12: 48px }
radius:  { badge: 6px, input: 10px, button: 12px, card: 14px, pill: 999px }
border:  { hairline: "1px solid {border.default}", control: "1px solid {border.strong}" }
shadow:  { none: none, overlay: "0 8px 24px rgba(0,0,0,0.28)" }
tap:     { min: 44px, main: 56px, stepper: 56px }
motion:  { fast: 120ms, normal: 200ms, flash: 2000ms, easing: "ease-out" }
```

Body text is 17 px (the iPhone's own default). Inputs are never under 16 px, or the iPhone zooms in on tap.

## 3. Colors (by job)

Components use only these roles, as CSS custom properties (`--bg-canvas`, `--text-primary`, …). Dark mode is a second map of the same roles. The app follows the phone setting (`prefers-color-scheme`), with an override in Settings (Auto / Light / Dark).

| Role | Light | Dark | Use |
|---|---|---|---|
| `bg.canvas` | neutral.50 | neutral.950 | page background |
| `bg.surface` | #ffffff | neutral.900 | cards, set rows, sheets |
| `bg.subtle` | neutral.100 | neutral.800 | pressed rows, secondary fills, done sets |
| `border.default` | neutral.200 | neutral.800 | hairlines between rows and around cards |
| `border.strong` | neutral.500 | neutral.500 | input and stepper outlines (needs 3:1) |
| `text.primary` | neutral.900 | neutral.50 | body, all numbers |
| `text.muted` | neutral.600 | neutral.400 | labels, "last time", captions |
| `brand.primary` | brand.700 | brand.400 | the one accent: main button, current set, active timer ring, links |
| `brand.on-primary` | #ffffff | neutral.950 | text on the main button |
| `brand.primary-pressed` | brand.800 | brand.300 | pressed main button |
| `status.success` | success.700 | success.400 | "Saved to GitHub", new best |
| `status.warning` | warning.700 | warning.400 | timer at zero (flash), "not synced yet", key ends soon |
| `status.error` | error.700 | error.400 | sync failed, "It hurts" |
| `flash.bg` / `flash.text` | warning.400 / neutral.950 | warning.400 / neutral.950 | full-screen flash when a timer ends |

Balance: about 60 % neutral, 30 % surfaces, 10 % accent. Status colours mark state only, never decoration, and always come with words ("Not synced"), never colour alone.

**Checked contrast pairs** (WCAG ratio, computed 2026-11-16):
- Light: text.primary on canvas 16.97, on surface 17.72; text.muted on surface 7.73, on canvas 7.41; on-primary on brand.primary 5.47; brand.primary on surface 5.47; error 6.47, warning 5.02, success 5.02 on surface; border.strong on surface 4.8 (neutral.500).
- Dark: text.primary on canvas 19.06, on surface 16.97; text.muted on surface 6.91, on canvas 7.76; on-primary on brand.primary 10.69; brand.primary on surface 9.52; error 6.40, warning 10.61, success 10.17 on surface; border.strong on surface 3.67.
- Flash: neutral.950 on warning.400 11.92.

## 4. Typography

- **Family:** the phone's system font: `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif`. No web fonts (nothing to download, works offline). No mono font needed.
- **Scale:** only the sizes in the tokens. `timer` only on timer screens; `display` for the current weight and reps; `h1` for the exercise name; `h2` for section heads; `body` for text and buttons; `small` for captions and "last time".
- **Numbers:** always `font-variant-numeric: tabular-nums`, so timers and weights do not jump as digits change.
- Sentence case for headings and buttons ("Start workout", not "START WORKOUT").
- Units in smaller, muted text next to the number: **32.5** kg, **10** reps, **1:30** left.

## 5. Layout and spacing

- **One column**, full width, side gutters `spacing.4` (16 px). Max content width 520 px, centred on bigger screens.
- **Safe areas:** pad top and bottom with `env(safe-area-inset-*)` (notch and home bar).
- **Thumb zone:** the main action sits in a fixed bottom bar (height 56 px plus `spacing.4` padding plus the safe area). Back and Settings sit at the top, where mistakes are less likely.
- **Spacing:** tight inside cards (`spacing.3`), generous between sections (`spacing.8`).
- **One focus per screen:** the current set or the timer. Everything else is smaller and muted.
- **No horizontal scrolling** anywhere, at 320 px wide too.

## 6. Elevation and shape

| Level | Treatment | Use |
|---|---|---|
| 0 flat | surface + hairline border | cards, set rows, inputs, chips |
| 1 overlay | `shadow.overlay` + hairline | the update banner, toasts |
| 2 modal | overlay shadow + scrim (black 50 %) | bottom sheets (swap, "how many more?", form tips), confirm dialogs |

Radius grows with size: badge 6 < input 10 < button 12 < card 14. Full round only for the timer ring and the small pill toggles.

## 7. Components

- **Main button:** `brand.primary` fill, `brand.on-primary` text, `body` size weight 600, height 56 px, full width, radius `button`. One per screen. Pressed: `brand.primary-pressed`. Disabled: `bg.subtle` fill, `text.muted`.
- **Secondary button:** hairline `border.strong`, no fill, `text.primary`, height 48 to 56 px. For Short day, Swap day, Skip.
- **Text button:** `brand.primary` text, no border, at least 44 × 44 px tap area.
- **Stepper (weight and reps):** big value in `display` size between a − and a + button (each 56 × 56 px, hairline `border.strong`, radius `input`). Weight steps by the exercise's smallest step; reps by 1. Tapping the value opens the number keypad (`inputmode="decimal"` for weight, `"numeric"` for reps).
- **Set row:** set number, weight × reps, and a Done button on the right (56 × 56 px). The **current set** has a 2 px `brand.primary` left edge and full-size numbers. Done sets turn `bg.subtle` with a check mark and smaller text. Future sets are muted.
- **"Last time" line:** `small`, `text.muted`, right under the target: "Last time: 30 kg × 12, 12, 11".
- **Timer:** a ring (stroke 8 px, `brand.primary` on `border.default`) around `timer`-size digits (m:ss). Under it: −30 s and +30 s (secondary buttons, 56 px), then "Next: A2 Pulldown · 30 kg × 10" in `body`.
- **Flash:** when a timer ends, the whole screen turns `flash.bg` with "Go" in `display` size for 2 seconds (`motion.flash`), then back. Respect `prefers-reduced-motion`: show the colour without the blink.
- **Bottom sheet:** slides up from the bottom (`motion.normal`), radius `card` on the top corners, a 44 px close area, scrim behind. For "How many more?" (0 / 1 / 2 / 3 / 4+ as five 56 px buttons in one row), swap choices, form tips.
- **Card:** `bg.surface`, hairline, radius `card`, padding `spacing.4`, no shadow.
- **Sync status line:** one line of `small` text with a dot: "● Saved to GitHub at 18:42" (`status.success`), "● 3 workouts not synced yet" (`status.warning`), "● Sync failed: GitHub key expired" (`status.error`). Always words, never only a dot.
- **Metric (Today and weekly):** label `small` muted above the value in `h1` or `display`, tabular. Changes name their baseline: "−0.4 kg vs last week". Plain text, no coloured pills.
- **Chart:** SVG drawn by our own code, one `brand.primary` line, 2 px; single points as small `text.muted` dots; no fill, no gradient; axis labels `small` muted; at most 4 horizontal grid lines in `border.default`. Empty state: "No data yet. Log a weigh-in to start the line."
- **Inputs (intake, settings):** `bg.surface`, hairline `border.strong`, radius `input`, height 48 px, 17 px text, label above in `small`. Focus ring 2 px `brand.primary`. Error text below in `status.error` with words.
- **Empty, loading, error states:** every list and chart has all three (see section 10 for the copy rules).

## 8. Screens (from WORKFLOW D and the PRD)

| Screen | The one big thing | Main action (bottom bar) |
|---|---|---|
| First start | "Start fresh" / "Restore" choice | Continue |
| Intake (one question per page, progress "4 of 19") | the question | Next |
| Targets | calorie and protein numbers, walk start | Looks right |
| Today | day and week ("Monday · Week 3 · Build 1"), blocks with times, food numbers, sync line, Watch reminder | Start workout |
| Walk | timer; speed and slope above it | Done walking |
| Walk result | effort 1 to 10 (ten 44 px buttons, two rows) | Save walk |
| Change-over, lift warm-up | timer; move list for the warm-up | Start weights |
| Pair (exercise and sets) | current set's weight and reps steppers | Done (set) |
| Rest | timer ring | Skip |
| Week 1 "find your weight" | the step ("Set 1: pick a weight") | Done |
| Finish | summary: time, sets, new bests, next time | Save |
| Weigh-in | one number stepper with keypad | Save |
| Progress | weight trend chart; exercise list with charts | – |
| Weekly summary (Monday) | trend change vs the target band | Got it |
| Plan sheet | the week as tables; print layout | Print |
| Settings | groups: Sync, Backup, Gym (steps, machines), Sound, Theme, Shortcuts | – |

**Navigation:** a bottom tab bar only outside a workout: Today · Progress · Plan · Settings (4 tabs, 56 px tall, icon plus label). During a workout the tab bar is hidden; the top bar shows "Pair B · 3 of 6" and a small "End" text button (with a confirm sheet).

**The pair screen at 375 px, top to bottom:** top bar (pair and progress) → exercise name (`h1`) with equipment and a "Tips" text button → target line and "last time" → warm-up sets (collapsed after done) → set rows → the current set's steppers → bottom bar with Done. Swap sits as a text button next to Tips.

## 9. Do / Don't

Do
- Use tokens for every colour, size, space and radius.
- Keep the accent for the main action, the current set and the running timer.
- Put the main action at the bottom; make it 56 px tall.
- Show units, the baseline of every change, and words with every status colour.
- Test at 375 × 812 and 320 wide, light and dark, and with the phone's text size one step larger.

Don't
- Gradients, icon tiles, rows of identical cards, shadows on cards.
- Tiny tap targets, buttons near the top edge for frequent actions, swipe-only actions.
- Rely on sound or colour alone for anything important (the beep may be muted; some people do not see colours well).
- Use `innerHTML` with data (security rule in ARCHITECTURE.md).
- Celebrations, streak nags, or emoji in the interface.

## 10. Copy (words on screen)

- Short and plain. Verbs on buttons ("Save walk", "Start weights").
- Errors say what happened and what to do: "GitHub key expired. Make a new one in Settings."
- Empty states say how to fill them: "No weigh-ins yet. Weigh in tomorrow morning."
- Numbers keep their units. Body weight follows the chosen unit; gym weights are always kg.

## 11. Responsive behaviour

| Name | Width | Changes |
|---|---|---|
| phone | < 640 px | the only target; one column, bottom bar, bottom sheets |
| tablet / desktop | ≥ 640 px | same layout, centred at 520 px; the Plan sheet may use the full width for tables |
| print | – | Plan sheet only: black on white, no bars, tables not split across pages |

Landscape on the phone: the timer screen puts the ring left and the buttons right; other screens scroll.

## 12. Mockups

One throwaway mockup was made to check the pair and rest screens at 375 px: `work/mockups/pair-and-rest.html` (git-ignored, not committed). It uses the tokens above. Result (measured in the browser at 375 × 812): the whole pair screen (5 set rows, two steppers, Done bar) fits without scrolling and with no sideways scroll; all buttons are 56 px tall. One catch: short text buttons ("Tips", "Swap", "End") were 44 px tall but only 23 to 33 px wide, so text buttons need `min-width: 44px` and padding. Build from this file, not from the mockup.

## 13. Known gaps

- App icon not designed yet (build step 8 makes a simple one; the `logo-design` skill can make a better one later).
- Landscape layouts are only sketched in words.
- Exact chart axis rules for very short data (1 to 3 points) are left to the builder, inside the chart rules above.
- Text-size scaling above "one step larger" is not checked.

## 14. Iteration guide

1. Change a token here first, then in `app/css/app.css`.
2. Never add a one-off value in a component; add a token or reuse one.
3. Re-check contrast after any colour change and update the list in section 3.
4. Date this file when edited: 2026-11-16.
