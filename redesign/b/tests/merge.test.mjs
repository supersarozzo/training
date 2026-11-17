// Merge properties (docs/ARCHITECTURE.md section 5.3). All values are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { mergeDocs, canonical, pick, hasChangesSince } from "../app/js/sync/merge.js";
import { emptyDoc } from "../app/js/validate.js";
import { validDoc } from "./fixtures/profiles.mjs";

const T = (n) => `2026-02-${String(n).padStart(2, "0")}T10:00:00.000Z`;
const w = (day, kg, at, extra = {}) => ({ id: `w-2026-02-${String(day).padStart(2, "0")}`, updated_at: T(at), date: `2026-02-${String(day).padStart(2, "0")}`, kg, ...extra });
const doc = (over = {}) => ({ ...emptyDoc(), ...over });

// A small seeded random generator so the property tests are the same every run.
function rng(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2 ** 32; }; }
function randomDoc(r) {
  const out = doc();
  for (let i = 0; i < 6; i++) {
    const day = 1 + Math.floor(r() * 8);
    if (r() < 0.7) {
      const rec = w(day, 70 + Math.floor(r() * 10), 1 + Math.floor(r() * 5));
      if (r() < 0.25) Object.assign(rec, { deleted: true, deleted_at: rec.updated_at });
      out.weighins.push(rec);
    }
  }
  const seen = new Set();
  out.weighins = out.weighins.filter((x) => (seen.has(x.id) ? false : seen.add(x.id)));
  if (r() < 0.6) out.block = { updated_at: T(1 + Math.floor(r() * 5)), plan_id: "plan-v2", number: 1 + Math.floor(r() * 2), start_monday: "2026-02-02" };
  if (r() < 0.6) out.shared_settings = { ...out.shared_settings, body_unit: r() < 0.5 ? "kg" : "st", updated_at: T(1 + Math.floor(r() * 5)) };
  if (r() < 0.5) out.exercise_state.push({ id: "x-chest_press", updated_at: T(1 + Math.floor(r() * 5)), start_weight_kg: 10 + Math.floor(r() * 5), machine_note: "", fail_streak: 0 });
  return out;
}

test("a record on one side only is kept", () => {
  const a = doc({ weighins: [w(1, 70, 1)] });
  const b = doc({ weighins: [w(2, 71, 1)] });
  const m = mergeDocs(a, b);
  assert.deepEqual(m.weighins.map((x) => x.id), ["w-2026-02-01", "w-2026-02-02"]);
});

test("same id on both sides: the later updated_at wins", () => {
  const m = mergeDocs(doc({ weighins: [w(1, 70, 1)] }), doc({ weighins: [w(1, 99, 3)] }));
  assert.equal(m.weighins.length, 1);
  assert.equal(m.weighins[0].kg, 99);
});

test("same time: the tombstone wins", () => {
  const live = w(1, 70, 2);
  const dead = { ...w(1, 70, 2), deleted: true, deleted_at: T(2) };
  assert.equal(mergeDocs(doc({ weighins: [live] }), doc({ weighins: [dead] })).weighins[0].deleted, true);
  assert.equal(mergeDocs(doc({ weighins: [dead] }), doc({ weighins: [live] })).weighins[0].deleted, true);
});

test("same time, both live: the same copy wins on both phones (the one whose text sorts first)", () => {
  const x = w(1, 70, 2), y = w(1, 71, 2);
  const m1 = mergeDocs(doc({ weighins: [x] }), doc({ weighins: [y] }));
  const m2 = mergeDocs(doc({ weighins: [y] }), doc({ weighins: [x] }));
  assert.deepEqual(m1, m2);
  assert.equal(m1.weighins[0].kg, canonical(x) <= canonical(y) ? 70 : 71);
});

test("a tombstone is never brought back to life by an older copy", () => {
  const dead = { ...w(1, 70, 4), deleted: true, deleted_at: T(4) };
  const old = w(1, 70, 2);
  for (const [a, b] of [[dead, old], [old, dead]]) {
    const m = mergeDocs(doc({ weighins: [a] }), doc({ weighins: [b] }));
    assert.equal(m.weighins[0].deleted, true);
  }
});

test("a newer save of a deleted record (weigh in again the same day) does come back", () => {
  const dead = { ...w(1, 70, 2), deleted: true, deleted_at: T(2) };
  const again = w(1, 72, 5);
  assert.equal(mergeDocs(doc({ weighins: [dead] }), doc({ weighins: [again] })).weighins[0].kg, 72);
});

test("single objects: the later updated_at wins as a whole", () => {
  const a = doc({ block: { updated_at: T(2), plan_id: "plan-v2", number: 1, start_monday: "2026-02-02" } });
  const b = doc({ block: { updated_at: T(4), plan_id: "plan-v2", number: 1, start_monday: "2026-02-09" } });
  assert.equal(mergeDocs(a, b).block.start_monday, "2026-02-09");
  assert.equal(mergeDocs(b, a).block.start_monday, "2026-02-09");
});

test("a single object on one side only is kept; null never beats data", () => {
  const p = validDoc().profile;
  assert.deepEqual(mergeDocs(doc({ profile: p }), doc()).profile, p);
  assert.deepEqual(mergeDocs(doc(), doc({ profile: p })).profile, p);
  assert.equal(mergeDocs(doc(), doc()).profile, null);
});

test("shared settings: a stamped copy beats the untouched default", () => {
  const set = { ...emptyDoc().shared_settings, body_unit: "st", updated_at: T(2) };
  assert.equal(mergeDocs(doc(), doc({ shared_settings: set })).shared_settings.body_unit, "st");
  assert.equal(mergeDocs(doc({ shared_settings: set }), doc()).shared_settings.body_unit, "st");
});

test("a whole session is one unit: the later copy wins with all of its sets", () => {
  const base = { id: "s-20260202-aaaaaa", date: "2026-02-02", plan_day: "mon", week: 1, kind: "full", status: "in_progress", exercises: [{ slot: "A1", plan_exercise: "chest_press", done_exercise: "chest_press", sets: [{ n: 1, type: "work", weight_kg: 10, reps: 8 }], note: "" }] };
  const older = { ...base, updated_at: T(2) };
  const newer = { ...base, updated_at: T(3), status: "finished", exercises: [{ ...base.exercises[0], sets: [...base.exercises[0].sets, { n: 2, type: "work", weight_kg: 10, reps: 9 }] }] };
  const m = mergeDocs(doc({ sessions: [older] }), doc({ sessions: [newer] }));
  assert.equal(m.sessions.length, 1);
  assert.equal(m.sessions[0].exercises[0].sets.length, 2);
});

test("unknown fields are kept (in records, in objects and at the top)", () => {
  const a = doc({ weighins: [w(1, 70, 1, { from_newer_app: { x: 1 } })], future_thing: { keep: true } });
  const b = doc({ weighins: [w(2, 71, 1)] });
  const m = mergeDocs(a, b);
  assert.deepEqual(m.weighins[0].from_newer_app, { x: 1 });
  assert.deepEqual(m.future_thing, { keep: true });
  assert.deepEqual(mergeDocs(b, a).future_thing, { keep: true });
});

test("the format of the result is the higher one", () => {
  assert.equal(mergeDocs({ ...doc(), format: 1 }, { ...doc(), format: 2 }).format, 2);
});

test("the inputs are never changed", () => {
  const a = doc({ weighins: [w(1, 70, 1)] }), b = doc({ weighins: [w(1, 71, 2), w(2, 72, 1)] });
  const ca = JSON.stringify(a), cb = JSON.stringify(b);
  const m = mergeDocs(a, b);
  m.weighins[0].kg = 1; m.weighins.push({});
  assert.equal(JSON.stringify(a), ca);
  assert.equal(JSON.stringify(b), cb);
});

test("property: nothing is ever dropped (every id on either side is in the result)", () => {
  const r = rng(1);
  for (let i = 0; i < 200; i++) {
    const a = randomDoc(r), b = randomDoc(r);
    const m = mergeDocs(a, b);
    for (const list of ["weighins", "exercise_state"]) {
      const ids = new Set(m[list].map((x) => x.id));
      for (const rec of [...a[list], ...b[list]]) assert.ok(ids.has(rec.id), `${list} ${rec.id} dropped`);
    }
    if (a.block || b.block) assert.ok(m.block);
  }
});

test("property: merging twice gives the same result (idempotent), also with either input", () => {
  const r = rng(2);
  for (let i = 0; i < 200; i++) {
    const a = randomDoc(r), b = randomDoc(r);
    const m = mergeDocs(a, b);
    assert.deepEqual(mergeDocs(m, m), m);
    assert.deepEqual(mergeDocs(m, a), m);
    assert.deepEqual(mergeDocs(m, b), m);
    assert.deepEqual(mergeDocs(a, a), mergeDocs(a, a));
  }
});

test("property: merge(a, b) equals merge(b, a), and the order of three does not matter", () => {
  const r = rng(3);
  for (let i = 0; i < 200; i++) {
    const a = randomDoc(r), b = randomDoc(r), c = randomDoc(r);
    assert.deepEqual(mergeDocs(a, b), mergeDocs(b, a));
    assert.deepEqual(mergeDocs(mergeDocs(a, b), c), mergeDocs(a, mergeDocs(b, c)));
  }
});

test("property: a tombstone is not brought back by an older copy", () => {
  const r = rng(4);
  for (let i = 0; i < 200; i++) {
    const a = randomDoc(r), b = randomDoc(r);
    const m = mergeDocs(a, b);
    for (const side of [a, b]) for (const rec of side.weighins) {
      if (!rec.deleted) continue;
      const after = m.weighins.find((x) => x.id === rec.id);
      const other = (side === a ? b : a).weighins.find((x) => x.id === rec.id);
      if (!other || Date.parse(other.updated_at) <= Date.parse(rec.updated_at)) assert.equal(after.deleted, true, `${rec.id} came back`);
    }
  }
});

test("pick is symmetric", () => {
  const x = w(1, 70, 2), y = w(1, 71, 2), z = { ...x, deleted: true };
  for (const [p, q] of [[x, y], [x, z], [y, z]]) assert.deepEqual(pick(p, q), pick(q, p));
});

test("hasChangesSince: finds records and settings newer than the last sync", () => {
  const d = doc({ weighins: [w(1, 70, 3)], block: { updated_at: T(1), plan_id: "p", number: 1, start_monday: "2026-02-02" } });
  assert.equal(hasChangesSince(d, T(2)), true);
  assert.equal(hasChangesSince(d, T(3)), false);
  assert.equal(hasChangesSince(doc(), null), false);
  assert.equal(hasChangesSince(d, undefined), true);
});
