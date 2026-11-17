// Pairs and sets: one exercise at a time with the current set's weight and reps. Also used for abs and the "on its own" exercise.
import { MAX_TEXT } from "../validate.js";
import { h } from "../h.js";
import { workoutScreen, topBar, actionBar, mainButton, stepper, openSheet, timerView, choiceRow } from "./parts.js";
import { model, rerender } from "./app.js";
import { patchActive } from "../active.js";
import { exercises } from "../plan/plan-v2.js";
import { cues } from "../plan/cues.js";
import { stepUp, stepDown, warmupSets } from "../engine/progression.js";
import { slotRecord, workSets, warmupDone, wantsWarmup, unitLabel, targetText } from "../engine/workout.js";
import { askEnd, nextText } from "./flow.js";
import { openSwap } from "./swap.js";
import { startTimer } from "../timer.js";
import { prime } from "../sound.js";
import { flip, thumb } from "./media.js";
import { icon } from "./icons.js";
import { openExerciseInfo, videoButton } from "./exinfo.js";
import { openMachineCard, whereOf, machineFor } from "./machines.js";
import { machines } from "../plan/media.js";

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

// Tips: the info sheet (picture, form tips, video, machine card and the machine settings note).
function openTips(ctx, rec) {
  openExerciseInfo(rec.done_exercise, { state: ctx.state(rec.done_exercise) });
}

// The exercise header shared by the pair screen and week 1: moving photos with the name on top, then Tips · Video · Swap.
export function exerciseHeader(ctx, rec, { tips = true } = {}) {
  const ex = exercises[rec.done_exercise];
  return [
    h("div", { class: "ex-hero" },
      flip(rec.done_exercise, { smooth: true, tag: true }),
      h("div", { class: "ex-hero-fade" }),
      h("div", { class: "ex-hero-text" },
        h("h1", {}, ex.name),
        h("div", { class: "small" }, `${ex.equipment}${rec.swap_reason ? " · swapped in" : ""}`))),
    h("div", { class: "chips" },
      tips ? h("button", { class: "chip", type: "button", onclick: () => openTips(ctx, rec) }, icon("info", 17), "Tips") : null,
      videoButton(rec.done_exercise, { chip: true }),
      h("button", { class: "chip", type: "button", onclick: () => openSwap(ctx, rec) }, icon("swap", 17), "Swap")),
  ];
}

// "Where it is" line under the target: the saved note, or a one-tap "Add where it is" the first time.
export function whereLine(ctx, exId) {
  const mid = machineFor(exId);
  if (!mid || !machines[mid]) return null;
  const where = whereOf(ctx.doc, mid);
  if (where) return h("div", { class: "where-line" }, icon("pin", 16), `${machines[mid].name}: ${where}`);
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

  // Warm-up sets: first exercise of each pair, from the suggested working weight.
  const wantW = wantsWarmup(entry, units) && !rec.warmup_skipped && !bodyweight && !hold;
  const wsets = wantW && startKg ? warmupSets(startKg, exId, ctx.settings) : [];
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

  const saveWork = () => {
    const set = hold
      ? { type: "work", weight_kg: 0, seconds: draft.reps }
      : { type: "work", weight_kg: bodyweight ? 0 : draft.weight, reps: draft.reps };
    model.logSet(session.id, entry.slot, set);
    justDone = `${session.id}:${entry.slot}:${done.length + 1}`;
    const nextEntry = seq[pos.index + 1] ?? null;
    if (!nextEntry) patchActive({ phase: "finish", rest: null, hold: null });
    else if (entry.restAfter) patchActive({ rest: { end: startTimer(entry.restAfter, Date.now()), total: entry.restAfter * 1000, kind: entry.restKind, slot: entry.slot }, hold: null });
    else patchActive({ hold: null });
    rerender();
    askRir(session.id, entry.slot, ex);
  };
  const saveWarmup = () => {
    const w = wsets[wDone];
    model.logSet(session.id, entry.slot, { type: "warmup", weight_kg: w.weight_kg, reps: w.reps });
    rerender();
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
      rows.push(h("div", { class: `set-row done ${just ? "just" : ""}` }, h("span", { class: "num" }, String(n)), h("span", { class: "what" }, `${what}${left}`), h("span", { class: "tick", "aria-label": "done" }, icon("check", 16, { strokeWidth: 3 }))));
    } else {
      const cur = n === done.length + 1;
      rows.push(h("div", { class: `set-row ${cur ? "current" : ""}` }, h("span", { class: "num" }, String(n)), h("span", { class: "what" }, cur ? "Now" : "Later"), cur ? h("span", { class: "small muted" }, `${entry.sets - done.length} to go`) : null));
    }
  }

  // Controls for the current set
  let controls = null;
  if (!warmupPending) {
    const weightStep = bodyweight || hold ? null : stepper({
      label: "Weight", unit: "kg", value: draft.weight, min: 0, max: 400,
      next: (v, dir) => (dir > 0 ? stepUp(v, exId, ctx.settings) : stepDown(v, exId, ctx.settings)),
      onChange: (v) => { draft.weight = v; },
    });
    const repsStep = stepper({
      label: hold ? "Seconds" : "Reps", unit: hold ? "s" : ex.perSide ? "each side" : "reps", value: draft.reps, step: hold ? 5 : 1, min: 0, max: hold ? 600 : 100, decimals: 0,
      onChange: (v) => { draft.reps = v; },
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
    controls = h("div", {}, weightStep, repsStep, holdBox);
  }

  const nextEntry = seq[pos.index + 1] ?? null;
  const nextLine = nextEntry ? nextText(ctx, nextEntry) : null;
  const unknown = !hold && !bodyweight && !startKg && !done.length;

  const nextRec = nextEntry ? slotRecord(session, nextEntry.slot) : null;
  return [
    workoutScreen(
      topBar(title, () => askEnd(ctx), { done: pos.index, total: seq.length }),
      exerciseHeader(ctx, rec),
      h("div", { class: "target" }, targetText(exId, entry.sets, ctx.plan.rir)),
      h("div", { class: "info-lines" },
        sg.lastText ? h("div", {}, sg.lastText) : null,
        sg.note && !(sg.action === "unknown") ? h("div", {}, sg.note) : null,
        ctx.state(exId)?.machine_note ? h("div", {}, `Machine: ${ctx.state(exId).machine_note}`) : null,
        whereLine(ctx, exId),
        rec.swap_reason === "hurts" ? h("div", { class: "warn" }, "You swapped because it hurt. Start light.") : null,
        unknown ? h("div", { class: "warn" }, "Pick a light weight you can lift with good form.") : null),
      wsets.length ? h("div", { class: "set-list" },
        h("span", { class: "eyebrow" }, "Warm-up sets"),
        wsets.map((w, i) => h("div", { class: `set-row warmup ${i < wDone ? "done" : i === wDone ? "current" : ""}` },
          h("span", { class: "num" }, `W${i + 1}`), h("span", { class: "what" }, `${w.weight_kg} kg × ${w.reps}`), i < wDone ? h("span", { class: "tick" }, icon("check", 16, { strokeWidth: 3 })) : null))) : null,
      h("div", { class: "set-list" }, h("span", { class: "eyebrow" }, "Sets"), rows),
      controls,
      nextLine ? h("div", { class: "next-card" }, nextRec ? thumb(nextRec.done_exercise, { small: true }) : null,
        h("div", { class: "what" }, h("span", { class: "eyebrow" }, "Next"), h("b", {}, nextLine))) : null,
      warmupPending ? h("div", { class: "text-link-row" }, h("button", { class: "text-button", type: "button", onclick: () => { model.skipWarmup(session.id, entry.slot); rerender(); } }, "Skip warm-up sets")) : null,
      done.length ? h("div", { class: "text-link-row" }, h("button", { class: "text-button", type: "button", onclick: () => { model.undoLastSet(session.id, entry.slot); rerender(); } }, "Undo last set")) : null),
    actionBar(warmupPending
      ? mainButton([icon("check", 22, { strokeWidth: 3 }), `Done · warm-up set ${wDone + 1}`], saveWarmup)
      : mainButton([icon("check", 22, { strokeWidth: 3 }), "Done"], saveWork)),
  ];
}
