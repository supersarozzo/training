// Redesign B: the new "Where it is in my gym" note for each machine or station (Rosario's choice 55 a).
// It is NEW saved data, so it must be added without breaking anything:
//   - old data without the note still loads, validates, merges and syncs;
//   - the note is a record like the others (id, updated_at, tombstone rules), so it merges by record;
//   - it syncs to GitHub and goes into the backup file; the validator checks it (untrusted data).
// All values are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { createSyncer, saveConnection } from "../app/js/sync/sync.js";
import { mergeDocs, hasChangesSince, LISTS } from "../app/js/sync/merge.js";
import { makeBackup } from "../app/js/backup.js";
import { validateDocument, emptyDoc, MAX_TEXT } from "../app/js/validate.js";
import { hasData } from "../app/js/store.js";
import { createFakeGithub, VALID_TOKEN } from "./fake-github.mjs";
import { fakeStorage, intake, validDoc } from "./fixtures/profiles.mjs";

function phone(fake = createFakeGithub(), start = "2026-03-02T09:00:00.000Z") {
  const store = createStore(fakeStorage());
  let ms = Date.parse(start);
  const model = createModel(store, () => new Date((ms += 1000)));
  const syncer = createSyncer({ store, getFetch: () => fake.fetch, nowIso: () => new Date((ms += 1000)).toISOString() });
  assert.deepEqual(saveConnection(store, { owner: fake.owner, repo: fake.repo, token: VALID_TOKEN }), { ok: true });
  model.setProfile(intake());
  return { fake, store, model, syncer };
}

const spot = (machine, where, updated_at = "2026-03-01T10:00:00.000Z", extra = {}) => ({ id: `g-${machine}`, updated_at, machine, where, ...extra });

test("a new empty document has an empty gym_spots list, and merge knows the list", () => {
  assert.deepEqual(emptyDoc().gym_spots, []);
  assert.ok(LISTS.includes("gym_spots"));
});

test("old data without gym_spots still validates and comes back unchanged (no list is added by the check)", () => {
  const old = validDoc();
  assert.equal("gym_spots" in old, false);
  const r = validateDocument(old);
  assert.equal(r.ok, true, r.error);
  assert.deepEqual(r.doc, old);
});

test("old data stored on the phone without gym_spots: setGymSpot works and keeps everything else", () => {
  const storage = fakeStorage();
  storage.setItem("trn.data.v1", JSON.stringify(validDoc())); // a phone with data from the app before the redesign
  const store = createStore(storage);
  const model = createModel(store, () => new Date("2026-03-02T09:00:00.000Z"));
  model.setGymSpot("leg_press_machine", "Back left, next to the mirrors");
  const doc = model.doc();
  assert.equal(doc.weighins.length, 1);
  assert.equal(doc.gym_spots.length, 1);
  assert.deepEqual(doc.gym_spots[0], { id: "g-leg_press_machine", updated_at: "2026-03-02T09:00:00.000Z", machine: "leg_press_machine", where: "Back left, next to the mirrors" });
});

test("setGymSpot replaces the note of the same machine (one note per machine) and stamps a newer time", () => {
  const p = phone();
  p.model.setGymSpot("treadmill", "By the window");
  const first = p.model.doc().gym_spots[0].updated_at;
  p.model.setGymSpot("treadmill", "  Row 2, third from the left  ");
  const list = p.model.doc().gym_spots;
  assert.equal(list.length, 1);
  assert.equal(list[0].where, "Row 2, third from the left"); // trimmed
  assert.ok(Date.parse(list[0].updated_at) > Date.parse(first));
});

test("an empty note is saved as an empty text (the machine shows 'not filled in yet' again), not dropped", () => {
  const p = phone();
  p.model.setGymSpot("treadmill", "By the window");
  p.model.setGymSpot("treadmill", "   ");
  const list = p.model.doc().gym_spots;
  assert.equal(list.length, 1);
  assert.equal(list[0].where, "");
});

test("a very long note is cut to the shared text limit, so the phone's data always passes its own check", () => {
  const p = phone();
  p.model.setGymSpot("cable_station", "x".repeat(MAX_TEXT + 500));
  const doc = p.model.doc();
  assert.equal(doc.gym_spots[0].where.length, MAX_TEXT);
  assert.equal(validateDocument(JSON.parse(JSON.stringify(doc))).ok, true);
});

test("a machine id that is not plain letters, digits and _ is refused (it becomes part of a record id)", () => {
  const p = phone();
  assert.throws(() => p.model.setGymSpot("../evil", "x"));
  assert.throws(() => p.model.setGymSpot("", "x"));
  assert.equal(p.model.doc().gym_spots?.length ?? 0, 0);
});

test("the validator checks gym spots like other untrusted records", () => {
  const ok = { ...validDoc(), gym_spots: [spot("treadmill", "By the window")] };
  assert.equal(validateDocument(ok).ok, true);
  const bad = [
    { ...validDoc(), gym_spots: "not a list" },
    { ...validDoc(), gym_spots: [spot("treadmill", 42)] },
    { ...validDoc(), gym_spots: [spot("treadmill", "y".repeat(MAX_TEXT + 1))] },
    { ...validDoc(), gym_spots: [{ id: "g-treadmill", machine: "treadmill", where: "x" }] }, // no updated_at
    { ...validDoc(), gym_spots: [spot("treadmill", "x", "2026-03-01T10:00:00.000Z", { machine: 7 })] },
  ];
  for (const doc of bad) assert.equal(validateDocument(doc).ok, false, JSON.stringify(doc.gym_spots));
  // A tombstone needs nothing but id and time; unknown fields are kept.
  const tomb = validateDocument({ ...validDoc(), gym_spots: [{ id: "g-x", updated_at: "2026-03-01T10:00:00.000Z", deleted: true }, spot("treadmill", "x", "2026-03-01T10:00:00.000Z", { later: 1 })] });
  assert.equal(tomb.ok, true, tomb.error);
  assert.equal(tomb.doc.gym_spots[1].later, 1);
});

test("merge joins gym spots by record: one side only is kept, the later edit wins, merging is repeatable and symmetric", () => {
  const a = { ...validDoc(), gym_spots: [spot("treadmill", "old place", "2026-03-01T10:00:00.000Z"), spot("smith_machine", "only on A")] };
  const b = { ...validDoc(), gym_spots: [spot("treadmill", "new place", "2026-03-03T10:00:00.000Z"), spot("leg_press_machine", "only on B")] };
  const m = mergeDocs(a, b);
  const where = Object.fromEntries(m.gym_spots.map((r) => [r.machine, r.where]));
  assert.deepEqual(where, { treadmill: "new place", smith_machine: "only on A", leg_press_machine: "only on B" });
  assert.deepEqual(mergeDocs(b, a), m);
  assert.deepEqual(mergeDocs(m, b), m);
});

test("merge with an old document that has no gym_spots keeps the notes", () => {
  const withNotes = { ...validDoc(), gym_spots: [spot("treadmill", "By the window")] };
  const old = validDoc();
  assert.equal(mergeDocs(old, withNotes).gym_spots.length, 1);
  assert.equal(mergeDocs(withNotes, old).gym_spots.length, 1);
  assert.deepEqual(mergeDocs(old, old).gym_spots, []);
});

test("a gym spot counts as a change for sync and as data on the phone", () => {
  const doc = { ...emptyDoc(), gym_spots: [spot("treadmill", "x", "2026-03-05T10:00:00.000Z")] };
  assert.equal(hasChangesSince(doc, "2026-03-04T10:00:00.000Z"), true);
  assert.equal(hasChangesSince(doc, "2026-03-06T10:00:00.000Z"), false);
  assert.equal(hasData(doc), true);
});

test("a gym spot syncs to GitHub and arrives on a second phone", async () => {
  const fake = createFakeGithub();
  const one = phone(fake);
  one.model.setGymSpot("cable_station", "Middle of the room, under the TV");
  const sent = await one.syncer.request("full");
  assert.equal(sent.result, "ok", sent.message);
  assert.equal(fake.readDoc().gym_spots[0].where, "Middle of the room, under the TV");

  const two = phone(fake, "2026-03-04T09:00:00.000Z");
  const got = await two.syncer.request("get");
  assert.equal(got.result, "ok", got.message);
  assert.equal(two.model.doc().gym_spots.find((r) => r.machine === "cable_station").where, "Middle of the room, under the TV");
});

test("a gym spot is in the backup file, and the backup restores on an empty phone", () => {
  const p = phone();
  p.model.setGymSpot("treadmill", "By the window");
  const b = makeBackup(p.store);
  assert.equal(JSON.parse(b.text).gym_spots[0].where, "By the window");
  const fresh = createModel(createStore(fakeStorage()), () => new Date("2026-03-09T09:00:00.000Z"));
  const r = fresh.restore(JSON.parse(b.text));
  assert.equal(r.ok, true, r.error);
  assert.equal(fresh.doc().gym_spots[0].where, "By the window");
});

test("the main app (before the redesign) keeps gym spots it does not know: an unknown record list survives its merge", () => {
  // The live app's merge keeps unknown record lists ("a list from a newer app"); this copy must keep that rule too.
  const a = { ...validDoc(), future_list: [{ id: "f-1", updated_at: "2026-03-01T10:00:00.000Z" }] };
  assert.equal(mergeDocs(a, validDoc()).future_list.length, 1);
});
