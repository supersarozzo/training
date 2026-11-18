// Saved Plan edits: data and engine (build step 3, redesign/plan-diet/judge/JUDGING.md section 7 step 3).
// Design: docs/research/2026-11-17-plan-diet-research.md section 9.1; Rosario's answers 65 ("forever" for that day),
// 72 a (added exercises: E1, E2 at the end, on their own, 3 sets, 60 s, at most 2 a day), 73 a (back to the plan's day).
//
// One record per edited plan day in the synced list `plan_days`:
//   { id: "p-plan-v2-<day>", updated_at, plan_id: "plan-v2", day, slots: [{ slot, ex, sets, rest }], changes?: [...] }
// "Back to the plan's day" = tombstone. A record this app cannot use is kept and synced, never dropped, but not used:
// the day falls back to plan-v2.js and the engine says `newerVersion: true`.
//
// The plan's Monday, Wednesday and Thursday abs slots are being changed at the same time (DECISIONS 2026-11-18):
// hard-coded expectations here use Tuesday and Friday only, or are worked out from `days` while the test runs.
// All values are made up. No body data.
import test from "node:test";
import assert from "node:assert/strict";
import * as schedule from "../app/js/engine/schedule.js";
import * as workout from "../app/js/engine/workout.js";
import { days, exercises, setsFor, DAY_IDS, PLAN_ID } from "../app/js/plan/plan-v2.js";
import { createStore, hasData } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { emptyDoc, validateDocument } from "../app/js/validate.js";
import { mergeDocs, hasChangesSince, LISTS, canonical } from "../app/js/sync/merge.js";
import { makeBackup } from "../app/js/backup.js";
import { createSyncer, saveConnection } from "../app/js/sync/sync.js";
import { createFakeGithub, VALID_TOKEN } from "./fake-github.mjs";
import { mergeDocs as mergeDocsOld } from "./fixtures/merge-0.3.1.mjs";
import { validDoc, fakeStorage, intake } from "./fixtures/profiles.mjs";

// The new engine file does not exist before the change: load it softly so each test fails on its own.
const pe = await import("../app/js/engine/planedits.js").catch(() => ({}));

const T = "2026-03-02T09:00:00.000Z";
const T2 = "2026-03-03T09:00:00.000Z";
const WEEKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const copy = (v) => JSON.parse(JSON.stringify(v));
const planSlots = (day) => copy(days[day].slots).map(({ slot, ex, sets, rest }) => ({ slot, ex, sets, rest }));
const record = (day, slots, extra = {}) => ({ id: `p-plan-v2-${day}`, updated_at: T, plan_id: "plan-v2", day, slots, ...extra });
// Tuesday with A1 swapped to the goblet squat and two added exercises.
const tueEdited = () => record("tue", [
  ...planSlots("tue").map((s) => (s.slot === "A1" ? { ...s, ex: "goblet_squat" } : s)),
  { slot: "E1", ex: "calf_raise_leg_press", sets: 3, rest: 60 },
  { slot: "E2", ex: "cable_curl", sets: 3, rest: 60 },
]);

function setup(start = T, doc = validDoc()) {
  const storage = fakeStorage();
  const store = createStore(storage);
  let ms = Date.parse(start);
  const clock = () => new Date((ms += 1000));
  store.save(doc);
  return { storage, store, model: createModel(store, clock), tick: (s = 60) => { ms += s * 1000; } };
}
// A log where every exercise was done once before (a finished workout), so a new workout gets the week's sets:
// a move never done before starts with at most 2 sets (answer 83 a, tests/wave1-fixes.test.mjs W4 to W6).
const doneSet = { n: 1, type: "work", weight_kg: 10, reps: 10, seconds: null, rir: null, done_at: "2026-02-23T09:00:00.000Z" };
const knownDoc = () => ({ ...validDoc(), sessions: [{
  id: "s-20260223-known1", updated_at: "2026-02-23T09:30:00.000Z", date: "2026-02-23", plan_day: "mon", week: 7, kind: "full",
  swapped_from: null, status: "finished", started_at: "2026-02-23T08:00:00.000Z", finished_at: "2026-02-23T09:30:00.000Z", walk: null,
  exercises: Object.keys(exercises).map((id, i) => ({ slot: `K${i}`, plan_exercise: id, done_exercise: id, swap_reason: null, sets: [doneSet], note: "" })),
  effort: 5, note: "",
}] });
const startedSession = (store, id) => store.load().sessions.find((x) => x.id === id);
const planDayRec = (store, day) => (store.load().plan_days ?? []).find((r) => r.id === `p-plan-v2-${day}`);

// ---------- data: the list, the check, merge, hasData ----------

test("1 plan_days is an optional list: empty document has it, merge knows it, hasData counts it", () => {
  assert.deepEqual(emptyDoc().plan_days, []);
  assert.ok(LISTS.includes("plan_days"));
  assert.equal(pe.planDayId?.("mon"), "p-plan-v2-mon");
  assert.equal(hasData({ ...emptyDoc(), plan_days: [record("tue", planSlots("tue"))] }), true);
  assert.equal(hasData(emptyDoc()), false);
  assert.equal(hasChangesSince({ ...emptyDoc(), plan_days: [record("tue", planSlots("tue"), { updated_at: T2 })] }, T), true);
});

test("2 an old document without plan_days validates and comes back exactly unchanged", () => {
  const old = validDoc();
  assert.equal("plan_days" in old, false);
  const r = validateDocument(old);
  assert.equal(r.ok, true, r.error);
  assert.deepEqual(r.doc, old);
  assert.equal("plan_days" in r.doc, false);
});

test("3 the check keeps good records, tombstones, unknown fields and records this app cannot use", () => {
  const good = { ...validDoc(), plan_days: [
    { ...tueEdited(), colour: "from a newer app", changes: [{ at: T, what: "swap", slot: "A1", from: "leg_press", to: "goblet_squat" }] },
    { id: "p-plan-v2-fri", updated_at: T, deleted: true, deleted_at: T },
    record("mon", [{ slot: "A1", ex: "zercher_squat", sets: 3, rest: null }]), // unknown exercise: kept, not used
    { id: "p-plan-v3-wed", updated_at: T, plan_id: "plan-v3", day: "wed", slots: "a newer shape" },
  ] };
  const r = validateDocument(good);
  assert.equal(r.ok, true, r.error);
  assert.deepEqual(r.doc.plan_days, good.plan_days);
  for (const bad of ["not a record", { id: "p-plan-v2-tue", slots: [] }, { updated_at: T, day: "tue" }, { id: "", updated_at: T }, { id: "p-plan-v2-tue", updated_at: T, deleted: "yes" }]) {
    const v = validateDocument({ ...validDoc(), plan_days: [bad] });
    assert.equal(v.ok, false, JSON.stringify(bad));
    assert.match(v.error, /plan day/i);
  }
  assert.equal(validateDocument({ ...validDoc(), plan_days: { a: 1 } }).ok, false);
});

test("4 merge: later edit wins, tombstone wins when later, an older copy never brings it back, symmetric", () => {
  const a = { ...emptyDoc(), plan_days: [tueEdited()] };
  const dead = { ...tueEdited(), updated_at: T2, deleted: true, deleted_at: T2 };
  const b = { ...emptyDoc(), plan_days: [dead] };
  for (const m of [mergeDocs(a, b), mergeDocs(b, a)]) {
    assert.equal(m.plan_days.length, 1);
    assert.equal(m.plan_days[0].deleted, true);
  }
  assert.deepEqual(mergeDocs(a, b), mergeDocs(b, a));
  const newer = { ...emptyDoc(), plan_days: [{ ...tueEdited(), updated_at: T2, slots: planSlots("tue").slice(0, 6) }] };
  assert.equal(mergeDocs(a, newer).plan_days[0].slots.length, 6);
  const ab = mergeDocs(a, newer);
  assert.deepEqual(mergeDocs(ab, ab), ab);
});

test("5 a phone still on app 0.3.1 keeps a plan_days list it does not know", () => {
  const newer = { ...validDoc(), plan_days: [tueEdited()] };
  assert.deepEqual(mergeDocsOld(validDoc(), newer).plan_days, newer.plan_days);
  assert.deepEqual(mergeDocsOld(newer, validDoc()).plan_days, newer.plan_days);
});

// ---------- the week rule on a slot object ----------

test("6 setsForSlot matches the plan's setsFor for every slot of every day in every week", () => {
  for (const d of DAY_IDS) {
    for (const s of days[d].slots) {
      for (const w of [0, ...WEEKS, 13]) assert.equal(pe.setsForSlot(w, s), setsFor(w, d, s.slot), `${d} ${s.slot} week ${w}`);
    }
  }
});

test("7 added exercises (E1, E2) follow the D rule: week 1 at most 2, weeks 6 and 12 one less, weeks 7-11 at most 2", () => {
  const want = (base, w) => (w === 1 ? Math.min(base, 2) : w === 6 || w === 12 ? Math.max(base - 1, 1) : w >= 7 && w <= 11 ? Math.min(base, 2) : base);
  for (const slot of ["E1", "E2", "D"]) {
    for (const base of [1, 2, 3, 4, 5]) {
      for (const w of WEEKS) assert.equal(pe.setsForSlot(w, { slot, ex: "x", sets: base, rest: 60 }), want(base, w), `${slot} base ${base} week ${w}`);
    }
  }
  const e1 = { slot: "E1", ex: "x", sets: 3, rest: 60 };
  assert.deepEqual(WEEKS.map((w) => pe.setsForSlot(w, e1)), [2, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2]);
});

// ---------- the engine reads the edited day ----------

test("8 with no edit, daySlots / planForDay / shortDaySlots give exactly what they gave before", () => {
  for (const d of DAY_IDS) {
    for (const w of WEEKS) {
      const plain = schedule.daySlots(d, w);
      assert.deepEqual(schedule.daySlots(d, w, null), plain);
      assert.deepEqual(schedule.daySlots(d, w, undefined), plain);
      assert.deepEqual(schedule.planForDay(d, w, "full", null).slots, schedule.planForDay(d, w).slots);
      assert.deepEqual(schedule.planForDay(d, w, "short", null).slots, schedule.planForDay(d, w, "short").slots);
      assert.deepEqual(schedule.shortDaySlots(d, w, null), schedule.shortDaySlots(d, w));
    }
  }
  const p = schedule.planForDay("tue", 3, "full", null);
  assert.equal(p.edited, false);
  assert.equal(p.newerVersion, false);
});

test("9 an edited Tuesday: swapped exercise, E1 and E2 at the end, every week's sets from the slot rule", () => {
  const rec = tueEdited();
  for (const w of WEEKS) {
    const slots = schedule.daySlots("tue", w, rec);
    assert.deepEqual(slots.map((s) => s.slot), ["A1", "A2", "B1", "B2", "C1", "C2", "D", "E1", "E2"]);
    assert.equal(slots[0].ex, "goblet_squat");
    for (const s of slots) assert.equal(s.sets, pe.setsForSlot(w, rec.slots.find((x) => x.slot === s.slot)), `${s.slot} week ${w}`);
    assert.equal(slots.find((s) => s.slot === "E1").rest, 60);
  }
  assert.equal(schedule.daySlots("tue", 7, rec)[0].sets, 4); // pair A gets its 4th set in weeks 7-11
  assert.equal(schedule.daySlots("tue", 7, rec).find((s) => s.slot === "E2").sets, 2);
  const p = schedule.planForDay("tue", 2, "full", rec);
  assert.equal(p.edited, true);
  assert.equal(p.newerVersion, false);
  assert.equal(p.focus, days.tue.focus);
  assert.equal(p.walk, days.tue.walk);
});

test("10 the short day of an edited day: pairs A and B (edited), then Abs1 only; D, E1 and E2 are skipped", () => {
  const rec = tueEdited();
  for (const w of WEEKS) {
    const s = schedule.planForDay("tue", w, "short", rec).slots;
    assert.deepEqual(s.map((x) => x.slot), ["A1", "A2", "B1", "B2"]);
    assert.equal(s[0].ex, "goblet_squat");
  }
  // A day that has Abs1 keeps it on the short day, edited or not (worked out from the data).
  for (const d of DAY_IDS.filter((x) => days[x].slots.some((s) => s.slot === "Abs1"))) {
    const rec2 = record(d, [...planSlots(d), { slot: "E1", ex: "cable_curl", sets: 3, rest: 60 }].filter((s, i, all) => all.findIndex((y) => y.ex === s.ex) === i));
    if (!pe.checkPlanDay?.(rec2, d)?.ok) continue; // cable curl already in that day
    const short = schedule.shortDaySlots(d, 3, rec2);
    assert.deepEqual(short.abs.map((x) => x.slot), ["Abs1"]);
    assert.ok(short.pairs.every((x) => /^[AB][12]$/.test(x.slot)));
  }
});

test("11 records this app cannot use fall back to the plan, are flagged newerVersion, and are never changed", () => {
  const base = planSlots("tue");
  const bad = {
    "unknown exercise": record("tue", [{ ...base[0], ex: "zercher_squat" }, ...base.slice(1)]),
    "unknown slot": record("tue", [...base, { slot: "F1", ex: "cable_curl", sets: 3, rest: 60 }]),
    "slot twice": record("tue", [...base, { ...base[0], ex: "cable_curl" }]),
    "sets 0": record("tue", base.map((s, i) => (i === 0 ? { ...s, sets: 0 } : s))),
    "sets 6": record("tue", base.map((s, i) => (i === 0 ? { ...s, sets: 6 } : s))),
    "sets 2.5": record("tue", base.map((s, i) => (i === 0 ? { ...s, sets: 2.5 } : s))),
    "rest 61": record("tue", base.map((s, i) => (i === 1 ? { ...s, rest: 61 } : s))),
    "rest text": record("tue", base.map((s, i) => (i === 1 ? { ...s, rest: "90" } : s))),
    "same exercise twice": record("tue", [...base, { slot: "E1", ex: base[0].ex, sets: 3, rest: 60 }]),
    "three added": record("tue", [...base, { slot: "E1", ex: "cable_curl", sets: 3, rest: 60 }, { slot: "E2", ex: "hammer_curl", sets: 3, rest: 60 }, { slot: "E3", ex: "db_curl", sets: 3, rest: 60 }]),
    "added not at the end": record("tue", [{ slot: "E1", ex: "cable_curl", sets: 3, rest: 60 }, ...base]),
    "wrong plan_id": record("tue", base, { plan_id: "plan-v3" }),
    "wrong day": record("tue", base, { day: "fri" }),
    "no slots": record("tue", []),
    "slots not a list": record("tue", "A1,A2"),
    "slot not an object": record("tue", [...base, null]),
    "prototype name": record("tue", [{ ...base[0], ex: "constructor" }, ...base.slice(1)]),
  };
  for (const [why, rec] of Object.entries(bad)) {
    const before = canonical(rec);
    assert.equal(pe.checkPlanDay(rec, "tue").ok, false, why);
    const eff = pe.effectiveDay("tue", rec);
    assert.equal(eff.edited, false, why);
    assert.equal(eff.newerVersion, true, why);
    for (const w of [1, 3, 7]) assert.deepEqual(schedule.daySlots("tue", w, rec), schedule.daySlots("tue", w), `${why} week ${w}`);
    assert.equal(schedule.planForDay("tue", 3, "full", rec).newerVersion, true, why);
    assert.equal(canonical(rec), before, `${why}: the record is not changed`);
  }
  // A copy of the plan's own day is a usable record for every day (worked out from the data).
  for (const d of DAY_IDS) assert.equal(pe.checkPlanDay(record(d, planSlots(d)), d).ok, true, d);
  // No record, or a tombstone: the plan, with no flag.
  for (const rec of [null, undefined, { ...tueEdited(), deleted: true, deleted_at: T }]) {
    const eff = pe.effectiveDay("tue", rec);
    assert.deepEqual([eff.edited, eff.newerVersion], [false, false]);
    assert.deepEqual(schedule.daySlots("tue", 3, rec), schedule.daySlots("tue", 3));
  }
});

// ---------- the workout units: E slots and a pair that lost a member ----------

test("12 E1 and E2 are their own units at the end, 'On its own', 60 s rest between sets", () => {
  const slots = schedule.daySlots("tue", 2, tueEdited());
  const { units, seq } = workout.buildSequence(slots);
  const last2 = units.slice(-2);
  assert.deepEqual(last2.map((u) => [u.type, u.id]), [["single", "E1"], ["single", "E2"]]);
  assert.deepEqual(last2.map((u) => workout.unitLabel(u)), ["On its own", "On its own"]);
  const tail = seq.slice(-6);
  assert.deepEqual(tail.map((e) => `${e.slot}#${e.setNumber}`), ["E1#1", "E1#2", "E1#3", "E2#1", "E2#2", "E2#3"]);
  assert.deepEqual(tail.slice(0, 5).map((e) => e.restAfter), [60, 60, 60, 60, 60]);
  assert.equal(tail[5].restAfter, null); // nothing to rest for at the very end
  assert.equal(workout.wantsWarmup(tail[0], units), false);
  assert.equal(units.find((u) => u.id === "D").type, "single");
  assert.equal(workout.unitLabel(units.find((u) => u.id === "D")), "On its own");
});

test("13 a pair that lost its second exercise: the first becomes a single unit, keeps warm-up sets, rests the pair's rest", () => {
  const rec = record("tue", planSlots("tue").filter((s) => s.slot !== "A2"));
  const pairRest = days.tue.slots.find((s) => s.slot === "A2").rest; // 90 on Tuesday
  const slots = schedule.daySlots("tue", 2, rec);
  assert.equal(slots.find((s) => s.slot === "A1").rest, pairRest);
  const { units, seq } = workout.buildSequence(slots);
  assert.deepEqual([units[0].type, units[0].id], ["single", "A1"]);
  assert.equal(workout.unitLabel(units[0]), "On its own");
  const a1 = seq.filter((e) => e.slot === "A1");
  assert.equal(a1.length, 3);
  assert.ok(a1.every((e) => e.restAfter === pairRest && e.restKind === "rest"));
  assert.equal(workout.wantsWarmup(a1[0], units), true);
  assert.equal(workout.wantsWarmup(a1[1], units), false);
  assert.equal(units[1].type, "pair"); // pair B is untouched
  // weeks 7-11: the lone A1 still gets the 4th set of pair A
  assert.equal(schedule.daySlots("tue", 8, rec).find((s) => s.slot === "A1").sets, 4);
});

test("14 a pair that lost its first exercise: the second becomes a single unit with its own rest", () => {
  const rec = record("fri", planSlots("fri").filter((s) => s.slot !== "B1"));
  const own = days.fri.slots.find((s) => s.slot === "B2").rest;
  const { units, seq } = workout.buildSequence(schedule.daySlots("fri", 3, rec));
  const u = units.find((x) => x.id === "B2");
  assert.equal(u.type, "single");
  const b2 = seq.filter((e) => e.slot === "B2");
  assert.ok(b2.every((e) => e.restAfter === own));
  assert.equal(workout.wantsWarmup(b2[0], units), true);
});

test("15 unchanged plan days build exactly the same units as before (pairs stay pairs)", () => {
  for (const d of DAY_IDS) {
    const { units } = workout.buildSequence(schedule.daySlots(d, 3));
    for (const u of units) {
      if (/^[A-C]$/.test(u.id)) assert.equal(u.slots.length, 2, `${d} ${u.id}`);
      if (u.type === "single") assert.equal(workout.unitLabel(u), /^Abs/.test(u.id) ? "Abs" : "On its own");
    }
  }
});

// ---------- the swap choices for a slot ----------

test("16 swap choices: the plan's exercise and its swaps stay offered after a permanent swap; no duplicates", () => {
  const plan = days.tue.slots.find((s) => s.slot === "A1"); // leg press
  const rec = record("tue", planSlots("tue").map((s) => (s.slot === "A1" ? { ...s, ex: "goblet_squat" } : s)));
  const choices = pe.planSwapChoices("tue", "A1", rec, validDoc().shared_settings);
  assert.ok(choices.includes(plan.ex), "the plan's own exercise");
  for (const sw of exercises[plan.ex].swaps) if (!sw.needsMachine) assert.ok(choices.includes(sw.id), sw.id);
  for (const sw of exercises.goblet_squat.swaps) if (!sw.needsMachine && sw.id !== "goblet_squat") assert.ok(choices.includes(sw.id), sw.id);
  assert.ok(!choices.includes("goblet_squat"), "never the exercise done now");
  assert.equal(new Set(choices).size, choices.length);
  // no edit: the plan's swaps, not the plan's own exercise
  const plain = pe.planSwapChoices("tue", "A1", null, validDoc().shared_settings);
  assert.ok(!plain.includes(plan.ex));
  for (const sw of exercises[plan.ex].swaps) if (!sw.needsMachine) assert.ok(plain.includes(sw.id));
  assert.deepEqual(pe.planSwapChoices("tue", "Z9", null, {}), []);
});

test("17 swap choices never offer an exercise already in that day", () => {
  const a1 = days.fri.slots.find((s) => s.slot === "A1");
  const target = exercises[a1.ex].swaps.find((s) => !s.needsMachine).id;
  const rec = record("fri", [...planSlots("fri"), { slot: "E1", ex: target, sets: 3, rest: 60 }]);
  assert.equal(pe.checkPlanDay(rec, "fri").ok, true);
  assert.ok(!pe.planSwapChoices("fri", "A1", rec, {}).includes(target));
  assert.ok(pe.planSwapChoices("fri", "A1", null, {}).includes(target));
  for (const d of DAY_IDS) {
    for (const s of days[d].slots) {
      const inDay = new Set(days[d].slots.filter((x) => x.slot !== s.slot).map((x) => x.ex));
      for (const id of pe.planSwapChoices(d, s.slot, null, {})) assert.ok(!inDay.has(id), `${d} ${s.slot} ${id}`);
    }
  }
});

test("18 swap choices: a first-visit machine shows only when Settings says the gym has it", () => {
  let found = null;
  for (const d of ["tue", "fri"]) for (const s of days[d].slots) {
    const sw = exercises[s.ex].swaps.find((x) => x.needsMachine);
    if (sw && !found) found = { d, slot: s.slot, id: sw.id, machine: sw.needsMachine };
  }
  assert.ok(found, "a Tuesday or Friday exercise has a first-visit machine swap");
  const machines = (v) => ({ extra_machines: { [found.machine]: v } });
  assert.ok(!pe.planSwapChoices(found.d, found.slot, null, machines(null)).includes(found.id));
  assert.ok(!pe.planSwapChoices(found.d, found.slot, null, machines(false)).includes(found.id));
  assert.ok(!pe.planSwapChoices(found.d, found.slot, null, {}).includes(found.id));
  assert.ok(pe.planSwapChoices(found.d, found.slot, null, machines(true)).includes(found.id));
});

// ---------- the model ----------

test("19 swap, remove and add save one whole-day record with a fixed id and a fresh updated_at", () => {
  const p = setup();
  p.model.swapPlanSlot("tue", "A1", "goblet_squat");
  const r1 = planDayRec(p.store, "tue");
  assert.deepEqual([r1.id, r1.plan_id, r1.day], ["p-plan-v2-tue", PLAN_ID, "tue"]);
  assert.equal(r1.slots.find((s) => s.slot === "A1").ex, "goblet_squat");
  assert.equal(r1.slots.length, days.tue.slots.length);
  assert.equal(r1.changes.at(-1).what, "swap");
  p.tick();
  p.model.addPlanSlot("tue", "cable_curl");
  const r2 = planDayRec(p.store, "tue");
  assert.ok(Date.parse(r2.updated_at) > Date.parse(r1.updated_at));
  assert.deepEqual(r2.slots.at(-1), { slot: "E1", ex: "cable_curl", sets: 3, rest: 60 });
  p.model.removePlanSlot("tue", "B2");
  const r3 = planDayRec(p.store, "tue");
  assert.ok(!r3.slots.some((s) => s.slot === "B2"));
  assert.deepEqual(r3.changes.map((c) => c.what), ["swap", "add", "remove"]);
  assert.equal(p.store.load().plan_days.length, 1);
  const eff = p.model.effectivePlanDay("tue");
  assert.equal(eff.edited, true);
  assert.equal(eff.slots[0].ex, "goblet_squat");
  assert.equal(validateDocument(p.store.load()).ok, true);
});

test("20 the model refuses the same exercise twice, a third added exercise and bad input; nothing is saved", () => {
  const p = setup();
  p.model.addPlanSlot("fri", "cable_curl");
  p.model.addPlanSlot("fri", "hammer_curl");
  const before = JSON.stringify(p.store.load());
  assert.throws(() => p.model.addPlanSlot("fri", "db_curl"), /2 added/i);
  assert.throws(() => p.model.addPlanSlot("fri", "cable_curl"), /already/i);
  assert.throws(() => p.model.swapPlanSlot("fri", "A1", days.fri.slots[2].ex), /already/i);
  assert.throws(() => p.model.swapPlanSlot("fri", "A1", "zercher_squat"), /exercise/i);
  assert.throws(() => p.model.swapPlanSlot("fri", "A1", "constructor"), /exercise/i);
  assert.throws(() => p.model.swapPlanSlot("fri", "Z9", "goblet_squat"), /slot|exercise/i);
  assert.throws(() => p.model.swapPlanSlot("sat", "A1", "goblet_squat"), /day/i);
  const dup = [...p.model.effectivePlanDay("fri").slots];
  dup[1] = { ...dup[1], ex: dup[0].ex };
  assert.throws(() => p.model.savePlanDay("fri", dup), /already/i);
  assert.throws(() => p.model.savePlanDay("fri", planSlots("fri").map((s, i) => (i === 0 ? { ...s, sets: 9 } : s))), /sets/i);
  assert.throws(() => p.model.savePlanDay("fri", []), /exercise/i);
  assert.equal(JSON.stringify(p.store.load()), before);
});

test("21 removing the first added exercise renumbers the second; removing the last exercise of a day is refused", () => {
  const p = setup();
  p.model.addPlanSlot("tue", "cable_curl");
  p.model.addPlanSlot("tue", "hammer_curl");
  p.model.removePlanSlot("tue", "E1");
  const slots = planDayRec(p.store, "tue").slots;
  assert.deepEqual(slots.at(-1), { slot: "E1", ex: "hammer_curl", sets: 3, rest: 60 });
  assert.equal(slots.filter((s) => /^E/.test(s.slot)).length, 1);
  p.model.savePlanDay("tue", [planSlots("tue")[0]]);
  assert.throws(() => p.model.removePlanSlot("tue", "A1"), /at least one/i);
});

test("22 back to the plan's day: a tombstone that keeps the fields; the day falls back; editing again clears it", () => {
  const p = setup();
  p.model.swapPlanSlot("tue", "A1", "goblet_squat");
  p.tick();
  p.model.resetPlanDay("tue");
  const dead = planDayRec(p.store, "tue");
  assert.equal(dead.deleted, true);
  assert.ok(dead.deleted_at);
  assert.equal(dead.updated_at, dead.deleted_at);
  assert.equal(dead.slots[0].ex, "goblet_squat"); // kept in the tombstone
  const eff = p.model.effectivePlanDay("tue");
  assert.deepEqual([eff.edited, eff.newerVersion], [false, false]);
  assert.deepEqual(eff.slots, planSlots("tue"));
  p.model.addPlanSlot("tue", "cable_curl");
  const back = planDayRec(p.store, "tue");
  assert.equal("deleted" in back, false);
  assert.equal("deleted_at" in back, false);
  assert.deepEqual(back.slots, [...planSlots("tue"), { slot: "E1", ex: "cable_curl", sets: 3, rest: 60 }]);
  assert.equal(validateDocument(p.store.load()).ok, true);
});

test("23 an edit that gives back the plan's own day (an undo) leaves no edit behind", () => {
  const p = setup();
  p.model.swapPlanSlot("tue", "A1", "goblet_squat");
  p.model.swapPlanSlot("tue", "A1", days.tue.slots[0].ex);
  const eff = p.model.effectivePlanDay("tue");
  assert.equal(eff.edited, false);
  const rec = planDayRec(p.store, "tue");
  assert.ok(!rec || rec.deleted === true);
});

test("24 a record from a newer app: kept, not used, and not overwritten by an edit here; reset keeps its fields", () => {
  const p = setup();
  const newer = { ...record("tue", [{ slot: "A1", ex: "zercher_squat", sets: 3, rest: null }]), mood: "keep me" };
  const doc = p.store.load();
  doc.plan_days = [newer];
  p.store.save(doc);
  const eff = p.model.effectivePlanDay("tue");
  assert.deepEqual([eff.edited, eff.newerVersion], [false, true]);
  assert.deepEqual(eff.slots, planSlots("tue"));
  const before = JSON.stringify(p.store.load());
  assert.throws(() => p.model.swapPlanSlot("tue", "B1", "cable_pull_through"), /newer/i);
  assert.equal(JSON.stringify(p.store.load()), before);
  p.model.resetPlanDay("tue");
  const dead = planDayRec(p.store, "tue");
  assert.equal(dead.deleted, true);
  assert.equal(dead.mood, "keep me");
  assert.equal(dead.slots[0].ex, "zercher_squat");
});

test("25 unknown fields of the record and of its slots survive an edit", () => {
  const p = setup();
  const doc = p.store.load();
  doc.plan_days = [{ ...record("tue", planSlots("tue").map((s, i) => (i === 0 ? { ...s, ex: "goblet_squat", tag: "x" } : s))), mood: "keep" }];
  p.store.save(doc);
  p.model.addPlanSlot("tue", "cable_curl");
  const rec = planDayRec(p.store, "tue");
  assert.equal(rec.mood, "keep");
  assert.equal(rec.slots[0].tag, "x");
});

// ---------- starting, running and finished workouts ----------

test("26 starting a workout uses the edited day: slots, exercises and the planned sets of that week", () => {
  const p = setup(T, knownDoc());
  p.model.swapPlanSlot("tue", "A1", "goblet_squat");
  p.model.addPlanSlot("tue", "cable_curl");
  const s = p.model.startSession({ planDay: "tue", week: 7, kind: "full" });
  assert.deepEqual(s.exercises.map((e) => e.slot), ["A1", "A2", "B1", "B2", "C1", "C2", "D", "E1"]);
  assert.deepEqual([s.exercises[0].plan_exercise, s.exercises[0].done_exercise], ["goblet_squat", "goblet_squat"]);
  assert.equal(s.exercises[0].planned_sets, 4);
  assert.equal(s.exercises.at(-1).planned_sets, 2);
  assert.equal(s.exercises.at(-1).planned_rest, 60);
  const short = setup();
  short.model.addPlanSlot("tue", "cable_curl");
  const ss = short.model.startSession({ planDay: "tue", week: 3, kind: "short" });
  assert.deepEqual(ss.exercises.map((e) => e.slot), ["A1", "A2", "B1", "B2"]);
  // slots given by the caller are used as they are (today's screens)
  const given = setup();
  given.model.addPlanSlot("tue", "cable_curl");
  const g = given.model.startSession({ planDay: "tue", week: 3, kind: "full", slots: schedule.planForDay("tue", 3).slots });
  assert.equal(g.exercises.length, days.tue.slots.length);
  assert.equal(validateDocument(given.store.load()).ok, true);
});

test("27 an edit saved while a workout runs does not change that workout's slots or sets", () => {
  const p = setup();
  p.model.swapPlanSlot("tue", "A1", "goblet_squat");
  const s = p.model.startSession({ planDay: "tue", week: 2, kind: "full" });
  p.model.logSet(s.id, "A1", { type: "work", weight_kg: 20, reps: 10 });
  const sessionsBefore = JSON.stringify(p.store.load().sessions);
  const planBefore = schedule.planForSession(p.store.load().sessions[0]);
  p.model.removePlanSlot("tue", "B2");
  p.model.addPlanSlot("tue", "cable_curl");
  p.model.swapPlanSlot("tue", "A1", "smith_squat");
  assert.equal(JSON.stringify(p.store.load().sessions), sessionsBefore);
  const running = p.store.load().sessions[0];
  const planAfter = schedule.planForSession(running);
  assert.deepEqual(planAfter, planBefore);
  assert.deepEqual(planAfter.slots.map((x) => x.slot), ["A1", "A2", "B1", "B2", "C1", "C2", "D"]);
  assert.equal(planAfter.slots[0].ex, "goblet_squat");
  const { seq } = workout.buildSequence(planAfter.slots);
  assert.ok(seq.some((e) => e.slot === "B2"));
  assert.ok(!seq.some((e) => e.slot === "E1"));
  p.model.logSet(s.id, "B2", { type: "work", weight_kg: 10, reps: 12 });
  assert.equal(validateDocument(p.store.load()).ok, true);
});

test("28 planForSession matches planForDay for a workout started on a plain or an edited day", () => {
  for (const kind of ["full", "short"]) {
    for (const edited of [false, true]) {
      const p = setup(T, knownDoc());
      if (edited) { p.model.swapPlanSlot("fri", "A1", "goblet_squat"); p.model.addPlanSlot("fri", "cable_curl"); }
      const s = p.model.startSession({ planDay: "fri", week: 7, kind });
      const fromSession = schedule.planForSession(startedSession(p.store, s.id));
      const fromDay = schedule.planForDay("fri", 7, kind, edited ? planDayRec(p.store, "fri") : null);
      const pick = (x) => ({ slot: x.slot, ex: x.ex, sets: x.sets, rest: x.rest });
      assert.deepEqual(fromSession.slots.map(pick), fromDay.slots.map(pick), `${kind} ${edited}`);
      assert.deepEqual([fromSession.dayId, fromSession.kind, fromSession.week, fromSession.rir], [fromDay.dayId, fromDay.kind, fromDay.week, fromDay.rir]);
      assert.ok(s.id);
    }
  }
});

test("29 a mid-workout swap keeps the planned sets on the new record", () => {
  const p = setup(T, knownDoc());
  const s = p.model.startSession({ planDay: "tue", week: 7, kind: "full" });
  p.model.logSet(s.id, "A1", { type: "work", weight_kg: 50, reps: 10 });
  p.model.swapExercise(s.id, "A1", "smith_squat", "busy");
  const saved = startedSession(p.store, s.id);
  const a1 = saved.exercises.filter((e) => e.slot === "A1");
  assert.equal(a1.length, 2);
  assert.ok(a1.every((e) => e.planned_sets === 4));
  assert.equal(schedule.planForSession(saved).slots.filter((x) => x.slot === "A1").length, 1);
});

test("30 finished workouts read back identically after edits", () => {
  const p = setup();
  const s = p.model.startSession({ planDay: "fri", week: 2, kind: "full" });
  for (const e of s.exercises) p.model.logSet(s.id, e.slot, { type: "work", weight_kg: 10, reps: 10 });
  p.model.finishSession(s.id, { effort: 6 });
  const before = copy(p.store.load().sessions);
  const planBefore = schedule.planForSession(before[0]);
  const perfBefore = workout.performances(before, days.fri.slots[0].ex);
  p.model.swapPlanSlot("fri", "A1", "goblet_squat");
  p.model.addPlanSlot("fri", "cable_curl");
  p.model.resetPlanDay("fri");
  p.model.addPlanSlot("fri", "hammer_curl");
  const after = p.store.load().sessions;
  assert.deepEqual(after, before);
  assert.deepEqual(schedule.planForSession(after[0]), planBefore);
  assert.deepEqual(workout.performances(after, days.fri.slots[0].ex), perfBefore);
});

// A Monday workout saved before the plan change of 2026-11-18: slot Abs2 with the dead bug, no D, no planned sets.
function oldMonday(status = "in_progress") {
  const work = (n, kg = 10) => ({ n, type: "work", weight_kg: kg, reps: 10, seconds: null, rir: null, done_at: "2026-01-12T09:00:00.000Z" });
  const ex = (slot, id, sets) => ({ slot, plan_exercise: id, done_exercise: id, swap_reason: null, sets, note: "" });
  const three = [work(1), work(2), work(3)];
  return {
    id: "s-20260112-old001", updated_at: "2026-01-12T09:30:00.000Z", date: "2026-01-12", plan_day: "mon", week: 2, kind: "full",
    swapped_from: null, status, started_at: "2026-01-12T08:00:00.000Z", finished_at: status === "finished" ? "2026-01-12T09:30:00.000Z" : null, walk: null,
    exercises: [
      ex("A1", "chest_press", three), ex("A2", "pulldown", three), ex("B1", "shoulder_press_machine", three),
      ex("B2", "one_arm_db_row", three), ex("C1", "db_curl", three), ex("C2", "triceps_pushdown", three),
      ex("Abs1", "plank", [work(1, 0), work(2, 0), work(3, 0)]),
      ex("Abs2", "dead_bug", status === "finished" ? [work(1, 0), work(2, 0)] : []),
    ],
    effort: null, note: "",
  };
}

test("31 a workout saved before the plan change (Abs2, no D) resumes and finishes without throwing", () => {
  const p = setup();
  const doc = p.store.load();
  doc.sessions = [oldMonday()];
  p.store.save(doc);
  const s = p.store.load().sessions[0];
  const plan = schedule.planForSession(s);
  assert.deepEqual(plan.slots.map((x) => x.slot), s.exercises.map((e) => e.slot), "the workout's own slots, nothing new");
  const abs2 = plan.slots.find((x) => x.slot === "Abs2");
  assert.equal(abs2.ex, "dead_bug");
  assert.ok(Number.isInteger(abs2.sets) && abs2.sets >= 1 && abs2.sets <= 5);
  const { units, seq } = workout.buildSequence(plan.slots, { setsOverride: s.sets_override ?? null });
  assert.equal(workout.unitLabel(units.find((u) => u.id === "Abs2")), "Abs");
  let pos = workout.nextPosition(s, seq);
  assert.equal(pos.entry.slot, "Abs2");
  let guard = 0;
  while (pos && guard++ < 20) {
    p.model.logSet(s.id, pos.entry.slot, { type: "work", weight_kg: 0, reps: 8 });
    pos = workout.nextPosition(p.store.load().sessions[0], seq);
  }
  assert.equal(pos, null);
  p.model.finishSession(s.id, { effort: 5 });
  const done = p.store.load();
  assert.equal(done.sessions[0].status, "finished");
  assert.equal(validateDocument(done).ok, true);
  assert.ok(workout.performances(done.sessions, "dead_bug").length >= 1);
});

test("32 history of a workout saved before the plan change reads without throwing", () => {
  const sessions = [oldMonday("finished")];
  const plan = schedule.planForSession(sessions[0]);
  assert.equal(plan.slots.length, 8);
  assert.ok(workout.performances(sessions, "dead_bug").length === 1);
  assert.ok(workout.finishedSessions(sessions).length === 1);
  // a snapshot in the session wins over the plan of today
  const snap = oldMonday();
  snap.exercises.forEach((e) => { e.planned_sets = 3; e.planned_rest = 45; });
  assert.ok(schedule.planForSession(snap).slots.every((x) => x.sets === 3 && x.rest === 45));
  // bad snapshot numbers from a file are not trusted
  const evil = oldMonday();
  evil.exercises[0].planned_sets = 1e9;
  evil.exercises[1].planned_sets = "3";
  const slots = schedule.planForSession(evil).slots;
  assert.ok(slots[0].sets <= 10 && slots[1].sets <= 10);
});

// ---------- backup, restore and sync ----------

test("33 backup holds plan_days; restore on an empty phone gives them back; restore into a phone with data keeps both", () => {
  const p = setup();
  p.model.setProfile(intake());
  p.model.swapPlanSlot("tue", "A1", "goblet_squat");
  const backup = makeBackup(p.store);
  assert.equal(JSON.parse(backup.text).plan_days[0].id, "p-plan-v2-tue");
  const q = { store: createStore(fakeStorage()) };
  q.model = createModel(q.store, () => new Date(T));
  const r = q.model.restore(JSON.parse(backup.text));
  assert.equal(r.ok, true, r.error);
  assert.deepEqual(q.store.load().plan_days, p.store.load().plan_days);
  const w = setup(T2);
  w.model.setProfile(intake());
  w.model.addPlanSlot("fri", "cable_curl");
  const r2 = w.model.restore(JSON.parse(backup.text));
  assert.equal(r2.ok, true, r2.error);
  assert.equal(r2.merged, true);
  assert.deepEqual(w.store.load().plan_days.map((x) => x.id).sort(), ["p-plan-v2-fri", "p-plan-v2-tue"]);
});

function syncPhone(fake, start) {
  const storage = fakeStorage();
  const store = createStore(storage);
  let ms = Date.parse(start);
  const clock = () => new Date((ms += 1000));
  const model = createModel(store, clock);
  const syncer = createSyncer({ store, getFetch: () => fake.fetch, nowIso: () => new Date((ms += 1000)).toISOString() });
  assert.deepEqual(saveConnection(store, { owner: fake.owner, repo: fake.repo, token: VALID_TOKEN }), { ok: true });
  return { store, model, syncer, tick: (s = 60) => { ms += s * 1000; } };
}

test("34 sync: an edit on one phone reaches the other; a later 'back to the plan' wins on both", async () => {
  const fake = createFakeGithub();
  const one = syncPhone(fake, "2026-03-02T09:00:00.000Z");
  one.model.setProfile(intake());
  one.model.swapPlanSlot("tue", "A1", "goblet_squat");
  one.model.addPlanSlot("tue", "cable_curl");
  assert.equal((await one.syncer.request()).result, "ok");
  assert.equal(fake.readDoc().plan_days[0].slots[0].ex, "goblet_squat");
  const two = syncPhone(fake, "2026-03-02T10:00:00.000Z");
  assert.equal((await two.syncer.request("get")).result, "ok");
  const eff = two.model.effectivePlanDay("tue");
  assert.equal(eff.edited, true);
  assert.deepEqual(eff.slots.map((s) => s.slot).at(-1), "E1");
  assert.deepEqual(schedule.planForDay("tue", 3, "full", planDayRec(two.store, "tue")).slots[0].ex, "goblet_squat");
  two.model.resetPlanDay("tue");
  assert.equal((await two.syncer.request()).result, "ok");
  assert.equal((await one.syncer.request()).result, "ok");
  assert.equal(planDayRec(one.store, "tue").deleted, true);
  assert.equal(one.model.effectivePlanDay("tue").edited, false);
  assert.deepEqual(one.store.load().plan_days, two.store.load().plan_days);
});

test("35 sync: a record this app cannot use survives a round trip unchanged, field for field", async () => {
  const fake = createFakeGithub();
  const one = syncPhone(fake, "2026-03-02T09:00:00.000Z");
  one.model.setProfile(intake());
  const newer = { ...record("wed", [{ slot: "A1", ex: "zercher_squat", sets: 3, rest: null, tempo: "3-1-1" }]), changes: [{ at: T, what: "morph" }], mood: "from a newer app" };
  const doc = one.store.load();
  doc.plan_days = [newer];
  one.store.save(doc);
  assert.equal((await one.syncer.request()).result, "ok");
  const two = syncPhone(fake, "2026-03-02T10:00:00.000Z");
  assert.equal((await two.syncer.request("get")).result, "ok");
  assert.equal(canonical(planDayRec(two.store, "wed")), canonical(newer));
  assert.equal(two.model.effectivePlanDay("wed").newerVersion, true);
  two.model.setWeighin("2026-03-02", 80.1);
  two.model.addPlanSlot("fri", "cable_curl");
  assert.equal((await two.syncer.request()).result, "ok");
  assert.equal(canonical(fake.readDoc().plan_days.find((r) => r.id === "p-plan-v2-wed")), canonical(newer));
  assert.equal((await one.syncer.request()).result, "ok");
  assert.equal(canonical(planDayRec(one.store, "wed")), canonical(newer));
  assert.equal(planDayRec(one.store, "fri").slots.at(-1).ex, "cable_curl");
});
