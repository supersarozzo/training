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

// Protein words (master pick 2 a under Rosario's 94 a): whole grams, except one food row under 10 g, which keeps 1
// decimal ("4.3"). Totals (rings, meals, averages) always round to whole grams.
export function proteinText(g) {
  const v = fin(g) ? g : 0;
  const one = r1(v);
  return one < 10 ? String(one) : String(Math.round(v));
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

// 0.7.7, the Progress calories chart: kcal eaten per day for the n days before today and today, oldest first.
// A day with no live entry is null (a gap on the chart, never a 0); a day with only 0 kcal entries is 0.
export function dailyKcal(doc, today, n) {
  const dates = Array.from({ length: n + 1 }, (_, i) => addDays(today, i - n));
  const want = new Set(dates);
  const per = new Map();
  for (const r of doc.food_log ?? []) {
    if (!liveEntry(r) || !want.has(r.date)) continue;
    per.set(r.date, (per.get(r.date) ?? 0) + (fin(r.kcal) ? r.kcal : 0));
  }
  return dates.map((date) => ({ date, kcal: per.has(date) ? per.get(date) : null, today: date === today }));
}

// The average kcal of the n days before today, days with food only (the rule of averageLast7). null when there is none.
export function averageDays(doc, today, n) {
  const list = dailyKcal(doc, today, n).filter((d) => !d.today && d.kcal !== null);
  if (!list.length) return null;
  return { days: list.length, kcal: Math.round(list.reduce((t, d) => t + d.kcal, 0) / list.length) };
}

// The check step's soft warnings (DESIGN 15.9). They never block saving.
// The pack size text from Open Food Facts ("450 g", "1 gram"): grams only, else null.
function packGrams(text) {
  const m = typeof text === "string" ? /^\s*(\d+(?:[.,]\d+)?)\s*(g|gr|gram|grams)\b/i.exec(text) : null;
  return m ? Number(m[1].replace(",", ".")) : null;
}

export function checkFood({ per100g = {}, serving_g = null, quantity = null } = {}) {
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
  const pack = packGrams(quantity);
  const tiny = fin(pack) && pack > 0 && pack <= 2 ? pack : fin(serving_g) && serving_g > 0 && serving_g <= 2 ? serving_g : null;
  if (tiny !== null) w.push(`The pack size says ${tiny === 1 ? "1 gram" : `${tiny} grams`}. That is likely wrong.`);
  return w.length ? { ok: false, warnings: w, line: null } : { ok: true, warnings: [], line: "✓ The numbers add up." };
}

const goodAmount = (v) => fin(v) && v > 0;
// The check step starts at the pack's serving, else the last amount, else 100 g (DESIGN 15.9).
export function startAmount(food = {}) {
  if (goodAmount(food.serving_g)) return food.serving_g;
  if (goodAmount(food.last_amount_g)) return food.last_amount_g;
  return 100;
}
// ---------- "How many" (0.7.4; Rosario: "how many or how much grams") ----------
// A food with a serving (grams and words, from Open Food Facts or typed) can be counted: grams = count x serving.
// Grams stay the truth in the log (food_log.servings stays null); the count is only a faster way to set the grams.
const MAX_PORTION_G = 5000; // the portion stepper's top (and the file check's amount_g limit)
const round1 = (n) => Math.round(n * 10) / 10;
export function servingOf(food) {
  if (!food || !fin(food.serving_g) || food.serving_g <= 0 || food.serving_g > 2000) return null;
  if (typeof food.serving_label !== "string" || !food.serving_label.trim()) return null;
  return { g: food.serving_g, label: food.serving_label };
}
const okNum = (n) => typeof n === "number" && Number.isFinite(n) && n > 0;
export const gramsForCount = (count, serving_g) => (okNum(count) && okNum(serving_g) ? round1(count * serving_g) : null);
export const countForGrams = (grams, serving_g) => (okNum(grams) && okNum(serving_g) ? round1(grams / serving_g) : null);
// The + and - buttons move by whole servings: 1.5 -> 2 or 1; never below 1 (under 1, minus changes nothing).
export function stepCount(count, dir) {
  const eps = 1e-6;
  if (dir > 0) return Math.floor(count + eps) + 1;
  const down = Math.ceil(count - eps) - 1;
  return down >= 1 ? down : count;
}
export const maxCount = (serving_g) => Math.max(1, Math.floor(MAX_PORTION_G / serving_g + 1e-9));

// ---------- Pieces (0.7.4; Rosario: "so i can put 2 eggs instead of 125g of eggs") ----------
// Every food can be counted in pieces. The weight of one piece is the food's serving_g (1 to 2000 g; a value from Open
// Food Facts is untrusted and range-checked here too); its words default to "piece". Grams stay the truth in the log.
export const PIECE_MIN_G = 1;
export const PIECE_MAX_G = 2000;
const PIECE_WORDS = `The weight of 1 piece must be ${PIECE_MIN_G} to ${PIECE_MAX_G} g.`;
const okPiece = (g) => typeof g === "number" && Number.isFinite(g) && g >= PIECE_MIN_G && g <= PIECE_MAX_G;
// A serving named with a count of more than one ("4 bites", "2 eggs", "about 2 hash browns", a pack's "2 biscuits
// (25 g)") holds that many pieces (0.7.5, Rosario: "Pieces say 31g in the description but then 1 piece shows up as
// 125g"). Returns { n, unit } with the single unit ("bite"), or null: no count, a count of 1, or a weight or volume
// ("100 g", "30 g serving", "8 fl. oz", "250 ml": the FIRST word after the number is a weight or volume). The words come
// from the pack or Open Food Facts: data only, shown as text.
const MEASURE = /^(g|gr|grs|gm|gms|grams?|grammes?|gramm|kg|mg|ml|cl|dl|l|lit(?:re|er)s?|millilit(?:re|er)s?|fl|oz|ounces?|lbs?|pounds?|pints?|kcal|kj|cals?|calories?)$/i;
const IRREGULAR = { loaves: "loaf", halves: "half", leaves: "leaf" };
function singularWord(w) {
  const lower = w.toLowerCase();
  if (Object.hasOwn(IRREGULAR, lower)) return IRREGULAR[lower];
  if (/(brioche|quiche|niche)s$/i.test(w)) return w.slice(0, -1);
  if (/[knh]ies$/i.test(w)) return w.slice(0, -1); // cookies, brownies, smoothies
  if (/ies$/i.test(w) && w.length > 4) return `${w.slice(0, -3)}y`; // patties
  if (/(ch|sh|ss|x|zz|o)es$/i.test(w)) return w.slice(0, -2); // sandwiches, boxes, potatoes
  if (/[^s]s$/i.test(w)) return w.slice(0, -1); // bites, eggs, slices
  return w;
}
// The last word before " of " is the one that counts: "slices of bread" -> "slice of bread".
function singular(words) {
  const m = /^(.*?)(\s+of\s+.*)$/i.exec(words);
  const head = m ? m[1] : words;
  const parts = head.split(/\s+/);
  const last = parts.pop();
  return [...parts, singularWord(last)].join(" ") + (m ? m[2] : "");
}
export function countedServing(label) {
  const words = typeof label === "string" ? label.trim() : "";
  const m = /^(?:(?:about|approx\.?|approximately|around|~)\s*)?(\d{1,3})\s+(.+)$/i.exec(words);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2].replace(/^x\s+/i, "").replace(/\s*\([^)]*\)\s*$/, "").trim(); // "x biscuits (25 g)" -> "biscuits"
  if (n < 2 || n > 100 || !unit || /\d/.test(unit) || MEASURE.test(unit.split(/[\s.(]/)[0])) return null;
  return { n, unit: singular(unit) };
}
// A serving named only by its weight in grams ("30 g", "100g", "25 gr", "50 g.") or with no words says nothing about
// pieces (0.7.6, Rosario: "minihashbrowns was 8 pieces for 30 grams"): no piece weight, so Pieces asks for one. A weight
// typed with Change saves the words "piece" (withPieceWeight), so it is asked only once.
const GRAMS_ONLY = /^\d+(?:[.,]\d+)?\s*(?:g|gr|grs|gm|gms|grams?|grammes?|gramm)\.?$/i;
export const gramsOnlyLabel = (words) => words === "" || GRAMS_ONLY.test(words);
export function pieceOf(food) {
  if (!food || !okPiece(food.serving_g)) return null;
  const words = typeof food.serving_label === "string" ? food.serving_label.trim() : "";
  if (gramsOnlyLabel(words)) return null;
  const counted = countedServing(words);
  if (counted && okPiece(food.serving_g / counted.n)) return { g: food.serving_g / counted.n, label: counted.unit };
  return { g: food.serving_g, label: words };
}
// The typed weight of one piece ("62,5" works too), rounded to 0.1 g.
export function checkPieceWeight(text) {
  const t = String(text ?? "").trim().replace(",", ".");
  const g = t === "" ? NaN : Math.round(Number(t) * 10) / 10;
  return okPiece(g) ? { ok: true, g } : { ok: false, reason: PIECE_WORDS };
}
// The words under the Pieces stepper: "1 egg = 62.5 g"; the pack's own "1 bar (30 g)" as it is; "2 biscuits (25 g)"
// (a serving of more than one) as "1 piece = 25 g (2 biscuits (25 g))".
export function pieceWords(piece) {
  if (/^\d+(\.\d+)?\s*g$/i.test(piece.label)) return `1 piece = ${round1(piece.g)} g`; // the pack named only grams
  if (/^1\s/.test(piece.label)) return piece.label;
  if (/^\d/.test(piece.label)) return `1 piece = ${round1(piece.g)} g (${piece.label})`;
  return `1 ${piece.label} = ${round1(piece.g)} g`;
}
// Pieces from the grams on the sheet, and the grams that count really gives, so the line and the saved amount agree
// (100 g of a 30 g piece: 3.3 pieces = 99 g). Less than 0.1 piece (or no grams): 1 piece.
export function piecesStart(grams, piece_g) {
  const c = countForGrams(grams, piece_g);
  const count = c !== null && c >= 0.1 ? c : 1;
  return { count, grams: gramsForCount(count, piece_g) };
}
// The live line under the Pieces stepper: "= 125 g".
export function piecesLine(count, piece_g) {
  const g = gramsForCount(count, piece_g);
  return g === null ? "" : `= ${g} g`;
}
// The food's fields with a new piece weight. The words stay when they still fit (same weight, or words without a
// number, like "egg"); the pack's "1 bar (30 g)" with a new weight becomes "piece".
export function withPieceWeight(food, g) {
  if (!okPiece(g)) throw new Error(PIECE_WORDS);
  const words = food && typeof food.serving_label === "string" ? food.serving_label.trim() : "";
  // A typed weight is the weight of ONE piece, so "4 bites" becomes "bite" (0.7.5: the typed weight always wins).
  const counted = countedServing(words);
  if (counted) return { ...food, serving_g: g, serving_label: counted.unit };
  const keep = !gramsOnlyLabel(words) && (food.serving_g === g || !/\d/.test(words)); // grams only: "piece" (0.7.6)
  return { ...food, serving_g: g, serving_label: keep ? food.serving_label : "piece" };
}

// Log again: the last amount first (fast apps remember the last portion), else the serving, else 100 g.
export function againAmount(food = {}) {
  if (goodAmount(food.last_amount_g)) return food.last_amount_g;
  if (goodAmount(food.serving_g)) return food.serving_g;
  return 100;
}
