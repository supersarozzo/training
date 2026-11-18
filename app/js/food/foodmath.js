// Food maths and food text, pure (no page, no storage, no network). Used by the food model and the Diet screens.
// Numbers are worked out ONCE when a food is logged and stored in the entry (research 9.2), so a later fix of a
// saved food never changes a day already logged. "Recent" comes from the log, never from counters (research 9.3).
import { MEALS } from "./foodvalidate.js";

export const TEXT_MAX = 120; // Open Food Facts text and food names are cut to 120 letters (research 9.5)
export const PER100_MAX = { kcal: 900, macro: 100 };

// Control letters, direction marks and zero-width letters come out; line breaks and tabs become a space;
// runs of spaces become one; then trim and cut without splitting an emoji in half.
const DROP = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F­؜​-‏‪-‮⁠-⁤⁦-⁯﻿￹-￻]/g;
export function cleanText(value, max = TEXT_MAX) {
  let s = String(value ?? "").replace(/[\t\n\r]/g, " ").replace(DROP, "").replace(/\s+/g, " ").trim();
  if (s.length > max) {
    s = s.slice(0, max);
    const last = s.charCodeAt(s.length - 1);
    if (last >= 0xd800 && last <= 0xdbff) s = s.slice(0, -1);
    s = s.trimEnd();
  }
  return s;
}

const r1 = (n) => Math.round(n * 10) / 10;
const fin = (n) => typeof n === "number" && Number.isFinite(n);

// Numbers for an amount in grams from numbers per 100 g: kcal whole, grams to 0.1; a missing value stays null.
export function numbersFor(per100g, amount_g) {
  if (!fin(amount_g) || amount_g < 0) throw new Error("The amount must be 0 grams or more.");
  const f = amount_g / 100;
  const g = (v) => (fin(v) ? r1(v * f) : null);
  return { kcal: fin(per100g.kcal) ? Math.round(per100g.kcal * f) : 0, protein_g: fin(per100g.protein_g) ? r1(per100g.protein_g * f) : 0, carbs_g: g(per100g.carbs_g), fat_g: g(per100g.fat_g) };
}

const liveEntry = (r) => r && r.deleted !== true;
export function entriesOn(doc, date) {
  return (doc.food_log ?? []).filter((r) => liveEntry(r) && r.date === date);
}

export function totals(entries) {
  const sum = (k) => r1(entries.reduce((n, r) => n + (fin(r[k]) ? r[k] : 0), 0));
  return { kcal: Math.round(entries.reduce((n, r) => n + (fin(r.kcal) ? r.kcal : 0), 0)), protein_g: sum("protein_g"), carbs_g: sum("carbs_g"), fat_g: sum("fat_g"), count: entries.length };
}

// The 4 meals in order, always all 4. An entry with no meal shows under Snacks.
export function byMeal(entries) {
  return MEALS.map((meal) => {
    const list = entries.filter((r) => (MEALS.includes(r.meal) ? r.meal : "snack") === meal)
      .sort((a, b) => String(a.updated_at).localeCompare(String(b.updated_at)));
    const t = totals(list);
    return { meal, entries: list, kcal: t.kcal, protein_g: t.protein_g };
  });
}

export const MEAL_WORDS = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snacks" };

// The meal picked from the clock: 04:00-10:59 breakfast, 11:00-14:59 lunch, 18:00-21:59 dinner, else a snack.
export function mealAt(date) {
  const m = date.getHours() * 60 + date.getMinutes();
  if (m >= 240 && m < 660) return "breakfast";
  if (m >= 660 && m < 900) return "lunch";
  if (m >= 1080 && m < 1320) return "dinner";
  return "snack";
}

function addDays(dateStr, n) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const t = new Date(Date.UTC(y, mo - 1, d + n));
  return t.toISOString().slice(0, 10);
}
export const dayBefore = (dateStr) => addDays(dateStr, -1);

// Saved foods, last used first (from the log), with "had today". Deleted foods and foods never logged are left out.
export function recentFoods(doc, today, limit = 8) {
  const foods = new Map((doc.foods ?? []).filter(liveEntry).map((f) => [f.id, f]));
  const last = new Map();
  for (const r of doc.food_log ?? []) {
    if (!liveEntry(r) || typeof r.food !== "string" || !foods.has(r.food)) continue;
    const key = `${r.date} ${r.updated_at}`;
    if (!last.has(r.food) || key > last.get(r.food)) last.set(r.food, key);
  }
  const had = new Set(entriesOn(doc, today).map((r) => r.food));
  return [...last.entries()].sort((a, b) => (a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0)).slice(0, limit)
    .map(([id]) => ({ food: foods.get(id), hadToday: had.has(id) }));
}

// Saved foods for the "Your foods" list: favourites first, then A to Z.
export function savedFoods(doc) {
  return (doc.foods ?? []).filter(liveEntry).sort((a, b) => (b.fav === true) - (a.fav === true) || String(a.name).localeCompare(String(b.name)));
}

// Average of the 7 days before today, counting only days with food. null when there is none.
export function averageLast7(doc, today) {
  const days = new Set(Array.from({ length: 7 }, (_, i) => addDays(today, -(i + 1))));
  const per = new Map();
  for (const r of doc.food_log ?? []) {
    if (!liveEntry(r) || !days.has(r.date)) continue;
    const d = per.get(r.date) ?? { kcal: 0, protein_g: 0 };
    d.kcal += fin(r.kcal) ? r.kcal : 0;
    d.protein_g += fin(r.protein_g) ? r.protein_g : 0;
    per.set(r.date, d);
  }
  if (per.size === 0) return null;
  const list = [...per.values()];
  return { days: list.length, kcal: Math.round(list.reduce((n, d) => n + d.kcal, 0) / list.length), protein_g: Math.round(list.reduce((n, d) => n + d.protein_g, 0) / list.length) };
}

// The check step's soft warnings (DESIGN 15.9). They never block saving.
export function checkFood({ per100g = {}, serving_g = null } = {}) {
  const w = [];
  const { kcal, protein_g: p, carbs_g: c, fat_g: f } = per100g;
  if (!fin(kcal)) w.push("The calories are missing. Type them from the pack.");
  if (!fin(p)) w.push("The protein is missing. Type it from the pack.");
  if (fin(kcal) && kcal > PER100_MAX.kcal) w.push(`More than ${PER100_MAX.kcal} kcal in 100 g is not possible.`);
  const macros = [p, c, f].filter(fin);
  if (macros.some((v) => v > PER100_MAX.macro)) w.push("One number is more than 100 g in 100 g. That is not possible.");
  else if (macros.reduce((n, v) => n + v, 0) > 102) w.push("Protein, carbs and fat add up to more than 100 g in 100 g. One of them is likely wrong.");
  if (fin(kcal) && fin(p) && fin(c) && fin(f)) {
    const calc = 4 * p + 4 * c + 9 * f;
    if (Math.abs(calc - kcal) > Math.max(40, 0.2 * kcal)) w.push(`The calories do not match protein, carbs and fat (about ${Math.round(calc)} kcal). Compare with the pack.`);
  }
  if (fin(serving_g) && serving_g > 0 && serving_g <= 2) w.push(`The pack size says ${serving_g === 1 ? "1 gram" : `${serving_g} grams`}. That is likely wrong.`);
  return w.length ? { ok: false, warnings: w, line: null } : { ok: true, warnings: [], line: "✓ The numbers add up." };
}

const goodAmount = (v) => fin(v) && v > 0;
// The check step starts at the pack's serving, else the last amount, else 100 g (DESIGN 15.9).
export function startAmount(food = {}) {
  if (goodAmount(food.serving_g)) return food.serving_g;
  if (goodAmount(food.last_amount_g)) return food.last_amount_g;
  return 100;
}
// Log again: the last amount first (fast apps remember the last portion), else the serving, else 100 g.
export function againAmount(food = {}) {
  if (goodAmount(food.last_amount_g)) return food.last_amount_g;
  if (goodAmount(food.serving_g)) return food.serving_g;
  return 100;
}
