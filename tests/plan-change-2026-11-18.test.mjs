// Plan change 2026-11-18 (Rosario's answers 80 a, 81 a, 82 a, 83 a), proposal docs/plan/2026-11-17-plan-review-proposal.md.
// Monday, Wednesday and Thursday: the first abs move drops from 3 to 2 sets, the second abs move goes, and a move
// "on its own" (slot D) takes its place: calf raise on the leg press (Mon, Wed), dumbbell lying leg curl (Thu).
// Expected numbers are written out by hand from the proposal (sections 4, 5, 6), not computed from the data.
import test from "node:test";
import assert from "node:assert/strict";
import { exercises, days, setsFor, PLAN_ID, DAY_IDS } from "../app/js/plan/plan-v2.js";
import { exerciseMuscles } from "../app/js/plan/muscles.js";
import { media, VIDEOS, videoFor, machineOf } from "../app/js/plan/media.js";
import { cues } from "../app/js/plan/cues.js";
import { shortDaySlots, planForDay, expectedMinutes } from "../app/js/engine/schedule.js";

const slotOf = (day, slot) => days[day].slots.find((s) => s.slot === slot);
// Weeks of each phase: week 1, weeks 2-5, week 6 (and 12), weeks 7-11.
const PHASE_WEEKS = { w1: [1], w2to5: [2, 3, 4, 5], w6: [6, 12], w7to11: [7, 8, 9, 10, 11] };

test("the plan keeps its id (lead's choice: Plan edits and history keep working)", () => {
  assert.equal(PLAN_ID, "plan-v2");
});

test("Monday, Wednesday and Thursday: Abs1 has 2 sets, there is no Abs2, D follows Abs1 with 3 sets and 60 s", () => {
  for (const day of ["mon", "wed", "thu"]) {
    const slots = days[day].slots;
    assert.deepEqual(slots.slice(-2).map((s) => s.slot), ["Abs1", "D"], `${day}: last two slots`);
    assert.ok(!slots.some((s) => s.slot === "Abs2"), `${day}: no Abs2`);
    assert.equal(slotOf(day, "Abs1").sets, 2, `${day} Abs1 sets`);
    assert.equal(slotOf(day, "Abs1").rest, 30, `${day} Abs1 rest`);
    assert.equal(slotOf(day, "D").sets, 3, `${day} D sets`);
    assert.equal(slotOf(day, "D").rest, 60, `${day} D rest`);
    assert.equal(slots.length, 8, `${day}: 6 pair slots, Abs1, D`);
  }
  assert.deepEqual(["mon", "wed", "thu"].map((d) => slotOf(d, "Abs1").ex), ["plank", "side_plank", "plank"]);
  assert.deepEqual(["mon", "wed", "thu"].map((d) => slotOf(d, "D").ex), ["calf_raise_leg_press", "calf_raise_leg_press", "db_lying_leg_curl"]);
});

// This change left Tuesday and Friday alone. Trainer D18 (0.7.5) later swapped five of their exercises for machines and
// simpler moves, with the same slots, sets and rest (tests/v075-d18.test.mjs D18-1): checked here as slots, sets, rest.
test("Tuesday and Friday did not change here (exercises changed later by D18, 0.7.5; slots, sets and rest the same)", () => {
  assert.deepEqual(days.tue.slots.map((s) => [s.slot, s.sets, s.rest]), [
    ["A1", 3, null], ["A2", 3, 90], ["B1", 3, null], ["B2", 3, 90], ["C1", 3, null], ["C2", 3, 75], ["D", 3, 60],
  ]);
  assert.deepEqual(days.fri.slots.map((s) => [s.slot, s.sets, s.rest]), [
    ["A1", 3, null], ["A2", 3, 90], ["B1", 3, null], ["B2", 3, 75], ["C1", 3, null], ["C2", 2, 60], ["D", 3, 60],
  ]);
});

test("the pairs A to C of Monday, Wednesday and Thursday did not change", () => {
  const pairs = (d) => days[d].slots.filter((s) => /^[ABC][12]$/.test(s.slot)).map((s) => [s.slot, s.ex, s.sets, s.rest]);
  assert.deepEqual(pairs("mon"), [["A1", "chest_press", 3, null], ["A2", "pulldown", 3, 90], ["B1", "shoulder_press_machine", 3, null],
    ["B2", "one_arm_db_row", 3, 90], ["C1", "db_curl", 3, null], ["C2", "triceps_pushdown", 3, 60]]);
  assert.deepEqual(pairs("wed"), [["A1", "goblet_squat", 3, null], ["A2", "db_bench_press", 3, 90], ["B1", "pulldown", 3, null],
    ["B2", "lateral_raise", 2, 75], ["C1", "hammer_curl", 2, null], ["C2", "overhead_triceps_ext", 2, 60]]);
  assert.deepEqual(pairs("thu"), [["A1", "incline_db_press", 3, null], ["A2", "seated_cable_row", 3, 90], ["B1", "seated_db_shoulder_press", 3, null],
    ["B2", "face_pull", 3, 75], ["C1", "lateral_raise", 3, null], ["C2", "triceps_pushdown", 3, 60]]);
});

test("the new exercises: names, equipment, reps, step, muscle", () => {
  const e = exercises;
  assert.equal(e.db_lying_leg_curl.name, "Dumbbell lying leg curl");
  assert.equal(e.db_lying_leg_curl.equipment, "Dumbbell + flat bench, lying face down");
  assert.deepEqual([e.db_lying_leg_curl.kind, e.db_lying_leg_curl.range, e.db_lying_leg_curl.step, e.db_lying_leg_curl.muscle], ["reps", [10, 15], "dumbbell", "hamstrings"]);
  assert.equal(e.db_lying_leg_curl.perSide, undefined);
  assert.equal(e.one_leg_db_calf_raise.name, "One-leg dumbbell calf raise");
  assert.equal(e.one_leg_db_calf_raise.perSide, true);
  assert.deepEqual([e.one_leg_db_calf_raise.kind, e.one_leg_db_calf_raise.range, e.one_leg_db_calf_raise.step, e.one_leg_db_calf_raise.muscle], ["reps", [12, 15], "dumbbell", "calves"]);
  assert.match(e.one_leg_db_calf_raise.equipment, /step/i);
  assert.match(e.one_leg_db_calf_raise.equipment, /dumbbell/i);
  assert.equal(e.cable_leg_curl.name, "Standing cable leg curl");
  assert.equal(e.cable_leg_curl.equipment, "Cable, low pulley, ankle strap (first visit check)");
  assert.equal(e.cable_leg_curl.perSide, true);
  assert.deepEqual([e.cable_leg_curl.kind, e.cable_leg_curl.range, e.cable_leg_curl.step, e.cable_leg_curl.muscle], ["reps", [10, 15], "stack", "hamstrings"]);
});

test("swaps, in the order of answer 82 a and proposal section 5", () => {
  assert.deepEqual(exercises.calf_raise_leg_press.swaps, [
    { id: "calf_raise_machine", needsMachine: "calf_raise" }, { id: "calf_raise_standing" }, { id: "one_leg_db_calf_raise" },
  ]);
  assert.deepEqual(exercises.db_lying_leg_curl.swaps, [
    { id: "leg_curl_machine", needsMachine: "leg_curl" }, { id: "cable_leg_curl" }, { id: "romanian_deadlift" },
  ]);
  // new swap-only exercises have no swaps and are not in any day; an ankle strap is not a machine, so no needsMachine
  const inDays = new Set(Object.values(days).flatMap((d) => d.slots.map((s) => s.ex)));
  for (const id of ["one_leg_db_calf_raise", "cable_leg_curl"]) {
    assert.deepEqual(exercises[id].swaps, [], id);
    assert.ok(!inDays.has(id), `${id} is swap-only`);
  }
  assert.ok(inDays.has("calf_raise_leg_press") && inDays.has("db_lying_leg_curl"));
  // a planned exercise never needs a machine that may not exist: no planned exercise is itself a first-visit machine
  const needsMachine = new Set(Object.values(exercises).flatMap((x) => x.swaps.filter((s) => s.needsMachine).map((s) => s.id)));
  for (const id of ["calf_raise_leg_press", "db_lying_leg_curl"]) assert.ok(!needsMachine.has(id), id);
  // the swap-only part of the list still ends the list, after the planned ones
  const ids = Object.keys(exercises);
  assert.ok(ids.indexOf("db_lying_leg_curl") < ids.indexOf("cable_curl"), "db_lying_leg_curl is in the planned part of the list");
  assert.ok(ids.indexOf("one_leg_db_calf_raise") > ids.indexOf("cable_curl") && ids.indexOf("cable_leg_curl") > ids.indexOf("cable_curl"));
});

test("sets in every week for the new D slots and the Abs1 slots (answer 83 a: new moves start like week 1)", () => {
  // [week 1, weeks 2-5, week 6 and 12, weeks 7-11] by setsFor (one less in weeks 6 and 12). Weeks 7-11 changed in
  // 0.7.1 by the trainer's L2 (answer T3 to 8.39): on Mon, Wed, Thu D keeps 3 sets and Abs1 has one set less.
  const expectD = { w1: 2, w2to5: 3, w6: 2, w7to11: 3 };
  const expectAbs1 = { w1: 2, w2to5: 2, w6: 1, w7to11: 1 };
  for (const [phase, wk] of Object.entries(PHASE_WEEKS)) {
    for (const week of wk) {
      for (const day of ["mon", "wed", "thu"]) {
        assert.equal(setsFor(week, day, "D"), expectD[phase], `week ${week} ${day} D`);
        assert.equal(setsFor(week, day, "Abs1"), expectAbs1[phase], `week ${week} ${day} Abs1`);
      }
    }
  }
  assert.throws(() => setsFor(2, "mon", "Abs2"), /No slot Abs2/);
  assert.throws(() => setsFor(2, "thu", "Abs2"), /No slot Abs2/);
});

// Weekly sets per muscle: "direct" = the muscle is a main muscle of the exercise (muscles.js = free-exercise-db primary).
const weeklySets = (week, muscle) => {
  let n = 0;
  for (const day of DAY_IDS) for (const s of days[day].slots) if (exerciseMuscles[s.ex].main.includes(muscle)) n += setsFor(week, day, s.slot);
  return n;
};

test("weekly sets per muscle match proposal section 4 (calves, back of the thighs direct, abs)", () => {
  // Proposal section 4, "after" columns: week 1, weeks 2-5, weeks 6 and 12, weeks 7-11. Weeks 7-11 changed in 0.7.1
  // by the trainer's L2 (answer T3 to 8.39): calves 6 -> 8, back of the thighs 5 -> 6, abs 19 -> 16.
  const after = { calves: [6, 9, 6, 8], hamstrings: [4, 6, 4, 6], abs: [14, 17, 10, 16] };
  const cols = { w1: 0, w2to5: 1, w6: 2, w7to11: 3 };
  for (const [muscle, row] of Object.entries(after)) {
    for (const [phase, wk] of Object.entries(PHASE_WEEKS)) for (const week of wk) assert.equal(weeklySets(week, muscle), row[cols[phase]], `${muscle} week ${week}`);
  }
});

test("days a week: calves on Mon, Wed, Fri (never Tue); back of the thighs direct on Tue and Thu", () => {
  const daysWith = (muscle) => DAY_IDS.filter((d) => days[d].slots.some((s) => exerciseMuscles[s.ex].main.includes(muscle)));
  assert.deepEqual(daysWith("calves"), ["mon", "wed", "fri"]);
  assert.deepEqual(daysWith("hamstrings"), ["tue", "thu"]);
});

test("short day on Monday, Wednesday, Thursday: pairs A and B, then Abs1 (2 sets) only, no D", () => {
  for (const day of ["mon", "wed", "thu"]) {
    const { pairs, abs } = shortDaySlots(day, 3);
    assert.deepEqual(pairs.map((s) => s.slot), ["A1", "A2", "B1", "B2"], day);
    assert.deepEqual(abs.map((s) => [s.slot, s.sets]), [["Abs1", 2]], day);
    const plan = planForDay(day, 3, "short");
    assert.ok(!plan.slots.some((s) => s.slot === "D"), `${day}: no D on the short day`);
    assert.ok(!plan.slots.some((s) => s.slot === "Abs2"), `${day}: no Abs2`);
  }
});

// Proposal section 6 time model, written out: a set takes 45 s (12-15 reps), 40 s (10-15 reps) or the top of the hold range;
// a one-sided hold counts both sides; the dead bug (8 each side) 30 s. Slot = 30 s to start + sets + rests between sets.
// The first floor exercise of the abs slot adds 1 minute to change to the floor. Weeks 2-5 sets.
function absSlotMinutes(day, slotNames) {
  const setSeconds = (ex) => (ex.kind === "hold" ? ex.range[1] * (ex.perSide ? 2 : 1) : ex.range[1] === 8 ? 30 : ex.range[0] === 12 ? 45 : 40);
  let seconds = 0, floor = false;
  for (const name of slotNames) {
    const slot = slotOf(day, name);
    const ex = exercises[slot.ex];
    seconds += 30 + slot.sets * setSeconds(ex) + (slot.sets - 1) * slot.rest;
    if (!floor && (ex.equipment === "Floor" || ex.equipment === "Bench or mat")) { seconds += 60; floor = true; }
  }
  return seconds / 60;
}

test("proposal section 6: abs slot minutes per day (weeks 2-5), after the change", () => {
  // Proposal "after" column: Monday about 8, Wednesday about 8.75, Thursday about 7.75 (the model is within 0.1 minute).
  const model = { mon: absSlotMinutes("mon", ["Abs1", "D"]), wed: absSlotMinutes("wed", ["Abs1", "D"]), thu: absSlotMinutes("thu", ["Abs1", "D"]) };
  assert.ok(Math.abs(model.mon - 8) <= 0.1, `Monday ${model.mon}`);
  assert.ok(Math.abs(model.wed - 8.75) <= 0.1, `Wednesday ${model.wed}`);
  assert.ok(Math.abs(model.thu - 7.75) <= 0.1, `Thursday ${model.thu}`);
});

test("proposal section 6: abs slot minutes per day before the change (old data written out), and the change per day", () => {
  // Before (plan v2): Mon plank 3 x 20-40 s rest 30 + dead bug 2 x 8 rest 30; Wed side plank 3 x 15-30 s each side + dead bug 2;
  // Thu plank 3 + cable crunch 3 x 10-15 rest 45. Same model.
  const sec = (start, sets, perSet, rest) => start + sets * perSet + (sets - 1) * rest;
  const before = {
    mon: (sec(30, 3, 40, 30) + 60 + sec(30, 2, 30, 30)) / 60,
    wed: (sec(30, 3, 60, 30) + 60 + sec(30, 2, 30, 30)) / 60,
    thu: (sec(30, 3, 40, 30) + 60 + sec(30, 3, 40, 45)) / 60,
  };
  assert.deepEqual([before.mon, before.wed, before.thu], [6.5, 7.5, 8.5], "proposal 'before' column");
  const after = { mon: absSlotMinutes("mon", ["Abs1", "D"]), wed: absSlotMinutes("wed", ["Abs1", "D"]), thu: absSlotMinutes("thu", ["Abs1", "D"]) };
  // Proposal change column: Monday +1.5, Wednesday +1.25, Thursday -0.75 (all inside the plan's own rounding, answer 81 a).
  assert.ok(Math.abs(after.mon - before.mon - 1.5) <= 0.1);
  assert.ok(Math.abs(after.wed - before.wed - 1.25) <= 0.1);
  assert.ok(Math.abs(after.thu - before.thu + 0.75) <= 0.15);
});

test("'About N minutes' keeps its rounded numbers (answer 81 a, lead's choice): 90, and 91 in weeks 7-11", () => {
  for (const w of [1, 2, 3, 4, 5, 6, 12]) assert.equal(expectedMinutes("full", w), 90, `week ${w}`);
  for (const w of [7, 8, 9, 10, 11]) assert.equal(expectedMinutes("full", w), 91, `week ${w}`);
  assert.equal(expectedMinutes("short", 3), 60);
});

test("each new exercise has muscles from free-exercise-db, a photo, a form cue and a machine/station", () => {
  const want = {
    db_lying_leg_curl: { lib: "Lying_Leg_Curls", main: ["hamstrings"], equip: "dumbbell", station: "dumbbells_bench" },
    one_leg_db_calf_raise: { lib: "Standing_Dumbbell_Calf_Raise", main: ["calves"], equip: "dumbbell", station: "dumbbells_bench" },
    cable_leg_curl: { lib: "Standing_Leg_Curl", main: ["hamstrings"], equip: "cable", station: "cable_station" },
  };
  for (const [id, w] of Object.entries(want)) {
    assert.equal(media[id].lib, w.lib, `${id} photo entry`);
    assert.equal(media[id].match, "close", `${id}: no exact library entry`);
    assert.ok(media[id].matchNote.length > 10 && media[id].matchNote.length < 140, `${id} matchNote`);
    assert.deepEqual(exerciseMuscles[id].main, w.main, `${id} main`);
    assert.deepEqual(exerciseMuscles[id].helpers, [], `${id} helpers`);
    assert.equal(exerciseMuscles[id].equip, w.equip, `${id} equipment class`);
    assert.equal(exerciseMuscles[id].own, undefined, `${id}: no own reading needed`);
    assert.ok(cues[id] && cues[id].length > 40, `${id} cue`);
    assert.equal(machineOf[id], w.station, `${id} station`);
  }
});

test("each new exercise's form video is a plain YouTube link with channel noted; the already-existing calf raise keeps its video", () => {
  for (const id of ["db_lying_leg_curl", "one_leg_db_calf_raise", "cable_leg_curl", "calf_raise_leg_press"]) {
    const v = videoFor(id);
    assert.ok(v, `video for ${id}`);
    assert.match(v.url, /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/, id);
    assert.ok(v.channel && v.title, `${id} title and channel recorded`);
  }
  // YouTube oEmbed answered 200 with this title and channel on 2026-11-18 (docs/MEDIA.md).
  assert.deepEqual(VIDEOS.db_lying_leg_curl, { url: "https://www.youtube.com/watch?v=aPUtiouhcQQ", title: "Dumbbell Lying Leg Curl | How To | Proper Form & Technique", channel: "FITTR" });
  assert.deepEqual(VIDEOS.one_leg_db_calf_raise, { url: "https://www.youtube.com/watch?v=PTn6icEeH3Y", title: "Standing single leg dumbbell calf raises", channel: "FITTR" });
  assert.deepEqual(VIDEOS.cable_leg_curl, { url: "https://www.youtube.com/watch?v=QerRbPE55D8", title: "Standing Cable Leg Curls", channel: "WABBA" });
  assert.equal(new URL(VIDEOS.calf_raise_leg_press.url).searchParams.get("v"), "dhRz1Ns60Zg");
});
