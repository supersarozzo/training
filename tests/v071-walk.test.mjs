// Version 0.7.1 (worker 8.39): iPhone P5, part 1 (Training Agent): Today and the Plan day page show the walk the plan
// really sets for that day and week (walkSuggestion: leg days 2 % less slope, progress from the saved walks, capped at
// 5 km/h and 12 %), the same numbers in both places, and Today's walk tile follows the day shown.
// (Part 2, the walk edited in Plan Edit, is a separate step: it adds saved data.) All values are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dayLayout } from "../app/js/dayplan.js";
import { walkWords } from "../app/js/planview.js";
import { walkRules } from "../app/js/plan/plan-v2.js";
import { validDoc } from "./fixtures/profiles.mjs";

const src = (p) => readFileSync(new URL(`../app/${p}`, import.meta.url), "utf8").replaceAll("\r\n", "\n");
const walkSession = (date, speed, slope, effort = 4) => ({
  id: `s-${date.replaceAll("-", "")}-w1`, updated_at: `${date}T10:00:00.000Z`, date, plan_day: "mon", week: 3, kind: "full", swapped_from: null,
  status: "finished", started_at: `${date}T08:00:00.000Z`, finished_at: `${date}T10:00:00.000Z`, note: "", exercises: [],
  walk: { speed_kmh: speed, slope_pct: slope, minutes: 20, effort, breathless: false, leg_day: false, distance_km: null, avg_hr: null },
});

test("W1 leg days (Tuesday, Friday) walk 2 % less steep than the other days, same speed", () => {
  const doc = validDoc();
  const mon = dayLayout(doc, { planDay: "mon", week: 3, today: "2026-01-26" }).walk;
  const tue = dayLayout(doc, { planDay: "tue", week: 3, today: "2026-01-26" }).walk;
  const fri = dayLayout(doc, { planDay: "fri", week: 3, today: "2026-01-26" }).walk;
  assert.equal(tue.slope_pct, Math.max(mon.slope_pct - walkRules.legDaySlopeLess_pct, 0));
  assert.equal(fri.slope_pct, tue.slope_pct);
  assert.equal(tue.speed_kmh, mon.speed_kmh);
});

test("W2 the walk follows the saved walks and never goes past 5 km/h and 12 %", () => {
  const doc = validDoc();
  doc.sessions = [walkSession("2026-01-19", 4, 6), walkSession("2026-01-21", 4, 6)];
  const after = dayLayout(doc, { planDay: "mon", week: 3, today: "2026-01-26" }).walk;
  assert.ok(after.slope_pct > 6 || after.speed_kmh > 4, "two easy walks in a row: a step up");
  doc.sessions = [walkSession("2026-01-19", 6, 15), walkSession("2026-01-21", 6, 15)];
  const capped = dayLayout(doc, { planDay: "mon", week: 3, today: "2026-01-26" }).walk;
  assert.ok(capped.speed_kmh <= walkRules.maxSpeed_kmh && capped.slope_pct <= walkRules.maxSlope_pct, JSON.stringify(capped));
  assert.equal(walkRules.maxSpeed_kmh, 5);
  assert.equal(walkRules.maxSlope_pct, 12);
});

test("W3 one wording for the walk numbers, used by Today and the Plan", () => {
  assert.equal(walkWords({ speed_kmh: 5, slope_pct: 6 }), "5 km/h · 6 % slope");
  assert.equal(walkWords({ speed_kmh: 4.5, slope_pct: 0 }), "4.5 km/h · 0 % slope");
  const pd = src("js/ui/planday.js");
  assert.match(pd, /walkCard\(lay\.walk, day\)/);
  assert.match(pd, /walkWords\(walk\)/);
  const td = src("js/ui/today.js");
  // Today's tile shows the walk of the day shown, from the same dayLayout call as the hero card; the starting walk only
  // when no workout day is shown.
  assert.match(td, /const shownLayout = shown && active && !open \? dayLayout\(doc, \{ planDay: shown, week, today: t, kind: "full" \}\) : null;/);
  assert.match(td, /`\$\{days\[shown\]\.name\}'s walk: \$\{walkWords\(shownLayout\.walk\)\}, \$\{shownLayout\.walk\.minutes\} min`/);
  assert.match(td, /Starting walk: /);
});

// Checker round 3, finding 1: with a workout running, Today's walk tile said "Starting walk" (the week-1 numbers). It
// now shows the running workout's walk, the same call as the workout screen (flow.js buildCtx).
import { sessionWalk } from "../app/js/dayplan.js";
import { walkSuggestion, finishedSessions } from "../app/js/engine/workout.js";
import { missedRule } from "../app/js/engine/schedule.js";
import { days } from "../app/js/plan/plan-v2.js";

test("W4 a running workout: Today's walk tile shows that workout's walk, as the workout screen does", () => {
  const doc = validDoc();
  doc.sessions = [walkSession("2026-01-19", 4, 6), walkSession("2026-01-21", 4, 6)];
  for (const [plan_day, week, kind] of [["mon", 8, "full"], ["tue", 3, "full"], ["fri", 5, "short"]]) {
    const running = { date: "2026-01-26", plan_day, week, kind, status: "in_progress" };
    const lastFinished = finishedSessions(doc.sessions).find((s) => s.date < running.date);
    const missed = missedRule(lastFinished ? lastFinished.date : null, running.date);
    assert.deepEqual(sessionWalk(doc, running), walkSuggestion(doc, { week, legDay: days[plan_day].leg, missed, kind }), `${plan_day} week ${week}`);
  }
  assert.equal(sessionWalk(doc, { date: "2026-01-26", plan_day: "sat", week: 3, kind: "full" }), null, "a day the plan does not know");
  const td = src("js/ui/today.js");
  assert.match(td, /const openWalk = open \? sessionWalk\(doc, open\) : null;/);
  assert.match(td, /openWalk \? h\("div", \{ class: "tile wide small muted" \}, `\$\{days\[open\.plan_day\]\.name\}'s walk: \$\{walkWords\(openWalk\)\}, \$\{openWalk\.minutes\} min`\)/);
});
