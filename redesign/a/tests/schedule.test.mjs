// Plan v2 sections 2, 4 and 11 (and the swap rule at the end of section 11).
import test from "node:test";
import assert from "node:assert/strict";
import { weekNumber, dayOfWeek, blockPosition, dayLabel, daysBetween, sessionLayout, expectedMinutes, daySlots, shortDaySlots, planForDay, liftWarmup, missedRule, canStartWorkout, swapOptions } from "../app/js/engine/schedule.js";

const START = "2026-11-23"; // a Monday

test("week number follows the calendar from the block's first Monday", () => {
  assert.equal(weekNumber(START, "2026-11-23"), 1);
  assert.equal(weekNumber(START, "2026-11-29"), 1); // Sunday of week 1
  assert.equal(weekNumber(START, "2026-11-30"), 2);
  assert.equal(weekNumber(START, "2027-01-04"), 7);
  assert.equal(weekNumber(START, "2027-02-08"), 12);
  assert.equal(weekNumber(START, "2027-02-15"), 13);
  assert.equal(weekNumber(START, "2026-11-22"), 0); // the day before
  assert.equal(daysBetween("2026-10-25", "2026-10-26"), 1); // across the UK clock change: still 1 day
});

test("a missed day does not move the week", () => {
  // Monday skipped, Wednesday of week 3 is still week 3 and still Wednesday's workout
  assert.equal(weekNumber(START, "2026-12-09"), 3);
  assert.equal(dayOfWeek("2026-12-09"), "wed");
});

test("day of the week and block position", () => {
  assert.equal(dayOfWeek("2026-11-23"), "mon");
  assert.equal(dayOfWeek("2026-11-28"), "sat");
  assert.equal(dayOfWeek("2026-11-29"), "sun");
  assert.deepEqual(blockPosition(START, "2026-11-22").state, "before");
  assert.equal(blockPosition(START, "2026-11-25").state, "running");
  assert.equal(blockPosition(START, "2027-02-15").state, "after");
  assert.equal(blockPosition(START, "2026-11-28").planDay, null); // Saturday is rest
  assert.equal(dayLabel(START, "2026-12-08").text, "Tuesday · Week 3 · Build 1");
  assert.equal(dayLabel(START, "2026-11-23").text, "Monday · Week 1 · Learn, find weights");
  assert.equal(dayLabel(START, "2026-11-29").text, "Rest day");
});

test("a full session is 90 minutes, minute by minute (plan v2 section 4)", () => {
  const layout = sessionLayout("full", 3);
  assert.deepEqual(layout.map((b) => b.id), ["walk", "changeover", "lift_warmup", "pairs", "abs", "finish"]); // walk first
  assert.deepEqual(layout.map((b) => b.minutes), [30, 3, 4, 45, 7, 1]);
  assert.equal(layout[0].buildUp, 3);
  assert.equal(expectedMinutes("full", 3), 90);
  assert.equal(expectedMinutes("full", 1), 90);
  assert.equal(expectedMinutes("full", 6), 90);
});

test("weeks 7 to 11 take about 91 minutes", () => {
  for (const w of [7, 8, 9, 10, 11]) assert.equal(expectedMinutes("full", w), 91, `week ${w}`);
  assert.equal(expectedMinutes("full", 12), 90);
});

test("short day is 60 minutes, minute by minute", () => {
  const layout = sessionLayout("short", 3);
  assert.deepEqual(layout.map((b) => b.id), ["walk", "changeover", "lift_warmup", "pairs_ab", "abs_first", "finish"]);
  assert.deepEqual(layout.map((b) => b.minutes), [15, 2, 3, 32, 6, 2]);
  assert.equal(layout[0].buildUp, 2);
  assert.equal(expectedMinutes("short", 3), 60);
});

test("short day: pairs A and B only, first abs only; leg days have no abs slot", () => {
  const mon = shortDaySlots("mon", 3);
  assert.deepEqual(mon.pairs.map((s) => s.slot), ["A1", "A2", "B1", "B2"]);
  assert.deepEqual(mon.abs.map((s) => s.ex), ["plank"]);
  const tue = shortDaySlots("tue", 3);
  assert.deepEqual(tue.pairs.map((s) => s.slot), ["A1", "A2", "B1", "B2"]);
  assert.deepEqual(tue.abs, []); // D skipped
  const fri = shortDaySlots("fri", 3);
  assert.deepEqual(fri.abs, []);
  assert.deepEqual(shortDaySlots("wed", 3).abs.map((s) => s.ex), ["side_plank"]);
  // "Cut exercises, never rest times": rests are untouched
  assert.equal(shortDaySlots("mon", 3).pairs[1].rest, 90);
});

test("daySlots uses the sets of that week; planForDay carries effort and walk", () => {
  assert.equal(daySlots("mon", 1)[0].sets, 2);
  assert.equal(daySlots("mon", 7)[0].sets, 4);
  assert.equal(daySlots("tue", 7).find((s) => s.slot === "D").sets, 2);
  const p = planForDay("wed", 3);
  assert.equal(p.rir, 3);
  assert.equal(p.walk, "normal");
  assert.equal(planForDay("tue", 3).walk, "easy");
  assert.equal(planForDay("mon", 3, "short").slots.length, 5);
  assert.equal(planForDay("tue", 3, "short").slots.length, 4);
});

test("lift warm-up: six moves, upper days add push-ups, short day uses fewer", () => {
  assert.equal(liftWarmup("tue").length, 6);
  const upper = liftWarmup("mon");
  assert.equal(upper.length, 7);
  assert.equal(upper[6].name, "Push-ups against a bench");
  assert.deepEqual(liftWarmup("tue").map((m) => m.reps), [10, 10, 8, 10, 10, 10]);
  assert.ok(liftWarmup("tue", "short").length < 6);
  assert.equal(liftWarmup("thu", "short").at(-1).id, "pushups_bench");
});

// ---- Missed sessions: every row of plan v2 section 11 ----
test("missed: 1 to 4 days -> carry on in order, no catch-up", () => {
  for (const [last, today] of [["2026-12-04", "2026-12-04"], ["2026-12-04", "2026-12-05"], ["2026-12-04", "2026-12-07"], ["2026-12-04", "2026-12-08"]]) {
    const r = missedRule(last, today);
    assert.equal(r.kind, "carry_on", `${last} to ${today}`);
    assert.equal(r.weightFactor, 1);
    assert.equal(r.noIncrease, false);
  }
  assert.match(missedRule("2026-12-04", "2026-12-07").message, /Never do two workouts in one day/);
});

test("missed: 5 to 13 days -> repeat the last weights, no increase", () => {
  for (const days of [5, 9, 13]) {
    const r = missedRule("2026-12-01", new Date(Date.UTC(2026, 11, 1 + days)).toISOString().slice(0, 10));
    assert.equal(r.kind, "repeat_weights", `${days} days`);
    assert.equal(r.noIncrease, true);
    assert.equal(r.weightFactor, 1);
  }
});

test("missed: 2 to 4 weeks -> weights about 10 % lower for one week, walk 2 % less steep", () => {
  for (const days of [14, 21, 28]) {
    const r = missedRule("2026-12-01", new Date(Date.UTC(2026, 11, 1 + days)).toISOString().slice(0, 10));
    assert.equal(r.kind, "minus_10", `${days} days`);
    assert.equal(r.weightFactor, 0.9);
    assert.equal(r.walkSlopeDelta, -2);
    assert.equal(r.forWeekOnly, true);
    assert.equal(r.setsOverride, null);
  }
});

test("missed: more than 4 weeks -> weights 20 % lower, 2 sets like week 1, walk back to start", () => {
  const r = missedRule("2026-12-01", "2027-01-05"); // 35 days
  assert.equal(r.kind, "minus_20");
  assert.equal(r.weightFactor, 0.8);
  assert.equal(r.setsOverride, 2);
  assert.equal(r.walkReset, true);
  assert.equal(missedRule("2026-12-01", "2026-12-30").kind, "minus_20"); // 29 days
});

test("missed: ill -> rest, then the 5-to-13-days rule (repeat, no increase)", () => {
  const r = missedRule("2026-12-01", "2026-12-03", { ill: true });
  assert.equal(r.kind, "ill");
  assert.equal(r.noIncrease, true);
  assert.equal(r.weightFactor, 1);
});

test("missed: no earlier workout at all -> carry on", () => {
  assert.equal(missedRule(null, "2026-12-01").kind, "carry_on");
});

test("never two workouts in one day", () => {
  const finished = [{ date: "2026-12-01", status: "finished" }];
  assert.equal(canStartWorkout(finished, "2026-12-01").ok, false);
  assert.equal(canStartWorkout(finished, "2026-12-02").ok, true);
  assert.equal(canStartWorkout([{ date: "2026-12-01", status: "finished", deleted: true }], "2026-12-01").ok, true);
  assert.equal(canStartWorkout([{ date: "2026-12-01", status: "abandoned" }], "2026-12-01").ok, true);
});

test("swap day: a missed Monday can take Wednesday's place", () => {
  // Week 2 starts 2026-11-30. Monday and Tuesday done? Only Tuesday done, today is Wednesday 2026-12-02.
  const sessions = [{ week: 2, plan_day: "tue", status: "finished" }];
  assert.deepEqual(swapOptions({ startMonday: START, today: "2026-12-02", sessions }), ["mon"]);
  assert.deepEqual(swapOptions({ startMonday: START, today: "2026-11-30", sessions }), []); // Monday: nothing earlier
  assert.deepEqual(swapOptions({ startMonday: START, today: "2026-12-05", sessions: [] }), []); // Saturday
  const done = [{ week: 2, plan_day: "mon", status: "finished" }, { week: 2, plan_day: "tue", status: "finished" }];
  assert.deepEqual(swapOptions({ startMonday: START, today: "2026-12-02", sessions: done }), []);
});
