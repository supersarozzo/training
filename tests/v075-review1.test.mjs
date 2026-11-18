// Version 0.7.5 (worker 8.42): review round 1. The checker and the auditor (independent Opus reviewers) each found their
// planted mistake and listed minor problems. Written BEFORE the fixes (tests first). All values are made up.
// - R1, R2: the test gaps their plants showed (an offer for a machine already in the day; the LAST log of the old move).
// - R3, R4: an offer card tapped after the day changed underneath it (a sync) must not replace a different exercise.
// - R5: a full phone must not break the Keep / Use it answer.
// - R6-R8: counts that still bypassed words.js ("1 rounds", "1 reps", "1 direct sets").
// - R9: a hold's Save re-check says seconds, never reps.
// - R10: week 1 says where a converted first weight came from.
// - R11: the D18 card does not come back to undo a choice Rosario just made on 0.7.5.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { install } from "./fixtures/sheet-dom.mjs";

const { body } = install();
globalThis.location.hash = "#/plan";
globalThis.requestAnimationFrame = () => 0;
const { store, model } = await import("../app/js/ui/app.js");
const { validDoc } = await import("./fixtures/profiles.mjs");
const { days, exercises } = await import("../app/js/plan/plan-v2.js");
const { renderPlan, resetPlanPage } = await import("../app/js/ui/planday.js");
const { machineOffers, withSwap } = await import("../app/js/engine/planedits.js");
const { fromReplaced, suggestFor, targetText } = await import("../app/js/engine/workout.js");
const { saveOfferAnswer } = await import("../app/js/prefs.js");
const { unitHeader } = await import("../app/js/engine/planpage.js");
const { standOut } = await import("../app/js/planview.js");
const { doseParts } = await import("../app/js/ui/exlayer.js");
const planedit = await import("../app/js/ui/planedit.js");

const NONE = { lat_pulldown: null, seated_row: null, leg_curl: null, pec_deck: null, calf_raise: null, ab_crunch: null };
function fresh(machines = {}) {
  const doc = validDoc();
  doc.shared_settings.extra_machines = { ...NONE, ...machines };
  store.save(doc);
  store.saveDevice({ token: "made-up" });
  for (const s of body.querySelectorAll("[data-sheet]")) s.remove();
  for (const t of body.querySelectorAll(".toast")) t.remove();
}
const page = () => { const r = renderPlan(); return Array.isArray(r) ? r[0] : r; };
function openDay(day) {
  resetPlanPage();
  page().querySelectorAll("button").find((b) => (b.getAttribute("aria-label") ?? "").startsWith(days[day].name)).click();
  return page();
}
const button = (root, text) => root.querySelectorAll("button").find((b) => b.textContent.trim() === text);
const cardsStarting = (p, re) => p.querySelectorAll(".card").filter((c) => re.test(c.textContent));
const toasts = () => body.querySelectorAll(".toast").map((t) => t.textContent);
const exOf = (day, slot) => model.effectivePlanDay(day).slots.find((s) => s.slot === slot);
const rec = (day, rows) => ({ id: `p-plan-v2-${day}`, updated_at: "2026-02-01T10:00:00.000Z", plan_id: "plan-v2", day, slots: rows });
const OLD_TUE = [["A1", "leg_press", 4, null], ["A2", "cable_crunch", 3, 90], ["B1", "romanian_deadlift", 3, null], ["B2", "face_pull", 3, 90], ["C1", "hip_thrust", 3, null], ["C2", "dead_bug", 3, 75], ["D", "leg_extension", 3, 60]]
  .map(([slot, ex, sets, rest]) => ({ slot, ex, sets, rest }));

// ---------- the plants' test gaps ----------

test("R1 no machine offer when the machine exercise is already in the day (an added leg curl machine on Thursday)", () => {
  const thu = rec("thu", [...days.thu.slots.map((s) => ({ ...s })), { slot: "E1", ex: "leg_curl_machine", sets: 3, rest: 60 }]);
  assert.deepEqual(machineOffers("thu", thu, { extra_machines: { leg_curl: true } }, {}), []);
});

test("R2 the converted first weight comes from the LAST log of the old exercise (20, then 30, then 50 kg)", () => {
  const w = (n, kg) => ({ n, type: "work", weight_kg: kg, reps: 10, seconds: null, rir: 2, done_at: "2026-02-03T09:00:00.000Z" });
  const tue = (date, kg) => ({
    id: `s-${date.replaceAll("-", "")}-t1`, updated_at: `${date}T10:00:00.000Z`, date, plan_day: "tue", week: 3, kind: "full",
    swapped_from: null, status: "finished", started_at: `${date}T08:00:00.000Z`, finished_at: `${date}T10:00:00.000Z`, walk: null,
    exercises: [{ slot: "C1", plan_exercise: "hip_thrust", done_exercise: "hip_thrust", swap_reason: null, sets: [w(1, kg), w(2, kg), w(3, kg)], note: "", planned_sets: 3, planned_rest: null }],
  });
  const three = validDoc(); three.sessions = [tue("2026-02-03", 20), tue("2026-02-10", 30), tue("2026-02-17", 50)];
  const last = validDoc(); last.sessions = [tue("2026-02-17", 50)];
  const first = validDoc(); first.sessions = [tue("2026-02-03", 20)];
  assert.equal(fromReplaced(three, "booty_builder_hip_thrust").weight_kg, fromReplaced(last, "booty_builder_hip_thrust").weight_kg);
  assert.notEqual(fromReplaced(three, "booty_builder_hip_thrust").weight_kg, fromReplaced(first, "booty_builder_hip_thrust").weight_kg);
  assert.equal(suggestFor(three, "booty_builder_hip_thrust", { week: 4, missed: null }).weight_kg, fromReplaced(last, "booty_builder_hip_thrust").weight_kg);
});

// ---------- a card tapped after the day changed underneath it ----------

test("R3 a machine offer tapped after a sync changed that place: nothing is replaced, a plain toast, the card goes", () => {
  fresh({ leg_curl: true });
  const card = cardsStarting(openDay("thu"), /^The gym has a leg curl machine/)[0];
  assert.ok(card);
  model.savePlanDay("thu", withSwap(model.effectivePlanDay("thu").slots, "D", "cable_leg_curl")); // the other phone's edit arrives
  button(card, "Use it").click();
  assert.equal(exOf("thu", "D").ex, "cable_leg_curl", "Rosario's other choice is not replaced");
  assert.ok(toasts().some((t) => /Thursday changed/.test(t)), toasts().join(" | "));
  assert.equal(cardsStarting(page(), /^The gym has a leg curl machine/).length, 0);
});

test("R4 the D18 card tapped after a sync changed one place: only the places that still hold the old exercise change", () => {
  fresh();
  const doc = store.load(); doc.plan_days = [rec("tue", OLD_TUE.map((s) => ({ ...s })))]; store.save(doc);
  const card = cardsStarting(openDay("tue"), /^The plan now uses simpler machines/)[0];
  assert.ok(card);
  model.savePlanDay("tue", withSwap(model.effectivePlanDay("tue").slots, "C1", "db_glute_bridge"));
  button(card, "Use them").click();
  const eff = model.effectivePlanDay("tue").slots;
  assert.deepEqual(eff.map((s) => [s.slot, s.ex, s.sets]), [
    ["A1", "leg_press", 4], ["A2", "weighted_crunch", 3], ["B1", "romanian_deadlift", 3], ["B2", "face_pull", 3],
    ["C1", "db_glute_bridge", 3], ["C2", "plank", 3], ["D", "leg_extension", 3],
  ]);
});

test("R5 a full phone: the offer answer fails quietly (the tap still works), nothing thrown", () => {
  const full = { loadDevice: () => ({ token: "made-up" }), saveDevice: () => { const e = new Error("full"); e.name = "QuotaExceededError"; throw e; } };
  assert.doesNotThrow(() => saveOfferAnswer(full, "tue:A2:ab_crunch_machine", "kept"));
  fresh({ ab_crunch: true });
  const real = store.saveDevice;
  store.saveDevice = full.saveDevice;
  try {
    const card = cardsStarting(openDay("tue"), /^The gym has an ab crunch machine/)[0];
    assert.doesNotThrow(() => button(card, "Keep").click());
  } finally { store.saveDevice = real; }
});

// ---------- counts in words ----------

test("R6 a pair of 1 round says '1 round' (Wednesday's pair C in an easier week)", () => {
  assert.equal(unitHeader({ type: "pair", id: "C", slots: [{ sets: 1, rest: null }, { sets: 1, rest: 60 }] }), "Pair C · back and forth · 1 round · rest 60 s after each round");
  assert.equal(unitHeader({ type: "pair", id: "C", slots: [{ sets: 2, rest: null }, { sets: 2, rest: 60 }] }), "Pair C · back and forth · 2 rounds · rest 60 s after each round");
});

test("R7 a reps range of exactly 1 says '1 rep'", () => {
  assert.equal(targetText("leg_press", 3, 2, [1, 1]), "3 sets · 1 rep · stop with 2 left");
  const text = (parts) => parts.map((p) => (typeof p === "string" ? p : p.textContent)).join("");
  assert.equal(text(doseParts(exercises.leg_press, 3, [1, 1])), "3 sets × 1 rep");
  assert.equal(text(doseParts(exercises.leg_press, 1, [8, 12])), "1 set × 8–12 reps");
});

test("R8 the muscle check says '1 direct set'", () => {
  const rows = [{ id: "calves", name: "Calves", part: false, verdict: { flag: "low", text: "low" }, direct: 1, weighted: null, dayList: [] }];
  assert.equal(standOut(rows)[0].text, "1 direct set");
  const src = readFileSync(new URL("../app/js/ui/musclecheck.js", import.meta.url), "utf8");
  assert.doesNotMatch(src, /\)\} direct sets/, "rowLabel uses setWord");
});

// ---------- a hold's Save re-check; week 1's converted weight; the D18 card after a choice ----------

test("R9 a plank's Change sheet: Save while a workout started meanwhile says seconds, not reps", () => {
  fresh();
  planedit.openDoseSheet("tue", 3, "C2");
  const sh = body.querySelector("[data-sheet]");
  const doc = store.load();
  doc.sessions.push({ id: "s-x", updated_at: "2026-02-01T10:00:00.000Z", date: "2026-02-01", plan_day: "mon", week: 3, kind: "full", status: "in_progress", exercises: [] });
  store.save(doc);
  button(sh, "Save").click();
  const t = toasts().join(" | ");
  assert.match(t, /Sets and seconds can be changed after the workout ends/);
  assert.doesNotMatch(t, /reps/);
});

test("R10 week 1: a converted first weight says where it came from, not 'First try'", () => {
  const src = readFileSync(new URL("../app/js/ui/week1.js", import.meta.url), "utf8");
  assert.match(src, /sg\?\.action === "first_try" && !sg\.from/, "week 1 keeps the converted weight's own note");
  const doc = validDoc();
  doc.sessions = [{
    id: "s-20260203-t1", updated_at: "2026-02-03T10:00:00.000Z", date: "2026-02-03", plan_day: "tue", week: 3, kind: "full",
    swapped_from: null, status: "finished", started_at: "2026-02-03T08:00:00.000Z", finished_at: "2026-02-03T10:00:00.000Z", walk: null,
    exercises: [{ slot: "C1", plan_exercise: "hip_thrust", done_exercise: "hip_thrust", swap_reason: null, sets: [{ n: 1, type: "work", weight_kg: 40, reps: 10, seconds: null, rir: 2, done_at: "2026-02-03T09:00:00.000Z" }], note: "", planned_sets: 3, planned_rest: null }],
  }];
  const sg = suggestFor(doc, "booty_builder_hip_thrust", { week: 1, missed: null });
  assert.equal(sg.from, "hip_thrust");
  assert.match(sg.note, /^From your hip thrust weight\./);
});

test("R11 Rosario swaps Tuesday C1 back to the hip thrust on 0.7.5: no D18 card offers to undo that choice", () => {
  fresh();
  openDay("tue");
  planedit.openSwapSheet("tue", 3, "C1");
  const sh = body.querySelector("[data-sheet]");
  sh.querySelectorAll("button").find((b) => /^Swap Hip thrust machine for Hip thrust[ .(]/.test(b.getAttribute("aria-label") ?? "")).click();
  assert.equal(exOf("tue", "C1").ex, "hip_thrust");
  assert.equal(cardsStarting(openDay("tue"), /^The plan now uses simpler machines/).length, 0);
});
