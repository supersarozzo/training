// Review finding F1 (docs/REVIEW-2026-11-16.md): the app must never save text that its own check refuses later.
// A note over the limit used to be saved and sent; the next sync then called the GitHub file "damaged" and the
// backup file could not be restored. All values are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { createSyncer, saveConnection } from "../app/js/sync/sync.js";
import { makeBackup } from "../app/js/backup.js";
import { validateDocument, MAX_TEXT } from "../app/js/validate.js";
import { createFakeGithub, VALID_TOKEN } from "./fake-github.mjs";
import { fakeStorage, intake } from "./fixtures/profiles.mjs";

const LONG = "Long note. ".repeat(400); // about 4400 letters, well over the limit

function phone(fake = createFakeGithub()) {
  const store = createStore(fakeStorage());
  let ms = Date.parse("2026-03-02T09:00:00.000Z");
  const model = createModel(store, () => new Date((ms += 1000)));
  const syncer = createSyncer({ store, getFetch: () => fake.fetch, nowIso: () => new Date((ms += 1000)).toISOString() });
  assert.deepEqual(saveConnection(store, { owner: fake.owner, repo: fake.repo, token: VALID_TOKEN }), { ok: true });
  model.setProfile(intake());
  return { fake, store, model, syncer };
}

function workoutWithLongNotes(p) {
  const s = p.model.startSession({ planDay: "mon", week: 2, kind: "full", slots: [{ slot: "A1", ex: "chest_press" }] });
  p.model.logSet(s.id, "A1", { type: "work", weight_kg: 20, reps: 10 });
  for (let i = 0; i < 3; i++) p.model.swapExercise(s.id, "A1", "chest_press", "hurts", LONG); // swap notes are added up
  p.model.setExerciseState("chest_press", { machine_note: LONG });
  p.model.finishSession(s.id, { effort: 6, note: LONG });
  return s;
}

test("the limit is shared with the check", () => {
  assert.equal(typeof MAX_TEXT, "number");
  assert.ok(MAX_TEXT >= 1000);
});

test("long notes are cut to the limit when saved, so the phone's data always passes its own check", () => {
  const p = phone();
  const s = workoutWithLongNotes(p);
  const doc = p.model.doc();
  const rec = doc.sessions.find((x) => x.id === s.id);
  assert.ok(rec.note.length <= MAX_TEXT && rec.note.length > 0);
  assert.ok(rec.exercises[0].note.length <= MAX_TEXT && rec.exercises[0].note.length > 0);
  assert.ok(doc.exercise_state[0].machine_note.length <= MAX_TEXT);
  const checked = validateDocument(JSON.parse(JSON.stringify(doc)));
  assert.equal(checked.ok, true, checked.error);
});

test("a cut never splits an emoji in half (the text survives the GitHub round trip unchanged)", () => {
  const p = phone();
  const s = p.model.startSession({ planDay: "mon", week: 2, kind: "full", slots: [{ slot: "A1", ex: "chest_press" }] });
  const note = `${"a".repeat(MAX_TEXT - 1)}💪💪`; // the cut falls inside the first emoji
  p.model.finishSession(s.id, { note });
  const saved = p.model.doc().sessions[0].note;
  assert.ok(saved.length <= MAX_TEXT);
  assert.equal(saved, new TextDecoder().decode(new TextEncoder().encode(saved)));
});

test("after long notes, sync keeps working and the backup can be restored on a new phone", async () => {
  const p = phone();
  workoutWithLongNotes(p);
  assert.equal((await p.syncer.request()).result, "ok");
  p.model.setWeighin("2026-03-03", 80);
  assert.equal((await p.syncer.request()).result, "ok"); // the second GET reads back the file the first sync wrote
  const fresh = createModel(createStore(fakeStorage()));
  const restored = fresh.restore(JSON.parse(makeBackup(p.store).text));
  assert.equal(restored.ok, true, restored.error);
});

test("sync never writes a file that the app itself could not read back", async () => {
  const p = phone();
  p.model.setWeighin("2026-03-02", 80);
  assert.equal((await p.syncer.request()).result, "ok");
  const before = p.fake.file.text;
  // Data that slipped past the screens (for example from an older app version): over the limit.
  const doc = p.store.load();
  doc.profile = { ...doc.profile, updated_at: "2026-03-03T09:00:00.000Z", intake: { ...doc.profile.intake, q33_diet: "x".repeat(MAX_TEXT + 1) } };
  p.store.save(doc);
  const res = await p.syncer.request();
  assert.notEqual(res.result, "ok");
  assert.equal(p.fake.file.text, before); // GitHub's copy is untouched and still readable
  assert.equal(validateDocument(JSON.parse(p.fake.file.text)).ok, true);
});
