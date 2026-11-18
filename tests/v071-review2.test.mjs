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
