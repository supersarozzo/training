// Settings: GitHub sync, gym weights, body unit, sound. (Backup, restore and the Shortcuts button: build step 10.)
import { h } from "../h.js";
import { screen, choiceRow } from "./parts.js";
import { model, rerender } from "./app.js";
import { soundOn, setSound } from "../active.js";
import { setSoundOn, beep } from "../sound.js";
import { extraMachines } from "../plan/plan-v2.js";
import { syncCard } from "./settings-sync.js";

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

export function renderSettings() {
  const on = soundOn();
  const toggle = () => { setSound(!on); setSoundOn(!on); if (!on) beep(); rerender(); };
  const doc = model.doc();
  return screen(
    h("h1", {}, "Settings"),
    syncCard(),
    gymCard(doc.shared_settings),
    h("div", { class: "card" },
      h("h2", {}, "Body weight unit"),
      h("p", { class: "muted" }, "How your weight is shown and typed. It is always saved in kg."),
      choiceRow([["kg", "Kilograms"], ["st", "Stones, pounds"]], doc.shared_settings.body_unit ?? "kg",
        (value) => { model.updateSettings({ body_unit: value }); rerender(); })),
    h("div", { class: "card" },
      h("h2", {}, "Sound"),
      h("p", { class: "muted" }, "A beep when a timer ends. It only plays with the app open and the phone's ring switch on. The screen flash always shows."),
      h("button", { class: "choice", type: "button", "aria-pressed": on ? "true" : "false", onclick: toggle }, on ? "Sound is on" : "Sound is off")));
}
