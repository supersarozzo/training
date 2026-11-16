// First start: Start fresh, Restore from file, Restore from GitHub (not ready yet).
import { h } from "../h.js";
import { flowScreen } from "./parts.js";
import { model, go, rerender } from "./app.js";
import { resetDraft } from "./intake.js";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
let message = null; // { kind: "error" | "ok", text }

async function restoreFromFile(file) {
  if (!file) return;
  message = null;
  if (file.size > MAX_FILE_BYTES) {
    message = { kind: "error", text: "That file is too big to be a training backup." };
    return rerender();
  }
  let raw;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    message = { kind: "error", text: "That file is not a training backup (it can not be read as data)." };
    return rerender();
  }
  const result = model.restoreIntoEmpty(raw);
  if (!result.ok) {
    message = { kind: "error", text: result.error };
    return rerender();
  }
  // A restored profile may have no targets yet: the targets screen shows them for confirming.
  go(result.doc.profile?.targets ? "#/today" : (result.doc.profile ? "#/targets" : "#/today"));
}

export function renderSetup() {
  const input = h("input", {
    type: "file", accept: ".json,application/json", class: "no-print", hidden: true,
    onchange: (e) => restoreFromFile(e.target.files[0]),
  });
  return flowScreen(
    h("h1", {}, "Training"),
    h("p", { class: "muted" }, "A 12-week gym plan, Monday to Friday. Your data stays on this phone."),
    h("div", { class: "card" },
      h("h2", {}, "Start fresh"),
      h("p", { class: "muted" }, "Answer 19 short questions (about 5 minutes). The app works out your numbers."),
      h("button", { class: "button", type: "button", onclick: () => { resetDraft(); go("#/intake"); } }, "Start fresh")),
    h("div", { class: "card" },
      h("h2", {}, "Restore from file"),
      h("p", { class: "muted" }, "Use a training backup file or the starter file. It works only on a phone with no data yet."),
      input,
      h("button", { class: "button secondary", type: "button", onclick: () => input.click() }, "Choose file"),
      message ? h("p", { class: message.kind === "error" ? "error-text" : "status-success", role: "alert" }, message.text) : null),
    h("div", { class: "card" },
      h("h2", {}, "Restore from GitHub"),
      h("p", { class: "muted" }, "Available after sync is set up."),
      h("button", { class: "button secondary", type: "button", disabled: true }, "Restore from GitHub")));
}
