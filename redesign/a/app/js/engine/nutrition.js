// Calories, protein and safety limits. Pure. Formulas only, no personal numbers.
// Source: plan v2 section 12, WORKFLOW B4, DECISIONS ("Calorie method").
// intake keys are the ones in docs/ARCHITECTURE.md section 4.2 (q21_age, q22_sex, ...).
import { startWalk, walkMets } from "./walk.js";

export const KCAL_PER_KG = 7700; // energy in 1 kg of body weight change (rough rule)
export const ACTIVITY_FACTOR = { a: 1.2, b: 1.3, c: 1.4, d: 1.5 };
export const CLASSIC_FACTOR = 1.55; // "exercise 3 to 5 days a week", used as a cross-check
export const KCAL_FLOOR = { male: 1500, female: 1200, unspecified: 1500 };
export const MAX_LOSS_PCT_PER_WEEK = 1;
export const MAX_GAIN_PCT_PER_WEEK = 0.5;

// Gym energy: the walk at the starting settings for 27 of its 30 minutes (3 are the build-up),
// and about 50 minutes of weights and abs at 2.5 METs above sitting. Averaged over 7 days, 5 sessions.
export const GYM = { sessions: 5, walkMinutes: 27, weightsMinutes: 50, weightsNetMets: 2.5 };

const round = (n, step = 1) => Math.round(n / step) * step;

export function bmi(kg, cm) {
  const m = cm / 100;
  return kg / (m * m);
}

// Mifflin-St Jeor. "unspecified" uses the average of the male and female constants.
export function bmr({ sex, kg, cm, age }) {
  const constant = sex === "male" ? 5 : sex === "female" ? -161 : (5 - 161) / 2;
  return 10 * kg + 6.25 * cm - 5 * age + constant;
}

export function gymKcalPerDay(kg, walk) {
  const walkKcal = walkMets(walk.speed_kmh, walk.slope_pct) * kg * (GYM.walkMinutes / 60);
  const weightsKcal = GYM.weightsNetMets * kg * (GYM.weightsMinutes / 60);
  return ((walkKcal + weightsKcal) * GYM.sessions) / 7;
}

// Maintenance: way A (daily life + gym) and way B (classic 1.55), averaged, rounded to 100.
export function maintenance(intake, walk) {
  const base = bmr({ sex: intake.q22_sex, kg: intake.q24_weight_kg, cm: intake.q23_height_cm, age: intake.q21_age });
  const factor = ACTIVITY_FACTOR[intake.q30_activity];
  if (!factor) throw new Error("Unknown activity answer");
  const wayA = base * factor + gymKcalPerDay(intake.q24_weight_kg, walk);
  const wayB = base * CLASSIC_FACTOR;
  return { bmr: base, wayA, wayB, kcal: round((wayA + wayB) / 2, 100) };
}

// "Not sure" (question 26 d): suggest a goal from BMI and waist (WORKFLOW B4).
export function suggestGoal({ bmi: b, waist_cm, sex }) {
  const waistLimit = sex === "female" ? 80 : sex === "male" ? 94 : 87;
  if (b < 20) return "bulk";
  if (b > 27 || (waist_cm != null && waist_cm > waistLimit)) return "cut";
  return "recomp";
}

// Protein: bulk and recomp 1.6-2.2 g per kg (middle 1.9), cut 2.0-2.4 (middle 2.2).
// If BMI is over 30, use the weight at BMI 25 for the height. Rounded to 10 g.
export function proteinTarget({ goal, kg, cm }) {
  const refKg = bmi(kg, cm) > 30 ? 25 * (cm / 100) ** 2 : kg;
  const perKg = goal === "cut" ? 2.2 : 1.9;
  return round(refKg * perKg, 10);
}

// Daily calories for the goal. Rounded to 50.
export function kcalForGoal({ goal, maintenanceKcal, kg }) {
  if (goal === "bulk") return round(maintenanceKcal + Math.min(Math.max(maintenanceKcal * 0.1, 200), 300), 50);
  if (goal === "cut") {
    // Deficit aimed at 0.5 % of body weight a week, kept inside 300 to 500 kcal a day.
    const wanted = (0.005 * kg * KCAL_PER_KG) / 7;
    const deficit = Math.min(Math.max(wanted, 300), 500);
    return round(maintenanceKcal - deficit, 50);
  }
  return round(maintenanceKcal, 50);
}

// Hard limits (WORKFLOW B4). `kcal` can come from the formula or from a manual change.
export function safetyCheck({ kcal, maintenanceKcal, kg, sex }) {
  const problems = [];
  const floor = KCAL_FLOOR[sex] ?? KCAL_FLOOR.unspecified;
  if (kcal < floor) problems.push(`Calories can not go under ${floor} a day.`);
  const weekly = ((kcal - maintenanceKcal) * 7) / KCAL_PER_KG; // kg per week, negative = loss
  const pct = (weekly / kg) * 100;
  if (pct < -MAX_LOSS_PCT_PER_WEEK) problems.push(`That loses more than ${MAX_LOSS_PCT_PER_WEEK} % of body weight a week. That is too fast.`);
  if (pct > MAX_GAIN_PCT_PER_WEEK) problems.push(`That gains more than ${MAX_GAIN_PCT_PER_WEEK} % of body weight a week. That is too fast.`);
  return { ok: problems.length === 0, problems, weeklyPct: pct };
}

// All targets from one intake. Returns the shape of profile.targets (ARCHITECTURE 4.2) plus a few notes for the screen.
export function computeTargets(intake) {
  const kg = intake.q24_weight_kg;
  const cm = intake.q23_height_cm;
  const sex = intake.q22_sex;
  const b = bmi(kg, cm);
  const walk = startWalk(intake.q36_walk_fit, false);
  const notes = [];

  let goal = intake.q26_goal;
  const suggested = suggestGoal({ bmi: b, waist_cm: intake.q28_waist_cm ?? null, sex });
  if (goal === "suggest") goal = suggested;
  if (goal === "cut" && b < 20) { // no cut is offered if BMI is under 20
    goal = "recomp";
    notes.push("A cut is not offered when BMI is under 20, so the goal is to stay about the same.");
  }

  const m = maintenance(intake, walk);
  const food = intake.q32_food; // "targets" | "protein" | "none"
  let kcal = null;
  let protein = null;
  if (food === "targets") kcal = kcalForGoal({ goal, maintenanceKcal: m.kcal, kg });
  if (food === "targets" || food === "protein") protein = proteinTarget({ goal, kg, cm });

  if (kcal !== null) {
    const check = safetyCheck({ kcal, maintenanceKcal: m.kcal, kg, sex });
    if (!check.ok) { // the formula must never break the limits: raise to the floor
      kcal = Math.max(kcal, KCAL_FLOOR[sex] ?? KCAL_FLOOR.unspecified);
      notes.push("Calories were raised to the safe minimum.");
    }
  }

  return {
    kcal,
    protein_g: protein,
    goal,
    source: "computed",
    walk_start: { speed_kmh: walk.speed_kmh, slope_pct: walk.slope_pct },
    maintenance_kcal: m.kcal,
    suggested_goal: suggested,
    notes,
  };
}

// Body weight display units. Gym weights stay in kg.
export function kgToStonesPounds(kg) {
  const totalPounds = kg * 2.2046226218;
  let stones = Math.floor(totalPounds / 14);
  let pounds = Math.round((totalPounds - stones * 14) * 10) / 10;
  if (pounds >= 14) { stones += 1; pounds = 0; }
  return { stones, pounds };
}
export function stonesPoundsToKg(stones, pounds) {
  return Math.round(((stones * 14 + pounds) / 2.2046226218) * 10) / 10;
}
