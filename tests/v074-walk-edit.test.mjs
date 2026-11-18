// Version 0.7.4 (worker 8.41), part A: the warm-up walk edited in Plan > Edit (Rosario: "the warmup walk cant be
// edited"; iPhone P5 part 2). Written BEFORE the change (tests first, a separate commit).
//
// Design (docs/ARCHITECTURE.md 4.2 plan_days, DECISIONS 2026-11-18 "0.7.4 walk edit"):
// - The edited walk lives in the day's existing plan_days record as an optional field
//   `walk: { speed_kmh, slope_pct, minutes }`, so it merges with the day as one unit (later updated_at wins), Reset
//   ("Back to the plan's day") removes it with the rest, and it saves only through the model calls.
// - The numbers are fixed for that day in every week until "Back to the plan's walk" (trainer item 1).
// - Limits come from the walk engine and the trainer: speed 2.0 to 5.0 km/h (D6 floor, D3 top), slope 0 to 12 %
//   (leg days 10 %, D3), minutes up to 30 (D2), steps 0.1 km/h, 1 %, 1 minute.
// - A workout keeps the walk it started with (`planned_walk` on the session), so a running workout never changes.
// - A record this app cannot use (a walk outside these limits, for example from a newer app) is kept and synced but
//   not used and never changed here (newerVersion), like a slot it does not know.
// - Old data without the field reads exactly as before; an older app (0.7.3, frozen copy in tests/fixtures/app-0.7.3)
//   keeps the field when it edits the day and is not broken by it.
// All values are made up. No body data.
import test from "node:test";
import assert from "node:assert/strict";
import { days, walkRules } from "../app/js/plan/plan-v2.js";
import { createStore } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { validateDocument } from "../app/js/validate.js";
import { mergeDocs } from "../app/js/sync/merge.js";
import { mergeDocs as mergeDocsOld } from "./fixtures/merge-0.3.1.mjs";
import { dayLayout, sessionWalk } from "../app/js/dayplan.js";
import { walkSuggestion } from "../app/js/engine/workout.js";
import { dayChanges } from "../app/js/planview.js";
import { validDoc, fakeStorage } from "./fixtures/profiles.mjs";
import { createModel as createOldModel } from "./fixtures/app-0.7.3/model.js";
import { validateDocument as validateOld } from "./fixtures/app-0.7.3/validate.js";
import * as oldPe from "./fixtures/app-0.7.3/engine/planedits.js";

// The new parts do not exist before the change: load softly so each test fails on its own.
const pe = await import("../app/js/engine/planedits.js");
const L = pe.WALK_LIMITS ?? {};

const T = "2026-01-26T09:00:00.000Z";
const copy = (v) => JSON.parse(JSON.stringify(v));
const planSlots = (day) => copy(days[day].slots).map(({ slot, ex, sets, rest }) => ({ slot, ex, sets, rest }));
const rec = (day, extra = {}) => ({ id: `p-plan-v2-${day}`, updated_at: T, plan_id: "plan-v2", day, slots: planSlots(day), ...extra });
const W = (speed_kmh, slope_pct, minutes) => ({ speed_kmh, slope_pct, minutes });

function setup(doc = validDoc(), start = "2026-01-26T08:00:00.000Z", make = createModel) {
  const storage = fakeStorage();
  const store = createStore(storage);
  let ms = Date.parse(start);
  const clock = () => new Date((ms += 1000));
  store.save(doc);
  return { storage, store, model: make(store, clock) };
}
const find = (doc, day) => (doc.plan_days ?? []).find((r) => r.id === `p-plan-v2-${day}`);

// 0.7.5 (worker 8.42): "0.7.4 or later", the same in both files; tests/v075-d18.test.mjs V0 pins 0.7.5.
test("V0 version: 0.7.4 or later in js/version.js, the same at the top of sw.js", async () => {
  const { readFileSync } = await import("node:fs");
  const { APP_VERSION } = await import("../app/js/version.js");
  const n = APP_VERSION.split(".").map(Number);
  assert.ok(n[0] > 0 || n[1] > 7 || (n[1] === 7 && n[2] >= 4), APP_VERSION);
  assert.equal(readFileSync(new URL("../app/sw.js", import.meta.url), "utf8").match(/const APP_VERSION = "([^"]+)"/)[1], APP_VERSION);
});

// ---------- 1. the limits (trainer D2, D3, D6, D7 steps) ----------

test("V1 the walk limits come from the walk engine and the trainer: 2-5 km/h, 0-12 % (leg days 10 %), up to 30 minutes", () => {
  assert.deepEqual(L.speed_kmh, [2, walkRules.maxSpeed_kmh]);
  assert.equal(walkRules.maxSpeed_kmh, 5, "trainer D3");
  assert.deepEqual(L.slope_pct, [0, walkRules.maxSlope_pct]);
  assert.equal(walkRules.maxSlope_pct, 12, "trainer D3");
  assert.equal(L.minutes[1], walkRules.minutes, "trainer D2: never longer than 30");
  assert.equal(walkRules.minutes, 30);
  assert.ok(Number.isInteger(L.minutes[0]) && L.minutes[0] >= 1 && L.minutes[0] < 30);
  assert.equal(L.speedStep_kmh, 0.1);
  assert.equal(L.slopeStep_pct, 1);
  assert.equal(L.minutesStep, 1);
  assert.deepEqual(pe.walkLimits("tue").slope_pct, [0, walkRules.maxSlope_pct - walkRules.legDaySlopeLess_pct], "leg day top 10 %");
  assert.deepEqual(pe.walkLimits("mon").slope_pct, [0, walkRules.maxSlope_pct]);
});

test("V2 checkWalk accepts numbers inside the limits and refuses everything else, in plain words", () => {
  const lo = L.minutes[0];
  for (const w of [W(2, 0, lo), W(5, 12, 30), W(4.3, 7, 25), W(3.9, 0, 30)]) assert.equal(pe.checkWalk(w, "mon").ok, true, JSON.stringify(w));
  assert.equal(pe.checkWalk(W(5, 10, 30), "tue").ok, true);
  const bad = [
    null, [], "fast", {}, W(5.1, 6, 30), W(1.9, 6, 30), W(4.25, 6, 30), W(4, 12.5, 30), W(4, -1, 30), W(4, 13, 30),
    W(4, 6, 31), W(4, 6, lo - 1), W(4, 6, 20.5), W(NaN, 6, 30), W(4, 6, Infinity), W("4", 6, 30), W(4, 6, null),
  ];
  for (const w of bad) {
    const r = pe.checkWalk(w, "mon");
    assert.equal(r.ok, false, JSON.stringify(w));
    assert.equal(typeof r.reason, "string");
  }
  assert.equal(pe.checkWalk(W(4, 11, 30), "tue").ok, false, "leg day: 10 % at most");
  assert.equal(pe.checkWalk(W(4.1, 6, 30), "mon").ok, true, "0.1 steps despite floating point (4.1)");
  assert.equal(pe.checkWalk(W(4.7, 6, 30), "mon").ok, true, "0.1 steps despite floating point (4.7)");
});

// ---------- 2. reading a day with a walk edit ----------

test("V3 effectiveDay gives the edited walk (a copy) and null without one; old records read exactly as before", () => {
  const plain = pe.effectiveDay("mon", null);
  assert.equal(plain.walk, null);
  const old = rec("mon", { slots: planSlots("mon").map((s) => (s.slot === "A1" ? { ...s, sets: 4 } : s)) });
  const e1 = pe.effectiveDay("mon", old);
  assert.equal(e1.edited, true);
  assert.equal(e1.walk, null, "a 0.7.3 record has no walk edit");
  const r = rec("mon", { walk: W(4.5, 8, 25) });
  const e2 = pe.effectiveDay("mon", r);
  assert.equal(e2.edited, true);
  assert.equal(e2.newerVersion, false);
  assert.deepEqual(e2.walk, W(4.5, 8, 25));
  e2.walk.speed_kmh = 9;
  assert.equal(r.walk.speed_kmh, 4.5, "a copy, never the saved object");
  assert.equal(pe.effectiveDay("mon", { ...r, deleted: true }).walk, null, "a tombstone has no walk edit");
});

test("V4 a walk this app cannot use makes the day 'newer version': the plan is shown and the record is never changed", () => {
  const r = rec("mon", { walk: W(5.5, 8, 25) });
  const e = pe.effectiveDay("mon", r);
  assert.equal(e.newerVersion, true);
  assert.equal(e.walk, null);
  assert.equal(pe.checkPlanDay(r, "mon").ok, false);
  const doc = validDoc();
  doc.plan_days = [r];
  const { model, store } = setup(doc);
  assert.throws(() => model.setPlanWalk("mon", W(4, 6, 30)), /newer app version/);
  assert.throws(() => model.swapPlanSlot("mon", "A1", "db_bench_press"), /newer app version/);
  assert.deepEqual(find(store.load(), "mon"), r, "kept exactly");
  // null / missing walk = no walk edit (not "newer").
  assert.equal(pe.checkPlanDay(rec("mon", { walk: null }), "mon").ok, true);
});

test("V5 the file check keeps a plan day with a walk (even one this app cannot use) and the sessions' planned_walk", () => {
  const doc = validDoc();
  doc.plan_days = [rec("mon", { walk: W(4.5, 8, 25) }), rec("tue", { walk: W(9, 40, 99) })];
  const v = validateDocument(doc);
  assert.equal(v.ok, true, v.error);
  assert.deepEqual(v.doc.plan_days[0].walk, W(4.5, 8, 25));
  assert.deepEqual(v.doc.plan_days[1].walk, W(9, 40, 99), "kept and synced, not used");
  const s = { id: "s-20260126-pw0001", updated_at: T, date: "2026-01-26", plan_day: "mon", week: 3, kind: "full", swapped_from: null, status: "in_progress", started_at: T, finished_at: null, walk: null, exercises: [], effort: null, note: "", planned_walk: W(4.5, 8, 25) };
  const v2 = validateDocument({ ...validDoc(), sessions: [s] });
  assert.equal(v2.ok, true, v2.error);
  assert.deepEqual(v2.doc.sessions[0].planned_walk, W(4.5, 8, 25));
  for (const bad of ["fast", [], W("4", 8, 25), W(4, 8, 1000), W(-1, 8, 25)]) {
    const v3 = validateDocument({ ...validDoc(), sessions: [{ ...s, planned_walk: bad }] });
    assert.equal(v3.ok, false, JSON.stringify(bad));
  }
  assert.equal(validateDocument({ ...validDoc(), sessions: [{ ...s, planned_walk: null }] }).ok, true);
});

// ---------- 3. saving (model calls only) ----------

test("V6 setPlanWalk saves the walk in the day's record, keeps the slots, adds a 'walk' change, and refuses bad numbers", () => {
  const { model, store } = setup();
  model.setPlanWalk("mon", W(4.5, 8, 25));
  const r = find(store.load(), "mon");
  assert.ok(r && r.deleted !== true);
  assert.deepEqual(r.walk, W(4.5, 8, 25));
  assert.deepEqual(r.slots, planSlots("mon"), "a walk-only edit keeps the plan's slots");
  assert.equal(r.changes.at(-1).what, "walk");
  assert.equal(model.effectivePlanDay("mon").edited, true);
  assert.deepEqual(model.effectivePlanDay("mon").walk, W(4.5, 8, 25));
  const before = JSON.stringify(store.load());
  for (const bad of [W(5.2, 8, 25), W(4, 13, 25), W(4, 8, 31), W(4.55, 8, 25), null]) assert.throws(() => model.setPlanWalk("mon", bad));
  assert.throws(() => model.setPlanWalk("tue", W(4, 11, 25)), "leg day top");
  assert.throws(() => model.setPlanWalk("sun", W(4, 8, 25)), /Unknown day/);
  assert.equal(JSON.stringify(store.load()), before, "nothing saved on a refusal");
});

test("V7 a slot edit keeps the walk; a walk edit keeps the slot edits; slots back to the plan keep the record while a walk is set", () => {
  const { model, store } = setup();
  model.setPlanWalk("tue", W(4.2, 6, 28));
  const other = days.tue.slots[0]; // A1 leg press
  model.swapPlanSlot("tue", other.slot, "goblet_squat");
  let r = find(store.load(), "tue");
  assert.deepEqual(r.walk, W(4.2, 6, 28), "swap keeps the walk");
  model.setPlanWalk("tue", W(4.4, 7, 30));
  r = find(store.load(), "tue");
  assert.notEqual(r.slots[0].ex, other.ex, "walk edit keeps the swap");
  model.savePlanDay("tue", planSlots("tue")); // Undo of the swap: slots equal the plan again
  r = find(store.load(), "tue");
  assert.notEqual(r.deleted, true, "still edited: the walk is set");
  assert.deepEqual(r.walk, W(4.4, 7, 30));
});

test("V8 resetPlanWalk removes only the walk; with plan slots the day goes back to the plan (tombstone)", () => {
  const { model, store } = setup();
  model.setPlanWalk("mon", W(4.5, 8, 25));
  model.addPlanSlot("mon", "cable_curl");
  model.resetPlanWalk("mon");
  let r = find(store.load(), "mon");
  assert.notEqual(r.deleted, true);
  assert.equal(r.walk, undefined);
  assert.equal(r.slots.at(-1).ex, "cable_curl");
  model.setPlanWalk("wed", W(4.1, 5, 20));
  model.resetPlanWalk("wed");
  r = find(store.load(), "wed");
  assert.equal(r.deleted, true, "nothing else was changed: back to the plan's day");
  assert.equal(model.effectivePlanDay("wed").walk, null);
});

test("V9 'Back to the plan's day' drops the walk edit too; its Undo brings the walk back; a later swap never revives an old walk", () => {
  const { model, store } = setup();
  model.setPlanWalk("thu", W(4.6, 9, 26));
  const before = model.effectivePlanDay("thu");
  const undo = { slots: copy(before.record.slots), walk: copy(before.walk) };
  model.resetPlanDay("thu");
  assert.equal(model.effectivePlanDay("thu").walk, null);
  model.savePlanDay("thu", undo.slots, null, undo.walk); // the Undo toast
  assert.deepEqual(model.effectivePlanDay("thu").walk, W(4.6, 9, 26));
  model.resetPlanDay("thu");
  model.swapPlanSlot("thu", "A1", "db_bench_press"); // incline dumbbell press -> dumbbell bench press
  assert.equal(model.effectivePlanDay("thu").walk, null, "the tombstone's old walk is not brought back by a new edit");
  assert.equal(find(store.load(), "thu").walk, undefined);
});

test("V10 savePlanDay without a walk argument keeps the saved walk; with null it removes it", () => {
  const { model } = setup();
  model.setPlanWalk("fri", W(4, 4, 30));
  model.savePlanDay("fri", planSlots("fri").map((s, i) => (i === 0 ? { ...s, sets: Math.max(1, s.sets - 1) } : s)));
  assert.deepEqual(model.effectivePlanDay("fri").walk, W(4, 4, 30));
  model.savePlanDay("fri", planSlots("fri"), null, null);
  assert.equal(model.effectivePlanDay("fri").walk, null);
});

// ---------- 4. Today and the Plan show the edited numbers; the engine ----------

test("V11 dayLayout (Today and the Plan day page) shows the edited walk in every week, the same numbers in both", () => {
  const doc = validDoc();
  doc.plan_days = [rec("mon", { walk: W(4.5, 8, 25) })];
  for (const week of [1, 3, 7, 12]) {
    const lay = dayLayout(doc, { planDay: "mon", week, today: "2026-01-26" });
    assert.equal(lay.walk.speed_kmh, 4.5);
    assert.equal(lay.walk.slope_pct, 8);
    assert.equal(lay.walk.minutes, 25);
    assert.equal(lay.walk.edited, true);
    assert.equal(lay.layout.find((b) => b.id === "walk").minutes, 25, "the day's minutes count the edited walk");
  }
  const plain = dayLayout(doc, { planDay: "tue", week: 3, today: "2026-01-26" });
  assert.notEqual(plain.walk.edited, true, "other days follow the walk rule");
  const asPlan = dayLayout(doc, { planDay: "mon", week: 3, today: "2026-01-26", walkEdit: null });
  assert.notEqual(asPlan.walk.edited, true, "walkEdit: null = the plan's walk, for the 'plan's walk' line");
});

test("V12 the walk rule no longer moves an edited day; the short day keeps its 15 minutes at most", () => {
  const doc = validDoc();
  doc.plan_days = [rec("mon", { walk: W(4.5, 8, 25) })];
  const ws = (date, speed, slope) => ({ id: `s-${date.replaceAll("-", "")}-ws0001`, updated_at: `${date}T10:00:00.000Z`, date, plan_day: "wed", week: 3, kind: "full", swapped_from: null, status: "finished", started_at: `${date}T08:00:00.000Z`, finished_at: `${date}T10:00:00.000Z`, note: "", exercises: [], walk: { speed_kmh: speed, slope_pct: slope, minutes: 30, effort: 3, breathless: false, leg_day: false } });
  doc.sessions = [ws("2026-01-21", 4, 5), ws("2026-01-23", 4, 5)];
  const mon = dayLayout(doc, { planDay: "mon", week: 3, today: "2026-01-26" }).walk;
  assert.deepEqual([mon.speed_kmh, mon.slope_pct, mon.minutes], [4.5, 8, 25]);
  const short = dayLayout(doc, { planDay: "mon", week: 3, today: "2026-01-26", kind: "short" }).walk;
  assert.equal(short.minutes, 15);
  doc.plan_days = [rec("mon", { walk: W(4.5, 8, 12) })];
  assert.equal(dayLayout(doc, { planDay: "mon", week: 3, today: "2026-01-26", kind: "short" }).walk.minutes, 12, "the smaller of the edit and 15");
});

test("V13 back from a break the break rule still lowers an edited walk (2 % less steep; over 4 weeks the starting walk if lower)", () => {
  const doc = validDoc();
  const edit = W(4.8, 9, 28);
  const two = walkSuggestion(doc, { week: 5, legDay: false, missed: { kind: "minus_10" }, edit });
  assert.deepEqual([two.speed_kmh, two.slope_pct, two.minutes], [4.8, 7, 28]);
  const long = walkSuggestion(doc, { week: 5, legDay: false, missed: { kind: "minus_20" }, edit });
  assert.ok(long.speed_kmh <= 4.8 && long.slope_pct <= 9, JSON.stringify(long));
  assert.equal(long.speed_kmh, Math.min(4.8, walkRules.start.no.speed_kmh));
  assert.equal(long.slope_pct, Math.min(9, walkRules.start.no.slope_pct));
  const low = walkSuggestion(doc, { week: 5, legDay: false, missed: { kind: "minus_20" }, edit: W(3, 0, 20) });
  assert.deepEqual([low.speed_kmh, low.slope_pct], [3, 0], "never raised by the break rule");
  const none = walkSuggestion(doc, { week: 5, legDay: false, missed: null, edit: null });
  const same = walkSuggestion(doc, { week: 5, legDay: false, missed: null });
  assert.deepEqual(none, same, "no edit: exactly as before");
});

test("V14 the 'Changed by you' list names the walk change", () => {
  const list = dayChanges("mon", rec("mon", { walk: W(4.5, 8, 25) }));
  const w = list.find((c) => c.what === "walk");
  assert.ok(w, JSON.stringify(list));
  assert.match(w.text, /4\.5 km\/h/);
  assert.match(w.text, /8 % slope/);
  assert.match(w.text, /25 min/);
});

// ---------- 5. a running workout never changes ----------

test("V15 a workout stores the walk it started with; a walk edit made later never changes it", () => {
  const { model, store } = setup();
  model.setPlanWalk("mon", W(4.5, 8, 25));
  const s = model.startSession({ planDay: "mon", week: 3, kind: "full" });
  assert.deepEqual(s.planned_walk, W(4.5, 8, 25));
  model.setPlanWalk("mon", W(3.5, 2, 15));
  const doc = store.load();
  const run = doc.sessions.find((x) => x.id === s.id);
  const w = sessionWalk(doc, run);
  assert.deepEqual([w.speed_kmh, w.slope_pct, w.minutes], [4.5, 8, 25]);
  // A workout started without a walk edit never picks up one made later.
  const { model: m2, store: st2 } = setup();
  const s2 = m2.startSession({ planDay: "mon", week: 3, kind: "full" });
  assert.equal(s2.planned_walk, undefined);
  const plain = sessionWalk(st2.load(), s2);
  m2.setPlanWalk("mon", W(3.5, 2, 15));
  const d2 = st2.load();
  assert.deepEqual(sessionWalk(d2, d2.sessions.find((x) => x.id === s2.id)), plain);
});

test("V16 the workout screen reads the walk through the session (flow.js buildCtx uses the planned walk)", async () => {
  const { readFileSync } = await import("node:fs");
  const flow = readFileSync(new URL("../app/js/ui/flow.js", import.meta.url), "utf8");
  assert.match(flow, /plannedWalk\(session\)/, "buildCtx passes the session's own walk");
  assert.equal(pe.plannedWalk({ planned_walk: W(4.5, 8, 25) }).speed_kmh, 4.5);
  assert.equal(pe.plannedWalk({}), null);
  assert.equal(pe.plannedWalk({ planned_walk: "x" }), null);
  assert.equal(pe.plannedWalk({ planned_walk: W(4, 8, 0) }), null, "a walk needs at least a minute");
});

// ---------- 6. sync: merge and older apps ----------

test("V17 merge: the day with the newer updated_at wins as one unit, walk included; the old merge keeps the field", () => {
  const a = { ...validDoc(), plan_days: [rec("mon", { updated_at: "2026-01-26T09:00:00.000Z", walk: W(4.5, 8, 25) })] };
  const b = { ...validDoc(), plan_days: [rec("mon", { updated_at: "2026-01-26T10:00:00.000Z", walk: W(4, 6, 30) })] };
  assert.deepEqual(mergeDocs(a, b).plan_days[0].walk, W(4, 6, 30));
  assert.deepEqual(mergeDocs(b, a).plan_days[0].walk, W(4, 6, 30));
  const c = { ...validDoc(), plan_days: [rec("mon", { updated_at: "2026-01-26T11:00:00.000Z" })] };
  assert.equal(mergeDocs(a, c).plan_days[0].walk, undefined, "a newer slot-only record wins whole");
  assert.deepEqual(mergeDocsOld(a, validDoc()).plan_days[0].walk, W(4.5, 8, 25), "unknown fields kept by an old merge");
});

test("V18 an older app (0.7.3) reads a 0.7.4 file with walk edits and planned_walk, and its edits keep the walk", () => {
  const doc = validDoc();
  doc.plan_days = [rec("mon", { walk: W(4.5, 8, 25) })];
  doc.sessions = [{ id: "s-20260126-pw0002", updated_at: T, date: "2026-01-26", plan_day: "mon", week: 3, kind: "full", swapped_from: null, status: "in_progress", started_at: T, finished_at: null, walk: null, exercises: [{ slot: "A1", plan_exercise: "chest_press", done_exercise: "chest_press", swap_reason: null, sets: [], note: "" }], effort: null, note: "", planned_walk: W(4.5, 8, 25) }];
  const v = validateOld(doc);
  assert.equal(v.ok, true, v.error);
  const eff = oldPe.effectiveDay("mon", doc.plan_days[0]);
  assert.equal(eff.newerVersion, false, "0.7.3 can still use the day (same slots)");
  const { model, store } = setup(copy(doc), "2026-01-26T08:00:00.000Z", createOldModel);
  model.addPlanSlot("mon", "cable_curl");
  assert.deepEqual(find(store.load(), "mon").walk, W(4.5, 8, 25), "0.7.3 keeps the walk when it edits the day");
  model.resetPlanDay("mon");
  const r = find(store.load(), "mon");
  assert.equal(r.deleted, true);
  assert.equal(pe.effectiveDay("mon", r).walk, null, "after 0.7.3's reset the new app shows the plan's walk");
  model.logSet("s-20260126-pw0002", "A1", { type: "work", weight_kg: 10, reps: 10 });
  assert.deepEqual(store.load().sessions[0].planned_walk, W(4.5, 8, 25), "0.7.3 keeps planned_walk on the session");
});

test("V19 a backup and restore keep the walk edit (it is in the synced document)", async () => {
  const { makeBackup } = await import("../app/js/backup.js");
  const { model, store } = setup();
  model.setPlanWalk("mon", W(4.5, 8, 25));
  const back = JSON.parse(makeBackup(store).text);
  assert.deepEqual(back.plan_days[0].walk, W(4.5, 8, 25));
  const v = validateDocument(back);
  assert.equal(v.ok, true, v.error);
  assert.deepEqual(v.doc.plan_days[0].walk, W(4.5, 8, 25), "restore reads it back");
});

// ---------- 7. the screens (static checks; the look is checked in the browser at 375 x 812) ----------

test("V20 Plan > Edit shows the walk card with Change; the walk sheet saves only through the model calls", async () => {
  const { readFileSync } = await import("node:fs");
  const src = (p) => readFileSync(new URL(`../app/js/${p}`, import.meta.url), "utf8").replaceAll("\r\n", "\n");
  const pe2 = src("ui/planedit.js");
  const pd = src("ui/planday.js");
  assert.match(pe2, /export function openWalkSheet\(/);
  assert.match(pe2, /model\.setPlanWalk\(/);
  assert.match(pe2, /model\.resetPlanWalk\(/);
  assert.match(pe2, /walkLimits\(day\)/, "the steppers take their limits from the engine");
  assert.doesNotMatch(pe2, /plan_days/, "no direct writes to the saved list");
  assert.match(pd, /openWalkSheet\(day, week\)/);
  assert.doesNotMatch(pd, /edit \? null : walkCard/, "the walk card stays in Edit mode");
  assert.match(pd, /walkEditCard\(walkCard\(lay\.walk, day\), day, week\)/);
  const code = (t) => t.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  for (const t of [code(pe2), code(pd)]) {
    assert.doesNotMatch(t, /innerHTML|outerHTML|insertAdjacentHTML/);
    assert.doesNotMatch(t, /style\s*=|\bstyle:\s*/);
  }
});

// ---------- 6. Trainer decision D16 (docs/plan/2026-11-18-trainer-weekly-plan.md, worker 8.37): the seven tests ----------
const OWN = "Your own walk. The walk rule does not change this day.";
const HINT = "Under 30 minutes a day means under 150 minutes of walking a week.";
const easyWalk = (date, plan_day, speed, slope) => ({ id: `s-${date.replaceAll("-", "")}-ew0001`, updated_at: `${date}T10:00:00.000Z`, date, plan_day, week: 3, kind: "full", swapped_from: null, status: "finished", started_at: `${date}T08:00:00.000Z`, finished_at: `${date}T10:00:00.000Z`, note: "", exercises: [], walk: { speed_kmh: speed, slope_pct: slope, minutes: 30, effort: 3, breathless: false, leg_day: false } });

test("V21 D16-1 an edited Wednesday walk is used every week until Reset, even after easy walks; Monday still follows the walk rule", () => {
  const doc = validDoc();
  doc.sessions = [easyWalk("2026-01-19", "mon", 4, 5), easyWalk("2026-01-21", "wed", 4, 5), easyWalk("2026-01-23", "fri", 4, 5)];
  const plain = copy(doc);
  doc.plan_days = [rec("wed", { walk: W(4.6, 7, 25) })];
  for (const week of [2, 3, 5, 9]) {
    const wed = dayLayout(doc, { planDay: "wed", week, today: "2026-01-26" }).walk;
    assert.deepEqual([wed.speed_kmh, wed.slope_pct, wed.minutes], [4.6, 7, 25], `week ${week}`);
    const mon = dayLayout(doc, { planDay: "mon", week, today: "2026-01-26" }).walk;
    assert.deepEqual(mon, dayLayout(plain, { planDay: "mon", week, today: "2026-01-26" }).walk, "Monday: the walk rule, as with no edit");
  }
});

test("V22 D16-2 limits: speed 2.0-5.0 by 0.1; slope 0-12 (Tuesday and Friday 0-10) by 1; minutes 10-30 by 1; anything else refused", () => {
  for (const ok of [W(2, 0, 10), W(5, 12, 30), W(3.7, 6, 17)]) assert.equal(pe.checkWalk(ok, "mon").ok, true, JSON.stringify(ok));
  assert.equal(pe.checkWalk(W(4, 10, 20), "tue").ok, true);
  assert.equal(pe.checkWalk(W(4, 10, 20), "fri").ok, true);
  for (const [w, d] of [[W(1.9, 5, 20), "mon"], [W(5.1, 5, 20), "mon"], [W(4.05, 5, 20), "mon"], [W(4, -1, 20), "mon"], [W(4, 13, 20), "mon"],
    [W(4, 5.5, 20), "mon"], [W(4, 11, 20), "tue"], [W(4, 11, 20), "fri"], [W(4, 5, 9), "mon"], [W(4, 5, 31), "mon"], [W(4, 5, 20.5), "mon"]]) {
    assert.equal(pe.checkWalk(w, d).ok, false, `${JSON.stringify(w)} ${d}`);
  }
});

test("V23 D16-3 on an edited day the small change before the walk still works and never goes above 5 km/h or 12 % (leg days 10 %)", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../app/js/ui/walk.js", import.meta.url), "utf8");
  assert.match(src, /export function adjustRange\(w, legDay\)/);
  // adjustRange is pure; rebuild it from the source with walkRules, without the screen's imports.
  const body = src.slice(src.indexOf("export function adjustRange"), src.indexOf("// Today's walk settings"));
  const adjustRange = new Function("walkRules", "round1", `${body.replace("export ", "")}; return adjustRange;`)(walkRules, (n) => Math.round(n * 10) / 10);
  const doc = validDoc();
  const top = walkSuggestion(doc, { week: 3, legDay: false, missed: null, edit: W(5, 12, 30) });
  assert.deepEqual(adjustRange(top, false), { speed: [4.5, 5], slope: [10, 12] });
  const leg = walkSuggestion(doc, { week: 3, legDay: true, missed: null, edit: W(5, 10, 30) });
  assert.deepEqual(adjustRange(leg, true), { speed: [4.5, 5], slope: [8, 10] });
  const mid = walkSuggestion(doc, { week: 3, legDay: false, missed: null, edit: W(4.6, 7, 25) });
  assert.deepEqual(adjustRange(mid, false), { speed: [4.1, 5], slope: [5, 9] }, "the change still works on an edited day");
});

test("V24 D16-4 short day: an edit of 25 minutes gives 15; an edit of 12 gives 12", () => {
  const doc = validDoc();
  assert.equal(walkSuggestion(doc, { week: 3, legDay: false, missed: null, kind: "short", edit: W(4.6, 7, 25) }).minutes, 15);
  assert.equal(walkSuggestion(doc, { week: 3, legDay: false, missed: null, kind: "short", edit: W(4.6, 7, 12) }).minutes, 12);
});

test("V25 D16-5 break of 3 weeks: the slope is 2 % lower (never below 0); over 4 weeks each number is the lower of the edit and the start", () => {
  const doc = validDoc(); // made-up profile: walk fit "no", start 4.0 km/h, 2 %, 20 minutes
  const b3 = (edit) => walkSuggestion(doc, { week: 5, legDay: false, missed: { kind: "minus_10" }, edit });
  const a = b3(W(4.6, 7, 25));
  assert.deepEqual([a.speed_kmh, a.slope_pct, a.minutes], [4.6, 5, 25]);
  assert.equal(b3(W(4.6, 1, 25)).slope_pct, 0);
  const startMin = walkRules.start.no.startMinutes;
  const b5 = walkSuggestion(doc, { week: 5, legDay: false, missed: { kind: "minus_20" }, edit: W(4.6, 7, 25) });
  assert.deepEqual([b5.speed_kmh, b5.slope_pct, b5.minutes], [Math.min(4.6, walkRules.start.no.speed_kmh), Math.min(7, walkRules.start.no.slope_pct), Math.min(25, startMin)]);
  const low = walkSuggestion(doc, { week: 5, legDay: false, missed: { kind: "minus_20" }, edit: W(3, 1, 12) });
  assert.deepEqual([low.speed_kmh, low.slope_pct, low.minutes], [3, 1, 12], "the lower number, never raised");
  const after = walkSuggestion(doc, { week: 6, legDay: false, missed: null, edit: W(4.6, 7, 25) });
  assert.deepEqual([after.speed_kmh, after.slope_pct, after.minutes], [4.6, 7, 25], "after the break week the edit applies again");
});

test("V26 D16-6 Reset: the day follows the walk rule again, from its last saved walk", () => {
  const doc = validDoc();
  doc.sessions = [easyWalk("2026-01-21", "wed", 4.3, 6), easyWalk("2026-01-23", "fri", 4.3, 6)];
  const plain = copy(doc);
  const { model, store } = setup(doc);
  model.setPlanWalk("wed", W(4.6, 7, 25));
  model.resetPlanWalk("wed");
  const now = dayLayout(store.load(), { planDay: "wed", week: 3, today: "2026-01-26" }).walk;
  assert.notEqual(now.edited, true);
  assert.deepEqual(now, dayLayout(plain, { planDay: "wed", week: 3, today: "2026-01-26" }).walk);
});

test("V27 D16-7 the 'own walk' line on an edited day; the hint under 30 minutes, and only then", async () => {
  const doc = validDoc();
  const ed = walkSuggestion(doc, { week: 3, legDay: false, missed: null, edit: W(4.6, 7, 25) });
  assert.ok(ed.note.includes(OWN), ed.note);
  const br = walkSuggestion(doc, { week: 3, legDay: false, missed: { kind: "minus_10" }, edit: W(4.6, 7, 25) });
  assert.ok(br.note.includes(OWN) && br.note.includes("break"), br.note);
  const plain = walkSuggestion(doc, { week: 3, legDay: false, missed: null });
  assert.ok(!plain.note.includes(OWN), "a day with no edit has no such line");
  assert.equal(pe.walkHint(29), HINT);
  assert.equal(pe.walkHint(10), HINT);
  assert.equal(pe.walkHint(30), null);
  const { readFileSync } = await import("node:fs");
  const src = (p) => readFileSync(new URL(`../app/js/${p}`, import.meta.url), "utf8");
  assert.match(src("ui/planday.js"), /OWN_WALK_LINE/, "Plan > Edit shows the line on an edited day");
  assert.match(src("ui/planedit.js"), /walkHint\(/, "the walk sheet shows the hint under the minutes");
  assert.match(src("ui/walk.js"), /w\.note/, "the walk screen shows the note, which carries the line");
});

// ---------- 7. Reviewer findings (checker and auditor, 2026-11-18) ----------

test("V28 unknown fields (a newer app's) survive setPlanWalk, resetPlanWalk, savePlanDay with a walk, and the Undo of a reset", () => {
  const doc = validDoc();
  doc.plan_days = [rec("mon", { future_note: "kept" })];
  const { model, store } = setup(doc);
  model.setPlanWalk("mon", W(4.5, 8, 25));
  assert.equal(find(store.load(), "mon").future_note, "kept", "setPlanWalk");
  model.addPlanSlot("mon", "cable_curl");
  model.resetPlanWalk("mon");
  assert.equal(find(store.load(), "mon").future_note, "kept", "resetPlanWalk with other edits left");
  model.savePlanDay("mon", find(store.load(), "mon").slots, null, W(4, 5, 20));
  assert.equal(find(store.load(), "mon").future_note, "kept", "savePlanDay with a walk");
  const undo = { slots: copy(find(store.load(), "mon").slots), walk: W(4, 5, 20) };
  model.resetPlanDay("mon");
  model.savePlanDay("mon", undo.slots, null, undo.walk);
  assert.equal(find(store.load(), "mon").future_note, "kept", "Undo of 'Back to the plan's day'");
});

test("V29 a reset walk never comes back when an older app (0.7.3) edits the day after the reset", () => {
  for (const reset of ["resetPlanDay", "resetPlanWalk"]) {
    const { model, store } = setup();
    model.setPlanWalk("mon", W(4, 5, 20));
    model[reset]("mon");
    assert.equal(find(store.load(), "mon").walk, undefined, `${reset}: the tombstone holds no walk`);
    const old = createOldModel(store, () => new Date("2026-01-26T09:00:00.000Z"));
    old.addPlanSlot("mon", "cable_curl");
    assert.equal(pe.effectiveDay("mon", find(store.load(), "mon")).walk, null, `${reset}: 0.7.3's edit does not bring the walk back`);
  }
  const doc = validDoc();
  doc.plan_days = [{ ...rec("mon"), walk: { speed_kmh: 9, slope_pct: 1, minutes: 20 } }]; // a newer app's walk (other limits)
  const { model, store } = setup(doc);
  model.resetPlanDay("mon");
  assert.deepEqual(find(store.load(), "mon").walk, { speed_kmh: 9, slope_pct: 1, minutes: 20 }, "a walk this app cannot use is kept");
});

test("V30 'Back to the plan's day' Undo passes the day's walk back; the walk sheet starts from the plan without the break lowering", async () => {
  const { readFileSync } = await import("node:fs");
  const pe2 = readFileSync(new URL("../app/js/ui/planedit.js", import.meta.url), "utf8");
  const at = pe2.indexOf("export function openBackToPlan");
  const back = pe2.slice(at, pe2.indexOf("openSheet(", at));
  assert.match(back, /model\.savePlanDay\(day, before, null, beforeWalk\)/, "the Undo brings the walk back");
  // Break week: Today's walk is lowered; the sheet's starting numbers and "the plan's walk" line are not.
  const { planWalkForEdit } = await import("../app/js/dayplan.js");
  const doc = validDoc();
  doc.sessions = [easyWalk("2026-01-02", "fri", 4.4, 8)];
  const today = "2026-01-26"; // more than 2 weeks after the last workout
  const lowered = dayLayout(doc, { planDay: "mon", week: 3, today, walkEdit: null }).walk;
  const start = planWalkForEdit(doc, "mon", 3);
  assert.ok(start.slope_pct > lowered.slope_pct, `${start.slope_pct} > ${lowered.slope_pct}`);
  assert.deepEqual(start, walkSuggestion(doc, { week: 3, legDay: days.mon.leg, missed: null, kind: "full" }));
  assert.match(pe2, /planWalkForEdit\(/);
  assert.match(pe2, /touched/, "Save with nothing touched writes nothing");
});
