// Build step 2 (redesign/plan-diet/judge/JUDGING.md section 7): the day logic behind the Plan day page.
// Which day and week the page opens on, the real sets of a week, the "Day so far" muscle totals, the words on the
// cards and headers, and the Gym exercise groups. Pure functions only (app/js/engine/planpage.js).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  pageFor, daySets, dayTotals, setsByMuscle, daySoFar, levelFor, exerciseLevels, muscleWords, unitHeader,
  unitsOf, slotRole, restTile, neighbours, GYM_GROUPS, gymGroupOf, planDaysOf, soFarText, mainView,
} from "../app/js/engine/planpage.js";
import { exercises, DAY_IDS } from "../app/js/plan/plan-v2.js";

const START = "2026-11-02"; // a Monday: week 1 = 2 to 8 Nov, week 3 = 16 to 22 Nov

// ---------- which day and week the page shows ----------
test("pageFor: a weekday in the block opens on that day and week, marked as today", () => {
  assert.deepEqual(pageFor(START, "2026-11-17"), { day: "tue", week: 3, todayDay: "tue", state: "running" });
  assert.deepEqual(pageFor(START, "2026-11-02"), { day: "mon", week: 1, todayDay: "mon", state: "running" });
  assert.deepEqual(pageFor(START, "2026-11-20"), { day: "fri", week: 3, todayDay: "fri", state: "running" });
});

test("pageFor: Saturday and Sunday open on the coming Monday with the coming week", () => {
  assert.deepEqual(pageFor(START, "2026-11-21"), { day: "mon", week: 4, todayDay: null, state: "running" });
  assert.deepEqual(pageFor(START, "2026-11-22"), { day: "mon", week: 4, todayDay: null, state: "running" });
});

test("pageFor: before the block = Monday of week 1; after the 12 weeks = Monday of week 12; never week 0 or 13", () => {
  assert.deepEqual(pageFor(START, "2026-10-28"), { day: "mon", week: 1, todayDay: null, state: "before" });
  assert.deepEqual(pageFor(START, "2026-11-01"), { day: "mon", week: 1, todayDay: null, state: "before" }); // Sunday before
  assert.deepEqual(pageFor(START, "2027-01-26"), { day: "mon", week: 12, todayDay: null, state: "after" });
  assert.deepEqual(pageFor(START, "2027-01-24"), { day: "mon", week: 12, todayDay: null, state: "running" }); // last Sunday
});

// ---------- the real sets of each week ----------
test("daySets: Tuesday shows each week's real sets (week 1 two, week 6 one less, weeks 7 to 11 pair A 4th set, D 2)", () => {
  const sets = (week) => daySets("tue", week).map((s) => s.sets);
  assert.deepEqual(sets(1), [2, 2, 2, 2, 2, 2, 2]);
  assert.deepEqual(sets(3), [3, 3, 3, 3, 3, 3, 3]);
  assert.deepEqual(sets(6), [2, 2, 2, 2, 2, 2, 2]);
  assert.deepEqual(sets(7), [4, 4, 3, 3, 3, 3, 2]);
  assert.deepEqual(sets(12), [2, 2, 2, 2, 2, 2, 2]);
});

test("dayTotals: sets and exercises of a day in a week", () => {
  assert.deepEqual(dayTotals("tue", 3), { sets: 21, exercises: 7 });
  assert.deepEqual(dayTotals("mon", 3), { sets: 23, exercises: 8 });
  assert.deepEqual(dayTotals("tue", 7), { sets: 22, exercises: 7 });
  assert.deepEqual(dayTotals("mon", 1), { sets: 16, exercises: 8 });
});

// ---------- Day so far ----------
test("daySoFar: Tuesday week 3, Romanian deadlift = 3 of 7, the mock-up's numbers and words", () => {
  const r = daySoFar("tue", 3, "B1");
  assert.equal(r.position, 3);
  assert.equal(r.total, 7);
  assert.deepEqual(r.weighted, { quads: 3, calves: 1.5, glutes: 3, hamstrings: 4.5, abs: 3, lower_back: 1.5 });
  assert.deepEqual(r.direct, { quads: 3, abs: 3, hamstrings: 3 });
  assert.equal(r.text, "back thighs 4.5, front thighs 3, glutes 3, abs 3, calves 1.5, lower back 1.5");
  assert.deepEqual(r.levels, { quads: 2, calves: 1, glutes: 2, hamstrings: 2, abs: 2, lower_back: 1 });
});

test("daySoFar follows the week's real sets (week 1 = 2 sets each)", () => {
  const r = daySoFar("tue", 1, "B1");
  assert.deepEqual(r.weighted, { quads: 2, calves: 1, glutes: 2, hamstrings: 3, abs: 2, lower_back: 1 });
  assert.equal(r.text, "back thighs 3, front thighs 2, glutes 2, abs 2, calves 1, lower back 1");
});

test("daySoFar at the first card counts only that card; at the last card it is the whole day", () => {
  const first = daySoFar("tue", 3, "A1");
  assert.equal(first.position, 1);
  assert.deepEqual(first.weighted, { quads: 3, calves: 1.5, glutes: 1.5, hamstrings: 1.5 });
  const last = daySoFar("tue", 3, "D");
  assert.equal(last.position, 7);
  assert.deepEqual(last.weighted, setsByMuscle(daySets("tue", 3)).weighted);
  assert.equal(last.weighted.quads, 6); // leg press 3 + leg extension 3
  assert.equal(last.weighted.rear_delts, 3); // face pull
});

test("daySoFar: every day and week adds up to the day's sets (main muscles get 1 per set)", () => {
  for (const day of DAY_IDS) for (const week of [1, 3, 6, 7, 12]) {
    const slots = daySets(day, week);
    const r = daySoFar(day, week, slots[slots.length - 1].slot);
    const direct = Object.values(r.direct).reduce((a, b) => a + b, 0);
    const mains = slots.reduce((n, s) => n + s.sets * 1, 0); // every plan exercise has exactly one main muscle
    assert.equal(direct, mains, `${day} week ${week}`);
  }
});

test("setsByMuscle: a helper set counts half; a muscle that only helps has no direct sets", () => {
  const r = setsByMuscle([{ ex: "romanian_deadlift", sets: 3 }]);
  assert.deepEqual(r.direct, { hamstrings: 3 });
  assert.deepEqual(r.weighted, { hamstrings: 3, glutes: 1.5, lower_back: 1.5 });
});

test("levelFor: 3 steps, under 3 = A little, 3 to under 6 = More, 6 and up = Most", () => {
  assert.equal(levelFor(0), 0);
  assert.equal(levelFor(undefined), 0);
  assert.equal(levelFor(0.5), 1);
  assert.equal(levelFor(1.5), 1);
  assert.equal(levelFor(2.9), 1);
  assert.equal(levelFor(3), 2);
  assert.equal(levelFor(5.5), 2);
  assert.equal(levelFor(6), 3);
  assert.equal(levelFor(27), 3);
});

test("soFarText lists every muscle with sets, most first, ties in the order they came in", () => {
  assert.equal(soFarText({ abs: 3, quads: 4, calves: 0.5 }), "front thighs 4, abs 3, calves 0.5");
  assert.equal(soFarText({}), "");
});

// ---------- words ----------
test("exerciseLevels: main muscles 3, helpers 1", () => {
  assert.deepEqual(exerciseLevels("leg_press"), { calves: 1, glutes: 1, hamstrings: 1, quads: 3 });
  assert.deepEqual(exerciseLevels("cable_crunch"), { abs: 3 });
});

test("muscleWords: plain words for the card and the sheet", () => {
  assert.deepEqual(muscleWords("leg_press"), { main: "front thighs", helpers: "calves, glutes, back thighs", card: "Front thighs · helps calves, glutes, back thighs" });
  assert.deepEqual(muscleWords("romanian_deadlift"), { main: "back thighs", helpers: "glutes, lower back", card: "Back thighs · helps glutes, lower back" });
  assert.deepEqual(muscleWords("leg_extension"), { main: "front thighs", helpers: "", card: "Front thighs" });
});

test("mainView: the side of the body where the main muscles are", () => {
  assert.equal(mainView(exerciseLevels("leg_press")), "front");
  assert.equal(mainView(exerciseLevels("romanian_deadlift")), "back");
  assert.equal(mainView(exerciseLevels("face_pull")), "back");
  assert.equal(mainView(exerciseLevels("chest_press")), "front");
});

test("unitHeader: pair headers in words, with the week's rounds", () => {
  const head = (day, week, i) => unitHeader(unitsOf(daySets(day, week))[i]);
  assert.equal(head("tue", 3, 0), "Pair A · back and forth · 3 rounds · rest 90 s after each round");
  assert.equal(head("tue", 3, 2), "Pair C · back and forth · 3 rounds · rest 75 s after each round");
  assert.equal(head("tue", 7, 0), "Pair A · back and forth · 4 rounds · rest 90 s after each round");
  assert.equal(head("tue", 3, 3), "On its own · rest 60 s between sets");
  assert.equal(head("mon", 3, 3), "Abs · rest 30 s between sets");
  assert.equal(head("thu", 3, 4), "Abs · rest 45 s between sets");
  assert.equal(head("wed", 3, 1), "Pair B · back and forth · 3 rounds · rest 75 s after each round"); // pulldown 3, lateral raise 2
});

test("slotRole and restTile: the sheet's eyebrow and its Rest tile", () => {
  assert.equal(slotRole("tue", "B1"), "Pair B · first of the pair");
  assert.equal(slotRole("tue", "B2"), "Pair B · second of the pair");
  assert.equal(slotRole("tue", "D"), "On its own");
  assert.equal(slotRole("mon", "Abs2"), "Abs");
  const slot = (day, name) => daySets(day, 3).find((s) => s.slot === name);
  assert.deepEqual(restTile(slot("tue", "B1")), { value: "30 s", note: "to move" });
  assert.deepEqual(restTile(slot("tue", "B2")), { value: "90 s", note: "after the round" });
  assert.deepEqual(restTile(slot("tue", "D")), { value: "60 s", note: "between sets" });
  assert.deepEqual(restTile(slot("mon", "Abs1")), { value: "30 s", note: "between sets" });
});

test("neighbours: Previous and Next are the cards before and after, none past the ends", () => {
  const n = neighbours("tue", 3, "B1");
  assert.equal(n.prev.ex, "cable_crunch");
  assert.equal(n.next.ex, "face_pull");
  assert.equal(neighbours("tue", 3, "A1").prev, null);
  assert.equal(neighbours("tue", 3, "D").next, null);
});

// ---------- Gym exercises grouped by main muscle (answer 75 a) ----------
test("Gym groups: every exercise sits in exactly one group; chest 3 and back 5 as on the mock-up", () => {
  const ids = Object.keys(exercises);
  for (const id of ids) assert.ok(GYM_GROUPS.some((g) => g.id === gymGroupOf(id)), id);
  const count = (g) => ids.filter((id) => gymGroupOf(id) === g).length;
  assert.equal(count("chest"), 3);
  assert.equal(count("back"), 5);
  assert.equal(GYM_GROUPS.reduce((n, g) => n + count(g.id), 0), ids.length);
  assert.equal(GYM_GROUPS[0].name, "Chest");
});

test("planDaysOf: the plan days an exercise is on (empty = swap only)", () => {
  assert.deepEqual(planDaysOf("face_pull"), ["tue", "thu"]);
  assert.deepEqual(planDaysOf("dead_bug"), ["mon", "tue", "wed"]);
  assert.deepEqual(planDaysOf("cable_curl"), []);
});
