// Create, update and delete records. Screens never write storage directly: they call these.
// Every change stamps `updated_at` and is saved at once (docs/ARCHITECTURE.md section 6).
import { nowUtc, newId, exerciseStateId, gymSpotId, weighinId, localDate } from "./ids.js";
import { MACHINE_IDS } from "./plan/machine-ids.js";
import { hasData } from "./store.js";
import { validateDocument, clipText } from "./validate.js";
import { mergeDocs } from "./sync/merge.js";
import { PLAN_ID } from "./plan/plan-v2.js";
import { planForDay } from "./engine/schedule.js";
import { planDayId, isPlanDayId, checkSlots, checkPlanDay, findPlanDay, effectiveDay, planDaySlots, sameAsPlan, withSwap, withRemoved, withAdded } from "./engine/planedits.js";

const NEWER_DAY = "This day was changed on a newer app version. Update the app first.";
const MAX_CHANGES = 50; // the "what did I change" list of a plan day keeps the last 50 entries

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

  // The base slots an edit starts from: the usable edited day, else the plan's day. A record this app cannot use
  // (from a newer app) is never overwritten by an edit made here.
  function baseSlots(dayId) {
    if (!isPlanDayId(dayId)) throw new Error("Unknown day.");
    const rec = findPlanDay(store.load(), dayId);
    if (rec && rec.deleted !== true) {
      if (!checkPlanDay(rec, dayId).ok) throw new Error(NEWER_DAY);
      return JSON.parse(JSON.stringify(rec.slots));
    }
    return planDaySlots(dayId);
  }

  function writePlanDay(dayId, slots, change) {
    if (!isPlanDayId(dayId)) throw new Error("Unknown day.");
    const check = checkSlots(slots);
    if (!check.ok) throw new Error(check.reason);
    const clean = JSON.parse(JSON.stringify(slots));
    return update((doc, t) => {
      if (!Array.isArray(doc.plan_days)) doc.plan_days = [];
      const id = planDayId(dayId);
      const i = doc.plan_days.findIndex((r) => r && r.id === id);
      const old = i >= 0 ? doc.plan_days[i] : null;
      const live = old && old.deleted !== true ? old : null;
      if (live && !checkPlanDay(live, dayId).ok) throw new Error(NEWER_DAY);
      if (sameAsPlan(dayId, clean)) { // back to the plan's own day: no edit is left
        if (live) doc.plan_days[i] = { ...live, deleted: true, deleted_at: t, updated_at: t };
        return;
      }
      const changes = live && Array.isArray(live.changes) ? live.changes : [];
      const next = { ...(old ?? {}), id, updated_at: t, plan_id: PLAN_ID, day: dayId, slots: clean };
      delete next.deleted; delete next.deleted_at; delete next.changes;
      const list = change ? [...changes, { at: t, ...change }].slice(-MAX_CHANGES) : changes;
      if (list.length) next.changes = list;
      if (i >= 0) doc.plan_days[i] = next; else doc.plan_days.push(next);
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
    // Without `slots`, the day to train is read here: the saved Plan edit of that day when there is a usable one,
    // else the plan's day. Each record keeps the sets and rest of that week (planned_sets, planned_rest), so a Plan
    // edit or a plan change made later never changes this workout (engine/schedule.js planForSession).
    startSession({ planDay, week, kind, swappedFrom = null, slots, setsOverride = null }) {
      const clockNow = clock();
      const t = stamp();
      const daySlots = slots ?? planForDay(planDay, week, kind, findPlanDay(store.load(), planDay)).slots;
      const session = {
        id: newId("s", clockNow), updated_at: t, date: localDate(clockNow), plan_day: planDay, week, kind,
        swapped_from: swappedFrom, status: "in_progress", started_at: t, finished_at: null,
        walk: null,
        exercises: daySlots.map((s) => ({
          slot: s.slot, plan_exercise: s.ex, done_exercise: s.ex, swap_reason: null, sets: [], note: "",
          ...(Number.isInteger(s.sets) ? { planned_sets: s.sets } : {}),
          ...("rest" in s ? { planned_rest: s.rest ?? null } : {}),
        })),
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
        let rec = s.exercises.find((e) => e.slot === slot);
        if (!rec) throw new Error(`No exercise ${slot} in this workout`);
        // Sets already saved keep the exercise they were done on: the old record stays as it is,
        // and a new record for the same slot goes in front of it (slot lookups find the first one).
        if (rec.sets.length) {
          const fresh = { slot, plan_exercise: rec.plan_exercise, done_exercise: newExerciseId, swap_reason: null, sets: [], note: "" };
          if ("planned_sets" in rec) fresh.planned_sets = rec.planned_sets;
          if ("planned_rest" in rec) fresh.planned_rest = rec.planned_rest;
          s.exercises.splice(s.exercises.indexOf(rec), 0, fresh);
          rec = fresh;
        }
        rec.done_exercise = newExerciseId;
        rec.swap_reason = reason;
        if (note) rec.note = clipText(rec.note ? `${rec.note}
${note}` : note);
        rec.swap_weight_kg = startKg;
        rec.warmup_skipped = false;
      });
    },
    setWalk(sessionId, walk) {
      return editSession(sessionId, (s) => { s.walk = walk; });
    },
    finishSession(sessionId, { effort = null, note = "" } = {}) {
      return editSession(sessionId, (s, t) => { s.status = "finished"; s.finished_at = t; s.effort = effort; s.note = clipText(note); });
    },
    abandonSession(sessionId) {
      return editSession(sessionId, (s, t) => { s.status = "abandoned"; s.finished_at = t; });
    },
    // One weigh-in per day: saving again for the same day replaces it (and brings back a deleted one).
    setWeighin(date, kg) {
      return update((doc, t) => {
        const id = weighinId(date);
        const rec = { id, updated_at: t, date, kg };
        const i = doc.weighins.findIndex((x) => x.id === id);
        if (i >= 0) doc.weighins[i] = rec; else doc.weighins.push(rec);
      });
    },
    // A delete keeps a tombstone, so it reaches the other copy when sync arrives.
    deleteWeighin(date) {
      return update((doc, t) => {
        const i = doc.weighins.findIndex((x) => x.id === weighinId(date));
        if (i >= 0) doc.weighins[i] = { ...doc.weighins[i], deleted: true, deleted_at: t, updated_at: t };
      });
    },
    addMeasurement(date, values) {
      return update((doc, t) => {
        doc.measurements.push({ id: newId("m", clock()), updated_at: t, date, waist_cm: values.waist_cm ?? null, chest_cm: values.chest_cm ?? null, arm_cm: values.arm_cm ?? null, thigh_cm: values.thigh_cm ?? null });
      });
    },
    // Starting weight and machine note of one exercise (week 1, first visit).
    setExerciseState(exerciseId, patch) {
      return update((doc, t) => {
        const id = exerciseStateId(exerciseId);
        const i = doc.exercise_state.findIndex((x) => x.id === id);
        const base = i >= 0 ? doc.exercise_state[i] : { id, start_weight_kg: null, machine_note: "", fail_streak: 0 };
        const next = { ...base, ...patch, id, updated_at: t };
        if (typeof next.machine_note === "string") next.machine_note = clipText(next.machine_note);
        if (i >= 0) doc.exercise_state[i] = next; else doc.exercise_state.push(next);
      });
    },

    // "Where it is in my gym" for one machine (gym_spots, JUDGING.md 3.3). One record per machine: g-<machine>.
    // Only ids from the machine list are saved (any other id would make the file fail its own check).
    // Old data has no list yet: it is added here. Unknown fields of the old record are kept; a tombstone is cleared.
    // An empty note is kept as "" so the clear reaches the other copy.
    setGymSpot(machineId, where) {
      if (typeof machineId !== "string" || !/^[a-z0-9_]{1,50}$/.test(machineId) || !MACHINE_IDS.includes(machineId)) throw new Error("Unknown machine");
      return update((doc, t) => {
        if (!Array.isArray(doc.gym_spots)) doc.gym_spots = [];
        const id = gymSpotId(machineId);
        const i = doc.gym_spots.findIndex((x) => x.id === id);
        const next = { ...(i >= 0 ? doc.gym_spots[i] : {}), id, updated_at: t, machine: machineId, where: clipText(String(where ?? "").trim()) };
        delete next.deleted; delete next.deleted_at;
        if (i >= 0) doc.gym_spots[i] = next; else doc.gym_spots.push(next);
      });
    },

    // ---------- saved Plan edits (plan_days, engine/planedits.js; answers 65, 72 a, 73 a) ----------
    // One record per edited day, id p-plan-v2-<day>, holding the whole day. Edits apply to workouts started later.
    // Every call checks the day first and throws a plain message when the edit is not allowed (nothing is saved).

    // The day to train: { dayId, slots (base sets, before the week rule), edited, newerVersion, record }.
    effectivePlanDay(dayId) {
      if (!isPlanDayId(dayId)) throw new Error("Unknown day.");
      const record = findPlanDay(store.load(), dayId);
      return { ...effectiveDay(dayId, record), record };
    },

    // Save a whole edited day. `slots` are base slots ({ slot, ex, sets, rest }, the sets before the week rule, as
    // effectivePlanDay gives them), never the week's sets from planForDay. Used for Undo. `change` (optional):
    // { what, slot, from, to } for the "what did I change" list. Slots equal to the plan's own day leave no edit.
    savePlanDay(dayId, slots, change = null) {
      return writePlanDay(dayId, slots, change);
    },
    swapPlanSlot(dayId, slot, exId) {
      const base = baseSlots(dayId);
      const from = base.find((s) => s.slot === slot)?.ex ?? null;
      return writePlanDay(dayId, withSwap(base, slot, exId), { what: "swap", slot, from, to: exId });
    },
    removePlanSlot(dayId, slot) {
      const base = baseSlots(dayId);
      const from = base.find((s) => s.slot === slot)?.ex ?? null;
      return writePlanDay(dayId, withRemoved(base, slot), { what: "remove", slot, from });
    },
    // Add an exercise at the end of the day (E1, then E2): on its own, 3 sets, 60 s rest, at most 2 a day.
    addPlanSlot(dayId, exId) {
      const next = withAdded(baseSlots(dayId), exId);
      return writePlanDay(dayId, next, { what: "add", slot: next[next.length - 1].slot, to: exId });
    },
    // "Back to the plan's day": a tombstone that keeps the record's fields (so a newer app's edit is not lost).
    resetPlanDay(dayId) {
      if (!isPlanDayId(dayId)) throw new Error("Unknown day.");
      return update((doc, t) => {
        const i = Array.isArray(doc.plan_days) ? doc.plan_days.findIndex((r) => r && r.id === planDayId(dayId)) : -1;
        if (i >= 0 && doc.plan_days[i].deleted !== true) doc.plan_days[i] = { ...doc.plan_days[i], deleted: true, deleted_at: t, updated_at: t };
      });
    },

    // A profile needs a block (Today reads its start). A file from GitHub can bring a profile without one (review F4).
    ensureBlock() {
      const doc = store.load();
      if (doc.block || !doc.profile) return doc;
      return update((d, t) => ensureBlock(d, t, clock()));
    },

    // Restore from a backup file or from GitHub. The file is checked first (it is untrusted data).
    // An empty phone takes the file as it is. A phone with data MERGES the file in with the sync rules:
    // nothing on the phone is dropped, and a safety copy is kept first (ARCHITECTURE section 10).
    restore(rawDoc) {
      const checked = validateDocument(rawDoc);
      if (!checked.ok) return { ok: false, error: checked.error };
      let current;
      try { current = store.load(); } catch (e) { return { ok: false, error: e && e.message ? e.message : "The data on this phone could not be read. Nothing was changed." }; }
      const merging = hasData(current);
      const doc = merging ? mergeDocs(current, checked.doc) : checked.doc;
      const t = stamp();
      try {
        store.savePrev();
        ensureBlock(doc, t, clock());
        store.save(doc);
      } catch (e) { return { ok: false, error: e && e.message ? e.message : "Could not save. Nothing was changed." }; }
      return { ok: true, doc, merged: merging };
    },
  };
}

function ensureBlock(doc, t, now) {
  if (!doc.block && doc.profile) {
    doc.block = { updated_at: t, plan_id: "plan-v2", number: 1, start_monday: nextMonday(now) };
  }
}
