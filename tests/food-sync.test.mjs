// Food sync (build step 6, delicate; answer 78 a): the food log syncs in its OWN file, food.json, in the same private
// repo, with the same rules as progress.json (ARCHITECTURE 5.2): never PUT over a file it cannot read, 409/422 retry,
// merge by id with tombstones, cache: "no-store", last sync time = start time. A food sync problem never changes
// progress.json. Tested only against the pretend GitHub. Written before the code (tests first). All values made up.
import test from "node:test";
import assert from "node:assert/strict";
import { createStore, KEYS } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { createSyncer, saveConnection, forgetKey } from "../app/js/sync/sync.js";
import { createFoodSyncer, foodStatusText, FOOD_PATH, FOOD_MESSAGES } from "../app/js/sync/foodsync.js";
import { combineSyncers } from "../app/js/sync/both.js";
import { createFoodStore, FOOD_KEYS } from "../app/js/food/foodstore.js";
import { createFoodModel } from "../app/js/food/foodmodel.js";
import { createFakeGithub, VALID_TOKEN } from "./fake-github.mjs";
import { fakeStorage, intake } from "./fixtures/profiles.mjs";

// One pretend repo holding two files: progress.json and food.json (the fake serves one path each; calls are routed).
function repo() {
  const prog = createFakeGithub();
  const food = createFakeGithub({ path: "food.json" });
  const route = (url, init) => (String(url).includes("/contents/food.json") ? food.fetch(url, init) : prog.fetch(url, init));
  return { prog, food, fetch: route };
}

function phone(r, { token = VALID_TOKEN, limit = Infinity, start = "2026-03-02T09:00:00.000Z", configure = true, fetch } = {}) {
  const storage = fakeStorage(limit);
  const store = createStore(storage);
  const foodStore = createFoodStore(storage);
  let ms = Date.parse(start);
  const clock = () => new Date((ms += 1000));
  const nowIso = () => new Date((ms += 1000)).toISOString();
  const getFetch = () => fetch ?? r.fetch;
  const model = createModel(store, clock);
  const food = createFoodModel(foodStore, clock);
  const progressSyncer = createSyncer({ store, getFetch, nowIso });
  const foodSyncer = createFoodSyncer({ store, foodStore, getFetch, nowIso });
  const both = combineSyncers(progressSyncer, foodSyncer);
  if (configure) assert.deepEqual(saveConnection(store, { owner: r.prog.owner, repo: r.prog.repo, token }), { ok: true });
  return { storage, store, foodStore, model, food, progressSyncer, foodSyncer, both, tick: (s = 60) => { ms += s * 1000; } };
}
const addFood = (p, kcal = 300, date = "2026-03-02") => p.food.quickAdd({ date, meal: "lunch", kcal, protein_g: 20 });
const kcals = (doc) => doc.food_log.filter((x) => !x.deleted).map((x) => x.kcal).sort((a, b) => a - b);
const puts = (fake) => fake.calls.filter((c) => c.method === "PUT").length;

test("S1 first food sync creates food.json (no sha) with only the food; progress.json gets no food", async () => {
  const r = repo();
  const p = phone(r);
  p.model.setProfile(intake());
  addFood(p);
  const res = await p.both.request();
  assert.equal(res.result, "ok");
  assert.equal(res.food.result, "ok");
  assert.equal(FOOD_PATH, "food.json");
  const f = r.food.readDoc();
  assert.equal(f.app, "training-food");
  assert.deepEqual(kcals(f), [300]);
  assert.equal(f.profile, undefined, "no workout data in food.json");
  const prog = r.prog.readDoc();
  assert.equal(prog.food_log, undefined, "no food in progress.json");
  assert.equal(prog.foods, undefined);
  const dev = p.store.loadDevice();
  assert.ok(dev.food_last_sha && dev.food_last_sync_at && dev.food_last_sync_result === "ok");
  assert.notEqual(dev.food_last_sha, dev.last_sha);
});

test("S2 a phone with no food does not create food.json; nothing new sends nothing", async () => {
  const r = repo();
  const p = phone(r);
  assert.equal((await p.foodSyncer.request()).result, "ok");
  assert.equal(r.food.file, null);
  addFood(p);
  await p.foodSyncer.request();
  const n = r.food.commits;
  await p.foodSyncer.request();
  assert.equal(r.food.commits, n);
});

test("S3 two phones: both keep every food, end equal; a delete on one phone reaches the other", async () => {
  const r = repo();
  const a = phone(r);
  const e = addFood(a, 111);
  await a.foodSyncer.request();
  const b = phone(r, { start: "2026-03-02T10:00:00.000Z" });
  addFood(b, 222);
  await b.foodSyncer.request();
  await a.foodSyncer.request();
  assert.deepEqual(kcals(a.food.doc()), [111, 222]);
  assert.deepEqual(kcals(b.food.doc()), [111, 222]);
  a.tick(3600);
  a.food.removeEntry(e.id);
  await a.foodSyncer.request();
  await b.foodSyncer.request();
  assert.deepEqual(kcals(b.food.doc()), [222]);
  assert.deepEqual(kcals(r.food.readDoc()), [222]);
});

test("S4 'Get from GitHub' merges food into the phone and never sends", async () => {
  const r = repo();
  const a = phone(r);
  addFood(a, 400);
  await a.foodSyncer.request();
  const b = phone(r);
  addFood(b, 500);
  const n = puts(r.food);
  const res = await b.foodSyncer.request("get");
  assert.equal(res.result, "ok");
  assert.equal(puts(r.food), n);
  assert.deepEqual(kcals(b.food.doc()), [400, 500]);
});

test("S5 a food merge keeps a safety copy of the food box from just before it", async () => {
  const r = repo();
  const a = phone(r);
  addFood(a, 100);
  await a.foodSyncer.request();
  const b = phone(r);
  addFood(b, 200);
  const before = b.storage.getItem(FOOD_KEYS.data);
  await b.foodSyncer.request();
  assert.equal(b.storage.getItem(FOOD_KEYS.prev), before);
  assert.equal(b.storage.getItem(KEYS.prev), null, "the workout safety copy is not touched by a food merge");
});

test("S6 error rows: offline, wrong key, no access, rate limit, 5xx; food stays on the phone, still unsynced", async () => {
  const r = repo();
  const p = phone(r);
  addFood(p);
  r.food.setBlocked(true);
  let res = await p.foodSyncer.request();
  assert.equal(res.result, "offline");
  assert.equal(p.foodSyncer.hasUnsynced(), true);
  r.food.setBlocked(false);
  r.food.fail("get", 500);
  assert.equal((await p.foodSyncer.request()).result, "error");
  r.food.fail("get", "rate");
  assert.equal((await p.foodSyncer.request()).result, "rate");
  r.food.fail("get", 429);
  assert.equal((await p.foodSyncer.request()).result, "rate");
  r.food.fail("get", 404);
  r.prog.fail("repo", 404);
  assert.equal((await p.foodSyncer.request()).result, "no_access");
  const bad = phone(r, { token: "wrong-token-123" });
  addFood(bad);
  assert.equal((await bad.foodSyncer.request()).result, "auth");
  assert.equal(puts(r.food), 0);
  assert.deepEqual(kcals(p.food.doc()), [300]);
  assert.equal((await p.foodSyncer.request()).result, "ok");
  assert.equal(p.foodSyncer.hasUnsynced(), false);
});

test("S7 not set up: plain message, no network call", async () => {
  const r = repo();
  const p = phone(r, { configure: false });
  addFood(p);
  const res = await p.foodSyncer.request();
  assert.equal(res.result, "not_set_up");
  assert.equal(r.food.calls.length + r.prog.calls.length, 0);
});

test("S8 409 or 422 once: fetch again, merge again, succeed; 3 clashes: 'Sync clash', nothing lost", async () => {
  const r = repo();
  const p = phone(r);
  addFood(p, 10);
  r.food.fail("put", 409);
  assert.equal((await p.foodSyncer.request()).result, "ok");
  addFood(p, 20);
  r.food.fail("put", 422);
  assert.equal((await p.foodSyncer.request()).result, "ok");
  addFood(p, 30);
  r.food.fail("put", 409, 3);
  const res = await p.foodSyncer.request();
  assert.equal(res.result, "conflict");
  assert.equal(res.message, "Sync clash. Tap to try again.");
  assert.deepEqual(kcals(p.food.doc()), [10, 20, 30]);
  assert.equal((await p.foodSyncer.request()).result, "ok");
  assert.deepEqual(kcals(r.food.readDoc()), [10, 20, 30]);
});

test("S9 a real clash: another phone wrote food.json in between; the retry merges both", async () => {
  const r = repo();
  const a = phone(r);
  addFood(a, 1);
  await a.foodSyncer.request();
  const b = phone(r);
  addFood(b, 2);
  r.food.hooks.afterGet = () => {
    r.food.hooks.afterGet = null;
    const other = r.food.readDoc();
    other.food_log.push({ id: "f-20260302-zzzzzz", updated_at: "2026-03-02T09:30:00.000Z", date: "2026-03-02", meal: "dinner", food: null, name: "Other phone", amount_g: null, kcal: 3, protein_g: 0, carbs_g: null, fat_g: null, source: "quick" });
    r.food.putDoc(other);
  };
  assert.equal((await b.foodSyncer.request()).result, "ok");
  assert.deepEqual(kcals(r.food.readDoc()), [1, 2, 3]);
  assert.deepEqual(kcals(b.food.doc()), [1, 2, 3]);
});

test("S10 a damaged food.json is never overwritten: not JSON, a workout file, bad values, garbage body", async () => {
  const r = repo();
  const p = phone(r);
  addFood(p);
  for (const text of ["{ not json", JSON.stringify({ format: 1, app: "training", sessions: [] }), JSON.stringify({ format: 1, app: "training-food", food_log: [{ id: "f-1", updated_at: "x" }] })]) {
    r.food.putRaw(text);
    const sha = r.food.file.sha;
    const res = await p.foodSyncer.request();
    assert.equal(res.result, "broken_remote");
    assert.equal(res.message, FOOD_MESSAGES.broken_remote);
    assert.match(res.message, /food file/);
    assert.equal(r.food.file.sha, sha);
    assert.equal(r.food.file.text, text);
  }
  r.food.fail("get", "garbage");
  assert.equal((await p.foodSyncer.request()).result, "broken_remote");
  assert.deepEqual(kcals(p.food.doc()), [300], "the phone keeps its food");
});

test("S11 a newer food.json format: 'Update the app first', never sends", async () => {
  const r = repo();
  const p = phone(r);
  addFood(p);
  r.food.putDoc({ format: 2, app: "training-food", foods: [], food_log: [] });
  const n = r.food.commits;
  assert.equal((await p.foodSyncer.request()).result, "too_new");
  assert.equal(r.food.commits, n);
});

test("S12 damaged food box on the phone: nothing is sent and the box is not changed", async () => {
  const r = repo();
  const p = phone(r);
  addFood(p);
  await p.foodSyncer.request();
  p.storage.setItem(FOOD_KEYS.data, "{ broken");
  const res = await p.foodSyncer.request();
  assert.equal(res.result, "local_problem");
  assert.equal(p.storage.getItem(FOOD_KEYS.data), "{ broken");
  assert.equal(puts(r.food), 1);
});

test("S13 phone full during a food merge: 'full', the box is unchanged, nothing sent", async () => {
  const r = repo();
  const donor = phone(r);
  for (let i = 0; i < 6; i++) addFood(donor, 100 + i);
  await donor.foodSyncer.request();
  const small = phone(r, { limit: 900 });
  addFood(small, 1);
  const before = small.storage.getItem(FOOD_KEYS.data);
  const res = await small.foodSyncer.request();
  assert.equal(res.result, "full");
  assert.equal(small.storage.getItem(FOOD_KEYS.data), before);
  assert.equal(puts(r.food), 1);
});

test("S14 every food call: cache no-store, the key only in the header, only the food.json address", async () => {
  const r = repo();
  const p = phone(r);
  addFood(p);
  await p.foodSyncer.request();
  assert.ok(r.food.calls.length >= 2);
  for (const c of r.food.calls) {
    assert.equal(c.cache, "no-store");
    assert.equal(c.authOk, true);
    assert.ok(!c.url.includes(VALID_TOKEN));
    assert.match(c.url, /^https:\/\/api\.github\.com\/repos\/rosa-test\/training-data\/contents\/food\.json(\?ref=main)?$/);
  }
  assert.ok(!JSON.stringify(r.food.readDoc()).includes(VALID_TOKEN));
  assert.ok(!p.storage.getItem(FOOD_KEYS.data).includes(VALID_TOKEN));
});

test("S15 an edit made while the food PUT waits is kept and still counts as not synced", async () => {
  const r = repo();
  const p = phone(r);
  addFood(p, 5);
  r.food.hooks.beforePut = () => { addFood(p, 6); };
  assert.equal((await p.foodSyncer.request()).result, "ok");
  assert.deepEqual(kcals(p.food.doc()), [5, 6]);
  assert.deepEqual(kcals(r.food.readDoc()), [5]);
  assert.equal(p.foodSyncer.hasUnsynced(), true);
  r.food.hooks.beforePut = null;
  await p.foodSyncer.request();
  assert.deepEqual(kcals(r.food.readDoc()), [5, 6]);
  assert.equal(p.foodSyncer.hasUnsynced(), false);
});

test("S16 an edit made during the GET wait is merged in too", async () => {
  const r = repo();
  const a = phone(r);
  addFood(a, 7);
  await a.foodSyncer.request();
  const b = phone(r);
  r.food.hooks.afterGet = () => { r.food.hooks.afterGet = null; addFood(b, 8); };
  await b.foodSyncer.request();
  assert.deepEqual(kcals(b.food.doc()), [7, 8]);
});

test("S17 food last sync time is the time the food sync started; its keys are apart from the workout keys", async () => {
  const r = repo();
  const p = phone(r);
  addFood(p);
  const dev0 = p.store.loadDevice();
  await p.foodSyncer.request();
  const dev = p.store.loadDevice();
  assert.equal(dev.last_sync_at, dev0.last_sync_at, "the workout sync time is not touched");
  assert.equal(dev.last_sha, dev0.last_sha);
  const sent = r.food.readDoc().food_log[0].updated_at;
  assert.ok(dev.food_last_sync_at > sent);
  assert.ok(dev.food_last_sync_attempt_at > dev.food_last_sync_at, "the start time, not the end time");
});

test("S18 never send a food file this app could not read back", async () => {
  const r = repo();
  const p = phone(r);
  addFood(p);
  const raw = JSON.parse(p.storage.getItem(FOOD_KEYS.data));
  raw.food_log[0].kcal = -50; // a value the check refuses (made by hand)
  p.storage.setItem(FOOD_KEYS.data, JSON.stringify(raw));
  const res = await p.foodSyncer.request();
  assert.equal(res.result, "local_invalid");
  assert.equal(puts(r.food), 0);
});

test("S19 together: a damaged food.json never stops or changes the workout sync", async () => {
  const r = repo();
  const p = phone(r);
  p.model.setProfile(intake());
  addFood(p);
  r.food.putRaw("{ damaged");
  const res = await p.both.request();
  assert.equal(res.result, "ok");
  assert.ok(r.prog.readDoc().profile);
  assert.equal(res.food.result, "broken_remote");
  assert.equal(r.food.file.text, "{ damaged");
  assert.equal(p.store.loadDevice().last_sync_result, "ok", "the workout status line stays right");
});

test("S20 together: a damaged progress.json does not stop the food sync, and food never enters progress.json", async () => {
  const r = repo();
  const p = phone(r);
  p.model.setProfile(intake());
  addFood(p, 321);
  r.prog.putRaw("{ damaged");
  const res = await p.both.request();
  assert.equal(res.result, "broken_remote");
  assert.equal(res.food.result, "ok");
  assert.deepEqual(kcals(r.food.readDoc()), [321]);
  assert.equal(r.prog.file.text, "{ damaged");
});

test("S21 together: no signal, wrong key or rate limit on the workout file skips the food call", async () => {
  const r = repo();
  const p = phone(r);
  p.model.setProfile(intake());
  addFood(p);
  r.prog.setBlocked(true);
  const res = await p.both.request();
  assert.equal(res.result, "offline");
  assert.equal(res.food.result, "offline");
  assert.equal(res.food.skipped, true);
  assert.equal(r.food.calls.length, 0);
  r.prog.setBlocked(false);
  r.prog.fail("get", "rate");
  assert.equal((await p.both.request()).food.skipped, true);
  assert.equal(r.food.calls.length, 0);
});

test("S22 together: one sync at a time; a second request waits for one more round; hasUnsynced sees food", async () => {
  const r = repo();
  const p = phone(r);
  p.model.setProfile(intake());
  await p.both.request();
  assert.equal(p.both.hasUnsynced(), false);
  addFood(p);
  assert.equal(p.both.hasUnsynced(), true, "unsent food counts as not synced");
  const first = p.both.request();
  assert.equal(p.both.isRunning(), true);
  const second = p.both.request();
  const [a, b] = await Promise.all([first, second]);
  assert.equal(a.result, "ok");
  assert.equal(b.result, "ok");
  assert.equal(p.both.isRunning(), false);
  assert.equal(p.both.hasUnsynced(), false);
  const seen = [];
  const off = p.both.subscribe((x) => seen.push(x));
  await p.both.request();
  off();
  assert.equal(seen.length, 1);
  assert.ok(seen[0].food);
  assert.equal(p.both.isConfigured(), true);
});

test("S23 'Get from GitHub' together: both files merged, nothing sent", async () => {
  const r = repo();
  const a = phone(r);
  a.model.setProfile(intake());
  addFood(a, 42);
  await a.both.request();
  const b = phone(r);
  const n = puts(r.food) + puts(r.prog);
  const res = await b.both.request("get");
  assert.equal(res.result, "ok");
  assert.equal(res.food.result, "ok");
  assert.equal(puts(r.food) + puts(r.prog), n);
  assert.deepEqual(kcals(b.food.doc()), [42]);
  assert.ok(b.model.doc().profile);
});

test("S24 Forget GitHub key also removes the food sync state; a new connection starts the food file clean", async () => {
  const r = repo();
  const p = phone(r);
  addFood(p);
  await p.foodSyncer.request();
  saveConnection(p.store, { owner: "rosa-test", repo: "training-data", token: VALID_TOKEN });
  const d1 = p.store.loadDevice();
  assert.equal(d1.food_last_sha, undefined);
  assert.equal(d1.food_last_sync_result, undefined);
  saveConnection(p.store, { owner: "rosa-test", repo: "other-repo" });
  assert.equal(p.store.loadDevice().food_last_sync_at, undefined, "another repo: food not synced there yet");
  forgetKey(p.store);
  const d2 = p.store.loadDevice();
  for (const k of ["food_last_sha", "food_last_sync_at", "food_last_sync_result", "food_last_sync_attempt_at"]) assert.equal(d2[k], undefined, k);
  assert.deepEqual(kcals(p.food.doc()), [300], "the food stays on the phone");
});

test("S25 food status line in words", () => {
  assert.equal(foodStatusText({}), "Food is only on this phone. Set up GitHub in Settings.");
  const dev = { token: "t-made-up", owner: "o" };
  assert.equal(foodStatusText(dev), "Food: GitHub is set up. Not synced yet.");
  assert.equal(foodStatusText({ ...dev, food_last_sync_result: "broken_remote" }), FOOD_MESSAGES.broken_remote);
  assert.match(foodStatusText({ ...dev, food_last_sync_result: "ok", food_last_sync_at: "2026-03-02T09:00:00.000Z" }), /^Food synced /);
  assert.match(foodStatusText({ ...dev, food_last_sync_result: "ok", food_last_sync_at: "2026-03-02T09:00:00.000Z" }, true), /Newer food not sent yet\.$/);
});
