// Pairs and sets: one exercise at a time with the current set's weight and reps. Also used for abs and the "on its own" exercise.
// Base: redesign A's set screen. Merged in (redesign/JUDGING.md 3.2 and 3.6):
// - builder C: the numbers Done will save, on the Done button; a "Last time" button that copies last time's set in 1 tap;
//   "How many more?" asked inline on the rest screen (the sheet here only when there is no rest after the set);
// - builder D: the 170 ms Done lock, so a double tap cannot also skip the rest;
// - builder B: the "Where is it?" chip; the photo shows the whole move and no text sits on it.
// 0.6.0 (Rosario, 2026-11-18: "keep track ... if I've done the whole set or only 1 set or partial repetitions"):
// "Stop this exercise here" moves on with the sets done so far (model.stopExercise, 8 s Undo); a set with fewer reps
// than the target is saved as it is (the reps stepper, shown on the Done button); the target line uses the reps set
// in the Plan (rangeFor).
import { MAX_TEXT } from "../validate.js";
import { h } from "../h.js";
import { workoutScreen, topBar, actionBar, lockedButton, stepper, openSheet, timerView, choiceRow } from "./parts.js";
import { model, rerender } from "./app.js";
import { patchActive, getActive } from "../active.js";
import { exercises } from "../plan/plan-v2.js";
import { cues } from "../plan/cues.js";
import { stepUp, stepDown, warmupSets } from "../engine/progression.js";
import { slotRecord, workSets, warmupDone, warmupCount, unitLabel, targetText } from "../engine/workout.js";
import { askEnd, nextText, nextDue, restBetween, progressOf } from "./flow.js";
import { openSwap } from "./swap.js";
import { startTimer } from "../timer.js";
import { prime } from "../sound.js";
import { flip, thumb, photoNote } from "./media.js";
import { icon } from "./icons.js";
import { openExerciseInfo, videoButton } from "./exinfo.js";
import { openMachineCard, whereOf, machineFor } from "./machines.js";
import { machines } from "../plan/media.js";
import { previousSets, setText, fmtKg } from "./stats.js";
import { rangeFor } from "../planview.js";
import { undoToast } from "./planedit.js";

let justDone = null; // the set that was just saved: its row plays the "done" animation once (redesign A)

let draft = { key: null, weight: 0, reps: 0 };

// "How many more could you do?" after a set. Optional. The set is already saved.
export function askRir(sessionId, slot, ex) {
  const hold = ex.kind === "hold";
  const close = openSheet(
    h("h2", {}, hold ? "Could you have held longer?" : "How many more could you do?"),
    hold
      ? choiceRow([[0, "No"], [1, "A bit"], [3, "Yes, easily"]], null, (v) => { model.setLastRir(sessionId, slot, v); close(); })
      : choiceRow([[0, "0"], [1, "1"], [2, "2"], [3, "3"], [4, "4+"]], null, (v) => { model.setLastRir(sessionId, slot, v); close(); }, { columns: 5 }),
    h("button", { class: "text-button", type: "button", onclick: () => close() }, "Skip"));
}

// "Stop this exercise here": asks first, then moves on with the sets done; Undo (8 s) asks the rest again.
function askStop(session, entry, ex, doneCount) {
  const close = openSheet(
    h("h2", {}, `Move on with ${doneCount} of ${entry.sets} sets?`),
    h("p", { class: "muted" }, `The sets you did are saved. ${ex.name} ends here and the workout goes on.`),
    h("p", { class: "small muted" }, "Does it hurt? Use Swap › It hurts instead."), // trainer D10: pain goes through Swap
    h("button", { class: "button", type: "button", onclick: () => {
      close();
      model.stopExercise(session.id, entry.slot, true);
      rerender();
      undoToast(`${ex.name}: stopped after ${doneCount} of ${entry.sets} sets.`, () => undoStop(session.id, entry.slot));
    } }, "Yes, move on"),
    h("button", { class: "button secondary", type: "button", onclick: () => close() }, "No, keep going"));
}

// Undo of a stop. A stop of the last exercise leaves no set to do, so the workout screen has already saved phase
// "finish" (ui/workout.js): go back to the sets, or the stopped sets could never be done (auditor M3).
export function undoStop(sessionId, slot) {
  model.stopExercise(sessionId, slot, false);
  if (getActive()?.phase === "finish") patchActive({ phase: "weights", rest: null, hold: null });
}

// Tips: the info sheet (picture, form tips, video, machine card and the machine settings note).
function openTips(ctx, rec) {
  openExerciseInfo(rec.done_exercise, { state: ctx.state(rec.done_exercise) });
}

// The exercise header shared by the pair screen and week 1: the moving photo (the whole move, nothing written on it)
// with the name and equipment beside it, then the chips Tips · Video · Where · Swap and the "close match" note.
// Side by side so the weight and reps controls fit without scrolling at 375 x 812 (JUDGING.md 3.6 item 3).
export function exerciseHeader(ctx, rec, { tips = true } = {}) {
  const exId = rec.done_exercise;
  const ex = exercises[exId];
  const mid = machineFor(exId);
  const where = mid && machines[mid] ? whereOf(ctx.doc, mid) : "";
  return [
    h("div", { class: "ex-head" },
      h("div", { class: "ex-hero" }, flip(exId)),
      h("div", { class: "ex-title" },
        h("h1", {}, ex.name),
        h("div", { class: "small muted" }, `${ex.equipment}${rec.swap_reason ? " · swapped in" : ""}`))),
    h("div", { class: "chips ex-chips" },
        tips ? h("button", { class: "chip", type: "button", onclick: () => openTips(ctx, rec) }, icon("info", 17), "Tips") : null,
        videoButton(exId, { chip: true }),
        mid && machines[mid] ? h("button", { class: `chip ${where ? "" : "where-add"}`, type: "button", "aria-label": where ? `${machines[mid].name}: where it is` : `Where is the ${machines[mid].name}? Add where it is`, onclick: () => openMachineCard(mid, { edit: !where, onSaved: rerender }) }, icon("pin", 17), where ? "Machine" : "Where?") : null,
        h("button", { class: "chip", type: "button", onclick: () => openSwap(ctx, rec) }, icon("swap", 17), "Swap")),
    photoNote(exId),
  ];
}

// "Where it is" line under the target: the saved note. With no note yet, `add` gives a one-tap "Where is the …?" chip
// (screens without the photo chips: week 1 and the walk); the set screen has "Where is it?" in its chip row instead.
export function whereLine(ctx, exId, { add = false } = {}) {
  const mid = machineFor(exId);
  if (!mid || !machines[mid]) return null;
  const where = whereOf(ctx.doc, mid);
  if (where) return h("div", { class: "where-line" }, icon("pin", 16), `${machines[mid].name}: ${where}`);
  if (!add) return null;
  return h("div", {}, h("button", { class: "chip accent where-add", type: "button", onclick: () => openMachineCard(mid, { edit: true, onSaved: rerender }) },
    icon("pin", 16), `Where is the ${machines[mid].name.split(" (")[0].toLowerCase()}?`));
}

export function renderPair(ctx, pos) {
  const { session, units, seq } = ctx;
  const entry = pos.entry;
  const unit = units[entry.unitIndex];
  const rec = slotRecord(session, entry.slot);
  const exId = rec.done_exercise;
  const ex = exercises[exId];
  const sg = ctx.sugg(exId);
  const hold = ex.kind === "hold";
  const bodyweight = ex.step === "bodyweight";
  const done = workSets(rec);
  const startKg = rec.swap_reason === "hurts" && rec.swap_weight_kg != null ? rec.swap_weight_kg : sg.weight_kg;

  // Warm-up sets: first exercise of a pair, from the suggested working weight. How many (0, 1 or 2) follows the
  // trainer's L1 rule (engine warmupCount), on the day as it really is: the exercise really done in each slot.
  const exOf = (slot) => slotRecord(session, slot.slot)?.done_exercise ?? slot.ex;
  const wCount = !rec.warmup_skipped && !bodyweight && !hold ? warmupCount(entry, units, exOf) : 0;
  const wsets = wCount && startKg ? warmupSets(startKg, exId, ctx.settings, wCount) : [];
  const wDone = warmupDone(rec);
  const warmupPending = wsets.length > 0 && wDone < wsets.length;

  // The numbers in the steppers for this set. Reset when the set changes.
  const key = `${session.id}:${entry.slot}:${entry.setNumber}:${exId}`;
  if (draft.key !== key) {
    const prev = done[done.length - 1];
    draft = {
      key,
      weight: prev ? prev.weight_kg : startKg ?? 0,
      reps: prev ? (hold ? prev.seconds ?? sg.range[0] : prev.reps ?? sg.reps) : sg.reps,
    };
  }

  const title = unit.type === "pair"
    ? `${unitLabel(unit)} · set ${entry.setNumber} of ${entry.sets}`
    : `${unitLabel(unit)} · set ${entry.setNumber} of ${entry.sets}`;

  let askAfter = false;
  const saveWork = () => {
    const set = hold
      ? { type: "work", weight_kg: 0, seconds: draft.reps }
      : { type: "work", weight_kg: bodyweight ? 0 : draft.weight, reps: draft.reps };
    model.logSet(session.id, entry.slot, set);
    justDone = `${session.id}:${entry.slot}:${done.length + 1}`;
    // The next set still to do, skipping stopped sets (auditor M2); the rest is the longest planned on the way there.
    const after = model.doc().sessions.find((x) => x.id === session.id) ?? session;
    const due = nextDue(after, seq, pos.index);
    const rest = due ? restBetween(seq, pos.index, due.index) : null;
    if (!due) patchActive({ phase: "finish", rest: null, hold: null });
    else if (rest.seconds) patchActive({ rest: { end: startTimer(rest.seconds, Date.now()), total: rest.seconds * 1000, kind: rest.kind, slot: entry.slot }, hold: null });
    else patchActive({ hold: null });
    // The rest screen asks "How many more?" inline; only without a rest after this set does the sheet ask (builder C).
    // The sheet opens after the redraw (a redraw closes open sheets).
    askAfter = !due || !rest.seconds;
  };
  const saveWarmup = () => {
    const w = wsets[wDone];
    model.logSet(session.id, entry.slot, { type: "warmup", weight_kg: w.weight_kg, reps: w.reps });
  };

  // set rows
  const rows = [];
  for (let n = 1; n <= entry.sets; n++) {
    const s = done[n - 1];
    if (s) {
      const what = hold ? `${s.seconds} s` : bodyweight ? `${s.reps} reps` : `${s.weight_kg} kg × ${s.reps}`;
      const left = s.rir == null || hold ? "" : ` · ${s.rir >= 4 ? "4+" : s.rir} left`;
      const just = justDone === `${session.id}:${entry.slot}:${n}`;
      if (just) justDone = null;
      rows.push(h("div", { class: `set-tile done ${just ? "just" : ""}`, "aria-label": `Set ${n} done: ${what}${left}` }, h("span", { class: "num" }, icon("check", 13, { strokeWidth: 3.2 }), String(n)), h("span", { class: "what" }, what), left ? h("span", { class: "left" }, left.replace(" · ", "")) : null));
    } else {
      const cur = n === done.length + 1;
      rows.push(h("div", { class: `set-tile ${cur ? "current" : ""}` }, h("span", { class: "num" }, `Set ${n}`), h("span", { class: "what" }, cur ? "Now" : "Later")));
    }
  }

  // What Done will save, shown on the button and kept up to date while the steppers move (builder C).
  const doneSub = () => (warmupPending
    ? `${fmtKg(wsets[wDone].weight_kg)} kg × ${wsets[wDone].reps}`
    : hold ? `${draft.reps} s` : bodyweight ? `${draft.reps} reps` : `${fmtKg(draft.weight)} kg × ${draft.reps}`);
  let doneBtn = null;
  const live = () => { const el = doneBtn?.querySelector(".sub"); if (el) el.textContent = doneSub(); };

  // "Last time" (builder C's PREVIOUS): the same set of the newest finished workout; one tap copies it in.
  const prev = previousSets(ctx.doc.sessions, exId);
  const p = prev[done.length] ?? prev[prev.length - 1] ?? null;
  const prevText = sg.lastText ? sg.lastText.replace(/^Last time: /, "") : setText(exId, p);
  const prevBtn = !warmupPending && p ? h("button", { class: "prev-btn", type: "button", "aria-label": `Last time: ${prevText}. Use ${setText(exId, p)} for this set`, onclick: () => {
    if (!hold && !bodyweight) draft.weight = p.weight_kg;
    draft.reps = hold ? p.seconds ?? draft.reps : p.reps ?? draft.reps;
    rerender();
  } }, h("span", { class: "eyebrow" }, "Last time"), h("b", {}, prevText), h("span", { class: "use" }, icon("undo", 15), "Use")) : null;

  // Controls for the current set
  let controls = null;
  if (!warmupPending) {
    const weightStep = bodyweight || hold ? null : stepper({
      label: "Weight", unit: "kg", value: draft.weight, min: 0, max: 400,
      next: (v, dir) => (dir > 0 ? stepUp(v, exId, ctx.settings) : stepDown(v, exId, ctx.settings)),
      onChange: (v) => { draft.weight = v; live(); },
    });
    const repsStep = stepper({
      label: hold ? "Seconds" : "Reps", unit: hold ? "s" : ex.perSide ? "each side" : "reps", value: draft.reps, step: hold ? 5 : 1, min: 0, max: hold ? 600 : 100, decimals: 0,
      onChange: (v) => { draft.reps = v; live(); },
    });
    let holdBox = null;
    if (hold) {
      const hd = ctx.act.hold;
      holdBox = hd
        ? [
          timerView({ end: hd.end, total: hd.total, big: false, onEnd: () => { const cur = ctx.act.hold; if (cur && cur.end === hd.end) { patchActive({ hold: null }); rerender(); } } }),
          h("div", { class: "text-link-row" }, h("button", { class: "text-button", type: "button", onclick: () => { patchActive({ hold: null }); rerender(); } }, "Stop countdown")),
        ]
        : h("button", { class: "button secondary", type: "button", onclick: () => { prime(); patchActive({ hold: { end: startTimer(draft.reps, Date.now()), total: draft.reps * 1000 } }); rerender(); } }, `Start ${draft.reps} s countdown`);
    }
    controls = h("div", {}, prevBtn, weightStep, repsStep, holdBox);
  }

  const nextEntry = nextDue(session, seq, pos.index)?.entry ?? null; // never a stopped set (auditor M2)
  const nextLine = nextEntry ? nextText(ctx, nextEntry) : null;
  const unknown = !hold && !bodyweight && !startKg && !done.length;

  const nextRec = nextEntry ? slotRecord(session, nextEntry.slot) : null;
  const canStop = !warmupPending && done.length >= 1 && done.length < entry.sets;
  const lockKey = `${session.id}:${entry.slot}:${entry.setNumber}:${wDone}:${done.length}`;
  doneBtn = warmupPending
    ? lockedButton(`Done · warm-up set ${wDone + 1}`, { key: lockKey, sub: doneSub(), doneText: "Saved", work: saveWarmup, after: rerender })
    : lockedButton("Done", { key: lockKey, sub: doneSub(), doneText: "Saved", work: saveWork, after: () => { rerender(); if (askAfter) askRir(session.id, entry.slot, ex); } });
  return [
    workoutScreen(
      topBar(title, () => askEnd(ctx), progressOf(session, seq)),
      exerciseHeader(ctx, rec),
      h("div", { class: "target" }, targetText(exId, entry.sets, ctx.plan.rir, rangeFor(ctx.doc, exId))),
      h("div", { class: "info-lines" },
        sg.lastText && !prevBtn ? h("div", {}, sg.lastText) : null,
        sg.note && !(sg.action === "unknown") ? h("div", {}, sg.note) : null,
        ctx.state(exId)?.machine_note ? h("div", {}, `Machine: ${ctx.state(exId).machine_note}`) : null,
        whereLine(ctx, exId),
        rec.swap_reason === "hurts" ? h("div", { class: "warn" }, "You swapped because it hurt. Start light.") : null,
        unknown ? h("div", { class: "warn" }, "Pick a light weight you can lift with good form.") : null),
      // Warm-up sets: tiles while they are due, one short line once done (DESIGN.md: "collapsed after done").
      wsets.length && warmupPending ? h("div", { class: "set-list" },
        h("span", { class: "eyebrow" }, "Warm-up sets"),
        h("div", { class: "set-tiles" }, wsets.map((w, i) => h("div", { class: `set-tile warmup ${i < wDone ? "done" : i === wDone ? "current" : ""}` },
          h("span", { class: "num" }, i < wDone ? icon("check", 13, { strokeWidth: 3.2 }) : null, `W${i + 1}`), h("span", { class: "what" }, `${w.weight_kg} kg × ${w.reps}`))))) : null,
      wsets.length && !warmupPending ? h("div", { class: "small muted status-line warm-done" }, h("span", { class: "tick-sm" }, icon("check", 14, { strokeWidth: 3 })), `Warm-up done: ${wsets.map((w) => `${w.weight_kg} kg × ${w.reps}`).join(", ")}`) : null,
      h("div", { class: "set-list" }, h("span", { class: "eyebrow" }, `Sets · ${done.length} of ${entry.sets} done`), h("div", { class: "set-tiles" }, rows)),
      controls,
      nextLine ? h("div", { class: "next-card" }, nextRec ? thumb(nextRec.done_exercise, { small: true }) : null,
        h("div", { class: "what" }, h("span", { class: "eyebrow" }, "Next"), h("b", {}, nextLine))) : null,
      warmupPending ? h("div", { class: "text-link-row" }, h("button", { class: "text-button", type: "button", onclick: () => { model.skipWarmup(session.id, entry.slot); rerender(); } }, "Skip warm-up sets")) : null,
      done.length ? h("div", { class: "text-link-row" }, h("button", { class: "text-button", type: "button", onclick: () => { model.undoLastSet(session.id, entry.slot); rerender(); } }, "Undo last set")) : null,
      // Only with at least 1 set done and at least 1 set still to do; never while warm-up sets are due.
      canStop ? h("div", { class: "text-link-row stop-row" }, h("button", { class: "text-button stop-ex", type: "button", onclick: () => askStop(session, entry, ex, done.length) }, "Stop this exercise here")) : null),
    actionBar(doneBtn),
  ];
}
