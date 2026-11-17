// Logger numbers (app/js/ui/stats.js, from builder C): last time's sets (the PREVIOUS button), bests, chart series,
// volume and the week strip. Pure checks: no page. Test values are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { previousSets, bestBefore, beatsBest, seriesFor, setText, fmtKg, volumeOf, weekDays } from "../app/js/ui/stats.js";

// ---------- stats.js ----------
const S = (date, exId, sets, status = "finished") => ({
  id: `s-${date}`, date, status, finished_at: `${date}T18:00:00.000Z`, exercises: [{ slot: "A1", done_exercise: exId, sets: sets.map((x, i) => ({ n: i + 1, type: "work", ...x })) }],
});

test("previousSets returns the newest finished workout's working sets", () => {
  const sessions = [
    S("2026-03-02", "chest_press", [{ weight_kg: 30, reps: 10 }]),
    S("2026-03-09", "chest_press", [{ weight_kg: 32.5, reps: 9 }, { weight_kg: 32.5, reps: 8 }]),
    S("2026-03-16", "chest_press", [{ weight_kg: 50, reps: 1 }], "active"),
  ];
  assert.deepEqual(previousSets(sessions, "chest_press").map((x) => [x.weight_kg, x.reps]), [[32.5, 9], [32.5, 8]]);
  assert.deepEqual(previousSets(sessions, "pulldown"), []);
});

test("bestBefore and beatsBest: more weight, or the same weight with more reps; never on the first time", () => {
  const sessions = [S("2026-03-02", "chest_press", [{ weight_kg: 30, reps: 12 }, { weight_kg: 32.5, reps: 8 }])];
  const best = bestBefore(sessions, "chest_press");
  assert.deepEqual(best, { weight: 32.5, repsAtWeight: 8 });
  assert.equal(beatsBest("chest_press", { weight_kg: 32.5, reps: 9 }, best), true);
  assert.equal(beatsBest("chest_press", { weight_kg: 32.5, reps: 8 }, best), false);
  assert.equal(beatsBest("chest_press", { weight_kg: 35, reps: 1 }, best), true);
  assert.equal(beatsBest("chest_press", { weight_kg: 30, reps: 20 }, best), false);
  assert.equal(beatsBest("chest_press", { weight_kg: 40, reps: 10 }, bestBefore([], "chest_press")), false);
});

test("seriesFor is oldest first, one heaviest value per workout; setText and fmtKg read well", () => {
  const sessions = [S("2026-03-09", "chest_press", [{ weight_kg: 32.5, reps: 9 }]), S("2026-03-02", "chest_press", [{ weight_kg: 30, reps: 10 }, { weight_kg: 31, reps: 6 }])];
  assert.deepEqual(seriesFor(sessions, "chest_press").map((p) => p.y), [31, 32.5]);
  assert.equal(setText("chest_press", { weight_kg: 32.5, reps: 10 }), "32.5 × 10");
  assert.equal(setText("chest_press", null), "–");
  assert.equal(fmtKg(40), "40");
  assert.equal(fmtKg(12.25), "12.3");
});

test("volumeOf adds weight × reps of working sets only", () => {
  const s = S("2026-03-02", "chest_press", [{ weight_kg: 30, reps: 10 }, { weight_kg: 30, reps: 8 }]);
  s.exercises[0].sets.push({ n: 3, type: "warmup", weight_kg: 15, reps: 10 });
  assert.equal(volumeOf(s), 540);
});

test("weekDays: Monday to Sunday with done, missed, today, next and rest", () => {
  const sessions = [S("2026-03-02", "chest_press", [{ weight_kg: 30, reps: 10 }])];
  const w = weekDays(sessions, "2026-03-04");
  assert.equal(w.length, 7);
  assert.deepEqual(w.map((d) => d.state), ["done", "missed", "today", "next", "next", "rest", "rest"]);
  assert.equal(w[0].date, "2026-03-02");
});
