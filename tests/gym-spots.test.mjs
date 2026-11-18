// "Where it is in my gym": one note per machine (JUDGING.md section 3.3, the one model for the merge).
// New saved data, added without breaking old data: a list `gym_spots` of records
//   { id: "g-<machine id>", updated_at, machine: "<machine id>", where: "<text>" }
// plus `deleted` / `deleted_at` on a tombstone; unknown fields are kept.
// It must load from old data, pass the check, merge, sync and back up like every other record.
// Built from builder D's and B's tests. All values are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { createStore, hasData } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { emptyDoc, validateDocument, MAX_TEXT } from "../app/js/validate.js";
import { mergeDocs, hasChangesSince, LISTS } from "../app/js/sync/merge.js";
import { gymSpotId } from "../app/js/ids.js";
import { MACHINE_IDS } from "../app/js/plan/machine-ids.js";
import { makeBackup } from "../app/js/backup.js";
import { createSyncer, saveConnection } from "../app/js/sync/sync.js";
import { createFakeGithub, VALID_TOKEN } from "./fake-github.mjs";
import { mergeDocs as mergeDocsOld } from "./fixtures/merge-0.3.1.mjs";
import { validDoc, fakeStorage, intake } from "./fixtures/profiles.mjs";

function setup(start = "2026-03-02T09:00:00.000Z") {
  const storage = fakeStorage();
  const store = createStore(storage);
  let ms = Date.parse(start);
  const clock = () => new Date((ms += 1000));
  return { storage, store, model: createModel(store, clock), tick: (s = 60) => { ms += s * 1000; } };
}
const T = "2026-03-02T09:00:00.000Z";
const spot = (machine, where, t = T) => ({ id: `g-${machine}`, updated_at: t, machine, where });

// 1
test("an empty document has an empty gym_spots list, and merge knows the list", () => {
  assert.deepEqual(emptyDoc().gym_spots, []);
  assert.ok(LISTS.includes("gym_spots"));
  assert.equal(gymSpotId("cable_station"), "g-cable_station");
});

// 2
test("an old document without gym_spots validates and comes back exactly unchanged", () => {
  const old = validDoc();
  assert.equal("gym_spots" in old, false);
  const r = validateDocument(old);
  assert.equal(r.ok, true, r.error);
  assert.deepEqual(r.doc, old);
  assert.equal("gym_spots" in r.doc, false);
});

// 3
test("a phone saved by the old app (no list): the first note adds the list and keeps everything else", () => {
  const p = setup();
  const old = validDoc();
  p.store.save(old);
  assert.deepEqual(p.store.load(), old); // loading never rewrites old data
  p.model.setGymSpot("leg_press", "Next to the stairs");
  const doc = p.store.load();
  assert.equal(doc.gym_spots.length, 1);
  for (const k of Object.keys(old)) assert.deepEqual(doc[k], old[k], k);
});

// 4
test("saving twice for one machine keeps one record with a newer updated_at (text trimmed)", () => {
  const p = setup();
  p.model.setGymSpot("cable_station", "Back left, by the mirrors");
  const first = p.store.load().gym_spots[0];
  assert.deepEqual([first.id, first.machine, first.where], ["g-cable_station", "cable_station", "Back left, by the mirrors"]);
  p.tick();
  p.model.setGymSpot("cable_station", "  Moved: front right  ");
  const doc = p.store.load();
  assert.equal(doc.gym_spots.length, 1);
  assert.equal(doc.gym_spots[0].where, "Moved: front right");
  assert.ok(Date.parse(doc.gym_spots[0].updated_at) > Date.parse(first.updated_at));
});

// 5
test("an empty note is saved as an empty text (record kept, so the clear syncs)", () => {
  const p = setup();
  p.model.setGymSpot("treadmill", "Front row");
  p.model.setGymSpot("treadmill", "   ");
  const recs = p.store.load().gym_spots;
  assert.equal(recs.length, 1);
  assert.equal(recs[0].where, "");
  p.model.setGymSpot("leg_curl", null);
  assert.equal(p.store.load().gym_spots.find((x) => x.machine === "leg_curl").where, "");
});

// 6
test("a 2001+ letter note is cut to MAX_TEXT and the document still passes the check", () => {
  const p = setup();
  p.model.setGymSpot("treadmill", "x".repeat(MAX_TEXT + 50));
  const doc = p.store.load();
  assert.equal(doc.gym_spots[0].where.length, MAX_TEXT);
  const r = validateDocument(doc);
  assert.equal(r.ok, true, r.error);
});

// 7
test("bad machine ids are refused and nothing is saved", () => {
  const p = setup();
  p.store.save(validDoc());
  const before = JSON.stringify(p.store.load());
  for (const id of ["", "Leg Press!", "a".repeat(70), "rowing_machine", "g-leg_press", null, 7, "__proto__", "constructor"]) {
    assert.throws(() => p.model.setGymSpot(id, "x"), /machine/i, String(id));
  }
  assert.equal(JSON.stringify(p.store.load()), before);
});

// 8
test("the check accepts good notes, tombstones and unknown fields; refuses bad ones with plain messages", () => {
  const good = { ...validDoc(), gym_spots: [
    spot("leg_press", "By the stairs"),
    { id: "g-treadmill", updated_at: T, deleted: true, deleted_at: T },
    { ...spot("smith_machine", ""), photo_hint: "from a newer app" },
    { id: "g-leg_curl", updated_at: T, machine: "leg_curl" }, // no where: optional
  ] };
  const r = validateDocument(good);
  assert.equal(r.ok, true, r.error);
  assert.equal(r.doc.gym_spots.length, 4);
  assert.equal(r.doc.gym_spots[2].photo_hint, "from a newer app");
  const bad = [
    "not a record",
    { id: "g-x", machine: "x", where: "a" }, // no time
    { ...spot("x", "a"), where: 42 },
    { ...spot("x", "a"), where: "y".repeat(MAX_TEXT + 1) },
    { ...spot("x", "a"), machine: "m".repeat(61) },
    { ...spot("x", "a"), machine: "" },
    { id: "g-x", updated_at: T, where: "no machine" },
    { ...spot("x", "a"), machine: 7 },
  ];
  for (const rec of bad) {
    const v = validateDocument({ ...validDoc(), gym_spots: [rec] });
    assert.equal(v.ok, false, JSON.stringify(rec).slice(0, 60));
    assert.match(v.error, /gym spot/i);
  }
  assert.equal(validateDocument({ ...validDoc(), gym_spots: { a: 1 } }).ok, false);
});

// 9
test("a note holding HTML is kept as plain text (screens show it with textContent only)", () => {
  const evil = "<img src=x onerror=alert(1)><b>bold</b>";
  const r = validateDocument({ ...validDoc(), gym_spots: [spot("leg_press", evil)] });
  assert.equal(r.ok, true);
  assert.equal(r.doc.gym_spots[0].where, evil);
  const p = setup();
  p.model.setGymSpot("leg_press", evil);
  assert.equal(p.store.load().gym_spots[0].where, evil);
});

// 10
test("merge: one-side records kept, later edit wins, symmetric, idempotent, one side with no list", () => {
  const a = { ...emptyDoc(), gym_spots: [spot("leg_press", "old"), spot("smith_machine", "only on a")] };
  const b = { ...emptyDoc(), gym_spots: [spot("leg_press", "new", "2026-03-03T09:00:00.000Z"), spot("treadmill", "only on b", "2026-03-01T09:00:00.000Z")] };
  const ab = mergeDocs(a, b);
  assert.deepEqual(ab, mergeDocs(b, a));
  assert.deepEqual(ab.gym_spots.map((x) => [x.id, x.where]), [["g-leg_press", "new"], ["g-smith_machine", "only on a"], ["g-treadmill", "only on b"]]);
  assert.deepEqual(mergeDocs(ab, ab), ab);
  const old = validDoc();
  const m = mergeDocs(old, { ...emptyDoc(), gym_spots: [spot("leg_press", "By the stairs")] });
  assert.equal(m.gym_spots.length, 1);
  assert.deepEqual(mergeDocs(old, emptyDoc()).gym_spots, []);
});

// 11
test("merge: an older copy never brings back a tombstone", () => {
  const dead = { id: "g-leg_press", updated_at: "2026-03-05T09:00:00.000Z", deleted: true, deleted_at: "2026-03-05T09:00:00.000Z" };
  const older = spot("leg_press", "x", "2026-03-04T09:00:00.000Z");
  for (const m of [mergeDocs({ ...emptyDoc(), gym_spots: [dead] }, { ...emptyDoc(), gym_spots: [older] }), mergeDocs({ ...emptyDoc(), gym_spots: [older] }, { ...emptyDoc(), gym_spots: [dead] })]) {
    assert.equal(m.gym_spots.length, 1);
    assert.equal(m.gym_spots[0].deleted, true);
  }
});

// 12
test("re-saving a tombstoned machine clears deleted; unknown fields survive the edit", () => {
  const p = setup();
  const doc = validDoc();
  doc.gym_spots = [
    { id: "g-leg_press", updated_at: T, machine: "leg_press", where: "", deleted: true, deleted_at: T, photo_hint: "keep me" },
    { ...spot("treadmill", "Front"), colour: "blue" },
  ];
  p.store.save(doc);
  p.model.setGymSpot("leg_press", "Back wall");
  p.model.setGymSpot("treadmill", "Front row");
  const recs = p.store.load().gym_spots;
  const lp = recs.find((x) => x.id === "g-leg_press");
  assert.equal("deleted" in lp, false);
  assert.equal("deleted_at" in lp, false);
  assert.equal(lp.where, "Back wall");
  assert.equal(lp.photo_hint, "keep me");
  assert.equal(recs.find((x) => x.id === "g-treadmill").colour, "blue");
  assert.equal(validateDocument(p.store.load()).ok, true);
});

// 13
test("hasChangesSince sees a new note; hasData is true for a phone holding only a note", () => {
  const doc = { ...emptyDoc(), gym_spots: [spot("leg_press", "x", "2026-03-04T09:00:00.000Z")] };
  assert.equal(hasChangesSince(doc, "2026-03-03T00:00:00.000Z"), true);
  assert.equal(hasChangesSince(doc, "2026-03-05T00:00:00.000Z"), false);
  assert.equal(hasData(doc), true);
  assert.equal(hasData(emptyDoc()), false);
});

// 14
test("backup holds the notes and no key; restore on an empty phone gives them back; restore into a phone with data drops none", () => {
  const p = setup();
  p.model.setProfile(intake());
  p.model.setGymSpot("cable_station", "Back left");
  saveConnection(p.store, { owner: "rosa-test", repo: "training-data", token: "gym-spot-test-key-0001" });
  const backup = makeBackup(p.store);
  assert.ok(!backup.text.includes("gym-spot-test-key-0001"));
  assert.equal(JSON.parse(backup.text).gym_spots[0].where, "Back left");
  const q = setup();
  const r = q.model.restore(JSON.parse(backup.text));
  assert.equal(r.ok, true, r.error);
  assert.deepEqual(q.store.load().gym_spots, p.store.load().gym_spots);
  const w = setup("2026-03-03T09:00:00.000Z");
  w.model.setProfile(intake());
  w.model.setGymSpot("treadmill", "Front row");
  const r2 = w.model.restore(JSON.parse(backup.text));
  assert.equal(r2.ok, true, r2.error);
  assert.equal(r2.merged, true);
  assert.deepEqual(w.store.load().gym_spots.map((x) => x.id).sort(), ["g-cable_station", "g-treadmill"]);
});

// 15
test("a note syncs through the fake GitHub to a second phone, and an edit there comes back", async () => {
  const fake = createFakeGithub();
  const mk = (start) => {
    const p = setup(start);
    let ms = Date.parse(start) + 500;
    p.syncer = createSyncer({ store: p.store, getFetch: () => fake.fetch, nowIso: () => new Date((ms += 1000)).toISOString() });
    assert.deepEqual(saveConnection(p.store, { owner: fake.owner, repo: fake.repo, token: VALID_TOKEN }), { ok: true });
    return p;
  };
  const one = mk("2026-03-02T09:00:00.000Z");
  one.model.setProfile(intake());
  one.model.setGymSpot("leg_press", "Next to the stairs");
  assert.equal((await one.syncer.request()).result, "ok");
  assert.equal(fake.readDoc().gym_spots[0].where, "Next to the stairs");
  const two = mk("2026-03-02T10:00:00.000Z");
  assert.equal((await two.syncer.request("get")).result, "ok");
  assert.equal(two.store.load().gym_spots[0].where, "Next to the stairs");
  two.model.setGymSpot("leg_press", "Moved upstairs");
  assert.equal((await two.syncer.request()).result, "ok");
  assert.equal((await one.syncer.request()).result, "ok");
  assert.equal(one.store.load().gym_spots[0].where, "Moved upstairs");
});

// 16
test("a phone still on app 0.3.1 keeps a gym_spots list it does not know (old merge copy)", () => {
  const newer = { ...validDoc(), gym_spots: [spot("leg_press", "By the stairs")] };
  const m = mergeDocsOld(validDoc(), newer);
  assert.deepEqual(m.gym_spots, newer.gym_spots);
  assert.deepEqual(mergeDocsOld(newer, validDoc()).gym_spots, newer.gym_spots);
});

// 17
test("machine ids are fixed: a rename would orphan saved notes, so it must fail here", () => {
  assert.deepEqual([...MACHINE_IDS], [
    "treadmill", "chest_press", "shoulder_press", "leg_press", "leg_extension", "cable_station", "smith_machine",
    "hip_thrust", "dumbbells_bench", "mat_area", "lat_pulldown", "seated_row", "leg_curl", "pec_deck", "calf_raise",
    "booty_builder", "ab_crunch", // appended by trainer D18 (0.7.5); the ids above never change
  ]);
  assert.ok(Object.isFrozen(MACHINE_IDS));
  for (const id of MACHINE_IDS) assert.match(id, /^[a-z0-9_]{1,50}$/);
});

// 18
test("the five machines the first visit checks keep the same ids as shared_settings.extra_machines", () => {
  for (const k of Object.keys(validDoc().shared_settings.extra_machines)) assert.ok(MACHINE_IDS.includes(k), k);
});

// 19
test("every catalogue machine can hold a note, and the result passes the check", () => {
  const p = setup();
  for (const id of MACHINE_IDS) p.model.setGymSpot(id, `Spot for ${id}`);
  const doc = p.store.load();
  assert.equal(doc.gym_spots.length, MACHINE_IDS.length);
  assert.equal(validateDocument(doc).ok, true);
});
