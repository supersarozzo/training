// Wave 1 fixes (worker 8.34, 2026-11-18), after the wave 1 checker and auditor:
//  1. A running workout is rebuilt from its own records (planForSession), never from today's plan: ui/flow.js buildCtx.
//     A new workout reads the saved Plan edit of its day: ui/flow.js startWorkout no longer passes the plan's slots.
//  2. Answer 83 a: a move you have never done starts like week 1: at most 2 work sets in its first workout.
//  3. A workout started on the app before the plan change of 2026-11-18 (no planned_sets) keeps that day's old sets
//     and rest (Monday, Wednesday, Thursday: Abs1 3 sets, Abs2 dead bug 2 x 30 s or cable crunch 3 x 45 s).
//  4. Test gaps the checker and auditor found: a lone pair exercise takes the plan's pair rest (Friday C1, 60 s);
//     savePlanDay (Undo) never overwrites a record from a newer app.
// All values are made up. No body data.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as schedule from "../app/js/engine/schedule.js";
import * as workout from "../app/js/engine/workout.js";
import { days } from "../app/js/plan/plan-v2.js";
import { createStore } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { validateDocument } from "../app/js/validate.js";
import { buildCtx, nextText } from "../app/js/ui/flow.js";
import { validDoc, fakeStorage } from "./fixtures/profiles.mjs";

const T = "2026-03-02T09:00:00.000Z";
const copy = (v) => JSON.parse(JSON.stringify(v));
const planSlots = (day) => copy(days[day].slots).map(({ slot, ex, sets, rest }) => ({ slot, ex, sets, rest }));

function setup(doc = validDoc()) {
  const store = createStore(fakeStorage());
  let ms = Date.parse(T);
  store.save(doc);
  return { store, model: createModel(store, () => new Date((ms += 1000))) };
}

const work = (n, kg = 10, date = "2026-01-26") => ({ n, type: "work", weight_kg: kg, reps: 10, seconds: null, rir: null, done_at: `${date}T09:00:00.000Z` });
const rec = (slot, id, sets) => ({ slot, plan_exercise: id, done_exercise: id, swap_reason: null, sets, note: "" });

// A workout started on the old app (before 2026-11-18): Abs2, no D, no planned_sets.
function oldSession(day, status = "in_progress") {
  const three = [work(1), work(2), work(3)];
  const abs2 = { mon: "dead_bug", wed: "dead_bug", thu: "cable_crunch" }[day];
  const pairs = { mon: ["chest_press", "pulldown", "shoulder_press_machine", "one_arm_db_row", "db_curl", "triceps_pushdown"],
    wed: ["goblet_squat", "db_bench_press", "pulldown", "lateral_raise", "hammer_curl", "overhead_triceps_ext"],
    thu: ["incline_db_press", "seated_cable_row", "seated_db_shoulder_press", "face_pull", "lateral_raise", "triceps_pushdown"] }[day];
  const names = ["A1", "A2", "B1", "B2", "C1", "C2"];
  return {
    id: `s-20260126-old${day}`, updated_at: "2026-01-26T09:30:00.000Z", date: "2026-01-26", plan_day: day, week: 3, kind: "full",
    swapped_from: null, status, started_at: "2026-01-26T08:00:00.000Z", finished_at: status === "finished" ? "2026-01-26T09:30:00.000Z" : null, walk: null,
    exercises: [
      ...pairs.map((id, i) => rec(names[i], id, three)),
      rec("Abs1", day === "wed" ? "side_plank" : "plank", [work(1, 0), work(2, 0)]), // 2 of 3 sets done
      rec("Abs2", abs2, []),
    ],
    effort: null, note: "",
  };
}

// ---------- 1. ui/flow.js ----------

test("W1 buildCtx rebuilds a running workout from its own records, not from today's plan", () => {
  for (const day of ["mon", "wed", "thu"]) {
    const doc = { ...validDoc(), sessions: [oldSession(day)] };
    const session = doc.sessions[0];
    const ctx = buildCtx(doc, session, { phase: "pair" });
    assert.deepEqual(ctx.plan.slots.map((s) => s.slot), session.exercises.map((e) => e.slot), `${day}: the workout's own places`);
    for (const entry of ctx.seq) assert.ok(workout.slotRecord(session, entry.slot), `${day}: ${entry.slot} has a record`);
    const pos = ctx.position();
    assert.equal(pos.entry.slot, "Abs1", `${day}: the third Abs1 set is next`);
    assert.doesNotThrow(() => nextText(ctx, pos.entry));
  }
});

test("W2 buildCtx: a workout started after a Plan edit keeps its own exercises when the edit changes later", () => {
  const p = setup();
  p.model.addPlanSlot("tue", "cable_curl");
  const s = p.model.startSession({ planDay: "tue", week: 3, kind: "full" });
  p.model.removePlanSlot("tue", "E1");
  p.model.swapPlanSlot("tue", "A1", "goblet_squat");
  const doc = p.store.load();
  const ctx = buildCtx(doc, doc.sessions.find((x) => x.id === s.id), { phase: "pair" });
  assert.deepEqual(ctx.plan.slots.map((x) => [x.slot, x.ex]), s.exercises.map((e) => [e.slot, e.plan_exercise]));
  assert.ok(ctx.plan.slots.some((x) => x.slot === "E1" && x.ex === "cable_curl"));
  assert.equal(ctx.plan.slots.find((x) => x.slot === "A1").ex, days.tue.slots[0].ex);
});

test("W3 startWorkout lets the model read the saved Plan edit (it does not pass the plan's own slots)", () => {
  const src = readFileSync(new URL("../app/js/ui/flow.js", import.meta.url), "utf8");
  const start = src.slice(src.indexOf("export function startWorkout"), src.indexOf("export function leaveWorkout"));
  assert.ok(start.includes("model.startSession("), "startWorkout starts a session");
  assert.equal(/slots\s*:/.test(start), false, "no slots passed: startSession reads the edited day");
  const ctxSrc = src.slice(src.indexOf("export function buildCtx"), src.indexOf("export function setPhase"));
  assert.ok(ctxSrc.includes("planForSession(session)"), "buildCtx uses planForSession");
  assert.equal(ctxSrc.includes("planForDay("), false);
});

// ---------- 2. answer 83 a: a move never done starts like week 1 ----------

function finishedMonday(exIds, date = "2026-01-19", week = 2) {
  return {
    id: `s-${date.replaceAll("-", "")}-done01`, updated_at: `${date}T09:30:00.000Z`, date, plan_day: "mon", week, kind: "full",
    swapped_from: null, status: "finished", started_at: `${date}T08:00:00.000Z`, finished_at: `${date}T09:30:00.000Z`, walk: null,
    exercises: exIds.map((id, i) => rec(`X${i}`, id, [work(1, 10, date), work(2, 10, date)])),
    effort: 5, note: "",
  };
}

test("W4 a new move (no finished sets of it before) gets at most 2 work sets in its first workout after week 1", () => {
  const known = days.mon.slots.filter((s) => s.slot !== "D").map((s) => s.ex);
  const p = setup({ ...validDoc(), sessions: [finishedMonday(known)] });
  const s = p.model.startSession({ planDay: "mon", week: 4, kind: "full" });
  const d = s.exercises.find((e) => e.slot === "D");
  assert.equal(d.plan_exercise, "calf_raise_leg_press");
  assert.equal(d.planned_sets, 2, "the new calf raise starts with 2 sets");
  assert.equal(s.exercises.find((e) => e.slot === "A1").planned_sets, 3, "a known move keeps the week's sets");
  assert.equal(s.exercises.find((e) => e.slot === "Abs1").planned_sets, 2, "plank: 2 sets by the plan");
  const doc = p.store.load();
  const ctx = buildCtx(doc, doc.sessions.find((x) => x.id === s.id), { phase: "pair" });
  assert.equal(ctx.seq.filter((e) => e.slot === "D").length, 2);
  assert.equal(validateDocument(doc).ok, true);
});

test("W5 once the move has been done, the week's sets apply; week 1 and the short day are unchanged", () => {
  const all = days.mon.slots.map((s) => s.ex);
  const p = setup({ ...validDoc(), sessions: [finishedMonday(all)] });
  const s = p.model.startSession({ planDay: "mon", week: 4, kind: "full" });
  assert.equal(s.exercises.find((e) => e.slot === "D").planned_sets, 3);
  p.model.abandonSession(s.id);
  const q = setup();
  const w1 = q.model.startSession({ planDay: "mon", week: 1, kind: "full" });
  assert.ok(w1.exercises.every((e) => e.planned_sets <= 2));
  const r = setup();
  const short = r.model.startSession({ planDay: "thu", week: 4, kind: "short" });
  assert.equal(short.exercises.some((e) => e.slot === "D"), false, "the short day still skips D");
});

test("W6 an added exercise never done also starts with 2 sets; a swapped-in plan exercise too", () => {
  const known = days.tue.slots.map((s) => s.ex);
  const p = setup({ ...validDoc(), sessions: [{ ...finishedMonday(known), plan_day: "tue" }] });
  p.model.addPlanSlot("tue", "cable_curl");
  p.model.swapPlanSlot("tue", "B2", "rear_delt_raise");
  const s = p.model.startSession({ planDay: "tue", week: 3, kind: "full" });
  assert.equal(s.exercises.find((e) => e.slot === "E1").planned_sets, 2);
  assert.equal(s.exercises.find((e) => e.slot === "B2").planned_sets, 2);
  assert.equal(s.exercises.find((e) => e.slot === "A1").planned_sets, 3);
});

// ---------- 3. a workout started on the old app keeps the old day's sets and rest ----------

test("W7 a workout started before the plan change keeps that day's old abs sets and rest", () => {
  const thu = schedule.planForSession(oldSession("thu"));
  assert.deepEqual(thu.slots.filter((s) => s.slot.startsWith("Abs")).map((s) => [s.slot, s.ex, s.sets, s.rest]),
    [["Abs1", "plank", 3, 30], ["Abs2", "cable_crunch", 3, 45]]);
  const mon = schedule.planForSession(oldSession("mon"));
  assert.deepEqual(mon.slots.filter((s) => s.slot.startsWith("Abs")).map((s) => [s.slot, s.ex, s.sets, s.rest]),
    [["Abs1", "plank", 3, 30], ["Abs2", "dead_bug", 2, 30]]);
  const wed = schedule.planForSession(oldSession("wed"));
  assert.deepEqual(wed.slots.filter((s) => s.slot.startsWith("Abs")).map((s) => [s.slot, s.sets, s.rest]), [["Abs1", 3, 30], ["Abs2", 2, 30]]);
  // the week rules still apply to the old numbers (week 1: at most 2; weeks 6 and 12: one less)
  const w6 = schedule.planForSession({ ...oldSession("thu"), week: 6 });
  assert.deepEqual(w6.slots.filter((s) => s.slot.startsWith("Abs")).map((s) => s.sets), [2, 2]);
  // pairs were not changed by the plan change: same as today's plan
  assert.deepEqual(thu.slots.slice(0, 6).map((s) => [s.slot, s.sets, s.rest]), schedule.daySlots("thu", 3).slice(0, 6).map((s) => [s.slot, s.sets, s.rest]));
});

test("W8 a workout started on this app (planned_sets saved) is never read with the old numbers", () => {
  const p = setup();
  const s = p.model.startSession({ planDay: "thu", week: 3, kind: "full" });
  const plan = schedule.planForSession(p.store.load().sessions.find((x) => x.id === s.id));
  assert.equal(plan.slots.find((x) => x.slot === "Abs1").sets, s.exercises.find((e) => e.slot === "Abs1").planned_sets);
  assert.equal(plan.slots.some((x) => x.slot === "Abs2"), false);
});

// ---------- 4. test gaps ----------

test("W9 a pair exercise left alone takes the rest the plan gives that pair (Friday C1: 60 s, B1: 75 s)", () => {
  const p = setup();
  p.model.removePlanSlot("fri", "C2");
  p.model.removePlanSlot("fri", "B2");
  const slots = schedule.daySlots("fri", 3, p.model.effectivePlanDay("fri").record);
  assert.equal(slots.find((s) => s.slot === "C1").rest, days.fri.slots.find((s) => s.slot === "C2").rest);
  assert.equal(slots.find((s) => s.slot === "C1").rest, 60);
  assert.equal(slots.find((s) => s.slot === "B1").rest, 75);
});

test("W10 savePlanDay (Undo) and every edit refuse to overwrite a record from a newer app; reset keeps its fields", () => {
  const newer = { id: "p-plan-v2-tue", updated_at: T, plan_id: "plan-v2", day: "tue", colour: "newer", slots: [{ slot: "A1", ex: "zercher_squat", sets: 3, rest: null }] };
  const p = setup({ ...validDoc(), plan_days: [newer] });
  const before = JSON.stringify(p.store.load());
  assert.throws(() => p.model.savePlanDay("tue", planSlots("tue").map((s) => (s.slot === "A1" ? { ...s, ex: "goblet_squat" } : s))));
  assert.throws(() => p.model.savePlanDay("tue", planSlots("tue")), "not even back to the plan's own day");
  assert.equal(JSON.stringify(p.store.load()), before, "nothing saved");
  p.model.resetPlanDay("tue");
  const r = p.store.load().plan_days[0];
  assert.equal(r.deleted, true);
  assert.equal(r.colour, "newer");
  assert.deepEqual(r.slots, newer.slots);
});

test("W11 a planned move swapped during a finished workout counts as done: the next week gets the week's sets", () => {
  const known = days.mon.slots.map((s) => s.ex);
  const past = finishedMonday(known);
  const d = past.exercises.find((e) => e.plan_exercise === "calf_raise_leg_press");
  d.done_exercise = "calf_raise_machine"; // swapped at the gym, finished with the machine
  d.swap_reason = "busy";
  const p = setup({ ...validDoc(), sessions: [past] });
  const s = p.model.startSession({ planDay: "mon", week: 4, kind: "full" });
  assert.equal(s.exercises.find((e) => e.slot === "D").planned_sets, 3);
});
