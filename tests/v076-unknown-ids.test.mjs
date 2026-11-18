// Version 0.7.6 (worker 8.43): an app skips exercises it does not know instead of failing (8.42's follow-up, check
// record docs/checks/2026-11-18-v075.md). A phone on an older app can sync a workout from a newer app with a new exercise
// id (0.7.5 added four). The newer workout stays in the file exactly as it is (never dropped, never changed); this app
// only leaves the unknown exercise out of what it draws and steps through. Plan edits with unknown ids were already
// guarded (engine/planedits.js checkPlanDay, newerVersion); this covers workouts: finished ones (Progress, the weekly
// summary, the finish summary) and a workout in progress synced from another phone (the workout screens).
// Apps already on phones (0.7.5 and older) cannot be changed; from 0.7.6 on, this holds for every later new id.
// Written before the build (U-3 to U-6 fail until it). All values are made up; no body data.
import test from "node:test";
import assert from "node:assert/strict";
import { install } from "./fixtures/sheet-dom.mjs";

const { body } = install();
globalThis.requestAnimationFrame = () => 0;
globalThis.window.navigator = { standalone: true, onLine: true };
globalThis.window.matchMedia = () => ({ matches: true, addEventListener() {} });
Object.assign(globalThis.location, { hostname: "localhost", search: "?date=2026-11-18" }); // the app's test date (clock.js)
if (!Object.getOwnPropertyDescriptor(globalThis.Node.prototype, "firstChild")) {
  Object.defineProperty(globalThis.Node.prototype, "firstChild", { get() { return this.childNodes[0] ?? null; } });
}
const { store, model } = await import("../app/js/ui/app.js");
const { validDoc } = await import("./fixtures/profiles.mjs");
const { exercises, knownExercise } = await import("../app/js/plan/plan-v2.js");
const { planForSession } = await import("../app/js/engine/schedule.js");
const { currentRecords } = await import("../app/js/engine/workout.js");
const { validateDocument } = await import("../app/js/validate.js");
const { setActive, clearActive } = await import("../app/js/active.js");
const screens = {
  today: (await import("../app/js/ui/today.js")).renderToday,
  plan: (await import("../app/js/ui/planday.js")).renderPlan,
  progress: (await import("../app/js/ui/progress.js")).renderProgress,
  gym: (await import("../app/js/ui/machines.js")).renderGym,
  settings: (await import("../app/js/ui/settings.js")).renderSettings,
  weekly: (await import("../app/js/ui/weekly.js")).renderWeekly,
};
const { renderWorkout } = await import("../app/js/ui/workout.js");

const NEW = "zz_move_from_a_newer_app";
const rec = (slot, plan, done, sets, extra = {}) => ({ slot, plan_exercise: plan, done_exercise: done, swap_reason: plan === done ? null : "busy", note: "",
  planned_sets: 3, planned_rest: slot.endsWith("1") ? null : 90, sets: sets.map(([kg, reps]) => ({ type: "work", weight_kg: kg, reps, rir: 2 })), ...extra });
function workout(date, day, week, records, status = "finished") {
  return { id: `s-${date.replaceAll("-", "")}-${day}`, updated_at: `${date}T10:00:00.000Z`, date, plan_day: day, week, kind: "full", swapped_from: null, status,
    started_at: `${date}T08:00:00.000Z`, finished_at: status === "finished" ? `${date}T10:00:00.000Z` : null, walk: null, note: "", exercises: records };
}
// Last week (Monday 2026-11-09 is week 1) and this week: a new id as a planned exercise and as a swap.
function docWithNewIds() {
  const doc = validDoc();
  doc.block.start_monday = "2026-11-09";
  doc.sessions = [
    workout("2026-11-10", "tue", 1, [rec("A1", "leg_press", "leg_press", [[40, 10], [40, 10]]), rec("A2", NEW, NEW, [[10, 12], [10, 12]])]),
    workout("2026-11-12", "thu", 1, [rec("A1", "incline_db_press", "incline_db_press", [[10, 10], [10, 10]]), rec("A2", "seated_cable_row", NEW, [[20, 10], [20, 10]])]),
    workout("2026-11-16", "mon", 2, [rec("A1", NEW, NEW, [[30, 10], [30, 10], [30, 9]]), rec("A2", "pulldown", "pulldown", [[35, 10], [35, 10], [35, 10]])]),
  ];
  doc.exercise_state = [{ id: `x-${NEW}`, updated_at: "2026-11-16T10:00:00.000Z", start_weight_kg: 10, machine_note: "A new machine" }];
  return doc;
}
const textOf = (out) => (Array.isArray(out) ? out : [out]).filter(Boolean).map((x) => x.textContent).join(" ");
function fresh(doc) {
  store.save(doc);
  store.saveDevice({});
  for (const s of body.querySelectorAll("[data-sheet]")) s.remove();
}

test("U-1 knownExercise: true for the plan's ids, false for others and for names every object has", () => {
  for (const id of Object.keys(exercises)) assert.equal(knownExercise(id), true, id);
  for (const id of [NEW, "", "toString", "constructor", "__proto__", "hasOwnProperty", null, undefined, 3]) assert.equal(knownExercise(id), false, String(id));
});

test("U-2 every tab draws with finished workouts that hold an exercise this app does not know", () => {
  for (const [name, render] of Object.entries(screens)) {
    fresh(docWithNewIds());
    globalThis.location.hash = `#/${name}`;
    const out = render();
    assert.ok(textOf(out).length > 0, `${name} draws`);
    if (name === "plan" || name === "progress") {
      const root = Array.isArray(out) ? out[0] : out;
      for (const b of root.querySelectorAll("button")) assert.doesNotThrow(() => b.click(), `${name}: ${b.textContent}`);
    }
  }
  fresh(docWithNewIds());
  globalThis.location.hash = "#/progress";
  const p = textOf(screens.progress());
  assert.ok(p.includes("Leg press") && p.includes("Pulldown"), "known exercises still listed");
  assert.ok(!p.includes(NEW), "the unknown id is never shown as text");
});

test("U-3 a running workout's plan leaves out an exercise this app does not know (the record stays in the workout)", () => {
  const s = workout("2026-11-18", "wed", 2, [rec("A1", "goblet_squat", "goblet_squat", []), rec("A2", NEW, NEW, []), rec("B1", "pulldown", NEW, []), rec("B2", "lateral_raise", "lateral_raise", [])], "in_progress");
  assert.deepEqual(planForSession(s).slots.map((x) => x.slot), ["A1", "B2"]);
  assert.deepEqual(currentRecords(s).map((x) => x.slot), ["A1", "B2"]);
  assert.equal(s.exercises.length, 4, "nothing removed from the workout itself");
});

test("U-4 a workout in progress from a newer app: the workout screen skips the unknown exercise; sets and Finish keep it in the file", () => {
  const doc = docWithNewIds();
  const s = workout("2026-11-18", "wed", 2, [rec("A1", NEW, NEW, [[12, 10]]), rec("A2", "db_bench_press", "db_bench_press", [])], "in_progress");
  doc.sessions.push(s);
  fresh(doc);
  setActive({ session_id: s.id, phase: "weights", rest: null, hold: null });
  globalThis.location.hash = "#/workout";
  let out;
  assert.doesNotThrow(() => { out = renderWorkout(); });
  const text = textOf(out);
  assert.ok(text.includes("Dumbbell bench press"), "the known exercise is on screen");
  // Log one set of the known exercise through the model, then finish: the unknown record is saved unchanged.
  model.logSet(s.id, "A2", { type: "work", weight_kg: 10, reps: 10 });
  assert.doesNotThrow(() => renderWorkout());
  setActive({ session_id: s.id, phase: "finish", rest: null, hold: null });
  let fin;
  assert.doesNotThrow(() => { fin = renderWorkout(); });
  assert.ok(!textOf(fin).includes(NEW), "the finish summary never shows the unknown id");
  const saved = model.doc().sessions.find((x) => x.id === s.id);
  const kept = saved.exercises.find((e) => e.slot === "A1");
  assert.equal(kept.done_exercise, NEW);
  assert.deepEqual(kept.sets.map((x) => [x.weight_kg, x.reps]), [[12, 10]], "its sets untouched");
  assert.equal(validateDocument(model.doc()).ok ?? true, true);
  clearActive();
});

test("U-5 a week-1 workout in progress from a newer app: the week-1 screen skips the unknown exercise", () => {
  const doc = docWithNewIds();
  doc.sessions = doc.sessions.filter((x) => x.week !== 2);
  const s = workout("2026-11-18", "wed", 1, [rec("A1", NEW, NEW, []), rec("A2", "db_bench_press", "db_bench_press", [])], "in_progress");
  doc.sessions.push(s);
  fresh(doc);
  setActive({ session_id: s.id, phase: "weights", rest: null, hold: null });
  globalThis.location.hash = "#/workout";
  let out;
  assert.doesNotThrow(() => { out = renderWorkout(); });
  const text = textOf(out);
  assert.ok(text.includes("Dumbbell bench press"));
  assert.match(text, /Exercise 1 of 1/);
  clearActive();
});

test("U-6 the weekly summary counts the known exercises and skips the unknown one", async () => {
  const { weeklySummary } = await import("../app/js/engine/trend.js");
  const doc = docWithNewIds();
  let sum;
  assert.doesNotThrow(() => { sum = weeklySummary(doc, { startMonday: doc.block.start_monday, today: "2026-11-18" }); });
  assert.ok(sum, "a summary for last week");
});
