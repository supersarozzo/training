// Version 0.7.6 (worker 8.43): the release pin. APP_VERSION is 0.7.6 in js/version.js and at the top of sw.js, and the
// app stamp (tests/fixtures/app-stamp.json) is recorded for it (RUNBOOK release step 2b).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("V0 version: 0.7.6 in js/version.js and at the top of sw.js; the stamp is recorded for 0.7.6", async () => {
  const { APP_VERSION } = await import("../app/js/version.js");
  assert.equal(APP_VERSION, "0.7.6");
  assert.equal(readFileSync(new URL("../app/sw.js", import.meta.url), "utf8").match(/const APP_VERSION = "([^"]+)"/)[1], "0.7.6");
  assert.equal(JSON.parse(readFileSync(new URL("./fixtures/app-stamp.json", import.meta.url), "utf8")).version, "0.7.6");
});
