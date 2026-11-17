// Exercise pictures, videos and machines (redesign A): every exercise of the plan has a picture and a machine card,
// every photo file exists and is a real JPEG, every video is a plain https link to a known site.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { exercises, warmupMoves, upperDayWarmupExtra, extraMachines } from "../app/js/plan/plan-v2.js";
import { media, photosFor, machines, machineOf, AREAS, VIDEOS, videoFor, exercisesOn } from "../app/js/plan/media.js";

const appDir = new URL("../app/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const planIds = [...Object.keys(exercises), ...warmupMoves.map((m) => m.id), upperDayWarmupExtra.id, "uphill_walk"];

test("every exercise, warm-up move and the walk has a picture (photos or an own drawing)", () => {
  for (const id of planIds) {
    assert.ok(media[id], `no media entry for ${id}`);
    assert.ok(media[id].lib || media[id].svg, `${id} has neither photos nor a drawing`);
  }
});

test("every photo file exists, is a JPEG, and is not huge", () => {
  for (const id of Object.keys(media)) {
    const photos = photosFor(id);
    if (!photos) continue;
    assert.equal(photos.length, 2);
    for (const p of photos) {
      const full = join(appDir, p);
      assert.ok(existsSync(full), `missing ${p}`);
      const bytes = readFileSync(full);
      assert.ok(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff, `${p} is not a JPEG`);
      assert.ok(bytes.length < 400 * 1024, `${p} is too big for the phone`);
    }
  }
});

test("every exercise and warm-up move has a machine or station, and every machine is complete", () => {
  for (const id of planIds) assert.ok(machines[machineOf[id]], `${id} has no machine`);
  for (const [id, m] of Object.entries(machines)) {
    assert.ok(m.name && m.sign && m.look, `${id} lacks name, sign or look`);
    assert.ok(AREAS[m.area], `${id} has an unknown area`);
    assert.ok(photosFor(m.photo), `${id} has no picture`);
  }
});

test("every extra machine the first visit checks has a machine card", () => {
  for (const key of extraMachines) assert.ok(Object.values(machines).some((m) => m.check === key), key);
});

test("exercisesOn lists the exercises of a machine", () => {
  assert.ok(exercisesOn("leg_press").includes("leg_press"));
  assert.ok(exercisesOn("leg_press").includes("calf_raise_leg_press"));
});

test("every exercise of the plan has a form video: a plain https link to a known site, no tracking", () => {
  const allowed = ["www.youtube.com", "www.acefitness.org", "www.nhs.uk"];
  for (const id of planIds) {
    const v = videoFor(id);
    assert.ok(v, `no video for ${id}`);
    const u = new URL(v.url);
    assert.equal(u.protocol, "https:");
    assert.ok(allowed.includes(u.hostname), `${id}: ${u.hostname} is not a known site`);
    if (u.hostname === "www.youtube.com") assert.deepEqual([...u.searchParams.keys()], ["v"], `${id}: extra link parameters`);
    assert.ok(v.title && v.channel, `${id}: video title and channel are recorded`);
  }
  for (const v of Object.values(VIDEOS)) assert.ok(!/[<>"']/.test(v.url));
});
