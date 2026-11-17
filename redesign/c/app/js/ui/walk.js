// The walk (first block, Rosario's choice 35 b): suggestion, 30-minute timer, then the result.
import { h } from "../h.js";
import { workoutScreen, topBar, actionBar, mainButton, secondaryButton, timerView, stepper, choiceRow, stat, chip, icon } from "./parts.js";
import { flip, openExercise, openMachine, whereOf } from "./media-ui.js";
import { videos } from "../plan/media.js";
import { model } from "./app.js";
import { patchActive } from "../active.js";
import { rerender } from "./app.js";
import { setPhase, askEnd } from "./flow.js";
import { startTimer, remainingMs } from "../timer.js";
import { prime } from "../sound.js";
import { cues } from "../plan/cues.js";

const fmt = (n) => (Number.isInteger(n) ? n.toFixed(1) : String(n));

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
    const where = whereOf(ctx.doc, "treadmill");
    const bShare = w.buildUpMinutes / w.minutes;
    const bi = h("i", { class: "b" }), fi = h("i", {});
    bi.style.flex = String(bShare); fi.style.flex = String(1 - bShare);
    const main = workoutScreen(
      topBar("Walk", () => askEnd(ctx)),
      h("div", { class: "ex-head" },
        flip("uphill_walk", { size: "lg", onclick: () => openExercise("uphill_walk") }),
        h("div", { class: "grow" }, h("div", { class: "eyebrow" }, "Block 1"), h("h1", {}, "Fast uphill walk"), h("div", { class: "meta" }, `Treadmill · ${w.minutes} minutes`))),
      h("div", { class: "walk-nums" },
        stat("Speed", fmt(w.speed_kmh), "km/h"),
        stat("Slope", String(w.slope_pct), "%")),
      h("div", { class: "card tight" },
        h("div", { class: "phase-bar", "aria-hidden": "true" }, bi, fi),
        h("div", { class: "phase-legend" }, h("span", {}, "Build-up"), h("span", {}, "Fast walk")),
        h("p", { class: "small muted" }, `${w.minutes} minutes. First ${w.buildUpMinutes} minutes are an easy build-up: ${fmt(w.buildUp.speed_kmh)} km/h, ${w.buildUp.slope_pct} %.`),
        h("p", { class: "small muted" }, `${legText} ${w.note}`)),
      h("div", { class: "chips" },
        videos.uphill_walk ? chip("play", "Video", null, { href: videos.uphill_walk.url }) : null,
        chip("pin", where ? "Treadmill" : "Where is it?", () => openMachine("treadmill"), { cls: where ? "" : "warn" })),
      h("div", { class: "card warn" }, h("p", {}, icon("watch", "sm"), " Start a Strength workout on your Apple Watch now.")),
      h("p", { class: "small muted" }, cues.uphill_walk));
    main.dataset.key = "walk";
    return [main, actionBar(mainButton("Start walk", start, { ic: "play" }), secondaryButton("Skip walk", () => setPhase("changeover", session.kind === "short" ? 120 : 180)))];
  }

  // Running: ring, and which part of the walk it is. The label is worked out from the end time on every tick.
  const label = h("div", { class: "center" }, "");
  const total = act.timer_total;
  const extra = (now) => {
    const elapsed = total - remainingMs(act.timer_end, now);
    const building = elapsed < w.buildUpMinutes * 60000;
    label.textContent = building
      ? `Build-up: ${fmt(w.buildUp.speed_kmh)} km/h · ${w.buildUp.slope_pct} %`
      : `Fast walk: ${fmt(w.speed_kmh)} km/h · ${w.slope_pct} %`;
  };
  const main = workoutScreen(
    topBar("Walk", () => askEnd(ctx), { startedAt: session.started_at }),
    h("h1", { class: "center" }, "Walking"),
    h("div", { class: "center target" }, label),
    timerView({ end: act.timer_end, total, extra, cap: "left", marks: [[0, (w.buildUpMinutes * 60000) / total]] }),
    h("div", { class: "walk-nums" }, stat("Speed", fmt(w.speed_kmh), "km/h", { d: `build-up ${fmt(w.buildUp.speed_kmh)}` }), stat("Slope", String(w.slope_pct), "%", { d: `build-up ${w.buildUp.slope_pct} %` })),
    h("p", { class: "center muted small" }, "Time is up when the screen flashes. You can stop earlier with the button."));
  main.dataset.key = "walk-run";
  return [main, actionBar(mainButton("Done walking", () => setPhase("walk_result"), { ic: "check" }))];
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
      h("h1", {}, "How was the walk?"),
      h("p", { class: "small muted" }, "Check the numbers you really used."),
      h("div", { class: "editor" },
        stepper({ label: "Speed", unit: "km/h", value: draft.speed, step: 0.1, min: 2, max: 8, onChange: (v) => { draft.speed = v; } }),
        stepper({ label: "Slope", unit: "%", value: draft.slope, step: 1, min: 0, max: 15, decimals: 0, onChange: (v) => { draft.slope = v; } })),
      h("h3", {}, "How hard did it feel? (1 to 10)"),
      choiceRow([[1, "1"], [2, "2"], [3, "3"], [4, "4"], [5, "5"]], draft.effort, pick),
      choiceRow([[6, "6"], [7, "7"], [8, "8"], [9, "9"], [10, "10"]], draft.effort, pick),
      h("button", { class: "choice", type: "button", "aria-pressed": draft.breathless ? "true" : "false", onclick: () => { draft.breathless = !draft.breathless; rerender(); } }, "I ended out of breath"),
      h("div", { class: "row" },
        h("div", { class: "field" }, h("label", { for: "w-dist" }, "Distance (km, optional)"),
          h("input", { type: "number", id: "w-dist", inputmode: "decimal", step: "any", min: 0, value: draft.distance, oninput: (e) => { draft.distance = e.target.value; } })),
        h("div", { class: "field" }, h("label", { for: "w-hr" }, "Average heart rate (optional)"),
          h("input", { type: "number", id: "w-hr", inputmode: "numeric", min: 30, max: 250, value: draft.hr, oninput: (e) => { draft.hr = e.target.value; } })))),
    actionBar(mainButton("Save walk", save, { disabled: draft.effort === null })),
  ];
}
