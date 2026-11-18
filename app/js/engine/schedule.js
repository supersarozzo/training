// Schedule: which week and day it is, how a session is laid out, the short day, missed-time rules,
// swapping a day. Pure. Source: plan v2 sections 2, 4, 10, 11.
import { days, weeks, weekInfo, setsFor, rirFor, sessionMinutes, warmupMoves, upperDayWarmupExtra, DAY_IDS, knownExercise } from "../plan/plan-v2.js";
import { effectiveDay, setsForSlot } from "./planedits.js";

const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const MS_DAY = 86400000;

function utcDay(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function daysBetween(fromDate, toDate) {
  return Math.round((utcDay(toDate) - utcDay(fromDate)) / MS_DAY);
}

// "mon" ... "sun" for a yyyy-mm-dd date.
export function dayOfWeek(dateStr) {
  return DAY_NAMES[new Date(utcDay(dateStr)).getUTCDay()];
}

// Whole weeks since the block's first Monday, plus 1 (it follows the calendar). Can be 0 or less before the block.
export function weekNumber(startMonday, dateStr) {
  return Math.floor(daysBetween(startMonday, dateStr) / 7) + 1;
}

// Where a date sits in the block.
export function blockPosition(startMonday, dateStr) {
  const week = weekNumber(startMonday, dateStr);
  const state = week < 1 ? "before" : week > weeks.length ? "after" : "running";
  return { state, week, day: dayOfWeek(dateStr), planDay: DAY_IDS.includes(dayOfWeek(dateStr)) ? dayOfWeek(dateStr) : null };
}

// Practice days (trainer D11, 0.7.1): every day before the block's first Monday. Today offers a workout with the
// week-1 rules (weekInfo clamps any week below 1 to week 1); it is saved with week 0, which is never shown as a number;
// the start date never moves.
export const PRACTICE_LABEL = "Practice week · Learn, find weights";
export const PRACTICE_SHORT = "Practice week"; // Today's eyebrow: one line at 375 px (master pick under Rosario's 94 a)
export const canTrain = (pos) => pos.state === "running" || pos.state === "before";
export const sessionWeek = (pos) => (pos.state === "before" ? 0 : pos.week);
const longDate = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
export const practiceLine = (startMonday) => `Your plan starts on Monday ${longDate(startMonday)}. Practice now: find your weights and learn the moves.`;
// Was a saved workout in the same plan week as `pos`? Practice workouts all carry week 0, so for them the calendar
// week decides.
export function inWeekOf(pos, startMonday, s) {
  if (pos.state !== "before") return s.week === pos.week;
  return s.week === 0 && typeof s.date === "string" && weekNumber(startMonday, s.date) === pos.week;
}

// The label shown on Today: "Monday · Week 3 · Build 1"; before the block "Practice week · Learn, find weights".
export function dayLabel(startMonday, dateStr) {
  const pos = blockPosition(startMonday, dateStr);
  if (pos.state === "before") return { ...pos, text: PRACTICE_LABEL };
  if (!pos.planDay) return { ...pos, text: "Rest day" };
  const w = weekInfo(pos.week);
  return { ...pos, text: `${days[pos.planDay].name} · Week ${pos.week} · ${w.phase}` };
}

// ---------- the session ----------

// Blocks in order with minutes. kind: "full" (90 minutes) or "short" (60 minutes).
export function sessionLayout(kind, week) {
  const m = sessionMinutes[kind];
  if (kind === "short") {
    return [
      { id: "walk", minutes: m.walk, buildUp: m.walkBuildUp },
      { id: "changeover", minutes: m.changeover },
      { id: "lift_warmup", minutes: m.lift_warmup },
      { id: "pairs_ab", minutes: m.pairs_ab },
      { id: "abs_first", minutes: m.abs_first },
      { id: "finish", minutes: m.finish },
    ];
  }
  // Weeks 7 to 11: pair A has a 4th set (3 more minutes of weights) and the 2 abs exercises are done
  // back to back (2 minutes less), so the session is about 91 minutes (plan v2 section 4).
  const build2 = weekInfo(week).setsMode === "build2";
  return [
    { id: "walk", minutes: m.walk, buildUp: m.walkBuildUp },
    { id: "changeover", minutes: m.changeover },
    { id: "lift_warmup", minutes: m.lift_warmup },
    { id: "pairs", minutes: m.pairs + (build2 ? 3 : 0) },
    { id: "abs", minutes: m.abs - (build2 ? 2 : 0) },
    { id: "finish", minutes: m.finish },
  ];
}

export function expectedMinutes(kind, week) {
  return sessionLayout(kind, week).reduce((n, b) => n + b.minutes, 0);
}

// Slots of a day for a week, with the sets that week.
// `edit` (optional): the day's plan_days record (engine/planedits.js). A usable edit gives the edited day; no record,
// a tombstone or a record this app cannot use gives the plan's day exactly as before.
export function daySlots(dayId, week, edit) {
  const eff = edit === undefined || edit === null ? null : effectiveDay(dayId, edit);
  if (!eff || !eff.edited) return days[dayId].slots.map((s) => ({ ...s, sets: setsFor(week, dayId, s.slot) }));
  return eff.slots.map((s) => ({ ...s, sets: setsForSlot(week, s, dayId) }));
}

// Short day: pairs A and B only, then the first abs exercise only. On leg days there is no abs slot
// (the abs are inside the pairs, and the exercise done on its own, D, is skipped). Added exercises (E1, E2) are skipped too.
export function shortDaySlots(dayId, week, edit) {
  const slots = daySlots(dayId, week, edit);
  const pairs = slots.filter((s) => /^[AB][12]$/.test(s.slot));
  const abs = slots.filter((s) => s.slot === "Abs1");
  return { pairs, abs };
}

// Everything for one day: slots, effort, walk kind. `edit` as in daySlots.
// edited: the slots come from a saved Plan edit. newerVersion: a saved edit exists but this app cannot use it
// (the plan's day is shown; a screen can say "This day was changed on a newer app version").
export function planForDay(dayId, week, kind = "full", edit) {
  const day = days[dayId];
  const eff = edit === undefined || edit === null ? { edited: false, newerVersion: false } : effectiveDay(dayId, edit);
  const flags = { edited: eff.edited, newerVersion: eff.newerVersion };
  if (kind === "short") {
    const { pairs, abs } = shortDaySlots(dayId, week, edit);
    return { dayId, kind, week, focus: day.focus, walk: day.walk, rir: rirFor(week, dayId), slots: [...pairs, ...abs], ...flags };
  }
  return { dayId, kind, week, focus: day.focus, walk: day.walk, rir: rirFor(week, dayId), slots: daySlots(dayId, week, edit), ...flags };
}

// Monday, Wednesday and Thursday's abs places as they were before the plan change of 2026-11-18 (answer 80 a).
// A workout started on an app from before that change has no planned_sets: it keeps these numbers (its own day).
const BEFORE_2026_11_18 = Object.freeze({
  mon: { Abs1: { sets: 3, rest: 30 }, Abs2: { sets: 2, rest: 30 } },
  wed: { Abs1: { sets: 3, rest: 30 }, Abs2: { sets: 2, rest: 30 } },
  thu: { Abs1: { sets: 3, rest: 30 }, Abs2: { sets: 3, rest: 45 } },
});

// The slots of a workout already started (running or finished), from the workout itself: its own places and
// exercises, and the sets and rest saved when it started (planned_sets, planned_rest). A Plan edit or a plan change
// made later never changes it. A workout saved before planned_sets existed reads the sets and rest of its place in
// the plan, except Monday, Wednesday and Thursday's abs places, which keep their numbers from before the plan change of
// 2026-11-18 (BEFORE_2026_11_18); a place nobody knows gets the larger of 2 and the sets already saved.
// Never throws on a place or exercise the plan does not know; an exercise this app does not know is skipped (0.7.6).
// Same shape as planForDay.
export function planForSession(session) {
  const dayId = session.plan_day;
  const day = days[dayId];
  const week = session.week;
  const planSlots = new Map((day?.slots ?? []).map((s) => [s.slot, s]));
  const seen = new Set();
  // 0.7.6: a place whose current exercise this app does not know (a workout from a newer app) is left out; the record
  // stays in the workout, unchanged.
  const records = (Array.isArray(session.exercises) ? session.exercises : []).filter((e) => e && typeof e.slot === "string" && (seen.has(e.slot) ? false : (seen.add(e.slot), true)))
    .filter(knownRecord);
  const okSets = (n) => Number.isInteger(n) && n >= 1 && n <= 10;
  const okRest = (r) => r === null || (typeof r === "number" && Number.isFinite(r) && r >= 0 && r <= 600);
  const slots = records.map((rec) => {
    const old = okSets(rec.planned_sets) ? null : BEFORE_2026_11_18[dayId]?.[rec.slot];
    const p = old ? { slot: rec.slot, sets: old.sets, rest: old.rest } : planSlots.get(rec.slot);
    const saved = (Array.isArray(rec.sets) ? rec.sets : []).filter((x) => x && x.type === "work").length;
    // A record with no planned_sets is from before 0.6.0: it keeps the week rule it was started with (no day passed =
    // the rule before 0.7.1), so a past workout never changes.
    const sets = okSets(rec.planned_sets) ? rec.planned_sets : p ? setsForSlot(week, p) : Math.min(Math.max(2, saved), 10);
    const rest = "planned_rest" in rec && okRest(rec.planned_rest) ? rec.planned_rest : p ? p.rest : null;
    return { slot: rec.slot, ex: rec.plan_exercise, sets, rest };
  });
  return { dayId, kind: session.kind, week, focus: day?.focus ?? "", walk: day?.walk ?? "normal", rir: rirFor(week, dayId), slots };
}

// Does a workout record name only exercises this app knows? (0.7.6.) A record from a newer app with a new exercise id
// (as planned or as done) is skipped by the screens and kept in the file. A field that is missing is not a name.
export function knownRecord(e) {
  return !!e && [e.plan_exercise, e.done_exercise].every((id) => id === undefined || knownExercise(id));
}

// The 4-minute lift warm-up: all six moves (the short day uses the short list); upper days add push-ups.
export function liftWarmup(dayId, kind = "full") {
  const moves = warmupMoves.filter((m) => kind === "full" || m.short).map((m) => ({ ...m }));
  if (days[dayId].upper) moves.push({ ...upperDayWarmupExtra });
  return moves;
}

// ---------- missed sessions (plan v2 section 11) ----------

// lastDate: date of the last finished workout (or null). today: yyyy-mm-dd. ill: fever or chest cold.
// Time away is counted in days since the last workout. Friday to Monday is 3 days and is normal.
export function missedRule(lastDate, today, { ill = false } = {}) {
  const away = lastDate ? daysBetween(lastDate, today) : 0;
  const result = (kind, extra) => ({ kind, daysAway: away, weightFactor: 1, noIncrease: false, setsOverride: null, walkSlopeDelta: 0, walkReset: false, forWeekOnly: false, ...extra });
  if (ill) {
    return result("ill", { noIncrease: true, message: "Rest while you are ill. When you are back: repeat your last weights, no increase in the first workout." });
  }
  if (away <= 4) {
    return result("carry_on", { message: "Carry on with the next workout in order. Never do two workouts in one day to catch up." });
  }
  if (away <= 13) {
    return result("repeat_weights", { noIncrease: true, message: `You were away ${away} days. Repeat your last weights. No increase in the first workout back.` });
  }
  if (away <= 28) {
    return result("minus_10", { weightFactor: 0.9, walkSlopeDelta: -2, forWeekOnly: true, message: `You were away ${Math.round(away / 7)} weeks. This week all weights are about 10 % lower and the walk is 2 % less steep. Then back to normal.` });
  }
  return result("minus_20", { weightFactor: 0.8, setsOverride: 2, walkReset: true, forWeekOnly: true, message: `You were away more than 4 weeks. This week all weights are about 20 % lower, 2 sets per exercise, like week 1. The walk goes back to the starting settings.` });
}

// Never two workouts in one day to catch up.
export function canStartWorkout(sessions, today) {
  const clash = sessions.some((s) => !s.deleted && s.date === today && (s.status === "finished" || s.status === "in_progress"));
  return clash
    ? { ok: false, reason: "You already trained today. Do not do two workouts in one day." }
    : { ok: true };
}

// "Swap day": plan days earlier in this week that have no workout yet (a missed Monday can take Wednesday's place).
// sessions: the log. A plan day counts as done when a finished workout carries that plan_day in this week.
export function swapOptions({ startMonday, today, sessions }) {
  const pos = blockPosition(startMonday, today);
  if (pos.state !== "running" || !pos.planDay) return [];
  const todayIndex = DAY_IDS.indexOf(pos.planDay);
  return DAY_IDS.slice(0, todayIndex).filter((d) =>
    !sessions.some((s) => !s.deleted && s.week === pos.week && s.plan_day === d && (s.status === "finished" || s.status === "in_progress")));
}
