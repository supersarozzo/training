// Create, update and delete records. Screens never write storage directly: they call these.
// Every change stamps `updated_at` and is saved at once (docs/ARCHITECTURE.md section 6).
import { nowUtc, newId, exerciseStateId, localDate } from "./ids.js";
import { hasData } from "./store.js";
import { validateDocument } from "./validate.js";

// Monday of the current week (local), or the next Monday. Used for a new block's start.
// If today is Monday, the block starts today. Otherwise the next Monday.
export function nextMonday(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 Sunday ... 6 Saturday
  const add = day === 1 ? 0 : (8 - day) % 7;
  d.setDate(d.getDate() + add);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function createModel(store, clock = () => new Date()) {
  const stamp = () => nowUtc(clock());

  // Load, change, save at once. `fn` returns nothing; it edits the document it gets.
  function update(fn) {
    const doc = store.load();
    fn(doc, stamp());
    store.save(doc);
    return doc;
  }

  function editSession(id, fn) {
    return update((doc, t) => {
      const s = doc.sessions.find((x) => x.id === id && !x.deleted);
      if (!s) throw new Error("That workout was not found");
      fn(s, t);
      s.updated_at = t;
    });
  }

  return {
    doc: () => store.load(),

    // Intake answers are stored as given. Targets start empty until Rosario confirms them.
    setProfile(intake) {
      return update((doc, t) => {
        doc.profile = { updated_at: t, intake, targets: doc.profile?.targets ?? null };
        ensureBlock(doc, t, clock());
      });
    },

    setTargets(targets) {
      return update((doc, t) => {
        if (!doc.profile) throw new Error("No profile yet");
        doc.profile = { ...doc.profile, updated_at: t, targets };
      });
    },

    updateSettings(patch) {
      return update((doc, t) => { doc.shared_settings = { ...doc.shared_settings, ...patch, updated_at: t }; });
    },

    setBlockStart(start_monday) {
      return update((doc, t) => {
        doc.block = { ...(doc.block ?? { plan_id: "plan-v2", number: 1 }), start_monday, updated_at: t };
      });
    },

    // ---------- workouts (docs/ARCHITECTURE.md section 4.2). Every call saves at once. ----------

    // A new workout. `slots` are the slots of the day (from planForDay); one record per slot is made now.
    startSession({ planDay, week, kind, swappedFrom = null, slots, setsOverride = null }) {
      const clockNow = clock();
      const t = stamp();
      const session = {
        id: newId("s", clockNow), updated_at: t, date: localDate(clockNow), plan_day: planDay, week, kind,
        swapped_from: swappedFrom, status: "in_progress", started_at: t, finished_at: null,
        walk: null,
        exercises: slots.map((s) => ({ slot: s.slot, plan_exercise: s.ex, done_exercise: s.ex, swap_reason: null, sets: [], note: "" })),
        effort: null, note: "",
      };
      if (setsOverride) session.sets_override = setsOverride;
      update((doc) => { doc.sessions.push(session); });
      return session;
    },

    // Save one set the moment Done is tapped. n counts sets of the same type for that exercise.
    logSet(sessionId, slot, set) {
      return editSession(sessionId, (s, t) => {
        const rec = s.exercises.find((e) => e.slot === slot);
        if (!rec) throw new Error(`No exercise ${slot} in this workout`);
        const n = rec.sets.filter((x) => x.type === set.type).length + 1;
        rec.sets.push({ n, type: set.type, weight_kg: set.weight_kg ?? 0, reps: set.reps ?? null, seconds: set.seconds ?? null, rir: null, done_at: t });
      });
    },
    // "How many more could you do?" for the set just saved.
    setLastRir(sessionId, slot, rir, left = undefined) {
      return editSession(sessionId, (s) => {
        const rec = s.exercises.find((e) => e.slot === slot);
        const last = rec && [...rec.sets].reverse().find((x) => x.type === "work");
        if (last) { last.rir = rir; if (left !== undefined) last.left = left; }
      });
    },
    // Small flags on one exercise of a workout (week 1 steps: learned, saved).
    flagExercise(sessionId, slot, patch) {
      return editSession(sessionId, (s) => {
        const rec = s.exercises.find((e) => e.slot === slot);
        if (rec) Object.assign(rec, patch);
      });
    },
    undoLastSet(sessionId, slot) {
      return editSession(sessionId, (s) => {
        const rec = s.exercises.find((e) => e.slot === slot);
        if (rec) rec.sets.pop();
      });
    },
    skipWarmup(sessionId, slot) {
      return editSession(sessionId, (s) => {
        const rec = s.exercises.find((e) => e.slot === slot);
        if (rec) rec.warmup_skipped = true;
      });
    },
    swapExercise(sessionId, slot, newExerciseId, reason, note = "", startKg = null) {
      return editSession(sessionId, (s) => {
        const rec = s.exercises.find((e) => e.slot === slot);
        if (!rec) throw new Error(`No exercise ${slot} in this workout`);
        rec.done_exercise = newExerciseId;
        rec.swap_reason = reason;
        if (note) rec.note = rec.note ? `${rec.note}
${note}` : note;
        rec.swap_weight_kg = startKg;
        rec.warmup_skipped = false;
      });
    },
    setWalk(sessionId, walk) {
      return editSession(sessionId, (s) => { s.walk = walk; });
    },
    finishSession(sessionId, { effort = null, note = "" } = {}) {
      return editSession(sessionId, (s, t) => { s.status = "finished"; s.finished_at = t; s.effort = effort; s.note = note; });
    },
    abandonSession(sessionId) {
      return editSession(sessionId, (s, t) => { s.status = "abandoned"; s.finished_at = t; });
    },
    // Starting weight and machine note of one exercise (week 1, first visit).
    setExerciseState(exerciseId, patch) {
      return update((doc, t) => {
        const id = exerciseStateId(exerciseId);
        const i = doc.exercise_state.findIndex((x) => x.id === id);
        const base = i >= 0 ? doc.exercise_state[i] : { id, start_weight_kg: null, machine_note: "", fail_streak: 0 };
        const next = { ...base, ...patch, id, updated_at: t };
        if (i >= 0) doc.exercise_state[i] = next; else doc.exercise_state.push(next);
      });
    },

    // Restore from a backup file into an EMPTY phone. If the phone has data, refuse for now:
    // the merge-restore comes with the sync work (build steps 9 and 10).
    restoreIntoEmpty(rawDoc) {
      const current = store.load();
      if (hasData(current)) {
        return { ok: false, error: "This phone already has data. Restoring over existing data is not ready yet (it comes after sync is set up). Nothing was changed." };
      }
      const checked = validateDocument(rawDoc);
      if (!checked.ok) return { ok: false, error: checked.error };
      const doc = checked.doc;
      const t = stamp();
      store.savePrev();
      ensureBlock(doc, t, clock());
      store.save(doc);
      return { ok: true, doc };
    },
  };
}

function ensureBlock(doc, t, now) {
  if (!doc.block && doc.profile) {
    doc.block = { updated_at: t, plan_id: "plan-v2", number: 1, start_monday: nextMonday(now) };
  }
}
