# Open questions

Numbered so Rosario can answer "1 yes, 2 a". Move answered ones to the bottom with the answer and date, and record the decision in DECISIONS.md.

## Open

17. On the first visit, check if the gym has: lat pulldown machine, seated row machine, leg curl machine, pec deck, calf raise machine. The plan works without them (cable versions are used). If they exist, the plan can use them. Also note the dumbbell steps (for example 2, 4, 6 kg or 2, 3, 4 kg). Since 2026-11-18 (answer 82 a) also check: an ankle strap for the cables (for the cable leg curl) and a step or block for calf raises. (A first-visit check, not a question to answer now.)

## Answered

6. Main goal: build muscle. (2026-11-16)
7. Experience: beginner, no training experience. (2026-11-16)
8. Where: The Gym Group York Foss Island, UK. Equipment: see docs/research/2026-11-16-gym-equipment.md. (2026-11-16)
9. Days: 5 a week, Monday to Friday. Minutes per session: see question 13. (2026-11-16)
10. Injuries or health problems: none. (2026-11-16)
11. Apple Watch approach: moved into the intake as question 40. (2026-11-16)
12. GitHub account and repo names: moved into the intake as question 41. (2026-11-16)
13. Session length: about 90 minutes. (2026-11-16)
14. Safe-commands list: approved as it is. (2026-11-16)
15. Cardio: a 30-minute fast uphill treadmill walk. Where it goes in the session is still open: see question 35. (2026-11-16)
16. Pairs or circuits: no preference, so the expert choice applies: pairs of exercises for different muscles, with rest after each pair (see DECISIONS.md and WORKFLOW.md B6). (2026-11-16)
18. Walk placement (asked by the master in chat): dropped, moved into the intake as question 35. (2026-11-16)
19. Models: a) Opus / high effort for research, design, the plan and code review; cheaper models for mechanical steps. (2026-11-16)

### Intake (questions 20 to 44, answered all at once on 2026-11-16)

Full wording, reasons and options are in [WORKFLOW.md](WORKFLOW.md), section A. Answers 20 to 38 are personal and are **not** written here.

20. Health check (PAR-Q+): answered 2026-11-16, kept private (private/ folder).
21. Age: answered 2026-11-16, kept private (private/ folder).
22. Sex for body formulas: answered 2026-11-16, kept private (private/ folder).
23. Height: answered 2026-11-16, kept private (private/ folder).
24. Body weight: answered 2026-11-16, kept private (private/ folder).
25. Unit for body weight: answered 2026-11-16, kept private (private/ folder).
26. Weight goal: answered 2026-11-16, kept private (private/ folder).
27. Goal weight: answered 2026-11-16, kept private (private/ folder).
28. Waist: answered 2026-11-16, kept private (private/ folder).
29. Muscle focus: answered 2026-11-16, kept private (private/ folder).
30. Activity outside the gym: answered 2026-11-16, kept private (private/ folder).
31. Sleep: answered 2026-11-16, kept private (private/ folder).
32. Food targets: answered 2026-11-16, kept private (private/ folder).
33. Diet style: answered 2026-11-16, kept private (private/ folder).
34. Scale at home: answered 2026-11-16, kept private (private/ folder).
35. Walk placement: answered 2026-11-16, kept private (private/ folder).
36. Can walk fast 30 minutes: answered 2026-11-16, kept private (private/ folder).
37. Exercises to avoid: answered 2026-11-16, kept private (private/ folder).
38. Progress photos: answered 2026-11-16, kept private (private/ folder).
39. iOS version: 27.2.1. That is above 18.4, so the app can keep the screen awake. (2026-11-16)
40. Apple Watch link: b) start a Strength workout on the Watch by hand, plus a Shortcuts "Log to Health" button. (2026-11-16)
41. Repo names: a) "training" (public app) and "training-data" (private data). GitHub account: to be created at the repo step (see question 45). (2026-11-16)
42. GitHub key (token) life: b) 1 year. (2026-11-16)
43. Auto sync: a) after each workout and when the app opens, plus buttons. (2026-11-16)
44. Backup file button in Settings: a) yes. (2026-11-16)
45. Your GitHub account name: b) no GitHub account yet. Rosario makes one when the app is ready to go online. (2026-11-16)
46. Start the app design now: a) yes. (2026-11-16)
47. How the first answers get onto the phone: a) a private starter file made from the answers, opened once on the phone; no retyping. (2026-11-16)
48. Start building the app now: a) yes, steps 1 to 11, one worker after another, checked by the master. (2026-11-16)
49. Commit email: a) switch to GitHub's private noreply address and rewrite the unpushed commits before the first push. (2026-11-17)
50. GitHub set-up: a) do it now (build step 12). (2026-11-17)
51. Push the app: a) yes, after the checks (the push itself still waits for Rosario's typed yes in the pushing chat). (2026-11-17)
52. Start the phone test: a) yes. (2026-11-17)
53. Exercise photos: a) use the free-exercise-db photos (public domain). (2026-11-17)
54. Exercise videos: a) plain links that open in Safari (no embed). (2026-11-17)
55. Machine card: a) a picture, the usual sign name, the area, and Rosario's own "where it is in my gym" note. (2026-11-17)
56. Phone test: a) it continues alongside the redesign. (2026-11-17)
57. Redesign: a) run the redesign plan (4 builders, judges, one merge). (2026-11-17)
58. Redesign accent colour: a) volt (redesign A's look). (2026-11-17, "All recommended")
59. Photo size: a) keep the sharp 850 px photos (about 5.4 MB); only the two oversized dead-bug photos shrunk to 850 px. (2026-11-17)
60. Walk minutes on Today vs the walk screen: a) fix the display only, no engine change. (2026-11-17)
61. Swap in the middle of an exercise: a) fix it first, tests in their own commit, then the fix. (2026-11-17)
62. Food logging in the app (a new Diet tab with barcode scan): a) yes, back in scope; designed now together with the Plan tab redesign, built after the Plan tab. (2026-11-17)
63. Barcode decoder: a) a self-hosted open-source decoder, copied into our own site and served from it. The rule changes from "no third-party scripts" to "no scripts loaded from other sites". (2026-11-17)
64. Food database: a) Open Food Facts lookup; only the barcode number or the search word is sent; plus Rosario's own saved foods, which work offline. (2026-11-17)
65. How long a Plan edit lasts: "forever". An add, remove or swap in the Plan tab changes that day of the plan permanently; there is no "just today" option in Plan edit. The existing mid-workout swap stays as it is (one workout only). (2026-11-17)
66. How the redesign runs: research (worker 8.26) → 2 builders who each make a version and review each other → 1 reviewer who judges and merges into a mock-up page (OLD vs NEW, questions on screen) → Rosario picks → build in steps. (2026-11-17)

### Plan, Gym and Diet design (questions 67 to 79, answered all at once on 2026-11-17, "All recommended")

Asked on the mock-up page https://claude.ai/artifact/3PXi5fxUPPUCou1D4Hfw52. Rules: docs/DESIGN.md section 15.

67. How the tab bar keeps 5 tabs: a) Settings leaves the bar; a gear at the top right of every tab. (2026-11-17)
68. Order of the 5 tabs: a) Today · Plan · Gym · Diet · Progress. (2026-11-17)
69. Where the day arrows go: a) at the bottom, on a solid bar above the tabs. (2026-11-17)
70. A big body map of the whole day at the top of each Plan day: a) no; a small map on each card, the first exercise visible without scrolling. (2026-11-17)
71. Which body drawing: b) body-muscles (Apache-2.0), finer shapes, front / side / rear shoulders and lats / mid back apart. (2026-11-17)
72. Where "Add an exercise" puts it: a) at the end of the day, on its own, 3 sets, 60 s rest, at most 2 a day (reviewed engine change, tests first). (2026-11-17)
73. Ask first before "Back to the plan's day": a) yes; ask first and list what goes away, then Undo for 8 s. (2026-11-17)
74. The plan cross-check gaps (back thighs 3 sets a week, calves 3, abs 27): b) a plan review in its own chat; nothing changes until Rosario approves it. (2026-11-17)
75. Gym › Exercises list: a) grouped by main muscle, with "In the plan: Mon". (2026-11-17)
76. Today's food list on the Diet tab: b) meals (Breakfast, Lunch, Dinner, Snacks), picked from the clock. (2026-11-17)
77. Today's totals at the top of Diet: b) two rings, protein first, plus carbs and fat. (2026-11-17)
78. Where the food log syncs: a) its own file in the private repo (`food.json`). (2026-11-17)
79. Open Food Facts name search: a) UK products only. (2026-11-17)

### Plan review (questions 80 to 84, answered on 2026-11-18, "All recommended")

Asked in docs/plan/2026-11-17-plan-review-proposal.md (80 to 83) and by the master in chat (84).

80. Move about 10 abs sets to calves and the back of the thighs: a) yes, all of it (calf raises on the leg press Monday and Wednesday, a leg curl Thursday, fewer abs sets on those days). (2026-11-18)
81. Monday and Wednesday about 1 to 2 minutes longer: a) accept it; plank and side plank keep 2 sets. (2026-11-18)
82. No leg curl machine: a) cable leg curl with an ankle strap, else dumbbell lying leg curl, else a second Romanian deadlift. (2026-11-18)
83. When the change starts: a) as soon as the app is updated; new moves start like week 1. (2026-11-18)
84. How to build: a) in waves, an Opus lead with helpers in parallel (Sonnet for well-specified parts, Opus for delicate parts and checks). (2026-11-18)
