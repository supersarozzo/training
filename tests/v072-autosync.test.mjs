// Version 0.7.2 (worker 8.39): automatic sync (Rosario via the Training Agent: "the sync is too complicated, can it be
// automatic so that every change is automatically pushed?"). docs/ARCHITECTURE.md section 5.4.
//  A  After every save of synced data (the workout box, the food box): a quiet time of about 10 s, then one full sync,
//     so a burst of changes is one sync. Going to the background: sync at once. Open or front: at once when something
//     is unsynced, else at most once every 5 minutes. Never while a workout runs (also when hidden: it waits for
//     Finish). Never when GitHub is not set up.
//  B  Against the pretend GitHub: batching, both files, no PUT over a bad file, the offline queue, an edit made during
//     a sync, and the loop guard (the sync's own merge saves are not "changes").
//  C  Settings: one status line, one "Sync now" button, Get and Send kept under "More". Same words on Today.
//  E  Back-off (Training Agent): after a failed sync, no retry on every 10 s timer; open, front, signal back or
//     "Sync now" try again; a wrong key, no access or a damaged file waits for "Sync now" or a new key.
//  F  Review round 1 fixes (auditor): one sync on the way out, a record from a clock far ahead, the food line words,
//     no console output.
//  G  Review round 2 fix (auditor): a stuck food file does not count as "not sent"; the scan covers sw.js.
// All values are made up. No body data, no real key.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { startAutoSync, withSaveSignal, QUIET_MS, redrawAfterSync } from "../app/js/autosync.js";
import { createStore } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { createSyncer, saveConnection, statusText, syncProblem } from "../app/js/sync/sync.js";
import { foodStatusText, FOOD_MESSAGES } from "../app/js/sync/foodsync.js";
import { hasChangesSince } from "../app/js/sync/merge.js";
import { foodChangesSince } from "../app/js/food/foodmerge.js";
import { createFoodSyncer } from "../app/js/sync/foodsync.js";
import { combineSyncers } from "../app/js/sync/both.js";
import { createFoodStore } from "../app/js/food/foodstore.js";
import { createFoodModel } from "../app/js/food/foodmodel.js";
import { createFakeGithub, VALID_TOKEN } from "./fake-github.mjs";
import { fakeStorage } from "./fixtures/profiles.mjs";

const src = (p) => readFileSync(new URL(`../app/${p}`, import.meta.url), "utf8").replaceAll("\r\n", "\n");

// A pretend clock for setTimeout: timers run only when the test says so.
function fakeTimers() {
  let id = 0;
  const pending = new Map();
  return {
    setTimer: (fn, ms) => { id += 1; pending.set(id, { fn, ms }); return id; },
    clearTimer: (i) => { pending.delete(i); },
    pending: () => [...pending.values()],
    fire() { const list = [...pending.entries()]; pending.clear(); for (const [, t] of list) t.fn(); return list.length; },
  };
}

function fakeWin() {
  const listeners = {};
  return {
    listeners,
    document: { visibilityState: "visible" },
    addEventListener: (n, f) => { listeners[n] = f; },
    removeEventListener: (n) => { delete listeners[n]; },
  };
}

// ---------- A: when sync starts (a pretend syncer) ----------

function unit({ configured = true, workout = false, unsynced = true, throws = false } = {}) {
  const win = fakeWin();
  const timers = fakeTimers();
  const calls = [];
  const state = { configured, workout, unsynced, throws };
  const syncer = {
    isConfigured: () => state.configured,
    hasUnsynced: () => { if (state.throws) throw new Error("broken box"); return state.unsynced; },
    request: (m) => { calls.push(m); return Promise.resolve({ result: "ok" }); },
  };
  let t = 5_000_000;
  const auto = startAutoSync({ syncer, win, inWorkout: () => state.workout, now: () => t, setTimer: timers.setTimer, clearTimer: timers.clearTimer });
  calls.length = 0; // forget the sync at open (tested below)
  return { win, timers, calls, state, auto, advance: (ms) => { t += ms; } };
}

test("A1 a save waits about 10 s, then one full sync; nothing at the moment of the save", () => {
  assert.equal(QUIET_MS, 10_000);
  const s = unit();
  s.auto.changed();
  assert.equal(s.calls.length, 0);
  assert.equal(s.timers.pending().length, 1);
  assert.equal(s.timers.pending()[0].ms, QUIET_MS);
  s.timers.fire();
  assert.deepEqual(s.calls, ["full"]);
});

test("A2 a burst of saves is one sync: each save starts the quiet time again", () => {
  const s = unit();
  for (let i = 0; i < 6; i++) s.auto.changed();
  assert.equal(s.timers.pending().length, 1, "only one timer waits");
  s.timers.fire();
  assert.deepEqual(s.calls, ["full"]);
});

test("A3 nothing to send when the quiet time ends: no sync", () => {
  const s = unit({ unsynced: false });
  s.auto.changed();
  s.timers.fire();
  assert.equal(s.calls.length, 0);
});

test("A4 never while a workout runs, also when the app is hidden (it waits for Finish)", () => {
  const s = unit({ workout: true });
  s.auto.changed();
  s.timers.fire();
  s.win.document.visibilityState = "hidden";
  s.win.listeners.visibilitychange();
  s.win.listeners.pagehide();
  s.win.document.visibilityState = "visible";
  s.win.listeners.visibilitychange();
  s.win.listeners.online();
  assert.equal(s.calls.length, 0);
});

test("A5 never when GitHub is not set up", () => {
  const s = unit({ configured: false });
  s.auto.changed();
  s.timers.fire();
  s.win.document.visibilityState = "hidden";
  s.win.listeners.visibilitychange();
  assert.equal(s.calls.length, 0);
});

test("A6 going to the background: the waiting sync runs at once (visibilitychange hidden and pagehide)", () => {
  const s = unit();
  s.auto.changed();
  s.win.document.visibilityState = "hidden";
  s.win.listeners.visibilitychange();
  assert.deepEqual(s.calls, ["full"]);
  assert.equal(s.timers.pending().length, 0, "the quiet timer is cancelled");
  const p = unit();
  p.auto.changed();
  p.win.listeners.pagehide();
  assert.deepEqual(p.calls, ["full"]);
  const none = unit({ unsynced: false });
  none.win.document.visibilityState = "hidden";
  none.win.listeners.visibilitychange();
  none.win.listeners.pagehide();
  assert.equal(none.calls.length, 0, "nothing to send: no sync on the way out");
});

test("A7 open or front: at once when something is unsynced; the 5-minute limit only for 'just check for news'", () => {
  const s = unit({ unsynced: true });
  s.win.listeners.visibilitychange(); // seconds after the open
  assert.deepEqual(s.calls, ["full"]);
  const n = unit({ unsynced: false });
  n.win.listeners.visibilitychange();
  assert.equal(n.calls.length, 0, "nothing to send, the last check was moments ago");
  n.advance(5 * 60 * 1000 + 1);
  n.win.listeners.visibilitychange();
  assert.deepEqual(n.calls, ["full"]);
});

test("A8 a damaged box never stops the app: hasUnsynced throwing means no sync, no crash", () => {
  const s = unit({ throws: true });
  assert.doesNotThrow(() => { s.auto.changed(); s.timers.fire(); s.win.listeners.pagehide(); });
  assert.equal(s.calls.length, 0);
});

test("A9 stop() removes every listener and the waiting timer", () => {
  const s = unit();
  s.auto.changed();
  s.auto.stop();
  assert.equal(s.timers.pending().length, 0);
  for (const n of ["visibilitychange", "online", "pagehide"]) assert.equal(s.win.listeners[n], undefined, n);
});

test("A10 withSaveSignal: the store saves first, then signals; load and the rest are the store's own", () => {
  const order = [];
  const store = { save: (d) => order.push(["save", d]), load: () => "doc", savePrev: () => order.push(["prev"]) };
  const signalled = withSaveSignal(store, () => order.push(["signal"]));
  signalled.save(1);
  signalled.savePrev();
  assert.deepEqual(order, [["save", 1], ["signal"], ["prev"]]);
  assert.equal(signalled.load(), "doc");
  // a failed save (phone full) does not signal: there is nothing new to send
  const full = withSaveSignal({ save: () => { throw new Error("full"); } }, () => order.push(["signal2"]));
  assert.throws(() => full.save(2));
  assert.equal(order.some((x) => x[0] === "signal2"), false);
  // a signal problem never breaks a save
  assert.doesNotThrow(() => withSaveSignal({ save: () => {} }, () => { throw new Error("x"); }).save(3));
});

// ---------- B: against the pretend GitHub ----------

function repo() {
  const prog = createFakeGithub();
  const food = createFakeGithub({ path: "food.json" });
  const route = (url, init) => (String(url).includes("/contents/food.json") ? food.fetch(url, init) : prog.fetch(url, init));
  return { prog, food, fetch: route };
}

// One phone: the screens save through the signalling stores; the syncers use the plain ones (the loop guard).
function phone(r, { start = "2026-03-02T09:00:00.000Z", workout = false } = {}) {
  const storage = fakeStorage();
  const store = createStore(storage);
  const foodStore = createFoodStore(storage);
  let ms = Date.parse(start);
  const clock = () => new Date((ms += 1000));
  const nowIso = () => new Date((ms += 1000)).toISOString();
  const progressSyncer = createSyncer({ store, getFetch: () => r.fetch, nowIso });
  const foodSyncer = createFoodSyncer({ store, foodStore, getFetch: () => r.fetch, nowIso });
  const both = combineSyncers(progressSyncer, foodSyncer);
  const requests = [];
  const counted = { ...both, request: (m) => { requests.push(m); return both.request(m); } };
  assert.deepEqual(saveConnection(store, { owner: r.prog.owner, repo: r.prog.repo, token: VALID_TOKEN }), { ok: true });
  let onSave = () => {};
  const saved = { count: 0 };
  const signal = () => { saved.count += 1; onSave(); };
  const model = createModel(withSaveSignal(store, signal), clock);
  const food = createFoodModel(withSaveSignal(foodStore, signal), clock);
  const win = fakeWin();
  const timers = fakeTimers();
  const state = { workout };
  const auto = startAutoSync({ syncer: counted, win, inWorkout: () => state.workout, problem: () => syncProblem(store.loadDevice()), now: () => ms, setTimer: timers.setTimer, clearTimer: timers.clearTimer });
  onSave = auto.changed;
  return { storage, store, foodStore, model, food, both, requests, win, timers, auto, saved, state, tick: (s) => { ms += s * 1000; } };
}
const settle = async (p) => { for (let i = 0; i < 200 && p.both.isRunning(); i++) await new Promise((res) => setImmediate(res)); await new Promise((res) => setImmediate(res)); };
const puts = (fake) => fake.calls.filter((c) => c.method === "PUT").length;
const addFood = (p, kcal) => p.food.quickAdd({ date: "2026-03-02", meal: "lunch", kcal, protein_g: 20 });

test("B1 five changes in a row (workout settings and food) reach GitHub in one sync: one PUT per file", async () => {
  const r = repo();
  const p = phone(r);
  await settle(p); // the sync at open (nothing to send yet)
  const before = { prog: puts(r.prog), food: puts(r.food) };
  p.model.updateSettings({ dumbbell_steps_kg: [2, 4, 6, 8] });
  for (const kcal of [100, 200, 300, 400]) addFood(p, kcal);
  assert.equal(p.timers.pending().length, 1, "one quiet timer for the whole burst");
  assert.equal(puts(r.prog) - before.prog, 0, "nothing sent during the quiet time");
  p.timers.fire();
  await settle(p);
  assert.equal(puts(r.prog) - before.prog, 1);
  assert.equal(puts(r.food) - before.food, 1);
  assert.deepEqual(r.prog.readDoc().shared_settings.dumbbell_steps_kg, [2, 4, 6, 8]);
  assert.deepEqual(r.food.readDoc().food_log.map((x) => x.kcal).sort((a, b) => a - b), [100, 200, 300, 400]);
  assert.equal(p.both.hasUnsynced(), false);
});

test("B2 the loop guard: the sync's own merge saves are not changes (a record from a clock a little ahead never loops)", async () => {
  const r = repo();
  const other = phone(r);
  other.model.updateSettings({ dumbbell_steps_kg: [2, 4] });
  other.timers.fire();
  await settle(other);
  const doc = r.prog.readDoc();
  doc.shared_settings.updated_at = "2026-03-05T09:05:00.000Z"; // another phone's clock is 5 minutes ahead (F2: more than 10 minutes is not counted)
  r.prog.putDoc(doc);
  const p = phone(r, { start: "2026-03-05T09:00:00.000Z" });
  await settle(p); // the sync at open merges the future record into this phone
  assert.equal(p.both.hasUnsynced(), true, "the future record still looks 'not sent' (why the guard matters)");
  assert.equal(p.saved.count, 0, "the merge save did not go through the signalling store");
  assert.equal(p.timers.pending().length, 0, "no quiet timer: no sync every 10 s for ever");
});

test("B3 a damaged progress.json is never overwritten by an automatic sync", async () => {
  const r = repo();
  r.prog.putRaw("{ this is not json");
  const p = phone(r);
  await settle(p);
  p.model.updateSettings({ dumbbell_steps_kg: [2, 4] });
  p.timers.fire();
  await settle(p);
  assert.equal(puts(r.prog), 0, "no PUT over a file the app could not read");
  assert.equal(r.prog.file.text, "{ this is not json");
  assert.equal(p.store.loadDevice().last_sync_result, "broken_remote");
});

test("B4 offline: changes stay on the phone; signal back sends them", async () => {
  const r = repo();
  const p = phone(r);
  await settle(p);
  r.prog.setBlocked(true);
  r.food.setBlocked(true);
  addFood(p, 250);
  p.timers.fire();
  await settle(p);
  assert.equal(p.store.loadDevice().last_sync_result, "offline");
  assert.equal(p.both.hasUnsynced(), true);
  assert.equal(statusText(p.store.loadDevice(), true), "Saved on phone. Will sync when online.");
  r.prog.setBlocked(false);
  r.food.setBlocked(false);
  p.win.listeners.online();
  await settle(p);
  assert.deepEqual(r.food.readDoc().food_log.map((x) => x.kcal), [250]);
  assert.equal(p.both.hasUnsynced(), false);
});

test("B5 an edit made while a sync runs is sent too (its own save starts the quiet time again)", async () => {
  const r = repo();
  const p = phone(r);
  await settle(p);
  addFood(p, 111);
  p.timers.fire(); // sync starts
  assert.equal(p.both.isRunning(), true);
  addFood(p, 222); // made during the sync
  await settle(p);
  assert.equal(p.timers.pending().length, 1, "the edit started a new quiet time");
  p.timers.fire();
  await settle(p);
  assert.deepEqual(r.food.readDoc().food_log.map((x) => x.kcal).sort((a, b) => a - b), [111, 222]);
  assert.equal(p.both.hasUnsynced(), false);
});

test("B6 a workout running: saves wait; nothing is sent until the workout ends (Finish syncs as before)", async () => {
  const r = repo();
  const p = phone(r, { workout: true });
  addFood(p, 300);
  p.timers.fire();
  p.win.document.visibilityState = "hidden";
  p.win.listeners.visibilitychange();
  await settle(p);
  assert.equal(puts(r.food), 0);
  assert.equal(p.requests.length, 0);
  assert.match(src("js/ui/finish.js"), /if \(syncer\.isConfigured\(\)\) syncer\.request\("full"\);/, "Finish still syncs");
});

// ---------- C: the screens and the wiring ----------

test("C1 status words: 'Synced 12:25' today, the date on other days, 'Not sent yet, will send automatically.'", () => {
  const base = { token: "x-test-key-1", owner: "o", last_sync_result: "ok" };
  const at = new Date(2026, 2, 2, 12, 25); // local time
  const time = at.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  assert.equal(statusText({ ...base, last_sync_at: at.toISOString() }, false, "elsewhere", new Date(2026, 2, 2, 18, 0)), `Synced ${time}.`);
  assert.match(statusText({ ...base, last_sync_at: at.toISOString() }, false, "elsewhere", new Date(2026, 2, 3, 9, 0)), new RegExp(`^Synced .+, ${time.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.$`));
  assert.equal(statusText({ ...base, last_sync_at: at.toISOString() }, true), "Not sent yet, will send automatically.");
  assert.equal(statusText({ token: "x-test-key-1", owner: "o" }, true), "Not sent yet, will send automatically.");
  assert.match(statusText({ token: "x-test-key-1", owner: "o" }), /Not synced yet/);
  assert.equal(statusText({ ...base, last_sync_result: "auth" }, true), "GitHub key expired or wrong. Make a new one.", "a problem is said in words, before 'not sent yet'");
});

test("C2 Settings: one status line, one 'Sync now', Get and Send kept under a 'More' fold; honest words about closed", () => {
  const s = src("js/ui/settings-sync.js");
  assert.match(s, /"Sync now"/);
  assert.match(s, /h\("details", \{ class: "more-fold", open: moreOpen, ontoggle: [^}]*\} \}, h\("summary", \{\}, "More"\)/);
  const fold = s.slice(s.indexOf('h("details"'));
  assert.match(fold, /"Get from GitHub"/);
  assert.match(fold, /"Send to GitHub"/);
  assert.match(s, /It can not sync while the app is closed/);
  assert.match(s, /by itself/);
});

test("C3 wiring: screens save through the signalling stores, the syncers through the plain ones; main starts it", () => {
  const app = src("js/ui/app.js");
  assert.match(app, /export const syncStore = createStore\(pickStorage\(\)\);/);
  assert.match(app, /export const store = withSaveSignal\(syncStore, noteSaved\);/);
  const food = src("js/diet/foodapp.js");
  assert.match(food, /export const foodSyncStore = createFoodStore\(pickStorage\(\)\);/);
  assert.match(food, /export const foodStore = withSaveSignal\(foodSyncStore, noteSaved\);/);
  const sy = src("js/syncer.js");
  assert.match(sy, /createSyncer\(\{ store: syncStore, getFetch \}\)/);
  assert.match(sy, /createFoodSyncer\(\{ store: syncStore, foodStore: foodSyncStore, getFetch: getFoodFetch \}\)/);
  const main = src("js/main.js");
  assert.match(main, /const auto = startAutoSync\(\{ syncer, win: window, inWorkout: \(\) => getActive\(\) !== null, problem: \(\) => syncProblem\(store\.loadDevice\(\)\) \}\);/);
  assert.match(main, /onDataSaved\(auto\.changed\);/);
});

// ---------- E: back-off after a failed sync (Training Agent, 2026-11-18) ----------
// After a failed automatic sync the app does not try again on every 10 s timer, nor on the way out. It tries again on
// the next open or front, on signal back, or on "Sync now". A wrong key, no access or a damaged GitHub file waits for
// "Sync now" or a new key (saving a key clears the saved result). Read from the saved last_sync_result: no new data,
// and it holds after the app is closed and opened again.

// A pretend syncer with a problem from the start, so the sync at open sees it too.
function unitWith(problemKind, { unsynced = true } = {}) {
  const win = fakeWin();
  const timers = fakeTimers();
  const calls = [];
  const state = { problem: problemKind, unsynced, running: false };
  const syncer = {
    isConfigured: () => true,
    isRunning: () => state.running,
    hasUnsynced: () => state.unsynced,
    request: (m) => { calls.push(m); return Promise.resolve({ result: "ok" }); },
  };
  let t = 5_000_000;
  const problem = () => { if (state.problem === "throw") throw new Error("broken box"); return state.problem; };
  const auto = startAutoSync({ syncer, win, inWorkout: () => false, problem, now: () => t, setTimer: timers.setTimer, clearTimer: timers.clearTimer });
  return { win, timers, calls, state, auto, advance: (ms) => { t += ms; } };
}

test("E1 syncProblem: key, access and damaged-file errors wait for the person; the others try again later; ok is none", () => {
  for (const r of ["auth", "no_access", "broken_remote"]) assert.equal(syncProblem({ last_sync_result: r }), "wait", r);
  for (const r of ["conflict", "rate", "error", "offline", "full", "too_new", "local_problem", "local_invalid", "something_new"]) assert.equal(syncProblem({ last_sync_result: r }), "retry", r);
  for (const d of [{ last_sync_result: "ok" }, {}, { last_sync_result: "not_set_up" }, null, undefined]) assert.equal(syncProblem(d), "none");
  // only the workout result counts (like the status line): a food problem does not stop the workout sync
  assert.equal(syncProblem({ last_sync_result: "ok", food_last_sync_result: "broken_remote" }), "none");
});

test("E2 'retry': saves, the quiet time and leaving the app send nothing; the next front and signal back try again", () => {
  const s = unitWith("retry");
  assert.deepEqual(s.calls, ["full"], "the open tries again");
  s.calls.length = 0;
  for (let i = 0; i < 5; i++) { s.auto.changed(); s.timers.fire(); }
  s.win.document.visibilityState = "hidden";
  s.win.listeners.visibilitychange();
  s.win.listeners.pagehide();
  assert.equal(s.calls.length, 0, "no retry on the 10 s timer or on the way out");
  s.win.document.visibilityState = "visible";
  s.win.listeners.visibilitychange();
  assert.deepEqual(s.calls, ["full"], "front: try again");
  s.win.listeners.online();
  assert.deepEqual(s.calls, ["full", "full"], "signal back: try again");
});

test("E3 'wait' (wrong key, no access, damaged file): nothing automatic at all, also not on open, front or signal back", () => {
  const s = unitWith("wait");
  for (let i = 0; i < 5; i++) { s.auto.changed(); s.timers.fire(); }
  s.win.document.visibilityState = "hidden";
  s.win.listeners.visibilitychange();
  s.win.listeners.pagehide();
  s.win.document.visibilityState = "visible";
  s.win.listeners.visibilitychange();
  s.win.listeners.online();
  s.advance(60 * 60 * 1000);
  s.win.listeners.visibilitychange();
  assert.equal(s.calls.length, 0);
  // "Sync now" or a new key clears the saved result: automatic sync works again
  s.state.problem = "none";
  s.auto.changed();
  s.timers.fire();
  assert.deepEqual(s.calls, ["full"]);
});

test("E4 a problem that can not be read never stops the app and never syncs on the timer", () => {
  const s = unitWith("throw");
  assert.doesNotThrow(() => { s.auto.changed(); s.timers.fire(); s.win.listeners.pagehide(); });
  assert.deepEqual(s.calls, ["full"], "only the open tries (as 'retry')");
});

test("E5 no problem: unchanged (the quiet time sends)", () => {
  const s = unitWith("none");
  s.calls.length = 0;
  s.auto.changed();
  s.timers.fire();
  assert.deepEqual(s.calls, ["full"]);
});

test("E6 pretend GitHub, server error: 5 saves after the failed sync make no network call until front", async () => {
  const r = repo();
  const p = phone(r);
  await settle(p);
  r.prog.fail("get", 500);
  addFood(p, 100);
  p.timers.fire();
  await settle(p);
  assert.equal(p.store.loadDevice().last_sync_result, "error");
  const before = r.prog.calls.length + r.food.calls.length;
  for (const kcal of [1, 2, 3, 4, 5]) { addFood(p, kcal); p.timers.fire(); await settle(p); }
  p.win.document.visibilityState = "hidden";
  p.win.listeners.visibilitychange();
  p.win.listeners.pagehide();
  await settle(p);
  assert.equal(r.prog.calls.length + r.food.calls.length, before, "no extra network calls");
  assert.equal(statusText(p.store.loadDevice(), true), "Saved on phone. Will sync later.", "the problem in plain words");
  p.win.document.visibilityState = "visible";
  p.win.listeners.visibilitychange();
  await settle(p);
  assert.equal(p.store.loadDevice().last_sync_result, "ok");
  assert.deepEqual(r.food.readDoc().food_log.map((x) => x.kcal).sort((a, b) => a - b), [1, 2, 3, 4, 5, 100]);
});

test("E7 pretend GitHub, wrong key: nothing automatic until a new key is saved; then it syncs again", async () => {
  const r = repo();
  const p = phone(r);
  await settle(p);
  assert.deepEqual(saveConnection(p.store, { owner: r.prog.owner, repo: r.prog.repo, token: "x-wrong-key-123" }), { ok: true });
  addFood(p, 100);
  p.timers.fire();
  await settle(p);
  assert.equal(p.store.loadDevice().last_sync_result, "auth");
  const before = r.prog.calls.length + r.food.calls.length;
  for (const kcal of [1, 2, 3, 4, 5]) { addFood(p, kcal); p.timers.fire(); await settle(p); }
  p.win.document.visibilityState = "hidden";
  p.win.listeners.visibilitychange();
  p.win.listeners.pagehide();
  p.win.document.visibilityState = "visible";
  p.win.listeners.visibilitychange();
  p.win.listeners.online();
  await settle(p);
  assert.equal(r.prog.calls.length + r.food.calls.length, before, "no network call with a key that does not work");
  assert.equal(statusText(p.store.loadDevice(), true), "GitHub key expired or wrong. Make a new one.");
  assert.deepEqual(saveConnection(p.store, { owner: r.prog.owner, repo: r.prog.repo, token: VALID_TOKEN }), { ok: true });
  addFood(p, 6);
  p.timers.fire();
  await settle(p);
  assert.equal(p.store.loadDevice().last_sync_result, "ok");
  assert.equal(r.food.readDoc().food_log.length, 7);
});

test("E8 pretend GitHub, damaged file: the GET at open, then no more calls while it stays damaged", async () => {
  const r = repo();
  r.prog.putRaw("{ this is not json");
  const p = phone(r);
  await settle(p);
  assert.equal(p.store.loadDevice().last_sync_result, "broken_remote");
  const before = r.prog.calls.length;
  for (const kcal of [1, 2, 3]) { addFood(p, kcal); p.timers.fire(); await settle(p); }
  p.win.listeners.visibilitychange();
  p.win.listeners.online();
  await settle(p);
  assert.equal(r.prog.calls.length, before);
  assert.equal(puts(r.prog), 0);
});

test("E9 wiring: main.js gives startAutoSync the saved result through syncProblem", () => {
  const main = src("js/main.js");
  assert.match(main, /problem: \(\) => syncProblem\(store\.loadDevice\(\)\)/);
  assert.match(main, /import \{ store \} from "\.\/ui\/app\.js";|import \{ model, setRedraw, store \} from "\.\/ui\/app\.js";/);
});

// ---------- F: review round 1 fixes (auditor M1, M3, M4, N5) ----------

test("F1 leaving the app fires 'hidden' and 'pagehide': one sync, not two (auditor M1); a save in between is still sent", () => {
  const s = unitWith("none");
  s.calls.length = 0;
  s.auto.changed();
  s.win.document.visibilityState = "hidden";
  s.win.listeners.visibilitychange();
  s.state.running = true; // that sync is still on its way
  s.win.listeners.pagehide();
  assert.deepEqual(s.calls, ["full"], "pagehide does not ask for a second round");
  s.auto.changed(); // a save while the sync runs
  s.win.listeners.pagehide();
  assert.deepEqual(s.calls, ["full", "full"], "a new save is sent (the syncer runs one more round)");
});

test("F2 a record dated more than 10 minutes ahead (another phone's clock) is not 'not sent yet' (auditor M3)", async () => {
  const r = repo();
  const other = phone(r);
  other.model.updateSettings({ dumbbell_steps_kg: [2, 4] });
  other.timers.fire();
  await settle(other);
  const doc = r.prog.readDoc();
  doc.shared_settings.updated_at = "2031-01-01T00:00:00.000Z";
  r.prog.putDoc(doc);
  const p = phone(r, { start: "2026-03-05T09:00:00.000Z" });
  await settle(p);
  assert.equal(p.both.hasUnsynced(), false, "no false 'Not sent yet' for ever");
  assert.doesNotMatch(statusText(p.store.loadDevice(), p.both.hasUnsynced()), /Not sent yet/);
  // a real change on this phone is still 'not sent'
  addFood(p, 50);
  assert.equal(p.both.hasUnsynced(), true);
});

test("F3 hasChangesSince and foodChangesSince take an upper limit; without one they count everything as before", () => {
  const doc = { shared_settings: { updated_at: "2031-01-01T00:00:00.000Z" } };
  assert.equal(hasChangesSince(doc, "2026-03-05T09:00:00.000Z"), true, "no limit: as before");
  assert.equal(hasChangesSince(doc, "2026-03-05T09:00:00.000Z", "2026-03-05T09:10:00.000Z"), false);
  assert.equal(hasChangesSince({ shared_settings: { updated_at: "2026-03-05T09:05:00.000Z" } }, "2026-03-05T09:00:00.000Z", "2026-03-05T09:10:00.000Z"), true);
  const food = { food_log: [{ id: "f1", updated_at: "2031-01-01T00:00:00.000Z" }] };
  assert.equal(foodChangesSince(food, "2026-03-05T09:00:00.000Z"), true);
  assert.equal(foodChangesSince(food, "2026-03-05T09:00:00.000Z", "2026-03-05T09:10:00.000Z"), false);
});

test("F4 the Settings food line uses the same words as the workout line (auditor M4)", () => {
  const dev = { token: "x-test-key-1", owner: "o", food_last_sync_result: "ok" };
  const at = new Date(2026, 2, 2, 12, 25);
  const time = at.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  assert.equal(foodStatusText({ ...dev, food_last_sync_at: at.toISOString() }, false, "settings", new Date(2026, 2, 2, 18, 0)), `Food synced ${time}.`);
  assert.equal(foodStatusText({ ...dev, food_last_sync_at: at.toISOString() }, true), "Food: not sent yet, will send automatically.");
  assert.equal(foodStatusText({ token: "x-test-key-1", owner: "o" }, true), "Food: not sent yet, will send automatically.");
});

test("F5 no console output and no direct read of the device box in the app (auditor N5: the token never reaches a log)", () => {
  const dir = new URL("../app/js/", import.meta.url);
  const files = readdirSync(dir, { recursive: true }).filter((f) => String(f).endsWith(".js")).map((f) => String(f).replaceAll("\\", "/"));
  assert.ok(files.length > 30);
  for (const f of files) {
    if (f === "sync/fake-github.js") continue; // the pretend GitHub for tests and ?fake-github=1 only
    const code = readFileSync(new URL(f, dir), "utf8").replace(/^\s*\/\/.*$/gm, "");
    assert.doesNotMatch(code, /\bconsole\s*\.\s*\w+/, `${f}: no console output`);
    if (f !== "store.js" && f !== "boot.js") assert.doesNotMatch(code, /trn\.device\.v1/, `${f}: the device box is read only through store.js`);
  }
});

test("F6 a sync cut short in the background does not swallow the front sync: it tries again once it ends (checker 2)", async () => {
  const win = fakeWin();
  const timers = fakeTimers();
  const calls = [];
  const subs = new Set();
  const state = { running: false, unsynced: true, problem: "none" };
  const syncer = {
    isConfigured: () => true,
    isRunning: () => state.running,
    hasUnsynced: () => state.unsynced,
    subscribe: (fn) => { subs.add(fn); return () => subs.delete(fn); },
    request: (m) => { calls.push(m); return Promise.resolve({ result: "ok" }); },
  };
  const auto = startAutoSync({ syncer, win, inWorkout: () => false, problem: () => state.problem, now: () => 1, setTimer: timers.setTimer, clearTimer: timers.clearTimer });
  calls.length = 0;
  state.running = true; // the sync started on the way out is still "running" (iOS paused it)
  win.listeners.visibilitychange(); // back to the front
  assert.equal(calls.length, 0, "it does not only ask for an 'again' round that a failed round would drop");
  state.running = false;
  state.problem = "retry"; // the paused call failed (no signal)
  subs.forEach((fn) => fn({ result: "offline" }));
  assert.deepEqual(calls, ["full"], "front sync runs once the old one ended");
  subs.forEach((fn) => fn({ result: "offline" }));
  assert.deepEqual(calls, ["full"], "only once");
  auto.stop();
  assert.equal(subs.size, 0, "stop() unsubscribes");
});

test("F7 a sync ending never redraws while a text field is being typed in (checker 4: the keyboard would close)", () => {
  const doc = (tag, type = "text", sheet = false) => ({ activeElement: tag ? { tagName: tag, type } : null, querySelector: () => (sheet ? {} : null) });
  assert.equal(redrawAfterSync("#/settings", doc(null)), true);
  assert.equal(redrawAfterSync("#/settings", doc("INPUT")), false);
  assert.equal(redrawAfterSync("#/settings", doc("TEXTAREA")), false);
  assert.equal(redrawAfterSync("#/settings", doc("SELECT")), false);
  assert.equal(redrawAfterSync("#/settings", doc("INPUT", "checkbox")), true, "a tapped switch is not typing");
  assert.equal(redrawAfterSync("", doc("BUTTON")), true);
  assert.equal(redrawAfterSync("#/today", doc(null)), true);
  assert.equal(redrawAfterSync("#/progress", doc(null)), true);
  assert.equal(redrawAfterSync("#/diet", doc(null)), true);
  assert.equal(redrawAfterSync("#/diet", doc(null, "text", true)), false, "a sheet or the scanner is open");
  assert.equal(redrawAfterSync("#/workout", doc(null)), false);
  assert.equal(redrawAfterSync("#/plan", doc(null)), false);
  assert.match(src("js/main.js"), /syncer\.subscribe\(\(\) => \{ if \(redrawAfterSync\(location\.hash, document\)\) render\(\); \}\);/);
});

// ---------- G: review round 2 fix (auditor m1, n4) ----------

test("G1 a stuck food file (damaged, key, too new, phone data) does not count as 'not sent': no sync after every food save", async () => {
  const r = repo();
  r.food.putRaw("{ this is not json");
  const p = phone(r);
  await settle(p);
  assert.equal(p.store.loadDevice().food_last_sync_result, "broken_remote");
  assert.equal(p.store.loadDevice().last_sync_result, "ok", "the workout sync is fine");
  const before = r.prog.calls.length + r.food.calls.length;
  for (const kcal of [1, 2, 3, 4, 5]) { addFood(p, kcal); p.timers.fire(); await settle(p); }
  p.win.document.visibilityState = "hidden";
  p.win.listeners.visibilitychange();
  p.win.listeners.pagehide();
  await settle(p);
  assert.equal(r.prog.calls.length + r.food.calls.length, before, "no network call for food that can not be sent");
  assert.equal(p.both.hasUnsynced(), false);
  assert.doesNotMatch(statusText(p.store.loadDevice(), p.both.hasUnsynced()), /Not sent yet/, "no 'will send automatically' for ever");
  assert.equal(foodStatusText(p.store.loadDevice(), true), FOOD_MESSAGES.broken_remote, "the food line says the problem");
  // a workout change is still sent at once after the quiet time
  p.model.updateSettings({ dumbbell_steps_kg: [2, 4, 6] });
  p.timers.fire();
  await settle(p);
  assert.deepEqual(r.prog.readDoc().shared_settings.dumbbell_steps_kg, [2, 4, 6]);
  // the food file is mended; "Sync now" sends the food again
  r.food.removeFile();
  await p.both.request("full");
  await settle(p);
  assert.equal(p.store.loadDevice().food_last_sync_result, "ok");
  assert.deepEqual(r.food.readDoc().food_log.map((x) => x.kcal).sort((a, b) => a - b), [1, 2, 3, 4, 5]);
});

test("G2 combined 'not sent': food counts while its last result is fine or worth a retry; not while it is stuck", () => {
  const progress = { hasUnsynced: () => false, isRunning: () => false, isConfigured: () => true };
  for (const [res, counts] of [[null, true], ["ok", true], ["offline", true], ["conflict", true], ["rate", true], ["error", true], ["full", true],
    ["broken_remote", false], ["auth", false], ["no_access", false], ["too_new", false], ["local_problem", false], ["local_invalid", false]]) {
    const food = { hasUnsynced: () => true, isRunning: () => false, lastResult: () => res };
    assert.equal(combineSyncers(progress, food).hasUnsynced(), counts, String(res));
  }
  // workout changes always count, whatever the food result
  const prog2 = { ...progress, hasUnsynced: () => true };
  assert.equal(combineSyncers(prog2, { hasUnsynced: () => false, isRunning: () => false, lastResult: () => "broken_remote" }).hasUnsynced(), true);
  // a food result that can not be read counts as fine (unsent food is never hidden by a read problem)
  assert.equal(combineSyncers(progress, { hasUnsynced: () => true, isRunning: () => false, lastResult: () => { throw new Error("x"); } }).hasUnsynced(), true);
});

test("G3 the source scan also covers the service worker (auditor n4)", () => {
  const sw = readFileSync(new URL("../app/sw.js", import.meta.url), "utf8").replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(sw, /\bconsole\s*\.\s*\w+/);
  assert.doesNotMatch(sw, /trn\.device\.v1/);
});
