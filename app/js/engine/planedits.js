// Saved Plan edits (build step 3): one record per edited plan day in the synced list `plan_days`.
// Pure: no page, no storage, no network. Design: docs/research/2026-11-17-plan-diet-research.md section 9.1;
// Rosario's answers 65 (an edit is "forever" for that day of the plan) and 72 a (added exercises).
//
// Record: { id: "p-plan-v2-<day>", updated_at, plan_id: "plan-v2", day, slots: [{ slot, ex, sets, rest }], changes?: [] }
// - The whole edited day is one record, so two phones merge it as one unit (later updated_at wins).
// - "Back to the plan's day" is a tombstone (deleted: true); the day then falls back to plan-v2.js.
// - A record this app cannot use (unknown exercise or slot, a slot or an exercise twice, bad sets or rest, more than
//   2 added exercises, another plan or day) is kept in the file and synced, never dropped, but not used: the day shows
//   the plan and `newerVersion` is true, so a screen can say "This day was changed on a newer app version".
// - Slot names (the grammar): pairs A1 to C2, Abs1, Abs2, D (on its own), and E1, E2 for added exercises: at the end
//   of the day, on their own, 3 sets, 60 s rest, at most 2 a day (answer 72 a). E follows the D week rule.
import { PLAN_ID, days, exercises, weekInfo } from "../plan/plan-v2.js";

export const SLOT_NAMES = Object.freeze(["A1", "A2", "B1", "B2", "C1", "C2", "Abs1", "Abs2", "D", "E1", "E2"]);
export const ADDED_SLOTS = Object.freeze(["E1", "E2"]);
export const MAX_ADDED = 2;
export const ADDED_SETS = 3;
export const ADDED_REST = 60;
export const MIN_SETS = 1;
export const MAX_SETS = 5;
// Rest in seconds a slot may have (null: the first exercise of a pair, about 30 s to move to the second).
export const REST_CHOICES = Object.freeze([30, 45, 60, 75, 90, 120]);
// Rest for a pair exercise left on its own (its partner was removed) when neither it nor the plan gives one.
const LONE_REST = 90;

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
export const isKnownExercise = (id) => typeof id === "string" && own(exercises, id);
export const isPlanDayId = (dayId) => typeof dayId === "string" && own(days, dayId);
const isPairSlot = (name) => /^[A-C][12]$/.test(name);

export const planDayId = (dayId, planId = PLAN_ID) => `p-${planId}-${dayId}`;

// The four known fields of a slot, nothing else.
const pick = (s) => ({ slot: s.slot, ex: s.ex, sets: s.sets, rest: s.rest });
// The plan's own day, as plain slots.
export const planDaySlots = (dayId) => days[dayId].slots.map(pick);

// Sets for one slot object in one week, on one plan day. The same rule as setsFor() in plan-v2.js
// (tests/plan-edits.test.mjs test 6 checks every plan slot in every week), plus the added slots E1 and E2, which
// stay at 2 sets in weeks 7-11 on every day (trainer T3 b). Trainer L2 (T3 a, 0.7.1): weeks 7-11, days that are not
// leg days keep D's sets and give Abs1 one set less. No known day = the leg-day rule (the rule before 0.7.1).
export function setsForSlot(weekNumber, slot, dayId) {
  const base = slot.sets;
  const leg = isPlanDayId(dayId) ? days[dayId].leg : true;
  switch (weekInfo(weekNumber).setsMode) {
    case "two": return Math.min(base, 2);
    case "easier": return Math.max(base - 1, 1);
    case "build2":
      if (slot.slot === "A1" || slot.slot === "A2") return base + 1;
      if (ADDED_SLOTS.includes(slot.slot)) return Math.min(base, 2);
      if (slot.slot === "D") return leg ? Math.min(base, 2) : base;
      if (slot.slot === "Abs1" && !leg) return Math.max(base - 1, 1);
      return base;
    default: return base;
  }
}

// Can this app use the slots of an edited day? Returns { ok: true } or { ok: false, reason } in plain words.
export function checkSlots(slots) {
  const no = (reason) => ({ ok: false, reason });
  if (!Array.isArray(slots) || slots.length < 1) return no("A day needs at least one exercise.");
  if (slots.length > SLOT_NAMES.length) return no("Too many exercises in one day.");
  const names = new Set();
  const ids = new Set();
  let added = 0;
  for (const s of slots) {
    if (!isObj(s)) return no("This day has an exercise this app cannot read.");
    if (typeof s.slot !== "string" || !SLOT_NAMES.includes(s.slot)) return no("This day has a place this app does not know.");
    if (names.has(s.slot)) return no("This day has the same place twice.");
    if (!isKnownExercise(s.ex)) return no("Unknown exercise.");
    if (ids.has(s.ex)) return no("That exercise is already in this day.");
    if (!Number.isInteger(s.sets) || s.sets < MIN_SETS || s.sets > MAX_SETS) return no(`Sets must be ${MIN_SETS} to ${MAX_SETS}.`);
    if (!(s.rest === null || REST_CHOICES.includes(s.rest))) return no("The rest time is not one the app knows.");
    if (ADDED_SLOTS.includes(s.slot)) added += 1;
    else if (added) return no("Added exercises go at the end of the day.");
    names.add(s.slot);
    ids.add(s.ex);
  }
  if (added > MAX_ADDED) return no(`At most ${MAX_ADDED} added exercises a day.`);
  return { ok: true };
}

// Can this app use a plan_days record for this day? (A tombstone is "not an edit", see effectiveDay.)
export function checkPlanDay(record, dayId) {
  if (!isObj(record)) return { ok: false, reason: "Not a saved day." };
  if (record.id !== planDayId(dayId) || record.plan_id !== PLAN_ID || record.day !== dayId) {
    return { ok: false, reason: "This day was saved for another plan or day." };
  }
  return checkSlots(record.slots);
}

// The record for a day in a document (a tombstone too), or null.
export function findPlanDay(doc, dayId) {
  const list = doc && Array.isArray(doc.plan_days) ? doc.plan_days : [];
  return list.find((r) => isObj(r) && r.id === planDayId(dayId)) ?? null;
}

// The day to train: the edited day when the record is usable, else the plan's day.
// Returns { dayId, slots: [{ slot, ex, sets (base, before the week rule), rest }], edited, newerVersion }.
// A pair exercise left on its own with no rest of its own gets the rest the plan gives that pair (its last member's).
export function effectiveDay(dayId, record) {
  const plain = { dayId, slots: planDaySlots(dayId), edited: false, newerVersion: false };
  if (!isObj(record) || record.deleted === true) return plain;
  if (!checkPlanDay(record, dayId).ok) return { ...plain, newerVersion: true };
  const slots = record.slots.map(pick);
  const letters = new Map();
  for (const s of slots) if (isPairSlot(s.slot)) letters.set(s.slot[0], (letters.get(s.slot[0]) ?? 0) + 1);
  for (const s of slots) {
    if (!isPairSlot(s.slot) || letters.get(s.slot[0]) !== 1 || s.rest !== null) continue;
    const pair = days[dayId].slots.filter((p) => p.slot[0] === s.slot[0] && isPairSlot(p.slot));
    s.rest = pair.length ? pair[pair.length - 1].rest ?? LONE_REST : LONE_REST;
  }
  return { dayId, slots, edited: true, newerVersion: false };
}

// True when these slots are exactly the plan's own day (same places, exercises, sets and rest, same order).
export function sameAsPlan(dayId, slots) {
  const plan = planDaySlots(dayId);
  return Array.isArray(slots) && slots.length === plan.length
    && slots.every((s, i) => isObj(s) && s.slot === plan[i].slot && s.ex === plan[i].ex && s.sets === plan[i].sets && s.rest === plan[i].rest);
}

// ---------- edits on a list of slots (pure; they throw a plain message when the edit is not allowed) ----------

const fail = (msg) => { throw new Error(msg); };
const copySlots = (slots) => slots.map((s) => ({ ...s }));

export function withSwap(slots, slotName, exId) {
  if (!isKnownExercise(exId)) fail("Unknown exercise.");
  const i = slots.findIndex((s) => s.slot === slotName);
  if (i < 0) fail(`No exercise in place ${String(slotName).slice(0, 10)} on this day.`);
  if (slots.some((s, k) => k !== i && s.ex === exId)) fail("That exercise is already in this day.");
  const out = copySlots(slots);
  out[i].ex = exId;
  return out;
}

// Remove one exercise. Added exercises are numbered again (E2 becomes E1) so they stay E1, E2 in order.
export function withRemoved(slots, slotName) {
  if (!slots.some((s) => s.slot === slotName)) fail(`No exercise in place ${String(slotName).slice(0, 10)} on this day.`);
  const out = copySlots(slots).filter((s) => s.slot !== slotName);
  if (!out.length) fail("A day needs at least one exercise.");
  let n = 0;
  for (const s of out) if (ADDED_SLOTS.includes(s.slot)) s.slot = ADDED_SLOTS[n++];
  return out;
}

// Change the sets of one exercise on this day (the base sets, before the week rule). 0.6.0, Rosario's batch.
export function withSets(slots, slotName, sets) {
  const i = slots.findIndex((s) => s.slot === slotName);
  if (i < 0) fail(`No exercise in place ${String(slotName).slice(0, 10)} on this day.`);
  if (!Number.isInteger(sets) || sets < MIN_SETS || sets > MAX_SETS) fail(`Sets must be ${MIN_SETS} to ${MAX_SETS}.`);
  const out = copySlots(slots);
  out[i].sets = sets;
  return out;
}

// Add an exercise at the end of the day, on its own: 3 sets, 60 s rest (answer 72 a).
export function withAdded(slots, exId) {
  if (!isKnownExercise(exId)) fail("Unknown exercise.");
  if (slots.some((s) => s.ex === exId)) fail("That exercise is already in this day.");
  const added = slots.filter((s) => ADDED_SLOTS.includes(s.slot)).length;
  if (added >= MAX_ADDED) fail(`At most ${MAX_ADDED} added exercises a day.`);
  return [...copySlots(slots), { slot: ADDED_SLOTS[added], ex: exId, sets: ADDED_SETS, rest: ADDED_REST }];
}

// ---------- swap choices ----------

// Exercises that need a first-visit machine (question 17), from every `needsMachine` mark in the catalogue.
const MACHINE_OF = (() => {
  const m = new Map();
  for (const ex of Object.values(exercises)) for (const sw of ex.swaps ?? []) if (sw.needsMachine) m.set(sw.id, sw.needsMachine);
  return m;
})();

// What a slot of a (possibly edited) day can be swapped to: the plan's own exercise for that place and its swaps
// (always offered, even after the place was swapped by an edit), then the swaps of the exercise there now.
// Never the exercise there now, never one already in that day, no duplicates; a first-visit machine only when
// settings.extra_machines says the gym has it. Same idea as ui/swap.js swapChoices for a running workout.
export function planSwapChoices(dayId, slotName, record, settings) {
  if (!isPlanDayId(dayId)) return [];
  const eff = effectiveDay(dayId, record);
  const cur = eff.slots.find((s) => s.slot === slotName);
  if (!cur) return [];
  const planSlot = days[dayId].slots.find((s) => s.slot === slotName);
  const out = [];
  const add = (id) => { if (isKnownExercise(id) && !out.includes(id)) out.push(id); };
  if (planSlot) {
    add(planSlot.ex);
    for (const sw of exercises[planSlot.ex]?.swaps ?? []) add(sw.id);
  }
  for (const sw of exercises[cur.ex]?.swaps ?? []) add(sw.id);
  const inDay = new Set(eff.slots.filter((s) => s.slot !== slotName).map((s) => s.ex));
  const hasMachine = (id) => !MACHINE_OF.has(id) || settings?.extra_machines?.[MACHINE_OF.get(id)] === true;
  return out.filter((id) => id !== cur.ex && !inDay.has(id) && (hasMachine(id) || (planSlot && id === planSlot.ex)));
}
