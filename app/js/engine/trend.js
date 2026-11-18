// Weigh-in trend, the target band, the food-change suggestion and the weekly summary. Pure.
// Source: plan v2 section 12, WORKFLOW F1 to F3, PRD F14 to F16.
import { performances, isNewBest } from "./workout.js";
import { exercises, knownExercise } from "../plan/plan-v2.js";
import { daysBetween, weekNumber } from "./schedule.js";

const MS_DAY = 86400000;
const pad = (n) => String(n).padStart(2, "0");

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) + n * MS_DAY);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

// One weigh-in per date, oldest first. Deleted ones (tombstones) never count. If two records share a date, the newer wins.
export function activeWeighins(list) {
  const byDate = new Map();
  for (const w of list) {
    if (w.deleted) continue;
    const old = byDate.get(w.date);
    if (!old || (w.updated_at ?? "") > (old.updated_at ?? "")) byDate.set(w.date, w);
  }
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

// Trend weight on a date: the average of the weigh-ins of that day and the 6 days before it (the 7-day average).
export function trendAt(weighins, dateStr) {
  const from = addDays(dateStr, -6);
  const inside = activeWeighins(weighins).filter((w) => w.date >= from && w.date <= dateStr);
  if (!inside.length) return null;
  return inside.reduce((n, w) => n + w.kg, 0) / inside.length;
}

// A trend value for every weigh-in date (for the chart).
export function trendSeries(weighins) {
  return activeWeighins(weighins).map((w) => ({ date: w.date, kg: w.kg, trend: trendAt(weighins, w.date) }));
}

// Change of the trend over the 7 days up to endDate: trend(end) minus trend(end - 7). Null when either has no data.
export function weeklyChange(weighins, endDate) {
  const a = trendAt(weighins, endDate);
  const b = trendAt(weighins, addDays(endDate, -7));
  return a === null || b === null ? null : a - b;
}

// ---------- the target band (kg per week) ----------
// cut: lose 0.25 % to 1 % of body weight a week (plan v2 section 12: never faster than 1 %).
// bulk: gain 0.1 % to 0.5 % a week (never faster than 0.5 %; the low end is a noise floor).
// recomp: stay within 0.5 kg either way (WORKFLOW F3).
export const BAND = { cutPct: [0.25, 1], bulkPct: [0.1, 0.5], recompKg: 0.5 };

export function bandKg(goal, kg) {
  if (goal === "cut") return { low: (-kg * BAND.cutPct[1]) / 100, high: (-kg * BAND.cutPct[0]) / 100 };
  if (goal === "bulk") return { low: (kg * BAND.bulkPct[0]) / 100, high: (kg * BAND.bulkPct[1]) / 100 };
  return { low: -BAND.recompKg, high: BAND.recompKg };
}

// "below" = under the band (cut: losing too fast; bulk: not gaining; recomp: dropping), "above" = over it.
export function checkBand(goal, kg, change) {
  if (change === null || change === undefined) return null;
  const { low, high } = bandKg(goal, kg);
  return change < low ? "below" : change > high ? "above" : "on";
}

export function statusWords(goal, status) {
  const words = {
    cut: { below: "Losing faster than the band", on: "On target", above: "Losing slower than the band" },
    bulk: { below: "Not gaining enough", on: "On target", above: "Gaining faster than the band" },
    recomp: { below: "Weight dropping more than 0.5 kg a week", on: "On target", above: "Weight rising more than 0.5 kg a week" },
  };
  return (words[goal] ?? words.recomp)[status];
}

// WORKFLOW F3: nothing in weeks 1 and 2. Then only after 2 weeks in a row off target, in the same direction.
// Returns { kcal, steps?, text } or null. `kcal` is the change per day (150 means eat 150 more).
export function foodChange(goal, last, previous, week) {
  if (week < 3 || !last || last !== previous || last === "on") return null;
  if (goal === "bulk") return last === "below" ? { kcal: 150, text: "Not gaining for 2 weeks: eat 150 kcal a day more." } : { kcal: -150, text: "Gaining too fast for 2 weeks: eat 150 kcal a day less." };
  if (goal === "recomp") return last === "above" ? { kcal: -150, text: "Weight rising for 2 weeks: eat 150 kcal a day less." } : { kcal: 150, text: "Weight dropping for 2 weeks: eat 150 kcal a day more." };
  if (goal === "cut") {
    return last === "above"
      ? { kcal: -150, steps: 2000, text: "Losing slowly for 2 weeks: eat 150 kcal a day less, or walk 2,000 steps a day more." }
      : { kcal: 200, text: "Losing too fast for 2 weeks: eat 200 kcal a day more." };
  }
  return null;
}

// ---------- the weekly summary (Monday) ----------
// Covers the 7 days before this week's Monday. Returns null in week 1 (nothing to look back on).
export function weeklySummary(doc, { startMonday, today }) {
  const week = weekNumber(startMonday, today);
  if (week < 2) return null;
  const from = addDays(startMonday, (week - 2) * 7);
  const to = addDays(from, 6);
  const finished = doc.sessions.filter((s) => !s.deleted && s.status === "finished");
  const inWeek = finished.filter((s) => s.date >= from && s.date <= to);
  const before = finished.filter((s) => s.date < from);
  let sets = 0;
  let walkMinutes = 0;
  let newBests = 0;
  const seen = new Set();
  for (const s of inWeek) {
    walkMinutes += s.walk?.minutes ?? 0;
    for (const rec of s.exercises) {
      const work = rec.sets.filter((x) => x.type === "work");
      sets += work.length;
      if (!work.length || seen.has(rec.done_exercise) || !knownExercise(rec.done_exercise)) continue; // 0.7.6: skip ids from a newer app
      seen.add(rec.done_exercise);
      const now = performances(inWeek, rec.done_exercise).sort((a, b) => b.weight_kg - a.weight_kg)[0];
      const earlier = performances(before, rec.done_exercise);
      if (now && isNewBest(now, earlier, exercises[rec.done_exercise].kind)) newBests += 1;
    }
  }
  const goal = doc.profile?.targets?.goal ?? "recomp";
  const kgNow = trendAt(doc.weighins, to) ?? doc.profile?.intake?.q24_weight_kg ?? null;
  const change = weeklyChange(doc.weighins, to);
  const status = kgNow === null ? null : checkBand(goal, kgNow, change);
  const previousStatus = kgNow === null ? null : checkBand(goal, kgNow, weeklyChange(doc.weighins, addDays(to, -7)));
  return {
    week, from, to, workouts: inWeek.length, sets, walkMinutes, newBests, goal,
    change, status, band: kgNow === null ? null : bandKg(goal, kgNow),
    food: foodChange(goal, status, previousStatus, week),
  };
}

// Days between two dates, kept here so screens need one import.
export { daysBetween };
