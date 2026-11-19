// Version 0.7.8 (worker 8.45): the screens of trainer decision D20. Written before the build.
// - D20-5: after the first-visit check, the Plan day offers the captain's chair (Tuesday), the decline abs bench (Friday)
//   or the ab crunch machine (both) once, as a one-tap Plan edit; nothing changes without "Use it".
// - D20-6: a saved Tuesday or Friday edit that still holds a replaced exercise gets a one-time card:
//   "The plan now uses <new> on <day>. Use it in your edited <day>?" with "Use it" and "Keep mine". Never a silent rewrite.
// - The new first-visit checks in Settings > Gym weights.
// Drives the real screens on a fake page (tests/fixtures/sheet-dom.mjs). All values are made up. No body data.
import test from "node:test";
import assert from "node:assert/strict";
import { install } from "./fixtures/sheet-dom.mjs";

const { body } = install();
globalThis.location.hash = "#/plan";
globalThis.requestAnimationFrame = () => 0;
const { store, model } = await import("../app/js/ui/app.js");
const { validDoc } = await import("./fixtures/profiles.mjs");
const { days } = await import("../app/js/plan/plan-v2.js");
const { renderPlan, resetPlanPage } = await import("../app/js/ui/planday.js");
const planedit = await import("../app/js/ui/planedit.js");
const { readOfferAnswers } = await import("../app/js/prefs.js");
const { photoNote } = await import("../app/js/ui/media.js");

const NONE = { lat_pulldown: null, seated_row: null, leg_curl: null, pec_deck: null, calf_raise: null, ab_crunch: null, captain_chair: null, ab_bench: null };
function fresh(machines = {}, planDays = []) {
  const doc = validDoc();
  doc.shared_settings.extra_machines = { ...NONE, ...machines };
  doc.plan_days = planDays;
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
const d20Cards = (p) => p.querySelectorAll(".card").filter((c) => /^The plan now uses the Smith machine split squat/.test(c.textContent));
const button = (root, text) => root.querySelectorAll("button").find((b) => b.textContent.trim() === text);
const exAt = (day, slot) => model.effectivePlanDay(day).slots.find((s) => s.slot === slot)?.ex;

// ---------- Settings: the two new checks ----------

test("S1 Settings > Gym weights asks about the captain's chair and the abs bench, after the ab crunch machine", async () => {
  fresh();
  const { renderSettings } = await import("../app/js/ui/settings.js");
  const r = renderSettings();
  const root = Array.isArray(r) ? r[0] : r;
  const label = (k) => root.querySelectorAll("label").find((l) => l.getAttribute("for") === `g-m-${k}`)?.textContent;
  assert.equal(label("captain_chair"), "Captain's chair (knee raise station)");
  assert.equal(label("ab_bench"), "Abs bench (decline bench with foot rollers)");
  assert.equal(label("ab_crunch"), "Ab crunch machine");
  const order = root.querySelectorAll("label").map((l) => l.getAttribute("for")).filter((f) => /^g-m-/.test(f ?? ""));
  assert.deepEqual(order.slice(-3), ["g-m-ab_crunch", "g-m-captain_chair", "g-m-ab_bench"]);
});

// ---------- D20-5 the one-tap offers on the Plan day ----------

test("O1 no check answered (or 'no'): Tuesday and Friday show no abs offer", () => {
  fresh();
  assert.equal(offerCards(openDay("tue")).length, 0);
  assert.equal(offerCards(openDay("fri")).length, 0);
  fresh({ captain_chair: false, ab_bench: false, ab_crunch: false });
  assert.equal(offerCards(openDay("tue")).length, 0);
  assert.equal(offerCards(openDay("fri")).length, 0);
});

test("O2 the captain's chair on Tuesday: one card, nothing changed before a tap; Use it swaps only A2, once", () => {
  fresh({ captain_chair: true });
  const cards = offerCards(openDay("tue"));
  assert.equal(cards.length, 1);
  assert.match(cards[0].textContent, /The gym has a captain's chair\. Use it instead of reverse crunch\?/);
  assert.equal((model.doc().plan_days ?? []).length, 0, "no Plan edit before a tap");
  assert.equal(offerCards(openDay("fri")).length, 0, "not on Friday");
  button(offerCards(openDay("tue"))[0], "Use it").click();
  assert.equal(exAt("tue", "A2"), "captain_chair_knee_raise");
  assert.deepEqual(model.effectivePlanDay("tue").slots.filter((s) => s.slot !== "A2").map((s) => s.ex), days.tue.slots.filter((s) => s.slot !== "A2").map((s) => s.ex), "only that place");
  assert.equal(model.effectivePlanDay("tue").slots.find((s) => s.slot === "A2").sets, 3, "sets kept");
  assert.equal(offerCards(openDay("tue")).length, 0, "asked once");
});

test("O3 the decline abs bench on Friday: its own card; Keep changes nothing and never asks again", () => {
  fresh({ ab_bench: true });
  const cards = offerCards(openDay("fri"));
  assert.equal(cards.length, 1);
  assert.match(cards[0].textContent, /The gym has a decline abs bench\. Use it instead of reverse crunch\?/);
  assert.equal(offerCards(openDay("tue")).length, 0, "not on Tuesday");
  button(cards[0], "Keep").click();
  assert.equal((model.doc().plan_days ?? []).length, 0);
  assert.equal(offerCards(openDay("fri")).length, 0);
});

test("O4 two offers for one place: the captain's chair first; the ab crunch machine only after Keep", () => {
  fresh({ captain_chair: true, ab_crunch: true });
  let cards = offerCards(openDay("tue"));
  assert.equal(cards.length, 1);
  assert.match(cards[0].textContent, /captain's chair/);
  button(cards[0], "Keep").click();
  cards = offerCards(openDay("tue"));
  assert.equal(cards.length, 1);
  assert.match(cards[0].textContent, /The gym has an ab crunch machine\. Use it instead of reverse crunch\?/);
  button(cards[0], "Use it").click();
  assert.equal(exAt("tue", "A2"), "ab_crunch_machine");
  assert.equal(offerCards(openDay("tue")).length, 0);
  assert.equal(offerCards(openDay("fri")).length, 1, "Friday's ab crunch offer is its own");
});

// ---------- D20-6 the one-time card for a saved Tuesday or Friday edit ----------

const D18_TUE = [["A1", "leg_press", 4, null], ["A2", "weighted_crunch", 3, 90], ["B1", "romanian_deadlift", 3, null], ["B2", "face_pull", 3, 90], ["C1", "booty_builder_hip_thrust", 3, null], ["C2", "plank", 3, 75], ["D", "leg_extension", 2, 60]];
const D18_FRI = [["A1", "smith_squat", 3, null], ["A2", "reverse_crunch", 3, 90], ["B1", "booty_builder_hip_thrust", 3, null], ["B2", "lateral_raise", 3, 75], ["C1", "cable_pull_through", 3, null], ["C2", "side_plank", 2, 60], ["D", "calf_raise_leg_press", 2, 60]];
const rec = (day, rows) => ({ id: `p-plan-v2-${day}`, updated_at: "2026-02-01T10:00:00.000Z", plan_id: "plan-v2", day, slots: rows.map(([slot, ex, sets, rest]) => ({ slot, ex, sets, rest })) });

test("U1 an edited Tuesday from 0.7.5-0.7.7 shows the D20 card in the trainer's words; nothing changed before a tap", () => {
  fresh({}, [rec("tue", D18_TUE)]);
  const cards = d20Cards(openDay("tue"));
  assert.equal(cards.length, 1);
  assert.match(cards[0].textContent, /^The plan now uses the Smith machine split squat and the reverse crunch on Tuesday\. Use them in your edited Tuesday\?/);
  assert.match(cards[0].textContent, /Hip thrust machine → Smith machine split squat/);
  assert.match(cards[0].textContent, /Crunch with a dumbbell → Reverse crunch/);
  assert.ok(button(cards[0], "Use them") && button(cards[0], "Keep mine"));
  assert.equal(exAt("tue", "C1"), "booty_builder_hip_thrust", "never a silent rewrite");
  assert.equal(d20Cards(openDay("fri")).length, 0, "Friday is the plan's own day: no card");
});

test("U2 Use them: only those places change; Rosario's other edits (leg press 4 sets, leg extension 2 sets) stay; asked once", () => {
  fresh({}, [rec("tue", D18_TUE)]);
  button(d20Cards(openDay("tue"))[0], "Use them").click();
  const eff = model.effectivePlanDay("tue");
  assert.deepEqual(eff.slots.map((s) => [s.slot, s.ex, s.sets]), [["A1", "leg_press", 4], ["A2", "reverse_crunch", 3], ["B1", "romanian_deadlift", 3], ["B2", "face_pull", 3], ["C1", "smith_split_squat", 3], ["C2", "plank", 3], ["D", "leg_extension", 2]]);
  assert.equal(eff.edited, true);
  assert.equal(d20Cards(openDay("tue")).length, 0);
  assert.equal(readOfferAnswers(store)["tue:D20:plan"], "used");
});

test("U3 Keep mine: nothing changes and it never asks again", () => {
  fresh({}, [rec("tue", D18_TUE)]);
  button(d20Cards(openDay("tue"))[0], "Keep mine").click();
  assert.deepEqual(model.effectivePlanDay("tue").slots.map((s) => s.ex), D18_TUE.map((r) => r[1]));
  assert.equal(d20Cards(openDay("tue")).length, 0);
  assert.equal(readOfferAnswers(store)["tue:D20:plan"], "kept");
});

test("U4 an edited Friday: one place, 'Use it' in the trainer's words", () => {
  fresh({}, [rec("fri", D18_FRI)]);
  const cards = d20Cards(openDay("fri"));
  assert.equal(cards.length, 1);
  assert.match(cards[0].textContent, /^The plan now uses the Smith machine split squat on Friday\. Use it in your edited Friday\?/);
  assert.ok(button(cards[0], "Use it") && button(cards[0], "Keep mine"));
  button(cards[0], "Use it").click();
  assert.equal(exAt("fri", "B1"), "smith_split_squat");
  assert.equal(model.effectivePlanDay("fri").slots.find((s) => s.slot === "D").sets, 2, "the other edit stays");
});

test("U5 Rosario swaps Tuesday C1 back to the hip thrust machine on 0.7.8: no D20 card offers to undo that choice", () => {
  fresh();
  openDay("tue");
  planedit.openSwapSheet("tue", 3, "C1");
  const sh = body.querySelector("[data-sheet]");
  sh.querySelectorAll("button").find((b) => /^Swap Smith machine split squat for Hip thrust machine[ .(]/.test(b.getAttribute("aria-label") ?? "")).click();
  assert.equal(exAt("tue", "C1"), "booty_builder_hip_thrust");
  assert.equal(d20Cards(openDay("tue")).length, 0);
});

const PRE075_TUE = [["A1", "leg_press", 4, null], ["A2", "cable_crunch", 3, 90], ["B1", "romanian_deadlift", 3, null], ["B2", "face_pull", 3, 90], ["C1", "hip_thrust", 3, null], ["C2", "dead_bug", 3, 75], ["D", "leg_extension", 3, 60]];
const d18Cards = (p) => p.querySelectorAll(".card").filter((c) => c.textContent.startsWith("The plan now uses simpler machines"));

test("U6 trainer answer 3: a Tuesday edited before 0.7.5: the D20 card first (C1 and A2), then a D18 card with C2 only", () => {
  fresh({}, [rec("tue", PRE075_TUE)]);
  let p = openDay("tue");
  const cards = d20Cards(p);
  assert.equal(cards.length, 1);
  assert.equal(d18Cards(p).length, 0, "one card per day at a time");
  assert.match(cards[0].textContent, /^The plan now uses the Smith machine split squat and the reverse crunch on Tuesday\. Use them in your edited Tuesday\?/);
  assert.match(cards[0].textContent, /Hip thrust → Smith machine split squat/);
  assert.match(cards[0].textContent, /Cable crunch → Reverse crunch/);
  assert.equal(exAt("tue", "C1"), "hip_thrust", "never a silent rewrite");
  button(cards[0], "Use them").click();
  p = openDay("tue");
  assert.equal(d20Cards(p).length, 0);
  const left = d18Cards(p);
  assert.equal(left.length, 1, "what is left of the D18 card comes next");
  assert.match(left[0].textContent, /Dead bug → Plank/);
  assert.doesNotMatch(left[0].textContent, /Hip thrust|Cable crunch|Crunch with a dumbbell/);
  button(left[0], "Use it").click(); // one place left: "Use it"
  assert.deepEqual(model.effectivePlanDay("tue").slots.map((s) => [s.slot, s.ex, s.sets]), [["A1", "leg_press", 4], ["A2", "reverse_crunch", 3], ["B1", "romanian_deadlift", 3], ["B2", "face_pull", 3], ["C1", "smith_split_squat", 3], ["C2", "plank", 3], ["D", "leg_extension", 3]]);
  p = openDay("tue");
  assert.equal(d20Cards(p).length + d18Cards(p).length, 0);
});

test("U7 trainer answer 3: the same Tuesday with a saved D18 Keep mine: the D20 card once, never the D18 card; its Keep mine is final", () => {
  fresh({}, [rec("tue", PRE075_TUE)]);
  store.saveDevice({ machine_offers: { "tue:D18:plan": "kept" } });
  let p = openDay("tue");
  assert.equal(d20Cards(p).length, 1);
  assert.equal(d18Cards(p).length, 0);
  button(d20Cards(p)[0], "Keep mine").click();
  p = openDay("tue");
  assert.equal(d20Cards(p).length + d18Cards(p).length, 0);
  assert.deepEqual(model.effectivePlanDay("tue").slots.map((s) => s.ex), PRE075_TUE.map((r) => r[1]), "nothing changed");
  assert.equal(readOfferAnswers(store)["tue:D20:plan"], "kept");
  assert.equal(readOfferAnswers(store)["tue:D18:plan"], "kept", "the old answer stays");
});

test("U8 one card per place: an edited Tuesday with the crunch with a dumbbell and the ab crunch machine found: the D20 card first, the machine offer waits", () => {
  fresh({ ab_crunch: true }, [rec("tue", D18_TUE)]);
  let p = openDay("tue");
  assert.equal(d20Cards(p).length, 1);
  assert.equal(offerCards(p).length, 0, "the machine offer for A2 waits while the D20 card offers A2");
  button(d20Cards(p)[0], "Keep mine").click();
  p = openDay("tue");
  const cards = offerCards(p);
  assert.equal(cards.length, 1, "after Keep mine the machine offer for the kept crunch with a dumbbell shows");
  assert.match(cards[0].textContent, /The gym has an ab crunch machine\. Use it instead of crunch with a dumbbell\?/);
  // After Use them instead, A2 holds the reverse crunch, and its own ab crunch offer shows.
  fresh({ ab_crunch: true }, [rec("tue", D18_TUE)]);
  button(d20Cards(openDay("tue"))[0], "Use them").click();
  const after = offerCards(openDay("tue"));
  assert.equal(after.length, 1);
  assert.match(after[0].textContent, /instead of reverse crunch\?/);
});

test("U9 auditor 0.7.8: while a workout runs on Tuesday, the edited Tuesday shows no plan card and no machine offer", async () => {
  const { setActive, clearActive } = await import("../app/js/active.js");
  fresh({ ab_crunch: true }, [rec("tue", PRE075_TUE)]);
  const doc = store.load();
  doc.sessions.push({ id: "s-run-tue", updated_at: "2026-02-03T08:00:00.000Z", date: "2026-02-03", plan_day: "tue", week: 3, kind: "full", swapped_from: null, status: "in_progress", started_at: "2026-02-03T08:00:00.000Z", finished_at: null, walk: null, exercises: [], note: "" });
  store.save(doc);
  setActive({ session_id: "s-run-tue", phase: "weights", rest: null, hold: null });
  try {
    const p = openDay("tue");
    assert.equal(d20Cards(p).length + d18Cards(p).length + offerCards(p).length, 0);
  } finally { clearActive(); }
  const p = openDay("tue");
  assert.equal(d20Cards(p).length, 1, "after the workout the card is back");
});

test("U10 auditor round 2: Rosario swaps a D20 place from one old move to another (hip thrust machine -> hip thrust): the D20 card still offers it; no place answered", () => {
  fresh({}, [rec("tue", D18_TUE)]);
  openDay("tue");
  planedit.openSwapSheet("tue", 3, "C1");
  const sh = body.querySelector("[data-sheet]");
  sh.querySelectorAll("button").find((b) => /^Swap Hip thrust machine for Hip thrust(\.| \()/.test(b.getAttribute("aria-label") ?? "")).click();
  assert.equal(exAt("tue", "C1"), "hip_thrust");
  assert.ok(!Object.hasOwn(readOfferAnswers(store), "tue:C1:smith_split_squat"), "not Rosario's answer to the D20 card");
  const card = d20Cards(openDay("tue"))[0];
  assert.ok(card);
  assert.match(card.textContent, /Hip thrust → Smith machine split squat/);
  assert.match(card.textContent, /Crunch with a dumbbell → Reverse crunch/);
});

// ---------- D20-8 the photo note ----------

test("P1 the reverse crunch and the split squat say 'Similar move:' under the photo", () => {
  for (const id of ["reverse_crunch", "smith_split_squat", "booty_builder_hip_thrust"]) {
    const note = photoNote(id);
    assert.ok(note, `${id}: a note`);
    assert.ok(note.textContent.startsWith("Similar move:"), `${id}: ${note.textContent}`);
  }
});
