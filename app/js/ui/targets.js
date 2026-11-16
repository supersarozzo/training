// Targets: shows the numbers the formulas give. Rosario confirms or changes them.
import { h } from "../h.js";
import { flowScreen, actionBar, mainButton, secondaryButton } from "./parts.js";
import { model, go, rerender } from "./app.js";
import { computeTargets, safetyCheck } from "../engine/nutrition.js";

const GOAL_TEXT = { bulk: "Gain slowly while building muscle", recomp: "Stay about the same while building muscle", cut: "Lose fat slowly while building muscle" };

let editing = false;
let edit = null; // { kcal, protein_g, speed_kmh, slope_pct }
let problems = [];

function metric(label, value, unit, note) {
  return h("div", { class: "metric" },
    h("div", { class: "label" }, label),
    h("div", { class: "value" }, String(value), unit ? h("span", { class: "unit" }, ` ${unit}`) : null),
    note ? h("div", { class: "small muted" }, note) : null);
}

function numInput(key, label, { min, max, step }) {
  return h("div", { class: "field" },
    h("label", { for: `t-${key}` }, label),
    h("input", { type: "number", id: `t-${key}`, inputmode: "decimal", min, max, step, value: edit[key] ?? "",
      oninput: (e) => { edit[key] = e.target.value === "" ? null : Number(e.target.value); } }));
}

export function renderTargets() {
  const doc = model.doc();
  const profile = doc.profile;
  if (!profile) { go("#/setup"); return h("main", { class: "screen" }); }
  const intake = profile.intake;
  const computed = computeTargets(intake);
  const shown = profile.targets ?? computed;

  const showKcal = shown.kcal !== null;
  const showProtein = shown.protein_g !== null;

  const confirmComputed = () => {
    const { suggested_goal, notes, ...stored } = computed;
    model.setTargets(stored);
    go("#/today");
  };
  const startEdit = () => {
    editing = true; problems = [];
    edit = { kcal: shown.kcal, protein_g: shown.protein_g, speed_kmh: shown.walk_start.speed_kmh, slope_pct: shown.walk_start.slope_pct };
    rerender();
  };
  const saveEdit = () => {
    problems = [];
    const ranges = [["speed_kmh", 2, 8, "walk speed"], ["slope_pct", 0, 15, "walk slope"]];
    if (showKcal) ranges.push(["kcal", 800, 6000, "calories"]);
    if (showProtein) ranges.push(["protein_g", 20, 400, "protein"]);
    for (const [k, lo, hi, name] of ranges) {
      if (edit[k] === null || Number.isNaN(edit[k]) || edit[k] < lo || edit[k] > hi) problems.push(`Enter ${name} between ${lo} and ${hi}.`);
    }
    if (!problems.length && edit.kcal !== null && computed.maintenance_kcal) {
      const check = safetyCheck({ kcal: edit.kcal, maintenanceKcal: computed.maintenance_kcal, kg: intake.q24_weight_kg, sex: intake.q22_sex });
      problems.push(...check.problems);
    }
    if (problems.length) return rerender();
    const { suggested_goal, notes, ...base } = computed;
    model.setTargets({ ...base, kcal: edit.kcal, protein_g: edit.protein_g, source: "manual", walk_start: { speed_kmh: edit.speed_kmh, slope_pct: edit.slope_pct } });
    editing = false;
    go("#/today");
  };

  const body = editing
    ? [
      h("h1", {}, "Change your numbers"),
      showKcal ? numInput("kcal", "Calories a day", { min: 800, max: 6000, step: 50 }) : null,
      showProtein ? numInput("protein_g", "Protein a day (g)", { min: 20, max: 400, step: 5 }) : null,
      numInput("speed_kmh", "Starting walk speed (km/h)", { min: 2, max: 8, step: 0.1 }),
      numInput("slope_pct", "Starting walk slope (%)", { min: 0, max: 15, step: 1 }),
      ...problems.map((p) => h("p", { class: "error-text", role: "alert" }, p)),
    ]
    : [
      h("h1", {}, "Your numbers"),
      h("p", { class: "muted" }, "The app worked these out from your answers. They are a first guess. Your weigh-ins correct them after about 3 weeks."),
      h("div", { class: "card" },
        h("div", { class: "label" }, "Goal"),
        h("div", { class: "value" }, GOAL_TEXT[shown.goal] ?? shown.goal),
        computed.suggested_goal && intake.q26_goal === "suggest" ? h("p", { class: "small muted" }, "Suggested from your BMI and waist. You can change it by asking the Training chat.") : null),
      h("div", { class: "card" },
        showKcal ? metric("Calories a day", shown.kcal, "kcal") : null,
        showProtein ? metric("Protein a day", shown.protein_g, "g", "Split over 3 to 5 meals.") : null,
        !showKcal && !showProtein ? h("p", { class: "muted" }, "No food numbers (your choice).") : null,
        metric("Starting walk", `${shown.walk_start.speed_kmh} km/h, ${shown.walk_start.slope_pct} % slope`, null, "Leg days (Tuesday, Friday): 2 % less slope.")),
      ...computed.notes.map((n) => h("p", { class: "small status-warning" }, n)),
      h("p", { class: "small muted" }, "General guidance, not medical advice."),
    ];

  const buttons = editing
    ? [mainButton("Save my numbers", saveEdit), secondaryButton("Cancel", () => { editing = false; rerender(); })]
    : [mainButton(profile.targets ? "Keep these" : "Looks right", profile.targets ? () => go("#/today") : confirmComputed), secondaryButton("Change numbers", startEdit)];

  return flowScreen(...body, actionBar(...buttons));
}
