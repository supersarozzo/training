// "Where it is in my gym": one note per machine (redesign C, Rosario's choice 55 a).
// New saved data, added WITHOUT breaking old data: a list `gym_spots` of records
//   { id: "g-<machine id>", updated_at, machine, where }
// It loads from old files (no list), saves at once, syncs by record (newest wins), goes into backups,
// and the check (validate.js) refuses bad notes. Test values are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { emptyDoc, validateDocument, MAX_TEXT } from "../app/js/validate.js";
import { mergeDocs, hasChangesSince, LISTS } from "../app/js/sync/merge.js";
import { makeBackup } from "../app/js/backup.js";
import { validDoc, fakeStorage } from "./fixtures/profiles.mjs";

const T = (n) => `2026-02-0${n}T10:00:00.000Z`;
const clockAt = (iso) => () => new Date(iso);
const spot = (machine, where, n, extra = {}) => ({ id: `g-${machine}`, updated_at: T(n), machine, where, ...extra });

test("a new phone has an empty gym_spots list", () => {
  assert.deepEqual(emptyDoc().gym_spots, []);
});

test("old data with no gym_spots list still passes the check and gets an empty list", () => {
  const old = validDoc();
  delete old.gym_spots;
  const r = validateDocument(old);
  assert.equal(r.ok, true);
  assert.deepEqual(r.doc.gym_spots, []);
});

test("old data with no gym_spots list still loads on the phone, and the first note adds the list", () => {
  const store = createStore(fakeStorage());
  const old = validDoc();
  delete old.gym_spots;
  store.save(old);
  const model = createModel(store, clockAt(T(3)));
  assert.equal(model.doc().weighins.length, 1);
  model.setGymSpot("leg_press", "Back left, next to the mirrors");
  const doc = store.load();
  assert.deepEqual(doc.gym_spots, [{ id: "g-leg_press", updated_at: T(3), machine: "leg_press", where: "Back left, next to the mirrors" }]);
  assert.equal(doc.weighins.length, 1); // nothing else changed
});

test("saving the note again for the same machine replaces it (one note per machine) and stamps the time", () => {
  const store = createStore(fakeStorage());
  let now = T(3);
  const model = createModel(store, () => new Date(now));
  model.setGymSpot("smith", "Free weights, by the window");
  now = T(4);
  model.setGymSpot("smith", "  Free weights, second rack  ");
  const list = store.load().gym_spots;
  assert.equal(list.length, 1);
  assert.equal(list[0].where, "Free weights, second rack"); // trimmed
  assert.equal(list[0].updated_at, T(4));
});

test("a very long note is cut to the check's limit, so sync can never be blocked by it", () => {
  const store = createStore(fakeStorage());
  const model = createModel(store, clockAt(T(3)));
  model.setGymSpot("treadmill", "x".repeat(MAX_TEXT + 500));
  const doc = store.load();
  assert.equal(doc.gym_spots[0].where.length, MAX_TEXT);
  assert.equal(validateDocument(doc).ok, true);
});

test("an unknown machine id is refused (nothing saved)", () => {
  const store = createStore(fakeStorage());
  const model = createModel(store, clockAt(T(3)));
  assert.throws(() => model.setGymSpot("__proto__", "x"));
  assert.throws(() => model.setGymSpot("", "x"));
  assert.equal(store.load().gym_spots.length, 0);
});

test("the check refuses a note that is not text, too long, or has no machine", () => {
  const bad = [
    spot("leg_press", 42, 1),
    spot("leg_press", "x".repeat(MAX_TEXT + 1), 1),
    { id: "g-leg_press", updated_at: T(1), where: "ok" },
    { id: "g-leg_press", where: "ok", machine: "leg_press" },
  ];
  for (const rec of bad) {
    const r = validateDocument({ ...validDoc(), gym_spots: [rec] });
    assert.equal(r.ok, false, JSON.stringify(rec));
  }
  assert.equal(validateDocument({ ...validDoc(), gym_spots: "not a list" }).ok, false);
});

test("the check accepts good notes and a deleted note (tombstone)", () => {
  const r = validateDocument({ ...validDoc(), gym_spots: [spot("leg_press", "Back left", 1), { id: "g-smith", updated_at: T(2), deleted: true, deleted_at: T(2) }] });
  assert.equal(r.ok, true);
  assert.equal(r.doc.gym_spots.length, 2);
});

test("sync merge: gym_spots is a known list; joined by machine, the newer note wins, nothing dropped", () => {
  assert.ok(LISTS.includes("gym_spots"));
  const a = { ...validDoc(), gym_spots: [spot("leg_press", "old place", 1), spot("smith", "only on phone", 2)] };
  const b = { ...validDoc(), gym_spots: [spot("leg_press", "new place", 3), spot("treadmill", "only on GitHub", 1)] };
  const m = mergeDocs(a, b);
  assert.deepEqual(m.gym_spots.map((x) => [x.machine, x.where]), [["leg_press", "new place"], ["smith", "only on phone"], ["treadmill", "only on GitHub"]]);
  assert.deepEqual(mergeDocs(b, a), m); // same result both ways
  assert.deepEqual(mergeDocs(m, m), m); // safe to repeat
});

test("sync merge: one side has no gym_spots list at all (an old file): the notes are kept", () => {
  const old = validDoc();
  delete old.gym_spots;
  const withNotes = { ...validDoc(), gym_spots: [spot("leg_press", "Back left", 2)] };
  assert.deepEqual(mergeDocs(old, withNotes).gym_spots, withNotes.gym_spots);
  assert.deepEqual(mergeDocs(old, old).gym_spots, []);
});

test("a new note counts as 'not synced yet'", () => {
  const d = { ...validDoc(), gym_spots: [spot("leg_press", "Back left", 5)] };
  assert.equal(hasChangesSince(d, T(4)), true);
  assert.equal(hasChangesSince({ ...d, gym_spots: [spot("leg_press", "Back left", 1)] }, T(4)), false);
});

test("the backup file holds the notes, and restoring it on an empty phone gives them back", () => {
  const store = createStore(fakeStorage());
  const model = createModel(store, clockAt(T(3)));
  store.save(validDoc());
  model.setGymSpot("cable_station", "Middle of the gym, two of them");
  const file = JSON.parse(makeBackup(store).text);
  assert.equal(file.gym_spots[0].where, "Middle of the gym, two of them");
  const empty = createStore(fakeStorage());
  const r = createModel(empty, clockAt(T(4))).restore(file);
  assert.equal(r.ok, true);
  assert.deepEqual(empty.load().gym_spots, file.gym_spots);
});

test("a note holding HTML is kept as plain text (the page shows it with textContent)", () => {
  const store = createStore(fakeStorage());
  const model = createModel(store, clockAt(T(3)));
  model.setGymSpot("leg_press", "<img src=x onerror=alert(1)>");
  assert.equal(store.load().gym_spots[0].where, "<img src=x onerror=alert(1)>");
});
