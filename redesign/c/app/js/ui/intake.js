// Intake: one question per page (WORKFLOW section A, questions 20 to 38). Defaults are the recommended answers.
// The answers are saved only at the end, in the shape of docs/ARCHITECTURE.md section 4.2.
import { h } from "../h.js";
import { flowScreen, actionBar, mainButton, secondaryButton, progressBar } from "./parts.js";
import { model, go, rerender } from "./app.js";
import { stonesPoundsToKg } from "../engine/nutrition.js";

let draft = null;

function freshDraft() {
  return {
    step: 0,
    a: {
      q20_choice: null, q21_age: null, q22_sex: null, q23_height_cm: null, q25_unit: "kg",
      q24_weight_kg: null, weight_st: null, weight_lb: null,
      q26_goal: "suggest", q27_choice: "none", q27_goal_weight_kg: null,
      q28_choice: "measure", q28_waist_cm: null,
      q29_focus: "balanced", q30_activity: null, q31_sleep_h: null,
      q32_food: "protein", q33_choice: "no_limits", q33_other: "",
      q34_scale: true, q35_walk: "before", q36_walk_fit: null,
      q37_text: "", q38_photos: true,
    },
  };
}
export function resetDraft() { draft = freshDraft(); }

// ---------- field helpers ----------
function choiceField(key, options, onChange) {
  const a = draft.a;
  return h("div", { class: "choices", role: "group" },
    options.map(([value, label, note]) =>
      h("button", {
        class: "choice", type: "button", "aria-pressed": a[key] === value ? "true" : "false",
        onclick: () => { a[key] = value; if (onChange) onChange(value); rerender(); },
      }, h("span", {}, label, note ? h("span", { class: "small muted" }, h("br", {}), note) : null))));
}

function numberField(key, label, { unit, min, max, step = "any", mode = "decimal" } = {}) {
  const a = draft.a;
  const input = h("input", {
    type: "number", id: `f-${key}`, inputmode: mode, step, min, max, value: a[key] ?? "",
    oninput: (e) => { a[key] = e.target.value === "" ? null : Number(e.target.value); },
    "aria-describedby": `d-${key}`,
  });
  return h("div", { class: "field" }, h("label", { for: `f-${key}` }, unit ? `${label} (${unit})` : label), input);
}

const rangeError = (v, min, max, what) =>
  v === null || v === undefined || Number.isNaN(v) ? `Enter ${what}.` : v < min || v > max ? `${what[0].toUpperCase()}${what.slice(1)} must be between ${min} and ${max}.` : null;

// ---------- the questions ----------
// Each: title, help, view() -> elements, check() -> error text or null.
const QUESTIONS = [
  {
    title: "Health check",
    help: "The PAR-Q+ is a free 7-question health form. Do it once at eparmedx.com. It is not copied here.",
    view: () => [
      h("p", { class: "small" }, h("a", { href: "https://eparmedx.com/", target: "_blank", rel: "noopener noreferrer" }, "Open the PAR-Q+ form")),
      choiceField("q20_choice", [
        ["all_no", "I did the PAR-Q+ and all answers were no"],
        ["yes_ok", "I had a yes, and a doctor or exercise professional said I can train"],
        ["yes_wait", "I had a yes and I have not asked yet"],
      ]),
      draft.a.q20_choice === "yes_wait" ? h("div", { class: "card warn" }, h("p", {}, "Talk to a doctor or a qualified exercise professional first. Come back when they say you can train.")) : null,
    ],
    check: (a) => (a.q20_choice === null ? "Choose one." : a.q20_choice === "yes_wait" ? "Talk to a doctor first. Come back when they say you can train." : null),
  },
  {
    title: "Your age",
    view: () => [numberField("q21_age", "Age", { unit: "years", min: 16, max: 90, mode: "numeric", step: 1 }),
      draft.a.q21_age >= 65 ? h("p", { class: "small muted" }, "Safety note: start light and ask staff to show you each machine.") : null],
    check: (a) => (a.q21_age !== null && a.q21_age < 16 ? "The app is for people 16 and over." : rangeError(a.q21_age, 16, 90, "your age")),
  },
  {
    title: "Sex used for body formulas",
    help: "The calorie formula and waist limits differ for men and women.",
    view: () => [choiceField("q22_sex", [["male", "Male"], ["female", "Female"], ["unspecified", "Prefer not to say", "The app uses the average and says so."]])],
    check: (a) => (a.q22_sex === null ? "Choose one." : null),
  },
  {
    title: "Your height",
    view: () => [numberField("q23_height_cm", "Height", { unit: "cm", min: 120, max: 230, mode: "numeric", step: 1 })],
    check: (a) => rangeError(a.q23_height_cm, 120, 230, "your height"),
  },
  {
    title: "Unit for body weight",
    help: "Gym weights always stay in kg.",
    view: () => [choiceField("q25_unit", [["kg", "kg"], ["st", "Stones and pounds"]])],
    check: () => null,
  },
  {
    title: "Your body weight now",
    help: "Weigh in the morning, after the toilet, before food.",
    view: () => draft.a.q25_unit === "st"
      ? [numberField("weight_st", "Stones", { unit: "st", min: 5, max: 40, mode: "numeric", step: 1 }), numberField("weight_lb", "Pounds", { unit: "lb", min: 0, max: 13.9, step: "any" })]
      : [numberField("q24_weight_kg", "Body weight", { unit: "kg", min: 35, max: 250 })],
    check: (a) => {
      if (a.q25_unit === "st") {
        if (a.weight_st === null) return "Enter your stones.";
        const kg = stonesPoundsToKg(a.weight_st, a.weight_lb ?? 0);
        a.q24_weight_kg = kg;
      }
      return rangeError(a.q24_weight_kg, 35, 250, "your weight");
    },
  },
  {
    title: "Weight goal",
    view: () => [choiceField("q26_goal", [
      ["suggest", "Not sure: the app suggests one", "From your BMI and waist."],
      ["bulk", "Gain slowly (lean bulk)"],
      ["recomp", "Stay about the same (recomp)"],
      ["cut", "Lose fat slowly (cut)"],
    ])],
    check: () => null,
  },
  {
    title: "Goal weight (optional)",
    help: "It must stay in a healthy BMI range (18.5 to 30).",
    view: () => [
      choiceField("q27_choice", [["none", "No target for the first 12 weeks"], ["number", "I have a goal weight"]]),
      draft.a.q27_choice === "number" ? numberField("q27_goal_weight_kg", "Goal weight", { unit: "kg", min: 35, max: 250 }) : null,
    ],
    check: (a) => {
      if (a.q27_choice === "none") return null;
      const err = rangeError(a.q27_goal_weight_kg, 35, 250, "your goal weight");
      if (err) return err;
      const m = a.q23_height_cm / 100;
      const lo = Math.ceil(18.5 * m * m), hi = Math.floor(30 * m * m);
      return a.q27_goal_weight_kg < lo || a.q27_goal_weight_kg > hi ? `Pick a goal weight between ${lo} and ${hi} kg for your height.` : null;
    },
  },
  {
    title: "Waist at the belly button (optional)",
    help: "It tells fat from muscle better than BMI.",
    view: () => [
      choiceField("q28_choice", [["measure", "Yes, I measured it"], ["skip", "Skip"]]),
      draft.a.q28_choice === "measure" ? numberField("q28_waist_cm", "Waist", { unit: "cm", min: 50, max: 200 }) : null,
    ],
    check: (a) => (a.q28_choice === "skip" ? null : rangeError(a.q28_waist_cm, 50, 200, "your waist")),
  },
  {
    title: "Muscle area to focus on",
    view: () => [choiceField("q29_focus", [["balanced", "Balanced"], ["arms", "Arms"], ["chest", "Chest"], ["back", "Back"], ["shoulders", "Shoulders"], ["legs", "Legs and glutes"]])],
    check: () => null,
  },
  {
    title: "Activity outside the gym",
    help: "Your job and walking.",
    view: () => [choiceField("q30_activity", [["a", "Mostly sitting"], ["b", "On my feet some of the day"], ["c", "On my feet most of the day"], ["d", "Physical job"]])],
    check: (a) => (a.q30_activity === null ? "Choose one." : null),
  },
  {
    title: "Sleep on a normal night",
    help: "Under 6 hours: effort stays a little easier.",
    view: () => [numberField("q31_sleep_h", "Sleep", { unit: "hours", min: 3, max: 12 })],
    check: (a) => rangeError(a.q31_sleep_h, 3, 12, "your sleep hours"),
  },
  {
    title: "What should the app do about food?",
    view: () => [choiceField("q32_food", [["targets", "Calorie and protein targets"], ["protein", "Protein target only"], ["none", "Nothing about food"]])],
    check: () => null,
  },
  {
    title: "Diet style",
    help: "It changes food ideas, not the targets.",
    view: () => [
      choiceField("q33_choice", [["no_limits", "No limits"], ["vegetarian", "Vegetarian"], ["vegan", "Vegan"], ["other", "Other"]]),
      draft.a.q33_choice === "other"
        ? h("div", { class: "field" }, h("label", { for: "f-q33" }, "Describe it (stays on this phone)"),
          h("input", { type: "text", id: "f-q33", maxlength: 100, value: draft.a.q33_other, oninput: (e) => { draft.a.q33_other = e.target.value; } }))
        : null,
    ],
    check: () => null,
  },
  {
    title: "Scale at home?",
    help: "With a scale: weigh every morning. Without: once a week on the gym scale.",
    view: () => [choiceField("q34_scale", [[true, "Yes"], [false, "No"]])],
    check: () => null,
  },
  {
    title: "Where does the 30-minute walk go?",
    help: "Version 1 builds the walk-first layout only. Other answers are saved for later.",
    view: () => [choiceField("q35_walk", [["before", "Before the weights"], ["after", "After the weights"], ["split", "15 minutes before and 15 after"], ["other", "At another time of day"]])],
    check: () => null,
  },
  {
    title: "Can you walk fast for 30 minutes without stopping today?",
    help: "It sets your starting speed and slope.",
    view: () => [choiceField("q36_walk_fit", [["yes", "Yes"], ["not_sure", "Not sure"], ["no", "No"]])],
    check: (a) => (a.q36_walk_fit === null ? "Choose one." : null),
  },
  {
    title: "Exercises you do not want (optional)",
    help: "Separate them with commas. Leave it empty for none.",
    view: () => [h("div", { class: "field" }, h("label", { for: "f-q37" }, "Exercises to avoid"),
      h("input", { type: "text", id: "f-q37", maxlength: 300, value: draft.a.q37_text, oninput: (e) => { draft.a.q37_text = e.target.value; } }))],
    check: () => null,
  },
  {
    title: "Progress photos every 4 weeks?",
    help: "Photos stay only in your phone's Photos app. Never synced, never in GitHub.",
    view: () => [choiceField("q38_photos", [[true, "Yes, kept only in the Photos app"], [false, "No"]])],
    check: () => null,
  },
];

// Turn the draft into the stored intake shape.
export function buildIntake(a) {
  const avoid = a.q37_text.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 50);
  return {
    q20_parq_all_no: a.q20_choice === "all_no",
    q20_doctor_ok: a.q20_choice === "yes_ok" ? true : undefined,
    q21_age: a.q21_age,
    q22_sex: a.q22_sex,
    q23_height_cm: a.q23_height_cm,
    q24_weight_kg: a.q24_weight_kg,
    q25_unit: a.q25_unit,
    q26_goal: a.q26_goal,
    q27_goal_weight_kg: a.q27_choice === "number" ? a.q27_goal_weight_kg : null,
    q28_waist_cm: a.q28_choice === "measure" ? a.q28_waist_cm : null,
    q29_focus: a.q29_focus,
    q30_activity: a.q30_activity,
    q31_sleep_h: a.q31_sleep_h,
    q32_food: a.q32_food,
    q33_diet: a.q33_choice === "other" ? a.q33_other.slice(0, 100) : a.q33_choice,
    q34_scale: a.q34_scale,
    q35_walk: a.q35_walk,
    q36_walk_fit: a.q36_walk_fit,
    q37_avoid: avoid,
    q38_photos: a.q38_photos,
  };
}

let errorText = null;

export function renderIntake() {
  if (!draft) resetDraft();
  const q = QUESTIONS[draft.step];
  const last = draft.step === QUESTIONS.length - 1;

  const next = () => {
    const err = q.check(draft.a);
    if (err) { errorText = err; return rerender(); }
    errorText = null;
    if (last) {
      model.setProfile(buildIntake(draft.a));
      draft = null;
      return go("#/targets");
    }
    draft.step += 1;
    rerender();
  };
  const back = () => {
    errorText = null;
    if (draft.step === 0) return go("#/setup");
    draft.step -= 1;
    rerender();
  };

  return flowScreen(
    h("div", { class: "intake-top" },
      h("div", { class: "progress-line" }, `Question ${draft.step + 1} of ${QUESTIONS.length}`),
      progressBar((draft.step + 1) / QUESTIONS.length)),
    h("h1", {}, q.title),
    q.help ? h("p", { class: "muted" }, q.help) : null,
    ...q.view(),
    errorText ? h("p", { class: "error-text", role: "alert" }, errorText) : null,
    actionBar(mainButton(last ? "Finish" : "Next", next), secondaryButton("Back", back)));
}

