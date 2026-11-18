# Trainer's weekly plan: checked against the evidence

Date: 2026-11-18. Written by worker 8.37 (personal trainer, Opus) for Rosario, coordinated by the Training Agent.
Applies to: [plan v2](2026-11-16-training-plan-v2.md) and its data `app/js/plan/plan-v2.js` (plan id `plan-v2` stays).
Inputs: [plan review proposal](2026-11-17-plan-review-proposal.md) (answers 80-83), [walk check](../research/2026-11-18-walk-check.md), [muscle map check](../research/2026-11-18-muscle-map-check.md), worker 8.36's walk decision D3 (`2026-11-18-trainer-decisions.md`), [DECISIONS](../DECISIONS.md), the STATUS Answers table, and Rosario's private intake.

> **Privacy.** No body data here. Personal numbers (body weight, waist, calorie and protein targets, starting walk speed and slope) stay in the git-ignored `private/` folder. This file says "your body weight" or "the private target".
>
> **Not medical advice.** General guidance for healthy adults. Stop and get help for chest pain, dizziness, trouble breathing or sharp pain.

## 1. The short version

I checked every main choice in plan v2 against at least three independent sources. **The plan is sound and stays almost the same.** Its weekly sets per muscle, its reps and effort, its pairs and rests, its progression rule and its two easier weeks all sit inside what the evidence supports for a beginner who wants to lose fat slowly and build muscle.

**One change:** the walk's top speed goes from 6 km/h down to 5 km/h (the top slope stays 12 %). Worker 8.36 decided this first (its decision D3); I checked it independently and agree. The data change is in `plan-v2.js`.

**Kept on purpose:** your earlier choices 74 b and 80-83 (fewer abs sets, calf raises on Monday and Wednesday, leg curl on Thursday, start at once). The evidence supports them.

**For later (not changed tonight, listed in section 7):** fewer warm-up sets on the small exercises, more calf and back-of-thigh sets in the next 12-week block, and one note for the diet side.

```
 Mon   Tue   Wed   Thu   Fri   Sat Sun
 walk  walk  walk  walk  walk  rest
 upper lower full  upper lower
   A     A   light   B     B
 calf        calf  curl  calf
```

## 2. Your trainer profile (words only)

| Topic | What I know | Where from |
|---|---|---|
| Goal | Lose fat slowly while building muscle (a slow cut). No goal weight for these 12 weeks. Balanced muscle focus. | Intake 26 d, 27 a, 29 a; private plan section 1 |
| Experience | Beginner with weights | Plan v2 header |
| Health | Health check (PAR-Q+) all "no": normal training is fine. No injuries. No exercises to avoid. | Intake 20, 37 a |
| Body | Private: the numbers and the reasons for the slow cut are only in the private plan. | Private plan section 1 |
| Time | Monday to Friday, about 90 minutes each; a 60-minute short day exists for busy days. Weekends rest. | Question 13, plan v2 sections 2 and 4 |
| Sleep and daily life | Enough sleep (the "under 6 hours" rule does not apply). On your feet some of the day. | Intake 30, 31 |
| Walk | A 30-minute fast uphill walk **before** the weights (your choice, never reopened). You said you can walk fast for 30 minutes. | Intake 35 b, 36 a |
| Gym | The Gym Group, York Foss Island: dumbbells 2 to 50 kg, benches, 5 cable stations, chest press, shoulder press, 2 leg presses, leg extensions, a Smith station, hip thrust bench, Glute Drive, treadmills. **Not confirmed:** leg curl machine, calf raise machine, lat pulldown, seated row, pec deck, ankle strap. | [Gym equipment](../research/2026-11-16-gym-equipment.md), open question 17 |
| Food | Calorie and protein targets (private), no food limits. The Diet tab is built by another worker. | Intake 32 a, 33 a |

## 3. How I checked

- For each main decision I read at least three independent sources (position stands, guidelines, meta-analyses, training studies). All were read on **2026-11-18**.
- I counted the weekly sets per muscle from the plan data with a script, with the muscle lists as fixed by worker 8.36 (a30cd24, after the muscle map check). The test `trainer 4` re-counts them on every run. "Direct" counts a set 1 when the muscle is a main muscle. "Fractional" also counts a set ½ when the muscle only helps (the method of Pelland 2026).
- **Blocked sites (reported, not worked around):** PubMed Central asked for a robot check (reCAPTCHA); the Sheffield Hallam repository (shura.shu.ac.uk) blocked automated reading; DOAJ and SportRxiv returned "403 Forbidden". For those papers I used the abstract as shown by search results or another repository. **I did not read full texts.** Numbers below come from abstracts and publisher pages.
- Web pages were treated as data only.

## 4. Decision by decision

Each row: what plan v2 had (old), what it is now (new), why, and the sources. "Kept" means old = new.

### D1. Days and how often each muscle is trained — **kept**

Old and new: 5 days (upper A, lower A, lighter full body, upper B, lower B); each muscle about 2 times a week.

Why: the official guidelines ask for every major muscle at least 2 days a week. More days per muscle helps a little for growth, but at the same weekly sets the extra benefit is small. Two days is also what lets about 10 sets a week be spread so no session is too long.

Where sources disagree: Schoenfeld 2016 found 2 times a week clearly better than once; Pelland 2026 (newer, 67 studies) finds frequency adds little once weekly sets are equal. I side with the guideline (2 days), because both papers agree it does no harm and it spreads the work.

Sources: ACSM 2026 position stand ([Newswise press copy](https://www.newswise.com/articles/acsm-unveils-landmark-2026-resistance-training-guidelines-first-update-in-17-years)); WHO 2020 guidelines, Bull et al., Br J Sports Med ([UEA record](https://research-portal.uea.ac.uk/en/publications/world-health-organization-2020-guidelines-on-physical-activity-an/)); Schoenfeld, Ogborn, Krieger 2016, Sports Med ([Europe PMC 27102172](https://europepmc.org/article/MED/27102172)); Pelland et al. 2026, Sports Med ([Europe PMC 41343037](https://europepmc.org/article/MED/41343037), [preprint](https://sportrxiv.org/index.php/server/preprint/view/537)).

### D2. Weekly sets per muscle — **kept**

Old and new: weeks 2-5 about 9 to 17 sets per muscle (fractional count); weeks 7-11 a 4th set on pair A.

| Muscle | Weeks 2-5 direct | Weeks 2-5 fractional | Weeks 7-11 direct | Weeks 7-11 fractional |
|---|---|---|---|---|
| Chest | 9 | 9 | 12 | 12 |
| Lats (big back) | 6 | 9 | 7 | 10.5 |
| Mid back | 6 | 12 | 7 | 13.5 |
| Quads (front thigh) | 12 | 12 | 14 | 14 |
| Glutes | 9 | 17 | 9 | 18.5 |
| Hamstrings (back thigh) | 6 | 10.5 | 5 | 9.5 |
| Calves | 9 | 12 | 6 | 10 |
| Front shoulders | 6 | 10.5 | 6 | 12 |
| Side shoulders | 8 | 11 | 8 | 11 |
| Biceps | 5 | 11 | 5 | 12 |
| Triceps | 8 | 15.5 | 8 | 17 |
| Abs | 17 | 17 | 19 | 19 |

(Counted with the muscle lists as committed by worker 8.36 in a30cd24. Rows keep one main muscle, the mid back, with the lats as a helper.)

Why: guidelines say about 10 sets per muscle a week for growth. More sets give more growth, with smaller and smaller gains. Beginners already grow well near the low end. Every muscle here sits at about 9 or more. Training in a calorie deficit is a reason to **keep** the sets, not cut them: the weights are the signal that keeps muscle.

Where sources disagree: Schoenfeld 2017 suggests 10+ sets did best; Pelland 2026 finds about 4 fractional sets already give a measurable effect, with steady but shrinking gains above. Both agree that 9 to 15 is a good range for a beginner. Chest at 9 in weeks 2-5 is the lowest big muscle; it rises to 12 in weeks 7-11, so I keep it.

The back-of-thigh and calf sets drop a little in weeks 7-11 (the D exercise goes to 2 sets then, to keep the session near 90 minutes). They still stay at about 10 fractional sets, inside the guideline. I keep this for now and raise it in the next block (section 7).

Sources: ACSM 2026 (above); Schoenfeld, Ogborn, Krieger 2017, J Sports Sci ([Europe PMC 27433992](https://europepmc.org/article/MED/27433992)); Pelland et al. 2026 (above).

### D3. Reps and effort — **kept**

Old and new: big exercises 8-12 reps, small ones 10-15 or 12-15; stop with 2 reps left (Wednesday 3, week 11 one to two, easier weeks 4).

Why: muscles grow about the same with light or heavy weights if sets are hard enough; heavier weights build more strength. 8 to 15 reps is a safe middle for a beginner. Stopping close to failure helps growth, but going all the way to failure is not needed.

Where sources disagree: Robinson 2024 finds growth improves as sets end closer to failure; ACSM 2026 says training to failure did not consistently change results. I side in the middle: 2 reps left most weeks (good growth, low injury risk while learning), and 1 to 2 left in week 11 only.

Sources: Schoenfeld et al. 2017, J Strength Cond Res, low vs high loads ([PubMed 28834797](https://pubmed.ncbi.nlm.nih.gov/28834797/)); Schoenfeld, Grgic, Van Every, Plotkin 2021, Sports, loading recommendations ([doi 10.3390/sports9020032](https://doi.org/10.3390/sports9020032)); Robinson et al. 2024, Sports Med, proximity to failure ([Abertay record](https://rke.abertay.ac.uk/en/publications/exploring-the-dose-response-relationship-between-estimated-resist/)); ACSM 2026 (above).

### D4. Pairs and rest — **kept**

Old and new: two exercises for different muscles one after the other (a pair, or superset), about 30 seconds to move, then 60 to 90 seconds rest; the same muscle comes back after more than 2 minutes.

Why: pairs of opposite or unrelated muscles give the same growth as normal sets and save time. Rest longer than 60 seconds helps a little; longer than 90 seconds shows no further gain in growth. In our pairs each muscle rests more than 2 minutes.

Where sources disagree: Schoenfeld 2016 (trained men) found 3 minutes better than 1 minute; Singer 2024 (9 studies) found only a small benefit above 60 seconds and none above 90. Our pairs give each muscle well over 90 seconds, so both are satisfied.

Sources: Zhang et al. 2025, Sports Med, supersets ([doi 10.1007/s40279-025-02176-8](https://doi.org/10.1007/s40279-025-02176-8), [Leeds Beckett full text](https://eprints.leedsbeckett.ac.uk/id/eprint/11908)); Singer et al. 2024, Front Sports Act Living ([Frontiers](https://frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2024.1429789/abstract)); Schoenfeld et al. 2016, J Strength Cond Res ([PubMed 26605807](https://pubmed.ncbi.nlm.nih.gov/26605807/)).

### D5. Start weights and progression — **kept**

Old and new: week 1 finds each weight with 2 sets and about 3 reps left; then "double progression": add reps inside the range, and when every set reaches the top with a rep or more left, add the smallest weight step. A jump bigger than about 10 % waits until you get 2 reps above the range.

Why: adding reps and adding weight both work for growth. Fitness-trainer guides use a "2-for-2" rule and steps of about 2 to 5 % for the upper body and 5 to 10 % for legs. Our rule is close to that and a little quicker, which suits a beginner who gets stronger fast.

Where sources disagree: the 2-for-2 rule waits for 2 extra reps on two sessions; ours moves after one session at the top. For a beginner the faster step is fine, and our "two bad sessions in a row → 10 % lighter" rule catches a step that was too big.

Sources: Plotkin et al. 2022, PeerJ, load vs reps progression ([PeerJ 14142](https://peerj.com/articles/14142)); NSCA-style 2-for-2 rule and step sizes as taught for trainer exams ([USCG wellness column](https://www.mycg.uscg.mil/News/Article/2910464/total-force-wellness-column-guidelines-to-progress-your-physical-training-over/), [CSCS study guide](https://open-exam-prep.com/study-guides/cscs/program-design/resistance-training-program-design)); ACSM 2026 (above). Note: I could not open the NSCA's own text; the rule is widely credited to it but one guide calls it a common heuristic.

### D6. Easier weeks (deloads) and the 12-week rhythm — **kept**

Old and new: week 6 and week 12 are easier: one set less per exercise, same weights as the week before, 4 reps left. An automatic earlier easier week if 3 or more exercises needed a 10 % drop within 2 weeks or every session felt 9-10 out of 10.

Why: coaches who were asked in a formal expert survey usually plan a lighter week every 4 to 6 weeks, mostly by cutting sets. A study that **stopped** training for a week in the middle of 9 weeks found no extra growth and a little less strength. So a lighter week (not a week off) at weeks 6 and 12 is right. Complex periodization is not needed for most adults.

Where sources disagree: coaches favour planned deloads; the only trial found no benefit from a full stop. I keep a lighter week, not a week off, so both points are met. Week 12 is also the review week.

Sources: Bell et al. 2023, Sports Med Open, deloading Delphi consensus ([shura.shu.ac.uk record](https://shura.shu.ac.uk/32417), full text blocked); Coleman et al. 2024, PeerJ, one-week deload ([PeerJ 16777](https://peerj.com/articles/16777)); ACSM 2026 (above).

### D7. Calves and the back of the thighs — **kept** (your answers 80-83)

Old and new: calf raise on the leg press on Monday and Wednesday, standing calf raise on Friday; Romanian deadlift on Tuesday, dumbbell lying leg curl on Thursday, cable pull-through on Friday.

Why: straight-knee calf raises (leg press, Smith, standing) grow the big calf muscle much more than seated ones. The back of the thigh needs both a hip-hinge move (Romanian deadlift) and a knee-bend move (leg curl); a **seated** leg curl grows it most, so it is the first swap if the gym has one. The uphill walk works the calves for endurance, but it does not replace hard sets.

Sources: Kinoshita et al. 2023, Front Physiol ([Frontiers full text](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2023.1272106/full)); Maeo et al. 2021, Med Sci Sports Exerc, seated vs lying leg curl ([PubMed 33009197](https://pubmed.ncbi.nlm.nih.gov/33009197/)); Bourne et al. 2017, Br J Sports Med, different hamstring exercises use different parts ([Europe PMC 27467123](https://europepmc.org/article/MED/27467123)); Maeo et al. 2024, Med Sci Sports Exerc ([Europe PMC 38857522](https://europepmc.org/article/MED/38857522)).

### D8. The walk — **one change: top speed 6 → 5 km/h**

Old: 30 minutes first (3 build-up + 27 fast), 5 days, effort 5 to 6 out of 10 (leg days 4 to 5 and 2 % less slope); progress +1 % slope up to 12 %, then +0.2 km/h up to **6 km/h**.
New: the same, but the top speed is **5 km/h**. The top slope stays 12 % (10 % on leg days). Worker 8.36's decision D3; I agree.

Why keep the walk first: cardio with weights does not reduce muscle growth or strength in the large reviews; doing weights first gives at most a little more leg strength. 150 minutes a week of moderate cardio meets the guideline; diet does most of the fat loss.
Why lower the top: interference from cardio grows with how long, how often and how hard it is (strongest with running). At 12 % and 6 km/h the walk is about 10 METs, a vigorous workout, not a warm-up before heavy legs. At 12 % and 5 km/h it is about 8.5 METs, close to the well-known "12-3-30" walk. The effort rule still decides each step; the cap only stops the walk from drifting into running-level effort.

Where sources disagree: Wilson 2012 found interference, mainly with running and long or frequent cardio; Schumann 2022 (43 studies, newer) found none for size or strength. I keep the walk (Schumann) and cap how hard it can get (Wilson), because the walk comes right before the weights.

Sources: Schumann et al. 2022, Sports Med ([JCU repository](https://researchonline.jcu.edu.au/71546/)); Wilson et al. 2012, J Strength Cond Res ([record](https://pesquisa.bvsalud.org/sms/resource/pt/mdl-22002517)); Eddens et al. 2018, Sports Med, exercise order ([Springer](https://link.springer.com/doi/10.1007/s40279-017-0784-1)); WHO 2020 (above); AHA 2026 statement and ACSM 2009 weight-loss position paper, as summarised in the [walk check](../research/2026-11-18-walk-check.md) ([AHA news](https://newsroom.heart.org/news/move-more-for-your-health-not-just-for-the-scale), [NCBI Bookshelf NBK565813](https://www.ncbi.nlm.nih.gov/books/NBK565813/)).

What this means for you: the walk gets harder only by slope once you reach 5 km/h. If you already walk faster than 5 km/h, the app keeps your speed and never raises it.

### D9. Training while eating less — **kept, with a note for the diet side**

Old and new: same plan on a slow cut.

Why: a review of studies found that eating less than you burn slows muscle gain, and a gap of about 500 kcal a day or more stopped it on average; strength still rose. Keep the weights hard and the sets the same; keep protein high; and keep the food gap moderate. This is not a training change, so it goes to the Training Agent and the Diet worker as a note (section 7).

Sources: Murphy and Koehler 2022, Scand J Med Sci Sports ([TUM record](https://portal.fis.tum.de/en/publications/energy-deficiency-impairs-resistance-training-gains-in-lean-mass-/), doi 10.1111/sms.14075); ACSM 2026 (above); the plan's own WORKFLOW B4 rule (loss no faster than 1 % of body weight a week).

## 5. Changes to your earlier choices

**None.** I kept 74 b and 80-83 exactly:
- 74 b and 80 a (move about 10 abs sets to calves and the back of the thighs): supported by D2 and D7.
- 81 a (accept 1 to 2 extra minutes on Monday and Wednesday): kept.
- 82 a (leg curl fallback order): kept. Seated leg curl machine first if the gym has one (Maeo 2021).
- 83 a (start as soon as the app is updated, new moves start like week 1): kept.

## 6. The plan, week by week

Every day starts the same way: walk 30 minutes (your private starting row; leg days 2 % less slope), 2 to 3 minutes change-over, 4-minute lift warm-up, then the weights. Warm-up sets (about 50 % × 10, then 75 % × 5) come before the first exercise of each pair. Saturday and Sunday: rest (a relaxed walk outside is fine).

| Weeks | Phase | Sets | Effort (reps left) | Weights | Walk |
|---|---|---|---|---|---|
| 1 | Learn, find weights | 2 per exercise | 3 | Find your start weight (plan v2 section 8) | Starting row, no increase |
| 2-5 | Build 1 | As in the tables | 2 (Wednesday 3) | Double progression | Progress by the effort rule, top 12 % and 5 km/h |
| 6 | Easier week | 1 less per exercise | 4 | Same as week 5 | Same as week 5 |
| 7-10 | Build 2 | Pair A gets a 4th set; D drops to 2 | 2 (Wednesday 3) | Double progression | Progress by the effort rule |
| 11 | Push | As weeks 7-10 | 1-2 (Wednesday 3) | Aim for the top of every range | No increase |
| 12 | Easier week + review | 1 less per exercise | 4 | Same as week 11 | Same as week 11 |

The numbers in the day tables are **sets** for that week. Pair rest: "move on" means about 30 seconds to walk to the second exercise; the rest after the second exercise is in the Rest column.

#### Monday: Upper body A

| Place | Exercise | Reps | Rest | Week 1 | Weeks 2-5 | Week 6 | Weeks 7-10 | Week 11 | Week 12 |
|---|---|---|---|---|---|---|---|---|---|
| A1 | Chest press | 8-12 | move on (about 30 s) | 2 | 3 | 2 | 4 | 4 | 2 |
| A2 | Pulldown | 10-12 | 90 s | 2 | 3 | 2 | 4 | 4 | 2 |
| B1 | Shoulder press | 8-12 | move on (about 30 s) | 2 | 3 | 2 | 3 | 3 | 2 |
| B2 | One-arm dumbbell row | 8-12 each side | 90 s | 2 | 3 | 2 | 3 | 3 | 2 |
| C1 | Dumbbell curl | 10-15 | move on (about 30 s) | 2 | 3 | 2 | 3 | 3 | 2 |
| C2 | Triceps pushdown | 10-15 | 60 s | 2 | 3 | 2 | 3 | 3 | 2 |
| Abs | Plank | 20-40 s | 30 s | 2 | 2 | 1 | 2 | 2 | 1 |
| D | Calf raise on the leg press | 12-15 | 60 s between sets | 2 | 3 | 2 | 2 | 2 | 2 |
| | **Effort (reps left)** | | | 3 | 2 | 4 | 2 | 1-2 | 4 |

#### Tuesday: Lower body A

| Place | Exercise | Reps | Rest | Week 1 | Weeks 2-5 | Week 6 | Weeks 7-10 | Week 11 | Week 12 |
|---|---|---|---|---|---|---|---|---|---|
| A1 | Leg press | 10-12 | move on (about 30 s) | 2 | 3 | 2 | 4 | 4 | 2 |
| A2 | Cable crunch | 10-15 | 90 s | 2 | 3 | 2 | 4 | 4 | 2 |
| B1 | Romanian deadlift | 8-12 | move on (about 30 s) | 2 | 3 | 2 | 3 | 3 | 2 |
| B2 | Face pull | 12-15 | 90 s | 2 | 3 | 2 | 3 | 3 | 2 |
| C1 | Hip thrust | 8-12 | move on (about 30 s) | 2 | 3 | 2 | 3 | 3 | 2 |
| C2 | Dead bug | 8 each side | 75 s | 2 | 3 | 2 | 3 | 3 | 2 |
| D | Leg extension | 12-15 | 60 s between sets | 2 | 3 | 2 | 2 | 2 | 2 |
| | **Effort (reps left)** | | | 3 | 2 | 4 | 2 | 1-2 | 4 |

#### Wednesday: Full body (a bit lighter)

| Place | Exercise | Reps | Rest | Week 1 | Weeks 2-5 | Week 6 | Weeks 7-10 | Week 11 | Week 12 |
|---|---|---|---|---|---|---|---|---|---|
| A1 | Goblet squat | 8-12 | move on (about 30 s) | 2 | 3 | 2 | 4 | 4 | 2 |
| A2 | Dumbbell bench press | 8-12 | 90 s | 2 | 3 | 2 | 4 | 4 | 2 |
| B1 | Pulldown | 10-12 | move on (about 30 s) | 2 | 3 | 2 | 3 | 3 | 2 |
| B2 | Lateral raise | 12-15 | 75 s | 2 | 2 | 1 | 2 | 2 | 1 |
| C1 | Hammer curl | 10-15 | move on (about 30 s) | 2 | 2 | 1 | 2 | 2 | 1 |
| C2 | Overhead triceps extension | 10-15 | 60 s | 2 | 2 | 1 | 2 | 2 | 1 |
| Abs | Side plank | 15-30 s | 30 s | 2 | 2 | 1 | 2 | 2 | 1 |
| D | Calf raise on the leg press | 12-15 | 60 s between sets | 2 | 3 | 2 | 2 | 2 | 2 |
| | **Effort (reps left)** | | | 3 | 3 | 4 | 3 | 3 | 4 |

#### Thursday: Upper body B

| Place | Exercise | Reps | Rest | Week 1 | Weeks 2-5 | Week 6 | Weeks 7-10 | Week 11 | Week 12 |
|---|---|---|---|---|---|---|---|---|---|
| A1 | Incline dumbbell press | 8-12 | move on (about 30 s) | 2 | 3 | 2 | 4 | 4 | 2 |
| A2 | Seated cable row | 8-12 | 90 s | 2 | 3 | 2 | 4 | 4 | 2 |
| B1 | Seated dumbbell shoulder press | 8-12 | move on (about 30 s) | 2 | 3 | 2 | 3 | 3 | 2 |
| B2 | Face pull | 12-15 | 75 s | 2 | 3 | 2 | 3 | 3 | 2 |
| C1 | Lateral raise | 12-15 | move on (about 30 s) | 2 | 3 | 2 | 3 | 3 | 2 |
| C2 | Triceps pushdown | 10-15 | 60 s | 2 | 3 | 2 | 3 | 3 | 2 |
| Abs | Plank | 20-40 s | 30 s | 2 | 2 | 1 | 2 | 2 | 1 |
| D | Dumbbell lying leg curl | 10-15 | 60 s between sets | 2 | 3 | 2 | 2 | 2 | 2 |
| | **Effort (reps left)** | | | 3 | 2 | 4 | 2 | 1-2 | 4 |

#### Friday: Lower body B

| Place | Exercise | Reps | Rest | Week 1 | Weeks 2-5 | Week 6 | Weeks 7-10 | Week 11 | Week 12 |
|---|---|---|---|---|---|---|---|---|---|
| A1 | Smith machine squat | 8-12 | move on (about 30 s) | 2 | 3 | 2 | 4 | 4 | 2 |
| A2 | Reverse crunch | 10-15 | 90 s | 2 | 3 | 2 | 4 | 4 | 2 |
| B1 | Hip thrust | 8-12 | move on (about 30 s) | 2 | 3 | 2 | 3 | 3 | 2 |
| B2 | Lateral raise | 12-15 | 75 s | 2 | 3 | 2 | 3 | 3 | 2 |
| C1 | Cable pull-through | 12-15 | move on (about 30 s) | 2 | 3 | 2 | 3 | 3 | 2 |
| C2 | Side plank | 15-30 s | 60 s | 2 | 2 | 1 | 2 | 2 | 1 |
| D | Standing calf raise | 12-15 | 60 s between sets | 2 | 3 | 2 | 2 | 2 | 2 |
| | **Effort (reps left)** | | | 3 | 2 | 4 | 2 | 1-2 | 4 |

**Swaps** (busy machine, not liked, or it hurts) are unchanged from [plan v2 section 6](2026-11-16-training-plan-v2.md). Machines marked Q17 show only once Settings says the gym has them. **First gym visit:** check for a seated or lying leg curl machine, a calf raise machine and an ankle strap; if a seated leg curl exists, make it Thursday's D with Plan edit.

**Watch rules** (unchanged): if the calves are still sore on walk days after week 2, do 2 sets of the Monday and Wednesday calf raises for a week. Stop for sharp pain at the back of the heel. If the back of the thighs is very sore on Friday, keep Thursday's leg curl at 3 reps left for a week. Finish a walk out of breath → the next walk is 1 % less steep.

## 7. For later: recommended, not changed tonight

| # | What | Why | Who decides or builds |
|---|---|---|---|
| L1 | Warm-up sets only before the first exercise for each muscle (pairs A and B); pair C (curls, pushdowns, raises) gets one light set at most. Saves about 2 minutes a day. | Warm-up sets help heavy lifts; small exercises after the muscle is already warm need little. This is coaching practice; I found no trial on it. | The engine owner (`engine/workout.js`), with a test first. Not urgent. |
| L2 | Next 12-week block: keep the D exercise (calves, leg curl) at 3 sets in weeks 7-11, using the 2 minutes from L1. | Calves and the back of the thighs drop to about 10 fractional sets in weeks 7-11; more sets give more growth (D2). | The trainer, at the week-12 review. Needs a change to the week rule in `plan-v2.js` and `engine/planedits.js` together. |
| L3 | Diet note: keep the food gap at about 500 kcal a day or less. If the weekly check says "losing too slowly", add steps first, then cut food. | Murphy and Koehler 2022 (D9). | The Training Agent and the Diet worker. Private numbers stay in `private/`. |
| L4 | The cable pull-through is labelled "hamstrings" in `plan-v2.js`, but its muscle data says glutes are the main muscle. Words only; it changes the Gym grouping. | Muscle map check, "could add" list. | The trainer, with the Gym screen owner. |

## 8. What changes in the app

- `app/js/plan/plan-v2.js`: `walkRules.maxSpeed_kmh` 6 → 5, committed by worker 8.36 in 9c851b1 with its walk tests; I checked and agreed, so I made no further data edit. No exercise, day, slot, set, rest or week rule changes. No exercise id is added, removed or renamed, so saved logs, `exercise_state` and Plan edits (`p-plan-v2-<day>`) stay valid.
- [Plan v2](2026-11-16-training-plan-v2.md) section 9 now says the top is 12 % and about 5 km/h.
- `tests/trainer-plan.test.mjs` locks these decisions: every exercise id still exists, the plan's days are unchanged, every major muscle has about 9 or more fractional sets in every build week, calves and the back of the thighs are trained on at least 2 days, and the walk top is 12 % and 5 km/h.

## 9. Not verified

- **Machines at the gym:** leg curl (seated or lying), calf raise machine, lat pulldown, seated row and ankle strap are still not confirmed (open question 17). The plan works without them.
- **Full texts:** I read abstracts and publisher pages, not full papers. PubMed Central, the Sheffield Hallam repository, DOAJ and SportRxiv blocked automated reading.
- **The ACSM 2026 position stand** was read through its press release, not the paper.
- **The NSCA 2-for-2 rule** was read through trainer guides; the NSCA's own text was not opened.
- **Time per session** comes from plan v2's simple model, not from a timed session.
- **Effort:** reps left and the walk effort are felt, not measured; the plan relies on honest answers.
- I did not test the app on the phone; the change is one number in the walk rules, covered by unit tests.
