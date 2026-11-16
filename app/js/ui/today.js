import { h } from "../h.js";
import { screen, emptyState } from "./parts.js";
import { model } from "./app.js";

export function renderToday() {
  const targets = model.doc().profile?.targets;
  return screen(
    h("h1", {}, "Today"),
    targets ? h("div", { class: "card" },
      h("div", { class: "label" }, "Your numbers"),
      targets.kcal !== null ? h("div", { class: "metric" }, h("div", { class: "value" }, String(targets.kcal), h("span", { class: "unit" }, " kcal a day"))) : null,
      targets.protein_g !== null ? h("div", { class: "metric" }, h("div", { class: "value" }, String(targets.protein_g), h("span", { class: "unit" }, " g protein a day"))) : null,
      h("div", { class: "small muted" }, `Starting walk: ${targets.walk_start.speed_kmh} km/h, ${targets.walk_start.slope_pct} % slope`)) : null,
    emptyState("No workout yet", "Workouts come in a later build step."),
    h("p", { class: "small muted" }, "Only on this phone. Set up GitHub in Settings."));
}
