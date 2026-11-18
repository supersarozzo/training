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
// All values are made up. No body data.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createStore } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import * as workout from "../app/js/engine/workout.js";
import { validDoc, fakeStorage } from "./fixtures/profiles.mjs";
import * as today from "../app/js/ui/today.js";
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

test("T4 Saturday and Sunday show the rest day until a day is picked; before the plan starts there is no day", () => {
  assert.equal(defaultShown(validDoc(), "2026-01-17"), null);
  assert.equal(defaultShown(validDoc(), "2026-01-18"), null);
  assert.equal(defaultShown(validDoc(), "2026-01-05"), null);
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
  assert.match(p, /model\.stopExercise\(session\.id, entry\.slot, false\)/);
  assert.match(p, /import \{ undoToast \} from "\.\/planedit\.js"/);
  assert.match(p, /undoToast\(/);
});

test("T9 the target line uses the reps set in the Plan", () => {
  const p = src("js/ui/pair.js");
  assert.match(p, /targetText\(exId, entry\.sets, ctx\.plan\.rir, rangeFor\(ctx\.doc, exId\)\)/);
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
