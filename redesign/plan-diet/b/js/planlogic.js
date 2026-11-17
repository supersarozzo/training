// Plan logic for the prototype: the day as edited (plan_days, research 9.1), the week's real sets, matching swaps,
// free places for "add", minutes, the day's build-up per muscle and the weekly sets per muscle.
// The real build would put the "edited day" read inside engine/schedule.js daySlots() (tests first, Opus review).
// Here it is a separate copy so app/ stays untouched. plan-v2.js is never edited.
import { days, exercises, weekInfo, PLAN_ID, DAY_IDS, rirFor } from "./app/plan-v2.js";
import { sessionLayout } from "./app/schedule.js";
import { EX_MUSCLES, EQUIP, matchGroup, CHECK_ROWS, SHOULDERS_ALL } from "./data/muscles.js";
import { update, stamp } from "./store.js";

export const ORDER = ["A1", "A2", "B1", "B2", "C1", "C2", "D", "Abs1", "Abs2"];
export const PLACE_NAMES = {
  A1: "Pair A, first", A2: "Pair A, second", B1: "Pair B, first", B2: "Pair B, second", C1: "Pair C, first", C2: "Pair C, second",
  D: "On its own, after the pairs", Abs1: "Abs, first", Abs2: "Abs, second",
};
const SLOT_RE = /^([A-C][12]|Abs1|Abs2|D)$/;
const recId = (dayId) => `p-${PLAN_ID}-${dayId}`;

// The plan_days record of a day, if it is live and valid. A record that fails the check is kept but not used.
export function dayRecord(doc, dayId) {
  const rec = (doc.plan_days ?? []).find((r) => r.id === recId(dayId));
  if (!rec || rec.deleted) return { rec: null, bad: false };
  const ok = Array.isArray(rec.slots) && rec.slots.every((s) => SLOT_RE.test(s.slot) && exercises[s.ex] && Number.isInteger(s.sets) && s.sets >= 1 && s.sets <= 5)
    && new Set(rec.slots.map((s) => s.slot)).size === rec.slots.length;
  return ok ? { rec, bad: false } : { rec: null, bad: true };
}

export function baseSlots(doc, dayId) {
  const { rec } = dayRecord(doc, dayId);
  const slots = rec ? rec.slots : days[dayId].slots;
  return [...slots].sort((a, b) => ORDER.indexOf(a.slot) - ORDER.indexOf(b.slot)).map((s) => ({ ...s }));
}

// Sets of one slot in one week: the same rules as plan-v2.js setsFor(), applied to the (maybe edited) slot.
export function setsInWeek(slot, week) {
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

export function daySlots(doc, dayId, week) {
  return baseSlots(doc, dayId).map((s) => ({ ...s, base: s.sets, sets: setsInWeek(s, week) }));
}

export function isEdited(doc, dayId) { return dayRecord(doc, dayId).rec !== null; }

// Group the slots into what is done together: pairs (A, B, C), the one on its own (D), the abs.
export function units(slots) {
  const out = [];
  for (const letter of ["A", "B", "C"]) {
    const list = slots.filter((s) => s.slot[0] === letter && s.slot.length === 2);
    if (!list.length) continue;
    // Spelled out the way the workout runs it (idea from builder A): "back and forth · 3 rounds · rest 90 s after each round".
    const rounds = Math.max(...list.map((s) => s.sets));
    const rest = list.map((s) => s.rest).find((r) => r !== null && r !== undefined);
    out.push({ id: letter, title: `Pair ${letter}`, sub: list.length === 2 ? `Back and forth · ${rounds} rounds · rest ${rest} s after each round` : `${rounds} sets · rest ${rest} s after each set`, slots: list });
  }
  const d = slots.filter((s) => s.slot === "D");
  if (d.length) out.push({ id: "D", title: "On its own", sub: `${d[0].sets} sets · rest ${d[0].rest ?? 60} s between sets`, slots: d });
  const abs = slots.filter((s) => s.slot.startsWith("Abs"));
  if (abs.length) {
    const rest = abs.map((s) => s.rest).find((r) => r !== null && r !== undefined);
    out.push({ id: "Abs", title: "Abs and holds", sub: rest ? `One after the other · rest ${rest} s between sets` : "Short rests", slots: abs });
  }
  return out;
}

export function repText(ex) {
  const [lo, hi] = ex.range;
  const unit = ex.kind === "hold" ? " s" : "";
  return `${lo === hi ? lo : `${lo}–${hi}`}${unit}`;
}
export function repWord(ex) { return ex.kind === "hold" ? "hold" : "reps"; }
export function restText(slot) {
  if (slot.slot === "D") return `Rest ${slot.rest} s between sets`;
  if (slot.rest === null) return "Then 30 s to move on";
  return `Rest ${slot.rest} s after`;
}

// About how long the day takes: the app's layout for the week, plus 2.5 minutes for each set more than the plan's day.
export function minutesFor(doc, dayId, week) {
  const base = sessionLayout("full", week).reduce((n, b) => n + b.minutes, 0);
  const plan = days[dayId].slots.reduce((n, s) => n + setsInWeek(s, week), 0);
  const now = daySlots(doc, dayId, week).reduce((n, s) => n + s.sets, 0);
  return { minutes: Math.round(base + (now - plan) * 2.5), delta: Math.round((now - plan) * 2.5), sets: now };
}

export function rirText(week, dayId) {
  const r = rirFor(week, dayId);
  return Array.isArray(r) ? `${r[0]}-${r[1]}` : String(r);
}

// ---------- the build-up: muscles per card and for the day so far ----------

// Weighted sets per group for a list of slots (main = 1, helper = 0.5 per set).
export function loadOf(slots) {
  const load = {};
  for (const s of slots) {
    const m = EX_MUSCLES[s.ex];
    if (!m) continue;
    for (const g of m.p) load[g] = (load[g] ?? 0) + s.sets;
    for (const g of m.s) load[g] = (load[g] ?? 0) + s.sets * 0.5;
  }
  return load;
}
// 3 steps at most (research 4.3). Thresholds for a day.
export function levelsFromLoad(load) {
  const lv = {};
  for (const [g, n] of Object.entries(load)) lv[g] = n >= 6 ? 3 : n >= 3 ? 2 : n > 0 ? 1 : 0;
  return lv;
}
export function exerciseLevels(exId) {
  const m = EX_MUSCLES[exId];
  const lv = {};
  if (!m) return lv;
  for (const g of m.s) lv[g] = 1;
  for (const g of m.p) lv[g] = 3;
  return lv;
}

// ---------- matching swaps ----------

function inGym(doc, exId) {
  // An extra machine (question 17) shows only once the first visit found it (as the app's swap does).
  const need = Object.values(exercises).flatMap((e) => e.swaps).find((s) => s.id === exId && s.needsMachine);
  if (!need) return { ok: true };
  const v = doc.shared_settings?.extra_machines?.[need.needsMachine];
  return { ok: v === true, state: v === false ? "no" : v === true ? "yes" : "unknown" };
}

// For a slot's exercise: same muscle + similar equipment first, then same muscle + other equipment, then hidden ones.
export function matchesFor(doc, exId, daySlotsNow = []) {
  const me = EX_MUSCLES[exId];
  const fam = EQUIP[me.equip].family;
  const mainGroups = me.p.map(matchGroup);
  const planPicks = new Set((exercises[exId].swaps ?? []).map((s) => s.id));
  const usedToday = new Set(daySlotsNow.map((s) => s.ex));
  const same = [], other = [], hidden = [];
  for (const id of Object.keys(exercises)) {
    if (id === exId) continue;
    const m = EX_MUSCLES[id];
    // Same main muscle, or the plan itself lists it as this exercise's swap (the plan's pick always shows).
    if (!m || (!planPicks.has(id) && !m.p.map(matchGroup).some((g) => mainGroups.includes(g)))) continue;
    const gym = inGym(doc, id);
    const item = { id, planPick: planPicks.has(id), usedToday: usedToday.has(id), equip: EQUIP[m.equip].name, note: (exercises[exId].swaps ?? []).find((s) => s.id === id)?.note ?? null };
    if (!gym.ok) { hidden.push({ ...item, state: gym.state }); continue; }
    (EQUIP[m.equip].family === fam ? same : other).push(item);
  }
  const sort = (a, b) => (b.planPick - a.planPick) || (a.usedToday - b.usedToday) || exercises[a.id].name.localeCompare(exercises[b.id].name);
  return { same: same.sort(sort), other: other.sort(sort), hidden };
}

// ---------- editing (answer 65: an edit lasts for good, for that plan day) ----------

export function freePlaces(slots) {
  const used = new Set(slots.map((s) => s.slot));
  return ORDER.filter((p) => !used.has(p));
}
function defaultRest(place) {
  if (/^[A-C]1$/.test(place)) return null;
  if (/^[A-C]2$/.test(place)) return 75;
  if (place === "D") return 60;
  return 30;
}

function saveDay(dayId, slots, change) {
  update((doc, t) => {
    doc.plan_days = doc.plan_days ?? [];
    let rec = doc.plan_days.find((r) => r.id === recId(dayId));
    const prevChanges = rec && !rec.deleted && Array.isArray(rec.changes) ? rec.changes : [];
    const fresh = { id: recId(dayId), updated_at: t, plan_id: PLAN_ID, day: dayId, slots: slots.map(({ slot, ex, sets, rest }) => ({ slot, ex, sets, rest })), changes: [...prevChanges, { at: t, ...change }] };
    if (rec) Object.keys(rec).forEach((k) => delete rec[k]), Object.assign(rec, fresh);
    else doc.plan_days.push(fresh);
  });
}

export function swapSlot(doc, dayId, slotName, toEx) {
  const slots = baseSlots(doc, dayId);
  const s = slots.find((x) => x.slot === slotName);
  const from = s.ex;
  s.ex = toEx; // keeps the slot's sets and rest; reps come from the new exercise (research 3)
  saveDay(dayId, slots, { what: "swap", slot: slotName, from, to: toEx });
  return from;
}
export function removeSlot(doc, dayId, slotName) {
  const slots = baseSlots(doc, dayId);
  const gone = slots.find((x) => x.slot === slotName);
  saveDay(dayId, slots.filter((x) => x.slot !== slotName), { what: "remove", slot: slotName, from: gone.ex });
  return gone;
}
export function addSlot(doc, dayId, place, exId, sets = 3) {
  const slots = baseSlots(doc, dayId);
  slots.push({ slot: place, ex: exId, sets, rest: defaultRest(place) });
  saveDay(dayId, slots, { what: "add", slot: place, to: exId });
}
export function setSlotSets(doc, dayId, slotName, sets) {
  const slots = baseSlots(doc, dayId);
  const s = slots.find((x) => x.slot === slotName);
  const from = s.sets;
  s.sets = Math.min(5, Math.max(1, sets));
  saveDay(dayId, slots, { what: "sets", slot: slotName, from, to: s.sets });
}
// Back to the plan's version: a tombstone, so a sync never brings the old edit back (research 9.1).
export function resetDay(dayId) {
  update((doc, t) => {
    const rec = (doc.plan_days ?? []).find((r) => r.id === recId(dayId));
    if (rec) { Object.keys(rec).forEach((k) => delete rec[k]); Object.assign(rec, { id: recId(dayId), updated_at: t, deleted: true, deleted_at: t }); }
  });
}
// Undo of one edit: put back the record as it was before (a full copy, taken before the change).
export function snapshotDay(doc, dayId) {
  const rec = (doc.plan_days ?? []).find((r) => r.id === recId(dayId));
  return rec ? JSON.parse(JSON.stringify(rec)) : null;
}
export function restoreDay(dayId, snap) {
  update((doc, t) => {
    doc.plan_days = doc.plan_days ?? [];
    const i = doc.plan_days.findIndex((r) => r.id === recId(dayId));
    const back = snap ? { ...snap, updated_at: t } : { id: recId(dayId), updated_at: t, deleted: true, deleted_at: t };
    if (i >= 0) doc.plan_days[i] = back; else doc.plan_days.push(back);
  });
}

// Plain words for what changed on a day, compared with the plan.
export function changeWords(doc, dayId) {
  if (!isEdited(doc, dayId)) return [];
  const plan = days[dayId].slots;
  const now = baseSlots(doc, dayId);
  const out = [];
  for (const p of plan) {
    const n = now.find((s) => s.slot === p.slot);
    if (!n) out.push(`Removed ${exercises[p.ex].name}`);
    else if (n.ex !== p.ex) out.push(`${exercises[p.ex].name} → ${exercises[n.ex].name}`);
    else if (n.sets !== p.sets) out.push(`${exercises[n.ex].name}: ${p.sets} → ${n.sets} sets`);
  }
  for (const n of now) if (!plan.some((p) => p.slot === n.slot)) out.push(`Added ${exercises[n.ex].name}`);
  return out;
}

// ---------- the whole-plan check (research 5) ----------

// For one week: per check row, direct sets (main muscle), weighted sets (+0.5 per helper set), and the days it is trained.
export function weeklyVolume(doc, week) {
  const rows = CHECK_ROWS.map((r) => ({ ...r, direct: 0, weighted: 0, days: new Set() }));
  const all = { id: "shoulders", name: "All shoulders", direct: 0, weighted: 0, days: new Set(), groups: SHOULDERS_ALL };
  for (const d of DAY_IDS) {
    for (const s of daySlots(doc, d, week)) {
      const m = EX_MUSCLES[s.ex];
      if (!m) continue;
      for (const r of [...rows, all]) {
        const role = m.p.some((g) => r.groups.includes(g)) ? 1 : m.s.some((g) => r.groups.includes(g)) ? 0.5 : 0;
        if (!role) continue;
        r.weighted += role * s.sets;
        if (role === 1) { r.direct += s.sets; r.days.add(d); }
      }
    }
  }
  return { rows, all };
}
export function verdict(n) {
  if (n < 10) return { word: "Under 10", cls: "under" };
  if (n <= 20) return { word: "In range", cls: "in" };
  return { word: "A lot", cls: "over" };
}
export { DAY_IDS, days, exercises, weekInfo };
export const stampNow = stamp;
