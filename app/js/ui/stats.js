// Numbers for the logger screens: last time's sets, personal bests, small series for sparklines.
// Pure: data in, data out (no page, no storage), so node tests can check it. Reads finished workouts only.
import { exercises } from "../plan/plan-v2.js";
import { finishedSessions, workSets } from "../engine/workout.js";

const kindOf = (exId) => {
  const ex = exercises[exId];
  if (!ex) return "reps";
  return ex.kind === "hold" ? "hold" : ex.step === "bodyweight" ? "bw" : "weight";
};

// The working sets of the newest finished workout that has this exercise: [{ weight_kg, reps, seconds }].
// Every record of the exercise in that workout counts (a swap A -> B -> back to A gives two records; review R8).
export function previousSets(sessions, exId) {
  for (const s of finishedSessions(sessions)) {
    const all = s.exercises.filter((r) => r.done_exercise === exId).flatMap((r) => workSets(r));
    if (all.length) return all.map((x) => ({ weight_kg: x.weight_kg ?? 0, reps: x.reps ?? null, seconds: x.seconds ?? null }));
  }
  return [];
}

// The best ever, from finished workouts: { weight, repsAtWeight } for weights, { reps } or { seconds } otherwise.
// null when the exercise was never done (the first time is never a "best", as in engine/workout.js isNewBest).
export function bestBefore(sessions, exId) {
  const kind = kindOf(exId);
  let best = null;
  for (const s of finishedSessions(sessions)) {
    for (const rec of s.exercises) {
      if (rec.done_exercise !== exId) continue;
      for (const x of workSets(rec)) {
        if (kind === "hold") { const v = x.seconds ?? x.reps ?? 0; if (!best || v > best.seconds) best = { seconds: v }; }
        else if (kind === "bw") { const v = x.reps ?? 0; if (!best || v > best.reps) best = { reps: v }; }
        else {
          const w = x.weight_kg ?? 0, r = x.reps ?? 0;
          if (!best || w > best.weight || (w === best.weight && r > best.repsAtWeight)) best = { weight: w, repsAtWeight: r };
        }
      }
    }
  }
  return best;
}

// Does one set beat the best? Same rule as isNewBest: more weight, or the same weight with more reps.
export function beatsBest(exId, set, best) {
  if (!best) return false;
  const kind = kindOf(exId);
  if (kind === "hold") return (set.seconds ?? 0) > best.seconds;
  if (kind === "bw") return (set.reps ?? 0) > best.reps;
  const w = set.weight_kg ?? 0, r = set.reps ?? 0;
  return w > best.weight || (w === best.weight && r > best.repsAtWeight && w > 0);
}

// One value per finished workout, oldest first: heaviest working set (or best reps / seconds).
export function seriesFor(sessions, exId) {
  const kind = kindOf(exId);
  const out = [];
  for (const s of finishedSessions(sessions).slice().reverse()) {
    for (const rec of s.exercises) {
      if (rec.done_exercise !== exId) continue;
      const work = workSets(rec);
      if (!work.length) continue;
      const y = kind === "hold" ? Math.max(...work.map((x) => x.seconds ?? 0)) : kind === "bw" ? Math.max(...work.map((x) => x.reps ?? 0)) : Math.max(...work.map((x) => x.weight_kg ?? 0));
      out.push({ date: s.date, y });
    }
  }
  return out;
}

// Text for one set: "32.5 × 10", "40 s", "12".
export function setText(exId, set) {
  if (!set) return "–";
  const kind = kindOf(exId);
  if (kind === "hold") return `${set.seconds ?? set.reps ?? 0} s`;
  if (kind === "bw") return `${set.reps ?? 0}`;
  return `${fmtKg(set.weight_kg)} × ${set.reps ?? 0}`;
}

export function fmtKg(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "–";
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

// Weight × reps added up over a workout's working sets (bodyweight and holds count 0).
export function volumeOf(session) {
  let kg = 0;
  for (const rec of session.exercises) {
    if (kindOf(rec.done_exercise) !== "weight") continue;
    for (const x of workSets(rec)) kg += (x.weight_kg ?? 0) * (x.reps ?? 0);
  }
  return Math.round(kg);
}

// Monday to Sunday around `today` (all "yyyy-mm-dd"), with each day's state for the week strip.
// state: "done" (a finished workout), "today", "missed" (a past weekday with none), "rest" (weekend), "next".
export function weekDays(sessions, today) {
  const [y, m, d] = today.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  const dow = (t.getUTCDay() + 6) % 7; // 0 Monday
  const done = new Set(finishedSessions(sessions).map((s) => s.date));
  const out = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(t.getTime() + (i - dow) * 86400000);
    const iso = day.toISOString().slice(0, 10);
    let state = done.has(iso) ? "done" : iso === today ? "today" : i >= 5 ? "rest" : iso < today ? "missed" : "next";
    if (iso === today && done.has(iso)) state = "done today";
    out.push({ date: iso, letter: "MTWTFSS"[i], day: day.getUTCDate(), state });
  }
  return out;
}
