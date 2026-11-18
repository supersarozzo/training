// Version 0.7.6 (worker 8.43): food S1 from the Training Agent (Rosario, 2026-11-18: "add a online research so i can
// search for food online and get the nutritional values"), master pick a (2026-11-18). The newer address
// search.openfoodfacts.org sends no CORS header (Access-Control-Allow-Origin), so a browser can never read it (checked
// with curl and headless Chrome on 2026-11-18). So:
// - the name search keeps the old address only, world.openfoodfacts.org/cgi/search.pl, as in 0.7.5 (UK only, only the
//   word, 8 a minute);
// - when it fails (busy, broken answer, timeout), one plain message: "Online search is not working right now. Try again
//   later, or make a new food." No signal: the no-signal words, as before;
// - the CSP stays exactly as in 0.7.5;
// - a failed search changes nothing (no food saved, the list of your foods still works).
// A pretend fetch stands in for the network: no real call is made. Written BEFORE the change. All products are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { install, byText } from "./fixtures/sheet-dom.mjs";
import { createOff, OFF_WORDS, OFF_ORIGIN } from "../app/js/food/off.js";

const { body } = install();
globalThis.location.hash = "#/diet";
globalThis.requestAnimationFrame = () => 0;

function fakeNet(answer) {
  const calls = [];
  const fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    const a = typeof answer === "function" ? answer(String(url), init) : answer;
    if (a instanceof Error) throw a;
    if (a && a.hang) return new Promise((_, reject) => init.signal?.addEventListener("abort", () => { const e = new Error("aborted"); e.name = "AbortError"; reject(e); }));
    return new Response(JSON.stringify(a.body ?? {}), { status: a.status ?? 200, headers: { "content-type": "application/json" } });
  };
  return { calls, fetch };
}
const P = { code: "5000000000012", product_name: "Test mini rounds", brands: "Brand X", serving_size: "8 pieces", serving_quantity: 30,
  nutriments: { "energy-kcal_100g": 204, proteins_100g: 2.5, carbohydrates_100g: 23.2, fat_100g: 10.5 } };
let t = 0;
const later = () => (t += 120000); // a fresh minute for every client

test("NS-1 the search uses the old address only, once, UK products only; never search.openfoodfacts.org", async () => {
  const net = fakeNet({ body: { products: [P] } });
  const off = createOff({ fetch: net.fetch, version: "0.7.6", now: later });
  const res = await off.search("mini rounds");
  assert.equal(res.ok, true);
  assert.equal(net.calls.length, 1);
  const u = new URL(net.calls[0].url);
  assert.equal(u.origin, OFF_ORIGIN);
  assert.equal(u.pathname, "/cgi/search.pl");
  assert.equal(u.searchParams.get("search_terms"), "mini rounds");
  assert.equal(u.searchParams.get("tag_0"), "en:united-kingdom");
  assert.equal(res.products[0].name, "Test mini rounds");
  assert.doesNotMatch(readFileSync(new URL("../app/js/food/off.js", import.meta.url), "utf8"), /search\.openfoodfacts\.org/, "no unusable address left in the app");
});

test("NS-2 a failed search: one plain message, one call, counted once", async () => {
  assert.equal(OFF_WORDS.search_down, "Online search is not working right now. Try again later, or make a new food.");
  for (const bad of [{ status: 503 }, { status: 429 }, { status: 500 }, { status: 200, body: { products: "nope" } }, { status: 200, body: [] }]) {
    const net = fakeNet(bad);
    const off = createOff({ fetch: net.fetch, version: "0.7.6", now: later });
    const r = await off.search("mini");
    assert.deepEqual([r.ok, r.code, r.message], [false, "search_down", OFF_WORDS.search_down], JSON.stringify(bad));
    assert.equal(net.calls.length, 1, "no second address, no retry");
  }
  let clock = 70_000_000;
  const off = createOff({ fetch: fakeNet({ status: 503 }).fetch, version: "0.7.6", now: () => clock });
  for (let i = 0; i < 8; i++) assert.equal((await off.search("mini")).code, "search_down");
  assert.equal((await off.search("mini")).code, "wait", "8 searches a minute, as before");
});

test("NS-3 the search gives up after 20 s with the plain message; no signal keeps the no-signal words", { timeout: 5000 }, async () => {
  let timer = null;
  const off = createOff({ fetch: fakeNet({ hang: true }).fetch, version: "0.7.6", now: later, setTimer: (fn) => { timer = fn; return 1; }, clearTimer: () => {} });
  const p = off.search("mini");
  await new Promise((r) => setTimeout(r, 0));
  timer();
  assert.equal((await p).code, "search_down");
  const offline = createOff({ fetch: fakeNet(new Error("offline")).fetch, version: "0.7.6", now: later });
  const r = await offline.search("mini");
  assert.deepEqual([r.code, r.message], ["offline", OFF_WORDS.offline]);
});

test("NS-4 the CSP stays exactly as in 0.7.5", () => {
  const html = readFileSync(new URL("../app/index.html", import.meta.url), "utf8");
  const csp = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)[1];
  assert.equal(csp, "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data:; connect-src 'self' https://api.github.com https://world.openfoodfacts.org; object-src 'none'; base-uri 'none'; form-action 'none'");
});

test("NS-5 the Diet search: a failed search shows the message as text and changes nothing", { timeout: 5000 }, async () => {
  await import("../app/js/ui/app.js");
  const S = await import("../app/js/diet/sheets.js");
  const { food: fm } = await import("../app/js/diet/foodapp.js");
  fm.saveFood({ name: "Test oats NS5", per100g: { kcal: 370, protein_g: 11, carbs_g: 60, fat_g: 8 }, source: "own" });
  const before = JSON.stringify(fm.doc());
  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => { calls.push(String(url)); return new Response("{}", { status: 503 }); };
  S.openSearch();
  const sheet = body.querySelectorAll("[data-sheet]").slice(-1)[0];
  const input = sheet.querySelectorAll("input").find((i) => i.getAttribute("inputmode") === "search");
  input.input("mini rounds");
  const form = sheet.querySelectorAll("form")[0]; // the fake page has no form submit: run the form's own submit handler
  for (const fn of form.listeners.submit ?? []) fn({ type: "submit", target: form, preventDefault() {} });
  for (let i = 0; i < 20 && !sheet.textContent.includes(OFF_WORDS.search_down); i++) await new Promise((r) => setTimeout(r, 5));
  const msg = sheet.querySelectorAll("p").find((p) => p.textContent === OFF_WORDS.search_down);
  assert.ok(msg, "the plain message");
  assert.equal(msg.getAttribute("role"), "alert");
  assert.equal(calls.length, 1);
  assert.ok(calls[0].startsWith(`${OFF_ORIGIN}/cgi/search.pl?`));
  assert.equal(JSON.stringify(fm.doc()), before, "nothing saved or changed");
  assert.ok(byText(sheet, "button", "Make a new food"), "a way on");
  globalThis.fetch = realFetch;
});
