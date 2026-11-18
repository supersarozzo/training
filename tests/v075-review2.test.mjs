// Version 0.7.5 (worker 8.42): review round 2 (food F1, F2 and the round-1 fixes). Both reviewers found their planted
// mistake (checker: the Save error moved under the details; auditor: any save answered the D18 card). Written BEFORE the
// fixes (tests first). All foods and values are made up.
// - V1-V3 (checker major and minors): weight labels are never read as pieces ("30 g serving", "30 gr", "8 fl. oz");
//   better single words ("2 slices of bread" -> "slice of bread", "2 x biscuits" -> "biscuit", "2 brioches" -> "brioche").
// - V4-V6: the D18 card is answered only by Rosario (a Remove, a freed place or a machine offer's Use it never answers it).
// - V7: "Use this weight" with the weight left as shown changes nothing (auditor).
// - V8: the Save error stays next to the Save buttons (just above them, as in 0.7.4), before "Food details" (the checker's
//   plant test gap: an error under the details is off screen).
// - V9: when the numbers check fails, one warning line shows above the Save buttons (auditor risk note on F2).
import test from "node:test";
import assert from "node:assert/strict";
import { install, byText } from "./fixtures/sheet-dom.mjs";
import * as fmath from "../app/js/food/foodmath.js";

const { body } = install();
globalThis.location.hash = "#/plan";
globalThis.requestAnimationFrame = () => 0;
const { store, model } = await import("../app/js/ui/app.js");
const { validDoc } = await import("./fixtures/profiles.mjs");
const { days } = await import("../app/js/plan/plan-v2.js");
const { renderPlan, resetPlanPage } = await import("../app/js/ui/planday.js");
const { readOfferAnswers } = await import("../app/js/prefs.js");
const planedit = await import("../app/js/ui/planedit.js");
const S = await import("../app/js/diet/sheets.js");
const { food: fm } = await import("../app/js/diet/foodapp.js");

// ---------- F1: labels ----------

test("V1 weight and volume labels stay as before: the whole serving is 1 piece", () => {
  for (const [label, g] of [["30 g serving", 30], ["25 g bag", 25], ["30 gr", 30], ["30 gm", 30], ["30 gms", 30], ["50 g.", 50], ["40 grammes", 40], ["12 fl oz (355 ml)", 355], ["8 fl. oz", 240], ["2 pints", 1136], ["1 teaspoon", 5]]) {
    assert.deepEqual(fmath.pieceOf({ serving_g: g, serving_label: label }), { g, label }, label);
  }
  assert.equal(fmath.withPieceWeight({ serving_g: 30, serving_label: "30 g serving" }, 28).serving_label, "piece", "a typed weight never keeps a broken name");
});

test("V2 single words: 'of' phrases, '2 x', and words the simple rules got wrong", () => {
  const unit = (label) => fmath.pieceOf({ serving_g: 60, serving_label: label }).label;
  assert.equal(unit("2 slices of bread"), "slice of bread");
  assert.equal(unit("2 rashers of bacon"), "rasher of bacon");
  assert.equal(unit("2 x biscuits"), "biscuit");
  assert.equal(unit("2 brioches"), "brioche");
  assert.equal(unit("2 quiches"), "quiche");
  assert.equal(unit("2 smoothies"), "smoothie");
  assert.equal(unit("2 loaves"), "loaf");
  for (const [label, one] of [["2 sandwiches", "sandwich"], ["2 patties", "patty"], ["2 cookies", "cookie"], ["2 brownies", "brownie"], ["2 potatoes", "potato"], ["4 bites", "bite"], ["2 eggs", "egg"], ["about 2 hash browns", "hash brown"], ["2 slices", "slice"], ["2 pieces", "piece"], ["2 boxes", "box"]]) {
    assert.equal(unit(label), one, label);
  }
  assert.equal(fmath.pieceWords(fmath.pieceOf({ serving_g: 60, serving_label: "2 slices of bread" })), "1 slice of bread = 30 g");
});

test("V3 the maths stays right for these labels", () => {
  assert.deepEqual(fmath.pieceOf({ serving_g: 60, serving_label: "2 x biscuits" }), { g: 30, label: "biscuit" });
  assert.deepEqual(fmath.pieceOf({ serving_g: 90, serving_label: "2 x 45 g" }), { g: 90, label: "2 x 45 g" }, "a weight inside: as before");
});

// ---------- the D18 card is answered only by Rosario ----------

const NONE = { lat_pulldown: null, seated_row: null, leg_curl: null, pec_deck: null, calf_raise: null, ab_crunch: null };
const OLD_TUE = [["A1", "leg_press", 4, null], ["A2", "cable_crunch", 3, 90], ["B1", "romanian_deadlift", 3, null], ["B2", "face_pull", 3, 90], ["C1", "hip_thrust", 3, null], ["C2", "dead_bug", 3, 75], ["D", "leg_extension", 3, 60]];
function freshOldTuesday(rows = OLD_TUE, machines = {}) {
  const doc = validDoc();
  doc.shared_settings.extra_machines = { ...NONE, ...machines };
  doc.plan_days = [{ id: "p-plan-v2-tue", updated_at: "2026-02-01T10:00:00.000Z", plan_id: "plan-v2", day: "tue", slots: rows.map(([slot, ex, sets, rest]) => ({ slot, ex, sets, rest })) }];
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
const d18Cards = (p) => p.querySelectorAll(".card").filter((c) => c.textContent.startsWith("The plan now uses simpler machines"));
const unanswered = () => !Object.hasOwn(readOfferAnswers(store), "tue:D18:plan");

test("V4 removing an exercise from an edited 0.7.4 Tuesday does not answer the D18 card", () => {
  freshOldTuesday();
  assert.equal(d18Cards(openDay("tue")).length, 1);
  planedit.removeSlot("tue", "D");
  assert.ok(unanswered(), "still unanswered");
  assert.equal(d18Cards(openDay("tue")).length, 1, "the card is still there");
});

test("V5 removing an added plank (which frees Tuesday C2 for the plank) does not answer the D18 card", () => {
  freshOldTuesday([...OLD_TUE, ["E1", "plank", 3, 60]]);
  assert.deepEqual(d18Cards(openDay("tue")).length, 1);
  planedit.removeSlot("tue", "E1");
  assert.ok(unanswered());
  assert.equal(d18Cards(openDay("tue")).length, 1);
});

test("V6 a machine offer's Use it on an edited 0.7.4 Tuesday does not answer the D18 card", () => {
  freshOldTuesday(OLD_TUE, { pec_deck: true });
  const p = openDay("tue");
  const card = p.querySelectorAll(".card").find((c) => /^The gym has a pec deck/.test(c.textContent));
  assert.ok(card);
  card.querySelectorAll("button").find((b) => b.textContent.trim() === "Use it").click();
  assert.equal(model.effectivePlanDay("tue").slots.find((s) => s.slot === "B2").ex, "reverse_pec_deck");
  assert.ok(unanswered());
  assert.equal(d18Cards(openDay("tue")).length, 1);
});

// ---------- the food sheet ----------

const sheet = () => body.querySelector("[data-sheet]");
const tap = (text) => byText(sheet(), "button", text).click();
const closeAll = () => { while (sheet()) { const c = byText(sheet(), "button", "Close"); if (!c) break; c.click(); sheet()?.remove(); } };
const per100g = { kcal: 170, protein_g: 14, carbs_g: 8, fat_g: 9 };

test("V7 'Use this weight' with the weight left as shown changes nothing on the food", () => {
  const food = fm.saveFood({ name: "Test bites V7", per100g, serving_g: 125, serving_label: "4 bites", source: "own" });
  S.openCheck({ mode: "saved", food });
  tap("Pieces");
  tap("· Change");
  assert.equal(sheet().querySelector('[aria-label="Weight of 1 piece"]').value, "31.3");
  tap("Use this weight");
  tap("Save without adding");
  const saved = fm.doc().foods.find((f) => f.id === food.id);
  assert.deepEqual([saved.serving_g, saved.serving_label], [125, "4 bites"]);
  closeAll();
});

function indexIn(n) { return [...sheet().walk()].indexOf(n); }
test("V8 the Save error sits next to the Save buttons (after Meal), before 'Food details'", () => {
  const food = fm.saveFood({ name: "Test bites V8", per100g, serving_g: 125, serving_label: "4 bites", source: "own" });
  S.openCheck({ mode: "saved", food });
  sheet().querySelector('[aria-label="Calories (kcal)"]').input("");
  tap("Save without adding");
  const err = sheet().querySelectorAll("p").find((p) => p.getAttribute("role") === "alert" && p.textContent.trim() !== "");
  assert.ok(err, "an error is shown");
  const details = sheet().querySelectorAll("h3").find((n) => n.textContent === "Food details");
  assert.ok(indexIn(err) < indexIn(details), "error before the details");
  const meal = sheet().querySelectorAll("div").find((n) => n.textContent === "Meal" && n.classList.contains("label"));
  assert.ok(indexIn(err) > indexIn(meal), "error after Meal, next to the buttons");
  closeAll();
});

test("V9 a scanned food whose numbers look wrong: one warning line above the Save buttons; none when they add up", () => {
  const bad = { name: "Test bad product", brand: "Test brand", barcode: "5000000000012", per100g: { kcal: 950, protein_g: 80, carbs_g: 80, fat_g: 80 }, serving_g: 30, serving_label: "1 bar (30 g)", source: "off", off_fetched_at: "2026-11-18T10:00:00.000Z" };
  S.openCheck({ mode: "off", product: bad });
  const warn = sheet().querySelectorAll("p").find((p) => p.textContent === "The numbers look wrong. Check them under Food details.");
  assert.ok(warn, "warning line shown");
  assert.ok(indexIn(warn) < indexIn(sheet().querySelector(".btn-main")), "above Save");
  closeAll();
  S.openCheck({ mode: "off", product: { ...bad, per100g } });
  assert.equal(sheet().querySelectorAll("p").filter((p) => p.textContent === "The numbers look wrong. Check them under Food details.").length, 0);
  closeAll();
});

// ---------- round 3 (both reviewers, minor): a place Rosario just put back is never offered back ----------

test("V10 an old Tuesday whose card shows A2 and C2: Rosario swaps C1 back to the hip thrust; the card keeps A2 and C2 only", () => {
  freshOldTuesday(OLD_TUE.map((r) => (r[0] === "C1" ? ["C1", "db_glute_bridge", 3, null] : r)));
  assert.equal(d18Cards(openDay("tue")).length, 1);
  planedit.openSwapSheet("tue", 3, "C1");
  const sh = body.querySelector("[data-sheet]");
  sh.querySelectorAll("button").find((b) => /^Swap Dumbbell glute bridge for Hip thrust(\.| \()/.test(b.getAttribute("aria-label") ?? "")).click();
  assert.equal(model.effectivePlanDay("tue").slots.find((s) => s.slot === "C1").ex, "hip_thrust");
  const card = d18Cards(openDay("tue"))[0];
  assert.ok(card, "the card still offers the other places");
  assert.doesNotMatch(card.textContent, /Hip thrust → Hip thrust machine/);
  assert.match(card.textContent, /Cable crunch → Crunch with a dumbbell/);
  assert.ok(unanswered(), "the card itself is not answered");
});

test("V11 'Gramm' and kJ labels are weights or energy, not pieces", () => {
  for (const [label, g] of [["30 Gramm", 30], ["500 kJ", 30]]) assert.deepEqual(fmath.pieceOf({ serving_g: g, serving_label: label }), { g, label }, label);
});
