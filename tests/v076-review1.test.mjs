// Version 0.7.6 (worker 8.43): review round 1 and the master's two picks. Both reviewers found their planted mistake
// (checker: floored() without the cap at the start weight; auditor: knownExercise reading the prototype chain).
// Written BEFORE the fixes (tests first). All values are made up.
// - R1 (checker major): week 1 "find your weight" at the floor: the weight holds, so the note is the D19 note, never
//   "Remove 2 steps" (D19 rule 2 lists these steps; answer 3: every at-floor case).
// - R2 (checker minor): a pain swap whose START is at the new exercise's floor gets the combined note and 3 reps left,
//   also when the start comes from the new exercise's own log (no swap weight saved); never two notes.
// - R3 (auditor minor): the stop Undo message sits under the top bar, so it never covers "End" or the progress bar.
// - R4 (auditor note): the food hint on Today only for food problems whose own words do not say it will sync by itself
//   (not for "offline", "rate" or "error": "Saved on phone. Will sync ...").
// - M1 (master pick 1 a under Rosario's 94 a): Today's eyebrow in the practice week says only "Practice week".
// - M2 (master pick 2 a): protein: whole grams for every total; 1 decimal only on a single food row under 10 g.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { install } from "./fixtures/sheet-dom.mjs";

const { body } = install();
globalThis.requestAnimationFrame = () => 0;
globalThis.window.navigator = { standalone: true, onLine: true };
globalThis.window.matchMedia = () => ({ matches: true, addEventListener() {} });
Object.assign(globalThis.location, { hostname: "localhost", search: "?date=2026-11-18" });
const { store } = await import("../app/js/ui/app.js");
const { validDoc } = await import("./fixtures/profiles.mjs");
const P = await import("../app/js/engine/progression.js");
const { week1NextSet } = await import("../app/js/engine/week1.js");
const { renderWorkout } = await import("../app/js/ui/workout.js");
const { setActive, clearActive } = await import("../app/js/active.js");
const { foodHint } = await import("../app/js/sync/foodsync.js");
const { PRACTICE_LABEL } = await import("../app/js/engine/schedule.js");
const { renderToday } = await import("../app/js/ui/today.js");
const fmath = await import("../app/js/food/foodmath.js");
const { entryParts } = await import("../app/js/diet/diet.js");

const src = (p) => readFileSync(new URL(`../app/${p}`, import.meta.url), "utf8").replaceAll("\r\n", "\n");
const DB = { dumbbell_steps_kg: [2, 4, 6], stack_step_kg: { default: 5 } };
const textOf = (out) => (Array.isArray(out) ? out : [out]).filter(Boolean).map((x) => x.textContent).join(" ");

// ---------- R1: week 1 at the floor ----------

test("R1 week 1: 'too heavy' at the lightest step holds the weight and says the D19 note; above it, as before", () => {
  const at = week1NextSet({ weight_kg: 5, reps: 1, left: "0-1" }, "chest_press", DB);
  assert.equal(at.weight_kg, 5);
  assert.equal(at.note, P.FLOOR_NOTE);
  assert.equal(at.atFloor, true);
  const heavy = week1NextSet({ weight_kg: 2, reps: 9, left: "0-1" }, "lateral_raise", DB);
  assert.equal(heavy.weight_kg, 2);
  assert.equal(heavy.note, P.FLOOR_NOTE, "'A bit heavy. Remove 1 step.' at 2 kg too");
  const above = week1NextSet({ weight_kg: 20, reps: 1, left: "0-1" }, "chest_press", DB);
  assert.equal(above.note, "Too heavy. Remove 2 steps.");
  assert.equal(above.weight_kg, 10);
  assert.ok(!above.atFloor);
  const good = week1NextSet({ weight_kg: 5, reps: 10, left: "2-3" }, "chest_press", DB);
  assert.equal(good.note, "Good. Keep this weight. It is your starting weight.", "no lowering asked: no floor note");
});

// ---------- R2: a pain swap that starts at the floor from the new exercise's own log ----------

let n = 0;
function done(date, exId, kg, reps) {
  n += 1;
  return {
    id: `s-${date.replaceAll("-", "")}-r${n}`, updated_at: `${date}T10:00:00.000Z`, date, plan_day: "tue", week: 1, kind: "full", swapped_from: null,
    status: "finished", started_at: `${date}T08:00:00.000Z`, finished_at: `${date}T10:00:00.000Z`, walk: null, note: "",
    exercises: [{ slot: "B2", plan_exercise: exId, done_exercise: exId, swap_reason: null, note: "", planned_sets: 3, planned_rest: 90,
      sets: reps.map((r, i) => ({ n: i + 1, type: "work", weight_kg: kg, reps: r, rir: 2 })) }],
  };
}
function painCardFromLog(history) {
  const doc = validDoc();
  doc.shared_settings = { ...doc.shared_settings, ...DB };
  doc.block.start_monday = "2026-11-09";
  doc.sessions = history;
  doc.exercise_state = [];
  const s = {
    id: "s-20261118-tue-pain-r2", updated_at: "2026-11-18T08:00:00.000Z", date: "2026-11-18", plan_day: "tue", week: 2, kind: "full", swapped_from: null,
    status: "in_progress", started_at: "2026-11-18T08:00:00.000Z", finished_at: null, walk: null, note: "",
    exercises: [{ slot: "B2", plan_exercise: "face_pull", done_exercise: "rear_delt_raise", swap_reason: "hurts", swap_weight_kg: null, note: "Shoulder", planned_sets: 3, planned_rest: 90, sets: [] }],
  };
  doc.sessions.push(s);
  store.save(doc);
  store.saveDevice({});
  setActive({ session_id: s.id, phase: "weights", rest: null, hold: null });
  globalThis.location.hash = "#/workout";
  const out = renderWorkout();
  clearActive();
  return textOf(out);
}

test("R2 a pain swap that starts at the floor from the new exercise's own log: the combined note and 3 reps left", () => {
  const text = painCardFromLog([done("2026-11-13", "rear_delt_raise", 2, [12, 12, 12])]);
  assert.ok(text.includes(P.PAIN_FLOOR_NOTE), "the combined note");
  assert.ok(!text.includes("Start light."));
  assert.match(text, /stop with 3 left/);
});

test("R2b the own log is itself at the floor (two hard workouts at 2 kg): ONE note, the combined one", () => {
  const text = painCardFromLog([done("2026-11-11", "rear_delt_raise", 2, [8, 8, 8]), done("2026-11-13", "rear_delt_raise", 2, [8, 8, 8])]);
  assert.ok(text.includes(P.PAIN_FLOOR_NOTE));
  assert.equal(text.split("Lightest weight already").length - 1, 1, "never the floor note twice");
  assert.ok(!text.includes("Start light."));
  assert.match(text, /stop with 3 left/);
});

test("R2c a pain swap from the own log above the floor: as before", () => {
  const text = painCardFromLog([done("2026-11-13", "rear_delt_raise", 6, [12, 12, 12])]);
  assert.ok(text.includes("You swapped because it hurt. Start light."));
  assert.ok(!text.includes("Lightest weight already"));
});

// ---------- R3: the Undo message under the top bar ----------

test("R3 the stop Undo message sits under the top bar (16 px screen top + 44 px bar + 16 px), never over 'End'", () => {
  const css = src("css/app.css");
  assert.match(css, /\.toast\.undo-toast\.at-top \{[^}]*top: calc\(var\(--s4\) \+ var\(--tap-min\) \+ var\(--s4\) \+ var\(--top-clear\) \+ env\(safe-area-inset-top\)\)[^}]*bottom: auto/);
  assert.match(css, /\.screen \{[^}]*padding: calc\(var\(--s4\) \+ var\(--top-clear\) \+ env\(safe-area-inset-top\)\)/, "the screen top this is measured from");
  assert.match(css, /\.topbar \{[^}]*min-height: var\(--tap-min\)/, "the top bar height this is measured from");
});

// ---------- R4: the food hint only for problems that need a tap or a fix ----------

test("R4 food hint: none for 'offline', 'rate' and 'error' (they sync by themselves); a hint for the rest", () => {
  const C = { token: "made-up-test-token", owner: "someone", repo: "training-data", last_sync_result: "ok" };
  for (const r of ["offline", "rate", "error", "ok"]) assert.equal(foodHint({ ...C, food_last_sync_result: r }), null, r);
  for (const r of ["conflict", "auth", "no_access", "broken_remote", "too_new", "full", "local_problem", "local_invalid", "damaged"]) {
    assert.equal(foodHint({ ...C, food_last_sync_result: r }), "Food did not sync. See Diet.", r);
  }
});

// ---------- M1: the practice eyebrow on Today ----------

test("M1 Today's eyebrow in the practice week says only 'Practice week'; the full label stays everywhere else", () => {
  assert.equal(PRACTICE_LABEL, "Practice week · Learn, find weights");
  const doc = validDoc();
  doc.block.start_monday = "2026-11-23"; // the plan starts next Monday: this week is the practice week
  store.save(doc);
  store.saveDevice({});
  globalThis.location.hash = "#/today";
  const root = [renderToday()].flat()[0];
  const eyebrow = root.querySelectorAll(".eyebrow").find((e) => /Practice/.test(e.textContent));
  assert.ok(eyebrow, "a practice eyebrow");
  assert.equal(eyebrow.textContent, "Practice week");
  assert.match(src("js/ui/today.js"), /PRACTICE_SHORT/);
});

// ---------- M2: protein rounding ----------

test("M2 protein: a single food row under 10 g keeps 1 decimal; 10 g and more, and every total, whole grams", () => {
  assert.equal(fmath.proteinText(9.46), "9.5");
  assert.equal(fmath.proteinText(0.04), "0");
  assert.equal(fmath.proteinText(9.96), "10");
  assert.equal(fmath.proteinText(12.44), "12");
  assert.equal(fmath.proteinText(31.5), "32");
  assert.equal(fmath.proteinText(0), "0");
  const row = (g) => entryParts({ protein_g: g, kcal: 100, amount_g: 50, updated_at: "2026-11-18T08:10:00.000Z" }).big;
  assert.equal(row(4.25), "4.3 g");
  assert.equal(row(23.67), "24 g", "a row of 10 g or more: whole grams");
  const diet = src("js/diet/diet.js");
  assert.match(diet, /big: `\$\{proteinText\(e\.protein_g\)\} g`/);
  assert.match(diet, /`\$\{m\.kcal\} kcal · \$\{Math\.round\(m\.protein_g\)\} g protein`/, "a meal total: whole grams");
  assert.match(diet, /const fmt = \(n\) => Math\.round\(n\)/, "the ring and its words: whole grams");
  assert.match(src("js/diet/sheets.js"), /\$\{entry\.kcal\} kcal · \$\{proteinText\(entry\.protein_g\)\} g protein/, "one entry's sheet: the row rule");
  assert.ok(body, "fake page ready");
});
