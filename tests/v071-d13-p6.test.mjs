// Version 0.7.1 (worker 8.39):
//  D13 trainer decision (docs/plan/2026-11-18-trainer-weekly-plan.md): a soreness note on Wednesday A1 and Thursday A1,
//      only in the practice week (week 0) and weeks 1-3; tied to the workout day id and the slot, never to the
//      calendar date or the exercise id; a note only (no sets, reps or weights change).
//  P6  Rosario (question 89): the Plan's Edit chip sits at the top right, flush with the cards' right edge.
// All values are made up. No body data.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as plan from "../app/js/plan/plan-v2.js";
import { soreNote } from "../app/js/planview.js";
import * as workout from "../app/js/engine/workout.js";
import { validDoc } from "./fixtures/profiles.mjs";

const { days, DAY_IDS, setsFor, rirFor } = plan;
const src = (p) => readFileSync(new URL(`../app/${p}`, import.meta.url), "utf8").replaceAll("\r\n", "\n");
const WED = "Thighs still very sore from Tuesday? Use one step lighter today. Joint pain: skip it today.";
const THU = "Chest or shoulders still very sore? Use one step lighter today. Joint pain: skip it today.";
const allSlots = (d) => [...days[d].slots.map((s) => s.slot), "E1", "E2"];

test("D13-1 weeks 0-3: Wednesday A1 and Thursday A1 carry their words exactly", () => {
  for (const w of [0, 1, 2, 3]) {
    assert.equal(soreNote("wed", w, "A1"), WED, `week ${w}`);
    assert.equal(soreNote("thu", w, "A1"), THU, `week ${w}`);
  }
  assert.ok(Object.isFrozen(plan.soreNotes));
  assert.deepEqual([...plan.SORE_NOTE_WEEKS], [0, 1, 2, 3]);
});

test("D13-2 no note in weeks 4-12, on Monday, Tuesday, Friday, or in any other slot", () => {
  for (const d of DAY_IDS) {
    for (let w = 0; w <= 13; w++) {
      for (const s of allSlots(d)) {
        const expected = (d === "wed" || d === "thu") && s === "A1" && w <= 3 ? (d === "wed" ? WED : THU) : null;
        assert.equal(soreNote(d, w, s), expected, `${d} week ${w} ${s}`);
      }
    }
  }
  assert.equal(soreNote("sat", 1, "A1"), null);
  assert.equal(soreNote(undefined, 1, "A1"), null);
});

test("D13-3 tied to the slot, not the exercise: a swapped Wednesday A1 keeps the note (the Plan card asks by slot)", () => {
  assert.equal(soreNote("wed", 2, "A1"), WED); // the helper never sees the exercise id
  const pd = src("js/ui/planday.js");
  assert.match(pd, /soreNote\(day, week, slot\.slot\)/);
  assert.doesNotMatch(pd, /soreNote\([^)]*slot\.ex/);
});

test("D13-4 the workout asks by its own day id and week (Wednesday started on a Friday still shows Wednesday's note)", () => {
  for (const f of ["js/ui/pair.js", "js/ui/week1.js"]) {
    assert.match(src(f), /soreNote\(ctx\.session\.plan_day, ctx\.session\.week, /, f);
  }
  assert.doesNotMatch(src("js/ui/pair.js"), /soreNote\([^)]*dayOfWeek/);
});

test("D13-5 a note only: sets, effort and the weight suggestion are unchanged", () => {
  // The sets and effort rules never read the note (setsFor and rirFor live in plan-v2.js; the note is only data there).
  const p = src("js/plan/plan-v2.js");
  const rules = p.slice(p.indexOf("export function setsFor"), p.indexOf("export const sessionOrder"));
  assert.doesNotMatch(rules, /sore/i);
  assert.ok(rirFor(1, "wed") === 3 && rirFor(1, "thu") === 3);
  const doc = validDoc();
  const a = workout.suggestFor(doc, days.wed.slots[0].ex, { week: 2, missed: null, exerciseState: undefined });
  const b = workout.suggestFor(doc, days.wed.slots[0].ex, { week: 2, missed: null, exerciseState: undefined });
  assert.deepEqual(a, b);
  assert.doesNotMatch(src("js/engine/workout.js"), /soreNote|soreNotes/);
  assert.doesNotMatch(src("js/engine/progression.js"), /soreNote|soreNotes/);
  // text only, never markup
  for (const f of ["js/ui/planday.js", "js/ui/pair.js", "js/ui/week1.js"]) assert.doesNotMatch(src(f), /innerHTML/, f);
});

test("P6 the Plan's Edit chip sits at the far right of the content, on the week chip's line", () => {
  const css = src("css/app.css");
  assert.match(css, /\.today-head, \.gym-head \{ padding-right: 52px; \}/, "the gear room stays on Today and Gym only");
  assert.doesNotMatch(css, /\.plan-top \{[^}]*padding-right/);
  assert.match(css, /\.edit-chip \{ margin-left: auto; flex: none; white-space: nowrap; \}/);
  assert.match(css, /\.plan-top \{ display: flex; align-items: center;[^}]*flex-wrap: nowrap;/);
});
