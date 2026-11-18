// 0.7.3: the iPhone never showed "New version ready" and kept running an old version (worker 8.40,
// docs/checks/2026-11-18-v073-update.md). Two causes, both replayed on the computer in Chrome:
//  A. The worker answered from ALL caches (`caches.match`), oldest first. WebKit can make a newly installed worker
//     active without running its activate step (after a restart of its background process it restores the last
//     installed worker as "activated"), so the old cache is never deleted and the app keeps showing old files,
//     with no bar, because the newest worker is already active.
//  B. Install used `cache.addAll`, which may take files from the browser's own HTTP cache (GitHub Pages says
//     max-age=600) or from a CDN copy made before the push: a "new" cache full of old files.
// The fix: the worker answers only from its own cache; old caches go once the new one is complete (activate or the
// first fetch); install fetches every file fresh (?v=<version>, cache "reload"), retries a failed file, checks that
// js/version.js is really the new version, and never keeps a half-filled cache. The page asks for an update at start,
// on coming to the front and on pageshow, sees a worker that was already installing, and shows the bar whenever a
// worker waits. It never reloads by itself.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { APP_VERSION } from "../app/js/version.js";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const sw = read("app/sw.js");
const FILES = [...sw.slice(sw.indexOf("const FILES"), sw.indexOf("];")).matchAll(/"([^"]+)"/g)].map((m) => m[1]);
const ORIGIN = "https://example.test";
const BASE = `${ORIGIN}/training/`;
const plain = (f) => new URL(f, BASE).href;

// Loaded this way so each test reports on its own while app/js/updater.js does not exist yet (tests first).
const updaterMod = await import("../app/js/updater.js").catch(() => ({}));
const need = (name) => updaterMod[name] ?? (() => { throw new Error(`app/js/updater.js: ${name} missing`); });

// ---------- a fake worker world with real-ish caches (ordered like WebKit and the spec: creation order) ----------
function response(body, { status = 200, redirected = false, url = "" } = {}) {
  return { ok: status >= 200 && status < 300, status, redirected, url, type: "basic", body,
    clone() { return response(body, { status, redirected, url }); }, text: async () => body };
}
function world({ net = () => null, version = APP_VERSION } = {}) {
  const stores = new Map(); // name -> Map(url without query -> response)
  const calls = []; // { url, cache }
  let inFlight = 0, maxInFlight = 0;
  const strip = (u) => { const x = new URL(typeof u === "string" ? u : u.url); x.search = ""; return x.href; };
  const cacheObj = (name) => ({
    put: async (key, res) => { if (!stores.has(name)) return; stores.get(name).set(strip(key), res); },
    match: async (req, opts = {}) => { const m = stores.get(name); if (!m) return undefined; const k = opts.ignoreSearch ? strip(req) : (typeof req === "string" ? req : req.url); return m.get(k); },
    addAll: async () => { throw new Error("addAll is not used in 0.7.3"); },
  });
  const caches = {
    open: async (name) => { if (!stores.has(name)) stores.set(name, new Map()); return cacheObj(name); },
    has: async (name) => stores.has(name),
    keys: async () => [...stores.keys()],
    delete: async (name) => stores.delete(name),
    match: async (req, opts = {}) => { for (const m of stores.values()) { const hit = m.get(opts.ignoreSearch ? strip(req) : req.url); if (hit) return hit; } return undefined; },
  };
  const fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input.url;
    calls.push({ url, cache: init.cache });
    inFlight++; maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise((r) => setImmediate(r));
    inFlight--;
    const special = net(url, init);
    if (special instanceof Error) throw special;
    if (special) return special;
    const path = new URL(url).pathname.replace("/training/", "");
    if (path === "js/version.js") return response(`export const APP_VERSION = "${version}";`, { url });
    return response(`new:${path || "./"}`, { url });
  };
  const handlers = {};
  const self = { location: { origin: ORIGIN, href: `${BASE}sw.js` }, addEventListener: (t, f) => { handlers[t] = f; }, skipWaiting: () => { self.skipped = true; }, clients: { claim: async () => {} } };
  const ctx = vm.createContext({ self, caches, fetch, URL, Request: class { constructor(u) { this.url = String(u); } }, setTimeout: (f) => setImmediate(f), Promise, Array, Math, Number, Error, String, Object });
  vm.runInContext(sw, ctx);
  const run = async (type, ev = {}) => {
    const waits = []; let answer;
    handlers[type]({ ...ev, waitUntil: (p) => waits.push(p), respondWith: (p) => { answer = p; } });
    const result = answer ? await answer : undefined;
    await Promise.all(waits);
    return result;
  };
  return { run, stores, calls, self, caches, get maxInFlight() { return maxInFlight; } };
}
const CACHE = `training-${APP_VERSION}`;
const req = (path) => ({ method: "GET", url: `${BASE}${path}` });
const oldCache = (w, name = "training-0.7.0") => w.stores.set(name, new Map(FILES.map((f) => [plain(f), response(`old:${f}`)])));

// ---------- version ----------
test("V1 version: 0.7.3 in js/version.js and at the top of sw.js", () => {
  assert.equal(APP_VERSION, "0.7.3");
  assert.equal(sw.match(/const APP_VERSION = "([^"]+)"/)[1], "0.7.3");
});

// ---------- install (cause B) ----------
test("S1 install fetches every file fresh: a ?v=<version> address and cache 'reload', stored under the plain address", async () => {
  const w = world();
  await w.run("install");
  const store = w.stores.get(CACHE);
  assert.equal(store.size, FILES.length);
  for (const f of FILES) assert.ok(store.has(plain(f)), f);
  for (const c of w.calls) {
    assert.equal(new URL(c.url).searchParams.get("v"), APP_VERSION, c.url);
    assert.ok(c.cache === "reload" || c.cache === "no-store", `${c.url} cache=${c.cache}`);
  }
  assert.equal((await store.get(plain("js/main.js")).text()), "new:js/main.js");
});

test("S2 an old copy on the phone or the CDN never fills the new cache: only the fresh address is used", async () => {
  // The plain address still gives the old file (HTTP cache / CDN), the fresh one gives the new file.
  const w = world({ net: (url) => (new URL(url).searchParams.has("v") ? null : response(`old:${new URL(url).pathname}`)) });
  await w.run("install");
  for (const [, res] of w.stores.get(CACHE)) assert.doesNotMatch(await res.text(), /^old:/);
});

test("S3 the server still gives an older js/version.js (a CDN copy from before the push): install fails, no new cache, old cache kept", async () => {
  const w = world({ version: "0.7.2" });
  oldCache(w);
  await assert.rejects(w.run("install"));
  assert.equal(w.stores.has(CACHE), false);
  assert.ok(w.stores.has("training-0.7.0"));
});

test("S4 a file that fails once is tried again: install still succeeds", async () => {
  let failed = false;
  const w = world({ net: (url) => { if (!failed && url.includes("media/exercises/plank/0.jpg")) { failed = true; return new TypeError("network lost"); } return null; } });
  await w.run("install");
  assert.ok(failed);
  assert.equal(w.stores.get(CACHE).size, FILES.length);
});

test("S5 a file that keeps failing: install fails, the half-filled new cache is deleted, the old version keeps working", async () => {
  const w = world({ net: (url) => (url.includes("js/ui/today.js") ? new TypeError("network lost") : null) });
  oldCache(w);
  await assert.rejects(w.run("install"));
  assert.equal(w.stores.has(CACHE), false);
  assert.deepEqual([...w.stores.keys()], ["training-0.7.0"]); // the old worker still answers from its own, untouched cache
});

test("S6 a 404, a 500 or a redirected answer counts as a failure (never stored)", async () => {
  for (const bad of [response("nope", { status: 404 }), response("err", { status: 500 }), response("moved", { redirected: true })]) {
    const w = world({ net: (url) => (url.includes("css/app.css") ? bad : null) });
    await assert.rejects(w.run("install"));
    assert.equal(w.stores.has(CACHE), false);
  }
});

test("S7 a failed install never deletes a cache of the same name that was there before it started", async () => {
  const w = world({ net: (url) => (url.includes("js/ui/today.js") ? new TypeError("network lost") : null) });
  w.stores.set(CACHE, new Map([[plain("js/main.js"), response("kept")]]));
  await assert.rejects(w.run("install"));
  assert.ok(w.stores.has(CACHE));
});

test("S8 install asks for at most 6 files at a time (gentle on a phone)", async () => {
  const w = world();
  await w.run("install");
  assert.ok(w.maxInFlight <= 6, `max ${w.maxInFlight}`);
  assert.ok(w.maxInFlight >= 2, "files load in parallel");
});

test("S9 install never takes over by itself: skipWaiting only after the Update tap (SKIP_WAITING)", async () => {
  const w = world();
  await w.run("install");
  assert.notEqual(w.self.skipped, true);
  await w.run("message", { data: "SKIP_WAITING" });
  assert.equal(w.self.skipped, true);
});

// ---------- fetch (cause A) ----------
test("S10 with an old cache still on the phone (created first), the worker answers from its OWN cache", async () => {
  const w = world();
  oldCache(w); // created before the new one, so caches.match would find it first
  await w.run("install");
  const res = await w.run("fetch", { request: req("js/version.js?x=1") });
  assert.match(await res.text(), new RegExp(APP_VERSION.replaceAll(".", "\\.")));
  const page = await w.run("fetch", { request: req("?sw=1") });
  assert.equal(await page.text(), "new:./");
});

test("S11 the first fetch removes OLDER app caches once the own cache is complete (WebKit may skip activate)", async () => {
  const w = world();
  oldCache(w, "training-0.7.0");
  oldCache(w, "training-0.7.2");
  w.stores.set("training-0.10.0", new Map()); // a NEWER version that may be installing right now: never touched
  w.stores.set("other-cache", new Map());
  await w.run("install");
  await w.run("fetch", { request: req("js/main.js") });
  assert.deepEqual([...w.stores.keys()].sort(), ["other-cache", CACHE, "training-0.10.0"].sort());
});

test("S12 the first fetch keeps old caches when the own cache is missing (evicted): the old files are better than nothing offline", async () => {
  const w = world();
  oldCache(w);
  const res = await w.run("fetch", { request: req("js/main.js") });
  assert.ok(w.stores.has("training-0.7.0"));
  assert.equal(await res.text(), "new:js/main.js"); // straight from the network, not the old cache
});

test("S13 a file missing from the own cache comes from the network; other sites and non-GET are never answered", async () => {
  const w = world();
  await w.run("install");
  w.stores.get(CACHE).delete(plain("css/app.css"));
  assert.equal(await (await w.run("fetch", { request: req("css/app.css") })).text(), "new:css/app.css");
  assert.equal(await w.run("fetch", { request: { method: "GET", url: "https://api.github.com/repos/x" } }), undefined);
  assert.equal(await w.run("fetch", { request: { method: "PUT", url: `${BASE}js/main.js` } }), undefined);
});

test("S14 activate deletes only OLDER app caches (never a newer one, never other caches)", async () => {
  const w = world();
  oldCache(w, "training-0.6.0");
  oldCache(w, "training-0.7.2");
  w.stores.set("training-0.7.10", new Map());
  w.stores.set("other-cache", new Map());
  await w.run("install");
  await w.run("activate");
  assert.deepEqual([...w.stores.keys()].sort(), ["other-cache", CACHE, "training-0.7.10"].sort());
});

test("S15 the code: no cache.addAll, no search across all caches in the fetch answer", () => {
  assert.doesNotMatch(sw, /addAll\(/);
  assert.doesNotMatch(sw, /caches\.match\(/);
  assert.match(sw, /url\.origin !== self\.location\.origin\) return/);
});

// ---------- the page side (app/js/updater.js) ----------
function fakeWorker(state) {
  const w = { state, posted: [], listeners: {}, addEventListener(t, f) { (w.listeners[t] ??= []).push(f); }, postMessage(m) { w.posted.push(m); },
    to(s) { w.state = s; (w.listeners.statechange ?? []).forEach((f) => f()); } };
  return w;
}
function page({ controller = true, waiting = null, installing = null, update } = {}) {
  const reg = { waiting, installing, listeners: {}, updates: 0, addEventListener(t, f) { (reg.listeners[t] ??= []).push(f); },
    update() { reg.updates++; return update ? update(reg) : Promise.resolve(); },
    found(worker) { reg.installing = worker; (reg.listeners.updatefound ?? []).forEach((f) => f()); } };
  const sw = { controller: controller ? {} : null, registered: [], listeners: {}, addEventListener(t, f) { (sw.listeners[t] ??= []).push(f); },
    register(url, opts) { sw.registered.push([url, opts]); return Promise.resolve(reg); }, fire(t) { (sw.listeners[t] ?? []).forEach((f) => f()); } };
  const doc = { hidden: false, listeners: {}, addEventListener(t, f) { (doc.listeners[t] ??= []).push(f); }, fire(t) { (doc.listeners[t] ?? []).forEach((f) => f()); } };
  const win = { reloads: 0, listeners: {}, addEventListener(t, f) { (win.listeners[t] ??= []).push(f); }, fire(t, e = {}) { (win.listeners[t] ?? []).forEach((f) => f(e)); }, location: { reload() { win.reloads++; } } };
  let changes = 0;
  const u = need("createUpdater")({ sw, doc, win, onChange: () => { changes++; } });
  return { u, reg, sw, doc, win, get changes() { return changes; } };
}
const tick = () => new Promise((r) => setImmediate(r));

test("U1 registers sw.js with updateViaCache 'none' and asks for an update at start", async () => {
  const p = page();
  await p.u.start(); await tick();
  assert.deepEqual(p.sw.registered, [["sw.js", { updateViaCache: "none" }]]);
  assert.ok(p.reg.updates >= 1);
});

test("U2 a worker already waiting at start shows the bar", async () => {
  const p = page({ waiting: fakeWorker("installed") });
  await p.u.start(); await tick();
  assert.equal(p.u.waiting(), p.reg.waiting);
  assert.ok(p.changes >= 1);
});

test("U3 a worker that was already installing when the page registered still shows the bar when it is ready", async () => {
  const w = fakeWorker("installing");
  const p = page({ installing: w });
  await p.u.start(); await tick();
  assert.equal(p.u.waiting(), null);
  w.to("installed");
  assert.equal(p.u.waiting(), w);
});

test("U4 a worker found later (updatefound) shows the bar when installed; a failed one does not", async () => {
  const p = page();
  await p.u.start(); await tick();
  const bad = fakeWorker("installing"); p.reg.found(bad); bad.to("redundant");
  assert.equal(p.u.waiting(), null);
  const good = fakeWorker("installing"); p.reg.found(good); good.to("installed");
  assert.equal(p.u.waiting(), good);
});

test("U5 coming to the front and pageshow ask for an update and look at reg.waiting again; hidden does not", async () => {
  const p = page();
  await p.u.start(); await tick();
  const before = p.reg.updates;
  p.doc.hidden = true; p.doc.fire("visibilitychange"); await tick();
  assert.equal(p.reg.updates, before);
  p.doc.hidden = false; p.doc.fire("visibilitychange"); await tick();
  assert.equal(p.reg.updates, before + 1);
  p.reg.waiting = fakeWorker("installed"); // e.g. installed while the app was in the background
  p.win.fire("pageshow", { persisted: true }); await tick();
  assert.equal(p.reg.updates, before + 2);
  assert.equal(p.u.waiting(), p.reg.waiting);
});

test("U6 never reloads by itself: a new controller without the tap does nothing; after Update it reloads once", async () => {
  const w = fakeWorker("installed");
  const p = page({ waiting: w });
  await p.u.start(); await tick();
  p.sw.fire("controllerchange");
  assert.equal(p.win.reloads, 0);
  p.u.apply();
  assert.deepEqual(w.posted, ["SKIP_WAITING"]);
  p.sw.fire("controllerchange");
  assert.equal(p.win.reloads, 1);
});

test("U7 the very first install (no controller yet) shows no bar", async () => {
  const p = page({ controller: false, waiting: fakeWorker("installed") });
  await p.u.start(); await tick();
  assert.equal(p.u.waiting(), null);
});

// U8 (Check for update) was replaced by the Update button at the top of Settings (Training Agent, Rosario's wish,
// 2026-11-18): tests/v073-update-button.test.mjs B1-B13.

test("U9 the words for each check result are plain and short", () => {
  const words = need("updateWords");
  for (const s of ["checking", "downloading", "ready", "none", "offline", "reinstalling", "workout"]) { // changed for the Update button (B tests)
    const t = words(s);
    assert.equal(typeof t, "string");
    assert.ok(t.length > 5 && t.length < 90, `${s}: ${t}`);
  }
  assert.equal(words("idle"), "");
});

test("U10 the worker runs on https, and on localhost only with ?sw", () => {
  const wanted = need("workerWanted");
  const nav = { serviceWorker: {} };
  assert.equal(wanted({ protocol: "https:", hostname: "supersarozzo.github.io", search: "" }, nav), true);
  assert.equal(wanted({ protocol: "http:", hostname: "localhost", search: "" }, nav), false);
  assert.equal(wanted({ protocol: "http:", hostname: "localhost", search: "?sw=1" }, nav), true);
  assert.equal(wanted({ protocol: "https:", hostname: "x", search: "" }, {}), false);
});

// ---------- wiring ----------
test("W1 update.js uses the updater; Settings shows the app version (the Update button: B13)", () => {
  const upd = read("app/js/ui/update.js");
  assert.match(upd, /createUpdater\(/);
  assert.doesNotMatch(upd, /register\("sw\.js"\)/);
  const settings = read("app/js/ui/settings.js");
  assert.match(settings, /APP_VERSION/);
});
