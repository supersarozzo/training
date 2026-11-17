// Change-over (water, towel, heart rate settles) and the 4-minute lift warm-up. Both can be skipped.
import { h } from "../h.js";
import { workoutScreen, topBar, actionBar, mainButton, secondaryButton, timerView, icon } from "./parts.js";
import { thumb, openExercise } from "./media-ui.js";
import { setPhase, askEnd } from "./flow.js";
import { liftWarmup } from "../engine/schedule.js";
import { cues } from "../plan/cues.js";

export function renderChangeover(ctx) {
  const { act, session } = ctx;
  const main = workoutScreen(
    topBar("Change-over", () => askEnd(ctx), { startedAt: session.started_at }),
    h("h1", { class: "center" }, "Change-over"),
    h("p", { class: "center muted" }, "Drink water, dry off, walk to the weights. Let your heart rate settle."),
    timerView({ end: act.timer_end, total: act.timer_total, cap: "change-over" }),
    h("div", { class: "card tight" }, h("p", { class: "small" }, icon("watch", "sm"), " Remember: stop the walk on the treadmill. Your Watch workout keeps running.")));
  main.dataset.key = "changeover";
  return [
    main,
    actionBar(
      mainButton("Start warm-up", () => setPhase("warmup", session.kind === "short" ? 180 : 240)),
      secondaryButton("Skip warm-up", () => setPhase("weights"))),
  ];
}

export function renderLiftWarmup(ctx) {
  const { act, session } = ctx;
  const moves = liftWarmup(session.plan_day, session.kind);
  const main = workoutScreen(
    topBar("Lift warm-up", () => askEnd(ctx), { startedAt: session.started_at }),
    h("h1", { class: "center" }, "Lift warm-up"),
    timerView({ end: act.timer_end, total: act.timer_total, big: false, cap: "warm-up" }),
    h("div", { class: "list" }, moves.map((m) => h("button", { class: "ex-row", type: "button", onclick: () => openExercise(m.id) },
      thumb(m.id, { size: "sm" }),
      h("div", { class: "grow" }, h("div", { class: "title" }, m.name), h("div", { class: "sub" }, "Tap for photos")),
      h("div", { class: "end" }, `× ${m.reps}`)))),
    h("p", { class: "small muted" }, cues.lift_warmup));
  main.dataset.key = "warmup";
  return [main, actionBar(mainButton("Start weights", () => setPhase("weights"), { ic: "play" }))];
}
