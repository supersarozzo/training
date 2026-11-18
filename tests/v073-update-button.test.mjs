// 0.7.3 add (Rosario via the Training Agent, 2026-11-18): "an update button at the top of Settings that pulls the new
// version and updates it, and says which version the app is". The rules (Training Agent):
//  - Settings starts with "Version <APP_VERSION>" and an Update button; the button is off while a workout runs.
//  - The tap reads the live js/version.js with cache "no-store". Same (or older) version: "You have the newest version."
//    No signal or no good answer: "No signal. Try again later." and nothing changes.
//  - Newer: ask the worker for an update; when a new worker waits, it takes over and the page reloads (the user tapped).
//  - No worker arrives in time: delete the app's training-* caches, unregister the worker, reload from the network.
//  - localStorage is never touched. The worker must not answer that no-store check from its cache.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const mod = await import("../app/js/updater.js").catch(() => ({}));
const createUpdater = mod.createUpdater ?? (() => { throw new Error("app/js/updater.js missing"); });

function fakeWorker(state) {
  const w = { state, posted: [], listeners: {}, addEventListener(t, f) { (w.listeners[t] ??= []).push(f); }, postMessage(m) { w.posted.push(m); },
    to(s) { w.state = s; (w.listeners.statechange ?? []).forEach((f) => f()); } };
  return w;
}

// A page with a fake clock: sleep(ms) moves the clock and lets the test's own timeline run.
function page({ live = '"0.7.4"', liveOk = true, offline = false, waiting = null, onUpdate, workout = false, timeline = [] } = {}) {
  let clock = 0;
  const reg = { waiting, installing: null, listeners: {}, updates: 0, unregistered: 0,
    addEventListener(t, f) { (reg.listeners[t] ??= []).push(f); },
    update() { reg.updates++; if (onUpdate) onUpdate(reg); return Promise.resolve(); },
    unregister() { reg.unregistered++; return Promise.resolve(true); },
    found(worker) { reg.installing = worker; (reg.listeners.updatefound ?? []).forEach((f) => f()); } };
  const sw = { controller: {}, listeners: {}, addEventListener(t, f) { (sw.listeners[t] ??= []).push(f); },
    register: () => Promise.resolve(reg), fire(t) { (sw.listeners[t] ?? []).forEach((f) => f()); } };
  const doc = { hidden: false, addEventListener() {} };
  const win = { reloads: 0, addEventListener() {}, location: { reload() { win.reloads++; } } };
  const fetched = [];
  const fetch = async (url, init) => {
    fetched.push({ url, init });
    if (offline) throw new TypeError("Load failed");
    return { ok: liveOk, status: liveOk ? 200 : 503, text: async () => `// x\nexport const APP_VERSION = ${live};\n` };
  };
  const names = ["training-0.7.0", "training-0.7.3", "other-cache"];
  const caches = { keys: async () => [...names], delete: async (k) => { const i = names.indexOf(k); if (i >= 0) names.splice(i, 1); return i >= 0; } };
  const sleep = async (ms) => { clock += ms; for (const step of timeline) if (!step.done && clock >= step.at) { step.done = true; step.run(reg, sw); } await new Promise((r) => setImmediate(r)); };
  const u = createUpdater({ sw, doc, win, onChange: () => {}, fetch, caches, version: "0.7.3", inWorkout: () => workout, sleep, now: () => clock });
  return { u, reg, sw, win, fetched, names, get clock() { return clock; } };
}
const started = async (p) => { await p.u.start(); await new Promise((r) => setImmediate(r)); return p; };

test("B1 the same version online: 'none', no update, no reload, no cache deleted", async () => {
  const p = await started(page({ live: '"0.7.3"' }));
  const before = p.reg.updates;
  await p.u.updateNow();
  assert.equal(p.u.status(), "none");
  assert.equal(p.reg.updates, before);
  assert.equal(p.win.reloads, 0);
  assert.deepEqual(p.names, ["training-0.7.0", "training-0.7.3", "other-cache"]);
});

test("B2 an OLDER version online (a CDN copy from before a push) also says 'none' and changes nothing", async () => {
  const p = await started(page({ live: '"0.7.2"' }));
  await p.u.updateNow();
  assert.equal(p.u.status(), "none");
  assert.equal(p.win.reloads, 0);
});

test("B3 no signal, a server error or an unreadable file: 'offline' and nothing changes", async () => {
  for (const opts of [{ offline: true }, { liveOk: false }, { live: "nothing here" }]) {
    const p = await started(page(opts));
    await p.u.updateNow();
    assert.equal(p.u.status(), "offline", JSON.stringify(opts));
    assert.equal(p.win.reloads, 0);
    assert.equal(p.reg.unregistered, 0);
    assert.equal(p.names.length, 3);
  }
});

test("B4 newer, a worker already waiting: it takes over and the page reloads once on the new controller; no cache deleted", async () => {
  const w = fakeWorker("installed");
  const p = await started(page({ waiting: w }));
  await p.u.updateNow();
  assert.deepEqual(w.posted, ["SKIP_WAITING"]);
  p.sw.fire("controllerchange");
  assert.equal(p.win.reloads, 1);
  assert.equal(p.names.length, 3);
  assert.equal(p.reg.unregistered, 0);
});

test("B5 newer, the update brings a worker that finishes installing during the wait: it takes over", async () => {
  const w = fakeWorker("installing");
  const p = await started(page({ onUpdate: (reg) => { if (reg.updates === 2) reg.found(w); }, timeline: [{ at: 3000, run: () => w.to("installed") }] }));
  await p.u.updateNow();
  assert.deepEqual(w.posted, ["SKIP_WAITING"]);
  assert.equal(p.reg.unregistered, 0);
});

test("B6 newer and no worker ever comes: app caches deleted (others kept), worker unregistered, one reload; at most 20 s", async () => {
  const p = await started(page());
  await p.u.updateNow();
  assert.deepEqual(p.names, ["other-cache"]);
  assert.equal(p.reg.unregistered, 1);
  assert.equal(p.win.reloads, 1);
  assert.ok(p.clock <= 20000, `waited ${p.clock} ms`);
  assert.equal(p.u.status(), "reinstalling");
});

test("B7 a worker still downloading after 20 s gets more time (up to 90 s) before the fallback", async () => {
  const w = fakeWorker("installing");
  const p = await started(page({ onUpdate: (reg) => { if (reg.updates === 2) reg.found(w); }, timeline: [{ at: 45000, run: () => w.to("installed") }] }));
  await p.u.updateNow();
  assert.deepEqual(w.posted, ["SKIP_WAITING"]);
  assert.equal(p.reg.unregistered, 0);

  const slow = fakeWorker("installing");
  const q = await started(page({ onUpdate: (reg) => { if (reg.updates === 2) reg.found(slow); } }));
  await q.u.updateNow();
  assert.ok(q.clock <= 90000 && q.clock >= 80000, `waited ${q.clock} ms`);
  assert.equal(q.reg.unregistered, 1);
});

test("B8 while a workout runs the tap does nothing (no network, no reload): 'workout'", async () => {
  const p = await started(page({ workout: true, waiting: fakeWorker("installed") }));
  await p.u.updateNow();
  assert.equal(p.u.status(), "workout");
  assert.equal(p.fetched.length, 0);
  assert.equal(p.win.reloads, 0);
});

test("B9 the check reads js/version.js with cache 'no-store'", async () => {
  const p = await started(page({ live: '"0.7.3"' }));
  await p.u.updateNow();
  assert.equal(p.fetched.length, 1);
  assert.match(p.fetched[0].url, /(^|\/)js\/version\.js(\?|$)/);
  assert.equal(p.fetched[0].init.cache, "no-store");
});

test("B10 after SKIP_WAITING, no new controller within 10 s: the page reloads anyway (once)", async () => {
  const w = fakeWorker("installed");
  const p = await started(page({ waiting: w }));
  await p.u.updateNow();
  for (let i = 0; i < 5; i++) await new Promise((r) => setImmediate(r)); // the 10 s safety reload runs in the background
  assert.equal(p.win.reloads, 1);
  p.sw.fire("controllerchange");
  assert.equal(p.win.reloads, 1, "never a second reload");
});

test("B11 a second tap while one runs is ignored", async () => {
  const p = await started(page());
  await Promise.all([p.u.updateNow(), p.u.updateNow()]);
  // Changed in review round 2 (auditor 4): the fallback also reads the live sw.js once, so count the version checks.
  assert.equal(p.fetched.filter((f) => /version\.js/.test(f.url)).length, 1);
  assert.equal(p.win.reloads, 1);
});

test("B12 the worker never answers a no-store check from its cache; a page load still opens from the cache", async () => {
  const sw = read("app/sw.js");
  const handlers = {};
  const hits = [];
  const ctx = vm.createContext({
    self: { location: { origin: "https://e.test", href: "https://e.test/sw.js" }, addEventListener: (t, f) => { handlers[t] = f; } },
    caches: { has: async () => true, open: async () => ({ match: async (r) => { hits.push(r.url); return "cached"; } }), keys: async () => [] },
    fetch: async () => "network", URL, setTimeout,
  });
  vm.runInContext(sw, ctx);
  let answered = null;
  handlers.fetch({ request: { method: "GET", url: "https://e.test/js/version.js", cache: "no-store", mode: "cors" }, respondWith: (p) => { answered = p; }, waitUntil() {} });
  assert.ok(answered === null || (await answered) === "network", "no-store goes to the network");
  answered = null;
  handlers.fetch({ request: { method: "GET", url: "https://e.test/", cache: "reload", mode: "navigate" }, respondWith: (p) => { answered = p; }, waitUntil() {} });
  assert.equal(await answered, "cached");
});

test("B13 Settings starts with the version line and the Update button, off during a workout; updater.js never touches localStorage", () => {
  const settings = read("app/js/ui/settings.js");
  const body = settings.slice(settings.indexOf("export function renderSettings"));
  const h1 = body.indexOf('h("h1", {}, "Settings")');
  const card = body.indexOf("versionCard(");
  assert.ok(h1 > 0 && card > h1 && card < body.indexOf("syncCard()"), "the version card comes right after the title, before sync");
  const fn = settings.slice(settings.indexOf("function versionCard"));
  assert.match(fn, /`Version \$\{APP_VERSION\}`/);
  assert.match(fn, /"Update"/);
  assert.match(fn, /disabled:/);
  const updater = read("app/js/updater.js");
  assert.doesNotMatch(updater, /localStorage|sessionStorage|indexedDB/);
  const words = mod.updateWords ?? (() => "");
  assert.equal(words("offline"), "No signal. Try again later.");
  assert.equal(words("none"), "You have the newest version.");
});
