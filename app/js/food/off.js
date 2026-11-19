// Open Food Facts: look up a barcode, or search a food name (answers 64 a and 79 a). Research 8 and 9.5.
// Safety rules:
//  - only the barcode or the search word is sent, plus app_name / app_version (their rule for apps); no key, no
//    cookies, no referrer, no extra headers. The GitHub key is never near this file;
//  - name search finds UK products only (answer 79 a). It stays on this address: the newer search address of Open Food Facts
//    sends no CORS header, so a browser can not read it (checked 2026-11-18, master pick a). A failed search (busy,
//    broken answer, timeout) gets one plain message (0.7.6, food S1); no signal keeps the no-signal words;
//  - their text is typed by strangers: it is cleaned and cut to 120 letters here, and the page shows it as text only;
//    every number is range-checked (a bad one becomes null, and the check step asks Rosario to type it);
//  - a call gives up after 20 s; at most 10 lookups and 8 searches a minute (their limits are 15 and 10);
//  - the check digit is tested before any lookup.
import { cleanText, TEXT_MAX, PER100_MAX } from "./foodmath.js";
import { normalizeBarcode, BARCODE_WORDS } from "./barcode.js";

export const OFF_ORIGIN = "https://world.openfoodfacts.org";
export const OFF_LIMITS = Object.freeze({ reads: 10, searches: 8, windowMs: 60000 });
export const OFF_CREDIT_LINKS = Object.freeze({ off: "https://world.openfoodfacts.org", odbl: "https://opendatacommons.org/licenses/odbl/1-0/" });
export const OFF_WORDS = {
  offline: "No signal. Your foods still work. Try the lookup again when you are online.",
  timeout: "Open Food Facts did not answer. Try again, or make a new food.",
  busy: "Open Food Facts is busy. Try again in a minute.",
  bad: "Open Food Facts sent an answer the app can not read. Try again, or make a new food.",
  not_found: "Open Food Facts does not know this barcode. Make a new food with the numbers from the pack.",
  wait: "Many lookups in one minute. Wait {s} s, then try again.",
  short: "Type at least 2 letters.",
  search_down: "Online search is not working right now. Try again later, or make a new food.",
};
const TIMEOUT_MS = 20000;
const FIELDS = "code,product_name,product_name_en,brands,quantity,serving_size,serving_quantity,nutriments";
const PAGE = 20;
const WORD_MAX = 60;

const fin = (v) => typeof v === "number" && Number.isFinite(v);
function number(v) {
  if (typeof v === "string" && /^\s*\d+(\.\d+)?\s*$/.test(v)) v = Number(v);
  return fin(v) ? v : null;
}
const inRange = (v, max) => (v !== null && v >= 0 && v <= max ? Math.round(v * 10) / 10 : null);
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

// One product from their answer -> our shape. Pure. Only these fields are kept: no raw reply, no image links.
export function parseProduct(raw, code = null, fetchedAt = new Date().toISOString()) {
  const p = isObj(raw) ? raw : {};
  const n = isObj(p.nutriments) ? p.nutriments : {};
  let kcal = number(n["energy-kcal_100g"]);
  if (kcal === null) {
    const kj = number(n["energy-kj_100g"]) ?? number(n.energy_100g); // energy_100g is in kJ
    if (kj !== null) kcal = kj / 4.184;
  }
  const serving = number(p.serving_quantity);
  const bc = normalizeBarcode(String(code ?? p.code ?? ""));
  return {
    barcode: bc.ok ? bc.code : null,
    name: cleanText(typeof p.product_name === "string" && p.product_name.trim() ? p.product_name : p.product_name_en ?? "", TEXT_MAX),
    brand: cleanText(typeof p.brands === "string" ? p.brands : "", TEXT_MAX),
    quantity: cleanText(typeof p.quantity === "string" ? p.quantity : "", 60),
    serving_g: serving !== null && serving > 0 && serving <= 2000 ? Math.round(serving * 10) / 10 : null,
    serving_label: cleanText(typeof p.serving_size === "string" ? p.serving_size : "", 60),
    per100g: {
      kcal: inRange(kcal, PER100_MAX.kcal),
      protein_g: inRange(number(n.proteins_100g), PER100_MAX.macro),
      carbs_g: inRange(number(n.carbohydrates_100g), PER100_MAX.macro),
      fat_g: inRange(number(n.fat_100g), PER100_MAX.macro),
    },
    source: "off",
    off_fetched_at: fetchedAt,
  };
}
const hasAnything = (p) => p.name.length > 0 || Object.values(p.per100g).some((v) => v !== null);

// fetch: the page's fetch (tests pass a pretend one). version: the app version for app_version.
export function createOff({ fetch: doFetch, version = "0", now = Date.now, setTimer = setTimeout, clearTimer = clearTimeout }) {
  const used = { reads: [], searches: [] };

  // Count a call against the limit, or say how long to wait.
  function allow(kind) {
    const t = now();
    const list = used[kind].filter((x) => t - x < OFF_LIMITS.windowMs);
    used[kind] = list;
    if (list.length >= OFF_LIMITS[kind]) {
      const seconds = Math.max(1, Math.ceil((list[0] + OFF_LIMITS.windowMs - t) / 1000));
      return { ok: false, code: "wait", seconds, message: OFF_WORDS.wait.replace("{s}", String(seconds)) };
    }
    list.push(t);
    return null;
  }

  const fail = (code) => ({ ok: false, code, message: OFF_WORDS[code] });

  // One GET with a 20 s limit. Returns { status, json } or a failure.
  async function get(url) {
    const ctrl = new AbortController();
    let timedOut = false;
    const timer = setTimer(() => { timedOut = true; ctrl.abort(); }, TIMEOUT_MS);
    try {
      let res;
      try {
        res = await doFetch(url, { method: "GET", credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store", signal: ctrl.signal });
      } catch {
        return fail(timedOut ? "timeout" : "offline");
      }
      if (res.status === 429 || res.status === 503) return fail("busy");
      let json = null;
      try { json = await res.json(); } catch { json = null; }
      if (timedOut) return fail("timeout");
      return { ok: true, status: res.status, json };
    } finally {
      clearTimer(timer);
    }
  }

  const params = (extra) => {
    const q = new URLSearchParams(extra);
    q.set("app_name", "TrainingApp");
    q.set("app_version", String(version));
    return q;
  };

  return {
    // Look up one barcode. { ok: true, product } | { ok: false, code, message }.
    async lookup(text) {
      const bc = normalizeBarcode(text);
      if (!bc.ok) return { ok: false, code: bc.reason, message: BARCODE_WORDS[bc.reason] };
      const wait = allow("reads");
      if (wait) return wait;
      const r = await get(`${OFF_ORIGIN}/api/v3/product/${bc.code}?${params({ fields: FIELDS })}`);
      if (!r.ok) return r;
      if (r.status === 404) return fail("not_found");
      if (r.status !== 200 || !isObj(r.json)) return fail("bad");
      if (r.json.status === "failure" || !isObj(r.json.product)) return fail("not_found");
      const product = parseProduct(r.json.product, bc.code, new Date(now()).toISOString());
      if (!hasAnything(product)) return fail("not_found");
      return { ok: true, product };
    },

    // Search a food name, UK products only. { ok: true, products } | { ok: false, code, message }.
    async search(text) {
      const word = cleanText(text, WORD_MAX);
      if (word.length < 2) return fail("short");
      const wait = allow("searches");
      if (wait) return wait;
      const q = params({
        search_terms: word, search_simple: "1", action: "process", json: "1", page_size: String(PAGE),
        tagtype_0: "countries", tag_contains_0: "contains", tag_0: "en:united-kingdom", fields: FIELDS,
      });
      const r = await get(`${OFF_ORIGIN}/cgi/search.pl?${q}`);
      if (!r.ok && r.code === "offline") return r;
      if (!r.ok || r.status !== 200 || !isObj(r.json) || !Array.isArray(r.json.products)) return fail("search_down");
      const at = new Date(now()).toISOString();
      const products = r.json.products.slice(0, PAGE).map((p) => parseProduct(p, isObj(p) ? p.code : null, at)).filter(hasAnything);
      return { ok: true, products };
    },
  };
}
