import test from "node:test";
import assert from "node:assert/strict";
import { newId, randomChars, ymd, weighinId, exerciseStateId, nowUtc, localDate } from "../app/js/ids.js";

const fixedNow = new Date("2026-11-17T18:42:07.311Z");

test("newId has the format <kind>-<yyyymmdd>-<6 chars>", () => {
  assert.match(newId("s", fixedNow), /^s-20261117-[a-z0-9]{6}$/);
});

test("newId with fixed bytes is predictable", () => {
  const bytes = (n) => new Uint8Array(n).fill(0);
  assert.equal(newId("m", fixedNow, bytes), "m-20261117-aaaaaa");
});

test("two ids differ", () => {
  assert.notEqual(newId("s", fixedNow), newId("s", fixedNow));
});

test("randomChars only uses letters and digits", () => {
  assert.match(randomChars(200), /^[a-z0-9]{200}$/);
});

test("special ids", () => {
  assert.equal(weighinId("2026-11-23"), "w-2026-11-23");
  assert.equal(exerciseStateId("chest_press"), "x-chest_press");
});

test("times", () => {
  assert.equal(ymd(fixedNow), "20261117");
  assert.equal(nowUtc(fixedNow), "2026-11-17T18:42:07.311Z");
  assert.match(localDate(fixedNow), /^2026-11-1[78]$/);
});
