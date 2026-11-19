// Version 0.7.6 (worker 8.43): the release pin. APP_VERSION is 0.7.6 in js/version.js and at the top of sw.js, and the
// app stamp (tests/fixtures/app-stamp.json) is recorded for it (RUNBOOK release step 2b).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// 0.7.7 (worker 8.44): "0.7.6 or later", the same in both files; tests/v077-release.test.mjs V0 pins 0.7.7.
test("V0 version: 0.7.6 or later in js/version.js, the same at the top of sw.js", async () => {
  const { APP_VERSION } = await import("../app/js/version.js");
  const n = APP_VERSION.split(".").map(Number);
  assert.ok(n[0] > 0 || n[1] > 7 || (n[1] === 7 && n[2] >= 6), APP_VERSION);
  assert.equal(readFileSync(new URL("../app/sw.js", import.meta.url), "utf8").match(/const APP_VERSION = "([^"]+)"/)[1], APP_VERSION);
});
