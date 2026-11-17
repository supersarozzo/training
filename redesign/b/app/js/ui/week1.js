// Week 1: learn the moves and find your weights (plan v2 section 8, WORKFLOW C), one exercise at a time:
//   learn -> warm-up -> set 1 -> "how many more?" -> set 2 (suggested weight) -> "how many more?" -> result (starting weight saved)
// Bodyweight and timed exercises skip the weight steps: learn -> set 1 -> set 2.
// Where an exercise stands is worked out from the saved sets (engine/week1.js week1Stage), so a reload continues in place.
import { MAX_TEXT } from "../validate.js";
import { h } from "../h.js";
import { workoutScreen, topBar, actionBar, mainButton, stepper, choiceRow, exerciseMedia, chip } from "./parts.js";
import { icon } from "./icons.js";
import { openExercise } from "./exsheet.js";
import { videoFor } from "../plan/media.js";
import { machinesFor } from "../plan/machines.js";
import { openMachine, spotFor } from "./machines.js";
import { model, rerender } from "./app.js";
import { patchActive } from "../active.js";
import { exercises } from "../plan/plan-v2.js";
import { cues } from "../plan/cues.js";
import { stepUp, stepDown } from "../engine/progression.js";
import { week1NextSet, week1Stage, week1Result, LEFT_CHOICES, LEFT_TO_RIR } from "../engine/week1.js";
import { workSets, targetText } from "../engine/workout.js";
import { startTimer } from "../timer.js";
import { askEnd } from "./flow.js";
import { openSwap } from "./swap.js";
import { renderRest } from "./rest.js";

function bigRow(pick) {
  const row = choiceRow(LEFT_CHOICES.map((c) => [c, c]), null, pick, { columns: 4 });
  row.querySelectorAll(".pick").forEach((b) => b.classList.add("big"));
  return row;
}

let draft = { key: null, weight: 0, reps: 0, note: "" };
const fresh = (key, patch) => { if (draft.key !== key) draft = { key, weight: 0, reps: 0, note: "", ...patch }; return draft; };

export function renderWeek1(ctx) {
  const { session, settings } = ctx;
  const recs = session.exercises;
  const planSlots = new Map(ctx.plan.slots.map((s) => [s.slot, s]));
  const isWeighted = (rec) => exercises[rec.done_exercise].step !== "bodyweight";
  const index = recs.findIndex((r) => week1Stage(r, isWeighted(r)) !== "done");
  if (index === -1) return null; // everything is done: the controller moves on to Finish

  const rec = recs[index];
  const exId = rec.done_exercise;
  const ex = exercises[exId];
  const weighted = isWeighted(rec);
  const hold = ex.kind === "hold";
  const stage = week1Stage(rec, weighted);
  const slotPlan = planSlots.get(rec.slot);
  const work = workSets(rec);
  const title = `Exercise ${index + 1} of ${recs.length}`;
  const sets = 2;

  // Redesign B: the same header as the set screen (photo, name, chips), so week 1 feels like the weeks after it.
  const mainMachine = machinesFor(exId)[0];
  const where = mainMachine ? spotFor(ctx.doc, mainMachine) : "";
  const video = videoFor(exId);
  const openHow = () => openExercise(exId, { cue: cues[exId] });
  const header = (extra) => [
    topBar(title, () => askEnd(ctx), recs.length ? index / recs.length : null),
    h("div", { class: "ex-head" },
      exerciseMedia(exId, ex.name, "mid", { onclick: openHow }),
      h("div", { class: "grow" },
        h("div", { class: "ex-slot" }, `Week 1 · learn${rec.swap_reason ? " · swapped in" : ""}`),
        h("h1", {}, ex.name),
        h("div", { class: "subhead muted" }, ex.equipment))),
    h("div", { class: "chips" },
      chip("How to", openHow, "info"),
      video ? h("a", { class: "chip", href: video.url, target: "_blank", rel: "noopener noreferrer" }, icon("play", 15), "Video") : null,
      mainMachine ? chip(where ? "Machine" : "Where is it?", () => openMachine(mainMachine), "pin", where ? "" : "warn") : null,
      chip("Swap", () => openSwap(ctx, rec), "swap")),
    extra,
  ];
  const setRest = () => {
    const secs = slotPlan?.rest ?? 60;
    patchActive({ rest: { end: startTimer(secs, Date.now()), total: secs * 1000, kind: "rest", slot: rec.slot }, hold: null });
  };
  const weightStepper = (d) => stepper({
    label: "Weight", unit: "kg", value: d.weight, min: 0, max: 400,
    next: (v, dir) => (dir > 0 ? stepUp(v, exId, settings) : stepDown(v, exId, settings)),
    onChange: (v) => { d.weight = v; },
  });
  const repsStepper = (d) => stepper({
    label: hold ? "Seconds" : "Reps", unit: hold ? "s" : ex.perSide ? "each side" : "reps", value: d.reps, step: hold ? 5 : 1, min: 0, max: hold ? 600 : 100, decimals: 0,
    onChange: (v) => { d.reps = v; },
  });

  // A rest timer is running (after set 1).
  if (ctx.act.rest) {
    const label = `set 2 of ${ex.name}`;
    return renderRest(ctx, { entry: null, label });
  }

  // 1. Learn
  if (stage === "learn") {
    const d = fresh(`${session.id}:${rec.slot}:learn:${exId}`, { note: ctx.state(exId)?.machine_note ?? "" });
    return [
      workoutScreen(...header(null),
        h("div", { class: "card" },
          h("div", { class: "card-title" }, icon("info", 18), "Learn the move"),
          h("p", {}, cues[exId] ?? "Move slowly and keep good form."),
          weighted ? h("p", { class: "small muted" }, "Set up the machine or the bench. Ask the staff if you are not sure how.") : null),
        weighted ? h("div", { class: "field" },
          h("label", { for: "w1-note" }, "Machine settings (seat height, pin position)"),
          h("textarea", { id: "w1-note", maxlength: MAX_TEXT, value: d.note, oninput: (e) => { d.note = e.target.value; } })) : null,
        h("p", { class: "small muted" }, targetText(exId, sets, 3))),
      actionBar(mainButton(weighted ? "Start warm-up" : "Start set 1", () => {
        if (weighted && d.note.trim()) model.setExerciseState(exId, { machine_note: d.note.trim() });
        model.flagExercise(session.id, rec.slot, { w1_ready: true });
        rerender();
      })),
    ];
  }

  // 2. Warm-up: light weight, 10 reps
  if (stage === "warmup") {
    const d = fresh(`${session.id}:${rec.slot}:warmup:${exId}`, { weight: 0, reps: 10 });
    return [
      workoutScreen(...header(h("p", {}, "Warm-up: a light weight, 10 reps. It should feel very easy.")),
        h("div", { class: "steppers" }, weightStepper(d)),
        h("div", { class: "text-link-row" }, h("button", { class: "text-button", type: "button", onclick: () => { model.skipWarmup(session.id, rec.slot); rerender(); } }, "Skip warm-up"))),
      actionBar(mainButton("Done · warm-up", () => {
        model.logSet(session.id, rec.slot, { type: "warmup", weight_kg: d.weight, reps: 10 });
        rerender();
      })),
    ];
  }

  // 3. and 5. The two working sets
  if (stage === "set1" || stage === "set2") {
    const n = stage === "set1" ? 1 : 2;
    let suggestion = null;
    if (n === 2 && weighted) {
      const s1 = work[0];
      suggestion = week1NextSet({ weight_kg: s1.weight_kg, reps: s1.reps, left: s1.left }, exId, settings);
    }
    const warmups = rec.sets.filter((s) => s.type === "warmup");
    const startWeight = n === 1 ? (warmups.length ? warmups[warmups.length - 1].weight_kg : 0) : suggestion ? suggestion.weight_kg : 0;
    const d = fresh(`${session.id}:${rec.slot}:set${n}:${exId}`, { weight: startWeight, reps: n === 2 && work[0] ? work[0].reps ?? ex.range[0] : ex.range[0] });
    const save = () => {
      model.logSet(session.id, rec.slot, hold
        ? { type: "work", weight_kg: 0, seconds: d.reps }
        : { type: "work", weight_kg: weighted ? d.weight : 0, reps: d.reps });
      if (!weighted && n === 1) setRest();
      rerender();
    };
    const first = work[0];
    return [
      workoutScreen(...header(h("div", {},
        h("div", { class: "target" }, `Set ${n} of ${sets} · stop with about 3 reps left`),
        n === 1 && weighted ? h("p", { class: "small muted" }, "Pick a weight that feels easy. You find the right one in these two sets.") : null,
        n === 2 && first ? h("p", { class: "small muted" }, `Set 1: ${hold ? `${first.seconds} s` : weighted ? `${first.weight_kg} kg × ${first.reps}, ${first.left} left` : `${first.reps} reps`}.`) : null,
        suggestion ? h("p", { class: "small" }, `${suggestion.note} Suggested: ${suggestion.weight_kg} kg.`) : null)),
      h("div", { class: "steppers" }, weighted ? weightStepper(d) : null, repsStepper(d))),
      actionBar(mainButton(`Done · set ${n}`, save, { iconName: "check" })),
    ];
  }

  // 4. and 6. "How many more could you do?"
  if (stage === "left1" || stage === "left2") {
    const n = stage === "left1" ? 1 : 2;
    const pick = (left) => {
      model.setLastRir(session.id, rec.slot, LEFT_TO_RIR[left], left);
      if (n === 1) setRest();
      rerender();
    };
    return [
      workoutScreen(...header(h("div", { class: "center" },
        h("div", { class: "hero-icon small green check-draw", "aria-hidden": "true" }, icon("check", 36, { stroke: 3 })),
        h("p", { class: "eyebrow" }, `Set ${n} saved`),
        h("h2", {}, "How many more could you have done?"),
        h("p", { class: "subhead muted" }, "Think about the last set: how many more good reps before you had to stop?"))),
      bigRow(pick)),
      actionBar(h("p", { class: "small muted center" }, "Tap one to go on.")),
    ];
  }

  // 7. Result: the weight that fits is the starting weight for week 2
  const res = week1Result(rec, exId, settings);
  const d = fresh(`${session.id}:${rec.slot}:result:${exId}`, { note: ctx.state(exId)?.machine_note ?? "" });
  return [
    workoutScreen(...header(h("div", { class: "card result-card" },
      h("p", { class: "eyebrow" }, "Your starting weight for week 2"),
      h("div", { class: "display" }, String(res.start_weight_kg), h("span", { class: "unit" }, " kg")),
      h("p", { class: "small muted" }, res.note))),
    h("div", { class: "field" },
      h("label", { for: "w1-note2" }, "Machine settings (seat height, pin position)"),
      h("textarea", { id: "w1-note2", maxlength: MAX_TEXT, value: d.note, oninput: (e) => { d.note = e.target.value; } }))),
    actionBar(mainButton("Save and go on", () => {
      model.setExerciseState(exId, { start_weight_kg: res.start_weight_kg, machine_note: d.note.trim() });
      model.flagExercise(session.id, rec.slot, { w1_saved: true });
      rerender();
    })),
  ];
}
