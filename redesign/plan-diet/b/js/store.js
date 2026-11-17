// Prototype storage. The same boxes as the app (app/js/store.js): trn.data.v1 (the synced document) and trn.device.v1
// (device only: look and animations). SAMPLE DATA ONLY: every number here is made up for the mock-up, including the
// calorie and protein targets. Body data is never in this repo.
// The new lists this prototype adds to the document (design notes, research section 9): plan_days, foods, food_log.
// In the real build food would live in its own synced file (food.json): see REPORT.md, "Food file".

export const KEYS = { data: "trn.data.v1", device: "trn.device.v1" };
export const TODAY = "2026-11-17"; // the prototype's date is fixed (a Tuesday in week 3), so every screenshot matches
export const NOW_HOUR = 18;

function read(key) { try { return localStorage.getItem(key); } catch { return null; } }
function write(key, value) { try { localStorage.setItem(key, value); } catch { /* storage blocked: the prototype still draws */ } }

const stamp = () => new Date().toISOString();

// EAN check digit (the last digit of a barcode).
export function eanCheckDigit(body) {
  const digits = body.split("").map(Number).reverse();
  const sum = digits.reduce((n, d, i) => n + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10;
}
export function validEan(code) {
  if (!/^(\d{8}|\d{12}|\d{13})$/.test(code)) return false;
  return eanCheckDigit(code.slice(0, -1)) === Number(code.slice(-1));
}
// Made-up barcodes from the 20-29 prefix (in-store numbers: never a real product).
const fake = (body) => body + eanCheckDigit(body);
// unknown: a made-up code Open Food Facts answered "not found" for on 2026-11-17. nonums: a made-up-looking code that
// Open Food Facts does hold, with no nutrition numbers (shows the "Missing: … fill them in" check).
export const SAMPLE_CODES = { yogurt: fake("200000000001"), unknown: fake("200000000077"), nonums: fake("200000000099"), real: "3017620422003" };

function dayStr(offset) {
  const d = new Date(`${TODAY}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

function sampleFoods() {
  const t = stamp();
  const f = (id, name, brand, barcode, per100g, serving_g, last_amount_g, fav = false, source = "own") =>
    ({ id, updated_at: t, name, brand, barcode, per100g, serving_g, serving_label: serving_g ? `${serving_g} g` : null, last_amount_g, fav, source, off_fetched_at: source === "off" ? t : null, edited: false });
  return [
    f("fo-20261101-oats01", "Porridge oats", "", null, { kcal: 375, protein_g: 11, carbs_g: 60, fat_g: 8 }, 40, 60, true),
    f("fo-20261101-milk01", "Semi-skimmed milk", "", null, { kcal: 47, protein_g: 3.5, carbs_g: 4.8, fat_g: 1.7 }, 200, 250, true),
    f("fo-20261101-chik01", "Chicken breast, cooked", "", null, { kcal: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 }, null, 150, true),
    f("fo-20261101-rice01", "Basmati rice, cooked", "", null, { kcal: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3 }, null, 180),
    f(`fb-${SAMPLE_CODES.yogurt}`, "Greek-style yogurt 0 %", "Sample brand", SAMPLE_CODES.yogurt, { kcal: 57, protein_g: 10, carbs_g: 3.6, fat_g: 0.2 }, 170, 170, true, "off"),
    f("fo-20261103-eggs01", "Eggs", "", null, { kcal: 143, protein_g: 12.6, carbs_g: 0.7, fat_g: 9.9 }, 58, 116),
    f("fo-20261103-bana01", "Banana", "", null, { kcal: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3 }, 120, 120),
    f("fo-20261104-whey01", "Whey shake (made with water)", "", null, { kcal: 380, protein_g: 75, carbs_g: 8, fat_g: 5 }, 30, 30),
  ];
}

export function entryFrom(food, amount_g, date, meal, at) {
  const k = amount_g / 100;
  return {
    id: `f-${date.replaceAll("-", "")}-${Math.random().toString(36).slice(2, 8)}`, updated_at: stamp(), eaten_at: at ?? stamp(), date, meal,
    food: food.id, name: food.name, amount_g, servings: null,
    kcal: Math.round(food.per100g.kcal * k), protein_g: Math.round(food.per100g.protein_g * k * 10) / 10,
    carbs_g: Math.round(food.per100g.carbs_g * k * 10) / 10, fat_g: Math.round(food.per100g.fat_g * k * 10) / 10, source: food.source,
  };
}

function sampleLog(foods) {
  const by = Object.fromEntries(foods.map((x) => [x.name.split(",")[0], x]));
  const log = [];
  // Seven earlier days (made up), then today so far.
  const week = [
    [["Porridge oats", 60, "breakfast"], ["Semi-skimmed milk", 250, "breakfast"], ["Chicken breast", 180, "lunch"], ["Basmati rice", 200, "lunch"], ["Eggs", 116, "dinner"], ["Whey shake (made with water)", 30, "snack"], ["Banana", 120, "snack"], ["Greek-style yogurt 0 %", 170, "snack"]],
    [["Porridge oats", 60, "breakfast"], ["Semi-skimmed milk", 250, "breakfast"], ["Chicken breast", 150, "lunch"], ["Basmati rice", 180, "dinner"], ["Greek-style yogurt 0 %", 340, "snack"], ["Banana", 120, "snack"]],
  ];
  for (let i = 7; i >= 1; i--) {
    const day = dayStr(-i);
    for (const [name, g, meal] of week[i % 2]) log.push(entryFrom(by[name], g + (i % 3) * 10, day, meal));
  }
  for (const [name, g, meal, hm] of [["Porridge oats", 60, "breakfast", "07:40"], ["Semi-skimmed milk", 250, "breakfast", "07:41"], ["Chicken breast", 150, "lunch", "13:05"], ["Basmati rice", 180, "lunch", "13:06"], ["Greek-style yogurt 0 %", 170, "snack", "16:20"]]) {
    log.push(entryFrom(by[name], g, TODAY, meal, new Date(`${TODAY}T${hm}:00`).toISOString()));
  }
  return log;
}

function sampleSession() {
  // A finished Monday workout (16 Nov, week 3), to show that plan edits never change past workouts.
  const ex = [["A1", "chest_press", 3], ["A2", "pulldown", 3], ["B1", "shoulder_press_machine", 3], ["B2", "one_arm_db_row", 3], ["C1", "db_curl", 3], ["C2", "triceps_pushdown", 3], ["Abs1", "plank", 3], ["Abs2", "dead_bug", 2]];
  return {
    id: "s-20261116-sample", updated_at: stamp(), date: "2026-11-16", plan_day: "mon", week: 3, kind: "full", swapped_from: null,
    status: "finished", started_at: "2026-11-16T17:00:00.000Z", finished_at: "2026-11-16T18:31:00.000Z", walk: null,
    exercises: ex.map(([slot, id, n]) => ({ slot, plan_exercise: id, done_exercise: id, swap_reason: null, note: "", sets: Array.from({ length: n }, () => ({ type: "work" })) })),
    effort: 6, note: "",
  };
}

export function sampleDoc() {
  const foods = sampleFoods();
  return {
    format: 1, app: "training",
    profile: { updated_at: stamp(), intake: {}, targets: { kcal: 2000, protein_g: 140, walk_start: { speed_kmh: 4.5, slope_pct: 4 } } }, // made-up targets
    shared_settings: { updated_at: stamp(), body_unit: "kg", dumbbell_steps_kg: [], stack_step_kg: { default: 0 }, extra_machines: { lat_pulldown: true, seated_row: null, leg_curl: null, pec_deck: false, calf_raise: null }, shortcut: { on: false, name: "Log Training" } },
    block: { plan_id: "plan-v2", number: 1, start_monday: "2026-11-02", updated_at: stamp() },
    sessions: [sampleSession()], weighins: [], measurements: [], exercise_state: [],
    gym_spots: [
      { id: "g-chest_press", updated_at: stamp(), where: "Upstairs, back left by the mirrors" },
      { id: "g-cable_station", updated_at: stamp(), where: "Middle of the free weights area" },
      { id: "g-leg_press", updated_at: stamp(), where: "Downstairs, near the entrance" },
    ],
    plan_days: [], foods, food_log: sampleLog(foods),
  };
}

let cache = null;
export function loadDoc() {
  if (cache) return cache;
  const reset = new URLSearchParams(location.search).has("reset");
  const raw = reset ? null : read(KEYS.data);
  let doc = null;
  try { doc = raw ? JSON.parse(raw) : null; } catch { doc = null; }
  if (!doc || doc.app !== "training" || !doc.profile) { doc = sampleDoc(); write(KEYS.data, JSON.stringify(doc)); }
  for (const k of ["plan_days", "foods", "food_log"]) if (!Array.isArray(doc[k])) doc[k] = []; // older document: the new lists start empty
  if (reset) history.replaceState(null, "", location.pathname + location.hash);
  cache = doc;
  return doc;
}
// Change, stamp, save at once (like app/js/model.js).
export function update(fn) {
  const doc = loadDoc();
  fn(doc, stamp());
  write(KEYS.data, JSON.stringify(doc));
  return doc;
}
export function loadDevice() { try { return JSON.parse(read(KEYS.device) || "{}") || {}; } catch { return {}; } }
export function saveDevice(patch) { write(KEYS.device, JSON.stringify({ ...loadDevice(), ...patch })); }
export { stamp, dayStr };
