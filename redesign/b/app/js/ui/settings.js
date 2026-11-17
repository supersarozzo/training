// Settings: GitHub sync, backup and restore, the Log to Health button, gym weights, body unit, sound.
// Redesign B (iOS Settings style): sections with small grey heads; switches for sound and the Health button;
// a segmented control for the body unit; a row to the Machines list. Every setting from before is still here.
import { h } from "../h.js";
import { screen, navHead, section, group, row, foot, iconTile, switchRow, segmented } from "./parts.js";
import { icon } from "./icons.js";
import { showPlanPart } from "./plansheet.js";
import { machines } from "../plan/machines.js";
import { spotFor } from "./machines.js";
import { model, store, rerender, go } from "./app.js";
import { soundOn, setSound } from "../active.js";
import { setSoundOn, beep } from "../sound.js";
import { extraMachines } from "../plan/plan-v2.js";
import { syncCard, getFromGithub } from "./settings-sync.js";
import { syncer } from "../syncer.js";
import { makeBackup, downloadText, BACKUP_WARN_BYTES } from "../backup.js";
import { shortcutOn, shortcutName } from "../shortcuts.js";
import { now } from "../clock.js";

const MACHINE_NAMES = { lat_pulldown: "Lat pulldown machine", seated_row: "Seated row machine", leg_curl: "Leg curl machine", pec_deck: "Pec deck", calf_raise: "Calf raise machine" };
let gymMessage = null;
let draft = null; // { dumbbells, stack, machines }

function gymCard(settings) {
  if (!draft) {
    draft = {
      dumbbells: (settings.dumbbell_steps_kg ?? []).join(", "),
      stack: settings.stack_step_kg?.default ? String(settings.stack_step_kg.default) : "",
      machines: { ...settings.extra_machines },
    };
  }
  const save = () => {
    const sizes = draft.dumbbells.split(/[\s,;]+/).filter(Boolean).map(Number);
    if (sizes.some((n) => !Number.isFinite(n) || n < 0.5 || n > 100)) { gymMessage = { kind: "error", text: "Dumbbell sizes: numbers between 0.5 and 100, like 2, 4, 6, 8." }; return rerender(); }
    const stack = draft.stack === "" ? 0 : Number(draft.stack);
    if (!Number.isFinite(stack) || stack < 0 || stack > 50) { gymMessage = { kind: "error", text: "Weight stack step: a number between 0 and 50." }; return rerender(); }
    model.updateSettings({
      dumbbell_steps_kg: [...new Set(sizes)].sort((a, b) => a - b),
      stack_step_kg: { ...settings.stack_step_kg, default: stack },
      extra_machines: { ...settings.extra_machines, ...draft.machines },
    });
    draft = null;
    gymMessage = { kind: "ok", text: "Saved on this phone." };
    rerender();
  };
  return h("div", { class: "card" },
    h("div", { class: "card-title" }, icon("dumbbell", 18), "Gym weights"),
    h("p", { class: "muted" }, "From your first visit. Until you fill this in, the app guesses 2 kg steps for dumbbells and 5 kg for machines."),
    h("div", { class: "field" }, h("label", { for: "g-db" }, "Dumbbell sizes in kg, separated by commas"),
      h("input", { type: "text", id: "g-db", inputmode: "decimal", value: draft.dumbbells, placeholder: "2, 4, 6, 8", oninput: (e) => { draft.dumbbells = e.target.value; } })),
    h("div", { class: "field" }, h("label", { for: "g-stack" }, "Smallest step on the weight stacks, in kg"),
      h("input", { type: "number", id: "g-stack", inputmode: "decimal", step: "any", min: 0, value: draft.stack, oninput: (e) => { draft.stack = e.target.value; } })),
    h("h3", { class: "group-head" }, "Extra machines (question 17)"),
    extraMachines.map((m) => h("div", { class: "field" },
      h("label", { for: `g-m-${m}` }, MACHINE_NAMES[m]),
      h("select", { id: `g-m-${m}`, onchange: (e) => { draft.machines[m] = e.target.value === "yes" ? true : e.target.value === "no" ? false : null; } },
        [["unknown", "Not checked yet"], ["yes", "The gym has it"], ["no", "The gym does not have it"]].map(([v, label]) =>
          h("option", { value: v, selected: (draft.machines[m] === true ? "yes" : draft.machines[m] === false ? "no" : "unknown") === v }, label))))),
    gymMessage ? h("div", { class: gymMessage.kind === "error" ? "error-text" : "status-success", role: "status" }, gymMessage.text) : null,
    h("button", { class: "button", type: "button", onclick: save }, "Save gym weights"));
}

// ---------- backup and restore (ARCHITECTURE section 10) ----------
const MAX_FILE_BYTES = 5 * 1024 * 1024;
let backupMessage = null; // { kind, text }

function downloadBackup() {
  try {
    const b = makeBackup(store, now());
    downloadText(b.filename, b.text);
    // On a full phone the file is still made; only the "last backup" date can not be kept (review F2).
    try { store.saveDevice({ ...store.loadDevice(), last_backup_at: new Date().toISOString() }); } catch { /* the file was made */ }
    backupMessage = { kind: "ok", text: `Backup file ${b.filename} made. On iPhone it goes to the Files app.` };
  } catch (e) {
    backupMessage = { kind: "error", text: e && e.message ? e.message : "Could not make the backup." };
  }
  rerender();
}

async function restoreFile(file) {
  if (!file) return;
  backupMessage = null;
  if (file.size > MAX_FILE_BYTES) { backupMessage = { kind: "error", text: "That file is too big to be a training backup." }; return rerender(); }
  let raw;
  try { raw = JSON.parse(await file.text()); } catch { backupMessage = { kind: "error", text: "That file is not a training backup (it can not be read as data)." }; return rerender(); }
  const result = model.restore(raw);
  backupMessage = result.ok
    ? { kind: "ok", text: result.merged ? "Restored. The file was merged into this phone: nothing was removed. A safety copy was kept." : "Restored." }
    : { kind: "error", text: result.error };
  rerender();
}

function backupCard() {
  const device = store.loadDevice();
  let bytes = 0;
  try { bytes = makeBackup(store).bytes; } catch { /* a damaged box is reported elsewhere */ }
  const last = device.last_backup_at ? new Date(device.last_backup_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "never";
  const input = h("input", { type: "file", accept: ".json,application/json", class: "no-print", hidden: true, onchange: (e) => restoreFile(e.target.files[0]) });
  return h("div", { class: "card" },
    h("div", { class: "card-title" }, icon("download", 18), "Backup and restore"),
    h("p", { class: "muted" }, `Last backup file: ${last}. The file holds your workouts and profile. It never holds your GitHub key.`),
    bytes > BACKUP_WARN_BYTES ? h("p", { class: "status-warning" }, "The data file is getting big. Tell the Training chat.") : null,
    backupMessage ? h("div", { class: backupMessage.kind === "error" ? "error-text" : "status-success", role: "status" }, backupMessage.text) : null,
    h("button", { class: "button", type: "button", onclick: downloadBackup }, icon("download", 18), "Download backup"),
    h("button", { class: "button secondary", type: "button", onclick: () => input.click() }, icon("upload", 18), "Restore from file"),
    h("button", { class: "button secondary", type: "button", disabled: !syncer.isConfigured(), onclick: getFromGithub }, icon("cloud", 18), "Restore from GitHub"),
    input,
    h("p", { class: "small muted" }, syncer.isConfigured() ? "Both restores merge into this phone. Nothing on the phone is removed, and a safety copy is kept first." : "Restore from GitHub works after you set up GitHub sync above. Restore from file merges the file into this phone; nothing is removed."));
}

// ---------- the Log to Health button (ARCHITECTURE section 9) ----------
let shortcutDraft = null;
function saveShortcut(settings, on) {
  const name = shortcutDraft.trim().slice(0, 80) || "Log Training";
  model.updateSettings({ shortcut: { ...settings.shortcut, on, name } });
  shortcutDraft = null;
  rerender();
}
function shortcutCard(settings) {
  const on = shortcutOn(settings);
  if (shortcutDraft === null) shortcutDraft = shortcutName(settings);
  return [
    group(
      switchRow({ title: "Log to Health button", sub: on ? "Button is on" : "Button is off", on, onToggle: () => saveShortcut(settings, !on), lead: iconTile("heart", "red") }),
      h("div", { class: "field-row" }, h("label", { for: "sc-name" }, "Shortcut name"),
        h("input", { type: "text", id: "sc-name", class: "wide", maxlength: 80, autocomplete: "off", value: shortcutDraft, oninput: (e) => { shortcutDraft = e.target.value; } }))),
    on ? h("button", { class: "button secondary", type: "button", onclick: () => saveShortcut(settings, true) }, "Save the name") : null,
    foot("Off by default. When on, the Saved message after a workout shows a button that runs a Shortcut you made, with the start time and the minutes. Your Apple Watch workout already logs to Health by itself, so this is optional. Try it on the phone before you rely on it."),
  ];
}

export function renderSettings() {
  const on = soundOn();
  const toggle = () => { setSound(!on); setSoundOn(!on); if (!on) beep(); rerender(); };
  const doc = model.doc();
  const ids = Object.keys(machines);
  const filled = ids.filter((id) => spotFor(doc, id)).length;
  return screen(
    navHead("Settings"),
    section("Sync", syncCard()),
    section("Backup", backupCard()),
    section("My gym",
      group(row({ title: "Machines in my gym", sub: `Where each one is: ${filled} of ${ids.length} filled in`, lead: iconTile("pin", "orange"), onclick: () => { showPlanPart("machines"); go("#/plan"); }, chevron: true })),
      gymCard(doc.shared_settings)),
    section("Body weight unit",
      segmented([["kg", "Kilograms"], ["st", "Stones, pounds"]], doc.shared_settings.body_unit ?? "kg",
        (value) => { model.updateSettings({ body_unit: value }); rerender(); }, { label: "Body weight unit" }),
      foot("How your weight is shown and typed. It is always saved in kg.")),
    section("Sound",
      group(switchRow({ title: "Timer beep", sub: on ? "Sound is on" : "Sound is off", on, onToggle: toggle, lead: iconTile("sound", "red") })),
      foot("A beep when a timer ends. It only plays with the app open and the phone\u2019s ring switch on. The screen flash always shows.")),
    section("Apple Health", shortcutCard(doc.shared_settings)));
}
