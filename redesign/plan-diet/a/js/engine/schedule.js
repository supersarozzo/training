// Schedule: which week and day it is, how a session is laid out, the short day, missed-time rules,
// swapping a day. Pure. Source: plan v2 sections 2, 4, 10, 11.
import { days, weeks, weekInfo, setsFor, rirFor, sessionMinutes, warmupMoves, upperDayWarmupExtra, DAY_IDS, dayOf } from "../plan/plan-v2.js";

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

// The label shown on Today: "Monday · Week 3 · Build 1".
export function dayLabel(startMonday, dateStr) {
  const pos = blockPosition(startMonday, dateStr);
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
export function daySlots(dayId, week) {
  return dayOf(dayId).slots.map((s) => ({ ...s, sets: setsFor(week, dayId, s.slot) })); // prototype: edited day (plan-v2.js dayOf)
}

// Short day: pairs A and B only, then the first abs exercise only. On leg days there is no abs slot
// (the abs are inside the pairs, and the exercise done on its own, D, is skipped).
export function shortDaySlots(dayId, week) {
  const slots = daySlots(dayId, week);
  const pairs = slots.filter((s) => /^[AB][12]$/.test(s.slot));
  const abs = slots.filter((s) => s.slot === "Abs1");
  return { pairs, abs };
}

// Everything for one day: slots, effort, walk kind.
export function planForDay(dayId, week, kind = "full") {
  const day = days[dayId];
  if (kind === "short") {
    const { pairs, abs } = shortDaySlots(dayId, week);
    return { dayId, kind, week, focus: day.focus, walk: day.walk, rir: rirFor(week, dayId), slots: [...pairs, ...abs] };
  }
  return { dayId, kind, week, focus: day.focus, walk: day.walk, rir: rirFor(week, dayId), slots: daySlots(dayId, week) };
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
