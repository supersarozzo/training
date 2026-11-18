// Follow-up from 8.40 (C1): a test that fails when any file in app/ changed since the last version but APP_VERSION
// did not. Without git: tests/fixtures/app-stamp.json holds the version and a fingerprint of every app/ file at the
// last release (tests/tools/app-stamp.mjs). A phone only fetches new files when the version goes up (sw.js caches
// training-<APP_VERSION>), so a change without a new version would never reach the phone.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { appFingerprint, appVersion, STAMP_FILE } from "./tools/app-stamp.mjs";

const stamp = JSON.parse(readFileSync(STAMP_FILE, "utf8"));
// "0.7.10" is newer than "0.7.9": compare number by number.
const newer = (a, b) => {
  const x = a.split(".").map(Number), y = b.split(".").map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0);
  return false;
};

test("G1 app/ files changed since the last stamp means APP_VERSION went up, and the stamp is recorded for it", () => {
  const now = appFingerprint();
  const version = appVersion();
  if (now === stamp.fingerprint) {
    assert.equal(version, stamp.version, "same files, so the same version");
    return;
  }
  assert.notEqual(version, stamp.version,
    `Files in app/ changed but APP_VERSION is still ${version}. Raise it in app/js/version.js and app/sw.js, then run: node tests/tools/app-stamp.mjs --write`);
  assert.ok(newer(version, stamp.version), `APP_VERSION ${version} must be newer than the last stamp ${stamp.version} (never lower it)`);
  assert.fail(`APP_VERSION is ${version} (last stamp ${stamp.version}). When this version is finished, record it: node tests/tools/app-stamp.mjs --write`);
});

test("G2 the guard's own pieces: the version compare and the stamp file", () => {
  assert.ok(newer("0.7.4", "0.7.3"));
  assert.ok(newer("0.7.10", "0.7.9"));
  assert.ok(newer("1.0.0", "0.9.9"));
  assert.ok(!newer("0.7.3", "0.7.3"));
  assert.ok(!newer("0.7.2", "0.7.3"));
  assert.match(stamp.version, /^\d+\.\d+\.\d+$/);
  assert.match(stamp.fingerprint, /^[0-9a-f]{64}$/);
});
