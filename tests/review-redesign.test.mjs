// Safety review of the redesign merge (docs/REVIEW-2026-11-17-redesign.md). One test block per finding, written
// before the fix (each fails on the code it was written against).
import test from "node:test";
import assert from "node:assert/strict";
import { planForDay } from "../app/js/engine/schedule.js";
import * as workout from "../app/js/engine/workout.js";
import { week1Stage } from "../app/js/engine/week1.js";
import { exercises } from "../app/js/plan/plan-v2.js";
import { createStore } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { fakeStorage, validDoc } from "./fixtures/profiles.mjs";

// ---------- R1: a swap in the middle of a week-1 exercise ----------
// Since the swap fix (33557cc) a mid-exercise swap leaves the old record in the workout and puts a new record for the
// same slot in front of it. The week-1 screen walked the WHOLE list of records, so after the new exercise was done it
// went back to the exercise Rosario had swapped away from (for example a busy machine), at "set 2", and the count
// said "Exercise 2 of 8" in a 7-exercise workout. The guided list must hold the current record of each slot only.
function week1Setup() {
  const store = createStore(fakeStorage());
  store.save(validDoc());
  let tick = 0;
  const model = createModel(store, () => new Date(Date.UTC(2026, 0, 5, 8, 0, tick++)));
  const plan = planForDay("mon", 1);
  const s = model.startSession({ planDay: "mon", week: 1, kind: "full", slots: plan.slots });
  return { store, model, s, plan };
}
const weighted = (rec) => exercises[rec.done_exercise].step !== "bodyweight";

test("R1 week 1: after a mid-exercise swap, the guided list has one record per slot, the new one", () => {
  const { store, model, s, plan } = week1Setup();
  assert.equal(typeof workout.currentRecords, "function", "engine/workout.js exports currentRecords(session)");
  // Set 1 of the first exercise, with its "how many more" answer, then the machine is busy: swap.
  model.flagExercise(s.id, "A1", { w1_ready: true });
  model.skipWarmup(s.id, "A1");
  model.logSet(s.id, "A1", { type: "work", weight_kg: 20, reps: 10 });
  model.setLastRir(s.id, "A1", 2, "2-3");
  model.swapExercise(s.id, "A1", "db_bench_press", "busy");
  const session = store.load().sessions[0];
  const recs = workout.currentRecords(session);
  assert.equal(recs.length, plan.slots.length, "the count stays the plan's number of exercises");
  assert.deepEqual(recs.map((r) => r.slot), plan.slots.map((x) => x.slot), "plan order, each slot once");
  assert.equal(recs[0].done_exercise, "db_bench_press");
  assert.equal(recs[0].sets.length, 0);
  // The old set is still in the workout (nothing lost).
  assert.equal(session.exercises.filter((r) => r.done_exercise === "chest_press" && r.sets.length === 1).length, 1);
});

test("R1 week 1: once the swapped-in exercise is done, the screen moves on, never back to the swapped-out one", () => {
  const { store, model, s } = week1Setup();
  model.flagExercise(s.id, "A1", { w1_ready: true });
  model.skipWarmup(s.id, "A1");
  model.logSet(s.id, "A1", { type: "work", weight_kg: 20, reps: 10 });
  model.setLastRir(s.id, "A1", 2, "2-3");
  model.swapExercise(s.id, "A1", "db_bench_press", "busy");
  // The swapped-in exercise: learn, no warm-up, two sets with answers, result saved.
  model.flagExercise(s.id, "A1", { w1_ready: true });
  model.skipWarmup(s.id, "A1");
  model.logSet(s.id, "A1", { type: "work", weight_kg: 10, reps: 10 });
  model.setLastRir(s.id, "A1", 2, "2-3");
  model.logSet(s.id, "A1", { type: "work", weight_kg: 10, reps: 10 });
  model.setLastRir(s.id, "A1", 2, "2-3");
  model.flagExercise(s.id, "A1", { w1_saved: true });
  const session = store.load().sessions[0];
  const recs = workout.currentRecords(session);
  const next = recs.find((r) => week1Stage(r, weighted(r)) !== "done");
  assert.equal(next.slot, "A2", "the next exercise is the second one of the plan");
  assert.notEqual(next.done_exercise, "chest_press");
});

test("R1: currentRecords on a workout without swaps is the list itself, and ignores nothing else", () => {
  const { store, s } = week1Setup();
  const session = store.load().sessions.find((x) => x.id === s.id);
  assert.deepEqual(workout.currentRecords(session), session.exercises);
});

// ---------- R2: the Done button after a "Not saved" error ----------
// lockedButton (the 170 ms double-tap lock) turns the button off before it saves. When the save throws (phone full,
// storage blocked: review F2 shows "Not saved"), the button stayed off, so Done could not be tapped again after
// freeing space; only leaving the screen helped. In 0.3 the plain button could simply be tapped again.
test("R2: when the save fails, the Done button can be tapped again, and the error still reaches the page", async () => {
  const { installFakeDom } = await import("./fixtures/fake-dom.mjs");
  installFakeDom();
  const { lockedButton } = await import("../app/js/ui/parts.js");
  const { StoreError } = await import("../app/js/store.js");
  let tries = 0;
  let after = 0;
  const btn = lockedButton("Done", {
    key: "r2-test", armMs: 0, doneText: "Saved",
    work: () => { tries += 1; if (tries === 1) throw new StoreError("full", "Phone storage is full."); },
    after: () => { after += 1; },
  });
  assert.throws(() => btn.click(), StoreError, "the error goes on to the page's 'Not saved' message");
  assert.equal(btn.disabled, false, "the button works again after a failed save");
  btn.click();
  assert.equal(tries, 2, "the second tap saves");
  assert.equal(btn.disabled, true, "after a good save the lock holds until the next screen");
  await new Promise((r) => setTimeout(r, 200));
  assert.equal(after, 1, "the next screen is drawn once, only after the good save");
});

// ---------- R3: a long word in a note pushes the Done button off the screen ----------
// A "where" note (or a machine settings note) with a long run of letters and no space, for example a pasted web
// link, made the set screen wider than the phone. The page grew sideways and the fixed Done bar moved below the
// visible screen (browser check at 375 x 812: page 864 px wide, Done at y = 1788). Long words must wrap.
test("R3: the page wraps long words, so no note can make a screen wider than the phone", async () => {
  const fs = await import("node:fs");
  const css = fs.readFileSync(new URL("../app/css/app.css", import.meta.url), "utf8");
  const body = css.match(/(^|\n)body\s*\{([^}]*)\}/);
  assert.ok(body, "app.css has a body rule");
  assert.match(body[2], /overflow-wrap:\s*anywhere/, "body { overflow-wrap: anywhere } so every text can break");
});

// R3, second part (found in the print view check): with overflow-wrap: anywhere, table columns shrink and short
// words break in the middle ("Sl-ot", "mov-e" in the plan tables). Tables hold plan text only, never notes, so they
// keep the normal wrapping.
test("R3: tables keep normal word wrapping (no word broken in the middle in the plan tables)", async () => {
  const fs = await import("node:fs");
  const css = fs.readFileSync(new URL("../app/css/app.css", import.meta.url), "utf8");
  assert.match(css, /(^|\n)table\s*\{[^}]*overflow-wrap:\s*normal/, "table { overflow-wrap: normal }");
});
