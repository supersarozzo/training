// Version 0.7.1 (worker 8.39): fixes for the independent auditor's round-2 findings (docs/checks/2026-11-18-wave4.md).
//  R4  The Undo toast and the update banner still sat inside the iOS top blur of the Home Screen app: every top that
//      starts at the status bar adds --top-clear (auditor round 2, finding 1; DESIGN.md section 5).
//  R5  On a practice day the result card said "Your starting weight for week 2"; a weight found in practice is the
//      start of week 1 (trainer D11 rule 4; auditor round 2, finding 2).
// All values are made up. No body data.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { week1StartingWeight, week1Result } from "../app/js/engine/week1.js";

const src = (p) => readFileSync(new URL(`../app/${p}`, import.meta.url), "utf8").replaceAll("\r\n", "\n");
const settings = { dumbbells_kg: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20], stack_steps: {} };

test("R4 every top that starts at the status bar also clears the iOS top blur (--top-clear)", () => {
  for (const f of ["css/app.css", "css/v060.css", "css/diet.css"]) {
    for (const line of src(f).split("\n").filter((l) => l.includes("safe-area-inset-top"))) {
      assert.match(line, /var\(--top-clear\)/, `${f}: ${line.trim()}`);
    }
  }
  assert.match(src("css/app.css"), /top: calc\(var\(--s3\) \+ var\(--top-clear\) \+ env\(safe-area-inset-top\)\)/, "the toast");
  assert.match(src("css/app.css"), /top: calc\(var\(--s2\) \+ var\(--top-clear\) \+ env\(safe-area-inset-top\)\)/, "the update banner");
});

test("R5 a weight found in practice is the start of week 1; in week 1 it is the start of week 2", () => {
  const fit = { weight_kg: 45, reps: 10, left: "2-3" };
  const off = { weight_kg: 40, reps: 12, left: "7+" };
  assert.equal(week1StartingWeight(fit, "chest_press", settings).note, "Your starting weight for week 2.");
  assert.equal(week1StartingWeight(fit, "chest_press", settings, { practice: true }).note, "Your starting weight for week 1.");
  assert.doesNotMatch(week1StartingWeight(off, "chest_press", settings, { practice: true }).note, /week 2/i);
  assert.match(week1StartingWeight(off, "chest_press", settings).note, /Week 2 will fix it/);
  // the weight itself is the same either way
  assert.equal(week1StartingWeight(off, "chest_press", settings, { practice: true }).start_weight_kg, week1StartingWeight(off, "chest_press", settings).start_weight_kg);
  const rec = { sets: [{ type: "work", weight_kg: 45, reps: 10, left: "2-3" }, { type: "work", weight_kg: 45, reps: 10, left: "2-3" }] };
  assert.equal(week1Result(rec, "chest_press", settings, { practice: true }).note, "Your starting weight for week 1.");
  const ui = src("js/ui/week1.js");
  assert.match(ui, /week1Result\(rec, exId, settings, \{ practice: session\.week === 0 \}\)/);
  assert.match(ui, /`Your starting weight for week \$\{session\.week === 0 \? 1 : 2\}`/);
});

// R6  Checker round 2, finding 1 (major): with no sets done, the "It hurts" swap took the original exercise's first-try
//     number (D12) and lowered it in the new exercise's units, so it could start above the new exercise's own first try
//     (leg press 40 -> Smith squat 25, own first try 10). With only a first-try number, the swap now lowers the new
//     exercise's own weight instead: never above the trainer's table, still lighter (the swap rule).
import { painSwapStart, suggestFor, lighterFor } from "../app/js/engine/workout.js";
import { firstTryWeight } from "../app/js/engine/progression.js";
import { validDoc } from "./fixtures/profiles.mjs";

test("R6 the pain swap never starts above the new exercise's own first try when nothing was logged", () => {
  const doc = { ...validDoc(), sessions: [], exercise_state: [] };
  const sg = (id) => suggestFor(doc, id, { week: 2, missed: null, exerciseState: undefined });
  const pairs = [["leg_press", "smith_squat"], ["calf_raise_leg_press", "one_leg_db_calf_raise"], ["pulldown", "one_arm_db_row"], ["chest_press", "db_bench_press"]];
  for (const [from, to] of pairs) {
    const kg = painSwapStart(to, { lastWorkKg: undefined, origSugg: sg(from), newSugg: sg(to) }, doc.shared_settings);
    const own = firstTryWeight(to, doc.shared_settings, doc.profile);
    assert.ok(kg <= own, `${from} -> ${to}: ${kg} kg, own first try ${own}`);
    assert.equal(kg, lighterFor(to, own, doc.shared_settings), `${from} -> ${to}: 30 % under its own first try`);
  }
  // A weight really lifted or known (a set done, the logs, the Plan) keeps the old rule: 30 % under it.
  assert.equal(painSwapStart("smith_squat", { lastWorkKg: 40, origSugg: sg("leg_press"), newSugg: sg("smith_squat") }, doc.shared_settings), lighterFor("smith_squat", 40, doc.shared_settings));
  assert.equal(painSwapStart("smith_squat", { lastWorkKg: undefined, origSugg: { action: "mine", weight_kg: 40 }, newSugg: sg("smith_squat") }, doc.shared_settings), lighterFor("smith_squat", 40, doc.shared_settings));
  // The new exercise's own history decides by itself (no swap weight saved).
  assert.equal(painSwapStart("smith_squat", { lastWorkKg: 40, origSugg: sg("leg_press"), newSugg: { ...sg("smith_squat"), last: { weight_kg: 20 } } }, doc.shared_settings), null);
  const ui = src("js/ui/swap.js");
  assert.match(ui, /painSwapStart\(id, \{ lastWorkKg: last\?\.weight_kg, origSugg: ctx\.sugg\(rec\.done_exercise\), newSugg: ctx\.sugg\(id\) \}, ctx\.settings\)/);
});
