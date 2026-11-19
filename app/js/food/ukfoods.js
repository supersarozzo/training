// Built-in UK foods (0.7.7, Rosario's answers 97, 104 a and 105 a, 2026-11-18): plain foods from McCance and
// Widdowson's Composition of Foods Integrated Dataset 2021 (CoFID), Public Health England, under the Open Government
// Licence v3.0. The list ships with the app (data/uk-foods.json, made by tests/tools/build-uk-foods.py, in the sw.js
// FILES list), so it works with no signal and no new network address. Research: docs/research/2026-11-18-uk-food-tables.md.
// The file is our own, but every row is still checked here and only ever shown as text nodes (never as page markup).

export const UK_LICENCE_LINK = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";
export const UK_WORDS = {
  group: "Common UK foods (built in, work offline)",
  sub: "UK food tables",
  heading: "From the UK food tables",
  line: "From the UK food tables. Numbers per 100 g, edible part. You can change anything.",
  loading: "Loading the UK foods…",
  failed: "The built-in UK foods did not load. Your foods and Search still work.",
};
const DATA_URL = new URL("../../data/uk-foods.json", import.meta.url).href;
const CODE = /^\d{2}-\d{1,4}[a-h]?$/;
export const UK_ID = /^fu-\d{2}-\d{1,4}[a-h]?$/;
export const ukFoodId = (code) => `fu-${code}`;

const okNum = (n, max) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= max;
const wordsOf = (text) => String(text).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

// The file's rows become foods. A row that is not exactly right is left out, never guessed.
export function parseUkFoods(doc) {
  const rows = doc && typeof doc === "object" && Array.isArray(doc.foods) ? doc.foods : [];
  const out = [];
  for (const r of rows) {
    if (!Array.isArray(r) || r.length !== 6) continue;
    const [code, name, kcal, protein_g, carbs_g, fat_g] = r;
    if (typeof code !== "string" || !CODE.test(code)) continue;
    if (typeof name !== "string" || name.length === 0 || name.length > 120 || name !== name.trim() || /[\u0000-\u001f\u007f]/.test(name)) continue;
    if (!okNum(kcal, 900) || ![protein_g, carbs_g, fat_g].every((x) => okNum(x, 100))) continue;
    out.push({ code, id: ukFoodId(code), name, per100g: { kcal, protein_g, carbs_g, fat_g }, words: wordsOf(name) });
  }
  return out;
}

// True when every typed word starts a word of the text, in any order (also used by Your foods, 0.7.7).
export function matchesWords(text, query) {
  const typed = wordsOf(query ?? "");
  const words = wordsOf(text ?? "");
  return typed.length > 0 && typed.every((t) => words.some((w) => w.startsWith(t)));
}

// Every typed word must match the start of a word in the name, in any order ("chick breast" finds "Chicken, breast,
// grilled..."). Names that start with the first typed word come first, then shorter names, then A to Z.
// Returns { rows: the first `limit`, total }. `exclude`: ids already in Your foods (shown there only).
export function searchUk(list, query, { limit = 8, exclude = new Set() } = {}) {
  const typed = wordsOf(query ?? "");
  if (!typed.length) return { rows: [], total: 0 };
  const hits = list.filter((f) => !exclude.has(f.id) && typed.every((t) => f.words.some((w) => w.startsWith(t))));
  const rank = (f) => (f.words[0].startsWith(typed[0]) ? 0 : 1);
  hits.sort((a, b) => rank(a) - rank(b) || a.name.length - b.name.length || (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1));
  return { rows: hits.slice(0, limit), total: hits.length };
}

// What the food sheet saves for a UK food: one record on every phone (like a barcode food), source "uk".
export function ukFields(f) {
  return { id: f.id, name: f.name, per100g: { ...f.per100g }, serving_g: null, serving_label: "", source: "uk" };
}

// Load the list once per page (later calls get the same answer). It is read as a JSON module (data only, never run),
// from the app's own files like every other module, so the service worker answers it offline and the page makes no
// fetch call for it. A failed load is forgotten, so the next search sheet tries again.
const importJson = () => import(DATA_URL, { with: { type: "json" } }).then((m) => m.default);
let loader = importJson;
let loading = null;
export function loadUkFoods() {
  if (!loading) {
    loading = (async () => {
      const list = parseUkFoods(await loader());
      if (!list.length) throw new Error("uk foods: empty");
      return list;
    })();
    loading.catch(() => { loading = null; });
  }
  return loading;
}
// Tests only: stand in for the file (null: the real one again).
export function setUkLoader(fn) { loader = fn ?? importJson; loading = null; }
export function resetUkFoods() { loading = null; }
