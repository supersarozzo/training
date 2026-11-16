import { h } from "../h.js";
import { screen, emptyState } from "./parts.js";

export function renderPlan() {
  return screen(h("h1", {}, "Plan"), emptyState("Plan sheet", "The plan arrives in build step 2."));
}
