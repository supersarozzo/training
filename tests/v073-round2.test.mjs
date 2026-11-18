// 0.7.3 review round 2 (docs/checks/2026-11-18-v073-update.md). Worker 8.40's planted mistakes for round 2 passed
// every test, so each one shows a gap in the tests. These tests close the two gaps:
//  Q1 a page load (navigate) opens from the cache even when its cache mode is "no-store" (only a NON-navigation
//     no-store request, the Update button's version check, goes to the network). Without this the app would not
//     open offline after a reload that asks for no-store.
//  Q2 version numbers compare part by part as numbers: 0.7.10 is newer than 0.7.9 (a text compare says no, and the
//     Update button would say "You have the newest version." for ever from 0.7.10 on).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const mod = await import("../app/js/updater.js").catch(() => ({}));
const need = (name) => mod[name] ?? (() => { throw new Error(`app/js/updater.js: ${name} missing`); });

test("Q1 a page load with cache 'no-store' still opens from the cache; offline too", async () => {
  const sw = read("app/sw.js");
  const handlers = {};
  const net = { online: true };
  const ctx = vm.createContext({
    self: { location: { origin: "https://e.test", href: "https://e.test/sw.js" }, addEventListener: (t, f) => { handlers[t] = f; } },
    caches: { has: async () => true, open: async () => ({ match: async () => "cached" }), keys: async () => [] },
    fetch: async () => { if (!net.online) throw new TypeError("Load failed"); return "network"; }, URL, setTimeout,
  });
  vm.runInContext(sw, ctx);
  const load = async () => {
    let answered = null;
    handlers.fetch({ request: { method: "GET", url: "https://e.test/", cache: "no-store", mode: "navigate" }, respondWith: (p) => { answered = p; }, waitUntil() {} });
    assert.ok(answered, "the worker answers a page load");
    return answered;
  };
  assert.equal(await load(), "cached");
  net.online = false;
  assert.equal(await load(), "cached");
});

test("Q2 version numbers compare as numbers, part by part", () => {
  const isNewer = need("isNewer");
  assert.equal(isNewer("0.7.10", "0.7.9"), true);
  assert.equal(isNewer("0.7.9", "0.7.10"), false);
  assert.equal(isNewer("0.10.0", "0.9.9"), true);
  assert.equal(isNewer("1.0.0", "0.99.99"), true);
  assert.equal(isNewer("0.7.4", "0.7.3"), true);
  assert.equal(isNewer("0.7.3", "0.7.3"), false);
  assert.equal(isNewer("0.7.3.1", "0.7.3"), true);
  assert.equal(isNewer("0.7.3", "0.7.3.0"), false);
  assert.equal(isNewer("0.7.2", "0.7.3"), false);
  assert.equal(isNewer("abc", "0.7.3"), false);
  assert.equal(isNewer("", "0.7.3"), false);
});

test("Q2b the Update button at 0.7.9 with 0.7.10 online downloads (never 'newest version')", async () => {
  let clock = 0;
  const w = { state: "installed", posted: [], addEventListener() {}, postMessage(m) { w.posted.push(m); } };
  const reg = { waiting: null, installing: null, addEventListener() {}, update() { reg.waiting = w; return Promise.resolve(); }, unregister: () => Promise.resolve(true) };
  const sw = { controller: {}, addEventListener() {}, register: () => Promise.resolve(reg) };
  const doc = { hidden: false, addEventListener() {} };
  const win = { reloads: 0, addEventListener() {}, location: { reload() { win.reloads++; } } };
  const u = need("createUpdater")({
    sw, doc, win, version: "0.7.9", now: () => clock, sleep: async (ms) => { clock += ms; },
    fetch: async () => ({ ok: true, text: async () => 'export const APP_VERSION = "0.7.10";' }),
    caches: { keys: async () => [], delete: async () => true },
  });
  await u.start();
  await u.updateNow();
  assert.notEqual(u.status(), "none");
  assert.deepEqual(w.posted, ["SKIP_WAITING"]);
});

// Round 2 checker findings (tests first):
//  Q3 (checker 2): a workout started while the button waits for the new worker (20-90 s): no reload, no cache
//     deletion, no unregister; the card says "Finish the workout first"; a waiting worker stays for the bar later.
//  Q4 (checker 3): a cache named "training-" or "training--1" or "training-0..1" is not an app version: never deleted.
function buttonPage({ workoutAfter = 1, worker = true } = {}) {
  let clock = 0;
  let calls = 0;
  const w = { state: "installed", posted: [], addEventListener() {}, postMessage(m) { w.posted.push(m); } };
  const reg = { waiting: null, installing: null, unregistered: 0, addEventListener() {},
    update() { if (worker) reg.waiting = w; return Promise.resolve(); }, unregister() { reg.unregistered++; return Promise.resolve(true); } };
  const sw = { controller: {}, addEventListener() {}, register: () => Promise.resolve(reg) };
  const doc = { hidden: false, addEventListener() {} };
  const win = { reloads: 0, addEventListener() {}, location: { reload() { win.reloads++; } } };
  const deleted = [];
  const u = need("createUpdater")({
    sw, doc, win, version: "0.7.3", now: () => clock, sleep: async (ms) => { clock += ms; },
    inWorkout: () => calls++ >= workoutAfter, // free at the tap, a workout starts during the wait
    fetch: async () => ({ ok: true, text: async () => 'export const APP_VERSION = "0.7.4";' }),
    caches: { keys: async () => ["training-0.7.3"], delete: async (k) => { deleted.push(k); return true; } },
  });
  return { u, w, reg, win, deleted };
}

test("Q3 a workout started during the wait: no takeover and no reload (a worker came)", async () => {
  const p = buttonPage({ worker: true });
  await p.u.start();
  await p.u.updateNow();
  assert.equal(p.win.reloads, 0);
  assert.deepEqual(p.w.posted, []);
  assert.equal(p.u.status(), "workout");
  assert.equal(p.u.waiting(), p.w, "the worker still waits: the bar can show after the workout");
});

test("Q3b a workout started during the wait: no cache deletion, no unregister, no reload (no worker came)", async () => {
  const p = buttonPage({ worker: false });
  await p.u.start();
  await p.u.updateNow();
  assert.equal(p.win.reloads, 0);
  assert.deepEqual(p.deleted, []);
  assert.equal(p.reg.unregistered, 0);
  assert.equal(p.u.status(), "workout");
});

test("Q4 caches with no real version number after training- are never deleted", async () => {
  const sw = read("app/sw.js");
  const { APP_VERSION } = await import("../app/js/version.js");
  const stores = new Map();
  const odd = ["training-", "training--1", "training-0..1", "training-0.7.-1", "training-x", "other-app"];
  for (const k of [...odd, "training-0.7.2"]) stores.set(k, new Map());
  const handle = (m) => ({ put: async (key, res) => { m.set(new URL(typeof key === "string" ? key : key.url).href.split("?")[0], res); }, match: async (r) => m.get(new URL(typeof r === "string" ? r : r.url).href.split("?")[0]) });
  const caches = {
    open: async (n) => { if (!stores.has(n)) stores.set(n, new Map()); return handle(stores.get(n)); },
    has: async (n) => stores.has(n), keys: async () => [...stores.keys()], delete: async (n) => stores.delete(n),
  };
  const res = (body) => ({ ok: true, status: 200, redirected: false, clone() { return res(body); }, text: async () => body });
  const fetch = async (u) => { const path = new URL(typeof u === "string" ? u : u.url).pathname; return res(path.endsWith("js/version.js") ? `export const APP_VERSION = "${APP_VERSION}";` : "x"); };
  const handlers = {};
  vm.runInContext(sw, vm.createContext({ self: { location: { origin: "https://e.test", href: "https://e.test/training/sw.js" }, addEventListener: (t, f) => { handlers[t] = f; }, skipWaiting() {} }, caches, fetch, URL, setTimeout: (f) => setImmediate(f), Promise }));
  const run = async (type) => { const waits = []; handlers[type]({ waitUntil: (p) => waits.push(p) }); await Promise.all(waits); };
  await run("install");
  await run("activate");
  assert.equal(stores.has("training-0.7.2"), false, "a real older version goes");
  for (const k of odd) assert.ok(stores.has(k), `${k} kept`);
});

// Round 2 auditor findings (tests first):
//  Q5 (auditor 3): the button's fallback deletes only caches named training-<version number>; "training-notes" (another
//     project on the same github.io address) stays.
//  Q6 (auditor 4): before the fallback deletes anything, the live sw.js (no-store) must name the live version; if the
//     website is still half updated (a CDN copy), say so and change nothing (else the phone would be left online-only).
//  Q7 (auditor 5): the live check also carries "live=" in its address, and the worker never answers such a request from
//     its cache, in case Safari does not pass the "no-store" mode on to the worker. A page load still opens from the cache.
//  Q8 (auditor 9): while the new version takes over, the card says it is starting, not "Tap Update".
function fallbackPage({ swText = 'const APP_VERSION = "0.7.4";', swFails = false, names = ["training-0.7.3", "training-0.7.2", "training-notes", "other-app"] } = {}) {
  let clock = 0;
  const reg = { waiting: null, installing: null, unregistered: 0, addEventListener() {}, update: () => Promise.resolve(), unregister() { reg.unregistered++; return Promise.resolve(true); } };
  const sw = { controller: {}, addEventListener() {}, register: () => Promise.resolve(reg) };
  const doc = { hidden: false, addEventListener() {} };
  const win = { reloads: 0, addEventListener() {}, location: { reload() { win.reloads++; } } };
  const fetched = [];
  const list = [...names];
  const u = need("createUpdater")({
    sw, doc, win, version: "0.7.3", now: () => clock, sleep: async (ms) => { clock += ms; },
    fetch: async (url, init) => {
      fetched.push({ url, init });
      if (/sw\.js/.test(url)) { if (swFails) throw new TypeError("Load failed"); return { ok: true, text: async () => swText }; }
      return { ok: true, text: async () => 'export const APP_VERSION = "0.7.4";' };
    },
    caches: { keys: async () => [...list], delete: async (k) => { const i = list.indexOf(k); if (i >= 0) list.splice(i, 1); return i >= 0; } },
  });
  return { u, reg, win, fetched, list };
}

test("Q5 the fallback deletes only training-<number> caches", async () => {
  const p = fallbackPage();
  await p.u.start();
  await p.u.updateNow();
  assert.deepEqual(p.list, ["training-notes", "other-app"]);
  assert.equal(p.reg.unregistered, 1);
  assert.equal(p.win.reloads, 1);
});

test("Q6 the website's sw.js does not name the live version yet: nothing deleted, no unregister, no reload, plain words", async () => {
  const p = fallbackPage({ swText: 'const APP_VERSION = "0.7.3";' });
  await p.u.start();
  await p.u.updateNow();
  assert.equal(p.list.length, 4);
  assert.equal(p.reg.unregistered, 0);
  assert.equal(p.win.reloads, 0);
  assert.equal(p.u.status(), "siteupdating");
  const words = need("updateWords")("siteupdating");
  assert.match(words, /website/i);
  assert.ok(words.length > 5 && words.length < 90);
  const sw = p.fetched.find((f) => /sw\.js/.test(f.url));
  assert.equal(sw.init.cache, "no-store");
});

test("Q6b no signal for the sw.js check: 'offline', nothing changed", async () => {
  const p = fallbackPage({ swFails: true });
  await p.u.start();
  await p.u.updateNow();
  assert.equal(p.list.length, 4);
  assert.equal(p.reg.unregistered, 0);
  assert.equal(p.win.reloads, 0);
  assert.equal(p.u.status(), "offline");
});

test("Q7 the live checks carry live= in the address; the worker never answers them from its cache", async () => {
  const p = fallbackPage();
  await p.u.start();
  await p.u.updateNow();
  for (const f of p.fetched) assert.match(f.url, /[?&]live=/, f.url);
  const src = read("app/sw.js");
  const handlers = {};
  vm.runInContext(src, vm.createContext({
    self: { location: { origin: "https://e.test", href: "https://e.test/sw.js" }, addEventListener: (t, f) => { handlers[t] = f; } },
    caches: { has: async () => true, open: async () => ({ match: async () => "cached" }), keys: async () => [] },
    fetch: async () => "network", URL, setTimeout,
  }));
  const ask = async (request) => { let a = null; handlers.fetch({ request, respondWith: (x) => { a = x; }, waitUntil() {} }); return a === null ? "network" : await a; };
  assert.equal(await ask({ method: "GET", url: "https://e.test/js/version.js?live=1", cache: "default", mode: "cors" }), "network");
  assert.equal(await ask({ method: "GET", url: "https://e.test/js/version.js", cache: "default", mode: "cors" }), "cached");
  assert.equal(await ask({ method: "GET", url: "https://e.test/?live=1", cache: "default", mode: "navigate" }), "cached");
});

test("Q8 while the new version takes over, the card says it is starting (not 'Tap Update')", async () => {
  const w = { state: "installed", posted: [], addEventListener() {}, postMessage(m) { w.posted.push(m); } };
  const p = fallbackPage();
  p.reg.update = () => { p.reg.waiting = w; return Promise.resolve(); };
  await p.u.start();
  await p.u.updateNow();
  assert.deepEqual(w.posted, ["SKIP_WAITING"]);
  assert.equal(p.u.status(), "restarting");
  assert.doesNotMatch(need("updateWords")("restarting"), /Tap Update/);
});
