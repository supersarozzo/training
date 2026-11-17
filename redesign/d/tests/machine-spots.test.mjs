// The "Where it is in my gym" note on a machine card (redesign D, Rosario's choice 55 a).
// New saved data, added without breaking old data: a list `machine_spots` of records
//   { id: "g-<machine id>", updated_at, machine: "<machine id>", where: "<text>" }
// It must load from old data, pass the check, merge, sync and back up like every other record.
// All values are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { createStore, hasData } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { emptyDoc, validateDocument, MAX_TEXT } from "../app/js/validate.js";
import { mergeDocs, hasChangesSince, LISTS } from "../app/js/sync/merge.js";
import { machineSpotId } from "../app/js/ids.js";
import { makeBackup } from "../app/js/backup.js";
import { createSyncer, saveConnection } from "../app/js/sync/sync.js";
import { createFakeGithub, VALID_TOKEN } from "./fake-github.mjs";
import { validDoc, fakeStorage, intake } from "./fixtures/profiles.mjs";

function setup(start = "2026-03-02T09:00:00.000Z") {
  const storage = fakeStorage();
  const store = createStore(storage);
  let ms = Date.parse(start);
  const clock = () => new Date((ms += 1000));
  return { storage, store, model: createModel(store, clock), clock, tick: (s = 60) => { ms += s * 1000; } };
}
const spot = (machine, where, t) => ({ id: `g-${machine}`, updated_at: t, machine, where });

test("machine spot ids look like g-<machine id>", () => {
  assert.equal(machineSpotId("cable_station"), "g-cable_station");
});

test("an empty document has an empty machine_spots list", () => {
  assert.deepEqual(emptyDoc().machine_spots, []);
});

test("saving a spot makes one record; saving again updates the same record", () => {
  const p = setup();
  p.model.setMachineSpot("cable_station", "Back left, by the mirrors");
  let doc = p.store.load();
  assert.equal(doc.machine_spots.length, 1);
  const first = doc.machine_spots[0];
  assert.equal(first.id, "g-cable_station");
  assert.equal(first.machine, "cable_station");
  assert.equal(first.where, "Back left, by the mirrors");
  assert.ok(first.updated_at);
  p.tick();
  p.model.setMachineSpot("cable_station", "  Moved: front right  ");
  doc = p.store.load();
  assert.equal(doc.machine_spots.length, 1);
  assert.equal(doc.machine_spots[0].where, "Moved: front right"); // trimmed
  assert.ok(Date.parse(doc.machine_spots[0].updated_at) > Date.parse(first.updated_at));
});

test("old data without machine_spots still loads, and a spot can be added to it", () => {
  const p = setup();
  const old = validDoc();
  assert.equal("machine_spots" in old, false);
  p.store.save(old);
  assert.deepEqual(p.store.load(), old); // loading never rewrites old data
  p.model.setMachineSpot("leg_press", "Next to the stairs");
  const doc = p.store.load();
  assert.equal(doc.machine_spots.length, 1);
  assert.deepEqual(doc.weighins, old.weighins); // nothing else changed
  assert.deepEqual(doc.profile, old.profile);
});

test("a very long note is cut to the text limit when saved", () => {
  const p = setup();
  p.model.setMachineSpot("treadmill", "x".repeat(MAX_TEXT + 50));
  assert.equal(p.store.load().machine_spots[0].where.length, MAX_TEXT);
});

test("the check accepts old files with no spots and gives an empty list", () => {
  const r = validateDocument(validDoc());
  assert.equal(r.ok, true);
  assert.deepEqual(r.doc.machine_spots, []);
});

test("the check accepts good spots, tombstones and unknown extra fields", () => {
  const doc = { ...validDoc(), machine_spots: [
    spot("leg_press", "By the stairs", "2026-03-02T09:00:00.000Z"),
    { id: "g-treadmill", updated_at: "2026-03-02T09:00:00.000Z", deleted: true, deleted_at: "2026-03-02T09:00:00.000Z" },
    { ...spot("smith", "", "2026-03-02T09:00:00.000Z"), photo_hint: "from a newer app" },
  ] };
  const r = validateDocument(doc);
  assert.equal(r.ok, true, r.error);
  assert.equal(r.doc.machine_spots.length, 3);
  assert.equal(r.doc.machine_spots[2].photo_hint, "from a newer app");
});

test("the check refuses broken spots with a plain message", () => {
  const bad = [
    "not a record",
    { id: "g-x", machine: "x", where: "a" }, // no time
    { ...spot("x", "a", "2026-03-02T09:00:00.000Z"), where: 42 },
    { ...spot("x", "a", "2026-03-02T09:00:00.000Z"), where: "y".repeat(MAX_TEXT + 1) },
    { ...spot("x", "a", "2026-03-02T09:00:00.000Z"), machine: "m".repeat(61) },
    { ...spot("x", "a", "2026-03-02T09:00:00.000Z"), machine: 7 },
  ];
  for (const rec of bad) {
    const r = validateDocument({ ...validDoc(), machine_spots: [rec] });
    assert.equal(r.ok, false, JSON.stringify(rec).slice(0, 60));
    assert.match(r.error, /spot|machine/i);
  }
  const notList = validateDocument({ ...validDoc(), machine_spots: { a: 1 } });
  assert.equal(notList.ok, false);
});

test("a note with HTML is kept as plain text (it is shown with textContent only)", () => {
  const r = validateDocument({ ...validDoc(), machine_spots: [spot("x", "<img src=x onerror=alert(1)>", "2026-03-02T09:00:00.000Z")] });
  assert.equal(r.ok, true);
  assert.equal(r.doc.machine_spots[0].where, "<img src=x onerror=alert(1)>");
});

test("machine_spots is a merged list: join by id, later edit wins, one-side records kept", () => {
  assert.ok(LISTS.includes("machine_spots"));
  const a = { ...emptyDoc(), machine_spots: [spot("leg_press", "old", "2026-03-02T09:00:00.000Z"), spot("smith", "only on a", "2026-03-02T09:00:00.000Z")] };
  const b = { ...emptyDoc(), machine_spots: [spot("leg_press", "new", "2026-03-03T09:00:00.000Z"), spot("treadmill", "only on b", "2026-03-01T09:00:00.000Z")] };
  const ab = mergeDocs(a, b);
  assert.deepEqual(ab, mergeDocs(b, a));
  assert.deepEqual(ab.machine_spots.map((x) => [x.id, x.where]), [["g-leg_press", "new"], ["g-smith", "only on a"], ["g-treadmill", "only on b"]]);
  assert.deepEqual(mergeDocs(ab, ab), ab); // merging again changes nothing
});

test("merging old data (no machine_spots) with new data keeps the spots", () => {
  const old = validDoc();
  const fresh = { ...emptyDoc(), machine_spots: [spot("leg_press", "By the stairs", "2026-03-02T09:00:00.000Z")] };
  const m = mergeDocs(old, fresh);
  assert.equal(m.machine_spots.length, 1);
  assert.deepEqual(mergeDocs(old, emptyDoc()).machine_spots, []);
});

test("a tombstone is never brought back by an older copy", () => {
  const dead = { id: "g-leg_press", updated_at: "2026-03-05T09:00:00.000Z", deleted: true, deleted_at: "2026-03-05T09:00:00.000Z" };
  const m = mergeDocs({ ...emptyDoc(), machine_spots: [dead] }, { ...emptyDoc(), machine_spots: [spot("leg_press", "x", "2026-03-04T09:00:00.000Z")] });
  assert.equal(m.machine_spots[0].deleted, true);
});

test("a new spot counts as a change that needs a sync", () => {
  const doc = { ...emptyDoc(), machine_spots: [spot("leg_press", "x", "2026-03-04T09:00:00.000Z")] };
  assert.equal(hasChangesSince(doc, "2026-03-03T00:00:00.000Z"), true);
  assert.equal(hasChangesSince(doc, "2026-03-05T00:00:00.000Z"), false);
});

test("a phone with only a spot counts as having data", () => {
  assert.equal(hasData({ ...emptyDoc(), machine_spots: [spot("x", "y", "2026-03-02T09:00:00.000Z")] }), true);
});

test("the backup file holds the spots, and restoring it on an empty phone gives them back", () => {
  const p = setup();
  p.model.setProfile(intake());
  p.model.setMachineSpot("cable_station", "Back left");
  const backup = makeBackup(p.store);
  const q = setup();
  const r = q.model.restore(JSON.parse(backup.text));
  assert.equal(r.ok, true, r.error);
  assert.deepEqual(q.store.load().machine_spots, p.store.load().machine_spots);
});

test("restoring a backup into a phone merges the spots and drops none", () => {
  const p = setup();
  p.model.setProfile(intake());
  p.model.setMachineSpot("cable_station", "Back left");
  const backup = JSON.parse(makeBackup(p.store).text);
  const q = setup("2026-03-03T09:00:00.000Z");
  q.model.setProfile(intake());
  q.model.setMachineSpot("treadmill", "Front row");
  assert.equal(q.model.restore(backup).ok, true);
  assert.deepEqual(q.store.load().machine_spots.map((x) => x.id).sort(), ["g-cable_station", "g-treadmill"]);
});

test("a spot syncs through GitHub to a second phone", async () => {
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
  one.model.setMachineSpot("leg_press", "Next to the stairs");
  assert.equal((await one.syncer.request()).result, "ok");
  assert.equal(fake.readDoc().machine_spots[0].where, "Next to the stairs");
  const two = mk("2026-03-02T10:00:00.000Z");
  assert.equal((await two.syncer.request("get")).result, "ok");
  assert.equal(two.store.load().machine_spots[0].where, "Next to the stairs");
  // An edit on phone two wins on phone one after both sync.
  two.model.setMachineSpot("leg_press", "Moved upstairs");
  assert.equal((await two.syncer.request()).result, "ok");
  assert.equal((await one.syncer.request()).result, "ok");
  assert.equal(one.store.load().machine_spots[0].where, "Moved upstairs");
});
