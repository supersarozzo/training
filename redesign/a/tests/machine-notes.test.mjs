// "Where it is in my gym" note on each machine card (redesign A, Rosario's choice 55 a).
// New saved data, added without breaking old data: a new record list `machine_notes`,
// one record per machine (id "g-<machine id>"), merged, synced and backed up like the other lists.
// All values are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { createStore, hasData } from "../app/js/store.js";
import { createModel } from "../app/js/model.js";
import { emptyDoc, validateDocument, MAX_TEXT } from "../app/js/validate.js";
import { mergeDocs, hasChangesSince, LISTS } from "../app/js/sync/merge.js";
import { makeBackup } from "../app/js/backup.js";
import { machineNoteId } from "../app/js/ids.js";
import { validDoc, fakeStorage } from "./fixtures/profiles.mjs";

let ms = Date.parse("2026-03-02T09:00:00.000Z");
const clock = () => new Date((ms += 1000));
const T = (n) => `2026-03-0${n}T10:00:00.000Z`;

function phone() {
  const store = createStore(fakeStorage());
  return { store, model: createModel(store, clock) };
}

test("machine note ids are g-<machine id>", () => {
  assert.equal(machineNoteId("leg_press"), "g-leg_press");
});

test("an empty document has an empty machine_notes list, and merge knows the list", () => {
  assert.deepEqual(emptyDoc().machine_notes, []);
  assert.ok(LISTS.includes("machine_notes"));
});

test("saving a where-note makes one record; saving again replaces it", () => {
  const { store, model } = phone();
  model.setMachineWhere("leg_press", "Back left, next to the mirrors");
  let notes = store.load().machine_notes;
  assert.equal(notes.length, 1);
  assert.equal(notes[0].id, "g-leg_press");
  assert.equal(notes[0].machine, "leg_press");
  assert.equal(notes[0].where, "Back left, next to the mirrors");
  assert.match(notes[0].updated_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  const first = notes[0].updated_at;
  model.setMachineWhere("leg_press", "Upstairs, by the window");
  notes = store.load().machine_notes;
  assert.equal(notes.length, 1);
  assert.equal(notes[0].where, "Upstairs, by the window");
  assert.ok(notes[0].updated_at > first);
});

test("a where-note on a phone saved by the old app (no machine_notes list) still works", () => {
  const storage = fakeStorage();
  const old = validDoc();
  delete old.machine_notes;
  storage.setItem("trn.data.v1", JSON.stringify(old));
  const store = createStore(storage);
  const model = createModel(store, clock);
  model.setMachineWhere("treadmill", "Front row");
  const doc = store.load();
  assert.equal(doc.machine_notes.length, 1);
  assert.deepEqual(doc.weighins, old.weighins); // nothing else touched
});

test("a long where-note is cut to the text limit, so the check never refuses it later", () => {
  const { store, model } = phone();
  model.setMachineWhere("smith_machine", "x".repeat(MAX_TEXT + 50));
  const doc = store.load();
  assert.equal(doc.machine_notes[0].where.length, MAX_TEXT);
  assert.equal(validateDocument(doc).ok, true);
});

test("clearing a where-note keeps the record with empty text (so the clear syncs too)", () => {
  const { store, model } = phone();
  model.setMachineWhere("leg_press", "Back left");
  model.setMachineWhere("leg_press", "");
  const notes = store.load().machine_notes;
  assert.equal(notes.length, 1);
  assert.equal(notes[0].where, "");
});

test("an old file without machine_notes passes the check and gets an empty list", () => {
  const old = validDoc();
  delete old.machine_notes;
  const r = validateDocument(old);
  assert.equal(r.ok, true);
  assert.deepEqual(r.doc.machine_notes, []);
});

test("the check accepts good machine notes and refuses bad ones in plain words", () => {
  const good = { ...validDoc(), machine_notes: [{ id: "g-leg_press", updated_at: T(2), machine: "leg_press", where: "Back left" }] };
  assert.equal(validateDocument(good).ok, true);
  const tomb = { ...validDoc(), machine_notes: [{ id: "g-leg_press", updated_at: T(2), deleted: true }] };
  assert.equal(validateDocument(tomb).ok, true);
  const bads = [
    { ...validDoc(), machine_notes: "not a list" },
    { ...validDoc(), machine_notes: [{ id: "g-leg_press", updated_at: T(2), machine: "leg_press", where: 42 }] },
    { ...validDoc(), machine_notes: [{ id: "g-leg_press", updated_at: "not a time", machine: "leg_press", where: "" }] },
    { ...validDoc(), machine_notes: [{ id: "g-leg_press", updated_at: T(2), machine: 7, where: "" }] },
    { ...validDoc(), machine_notes: [{ id: "g-leg_press", updated_at: T(2), machine: "leg_press", where: "x".repeat(MAX_TEXT + 1) }] },
  ];
  for (const bad of bads) {
    const r = validateDocument(bad);
    assert.equal(r.ok, false);
    assert.equal(typeof r.error, "string");
  }
});

test("a where-note with HTML in it is kept as plain text (it is shown with textContent, never innerHTML)", () => {
  const doc = { ...validDoc(), machine_notes: [{ id: "g-leg_press", updated_at: T(2), machine: "leg_press", where: "<img src=x onerror=alert(1)>" }] };
  const r = validateDocument(doc);
  assert.equal(r.ok, true);
  assert.equal(r.doc.machine_notes[0].where, "<img src=x onerror=alert(1)>");
});

test("merge: machine notes join by id, the later edit wins, and merge is symmetric", () => {
  const a = { ...validDoc(), machine_notes: [
    { id: "g-leg_press", updated_at: T(2), machine: "leg_press", where: "old place" },
    { id: "g-treadmill", updated_at: T(3), machine: "treadmill", where: "front" },
  ] };
  const b = { ...validDoc(), machine_notes: [
    { id: "g-leg_press", updated_at: T(4), machine: "leg_press", where: "new place" },
    { id: "g-smith_machine", updated_at: T(1), machine: "smith_machine", where: "rack 2" },
  ] };
  const ab = mergeDocs(a, b);
  assert.deepEqual(ab, mergeDocs(b, a));
  assert.deepEqual(ab.machine_notes.map((n) => [n.id, n.where]), [
    ["g-leg_press", "new place"], ["g-smith_machine", "rack 2"], ["g-treadmill", "front"],
  ]);
  assert.deepEqual(mergeDocs(ab, ab), ab); // merging again changes nothing
});

test("merge: one side from the old app (no list) keeps the other side's notes; both missing gives []", () => {
  const old = validDoc();
  delete old.machine_notes;
  const neu = { ...validDoc(), machine_notes: [{ id: "g-treadmill", updated_at: T(3), machine: "treadmill", where: "front" }] };
  assert.equal(mergeDocs(old, neu).machine_notes.length, 1);
  const old2 = validDoc();
  delete old2.machine_notes;
  assert.deepEqual(mergeDocs(old, old2).machine_notes, []);
});

test("merge: a deleted note is never brought back by an older copy", () => {
  const a = { ...validDoc(), machine_notes: [{ id: "g-treadmill", updated_at: T(5), deleted: true, deleted_at: T(5) }] };
  const b = { ...validDoc(), machine_notes: [{ id: "g-treadmill", updated_at: T(3), machine: "treadmill", where: "front" }] };
  assert.equal(mergeDocs(a, b).machine_notes[0].deleted, true);
});

test("sync sees a new where-note as a change to send", () => {
  const doc = { ...validDoc(), machine_notes: [{ id: "g-treadmill", updated_at: T(8), machine: "treadmill", where: "front" }] };
  assert.equal(hasChangesSince(doc, T(7)), true);
  assert.equal(hasChangesSince({ ...doc, machine_notes: [] }, T(7)), false);
});

test("a phone with only a where-note counts as having data (a restore then merges, never replaces)", () => {
  const doc = { ...emptyDoc(), machine_notes: [{ id: "g-treadmill", updated_at: T(3), machine: "treadmill", where: "front" }] };
  assert.equal(hasData(doc), true);
  assert.equal(hasData(emptyDoc()), false);
});

test("the backup file holds the where-notes, and restoring it gives them back", () => {
  const { store, model } = phone();
  model.setMachineWhere("cable_station", "Middle of the floor");
  const backup = makeBackup(store);
  const parsed = JSON.parse(backup.text);
  assert.equal(parsed.machine_notes[0].where, "Middle of the floor");
  const fresh = phone();
  const r = fresh.model.restore(parsed);
  assert.equal(r.ok, true);
  assert.equal(fresh.store.load().machine_notes[0].where, "Middle of the floor");
});

test("restoring a file into a phone with notes merges the notes, never drops them", () => {
  const { store, model } = phone();
  model.setMachineWhere("treadmill", "Front row");
  const file = { ...validDoc(), machine_notes: [{ id: "g-leg_press", updated_at: T(2), machine: "leg_press", where: "Back left" }] };
  const r = model.restore(file);
  assert.equal(r.ok, true);
  assert.deepEqual(store.load().machine_notes.map((n) => n.id).sort(), ["g-leg_press", "g-treadmill"]);
});
