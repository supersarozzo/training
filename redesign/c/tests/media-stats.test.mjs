// Redesign C: the exercise pictures, machine cards and videos (plan/media.js) and the logger numbers (ui/stats.js).
// Pure checks: no page. Test values are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { exercises, days, DAY_IDS } from "../app/js/plan/plan-v2.js";
import { machines, AREAS, exerciseMedia, otherMedia, videos, photosFor, machineFor } from "../app/js/plan/media.js";
import { previousSets, bestBefore, beatsBest, seriesFor, setText, fmtKg, volumeOf, weekDays } from "../app/js/ui/stats.js";

const APP = fileURLToPath(new URL("../app/", import.meta.url));
const planIds = [...new Set(DAY_IDS.flatMap((d) => days[d].slots.map((s) => s.ex)))];

test("every exercise in the plan and every swap has a picture entry", () => {
  const swapIds = Object.values(exercises).flatMap((e) => e.swaps.map((s) => s.id));
  for (const id of new Set([...planIds, ...swapIds])) assert.ok(exerciseMedia[id], `no media entry for ${id}`);
});

test("every photo file exists and is a real picture (not empty)", () => {
  for (const id of [...Object.keys(exerciseMedia), ...Object.keys(otherMedia)]) {
    const p = photosFor(id);
    if (!p) { assert.equal((exerciseMedia[id] ?? otherMedia[id]).svg, true, `${id} has no photos and no drawing`); continue; }
    for (const rel of p) {
      assert.ok(existsSync(APP + rel), `missing ${rel}`);
      assert.ok(statSync(APP + rel).size > 2000, `${rel} looks empty`);
    }
  }
});

test("every machine card is complete and points to a real area and photo", () => {
  for (const [id, m] of Object.entries(machines)) {
    assert.ok(m.name && m.sign && m.look, `${id} misses a name, sign or look`);
    assert.ok(AREAS[m.area], `${id} has an unknown area`);
    assert.ok(photosFor(m.photo), `${id} photo ${m.photo} has no pictures`);
  }
  for (const [id, x] of Object.entries({ ...exerciseMedia, ...otherMedia })) {
    if (x.machine) assert.ok(machines[x.machine], `${id} points to unknown machine ${x.machine}`);
  }
  assert.equal(machineFor("chest_press"), "chest_press");
  assert.equal(machineFor("no_such_exercise"), null);
});

test("every video is an https YouTube link with a source and a title, and the plan exercises have one", () => {
  for (const [id, v] of Object.entries(videos)) {
    assert.match(v.url, /^https:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{11}$/, `${id} url`);
    assert.ok(v.by && v.title, `${id} misses its source or title`);
  }
  for (const id of planIds) assert.ok(videos[id], `no video for plan exercise ${id}`);
});

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
