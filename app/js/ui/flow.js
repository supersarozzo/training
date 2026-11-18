// Shared parts of the workout screens: the context of one render, phase changes, starting and leaving a workout.
import { model, go, rerender } from "./app.js";
import { getActive, setActive, patchActive, clearActive } from "../active.js";
import { exercises, days } from "../plan/plan-v2.js";
import { planForSession, missedRule, canStartWorkout, blockPosition, sessionLayout } from "../engine/schedule.js";
import { buildSequence, nextPosition, walkSuggestion, finishedSessions, suggestFor, slotRecord, workSets } from "../engine/workout.js";
import { startTimer } from "../timer.js";
import { today } from "../clock.js";
import { keepScreenOn, releaseScreen } from "../wakelock.js";
import { prime } from "../sound.js";
import { openSheet, closeSheets } from "./parts.js";
import { h } from "../h.js";

// Everything a workout screen needs, built fresh on every draw from the saved data.
// The workout is rebuilt from its own records (planForSession), never from today's plan: a Plan edit or a plan change
// made after it started (or an app update in the middle of it) never changes it.
export function buildCtx(doc, session, act) {
  const plan = planForSession(session);
  const { units, seq } = buildSequence(plan.slots, { setsOverride: session.sets_override ?? null });
  const lastFinished = finishedSessions(doc.sessions).find((s) => s.date < session.date);
  const missed = missedRule(lastFinished ? lastFinished.date : null, session.date);
  const legDay = days[session.plan_day].leg;
  const memo = new Map();
  const ctx = {
    doc, session, act, plan, units, seq, missed, legDay, week: session.week, settings: doc.shared_settings,
    state: (exId) => doc.exercise_state.find((x) => x.id === `x-${exId}` && !x.deleted),
    sugg(exId) {
      if (!memo.has(exId)) memo.set(exId, suggestFor({ ...doc, sessions: doc.sessions }, exId, { week: session.week, missed, exerciseState: ctx.state(exId) }));
      return memo.get(exId);
    },
    walk: walkSuggestion(doc, { week: session.week, legDay, missed, kind: session.kind }),
    position: () => nextPosition(session, seq),
  };
  return ctx;
}

// ---------- the sets still planned after "Stop this exercise here" (auditor M2) ----------
// A set past its exercise's `stopped_after` is not asked any more (nextPosition skips it). These helpers make the
// rest, the "Next" line and the progress bar skip it too.
const skipped = (session, e) => {
  const rec = slotRecord(session, e.slot);
  return Boolean(rec && Number.isInteger(rec.stopped_after) && e.setNumber > rec.stopped_after);
};
const saved = (session, e) => workSets(slotRecord(session, e.slot)).length >= e.setNumber;

// The first set after `index` that is still to do: { index, entry }, or null when nothing is left (Finish next).
export function nextDue(session, seq, index) {
  for (let i = index + 1; i < seq.length; i++) if (!skipped(session, seq[i]) && !saved(session, seq[i])) return { index: i, entry: seq[i] };
  return null;
}

// The rest between the set at `from` and the next set to do at `to`: the longest planned rest on the way, so a
// stopped partner gives the pair rest, not the 30 s move. { seconds, kind }; seconds 0 when none is planned.
export function restBetween(seq, from, to) {
  let best = { seconds: 0, kind: null };
  for (let i = from; i < to; i++) if ((seq[i].restAfter ?? 0) > best.seconds) best = { seconds: seq[i].restAfter, kind: seq[i].restKind };
  return best;
}

// The progress bar: sets saved and sets planned, leaving out the stopped ones, so it fills after a stop.
export function progressOf(session, seq) {
  const planned = seq.filter((e) => !skipped(session, e));
  return { done: planned.filter((e) => saved(session, e)).length, total: planned.length };
}

// Change the screen of the workout. `seconds` starts a timer for the new screen.
export function setPhase(phase, seconds = null) {
  const now = Date.now();
  patchActive({ phase, timer_end: seconds ? startTimer(seconds, now) : null, timer_total: seconds ? seconds * 1000 : null, rest: null, hold: null });
  rerender();
}

// Text for the "Next:" line: "A2 Pulldown · 30 kg × 10".
export function nextText(ctx, entry) {
  if (!entry) return null;
  const rec = slotRecord(ctx.session, entry.slot);
  const exId = rec.done_exercise;
  const ex = exercises[exId];
  const sg = ctx.sugg(exId);
  const w = rec.swap_reason === "hurts" && rec.swap_weight_kg != null ? rec.swap_weight_kg : sg.weight_kg;
  let detail = "";
  if (ex.kind === "hold") detail = ` · ${sg.range[0]} s`;
  else if (ex.step === "bodyweight") detail = ` · ${sg.reps} reps`;
  else if (w) detail = ` · ${w} kg × ${sg.reps}`;
  return `${entry.slot} ${ex.name}${detail}`;
}

// Start a workout today. Returns { ok: false, reason } if it should not start.
export function startWorkout({ kind = "full", planDay, swappedFrom = null }) {
  const doc = model.doc();
  const t = today();
  const check = canStartWorkout(doc.sessions, t);
  if (!check.ok) return check;
  const pos = blockPosition(doc.block.start_monday, t);
  if (pos.state !== "running") return { ok: false, reason: "The plan is not running today." };
  const lastFinished = finishedSessions(doc.sessions).find((s) => s.date < t);
  const missed = missedRule(lastFinished ? lastFinished.date : null, t);
  // No slots passed: the model reads the day to train (the saved Plan edit of that day, else the plan's day).
  const session = model.startSession({ planDay, week: pos.week, kind, swappedFrom, setsOverride: missed.setsOverride });
  prime();
  keepScreenOn();
  setActive({ session_id: session.id, phase: "walk", timer_end: null, timer_total: null, rest: null, hold: null });
  go("#/workout");
  return { ok: true };
}

// The workout is over (saved or thrown away): let the screen sleep again.
export function leaveWorkout() {
  clearActive();
  releaseScreen();
  closeSheets();
}

// "End" at the top: keep going, finish with what was done, or throw the workout away.
export function askEnd(ctx) {
  const close = openSheet(
    h("h2", {}, "End this workout?"),
    h("button", { class: "button", type: "button", onclick: () => { close(); setPhase("finish"); } }, "Finish and save what I did"),
    h("button", { class: "button secondary", type: "button", onclick: () => confirmThrowAway(ctx) }, "Throw this workout away"),
    h("button", { class: "button secondary", type: "button", onclick: () => close() }, "Keep going"));
}
function confirmThrowAway(ctx) {
  const close = openSheet(
    h("h2", {}, "Throw it away?"),
    h("p", { class: "muted" }, "The sets you saved in this workout will not count. This can not be undone."),
    h("button", { class: "button", type: "button", onclick: () => { close(); model.abandonSession(ctx.session.id); leaveWorkout(); go("#/today"); } }, "Yes, throw it away"),
    h("button", { class: "button secondary", type: "button", onclick: () => close() }, "No, keep it"));
}

export { sessionLayout };
