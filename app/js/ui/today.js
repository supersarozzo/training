import { h } from "../h.js";
import { screen, emptyState } from "./parts.js";

export function renderToday() {
  return screen(h("h1", {}, "Today"), emptyState("No workout yet", "The Today screen comes in a later build step."));
}
