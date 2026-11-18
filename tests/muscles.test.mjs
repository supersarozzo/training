// Muscle and equipment data (build step 1 of redesign/plan-diet/judge/JUDGING.md section 7).
// Public plan data, but delicate: the body maps, the swap list and the muscle check all read it.
// Reference: free-exercise-db (public domain), the entry each exercise already uses for its photo
// (app/js/plan/media.js `lib`), copied into tests/fixtures/free-exercise-db-muscles.json.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { exercises, days } from "../app/js/plan/plan-v2.js";
import { media } from "../app/js/plan/media.js";

const load = (p) => import(p).catch((e) => ({ loadError: e }));
const M = await load("../app/js/plan/muscles.js");
const SHAPES = await load("../app/vendor/body-muscles/shapes.js");
const FEDB = JSON.parse(readFileSync(new URL("./fixtures/free-exercise-db-muscles.json", import.meta.url), "utf8"));

function mod() {
  assert.ok(!M.loadError, `app/js/plan/muscles.js must exist and load (${M.loadError?.message})`);
  return M;
}

// The 17 muscle names free-exercise-db uses (its schema.json).
const FEDB_NAMES = ["abdominals", "abductors", "adductors", "biceps", "calves", "chest", "forearms", "glutes", "hamstrings",
  "lats", "lower back", "middle back", "neck", "quadriceps", "shoulders", "traps", "triceps"];

const planIds = [...new Set(Object.values(days).flatMap((d) => d.slots.map((s) => s.ex)))];
const swapOnlyIds = Object.keys(exercises).filter((id) => !planIds.includes(id));
const allIds = Object.keys(exercises);

test("the plan has 29 exercises in its days and 10 swap-only ones (plan change 2026-11-18)", () => {
  assert.equal(planIds.length, 29); // 27 + calf raise on the leg press + dumbbell lying leg curl
  assert.equal(swapOnlyIds.length, 10); // 9 - calf raise on the leg press + one-leg dumbbell calf raise + cable leg curl
  for (const id of allIds) for (const s of exercises[id].swaps) assert.ok(exercises[s.id], `${id} swap ${s.id} is a known exercise`);
});

test("our muscle list: front / side / rear shoulders apart, lats and mid back apart, each tied to one free-exercise-db name", () => {
  const { MUSCLES } = mod();
  for (const id of ["front_delts", "side_delts", "rear_delts", "lats", "mid_back"]) assert.ok(MUSCLES[id], `${id} is in the list`);
  for (const id of ["shoulders", "back", "delts"]) assert.equal(MUSCLES[id], undefined, `no catch-all "${id}" group`);
  for (const [id, m] of Object.entries(MUSCLES)) {
    assert.match(id, /^[a-z_]+$/);
    assert.ok(typeof m.name === "string" && m.name.length > 0 && m.name.length <= 20, `${id} has a short name`);
    assert.ok(FEDB_NAMES.includes(m.fedb), `${id}.fedb "${m.fedb}" is a free-exercise-db name`);
    assert.ok(["front", "back"].includes(m.view), `${id}.view is front or back`);
  }
  for (const part of ["front_delts", "side_delts", "rear_delts"]) assert.equal(MUSCLES[part].fedb, "shoulders");
  assert.equal(MUSCLES.lats.fedb, "lats");
  assert.equal(MUSCLES.mid_back.fedb, "middle back");
  // Every free-exercise-db name our exercises meet has a group of ours.
  const ours = new Set(Object.values(MUSCLES).map((m) => m.fedb));
  for (const e of Object.values(FEDB.entries)) for (const n of [...e.primaryMuscles, ...e.secondaryMuscles]) assert.ok(ours.has(n), `"${n}" has a group`);
});

test("equipment classes are a small fixed list", () => {
  const { EQUIPMENT } = mod();
  assert.deepEqual(Object.keys(EQUIPMENT).sort(), ["bodyweight", "cable", "dumbbell", "machine", "smith"]);
  for (const [id, e] of Object.entries(EQUIPMENT)) {
    assert.ok(e.name && e.family, `${id} has a name and a family`);
  }
});

test("every plan and swap-only exercise has main muscles, helpers and an equipment class from our lists", () => {
  const { MUSCLES, EQUIPMENT, exerciseMuscles } = mod();
  assert.deepEqual(Object.keys(exerciseMuscles).sort(), [...allIds].sort(), "one entry per exercise, no extras");
  for (const id of allIds) {
    const e = exerciseMuscles[id];
    assert.ok(Array.isArray(e.main) && e.main.length >= 1, `${id}: at least one main muscle`);
    assert.ok(Array.isArray(e.helpers), `${id}: helpers is a list (may be empty)`);
    for (const m of [...e.main, ...e.helpers]) assert.ok(MUSCLES[m], `${id}: "${m}" is in our muscle list`);
    assert.equal(new Set(e.main).size, e.main.length, `${id}: no repeat in main`);
    assert.equal(new Set(e.helpers).size, e.helpers.length, `${id}: no repeat in helpers`);
    for (const m of e.main) assert.ok(!e.helpers.includes(m), `${id}: ${m} is not main and helper at once`);
    assert.ok(EQUIPMENT[e.equip], `${id}: equipment class "${e.equip}" is known`);
  }
});

test("the equipment class fits how the plan moves the weight", () => {
  const { exerciseMuscles } = mod();
  const fits = { stack: ["machine", "cable"], dumbbell: ["dumbbell"], bodyweight: ["bodyweight"], "smith_2x2.5": ["smith", "machine"] };
  for (const id of allIds) {
    const allowed = fits[exercises[id].step];
    assert.ok(allowed, `${id}: step ${exercises[id].step} is known`);
    assert.ok(allowed.includes(exerciseMuscles[id].equip), `${id}: step ${exercises[id].step} does not fit "${exerciseMuscles[id].equip}"`);
  }
  // The machines only a first visit can confirm are machines.
  for (const id of allIds) for (const s of exercises[id].swaps) if (s.needsMachine) assert.equal(exerciseMuscles[s.id].equip, "machine", s.id);
});

test("the reference file holds the free-exercise-db entry of every exercise", () => {
  assert.match(FEDB.commit, /^[0-9a-f]{40}$/);
  for (const id of allIds) {
    const lib = media[id]?.lib;
    assert.ok(lib, `${id} has a free-exercise-db id in media.js`);
    const e = FEDB.entries[lib];
    assert.ok(e, `${id}: ${lib} is in the reference file`);
    assert.ok(e.primaryMuscles.length >= 1, `${lib} has a primary muscle`);
    for (const n of [...e.primaryMuscles, ...e.secondaryMuscles]) assert.ok(FEDB_NAMES.includes(n), `${lib}: ${n}`);
  }
});

// free-exercise-db has one "shoulders". Which part we read it as, by research 4.2: presses = front,
// lateral raises = side, face pull and rear-delt raise = rear, pulls (rows, pulldowns) as helpers = rear.
// Holding a weight at the chest (goblet squat) = front; the side plank's held-out shoulder = side.
// A new exercise whose entry lists "shoulders" fails here until someone decides its part.
const SHOULDER_PART = {
  chest_press: "front_delts", db_bench_press: "front_delts", incline_db_press: "front_delts",
  shoulder_press_machine: "front_delts", seated_db_shoulder_press: "front_delts", goblet_squat: "front_delts",
  lateral_raise: "side_delts", cable_lateral_raise: "side_delts", side_plank: "side_delts",
  face_pull: "rear_delts", rear_delt_raise: "rear_delts",
  pulldown: "rear_delts", lat_pulldown_machine: "rear_delts", one_arm_db_row: "rear_delts", seated_cable_row: "rear_delts",
};

function differences(id) {
  const { MUSCLES, exerciseMuscles } = M;
  const e = exerciseMuscles[id];
  const ref = FEDB.entries[media[id].lib];
  const out = [];
  for (const [ours, theirs, label] of [[e.main, ref.primaryMuscles, "main"], [e.helpers, ref.secondaryMuscles, "helpers"]]) {
    const mapped = new Set(ours.map((m) => MUSCLES[m].fedb));
    const want = new Set(theirs);
    for (const n of want) if (!mapped.has(n)) out.push(`${label}: free-exercise-db has "${n}", we do not`);
    for (const n of mapped) if (!want.has(n)) out.push(`${label}: we have "${n}", free-exercise-db does not`);
    const parts = ours.filter((m) => MUSCLES[m].fedb === "shoulders");
    if (parts.length > 1) out.push(`${label}: ${parts.join(" + ")} where free-exercise-db has one "shoulders"`);
    if (parts.length === 1 && want.has("shoulders") && SHOULDER_PART[id] !== parts[0]) {
      out.push(`${label}: shoulders read as ${parts[0]}, the rule says ${SHOULDER_PART[id] ?? "(no rule yet)"}`);
    }
  }
  return out;
}

test("every exercise matches free-exercise-db, or marks its own reading with a reason", () => {
  const { exerciseMuscles } = mod();
  const unmarked = [];
  for (const id of allIds) {
    const diff = differences(id);
    const own = exerciseMuscles[id].own;
    if (diff.length === 0) {
      assert.equal(own, undefined, `${id} matches free-exercise-db: remove its "own" mark`);
      continue;
    }
    if (!own) { unmarked.push(`${id}: ${diff.join("; ")}`); continue; }
    assert.ok(typeof own.reason === "string" && own.reason.trim().length >= 20, `${id}: own reading needs a reason in words`);
  }
  assert.deepEqual(unmarked, [], "differences from free-exercise-db without an own-reading mark");
});

test("the shoulder rule covers exactly the exercises whose entry lists shoulders", () => {
  mod();
  const withShoulders = allIds.filter((id) => {
    const r = FEDB.entries[media[id].lib];
    return [...r.primaryMuscles, ...r.secondaryMuscles].includes("shoulders");
  });
  assert.deepEqual(Object.keys(SHOULDER_PART).sort(), withShoulders.sort());
});

test("the check catches a planted wrong muscle (the test can fail)", () => {
  const { exerciseMuscles } = mod();
  // Planted on exercises that match free-exercise-db exactly, so each planted change is the only difference.
  // (Until 2026-11-18 this used leg_press; the trainer's muscle fixes made leg_press an own reading, see below.)
  const saved = exerciseMuscles.leg_extension;
  const savedChest = exerciseMuscles.chest_press;
  try {
    assert.deepEqual(differences("leg_extension"), []);
    assert.deepEqual(differences("chest_press"), []);
    exerciseMuscles.leg_extension = { ...saved, main: ["hamstrings"] };
    assert.ok(differences("leg_extension").length > 0);
    exerciseMuscles.chest_press = { ...savedChest, helpers: savedChest.helpers.filter((m) => m !== "triceps") };
    assert.ok(differences("chest_press").length > 0);
    exerciseMuscles.chest_press = { ...savedChest, helpers: ["side_delts", "triceps"] };
    assert.ok(differences("chest_press").some((d) => d.includes("rule says front_delts")));
  } finally {
    exerciseMuscles.leg_extension = saved;
    exerciseMuscles.chest_press = savedChest;
  }
});

test("the body drawing: licence files kept, every muscle we use can be drawn", () => {
  const { MUSCLES, exerciseMuscles, partMuscle } = mod();
  assert.ok(!SHAPES.loadError, `app/vendor/body-muscles/shapes.js must exist (${SHAPES.loadError?.message})`);
  const dir = new URL("../app/vendor/body-muscles/", import.meta.url);
  for (const f of ["LICENSE", "NOTICE", "CHANGES.md"]) assert.ok(existsSync(new URL(f, dir)), `${f} is kept`);
  assert.match(readFileSync(new URL("LICENSE", dir), "utf8"), /Apache License\s+Version 2\.0/);
  assert.match(readFileSync(new URL("NOTICE", dir), "utf8"), /Ivan Vulovi/);
  const parts = [...SHAPES.FRONT, ...SHAPES.BACK];
  assert.ok(parts.length > 50);
  const ids = new Set();
  for (const [id, d] of parts) {
    assert.match(id, /^[a-z-]+$/);
    // Path letters, numbers (an exponent such as 4.9e-4 is valid SVG), spaces and commas only: nothing else can hide in it.
    assert.match(d, /^[mM][-0-9., eEmlhvcszMLHVCSZ]+$/, `${id}: a plain SVG path`);
    ids.add(id);
    const g = partMuscle(id);
    if (g !== null) assert.ok(MUSCLES[g], `${id} -> ${g} is in our list`);
  }
  assert.equal(ids.size, parts.length, "part ids are unique");
  const drawn = new Set(parts.map(([id]) => partMuscle(id)).filter(Boolean));
  for (const e of Object.values(exerciseMuscles)) for (const m of [...e.main, ...e.helpers]) assert.ok(drawn.has(m), `${m} has a shape`);
  for (const part of ["front_delts", "side_delts", "rear_delts", "lats", "mid_back"]) assert.ok(drawn.has(part), `${part} is drawn on its own`);
});

// Trainer decisions M1 to M9 (docs/plan/2026-11-18-trainer-decisions.md), from the muscle-map check
// (docs/research/2026-11-18-muscle-map-check.md): each fix is backed by at least 2 sources that agree.
const TRAINER_FIXES_2026_11_18 = {
  leg_press: { main: ["quads"], helpers: ["glutes", "adductors"] },
  goblet_squat: { main: ["quads"], helpers: ["glutes", "adductors", "calves"] },
  smith_squat: { main: ["quads"], helpers: ["glutes", "adductors", "calves", "lower_back"] },
  hip_thrust: { main: ["glutes"], helpers: ["hamstrings"] },
  db_glute_bridge: { main: ["glutes"], helpers: ["hamstrings"] },
  // 0.7.1, trainer T5 (docs/plan/2026-11-18-trainer-weekly-plan.md 7.1): rows have main lats + mid back.
  seated_row_machine: { main: ["lats", "mid_back"], helpers: ["biceps", "rear_delts"] },
  hammer_curl: { main: ["biceps"], helpers: ["forearms"] },
  cable_curl: { main: ["biceps"], helpers: ["forearms"] },
  side_plank: { main: ["abs"], helpers: ["glutes"] },
  cable_lateral_raise: { main: ["side_delts"], helpers: [] },
  rear_delt_raise: { main: ["rear_delts"], helpers: ["mid_back"] },
  shoulder_press_machine: { main: ["front_delts"], helpers: ["triceps", "side_delts"] },
  seated_db_shoulder_press: { main: ["front_delts"], helpers: ["triceps", "side_delts"] },
};

test("trainer muscle fixes 2026-11-18: the 13 exercises have the decided main muscles and helpers, each with a reason", () => {
  const { exerciseMuscles } = mod();
  for (const [id, want] of Object.entries(TRAINER_FIXES_2026_11_18)) {
    assert.deepEqual(exerciseMuscles[id].main, want.main, `${id} main`);
    assert.deepEqual(exerciseMuscles[id].helpers, want.helpers, `${id} helpers`);
    assert.ok(exerciseMuscles[id].own?.reason, `${id} differs from free-exercise-db, so it carries its reason`);
  }
  // No calves where the ankle does not move; no hamstrings as helpers of squats or the leg press.
  for (const id of ["leg_press", "hip_thrust", "db_glute_bridge"]) assert.ok(!exerciseMuscles[id].helpers.includes("calves"), id);
  for (const id of ["leg_press", "goblet_squat", "smith_squat"]) assert.ok(!exerciseMuscles[id].helpers.includes("hamstrings"), id);
  // Decision M4, finished in 0.7.1 (trainer T5): the muscle check now counts a set once per row (planview.js rowSets),
  // so the rows have main lats + mid back. Every other exercise keeps one main muscle.
  const ROWS_TWO_MAIN = ["one_arm_db_row", "seated_cable_row", "seated_row_machine"];
  for (const id of ROWS_TWO_MAIN) {
    assert.deepEqual(exerciseMuscles[id].main, ["lats", "mid_back"], id);
    assert.ok(!exerciseMuscles[id].helpers.includes("lats") && !exerciseMuscles[id].helpers.includes("mid_back"), id);
  }
  for (const id of Object.keys(exerciseMuscles)) if (!ROWS_TWO_MAIN.includes(id)) assert.equal(exerciseMuscles[id].main.length, 1, `${id}: one main muscle`);
});
