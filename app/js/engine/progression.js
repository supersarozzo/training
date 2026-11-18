// Progression: double progression (plan v2 section 9), warm-up sets, easier-week and effort rules (sections 5, 10).
// Pure. Suggestions only: Rosario can always change the weight.
import { exercises, weekInfo, firstTryKg } from "../plan/plan-v2.js";

const round1 = (n) => Math.round(n * 10) / 10;

export const FALLBACK_STACK_STEP_KG = 5; // used until the first visit check fills in the real step
export const FALLBACK_DUMBBELL_STEP_KG = 2;
export const SMITH_STEP_KG = 5; // 2.5 kg on each side
export const BIG_JUMP = 0.1; // a step of more than about 10 % of the weight is a big jump

// ---------- weights and steps ----------
// settings = shared_settings: { dumbbell_steps_kg: [...], stack_step_kg: { default, [exerciseId]: kg } }

function dumbbells(settings) {
  const list = (settings?.dumbbell_steps_kg ?? []).filter((x) => x > 0).sort((a, b) => a - b);
  return list;
}

export function stackStep(exerciseId, settings) {
  const s = settings?.stack_step_kg ?? {};
  return s[exerciseId] || s.default || FALLBACK_STACK_STEP_KG;
}

// The weight one step up from `w`.
export function stepUp(w, exerciseId, settings, n = 1) {
  const ex = exercises[exerciseId];
  let cur = w;
  for (let i = 0; i < n; i++) {
    if (ex.step === "dumbbell") {
      const list = dumbbells(settings);
      const next = list.find((x) => x > cur + 1e-9);
      cur = next ?? cur + (list.length ? list[list.length - 1] - (list[list.length - 2] ?? 0) : FALLBACK_DUMBBELL_STEP_KG);
    } else if (ex.step === "smith_2x2.5") cur += SMITH_STEP_KG;
    else if (ex.step === "stack") cur += stackStep(exerciseId, settings);
  }
  return round1(cur);
}

// The weight one step down from `w` (never below 0).
export function stepDown(w, exerciseId, settings, n = 1) {
  const ex = exercises[exerciseId];
  let cur = w;
  for (let i = 0; i < n; i++) {
    if (ex.step === "dumbbell") {
      const list = dumbbells(settings);
      const lower = [...list].reverse().find((x) => x < cur - 1e-9);
      cur = lower ?? Math.max(cur - FALLBACK_DUMBBELL_STEP_KG, 0);
    } else if (ex.step === "smith_2x2.5") cur -= SMITH_STEP_KG;
    else if (ex.step === "stack") cur -= stackStep(exerciseId, settings);
  }
  return round1(Math.max(cur, 0));
}

// The size of the next step up from `w` in kg (for the big-jump rule).
export function stepSize(w, exerciseId, settings) {
  return round1(stepUp(w, exerciseId, settings) - w);
}

// The first-try weight (trainer D12, 0.7.1). profile: doc.profile (only intake.q22_sex is read, never a body number).
// A profile that is not "male" (or none) gets 0.6 x the table. Always rounded DOWN to what the gym has, never 0:
// dumbbells: the heaviest listed at or below the value, else the lightest listed, else a multiple of 2 kg (at least 2);
// stacks: a multiple of the stack step (at least one step); Smith and hip thrust: a multiple of 5 kg (at least 5).
// 0 for bodyweight and timed exercises (0 means "let the app choose").
export function firstTryWeight(exerciseId, settings, profile) {
  const ex = exercises[exerciseId];
  const table = firstTryKg[exerciseId];
  if (!ex || ex.step === "bodyweight" || ex.kind === "hold" || !table) return 0;
  const value = profile?.intake?.q22_sex === "male" ? table : table * 0.6;
  let out;
  if (ex.step === "dumbbell") {
    const list = dumbbells(settings);
    const fit = [...list].reverse().find((x) => x <= value + 1e-9);
    out = fit ?? list[0] ?? Math.max(FALLBACK_DUMBBELL_STEP_KG, Math.floor(value / FALLBACK_DUMBBELL_STEP_KG + 1e-9) * FALLBACK_DUMBBELL_STEP_KG);
  } else {
    const step = ex.step === "smith_2x2.5" ? SMITH_STEP_KG : stackStep(exerciseId, settings);
    out = Math.max(step, Math.floor(value / step + 1e-9) * step);
  }
  return round1(out);
}

// Lower a weight by about `fraction` (0.1 = 10 %) and round DOWN to a size the gym has.
// Always at least one step lower than `w`.
export function lowerBy(w, fraction, exerciseId, settings) {
  const ex = exercises[exerciseId];
  const target = w * (1 - fraction);
  let out;
  if (ex.step === "dumbbell") {
    const list = dumbbells(settings);
    const fit = [...list].reverse().find((x) => x <= target + 1e-9);
    out = fit ?? (list[0] ?? Math.floor(target / FALLBACK_DUMBBELL_STEP_KG) * FALLBACK_DUMBBELL_STEP_KG);
  } else if (ex.step === "bodyweight") {
    out = 0;
  } else {
    const step = ex.step === "smith_2x2.5" ? SMITH_STEP_KG : stackStep(exerciseId, settings);
    out = Math.floor(target / step + 1e-9) * step;
  }
  if (out >= w) out = stepDown(w, exerciseId, settings);
  return round1(Math.max(out, 0));
}

// Warm-up sets before the first exercise of a pair: about 50 % x 10 and about 75 % x 5 (plan v2 section 5),
// rounded to sizes the gym has, never above the working weight, never repeating a weight.
// `count` (trainer L1, answer T2; engine/workout.js warmupCount): 2 = both sets, 1 = only the light set, 0 = none.
export function warmupSets(workWeight, exerciseId, settings, count = 2) {
  const ex = exercises[exerciseId];
  if (ex.step === "bodyweight" || workWeight <= 0) return [];
  const round = (target) => {
    if (ex.step === "dumbbell") {
      const list = dumbbells(settings);
      if (list.length) return list.reduce((best, x) => (Math.abs(x - target) < Math.abs(best - target) ? x : best), list[0]);
      return Math.max(Math.round(target / FALLBACK_DUMBBELL_STEP_KG) * FALLBACK_DUMBBELL_STEP_KG, FALLBACK_DUMBBELL_STEP_KG);
    }
    const step = ex.step === "smith_2x2.5" ? SMITH_STEP_KG : stackStep(exerciseId, settings);
    return Math.max(Math.round(target / step) * step, step);
  };
  const first = round(workWeight * 0.5);
  const second = round(workWeight * 0.75);
  const sets = [];
  if (count >= 1 && first < workWeight) sets.push({ weight_kg: round1(first), reps: 10 });
  if (count >= 2 && second < workWeight && second > first) sets.push({ weight_kg: round1(second), reps: 5 });
  return sets;
}

// ---------- the double progression rule (plan v2 section 9) ----------
// last / previous: a finished session of this exercise:
//   { weight_kg, sets: [{ reps (or seconds for holds), rir }], pain?: boolean, formBroke?: boolean }
//   "rir" is the "how many more could you do?" tap: 0, 1, 2, 3, 4 (4 means 4 or more).
// opts: { exerciseId, week, settings, range?, planRange? } `range` overrides the plan range (raised for bodyweight work);
// `planRange` is the reps range set in the Plan (exercise_state my_range, 0.6.0), used in place of the plan's own.
// Returns { action, weight_kg, range, note, noIncrease? } where action is one of
//   "increase", "increase2", "same_add_rep", "same_check", "extra_reps", "lower", "lower10", "hold".
export function nextSuggestion(last, previous, opts) {
  const { exerciseId, week, settings } = opts;
  const ex = exercises[exerciseId];
  const own = opts.planRange ?? ex.range;
  const [low, top] = opts.range ?? own;
  const w = last.weight_kg;
  const unit = ex.kind === "hold" ? "seconds" : "reps";
  const done = last.sets.map((s) => (ex.kind === "hold" ? s.seconds ?? s.reps : s.reps));
  const base = { weight_kg: w, range: [low, top] };

  // Pain or form broke down: lower the weight. No increase until the form is good.
  if (last.pain || last.formBroke) {
    return { ...base, action: "lower", weight_kg: stepDown(w, exerciseId, settings), noIncrease: true,
      note: "Lower the weight. No increase until the form is good." };
  }

  // A set 3 or more below the range, two sessions in a row: lower about 10 % and restart at the bottom.
  const farBelow = (session) => session && session.sets.some((s) => (ex.kind === "hold" ? s.seconds ?? s.reps : s.reps) <= low - 3);
  if (farBelow(last) && farBelow(previous)) {
    return { ...base, action: "lower10", weight_kg: lowerBy(w, 0.1, exerciseId, settings),
      note: `Two hard sessions in a row. Lower the weight about 10 % and restart at ${low} ${unit}.` };
  }

  // Easier weeks and week 1: no progression, same weights.
  if (!weekInfo(week).progression) {
    return { ...base, action: "hold", note: "No increase this week. Same weight." };
  }

  // Stopped early twice in a row, with a set below the range both times (trainer D10 rule 2, answer T1 to 8.39):
  // one smallest step lighter, back to the bottom. Only in weeks with progress (it sits after the hold above).
  // Bodyweight and timed exercises never go lighter. Pain has its own path (Swap › It hurts), above.
  const belowLow = (session) => session.sets.some((s) => (ex.kind === "hold" ? s.seconds ?? s.reps : s.reps) < low);
  if (last.stopped && previous?.stopped && ex.step !== "bodyweight" && belowLow(last) && belowLow(previous)) {
    return { ...base, action: "lower", weight_kg: stepDown(w, exerciseId, settings),
      note: "You stopped early twice and missed the range. One step lighter." };
  }

  // Stopped early last time ("Stop this exercise here", 0.6.0): fewer sets than planned never count as a full
  // workout at the top, so the weight stays (audit M1; trainer D10: same weight, aim to finish every set).
  if (last.stopped) {
    return { ...base, action: "hold", note: "You stopped this exercise early last time. Same weight." };
  }

  const allTop = done.every((r) => r >= top);
  const minLeft = Math.min(...last.sets.map((s) => s.rir ?? 0));
  const allFour = last.sets.every((s) => (s.rir ?? 0) >= 4);

  // Bodyweight and timed abs: when all sets reach the top, add 2 reps or 5 seconds.
  if (ex.step === "bodyweight") {
    if (allTop && minLeft >= 1) {
      const add = ex.kind === "hold" ? 5 : 2;
      return { ...base, action: "increase", range: [low, top + add], note: `Aim for ${top + add} ${unit} per set.` };
    }
    return nonIncrease(base, done, low, top, unit);
  }

  if (allTop && minLeft >= 1) {
    const planTop = own[1];
    const steps = allFour && week >= 2 && week <= 4 ? 2 : 1;
    const next = stepUp(w, exerciseId, settings, steps);
    // Big jump (one step is more than about 10 % heavier): first reach 2 reps above the plan's range
    // at the old weight, then move up.
    if ((stepUp(w, exerciseId, settings) - w) / w > BIG_JUMP + 1e-9) {
      if (done.every((r) => r >= planTop + 2)) {
        return { ...base, action: steps === 2 ? "increase2" : "increase", weight_kg: next, range: [low, planTop],
          note: `Move up to ${next} kg. Back to ${low} ${unit}.` };
      }
      return { ...base, action: "extra_reps", range: [low, planTop + 2],
        note: `The next step is a big jump. First reach ${planTop + 2} ${unit} at ${w} kg, then move up.` };
    }
    return { ...base, action: steps === 2 ? "increase2" : "increase", weight_kg: next, range: [low, planTop],
      note: `Add ${steps === 2 ? "2 steps" : "the smallest step"}: ${next} kg. Back to ${low} ${unit}.` };
  }
  return nonIncrease(base, done, low, top, unit);
}

function nonIncrease(base, done, low, top, unit) {
  if (done.every((r) => r >= top)) {
    // At the top, but with no reps left: not ready to add weight yet.
    return { ...base, action: "same_top", note: "Same weight. Reach the top again with 1 or more reps left." };
  }
  const below = done.some((r) => r < low);
  if (below) {
    return { ...base, action: "same_check", note: "Same weight. Check rest and form." };
  }
  return { ...base, action: "same_add_rep", note: `Same weight. Aim for 1 more ${unit === "seconds" ? "second" : "rep"} per set.` };
}

// ---------- effort, rhythm and breaks ----------

// Auto-deload (plan v2 section 10): bring the easier week forward if 3 or more exercises needed a 10 % drop
// within 2 weeks, or the whole session felt 9 or 10 out of 10 for a whole week.
export function shouldBringDeloadForward({ tenPercentDrops = 0, sessionEfforts = [] }) {
  if (tenPercentDrops >= 3) return true;
  return sessionEfforts.length > 0 && sessionEfforts.every((e) => e >= 9);
}

// Sleep (plan v2 section 10): under 6 hours on most nights in a week keeps the effort one step easier (RIR 3).
export function effortWithSleep(rir, shortSleep) {
  if (!shortSleep) return rir;
  const worst = Array.isArray(rir) ? Math.min(...rir) : rir;
  return worst < 3 ? 3 : rir;
}

// Weights after a break (plan v2 section 11): factor 0.9 or 0.8, rounded down to sizes the gym has.
export function weightAfterBreak(w, factor, exerciseId, settings) {
  if (factor >= 1) return w;
  return lowerBy(w, 1 - factor, exerciseId, settings);
}
