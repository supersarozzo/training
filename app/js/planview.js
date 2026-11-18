// The Plan tab's view of an EDITED day (build steps 4 and 5, docs/DESIGN.md 15.5 and 15.6; mock-up "Edit" and
// "Whole-plan muscle check"). Pure: data in, data out; no page, no storage.
// - A day as it will be trained: the saved Plan edit (plan_days, engine/planedits.js) when there is a usable one, with
//   this week's sets (engine/schedule.js daySlots).
// - "Day so far", the neighbours and the headers of an edited day.
// - What changed against the plan's day (the "Changed by you" card and the "Back to the plan's day" list), worked out
//   from the slots themselves, so it is right after an Undo too.
// - The Swap and Add sheets' lists.
// - The whole-plan muscle check rows.
// All muscle numbers come from engine/planpage.js setsByMuscle, the same function as "Day so far", so the opened
// exercise and the muscle check never disagree.
import { daySlots, blockPosition } from "./engine/schedule.js";
import { validRange, suggestFor } from "./engine/workout.js";
import { findPlanDay, effectiveDay, planDaySlots, planSwapChoices, setsForSlot, ADDED_SLOTS, ADDED_SETS, ADDED_REST, MAX_ADDED } from "./engine/planedits.js";
import { setsByMuscle, levelFor, soFarText, unitsOf, unitHeader, slotRole, GYM_GROUPS, gymGroupOf, fmtSets } from "./engine/planpage.js";
import { days, exercises, weeks, weekInfo, DAY_IDS, MOVE_SECONDS } from "./plan/plan-v2.js";
import { MUSCLES, EQUIPMENT, exerciseMuscles } from "./plan/muscles.js";

const LAST_WEEK = weeks.length;
const clampWeek = (w) => Math.min(Math.max(Number(w) || 1, 1), LAST_WEEK);
const isPairSlot = (name) => /^[A-C][12]$/.test(name);
const lower = (g) => MUSCLES[g].name.toLowerCase();
export const exName = (id) => exercises[id]?.name ?? "Unknown exercise";

// ---------- the day as it will be trained ----------

// The saved record of a day in a document (a tombstone too), or null.
export const editOf = (doc, dayId) => findPlanDay(doc, dayId);

// { slots (this week's sets), edited, newerVersion, record }.
export function viewDay(doc, dayId, week) {
  const record = editOf(doc, dayId);
  const eff = effectiveDay(dayId, record);
  return { slots: daySlots(dayId, clampWeek(week), record), edited: eff.edited, newerVersion: eff.newerVersion, record };
}

// "Day so far" at one card of a (possibly edited) day. Same shape as engine/planpage.js daySoFar.
export function soFarIn(slots, slotName) {
  const i = slots.findIndex((s) => s.slot === slotName);
  if (i < 0) throw new Error(`No slot ${slotName}`);
  const { direct, weighted } = setsByMuscle(slots.slice(0, i + 1));
  const levels = Object.fromEntries(Object.entries(weighted).map(([g, n]) => [g, levelFor(n)]));
  return { position: i + 1, total: slots.length, direct, weighted, levels, text: soFarText(weighted) };
}

export function neighboursIn(slots, slotName) {
  const i = slots.findIndex((s) => s.slot === slotName);
  return { prev: i > 0 ? slots[i - 1] : null, next: i >= 0 && i < slots.length - 1 ? slots[i + 1] : null };
}

// Pair headers in words. An added exercise (E1, E2) or a pair exercise left on its own is "On its own".
export function unitTitle(unit) {
  if (unit.type === "pair") return unitHeader(unit);
  const s = unit.slots[0];
  if (/^Abs/.test(s.slot)) return unitHeader(unit);
  if (ADDED_SLOTS.includes(s.slot)) return `Added by you · on its own · rest ${s.rest} s between sets`;
  return `On its own · rest ${s.rest ?? 90} s between sets`;
}
export const unitsIn = (slots) => unitsOf(slots).map((u) => ({ ...u, title: unitTitle(u) }));

// The sheet's eyebrow part for a slot of this day.
export function roleIn(slots, slotName) {
  if (ADDED_SLOTS.includes(slotName)) return "Added by you · on its own";
  if (isPairSlot(slotName) && slots.filter((s) => s.slot[0] === slotName[0] && isPairSlot(s.slot)).length === 1) return "On its own";
  return slotRole(null, slotName);
}

// The Rest tile for a slot of this day (a pair exercise left on its own rests between its own sets).
export function restIn(slots, slot) {
  const alone = isPairSlot(slot.slot) && slots.filter((s) => s.slot[0] === slot.slot[0] && isPairSlot(s.slot)).length === 1;
  if (slot.rest === null) return { value: `${MOVE_SECONDS} s`, note: "to move" };
  if (/^[A-C]2$/.test(slot.slot) && !alone) return { value: `${slot.rest} s`, note: "after the round" };
  return { value: `${slot.rest} s`, note: "between sets" };
}

// ---------- minutes ----------

// About 8 minutes for an added exercise of 3 sets (mock-up): 8/3 minutes a set, plus or minus against the plan's day.
export const MINUTES_PER_SET = 8 / 3;
export function editedMinutes(planMinutes, dayId, week, record) {
  const w = clampWeek(week);
  const plan = daySlots(dayId, w).reduce((n, s) => n + s.sets, 0);
  const now = daySlots(dayId, w, record).reduce((n, s) => n + s.sets, 0);
  return Math.max(0, Math.round(planMinutes + (now - plan) * MINUTES_PER_SET));
}

// ---------- what changed against the plan's day ----------

// [{ what: "swap" | "remove" | "add", slot, from, to, text }] in the day's order. Base slots (no week rule).
export function dayChanges(dayId, record) {
  const eff = effectiveDay(dayId, record);
  if (!eff.edited) return [];
  const plan = planDaySlots(dayId);
  const now = new Map(eff.slots.map((s) => [s.slot, s]));
  const out = [];
  for (const p of plan) {
    const n = now.get(p.slot);
    if (!n) out.push({ what: "remove", slot: p.slot, from: p.ex, to: null, text: `Removed: ${exName(p.ex)}` });
    else {
      if (n.ex !== p.ex) out.push({ what: "swap", slot: p.slot, from: p.ex, to: n.ex, text: `${exName(p.ex)} → ${exName(n.ex)}` });
      // 0.6.0: the sets of an exercise changed in the Plan (base sets, before the week rule).
      if (n.sets !== p.sets) out.push({ what: "sets", slot: p.slot, from: p.sets, to: n.sets, text: `Sets: ${exName(n.ex)} ${p.sets} → ${n.sets}` });
    }
  }
  for (const s of eff.slots) if (ADDED_SLOTS.includes(s.slot)) out.push({ what: "add", slot: s.slot, from: null, to: s.ex, text: `Added: ${exName(s.ex)}` });
  return out;
}

// "17 Nov" from a record's updated_at (local day). Empty when there is no usable time.
export function changedOn(record) {
  const t = record && typeof record.updated_at === "string" ? new Date(record.updated_at) : null;
  if (!t || Number.isNaN(t.getTime())) return "";
  return t.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// The slot's state in the day: what a Swap would keep.
export function slotOf(doc, dayId, slotName) {
  return effectiveDay(dayId, editOf(doc, dayId)).slots.find((s) => s.slot === slotName) ?? null;
}

// ---------- machines the first visit has not found ----------

const MACHINE_OF = (() => {
  const m = new Map();
  for (const ex of Object.values(exercises)) for (const sw of ex.swaps ?? []) if (sw.needsMachine) m.set(sw.id, sw.needsMachine);
  return m;
})();
// The same rule as engine/planedits.js planSwapChoices: a first-visit machine is offered only when the gym has it.
export const machineFound = (exId, settings) => !MACHINE_OF.has(exId) || settings?.extra_machines?.[MACHINE_OF.get(exId)] === true;

// ---------- Swap sheet ----------

const familyOf = (id) => EQUIPMENT[exerciseMuscles[id]?.equip]?.family ?? null;
const groupName = (gid) => GYM_GROUPS.find((g) => g.id === gid)?.name ?? "";

// Everything the Swap sheet shows for one slot of a day:
// { current, sets, rest, muscle ("front thighs"), same: [{ id, pick, sameKit }], already: [names], hidden: [names],
//   others: [{ id, name, items: [ids] }] }. `pick`: "Plan's pick" for the plan's own swaps (and the plan's own exercise
// when the place was swapped), else null. sameKit: same kind of equipment as the exercise there now (shown in a second
// group under its own heading; the plan's picks always stay in the first). Never the exercise there now, never one
// already in the day.
export function swapSheet(doc, dayId, slotName, settings) {
  const record = editOf(doc, dayId);
  const eff = effectiveDay(dayId, record);
  const cur = eff.slots.find((s) => s.slot === slotName);
  if (!cur) return null;
  const inDay = new Set(eff.slots.map((s) => s.ex));
  const planSlot = days[dayId].slots.find((s) => s.slot === slotName);
  const planIds = planSlot ? [planSlot.ex, ...(exercises[planSlot.ex]?.swaps ?? []).map((s) => s.id)] : [];
  const picks = new Set(planSwapChoices(dayId, slotName, record, settings).filter((id) => planIds.includes(id)));
  const gid = gymGroupOf(cur.ex);
  const same = [];
  const hidden = [];
  const already = [];
  const consider = (id) => {
    if (id === cur.ex || same.some((x) => x.id === id)) return;
    if (inDay.has(id)) { if (!already.includes(exName(id))) already.push(exName(id)); return; }
    if (!picks.has(id) && !machineFound(id, settings)) { if (!hidden.includes(exName(id))) hidden.push(exName(id)); return; }
    same.push({ id, pick: picks.has(id) ? "Plan's pick" : null, sameKit: !picks.has(id) && familyOf(id) === familyOf(cur.ex) });
  };
  for (const id of planIds) consider(id);
  const sameGroup = Object.keys(exerciseMuscles).filter((id) => exercises[id] && gymGroupOf(id) === gid);
  const curFam = familyOf(cur.ex);
  for (const id of sameGroup.filter((x) => familyOf(x) !== curFam)) consider(id);
  for (const id of sameGroup.filter((x) => familyOf(x) === curFam)) consider(id);
  const shown = new Set([cur.ex, ...same.map((x) => x.id)]);
  const others = GYM_GROUPS.filter((g) => g.id !== gid).map((g) => ({
    id: g.id, name: g.name,
    items: Object.keys(exerciseMuscles).filter((id) => exercises[id] && gymGroupOf(id) === g.id && !shown.has(id) && !inDay.has(id) && machineFound(id, settings)),
  })).filter((g) => g.items.length);
  return { current: cur.ex, sets: cur.sets, rest: cur.rest, muscle: groupName(gid).toLowerCase(), same, already, hidden, others };
}

// ---------- Add sheet ----------

// { left (added places left, 0 to 2), setsThisWeek, setsNormal, rest, groups: [{ id, name, low, items: [ids], hidden: [names] }] }
// `low`: the muscle check finds this group short this week (lowGroups from checkRows). Never an exercise already in the day.
export function addSheet(doc, dayId, week, settings) {
  const record = editOf(doc, dayId);
  const eff = effectiveDay(dayId, record);
  const inDay = new Set(eff.slots.map((s) => s.ex));
  const added = eff.slots.filter((s) => ADDED_SLOTS.includes(s.slot)).length;
  const low = new Set(lowGroups(doc, week));
  const groups = GYM_GROUPS.map((g) => {
    const all = Object.keys(exerciseMuscles).filter((id) => exercises[id] && gymGroupOf(id) === g.id && !inDay.has(id));
    return { id: g.id, name: g.name, low: low.has(g.id), items: all.filter((id) => machineFound(id, settings)), hidden: all.filter((id) => !machineFound(id, settings)).map(exName) };
  });
  const probe = { slot: ADDED_SLOTS[Math.min(added, MAX_ADDED - 1)], sets: ADDED_SETS };
  return { left: Math.max(0, MAX_ADDED - added), max: MAX_ADDED, setsThisWeek: setsForSlot(clampWeek(week), probe), setsNormal: ADDED_SETS, rest: ADDED_REST, minutes: Math.round(setsForSlot(clampWeek(week), probe) * MINUTES_PER_SET), groups };
}

// ---------- whole-plan muscle check (DESIGN.md 15.6) ----------

// The week chips and the week each one counts.
export const CHECK_WEEKS = Object.freeze([
  { id: "w1", label: "Week 1", week: 1 },
  { id: "w2", label: "Weeks 2–5", week: 2 },
  { id: "w6", label: "Week 6", week: 6 },
  { id: "w7", label: "Weeks 7–11", week: 7 },
  { id: "w12", label: "Week 12", week: 12 },
]);
export const checkChipFor = (week) => {
  const w = clampWeek(week);
  return w === 1 ? "w1" : w <= 5 ? "w2" : w === 6 ? "w6" : w <= 11 ? "w7" : "w12";
};

// Sets per muscle for every day of one week (Monday to Friday), edited days included.
// { direct, weighted, daysWith: { muscle: [dayIds with direct sets] } }
export function weekMuscles(doc, week) {
  const direct = {};
  const weighted = {};
  const daysWith = {};
  for (const d of DAY_IDS) {
    const r = setsByMuscle(daySlots(d, clampWeek(week), editOf(doc, d)));
    for (const [g, n] of Object.entries(r.direct)) { direct[g] = (direct[g] ?? 0) + n; if (n > 0) (daysWith[g] ??= []).push(d); }
    for (const [g, n] of Object.entries(r.weighted)) weighted[g] = (weighted[g] ?? 0) + n;
  }
  return { direct, weighted, daysWith };
}

// The rows of the check. Groups add their muscles' sets (an exercise has one main muscle, so nothing counts twice).
const ROWS = [
  { id: "chest", name: "Chest", muscles: ["chest"], half: 1 },
  { id: "back", name: "Back (lats, middle back)", muscles: ["lats", "mid_back"], half: 1 },
  { id: "shoulders", name: "Shoulders (all)", muscles: ["front_delts", "side_delts", "rear_delts"], half: 1 },
  { id: "front_delts", name: "Front shoulders", muscles: ["front_delts"], part: true, half: 1 },
  { id: "side_delts", name: "Side shoulders", muscles: ["side_delts"], part: true, half: 1 },
  { id: "rear_delts", name: "Rear shoulders", muscles: ["rear_delts"], part: true, half: 1 },
  { id: "biceps", name: "Biceps", muscles: ["biceps"], half: 1 },
  { id: "triceps", name: "Triceps", muscles: ["triceps"], half: 1 },
  { id: "quads", name: "Front thighs (quads)", muscles: ["quads"], half: 2 },
  { id: "hamstrings", name: "Back thighs (hamstrings)", muscles: ["hamstrings"], half: 2 },
  { id: "glutes", name: "Glutes", muscles: ["glutes"], half: 2 },
  { id: "calves", name: "Calves", muscles: ["calves"], half: 2 },
  { id: "abs", name: "Abs", muscles: ["abs"], half: 2 },
  { id: "lower_back", name: "Lower back", muscles: ["lower_back"], half: 2, noWarning: true },
];
// The check row -> the Add sheet's group (GYM_GROUPS id).
const ROW_TO_GROUP = { chest: "chest", back: "back", shoulders: "shoulders", biceps: "biceps", triceps: "triceps", quads: "quads", hamstrings: "hamstrings", glutes: "glutes", calves: "calves", abs: "abs" };
const DAY3 = (d) => days[d].name.slice(0, 3);

// The verdict of a row in words and its colour class ("ok" green, "lo" warning, "n" grey). Bands (mock-up):
// 10 to 20 direct = fine; more than 20 = a lot; under 10 direct but 10+ with helpers = grey; 5 to 9 = low;
// under 5 = low. Direct sets on 1 day only adds "only 1 day" and makes it low. Lower back never warns.
export function verdict(direct, weighted, dayCount, { noWarning = false, part = false } = {}) {
  if (part) return { text: "Part of shoulders", cls: "n", flag: null };
  if (noWarning) return { text: direct > 0 ? "Fine for a beginner" : "No own exercise; fine for a beginner", cls: "n", flag: null };
  let v;
  if (direct > 20) v = { text: "More than 20: more than needed", cls: "lo", flag: "a lot" };
  else if (direct >= 10) v = { text: "In range", cls: "ok", flag: null };
  else if (weighted >= 10) v = { text: "Under 10 direct; 10+ counting helpers", cls: "n", flag: null };
  else if (direct >= 5) v = { text: "Under 10", cls: "lo", flag: "low" };
  else v = { text: direct > 0 ? "Under 5" : "Helping only", cls: "lo", flag: "low" };
  if (direct > 0 && direct <= 20 && dayCount === 1) v = { text: `${v.text} · only 1 day`, cls: "lo", flag: v.flag ?? "low" };
  return v;
}

// [{ id, name, direct, weighted (null on part rows), part, days: "Mon Wed Thu", verdict: { text, cls, flag } }]
export function checkRows(doc, week) {
  const m = weekMuscles(doc, week);
  return ROWS.map((r) => {
    const direct = r.muscles.reduce((n, g) => n + (m.direct[g] ?? 0), 0);
    const weighted = r.muscles.reduce((n, g) => n + (m.weighted[g] ?? 0), 0);
    const dset = new Set(r.muscles.flatMap((g) => m.daysWith[g] ?? []));
    const dlist = DAY_IDS.filter((d) => dset.has(d));
    return {
      id: r.id, name: r.name, part: !!r.part, half: r.half,
      direct, weighted: r.part ? null : weighted,
      days: dlist.map(DAY3).join(" "), dayList: dlist,
      verdict: verdict(direct, weighted, dlist.length, { noWarning: r.noWarning, part: r.part }),
    };
  });
}

// "4 things stand out": the rows with a flag, as "Chest: 9 direct sets on Mon, Wed, Thu" + "low" / "a lot".
export function standOut(rows) {
  return rows.filter((r) => !r.part && r.verdict.flag).map((r) => ({
    id: r.id, name: r.name.replace(/\s*\(.*\)/, ""), flag: r.verdict.flag,
    text: `${fmtSets(r.direct)} direct sets${r.dayList.length ? ` on ${r.dayList.map(DAY3).join(", ")}` : ""}`,
  }));
}

// The Add sheet's "low" groups for a week.
export function lowGroups(doc, week) {
  return checkRows(doc, week).filter((r) => !r.part && r.verdict.flag === "low" && ROW_TO_GROUP[r.id]).map((r) => ROW_TO_GROUP[r.id]);
}

// The map on the check: direct sets a week per muscle, 3 steps: 10 or more = 3, 5 to 9 = 2, under 5 or helping only = 1.
export function checkLevels(doc, week) {
  const m = weekMuscles(doc, week);
  const out = {};
  for (const g of Object.keys(m.weighted)) {
    if (!MUSCLES[g] || m.weighted[g] <= 0) continue;
    const d = m.direct[g] ?? 0;
    out[g] = d >= 10 ? 3 : d >= 5 ? 2 : 1;
  }
  return out;
}

// "Build 1. Sets a week, Monday to Friday."
export const checkSub = (week) => `${weekInfo(clampWeek(week)).phase}. Sets a week, Monday to Friday.`;

export { lower as muscleLower };

// ---------- 0.6.0: reps per exercise, the day to train ----------

// The reps range of an exercise: the one set in the Plan (exercise_state my_range) when it is usable, else the plan's.
export function rangeFor(doc, exId) {
  const st = (doc?.exercise_state ?? []).find((x) => x && x.id === `x-${exId}` && !x.deleted);
  return validRange(st?.my_range) ?? [...exercises[exId].range];
}

// "10–12" for a range.
export const rangeText = (r) => (r[0] === r[1] ? String(r[0]) : `${r[0]}–${r[1]}`);

// The plan days of this week for Today's day picker: [{ day, done, today }]. Any day can be trained on any date
// (Rosario, 2026-11-18: "so I can start any day of the week"). done: a finished or running workout of that plan day
// this week. today: the plan day of this date (none on Saturday and Sunday). Empty when the plan is not running.
export function dayChoices(doc, date) {
  const pos = blockPosition(doc.block.start_monday, date);
  if (pos.state !== "running") return [];
  const sessions = Array.isArray(doc.sessions) ? doc.sessions : [];
  return DAY_IDS.map((day) => ({
    day,
    done: sessions.some((s) => !s.deleted && s.week === pos.week && s.plan_day === day && (s.status === "finished" || s.status === "in_progress")),
    today: pos.planDay === day,
  }));
}

// The weight to use, in words, for the Plan's cards and the opened exercise (0.6.0: "the plan never shows weights").
// Same numbers as the workout (suggestFor), without the break rules of a running workout.
// Returns { text, note, kg }: text "40 kg" | "Your body weight" | "Pick a light weight";
// note: why ("Your weight, set in the Plan.", "Last time: 40 kg x 10, 10, 9" ...).
export function weightLine(doc, exId, week) {
  const ex = exercises[exId];
  if (ex.step === "bodyweight" || ex.kind === "hold") return { text: ex.kind === "hold" ? "No weight: a hold" : "Your body weight", note: "", kg: null };
  const st = (doc?.exercise_state ?? []).find((x) => x && x.id === `x-${exId}` && !x.deleted);
  const sg = suggestFor(doc, exId, { week, missed: null, exerciseState: st });
  if (typeof sg.weight_kg === "number" && sg.weight_kg > 0) return { text: `${sg.weight_kg} kg`, note: sg.action === "mine" ? sg.note : sg.lastText ?? sg.note ?? "", kg: sg.weight_kg };
  return { text: "Pick a light weight", note: "Start light with good form; the app counts up from what you log.", kg: null };
}

// Is any workout running (any day)? Reps and weight set in the Plan count on every day, so the Change sheet stays
// closed while a workout runs: a running workout keeps what it started with (JUDGING step 3, Training Agent 2026-11-18).
export function workoutRunning(doc) {
  return (doc?.sessions ?? []).some((x) => x && !x.deleted && x.status === "in_progress");
}
