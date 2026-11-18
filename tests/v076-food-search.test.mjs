// Version 0.7.6 (worker 8.43): food S1 from the Training Agent (Rosario, 2026-11-18: "add a online research so i can
// search for food online and get the nutritional values"). The name search address world.openfoodfacts.org/cgi/search.pl
// answers 503; the newer search.openfoodfacts.org/search answers (checked 2026-11-18). Rules:
// - the new address first: only the typed words plus the UK filter in q (countries_tags:"en:united-kingdom"), the
//   page size and the fields we need; no app_name, no key, no cookies, no referrer, no headers;
// - the typed words can never change the query: Lucene signs and AND / OR / NOT are taken out;
// - its answer ("hits") goes through the same parseProduct checks (brands may be a list);
// - if it fails, the old address once; if both fail, "Online search is not working right now. Try again later, or make
//   a new food." (no signal on both: the no-signal words); one search counts once against the 8-a-minute limit;
// - the CSP connect-src gains exactly https://search.openfoodfacts.org.
// A pretend fetch stands in for the network: no real call is made. Written BEFORE the change. All products are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createOff, OFF_WORDS, OFF_SEARCH_ORIGIN } from "../app/js/food/off.js";

const NEW = "https://search.openfoodfacts.org";
const UK = 'countries_tags:"en:united-kingdom"';
function fakeNet(answer) {
  const calls = [];
  const fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    const a = typeof answer === "function" ? answer(String(url), init) : answer;
    if (a instanceof Error) throw a;
    return new Response(JSON.stringify(a.body ?? {}), { status: a.status ?? 200, headers: { "content-type": "application/json" } });
  };
  return { calls, fetch };
}
const HIT = { code: "5000000000012", product_name: "Test mini rounds", brands: ["Brand X", "Brand Y"], quantity: "750g", serving_size: "8 pieces", serving_quantity: 30,
  nutriments: { "energy-kcal_100g": 204, proteins_100g: 2.5, carbohydrates_100g: 23.2, fat_100g: 10.5 } };
let t = 0;
const later = () => (t += 120000); // a fresh minute for every client: the limit never gets in the way

test("NS-1 the new address first, with only the words, the UK filter, the page size and our fields", async () => {
  assert.equal(OFF_SEARCH_ORIGIN, NEW);
  const net = fakeNet({ body: { hits: [HIT], page: 1, count: 1 } });
  const off = createOff({ fetch: net.fetch, version: "0.7.6", now: later });
  const res = await off.search("  mini rounds  ");
  assert.equal(res.ok, true);
  assert.equal(net.calls.length, 1, "no fallback when the new address answers");
  const u = new URL(net.calls[0].url);
  assert.equal(u.origin, NEW);
  assert.equal(u.pathname, "/search");
  assert.deepEqual([...u.searchParams.keys()].sort(), ["fields", "page_size", "q"], "nothing else is sent");
  assert.equal(u.searchParams.get("q"), `mini rounds ${UK}`);
  assert.ok(Number(u.searchParams.get("page_size")) <= 20);
  assert.deepEqual(u.searchParams.get("fields").split(",").sort(), ["brands", "code", "nutriments", "product_name", "product_name_en", "quantity", "serving_quantity", "serving_size"]);
  const init = net.calls[0].init;
  assert.equal(init.credentials, "omit");
  assert.equal(init.referrerPolicy, "no-referrer");
  assert.equal(init.headers, undefined, "no headers: no pre-flight, no key");
});

test("NS-2 the typed words can never change the query: Lucene signs and AND / OR / NOT go", async () => {
  const net = fakeNet({ body: { hits: [] } });
  const off = createOff({ fetch: net.fetch, version: "0.7.6", now: later });
  await off.search('oats" OR countries_tags:(en:france) AND NOT brands:x* ~2 \\ / [a TO b] {c} ^ ! + - && ||');
  const q = new URL(net.calls[0].url).searchParams.get("q");
  assert.ok(q.endsWith(` ${UK}`), "the UK filter is last and whole");
  const words = q.slice(0, -UK.length - 1);
  assert.doesNotMatch(words, /["():*~\\/[\]{}^!+&|-]/, "no Lucene sign is left in the words");
  assert.doesNotMatch(words, /\b(AND|OR|NOT|TO)\b/, "no Lucene word is left");
  assert.match(words, /^oats countries_tags en france brands x 2 a b c$/);
  net.calls.length = 0;
  assert.equal((await off.search('"" :: ()')).code, "short", "nothing left to search: no call");
  assert.equal(net.calls.length, 0);
});

test("NS-3 the hits go through the same checks: brand list joined, text cut, bad numbers empty, at most 20", async () => {
  const many = Array.from({ length: 30 }, (_, i) => ({ ...HIT, product_name: `${"N".repeat(200)}${i}`, nutriments: { "energy-kcal_100g": i === 0 ? 9999 : 204, proteins_100g: "12" } }));
  const off = createOff({ fetch: fakeNet({ body: { hits: [{ ...HIT }, ...many, "junk", null, { code: "1", nutriments: {} }] } }).fetch, version: "0.7.6", now: later });
  const res = await off.search("mini");
  assert.equal(res.ok, true);
  assert.equal(res.products.length, 20);
  const first = res.products[0];
  assert.equal(first.name, "Test mini rounds");
  assert.equal(first.brand, "Brand X, Brand Y");
  assert.equal(first.serving_g, 30);
  assert.equal(first.serving_label, "8 pieces");
  assert.deepEqual(first.per100g, { kcal: 204, protein_g: 2.5, carbs_g: 23.2, fat_g: 10.5 });
  assert.equal(first.source, "off");
  assert.ok(res.products[1].name.length <= 120, "text cut to 120 letters");
  assert.equal(res.products[1].per100g.kcal, null, "a number out of range becomes empty");
  const odd = createOff({ fetch: fakeNet({ body: { hits: [{ ...HIT, brands: ["A", 7, { x: 1 }, "B"] }, { ...HIT, brands: "Plain brand" }] } }).fetch, version: "0.7.6", now: later });
  const r2 = await odd.search("mini");
  assert.equal(r2.products[0].brand, "A, B", "only text brands");
  assert.equal(r2.products[1].brand, "Plain brand", "a text brand as before");
});

test("NS-4 the new address fails: the old address once, and its results are used", async () => {
  for (const bad of [{ status: 503, body: {} }, { status: 500, body: {} }, { status: 200, body: { hits: "nope" } }, new Error("network")]) {
    const net = fakeNet((url) => (url.startsWith(NEW) ? bad : { body: { products: [HIT] } }));
    const off = createOff({ fetch: net.fetch, version: "0.7.6", now: later });
    const res = await off.search("mini");
    assert.equal(res.ok, true, String(bad.status ?? bad.message));
    assert.equal(net.calls.length, 2);
    assert.equal(new URL(net.calls[1].url).pathname, "/cgi/search.pl");
    assert.equal(new URL(net.calls[1].url).searchParams.get("search_terms"), "mini");
    assert.equal(res.products[0].name, "Test mini rounds");
  }
});

test("NS-5 both fail: one plain message; one search counts once against the limit", async () => {
  assert.equal(OFF_WORDS.search_down, "Online search is not working right now. Try again later, or make a new food.");
  let clock = 50_000_000;
  const net = fakeNet({ status: 503, body: {} });
  const off = createOff({ fetch: net.fetch, version: "0.7.6", now: () => clock });
  const res = await off.search("mini");
  assert.deepEqual([res.ok, res.code, res.message], [false, "search_down", OFF_WORDS.search_down]);
  assert.equal(net.calls.length, 2, "the old address only once");
  for (let i = 1; i < 8; i++) assert.equal((await off.search("mini")).code, "search_down");
  assert.equal((await off.search("mini")).code, "wait", "8 searches a minute, not 4");
  clock += 60001;
  const off2 = createOff({ fetch: fakeNet(new Error("offline")).fetch, version: "0.7.6", now: later });
  const r = await off2.search("mini");
  assert.equal(r.code, "offline", "no signal on both: the no-signal words");
  assert.equal(r.message, OFF_WORDS.offline);
});

test("NS-6 the CSP gains exactly one origin, https://search.openfoodfacts.org; the rest is unchanged", () => {
  const html = readFileSync(new URL("../app/index.html", import.meta.url), "utf8");
  const csp = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)[1];
  const connect = csp.split(";").map((s) => s.trim()).find((s) => s.startsWith("connect-src "));
  assert.equal(connect, "connect-src 'self' https://api.github.com https://world.openfoodfacts.org https://search.openfoodfacts.org");
});

test("NS-7 the Diet search screen still says 'Only the word is sent.' and shows the message as text", () => {
  const src = readFileSync(new URL("../app/js/diet/sheets.js", import.meta.url), "utf8");
  assert.match(src, /Looking it up · Only the word is sent\./);
  assert.match(src, /const res = await off\.search\(text\);/);
  assert.match(src, /h\("p", \{ class: "error-text", role: "alert" \}, res\.message\)/);
});
