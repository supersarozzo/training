// Version 0.7.1 (worker 8.39): review finding R8 (docs/REVIEW-2026-11-17-redesign.md). When the same exercise is done
// twice in one workout (swap A -> B -> back to A), "Last time" and the Progress rows must show the sets of both
// records, not only the first one. Made-up values only.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { previousSets } from "../app/js/ui/stats.js";

const work = (n, kg, reps) => ({ n, type: "work", weight_kg: kg, reps, seconds: null, rir: 2, done_at: "2026-02-23T09:00:00.000Z" });
const session = (date, exercises) => ({
  id: `s-${date.replaceAll("-", "")}-x1`, updated_at: `${date}T10:00:00.000Z`, date, plan_day: "mon", week: 3, kind: "full",
  swapped_from: null, status: "finished", started_at: `${date}T08:00:00.000Z`, finished_at: `${date}T10:00:00.000Z`, walk: null, note: "", exercises,
});

test("R8-1 previousSets: the same exercise twice in one workout gives the sets of both records, in order", () => {
  const s = session("2026-02-23", [
    { slot: "A1", plan_exercise: "chest_press", done_exercise: "chest_press", swap_reason: "busy", sets: [work(1, 40, 10)], note: "" },
    { slot: "A1", plan_exercise: "chest_press", done_exercise: "db_bench_press", swap_reason: "busy", sets: [work(2, 12, 10)], note: "" },
    { slot: "C1", plan_exercise: "db_curl", done_exercise: "chest_press", swap_reason: null, sets: [work(1, 40, 9), work(2, 40, 8)], note: "" },
  ]);
  assert.deepEqual(previousSets([s], "chest_press").map((x) => [x.weight_kg, x.reps]), [[40, 10], [40, 9], [40, 8]]);
  assert.deepEqual(previousSets([s], "db_bench_press").map((x) => [x.weight_kg, x.reps]), [[12, 10]]);
});

test("R8-2 previousSets still takes only the newest workout with the exercise", () => {
  const older = session("2026-02-16", [{ slot: "A1", plan_exercise: "chest_press", done_exercise: "chest_press", swap_reason: null, sets: [work(1, 35, 12)], note: "" }]);
  const newer = session("2026-02-23", [{ slot: "A1", plan_exercise: "chest_press", done_exercise: "chest_press", swap_reason: null, sets: [work(1, 40, 10)], note: "" }]);
  assert.deepEqual(previousSets([older, newer], "chest_press").map((x) => x.weight_kg), [40]);
});

test("R8-3 the Progress history row reads every record of the exercise in that workout", () => {
  const t = readFileSync(new URL("../app/js/ui/progress.js", import.meta.url), "utf8");
  assert.doesNotMatch(t, /x\.exercises\.find\(\(r\) => r\.done_exercise === id && workSets\(r\)\.length\)/);
  assert.match(t, /x\.exercises\.filter\(\(r\) => r\.done_exercise === id\)\.flatMap\(\(r\) => workSets\(r\)\)/);
});

// C1 (HANDOVER Later list): Settings gets its own food line, like the Diet tab, so a failed food.json is never hidden
// behind the workout line ("Synced"). Shown only when GitHub is set up (else the workout line says "set up below").
test("C1-1 the Settings sync card shows the food status line", () => {
  const t = readFileSync(new URL("../app/js/ui/settings-sync.js", import.meta.url), "utf8");
  assert.match(t, /foodStatusText\(device, foodUnsynced\(\), "settings"\)/);
  assert.match(t, /const foodUnsynced = \(\) => \{ try \{ return syncer\.food\.hasUnsynced\(\); \} catch \{ return false; \} \};/);
});
