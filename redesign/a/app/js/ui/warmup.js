// Change-over (water, towel, heart rate settles) and the 4-minute lift warm-up. Both can be skipped.
// Redesign A: big glowing timers; each warm-up move shows its moving picture and opens its info (photos, video).
import { h } from "../h.js";
import { workoutScreen, topBar, actionBar, mainButton, secondaryButton, timerView } from "./parts.js";
import { setPhase, askEnd } from "./flow.js";
import { liftWarmup } from "../engine/schedule.js";
import { cues } from "../plan/cues.js";
import { thumb } from "./media.js";
import { icon } from "./icons.js";
import { openExerciseInfo } from "./exinfo.js";
import { onMount, stagger } from "./motion.js";

export function renderChangeover(ctx) {
  const { act, session } = ctx;
  return [
    workoutScreen(
      topBar("Change-over", () => askEnd(ctx)),
      h("h1", { class: "rest-title" }, "Change-over"),
      h("p", { class: "center muted" }, "Drink water, dry off, walk to the weights. Let your heart rate settle."),
      timerView({ end: act.timer_end, total: act.timer_total, sub: "change-over" }),
      h("p", { class: "center small muted" }, "Remember: stop the walk on the treadmill. Your Watch workout keeps running.")),
    actionBar(
      mainButton("Start warm-up", () => setPhase("warmup", session.kind === "short" ? 180 : 240)),
      secondaryButton("Skip warm-up", () => setPhase("weights"))),
  ];
}

export function renderLiftWarmup(ctx) {
  const { act, session } = ctx;
  const moves = liftWarmup(session.plan_day, session.kind);
  const list = h("div", { class: "card" },
    moves.map((m) => h("button", { class: "mach-row", type: "button", onclick: () => openExerciseInfo(m.id, { settingsNote: false }) },
      thumb(m.id),
      h("span", { class: "grow" }, h("b", {}, m.name), h("span", { class: "small muted" }, `× ${m.reps}`)),
      h("span", { class: "muted" }, icon("info", 18)))),
    h("p", { class: "small muted" }, cues.lift_warmup));
  onMount(() => stagger(list.querySelectorAll(".mach-row")));
  return [
    workoutScreen(
      topBar("Lift warm-up", () => askEnd(ctx)),
      h("h1", { class: "rest-title" }, "Lift warm-up"),
      timerView({ end: act.timer_end, total: act.timer_total, big: false, sub: "warm-up" }),
      list),
    actionBar(mainButton("Start weights", () => setPhase("weights"))),
  ];
}
