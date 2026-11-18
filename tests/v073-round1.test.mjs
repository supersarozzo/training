// 0.7.3 review round 1 (docs/checks/2026-11-18-v073-update.md): the checker's and the auditor's findings.
//  R1 (both, minor): an old worker's activate can delete the new cache while the new version installs; the install
//     must then fail instead of "succeeding" with no cache (the app would no longer open offline).
//  R2 (checker 1, auditor 7): old caches go only when the own cache is COMPLETE: a mark written after every file.
//  R3 (auditor 2b): offline and a file missing from the own cache: an older app cache answers (better than nothing).
//  R4 (auditor 3): a waiting worker that became active without the tap clears the bar; a tap on a stale bar reloads.
//  R5 (auditor 5): automatic checks (front, pageshow) at most every 15 minutes; start and the Update button always.
//  R6 (auditor 1, checker 4): the redraw rule is the sync's rule plus "no sheet": never a workout, the Plan, a sheet,
//     the scanner or typing.
//  R7 (auditor 8): many fetches at once start one cleanup, not one each.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { APP_VERSION } from "../app/js/version.js";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const sw = read("app/sw.js");
const FILES = [...sw.slice(sw.indexOf("const FILES"), sw.indexOf("];")).matchAll(/"([^"]+)"/g)].map((m) => m[1]);
const mod = await import("../app/js/updater.js").catch(() => ({}));
const need = (name) => mod[name] ?? (() => { throw new Error(`app/js/updater.js: ${name} missing`); });
const BASE = "https://example.test/training/";
const CACHE = `training-${APP_VERSION}`;
const plain = (f) => new URL(f, BASE).href;

function response(body, { status = 200 } = {}) {
  return { ok: status < 400, status, redirected: false, type: "basic", clone() { return response(body, { status }); }, text: async () => body };
}
function world({ hook = () => {} } = {}) {
  const stores = new Map();
  const log = { keys: 0, puts: [] };
  const strip = (u) => { const x = new URL(typeof u === "string" ? u : u.url); x.search = ""; return x.href; };
  const handle = (name, m) => ({
    put: async (key, res) => { log.puts.push(strip(key)); if (stores.get(name) === m) m.set(strip(key), res); },
    match: async (req) => m.get(strip(req)),
  });
  const caches = {
    open: async (name) => { if (!stores.has(name)) stores.set(name, new Map()); return handle(name, stores.get(name)); },
    has: async (name) => stores.has(name),
    keys: async () => { log.keys++; return [...stores.keys()]; },
    delete: async (name) => stores.delete(name),
  };
  const net = { online: true };
  let fetches = 0;
  const fetch = async (input) => {
    const url = typeof input === "string" ? input : input.url;
    fetches++;
    hook({ url, fetches, stores });
    await new Promise((r) => setImmediate(r));
    if (!net.online) throw new TypeError("Load failed");
    const path = new URL(url).pathname.replace("/training/", "");
    return response(path === "js/version.js" ? `export const APP_VERSION = "${APP_VERSION}";` : `new:${path || "./"}`);
  };
  const handlers = {};
  const self = { location: { origin: "https://example.test", href: `${BASE}sw.js` }, addEventListener: (t, f) => { handlers[t] = f; }, skipWaiting() {} };
  vm.runInContext(sw, vm.createContext({ self, caches, fetch, URL, setTimeout: (f) => setImmediate(f), Promise }));
  const run = async (type, ev = {}) => {
    const waits = []; let answer;
    handlers[type]({ ...ev, waitUntil: (p) => waits.push(p), respondWith: (p) => { answer = p; } });
    const out = answer ? await answer : undefined;
    await Promise.all(waits);
    return out;
  };
  const fire = (type, ev = {}) => { const waits = []; let answer; handlers[type]({ ...ev, waitUntil: (p) => waits.push(p), respondWith: (p) => { answer = p; } }); return { answer, waits }; };
  return { run, fire, stores, net, log };
}
const req = (path) => ({ method: "GET", url: `${BASE}${path}`, mode: "cors", cache: "default" });
const oldCache = (w, name) => w.stores.set(name, new Map(FILES.map((f) => [plain(f), response(`old:${name}:${f}`)])));

test("R1 the new cache deleted during the install (an old worker's activate): the install fails", async () => {
  const w = world({ hook: ({ fetches, stores }) => { if (fetches === 40) stores.delete(CACHE); } });
  await assert.rejects(w.run("install"));
  assert.equal(w.stores.has(CACHE), false);
});

test("R2 a complete-looking but unfinished own cache (start page and version.js only) never removes older caches", async () => {
  const w = world();
  oldCache(w, "training-0.7.2");
  w.stores.set(CACHE, new Map([[plain("./"), response("new:./")], [plain("js/version.js"), response(`"${APP_VERSION}"`)]]));
  await w.run("fetch", { request: req("js/main.js") });
  await w.run("activate");
  assert.ok(w.stores.has("training-0.7.2"));
});

test("R2b the install writes its completion mark after every file; then old caches go", async () => {
  const w = world();
  oldCache(w, "training-0.7.2");
  await w.run("install");
  const filePuts = w.log.puts.filter((u) => FILES.some((f) => plain(f) === u));
  assert.equal(filePuts.length, FILES.length);
  const last = w.log.puts.at(-1);
  assert.ok(!FILES.some((f) => plain(f) === last), "the last thing stored is the mark, not an app file");
  await w.run("activate");
  assert.equal(w.stores.has("training-0.7.2"), false);
});

test("R3 offline, a file missing from the own cache: the newest older app cache answers; online the network does", async () => {
  const w = world();
  oldCache(w, "training-0.7.0");
  oldCache(w, "training-0.7.2");
  w.stores.set(CACHE, new Map()); // own cache present but empty (no mark: old caches stay)
  w.net.online = false;
  const res = await w.run("fetch", { request: req("js/main.js") });
  assert.equal(await res.text(), "old:training-0.7.2:js/main.js");
  w.net.online = true;
  assert.equal(await (await w.run("fetch", { request: req("js/main.js") })).text(), "new:js/main.js");
});

test("R7 many fetches at once start one cleanup", async () => {
  const w = world();
  oldCache(w, "training-0.7.2");
  await w.run("install");
  const before = w.log.keys;
  const all = Array.from({ length: 30 }, () => w.fire("fetch", { request: req("js/main.js") }));
  await Promise.all(all.flatMap((x) => [x.answer, ...x.waits]));
  assert.ok(w.log.keys - before <= 2, `cleanups: ${w.log.keys - before}`);
});

// ---------- page side ----------
function fakeWorker(state) {
  const w = { state, posted: [], listeners: {}, addEventListener(t, f) { (w.listeners[t] ??= []).push(f); }, postMessage(m) { w.posted.push(m); },
    to(s) { w.state = s; (w.listeners.statechange ?? []).forEach((f) => f()); } };
  return w;
}
function page({ waiting = null } = {}) {
  let clock = 0;
  const reg = { waiting, installing: null, updates: 0, listeners: {}, addEventListener(t, f) { (reg.listeners[t] ??= []).push(f); }, update() { reg.updates++; return Promise.resolve(); } };
  const sw = { controller: {}, listeners: {}, addEventListener(t, f) { (sw.listeners[t] ??= []).push(f); }, register: () => Promise.resolve(reg) };
  const doc = { hidden: false, listeners: {}, addEventListener(t, f) { (doc.listeners[t] ??= []).push(f); }, fire(t) { (doc.listeners[t] ?? []).forEach((f) => f()); } };
  const win = { reloads: 0, listeners: {}, addEventListener(t, f) { (win.listeners[t] ??= []).push(f); }, fire(t) { (win.listeners[t] ?? []).forEach((f) => f({})); }, location: { reload() { win.reloads++; } } };
  const u = need("createUpdater")({ sw, doc, win, now: () => clock, sleep: () => new Promise((r) => setImmediate(r)) });
  return { u, reg, doc, win, advance(ms) { clock += ms; } };
}
const tick = () => new Promise((r) => setImmediate(r));

test("R4 a waiting worker that became active without the tap clears the bar; a tap on a stale bar reloads (once)", async () => {
  const w = fakeWorker("installed");
  const p = page({ waiting: w });
  await p.u.start(); await tick();
  assert.equal(p.u.waiting(), w);
  w.to("activating"); w.to("activated");
  assert.equal(p.u.waiting(), null);
  p.u.apply(); // the bar was still drawn on screen
  assert.equal(p.win.reloads, 1);
  assert.deepEqual(w.posted, []);
});

test("R5 automatic checks at most every 15 minutes; the waiting worker is still looked at every time", async () => {
  const p = page();
  await p.u.start(); await tick();
  const first = p.reg.updates;
  assert.equal(first, 1, "start checks once");
  p.advance(60000);
  p.doc.fire("visibilitychange"); p.win.fire("pageshow"); await tick();
  assert.equal(p.reg.updates, first, "no new check within 15 minutes");
  p.reg.waiting = fakeWorker("installed");
  p.doc.fire("visibilitychange"); await tick();
  assert.equal(p.u.waiting(), p.reg.waiting, "but a worker that waits is seen");
  p.advance(15 * 60000);
  p.doc.fire("visibilitychange"); await tick();
  assert.equal(p.reg.updates, first + 1);
});

test("R6 the redraw rule: never a workout, the Plan, an open sheet or scanner, or typing; Today, Settings, Progress yes", () => {
  const mayRedraw = need("mayRedraw");
  const doc = (active = null, open = false) => ({ activeElement: active, querySelector: (sel) => (open && /data-sheet|data-scan/.test(sel) ? {} : null) });
  assert.equal(mayRedraw("#/today", doc()), true);
  assert.equal(mayRedraw("#/settings", doc()), true);
  assert.equal(mayRedraw("#/progress", doc()), true);
  assert.equal(mayRedraw("", doc()), true);
  assert.equal(mayRedraw("#/workout", doc()), false);
  assert.equal(mayRedraw("#/plan", doc()), false);
  assert.equal(mayRedraw("#/settings", doc(null, true)), false, "a sheet is open");
  assert.equal(mayRedraw("#/diet", doc(null, true)), false, "a sheet or the scanner is open");
  assert.equal(mayRedraw("#/settings", doc({ tagName: "INPUT", type: "password" })), false, "typing the key");
  assert.equal(mayRedraw("#/settings", doc({ tagName: "INPUT", type: "text" })), false);
  assert.equal(mayRedraw("#/today", doc({ tagName: "TEXTAREA" })), false);
  assert.equal(mayRedraw("#/settings", doc({ tagName: "BUTTON" })), true, "the Update button itself was tapped");
});

test("R6b update.js redraws only through mayRedraw and keeps the scroll position", () => {
  const upd = read("app/js/ui/update.js");
  assert.match(upd, /mayRedraw\(location\.hash, document\)/);
  assert.match(upd, /scrollTo\(0, y\)/);
  assert.doesNotMatch(upd, /function quietScreen/);
});

// R8 (worker 8.40's own slip in round 1: one extra ")" in settings.js blanked the app; no test loads that file).
import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
test("R8 every app JavaScript file parses (as a module)", () => {
  const root = new URL("../app/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
  const walk = (d) => readdirSync(d).flatMap((n) => { const f = join(d, n); return statSync(f).isDirectory() ? (n === "vendor" ? [] : walk(f)) : (f.endsWith(".js") ? [f] : []); });
  const files = walk(root);
  assert.ok(files.length > 50);
  for (const f of files) {
    const r = spawnSync(process.execPath, ["--input-type=module", "--check"], { input: readFileSync(f), encoding: "utf8" });
    assert.equal(r.status, 0, `${f}\n${r.stderr}`);
  }
});
