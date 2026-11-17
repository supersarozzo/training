// The walk (first block, Rosario's choice 35 b): suggestion, 30-minute timer, then the result.
import { h } from "../h.js";
import { guideScreen, actionBar, mainButton, secondaryButton, timerView, stepper, choiceRow } from "./parts.js";
import { guideTop, coachLine } from "./coach.js";
import { demo } from "./demo.js";
import { icon } from "./icons.js";
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
    return [
      guideScreen("walk:ready",
        guideTop(ctx, [h("b", {}, "Walk"), ` · ${w.minutes} minutes`], () => askEnd(ctx)),
        h("section", { class: "g-card tall" },
          demo("uphill_walk"),
          h("div", { class: "g-body" },
            h("span", { class: "eyebrow brand" }, "First: treadmill"),
            h("h1", {}, "Fast uphill walk"),
            h("div", { class: "g-sub" }, "Set these on the treadmill"),
            h("div", { class: "big-pair" },
              h("div", { class: "box" }, h("div", { class: "label" }, "Speed"), h("div", { class: "display" }, fmt(w.speed_kmh), h("span", { class: "unit" }, " km/h"))),
              h("div", { class: "box" }, h("div", { class: "label" }, "Slope"), h("div", { class: "display" }, String(w.slope_pct), h("span", { class: "unit" }, " %")))),
            h("p", { class: "small" }, `${w.minutes} minutes. First ${w.buildUpMinutes} minutes are an easy build-up: ${fmt(w.buildUp.speed_kmh)} km/h, ${w.buildUp.slope_pct} %.`),
            h("p", { class: "small muted" }, `${legText} ${w.note}`),
            coachLine(cues.uphill_walk))),
        h("div", { class: "card tint card-row" }, icon("timer"), h("div", { class: "grow" }, h("b", {}, "Start a Strength workout on your Apple Watch now.")))),
      actionBar(mainButton("Start walk", start), secondaryButton("Skip walk", () => setPhase("changeover", session.kind === "short" ? 120 : 180))),
    ];
  }

  // Running: ring, and which part of the walk it is. The label is worked out from the end time on every tick.
  const label = h("div", { class: "phase-pill" }, "");
  const total = act.timer_total;
  const extra = (now) => {
    const elapsed = total - remainingMs(act.timer_end, now);
    const building = elapsed < w.buildUpMinutes * 60000;
    label.textContent = building
      ? `Build-up: ${fmt(w.buildUp.speed_kmh)} km/h · ${w.buildUp.slope_pct} %`
      : `Fast walk: ${fmt(w.speed_kmh)} km/h · ${w.slope_pct} %`;
  };
  return [
    guideScreen("walk:running",
      guideTop(ctx, [h("b", {}, "Walk"), " · keep a steady pace"], () => askEnd(ctx)),
      h("div", { class: "rest-head" }, h("h1", {}, "Walking"), label),
      timerView({ end: act.timer_end, total, extra, sub: "left" }),
      h("p", { class: "center muted small" }, "Time is up when the screen flashes. You can stop earlier with the button.")),
    actionBar(mainButton("Done walking", () => setPhase("walk_result"))),
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
    guideScreen("walk:result",
      guideTop(ctx, [h("b", {}, "Walk"), " · how did it go?"], () => askEnd(ctx)),
      h("span", { class: "eyebrow brand" }, "Walk done"),
      h("h1", {}, "How was the walk?"),
      h("p", { class: "muted" }, "Check the speed and slope you really used."),
      h("div", { class: "dials" },
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
