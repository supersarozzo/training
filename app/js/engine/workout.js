// Workout flow. Pure: no page, no storage, no network.
// - units and the set-by-set sequence of a day (pairs go A1, A2, A1, A2 ...; abs and D go one after the other)
// - where the workout stands now, worked out from the saved sets (so a reload always continues in the right place)
// - what to suggest for each exercise (last time, next weight)
// - walk suggestion
// Source: plan v2 sections 3 to 6, 8, 9, 11; WORKFLOW D.
import { exercises, MOVE_SECONDS, weekInfo, walkRules, BIG_LIFTS, firstTryKg } from "../plan/plan-v2.js";
import { nSets, repWord } from "../words.js";
import { exerciseMuscles } from "../plan/muscles.js";
import { localDate } from "../ids.js";
import { planForDay, missedRule, knownRecord } from "./schedule.js";
import { nextSuggestion, warmupSets, stepSize, weightAfterBreak, stepDown, lowerBy, firstTryWeight, gymFloor, lowerHitFloor, minWeight, FLOOR_NOTE } from "./progression.js";
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

// A reps range [low, high] set in the Plan, or null when it is missing or broken (whole numbers, 1 to 100, low <= high).
export function validRange(r) {
  return Array.isArray(r) && r.length === 2 && r.every((n) => Number.isInteger(n) && n >= 1 && n <= 100) && r[0] <= r[1] ? [r[0], r[1]] : null;
}

// The record of one slot inside a session (or undefined).
export function slotRecord(session, slot) {
  return session.exercises.find((e) => e.slot === slot);
}
// The current record of each slot, in order (the one slotRecord finds). A swap in the middle of an exercise keeps the
// old record, with its saved sets, behind the new one (model.swapExercise); screens that step through the exercises
// (week 1) use this list so they never go back to an exercise that was swapped away. Review 8.25 R1.
// 0.7.6: a place whose current exercise this app does not know (a workout from a newer app) is left out, as in
// planForSession; the record stays in the workout.
export function currentRecords(session) {
  const seen = new Set();
  return session.exercises.filter((e) => (seen.has(e.slot) ? false : (seen.add(e.slot), true)))
    .filter(knownRecord);
}
export const workSets = (rec) => (rec ? rec.sets.filter((s) => s.type === "work") : []);
export const warmupDone = (rec) => (rec ? rec.sets.filter((s) => s.type === "warmup").length : 0);

// Where the workout stands: the first set in the sequence that is not saved yet.
// Returns { index, entry } or null when every set is saved.
export function nextPosition(session, seq) {
  for (let i = 0; i < seq.length; i++) {
    const e = seq[i];
    const rec = slotRecord(session, e.slot);
    // "Stop this exercise here" (0.6.0): the sets after `stopped_after` are not asked any more.
    if (rec && Number.isInteger(rec.stopped_after) && rec.stopped_after >= 0 && e.setNumber > rec.stopped_after) continue;
    if (workSets(rec).length < e.setNumber) return { index: i, entry: e };
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

// How many warm-up sets this entry gets: 0, 1 (the light set, about 50 % x 10) or 2 (trainer L1, answer T2 to 8.39):
// only the first set of the first exercise of a pair (wantsWarmup); none when one of its main muscles was a main
// muscle of an earlier exercise that day (helpers do not count); else 2 for a big lift, 1 for a small exercise.
// Bodyweight and timed exercises: none. The day as it really is: `exOf(slot)` gives the exercise really done in a
// slot (a swap during the workout); by default the slot's own exercise (Plan edits are already in the slots).
export function warmupCount(entry, units, exOf = (slot) => slot.ex) {
  if (!wantsWarmup(entry, units)) return 0;
  const unit = units[entry.unitIndex];
  const exId = exOf(unit.slots[0]);
  const ex = exercises[exId];
  if (!ex || ex.step === "bodyweight" || ex.kind === "hold") return 0;
  const mainOf = (id) => exerciseMuscles[id]?.main ?? [];
  const earlier = new Set(units.slice(0, entry.unitIndex).flatMap((u) => u.slots.flatMap((s) => mainOf(exOf(s)))));
  if (mainOf(exId).some((g) => earlier.has(g))) return 0;
  return BIG_LIFTS.includes(exId) ? 2 : 1;
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
        date: s.date, week: s.week, finished_at: s.finished_at ?? null,
        pain: rec.swap_reason === "hurts" ? true : undefined,
        // "Stop this exercise here" (0.6.0): fewer sets than planned; the next suggestion holds the weight (audit M1).
        stopped: Number.isInteger(rec.stopped_after) && rec.stopped_after >= 0 ? true : undefined,
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

// Was the weight set in the Plan set after the last workout of this exercise? 0.7.1 (0.6.0 audit m4): with its time
// (my_weight_time) it must be later than the moment that workout finished, so a weight set in the morning of a
// workout no longer wins after it. The time counts only when it falls on the saved day (my_weight_at): an older app
// that changes the weight writes a new day but keeps the old time, and then the day decides, as before 0.7.1.
export function planWeightNewer(state, last) {
  if (typeof state.my_weight_at !== "string") return false;
  const t = typeof state.my_weight_time === "string" ? Date.parse(state.my_weight_time) : NaN;
  const end = Date.parse(last.finished_at ?? "");
  if (!Number.isNaN(t) && !Number.isNaN(end) && localDate(new Date(t)) === state.my_weight_at) return t > end;
  return state.my_weight_at >= last.date;
}

export const FIRST_TRY_NOTE = "First try. Set 1 tells us if it is right.";

// Trainer D18 (0.7.5): the exercise a new planned exercise replaced in its place. Its first weight comes from the old
// exercise's last logged weight x (new first try / old first try), rounded down to the gym (the D15 conversion WITHOUT
// the 30 % cut: nothing hurts). Only while the new exercise has no log of its own. The plank (from the dead bug) has no
// weight. The calf raise on the leg press (from the Smith standing calf raise) keeps its own history when it has one.
export const REPLACED_BY_D18 = Object.freeze({
  booty_builder_hip_thrust: "hip_thrust",
  weighted_crunch: "cable_crunch",
  calf_raise_leg_press: "calf_raise_standing",
});
// After a break (factor < 1) the old weight is lowered first by the break rule, then converted (trainer answer 1 a to
// 8.42: "Coming back after a break is when too heavy hurts most").
export function fromReplaced(doc, exerciseId, breakFactor = 1) {
  const oldId = REPLACED_BY_D18[exerciseId];
  const tableNew = firstTryKg[exerciseId];
  const tableOld = firstTryKg[oldId];
  if (!oldId || !(tableNew > 0) || !(tableOld > 0)) return null;
  const old = performances(doc.sessions, oldId)[0];
  if (!old || !(old.weight_kg > 0)) return null;
  const oldKg = breakFactor < 1 ? weightAfterBreak(old.weight_kg, breakFactor, oldId, doc.shared_settings) : old.weight_kg;
  return { weight_kg: gymFloor(oldKg * (tableNew / tableOld), exerciseId, doc.shared_settings), from: oldId };
}
// From week 2 the find-your-weight steps do not run, so the note says what to do instead (trainer D12 addition, dc59f13).
export const FIRST_TRY_NOTE_LATER = "First try. Set 1 too easy (4 or more reps left) or too hard? Change the weight one step for the next set.";

// What to show for one exercise today.
// doc: the data document. ctx: { week, missed (result of missedRule), exerciseState (record or undefined) }
// Returns { weight_kg (or null when nothing is known), reps, range, note, last, lastText, action }
export function suggestFor(doc, exerciseId, ctx) {
  const ex = exercises[exerciseId];
  const settings = doc.shared_settings;
  const perfs = performances(doc.sessions, exerciseId);
  const last = perfs[0];
  const state = ctx.exerciseState;
  // Reps and weight set in the Plan (0.6.0): my_range replaces the plan's reps; my_weight_kg is used until a workout
  // newer than the day it was set (my_weight_at) exists. They count on every day the exercise is in.
  const own = validRange(state?.my_range) ?? ex.range;
  const [low] = own;
  const base = { range: own, reps: low, last, lastText: describeLast(last, exerciseId) };
  const mine = state && typeof state.my_weight_kg === "number" && ex.step !== "bodyweight" && (!last || planWeightNewer(state, last));
  if (mine) return { ...base, weight_kg: state.my_weight_kg, action: "mine", note: "Your weight, set in the Plan." };

  if (!last) {
    if (state && state.start_weight_kg) {
      return { ...base, weight_kg: state.start_weight_kg, action: "start", note: "Your starting weight from week 1." };
    }
    if (ex.step === "bodyweight") return { ...base, weight_kg: 0, action: "unknown", note: "" };
    // Trainer D18 (0.7.5): a new exercise in the place of an old one starts from the old one's logged weight.
    const conv = fromReplaced(doc, exerciseId, ctx.missed?.weightFactor ?? 1);
    if (conv) {
      // Trainer answer 4 to 8.43 (71d3aa5): after a break, a converted start at the new move's floor is at the floor.
      if ((ctx.missed?.weightFactor ?? 1) < 1 && conv.weight_kg > 0 && conv.weight_kg <= minWeight(exerciseId, settings)) {
        return { ...base, weight_kg: conv.weight_kg, action: "first_try", from: conv.from, atFloor: true, note: FLOOR_NOTE };
      }
      const from = `From your ${exercises[conv.from].name.toLowerCase()} weight.`;
      return { ...base, weight_kg: conv.weight_kg, action: "first_try", from: conv.from, note: ctx.week > 1 ? `${from} ${FIRST_TRY_NOTE_LATER.replace(/^First try. /, "")}` : `${from} Set 1 tells us if it is right.` };
    }
    // Nothing known yet: the first-try weight (trainer D12, 0.7.1); the week-1 steps correct it from set 1.
    const first = firstTryWeight(exerciseId, settings, doc.profile);
    if (first > 0) return { ...base, weight_kg: first, action: "first_try", note: ctx.week > 1 ? FIRST_TRY_NOTE_LATER : FIRST_TRY_NOTE };
    return { ...base, weight_kg: null, action: "unknown", note: "Pick a light weight you can lift with good form." };
  }

  // The weight found in week 1 is the start of week 2 (plan v2 section 8): no progression on top of it. A weight found
  // on a practice day (week 0, trainer D11) is the start of week 1, which may adjust it once more.
  if (last.week <= 1 && state && state.start_weight_kg) {
    let w = state.start_weight_kg;
    if (ctx.missed?.weightFactor < 1) {
      w = weightAfterBreak(w, ctx.missed.weightFactor, exerciseId, settings);
      // Trainer D19: the break asked for less, but the weight is already the lightest step.
      if (lowerHitFloor(state.start_weight_kg, w, exerciseId)) return { ...base, weight_kg: w, action: "start", atFloor: true, note: FLOOR_NOTE };
    }
    return { ...base, weight_kg: w, action: "start", note: last.week === 0 ? "The weight you found in practice." : "Your starting weight from week 1." };
  }

  const s = nextSuggestion(last, perfs[1], { exerciseId, week: ctx.week, settings, planRange: own });
  let weight = s.weight_kg;
  let note = s.note;
  let action = s.action;
  let atFloor = s.atFloor === true;
  const missed = ctx.missed;
  if (missed && missed.weightFactor < 1) {
    weight = weightAfterBreak(last.weight_kg, missed.weightFactor, exerciseId, settings);
    action = "break";
    // Trainer D19: already at the lightest step, the weight holds and the effort is easier (stop with 3 reps left).
    atFloor = lowerHitFloor(last.weight_kg, weight, exerciseId);
    note = atFloor ? FLOOR_NOTE : missed.kind === "minus_20" ? "Back from a long break: about 20 % lower." : "Back from a break: about 10 % lower.";
  } else if (missed && missed.noIncrease && s.weight_kg > last.weight_kg) {
    weight = last.weight_kg;
    note = "First workout back: same weight as last time, no increase.";
    action = "same_break";
  }
  const range = s.range ?? own;
  return { ...base, weight_kg: weight, range, reps: range[0], action, note, atFloor };
}

// A lighter weight for a swap after pain (plan v2 / WORKFLOW D5): about 30 % lower than the original's weight.
export function lighterFor(newExerciseId, originalWeight, settings) {
  const ex = exercises[newExerciseId];
  if (ex.step === "bodyweight" || !originalWeight) return 0;
  return lowerBy(originalWeight, 0.3, newExerciseId, settings);
}

// The weight an "It hurts" swap starts at (0.7.1: checker round 2, auditor round 3, trainer D15). Lighter (or the lightest step the gym has), and
// never in the old exercise's units:
// - the new exercise has its own history: null (its own suggestion decides);
// - nothing logged (no set today, no log of the old exercise; a first-try number or a Plan weight of the old one are
//   not in the new exercise's units): about 30 % under the new exercise's own weight; when that rounds to 0, its own
//   weight (already its lightest step; D12: never 0);
// - a weight of the old exercise (a set today, else its log; the lower of the log and its next suggestion, so a
//   progression step never makes it heavier), trainer D15: old kg x (first-try table of the new / of the old) x 0.7,
//   rounded down to the gym, at least one step. Raw table values: the profile factor cancels out.
//   No table value (bodyweight or timed) or no weight: the rule since 0.5 (30 % under the old kg).
export function painSwapStart(newExerciseId, { origId, lastWorkKg, origSugg, newSugg }, settings) {
  if (newSugg?.last) return null;
  const nothingLogged = lastWorkKg == null && !origSugg?.last;
  if (nothingLogged) {
    const own = newSugg?.weight_kg ?? 0;
    const kg = lighterFor(newExerciseId, own, settings);
    return kg === 0 && own > 0 ? own : kg;
  }
  const logged = typeof origSugg?.last?.weight_kg === "number" && typeof origSugg.weight_kg === "number"
    ? Math.min(origSugg.last.weight_kg, origSugg.weight_kg) : origSugg?.last?.weight_kg ?? origSugg?.weight_kg;
  const oldKg = lastWorkKg ?? logged ?? 0;
  const tableOld = firstTryKg[origId];
  const tableNew = firstTryKg[newExerciseId];
  if (tableOld > 0 && tableNew > 0 && oldKg > 0) return gymFloor(oldKg * (tableNew / tableOld) * 0.7, newExerciseId, settings);
  return lighterFor(newExerciseId, oldKg, settings);
}

// The smallest weight step for the + and - buttons.
export function weightStepFor(exerciseId, weight, settings) {
  const ex = exercises[exerciseId];
  if (ex.step === "bodyweight") return 0;
  return stepSize(weight || 0, exerciseId, settings) || 1;
}

// Plan-based text: "3 sets · 8 to 12 reps · stop with 2 left"
export function targetText(exerciseId, sets, rir, myRange = null) {
  const ex = exercises[exerciseId];
  const [lo, hi] = validRange(myRange) ?? ex.range;
  const left = Array.isArray(rir) ? `${rir[0]} or ${rir[1]}` : String(rir);
  const range = lo === hi ? `${lo}` : `${lo} to ${hi}`;
  const unit = lo === hi ? (ex.kind === "hold" ? (lo === 1 ? "second" : "seconds") : repWord(lo)) : (ex.kind === "hold" ? "seconds" : "reps");
  const side = ex.perSide ? " each side" : "";
  return `${nSets(sets)} · ${range} ${unit}${side} · stop with ${left} left`;
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
// `edit` (0.7.4): the day's own walk from Plan > Edit ({ speed_kmh, slope_pct, minutes }, engine/planedits.js), or
// null. An edited day keeps its numbers in every week (the walk rule does not move them); only the break rules still
// lower them, and the short day still walks 15 minutes at most. Returns `edited: true` then.
export function walkSuggestion(doc, { week, legDay, missed, kind = "full", edit = null }) {
  if (edit) return editedWalk(doc, edit, { legDay, missed, kind });
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

  // Trainer decision D5: never suggest more than the plan's top, even after a faster or steeper walk was saved.
  base = { speed_kmh: Math.min(base.speed_kmh, walkRules.maxSpeed_kmh), slope_pct: Math.min(base.slope_pct, walkRules.maxSlope_pct) };
  const day = walkForDay(base, legDay);
  const minutes = kind === "short" ? 15 : (walks.length ? walkRules.minutes : startRow.minutes);
  const buildUpMinutes = kind === "short" ? 2 : 3;
  return { speed_kmh: day.speed_kmh, slope_pct: day.slope_pct, minutes, buildUpMinutes, buildUp: { ...walkRules.buildUp }, effortRange: day.effortRange, note };
}

// The day's own walk (Plan > Edit, 0.7.4, trainer decision D16). The numbers are the day's (a leg day's slope already
// lower). The break rule, number by number, for the break week only (D16 C): back from 2 to 4 weeks, the slope is 2 %
// lower (never below 0), speed and minutes as edited; back from more than 4 weeks, each of speed, slope and minutes is
// the lower of the edit and the starting settings (never raised). Short day: at most 15 minutes (D16 line 5).
export const OWN_WALK_LINE = "Your own walk. The walk rule does not change this day."; // D16 A: on screen on an edited day
function editedWalk(doc, edit, { legDay, missed, kind }) {
  const startBase = doc.profile?.targets?.walk_start ?? { speed_kmh: walkRules.start.no.speed_kmh, slope_pct: walkRules.start.no.slope_pct };
  const fit = doc.profile?.intake?.q36_walk_fit;
  const startMinutes = fit && walkRules.start[fit] ? startWalk(fit, false).minutes : walkRules.minutes;
  let speed_kmh = edit.speed_kmh;
  let slope_pct = edit.slope_pct;
  let editMinutes = edit.minutes;
  let note = OWN_WALK_LINE;
  if (missed?.kind === "minus_10") { slope_pct = Math.max(slope_pct - 2, 0); note = `Back from a break: 2 % less steep this week. ${OWN_WALK_LINE}`; }
  if (missed?.kind === "minus_20") {
    const start = walkForDay(startBase, legDay);
    speed_kmh = Math.min(speed_kmh, start.speed_kmh);
    slope_pct = Math.min(slope_pct, start.slope_pct);
    editMinutes = Math.min(editMinutes, startMinutes);
    note = `Back from a long break: starting settings where lower this week. ${OWN_WALK_LINE}`;
  }
  const minutes = kind === "short" ? Math.min(15, editMinutes) : editMinutes;
  const buildUpMinutes = kind === "short" ? 2 : 3;
  return { speed_kmh, slope_pct, minutes, buildUpMinutes, buildUp: { ...walkRules.buildUp }, effortRange: legDay ? walkRules.legDayEffort : walkRules.normalEffort, note, edited: true };
}

export { planForDay, missedRule, stepDown };
