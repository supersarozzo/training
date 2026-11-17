// Weekly summary (Monday, before the workout): last week in numbers, the trend against the target band, and a food
// suggestion. The app only suggests; Rosario decides (version 1, WORKFLOW F2 and F3).
import { h } from "../h.js";
import { flowScreen, actionBar, mainButton, stat, icon } from "./parts.js";
import { model, go, store } from "./app.js";
import { today } from "../clock.js";
import { weeklySummary, statusWords } from "../engine/trend.js";
import { formatChange } from "./units.js";

export function seenWeek() {
  try { return store.loadDevice().weekly_seen ?? null; } catch { return null; }
}

function metric(label, value, unit) {
  return h("div", { class: "metric" }, h("div", { class: "label" }, label), h("div", { class: "value" }, String(value), unit ? h("span", { class: "unit" }, ` ${unit}`) : null));
}

export function renderWeekly() {
  const doc = model.doc();
  const sum = weeklySummary(doc, { startMonday: doc.block.start_monday, today: today() });
  const unit = doc.shared_settings.body_unit ?? "kg";
  if (!sum) {
    return [
      flowScreen(h("h1", {}, "Last week"), h("div", { class: "card" }, h("p", { class: "muted" }, "Nothing to look back on yet. The summary starts in week 2."))),
      actionBar(mainButton("Back", () => go("#/today"))),
    ];
  }
  const targets = doc.profile?.targets;
  const foodMode = doc.profile?.intake?.q32_food;

  let trendCard;
  if (sum.change === null) {
    trendCard = h("p", { class: "muted" }, "Not enough weigh-ins to tell. Weigh in most mornings; two weeks of weigh-ins give a trend.");
  } else {
    trendCard = h("div", {},
      metric("Trend weight, last 7 days", formatChange(sum.change, unit)),
      h("p", { class: "small muted" }, `Target band: ${formatChange(sum.band.low, unit)} to ${formatChange(sum.band.high, unit)} a week.`),
      h("p", {}, statusWords(sum.goal, sum.status)));
  }

  let food = null;
  if (sum.food) {
    let text = sum.food.text;
    if (targets && targets.kcal !== null && foodMode === "targets") {
      text += ` For you that is about ${targets.kcal + sum.food.kcal} kcal a day (now ${targets.kcal}).`;
    } else if (foodMode !== "targets") {
      text = sum.food.kcal > 0 ? "Eat a bit more, for example one extra snack." : "Eat a bit less, for example skip one snack.";
    }
    food = h("div", { class: "card warn" }, h("h2", {}, "Food suggestion"), h("p", {}, text), h("p", { class: "small muted" }, "This is a suggestion. You decide."));
  } else if (sum.week < 3) {
    food = h("p", { class: "small muted" }, "No food changes in weeks 1 and 2. Weight moves a lot from water.");
  }

  return [
    flowScreen(
      h("div", { class: "eyebrow" }, `Week ${sum.week - 1} · ${sum.from} to ${sum.to}`),
      h("h1", {}, "Last week"),
      h("div", { class: "stats four" },
        stat("Workouts", String(sum.workouts), "of 5", { spark: h("div", { class: "set-dots big", "aria-hidden": "true" }, Array.from({ length: 5 }, (_, i) => h("i", { class: i < sum.workouts ? "on" : "" }))) }),
        stat("Sets", String(sum.sets)),
        stat("New bests", String(sum.newBests)),
        stat("Walk", String(sum.walkMinutes), "min")),
      h("div", { class: "card" }, h("h2", {}, icon("progress", "sm"), " Weight trend"), trendCard),
      food),
    actionBar(mainButton("Got it", () => {
      store.saveDevice({ ...store.loadDevice(), weekly_seen: sum.week });
      go("#/today");
    })),
  ];
}
