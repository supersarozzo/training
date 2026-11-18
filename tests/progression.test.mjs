// Plan v2 sections 5, 9 and 10: double progression, warm-up sets, effort and rhythm rules.
import test from "node:test";
import assert from "node:assert/strict";
import { nextSuggestion, stepUp, stepDown, stepSize, lowerBy, warmupSets, shouldBringDeloadForward, effortWithSleep, weightAfterBreak } from "../app/js/engine/progression.js";

// A made-up gym: dumbbells in 2 kg steps, stacks in 5 kg steps.
const settings = { dumbbell_steps_kg: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30], stack_step_kg: { default: 5 } };
const sets = (reps, rir) => reps.map((r, i) => ({ reps: r, rir: Array.isArray(rir) ? rir[i] : rir }));
const session = (weight, reps, rir = 2, extra = {}) => ({ weight_kg: weight, sets: sets(reps, rir), ...extra });
const suggest = (last, previous, opts) => nextSuggestion(last, previous, { settings, week: 3, ...opts });

// chest_press: range 8-12, stack step 5. A 60 kg step is 8.3 %, so it is not a big jump.
const CP = { exerciseId: "chest_press" };

test("row 1: all sets at the top, good form, 1 or more left -> add the smallest step, back to the bottom", () => {
  const r = suggest(session(60, [12, 12, 12], 2), null, CP);
  assert.equal(r.action, "increase");
  assert.equal(r.weight_kg, 65);
  assert.deepEqual(r.range, [8, 12]);
  assert.match(r.note, /Back to 8 reps/);
});

test("row 1 edge: at the top but 0 reps left -> not ready, same weight", () => {
  const r = suggest(session(60, [12, 12, 12], [2, 2, 0]), null, CP);
  assert.equal(r.action, "same_top");
  assert.equal(r.weight_kg, 60);
});

test("row 2: some sets in the range, not all at the top -> same weight, aim for 1 more rep", () => {
  const r = suggest(session(60, [12, 11, 10], 2), null, CP);
  assert.equal(r.action, "same_add_rep");
  assert.equal(r.weight_kg, 60);
  assert.match(r.note, /1 more rep/);
});

test("row 3: a set 1 to 2 reps below the range -> same weight, check rest and form", () => {
  for (const low of [7, 6]) {
    const r = suggest(session(60, [10, 9, low], 2), null, CP);
    assert.equal(r.action, "same_check", `${low} reps`);
    assert.equal(r.weight_kg, 60);
  }
});

test("row 4: a set 3 or more below the range, two sessions in a row -> lower about 10 % to a size the gym has, restart at the bottom", () => {
  const r = suggest(session(60, [10, 8, 5], 1), session(60, [9, 5, 5], 1), CP);
  assert.equal(r.action, "lower10");
  assert.equal(r.weight_kg, 50); // 54 rounded down to a 5 kg plate
  assert.match(r.note, /restart at 8 reps/);
  // only once: not lowered yet
  const once = suggest(session(60, [10, 8, 5], 1), session(60, [10, 9, 8], 1), CP);
  assert.equal(once.action, "same_check");
  assert.equal(once.weight_kg, 60);
});

test("row 4 with dumbbells: lower to the next size the gym has", () => {
  const r = nextSuggestion(session(20, [10, 8, 5], 1), session(20, [10, 7, 5], 1), { exerciseId: "romanian_deadlift", settings, week: 3 });
  assert.equal(r.action, "lower10");
  assert.equal(r.weight_kg, 18);
});

test("row 5: pain or form broke down -> lower the weight, no increase until form is good", () => {
  for (const flag of [{ pain: true }, { formBroke: true }]) {
    const r = suggest(session(60, [12, 12, 12], 2, flag), null, CP);
    assert.equal(r.action, "lower");
    assert.equal(r.weight_kg, 55);
    assert.equal(r.noIncrease, true);
  }
});

test("row 6: 4+ left on every set at the top, weeks 2 to 4 only -> add 2 steps", () => {
  for (const week of [2, 3, 4]) {
    const r = suggest(session(60, [12, 12, 12], 4), null, { ...CP, week });
    assert.equal(r.action, "increase2", `week ${week}`);
    assert.equal(r.weight_kg, 70);
  }
  const w5 = suggest(session(60, [12, 12, 12], 4), null, { ...CP, week: 5 });
  assert.equal(w5.action, "increase"); // week 5: one step only
  assert.equal(w5.weight_kg, 65);
  const mixed = suggest(session(60, [12, 12, 12], [4, 4, 3]), null, { ...CP, week: 3 });
  assert.equal(mixed.action, "increase"); // not 4+ on every set
});

test("row 7: the next step is a big jump (over about 10 %) -> first reach 2 reps above the range at the old weight", () => {
  const curl = { exerciseId: "db_curl" }; // range 10-15, dumbbells 2 kg apart: 10 -> 12 is 20 %
  const first = nextSuggestion(session(10, [15, 15, 15], 2), null, { ...curl, settings, week: 3 });
  assert.equal(first.action, "extra_reps");
  assert.equal(first.weight_kg, 10);
  assert.deepEqual(first.range, [10, 17]);
  const then = nextSuggestion(session(10, [17, 17, 17], 2), null, { ...curl, settings, week: 3, range: [10, 17] });
  assert.equal(then.action, "increase");
  assert.equal(then.weight_kg, 12);
  assert.deepEqual(then.range, [10, 15]);
  // exactly 10 % is not "more than": 20 -> 22 moves up at once
  const fine = nextSuggestion(session(20, [15, 15, 15], 2), null, { ...curl, settings, week: 3 });
  assert.equal(fine.action, "increase");
  assert.equal(fine.weight_kg, 22);
  assert.equal(stepSize(10, "db_curl", settings), 2);
});

test("bodyweight and timed abs: all sets at the top -> add 2 reps or 5 seconds", () => {
  const plank = nextSuggestion({ weight_kg: 0, sets: [{ seconds: 40, rir: 1 }, { seconds: 40, rir: 1 }, { seconds: 40, rir: 2 }] }, null, { exerciseId: "plank", settings, week: 3 });
  assert.equal(plank.action, "increase");
  assert.deepEqual(plank.range, [20, 45]);
  const bug = nextSuggestion(session(0, [8, 8], 1), null, { exerciseId: "dead_bug", settings, week: 3 });
  assert.deepEqual(bug.range, [8, 10]);
  const notYet = nextSuggestion({ weight_kg: 0, sets: [{ seconds: 40, rir: 1 }, { seconds: 35, rir: 1 }] }, null, { exerciseId: "plank", settings, week: 3 });
  assert.equal(notYet.action, "same_add_rep");
  assert.match(notYet.note, /1 more second/);
});

test("weeks 1, 6 and 12 do not progress: same weight (but pain still lowers it)", () => {
  for (const week of [1, 6, 12]) {
    const r = suggest(session(60, [12, 12, 12], 4), null, { ...CP, week });
    assert.equal(r.action, "hold", `week ${week}`);
    assert.equal(r.weight_kg, 60);
  }
  assert.equal(suggest(session(60, [12, 12, 12], 4, { pain: true }), null, { ...CP, week: 6 }).action, "lower");
  assert.equal(suggest(session(60, [12, 12, 12], 4), null, { ...CP, week: 11 }).action, "increase"); // week 11 is a push week
});

test("steps: dumbbell sizes, stacks and the Smith machine (2.5 kg each side)", () => {
  assert.equal(stepUp(12, "db_curl", settings), 14);
  assert.equal(stepUp(12, "db_curl", settings, 2), 16);
  assert.equal(stepUp(30, "db_curl", settings), 32); // past the list: same gap again
  assert.equal(stepDown(12, "db_curl", settings), 10);
  assert.equal(stepDown(2, "db_curl", settings), 2); // trainer D19 (0.7.6): never below the lightest dumbbell (was 0)
  assert.equal(stepUp(60, "chest_press", settings), 65);
  assert.equal(stepUp(60, "chest_press", { stack_step_kg: { default: 5, chest_press: 2.5 } }), 62.5); // per-exercise step
  assert.equal(stepUp(60, "smith_squat", settings), 65);
  assert.equal(stepDown(60, "hip_thrust", settings), 55);
  assert.equal(stepUp(60, "chest_press", {}), 65); // fallback before the first visit check
  assert.equal(stepUp(10, "db_curl", {}), 12);
});

test("lowerBy rounds down to a size the gym has and is always at least one step lower (never below the floor, D19)", () => {
  assert.equal(lowerBy(60, 0.1, "chest_press", settings), 50);
  assert.equal(lowerBy(20, 0.1, "db_curl", settings), 18);
  assert.equal(lowerBy(10, 0.1, "db_curl", settings), 8);
  assert.equal(lowerBy(5, 0.1, "chest_press", settings), 5); // trainer D19 (0.7.6): never below one stack step (was 0)
  assert.ok(lowerBy(60, 0.01, "chest_press", settings) < 60); // 1 % still drops one step
});

test("warm-up sets: about 50 % x 10, then about 75 % x 5, rounded to the gym's weights", () => {
  assert.deepEqual(warmupSets(60, "chest_press", settings), [{ weight_kg: 30, reps: 10 }, { weight_kg: 45, reps: 5 }]);
  assert.deepEqual(warmupSets(20, "romanian_deadlift", settings), [{ weight_kg: 10, reps: 10 }, { weight_kg: 14, reps: 5 }]);
  assert.deepEqual(warmupSets(10, "chest_press", settings), [{ weight_kg: 5, reps: 10 }]); // the 75 % set would equal the work weight
  assert.deepEqual(warmupSets(0, "plank", settings), []);
  assert.deepEqual(warmupSets(10, "plank", settings), []); // bodyweight
});

test("auto-deload: 3 or more 10 % drops in 2 weeks, or a whole week at 9 or 10 out of 10", () => {
  assert.equal(shouldBringDeloadForward({ tenPercentDrops: 3 }), true);
  assert.equal(shouldBringDeloadForward({ tenPercentDrops: 2 }), false);
  assert.equal(shouldBringDeloadForward({ sessionEfforts: [9, 10, 9, 9, 10] }), true);
  assert.equal(shouldBringDeloadForward({ sessionEfforts: [9, 10, 8, 9, 10] }), false);
  assert.equal(shouldBringDeloadForward({}), false);
});

test("sleep under 6 hours keeps the effort one step easier (RIR 3)", () => {
  assert.equal(effortWithSleep(2, true), 3);
  assert.equal(effortWithSleep(2, false), 2);
  assert.equal(effortWithSleep(3, true), 3);
  assert.equal(effortWithSleep(4, true), 4);
  assert.equal(effortWithSleep([1, 2], true), 3);
});

test("weights after a break: about 10 % or 20 % lower, to a size the gym has", () => {
  assert.equal(weightAfterBreak(60, 0.9, "chest_press", settings), 50);
  assert.equal(weightAfterBreak(60, 0.8, "chest_press", settings), 45); // 48 -> 45
  assert.equal(weightAfterBreak(20, 0.9, "db_curl", settings), 18);
  assert.equal(weightAfterBreak(20, 0.8, "db_curl", settings), 16);
  assert.equal(weightAfterBreak(60, 1, "chest_press", settings), 60);
});
