// Exercise pictures, form videos and the gym's machines (JUDGING.md 3.3 "also test first", 3.4, 3.6 item 2).
// Merged from builders A (6 tests) and C (4 tests), plus the judges' picks. Pure checks: no page.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { exercises, warmupMoves, upperDayWarmupExtra, extraMachines, days, DAY_IDS } from "../app/js/plan/plan-v2.js";
import { media, photosFor, machines, machineOf, AREAS, VIDEOS, videoFor, exercisesOn, SIGN_CAVEAT } from "../app/js/plan/media.js";
import { MACHINE_IDS } from "../app/js/plan/machine-ids.js";

const APP = fileURLToPath(new URL("../app/", import.meta.url));
const planIds = [...Object.keys(exercises), ...warmupMoves.map((m) => m.id), upperDayWarmupExtra.id, "uphill_walk"];
const dayIds = [...new Set(DAY_IDS.flatMap((d) => days[d].slots.map((s) => s.ex)))];

test("every exercise, every swap, every warm-up move and the walk has a picture (photos or an own drawing)", () => {
  const swapIds = Object.values(exercises).flatMap((e) => e.swaps.map((s) => s.id));
  for (const id of new Set([...planIds, ...swapIds])) {
    assert.ok(media[id], `no media entry for ${id}`);
    assert.ok(media[id].lib || media[id].svg, `${id} has neither photos nor a drawing`);
  }
});

test("every photo file exists, is a JPEG, two per entry, and is not huge", () => {
  for (const id of Object.keys(media)) {
    const photos = photosFor(id);
    if (!photos) continue;
    assert.equal(photos.length, 2);
    for (const p of photos) {
      const full = join(APP, p);
      assert.ok(existsSync(full), `missing ${p}`);
      const bytes = readFileSync(full);
      assert.ok(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff, `${p} is not a JPEG`);
      assert.ok(bytes.length > 2000 && bytes.length < 400 * 1024, `${p} size ${bytes.length}`);
    }
  }
});

test("photo match: every entry says same or close; a close match has a one-line note", () => {
  for (const [id, m] of Object.entries(media)) {
    if (!m.lib) continue;
    assert.ok(m.match === "same" || m.match === "close", `${id} match`);
    if (m.match === "close") assert.ok(typeof m.matchNote === "string" && m.matchNote.length > 10 && m.matchNote.length < 140, `${id} matchNote`);
  }
  for (const id of ["hip_thrust", "romanian_deadlift", "db_glute_bridge", "cable_lateral_raise", "pulldown", "uphill_walk", "chest_press"]) {
    assert.equal(media[id].match, "close", `${id} is a close match (Judge 3)`);
  }
  assert.match(media.db_glute_bridge.matchNote, /dumbbell/i);
});

test("the judges' library picks are used (Judge 3, section 3)", () => {
  const picks = {
    shoulder_press_machine: "Machine_Shoulder_Military_Press", rear_delt_raise: "Dumbbell_Lying_Rear_Lateral_Raise",
    seated_db_shoulder_press: "Dumbbell_Shoulder_Press", lat_pulldown_machine: "Close-Grip_Front_Lat_Pulldown",
    seated_row_machine: "Leverage_Iso_Row", db_glute_bridge: "Barbell_Glute_Bridge", leg_curl_machine: "Seated_Leg_Curl",
    chest_press: "Leverage_Chest_Press",
  };
  for (const [id, lib] of Object.entries(picks)) assert.equal(media[id].lib, lib, id);
});

test("every exercise and warm-up move has a machine or station; every machine card is complete", () => {
  for (const id of planIds) assert.ok(machines[machineOf[id]], `${id} has no machine`);
  for (const [id, m] of Object.entries(machines)) {
    assert.ok(m.name && m.sign && m.look && m.tip, `${id} lacks name, sign, look or tip`);
    assert.ok(AREAS[m.area], `${id} has an unknown area`);
    assert.ok(photosFor(m.photo) || m.drawing, `${id} has no picture`);
  }
  assert.match(SIGN_CAVEAT, /may differ/i);
});

test("machine cards use exactly the frozen machine-id list (notes are saved under these ids)", () => {
  assert.deepEqual(Object.keys(machines).sort(), [...MACHINE_IDS].sort());
  for (const id of Object.values(machineOf)) assert.ok(MACHINE_IDS.includes(id), id);
});

test("every extra machine the first visit checks has a machine card with the same key", () => {
  for (const key of extraMachines) assert.ok(machines[key] && machines[key].check === key, key);
});

test("the chest press card does not promise a weight stack under a plate-loaded photo", () => {
  assert.ok(!/stack|pin/i.test(machines.chest_press.look), machines.chest_press.look);
});

test("exercisesOn lists the exercises of a machine", () => {
  assert.ok(exercisesOn("leg_press").includes("leg_press"));
  assert.ok(exercisesOn("leg_press").includes("calf_raise_leg_press"));
  assert.deepEqual(exercisesOn("pec_deck"), []);
});

test("every exercise of the plan has a form video: a plain https YouTube link, no extra parameters, channel recorded", () => {
  for (const id of planIds) {
    const v = videoFor(id);
    assert.ok(v, `no video for ${id}`);
    assert.match(v.url, /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/, `${id} url`);
    assert.ok(v.channel, `${id}: channel recorded`);
  }
  for (const id of dayIds) assert.ok(videoFor(id), id);
  for (const v of Object.values(VIDEOS)) assert.ok(!/[<>"']/.test(v.url));
});

test("the judges' best video per exercise is used (Judge 3, section 4); no 5-6 minute picks or swear-word titles", () => {
  const best = {
    chest_press: "sqNwDkUU_Ps", pulldown: "VIJPZ8m0EDM", shoulder_press_machine: "TnhIyp4kmO8", one_arm_db_row: "KRN38chlkds",
    db_curl: "cBSD6mQIPQk", triceps_pushdown: "LXkCrxn3caQ", plank: "rerKy2AEHz4", dead_bug: "GbSC02oU3To", cable_crunch: "ToJeyhydUxU",
    romanian_deadlift: "FQKfr1YDhEk", face_pull: "eFxMixk_qPQ", hip_thrust: "SEdqd1n0cvg", leg_extension: "YyvSfVjQeL0",
    goblet_squat: "zBV3ceGyAxw", lateral_raise: "XPPfnSEATJA", hammer_curl: "zC3nLlEvin4", overhead_triceps_ext: "kqidUIf1eJE",
    side_plank: "Oe9Tp9SvTCE", seated_cable_row: "GZbfZ033f74", seated_db_shoulder_press: "HzIiNhHhhtA", reverse_crunch: "XY8KzdDcMFg",
    cable_pull_through: "pv8e6OSyETE", calf_raise_standing: "hh5516HCu4k", cable_curl: "GNlopToAZyg", rear_delt_raise: "X5kmqWnprvI",
    db_glute_bridge: "cruqsnAyU6A", calf_raise_leg_press: "dhRz1Ns60Zg", lat_pulldown_machine: "AOpi-p0cJkc",
    seated_row_machine: "TeFo51Q_Nsc", leg_curl_machine: "ELOCsoDSmrg", calf_raise_machine: "YMmgqO8Jo-k", arm_swings: "p7EnbCprr5w",
    uphill_walk: "HxsFneJFM2c",
  };
  for (const [id, vid] of Object.entries(best)) assert.equal(new URL(videoFor(id).url).searchParams.get("v"), vid, id);
  for (const v of Object.values(VIDEOS)) assert.ok(!/fuck|shit|damn/i.test(v.title ?? ""), v.url);
});

test("sw.js precaches every photo", () => {
  const sw = readFileSync(join(APP, "sw.js"), "utf8");
  for (const id of Object.keys(media)) for (const p of photosFor(id) ?? []) assert.ok(sw.includes(`"${p}"`), p);
});
