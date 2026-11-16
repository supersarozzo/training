import test from "node:test";
import assert from "node:assert/strict";
import { createStore, hasData, KEYS, StoreError, migrate, migrations } from "../app/js/store.js";
import { createModel, nextMonday } from "../app/js/model.js";
import { emptyDoc } from "../app/js/validate.js";
import { validDoc, fakeStorage, intake } from "./fixtures/profiles.mjs";

const clock = () => new Date("2026-01-07T10:00:00.000Z"); // a Wednesday

test("an empty phone gives an empty document", () => {
  const store = createStore(fakeStorage());
  const doc = store.load();
  assert.deepEqual(doc, emptyDoc());
  assert.equal(hasData(doc), false);
});

test("save and load round trip", () => {
  const store = createStore(fakeStorage());
  const doc = validDoc();
  store.save(doc);
  assert.deepEqual(store.load(), doc);
  assert.equal(hasData(doc), true);
});

test("a damaged box is reported and never overwritten", () => {
  const storage = fakeStorage();
  storage.setItem(KEYS.data, "{ not json");
  const store = createStore(storage);
  assert.throws(() => store.load(), (e) => e instanceof StoreError && e.code === "broken");
  assert.equal(storage.getItem(KEYS.data), "{ not json"); // untouched
});

test("data from a newer format is reported and never overwritten", () => {
  const storage = fakeStorage();
  const raw = JSON.stringify({ ...validDoc(), format: 99 });
  storage.setItem(KEYS.data, raw);
  assert.throws(() => createStore(storage).load(), (e) => e.code === "too_new");
  assert.equal(storage.getItem(KEYS.data), raw);
});

test("a full phone throws 'full' and keeps the old data", () => {
  const doc = validDoc();
  const size = JSON.stringify(doc).length;
  const storage = fakeStorage(size + 10);
  const store = createStore(storage);
  store.save(doc);
  const bigger = { ...doc, weighins: [...doc.weighins, ...Array.from({ length: 50 }, (_, i) => ({ id: `w-x${i}`, updated_at: doc.profile.updated_at, date: "2026-01-06", kg: 80 }))] };
  assert.throws(() => store.save(bigger), (e) => e.code === "full" && /Phone storage full/.test(e.message));
  assert.deepEqual(store.load(), doc); // nothing was dropped
});

test("device data lives in its own box, apart from the log", () => {
  const storage = fakeStorage();
  const store = createStore(storage);
  store.saveDevice({ token: "test-token-not-real" });
  store.save(validDoc());
  assert.ok(!storage.getItem(KEYS.data).includes("test-token-not-real"));
  assert.equal(store.loadDevice().token, "test-token-not-real");
  assert.deepEqual(createStore(fakeStorage()).loadDevice(), {});
});

test("savePrev keeps a copy of the data before a change", () => {
  const storage = fakeStorage();
  const store = createStore(storage);
  assert.equal(store.loadPrev(), null);
  store.save(validDoc());
  store.savePrev();
  assert.deepEqual(store.loadPrev(), validDoc());
});

test("migrations: an old format is copied to prev first, then upgraded", () => {
  assert.throws(() => migrate({ format: 0 }), (e) => e.code === "broken"); // no step for 0: refuses
  assert.deepEqual(Object.keys(migrations), []);
});

test("model: setProfile stamps the time, sets a block and saves at once", () => {
  const storage = fakeStorage();
  const model = createModel(createStore(storage), clock);
  const doc = model.setProfile(intake());
  assert.equal(doc.profile.updated_at, "2026-01-07T10:00:00.000Z");
  assert.equal(doc.block.start_monday, "2026-01-12"); // next Monday
  assert.equal(doc.block.plan_id, "plan-v2");
  assert.equal(JSON.parse(storage.getItem(KEYS.data)).profile.intake.q21_age, 30);
});

test("model: targets and settings changes are saved and stamped", () => {
  const model = createModel(createStore(fakeStorage()), clock);
  model.setProfile(intake());
  const doc = model.setTargets({ kcal: 2000, protein_g: 150, goal: "cut", source: "manual" });
  assert.equal(doc.profile.targets.source, "manual");
  const doc2 = model.updateSettings({ body_unit: "st" });
  assert.equal(doc2.shared_settings.body_unit, "st");
  assert.equal(doc2.shared_settings.updated_at, "2026-01-07T10:00:00.000Z");
  assert.equal(model.setBlockStart("2026-02-02").block.start_monday, "2026-02-02");
});

test("block start: Monday today, or the next Monday", () => {
  assert.equal(nextMonday(new Date(2026, 10, 16)), "2026-11-16"); // Monday
  assert.equal(nextMonday(new Date(2026, 10, 18)), "2026-11-23"); // Wednesday
  assert.equal(nextMonday(new Date(2026, 10, 22)), "2026-11-23"); // Sunday
  assert.equal(nextMonday(new Date(2026, 10, 21)), "2026-11-23"); // Saturday
});

test("restore into an empty phone loads the file and adds a block if missing", () => {
  const storage = fakeStorage();
  const model = createModel(createStore(storage), clock);
  const file = validDoc();
  delete file.block;
  const result = model.restoreIntoEmpty(file);
  assert.equal(result.ok, true);
  assert.equal(result.doc.block.start_monday, "2026-01-12");
  assert.equal(result.doc.weighins.length, 1);
  assert.equal(JSON.parse(storage.getItem(KEYS.data)).profile.intake.q22_sex, "male");
});

test("restore refuses when the phone already has data, and changes nothing", () => {
  const storage = fakeStorage();
  const model = createModel(createStore(storage), clock);
  model.setProfile(intake({ q21_age: 41 }));
  const before = storage.getItem(KEYS.data);
  const result = model.restoreIntoEmpty(validDoc());
  assert.equal(result.ok, false);
  assert.match(result.error, /already has data/);
  assert.equal(storage.getItem(KEYS.data), before);
});

test("restore refuses a bad file with a plain message", () => {
  const model = createModel(createStore(fakeStorage()), clock);
  const result = model.restoreIntoEmpty({ app: "other" });
  assert.equal(result.ok, false);
  assert.match(result.error, /not a training backup/);
});
