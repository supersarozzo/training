// Sync flow against the pretend GitHub (docs/ARCHITECTURE.md sections 5, 11 and 12). All values are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { createStore, KEYS } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { createSyncer, saveConnection, forgetKey, MESSAGES, connectionOf } from "../app/js/sync/sync.js";
import { createGithub, toBase64, fromBase64, SyncError } from "../app/js/sync/github.js";
import { createFakeGithub, VALID_TOKEN } from "./fake-github.mjs";
import { emptyDoc } from "../app/js/validate.js";
import { fakeStorage, intake } from "./fixtures/profiles.mjs";

// A phone: its own storage, model and syncer, all pointed at one pretend GitHub.
function phone(fake, { token = VALID_TOKEN, limit = Infinity, start = "2026-03-02T09:00:00.000Z", configure = true } = {}) {
  const storage = fakeStorage(limit);
  const store = createStore(storage);
  let ms = Date.parse(start);
  const clock = () => new Date((ms += 1000));
  const model = createModel(store, clock);
  const syncer = createSyncer({ store, getFetch: () => fake.fetch, nowIso: () => new Date((ms += 1000)).toISOString() });
  if (configure) assert.deepEqual(saveConnection(store, { owner: fake.owner, repo: fake.repo, token }), { ok: true });
  return { storage, store, model, syncer, clock, tick: (s = 60) => { ms += s * 1000; } };
}
const withProfile = (p) => { p.model.setProfile(intake()); p.model.setWeighin("2026-03-02", 80.5); return p; };
const weighDates = (doc) => doc.weighins.filter((x) => !x.deleted).map((x) => x.date).sort();

test("first sync: the file does not exist, it is created without a sha", async () => {
  const fake = createFakeGithub();
  const p = withProfile(phone(fake));
  const res = await p.syncer.request();
  assert.equal(res.result, "ok");
  const puts = fake.calls.filter((c) => c.method === "PUT");
  assert.equal(puts.length, 1);
  assert.deepEqual(weighDates(fake.readDoc()), ["2026-03-02"]);
  assert.ok(fake.readDoc().profile);
  const dev = p.store.loadDevice();
  assert.ok(dev.last_sha && dev.last_sync_at && dev.last_sync_result === "ok");
});

test("an empty phone does not create an empty file", async () => {
  const fake = createFakeGithub();
  const p = phone(fake);
  assert.equal((await p.syncer.request()).result, "ok");
  assert.equal(fake.file, null);
});

test("second sync with nothing new sends nothing", async () => {
  const fake = createFakeGithub();
  const p = withProfile(phone(fake));
  await p.syncer.request();
  const commits = fake.commits;
  await p.syncer.request();
  assert.equal(fake.commits, commits);
});

test("a clash between two copies: both phones keep everything, and end equal", async () => {
  const fake = createFakeGithub();
  const a = withProfile(phone(fake));
  await a.syncer.request();
  // phone B starts from GitHub
  const b = phone(fake);
  await b.syncer.request("get");
  assert.deepEqual(weighDates(b.model.doc()), ["2026-03-02"]);
  // both change while apart
  a.model.setWeighin("2026-03-03", 80.1);
  b.model.setWeighin("2026-03-04", 79.9);
  b.model.deleteWeighin("2026-03-02");
  await a.syncer.request();
  await b.syncer.request();
  await a.syncer.request();
  assert.deepEqual(weighDates(a.model.doc()), ["2026-03-03", "2026-03-04"]);
  assert.deepEqual(weighDates(a.model.doc()), weighDates(b.model.doc()));
  assert.deepEqual(weighDates(fake.readDoc()), ["2026-03-03", "2026-03-04"]);
  assert.equal(a.model.doc().weighins.find((x) => x.date === "2026-03-02").deleted, true); // the tombstone arrived
});

test("Get from GitHub merges into the phone and never sends", async () => {
  const fake = createFakeGithub();
  const a = withProfile(phone(fake));
  await a.syncer.request();
  const b = phone(fake);
  b.model.setWeighin("2026-03-09", 78);
  const commits = fake.commits;
  const res = await b.syncer.request("get");
  assert.equal(res.result, "ok");
  assert.equal(fake.commits, commits);
  assert.deepEqual(weighDates(b.model.doc()), ["2026-03-02", "2026-03-09"]);
  assert.equal(fake.calls.filter((c) => c.method === "PUT").length, 1); // only phone A's first send
});

test("a merge keeps a safety copy of the data from just before it", async () => {
  const fake = createFakeGithub();
  const a = withProfile(phone(fake));
  await a.syncer.request();
  const b = phone(fake);
  b.model.setWeighin("2026-03-09", 78);
  const before = b.model.doc();
  await b.syncer.request("get");
  assert.deepEqual(b.store.loadPrev(), before);
});

// ---------- section 11: error rows ----------

test("no signal: saved on the phone, will sync when online; nothing lost; the next try works", async () => {
  const fake = createFakeGithub();
  const p = withProfile(phone(fake));
  fake.setBlocked(true);
  const res = await p.syncer.request();
  assert.equal(res.result, "offline");
  assert.equal(res.message, "Saved on phone. Will sync when online.");
  assert.equal(p.model.doc().weighins.length, 1);
  assert.equal(p.syncer.hasUnsynced(), true);
  fake.setBlocked(false);
  assert.equal((await p.syncer.request()).result, "ok");
  assert.equal(p.syncer.hasUnsynced(), false);
  assert.equal(fake.readDoc().weighins.length, 1);
});

test("sync not set up: a plain message and no network call at all", async () => {
  const fake = createFakeGithub();
  const p = withProfile(phone(fake, { configure: false }));
  const res = await p.syncer.request();
  assert.equal(res.result, "not_set_up");
  assert.equal(res.message, "Only on this phone. Set up GitHub in Progress › Settings.");
  assert.equal(fake.calls.length, 0);
});

test("wrong or expired key (401): stops, no write", async () => {
  const fake = createFakeGithub();
  const p = withProfile(phone(fake, { token: "a-wrong-key-123" }));
  const res = await p.syncer.request();
  assert.equal(res.result, "auth");
  assert.equal(res.message, "GitHub key expired or wrong. Make a new one.");
  assert.equal(fake.calls.filter((c) => c.method === "PUT").length, 0);
  assert.equal(p.model.doc().weighins.length, 1);
});

test("repo not found or no access (404 / 403 on the repo): stops", async () => {
  for (const kind of [404, 403]) {
    const fake = createFakeGithub();
    const p = withProfile(phone(fake));
    fake.fail("repo", kind, 5);
    const res = await p.syncer.request();
    assert.equal(res.result, "no_access", String(kind));
    assert.equal(res.message, "Can't reach training-data. Check the repo name and key.");
    assert.equal(fake.calls.filter((c) => c.method === "PUT").length, 0);
  }
});

test("a wrong repo name in the address is refused before any call", async () => {
  const fake = createFakeGithub();
  const p = withProfile(phone(fake));
  assert.equal(saveConnection(p.store, { owner: "bad/owner", repo: "x" }).ok, false);
  assert.equal(saveConnection(p.store, { owner: "ok", repo: "../x" }).ok, false);
});

test("too many requests (403 with limit header, and 429): GitHub says wait a bit", async () => {
  for (const kind of ["rate", 429]) {
    const fake = createFakeGithub();
    const p = withProfile(phone(fake));
    fake.fail("get", kind);
    const res = await p.syncer.request();
    assert.equal(res.result, "rate", String(kind));
    assert.equal(res.message, "GitHub says wait a bit.");
  }
});

test("conflict after 3 tries: 'Sync clash', nothing lost, the next sync works", async () => {
  const fake = createFakeGithub();
  const p = withProfile(phone(fake));
  await p.syncer.request();
  p.model.setWeighin("2026-03-05", 79);
  fake.fail("put", 409, 3);
  const res = await p.syncer.request();
  assert.equal(res.result, "conflict");
  assert.equal(res.message, "Sync clash. Tap to try again.");
  assert.equal(fake.calls.filter((c) => c.method === "GET" && c.url.includes("/contents/")).length, 1 + 3);
  assert.equal(p.model.doc().weighins.length, 2);
  assert.equal((await p.syncer.request()).result, "ok");
  assert.equal(fake.readDoc().weighins.length, 2);
});

test("409 or 422 once: it fetches again, merges again and succeeds", async () => {
  for (const kind of [409, 422]) {
    const fake = createFakeGithub();
    const p = withProfile(phone(fake));
    await p.syncer.request();
    p.model.setWeighin("2026-03-05", 79);
    fake.fail("put", kind, 1);
    assert.equal((await p.syncer.request()).result, "ok", String(kind));
    assert.equal(fake.readDoc().weighins.length, 2);
  }
});

test("a real clash: another phone wrote in between, the retry merges both", async () => {
  const fake = createFakeGithub();
  const a = withProfile(phone(fake));
  await a.syncer.request();
  a.model.setWeighin("2026-03-05", 79);
  const other = JSON.parse(JSON.stringify(fake.readDoc()));
  other.weighins.push({ id: "w-2026-03-06", updated_at: "2026-03-06T07:00:00.000Z", date: "2026-03-06", kg: 78.5 });
  let wrote = false;
  fake.hooks.beforePut = () => { if (!wrote) { wrote = true; fake.putDoc(other); } }; // someone else saves just before our PUT
  assert.equal((await a.syncer.request()).result, "ok");
  assert.deepEqual(weighDates(fake.readDoc()), ["2026-03-02", "2026-03-05", "2026-03-06"]);
  assert.deepEqual(weighDates(a.model.doc()), ["2026-03-02", "2026-03-05", "2026-03-06"]);
});

test("remote file broken (not JSON, wrong shape, bad values): never overwritten", async () => {
  const cases = [
    "this is not json",
    JSON.stringify({ hello: "world" }),
    JSON.stringify({ format: 1, app: "training", weighins: [{ id: "w-x", updated_at: "2026-03-01T00:00:00.000Z", date: "2026-03-01", kg: "heavy" }] }),
    JSON.stringify({ format: 1, app: "training", sessions: "nope" }),
    "[]",
  ];
  for (const text of cases) {
    const fake = createFakeGithub();
    fake.putRaw(text);
    const p = withProfile(phone(fake));
    const res = await p.syncer.request();
    assert.equal(res.result, "broken_remote", text.slice(0, 30));
    assert.equal(res.message, "The GitHub file looks damaged. Not changed. Ask the Training chat.");
    assert.equal(fake.calls.filter((c) => c.method === "PUT").length, 0);
    assert.equal(fake.file.text, text);
    assert.equal(p.model.doc().weighins.length, 1);
  }
});

test("remote answer that is not a file (garbage body): never overwritten", async () => {
  const fake = createFakeGithub();
  fake.putDoc({ ...emptyDoc() });
  fake.fail("get", "garbage");
  const p = withProfile(phone(fake));
  assert.equal((await p.syncer.request()).result, "broken_remote");
  assert.equal(fake.calls.filter((c) => c.method === "PUT").length, 0);
});

test("remote format newer: 'Update the app first', never sends", async () => {
  const fake = createFakeGithub();
  fake.putRaw(JSON.stringify({ ...emptyDoc(), format: 2 }));
  const p = withProfile(phone(fake));
  const res = await p.syncer.request();
  assert.equal(res.result, "too_new");
  assert.equal(res.message, "Update the app first.");
  assert.equal(fake.calls.filter((c) => c.method === "PUT").length, 0);
});

test("a 5xx error stops quietly: saved on the phone, will sync later", async () => {
  for (const code of [500, 503]) {
    const fake = createFakeGithub();
    const p = withProfile(phone(fake));
    fake.fail("get", code);
    const res = await p.syncer.request();
    assert.equal(res.result, "error");
    assert.equal(res.message, "Saved on phone. Will sync later.");
    assert.equal(fake.calls.filter((c) => c.method === "PUT").length, 0);
  }
});

test("the network fails during the PUT: nothing lost, still unsynced", async () => {
  const fake = createFakeGithub();
  const p = withProfile(phone(fake));
  fake.fail("put", "network");
  assert.equal((await p.syncer.request()).result, "offline");
  assert.equal(p.syncer.hasUnsynced(), true);
  assert.equal(fake.file, null);
});

test("phone storage full: reported, the data on the phone is not dropped, nothing is sent", async () => {
  const fake = createFakeGithub();
  // GitHub holds a record the phone does not have; the phone has almost no room left.
  const donor = withProfile(phone(fake));
  donor.model.setWeighin("2026-03-03", 80);
  await donor.syncer.request();
  const small = phone(fake, { limit: 1500 });
  small.model.setProfile(intake());
  const before = small.storage.getItem(KEYS.data);
  const doc0 = small.model.doc();
  const res = await small.syncer.request();
  assert.equal(res.result, "full");
  assert.equal(res.message, "Phone storage full. Download a backup.");
  assert.equal(small.storage.getItem(KEYS.data), before);
  assert.deepEqual(small.model.doc(), doc0);
  assert.equal(fake.calls.filter((c) => c.method === "PUT").length, 1); // only the donor's
});

test("damaged data on the phone: nothing is sent", async () => {
  const fake = createFakeGithub();
  const p = withProfile(phone(fake));
  p.storage.setItem(KEYS.data, "{ broken");
  const res = await p.syncer.request();
  assert.equal(res.result, "local_problem");
  assert.equal(fake.calls.filter((c) => c.method === "PUT").length, 0);
  assert.equal(p.storage.getItem(KEYS.data), "{ broken");
});

// ---------- section 12 item 3: the flow ----------

test("every GET uses cache: no-store, and every call carries the key in the header only", async () => {
  const fake = createFakeGithub();
  const p = withProfile(phone(fake));
  await p.syncer.request();
  await p.syncer.test();
  assert.ok(fake.calls.length >= 3);
  for (const c of fake.calls) {
    assert.equal(c.cache, "no-store", `${c.method} ${c.url}`);
    assert.equal(c.authOk, true);
    assert.ok(!c.url.includes(VALID_TOKEN));
  }
});

test("letters like é and emoji go through base64 and come back the same", async () => {
  assert.equal(fromBase64(toBase64("Caffè – 💪 ü")), "Caffè – 💪 ü");
  assert.equal(fromBase64(`${toBase64("a".repeat(100))}`.replace(/(.{20})/g, "$1\n")), "a".repeat(100));
  const fake = createFakeGithub();
  const p = withProfile(phone(fake));
  p.model.updateSettings({ shortcut: { on: false, name: "Log Allenamento é💪" } });
  await p.syncer.request();
  assert.equal(fake.readDoc().shared_settings.shortcut.name, "Log Allenamento é💪");
  const q = phone(fake);
  await q.syncer.request("get");
  assert.equal(q.model.doc().shared_settings.shortcut.name, "Log Allenamento é💪");
});

test("one sync at a time: a second request waits and one more round runs at the end", async () => {
  const fake = createFakeGithub();
  const p = withProfile(phone(fake));
  let open = 0, maxOpen = 0;
  const realFetch = fake.fetch;
  const getFetch = () => async (...args) => { open += 1; maxOpen = Math.max(maxOpen, open); await new Promise((r) => setTimeout(r, 5)); try { return await realFetch(...args); } finally { open -= 1; } };
  const syncer = createSyncer({ store: p.store, getFetch, nowIso: () => new Date().toISOString() });
  const first = syncer.request();
  assert.equal(syncer.isRunning(), true);
  const second = syncer.request();
  const third = syncer.request();
  await Promise.all([first, second, third]);
  assert.equal(maxOpen, 1, "two calls were open at once");
  assert.equal(syncer.isRunning(), false);
  assert.equal(fake.calls.filter((c) => c.method === "PUT").length, 1); // the extra round found nothing new
  const gets = fake.calls.filter((c) => c.method === "GET" && c.url.includes("/contents/")).length;
  assert.ok(gets >= 2, "the extra round ran");
});

test("an edit made while the sync waits for the network is kept, and still counts as not synced", async () => {
  const fake = createFakeGithub();
  const p = withProfile(phone(fake));
  fake.hooks.beforePut = () => { p.model.setWeighin("2026-03-10", 77.7); }; // typed after the merge was saved, before the send
  const res = await p.syncer.request();
  assert.equal(res.result, "ok");
  assert.deepEqual(weighDates(p.model.doc()), ["2026-03-02", "2026-03-10"]); // still on the phone
  assert.deepEqual(weighDates(fake.readDoc()), ["2026-03-02"]); // not sent yet
  assert.equal(p.syncer.hasUnsynced(), true); // so the next sync sends it
  fake.hooks.beforePut = null;
  await p.syncer.request();
  assert.deepEqual(weighDates(fake.readDoc()), ["2026-03-02", "2026-03-10"]);
  assert.equal(p.syncer.hasUnsynced(), false);
});

test("an edit made during the GET wait is merged in too (not overwritten by the merge result)", async () => {
  const fake = createFakeGithub();
  const a = withProfile(phone(fake));
  await a.syncer.request();
  const b = phone(fake);
  fake.hooks.afterGet = () => { b.model.setWeighin("2026-03-11", 76); };
  await b.syncer.request();
  assert.deepEqual(weighDates(b.model.doc()), ["2026-03-02", "2026-03-11"]);
  assert.deepEqual(weighDates(fake.readDoc()), ["2026-03-02", "2026-03-11"]);
});

test("last_sync_at is the time the sync started", async () => {
  const fake = createFakeGithub();
  const p = withProfile(phone(fake));
  const times = [];
  const syncer = createSyncer({ store: p.store, getFetch: () => fake.fetch, nowIso: () => { const t = new Date(Date.parse("2026-04-01T00:00:00.000Z") + times.length * 1000).toISOString(); times.push(t); return t; } });
  await syncer.request();
  assert.equal(p.store.loadDevice().last_sync_at, times[0]);
});

test("never PUT over a file that could not be read (network error on the GET)", async () => {
  const fake = createFakeGithub();
  fake.putDoc({ ...emptyDoc() });
  const p = withProfile(phone(fake));
  fake.fail("get", "network");
  assert.equal((await p.syncer.request()).result, "offline");
  fake.fail("get", 403);
  assert.equal((await p.syncer.request()).result, "no_access");
  assert.equal(fake.calls.filter((c) => c.method === "PUT").length, 0);
});

test("a 404 on the file with a repo that does exist means 'new file'; a missing repo means no access", async () => {
  const fake = createFakeGithub();
  const p = withProfile(phone(fake));
  assert.equal((await p.syncer.request()).result, "ok");
  const fake2 = createFakeGithub();
  const q = withProfile(phone(fake2));
  fake2.fail("repo", 404);
  assert.equal((await q.syncer.request()).result, "no_access");
  assert.equal(fake2.file, null);
});

// ---------- section 12 item 1: the token ----------

test("the token lives only in the device box: not in the data, the safety copy, the GitHub file, any URL or result", async () => {
  const fake = createFakeGithub();
  const a = withProfile(phone(fake));
  const results = [await a.syncer.request(), await a.syncer.test()];
  a.model.setWeighin("2026-03-12", 75);
  fake.fail("put", 409, 3);
  results.push(await a.syncer.request());
  fake.setBlocked(true);
  results.push(await a.syncer.request());
  fake.setBlocked(false);
  fake.fail("get", 401);
  results.push(await a.syncer.request());
  await a.syncer.request();
  assert.equal(JSON.parse(a.storage.getItem(KEYS.device)).token, VALID_TOKEN);
  assert.ok(!a.storage.getItem(KEYS.data).includes(VALID_TOKEN));
  assert.ok(!(a.storage.getItem(KEYS.prev) ?? "").includes(VALID_TOKEN));
  assert.ok(!fake.file.text.includes(VALID_TOKEN));
  for (const c of fake.calls) assert.ok(!c.url.includes(VALID_TOKEN));
  for (const r of results) assert.ok(!JSON.stringify(r).includes(VALID_TOKEN));
  for (const m of Object.values(MESSAGES)) assert.ok(!m.includes(VALID_TOKEN));
});

test("errors carry a short code only, never the key, the URL or the server's words", async () => {
  const gh = createGithub({ fetch: async () => { throw new TypeError(`Failed to fetch https://api.github.com/ with ${VALID_TOKEN}`); }, token: VALID_TOKEN, owner: "o", repo: "r" });
  await assert.rejects(() => gh.getFile(), (e) => e instanceof SyncError && e.code === "offline" && !e.message.includes(VALID_TOKEN) && !e.message.includes("http") && !("cause" in e));
});

test("Forget GitHub key removes the key and the sync state, and keeps the data", async () => {
  const fake = createFakeGithub();
  const p = withProfile(phone(fake));
  await p.syncer.request();
  const before = p.model.doc();
  forgetKey(p.store);
  const dev = p.store.loadDevice();
  assert.equal(dev.token, undefined);
  assert.equal(dev.last_sha, undefined);
  assert.equal(connectionOf(dev), null);
  assert.ok(!p.storage.getItem(KEYS.device).includes(VALID_TOKEN));
  assert.deepEqual(p.model.doc(), before);
  assert.equal((await p.syncer.request()).result, "not_set_up");
});

test("saveConnection: checks the names and the key; the sound setting and the running workout stay", async () => {
  const fake = createFakeGithub();
  const p = phone(fake, { configure: false });
  p.store.saveDevice({ sound_on: false, active: { session_id: "s-1" } });
  assert.equal(saveConnection(p.store, { owner: "rosa-test", repo: "", token: "has space in" }).ok, false);
  assert.equal(saveConnection(p.store, { owner: "rosa-test", repo: "", token: "" }).ok, false); // no key yet
  assert.equal(saveConnection(p.store, { owner: "rosa-test", repo: "", token: VALID_TOKEN, token_expires: "2027-11-16" }).ok, true);
  const dev = p.store.loadDevice();
  assert.equal(dev.repo, "training-data");
  assert.equal(dev.token_expires, "2027-11-16");
  assert.equal(dev.sound_on, false);
  assert.deepEqual(dev.active, { session_id: "s-1" });
  assert.equal(saveConnection(p.store, { owner: "rosa-test", repo: "x", token: "", token_expires: "soon" }).ok, false);
  // saving again without a new key keeps the old key
  assert.equal(saveConnection(p.store, { owner: "rosa-test", repo: "other" }).ok, true);
  assert.equal(p.store.loadDevice().token, VALID_TOKEN);
});

test("the sync and the sync file leave device-only data out (active workout, sound, key)", async () => {
  const fake = createFakeGithub();
  const p = withProfile(phone(fake));
  p.store.saveDevice({ ...p.store.loadDevice(), active: { session_id: "s-1" }, sound_on: false });
  await p.syncer.request();
  const text = fake.file.text;
  assert.ok(!text.includes("active") && !text.includes("sound_on") && !text.includes("last_sha") && !text.includes("owner"));
});

test("a document with a token field sent from outside is cleaned before it is merged", async () => {
  const fake = createFakeGithub();
  fake.putDoc({ ...emptyDoc(), token: "sneaky-value-1", device: { token: "sneaky-value-2" } });
  const p = withProfile(phone(fake));
  await p.syncer.request();
  assert.ok(!JSON.stringify(p.model.doc()).includes("sneaky"));
  assert.ok(!fake.file.text.includes("sneaky"));
});
