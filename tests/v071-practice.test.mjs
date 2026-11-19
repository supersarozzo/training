// Version 0.7.1 (worker 8.39): Rosario's iPhone problems P2 and P3 (Training Agent), built from the trainer's rules
// D11 (practice days before the plan's start) and D12 (first-try weights), docs/plan/2026-11-18-trainer-weekly-plan.md.
// Also two tests the 0.7.1 checker asked for (round 1, finding 1).
// All values are made up: no body data. The made-up block starts on Monday 2026-01-12 (fixtures/profiles.mjs).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as plan from "../app/js/plan/plan-v2.js";
import * as schedule from "../app/js/engine/schedule.js";
import * as workout from "../app/js/engine/workout.js";
import * as progression from "../app/js/engine/progression.js";
import { weeklySummary } from "../app/js/engine/trend.js";
import { dayChoices, weightLine } from "../app/js/planview.js";
import * as today from "../app/js/ui/today.js";
import { createStore } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { validateDocument } from "../app/js/validate.js";
import { validDoc, fakeStorage, intake } from "./fixtures/profiles.mjs";

const { exercises, days, DAY_IDS, setsFor, rirFor, weekInfo } = plan;
const src = (p) => readFileSync(new URL(`../app/js/${p}`, import.meta.url), "utf8");
const START = "2026-01-12";
const WED_BEFORE = "2026-01-07";
const SAT_BEFORE = "2026-01-10";
const weighted = Object.keys(exercises).filter((id) => exercises[id].step !== "bodyweight" && exercises[id].kind !== "hold");

const work = (n, kg, reps) => ({ n, type: "work", weight_kg: kg, reps, seconds: null, rir: 3, done_at: `2026-01-07T09:00:00.000Z` });
const session = (date, week, exId, sets, extra = {}) => ({
  id: `s-${date.replaceAll("-", "")}-${exId.slice(0, 4)}`, updated_at: `${date}T10:00:00.000Z`, date, plan_day: "wed", week, kind: "full",
  swapped_from: null, status: "finished", started_at: `${date}T08:00:00.000Z`, finished_at: `${date}T10:00:00.000Z`, walk: null, note: "",
  exercises: [{ slot: "A1", plan_exercise: exId, done_exercise: exId, swap_reason: null, note: "", sets, ...extra }],
});
function modelOn(dateStr) {
  const store = createStore(fakeStorage());
  store.save(validDoc());
  let ms = new Date(`${dateStr}T09:00:00`).getTime();
  return { store, model: createModel(store, () => new Date((ms += 1000))) };
}

// ---------- D11: practice days before the start ----------

test("D11-1 before the start: the day picker has Monday to Friday, the default is the calendar day, Saturday is a rest day", () => {
  const doc = validDoc();
  assert.deepEqual(dayChoices(doc, WED_BEFORE).map((c) => c.day), DAY_IDS);
  assert.equal(dayChoices(doc, WED_BEFORE).find((c) => c.today).day, "wed");
  assert.equal(today.defaultShown(doc, WED_BEFORE), "wed");
  assert.equal(today.defaultShown(doc, "2026-01-05"), "mon");
  assert.equal(today.defaultShown(doc, SAT_BEFORE), null, "Saturday: the rest card");
  assert.equal(dayChoices(doc, SAT_BEFORE).length, 5, "Saturday: the picker can still start any day");
  // Today no longer has a dead end before the start: the Start button and the picker are drawn for practice days too.
  const t = src("ui/today.js");
  assert.doesNotMatch(t, /Your plan has not started/);
  assert.match(t, /const active = running \|\| practice;/);
  assert.match(t, /active && !open \? dayPicker\(choices, shown, t\) : null/);
});

test("D11-1b a practice day counts as done only in its own calendar week", () => {
  const doc = validDoc();
  doc.sessions = [session("2026-01-05", 0, "chest_press", [work(1, 20, 10)]), session(WED_BEFORE, 0, "chest_press", [work(1, 20, 10)])];
  doc.sessions[0].plan_day = "mon";
  const c = dayChoices(doc, "2026-01-08");
  assert.equal(c.find((x) => x.day === "mon").done, true);
  assert.equal(c.find((x) => x.day === "wed").done, true);
  assert.equal(c.find((x) => x.day === "tue").done, false);
  // A week further back is another practice week.
  assert.equal(dayChoices(doc, "2026-01-01").find((x) => x.day === "wed").done, false);
});

test("D11-2 a practice workout is saved with week 0 and uses the week-1 rules", () => {
  const pos = schedule.blockPosition(START, WED_BEFORE);
  assert.equal(pos.state, "before");
  assert.equal(schedule.sessionWeek(pos), 0);
  assert.equal(schedule.sessionWeek(schedule.blockPosition(START, "2025-12-31")), 0, "two weeks before: still week 0");
  assert.equal(schedule.sessionWeek(schedule.blockPosition(START, "2026-01-21")), 2);
  assert.equal(schedule.canTrain(pos), true);
  assert.equal(schedule.canTrain(schedule.blockPosition(START, "2026-05-01")), false, "after the 12 weeks: the review card");
  for (const d of DAY_IDS) {
    for (const s of days[d].slots) assert.equal(setsFor(0, d, s.slot), setsFor(1, d, s.slot), `${d} ${s.slot}`);
    assert.equal(rirFor(0, d), 3);
  }
  assert.equal(weekInfo(0).progression, false);
  assert.equal(weekInfo(0).walkProgress, false);
  const { model, store } = modelOn(WED_BEFORE);
  const s = model.startSession({ planDay: "wed", week: 0, kind: "full" });
  assert.equal(s.week, 0);
  assert.ok(s.exercises.every((r) => r.planned_sets <= 2), "2 sets each");
  assert.equal(validateDocument(store.load()).ok, true, "week 0 passes the file check");
  const bad = validateDocument({ ...store.load(), sessions: [{ ...store.load().sessions[0], week: -1 }] });
  assert.equal(bad.ok, false);
  assert.match(bad.error, /week/);
  // flow.js starts a workout on a practice day, saved as week 0
  const f = src("ui/flow.js");
  assert.match(f, /if \(!canTrain\(pos\)\) return \{ ok: false/);
  assert.match(f, /week: sessionWeek\(pos\)/);
});

test("D11-2b the workout screens treat week 0 like week 1 (find-your-weight steps, no 'how many more' after each set)", () => {
  assert.match(src("ui/workout.js"), /if \(session\.week <= 1\) \{/);
  assert.match(src("ui/rest.js"), /ctx\.session\.week > 1\)/);
});

test("D11-3 the label says 'Practice week · Learn, find weights'; 'Week 0' is never shown", () => {
  assert.equal(schedule.PRACTICE_LABEL, "Practice week · Learn, find weights");
  assert.equal(schedule.dayLabel(START, WED_BEFORE).text, "Practice week · Learn, find weights");
  assert.equal(schedule.dayLabel(START, SAT_BEFORE).text, "Practice week · Learn, find weights");
  assert.equal(schedule.practiceLine(START), "Your plan starts on Monday 12 January. Practice now: find your weights and learn the moves.");
  for (const d of [WED_BEFORE, SAT_BEFORE, "2026-01-05"]) assert.doesNotMatch(schedule.dayLabel(START, d).text, /Week 0|Week -/);
  const t = src("ui/today.js");
  assert.match(t, /practice \? PRACTICE_SHORT/); // 0.7.6: Today's eyebrow says only "Practice week" (master pick under Rosario's 94 a)
  assert.match(t, /practiceLine\(doc\.block\.start_monday\)/);
  assert.doesNotMatch(t, /Week 0/);
});

test("D11-4 practising never moves the plan: start_monday stays and week 1 starts on it", () => {
  const { model } = modelOn(WED_BEFORE);
  const s = model.startSession({ planDay: "wed", week: 0, kind: "full" });
  model.finishSession?.(s.id);
  assert.equal(model.doc().block.start_monday, START);
  assert.equal(schedule.weekNumber(START, START), 1);
  assert.equal(schedule.blockPosition(START, START).state, "running");
});

test("D11-5 week 1 starts a practised exercise at the weight found in practice, still 2 sets and about 3 reps left", () => {
  const doc = validDoc();
  doc.sessions = [session(WED_BEFORE, 0, "chest_press", [work(1, 25, 10), work(2, 30, 10)])];
  const st = { id: "x-chest_press", updated_at: "2026-01-07T10:00:00.000Z", start_weight_kg: 30, machine_note: "", fail_streak: 0 };
  const sg = workout.suggestFor(doc, "chest_press", { week: 1, missed: null, exerciseState: st });
  assert.equal(sg.weight_kg, 30);
  assert.equal(sg.action, "start");
  assert.match(sg.note, /practice/);
  for (const d of DAY_IDS) for (const s of days[d].slots) assert.ok(setsFor(1, d, s.slot) <= 2);
  assert.equal(rirFor(1, "mon"), 3);
  // Practised with no weight saved (the find steps skipped): week 1 holds the practice weight, no increase.
  const hold = workout.suggestFor(doc, "chest_press", { week: 1, missed: null, exerciseState: undefined });
  assert.equal(hold.weight_kg, 30);
});

test("D11-6 the week-1 check-in leaves practice workouts out ('done out of 5' and the targets)", () => {
  const doc = validDoc();
  doc.sessions = [session(WED_BEFORE, 0, "chest_press", [work(1, 20, 10)]), session("2026-01-14", 1, "chest_press", [work(1, 20, 10)])];
  const sum = weeklySummary(doc, { startMonday: START, today: "2026-01-19" });
  assert.equal(sum.workouts, 1);
  assert.equal(weeklySummary(doc, { startMonday: START, today: START }), null, "no check-in on week 1's Monday");
  // Missed-time rules count a practice workout as a workout.
  // A practice workout on Friday, then Monday of week 1: 3 days, carry on; a practice day long ago lowers the weights.
  assert.equal(schedule.missedRule("2026-01-09", START).kind, "carry_on");
  assert.equal(schedule.missedRule("2025-12-08", START).kind, "minus_20");
  assert.match(src("ui/flow.js"), /const lastFinished = finishedSessions\(doc\.sessions\)\.find\(\(s\) => s\.date < t\);/);
});

// ---------- D12: first-try weights ----------

const man = { intake: intake() };
const woman = { intake: intake({ q22_sex: "female" }) };
const noSettings = { dumbbell_steps_kg: [], stack_step_kg: {} };

test("D12-6 every weighted exercise has a first-try value; bodyweight and timed have none", () => {
  assert.equal(weighted.length, 41); // 35 + 4 from trainer D18 (0.7.5): hip thrust machine, crunch with a dumbbell, ab crunch machine, reverse pec deck; + 2 from D20 (0.7.8): Smith machine split squat, dumbbell step-up
  for (const id of weighted) assert.ok(plan.firstTryKg[id] > 0, id);
  for (const id of Object.keys(plan.firstTryKg)) assert.ok(weighted.includes(id), `${id} is a weighted exercise`);
  assert.equal(plan.firstTryKg.chest_press, 20);
  assert.equal(plan.firstTryKg.leg_press, 40);
  assert.equal(plan.firstTryKg.lateral_raise, 4);
  assert.equal(plan.firstTryKg.cable_crunch, 20);
  assert.ok(Object.isFrozen(plan.firstTryKg));
});

test("D12-2 rounding: always down to what the gym has, never 0", () => {
  const db = { dumbbell_steps_kg: [2, 4, 6, 8, 10, 12.5], stack_step_kg: { default: 5 } };
  const f = (id, s, p = man) => progression.firstTryWeight(id, s, p);
  assert.equal(f("db_bench_press", db), 10, "table 10 -> 10");
  assert.equal(f("one_arm_db_row", db), 10, "table 12 -> 10, never above");
  assert.equal(f("goblet_squat", db), 10);
  assert.equal(f("lateral_raise", { dumbbell_steps_kg: [5, 7.5] }), 5, "none that light: the lightest listed");
  assert.equal(f("one_arm_db_row", noSettings), 12, "no list: multiples of 2");
  assert.equal(f("one_arm_db_row", noSettings, woman), 6, "7.2 -> 6");
  assert.equal(f("lateral_raise", noSettings, woman), 2, "at least 2 kg");
  assert.equal(f("face_pull", { stack_step_kg: { default: 7 } }), 14, "stack step 7: 15 -> 14");
  assert.equal(f("face_pull", { stack_step_kg: { default: 5, face_pull: 2.5 } }), 15, "the exercise's own step wins");
  assert.equal(f("cable_leg_curl", noSettings, woman), 5, "at least one step (fallback 5)");
  assert.equal(f("smith_squat", noSettings), 10);
  assert.equal(f("hip_thrust", noSettings, woman), 10, "12 -> 10");
  assert.equal(f("calf_raise_standing", noSettings, woman), 5, "at least 5");
  for (const id of weighted) {
    for (const p of [man, woman, undefined]) {
      for (const s of [db, noSettings, { stack_step_kg: { default: 7 } }]) {
        const kg = f(id, s, p);
        assert.ok(kg > 0, `${id}: never 0`);
      }
    }
  }
  assert.equal(f("plank", db), 0);
  assert.equal(f("dead_bug", db), 0);
});

test("D12-5 the rule never reads body weight; a profile other than 'man' gets 0.6 x the table, rounded down", () => {
  const light = { intake: intake({ q24_weight_kg: 50 }) };
  const heavy = { intake: intake({ q24_weight_kg: 120 }) };
  for (const id of weighted) assert.equal(progression.firstTryWeight(id, noSettings, light), progression.firstTryWeight(id, noSettings, heavy), id);
  assert.equal(progression.firstTryWeight("leg_press", noSettings, woman), 20, "24 -> 20");
  assert.equal(progression.firstTryWeight("leg_press", noSettings, { intake: intake({ q22_sex: "unspecified" }) }), 20);
  assert.equal(progression.firstTryWeight("leg_press", noSettings, man), 40);
  assert.doesNotMatch(src("engine/progression.js"), /q24_weight_kg|weight_kg_body|bodyWeight/);
});

test("D12-1 with nothing known, every weighted exercise shows 'Try <kg>' with the first-try note; never 'Find it'", () => {
  const doc = { ...validDoc(), sessions: [], exercise_state: [] };
  for (const id of weighted) {
    for (const week of [0, 1, 2, 7]) {
      const sg = workout.suggestFor(doc, id, { week, missed: null, exerciseState: undefined });
      assert.equal(sg.action, "first_try", id);
      assert.equal(sg.weight_kg, progression.firstTryWeight(id, doc.shared_settings, doc.profile));
      // Test change (trainer D12 addition, 2026-11-18, commit dc59f13): from week 2 the find-your-weight steps do not
      // run, so the first-try note there tells you to change the weight one step for the next set.
      assert.equal(sg.note, week <= 1 ? "First try. Set 1 tells us if it is right." : "First try. Set 1 too easy (4 or more reps left) or too hard? Change the weight one step for the next set.");
      const wl = weightLine(doc, id, week);
      assert.equal(wl.text, `Try ${sg.weight_kg} kg`, id);
      assert.equal(wl.kg, sg.weight_kg);
    }
  }
  for (const f of ["planview.js", "ui/exlayer.js", "ui/today.js"]) assert.doesNotMatch(src(f), /"Find it"|"pick light"/, f);
  assert.match(src("ui/week1.js"), /First try\. Set 1 tells us if it is right\./);
});

test("D12-3 order: Plan weight > log > found weight > table", () => {
  const doc = validDoc();
  const st = (extra) => ({ id: "x-chest_press", updated_at: "2026-02-01T10:00:00.000Z", start_weight_kg: 30, machine_note: "", fail_streak: 0, ...extra });
  // found weight beats the table
  assert.equal(workout.suggestFor(doc, "chest_press", { week: 2, missed: null, exerciseState: st() }).weight_kg, 30);
  // a log (week 3) beats the found weight
  doc.sessions = [session("2026-01-28", 3, "chest_press", [work(1, 45, 10), work(2, 45, 10), work(3, 45, 9)])];
  const fromLog = workout.suggestFor(doc, "chest_press", { week: 4, missed: null, exerciseState: st() });
  assert.equal(fromLog.weight_kg, 45);
  // a Plan weight set after the log beats the log
  const mine = workout.suggestFor(doc, "chest_press", { week: 4, missed: null, exerciseState: st({ my_weight_kg: 50, my_weight_at: "2026-02-01" }) });
  assert.equal(mine.weight_kg, 50);
  assert.equal(mine.action, "mine");
});

test("D12-4 bodyweight and timed exercises show no weight", () => {
  const doc = { ...validDoc(), sessions: [] };
  for (const id of Object.keys(exercises).filter((x) => !weighted.includes(x))) {
    const wl = weightLine(doc, id, 1);
    assert.equal(wl.kg, null, id);
    assert.doesNotMatch(wl.text, /Try/);
  }
});

// ---------- checker round 1, finding 1: two rules with no test ----------

test("K1 a stop with 0 work sets is skipped: the two stops around it still give one step lighter", () => {
  const doc = validDoc();
  const w = (n, kg, reps) => ({ n, type: "work", weight_kg: kg, reps, seconds: null, rir: 2, done_at: "2026-02-23T09:00:00.000Z" });
  const s = (date, reps) => ({
    id: `s-${date.replaceAll("-", "")}-x1`, updated_at: `${date}T10:00:00.000Z`, date, plan_day: "mon", week: 3, kind: "full",
    swapped_from: null, status: "finished", started_at: `${date}T08:00:00.000Z`, finished_at: `${date}T10:00:00.000Z`, walk: null,
    exercises: [{ slot: "A1", plan_exercise: "chest_press", done_exercise: "chest_press", swap_reason: null, sets: reps.map((r, i) => w(i + 1, 60, r)), note: "", stopped_after: reps.length }], note: "",
  });
  doc.sessions = [s("2026-02-02", [9, 6]), s("2026-02-09", []), s("2026-02-16", [8, 7])];
  const out = workout.suggestFor(doc, "chest_press", { week: 4, missed: null, exerciseState: undefined });
  assert.equal(out.action, "lower");
  assert.equal(out.weight_kg, 55);
});

test("K2 a past Monday week-8 workout without planned_sets keeps the old leg-day rule for D (2 sets)", () => {
  const dSlot = days.mon.slots.find((x) => x.slot === "D");
  const past = { plan_day: "mon", week: 8, kind: "full", exercises: [{ slot: "D", plan_exercise: dSlot.ex, done_exercise: dSlot.ex, sets: [] }] };
  assert.equal(schedule.planForSession(past).slots.find((x) => x.slot === "D").sets, Math.min(dSlot.sets, 2));
  assert.equal(setsFor(8, "mon", "D"), dSlot.sets, "a new Monday week-8 workout keeps D at its plan sets");
});
