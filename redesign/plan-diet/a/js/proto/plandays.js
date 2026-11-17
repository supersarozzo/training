// PROTOTYPE 8.28 (builder A). Permanent Plan edits (Rosario's answer 65: "forever" for that day of the plan).
// Data shape from research 9.1: one record per plan day holding the whole edited day (a snapshot), id fixed per plan and
// day, so two phones make the same id. "Back to the plan's version" = tombstone. plan-v2.js is never edited.
// Running workouts never change: a day whose workout is running cannot be edited (the screen says so). Past workouts
// keep what they stored (session.exercises: plan_exercise / done_exercise).
// Slot rule for "add" (research 9.1, open point 13): added exercises go at the END, done on their own, in two new slots
// E1 and E2 (at most 2). 3 sets, 60 s rest. Week rules: week 1 = 2 sets, easier weeks = one set less, weeks 7-11 unchanged.
// In the real build this is an engine change with tests first (slot grammar `E[12]`).
import { days, exercises, PLAN_ID, setDayOverride, weekInfo, extraMachines } from "../plan/plan-v2.js";
import { store } from "../ui/app.js";
import { mainGroup, eqOf } from "./muscles.js";

export const MAX_ADDED = 2;
const SLOT_RE = /^([A-C][12]|Abs[12]|D|E[12])$/;

export const recId = (day) => `p-${PLAN_ID}-${day}`;

export function editRecord(doc, day) {
  return (doc.plan_days ?? []).find((r) => r.id === recId(day) && !r.deleted) ?? null;
}

// A record that fails these checks is kept in the file but not used (research 9.1 "Validation").
export function usable(rec) {
  if (!rec || !Array.isArray(rec.slots) || !rec.slots.length) return false;
  const seen = new Set();
  return rec.slots.every((s) => {
    if (!s || !SLOT_RE.test(s.slot) || seen.has(s.slot) || !exercises[s.ex]) return false;
    seen.add(s.slot);
    return Number.isInteger(s.sets) && s.sets >= 1 && s.sets <= 5 && (s.rest === null || [30, 45, 60, 75, 90, 120].includes(s.rest));
  });
}

export function effectiveDay(doc, day) {
  const rec = editRecord(doc, day);
  if (!rec || !usable(rec)) return null;
  return { ...days[day], slots: rec.slots };
}

export function installOverride() {
  setDayOverride((day) => {
    try { return effectiveDay(store.load(), day); } catch { return null; }
  });
}

export function slotsOf(doc, day) {
  return (effectiveDay(doc, day) ?? days[day]).slots.map((s) => ({ ...s }));
}

// Sets of one slot in one week: the plan's week rules applied to the slot (same rules as plan-v2.js setsFor).
export function weekSets(week, slot) {
  const base = slot.sets;
  switch (weekInfo(week).setsMode) {
    case "two": return Math.min(base, 2);
    case "easier": return Math.max(base - 1, 1);
    case "build2":
      if (slot.slot === "A1" || slot.slot === "A2") return base + 1;
      if (slot.slot === "D") return Math.min(base, 2);
      return base;
    default: return base;
  }
}

export function runningWorkout(doc, day) {
  return doc.sessions.find((s) => !s.deleted && s.status === "in_progress" && s.plan_day === day) ?? null;
}

// Save the whole day at once (like a set: saved the moment it is tapped).
function saveDay(day, slots, change) {
  const doc = store.load();
  if (runningWorkout(doc, day)) throw new Error("This day's workout is running. Finish it first.");
  const t = new Date().toISOString();
  doc.plan_days = doc.plan_days ?? [];
  let rec = doc.plan_days.find((r) => r.id === recId(day));
  if (!rec) { rec = { id: recId(day), plan_id: PLAN_ID, day, changes: [] }; doc.plan_days.push(rec); }
  rec.updated_at = t;
  rec.slots = slots;
  delete rec.deleted; delete rec.deleted_at;
  rec.changes = [...(rec.changes ?? []), { at: t, ...change }].slice(-20);
  store.save(doc);
}

export function swapSlot(day, slotName, toEx) {
  const doc = store.load();
  const slots = slotsOf(doc, day);
  const s = slots.find((x) => x.slot === slotName);
  const from = s.ex;
  s.ex = toEx;
  saveDay(day, slots, { what: "swap", slot: slotName, from, to: toEx });
}

export function removeSlot(day, slotName) {
  const doc = store.load();
  const slots = slotsOf(doc, day);
  const gone = slots.find((x) => x.slot === slotName);
  const left = slots.filter((x) => x.slot !== slotName);
  // The other half of a pair now stands alone: it gets the pair's rest instead of "30 s to move".
  const partner = /^[A-C][12]$/.test(slotName) ? left.find((x) => x.slot[0] === slotName[0] && /^[A-C][12]$/.test(x.slot)) : null;
  if (partner && partner.rest === null) partner.rest = gone.rest ?? 90;
  saveDay(day, left, { what: "remove", slot: slotName, from: gone.ex });
}

export function freeAddSlot(doc, day) {
  const used = new Set(slotsOf(doc, day).map((s) => s.slot));
  return ["E1", "E2"].find((n) => !used.has(n)) ?? null;
}

export function addExercise(day, exId) {
  const doc = store.load();
  const slot = freeAddSlot(doc, day);
  if (!slot) throw new Error("Two added exercises is the most a day can take.");
  const slots = slotsOf(doc, day);
  slots.push({ slot, ex: exId, sets: 3, rest: 60 });
  saveDay(day, slots, { what: "add", slot, to: exId });
}

// Put back an exact earlier version (the Undo after a change).
export function restoreSlots(day, slots) {
  saveDay(day, slots.map((s) => ({ ...s })), { what: "undo" });
}

// Back to the plan's version: tombstone (research 9.1).
export function resetDay(day) {
  const doc = store.load();
  if (runningWorkout(doc, day)) throw new Error("This day's workout is running. Finish it first.");
  const rec = (doc.plan_days ?? []).find((r) => r.id === recId(day));
  if (!rec) return;
  const t = new Date().toISOString();
  rec.deleted = true; rec.deleted_at = t; rec.updated_at = t;
  store.save(doc);
}

// What differs from the plan, in words, for the "Changed by you" line.
export function changeSummary(doc, day) {
  const rec = editRecord(doc, day);
  if (!rec) return null;
  const plan = days[day].slots;
  const now = rec.slots;
  const out = [];
  for (const p of plan) {
    const n = now.find((x) => x.slot === p.slot);
    if (!n) out.push(`removed ${exercises[p.ex].name}`);
    else if (n.ex !== p.ex) out.push(`${exercises[p.ex].name} → ${exercises[n.ex].name}`);
  }
  for (const n of now) if (/^E[12]$/.test(n.slot)) out.push(`added ${exercises[n.ex].name}`);
  return { at: rec.updated_at, items: out };
}

// ---------- matching swaps (research 9.1 "Matching swaps need more data", open point 14) ----------
// Machines the first visit has not confirmed are left out, as in the mid-workout swap (swap.js: only when "yes").
const NEEDS = {};
for (const ex of Object.values(exercises)) for (const sw of ex.swaps) if (sw.needsMachine) NEEDS[sw.id] = sw.needsMachine;
export function machineNeeded(exId) { return NEEDS[exId] ?? null; }
export function hiddenByGym(doc, exId) {
  const need = NEEDS[exId];
  return need ? doc.shared_settings?.extra_machines?.[need] !== true : false;
}
export { extraMachines };

// { same: [...], other: [...], hidden: [...] } exercise ids with the same main muscle, excluding what the day has.
export function matchesFor(doc, day, exId) {
  const g = mainGroup(exId);
  const eq = eqOf(exId);
  const inDay = new Set(slotsOf(doc, day).map((s) => s.ex));
  const sameMuscle = Object.keys(exercises).filter((id) => id !== exId && mainGroup(id) === g);
  const all = sameMuscle.filter((id) => !inDay.has(id));
  const hidden = all.filter((id) => hiddenByGym(doc, id));
  const shown = all.filter((id) => !hiddenByGym(doc, id));
  return { same: shown.filter((id) => eqOf(id) === eq), other: shown.filter((id) => eqOf(id) !== eq), hidden, group: g, inDay: sameMuscle.filter((id) => inDay.has(id)) };
}

// Minutes: the same dayLayout() Today uses, plus about 2.5 minutes for each set more (or less) than the plan's day.
export const MIN_PER_SET = 2.5;
export function extraMinutes(doc, day, week) {
  const planSets = days[day].slots.reduce((n, s) => n + weekSets(week, s), 0);
  const nowSets = slotsOf(doc, day).reduce((n, s) => n + weekSets(week, s), 0);
  return Math.round((nowSets - planSets) * MIN_PER_SET);
}
