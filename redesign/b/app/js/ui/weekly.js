// Weekly summary (Monday, before the workout): last week in numbers, the trend against the target band, and a food
// suggestion. The app only suggests; Rosario decides (version 1, WORKFLOW F2 and F3).
// Redesign B: four number tiles (like the Fitness app's weekly summary), the trend as a card with a coloured status,
// the food suggestion as an orange card that says plainly it is only a suggestion.
import { h } from "../h.js";
import { flowScreen, actionBar, mainButton, tile, section, backLink } from "./parts.js";
import { icon } from "./icons.js";
import { countUp } from "./motion.js";
import { model, go, store } from "./app.js";
import { today } from "../clock.js";
import { weeklySummary, statusWords } from "../engine/trend.js";
import { formatChange } from "./units.js";

export function seenWeek() {
  try { return store.loadDevice().weekly_seen ?? null; } catch { return null; }
}

// A number tile whose digits count up when the screen opens.
function counted(label, value, { unit = null, note = null, color = "accent", iconName = null } = {}) {
  const el = h("span", {}, String(value));
  if (Number.isFinite(value)) requestAnimationFrame(() => countUp(el, value));
  return tile({ label, value: el, unit, note, color, iconName });
}

export function renderWeekly() {
  const doc = model.doc();
  const sum = weeklySummary(doc, { startMonday: doc.block.start_monday, today: today() });
  const unit = doc.shared_settings.body_unit ?? "kg";
  if (!sum) {
    return [
      flowScreen(backLink("#/today", "Today"), h("h1", { class: "title1" }, "Last week"), h("div", { class: "card" }, h("p", { class: "muted" }, "Nothing to look back on yet. The summary starts in week 2."))),
      actionBar(mainButton("Back", () => go("#/today"))),
    ];
  }
  const targets = doc.profile?.targets;
  const foodMode = doc.profile?.intake?.q32_food;

  let trendCard;
  if (sum.change === null) {
    trendCard = h("div", { class: "card" }, h("p", { class: "muted" }, "Not enough weigh-ins to tell. Weigh in most mornings; two weeks of weigh-ins give a trend."));
  } else {
    const kind = sum.status === "on" ? "good" : "";
    trendCard = h("div", { class: `card ${kind}` },
      h("p", { class: "eyebrow" }, "Trend weight, last 7 days"),
      h("div", { class: "display" }, formatChange(sum.change, unit)),
      h("p", { class: "headline" }, statusWords(sum.goal, sum.status)),
      h("p", { class: "small muted" }, `Target band: ${formatChange(sum.band.low, unit)} to ${formatChange(sum.band.high, unit)} a week.`));
  }

  let food = null;
  if (sum.food) {
    let text = sum.food.text;
    if (targets && targets.kcal !== null && foodMode === "targets") {
      text += ` For you that is about ${targets.kcal + sum.food.kcal} kcal a day (now ${targets.kcal}).`;
    } else if (foodMode !== "targets") {
      text = sum.food.kcal > 0 ? "Eat a bit more, for example one extra snack." : "Eat a bit less, for example skip one snack.";
    }
    food = h("div", { class: "card warn" }, h("div", { class: "card-title" }, icon("food", 18), "Food suggestion"), h("p", {}, text), h("p", { class: "small muted" }, "This is a suggestion. You decide."));
  } else if (sum.week < 3) {
    food = h("div", { class: "info-line" }, icon("info", 17), h("span", {}, "No food changes in weeks 1 and 2. Weight moves a lot from water."));
  }

  return [
    flowScreen(
      h("p", { class: "eyebrow" }, `Week ${sum.week - 1} · ${sum.from} to ${sum.to}`),
      h("h1", { class: "title1" }, "Last week"),
      h("div", { class: "tiles" },
        counted("Workouts", sum.workouts, { unit: "of 5", color: "accent", iconName: "dumbbell" }),
        counted("Sets", sum.sets, { color: "green", iconName: "check" }),
        counted("New bests", sum.newBests, { color: "orange", iconName: "star" }),
        counted("Walk", sum.walkMinutes, { unit: "min", color: "cardio", iconName: "walk" })),
      section("Weight trend", trendCard),
      food),
    actionBar(mainButton("Got it", () => {
      store.saveDevice({ ...store.loadDevice(), weekly_seen: sum.week });
      go("#/today");
    })),
  ];
}
