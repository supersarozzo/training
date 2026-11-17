// Low findings of the step 11 review (docs/REVIEW-2026-11-16.md, F3 to F5). All values are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { createSyncer, saveConnection, statusText } from "../app/js/sync/sync.js";
import { mergeDocs, canonical } from "../app/js/sync/merge.js";
import { validateDocument, emptyDoc } from "../app/js/validate.js";
import { LEFT_CHOICES } from "../app/js/engine/week1.js";
import { createFakeGithub, VALID_TOKEN } from "./fake-github.mjs";
import { fakeStorage, intake, validDoc } from "./fixtures/profiles.mjs";

function phone(fake) {
  const store = createStore(fakeStorage());
  let ms = Date.parse("2026-03-02T09:00:00.000Z");
  const model = createModel(store, () => new Date((ms += 1000)));
  const syncer = createSyncer({ store, getFetch: () => fake.fetch, nowIso: () => new Date((ms += 1000)).toISOString() });
  return { store, model, syncer };
}

// ---------- F3: the status line after a new key or a new repo ----------

test("F3: after a wrong key, saving a new key clears the old 'key wrong' status", async () => {
  const fake = createFakeGithub();
  const p = phone(fake);
  p.model.setProfile(intake());
  saveConnection(p.store, { owner: fake.owner, repo: fake.repo, token: "wrong-key-made-up-1" });
  assert.equal((await p.syncer.request()).result, "auth");
  assert.equal(saveConnection(p.store, { owner: fake.owner, repo: fake.repo, token: VALID_TOKEN }).ok, true);
  assert.equal((await p.syncer.test()).result, "ok");
  assert.doesNotMatch(statusText(p.store.loadDevice()), /expired or wrong/);
});

test("F3: a new repo does not show the old repo's 'Synced' time; the same repo keeps it", async () => {
  const fake = createFakeGithub();
  const p = phone(fake);
  p.model.setProfile(intake());
  saveConnection(p.store, { owner: fake.owner, repo: fake.repo, token: VALID_TOKEN });
  assert.equal((await p.syncer.request()).result, "ok");
  const syncedAt = p.store.loadDevice().last_sync_at;
  assert.ok(syncedAt);
  saveConnection(p.store, { owner: fake.owner, repo: fake.repo, token: "" , token_expires: "2027-11-16" }); // same repo, only the end date
  assert.equal(p.store.loadDevice().last_sync_at, syncedAt);
  saveConnection(p.store, { owner: fake.owner, repo: "another-repo" });
  assert.equal(p.store.loadDevice().last_sync_at, undefined);
  assert.match(statusText(p.store.loadDevice()), /Not synced yet/);
});

// ---------- F4: data the check lets through must not crash a screen ----------

test("F4: a set's 'how many more' answer must be a known one (the week 1 screen throws on others)", () => {
  const withLeft = (left) => {
    const d = validDoc();
    d.sessions = [{ id: "s-20260105-aaaaaa", updated_at: "2026-01-05T09:00:00.000Z", date: "2026-01-05", plan_day: "mon", week: 1, kind: "full", status: "in_progress",
      exercises: [{ slot: "A1", plan_exercise: "chest_press", done_exercise: "chest_press", note: "", sets: [{ n: 1, type: "work", weight_kg: 20, reps: 10, seconds: null, rir: null, left }] }] }];
    return validateDocument(JSON.parse(JSON.stringify(d))); // as read from a file: an undefined answer is simply missing
  };
  for (const ok of LEFT_CHOICES) assert.equal(withLeft(ok).ok, true, ok);
  assert.equal(withLeft(undefined).ok, true);
  assert.equal(withLeft("banana").ok, false);
  assert.equal(withLeft(3).ok, false);
});

test("F4: a profile without a block gets one (Restore from GitHub uses this; Today needs the block)", () => {
  const p = phone(createFakeGithub());
  p.store.save({ ...emptyDoc(), profile: validDoc().profile, block: null });
  p.model.ensureBlock();
  const doc = p.model.doc();
  assert.equal(doc.block.plan_id, "plan-v2");
  assert.match(doc.block.start_monday, /^\d{4}-\d{2}-\d{2}$/);
  const again = canonical(doc);
  p.model.ensureBlock(); // a second call changes nothing
  assert.equal(canonical(p.model.doc()), again);
  const empty = phone(createFakeGithub());
  empty.model.ensureBlock(); // no profile: no block
  assert.equal(empty.model.doc().block, null);
});

// ---------- F5: unknown fields of a newer app version ----------

const base = () => ({ format: 1, app: "training", sessions: [], weighins: [], measurements: [], exercise_state: [] });

test("F5: an unknown field that is a list on one phone and something else on the other does not stop the merge", () => {
  const a = { ...base(), extra: [{ id: "e1" }] };
  for (const other of [{ x: 1 }, 5, null, "text"]) {
    const b = { ...base(), extra: other };
    assert.doesNotThrow(() => mergeDocs(a, b));
    assert.equal(canonical(mergeDocs(a, b)), canonical(mergeDocs(b, a)));
  }
});

test("F5: an unknown list of records on both phones is still merged by id", () => {
  const a = { ...base(), extra: [{ id: "e1", updated_at: "2026-01-01T00:00:00.000Z" }] };
  const b = { ...base(), extra: [{ id: "e2", updated_at: "2026-01-01T00:00:00.000Z" }] };
  assert.deepEqual(mergeDocs(a, b).extra.map((r) => r.id), ["e1", "e2"]);
});

test("F5: an unknown settings object edited later wins, whatever its text", () => {
  // The older copy's text sorts first, so a pick by text alone would bring the old settings back.
  const older = { ...base(), new_settings: { updated_at: "2026-01-01T00:00:00.000Z", a: "old" } };
  const newer = { ...base(), new_settings: { updated_at: "2026-02-01T00:00:00.000Z", z: "new" } };
  assert.equal(mergeDocs(older, newer).new_settings.z, "new");
  assert.equal(mergeDocs(newer, older).new_settings.z, "new");
});
