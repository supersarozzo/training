import test from "node:test";
import assert from "node:assert/strict";
import { planForDay, missedRule } from "../app/js/engine/schedule.js";
import {
  buildSequence, nextPosition, wantsWarmup, suggestFor, performances, walkSuggestion, targetText, isNewBest,
  describeLast, lighterFor, finishedSessions,
} from "../app/js/engine/workout.js";
import { createStore } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { validateDocument } from "../app/js/validate.js";
import { fakeStorage, validDoc } from "./fixtures/profiles.mjs";

const slotsOf = (day, week, kind = "full") => planForDay(day, week, kind).slots;
const names = (seq) => seq.map((e) => `${e.slot}#${e.setNumber}`);

test("Monday week 2: pairs alternate A1 A2 A1 A2 ..., then the plank and the calf raise (D) one after the other", () => {
  const { seq } = buildSequence(slotsOf("mon", 2));
  assert.deepEqual(names(seq).slice(0, 6), ["A1#1", "A2#1", "A1#2", "A2#2", "A1#3", "A2#3"]);
  assert.equal(seq.length, 6 * 3 + 2 + 3); // 3 pairs x 3 sets x 2, plank 2, calf raise (D) 3 (changed 2026-11-18)
  assert.deepEqual(names(seq).slice(18), ["Abs1#1", "Abs1#2", "D#1", "D#2", "D#3"]);
});

test("rest: 30 s to move inside a pair, the pair rest after the second exercise, nothing after the very last set", () => {
  const { seq } = buildSequence(slotsOf("mon", 2));
  assert.deepEqual([seq[0].restAfter, seq[0].restKind], [30, "move"]);
  assert.deepEqual([seq[1].restAfter, seq[1].restKind], [90, "rest"]);
  const c2 = seq.find((e) => e.slot === "C2");
  assert.equal(c2.restAfter, 60);
  const plank = seq.find((e) => e.slot === "Abs1");
  assert.equal(plank.restAfter, 30);
  assert.equal(seq[seq.length - 1].restAfter, null);
});

test("Wednesday pair B: lateral raise has 2 sets, pulldown 3 (the third round has only the pulldown, resting 75 s)", () => {
  const { seq } = buildSequence(slotsOf("wed", 2));
  const b = seq.filter((e) => e.slot === "B1" || e.slot === "B2");
  assert.deepEqual(names(b), ["B1#1", "B2#1", "B1#2", "B2#2", "B1#3"]);
  assert.equal(b[4].restAfter, 75);
});

test("weeks 7 to 11: pair A gets a 4th set and exercise D drops to 2 sets on BOTH leg days (plan v2 section 4)", () => {
  for (const day of ["tue", "fri"]) {
    const { seq } = buildSequence(slotsOf(day, 8));
    assert.equal(seq.filter((e) => e.slot === "A1").length, 4, `${day} A1`);
    assert.equal(seq.filter((e) => e.slot === "A2").length, 4, `${day} A2`);
    assert.equal(seq.filter((e) => e.slot === "D").length, 2, `${day} D`);
  }
});

test("week 1 has 2 sets; the short day is pairs A and B plus the first abs exercise", () => {
  const w1 = buildSequence(slotsOf("mon", 1)).seq;
  assert.equal(w1.filter((e) => e.slot === "A1").length, 2);
  const short = buildSequence(slotsOf("mon", 3, "short")).seq;
  assert.deepEqual([...new Set(short.map((e) => e.slot))], ["A1", "A2", "B1", "B2", "Abs1"]);
  const shortLeg = buildSequence(slotsOf("tue", 3, "short")).seq;
  assert.deepEqual([...new Set(shortLeg.map((e) => e.slot))], ["A1", "A2", "B1", "B2"]); // no D on a short leg day
});

test("setsOverride caps every slot (after a break of more than 4 weeks)", () => {
  const { seq } = buildSequence(slotsOf("mon", 5), { setsOverride: 2 });
  assert.ok(seq.every((e) => e.sets <= 2));
  assert.equal(seq.filter((e) => e.slot === "A1").length, 2);
});

test("nextPosition continues from the saved sets (reload mid-workout)", () => {
  const { units, seq } = buildSequence(slotsOf("mon", 2));
  const session = { exercises: slotsOf("mon", 2).map((s) => ({ slot: s.slot, sets: [] })) };
  assert.equal(nextPosition(session, seq).entry.slot, "A1");
  session.exercises[0].sets.push({ type: "warmup", n: 1 }, { type: "work", n: 1 });
  const p = nextPosition(session, seq);
  assert.deepEqual([p.entry.slot, p.entry.setNumber], ["A2", 1]);
  session.exercises[1].sets.push({ type: "work", n: 1 });
  const p2 = nextPosition(session, seq);
  assert.deepEqual([p2.entry.slot, p2.entry.setNumber], ["A1", 2]);
  // warm-ups come only before set 1 of the first exercise of a pair
  assert.equal(wantsWarmup(seq[0], units), true);
  assert.equal(wantsWarmup(seq[1], units), false);
  assert.equal(wantsWarmup(seq[2], units), false);
  const abs = seq.find((e) => e.slot === "Abs1");
  assert.equal(wantsWarmup(abs, units), false);
  // all saved -> no position
  const all = { exercises: slotsOf("mon", 2).map((s) => ({ slot: s.slot, sets: Array.from({ length: s.sets }, (_, i) => ({ type: "work", n: i + 1 })) })) };
  assert.equal(nextPosition(all, seq), null);
});

// ---------- history and suggestions ----------

function finished({ date = "2026-01-05", week = 2, day = "mon", slot = "A1", ex = "chest_press", weight = 30, reps = [12, 12, 12], rir = 2, status = "finished", reason = null } = {}) {
  return {
    id: `s-${date}-${slot}-${status}`, updated_at: `${date}T10:00:00.000Z`, date, plan_day: day, week, kind: "full", status,
    started_at: `${date}T08:00:00.000Z`, finished_at: `${date}T09:30:00.000Z`, walk: null, effort: null, note: "",
    exercises: [{ slot, plan_exercise: ex, done_exercise: ex, swap_reason: reason, note: "", sets: reps.map((r, i) => ({ n: i + 1, type: "work", weight_kg: weight, reps: r, seconds: null, rir })) }],
  };
}
const docWith = (sessions, extra = {}) => ({ ...validDoc(), sessions, ...extra });

// 0.7.1, trainer D12: with no history a weighted exercise gets its first-try weight (tests/v071-practice.test.mjs).
test("no history: the first-try weight, bodyweight starts at 0", () => {
  const doc = docWith([]);
  const s = suggestFor(doc, "chest_press", { week: 2, missed: null, exerciseState: undefined });
  assert.equal(s.action, "first_try");
  assert.ok(s.weight_kg > 0 && s.weight_kg <= 20);
  assert.equal(suggestFor(doc, "plank", { week: 2, missed: null }).weight_kg, 0);
});

test("all sets at the top with reps left: add the smallest step", () => {
  const doc = docWith([finished({ weight: 60, reps: [12, 12, 12], rir: 2 })]);
  const s = suggestFor(doc, "chest_press", { week: 3, missed: null });
  assert.equal(s.weight_kg, 65); // stack step 5 in the fixture: a jump of less than 10 %
  assert.match(s.lastText, /Last time: 60 kg × 12, 12, 12/);
});

test("a big jump (5 kg on 30 kg is more than 10 %): first reach 2 reps above the range, same weight", () => {
  const doc = docWith([finished({ weight: 30, reps: [12, 12, 12], rir: 2 })]);
  const s = suggestFor(doc, "chest_press", { week: 3, missed: null });
  assert.equal(s.weight_kg, 30);
  assert.equal(s.action, "extra_reps");
  assert.deepEqual(s.range, [8, 14]);
});

test("some sets not at the top: same weight, aim for one more rep", () => {
  const doc = docWith([finished({ weight: 30, reps: [11, 10, 9] })]);
  const s = suggestFor(doc, "chest_press", { week: 3, missed: null });
  assert.equal(s.weight_kg, 30);
  assert.equal(s.action, "same_add_rep");
});

test("a deleted, abandoned or unfinished session never counts as history", () => {
  const doc = docWith([finished({ status: "abandoned" }), { ...finished({ date: "2026-01-06" }), deleted: true }, finished({ date: "2026-01-07", status: "in_progress" })]);
  assert.equal(performances(doc.sessions, "chest_press").length, 0);
});

test("week 1 finds the weight: the saved starting weight is the suggestion for week 2 (no progression on top)", () => {
  const doc = docWith([finished({ week: 1, weight: 25, reps: [12, 12], rir: 4 })]);
  const state = { id: "x-chest_press", start_weight_kg: 30 };
  const s = suggestFor(doc, "chest_press", { week: 2, missed: null, exerciseState: state });
  assert.equal(s.weight_kg, 30);
  assert.equal(s.action, "start");
  // with no history at all but a saved start weight the start weight is used too
  assert.equal(suggestFor(docWith([]), "chest_press", { week: 2, missed: null, exerciseState: state }).weight_kg, 30);
});

test("after a break: 5 to 13 days = same weight, no increase; 2 to 4 weeks = about 10 % lower", () => {
  const doc = docWith([finished({ weight: 30, reps: [12, 12, 12], rir: 2 })]);
  const noInc = suggestFor(doc, "chest_press", { week: 3, missed: missedRule("2026-01-05", "2026-01-12") });
  assert.equal(noInc.weight_kg, 30);
  const minus10 = suggestFor(doc, "chest_press", { week: 3, missed: missedRule("2026-01-05", "2026-01-26") });
  assert.equal(minus10.weight_kg, 25); // 27 rounded down to a 5 kg plate step
});

test("a swap because it hurt starts lighter; bodyweight swaps start at 0", () => {
  assert.equal(lighterFor("db_bench_press", 20, { dumbbell_steps_kg: [2, 4, 6, 8, 10, 12, 14, 16] }), 14);
  assert.equal(lighterFor("plank", 20, {}), 0);
});

test("targetText, describeLast and new bests", () => {
  assert.equal(targetText("chest_press", 3, 2), "3 sets · 8 to 12 reps · stop with 2 left");
  assert.equal(targetText("plank", 3, 2), "3 sets · 20 to 40 seconds · stop with 2 left");
  assert.equal(targetText("dead_bug", 2, [1, 2]), "2 sets · 8 reps each side · stop with 1 or 2 left");
  const earlier = [{ weight_kg: 30, sets: [{ reps: 12 }, { reps: 10 }] }];
  assert.equal(isNewBest({ weight_kg: 35, sets: [{ reps: 8 }] }, earlier, "reps"), true);
  assert.equal(isNewBest({ weight_kg: 30, sets: [{ reps: 13 }] }, earlier, "reps"), true);
  assert.equal(isNewBest({ weight_kg: 30, sets: [{ reps: 12 }] }, earlier, "reps"), false);
  assert.equal(isNewBest({ weight_kg: 25, sets: [{ reps: 15 }] }, earlier, "reps"), false);
  assert.equal(isNewBest({ weight_kg: 0, sets: [{ reps: 0, seconds: 45 }] }, [{ weight_kg: 0, sets: [{ seconds: 40 }] }], "hold"), true);
  assert.equal(isNewBest({ weight_kg: 30, sets: [{ reps: 12 }] }, [], "reps"), false); // the first time is not a best
  assert.equal(describeLast({ weight_kg: 0, sets: [{ seconds: 30 }, { seconds: 25 }] }, "plank"), "Last time: 30, 25 s");
});

// ---------- the walk ----------

function walkSession(date, { effort, slope, speed = 5, leg = false, breathless = false }) {
  return { ...finished({ date }), walk: { speed_kmh: speed, slope_pct: slope, minutes: 30, effort, breathless, leg_day: leg } };
}
const walkDoc = (sessions) => docWith(sessions, { profile: { updated_at: "2026-01-05T08:00:00.000Z", intake: { q36_walk_fit: "yes" }, targets: { kcal: null, protein_g: null, goal: "recomp", source: "computed", walk_start: { speed_kmh: 5, slope_pct: 6 } } } });

test("walk: first walk uses the starting settings; leg days are 2 % less steep", () => {
  const doc = walkDoc([]);
  const normal = walkSuggestion(doc, { week: 2, legDay: false, missed: null });
  assert.deepEqual([normal.speed_kmh, normal.slope_pct, normal.minutes], [5, 6, 30]);
  const leg = walkSuggestion(doc, { week: 2, legDay: true, missed: null });
  assert.equal(leg.slope_pct, 4);
});

test("walk: two easy walks in a row add 1 % slope; one is not enough; harder walks do not", () => {
  const one = walkDoc([walkSession("2026-01-05", { effort: 5, slope: 6 })]);
  assert.equal(walkSuggestion(one, { week: 2, legDay: false, missed: null }).slope_pct, 6);
  const two = walkDoc([walkSession("2026-01-05", { effort: 5, slope: 6 }), walkSession("2026-01-06", { effort: 4, slope: 6 })]);
  assert.equal(walkSuggestion(two, { week: 3, legDay: false, missed: null }).slope_pct, 7);
  const hard = walkDoc([walkSession("2026-01-05", { effort: 7, slope: 6 }), walkSession("2026-01-06", { effort: 5, slope: 6 })]);
  assert.equal(walkSuggestion(hard, { week: 3, legDay: false, missed: null }).slope_pct, 6);
});

test("walk: after a rise, two NEW easy walks at the new setting are needed before the next rise", () => {
  const doc = walkDoc([
    walkSession("2026-01-05", { effort: 5, slope: 6 }), walkSession("2026-01-06", { effort: 5, slope: 6 }),
    walkSession("2026-01-07", { effort: 4, slope: 7 }),
  ]);
  assert.equal(walkSuggestion(doc, { week: 3, legDay: false, missed: null }).slope_pct, 7);
});

test("walk: leg-day walks count at their normal-day equivalent; no rise in week 1, 6, 11, 12; out of breath lowers", () => {
  const doc = walkDoc([walkSession("2026-01-05", { effort: 4, slope: 4, leg: true }), walkSession("2026-01-06", { effort: 4, slope: 6 })]);
  assert.equal(walkSuggestion(doc, { week: 3, legDay: false, missed: null }).slope_pct, 7);
  for (const week of [1, 6, 11, 12]) assert.equal(walkSuggestion(doc, { week, legDay: false, missed: null }).slope_pct, 6, `week ${week}`);
  const breathless = walkDoc([walkSession("2026-01-05", { effort: 6, slope: 6, breathless: true })]);
  assert.equal(walkSuggestion(breathless, { week: 3, legDay: false, missed: null }).slope_pct, 5);
});

test("walk: short day is 15 minutes; after a long break the starting settings return", () => {
  const doc = walkDoc([walkSession("2026-01-05", { effort: 4, slope: 9 })]);
  assert.equal(walkSuggestion(doc, { week: 3, legDay: false, missed: null, kind: "short" }).minutes, 15);
  const back = walkSuggestion(doc, { week: 3, legDay: false, missed: missedRule("2026-01-05", "2026-03-05") });
  assert.equal(back.slope_pct, 6);
});

// ---------- the model: sessions are saved on every change ----------

test("model: start, save every set at once, undo, swap, finish; the saved file passes the checker", () => {
  const storage = fakeStorage();
  const store = createStore(storage);
  store.save(validDoc());
  let tick = 0;
  const model = createModel(store, () => new Date(Date.UTC(2026, 0, 12, 8, 0, tick++)));
  const plan = planForDay("mon", 2);
  const s = model.startSession({ planDay: "mon", week: 2, kind: "full", slots: plan.slots });
  assert.equal(s.status, "in_progress");
  assert.equal(store.load().sessions.length, 1);

  model.logSet(s.id, "A1", { type: "warmup", weight_kg: 15, reps: 10 });
  model.logSet(s.id, "A1", { type: "work", weight_kg: 30, reps: 10 });
  model.setLastRir(s.id, "A1", 2);
  model.logSet(s.id, "A1", { type: "work", weight_kg: 30, reps: 9 });
  let saved = store.load().sessions[0];
  const a1 = saved.exercises.find((e) => e.slot === "A1");
  assert.deepEqual(a1.sets.map((x) => [x.type, x.n]), [["warmup", 1], ["work", 1], ["work", 2]]);
  assert.equal(a1.sets[1].rir, 2);
  assert.equal(a1.sets[2].rir, null);

  model.undoLastSet(s.id, "A1");
  assert.equal(store.load().sessions[0].exercises[0].sets.length, 2);

  model.swapExercise(s.id, "A2", "one_arm_db_row", "hurts", "left shoulder", 4);
  const a2 = store.load().sessions[0].exercises.find((e) => e.slot === "A2");
  assert.deepEqual([a2.plan_exercise, a2.done_exercise, a2.swap_reason, a2.swap_weight_kg], ["pulldown", "one_arm_db_row", "hurts", 4]);

  model.setWalk(s.id, { speed_kmh: 5, slope_pct: 6, minutes: 30, effort: 5, breathless: false, leg_day: false });
  model.finishSession(s.id, { effort: 7, note: "ok" });
  saved = store.load().sessions[0];
  assert.equal(saved.status, "finished");
  assert.ok(saved.finished_at);
  assert.deepEqual(finishedSessions(store.load().sessions).map((x) => x.id), [s.id]);

  const checked = validateDocument(store.load());
  assert.equal(checked.ok, true, checked.error);
});

test("model: abandoned workouts and exercise state", () => {
  const store = createStore(fakeStorage());
  store.save(validDoc());
  const model = createModel(store, () => new Date("2026-01-12T08:00:00Z"));
  const s = model.startSession({ planDay: "mon", week: 2, kind: "full", slots: planForDay("mon", 2).slots });
  model.abandonSession(s.id);
  assert.equal(store.load().sessions[0].status, "abandoned");
  assert.throws(() => model.logSet("nope", "A1", { type: "work" }), /not found/);
  model.setExerciseState("chest_press", { start_weight_kg: 30, machine_note: "seat 4" });
  model.setExerciseState("chest_press", { machine_note: "seat 5" });
  const st = store.load().exercise_state;
  assert.equal(st.length, 1);
  assert.deepEqual([st[0].id, st[0].start_weight_kg, st[0].machine_note], ["x-chest_press", 30, "seat 5"]);
  assert.equal(validateDocument(store.load()).ok, true);
});
