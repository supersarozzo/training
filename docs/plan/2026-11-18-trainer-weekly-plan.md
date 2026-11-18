# Trainer's weekly plan: checked against the evidence

Date: 2026-11-18. Written by worker 8.37 (personal trainer, Opus) for Rosario, coordinated by the Training Agent.
Applies to: [plan v2](2026-11-16-training-plan-v2.md) and its data `app/js/plan/plan-v2.js` (plan id `plan-v2` stays).
Inputs: [plan review proposal](2026-11-17-plan-review-proposal.md) (answers 80-83), [walk check](../research/2026-11-18-walk-check.md), [muscle map check](../research/2026-11-18-muscle-map-check.md), worker 8.36's walk decision D3 (`2026-11-18-trainer-decisions.md`), [DECISIONS](../DECISIONS.md), the STATUS Answers table, and Rosario's private intake.

> **Privacy.** No body data here. Personal numbers (body weight, waist, calorie and protein targets, starting walk speed and slope) stay in the git-ignored `private/` folder. This file says "your body weight" or "the private target".
>
> **Not medical advice.** General guidance for healthy adults. Stop and get help for chest pain, dizziness, trouble breathing or sharp pain.

## 1. The short version

I checked every main choice in plan v2 against at least three independent sources. D10 (added later the same night) sets the rule for "Stop this exercise here". **The plan is sound and stays almost the same.** Its weekly sets per muscle, its reps and effort, its pairs and rests, its progression rule and its two easier weeks all sit inside what the evidence supports for a beginner who wants to lose fat slowly and build muscle.

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

### D10. "Stop this exercise here" (new in 0.6.0) — **keep 8.35's default, plus one rule for the next version**

Asked by the Training Agent on 2026-11-18. In 0.6.0 you can end an exercise before all its sets are done. 8.35's safe default (commit 03d4e2b): next time the weight stays the same and does not go up.

**My rule:**

| What happened last time | Next time |
|---|---|
| It hurt, or form broke | The pain rule, as today: lower the weight, no increase until form is good. Pain should be reported with Swap › "It hurts", not with Stop. |
| Stopped early, any number of sets done | **Same weight.** Aim to finish every set at that weight. (8.35's default.) |
| Stopped early **twice in a row** on this exercise, and both times at least one set was below the bottom of the rep range | **One smallest step lighter**, back to the bottom of the range. (Next version.) |
| A set 3 or more reps below the range, two sessions in a row | 10 % lighter, as today. This rule comes first. |
| Easier week or week 1 | Same weight, as today. The "one step lighter" rule does not fire in these weeks (see 8.39 answer T1). |

Bodyweight and timed exercises (plank, dead bug, reverse crunch): same target; they never go "lighter".

**Why:**
1. *Hold, do not raise.* Double progression raises the weight only when **every planned set** reached the top of the range. Stopping early leaves the last sets untested, and later sets are where reps drop. So the evidence for "ready for more" is missing. Holding costs at most one session of progress.
2. *Do not lower after one stop.* One missed set is a small part of the week's 9 to 17 sets for that muscle. Growth follows the weekly total with smaller and smaller gains, so one short session barely matters. People stop for many reasons (time, a busy machine, a bad day). Lowering after one stop would punish a time problem as if it were a strength problem.
3. *Lower after two stops with missed reps.* Two short sessions in a row, **with** reps below the range both times, show that the weight is too heavy for now. This often happens on a calorie cut. Changing the weight to match how you perform on the day works as well as fixed plans. A one-step drop is milder than the 10 % rule, which still catches bigger misses.
4. *The reason for stopping.* It matters, but the app does not record it, and asking takes another tap at the gym. Time and tiredness look the same in the data, and the rule above treats them fairly: hold first, lower only when reps were missed twice. Pain is the one reason that must change the weight at once. It already has its own path (Swap › "It hurts"). The Stop question should point to that path, not take a pain answer of its own.

Sources (read 2026-11-18): Hickmott et al. 2022, Sports Med Open, adjusting load and volume to daily performance gives strength and growth similar to fixed plans ([PubMed 35038063](https://pubmed.ncbi.nlm.nih.gov/35038063/)); Plotkin et al. 2022 (D5) and the 2-for-2 rule (D5): move up only when the whole planned work is done with reps to spare; Pelland et al. 2026 and Schoenfeld 2017 (D2): growth follows weekly sets with diminishing returns, so one short session costs little; plan v2 section 9: two bad sessions before lowering, pain lowers at once.

**For 8.35 (next version, not 0.6.0):** in `engine/progression.js` `nextSuggestion`, right after the easier-week / week-1 hold and before the `last.stopped` hold (corrected 2026-11-18, answer T1 to 8.39; first written as "before the easier-week check"): if `last.stopped && previous?.stopped`, the exercise is not bodyweight, and both sessions have a set below `low`, then return `action: "lower"`, `weight_kg: stepDown(w, exerciseId, settings)`, `range: [low, top]`, note "You stopped early twice and missed the range. One step lighter." The existing `last.stopped` hold stays as it is. A test comes first: stopped twice + below range → lower; stopped twice in range → hold; stopped once → hold; bodyweight → hold. Optional words on the Stop confirm: "Does it hurt? Use Swap › It hurts instead."

### D11. Training before the plan's start date: a practice week — **new**

Asked by the Training Agent on 2026-11-18. The plan starts on a Monday (`block.start_monday`). You want to train before that date.

**My rule:**
1. **Every day before `start_monday` is a practice day.** Today shows the day's workout with a **Start** button and the day picker, exactly as in week 1. The default day is the calendar day (Wednesday → Wednesday's workout). Saturday and Sunday show the rest card, and the picker can still start any day.
2. **Practice days use the week-1 rules:** 2 sets per exercise, stop with about 3 reps left, the find-your-weight steps (D5 and plan v2 section 8), no weight increases, the walk at your starting row with no walk increase. The app already does most of this: `weekInfo()` treats any week below 1 as week 1. A practice session is saved with `week: 0`.
3. **Practice does not move the plan.** `start_monday` stays. Week 1 still starts on that Monday, and the 12 weeks end on the same date. The Monday measurements and photos stay on Monday of week 1.
4. **What practice carries over:** the weights you found. In week 1, an exercise you already practised starts at the found weight. Week 1 is still a learn week (2 sets, about 3 reps left) and may adjust once more with the same table. Week 2 then starts the normal progression.
5. **Words:** the label reads **"Practice week · Learn, find weights"**, never "Week 0". Under it: "Your plan starts on Monday <date>. Practice now: find your weights and learn the moves."
6. **Weekly check-in:** the Monday check-in of week 1 may list the practice workouts, but it never judges food or weight targets for them (weeks 1 and 2 change nothing anyway). Practice workouts do not count toward "workouts done out of 5".
7. **Missed-time rules** count a practice session as a session, so a long gap before week 1 still lowers the weights as plan v2 section 11 says.

"Week 0" therefore means only "before the plan": practice days, saved with `week: 0`, never shown as a number.

**Why:**
- *Not "move the start to this Monday":* Monday and Tuesday are already gone, so week 1 would lose two learn days (half the exercises would reach the build weeks without a found weight), and the Monday measurement day would be missed.
- *Not "start week 1 today":* the plan's weeks follow the calendar from a Monday. A Wednesday start breaks the Monday check-in and the rule "a missed Monday does not move the week".
- *A practice week is a bonus for a beginner.* Early strength gains in a beginner come largely from learning the movement, so an extra low-effort exposure helps form and confidence. The first sessions also bring the worst muscle soreness, and one bout protects the muscle from the next (the "repeated bout effect"): better that this soreness lands in practice than in week 1. With 2 sets and about 3 reps left, three practice days before a 5-day week 1 are a light load.

Sources (read 2026-11-18): ACSM progression models for novices (start at an 8-12 RM load, 1 to 3 sets; early gains are mainly motor learning), as summarised in the [Journal of Clinical Exercise Physiology review](https://jcep.kglmeridian.com/view/journals/ceph/2/1/article-p8.xml) and the [2002 position stand abstract](https://pubmed.ncbi.nlm.nih.gov/11828249/); repeated bout effect: Hyldahl, Chen and Nosaka 2017, Exerc Sport Sci Rev 45(1):24-33 ([ECU repository](https://ro.ecu.edu.au/ecuworkspost2013/2605)); plan v2 sections 8, 10 and 11 (week 1, Monday-based weeks, missed sessions).

**Tests for 8.39 to write first (they fail until the build):**
1. A date before `start_monday` (made-up start): Today shows a Start button and the day picker; the default day is the calendar day; Saturday shows the rest card with the picker.
2. A practice session is saved with `week: 0`; `setsFor(0, day, slot)` equals week 1's sets; `rirFor(0, day)` is 3; `weekInfo(0).progression` and `walkProgress` are false.
3. The Today label is "Practice week · Learn, find weights"; the text "Week 0" appears nowhere.
4. After a practice workout, `block.start_monday` is unchanged and `weekNumber(start, start)` is still 1.
5. In week 1, an exercise found in practice starts at the found weight; week 1 still shows 2 sets and about 3 reps left.
6. The week-1 Monday check-in does not count practice workouts in "done out of 5" and does not judge targets.

### D12. First-try weights in the learn week — **new**

Asked by the Training Agent on 2026-11-18. In the learn week the cards say "Find it" and show no number. You expect a number.

**My rule:** before an exercise has any weight (none set in the Plan, none logged, none found), the card shows **"Try <kg>"**, with the note "First try. Set 1 tells us if it is right." The find-your-weight steps (D5, plan v2 section 8) then correct it from set 1: up to 2 steps up or down.

**Week 2 and later (added 2026-11-18, asked by 8.39's checker):** an exercise first done in week 2 or later (for example one added in the Plan) still starts at "Try <kg>". The find-your-weight steps do not run then, so the note reads instead: "First try. Set 1 too easy (4 or more reps left) or too hard? Change the weight one step for the next set." The normal progression takes over from the next workout. The practice week and week 1 keep the note above.

**Order (the first one that exists wins):** your own weight set in the Plan → the suggestion from your logs (progression) → the weight found in week 1 or practice → **the first-try table below**.

**First-try table (adult man, beginner).** Dumbbell numbers are **per dumbbell**. Stack numbers are the number on the machine's weight stack. Smith machine and hip thrust numbers are **the plates added in total (both sides), the bar not counted**.

| Exercise | First try (kg) | Exercise | First try (kg) |
|---|---|---|---|
| Chest press (machine) | 20 | Leg press | 40 |
| Dumbbell bench press | 10 | Leg extension | 20 |
| Incline dumbbell press | 8 | Goblet squat (1 dumbbell) | 12 |
| Shoulder press (machine) | 15 | Smith machine squat (plates) | 10 |
| Seated dumbbell shoulder press | 8 | Hip thrust (plates) | 20 |
| Pulldown (cable) | 30 | Dumbbell glute bridge (1 dumbbell) | 12 |
| Lat pulldown machine | 30 | Romanian deadlift (dumbbells) | 12 |
| One-arm dumbbell row | 12 | Cable pull-through | 15 |
| Seated cable row | 30 | Calf raise on the leg press | 40 |
| Seated row machine | 30 | Standing calf raise, Smith (plates) | 10 |
| Dumbbell curl | 6 | Calf raise machine | 30 |
| Hammer curl | 6 | One-leg dumbbell calf raise | 6 |
| Cable curl | 10 | Dumbbell lying leg curl (1 dumbbell) | 6 |
| Triceps pushdown | 15 | Leg curl machine | 15 |
| Overhead triceps extension (cable) | 10 | Standing cable leg curl | 5 |
| Lateral raise | 4 | Cable crunch | 20 |
| Cable lateral raise | 5 | Face pull | 15 |
| Dumbbell rear-delt raise | 4 | | |

Exercise ids for the build: `chest_press` 20, `db_bench_press` 10, `incline_db_press` 8, `shoulder_press_machine` 15, `seated_db_shoulder_press` 8, `pulldown` 30, `lat_pulldown_machine` 30, `one_arm_db_row` 12, `seated_cable_row` 30, `seated_row_machine` 30, `db_curl` 6, `hammer_curl` 6, `cable_curl` 10, `triceps_pushdown` 15, `overhead_triceps_ext` 10, `lateral_raise` 4, `cable_lateral_raise` 5, `rear_delt_raise` 4, `face_pull` 15, `leg_press` 40, `leg_extension` 20, `goblet_squat` 12, `smith_squat` 10, `hip_thrust` 20, `db_glute_bridge` 12, `romanian_deadlift` 12, `cable_pull_through` 15, `calf_raise_leg_press` 40, `calf_raise_standing` 10, `calf_raise_machine` 30, `one_leg_db_calf_raise` 6, `db_lying_leg_curl` 6, `leg_curl_machine` 15, `cable_leg_curl` 5, `cable_crunch` 20.

Bodyweight and timed exercises (plank, side plank, dead bug, reverse crunch): no weight, as today.
A profile other than "man": multiply by 0.6, then round. This factor is my estimate, not from a source; the week-1 steps correct it after one set.

**Rounding to the gym (always down, never above the table value):**
- Dumbbells: the heaviest dumbbell in Settings › Gym weights that is **at or below** the table value; if none is that light, the lightest one listed; with no list, round down to a multiple of 2 kg (at least 2 kg).
- Stacks (machines and cables): round down to a multiple of the stack step from Settings (`stackStep`, fallback 5 kg), at least one step.
- Smith machine and hip thrust: round down to a multiple of 5 kg (2.5 kg each side), at least 5 kg.

**Why:**
- The guidelines say a beginner starts at a load that allows about 8 to 12 good reps, roughly 50 to 70 % of a one-rep maximum. Nobody tests a maximum in week 1, so the table aims **low**, at about half of a typical beginner man's maximum. Most people will find set 1 easy, and the week-1 table adds 1 or 2 steps. That is on purpose: a weight that is too light costs one set; one that is too heavy costs form and risks injury.
- **No body weight in the rule.** A fixed table keeps body data out of the rule and the repo, and the find-your-weight steps fix any error after one set. Typical beginner standards (Strength Level) were used only as a rough upper check, because they come from people who already log their lifts.
- Machines differ between brands (stack numbers are not true kilograms), so the machine values are only a first try.

Sources (read 2026-11-18): ACSM novice loading (8-12 RM, about 50 to 70 % of 1RM) via the [JCEP review](https://jcep.kglmeridian.com/view/journals/ceph/2/1/article-p8.xml) and the [2002 position stand abstract](https://pubmed.ncbi.nlm.nih.gov/11828249/); [Strength Level male standards](https://strengthlevel.com/strength-standards/male/kg) (beginner bench press, shoulder press, curl and row by body weight, an upper check only); plan v2 section 8 (week 1: start light, nobody tests a maximum) and D5.

**Tests for 8.39 to write first:**
1. With no Plan weight, no log and no found weight, the card shows "Try <kg>" (never "Find it" or "Pick a light weight") for every weighted exercise, using the table and made-up gym settings.
2. Rounding: with dumbbells [2, 4, 6, 8, 10, 12.5], a table value of 10 gives 10 and a table value of 12 gives 10 (never above); no list gives multiples of 2; a stack step of 7 gives 14 for a table value of 15; Smith values are multiples of 5; the result is never 0.
3. Order: a Plan weight beats a log, a log beats a found weight, a found weight beats the table.
4. Bodyweight and timed exercises show no weight.
5. Two profiles with different made-up body weights get the same first-try weights (the rule does not read body weight); a profile other than "man" gets 0.6 × the table, rounded down.
6. Every weighted exercise id in `plan-v2.js` has a table value.

### D13. Wednesday full body and muscle recovery — **keep Wednesday as it is; fix one wrong sentence; add one watch rule**

Asked by the Training Agent on 2026-11-18, for you: "Isn't it better to always rest a muscle for 24 hours?"

**What the week really does (weeks 2-5 sets; Wednesday stops with 3 reps left, the other days with 2):**

| Muscle | Hard days (sets) | Wednesday (sets) | Back to back with Wednesday |
|---|---|---|---|
| Chest | Mon 3, Thu 3 | bench press 3 | Wed → Thu |
| Back (lats, mid back) | Mon 6, Thu 3 | pulldown 3 | Wed → Thu |
| Front of thighs (quads) | Tue 6, Fri 3 | goblet squat 3 | Tue → Wed |
| Triceps | Mon 3, Thu 3 | overhead extension 2 | Wed → Thu |
| Side shoulders | Thu 3, Fri 3 | lateral raise 2 | Wed → Thu → Fri |
| Calves | Mon 3, Fri 3 | calf raise 3 | none (48 h apart), plus the daily walk |

```
        Mon Tue Wed Thu Fri
Upper    H   .   l   H   .
Legs     .   H   l   .   H
H = hard day  l = light touch
```

**Your 24-hour rule is already kept.** Two days in a row at the same time of day are 24 hours apart. What the plan does not give is 48 hours for every muscle every time. The two hard sessions for each muscle are 72 hours apart (Monday → Thursday for the upper body, Tuesday → Friday for the legs). Wednesday is a third, lighter touch in between.

**My decision:**
1. **Wednesday stays: same exercises, same days, same sets, same minutes, still 3 reps left.** No plan data changes. Exercise ids and saved logs are not touched.
2. **The sentence in plan v2 section 2 is wrong** ("Upper and lower days are never back to back with the same muscles"). The true version: "Each muscle has two hard sessions a week, 3 days apart (Monday and Thursday for the upper body, Tuesday and Friday for the legs). Wednesday is a lighter full-body day in between (stop with 3 reps left), so some muscles work two days in a row; this is safe because no set goes to failure (trainer plan D13)." Plan v2 is my file; I change that line only when the Training Agent says yes, because this task commits the trainer plan only.
3. **New watch rule (words only, like the calf rule):** in weeks 1 to 3, if the front of your thighs is still very sore on Wednesday (it hurts to sit down or take stairs), do the goblet squat with the weight one step lighter for that day. If chest or shoulders are very sore on Thursday, use the same rule for the first exercise. Normal soreness is fine (plan v2 section 9). Joint pain is not: skip that exercise for the day.

**Why:**
- *Recovery depends on how hard the sets are, not only on the hours.* Sets taken to failure need 48 hours or more to recover; the same work stopped 2 to 3 reps short recovers much of the way within 24 to 48 hours (Morán-Navarro 2017). All your sets stop 2 to 3 reps short, and Wednesday 3 short.
- *Training a muscle on two days in a row works when each session is moderate.* Studies with 5 or 6 sessions a week, which put the same muscle on consecutive days, gave the same or more muscle growth than fewer sessions with the same weekly sets (Saric 2019; Zaroni 2019). Frequency itself adds little once the weekly sets are equal (Pelland 2026), so the reason for Wednesday is to spread the sets: fewer sets per session, fresher sets, shorter days.
- *Wednesday is a light touch.* It has 2 to 3 sets per muscle, at 3 reps left, with lighter exercises (goblet squat, not leg press or Smith squat). The heavy work for each muscle stays 72 hours apart.
- *Small muscles recover fast.* Lateral raises use light weights and cause little damage, so three days in a row is common practice. Calves get 48 hours between raise days; the uphill walk is easy endurance work (effort 5 to 6 out of 10), not a strength session.
- *The 48-hour rule is an old, general rule for beginners.* Older guidelines advise 2 to 3 full-body days a week for beginners, which gives about 48 hours between sessions (ACSM 2009; I could not open its full text to confirm an exact "48 hours" sentence). The 2026 update says what matters most is weekly sets and effort, with each muscle trained at least twice a week; the split does not matter.
- *Not "move the Wednesday exercises":* making Wednesday arms-and-abs only would drop chest, back and quads to 2 sessions with more sets each, so Monday, Tuesday, Thursday and Friday would get longer. Making Wednesday a rest day would lose about 15 muscle sets a week or add them to the other days. Neither has evidence of a benefit.
- *Watch for the real risk:* the first 2 to 3 weeks bring the worst soreness for a beginner. It drops fast after that (the repeated bout effect, D11). The watch rule covers those weeks.

Sources (read 2026-11-18): Morán-Navarro et al. 2017, Eur J Appl Physiol, recovery after failure vs non-failure sets ([PubMed 28965198](https://pubmed.ncbi.nlm.nih.gov/28965198/)); Saric et al. 2019, J Strength Cond Res, 3 vs 6 sessions a week with equal sets ([PubMed 30363041](https://pubmed.ncbi.nlm.nih.gov/30363041/)); Zaroni et al. 2019, J Strength Cond Res, whole-body 5 days a week vs split ([PubMed 31260419](https://pubmed.ncbi.nlm.nih.gov/31260419/)); Pelland et al. 2026 (D1); ACSM 2009 progression models position stand ([PubMed 19204579](https://pubmed.ncbi.nlm.nih.gov/19204579/), abstract only) and ACSM 2026 (D1); Hyldahl, Chen and Nosaka 2017 (D11).

**Tests:** none. No plan data and no app behaviour change. The existing test `trainer 3` already locks Wednesday's exercises, sets and rest.

### D14. Mixed days (an upper day ends with a leg exercise, a leg day has shoulder exercises) — **keep the mixed days**

Asked by the Training Agent on 2026-11-18. Monday ends with a calf raise, Thursday with a leg curl. Tuesday has the face pull, Friday the lateral raise. Should days be pure upper or pure lower?

**My decision: keep them as they are.** No plan data changes.

**Why:**
- *The muscle does not know the name of the day.* Growth follows the weekly sets per muscle, the effort, and at least 2 sessions a week per muscle. How the week is split does not change the result when the sets are equal (Ramos-Campo 2024, 14 studies; ACSM 2026; Pelland 2026).
- *The small extras fill rest time.* On leg days the face pull and lateral raise are paired with leg exercises: while the legs rest, the shoulders work. Paired sets of muscles that do not compete save time without losing results (Zhang 2025, D4). Pure leg days would need these 6 sets on the upper days, which are already the longest days.
- *Calves and the back of the thighs get 2 days a week this way.* Monday's calf raise and Thursday's leg curl give them a second day (D7 needs at least 2 days; test `trainer 5` checks it). Moving them to the leg days would put calf raises, leg curl, Romanian deadlift and hip thrust together, so leg days get longer and the legs more tired.
- *They come last and are small.* A calf raise or leg curl at the end of an upper day adds almost no whole-body tiredness. Nothing tires a muscle before its own main exercise (exercise order: Eddens 2018, D8).
- *Rear and side shoulders do not suffer on leg days.* Squats and hip thrusts do not use them, so they are fresh.

Sources (read 2026-11-18): Ramos-Campo et al. 2024, J Strength Cond Res 38(7):1330-1340, split vs full-body with equal sets ([PubMed 38595233](https://pubmed.ncbi.nlm.nih.gov/38595233/)); Zhang et al. 2025, supersets (D4); Eddens et al. 2018, exercise order (D8); ACSM 2026 (D1); Pelland et al. 2026 (D1).

**Tests:** none. The existing tests `trainer 3` (exact days) and `trainer 5` (calves and back of thighs on 2 days or more) already lock this.

### D15. The weight after an "It hurts" swap — **convert between exercises, then 30 % lighter**

Found on 2026-11-18 while checking 8.39's swap fixes (f5a214f, c758035). When an exercise hurts and you swap it, the new exercise starts lighter (WORKFLOW D5). Since 0.5, after a set today or with a log of the old exercise, the app took 30 % off **the old exercise's kilograms**. Many swaps change the kind of weight, so that number can be far too heavy:

| Old exercise, weight | New exercise | Rule since 0.5 | New rule |
|---|---|---|---|
| Chest press 40 (stack) | Dumbbell bench press | 28 per dumbbell | 14 per dumbbell |
| Leg press 80 (stack) | Smith machine squat | 55 in plates | 10 in plates |
| Face pull 25 (stack) | Dumbbell rear-delt raise | 16 per dumbbell | 4 per dumbbell |
| Goblet squat 16 (1 dumbbell) | Leg press | 10 | 35 |

(Made-up weights; both columns use the fallback gym steps: dumbbells 2 kg, stacks 5 kg, Smith 5 kg, as computed with the app's own rounding.)

**My rule:** if the new exercise has its own history, use its own suggestion (as today). Otherwise, with a weight of the old exercise (a set today or its log), start at
**old weight × (first-try value of the new ÷ first-try value of the old) × 0.7**, rounded **down** to the gym's steps (D12 rounding), at least one step.
The first-try values come from the D12 table, without the profile factor (it cancels out). An exercise with no table value (bodyweight or timed) keeps today's rule. With nothing logged, 8.39's rule from c758035 stays: the new exercise's own first try.

**Why:** the D12 table already holds the usual ratio between exercises (a leg press stack takes about 4 times the plates of a Smith squat; a chest press stack about 2 times one dumbbell). After pain, too light is safe and costs one set. Too heavy is exactly the wrong risk then. The 30 % cut is unchanged (WORKFLOW D5).

**Tests for 8.39 to write first:**
1. The four rows above, with made-up gym settings, give the new-rule numbers.
2. For every swap pair, with a made-up logged weight, the start is never above 0.7 × (old weight × new table ÷ old table) and never 0.
3. A new exercise with its own history still uses its own suggestion.
4. Nothing logged: unchanged from c758035.
5. A bodyweight or timed exercise is unchanged.

### D16. Editing the walk in Plan › Edit (0.7.4) — **yes to all six lines, with three small additions**

Asked by the Training Agent for worker 8.41 on 2026-11-18. Rosario asked to edit the walk. The walk decisions D1 to D7 are in `2026-11-18-trainer-decisions.md` (by 8.36); the numbers below follow them.

| # | 8.41's proposal | My answer |
|---|---|---|
| 1 | The edit saves fixed numbers for that day (speed, slope, minutes), used every week until Reset. The walk rule no longer moves that day; other days still follow it. The D7 small change on the walk screen still works on top. | **Yes.** Addition A below. |
| 2 | Speed 2.0 to 5.0 km/h, 0.1 steps | **Yes** (D6 floor, D3 top, D7 step). |
| 3 | Slope 0 to 12 %, leg days 0 to 10 %, 1 % steps | **Yes** (D3: leg days stay 2 % under the top). |
| 4 | Minutes 10 to 30, 1-minute steps | **Yes, 10 is a good floor.** The minutes include the build-up, as today. Addition B below. |
| 5 | Short day: the walk is at most 15 minutes (the smaller of the edit and 15) | **Yes.** |
| 6 | Back from a break: the break rule still applies to an edited day, whichever is lower | **Yes, compared number by number.** Addition C below. |

**Additions:**
- **A. Say it on screen.** On an edited day, Plan › Edit and the walk screen show one line: "Your own walk. The walk rule does not change this day." Reset puts the day back on the walk rule. The rule then starts from the last saved walk of that day, as it always does (D7), and the D5 top still applies. The D7 small change still never goes above the top (5 km/h, 12 %; leg days 10 %).
- **B. Under 30 minutes, one hint line** under the minutes stepper: "Under 30 minutes a day means under 150 minutes of walking a week." No warning colour and no block. Short walks still count.
- **C. The break rule, number by number, for the break week only.** 2 to 4 weeks away: the slope is the edit minus 2 % (never below 0); speed and minutes stay as edited. More than 4 weeks away: for speed, slope and minutes, each takes the lower of the edit and the starting settings. After that week the edit applies again.

**Why:**
- *Fixed numbers are fine.* People keep going better, and accept more effort, when they choose the intensity themselves (Oliveira 2015; Ekkekakis 2011, as in D7). An edited day only stops the automatic climb on that one day. The other days still progress, and Reset brings the rule back.
- *Speed and slope limits:* the same safety limits as the rest of the walk. 5 km/h and 12 % (leg days 10 %) keep the walk moderate before the weights, because harder cardio lowers strength more right after it (Markov 2022, D3). 2 km/h is the result screen's floor (D6).
- *Minutes:* 30 stays the top, because longer cardio before weights lowers strength more (Markov 2022, D2). For the floor, the guidelines no longer ask for a 10-minute minimum: any amount of activity counts toward the weekly total (WHO 2020; US Physical Activity Guidelines 2018). So 10 is a practical floor, not a health rule. It leaves 7 fast minutes after the 3-minute build-up, which is still worth doing before the weights. The weekly 150 minutes (CDC) is the reason for the hint line.
- *Short day and break:* these protect Rosario on a busy day or after time away, so they must also win over an edit. The lower number is always the safer one.

Sources (read 2026-11-18): Bull et al. 2020, WHO guidelines on physical activity, Br J Sports Med ([UEA record](https://research-portal.uea.ac.uk/en/publications/world-health-organization-2020-guidelines-on-physical-activity-an/)); [Physical Activity Guidelines for Americans, 2nd edition (2018), health.gov](https://health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines/current-guidelines); [CDC, measuring physical activity](https://www.cdc.gov/physical-activity-basics/measuring/index.html); Markov et al. 2022, Oliveira 2015 and Ekkekakis 2011, as cited in the walk decisions D2, D3 and D7 (`2026-11-18-trainer-decisions.md`); plan v2 sections 4 (short day) and 11 (breaks).

**Tests for 8.41 to write first (they fail until the build):**
1. An edited Wednesday walk (made-up 4.6 km/h, 7 %, 25 minutes) is suggested every week until Reset, even after easy walks; Monday still follows the walk rule.
2. Limits: speed 2.0 to 5.0 in 0.1 steps; slope 0 to 12 (Tuesday and Friday 0 to 10) in 1 % steps; minutes 10 to 30 in 1-minute steps; anything outside is refused or clamped.
3. On an edited day, the D7 change still works and never goes above 5 km/h or 12 % (leg days 10 %).
4. Short day: an edit of 25 minutes gives 15; an edit of 12 gives 12.
5. Break of 3 weeks: edit 7 % gives 5 % (edit 1 % gives 0 %) for the break week only. Break of 5 weeks: each number is the lower of the edit and the starting settings.
6. Reset: the day follows the rule again, starting from its last saved walk.
7. The line "Your own walk. The walk rule does not change this day." shows on an edited day. The hint line shows when the minutes are under 30, and only then.

### D17. Abs on days in a row — **keep; no plan change**

Asked by the Training Agent on 2026-11-18, for you: "On Monday I have planks and Tuesday I have cable crunch, and both work the abs on back-to-back days. That should be wrong, no?"

**What the week does (weeks 2-5):**

| Day | Abs work | Kind |
|---|---|---|
| Mon | plank 2 × 30 s | light hold |
| Tue | cable crunch 3, dead bug 3 | **hard** (moving, with weight) |
| Wed | side plank 2 | light hold |
| Thu | plank 2 × 30 s | light hold |
| Fri | reverse crunch 3, side plank 2 | **hard** (moving) + hold |

It is the same pattern as D13: two hard abs days, 72 hours apart (Tuesday and Friday). The other days are short holds.

**My decision: keep it.** No plan data changes. The D13 soreness rule also covers the abs: if they are still very sore (a plank hurts, not only feels tired), do the hold shorter that day.

**Why:**
- *A plank is a different job from a crunch.* A plank holds the trunk still against gravity for 30 seconds, with body weight only. It trains the abs to keep the spine steady (endurance and stability). A cable crunch bends the spine against a weight, which is the muscle-building work. Core experts build the stability holds (plank, side plank) for frequent practice, focused on endurance (McGill 2010).
- *Holds cause very little muscle damage.* Most soreness and damage come from the lowering (eccentric) part of a movement under load (Hyldahl, Chen and Nosaka 2017, as in D11). A plank has no lowering part, so the abs are ready again the next day.
- *Sets stop short of failure,* so even the hard days recover in about 1 to 2 days (Morán-Navarro 2017, D13). Hitting a muscle on days in a row works when each session is moderate (Saric 2019, D13).
- *Moving the holds would not help.* Putting them on Tuesday and Friday makes those days longer, and the trunk then gets only 2 days of work a week. A 2-set hold at the end of the other days costs about 2 minutes.

Sources (read 2026-11-18): McGill 2010, Strength Cond J 32(3):33-46, core training ([author's PDF](https://www.backfitpro.com/medical-scientific-articles/2010/[70]McGill,S.M.(2010)Core-training[J.Strength-and-Condit.].pdf)); Hyldahl, Chen and Nosaka 2017 (D11); Morán-Navarro et al. 2017 and Saric et al. 2019 (D13).

**Tests:** none. No plan data or app change. Test `trainer 3` already locks the days.

### D18. Machines instead of awkward moves — **4 swaps in the plan, 5 machine offers after the first visit**

Asked by the Training Agent on 2026-11-18, for you: "Can we use exercises with the gym's machines, without weird movements like the hip thrust, the dead bug or the cable crunch? I'm pretty sure the gym has machines for those muscles too."

**The main fact:** for building muscle, machines work as well as free weights (Haugen 2023: 13 studies, 1,016 people, no difference in muscle growth). So a simpler machine costs nothing. It is easier to learn, easier to set up and safer when you are tired. The rule I used: if a machine **the gym's website confirms** does the same job, the plan uses it. If the machine is not confirmed, the plan keeps a move with confirmed equipment, and the app offers the machine once the first visit finds it.

#### What changes in the plan (all with confirmed equipment)

| # | Day and slot | Old | New | Why it is simpler |
|---|---|---|---|---|
| C1 | Tue C1, Fri B1 | Hip thrust (bar or pad on the hips, back on a bench) | **Hip thrust machine (Booty Builder)**, confirmed machine | Pin-loaded: sit in, belt over the hips, push. No bar, no plates, no bench to set up. |
| C2 | Tue A2 | Cable crunch (kneeling at a cable) | **Crunch, holding a dumbbell on the chest** (mat or flat bench), confirmed equipment | The crunch everyone knows; the dumbbell adds weight step by step. |
| C3 | Tue C2 | Dead bug (lying, moving opposite arm and leg) | **Plank**, 3 sets, confirmed (floor) | The same job (keep the trunk still) with no arm-leg coordination. You already know it from Monday. |
| C4 | Fri D | Standing calf raise in the Smith machine (balance on a plate) | **Calf raise on the leg press**, confirmed machine | Seated and stable, no balance needed; the same move as on Monday and Wednesday. |

**What stays, and why:** chest press, shoulder press, leg press and leg extension are already machines. The Smith squat, goblet squat, dumbbell presses, rows, curls, lateral raise, Romanian deadlift (a natural "pick it up" move), the face pull and the planks are standard beginner moves. The **reverse crunch** stays: an EMG study ranked it among the best abs moves (Escamilla 2006). The **cable pull-through** stays: the cable pulls your hips back, so it teaches the same hip hinge as the Romanian deadlift. If it feels awkward, swap in the Romanian deadlift.

#### Machines the gym's website does NOT confirm: the app offers them after the first visit

The first-visit check already asks about these machines (lat pulldown, seated row, leg curl, pec deck, calf raise). One new check: **ab crunch machine**. When a check answer is "yes", the app offers the machine once, as a one-tap Plan edit: "The gym has a <machine>. Use it instead of <exercise>?" The buttons are **Use it** and **Keep**. Nothing changes without that tap.

| Slot | Exercise now (confirmed fallback) | Machine, only if the gym has it |
|---|---|---|
| Thu D | Dumbbell lying leg curl | Leg curl machine (seated if there is a choice: more hamstring growth, Maeo 2021) |
| Mon A2, Wed B1 | Pulldown at a cable (kneel or sit) | Lat pulldown machine |
| Thu A2 | Seated cable row | Seated row machine |
| Tue A2 | Crunch with a dumbbell (C2) | Ab crunch machine (new check) |
| Tue B2, Thu B2 | Face pull | Reverse pec deck (rear-delt fly on the pec deck) |

**Weekly sets per muscle, days and minutes: unchanged.** Each new exercise has the same muscle data as the one it replaces, and the sets and rest stay the same. The plank takes a little less time than the dead bug. D17 still holds: the hard abs days are Tuesday (crunch) and Friday (reverse crunch), and the other days have holds.

#### Exact data for the build worker (after 0.7.4)

New exercises (the `muscles.js` lines use the same format as today):

| id | name | equipment | kind, range | step | muscles (main; helpers; equip) | first try (D12) | swaps |
|---|---|---|---|---|---|---|---|
| `booty_builder_hip_thrust` | Hip thrust machine | Booty Builder (glutes area) | reps 8-12 | stack | glutes; hamstrings; machine | 20 | `hip_thrust`, `db_glute_bridge` |
| `weighted_crunch` | Crunch with a dumbbell | Mat or flat bench, 1 dumbbell on the chest | reps 10-15 | dumbbell | abs; none; dumbbell | 2 | `ab_crunch_machine` (needsMachine `ab_crunch`), `cable_crunch`, `reverse_crunch` |
| `ab_crunch_machine` (swap only) | Ab crunch machine | Ab crunch machine (first visit check) | reps 10-15 | stack | abs; none; machine | 15 | none |
| `reverse_pec_deck` (swap only) | Reverse pec deck | Pec deck, facing the pad (first visit check) | reps 12-15 | stack | rear_delts; mid_back; machine | 10 | none |

Cues (`cues.js`):
- `booty_builder_hip_thrust`: "Upper back on the pad, belt over your hips, feet flat on the plate. Push through your heels until your hips are straight, squeeze your glutes, ribs down. Lower slowly."
- `weighted_crunch`: "Lie on your back, knees bent, a dumbbell held on your chest. Breathe out and curl your shoulders off the mat, pause, lower slowly. Lower back stays down."
- `ab_crunch_machine`: "Feet hooked, hold the handles. Breathe out and curl your chest toward your hips, return slowly. Do not pull with your arms."
- `reverse_pec_deck`: "Face the pad, handles at shoulder height, arms almost straight. Open your arms out and back, squeeze your shoulder blades, return slowly."

Day changes (sets and rest unchanged): `tue` A2 `cable_crunch` → `weighted_crunch`; `tue` C1 `hip_thrust` → `booty_builder_hip_thrust`; `tue` C2 `dead_bug` → `plank` (3 sets, rest 75); `fri` B1 `hip_thrust` → `booty_builder_hip_thrust`; `fri` D `calf_raise_standing` → `calf_raise_leg_press` (3 sets, rest 60).

Swap additions on old exercises: `hip_thrust` gets `booty_builder_hip_thrust` first; `cable_crunch` gets `weighted_crunch` first; `face_pull` gets `reverse_pec_deck` (needsMachine `pec_deck`). New machine check: `ab_crunch`, appended to `extraMachines`, the `extra_machines` defaults and the settings names. New gym-spot ids, appended to `MACHINE_IDS` (never renamed): `booty_builder`, `ab_crunch`. Photos and videos for the new exercises: the builder's choice (free-exercise-db as today).

**Saved data (the builder's checklist):**
- Every old id stays in `exercises` with its muscles, first try and cue: `hip_thrust`, `cable_crunch`, `dead_bug`, `calf_raise_standing`. They leave the days but stay as swaps. Old logs, `exercise_state` and history stay readable.
- A saved Plan edit that names an old exercise keeps it: your own choice wins over the plan.
- **The first weight of a new exercise:** if it has no log of its own, and the old exercise in that slot has a log, start from the old weight × (new first try ÷ old first try), rounded down (the D15 conversion, **without** the 30 % cut, because nothing hurts). Otherwise use the D12 first try. `dead_bug` → `plank` and `calf_raise_standing` → `calf_raise_leg_press` keep their own history if there is any.
- The muscle check must give the same weekly sets per muscle, before and after, in every week.
- *Answers to 8.42 (added 2026-11-18):* `booty_builder_hip_thrust` joins `BIG_LIFTS` (it is a big glute lift, like `hip_thrust`). `calf_raise_leg_press` with no log of its own, when `calf_raise_standing` has one, also converts (old kg × 40/10, rounded down, at least one step). A saved Plan edit for Tuesday or Friday that still holds an old D18 exercise in a slot D18 changes is never rewritten silently. The app shows one offer per day, once: "The plan now uses simpler machines on <day>. Use them in your edited <day>?" with **Use them** (changes only those slots, keeps your sets and rest) and **Keep mine** (changes nothing, never asked again).

**Tests for the build worker to write first (they fail until the build):**
1. The five day changes above; sets and rest unchanged on every slot.
2. For every muscle and every week 1-12, the fractional sets per muscle are equal before and after.
3. Every new exercise has muscles, a cue, swaps that exist, and a first try (the D12 test "every weighted id has a table value" passes).
4. The old ids still exist and still open: a saved Tuesday with `hip_thrust`, `cable_crunch` and `dead_bug` logs shows its history; a Plan edit naming `hip_thrust` still uses it.
5. `ab_crunch_machine` and `reverse_pec_deck` are hidden unless the first-visit check says yes. With "yes", the one-tap offer appears once and makes a Plan edit only after **Use it**.
6. First weight: with a made-up `hip_thrust` log of 30 and no own log, `booty_builder_hip_thrust` starts at 30 × 20/20 = 30, rounded down to the stack; with no logs at all, it starts at its first try.
7. My test `trainer 3` (`tests/trainer-plan.test.mjs`) locks the old days. The builder may change its KEPT_DAYS to the new days in the tests-first commit, and add the four new ids to `trainer 1`. I agree to that change now.

**Why (sources, read 2026-11-18):**
- *Machines build muscle as well as free weights:* Haugen et al. 2023, BMC Sports Sci Med Rehabil, 13 studies ([DOAJ record](https://doaj.org/article/a7282dba5e674176bde2a8239832d2f7)); ACSM 2026: pick exercises you can do well, any equipment works (D1); Schoenfeld and the other D2 sources: growth follows weekly sets, which stay the same.
- *C1 hip thrust machine:* Booty Builder V8, a pin-loaded hip thrust machine ([maker's page](https://bootybuilder.com/?p=3579)); hip thrusts grow the glutes as much as squats (Plotkin et al. 2023, Front Physiol, [PubMed 37877099](https://pubmed.ncbi.nlm.nih.gov/37877099/)); high glute work in the hip thrust (Contreras 2015 EMG, [Europe PMC 26214739](https://europepmc.org/article/MED/26214739)); Haugen 2023 (machine = free weight).
- *C2 crunch:* the crunch is the standard reference move for the abs in EMG studies (Escamilla et al. 2006, Phys Ther, [PubMed 16649890](https://pubmed.ncbi.nlm.nih.gov/16649890/); Escamilla et al. 2006, JOSPT, commercial ab machines vs the crunch, [PubMed 16494072](https://pubmed.ncbi.nlm.nih.gov/16494072/)); Haugen 2023 and ACSM 2026 (any equipment that loads the muscle works).
- *C3 plank:* the plank and the dead bug both train the trunk to stay still. The dead bug only adds the opposite arm-and-leg coordination, and full arm-and-leg moves gave the most abs activity ([Korean dead bug EMG study, 2017](https://koreascience.or.kr/article/JAKO201718155358635.pdf)). It reaches only moderate activity (the [JoVE core endurance protocol](https://www.jove.com/v/64335/muscle-function-obtained-with-motion-mode-ultrasound-surface)). Stability holds are core experts' standard (McGill 2010, D17). I found no head-to-head study of plank vs dead bug.
- *C4 calf raise on the leg press:* calves grow most with the knee straight (Kinoshita et al. 2023, Front Physiol, standing vs seated, [Frontiers](https://www.frontiersin.org/articles/10.3389/fphys.2023.1272106/full)). The leg press calf raise keeps the knee straight, like the standing one. Machine = free weight (Haugen 2023). Calves still train 3 days a week (D7).
- *Machine offers:* Haugen 2023; seated leg curl grew the hamstrings more than lying (Maeo et al. 2021, Med Sci Sports Exerc, [PubMed 33009197](https://pubmed.ncbi.nlm.nih.gov/33009197/)); the first-visit check (plan v2, question 17).

**Not verified:** the gym's real machines (the website lists the Booty Builder V8 and the Glute Drive, but not how they are set up); the exact Booty Builder V8 stack numbers (so the first try of 20 is a guess, aimed low); whether the gym's benches go flat for the crunch.

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
| L1 | **Decided, exact rule in section 7.1 (T2); built by 8.39 in 0.7.1.** Warm-up sets only before the first exercise for each muscle (pairs A and B); pair C (curls, pushdowns, raises) gets one light set at most. Saves about 2 minutes a day. | Warm-up sets help heavy lifts; small exercises after the muscle is already warm need little. This is coaching practice; I found no trial on it. | The engine owner (`engine/workout.js`), with a test first. Not urgent. |
| L2 | **Decided, exact rule in section 7.1 (T3); built now by 8.39 in 0.7.1, not at the week-12 review.** Keep the D exercise (calves, leg curl) at 3 sets in weeks 7-11, using the 2 minutes from L1. | Calves and the back of the thighs drop to about 10 fractional sets in weeks 7-11; more sets give more growth (D2). | The trainer, at the week-12 review. Needs a change to the week rule in `plan-v2.js` and `engine/planedits.js` together. |
| L3 | Diet note: keep the food gap at about 500 kcal a day or less. If the weekly check says "losing too slowly", add steps first, then cut food. | Murphy and Koehler 2022 (D9). | The Training Agent and the Diet worker. Private numbers stay in `private/`. |
| L4 | **Decided (T4), built by 8.39.** The cable pull-through is labelled "hamstrings" in `plan-v2.js`, but its muscle data says glutes are the main muscle. Words only; it changes the Gym grouping. | Muscle map check, "could add" list. | The trainer, with the Gym screen owner. |

### 7.1 Exact rules for worker 8.39 (version 0.7.1), decided 2026-11-18

**T1 · D10 rule 2 (stopped twice → one step lighter).**
(a) It sits **after** the easier-week / week-1 hold, not before it. It fires only in weeks that allow progress (2-5, 7-11). Why: in week 1 the weight is still being found, and in weeks 6 and 12 the weights already stay the same with fewer sets and 4 reps left; a lighter weight there teaches nothing. A stop in week 5 and week 6 can still lower the week-7 suggestion. The 10 % rule and the pain rule stay before everything, as today.
(b) "Twice in a row" = the last two saved performances of that exercise. A stop with 0 work sets is not a performance and is skipped. Yes.
Stop confirm words: "Does it hurt? Use Swap › It hurts instead." Yes.

**T2 · L1 warm-up sets.** Only the first exercise of a pair (A1, B1, C1) can get warm-up sets, as today. For each of them, in the day as it really is (Plan edits and swaps included):
1. If any of its **main** muscles was a main muscle of an earlier exercise that day (helpers do not count): **no warm-up set.**
2. Else, if it is a **big lift**: the two warm-up sets as today (about 50 % × 10, then about 75 % × 5).
3. Else (a small exercise): **one light set**, about 50 % × 10.

Big lifts (plan v2 section 5): `chest_press`, `db_bench_press`, `incline_db_press`, `shoulder_press_machine`, `seated_db_shoulder_press`, `pulldown`, `lat_pulldown_machine`, `one_arm_db_row`, `seated_cable_row`, `seated_row_machine`, `leg_press`, `smith_squat`, `goblet_squat`, `hip_thrust`, `db_glute_bridge`, `romanian_deadlift`. Everything else is small.
Second exercises of pairs (A2, B2, C2), Abs, D and added exercises (E1, E2): none, as today. Bodyweight and timed exercises: none.
So the difference from your reading: the big-or-small test decides, not the letter. Tuesday's C1 hip thrust is a big lift with no earlier glute exercise, so it keeps both warm-up sets. Friday's C1 cable pull-through gets none (the hip thrust already worked the glutes). Monday's C1 curl gets one light set.
Why: warm-up sets help a heavy lift that day; a small exercise, or a muscle already worked, needs little. This is coaching practice; I found no trial on it.

**T3 · L2 (D sets in weeks 7-11).**
(a) **Build it now**, in this form: in weeks 7-11, on days that are **not leg days** (Monday, Wednesday, Thursday), the D exercise keeps its plan sets (3), and **Abs1 has one set less** (plank or side plank 2 → 1). On leg days (Tuesday, Friday) nothing changes: D drops to 2 as today. Why: calves and the back of the thighs get more sets (calves 6 → 8, back of the thighs 5 → 6 direct), abs give some away (19 → 16, still far above the usual 10), and Monday, Wednesday and Thursday get only about half a minute longer (one more D set, about 1.75 minutes, minus one plank set, about 1.2 minutes). Leg days stay at about 91 minutes. A rule for every day would add nearly 2 minutes to each leg day, mostly for extra quad sets that are not needed.
The rule needs the day: in `plan-v2.js` `setsFor` use `days[dayId].leg`; in `engine/planedits.js` `setsForSlot` pass the day (or its `leg` flag) so both stay the same (tests/plan-edits.test.mjs test 6).
(b) Added exercises E1 and E2 stay at 2 sets in weeks 7-11, as today (extra work, and time).
(c) Yes: easier weeks 6 and 12 stay "one set less", week 1 stays 2 sets, for D and Abs1 too.
My test `tests/trainer-plan.test.mjs` still holds after this (base sets do not change; the set floors only rise). The weekly-set table in D2 changes for weeks 7-11: calves 8 direct, back of the thighs 6 direct, abs 16.

**T4 · L4.** `cable_pull_through` `muscle: "hamstrings"` → `"glutes"` in `plan-v2.js`. Its swaps stay. No other words need to change.

**T5 · Back check (rows count the lats as a main muscle).** `one_arm_db_row`, `seated_cable_row` and `seated_row_machine`: main `["lats", "mid_back"]` (lats first, as the muscle map check wrote it; both are on the back view), helpers `["biceps", "rear_delts"]`. Pulldowns (`pulldown`, `lat_pulldown_machine`) stay main `["lats"]`. Face pull and rear-delt raise do not change. After this, lats get 12 direct sets in weeks 2-5 and 14 in weeks 7-11, as D2 expects for the back.

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
