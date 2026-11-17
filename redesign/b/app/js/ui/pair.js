// Pairs and sets: one exercise at a time with the current set's weight and reps. Also used for abs and the "on its own" exercise.
// Redesign B: looping photo + name at the top, chips (How to, Video, Machine, Swap), the sets as an inset list,
// big round steppers in one card, Done as a capsule at the bottom. Same logic and taps as before.
import { h } from "../h.js";
import { workoutScreen, topBar, actionBar, mainButton, stepper, openSheet, timerView, choiceRow, exerciseMedia, chip, group } from "./parts.js";
import { icon } from "./icons.js";
import { model, rerender } from "./app.js";
import { patchActive } from "../active.js";
import { exercises } from "../plan/plan-v2.js";
import { stepUp, stepDown, warmupSets } from "../engine/progression.js";
import { slotRecord, workSets, warmupDone, wantsWarmup, unitLabel, targetText } from "../engine/workout.js";
import { askEnd, nextText } from "./flow.js";
import { openSwap } from "./swap.js";
import { startTimer } from "../timer.js";
import { prime } from "../sound.js";
import { openExercise } from "./exsheet.js";
import { videoFor } from "../plan/media.js";
import { machinesFor } from "../plan/machines.js";
import { openMachine, spotFor } from "./machines.js";

let draft = { key: null, weight: 0, reps: 0 };
let justDone = null; // `${session}:${slot}:${n}` of the set just saved: its row plays the check animation once

// "How many more could you do?" after a set. Optional. The set is already saved.
export function askRir(sessionId, slot, ex) {
  const hold = ex.kind === "hold";
  const close = openSheet(
    h("div", { class: "center" },
      h("div", { class: "hero-icon small green check-draw", "aria-hidden": "true" }, icon("check", 36, { stroke: 3 })),
      h("p", { class: "eyebrow" }, "Set saved"),
      h("h2", {}, hold ? "Could you have held longer?" : "How many more could you do?"),
      h("p", { class: "subhead muted" }, hold ? "Optional. It helps the next suggestion." : "Good reps left before you had to stop. Optional.")),
    hold
      ? choiceRow([[0, "No"], [1, "A bit"], [3, "Yes, easily"]], null, (v) => { model.setLastRir(sessionId, slot, v); close(); })
      : choiceRow([[0, "0"], [1, "1"], [2, "2"], [3, "3"], [4, "4+"]], null, (v) => { model.setLastRir(sessionId, slot, v); close(); }, { columns: 5 }),
    h("button", { class: "button gray", type: "button", onclick: () => close() }, "Skip"));
}

function setRow(n, label, { done = false, current = false, later = false, warm = false, rir = "", animate = false } = {}) {
  return h("div", { class: `row set-row ${done ? "done" : ""} ${current ? "current" : ""} ${later ? "later" : ""} ${animate ? "just-done" : ""}` },
    h("span", { class: "set-num", "aria-hidden": "true" }, done ? icon("check", 16, { stroke: 3.2 }) : warm ? `W${n}` : String(n)),
    h("span", { class: "what" }, warm ? `Warm-up ${n}: ${label}` : label, rir ? h("span", { class: "rir" }, ` · ${rir}`) : null),
    done ? h("span", { class: "sr-only" }, "done") : current ? h("span", { class: "rir" }, "Now") : null);
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

  const title = `${unitLabel(unit)} · set ${entry.setNumber} of ${entry.sets}`;

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
    justDone = `${session.id}:${entry.slot}:w${wDone + 1}`;
    rerender();
  };

  // set rows (the just-saved one plays its check animation once)
  const consume = (k) => { if (justDone === k) { justDone = null; return true; } return false; };
  const rows = [];
  for (let n = 1; n <= entry.sets; n++) {
    const st = done[n - 1];
    if (st) {
      const what = hold ? `${st.seconds} s` : bodyweight ? `${st.reps} reps` : `${st.weight_kg} kg × ${st.reps}`;
      const left = st.rir == null || hold ? "" : `${st.rir >= 4 ? "4+" : st.rir} left`;
      rows.push(setRow(n, what, { done: true, rir: left, animate: consume(`${session.id}:${entry.slot}:${n}`) }));
    } else {
      const cur = n === done.length + 1 && !warmupPending;
      rows.push(setRow(n, cur ? "This set" : "Later", { current: cur, later: !cur }));
    }
  }
  const warmRows = wsets.map((w, i) => setRow(i + 1, `${w.weight_kg} kg × ${w.reps}`, { warm: true, done: i < wDone, current: i === wDone, later: i > wDone, animate: i < wDone && consume(`${session.id}:${entry.slot}:w${i + 1}`) }));

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
          timerView({ end: hd.end, total: hd.total, big: false, variant: "green", onEnd: () => { const cur = ctx.act.hold; if (cur && cur.end === hd.end) { patchActive({ hold: null }); rerender(); } } }),
          h("div", { class: "text-link-row" }, h("button", { class: "text-button", type: "button", onclick: () => { patchActive({ hold: null }); rerender(); } }, icon("stop", 16), "Stop countdown")),
        ]
        : h("button", { class: "button secondary", type: "button", onclick: () => { prime(); patchActive({ hold: { end: startTimer(draft.reps, Date.now()), total: draft.reps * 1000 } }); rerender(); } }, icon("timer", 18), `Start ${draft.reps} s countdown`);
    }
    controls = [h("div", { class: "steppers" }, weightStep, repsStep), holdBox];
  }

  const nextEntry = seq[pos.index + 1] ?? null;
  const nextLine = nextEntry ? nextText(ctx, nextEntry) : null;
  const unknown = !hold && !bodyweight && !startKg && !done.length;
  const machineNote = ctx.state(exId)?.machine_note;
  const mainMachine = machinesFor(exId)[0];
  const where = mainMachine ? spotFor(ctx.doc, mainMachine) : "";
  const video = videoFor(exId);
  const openHow = () => openExercise(exId, { editNote: true });

  const info = [
    sg.lastText ? h("div", { class: "info-line" }, icon("clock", 17), h("span", {}, sg.lastText)) : null,
    sg.note && !(sg.action === "unknown") ? h("div", { class: "info-line accent" }, icon("sparkle", 17), h("span", {}, sg.note)) : null,
    machineNote ? h("div", { class: "info-line" }, icon("note", 17), h("span", {}, "Machine: ", h("strong", {}, machineNote))) : null,
    where ? h("div", { class: "info-line" }, icon("pin", 17), h("span", {}, "Where: ", h("strong", {}, where))) : null,
    rec.swap_reason === "hurts" ? h("div", { class: "info-line warn" }, icon("info", 17), h("span", {}, "You swapped because it hurt. Start light.")) : null,
    unknown ? h("div", { class: "info-line warn" }, icon("info", 17), h("span", {}, "Pick a light weight you can lift with good form.")) : null,
  ].filter(Boolean);

  return [
    workoutScreen(
      topBar(title, () => askEnd(ctx), seq.length ? pos.index / seq.length : null),
      h("div", { class: "ex-head" },
        exerciseMedia(exId, ex.name, "mid", { onclick: openHow }),
        h("div", { class: "grow" },
          h("div", { class: "ex-slot" }, `${entry.slot}${rec.swap_reason ? " · swapped in" : ""}`),
          h("h1", {}, ex.name),
          h("div", { class: "subhead muted" }, ex.equipment))),
      h("div", { class: "chips" },
        chip("How to", openHow, "info"),
        video ? h("a", { class: "chip", href: video.url, target: "_blank", rel: "noopener noreferrer" }, icon("play", 15), "Video") : null,
        mainMachine ? chip(where ? "Machine" : "Where is it?", () => openMachine(mainMachine), "pin", where ? "" : "warn") : null,
        chip("Swap", () => openSwap(ctx, rec), "swap")),
      h("div", { class: "target" }, targetText(exId, entry.sets, ctx.plan.rir)),
      info.length ? h("div", { class: "info-lines" }, info) : null,
      wsets.length ? h("div", { class: "section" }, h("h2", { class: "group-head" }, "Warm-up sets"), group(warmRows)) : null,
      h("div", { class: "section sets" }, h("h2", { class: "group-head" }, "Sets"), group(rows)),
      controls,
      nextLine ? h("div", { class: "info-line" }, icon("chevron", 17), h("span", {}, "Next: ", h("strong", {}, nextLine))) : null,
      warmupPending ? h("div", { class: "text-link-row" }, h("button", { class: "text-button", type: "button", onclick: () => { model.skipWarmup(session.id, entry.slot); rerender(); } }, "Skip warm-up sets")) : null,
      done.length ? h("div", { class: "text-link-row" }, h("button", { class: "text-button", type: "button", onclick: () => { model.undoLastSet(session.id, entry.slot); rerender(); } }, icon("undo", 16), "Undo last set")) : null),
    actionBar(warmupPending
      ? mainButton(`Done · warm-up set ${wDone + 1}`, saveWarmup, { iconName: "check" })
      : mainButton("Done", saveWork, { iconName: "check" })),
  ];
}

