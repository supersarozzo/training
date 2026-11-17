// Targets: shows the numbers the formulas give. Rosario confirms or changes them.
// Redesign B: the goal as a card, the numbers as tiles (kcal orange, protein green, walk cyan), notes as warning lines.
import { h } from "../h.js";
import { flowScreen, actionBar, mainButton, secondaryButton, tile, section, group, foot } from "./parts.js";
import { icon } from "./icons.js";
import { model, go, rerender } from "./app.js";
import { computeTargets, safetyCheck } from "../engine/nutrition.js";

const GOAL_TEXT = { bulk: "Gain slowly while building muscle", recomp: "Stay about the same while building muscle", cut: "Lose fat slowly while building muscle" };

let editing = false;
let edit = null; // { kcal, protein_g, speed_kmh, slope_pct }
let problems = [];

function numInput(key, label, unit, { min, max, step }) {
  return h("div", { class: "field-row" },
    h("label", { for: `t-${key}` }, label),
    h("input", { type: "number", id: `t-${key}`, inputmode: "decimal", min, max, step, value: edit[key] ?? "",
      oninput: (e) => { edit[key] = e.target.value === "" ? null : Number(e.target.value); } }),
    h("span", { class: "unit" }, unit));
}

export function renderTargets() {
  const doc = model.doc();
  const profile = doc.profile;
  if (!profile) { go("#/setup"); return h("main", { class: "screen" }); }
  const intake = profile.intake;
  const computed = computeTargets(intake);
  // A restored file may have targets without a walk start (review F4): show the computed one then.
  const shown = profile.targets ? { ...profile.targets, walk_start: profile.targets.walk_start ?? computed.walk_start } : computed;

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
      h("h1", { class: "title1" }, "Change your numbers"),
      section(null,
        group(
          showKcal ? numInput("kcal", "Calories a day", "kcal", { min: 800, max: 6000, step: 50 }) : null,
          showProtein ? numInput("protein_g", "Protein a day", "g", { min: 20, max: 400, step: 5 }) : null,
          numInput("speed_kmh", "Starting walk speed", "km/h", { min: 2, max: 8, step: 0.1 }),
          numInput("slope_pct", "Starting walk slope", "%", { min: 0, max: 15, step: 1 }))),
      ...problems.map((p) => h("p", { class: "error-text", role: "alert" }, p)),
    ]
    : [
      h("p", { class: "eyebrow" }, "From your answers"),
      h("h1", { class: "title1" }, "Your numbers"),
      h("p", { class: "subhead muted" }, "The app worked these out from your answers. They are a first guess. Your weigh-ins correct them after about 3 weeks."),
      h("div", { class: "card info" },
        h("p", { class: "eyebrow" }, "Goal"),
        h("div", { class: "headline" }, GOAL_TEXT[shown.goal] ?? shown.goal),
        computed.suggested_goal && intake.q26_goal === "suggest" ? h("p", { class: "small muted" }, "Suggested from your BMI and waist. You can change it by asking the Training chat.") : null),
      showKcal || showProtein
        ? h("div", { class: "tiles" },
          showKcal ? tile({ label: "Calories a day", value: String(shown.kcal), unit: "kcal", color: "orange", iconName: "flame" }) : null,
          showProtein ? tile({ label: "Protein a day", value: String(shown.protein_g), unit: "g", note: "Split over 3 to 5 meals.", color: "green", iconName: "food" }) : null)
        : h("p", { class: "muted" }, "No food numbers (your choice)."),
      h("div", { class: "tiles" },
        tile({ label: "Walk speed", value: String(shown.walk_start.speed_kmh), unit: "km/h", color: "cardio", iconName: "walk" }),
        tile({ label: "Walk slope", value: String(shown.walk_start.slope_pct), unit: "%", note: "Leg days (Tuesday, Friday): 2 % less slope.", color: "cardio", iconName: "progress" })),
      ...computed.notes.map((n) => h("div", { class: "info-line warn" }, icon("info", 17), h("span", {}, n))),
      foot("General guidance, not medical advice."),
    ];

  const buttons = editing
    ? [mainButton("Save my numbers", saveEdit), secondaryButton("Cancel", () => { editing = false; rerender(); })]
    : [mainButton(profile.targets ? "Keep these" : "Looks right", profile.targets ? () => go("#/today") : confirmComputed), secondaryButton("Change numbers", startEdit)];

  const main = flowScreen(...body);
  main.classList.add("two-buttons");
  return [main, actionBar(...buttons)];
}
