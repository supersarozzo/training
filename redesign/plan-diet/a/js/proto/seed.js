// PROTOTYPE 8.28 (builder A). Sample data so every screen has something to show. Same storage key as the app
// (trn.data.v1), but this page runs on its own port, so it never touches the app's own test data.
// ALL NUMBERS ARE MADE UP (no body data is ever committed): age, height, weight, calorie and protein targets, foods.
// `?reset=1` puts the sample data back.
import { emptyDoc } from "../validate.js";
import { KEYS } from "../store.js";
import { localDate } from "../ids.js";
import { now } from "../clock.js";

const iso = (date, hh = 9, mm = 0) => new Date(`${date}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`).toISOString();
function addDays(date, n) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + n);
  return localDate(d);
}

// Saved foods. Numbers per 100 g are made-up round figures for the mock-up, not real labels.
const FOODS = [
  { id: "fo-20261101-oats01", name: "Porridge oats", brand: "", barcode: null, per100g: { kcal: 375, protein_g: 11, carbs_g: 60, fat_g: 8 }, serving_g: 40, serving_label: "40 g", last_amount_g: 40, fav: true, source: "own" },
  { id: "fo-20261101-milk01", name: "Semi-skimmed milk", brand: "", barcode: null, per100g: { kcal: 47, protein_g: 3.5, carbs_g: 4.8, fat_g: 1.7 }, serving_g: 200, serving_label: "200 ml", last_amount_g: 200, fav: true, source: "own" },
  { id: "fo-20261101-chik01", name: "Chicken breast, cooked", brand: "", barcode: null, per100g: { kcal: 160, protein_g: 31, carbs_g: 0, fat_g: 3.5 }, serving_g: 150, serving_label: "150 g", last_amount_g: 150, fav: true, source: "own" },
  { id: "fo-20261101-rice01", name: "Basmati rice, dry", brand: "", barcode: null, per100g: { kcal: 355, protein_g: 8, carbs_g: 78, fat_g: 1 }, serving_g: 75, serving_label: "75 g", last_amount_g: 75, fav: false, source: "own" },
  { id: "fb-0000000000017", name: "Greek-style yogurt 0 %", brand: "Sample brand", barcode: "0000000000017", per100g: { kcal: 57, protein_g: 10, carbs_g: 4, fat_g: 0.2 }, serving_g: 170, serving_label: "1 pot (170 g)", last_amount_g: 170, fav: true, source: "off", off_fetched_at: "2026-11-10T10:00:00.000Z", edited: false },
  { id: "fo-20261101-bana01", name: "Banana", brand: "", barcode: null, per100g: { kcal: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3 }, serving_g: 120, serving_label: "1 medium (120 g)", last_amount_g: 120, fav: false, source: "own" },
  { id: "fo-20261101-whey01", name: "Whey protein powder", brand: "", barcode: null, per100g: { kcal: 380, protein_g: 75, carbs_g: 8, fat_g: 6 }, serving_g: 30, serving_label: "1 scoop (30 g)", last_amount_g: 30, fav: true, source: "own" },
  { id: "fo-20261101-eggs01", name: "Eggs", brand: "", barcode: null, per100g: { kcal: 143, protein_g: 12.6, carbs_g: 0.7, fat_g: 9.5 }, serving_g: 120, serving_label: "2 eggs (120 g)", last_amount_g: 120, fav: false, source: "own" },
];

function entry(date, hh, mm, food, grams, meal) {
  const k = grams / 100;
  const r = (n) => Math.round(n * 10) / 10;
  return {
    id: `f-${date.replaceAll("-", "")}-${food.id.slice(-6)}${hh}`, updated_at: iso(date, hh, mm), date, time: `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`, meal,
    food: food.id, name: food.name, amount_g: grams, servings: null,
    kcal: Math.round(food.per100g.kcal * k), protein_g: r(food.per100g.protein_g * k), carbs_g: r(food.per100g.carbs_g * k), fat_g: r(food.per100g.fat_g * k),
    source: food.source,
  };
}

function session(date, week, planDay, exList) {
  return {
    id: `s-${date.replaceAll("-", "")}-sample`, updated_at: iso(date, 19, 40), date, plan_day: planDay, week, kind: "full",
    swapped_from: null, status: "finished", started_at: iso(date, 18, 0), finished_at: iso(date, 19, 30),
    walk: { minutes: 20, speed_kmh: 4.5, slope_pct: 4, effort: 5 },
    exercises: exList.map(([slot, ex, kg, reps]) => ({
      slot, plan_exercise: ex, done_exercise: ex, swap_reason: null, note: "",
      sets: [1, 2, 3].map((n) => ({ n, type: "work", weight_kg: kg, reps, seconds: null, rir: 2, done_at: iso(date, 18, 40 + n) })),
    })),
    effort: 7, note: "",
  };
}

export function sampleDoc() {
  const t = localDate(now());
  const doc = emptyDoc();
  const stamp = iso(addDays(t, -16));
  doc.profile = {
    updated_at: stamp,
    intake: { q20_parq_all_no: true, q21_age: 30, q22_sex: "unspecified", q23_height_cm: 175, q24_weight_kg: 75, q25_unit: "kg", q26_goal: "recomp", q27_goal_weight_kg: null, q28_waist_cm: null, q29_focus: "balanced", q30_activity: "b", q31_sleep_h: 7, q32_food: "targets", q33_diet: "", q34_scale: true, q35_walk: "before", q36_walk_fit: "not_sure", q37_avoid: [], q38_photos: false },
    targets: { kcal: 2300, protein_g: 140, goal: "recomp", source: "manual", walk_start: { speed_kmh: 4.5, slope_pct: 4 } }, // MADE UP
  };
  // The block started on the Monday two weeks before this week's Monday: today is in week 3 (Build 1).
  const d = new Date(`${t}T12:00:00`);
  const toMon = (d.getDay() + 6) % 7;
  const thisMon = addDays(t, -toMon);
  doc.block = { plan_id: "plan-v2", number: 1, start_monday: addDays(thisMon, -14), updated_at: stamp };
  doc.shared_settings = { ...doc.shared_settings, updated_at: stamp };
  doc.gym_spots = [
    { id: "g-chest_press", updated_at: stamp, machine: "chest_press", where: "Upstairs, back left" },
    { id: "g-cable_station", updated_at: stamp, machine: "cable_station", where: "By the mirrors" },
  ];
  // Monday of this week done (if today is after Monday).
  if (toMon >= 1) {
    doc.sessions.push(session(thisMon, 3, "mon", [["A1", "chest_press", 30, 10], ["A2", "pulldown", 35, 11], ["B1", "shoulder_press_machine", 20, 10], ["B2", "one_arm_db_row", 14, 10], ["C1", "db_curl", 8, 12], ["C2", "triceps_pushdown", 15, 12]]));
  }
  doc.foods = FOODS.map((f) => ({ ...f, updated_at: stamp }));
  const by = Object.fromEntries(FOODS.map((f) => [f.id.slice(-6), f]));
  const log = [];
  for (let back = 6; back >= 1; back--) {
    const day = addDays(t, -back);
    log.push(entry(day, 8, 5, by.oats01, 50, "breakfast"), entry(day, 8, 6, by.milk01, 250, "breakfast"),
      entry(day, 13, 10, by.chik01, 160, "lunch"), entry(day, 13, 11, by.rice01, 80, "lunch"),
      entry(day, 16, 0, FOODS[4], 170, "snack"), entry(day, 19, 45, by.whey01, 30, "snack"),
      entry(day, 20, 30, by.eggs01, back % 2 ? 180 : 120, "dinner"), entry(day, 20, 31, by.rice01, back % 3 ? 90 : 60, "dinner"));
  }
  log.push(entry(t, 8, 10, by.oats01, 40, "breakfast"), entry(t, 8, 11, by.milk01, 200, "breakfast"), entry(t, 13, 5, by.chik01, 150, "lunch"), entry(t, 13, 6, by.rice01, 75, "lunch"));
  doc.food_log = log;
  doc.plan_days = [];
  return doc;
}

export function seedIfEmpty(storage = window.localStorage) {
  const reset = new URLSearchParams(location.search).has("reset");
  if (!reset && storage.getItem(KEYS.data) !== null) return;
  storage.setItem(KEYS.data, JSON.stringify(sampleDoc()));
  if (reset) { const u = new URL(location.href); u.searchParams.delete("reset"); history.replaceState(null, "", u.pathname + u.search + u.hash); }
}
