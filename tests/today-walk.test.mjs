// Today's timeline must show the same walk minutes as the walk screen (JUDGING.md 3.6 item 1, Rosario's answer 60 a).
// The walk screen uses engine walkSuggestion(); Today used the plan's fixed 30 minutes. Display fix only: the engine's
// walk rules do not change. All values are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { dayLayout } from "../app/js/dayplan.js";
import { walkSuggestion } from "../app/js/engine/workout.js";
import { sessionLayout, missedRule } from "../app/js/engine/schedule.js";
import { days } from "../app/js/plan/plan-v2.js";
import { validDoc, intake } from "./fixtures/profiles.mjs";

const docWith = (over = {}, sessions = []) => ({ ...validDoc(), profile: { ...validDoc().profile, intake: intake(over) }, sessions });
const walkSession = (date, effort) => ({
  id: `s-${date.replaceAll("-", "")}-abcdef`, updated_at: `${date}T09:00:00.000Z`, date, plan_day: "mon", week: 1, kind: "full",
  swapped_from: null, status: "finished", started_at: `${date}T08:00:00.000Z`, finished_at: `${date}T09:30:00.000Z`,
  walk: { speed_kmh: 5, slope_pct: 4, minutes: 20, effort, breathless: false, leg_day: false }, exercises: [], effort: null, note: "",
});

test("cannot walk fast for 30 minutes yet (q36 no), no walk saved: Today shows the walk screen's minutes", () => {
  const doc = docWith({ q36_walk_fit: "no" });
  const r = dayLayout(doc, { planDay: "mon", week: 2, today: "2026-01-19", kind: "full" });
  const engine = walkSuggestion(doc, { week: 2, legDay: days.mon.leg, missed: missedRule(null, "2026-01-19"), kind: "full" });
  const walk = r.layout.find((b) => b.id === "walk");
  assert.equal(walk.minutes, engine.minutes);
  assert.equal(r.walk.minutes, engine.minutes);
  assert.equal(r.minutes, r.layout.reduce((n, b) => n + b.minutes, 0));
  assert.equal(walk.minutes, 20, "build up from 20 minutes (WORKFLOW B5)");
});

test("after a walk with an effort score, both show the engine's next minutes", () => {
  const doc = docWith({ q36_walk_fit: "no" }, [walkSession("2026-01-12", 5)]);
  const r = dayLayout(doc, { planDay: "tue", week: 2, today: "2026-01-20", kind: "full" });
  const engine = walkSuggestion(doc, { week: 2, legDay: days.tue.leg, missed: missedRule("2026-01-12", "2026-01-20"), kind: "full" });
  assert.equal(r.layout.find((b) => b.id === "walk").minutes, engine.minutes);
});

test("the other blocks keep the plan's minutes; a short day keeps its own layout", () => {
  const doc = docWith({ q36_walk_fit: "yes" });
  for (const kind of ["full", "short"]) {
    const r = dayLayout(doc, { planDay: "wed", week: 8, today: "2026-03-04", kind });
    const plan = sessionLayout(kind, 8);
    assert.deepEqual(r.layout.map((b) => b.id), plan.map((b) => b.id));
    r.layout.forEach((b, i) => { if (b.id !== "walk") assert.equal(b.minutes, plan[i].minutes, `${kind} ${b.id}`); });
  }
});
