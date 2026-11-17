// First start: Start fresh, Restore from file, Restore from GitHub.
import { h } from "../h.js";
import { flowScreen } from "./parts.js";
import { model, go, rerender } from "./app.js";
import { resetDraft } from "./intake.js";
import { connectionFields, restoreFromGithub, syncMessage, syncBusy, resetSyncDraft } from "./settings-sync.js";
import { photosFor } from "../plan/media.js";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
let message = null; // { kind: "error" | "ok", text }
let githubOpen = false;

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
  const result = model.restore(raw);
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
    h("div", { class: "hero" },
      h("div", { class: "hero-strip", "aria-hidden": "true" }, ["leg_press", "chest_press", "uphill_walk"].map((id) => h("img", { src: photosFor(id)[0], alt: "", decoding: "async" }))),
      h("div", { class: "hero-body" },
        h("span", { class: "eyebrow accent" }, "12 weeks · 5 days · 90 minutes"),
        h("h1", {}, "Training"),
        h("p", { class: "muted" }, "A 12-week gym plan, Monday to Friday. Your data stays on this phone."))),
    h("div", { class: "card" },
      h("h2", {}, "Start fresh"),
      h("p", { class: "muted" }, "Answer 19 short questions (about 5 minutes). The app works out your numbers."),
      h("button", { class: "button", type: "button", onclick: () => { resetDraft(); go("#/intake"); } }, "Start fresh")),
    h("div", { class: "card" },
      h("h2", {}, "Restore from file"),
      h("p", { class: "muted" }, "Use a training backup file or the starter file. It is checked first, then merged into this phone."),
      input,
      h("button", { class: "button secondary", type: "button", onclick: () => input.click() }, "Choose file"),
      message ? h("p", { class: message.kind === "error" ? "error-text" : "status-success", role: "alert" }, message.text) : null),
    githubCard());
}

function afterRestore(doc) {
  resetSyncDraft();
  go(doc.profile?.targets ? "#/today" : "#/targets");
}

function githubCard() {
  const msg = syncMessage();
  if (!githubOpen) {
    return h("div", { class: "card" },
      h("h2", {}, "Restore from GitHub"),
      h("p", { class: "muted" }, "Get your saved data from your private GitHub repo. You need your GitHub key."),
      h("button", { class: "button secondary", type: "button", onclick: () => { githubOpen = true; rerender(); } }, "Restore from GitHub"));
  }
  return h("div", { class: "card" },
    h("h2", {}, "Restore from GitHub"),
    h("p", { class: "muted" }, "Type where your data is saved and paste your GitHub key. The key stays on this phone only."),
    connectionFields(),
    msg ? h("p", { class: msg.kind === "error" ? "error-text" : "status-success", role: "alert" }, msg.text) : null,
    h("button", { class: "button", type: "button", disabled: syncBusy(), onclick: () => restoreFromGithub(afterRestore) }, syncBusy() ? "Working…" : "Connect and restore"),
    h("button", { class: "button secondary", type: "button", onclick: () => { githubOpen = false; resetSyncDraft(); rerender(); } }, "Cancel"));
}
