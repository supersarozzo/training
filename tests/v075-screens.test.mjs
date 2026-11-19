// Version 0.7.5 (worker 8.42): the screens of trainer decision D18 and the "1 sets" fix. Written before the build.
// - D18-5: after the first-visit check says the gym has a machine, the Plan day offers it once, as a one-tap Plan edit:
//   "The gym has a <machine>. Use it instead of <exercise>?" with Use it and Keep. Nothing changes without Use it.
// - The new first-visit check "Ab crunch machine" in Settings > Gym weights.
// - "1 sets" -> "1 set" everywhere a count meets "sets" or "reps" (Rosario saw "1 sets" on a Plan card).
// Drives the real screens on a fake page (tests/fixtures/sheet-dom.mjs). All values are made up. No body data.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { install } from "./fixtures/sheet-dom.mjs";

const { body } = install();
globalThis.location.hash = "#/plan";
globalThis.requestAnimationFrame = () => 0;
const { store, model } = await import("../app/js/ui/app.js");
const { validDoc } = await import("./fixtures/profiles.mjs");
const { days, exercises, machineOffers: OFFERS } = await import("../app/js/plan/plan-v2.js");
const { renderPlan, resetPlanPage } = await import("../app/js/ui/planday.js");
const { machineOffers } = await import("../app/js/engine/planedits.js");
const { readOfferAnswers } = await import("../app/js/prefs.js");
const { targetText } = await import("../app/js/engine/workout.js");
const { doseWeekWords, setsWords } = await import("../app/js/ui/planedit.js");
const words = await import("../app/js/words.js");

const NONE = { lat_pulldown: null, seated_row: null, leg_curl: null, pec_deck: null, calf_raise: null, ab_crunch: null };
function fresh(machines = {}) {
  const doc = validDoc();
  doc.shared_settings.extra_machines = { ...NONE, ...machines };
  store.save(doc);
  store.saveDevice({});
  for (const s of body.querySelectorAll("[data-sheet]")) s.remove();
  for (const t of body.querySelectorAll(".toast")) t.remove();
}
const page = () => { const r = renderPlan(); return Array.isArray(r) ? r[0] : r; };
function openDay(day) {
  resetPlanPage();
  page().querySelectorAll("button").find((b) => (b.getAttribute("aria-label") ?? "").startsWith(days[day].name)).click();
  return page();
}
const offerCards = (p) => p.querySelectorAll(".card").filter((c) => /^The gym has an? /.test(c.textContent));
const button = (root, text) => root.querySelectorAll("button").find((b) => b.textContent.trim() === text);

// ---------- the offer data and the pure rule ----------

test("O1 the five offers of D18: machine check, the confirmed exercise now, the machine exercise", () => {
  assert.deepEqual(OFFERS.map((o) => [o.machine, o.from, o.to]), [
    ["leg_curl", "db_lying_leg_curl", "leg_curl_machine"],
    ["lat_pulldown", "pulldown", "lat_pulldown_machine"],
    ["seated_row", "seated_cable_row", "seated_row_machine"],
    ["ab_crunch", "weighted_crunch", "ab_crunch_machine"],
    ["pec_deck", "face_pull", "reverse_pec_deck"],
    // D20 (0.7.8): the abs offers on Tuesday and Friday A2 (tests/v078-d20.test.mjs D20-5)
    ["captain_chair", "reverse_crunch", "captain_chair_knee_raise"],
    ["ab_bench", "reverse_crunch", "decline_bench_crunch"],
    ["ab_crunch", "reverse_crunch", "ab_crunch_machine"],
  ]);
});

test("O2 the rule: an offer only when the check says yes, on the days and places D18 names, never answered twice", () => {
  const all = { lat_pulldown: true, seated_row: true, leg_curl: true, pec_deck: true, ab_crunch: true };
  const at = (day, settings, answered) => machineOffers(day, null, { extra_machines: settings }, answered).map((o) => `${o.slot}:${o.to}`);
  assert.deepEqual(at("mon", all), ["A2:lat_pulldown_machine"]);
  assert.deepEqual(at("tue", all), ["A2:ab_crunch_machine", "B2:reverse_pec_deck"]);
  assert.deepEqual(at("wed", all), ["B1:lat_pulldown_machine"]);
  assert.deepEqual(at("thu", all), ["A2:seated_row_machine", "B2:reverse_pec_deck", "D:leg_curl_machine"]);
  assert.deepEqual(at("fri", all), ["A2:ab_crunch_machine"]); // D20 (0.7.8): Friday A2 (reverse crunch) gets the ab crunch offer
  for (const v of [undefined, null, false]) assert.deepEqual(at("thu", { leg_curl: v, seated_row: v, pec_deck: v }), [], `check ${v}`);
  const [first] = machineOffers("thu", null, { extra_machines: all }, {});
  assert.deepEqual(at("thu", all, { [first.key]: "kept" }), ["B2:reverse_pec_deck", "D:leg_curl_machine"], "a Keep is final");
  assert.deepEqual(at("thu", all, { [first.key]: "used" }), ["B2:reverse_pec_deck", "D:leg_curl_machine"], "a Use it is final");
  // A day edited so the place no longer holds the confirmed exercise: no offer there.
  const rec = { id: "p-plan-v2-thu", updated_at: "2026-02-01T10:00:00.000Z", plan_id: "plan-v2", day: "thu",
    slots: days.thu.slots.map((s) => ({ slot: s.slot, ex: s.slot === "D" ? "cable_leg_curl" : s.ex, sets: s.sets, rest: s.rest })) };
  assert.ok(!machineOffers("thu", rec, { extra_machines: all }, {}).some((o) => o.slot === "D"));
  // A day saved by a newer app (not usable here): no offers, the day cannot be edited.
  assert.deepEqual(machineOffers("thu", { ...rec, slots: [{ slot: "Z9", ex: "plank", sets: 1, rest: 30 }] }, { extra_machines: all }, {}), []);
});

// ---------- the offer on the Plan day ----------

test("O3 no check answered (or 'no'): the Plan day shows no offer", () => {
  fresh();
  for (const d of Object.keys(days)) assert.equal(offerCards(openDay(d)).length, 0, d);
  fresh({ leg_curl: false });
  assert.equal(offerCards(openDay("thu")).length, 0);
});

test("O4 the check says yes: the day shows the offer in D18's words, and nothing changed yet", () => {
  fresh({ leg_curl: true });
  const cards = offerCards(openDay("thu"));
  assert.equal(cards.length, 1);
  assert.match(cards[0].textContent, /The gym has a leg curl machine\. Use it instead of dumbbell lying leg curl\?/);
  assert.ok(button(cards[0], "Use it"), "a Use it button");
  assert.ok(button(cards[0], "Keep"), "a Keep button");
  assert.equal((model.doc().plan_days ?? []).length, 0, "no Plan edit before a tap");
});

test("O5 Use it: one Plan edit swaps that place to the machine; the offer is gone for good", () => {
  fresh({ leg_curl: true });
  button(offerCards(openDay("thu"))[0], "Use it").click();
  const eff = model.effectivePlanDay("thu");
  assert.equal(eff.edited, true);
  assert.equal(eff.slots.find((s) => s.slot === "D").ex, "leg_curl_machine");
  assert.deepEqual(eff.slots.filter((s) => s.slot !== "D").map((s) => s.ex), days.thu.slots.filter((s) => s.slot !== "D").map((s) => s.ex), "only that place changed");
  assert.equal(eff.slots.find((s) => s.slot === "D").sets, 3, "sets kept");
  assert.equal(offerCards(openDay("thu")).length, 0, "not offered again");
  // Even after "Back to the plan's Thursday" the offer stays answered.
  model.savePlanDay("thu", days.thu.slots.map((s) => ({ slot: s.slot, ex: s.ex, sets: s.sets, rest: s.rest })));
  assert.equal(model.effectivePlanDay("thu").edited, false);
  assert.equal(offerCards(openDay("thu")).length, 0, "answered once, never asked again");
});

test("O6 Keep: nothing changes and the offer does not come back; other offers stay", () => {
  fresh({ lat_pulldown: true });
  button(offerCards(openDay("mon"))[0], "Keep").click();
  assert.equal((model.doc().plan_days ?? []).length, 0, "no Plan edit");
  assert.equal(offerCards(openDay("mon")).length, 0, "Monday's offer is answered");
  assert.equal(offerCards(openDay("wed")).length, 1, "Wednesday's pulldown has its own offer");
});

test("O7 the answers stay on this phone only: never in the synced document or a backup", () => {
  fresh({ pec_deck: true });
  button(offerCards(openDay("tue"))[0], "Keep").click();
  const answers = readOfferAnswers(store);
  assert.equal(Object.values(answers).filter((v) => v === "kept").length, 1);
  assert.ok(!JSON.stringify(model.doc()).includes("kept"), "not in the synced document");
});

test("O8 a running workout on that day: no offer (the day is locked)", () => {
  const src = readFileSync(new URL("../app/js/ui/planday.js", import.meta.url), "utf8");
  assert.match(src, /canEdit[^\n]*machineOffers|machineOffers[^\n]*canEdit/, "the offer is shown only when the day can be edited");
});

// ---------- the new first-visit check in Settings ----------

test("S1 Settings > Gym weights asks about the ab crunch machine too", async () => {
  fresh();
  const { renderSettings } = await import("../app/js/ui/settings.js");
  const r = renderSettings();
  const root = Array.isArray(r) ? r[0] : r;
  const label = root.querySelectorAll("label").find((l) => l.getAttribute("for") === "g-m-ab_crunch");
  assert.ok(label, "a field for ab_crunch");
  assert.equal(label.textContent, "Ab crunch machine");
});

// ---------- "1 set", never "1 sets" ----------

test("W1 the word helpers: 1 set, 2 sets, 0 sets; 1 rep, 2 reps", () => {
  assert.equal(words.setWord(1), "set");
  assert.equal(words.setWord(2), "sets");
  assert.equal(words.setWord(0), "sets");
  assert.equal(words.nSets(1), "1 set");
  assert.equal(words.nSets(3), "3 sets");
  assert.equal(words.nReps(1), "1 rep");
  assert.equal(words.nReps(12), "12 reps");
});

test("W2 the target line and the Change and Add sheet lines say '1 set'", () => {
  assert.match(targetText("leg_press", 1, 2), /^1 set · /);
  assert.match(targetText("leg_press", 3, 2), /^3 sets · /);
  assert.equal(doseWeekWords(1, 6, 6), "This week: 1 set (the week 6 rule).");
  assert.equal(doseWeekWords(1, 6, 3), "In week 6: 1 set.");
  assert.match(setsWords({ setsThisWeek: 1, setsNormal: 3 }, 6, 6), /^1 set /);
});

test("W3 the Plan cards never say '1 sets' (week 12: the planks have 1 set)", () => {
  fresh();
  for (const d of Object.keys(days)) {
    const p = openDay(d);
    const all = [p.textContent, ...[...p.walk()].map((x) => x.getAttribute?.("aria-label") ?? "")].join(" | ");
    assert.doesNotMatch(all, /\b1 sets\b/, `${d}: ${all.match(/.{0,30}\b1 sets\b.{0,10}/)?.[0]}`);
    assert.doesNotMatch(all, /\b1 reps\b/, d);
  }
  const mon = openDay("mon");
  const plank = mon.querySelectorAll(".pcard").find((c) => c.textContent.includes(exercises.plank.name));
  assert.match(plank.textContent, /1 set × /, "Monday's plank card in week 12");
});

test("W4 no screen builds '<count> sets' or '<count> reps' without the helper", () => {
  // Review round 1 (checker): + the pair header ("1 rounds"), the muscle check ("1 direct sets") and a reps word kept in a
  // ternary (`: " reps"`, which gave "1 reps" for a range of exactly 1).
  const files = ["engine/workout.js", "ui/exlayer.js", "ui/planday.js", "ui/planedit.js", "ui/today.js", "ui/pair.js", "ui/progress.js", "ui/finish.js", "ui/flow.js", "ui/week1.js",
    "engine/planpage.js", "planview.js", "ui/musclecheck.js"];
  for (const f of files) {
    const src = readFileSync(new URL(`../app/js/${f}`, import.meta.url), "utf8");
    const bad = src.split("\n").filter((l) => /\$\{[^}]+\} (sets|reps|rounds|direct sets)\b/.test(l) || /String\([^)]*\)\), " sets/.test(l) || /: " reps"/.test(l));
    assert.deepEqual(bad, [], `${f} builds a count with "sets" or "reps" directly`);
  }
});

// ---------- the D18 offer for a saved Tuesday or Friday edit (trainer's answer 3 to 8.42, commit 8ba08e5) ----------

const OLD_TUE = [["A1", "leg_press", 4, null], ["A2", "cable_crunch", 3, 90], ["B1", "romanian_deadlift", 3, null], ["B2", "face_pull", 3, 90], ["C1", "hip_thrust", 3, null], ["C2", "dead_bug", 3, 75], ["D", "leg_extension", 3, 60]];
function freshEditedTuesday() {
  fresh();
  const doc = store.load();
  doc.plan_days = [{ id: "p-plan-v2-tue", updated_at: "2026-02-01T10:00:00.000Z", plan_id: "plan-v2", day: "tue", slots: OLD_TUE.map(([slot, ex, sets, rest]) => ({ slot, ex, sets, rest })) }];
  store.save(doc);
  // D20 answer 3 (0.7.8): the D18 card shows after the D20 card; these tests are about the D18 card, so D20 is answered.
  store.saveDevice({ machine_offers: { "tue:D20:plan": "kept" } });
}
const d18Cards = (p) => p.querySelectorAll(".card").filter((c) => c.textContent.startsWith("The plan now uses simpler machines"));

test("U1 an edited Tuesday with old exercises shows the offer in the trainer's words; nothing changed before a tap", () => {
  freshEditedTuesday();
  const cards = d18Cards(openDay("tue"));
  assert.equal(cards.length, 1);
  // D20 answer 3 (0.7.8): only C2 is left on the D18 card (was Hip thrust → Hip thrust machine), one place: "Use it".
  assert.match(cards[0].textContent, /The plan now uses simpler machines on Tuesday\. Use it in your edited Tuesday\?/);
  assert.match(cards[0].textContent, /Dead bug → Plank/);
  assert.doesNotMatch(cards[0].textContent, /Hip thrust → Hip thrust machine/);
  assert.ok(button(cards[0], "Use it") && button(cards[0], "Keep mine"));
  assert.equal(model.effectivePlanDay("tue").slots.find((s) => s.slot === "C2").ex, "dead_bug");
  assert.equal(d18Cards(openDay("fri")).length, 0, "Friday is the plan's own day: no offer");
});

test("U2 Use it: the old exercise left on the D18 card becomes the new one; the edited sets stay; asked once", () => {
  freshEditedTuesday();
  button(d18Cards(openDay("tue"))[0], "Use it").click();
  const eff = model.effectivePlanDay("tue");
  // D20 answer 3 (0.7.8): only C2 (A2 and C1 were weighted_crunch and booty_builder_hip_thrust; they are the D20 card's).
  assert.deepEqual(eff.slots.map((s) => [s.slot, s.ex, s.sets]), [["A1", "leg_press", 4], ["A2", "cable_crunch", 3], ["B1", "romanian_deadlift", 3], ["B2", "face_pull", 3], ["C1", "hip_thrust", 3], ["C2", "plank", 3], ["D", "leg_extension", 3]]);
  assert.equal(eff.edited, true, "still Rosario's edited Tuesday (leg press 4 sets)");
  assert.equal(d18Cards(openDay("tue")).length, 0);
});

test("U3 Keep mine: nothing changes and it never asks again", () => {
  freshEditedTuesday();
  button(d18Cards(openDay("tue"))[0], "Keep mine").click();
  assert.deepEqual(model.effectivePlanDay("tue").slots.map((s) => s.ex), OLD_TUE.map((r) => r[1]));
  assert.equal(d18Cards(openDay("tue")).length, 0);
  assert.equal(readOfferAnswers(store)["tue:D18:plan"], "kept");
});
