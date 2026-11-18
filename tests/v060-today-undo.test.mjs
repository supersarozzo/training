// Auditor M3 (2026-11-18): Undo after "Stop this exercise here" on the LAST exercise. The stop leaves no set to do, so
// the workout screen saves phase "finish" at once (ui/workout.js); the Undo must also put the phase back to the
// weights, or the sets that were stopped can never be done. Drives app/js/ui/pair.js undoStop with a pretend page
// (tests/fixtures/fake-dom.mjs) and a pretend storage. All values are made up. No body data.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { installFakeDom } from "./fixtures/fake-dom.mjs";
import { validDoc, fakeStorage } from "./fixtures/profiles.mjs";

installFakeDom();
const storage = fakeStorage();
globalThis.window = { addEventListener: () => {}, localStorage: storage, matchMedia: () => ({ matches: true, addEventListener: () => {} }) };
globalThis.location = { hash: "#/workout", hostname: "test", search: "" };

const { store, model } = await import("../app/js/ui/app.js");
const { getActive, setActive } = await import("../app/js/active.js");
const pair = await import("../app/js/ui/pair.js");

test("T16 Undo after stopping the last exercise brings the sets back and leaves the Finish screen", () => {
  store.save(validDoc());
  const s0 = model.startSession({ planDay: "tue", week: 3, kind: "full" });
  model.logSet(s0.id, "D", { type: "work", weight_kg: 0, reps: 10 });
  model.stopExercise(s0.id, "D", true);
  // What ui/workout.js does when no set is left: phase "finish", saved at once.
  setActive({ session_id: s0.id, phase: "finish", timer_end: null, timer_total: null, rest: null, hold: null });
  assert.equal(typeof pair.undoStop, "function", "pair.js exports undoStop");
  pair.undoStop(s0.id, "D");
  const rec = model.doc().sessions.find((x) => x.id === s0.id).exercises.find((e) => e.slot === "D");
  assert.equal(rec.stopped_after, undefined, "the stop is gone");
  assert.equal(getActive().phase, "weights", "back to the sets");
  assert.equal(getActive().rest, null);
});

test("T17 Undo in the middle of the workout keeps the phase and a running rest", () => {
  store.save(validDoc());
  const s0 = model.startSession({ planDay: "tue", week: 3, kind: "full" });
  model.logSet(s0.id, "A1", { type: "work", weight_kg: 40, reps: 10 });
  model.stopExercise(s0.id, "A1", true);
  const rest = { end: 1, total: 1000, kind: "move", slot: "A2" };
  setActive({ session_id: s0.id, phase: "weights", timer_end: null, timer_total: null, rest, hold: null });
  assert.equal(typeof pair.undoStop, "function", "pair.js exports undoStop");
  pair.undoStop(s0.id, "A1");
  assert.equal(getActive().phase, "weights");
  assert.deepEqual(getActive().rest, rest, "a running rest is left alone");
  const p = readFileSync(new URL("../app/js/ui/pair.js", import.meta.url), "utf8");
  assert.match(p, /undoToast\([^;]*undoStop\(session\.id, entry\.slot\)/s, "the toast's Undo calls undoStop");
});
