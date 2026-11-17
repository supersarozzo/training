// Open Food Facts lookups (research section 8). Only the barcode or the search word leaves the phone, plus
// app_name=TrainingApp (never a name or an email). A plain fetch: no Authorization header, no cookies, no referrer.
// Lookups run only on submit (a scan read, a typed barcode, the Search button), never while typing, and the app keeps
// itself under Open Food Facts' limits (15 product reads and 10 searches a minute) with its own lower caps.
// Everything that comes back is typed by strangers: names are clipped and cleaned, numbers are checked.

const BASE = "https://world.openfoodfacts.org";
const TAG = "app_name=TrainingApp&app_version=proto-b";
const FIELDS = "code,product_name,brands,serving_size,serving_quantity,nutriments";
const CAPS = { product: 10, search: 8 };
const calls = { product: [], search: [] };

function allow(kind) {
  const now = Date.now();
  calls[kind] = calls[kind].filter((t) => now - t < 60000);
  if (calls[kind].length >= CAPS[kind]) return false;
  calls[kind].push(now);
  return true;
}

export function cleanText(v, max = 120) {
  let s = typeof v === "string" ? v : "";
  s = s.replace(/[\u0000-\u001f\u007f​-‏‪-‮]/g, " ").replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
function num(v, max) {
  const n = typeof v === "string" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > max) return null;
  return Math.round(n * 10) / 10;
}

// One product as a food draft (the shape of a saved food, research 9.3) plus warnings for the check step.
export function toDraft(p, code) {
  const n = (p && typeof p.nutriments === "object" && p.nutriments) || {};
  let kcal = num(n["energy-kcal_100g"], 900);
  if (kcal === null) { const kj = num(n["energy-kj_100g"] ?? n.energy_100g, 3800); if (kj !== null) kcal = Math.round(kj / 4.184); }
  const per100g = { kcal, protein_g: num(n.proteins_100g, 100), carbs_g: num(n.carbohydrates_100g, 100), fat_g: num(n.fat_100g, 100) };
  const serving = num(p?.serving_quantity, 2000);
  const draft = {
    name: cleanText(p?.product_name) || "Unnamed product",
    brand: cleanText(String(p?.brands ?? "").split(",")[0], 60),
    barcode: code, per100g, serving_g: serving && serving >= 1 ? serving : null, serving_label: cleanText(p?.serving_size, 40) || null,
  };
  return { draft, warnings: checkNumbers(per100g) };
}

// Soft checks (research 9.5): missing numbers, macros over 100 g, kcal far from 4 × protein + 4 × carbs + 9 × fat.
export function checkNumbers(per) {
  const w = [];
  const missing = Object.entries(per).filter(([, v]) => v === null || v === "" || !Number.isFinite(Number(v))).map(([k]) => ({ kcal: "calories", protein_g: "protein", carbs_g: "carbs", fat_g: "fat" })[k]);
  if (missing.length) w.push(`Missing: ${missing.join(", ")}. Fill them in from the pack.`);
  const p = Number(per.protein_g) || 0, c = Number(per.carbs_g) || 0, f = Number(per.fat_g) || 0, k = Number(per.kcal) || 0;
  if (p + c + f > 100.5) w.push("Protein, carbs and fat add up to more than 100 g per 100 g. One of them is wrong.");
  const est = 4 * p + 4 * c + 9 * f;
  if (!missing.length && Math.abs(est - k) > Math.max(40, k * 0.2)) w.push(`These numbers do not add up: 4 × protein + 4 × carbs + 9 × fat = ${Math.round(est)} kcal, but it says ${Math.round(k)} kcal. Check the pack.`);
  return w;
}

async function getJson(url) {
  // Gym signal is often weak: give up after 20 s (Open Food Facts took 8-13 s in tests), so the screen never spins for ever (shown as "No signal").
  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(), 20000);
  let r;
  try { r = await fetch(url, { credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer", mode: "cors", signal: stop.signal }); }
  finally { clearTimeout(timer); }
  if (r.status === 404) return { notFound: true };
  if (r.status === 503 || r.status === 429) throw Object.assign(new Error("busy"), { code: "busy" });
  if (!r.ok) throw Object.assign(new Error("http"), { code: "http" });
  return r.json();
}

export async function lookupBarcode(code) {
  if (!/^\d{8,13}$/.test(code)) return { status: "bad" };
  if (!allow("product")) return { status: "limit" };
  try {
    const j = await getJson(`${BASE}/api/v3/product/${code}?fields=${FIELDS}&${TAG}`);
    if (j.notFound || !j.product || (j.status && j.status !== "success" && j.status !== "success_with_warnings")) return { status: "not_found" };
    return { status: "found", ...toDraft(j.product, code) };
  } catch (e) {
    return { status: e.code === "busy" ? "busy" : "offline" };
  }
}

export async function searchFoods(word) {
  const q = cleanText(word, 60);
  if (q.length < 2) return { status: "short" };
  if (!allow("search")) return { status: "limit" };
  try {
    const j = await getJson(`${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=8&fields=${FIELDS}&${TAG}`);
    const list = Array.isArray(j.products) ? j.products.slice(0, 8) : [];
    return { status: "ok", items: list.map((p) => { const code = /^\d{8,14}$/.test(String(p.code ?? "")) ? String(p.code) : null; return { code, ...toDraft(p, code) }; }) };
  } catch (e) {
    return { status: e.code === "busy" ? "busy" : "offline" };
  }
}

export const OFF_LINKS = { site: "https://world.openfoodfacts.org", odbl: "https://opendatacommons.org/licenses/odbl/1-0/" };
