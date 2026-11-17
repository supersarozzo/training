// PROTOTYPE 8.28 (builder A). Food log, saved foods and the Open Food Facts lookup (research 6, 8, 9.2, 9.3, 9.5).
// - food_log entries store the worked-out numbers once (old days never change silently); delete = tombstone.
// - foods: barcode foods have the barcode in the id ("fb-<barcode>") so two phones make one record; no counters.
// - Open Food Facts: only the barcode number or the search word is sent, with app_name=TrainingApp. No cookies, no
//   referrer, no Authorization header. Product text is typed by strangers: clipped, numbers checked, shown only
//   through h(). A self-imposed limit of 10 lookups a minute keeps us under OFF's 15 reads / 10 searches.
// In the real build, food would live in its own synced file (food.json), not in progress.json (research 9.4).
import { store } from "../ui/app.js";
import { localDate, randomChars, ymd } from "../ids.js";
import { now } from "../clock.js";

const OFF = "https://world.openfoodfacts.org";
const APP = "app_name=TrainingApp&app_version=0.5-prototype";

export const r1 = (n) => Math.round(n * 10) / 10;
export const live = (list) => (list ?? []).filter((x) => !x.deleted);
export const todayStr = () => localDate(now());
export function addDays(date, n) { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + n); return localDate(d); }

export function dayEntries(doc, date) {
  return live(doc.food_log).filter((e) => e.date === date).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
}
export function totals(entries) {
  return entries.reduce((t, e) => ({ kcal: t.kcal + (e.kcal || 0), protein_g: t.protein_g + (e.protein_g || 0) }), { kcal: 0, protein_g: 0 });
}
// Average of the 7 days before today that have any entry (a day with nothing logged is left out, not counted as 0).
export function average7(doc, date) {
  const days = [];
  for (let i = 1; i <= 7; i++) { const e = dayEntries(doc, addDays(date, -i)); if (e.length) days.push(totals(e)); }
  if (!days.length) return null;
  return { n: days.length, kcal: Math.round(days.reduce((s, d) => s + d.kcal, 0) / days.length), protein_g: Math.round(days.reduce((s, d) => s + d.protein_g, 0) / days.length) };
}

// "Log again": the foods logged most recently, newest first, each with its last portion.
export function recentFoods(doc, max = 6) {
  const foods = Object.fromEntries(live(doc.foods).map((f) => [f.id, f]));
  const seen = new Set(); const out = [];
  for (const e of [...live(doc.food_log)].sort((a, b) => b.updated_at.localeCompare(a.updated_at))) {
    if (!e.food || seen.has(e.food) || !foods[e.food]) continue;
    seen.add(e.food); out.push(foods[e.food]);
    if (out.length >= max) break;
  }
  return out;
}
export function savedFoods(doc) {
  return live(doc.foods).sort((a, b) => (b.fav === true) - (a.fav === true) || a.name.localeCompare(b.name));
}

export function portion(food, grams) {
  const k = grams / 100;
  return { kcal: Math.round(food.per100g.kcal * k), protein_g: r1(food.per100g.protein_g * k), carbs_g: r1(food.per100g.carbs_g * k), fat_g: r1(food.per100g.fat_g * k) };
}

function mealAt(d) {
  const hr = d.getHours();
  return hr < 11 ? "breakfast" : hr < 15 ? "lunch" : hr < 18 ? "snack" : "dinner";
}

function update(fn) { const doc = store.load(); fn(doc, new Date().toISOString()); store.save(doc); }

export function addEntry(food, grams) {
  const n = now();
  const id = `f-${ymd(n)}-${randomChars(6)}`;
  update((doc, t) => {
    doc.food_log = doc.food_log ?? [];
    doc.food_log.push({ id, updated_at: t, date: localDate(n), time: `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`, meal: mealAt(n),
      food: food.id, name: food.name, amount_g: grams, servings: null, ...portion(food, grams), source: food.source });
    const f = (doc.foods ?? []).find((x) => x.id === food.id);
    if (f) { f.last_amount_g = grams; f.updated_at = t; }
  });
  return id;
}
export function addQuick(name, kcal, protein) {
  const n = now();
  const id = `f-${ymd(n)}-${randomChars(6)}`;
  update((doc, t) => {
    doc.food_log = doc.food_log ?? [];
    doc.food_log.push({ id, updated_at: t, date: localDate(n), time: `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`, meal: mealAt(n),
      food: null, name: clip(name || "Quick add", 120), amount_g: null, servings: null, kcal: Math.round(kcal), protein_g: r1(protein), carbs_g: null, fat_g: null, source: "quick" });
  });
  return id;
}
export function deleteEntry(id) {
  update((doc, t) => { const e = doc.food_log.find((x) => x.id === id); if (e) { e.deleted = true; e.deleted_at = t; e.updated_at = t; } });
}
export function undeleteEntry(id) {
  update((doc, t) => { const e = doc.food_log.find((x) => x.id === id); if (e) { delete e.deleted; delete e.deleted_at; e.updated_at = t; } });
}
export function changeAmount(id, grams) {
  update((doc, t) => {
    const e = doc.food_log.find((x) => x.id === id);
    const f = (doc.foods ?? []).find((x) => x.id === e.food);
    if (!e || !f) return;
    Object.assign(e, { amount_g: grams, ...portion(f, grams), updated_at: t });
  });
}
export function copyDay(from, to) {
  const ids = [];
  update((doc, t) => {
    for (const e of dayEntries(doc, from)) {
      const id = `f-${to.replaceAll("-", "")}-${randomChars(6)}`;
      ids.push(id);
      doc.food_log.push({ ...e, id, date: to, updated_at: t });
    }
  });
  return ids;
}
export function saveFood(food) {
  update((doc, t) => {
    doc.foods = doc.foods ?? [];
    const i = doc.foods.findIndex((x) => x.id === food.id);
    const rec = { ...food, updated_at: t };
    if (i >= 0) doc.foods[i] = { ...doc.foods[i], ...rec, deleted: undefined }; else doc.foods.push(rec);
  });
}
export function foodById(doc, id) { return live(doc.foods).find((f) => f.id === id) ?? null; }
export function newOwnId() { return `fo-${ymd(now())}-${randomChars(6)}`; }

// ---------- barcodes ----------
export function validBarcode(code) {
  if (!/^\d+$/.test(code) || ![8, 12, 13].includes(code.length)) return false;
  const digits = code.split("").map(Number);
  const check = digits.pop();
  // Weights 3,1,3,1... from the right (the same rule for EAN-8, UPC-A and EAN-13).
  const sum = digits.reverse().reduce((s, d, i) => s + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

// ---------- untrusted text and numbers (research 9.5 item 3) ----------
export function clip(v, max) {
  if (typeof v !== "string") return "";
  const s = v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
const num = (v) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN);
const okNum = (v, max) => Number.isFinite(v) && v >= 0 && v <= max;

// Problems a person should look at before saving. Soft words, never a block.
export function problems(per100g, serving_g, quantityText = "") {
  const out = [];
  const { kcal, protein_g: p, carbs_g: c, fat_g: f } = per100g;
  if ([kcal, p, c, f].some((x) => !Number.isFinite(x))) out.push("Some numbers are missing. Fill them in from the pack.");
  else {
    const est = 4 * p + 4 * c + 9 * f;
    if (Math.abs(est - kcal) > Math.max(40, 0.2 * kcal)) out.push(`These numbers do not add up: protein, carbs and fat make about ${Math.round(est)} kcal per 100 g, but the calories say ${Math.round(kcal)}.`);
    if (p + c + f > 105) out.push("Protein, carbs and fat add up to more than 100 g per 100 g.");
  }
  if (serving_g !== null && serving_g !== undefined && serving_g < 5) out.push(`The portion says ${serving_g} g. That looks too small: check it.`);
  if (/^\s*1\s*g(ram)?s?\s*$/i.test(quantityText)) out.push("The pack size says 1 gram. That is likely wrong.");
  return out;
}

export function fromOff(product, code) {
  const n = product?.nutriments ?? {};
  let kcal = num(n["energy-kcal_100g"]);
  if (!Number.isFinite(kcal) && Number.isFinite(num(n["energy-kj_100g"]))) kcal = num(n["energy-kj_100g"]) / 4.184;
  const per100g = {
    kcal: okNum(kcal, 900) ? Math.round(kcal) : NaN,
    protein_g: okNum(num(n.proteins_100g), 100) ? r1(num(n.proteins_100g)) : NaN,
    carbs_g: okNum(num(n.carbohydrates_100g), 100) ? r1(num(n.carbohydrates_100g)) : NaN,
    fat_g: okNum(num(n.fat_100g), 100) ? r1(num(n.fat_100g)) : NaN,
  };
  const sq = num(product?.serving_quantity);
  const serving_g = okNum(sq, 2000) && sq > 0 ? r1(sq) : null;
  const quantity = clip(product?.quantity ?? "", 40);
  return {
    food: {
      id: code ? `fb-${code}` : newOwnId(), name: clip(product?.product_name ?? "", 120) || "Unnamed product", brand: clip(product?.brands ?? "", 80),
      barcode: code ?? null, per100g, serving_g, serving_label: clip(product?.serving_size ?? "", 40) || null,
      last_amount_g: serving_g ?? 100, fav: false, source: "off", off_fetched_at: new Date().toISOString(), edited: false,
    },
    quantity,
    problems: problems(per100g, serving_g, quantity),
  };
}

// ---------- Open Food Facts calls (only on submit) ----------
const calls = [];
export function lookupsLeft() {
  const t = Date.now();
  while (calls.length && t - calls[0] > 60000) calls.shift();
  return { left: 10 - calls.length, waitS: calls.length >= 10 ? Math.ceil((60000 - (t - calls[0])) / 1000) : 0 };
}
async function offFetch(url) {
  const l = lookupsLeft();
  if (l.left <= 0) return { error: "limit", waitS: l.waitS };
  calls.push(Date.now());
  try {
    const res = await fetch(url, { credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer", mode: "cors" });
    if (res.status === 404) return { notFound: true };
    if (res.status === 503 || res.status === 429) return { error: "busy" };
    if (!res.ok) return { error: "http" };
    return { json: await res.json() };
  } catch {
    return { error: "offline" };
  }
}
const FIELDS = "product_name,brands,quantity,serving_size,serving_quantity,nutriments";
export async function lookupBarcode(code) {
  const r = await offFetch(`${OFF}/api/v3/product/${code}?fields=${FIELDS}&${APP}`);
  if (r.error || r.notFound) return r;
  if (!r.json?.product || r.json.status === "failure") return { notFound: true };
  return { result: fromOff(r.json.product, code) };
}
export async function searchFoods(word) {
  const q = encodeURIComponent(word.slice(0, 60));
  const r = await offFetch(`${OFF}/cgi/search.pl?search_terms=${q}&search_simple=1&action=process&json=1&page_size=12&fields=code,${FIELDS}&${APP}`);
  if (r.error || r.notFound) return r;
  const list = Array.isArray(r.json?.products) ? r.json.products.slice(0, 12) : [];
  return { results: list.map((p) => fromOff(p, typeof p.code === "string" && /^\d{8,14}$/.test(p.code) ? p.code : null)).filter((x) => x.food.name !== "Unnamed product") };
}
export const OFF_ERRORS = {
  offline: "No signal, or Open Food Facts did not answer. Try again, or add it as your own food.",
  busy: "Open Food Facts is busy. Try again in a minute.",
  http: "Open Food Facts did not answer properly. Try again, or add it as your own food.",
};
