// Version 0.6.0, the Today part (Today worker, 2026-11-18). Rosario's words: "Today becomes what I need to do that
// specific day at the gym ... so I can start any day of the week and it should have a start button ... and I can keep
// track of the exercises I have done so far and if I've done the whole set or only 1 set or partial repetitions."
//  T1-T4  the day Today shows by itself (defaultShown): the calendar's day, else the first day not done yet;
//         a workout done today keeps its day; Saturday and Sunday show the rest day until a day is picked.
//  T5-T6  the day picker drives Start and Short day; the old "Swap day" sheet is gone.
//  T7     the list on Today shows the reps set in the Plan (rangeFor) and the weight the workout will suggest.
//  T8-T10 the workout: "Stop this exercise here" with a small question and an 8 s Undo; the target line uses the reps set
//         in the Plan; a set below the range is saved as it is.
//  T11    safe page rules: no innerHTML, no style attributes, colours only through the tokens of app.css.
//  T12-T15 auditor M2 (2026-11-18): after "Stop this exercise here" the rest, the "Next" line and the progress bar skip
//         the stopped sets (flow.js nextDue, restBetween, progressOf). Stopped A2: A1's rest is the pair rest, not the
//         30 s move. Nothing left after a stop: no rest before Finish. M3 (Undo after the last stop) is in
//         tests/v060-today-undo.test.mjs.
// All values are made up. No body data.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createStore } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import * as workout from "../app/js/engine/workout.js";
import { validDoc, fakeStorage } from "./fixtures/profiles.mjs";
import * as today from "../app/js/ui/today.js";
import * as flow from "../app/js/ui/flow.js";
import { days } from "../app/js/plan/plan-v2.js";
const defaultShown = (doc, date) => today.defaultShown(doc, date);

const src = (p) => readFileSync(new URL(`../app/${p}`, import.meta.url), "utf8");
const T = "2026-03-02T09:00:00.000Z";

// The block starts on Monday 2026-01-12: 2026-01-14 is the Wednesday of week 1, 2026-01-17 the Saturday.
function session(date, planDay, status = "finished") {
  return {
    id: `s-${date.replaceAll("-", "")}-${planDay}`, updated_at: `${date}T10:00:00.000Z`, date, plan_day: planDay, week: 1, kind: "full",
    swapped_from: null, status, started_at: `${date}T08:00:00.000Z`, finished_at: status === "finished" ? `${date}T10:00:00.000Z` : null, walk: null,
    exercises: [{ slot: "A1", plan_exercise: "leg_press", done_exercise: "leg_press", swap_reason: null, sets: [], note: "" }], note: "",
  };
}

// ---------- the day Today shows ----------

test("T1 on a weekday with nothing done, Today shows the calendar's plan day", () => {
  assert.equal(defaultShown(validDoc(), "2026-01-14"), "wed");
  assert.equal(defaultShown(validDoc(), "2026-01-12"), "mon");
});

test("T2 when the calendar's day was already done this week, Today shows the first day not done yet", () => {
  const doc = validDoc();
  doc.sessions = [session("2026-01-13", "wed")]; // Wednesday's workout done on Tuesday
  assert.equal(defaultShown(doc, "2026-01-14"), "mon");
  doc.sessions.push(session("2026-01-12", "mon"));
  assert.equal(defaultShown(doc, "2026-01-14"), "tue");
});

test("T3 a workout finished today keeps its day on Today (Done for today shows what was trained)", () => {
  const doc = validDoc();
  doc.sessions = [session("2026-01-14", "fri")];
  assert.equal(defaultShown(doc, "2026-01-14"), "fri");
});

// 0.7.1, trainer D11: a weekday before the plan starts is a practice day, so Today shows the calendar's day.
test("T4 Saturday and Sunday show the rest day until a day is picked; before the plan starts it is a practice day", () => {
  assert.equal(defaultShown(validDoc(), "2026-01-17"), null);
  assert.equal(defaultShown(validDoc(), "2026-01-18"), null);
  assert.equal(defaultShown(validDoc(), "2026-01-05"), "mon");
  const t = src("js/ui/today.js");
  assert.match(t, /Rest day/, "the rest-day card is kept");
  assert.match(t, /dayPicker\(/, "the picker is shown, also on the rest day");
});

// ---------- the picker drives Start ----------

test("T5 Start and Short day start the day the picker shows; a day other than the calendar's is saved as a swap", () => {
  const t = src("js/ui/today.js");
  assert.match(t, /dayChoices\(/);
  assert.match(t, /startWorkout\(\{ kind: "full", planDay: shown, swappedFrom: /);
  assert.match(t, /startWorkout\(\{ kind: "short", planDay: shown, swappedFrom: /);
  assert.match(t, /shown !== label\.planDay \? label\.planDay : null/);
  assert.doesNotMatch(t, /planDay: label\.planDay \}/, "Start no longer uses the calendar's day");
  assert.match(t, /aria-pressed/, "the picked day is told to VoiceOver");
  assert.match(t, /canStartWorkout\(/, "one workout a day is kept");
  assert.match(t, /Done for today/);
  assert.match(t, /resumeCard\(/, "the card for a running workout is kept");
});

test("T6 the old Swap day sheet is replaced by the picker", () => {
  const t = src("js/ui/today.js");
  assert.doesNotMatch(t, /"Swap day"/);
  assert.doesNotMatch(t, /openSwapDay/);
});

// ---------- the list on Today ----------

test("T7 Today's list shows the reps set in the Plan and the weight the workout will suggest", () => {
  const t = src("js/ui/today.js");
  assert.match(t, /rangeFor\(doc, exId\)/);
  assert.match(t, /rangeText\(/);
  assert.match(t, /suggestFor\(/);
  assert.doesNotMatch(t, /const \[lo, hi\] = ex\.range/, "the plan's own range is not used when the Plan sets other reps");
});

// ---------- the workout ----------

test("T8 the set screen has a text button 'Stop this exercise here' that asks first, then saves, with an 8 s Undo", () => {
  const p = src("js/ui/pair.js");
  assert.match(p, /"Stop this exercise here"/);
  assert.match(p, /Move on with \$\{/);
  assert.match(p, /The sets you did are saved\./);
  assert.match(p, /model\.stopExercise\(session\.id, entry\.slot, true\)/);
  assert.match(p, /model\.stopExercise\(sessionId, slot, false\)/, "Undo (undoStop, tested for real in T16) un-stops it");
  assert.match(p, /import \{ undoToast \} from "\.\/planedit\.js"/);
  assert.match(p, /undoToast\(/);
});

test("T9 the target line uses the reps set in the Plan", () => {
  const p = src("js/ui/pair.js");
  // 0.7.6 (trainer D19 and its answer 1 to 8.43): at the floor, also after a pain swap, the effort is at least 3 reps
  // left (tests/v076-d19.test.mjs on the real card); the reps still come from the Plan (rangeFor).
  assert.match(p, /targetText\(exId, entry\.sets, atFloor \? floorRir\(ctx\.plan\.rir\) : ctx\.plan\.rir, rangeFor\(ctx\.doc, exId\)\)/);
});

test("T10 a set below the range is saved as it is; after Stop the workout moves on and keeps the sets done", () => {
  const store = createStore(fakeStorage());
  let ms = Date.parse(T);
  store.save(validDoc());
  const model = createModel(store, () => new Date((ms += 1000)));
  const s0 = model.startSession({ planDay: "tue", week: 3, kind: "full" });
  model.logSet(s0.id, "A1", { type: "work", weight_kg: 40, reps: 3 }); // 3 reps: far below 10 to 12
  model.stopExercise(s0.id, "A1", true);
  const s = model.doc().sessions.find((x) => x.id === s0.id);
  const rec = s.exercises.find((e) => e.slot === "A1");
  assert.equal(workout.workSets(rec).length, 1);
  assert.equal(workout.workSets(rec)[0].reps, 3, "saved as it is");
  assert.equal(rec.stopped_after, 1);
  const plan = { slots: s.exercises.map((e) => ({ slot: e.slot, ex: e.plan_exercise, sets: e.planned_sets, rest: e.planned_rest })) };
  const { seq } = workout.buildSequence(plan.slots);
  const pos = workout.nextPosition(s, seq);
  assert.notEqual(pos.entry.slot, "A1");
});

// ---------- safe page rules ----------

test("T11 no innerHTML, no style attributes; the Today styles use only the tokens of app.css", () => {
  for (const f of ["js/ui/today.js", "js/ui/pair.js"]) {
    const s = src(f);
    assert.doesNotMatch(s, /innerHTML|outerHTML|insertAdjacentHTML/, f);
    assert.doesNotMatch(s, /setAttribute\(\s*["']style|"style":|\bstyle: "/, f);
  }
  const css = src("css/v060-today.css");
  assert.match(css, /\.day-picker/);
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/, "colours only through var(--…)");
});

// ---------- auditor M2: the stopped sets are skipped by the rest, "Next" and the progress bar ----------

// Tuesday, week 3: A1/A2, B1/B2, C1/C2 pairs of 3 sets (30 s move inside a pair, then the pair rest), D on its own.
// Every move was done the Tuesday before, so none starts with the 2 sets of a new move (answer 83 a).
function tuesday() {
  const store = createStore(fakeStorage());
  let ms = Date.parse(T);
  const doc = validDoc();
  const done = (n) => ({ n, type: "work", weight_kg: 20, reps: 10, seconds: null, rir: 2, done_at: "2026-02-24T09:00:00.000Z" });
  doc.sessions = [{
    id: "s-20260224-tue", updated_at: "2026-02-24T10:00:00.000Z", date: "2026-02-24", plan_day: "tue", week: 2, kind: "full",
    swapped_from: null, status: "finished", started_at: "2026-02-24T08:00:00.000Z", finished_at: "2026-02-24T10:00:00.000Z", walk: null,
    exercises: days.tue.slots.map((s) => ({ slot: s.slot, plan_exercise: s.ex, done_exercise: s.ex, swap_reason: null, sets: [done(1), done(2)], note: "" })), note: "",
  }];
  store.save(doc);
  const model = createModel(store, () => new Date((ms += 1000)));
  const s0 = model.startSession({ planDay: "tue", week: 3, kind: "full" });
  const plan = { slots: s0.exercises.map((e) => ({ slot: e.slot, ex: e.plan_exercise, sets: e.planned_sets, rest: e.planned_rest })) };
  const { seq } = workout.buildSequence(plan.slots);
  assert.ok(["A1", "A2", "D"].every((slot) => seq.some((e) => e.slot === slot && e.setNumber === 3)), "test data: 3 sets each");
  const get = () => model.doc().sessions.find((x) => x.id === s0.id);
  const at = (slot, n) => seq.findIndex((e) => e.slot === slot && e.setNumber === n);
  return { model, id: s0.id, seq, get, at };
}
const call = (name, ...args) => {
  assert.equal(typeof flow[name], "function", `flow.js exports ${name}`);
  return flow[name](...args);
};

test("T12 stopped A2: after A1 set 2 the next set is A1 set 3 and the rest is the pair rest, not the 30 s move", () => {
  const { model, id, seq, get, at } = tuesday();
  model.logSet(id, "A1", { type: "work", weight_kg: 40, reps: 10 });
  model.logSet(id, "A2", { type: "work", weight_kg: 30, reps: 10 });
  model.stopExercise(id, "A2", true);
  model.logSet(id, "A1", { type: "work", weight_kg: 40, reps: 10 }); // A1 set 2 just saved
  const from = at("A1", 2);
  assert.equal(seq[from].restKind, "move", "in the full plan a move follows A1 set 2");
  const next = call("nextDue", get(), seq, from);
  assert.equal(next.entry.slot, "A1");
  assert.equal(next.entry.setNumber, 3);
  const rest = call("restBetween", seq, from, next.index);
  assert.equal(rest.seconds, seq[at("A2", 2)].restAfter, "the pair rest");
  assert.ok(rest.seconds > 30);
  assert.equal(rest.kind, "rest");
});

test("T13 stopped A1: after A2 set 2 the next set is A2 set 3, still after the pair rest", () => {
  const { model, id, seq, get, at } = tuesday();
  model.logSet(id, "A1", { type: "work", weight_kg: 40, reps: 10 });
  model.stopExercise(id, "A1", true);
  model.logSet(id, "A2", { type: "work", weight_kg: 30, reps: 10 });
  model.logSet(id, "A2", { type: "work", weight_kg: 30, reps: 10 });
  const from = at("A2", 2);
  const next = call("nextDue", get(), seq, from);
  assert.equal(next.entry.slot, "A2");
  assert.equal(next.entry.setNumber, 3);
  assert.equal(call("restBetween", seq, from, next.index).seconds, seq[from].restAfter);
});

test("T14 nothing left after a stop: no next set, so no rest before Finish; the Next line never names a skipped set", () => {
  const { model, id, seq, get, at } = tuesday();
  model.logSet(id, "D", { type: "work", weight_kg: 0, reps: 10 });
  model.stopExercise(id, "D", true); // the last exercise ends after 1 set
  const from = at("C2", 3); // the last set still due
  assert.equal(call("nextDue", get(), seq, from), null, "D set 1 is done and D sets 2 and 3 are skipped");
  model.logSet(id, "A1", { type: "work", weight_kg: 40, reps: 10 });
  model.logSet(id, "A2", { type: "work", weight_kg: 30, reps: 10 });
  model.stopExercise(id, "A2", true);
  const next = call("nextDue", get(), seq, at("A1", 2));
  assert.notEqual(next.entry.slot, "A2");
  const p = src("js/ui/pair.js");
  assert.doesNotMatch(p, /seq\[pos\.index \+ 1\]/, "pair.js no longer takes the next entry of the full sequence");
  assert.match(p, /nextDue\(/);
  assert.match(p, /restBetween\(/);
});

test("T15 the progress bar counts only the sets still planned, so it fills after a stop", () => {
  const { model, id, seq, get } = tuesday();
  assert.deepEqual(call("progressOf", get(), seq), { done: 0, total: seq.length });
  model.logSet(id, "A1", { type: "work", weight_kg: 40, reps: 10 });
  model.stopExercise(id, "A1", true);
  assert.deepEqual(call("progressOf", get(), seq), { done: 1, total: seq.length - 2 });
  for (const f of ["js/ui/pair.js", "js/ui/rest.js"]) {
    assert.doesNotMatch(src(f), /total: (ctx\.)?seq\.length/, `${f} uses progressOf`);
    assert.match(src(f), /progressOf\(/, f);
  }
});
