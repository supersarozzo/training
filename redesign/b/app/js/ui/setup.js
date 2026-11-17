// First start: Start fresh, Restore from file, Restore from GitHub.
// Redesign B: a welcome like a new iPhone app (app icon, big title, one line), Start fresh as the big button,
// the two restores as an inset list under it. The GitHub form opens in place, as before.
import { h } from "../h.js";
import { flowScreen, section, group, row, foot, iconTile, actionBar, mainButton } from "./parts.js";
import { icon } from "./icons.js";
import { model, go, rerender } from "./app.js";
import { resetDraft } from "./intake.js";
import { connectionFields, restoreFromGithub, syncMessage, syncBusy, resetSyncDraft } from "./settings-sync.js";

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
  const fresh = () => { resetDraft(); go("#/intake"); };
  return [
    flowScreen(
      h("div", { class: "welcome center" },
        h("img", { class: "app-icon", src: "icons/icon-192.png", alt: "", width: 96, height: 96 }),
        h("h1", { class: "large-title" }, "Training"),
        h("p", { class: "subhead muted" }, "A 12-week gym plan, Monday to Friday. Your data stays on this phone."),
        h("p", { class: "subhead muted" }, "New here? Start fresh: answer 19 short questions (about 5 minutes). The app works out your numbers.")),
      section("Already have data",
        group(
          row({ title: "Restore from file", sub: "A training backup file or the starter file. It is checked first, then merged into this phone.", lead: iconTile("upload", "green"), onclick: () => input.click(), chevron: true }),
          githubOpen ? null : row({ title: "Restore from GitHub", sub: "Get your saved data from your private GitHub repo. You need your GitHub key.", lead: iconTile("cloud", ""), onclick: () => { githubOpen = true; rerender(); }, chevron: true })),
        input,
        message ? h("p", { class: message.kind === "error" ? "error-text" : "status-success", role: "alert" }, message.text) : null),
      githubOpen ? githubCard() : null),
    actionBar(mainButton("Start fresh", fresh, { iconName: "play" })),
  ];
}

function afterRestore(doc) {
  resetSyncDraft();
  go(doc.profile?.targets ? "#/today" : "#/targets");
}

function githubCard() {
  const msg = syncMessage();
  return h("div", { class: "card" },
    h("div", { class: "card-title" }, icon("cloud", 18), "Restore from GitHub"),
    h("p", { class: "muted" }, "Type where your data is saved and paste your GitHub key. The key stays on this phone only."),
    connectionFields(),
    msg ? h("p", { class: msg.kind === "error" ? "error-text" : "status-success", role: "alert" }, msg.text) : null,
    h("button", { class: "button", type: "button", disabled: syncBusy(), onclick: () => restoreFromGithub(afterRestore) }, syncBusy() ? "Working…" : "Connect and restore"),
    h("button", { class: "button secondary", type: "button", onclick: () => { githubOpen = false; resetSyncDraft(); rerender(); } }, "Cancel"));
}
