// The Plan day page's logic (build step 2, docs/DESIGN.md 15.3 and 15.4). Pure: data in, data out.
// - which day and week the page opens on;
// - the real sets of a day in a week (the 12-week rules of plan v2, through schedule.daySlots);
// - sets per muscle: a main muscle counts 1 per set, a helper half (research 5.1); "Day so far" and its 3 map steps;
// - the plain words on the cards, the pair headers, the sheet's eyebrow and Rest tile;
// - the Gym exercise groups (answer 75 a). The whole-plan muscle check (step 5) must use setsByMuscle too, so the
//   two screens never disagree.
import { blockPosition, daySlots } from "./schedule.js";
import { buildUnits } from "./workout.js";
import { days, DAY_IDS, MOVE_SECONDS, weeks } from "../plan/plan-v2.js";
import { MUSCLES, exerciseMuscles } from "../plan/muscles.js";

const LAST_WEEK = weeks.length;
const clampWeek = (w) => Math.min(Math.max(w, 1), LAST_WEEK);

// The page opens on today. Saturday and Sunday: the coming Monday, with the coming week. Before the block: Monday of
// week 1. After the 12 weeks: Monday of week 12.
export function pageFor(startMonday, today) {
  const pos = blockPosition(startMonday, today);
  if (pos.state === "after") return { day: "mon", week: LAST_WEEK, todayDay: null, state: "after" };
  if (pos.planDay && pos.state === "running") return { day: pos.planDay, week: pos.week, todayDay: pos.planDay, state: "running" };
  if (pos.planDay) return { day: "mon", week: 1, todayDay: null, state: pos.state }; // a weekday before the block
  return { day: "mon", week: clampWeek(pos.week + 1), todayDay: null, state: pos.state }; // Saturday or Sunday
}

// The day's slots with that week's real sets.
export const daySets = (dayId, week) => daySlots(dayId, clampWeek(week));
export const unitsOf = (slots) => buildUnits(slots);

export function dayTotals(dayId, week) {
  const slots = daySets(dayId, week);
  return { sets: slots.reduce((n, s) => n + s.sets, 0), exercises: slots.length };
}

// Sets per muscle from [{ ex, sets }]. Keys keep the order the muscles came in (used to break ties in the words).
export function setsByMuscle(items) {
  const direct = {};
  const weighted = {};
  for (const it of items) {
    const m = exerciseMuscles[it.ex];
    if (!m) continue;
    for (const g of m.main) { direct[g] = (direct[g] ?? 0) + it.sets; weighted[g] = (weighted[g] ?? 0) + it.sets; }
    for (const g of m.helpers) weighted[g] = (weighted[g] ?? 0) + it.sets / 2;
  }
  return { direct, weighted };
}

// The 3 map steps: under 3 sets = 1 (A little), 3 to under 6 = 2 (More), 6 and up = 3 (Most).
export function levelFor(sets) {
  if (!sets) return 0;
  if (sets < 3) return 1;
  if (sets < 6) return 2;
  return 3;
}

const lower = (g) => MUSCLES[g].name.toLowerCase();
export const fmtSets = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10));

// "back thighs 4.5, front thighs 3, …": every muscle with sets, most first, ties in the order they came in.
export function soFarText(weighted) {
  return Object.entries(weighted).filter(([, n]) => n > 0)
    .map(([g, n], i) => ({ g, n, i })).sort((a, b) => (b.n - a.n) || (a.i - b.i))
    .map(({ g, n }) => `${lower(g)} ${fmtSets(n)}`).join(", ");
}

// "Day so far" at one card: the sets from the first card down to this one.
export function daySoFar(dayId, week, slotName) {
  const slots = daySets(dayId, week);
  const i = slots.findIndex((s) => s.slot === slotName);
  if (i < 0) throw new Error(`No slot ${slotName} on ${dayId}`);
  const { direct, weighted } = setsByMuscle(slots.slice(0, i + 1));
  const levels = Object.fromEntries(Object.entries(weighted).map(([g, n]) => [g, levelFor(n)]));
  return { position: i + 1, total: slots.length, direct, weighted, levels, text: soFarText(weighted) };
}

// "This exercise": main muscles strong (3), helpers light (1).
export function exerciseLevels(exId) {
  const m = exerciseMuscles[exId];
  const out = {};
  if (!m) return out;
  for (const g of m.helpers) out[g] = 1;
  for (const g of m.main) out[g] = 3;
  return out;
}

export function muscleWords(exId) {
  const m = exerciseMuscles[exId];
  if (!m) return { main: "", helpers: "", card: "" };
  const main = m.main.map(lower).join(", ");
  const helpers = m.helpers.map(lower).join(", ");
  const card = `${main.charAt(0).toUpperCase()}${main.slice(1)}${helpers ? ` · helps ${helpers}` : ""}`;
  return { main, helpers, card };
}

// The side of the body where the strongest muscles are (the small map on a card shows one side).
export function mainView(levels) {
  let front = 0;
  let back = 0;
  for (const [g, lv] of Object.entries(levels)) {
    const w = lv === 3 ? 10 : lv === 2 ? 3 : lv === 1 ? 1 : 0;
    if (MUSCLES[g]?.view === "back") back += w; else front += w;
  }
  return back > front ? "back" : "front";
}

// Pair headers in words (mock-up), not slot letters.
export function unitHeader(unit) {
  if (unit.type === "pair") {
    const rounds = Math.max(...unit.slots.map((s) => s.sets));
    const rest = unit.slots[unit.slots.length - 1].rest ?? MOVE_SECONDS;
    return unit.slots.length > 1
      ? `Pair ${unit.id} · back and forth · ${rounds} rounds · rest ${rest} s after each round`
      : `Pair ${unit.id} · rest ${rest} s between sets`;
  }
  const rest = unit.slots[0].rest;
  return unit.id === "D" ? `On its own · rest ${rest} s between sets` : `Abs · rest ${rest} s between sets`;
}

// The sheet's eyebrow part: "Pair B · first of the pair", "On its own", "Abs".
export function slotRole(dayId, slotName) {
  const pair = /^([A-C])([12])$/.exec(slotName);
  if (pair) return `Pair ${pair[1]} · ${pair[2] === "1" ? "first" : "second"} of the pair`;
  return slotName === "D" ? "On its own" : "Abs";
}

// The Rest tile: the first of a pair moves on (about 30 s), the second rests after the round, the rest between sets.
export function restTile(slot) {
  if (slot.rest === null) return { value: `${MOVE_SECONDS} s`, note: "to move" };
  if (/^[A-C]2$/.test(slot.slot)) return { value: `${slot.rest} s`, note: "after the round" };
  return { value: `${slot.rest} s`, note: "between sets" };
}

// The day arrows: the day before or after, into the previous or next week. At the block's two ends (Monday of
// week 1, Friday of week 12) they wrap inside the week, as there is no week 0 or 13.
export function stepDay(dayId, week, dir) {
  const i = DAY_IDS.indexOf(dayId) + dir;
  if (i < 0) return { day: DAY_IDS[DAY_IDS.length - 1], week: week > 1 ? week - 1 : week };
  if (i >= DAY_IDS.length) return { day: DAY_IDS[0], week: week < LAST_WEEK ? week + 1 : week };
  return { day: DAY_IDS[i], week };
}

export function neighbours(dayId, week, slotName) {
  const slots = daySets(dayId, week);
  const i = slots.findIndex((s) => s.slot === slotName);
  return { prev: slots[i - 1] ?? null, next: slots[i + 1] ?? null };
}

// Gym › Exercises groups, by main muscle (the same groups as the swap list and the muscle check, steps 4 and 5).
export const GYM_GROUPS = [
  { id: "chest", name: "Chest", muscles: ["chest"] },
  { id: "back", name: "Back", muscles: ["lats", "mid_back"] },
  { id: "shoulders", name: "Shoulders", muscles: ["front_delts", "side_delts", "rear_delts"] },
  { id: "biceps", name: "Biceps", muscles: ["biceps"] },
  { id: "triceps", name: "Triceps", muscles: ["triceps"] },
  { id: "quads", name: "Front thighs", muscles: ["quads"] },
  { id: "hamstrings", name: "Back thighs", muscles: ["hamstrings"] },
  { id: "glutes", name: "Glutes", muscles: ["glutes"] },
  { id: "calves", name: "Calves", muscles: ["calves"] },
  { id: "abs", name: "Abs", muscles: ["abs"] },
];

export function gymGroupOf(exId) {
  const main = exerciseMuscles[exId]?.main[0];
  return GYM_GROUPS.find((g) => g.muscles.includes(main))?.id ?? null;
}

// The plan days an exercise is on, Monday first (empty: a swap-only exercise).
export function planDaysOf(exId) {
  return DAY_IDS.filter((d) => days[d].slots.some((s) => s.ex === exId));
}
