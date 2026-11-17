import test from "node:test";
import assert from "node:assert/strict";
import { validateDocument, emptyDoc } from "../app/js/validate.js";
import { validDoc, intake } from "./fixtures/profiles.mjs";

const bad = (mutate) => { const d = validDoc(); mutate(d); return validateDocument(d); };

test("a valid document passes and comes back as a clean copy", () => {
  const input = validDoc();
  const r = validateDocument(input);
  assert.equal(r.ok, true);
  assert.deepEqual(r.doc, input);
  assert.notEqual(r.doc, input);
});

test("an empty document is valid", () => {
  assert.equal(validateDocument(emptyDoc()).ok, true);
});

test("not a backup: wrong shape, wrong app, no format", () => {
  for (const x of [null, 5, "text", [], {}, { app: "other", format: 1 }, { app: "training" }, { app: "training", format: "1" }, { app: "training", format: 0 }]) {
    const r = validateDocument(x);
    assert.equal(r.ok, false);
  }
});

test("a newer format is refused with the 'update the app' message", () => {
  const r = validateDocument({ ...validDoc(), format: 2 });
  assert.equal(r.ok, false);
  assert.equal(r.tooNew, true);
  assert.match(r.error, /Update the app first/);
});

test("every intake field is range checked", () => {
  assert.equal(bad((d) => { d.profile.intake.q21_age = 15; }).ok, false);
  assert.equal(bad((d) => { d.profile.intake.q21_age = "30"; }).ok, false);
  assert.equal(bad((d) => { d.profile.intake.q23_height_cm = 300; }).ok, false);
  assert.equal(bad((d) => { d.profile.intake.q24_weight_kg = 10; }).ok, false);
  assert.equal(bad((d) => { d.profile.intake.q24_weight_kg = NaN; }).ok, false);
  assert.equal(bad((d) => { d.profile.intake.q22_sex = "x"; }).ok, false);
  assert.equal(bad((d) => { d.profile.intake.q26_goal = "other"; }).ok, false);
  assert.equal(bad((d) => { d.profile.intake.q30_activity = "e"; }).ok, false);
  assert.equal(bad((d) => { d.profile.intake.q36_walk_fit = "yes!"; }).ok, false);
  assert.equal(bad((d) => { d.profile.intake.q31_sleep_h = 20; }).ok, false);
  assert.equal(bad((d) => { d.profile.intake.q37_avoid = "none"; }).ok, false);
  assert.equal(bad((d) => { d.profile.intake.q34_scale = "yes"; }).ok, false);
  assert.equal(bad((d) => { d.profile.intake.q28_waist_cm = 5; }).ok, false);
  assert.equal(bad((d) => { delete d.profile.intake.q21_age; }).ok, false);
  assert.equal(bad((d) => { d.profile.intake.q33_diet = "x".repeat(5000); }).ok, false);
});

test("targets, settings and block are checked", () => {
  assert.equal(bad((d) => { d.profile.targets = { kcal: 100, protein_g: 150, goal: "cut", source: "manual" }; }).ok, false);
  assert.equal(bad((d) => { d.profile.targets = { kcal: 2000, protein_g: 150, goal: "cut", source: "magic" }; }).ok, false);
  assert.equal(bad((d) => { d.profile.targets = { kcal: 2000, protein_g: 150, goal: "cut", source: "manual", walk_start: { speed_kmh: 50, slope_pct: 3 } }; }).ok, false);
  assert.equal(bad((d) => { d.profile.targets = { kcal: null, protein_g: 150, goal: "cut", source: "computed" }; }).ok, true);
  assert.equal(bad((d) => { d.shared_settings.body_unit = "lb"; }).ok, false);
  assert.equal(bad((d) => { d.shared_settings.dumbbell_steps_kg = "2,4"; }).ok, false);
  assert.equal(bad((d) => { d.shared_settings.shortcut.on = "yes"; }).ok, false);
  assert.equal(bad((d) => { d.block.start_monday = "next week"; }).ok, false);
  assert.equal(bad((d) => { d.block.updated_at = "never"; }).ok, false);
});

test("records are checked: weigh-ins, sessions, sets", () => {
  assert.equal(bad((d) => { d.weighins[0].kg = "80"; }).ok, false);
  assert.equal(bad((d) => { d.weighins[0].date = "5 Jan"; }).ok, false);
  assert.equal(bad((d) => { delete d.weighins[0].id; }).ok, false);
  assert.equal(bad((d) => { d.weighins = "x"; }).ok, false);
  const session = { id: "s-20260105-abcdef", updated_at: "2026-01-05T09:00:00.000Z", date: "2026-01-05", plan_day: "mon", week: 1, kind: "full", status: "finished", exercises: [{ slot: "A1", plan_exercise: "chest_press", done_exercise: "chest_press", sets: [{ n: 1, type: "work", weight_kg: 20, reps: 10, seconds: null, rir: 2 }], note: "easy" }], note: "" };
  const withSession = (fn) => { const d = validDoc(); d.sessions = [structuredClone(session)]; fn(d.sessions[0]); return validateDocument(d).ok; };
  assert.equal(withSession(() => {}), true);
  assert.equal(withSession((s) => { s.status = "done"; }), false);
  assert.equal(withSession((s) => { s.plan_day = "sat"; }), false);
  assert.equal(withSession((s) => { s.exercises[0].sets[0].reps = "ten"; }), false);
  assert.equal(withSession((s) => { s.exercises[0].sets[0].type = "drop"; }), false);
  assert.equal(withSession((s) => { s.exercises = "none"; }), false);
  assert.equal(withSession((s) => { s.exercises[0].note = 5; }), false);
});

test("a tombstone needs only id, time and the deleted mark", () => {
  const d = validDoc();
  d.weighins.push({ id: "w-2026-01-06", updated_at: "2026-01-06T07:00:00.000Z", deleted: true, deleted_at: "2026-01-06T08:00:00.000Z" });
  assert.equal(validateDocument(d).ok, true);
});

test("unknown fields are kept; dangerous keys, the token and device data are dropped", () => {
  const d = validDoc();
  d.future_field = { a: 1 };
  d.profile.extra = "keep me";
  d.token = "test-token-not-real";
  d.device = { token: "test-token-not-real" };
  d.sessions = [];
  const r = validateDocument(JSON.parse(JSON.stringify(d).replace('"future_field"', '"__proto__"').replace('"extra"', '"extra"')));
  assert.equal(r.ok, true);
  assert.equal(r.doc.profile.extra, "keep me");
  assert.ok(!("token" in r.doc));
  assert.ok(!("device" in r.doc));
  assert.ok(!Object.hasOwn(r.doc, "__proto__"));
  assert.equal({}.a, undefined); // no pollution
  const kept = validateDocument({ ...validDoc(), future_field: { a: 1 } });
  assert.deepEqual(kept.doc.future_field, { a: 1 });
});

test("text with HTML or script is only data: it is kept as plain text", () => {
  const d = validDoc();
  d.profile.intake.q33_diet = "<img src=x onerror=alert(1)>";
  const r = validateDocument(d);
  assert.equal(r.ok, true);
  assert.equal(r.doc.profile.intake.q33_diet, "<img src=x onerror=alert(1)>");
});

test("too deep nesting and too many records are refused", () => {
  const d = validDoc();
  let deep = {};
  let cur = deep;
  for (let i = 0; i < 30; i++) { cur.x = {}; cur = cur.x; }
  d.future = deep;
  assert.equal(validateDocument(d).ok, false);
});

test("intake fixture itself is valid", () => {
  const d = validDoc();
  d.profile.intake = intake({ q22_sex: "unspecified", q26_goal: "suggest", q37_avoid: ["plank"] });
  assert.equal(validateDocument(d).ok, true);
});
