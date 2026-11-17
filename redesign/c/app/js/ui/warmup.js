// Change-over (water, towel, heart rate settles) and the 4-minute lift warm-up. Both can be skipped.
import { h } from "../h.js";
import { workoutScreen, topBar, actionBar, mainButton, secondaryButton, timerView } from "./parts.js";
import { setPhase, askEnd } from "./flow.js";
import { liftWarmup } from "../engine/schedule.js";
import { cues } from "../plan/cues.js";

export function renderChangeover(ctx) {
  const { act, session } = ctx;
  return [
    workoutScreen(
      topBar("Change-over", () => askEnd(ctx)),
      h("h1", { class: "center" }, "Change-over"),
      h("p", { class: "center muted" }, "Drink water, dry off, walk to the weights. Let your heart rate settle."),
      timerView({ end: act.timer_end, total: act.timer_total }),
      h("p", { class: "center small muted" }, "Remember: stop the walk on the treadmill. Your Watch workout keeps running.")),
    actionBar(
      mainButton("Start warm-up", () => setPhase("warmup", session.kind === "short" ? 180 : 240)),
      secondaryButton("Skip warm-up", () => setPhase("weights"))),
  ];
}

export function renderLiftWarmup(ctx) {
  const { act, session } = ctx;
  const moves = liftWarmup(session.plan_day, session.kind);
  return [
    workoutScreen(
      topBar("Lift warm-up", () => askEnd(ctx)),
      h("h1", { class: "center" }, "Lift warm-up"),
      timerView({ end: act.timer_end, total: act.timer_total, big: true }),
      h("div", { class: "card" },
        h("ul", { class: "list-plain" }, moves.map((m) => h("li", {}, h("span", {}, m.name), h("span", { class: "muted" }, `× ${m.reps}`)))),
        h("p", { class: "small muted" }, cues.lift_warmup))),
    actionBar(mainButton("Start weights", () => setPhase("weights"))),
  ];
}
