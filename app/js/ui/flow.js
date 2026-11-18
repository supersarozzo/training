// Shared parts of the workout screens: the context of one render, phase changes, starting and leaving a workout.
import { model, go, rerender } from "./app.js";
import { getActive, setActive, patchActive, clearActive } from "../active.js";
import { exercises, days } from "../plan/plan-v2.js";
import { planForSession, missedRule, canStartWorkout, blockPosition, sessionLayout } from "../engine/schedule.js";
import { buildSequence, nextPosition, walkSuggestion, finishedSessions, suggestFor, slotRecord } from "../engine/workout.js";
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
