import { h } from "../h.js";
import { screen, emptyState } from "./parts.js";

export function renderProgress() {
  return screen(h("h1", {}, "Progress"), emptyState("No data yet", "Log a weigh-in to start the line."));
}
