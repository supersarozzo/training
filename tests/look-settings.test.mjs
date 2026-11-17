// Look (Auto / Light / Dark) and Animations (on / off) are device-only settings (JUDGING.md 3.5).
// They live in the device box (trn.device.v1: keys `theme` and `motion_off`), never in the synced document and never
// in a backup file. Saving one keeps the rest of the device box (the GitHub key above all). All values are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { makeBackup } from "../app/js/backup.js";
import { saveConnection } from "../app/js/sync/sync.js";
import { readPrefs, savePrefs, THEMES } from "../app/js/prefs.js";
import { fakeStorage, intake } from "./fixtures/profiles.mjs";

function phone() {
  const storage = fakeStorage();
  const store = createStore(storage);
  const model = createModel(store, () => new Date("2026-03-02T09:00:00.000Z"));
  model.setProfile(intake());
  return { storage, store, model };
}

test("defaults: Look follows the phone (auto), animations on", () => {
  const p = phone();
  assert.deepEqual(readPrefs(p.store), { theme: "auto", motionOff: false });
  assert.deepEqual(THEMES, ["auto", "light", "dark"]);
});

test("saved in the device box only, never in the synced document", () => {
  const p = phone();
  const docBefore = JSON.stringify(p.store.load());
  savePrefs(p.store, { theme: "dark", motionOff: true });
  assert.deepEqual(readPrefs(p.store), { theme: "dark", motionOff: true });
  const dev = p.store.loadDevice();
  assert.equal(dev.theme, "dark");
  assert.equal(dev.motion_off, true);
  assert.equal(JSON.stringify(p.store.load()), docBefore, "the data document did not change");
  for (const k of ["theme", "motion_off", "motionOff"]) assert.equal(k in p.store.load(), false, k);
});

test("never in a backup file", () => {
  const p = phone();
  savePrefs(p.store, { theme: "light", motionOff: true });
  const text = makeBackup(p.store).text;
  assert.ok(!text.includes("motion_off"));
  assert.ok(!text.includes('"theme"'));
});

test("saving a setting keeps the GitHub key and the other device fields", () => {
  const p = phone();
  assert.deepEqual(saveConnection(p.store, { owner: "rosa-test", repo: "training-data", token: "look-test-key-0001" }), { ok: true });
  savePrefs(p.store, { theme: "light" });
  savePrefs(p.store, { motionOff: true });
  const dev = p.store.loadDevice();
  assert.equal(dev.token, "look-test-key-0001");
  assert.equal(dev.owner, "rosa-test");
  assert.deepEqual(readPrefs(p.store), { theme: "light", motionOff: true });
  savePrefs(p.store, { motionOff: false });
  assert.deepEqual(readPrefs(p.store), { theme: "light", motionOff: false });
});

test("unknown or broken values read as the defaults", () => {
  const p = phone();
  p.store.saveDevice({ ...p.store.loadDevice(), theme: "<b>neon</b>", motion_off: "yes" });
  assert.deepEqual(readPrefs(p.store), { theme: "auto", motionOff: false });
  savePrefs(p.store, { theme: "purple" });
  assert.equal(readPrefs(p.store).theme, "auto");
  const broken = { loadDevice() { throw new Error("blocked"); } };
  assert.deepEqual(readPrefs(broken), { theme: "auto", motionOff: false });
});
