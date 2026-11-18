// 0.7.3 review round 3 (docs/checks/2026-11-18-v073-update.md). Worker 8.40's planted mistakes for round 3 passed
// every test, so each one shows a gap in the tests. These tests close the two gaps:
//  T1 offline, the NEWEST older app cache answers, also at two-digit versions (a text sort would pick 0.7.9 over
//     0.7.10).
//  T2 the redraw rule refuses an open sheet on its own (not only the scanner), on Today and Settings, where the
//     sync's own rule allows a redraw.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const mod = await import("../app/js/updater.js").catch(() => ({}));
const need = (name) => mod[name] ?? (() => { throw new Error(`app/js/updater.js: ${name} missing`); });

test("T1 offline, the newest older app cache answers, also at two-digit versions", async () => {
  // A copy of sw.js that thinks it is 0.7.11, so 0.7.9 and 0.7.10 are both older.
  const src = read("app/sw.js").replace(/const APP_VERSION = "[^"]+";/, 'const APP_VERSION = "0.7.11";');
  const stores = new Map([
    ["training-0.7.9", "old 0.7.9"], ["training-0.7.10", "old 0.7.10"], ["training-0.7.2", "old 0.7.2"],
  ]);
  const caches = {
    has: async (n) => n !== "training-0.7.11" && stores.has(n),
    open: async (n) => ({ match: async () => (stores.has(n) ? stores.get(n) : undefined) }),
    keys: async () => [...stores.keys()],
    delete: async () => true,
  };
  const handlers = {};
  vm.runInContext(src, vm.createContext({
    self: { location: { origin: "https://e.test", href: "https://e.test/sw.js" }, addEventListener: (t, f) => { handlers[t] = f; } },
    caches, fetch: async () => { throw new TypeError("Load failed"); }, URL, setTimeout,
  }));
  let answer = null;
  handlers.fetch({ request: { method: "GET", url: "https://e.test/js/main.js", cache: "default", mode: "cors" }, respondWith: (p) => { answer = p; }, waitUntil() {} });
  assert.equal(await answer, "old 0.7.10");
});

test("T2 an open sheet alone stops the redraw on Today and Settings", () => {
  const mayRedraw = need("mayRedraw");
  const doc = { activeElement: null, querySelector: (sel) => (sel.split(",").map((s) => s.trim()).includes("[data-sheet]") ? {} : null) };
  assert.equal(mayRedraw("#/today", doc), false);
  assert.equal(mayRedraw("#/settings", doc), false);
  const none = { activeElement: null, querySelector: () => null };
  assert.equal(mayRedraw("#/today", none), true);
});

// Round 3 checker findings (tests first):
//  T3 (checker 2): a workout started while the button reads the live sw.js (a slow signal): no cache deletion, no
//     unregister, no reload.
//  T4 (checker 3): a workout started in the seconds between SKIP_WAITING and the reload: no reload (the next open
//     runs the new version); a tap on the bar during a workout changes nothing.
function page({ workoutAt = Infinity, worker = false } = {}) {
  let clock = 0;
  let inWorkout = false;
  const w = { state: "installed", posted: [], addEventListener() {}, postMessage(m) { w.posted.push(m); } };
  const reg = { waiting: null, installing: null, unregistered: 0, addEventListener() {},
    update() { if (worker) reg.waiting = w; return Promise.resolve(); }, unregister() { reg.unregistered++; return Promise.resolve(true); } };
  const swl = {};
  const sw = { controller: {}, addEventListener(t, f) { swl[t] = f; }, register: () => Promise.resolve(reg) };
  const doc = { hidden: false, addEventListener() {} };
  const win = { reloads: 0, addEventListener() {}, location: { reload() { win.reloads++; } } };
  const deleted = [];
  const u = need("createUpdater")({
    sw, doc, win, version: "0.7.3", now: () => clock,
    sleep: async (ms) => { clock += ms; if (clock >= workoutAt) inWorkout = true; },
    inWorkout: () => inWorkout,
    fetch: async (url) => {
      if (/sw\.js/.test(url)) inWorkout = workoutAt === "sw" ? true : inWorkout; // the workout starts during this fetch
      return { ok: true, text: async () => 'const APP_VERSION = "0.7.4";' };
    },
    caches: { keys: async () => ["training-0.7.3"], delete: async (k) => { deleted.push(k); return true; } },
  });
  return { u, w, reg, win, deleted, swl, startWorkout() { inWorkout = true; }, endWorkout() { inWorkout = false; workoutAt = Infinity; } };
}

test("T3 a workout started while the live sw.js is read: nothing deleted, no unregister, no reload", async () => {
  const p = page({ workoutAt: "sw" });
  await p.u.start();
  await p.u.updateNow();
  assert.deepEqual(p.deleted, []);
  assert.equal(p.reg.unregistered, 0);
  assert.equal(p.win.reloads, 0);
  assert.equal(p.u.status(), "workout");
});

test("T4 a workout started after SKIP_WAITING: no reload, neither the safety reload nor on the new controller", async () => {
  const p = page({ worker: true, workoutAt: 1 }); // the clock passes 1 ms only in the 10 s safety wait
  p.u.status();
  await p.u.start();
  // The wait for the worker finds it at once (no sleep), so the workout starts during the 10 s safety wait.
  await p.u.updateNow();
  assert.deepEqual(p.w.posted, ["SKIP_WAITING"]);
  for (let i = 0; i < 5; i++) await new Promise((r) => setImmediate(r));
  assert.equal(p.win.reloads, 0, "the safety reload");
  p.swl.controllerchange?.();
  assert.equal(p.win.reloads, 0, "the new controller");
});

test("T4b a tap on the bar during a workout changes nothing", async () => {
  const p = page({ worker: true });
  await p.u.start();
  await p.u.check(true);
  assert.equal(p.u.waiting(), p.w);
  p.startWorkout();
  p.u.apply();
  assert.deepEqual(p.w.posted, []);
  assert.equal(p.win.reloads, 0);
});

test("T4c after a reload held back by a workout, the next Update tap only reloads (no cache deleted, no unregister)", async () => {
  const p = page({ worker: true, workoutAt: 1 });
  await p.u.start();
  await p.u.updateNow();
  for (let i = 0; i < 5; i++) await new Promise((r) => setImmediate(r));
  assert.equal(p.win.reloads, 0);
  p.endWorkout(); // the workout is over; the new worker took over meanwhile
  p.reg.waiting = null;
  await p.u.updateNow();
  assert.equal(p.win.reloads, 1);
  assert.deepEqual(p.deleted, []);
  assert.equal(p.reg.unregistered, 0);
});

// Round 3 auditor findings (tests first):
//  T5 (auditor 2): the sw.js check reads the version out of `const APP_VERSION = "…"`, not any text: a stale sw.js
//     for 0.7.9 whose comments mention "0.7.10" must not pass when 0.7.10 is live.
//  T6 (auditor 3): a new worker started installing and then failed (a file keeps failing on the site): the fallback
//     must not run (it would delete the WORKING cache and every new install fails the same way); say the website is
//     still updating and change nothing.
function livePage({ swText, installFails = false }) {
  let clock = 0;
  const reg = { waiting: null, installing: null, unregistered: 0, addEventListener() {},
    update() {
      if (installFails) reg.installing = { state: "installing", addEventListener() {} };
      return Promise.resolve();
    },
    unregister() { reg.unregistered++; return Promise.resolve(true); } };
  const sw = { controller: {}, addEventListener() {}, register: () => Promise.resolve(reg) };
  const doc = { hidden: false, addEventListener() {} };
  const win = { reloads: 0, addEventListener() {}, location: { reload() { win.reloads++; } } };
  const deleted = [];
  const u = need("createUpdater")({
    sw, doc, win, version: "0.7.9", now: () => clock,
    sleep: async (ms) => { clock += ms; if (installFails && clock >= 5000 && reg.installing) { reg.installing.state = "redundant"; reg.installing = null; } },
    fetch: async (url) => ({ ok: true, text: async () => (/sw\.js/.test(url) ? swText : 'export const APP_VERSION = "0.7.10";') }),
    caches: { keys: async () => ["training-0.7.9"], delete: async (k) => { deleted.push(k); return true; } },
  });
  return { u, reg, win, deleted };
}

test("T5 a stale sw.js that only mentions the live version in a comment does not pass the check", async () => {
  const p = livePage({ swText: '// "0.7.10" is newer than "0.7.3"\nconst APP_VERSION = "0.7.9";\n' });
  await p.u.start();
  await p.u.updateNow();
  assert.equal(p.u.status(), "siteupdating");
  assert.deepEqual(p.deleted, []);
  assert.equal(p.reg.unregistered, 0);
  assert.equal(p.win.reloads, 0);
});

test("T5b the live sw.js with the live version passes (the fallback runs)", async () => {
  const p = livePage({ swText: '// "0.7.9" was before\nconst APP_VERSION = "0.7.10";\n' });
  await p.u.start();
  await p.u.updateNow();
  assert.deepEqual(p.deleted, ["training-0.7.9"]);
  assert.equal(p.win.reloads, 1);
});

test("T6 a new install that started and failed: no fallback, nothing deleted, 'siteupdating'", async () => {
  const p = livePage({ swText: 'const APP_VERSION = "0.7.10";', installFails: true });
  await p.u.start();
  await p.u.updateNow();
  assert.equal(p.u.status(), "siteupdating");
  assert.deepEqual(p.deleted, []);
  assert.equal(p.reg.unregistered, 0);
  assert.equal(p.win.reloads, 0);
});
