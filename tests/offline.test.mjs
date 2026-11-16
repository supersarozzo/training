// The service worker must list every file of the app, and its version must match js/version.js.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { APP_VERSION } from "../app/js/version.js";

const appDir = new URL("../app/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const sw = readFileSync(join(appDir, "sw.js"), "utf8");

function allFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? allFiles(full) : [relative(appDir, full).split(sep).join("/")];
  });
}

test("sw.js version matches js/version.js", () => {
  assert.equal(sw.match(/const APP_VERSION = "([^"]+)"/)[1], APP_VERSION);
});

test("sw.js cache list = every file in app/ (except sw.js itself), plus the start page", () => {
  const listed = [...sw.slice(sw.indexOf("const FILES"), sw.indexOf("];")).matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.ok(listed.includes("./"));
  assert.deepEqual(listed.filter((f) => f !== "./").sort(), allFiles(appDir).filter((f) => f !== "sw.js").sort());
});

test("sw.js never caches or answers other sites (the GitHub API goes straight to the network)", () => {
  assert.match(sw, /url\.origin !== self\.location\.origin\) return/);
  assert.doesNotMatch(sw, /api\.github\.com/);
});

test("manifest has name, start page, standalone display and icons that exist", () => {
  const m = JSON.parse(readFileSync(join(appDir, "manifest.webmanifest"), "utf8"));
  assert.equal(m.display, "standalone");
  assert.ok(m.name && m.start_url);
  const files = allFiles(appDir);
  for (const icon of m.icons) assert.ok(files.includes(icon.src), icon.src);
});

// Run sw.js in a fake worker world: install fills the cache, then the app files answer with no network.
import vm from "node:vm";
function fakeWorld(origin = "https://example.test") {
  const handlers = {};
  const stores = new Map();
  const net = { online: true, calls: [] };
  const caches = {
    open: async (name) => {
      if (!stores.has(name)) stores.set(name, new Map());
      const m = stores.get(name);
      return { addAll: async (list) => list.forEach((f) => m.set(new URL(f, origin + "/").pathname, "cached:" + f)) };
    },
    keys: async () => [...stores.keys()],
    delete: async (k) => stores.delete(k),
    match: async (req) => { for (const m of stores.values()) { const p = new URL(req.url).pathname; if (m.has(p)) return m.get(p); } return undefined; },
  };
  const self = { location: { origin }, addEventListener: (t, f) => { handlers[t] = f; }, skipWaiting: () => { self.skipped = true; }, clients: {} };
  const ctx = vm.createContext({ self, caches, URL, fetch: async (r) => { net.calls.push(r.url); if (!net.online) throw new Error("offline"); return "network"; } });
  vm.runInContext(sw, ctx);
  const run = async (type, ev) => { let p; handlers[type]({ ...ev, waitUntil: (x) => { p = x; }, respondWith: (x) => { p = x; } }); return p; };
  return { run, stores, net, self };
}

test("worker: install caches the files, then the app opens offline; the GitHub API is left alone", async () => {
  const w = fakeWorld();
  await w.run("install", {});
  assert.ok(w.stores.has(`training-${APP_VERSION}`));
  w.net.online = false;
  assert.equal(await w.run("fetch", { request: { method: "GET", url: "https://example.test/js/main.js?x=1" } }), "cached:js/main.js");
  assert.equal(await w.run("fetch", { request: { method: "GET", url: "https://example.test/?date=2026-11-24" } }), "cached:./");
  assert.equal(await w.run("fetch", { request: { method: "GET", url: "https://api.github.com/repos/x" } }), undefined);
  assert.equal(await w.run("fetch", { request: { method: "PUT", url: "https://example.test/js/main.js" } }), undefined);
});

test("worker: activate deletes old caches; no auto take-over; update only on the SKIP_WAITING message", async () => {
  const w = fakeWorld();
  w.stores.set("training-0.0.1", new Map());
  w.stores.set("other-cache", new Map());
  await w.run("install", {});
  await w.run("activate", {});
  assert.deepEqual([...w.stores.keys()].sort(), ["other-cache", `training-${APP_VERSION}`]);
  assert.notEqual(w.self.skipped, true);
  await w.run("message", { data: "SKIP_WAITING" });
  assert.equal(w.self.skipped, true);
});
