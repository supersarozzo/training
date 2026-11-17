// Change-over (water, towel, heart rate settles) and the 4-minute lift warm-up. Both can be skipped.
// Redesign B: a ring in the middle; the warm-up moves as a list with their photos (tap one to see how).
import { h } from "../h.js";
import { workoutScreen, topBar, actionBar, mainButton, secondaryButton, timerView, exerciseMedia, group } from "./parts.js";
import { icon } from "./icons.js";
import { setPhase, askEnd } from "./flow.js";
import { liftWarmup } from "../engine/schedule.js";
import { cues } from "../plan/cues.js";
import { openExercise } from "./exsheet.js";

const MOVE_CUES = {
  arm_circles: "Arms out to the sides. Small circles, then bigger ones. Both directions.",
  arm_swings: "Stand tall. Swing your arms open and then across your chest, relaxed.",
  cat_cow: "On hands and knees. Round your back up, then let it sag gently, slowly.",
  bodyweight_squats: "Feet shoulder-width. Sit down and back, chest up, then stand.",
  glute_bridges: "On your back, knees bent. Push through your heels and lift your hips, then lower.",
  hip_hinge: "Hands on hips, soft knees. Push your hips back with a flat back, then stand tall.",
  pushups_bench: "Hands on the bench edge, body straight. Lower your chest to the bench, push back up.",
};

export function renderChangeover(ctx) {
  const { act, session } = ctx;
  const main = workoutScreen(
    topBar("Change-over", () => askEnd(ctx)),
    h("h1", { class: "center title1" }, "Change-over"),
    h("p", { class: "center muted" }, "Drink water, dry off, walk to the weights. Let your heart rate settle."),
    timerView({ end: act.timer_end, total: act.timer_total, variant: "green", sub: "change-over" }),
    h("div", { class: "info-line" }, icon("watch", 17), h("span", {}, "Remember: stop the walk on the treadmill. Your Watch workout keeps running.")));
  main.classList.add("two-buttons");
  return [main,
    actionBar(
      mainButton("Start warm-up", () => setPhase("warmup", session.kind === "short" ? 180 : 240), { iconName: "play" }),
      secondaryButton("Skip warm-up", () => setPhase("weights"), { kind: "gray" }))];
}

export function renderLiftWarmup(ctx) {
  const { act, session } = ctx;
  const moves = liftWarmup(session.plan_day, session.kind);
  return [
    workoutScreen(
      topBar("Lift warm-up", () => askEnd(ctx)),
      h("h1", { class: "center title1" }, "Lift warm-up"),
      timerView({ end: act.timer_end, total: act.timer_total, big: false, variant: "green", sub: "warm-up" }),
      h("div", { class: "section" },
        h("h2", { class: "group-head" }, `${moves.length} moves · tap one to see how`),
        group(moves.map((m) => h("button", { class: "row with-thumb", type: "button", onclick: () => openExercise(m.id, { name: m.name, cue: MOVE_CUES[m.id] }) },
          exerciseMedia(m.id, m.name, "thumb"),
          h("span", { class: "grow" }, m.name),
          h("span", { class: "value" }, `× ${m.reps}`),
          h("span", { class: "chev" }, icon("chevron", 16, { stroke: 2.4 }))))),
        h("p", { class: "group-foot" }, cues.lift_warmup))),
    actionBar(mainButton("Start weights", () => setPhase("weights"), { iconName: "play" })),
  ];
}
