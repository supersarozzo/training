import { h } from "../h.js";
import { screen, emptyState } from "./parts.js";

export function renderSettings() {
  return screen(h("h1", {}, "Settings"), emptyState("Nothing to set yet", "Settings come in later build steps."));
}
