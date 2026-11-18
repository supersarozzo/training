// Week 1: learn the moves and find your weights (plan v2 section 8, WORKFLOW C), one exercise at a time:
//   learn -> warm-up -> set 1 -> "how many more?" -> set 2 (suggested weight) -> "how many more?" -> result (starting weight saved)
// Bodyweight and timed exercises skip the weight steps: learn -> set 1 -> set 2.
// Where an exercise stands is worked out from the saved sets (engine/week1.js week1Stage), so a reload continues in place.
import { MAX_TEXT } from "../validate.js";
import { h } from "../h.js";
import { workoutScreen, topBar, actionBar, mainButton, stepper, choiceRow } from "./parts.js";
import { model, rerender } from "./app.js";
import { patchActive } from "../active.js";
import { nReps } from "../words.js";
import { exercises } from "../plan/plan-v2.js";
import { warmupSets } from "../engine/progression.js";
import { cues } from "../plan/cues.js";
import { stepUp, stepDown } from "../engine/progression.js";
import { week1NextSet, week1Stage, week1Result, LEFT_CHOICES, LEFT_TO_RIR } from "../engine/week1.js";
import { workSets, targetText, currentRecords } from "../engine/workout.js";
import { startTimer } from "../timer.js";
import { askEnd } from "./flow.js";
import { openSwap } from "./swap.js";
import { renderRest } from "./rest.js";
import { exerciseHeader, whereLine } from "./pair.js";
import { icon } from "./icons.js";
import { soreNote } from "../planview.js";

function bigRow(pick) {
  const row = choiceRow(LEFT_CHOICES.map((c) => [c, c]), null, pick, { columns: 4 });
  row.querySelectorAll(".pick").forEach((b) => b.classList.add("big"));
  return row;
}

let draft = { key: null, weight: 0, reps: 0, note: "" };
const fresh = (key, patch) => { if (draft.key !== key) draft = { key, weight: 0, reps: 0, note: "", ...patch }; return draft; };

export function renderWeek1(ctx) {
  const { session, settings } = ctx;
  const recs = currentRecords(session); // not the swapped-out records (review 8.25 R1)
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

  // Redesign A: the same moving-picture header as the pair screen (Tips, Video, Swap) and the "where it is" line.
  const header = (extra) => [
    topBar(title, () => askEnd(ctx), { done: index, total: recs.length }),
    exerciseHeader(ctx, rec),
    h("div", { class: "info-lines" }, whereLine(ctx, exId),
      soreNote(ctx.session.plan_day, ctx.session.week, rec.slot) ? h("div", { class: "sore-note" }, soreNote(ctx.session.plan_day, ctx.session.week, rec.slot)) : null), // trainer D13
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
          h("h2", {}, "Learn the move"),
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

  // The weight to try (0.7.1): a Plan weight, a weight found in practice, else the first-try table (trainer D12).
  // The two sets below still find the real weight. A swap after pain keeps its own lighter weight.
  const sg = weighted ? ctx.sugg(exId) : null;
  const tryKg = rec.swap_reason === "hurts" && rec.swap_weight_kg != null ? rec.swap_weight_kg : sg && sg.weight_kg > 0 ? sg.weight_kg : 0;

  // 2. Warm-up: light weight, 10 reps (about half the weight to try)
  if (stage === "warmup") {
    const d = fresh(`${session.id}:${rec.slot}:warmup:${exId}`, { weight: tryKg ? warmupSets(tryKg, exId, settings, 1)[0]?.weight_kg ?? 0 : 0, reps: 10 });
    return [
      workoutScreen(...header(h("p", {}, "Warm-up: a light weight, 10 reps. It should feel very easy.")),
        weightStepper(d),
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
    const startWeight = n === 1 ? (tryKg || (warmups.length ? warmups[warmups.length - 1].weight_kg : 0)) : suggestion ? suggestion.weight_kg : 0;
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
        h("div", { class: "target" }, `Set ${n} of ${sets} · stop with about 3 ${hold ? "seconds" : "reps"} left`),
        n === 1 && weighted ? h("p", { class: "small muted" }, tryKg ? `Try ${tryKg} kg. ${sg?.action === "first_try" ? "First try. Set 1 tells us if it is right." : sg?.note ?? ""}`.trim() : "Pick a weight that feels easy. You find the right one in these two sets.") : null,
        n === 2 && first ? h("p", { class: "small muted" }, `Set 1: ${hold ? `${first.seconds} s` : weighted ? `${first.weight_kg} kg × ${first.reps}, ${first.left} left` : nReps(first.reps)}.`) : null,
        suggestion ? h("p", { class: "small" }, `${suggestion.note} Suggested: ${suggestion.weight_kg} kg.`) : null)),
      weighted ? weightStepper(d) : null,
      repsStepper(d)),
      actionBar(mainButton([icon("check", 22, { strokeWidth: 3 }), `Done · set ${n}`], save)),
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
      workoutScreen(...header(h("div", {},
        h("h2", {}, "How many more could you have done?"),
        h("p", { class: "muted" }, "Think about the last set: how many more good reps before you had to stop?"))),
      bigRow(pick)),
      actionBar(h("p", { class: "small muted center" }, "Tap one to go on.")),
    ];
  }

  // 7. Result: the weight that fits is the starting weight for week 2 (for week 1 on a practice day, trainer D11)
  const res = week1Result(rec, exId, settings, { practice: session.week === 0 });
  const d = fresh(`${session.id}:${rec.slot}:result:${exId}`, { note: ctx.state(exId)?.machine_note ?? "" });
  return [
    workoutScreen(...header(h("div", { class: "card accent" },
      h("div", { class: "label" }, `Your starting weight for week ${session.week === 0 ? 1 : 2}`),
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
