// Settings: GitHub sync, backup and restore, the Log to Health button, gym weights, body unit, Look and Animations,
// sound; first the version card with the Update button (0.7.3). Look (Auto / Light / Dark, builder C) and the Animations switch (builder D) stay on this phone only: they are
// in the device box, never synced or backed up (prefs.js). The sync card (settings-sync.js) is unchanged.
import { h } from "../h.js";
import { screen, choiceRow } from "./parts.js";
import { model, store, rerender } from "./app.js";
import { soundOn, setSound, getActive } from "../active.js";
import { setSoundOn, beep } from "../sound.js";
import { extraMachines } from "../plan/plan-v2.js";
import { syncCard, getFromGithub } from "./settings-sync.js";
import { syncer } from "../syncer.js";
import { makeBackup, downloadText, BACKUP_WARN_BYTES } from "../backup.js";
import { shortcutOn, shortcutName } from "../shortcuts.js";
import { now } from "../clock.js";
import { THEMES, currentTheme, setTheme, motionOff, setMotionOff } from "./theme.js";
import { icon } from "./icons.js";
import { APP_VERSION } from "../version.js";
import { updateNow, updateStatusWords } from "./update.js";
import { updateWords } from "../updater.js";

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
    h("h2", {}, "Gym weights"),
    h("p", { class: "muted" }, "From your first visit. Until you fill this in, the app guesses 2 kg steps for dumbbells and 5 kg for machines."),
    h("a", { class: "button secondary", href: "#/gym" }, icon("pin", 18), "Machines and where they are"),
    h("div", { class: "field" }, h("label", { for: "g-db" }, "Dumbbell sizes in kg, separated by commas"),
      h("input", { type: "text", id: "g-db", inputmode: "decimal", value: draft.dumbbells, placeholder: "2, 4, 6, 8", oninput: (e) => { draft.dumbbells = e.target.value; } })),
    h("div", { class: "field" }, h("label", { for: "g-stack" }, "Smallest step on the weight stacks, in kg"),
      h("input", { type: "number", id: "g-stack", inputmode: "decimal", step: "any", min: 0, value: draft.stack, oninput: (e) => { draft.stack = e.target.value; } })),
    h("h3", {}, "Extra machines (question 17)"),
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
  const input = h("input", { type: "file", accept: ".json,application/json", hidden: true, onchange: (e) => restoreFile(e.target.files[0]) });
  return h("div", { class: "card" },
    h("h2", {}, "Backup and restore"),
    h("p", { class: "muted" }, `Last backup file: ${last}. The file holds your workouts and profile. It never holds your GitHub key.`),
    bytes > BACKUP_WARN_BYTES ? h("p", { class: "status-warning" }, "The data file is getting big. Tell the Training chat.") : null,
    backupMessage ? h("div", { class: backupMessage.kind === "error" ? "error-text" : "status-success", role: "status" }, backupMessage.text) : null,
    h("button", { class: "button", type: "button", onclick: downloadBackup }, "Download backup"),
    h("button", { class: "button secondary", type: "button", onclick: () => input.click() }, "Restore from file"),
    h("button", { class: "button secondary", type: "button", disabled: !syncer.isConfigured(), onclick: getFromGithub }, "Restore from GitHub"),
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
  return h("div", { class: "card" },
    h("h2", {}, "Log to Health button"),
    h("p", { class: "muted" }, "Off by default. When on, the Saved message after a workout shows a button that runs a Shortcut you made, with the start time and the minutes. Your Apple Watch workout already logs to Health by itself, so this is optional. Try it on the phone before you rely on it."),
    h("div", { class: "field" }, h("label", { for: "sc-name" }, "Name of your Shortcut"),
      h("input", { type: "text", id: "sc-name", maxlength: 80, autocomplete: "off", value: shortcutDraft, oninput: (e) => { shortcutDraft = e.target.value; } })),
    h("button", { class: "choice", type: "button", "aria-pressed": on ? "true" : "false", onclick: () => saveShortcut(settings, !on) }, on ? "Button is on" : "Button is off"),
    on ? h("button", { class: "button secondary", type: "button", onclick: () => saveShortcut(settings, true) }, "Save the name") : null);
}

// Look and Animations, in one card. The switch is a real switch for screen readers (role="switch").
// Auto / Light / Dark: applied at once and marked in place, with no redraw, so the screen does not jump to the top.
function markPicked(row, value) {
  [...row.children].forEach((b, i) => b.setAttribute("aria-pressed", THEMES[i][0] === value ? "true" : "false"));
}
function lookCard() {
  const off = motionOff();
  const themeRow = choiceRow(THEMES, currentTheme(), (value) => { setTheme(value); markPicked(themeRow, value); });
  return h("div", { class: "card" },
    h("h2", {}, "Look"),
    h("p", { class: "muted" }, "Auto follows the phone. Dark is easiest on the eyes in the gym."),
    themeRow,
    h("div", { class: "switch-row" },
      h("span", { class: "grow" }, h("b", { id: "anim-label" }, "Animations"),
        h("span", { class: "small muted" }, off ? "Off: screens and photos stay still. Tap a photo to see the end position." : "On: short movements and moving photos. The phone's Reduce Motion also turns them off.")),
      h("button", { class: "switch", type: "button", role: "switch", "aria-checked": off ? "false" : "true", "aria-labelledby": "anim-label", onclick: () => { setMotionOff(!off); rerender(); } }, h("span", { class: "knob" }))),
    h("p", { class: "small muted" }, "These two choices stay on this phone only."));
}

export function renderSettings() {
  const on = soundOn();
  const toggle = () => { setSound(!on); setSoundOn(!on); if (!on) beep(); rerender(); };
  const doc = model.doc();
  return screen(
    // Back to where Settings was opened from (Progress or Today); straight to Today when opened on its own.
    h("a", { class: "text-button back-link", href: "#/today", onclick: (e) => { if (history.length > 1) { e.preventDefault(); history.back(); } } }, icon("back", 18), "Back"),
    h("span", { class: "eyebrow accent" }, "This phone and GitHub"),
    h("h1", {}, "Settings"),
    versionCard(),
    syncCard(),
    backupCard(),
    gymCard(doc.shared_settings),
    h("div", { class: "card" },
      h("h2", {}, "Body weight unit"),
      h("p", { class: "muted" }, "How your weight is shown and typed. It is always saved in kg."),
      choiceRow([["kg", "Kilograms"], ["st", "Stones, pounds"]], doc.shared_settings.body_unit ?? "kg",
        (value) => { model.updateSettings({ body_unit: value }); rerender(); })),
    shortcutCard(doc.shared_settings),
    lookCard(),
    h("div", { class: "card" },
      h("h2", {}, "Sound"),
      h("p", { class: "muted" }, "A beep when a timer ends. It only plays with the app open and the phone's ring switch on. The screen flash always shows."),
      h("button", { class: "choice", type: "button", "aria-pressed": on ? "true" : "false", onclick: toggle }, on ? "Sound is on" : "Sound is off")));
}

// First card (Rosario, 2026-11-18): which version this phone runs, and Update, which gets the newest version now.
// Off while a workout runs. The words under it say what the last tap found (updater.js).
function versionCard() {
  const inWorkout = getActive() !== null;
  const words = inWorkout ? updateWords("workout") : updateStatusWords();
  return h("div", { class: "card version-card" },
    h("div", { class: "version-row" },
      h("p", { class: "version-line" }, `Version ${APP_VERSION}`),
      h("button", { class: "button version-button", type: "button", disabled: inWorkout, onclick: () => updateNow() }, "Update")),
    words ? h("p", { class: "small muted", role: "status" }, words) : null);
}
