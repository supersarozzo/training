// When sync starts by itself (docs/ARCHITECTURE.md section 5.4).
import test from "node:test";
import assert from "node:assert/strict";
import { startAutoSync } from "../app/js/autosync.js";
import { keyEndsSoon, statusText } from "../app/js/sync/sync.js";

function setup({ configured = true, workout = false, unsynced = false } = {}) {
  const listeners = {};
  const win = { document: { visibilityState: "visible" }, addEventListener: (n, f) => { listeners[n] = f; }, removeEventListener: (n) => { delete listeners[n]; } };
  const calls = [];
  const syncer = { isConfigured: () => configured, hasUnsynced: () => unsynced, request: (m) => calls.push(m) };
  let t = 1_000_000;
  const auto = startAutoSync({ syncer, win, inWorkout: () => workout, now: () => t });
  return { listeners, calls, win, auto, advance: (ms) => { t += ms; } };
}

test("syncs when the app opens, then at most once every 5 minutes on coming back to the front", () => {
  const s = setup();
  assert.deepEqual(s.calls, ["full"]);
  s.listeners.visibilitychange();
  assert.equal(s.calls.length, 1);
  s.advance(4 * 60 * 1000);
  s.listeners.visibilitychange();
  assert.equal(s.calls.length, 1);
  s.advance(61 * 1000);
  s.listeners.visibilitychange();
  assert.equal(s.calls.length, 2);
});

test("does nothing when the app is hidden", () => {
  const s = setup();
  s.advance(10 * 60 * 1000);
  s.win.document.visibilityState = "hidden";
  s.listeners.visibilitychange();
  assert.equal(s.calls.length, 1);
});

test("signal back: syncs at once, but only if something is not synced", () => {
  const a = setup({ unsynced: false });
  a.listeners.online();
  assert.equal(a.calls.length, 1); // only the one at open
  const b = setup({ unsynced: true });
  b.listeners.online();
  assert.equal(b.calls.length, 2);
});

test("never during a workout, and never when GitHub is not set up", () => {
  const w = setup({ workout: true });
  w.listeners.online(); w.advance(10 * 60 * 1000); w.listeners.visibilitychange();
  assert.equal(w.calls.length, 0);
  const n = setup({ configured: false });
  n.listeners.visibilitychange();
  assert.equal(n.calls.length, 0);
});

test("key ends soon: 14 days before, and after it ended", () => {
  const dev = (d) => ({ token: "x-test-key-1", owner: "o", token_expires: d });
  assert.equal(keyEndsSoon(dev("2027-11-16"), "2027-01-01"), null);
  assert.deepEqual(keyEndsSoon(dev("2027-11-16"), "2027-11-02"), { date: "2027-11-16", days: 14 });
  assert.equal(keyEndsSoon(dev("2027-11-16"), "2027-11-20").days, -4);
  assert.equal(keyEndsSoon({ token_expires: "2027-11-16" }, "2027-11-15"), null);
});

test("status text uses the plain messages", () => {
  assert.equal(statusText({}), "Only on this phone. Set up GitHub in Progress › Settings.");
  const base = { token: "x-test-key-1", owner: "o" };
  assert.match(statusText(base), /Not synced yet/);
  assert.equal(statusText({ ...base, last_sync_result: "auth" }), "GitHub key expired or wrong. Make a new one.");
  assert.match(statusText({ ...base, last_sync_at: "2026-03-02T09:00:00.000Z", last_sync_result: "ok" }, true), /Newer changes not sent yet/);
});
