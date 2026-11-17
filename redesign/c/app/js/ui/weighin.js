// Weigh-in: one number, under 10 seconds. Measurements (waist, chest, arm, thigh) every 4 weeks.
import { h } from "../h.js";
import { flowScreen, actionBar, mainButton, stepper, icon, stat, sparkline } from "./parts.js";
import { model, go, rerender } from "./app.js";
import { today } from "../clock.js";
import { activeWeighins } from "../engine/trend.js";
import { kgToStonesPounds, stonesPoundsToKg } from "../engine/nutrition.js";
import { formatBody } from "./units.js";

let draft = null; // { date, kg }
let measure = { waist_cm: "", chest_cm: "", arm_cm: "", thigh_cm: "" };
let message = null;

export function renderWeighin() {
  const doc = model.doc();
  const unit = doc.shared_settings.body_unit ?? "kg";
  const list = activeWeighins(doc.weighins);
  const last = list[list.length - 1];
  if (!draft) draft = { date: today(), kg: last ? last.kg : doc.profile.intake.q24_weight_kg };
  const existing = list.find((w) => w.date === draft.date);

  const save = () => {
    if (!(draft.kg >= 20 && draft.kg <= 400)) { message = { kind: "error", text: "Enter a weight between 20 and 400 kg." }; return rerender(); }
    model.setWeighin(draft.date, Math.round(draft.kg * 10) / 10);
    draft = null; message = null;
    go("#/progress");
  };
  const remove = () => { model.deleteWeighin(draft.date); message = { kind: "ok", text: "Weigh-in deleted." }; rerender(); };
  const saveMeasure = () => {
    const vals = {};
    for (const [k, v] of Object.entries(measure)) vals[k] = v === "" ? null : Number(v);
    if (Object.values(vals).every((v) => v === null)) { message = { kind: "error", text: "Type at least one measurement." }; return rerender(); }
    if (Object.values(vals).some((v) => v !== null && !(v >= 10 && v <= 300))) { message = { kind: "error", text: "Measurements are in cm, between 10 and 300." }; return rerender(); }
    model.addMeasurement(draft.date, vals);
    measure = { waist_cm: "", chest_cm: "", arm_cm: "", thigh_cm: "" };
    message = { kind: "ok", text: "Measurements saved." };
    rerender();
  };

  let input;
  if (unit === "st") {
    const sp = kgToStonesPounds(draft.kg);
    const state = { st: sp.stones, lb: sp.pounds };
    const upd = () => { draft.kg = stonesPoundsToKg(state.st, state.lb); };
    input = h("div", { class: "editor" },
      stepper({ label: "Stones", unit: "st", value: state.st, step: 1, min: 3, max: 60, decimals: 0, onChange: (v) => { state.st = v; upd(); } }),
      stepper({ label: "Pounds", unit: "lb", value: state.lb, step: 0.2, min: 0, max: 13.9, decimals: 1, onChange: (v) => { state.lb = v; upd(); } }));
  } else {
    input = h("div", { class: "editor one big" }, stepper({ label: "Weight", unit: "kg", value: Math.round(draft.kg * 10) / 10, step: 0.1, min: 20, max: 400, decimals: 1, onChange: (v) => { draft.kg = v; } }));
  }

  const num = (key, label) => h("div", { class: "field" }, h("label", { for: `m-${key}` }, label),
    h("input", { type: "number", id: `m-${key}`, inputmode: "decimal", step: "any", min: 10, max: 300, value: measure[key], oninput: (e) => { measure[key] = e.target.value; } }));

  const recent = list.slice(-14).map((w) => w.kg);
  const main = flowScreen(
      h("a", { href: "#/progress", class: "text-button back", onclick: () => { draft = null; message = null; } }, icon("back", "sm"), "Back"),
      h("div", { class: "eyebrow" }, "Body"),
      h("h1", {}, "Weigh-in"),
      last ? h("div", { class: "stats two" },
        stat("Last time", formatBody(last.kg, unit), null, { d: last.date }),
        stat("Last 2 weeks", String(recent.length), "weigh-ins", { spark: sparkline(recent, { w: 120, h: 24, area: true }) })) : null,
      h("p", { class: "muted small" }, "After the toilet, before food and drink, in light clothes."),
      h("div", { class: "field" }, h("label", { for: "w-date" }, "Date"),
        h("input", { type: "date", id: "w-date", value: draft.date, max: today(), onchange: (e) => { if (e.target.value) { draft.date = e.target.value; rerender(); } } })),
      existing ? h("p", { class: "small status-warning" }, `You already weighed in on this day: ${formatBody(existing.kg, unit)}. Saving replaces it.`) : null,
      input,
      message ? h("div", { class: message.kind === "error" ? "error-text" : "status-success", role: "status" }, message.text) : null,
      existing ? h("div", { class: "text-link-row" }, h("button", { class: "text-button", type: "button", onclick: remove }, "Delete this weigh-in")) : null,
      h("div", { class: "card" },
        h("h2", {}, "Measurements (every 4 weeks)"),
        h("p", { class: "small muted" }, "In cm. Waist at the belly button. Same time and same way each time."),
        num("waist_cm", "Waist (cm)"), num("chest_cm", "Chest (cm)"), num("arm_cm", "Upper arm (cm)"), num("thigh_cm", "Thigh (cm)"),
        h("button", { class: "button secondary", type: "button", onclick: saveMeasure }, "Save measurements")));
  main.dataset.key = "weighin";
  return [main, actionBar(mainButton("Save weigh-in", save, { ic: "check" }))];
}
