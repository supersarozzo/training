// Backup, restore and the Log to Health link (docs/ARCHITECTURE.md sections 9 and 10). All values are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { createStore, KEYS } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { makeBackup, backupFilename } from "../app/js/backup.js";
import { shortcutUrl, shortcutOn, shortcutName } from "../app/js/shortcuts.js";
import { saveConnection } from "../app/js/sync/sync.js";
import { fakeStorage, intake } from "./fixtures/profiles.mjs";

let ms = Date.parse("2026-03-02T09:00:00.000Z");
const clock = () => new Date((ms += 1000));
const KEY = "backup-test-key-0001"; // made up, not a real key

// A phone with a bit of everything, and a GitHub key in the device box.
function fullPhone() {
  const storage = fakeStorage();
  const store = createStore(storage);
  const model = createModel(store, clock);
  model.setProfile(intake());
  model.setTargets({ kcal: 2000, protein_g: 120, goal: "cut", source: "manual", walk_start: { speed_kmh: 4, slope_pct: 2 } });
  model.updateSettings({ body_unit: "st", dumbbell_steps_kg: [2, 4], shortcut: { on: true, name: "Log Allenamento é" } });
  const s = model.startSession({ planDay: "mon", week: 1, kind: "full", slots: [{ slot: "A1", ex: "chest_press" }, { slot: "A2", ex: "seated_row" }] });
  model.logSet(s.id, "A1", { type: "work", weight_kg: 20, reps: 10 });
  model.logSet(s.id, "A1", { type: "work", weight_kg: 20, reps: 9 });
  model.setWalk(s.id, { speed_kmh: 4, slope_pct: 2, minutes: 30, effort: 5, distance_km: null, avg_hr: null });
  model.finishSession(s.id, { effort: 6, note: "Caffè dopo 💪" });
  model.setWeighin("2026-03-02", 80.4);
  model.setWeighin("2026-03-03", 80.1);
  model.deleteWeighin("2026-03-03");
  model.addMeasurement("2026-03-02", { waist_cm: 90, chest_cm: 100, arm_cm: 33, thigh_cm: 58 });
  model.setExerciseState("chest_press", { start_weight_kg: 20, machine_note: "seat 4" });
  assert.deepEqual(saveConnection(store, { owner: "rosa-test", repo: "training-data", token: KEY, token_expires: "2027-11-16" }), { ok: true });
  store.saveDevice({ ...store.loadDevice(), active: { session_id: "s-1" }, sound_on: false });
  return { storage, store, model };
}

test("round trip: backup, empty phone, restore gives the same data", () => {
  const a = fullPhone();
  const original = a.model.doc();
  const { text } = makeBackup(a.store, new Date(2026, 2, 5));

  const storageB = fakeStorage();
  const modelB = createModel(createStore(storageB), clock);
  const result = modelB.restore(JSON.parse(text));
  assert.equal(result.ok, true);
  assert.equal(result.merged, false);
  assert.deepEqual(modelB.doc(), original);
  assert.deepEqual(JSON.parse(storageB.getItem(KEYS.data)), original);
});

test("the backup file never holds the key or other device-only data", () => {
  const a = fullPhone();
  const { text } = makeBackup(a.store);
  assert.ok(!text.includes(KEY));
  for (const word of ["token", "last_sha", "last_sync", "sound_on", "active", "owner", "rosa-test"]) assert.ok(!text.includes(word), word);
  assert.ok(a.storage.getItem(KEYS.device).includes(KEY)); // it is only in the device box
  // and a restore of that file leaves a phone's own key box alone
  const storageB = fakeStorage();
  const storeB = createStore(storageB);
  saveConnection(storeB, { owner: "other", repo: "x", token: "another-test-key-0002" });
  createModel(storeB, clock).restore(JSON.parse(text));
  assert.equal(storeB.loadDevice().token, "another-test-key-0002");
  assert.ok(!storageB.getItem(KEYS.data).includes(KEY));
});

test("backup of a phone with a damaged data box fails and does not invent data", () => {
  const storage = fakeStorage();
  storage.setItem(KEYS.data, "{ broken");
  assert.throws(() => makeBackup(createStore(storage)));
});

test("an empty phone gives a valid, restorable empty backup", () => {
  const { text } = makeBackup(createStore(fakeStorage()));
  const doc = JSON.parse(text);
  assert.equal(doc.app, "training");
  assert.equal(createModel(createStore(fakeStorage()), clock).restore(doc).ok, true);
});

test("restore into a phone with data merges and keeps the phone's newer work", () => {
  const a = fullPhone();
  const { text } = makeBackup(a.store);
  // the phone moves on after the backup
  a.model.setWeighin("2026-03-10", 79.0);
  a.model.updateSettings({ body_unit: "kg" });
  const before = a.model.doc();
  const r = a.model.restore(JSON.parse(text));
  assert.equal(r.ok, true);
  assert.equal(r.merged, true);
  const after = a.model.doc();
  assert.ok(after.weighins.some((w) => w.date === "2026-03-10" && !w.deleted)); // newer work kept
  assert.equal(after.shared_settings.body_unit, "kg"); // the newer setting stays
  assert.equal(after.sessions.length, before.sessions.length);
  assert.deepEqual(a.store.loadPrev(), before); // safety copy of the moment before
});

test("restore from a starter file (profile and settings only) on an empty phone", () => {
  const a = fullPhone();
  const doc = JSON.parse(makeBackup(a.store).text);
  const starter = { format: 1, app: "training", profile: { ...doc.profile, targets: null }, shared_settings: doc.shared_settings };
  const b = createModel(createStore(fakeStorage()), clock);
  const r = b.restore(starter);
  assert.equal(r.ok, true);
  assert.equal(r.doc.profile.targets, null);
  assert.ok(r.doc.block); // a block is added so the app can start
  assert.deepEqual(r.doc.sessions, []);
});

test("file names", () => {
  assert.equal(backupFilename(new Date(2026, 10, 7)), "training-backup-2026-11-07.json");
});

// ---------- the Log to Health link ----------

const on = { shortcut: { on: true, name: "Log Training" } };

test("the button is hidden (no link) until it is turned on", () => {
  assert.equal(shortcutUrl({ shortcut: { on: false, name: "Log Training" } }, "2026-03-02T09:00:00.000Z", 60), null);
  assert.equal(shortcutUrl({}, "2026-03-02T09:00:00.000Z", 60), null);
  assert.equal(shortcutOn({ shortcut: { on: false } }), false);
  assert.equal(shortcutOn(on), true);
});

test("the link carries the Shortcut name, the start time and the minutes only", () => {
  const url = shortcutUrl(on, "2026-03-02T09:00:00.000Z", 62.4);
  assert.equal(url, "shortcuts://run-shortcut?name=Log%20Training&input=text&text=2026-03-02T09%3A00%3A00.000Z%7C62");
  const u = new URL(url);
  assert.equal(u.searchParams.get("text"), "2026-03-02T09:00:00.000Z|62");
  assert.deepEqual([...u.searchParams.keys()], ["name", "input", "text"]);
});

test("a name with odd letters is encoded; an empty or huge name falls back to the default", () => {
  assert.match(shortcutUrl({ shortcut: { on: true, name: "Log é & more?" } }, "2026-03-02T09:00:00.000Z", 60), /name=Log%20%C3%A9%20%26%20more%3F&/);
  assert.equal(shortcutName({ shortcut: { on: true, name: "   " } }), "Log Training");
  assert.equal(shortcutName({ shortcut: { on: true, name: "x".repeat(81) } }), "Log Training");
});

test("bad times give no link", () => {
  assert.equal(shortcutUrl(on, "not a time", 60), null);
  assert.equal(shortcutUrl(on, "2026-03-02T09:00:00.000Z", 0), null);
  assert.equal(shortcutUrl(on, "2026-03-02T09:00:00.000Z", NaN), null);
});

test("the Shortcut setting survives the backup round trip and defaults to off on a new phone", () => {
  const a = fullPhone();
  const b = createModel(createStore(fakeStorage()), clock);
  b.restore(JSON.parse(makeBackup(a.store).text));
  assert.equal(shortcutOn(b.doc().shared_settings), true);
  assert.equal(shortcutName(b.doc().shared_settings), "Log Allenamento é");
  assert.equal(shortcutOn(createModel(createStore(fakeStorage()), clock).doc().shared_settings), false);
});
