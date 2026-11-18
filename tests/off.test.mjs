// Open Food Facts client (build step 7, untrusted data: research 9.5; answers 64 a and 79 a).
// Written before the code (tests first). A pretend fetch stands in for the network: no real call is made.
// - Only the barcode or the search word is sent, plus app_name=TrainingApp; no Authorization header, no cookies.
// - Name search finds UK products only. Search and lookup give up after 20 s. 10 reads and 8 searches a minute.
// - Their text is cleaned and cut to 120 letters; every number is range-checked; kJ becomes kcal when kcal is missing.
import test from "node:test";
import assert from "node:assert/strict";
import { createOff, parseProduct, OFF_ORIGIN, OFF_LIMITS, OFF_WORDS, OFF_CREDIT_LINKS } from "../app/js/food/off.js";

const TWIX = { code: "5000159484695", product_name: "Twix glacé", brands: "Twix", quantity: "1 gram", serving_size: "43.1 gram", serving_quantity: 43.1,
  nutriments: { "energy-kcal_100g": 280.74, "energy-kj_100g": 1179.8, proteins_100g: 2.78, carbohydrates_100g: 34.8, fat_100g: 14.62, sugars_100g: 25.5 } };

function fakeNet(answer) {
  const calls = [];
  const fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    const a = typeof answer === "function" ? answer(String(url), init) : answer;
    if (a instanceof Error) throw a;
    if (a && a.hang) return new Promise((_, reject) => init.signal?.addEventListener("abort", () => { const e = new Error("aborted"); e.name = "AbortError"; reject(e); }));
    return new Response(typeof a.body === "string" ? a.body : JSON.stringify(a.body), { status: a.status ?? 200, headers: { "content-type": "application/json" } });
  };
  return { calls, fetch };
}
const found = (product) => ({ body: { status: "success", result: { id: "product_found" }, product } });
let clock = 0;
const now = () => clock;

test("O1 a lookup sends only the barcode (and app_name), to world.openfoodfacts.org, with no key, no cookies, no referrer", async () => {
  const net = fakeNet(found(TWIX));
  const off = createOff({ fetch: net.fetch, version: "0.7.0", now });
  const res = await off.lookup("5000159484695");
  assert.equal(res.ok, true);
  assert.equal(net.calls.length, 1);
  const u = new URL(net.calls[0].url);
  assert.equal(u.origin, OFF_ORIGIN);
  assert.equal(OFF_ORIGIN, "https://world.openfoodfacts.org");
  assert.equal(u.pathname, "/api/v3/product/5000159484695");
  assert.equal(u.searchParams.get("app_name"), "TrainingApp");
  assert.equal(u.searchParams.get("app_version"), "0.7.0");
  assert.deepEqual([...u.searchParams.keys()].sort(), ["app_name", "app_version", "fields"]);
  const init = net.calls[0].init;
  assert.equal(init.credentials, "omit");
  assert.equal(init.referrerPolicy, "no-referrer");
  assert.equal(init.method ?? "GET", "GET");
  const headers = new Headers(init.headers || {});
  assert.equal(headers.get("authorization"), null);
  assert.equal([...headers.keys()].length, 0, "no extra headers: no pre-flight, nothing personal");
});

test("O2 a lookup refuses a code that fails the check digit and makes NO call", async () => {
  const net = fakeNet(found(TWIX));
  const off = createOff({ fetch: net.fetch, version: "0.7.0", now });
  const res = await off.lookup("5000159484696");
  assert.equal(res.ok, false);
  assert.equal(res.code, "check");
  assert.match(res.message, /No lookup was made\./);
  assert.equal(net.calls.length, 0);
});

test("O3 the product comes back in our shape: text cleaned and cut, numbers per 100 g, the serving in grams", async () => {
  const off = createOff({ fetch: fakeNet(found(TWIX)).fetch, version: "0.7.0", now });
  const { product } = await off.lookup("5000159484695");
  assert.deepEqual(product.per100g, { kcal: 280.7, protein_g: 2.8, carbs_g: 34.8, fat_g: 14.6 });
  assert.equal(product.name, "Twix glacé");
  assert.equal(product.brand, "Twix");
  assert.equal(product.quantity, "1 gram");
  assert.equal(product.serving_g, 43.1);
  assert.equal(product.serving_label, "43.1 gram");
  assert.equal(product.barcode, "5000159484695");
  assert.equal(product.source, "off");
  assert.match(product.off_fetched_at, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(Object.keys(product).sort().join(","), "barcode,brand,name,off_fetched_at,per100g,quantity,serving_g,serving_label,source", "only these fields: no raw reply, no image links");
});

test("O4 untrusted text: HTML stays plain text, control and direction letters go, 120 letters at most", () => {
  const p = parseProduct({ code: "5000159484695", product_name: `<img src=x onerror=alert(1)>‮${"a".repeat(300)}`, brands: "B\u0000rand", nutriments: { "energy-kcal_100g": 100, proteins_100g: 1 } }, "5000159484695");
  assert.ok(p.name.startsWith("<img src=x onerror=alert(1)>"), "kept as text; the page shows it with textContent only");
  assert.ok(!p.name.includes("‮"));
  assert.equal(p.name.length, 120);
  assert.equal(p.brand, "Brand");
});

test("O5 numbers: range-checked; a bad one becomes null and is reported; kJ becomes kcal when kcal is missing", () => {
  const bad = parseProduct({ product_name: "x", nutriments: { "energy-kcal_100g": 5000, proteins_100g: -3, carbohydrates_100g: "12", fat_100g: 250 }, serving_quantity: 999999 }, "5000159484695");
  assert.deepEqual(bad.per100g, { kcal: null, protein_g: null, carbs_g: 12, fat_g: null });
  assert.equal(bad.serving_g, null);
  const kj = parseProduct({ product_name: "x", nutriments: { "energy-kj_100g": 1674, proteins_100g: 10 } }, "5000159484695");
  assert.equal(kj.per100g.kcal, 400.1);
  const energyOnly = parseProduct({ product_name: "x", nutriments: { energy_100g: 418.4, "energy_unit": "kJ" } }, "5000159484695");
  assert.equal(energyOnly.per100g.kcal, 100);
  const nan = parseProduct({ product_name: "x", nutriments: { "energy-kcal_100g": NaN, proteins_100g: Infinity } }, "5000159484695");
  assert.deepEqual([nan.per100g.kcal, nan.per100g.protein_g], [null, null]);
  const noName = parseProduct({ nutriments: {} }, "5000159484695");
  assert.equal(noName.name, "");
});

test("O6 a code Open Food Facts does not know, or knows with no name and no numbers: 'not found'", async () => {
  const off = createOff({ fetch: fakeNet({ status: 404, body: { status: "failure", result: { id: "product_not_found" } } }).fetch, version: "0.7.0", now });
  const res = await off.lookup("5000159484695");
  assert.deepEqual([res.ok, res.code], [false, "not_found"]);
  assert.equal(res.message, OFF_WORDS.not_found);
  const empty = createOff({ fetch: fakeNet(found({ code: "5000159484695" })).fetch, version: "0.7.0", now });
  assert.equal((await empty.lookup("5000159484695")).code, "not_found");
});

test("O7 no signal, a busy server (503, 429), a broken answer: plain codes, nothing thrown", async () => {
  const offline = createOff({ fetch: fakeNet(new TypeError("Load failed")).fetch, version: "0.7.0", now });
  assert.equal((await offline.lookup("5000159484695")).code, "offline");
  for (const status of [503, 429]) {
    const busy = createOff({ fetch: fakeNet({ status, body: {} }).fetch, version: "0.7.0", now });
    assert.equal((await busy.lookup("5000159484695")).code, "busy");
  }
  const broken = createOff({ fetch: fakeNet({ status: 200, body: "<html>" }).fetch, version: "0.7.0", now });
  assert.equal((await broken.lookup("5000159484695")).code, "bad");
  const err = createOff({ fetch: fakeNet({ status: 500, body: {} }).fetch, version: "0.7.0", now });
  assert.equal((await err.lookup("5000159484695")).code, "bad");
  for (const k of ["offline", "busy", "bad", "timeout", "not_found", "wait", "short"]) assert.equal(typeof OFF_WORDS[k], "string", k);
});

test("O8 the lookup gives up after 20 s: 'Open Food Facts did not answer'", async () => {
  const timers = [];
  const off = createOff({ fetch: fakeNet({ hang: true }).fetch, version: "0.7.0", now, setTimer: (fn, ms) => { timers.push(ms); return setTimeout(fn, 1); }, clearTimer: clearTimeout });
  const res = await off.lookup("5000159484695");
  assert.deepEqual(timers, [20000]);
  assert.equal(res.code, "timeout");
  assert.match(OFF_WORDS.timeout, /^Open Food Facts did not answer/);
});

test("O9 rate limits: 10 lookups and 8 searches a minute; the 11th lookup waits, makes no call, says how long", async () => {
  assert.deepEqual(OFF_LIMITS, { reads: 10, searches: 8, windowMs: 60000 });
  clock = 1_000_000;
  const net = fakeNet((url) => (url.includes("/cgi/search.pl") ? { body: { products: [] } } : found(TWIX)));
  const off = createOff({ fetch: net.fetch, version: "0.7.0", now });
  for (let i = 0; i < 10; i++) assert.equal((await off.lookup("5000159484695")).ok, true);
  const over = await off.lookup("5000159484695");
  assert.equal(over.code, "wait");
  assert.ok(over.seconds > 0 && over.seconds <= 60);
  assert.match(over.message, /\d+ s/);
  assert.equal(net.calls.length, 10);
  for (let i = 0; i < 8; i++) assert.equal((await off.search("skyr")).ok, true);
  assert.equal((await off.search("skyr")).code, "wait");
  clock += 60001;
  assert.equal((await off.lookup("5000159484695")).ok, true, "a minute later it works again");
  assert.equal((await off.search("skyr")).ok, true);
});

test("O10 search sends only the word, UK products only, a few fields; never the barcode route", async () => {
  clock = 5_000_000;
  const net = fakeNet({ body: { count: 2, products: [{ code: "5000159484695", product_name: "Skyr A", brands: "X", nutriments: { "energy-kcal_100g": 60, proteins_100g: 11 } }, { code: "abc", product_name: "Bad code", nutriments: {} }] } });
  const off = createOff({ fetch: net.fetch, version: "0.7.0", now });
  const res = await off.search("  skyr  ");
  assert.equal(res.ok, true);
  const u = new URL(net.calls[0].url);
  assert.equal(u.origin, OFF_ORIGIN);
  assert.equal(u.pathname, "/cgi/search.pl");
  assert.equal(u.searchParams.get("search_terms"), "skyr");
  assert.equal(u.searchParams.get("tagtype_0"), "countries");
  assert.equal(u.searchParams.get("tag_contains_0"), "contains");
  assert.equal(u.searchParams.get("tag_0"), "en:united-kingdom");
  assert.equal(u.searchParams.get("json"), "1");
  assert.equal(u.searchParams.get("app_name"), "TrainingApp");
  assert.ok(Number(u.searchParams.get("page_size")) <= 20);
  assert.equal(res.products.length, 2);
  assert.equal(res.products[0].name, "Skyr A");
  assert.equal(res.products[1].barcode, null, "a code that is not a real barcode is dropped, the food can still be checked");
  assert.equal(new Headers(net.calls[0].init.headers || {}).get("authorization"), null);
});

test("O11 search refuses a too short or too long word without a call, and strips control letters", async () => {
  const net = fakeNet({ body: { products: [] } });
  const off = createOff({ fetch: net.fetch, version: "0.7.0", now });
  assert.equal((await off.search("a")).code, "short");
  assert.equal((await off.search("   ")).code, "short");
  assert.equal(net.calls.length, 0);
  await off.search(`oat\u0000s ${"x".repeat(200)}`);
  const term = new URL(net.calls[0].url).searchParams.get("search_terms");
  assert.ok(term.startsWith("oats "));
  assert.ok(term.length <= 60);
});

test("O12 search results: at most 20, each through the same checks", async () => {
  const many = Array.from({ length: 50 }, (_, i) => ({ code: "5000159484695", product_name: `P${i}`, nutriments: { "energy-kcal_100g": 9999 } }));
  const off = createOff({ fetch: fakeNet({ body: { products: many } }).fetch, version: "0.7.0", now: () => 9_000_000 });
  const res = await off.search("many");
  assert.equal(res.products.length, 20);
  assert.equal(res.products[0].per100g.kcal, null);
  const junk = createOff({ fetch: fakeNet({ body: { products: "nope" } }).fetch, version: "0.7.0", now: () => 9_000_000 });
  assert.equal((await junk.search("junk")).code, "search_down", "0.7.6 (food S1): a failed search gets one plain message");
});

test("O13 the credit links point to Open Food Facts and the ODbL", () => {
  assert.equal(OFF_CREDIT_LINKS.off, "https://world.openfoodfacts.org");
  assert.equal(OFF_CREDIT_LINKS.odbl, "https://opendatacommons.org/licenses/odbl/1-0/");
});
