// Wave 2 (build steps 4 and 5): the Plan tab's view of an edited day and the whole-plan muscle check.
// Pure logic in app/js/planview.js, saves through the step 3 model calls (swapPlanSlot, removePlanSlot, addPlanSlot,
// savePlanDay for Undo, resetPlanDay for "Back to the plan's day"). Contract: docs/DESIGN.md 15.5 and 15.6, mock-up
// frames t-edit, t-swap, t-add, t-changed, t-check1 to t-check3; answers 65, 72 a, 73 a.
// All values are made up. No body data.
import test from "node:test";
import assert from "node:assert/strict";
import * as pv from "../app/js/planview.js";
import { daySoFar, setsByMuscle, daySets } from "../app/js/engine/planpage.js";
import { daySlots, planForSession } from "../app/js/engine/schedule.js";
import { days, DAY_IDS } from "../app/js/plan/plan-v2.js";
import { createStore } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { validDoc, fakeStorage } from "./fixtures/profiles.mjs";

const T = "2026-03-02T09:00:00.000Z";
const copy = (v) => JSON.parse(JSON.stringify(v));
function setup(doc = validDoc()) {
  const store = createStore(fakeStorage());
  let ms = Date.parse(T);
  store.save(doc);
  return { store, model: createModel(store, () => new Date((ms += 1000))) };
}
const tueA1 = () => days.tue.slots.find((s) => s.slot === "A1").ex; // the plan's first exercise of Tuesday

// ---------- the edit flow, as the screens drive it ----------

test("W2-1 swap from the Plan day: the day view, Today's plan and the changes list all show the swap; Undo restores the plan", () => {
  const { model } = setup();
  const before = model.effectivePlanDay("tue").slots;
  const choice = pv.swapSheet(model.doc(), "tue", "A1", {}).same[0].id;
  model.swapPlanSlot("tue", "A1", choice);
  const v = pv.viewDay(model.doc(), "tue", 3);
  assert.equal(v.edited, true);
  assert.equal(v.slots.find((s) => s.slot === "A1").ex, choice);
  assert.equal(v.slots.find((s) => s.slot === "A1").sets, daySets("tue", 3).find((s) => s.slot === "A1").sets, "a swap keeps the slot's sets");
  const ch = pv.dayChanges("tue", v.record);
  assert.deepEqual(ch.map((c) => c.what), ["swap"]);
  assert.match(ch[0].text, / → /);
  // Undo = save back the slots read before the edit: no edit is left (a tombstone).
  model.savePlanDay("tue", before);
  const back = pv.viewDay(model.doc(), "tue", 3);
  assert.equal(back.edited, false);
  assert.deepEqual(back.slots, daySets("tue", 3));
  assert.deepEqual(pv.dayChanges("tue", back.record), []);
});

test("W2-2 remove and add: the changes list is worked out from the slots, so it is right after Undo too", () => {
  const { model } = setup();
  model.removePlanSlot("tue", "A1");
  const afterRemove = model.effectivePlanDay("tue").slots;
  model.addPlanSlot("tue", "calf_raise_standing");
  let ch = pv.dayChanges("tue", pv.editOf(model.doc(), "tue"));
  assert.deepEqual(ch.map((c) => c.what), ["remove", "add"]);
  assert.equal(ch[0].text, `Removed: ${pv.exName(tueA1())}`);
  assert.equal(ch[1].text, "Added: Standing calf raise");
  // Undo the add only.
  model.savePlanDay("tue", afterRemove);
  ch = pv.dayChanges("tue", pv.editOf(model.doc(), "tue"));
  assert.deepEqual(ch.map((c) => c.what), ["remove"]);
});

test("W2-3 Back to the plan's day, then Undo: the edited day comes back whole", () => {
  const { model } = setup();
  model.swapPlanSlot("tue", "A1", "goblet_squat");
  model.addPlanSlot("tue", "cable_curl");
  const mine = model.effectivePlanDay("tue").slots;
  const list = pv.dayChanges("tue", pv.editOf(model.doc(), "tue")).map((c) => c.text);
  assert.equal(list.length, 2, "the confirm sheet lists every change that goes away");
  model.resetPlanDay("tue");
  assert.equal(pv.viewDay(model.doc(), "tue", 3).edited, false);
  assert.equal(pv.editOf(model.doc(), "tue").deleted, true, "a tombstone, so the reset syncs");
  model.savePlanDay("tue", mine);
  const v = pv.viewDay(model.doc(), "tue", 3);
  assert.equal(v.edited, true);
  assert.deepEqual(pv.dayChanges("tue", v.record).map((c) => c.text), list);
});

test("W2-4 at most 2 added exercises a day: the Add sheet counts down and the model refuses a third", () => {
  const { model } = setup();
  assert.equal(pv.addSheet(model.doc(), "tue", 3, {}).left, 2);
  model.addPlanSlot("tue", "cable_curl");
  assert.equal(pv.addSheet(model.doc(), "tue", 3, {}).left, 1);
  model.addPlanSlot("tue", "calf_raise_standing");
  assert.equal(pv.addSheet(model.doc(), "tue", 3, {}).left, 0);
  assert.throws(() => model.addPlanSlot("tue", "hammer_curl"), /At most 2/);
});

test("W2-5 never the same exercise twice in a day: Swap and Add never offer one already in the day", () => {
  const { model } = setup();
  for (const d of DAY_IDS) {
    const inDay = new Set(days[d].slots.map((s) => s.ex));
    for (const s of days[d].slots) {
      const sh = pv.swapSheet(model.doc(), d, s.slot, { extra_machines: { lat_pulldown: true, seated_row: true, leg_curl: true, calf_raise: true } });
      for (const x of sh.same) assert.ok(!inDay.has(x.id), `${d} ${s.slot}: ${x.id} is already in the day`);
      for (const g of sh.others) for (const id of g.items) assert.ok(!inDay.has(id), `${d} ${s.slot}: other muscles offer ${id}`);
    }
    for (const g of pv.addSheet(model.doc(), d, 3, {}).groups) for (const id of g.items) assert.ok(!inDay.has(id), `${d}: Add offers ${id}`);
  }
});

test("W2-6 Swap sheet: the plan's own swaps are always offered and marked; 'Already in' names, never offers", () => {
  const { model } = setup();
  const sh = pv.swapSheet(model.doc(), "tue", "A1", {});
  assert.equal(sh.current, "leg_press");
  assert.equal(sh.muscle, "front thighs");
  assert.deepEqual(sh.same[0], { id: "smith_squat", pick: "Plan's pick" });
  assert.ok(sh.already.includes("Leg extension"));
  assert.ok(!sh.same.some((x) => x.id === "leg_extension"));
  // The Romanian deadlift always offers its plan swap (A's hidden-swap bug, mock-up note).
  const rdlDay = DAY_IDS.find((d) => days[d].slots.some((s) => s.ex === "romanian_deadlift"));
  const rdlSlot = days[rdlDay].slots.find((s) => s.ex === "romanian_deadlift").slot;
  const rdl = pv.swapSheet(model.doc(), rdlDay, rdlSlot, {});
  assert.ok(rdl.same.some((x) => x.id === "cable_pull_through" && x.pick === "Plan's pick"));
  // After a swap, the plan's own exercise for that place is offered back as a Plan's pick.
  model.swapPlanSlot("tue", "A1", "goblet_squat");
  const again = pv.swapSheet(model.doc(), "tue", "A1", {});
  assert.ok(again.same.some((x) => x.id === "leg_press" && x.pick === "Plan's pick"));
});

test("W2-7 machines the first visit has not found are hidden, with their names for the one line; shown once found", () => {
  const { model } = setup();
  const sh = pv.addSheet(model.doc(), "tue", 3, {});
  const calves = sh.groups.find((g) => g.id === "calves");
  assert.ok(!calves.items.includes("calf_raise_machine"));
  assert.deepEqual(calves.hidden, ["Calf raise machine"]);
  const found = pv.addSheet(model.doc(), "tue", 3, { extra_machines: { calf_raise: true } }).groups.find((g) => g.id === "calves");
  assert.ok(found.items.includes("calf_raise_machine"));
  assert.deepEqual(found.hidden, []);
  assert.equal(pv.machineFound("calf_raise_machine", { extra_machines: { calf_raise: false } }), false);
});

test("W2-8 Add sheet words: 3 sets in a normal week, 2 in week 1 and weeks 7 to 11 (the D rule), 60 s, about 8 minutes", () => {
  const doc = validDoc();
  assert.equal(pv.addSheet(doc, "tue", 3, {}).setsThisWeek, 3);
  assert.equal(pv.addSheet(doc, "tue", 1, {}).setsThisWeek, 2);
  assert.equal(pv.addSheet(doc, "tue", 8, {}).setsThisWeek, 2);
  const s = pv.addSheet(doc, "tue", 3, {});
  assert.equal(s.setsNormal, 3);
  assert.equal(s.rest, 60);
  assert.equal(s.minutes, 8);
});

test("W2-9 minutes: a swap keeps the plan's minutes, an added exercise adds about 8, a removed one takes its sets off", () => {
  const { model } = setup();
  model.swapPlanSlot("tue", "A1", "goblet_squat");
  assert.equal(pv.editedMinutes(90, "tue", 3, pv.editOf(model.doc(), "tue")), 90);
  model.addPlanSlot("tue", "cable_curl");
  assert.equal(pv.editedMinutes(90, "tue", 3, pv.editOf(model.doc(), "tue")), 98);
  assert.equal(pv.editedMinutes(90, "tue", 3, null), 90);
});

test("W2-10 headers: an added exercise and a pair exercise left alone are 'On its own', never 'Abs'", () => {
  const { model } = setup();
  model.removePlanSlot("tue", "A1");
  model.addPlanSlot("tue", "cable_curl");
  const units = pv.unitsIn(pv.viewDay(model.doc(), "tue", 3).slots);
  const lone = units.find((u) => u.slots[0].slot === "A2");
  const added = units.find((u) => u.slots[0].slot === "E1");
  assert.match(lone.title, /^On its own · rest \d+ s between sets$/);
  assert.equal(added.title, "Added by you · on its own · rest 60 s between sets");
  for (const u of units) if (u.type === "pair") assert.match(u.title, /^Pair [A-C] · back and forth/);
  const slots = pv.viewDay(model.doc(), "tue", 3).slots;
  assert.equal(pv.roleIn(slots, "E1"), "Added by you · on its own");
  assert.equal(pv.roleIn(slots, "A2"), "On its own");
  assert.equal(pv.restIn(slots, slots.find((s) => s.slot === "A2")).note, "between sets");
});

test("W2-11 'Day so far' of an edited day uses the edited slots; on the plan's day it equals planpage.daySoFar", () => {
  for (const d of DAY_IDS) for (const s of days[d].slots) {
    const a = pv.soFarIn(daySets(d, 3), s.slot);
    const b = daySoFar(d, 3, s.slot);
    assert.deepEqual(a, b, `${d} ${s.slot}`);
  }
  const { model } = setup();
  model.addPlanSlot("tue", "calf_raise_standing");
  const slots = pv.viewDay(model.doc(), "tue", 3).slots;
  const last = pv.soFarIn(slots, "E1");
  assert.equal(last.position, slots.length);
  assert.ok(last.direct.calves >= 3);
  assert.equal(pv.neighboursIn(slots, "E1").next, null);
  assert.equal(pv.neighboursIn(slots, "E1").prev.slot, slots[slots.length - 2].slot);
});

test("W2-12 a running or past workout never changes when the day is edited from the Plan tab", () => {
  const { model } = setup();
  const s = model.startSession({ planDay: "tue", week: 3, kind: "full" });
  const id = (s.sessions ?? model.doc().sessions).find((x) => x.plan_day === "tue").id;
  const before = copy(planForSession(model.doc().sessions.find((x) => x.id === id)));
  model.swapPlanSlot("tue", "A1", "goblet_squat");
  model.addPlanSlot("tue", "cable_curl");
  const after = planForSession(model.doc().sessions.find((x) => x.id === id));
  assert.deepEqual(after, before);
});

test("W2-13 a day saved by a newer app is shown as the plan and cannot be edited from here", () => {
  const doc = validDoc();
  doc.plan_days = [{ id: "p-plan-v2-tue", updated_at: T, plan_id: "plan-v2", day: "tue", slots: [{ slot: "Z9", ex: "leg_press", sets: 3, rest: 60 }] }];
  const { model } = setup(doc);
  const v = pv.viewDay(model.doc(), "tue", 3);
  assert.equal(v.newerVersion, true);
  assert.equal(v.edited, false);
  assert.deepEqual(v.slots, daySets("tue", 3));
  assert.throws(() => model.swapPlanSlot("tue", "A1", "goblet_squat"));
  assert.equal(model.doc().plan_days[0].slots[0].slot, "Z9", "the newer record is kept as it was");
});

// ---------- whole-plan muscle check ----------

test("W2-14 the check's numbers come from setsByMuscle over the 5 days, the same function as 'Day so far'", () => {
  const doc = validDoc();
  for (const week of [1, 2, 6, 7, 12]) {
    const m = pv.weekMuscles(doc, week);
    const direct = {};
    for (const d of DAY_IDS) for (const [g, n] of Object.entries(setsByMuscle(daySlots(d, week)).direct)) direct[g] = (direct[g] ?? 0) + n;
    assert.deepEqual(m.direct, direct, `week ${week}`);
    // The day's last "Day so far" adds up to the day's part of the week.
    const fri = days.fri.slots;
    assert.deepEqual(daySoFar("fri", week, fri[fri.length - 1].slot).direct, setsByMuscle(daySlots("fri", week)).direct);
  }
});

test("W2-15 check rows: shoulders = its 3 parts; back = lats + mid back; part rows have no 'with helpers' number", () => {
  const rows = pv.checkRows(validDoc(), 2);
  const by = Object.fromEntries(rows.map((r) => [r.id, r]));
  assert.equal(by.shoulders.direct, by.front_delts.direct + by.side_delts.direct + by.rear_delts.direct);
  const m = pv.weekMuscles(validDoc(), 2);
  assert.equal(by.back.direct, (m.direct.lats ?? 0) + (m.direct.mid_back ?? 0));
  for (const id of ["front_delts", "side_delts", "rear_delts"]) {
    assert.equal(by[id].part, true);
    assert.equal(by[id].weighted, null);
    assert.equal(by[id].verdict.text, "Part of shoulders");
  }
  assert.equal(by.lower_back.verdict.flag, null, "lower back never warns");
  assert.deepEqual(rows.map((r) => r.name).slice(0, 3), ["Chest", "Back (lats, middle back)", "Shoulders (all)"]);
});

test("W2-16 bands (mock-up): 10-20 in range, over 20 a lot, helper-only 10+ grey, 5-9 low, under 5 low, 1 day only low", () => {
  assert.deepEqual(pv.verdict(12, 15, 3), { text: "In range", cls: "ok", flag: null });
  assert.deepEqual(pv.verdict(27, 27, 5), { text: "More than 20: more than needed", cls: "lo", flag: "a lot" });
  assert.deepEqual(pv.verdict(5, 11, 2), { text: "Under 10 direct; 10+ counting helpers", cls: "n", flag: null });
  assert.deepEqual(pv.verdict(9, 9, 3), { text: "Under 10", cls: "lo", flag: "low" });
  assert.deepEqual(pv.verdict(3, 4, 2), { text: "Under 5", cls: "lo", flag: "low" });
  assert.deepEqual(pv.verdict(3, 12, 1), { text: "Under 10 direct; 10+ counting helpers · only 1 day", cls: "lo", flag: "low" });
  assert.deepEqual(pv.verdict(0, 4.5, 0, { noWarning: true }).flag, null);
});

test("W2-17 'things stand out' lists the flagged rows with their days; an Add for a low muscle shows in the check at once", () => {
  const { model } = setup();
  let rows = pv.checkRows(model.doc(), 2);
  const chest = rows.find((r) => r.id === "chest");
  assert.equal(chest.verdict.flag, "low");
  const so = pv.standOut(rows);
  assert.ok(so.some((x) => x.name === "Chest" && /^\d+ direct sets on Mon, Wed, Thu$/.test(x.text)));
  assert.ok(pv.lowGroups(model.doc(), 2).includes("chest"));
  assert.equal(pv.addSheet(model.doc(), "tue", 2, {}).groups.find((g) => g.id === "chest").low, true);
  model.addPlanSlot("tue", "db_bench_press");
  rows = pv.checkRows(model.doc(), 2);
  assert.equal(rows.find((r) => r.id === "chest").direct, chest.direct + 3);
});

test("W2-18 week chips: 5 chips; each plan week maps to its chip; map levels use the 3 steps", () => {
  assert.deepEqual(pv.CHECK_WEEKS.map((c) => c.label), ["Week 1", "Weeks 2–5", "Week 6", "Weeks 7–11", "Week 12"]);
  const want = { 1: "w1", 2: "w2", 5: "w2", 6: "w6", 7: "w7", 11: "w7", 12: "w12" };
  for (const [w, id] of Object.entries(want)) assert.equal(pv.checkChipFor(Number(w)), id);
  const lv = pv.checkLevels(validDoc(), 2);
  for (const v of Object.values(lv)) assert.ok([1, 2, 3].includes(v));
  assert.match(pv.checkSub(2), /\. Sets a week, Monday to Friday\.$/);
});

test("W2-19 the 12 weeks list says 'Sets as shown on each day', not 'As in the tables' (answer 85 a)", async () => {
  const { readFile } = await import("node:fs/promises");
  const src = await readFile(new URL("../app/js/ui/planday.js", import.meta.url), "utf8");
  assert.ok(!src.includes("As in the tables"));
  assert.ok(src.includes("Sets as shown on each day"));
});

test("W2-20 no innerHTML and no style attribute in the new screen files", async () => {
  const { readFile } = await import("node:fs/promises");
  for (const f of ["planview.js", "ui/planday.js", "ui/exlayer.js", "ui/planedit.js", "ui/musclecheck.js"]) {
    let src;
    try { src = await readFile(new URL(`../app/js/${f}`, import.meta.url), "utf8"); } catch { assert.fail(`${f} is missing`); }
    assert.ok(!/\.(innerHTML|outerHTML)|insertAdjacentHTML\s*\(/.test(src), `${f} uses innerHTML`);
    assert.ok(!/setAttribute\(\s*["']style["']/.test(src) && !/\bstyle\s*:\s*["'`{]/.test(src), `${f} sets a style attribute`);
  }
});

test("W2-21 the 'Whole plan check' card opens the muscle check: no local go() hides the router's go (auditor M1)", async () => {
  const { readFile } = await import("node:fs/promises");
  const src = await readFile(new URL("../app/js/ui/planday.js", import.meta.url), "utf8");
  assert.ok(!/\bconst go\s*=/.test(src), "planday.js declares its own go()");
  assert.match(src, /import \{[^}]*\bgo\b[^}]*\} from "\.\/app\.js"/);
  assert.match(src, /go\("#\/plan\/muscles"\)/);
});
