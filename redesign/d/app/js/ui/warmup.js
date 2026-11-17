// Change-over (water, towel, heart rate settles) and the 4-minute lift warm-up. Both can be skipped.
import { h } from "../h.js";
import { guideScreen, actionBar, mainButton, secondaryButton, timerView } from "./parts.js";
import { guideTop, coachLine } from "./coach.js";
import { thumb } from "./demo.js";
import { setPhase, askEnd } from "./flow.js";
import { liftWarmup } from "../engine/schedule.js";
import { cues } from "../plan/cues.js";

export function renderChangeover(ctx) {
  const { act, session } = ctx;
  return [
    guideScreen("changeover",
      guideTop(ctx, [h("b", {}, "Change-over"), " · water and towel"], () => askEnd(ctx)),
      h("div", { class: "rest-head" },
        h("span", { class: "eyebrow brand" }, session.walk ? "Nice walk" : "Walk skipped"),
        h("h1", {}, "Change-over"),
        h("p", { class: "muted" }, "Drink water, dry off, walk to the weights. Let your heart rate settle.")),
      timerView({ end: act.timer_end, total: act.timer_total, sub: "left" }),
      coachLine("Remember: stop the walk on the treadmill. Your Watch workout keeps running.")),
    actionBar(
      mainButton("Start warm-up", () => setPhase("warmup", session.kind === "short" ? 180 : 240)),
      secondaryButton("Skip warm-up", () => setPhase("weights"))),
  ];
}

export function renderLiftWarmup(ctx) {
  const { act, session } = ctx;
  const moves = liftWarmup(session.plan_day, session.kind);
  return [
    guideScreen("warmup",
      guideTop(ctx, [h("b", {}, "Warm-up"), ` · ${moves.length} moves`], () => askEnd(ctx)),
      h("div", { class: "rest-head" }, h("span", { class: "eyebrow brand" }, "Loosen up"), h("h1", {}, "Lift warm-up")),
      timerView({ end: act.timer_end, total: act.timer_total, big: false, small: true, sub: "left" }),
      h("ul", { class: "moves" }, moves.map((m, i) => {
        const li = h("li", { class: "fade-up" }, thumb(m.id), h("span", { class: "grow" }, m.name), h("span", { class: "muted" }, `× ${m.reps}`));
        li.style.setProperty("--i", String(i));
        return li;
      })),
      coachLine(cues.lift_warmup)),
    actionBar(mainButton("Start weights", () => setPhase("weights"))),
  ];
}
