// Workout flow. Pure: no page, no storage, no network.
// - units and the set-by-set sequence of a day (pairs go A1, A2, A1, A2 ...; abs and D go one after the other)
// - where the workout stands now, worked out from the saved sets (so a reload always continues in the right place)
// - what to suggest for each exercise (last time, next weight)
// - walk suggestion
// Source: plan v2 sections 3 to 6, 8, 9, 11; WORKFLOW D.
import { exercises, MOVE_SECONDS, weekInfo, walkRules } from "../plan/plan-v2.js";
import { planForDay, missedRule } from "./schedule.js";
import { nextSuggestion, warmupSets, stepSize, weightAfterBreak, stepDown, lowerBy } from "./progression.js";
import { startWalk, nextWalkBase, walkForDay, walkAfterBreak } from "./walk.js";

const isPairSlot = (slot) => /^[A-C][12]$/.test(slot);

// Units of a day: pairs (A, B, C) and singles (Abs1, Abs2, D, and the added E1, E2). `slots` come from planForDay
// (they carry sets for the week). A pair that lost one exercise by a Plan edit is a single unit: the exercise left
// keeps its own rest (or the pair's rest, engine/planedits.js effectiveDay) and its warm-up sets (wantsWarmup).
export function buildUnits(slots) {
  const units = [];
  for (const s of slots) {
    if (isPairSlot(s.slot)) {
      const letter = s.slot[0];
      let unit = units.find((u) => u.type === "pair" && u.id === letter);
      if (!unit) { unit = { type: "pair", id: letter, slots: [] }; units.push(unit); }
      unit.slots.push(s);
    } else {
      units.push({ type: "single", id: s.slot, slots: [s] });
    }
  }
  return units.map((u) => (u.type === "pair" && u.slots.length === 1 ? { type: "single", id: u.slots[0].slot, slots: u.slots } : u));
}

// Label for a unit: "Pair A", "Abs", "On its own" (D, an added exercise, or a pair exercise left on its own).
export function unitLabel(unit) {
  if (unit.type === "pair") return `Pair ${unit.id}`;
  return /^Abs/.test(unit.id) ? "Abs" : "On its own";
}

// The set-by-set order of the whole weights block.
// Entry: { unitIndex, slot, setNumber, sets, restAfter (seconds or null), restKind: "move" | "rest" | null }
// `setsOverride` (2 after a long break) caps the sets of every slot.
export function buildSequence(slots, { setsOverride = null } = {}) {
  const units = buildUnits(slots.map((s) => ({ ...s, sets: setsOverride ? Math.min(s.sets, setsOverride) : s.sets })));
  const seq = [];
  units.forEach((unit, unitIndex) => {
    if (unit.type === "single") {
      const s = unit.slots[0];
      for (let n = 1; n <= s.sets; n++) seq.push({ unitIndex, slot: s.slot, setNumber: n, sets: s.sets, restAfter: s.rest ?? 60, restKind: "rest" });
      return;
    }
    const rounds = Math.max(...unit.slots.map((s) => s.sets));
    const pairRest = unit.slots[unit.slots.length - 1].rest ?? 60;
    for (let r = 1; r <= rounds; r++) {
      const inRound = unit.slots.filter((s) => r <= s.sets);
      inRound.forEach((s, i) => {
        const last = i === inRound.length - 1;
        seq.push({
          unitIndex, slot: s.slot, setNumber: r, sets: s.sets,
          restAfter: last ? pairRest : MOVE_SECONDS,
          restKind: last ? "rest" : "move",
        });
      });
    }
  });
  if (seq.length) { seq[seq.length - 1].restAfter = null; seq[seq.length - 1].restKind = null; } // nothing to rest for at the very end
  return { units, seq };
}

// The record of one slot inside a session (or undefined).
export function slotRecord(session, slot) {
  return session.exercises.find((e) => e.slot === slot);
}
// The current record of each slot, in order (the one slotRecord finds). A swap in the middle of an exercise keeps the
// old record, with its saved sets, behind the new one (model.swapExercise); screens that step through the exercises
// (week 1) use this list so they never go back to an exercise that was swapped away. Review 8.25 R1.
export function currentRecords(session) {
  const seen = new Set();
  return session.exercises.filter((e) => (seen.has(e.slot) ? false : (seen.add(e.slot), true)));
}
export const workSets = (rec) => (rec ? rec.sets.filter((s) => s.type === "work") : []);
export const warmupDone = (rec) => (rec ? rec.sets.filter((s) => s.type === "warmup").length : 0);

// Where the workout stands: the first set in the sequence that is not saved yet.
// Returns { index, entry } or null when every set is saved.
export function nextPosition(session, seq) {
  for (let i = 0; i < seq.length; i++) {
    const e = seq[i];
    if (workSets(slotRecord(session, e.slot)).length < e.setNumber) return { index: i, entry: e };
  }
  return null;
}

// Is this entry the first set of the first exercise of a pair (warm-up sets come first)?
// A pair exercise left on its own by a Plan edit keeps its warm-up sets.
export function wantsWarmup(entry, units) {
  const unit = units[entry.unitIndex];
  if (entry.setNumber !== 1 || unit.slots[0].slot !== entry.slot) return false;
  return unit.type === "pair" || isPairSlot(entry.slot);
}

// ---------- history and suggestions ----------

// Finished sessions, newest first. A deleted or unfinished session never counts.
export function finishedSessions(sessions) {
  return sessions.filter((s) => !s.deleted && s.status === "finished").sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (a.finished_at ?? "") < (b.finished_at ?? "") ? 1 : -1));
}

// Every finished performance of an exercise, newest first.
// { weight_kg, sets: [{reps, seconds, rir}], date, week, pain? }
export function performances(sessions, exerciseId) {
  const out = [];
  for (const s of finishedSessions(sessions)) {
    for (const rec of s.exercises) {
      if (rec.done_exercise !== exerciseId) continue;
      const work = workSets(rec);
      if (!work.length) continue;
      out.push({
        weight_kg: work[work.length - 1].weight_kg ?? 0,
        sets: work.map((w) => ({ reps: w.reps ?? 0, seconds: w.seconds ?? null, rir: w.rir ?? null })),
        date: s.date, week: s.week,
        pain: rec.swap_reason === "hurts" ? true : undefined,
      });
    }
  }
  return out;
}

export function describeLast(perf, exerciseId) {
  if (!perf) return null;
  const ex = exercises[exerciseId];
  const nums = perf.sets.map((s) => (ex.kind === "hold" ? s.seconds ?? s.reps : s.reps)).join(", ");
  const unit = ex.kind === "hold" ? " s" : "";
  if (ex.step === "bodyweight") return `Last time: ${nums}${unit}`;
  return `Last time: ${perf.weight_kg} kg × ${nums}${unit}`;
}

// What to show for one exercise today.
// doc: the data document. ctx: { week, missed (result of missedRule), exerciseState (record or undefined) }
// Returns { weight_kg (or null when nothing is known), reps, range, note, last, lastText, action }
export function suggestFor(doc, exerciseId, ctx) {
  const ex = exercises[exerciseId];
  const settings = doc.shared_settings;
  const perfs = performances(doc.sessions, exerciseId);
  const last = perfs[0];
  const [low] = ex.range;
  const base = { range: ex.range, reps: low, last, lastText: describeLast(last, exerciseId) };
  const state = ctx.exerciseState;

  if (!last) {
    if (state && state.start_weight_kg) {
      return { ...base, weight_kg: state.start_weight_kg, action: "start", note: "Your starting weight from week 1." };
    }
    return { ...base, weight_kg: ex.step === "bodyweight" ? 0 : null, action: "unknown", note: ex.step === "bodyweight" ? "" : "Pick a light weight you can lift with good form." };
  }

  // The weight found in week 1 is the start of week 2 (plan v2 section 8): no progression on top of it.
  if (last.week === 1 && state && state.start_weight_kg) {
    let w = state.start_weight_kg;
    if (ctx.missed?.weightFactor < 1) w = weightAfterBreak(w, ctx.missed.weightFactor, exerciseId, settings);
    return { ...base, weight_kg: w, action: "start", note: "Your starting weight from week 1." };
  }

  const s = nextSuggestion(last, perfs[1], { exerciseId, week: ctx.week, settings });
  let weight = s.weight_kg;
  let note = s.note;
  let action = s.action;
  const missed = ctx.missed;
  if (missed && missed.weightFactor < 1) {
    weight = weightAfterBreak(last.weight_kg, missed.weightFactor, exerciseId, settings);
    note = missed.kind === "minus_20" ? "Back from a long break: about 20 % lower." : "Back from a break: about 10 % lower.";
    action = "break";
  } else if (missed && missed.noIncrease && s.weight_kg > last.weight_kg) {
    weight = last.weight_kg;
    note = "First workout back: same weight as last time, no increase.";
    action = "same_break";
  }
  const range = s.range ?? ex.range;
  return { ...base, weight_kg: weight, range, reps: range[0], action, note };
}

// A lighter weight for a swap after pain (plan v2 / WORKFLOW D5): about 30 % lower than the original's weight.
export function lighterFor(newExerciseId, originalWeight, settings) {
  const ex = exercises[newExerciseId];
  if (ex.step === "bodyweight" || !originalWeight) return 0;
  return lowerBy(originalWeight, 0.3, newExerciseId, settings);
}

// The smallest weight step for the + and - buttons.
export function weightStepFor(exerciseId, weight, settings) {
  const ex = exercises[exerciseId];
  if (ex.step === "bodyweight") return 0;
  return stepSize(weight || 0, exerciseId, settings) || 1;
}

// Plan-based text: "3 sets · 8 to 12 reps · stop with 2 left"
export function targetText(exerciseId, sets, rir) {
  const ex = exercises[exerciseId];
  const [lo, hi] = ex.range;
  const left = Array.isArray(rir) ? `${rir[0]} or ${rir[1]}` : String(rir);
  const range = lo === hi ? `${lo}` : `${lo} to ${hi}`;
  const unit = ex.kind === "hold" ? "seconds" : "reps";
  const side = ex.perSide ? " each side" : "";
  return `${sets} sets · ${range} ${unit}${side} · stop with ${left} left`;
}

// New best: more weight than ever before, or the same weight with more reps (holds: more seconds).
export function isNewBest(perfNow, earlier, kind) {
  if (!earlier.length) return false; // the first time is not a "best"
  const val = (p) => Math.max(...p.sets.map((s) => (kind === "hold" ? s.seconds ?? s.reps : s.reps)));
  if (kind === "hold") return val(perfNow) > Math.max(...earlier.map(val));
  const bestW = Math.max(...earlier.map((p) => p.weight_kg));
  if (perfNow.weight_kg > bestW) return true;
  if (perfNow.weight_kg < bestW) return false;
  return val(perfNow) > Math.max(...earlier.filter((p) => p.weight_kg === bestW).map(val));
}

// ---------- the walk ----------

// Settings for today's walk.
// doc: data document, week: block week, legDay: bool, missed: missedRule result.
// Returns { speed_kmh, slope_pct, minutes, buildUp, note }
export function walkSuggestion(doc, { week, legDay, missed, kind = "full" }) {
  const targets = doc.profile?.targets;
  const fit = doc.profile?.intake?.q36_walk_fit;
  const startBase = targets?.walk_start ?? { speed_kmh: walkRules.start.no.speed_kmh, slope_pct: walkRules.start.no.slope_pct };
  const startRow = fit ? startWalk(fit, false) : { minutes: walkRules.minutes, buildUp: walkRules.buildUp };

  // The walks done so far, with leg-day slopes brought back to the normal-day equivalent.
  const walks = finishedSessions(doc.sessions).filter((s) => s.walk && s.walk.effort != null).reverse()
    .map((s) => ({
      effort: s.walk.effort, breathless: !!s.walk.breathless,
      speed_kmh: s.walk.speed_kmh, slope_pct: s.walk.slope_pct + (s.walk.leg_day ? walkRules.legDaySlopeLess_pct : 0),
    }));
  let base = walks.length ? { speed_kmh: walks[walks.length - 1].speed_kmh, slope_pct: walks[walks.length - 1].slope_pct } : { ...startBase };
  // Only the walks at these exact settings count towards "two in a row".
  const sameTail = [];
  for (let i = walks.length - 1; i >= 0; i--) {
    if (walks[i].speed_kmh === base.speed_kmh && walks[i].slope_pct === base.slope_pct) sameTail.unshift(walks[i]); else break;
  }
  const next = nextWalkBase(base, sameTail, { allowProgress: weekInfo(week).walkProgress });
  base = { speed_kmh: next.speed_kmh, slope_pct: next.slope_pct };
  let note = {
    slope: "Two easy walks in a row: 1 % steeper today.",
    speed: "Two easy walks in a row: a bit faster today.",
    breathless: "You ended out of breath last time: 1 % less steep today.",
    same: walks.length ? "Same as last time." : "Starting settings.",
  }[next.reason];

  if (missed?.kind === "minus_10") { base = walkAfterBreak(base, startBase, "weeks_2_4"); note = "Back from a break: 2 % less steep this week."; }
  if (missed?.kind === "minus_20") { base = walkAfterBreak(base, startBase, "over_4_weeks"); note = "Back from a long break: starting settings again."; }

  const day = walkForDay(base, legDay);
  const minutes = kind === "short" ? 15 : (walks.length ? walkRules.minutes : startRow.minutes);
  const buildUpMinutes = kind === "short" ? 2 : 3;
  return { speed_kmh: day.speed_kmh, slope_pct: day.slope_pct, minutes, buildUpMinutes, buildUp: { ...walkRules.buildUp }, effortRange: day.effortRange, note };
}

export { planForDay, missedRule, stepDown };
