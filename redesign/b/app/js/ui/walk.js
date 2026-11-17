// The walk (first block, Rosario's choice 35 b): suggestion, 30-minute timer, then the result.
// Redesign B: cardio colour (cyan ring), speed and slope as tiles, the treadmill photo, the Watch reminder card.
import { h } from "../h.js";
import { workoutScreen, topBar, actionBar, mainButton, secondaryButton, timerView, stepper, choiceRow, exerciseMedia, tile, chip } from "./parts.js";
import { icon } from "./icons.js";
import { model } from "./app.js";
import { patchActive } from "../active.js";
import { rerender } from "./app.js";
import { setPhase, askEnd } from "./flow.js";
import { startTimer, remainingMs } from "../timer.js";
import { prime } from "../sound.js";
import { cues } from "../plan/cues.js";
import { openExercise } from "./exsheet.js";
import { openMachine, spotFor } from "./machines.js";

const fmt = (n) => (Number.isInteger(n) ? n.toFixed(1) : String(n));
const howTo = () => openExercise("treadmill_walk", { name: "Fast uphill walk", cue: cues.uphill_walk });

export function renderWalk(ctx) {
  const { act, session, walk: w } = ctx;
  const legText = ctx.legDay ? "Leg day: 2 % less steep, effort 4 to 5 out of 10." : "Effort 5 to 6 out of 10: you can talk in short sentences.";

  // Before the start: what to set on the treadmill.
  if (!act.timer_end) {
    const start = () => {
      prime();
      patchActive({ timer_end: startTimer(w.minutes * 60, Date.now()), timer_total: w.minutes * 60000 });
      rerender();
    };
    const where = spotFor(ctx.doc, "treadmill");
    const main = workoutScreen(
      topBar("Walk", () => askEnd(ctx)),
      h("div", { class: "ex-head" },
        exerciseMedia("treadmill_walk", "Treadmill walk", "mid", { onclick: howTo }),
        h("div", { class: "grow" }, h("div", { class: "ex-slot" }, "Block 1 · cardio"), h("h1", {}, "Fast uphill walk"), h("div", { class: "subhead muted" }, `${w.minutes} minutes on the treadmill`))),
      h("div", { class: "tiles" },
        tile({ label: "Speed", value: fmt(w.speed_kmh), unit: "km/h", color: "cardio", iconName: "walk" }),
        tile({ label: "Slope", value: String(w.slope_pct), unit: "%", color: "cardio", iconName: "progress" })),
      h("div", { class: "info-lines" },
        h("div", { class: "info-line" }, icon("clock", 17), h("span", {}, `First ${w.buildUpMinutes} minutes are an easy build-up: ${fmt(w.buildUp.speed_kmh)} km/h, ${w.buildUp.slope_pct} %.`)),
        h("div", { class: "info-line" }, icon("heart", 17), h("span", {}, `${legText} ${w.note}`)),
        where ? h("div", { class: "info-line" }, icon("pin", 17), h("span", {}, "Treadmills: ", h("strong", {}, where))) : null),
      h("div", { class: "card info" }, h("div", { class: "card-title" }, icon("watch", 18), "Apple Watch"), h("p", {}, "Start a Strength workout on your Apple Watch now.")),
      h("div", { class: "chips" }, chip("How to walk", howTo, "info"), chip(where ? "Treadmill" : "Where is it?", () => openMachine("treadmill"), "pin", where ? "" : "warn")),
      h("p", { class: "small muted" }, cues.uphill_walk));
    main.classList.add("two-buttons");
    return [main, actionBar(mainButton("Start walk", start, { iconName: "play" }), secondaryButton("Skip walk", () => setPhase("changeover", session.kind === "short" ? 120 : 180), { kind: "gray" }))];
  }

  // Running: ring, and which part of the walk it is. The label is worked out from the end time on every tick.
  const label = h("div", { class: "center headline" }, "");
  const total = act.timer_total;
  const extra = (now) => {
    const elapsed = total - remainingMs(act.timer_end, now);
    const building = elapsed < w.buildUpMinutes * 60000;
    label.textContent = building
      ? `Build-up: ${fmt(w.buildUp.speed_kmh)} km/h · ${w.buildUp.slope_pct} %`
      : `Fast walk: ${fmt(w.speed_kmh)} km/h · ${w.slope_pct} %`;
  };
  return [
    workoutScreen(
      topBar("Walk", () => askEnd(ctx)),
      h("h1", { class: "center title1" }, "Walking"),
      label,
      timerView({ end: act.timer_end, total, extra, variant: "cardio", sub: "left", flashSub: "Walk done" }),
      h("p", { class: "center muted small" }, "Time is up when the screen flashes. You can stop earlier with the button.")),
    actionBar(mainButton("Done walking", () => setPhase("walk_result"), { iconName: "check" })),
  ];
}

// ---------- the walk result ----------
let draft = null;

export function renderWalkResult(ctx) {
  const { act, session, walk: w } = ctx;
  if (!draft || draft.id !== session.id) draft = { id: session.id, speed: w.speed_kmh, slope: w.slope_pct, effort: null, breathless: false, distance: "", hr: "" };

  const save = () => {
    const planned = w.minutes;
    let minutes = planned;
    if (act.timer_end && act.timer_total) {
      const elapsedMs = Math.min(Date.now(), act.timer_end) - (act.timer_end - act.timer_total);
      minutes = Math.max(1, Math.round(elapsedMs / 60000));
    }
    const num = (v) => (v === "" || v === null || Number.isNaN(Number(v)) ? null : Number(v));
    model.setWalk(session.id, {
      speed_kmh: draft.speed, slope_pct: draft.slope, minutes, effort: draft.effort,
      distance_km: num(draft.distance), avg_hr: num(draft.hr), breathless: draft.breathless, leg_day: ctx.legDay,
    });
    draft = null;
    setPhase("changeover", session.kind === "short" ? 120 : 180);
  };
  const pick = (v) => { draft.effort = v; rerender(); };

  return [
    workoutScreen(
      topBar("Walk result", () => askEnd(ctx)),
      h("h1", { class: "title1" }, "How was the walk?"),
      h("p", { class: "subhead muted" }, "Check what you really used, then how hard it felt."),
      h("div", { class: "steppers" },
        stepper({ label: "Speed", unit: "km/h", value: draft.speed, step: 0.1, min: 2, max: 8, onChange: (v) => { draft.speed = v; } }),
        stepper({ label: "Slope", unit: "%", value: draft.slope, step: 1, min: 0, max: 15, decimals: 0, onChange: (v) => { draft.slope = v; } })),
      h("h2", { class: "group-head" }, "How hard did it feel? (1 to 10)"),
      choiceRow([[1, "1"], [2, "2"], [3, "3"], [4, "4"], [5, "5"]], draft.effort, pick),
      choiceRow([[6, "6"], [7, "7"], [8, "8"], [9, "9"], [10, "10"]], draft.effort, pick),
      h("button", { class: "choice solo", type: "button", "aria-pressed": draft.breathless ? "true" : "false", onclick: () => { draft.breathless = !draft.breathless; rerender(); } }, h("span", {}, "I ended out of breath")),
      h("div", { class: "row-2" },
        h("div", { class: "field" }, h("label", { for: "w-dist" }, "Distance (km, optional)"),
          h("input", { type: "number", id: "w-dist", inputmode: "decimal", step: "any", min: 0, value: draft.distance, oninput: (e) => { draft.distance = e.target.value; } })),
        h("div", { class: "field" }, h("label", { for: "w-hr" }, "Average heart rate (optional)"),
          h("input", { type: "number", id: "w-hr", inputmode: "numeric", min: 30, max: 250, value: draft.hr, oninput: (e) => { draft.hr = e.target.value; } })))),
    actionBar(mainButton(draft.effort === null ? "Pick how hard it felt" : "Save walk", save, { disabled: draft.effort === null })),
  ];
}
