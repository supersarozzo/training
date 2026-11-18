// The app's fingerprint: one SHA-256 over every file in app/ (sorted paths, each path and its bytes). Text files are
// read with Windows line ends turned into "\n", so a checkout with git's autocrlf gives the same fingerprint. A file
// with no extension (LICENSE, NOTICE, LICENSE-zxing-cpp in app/vendor) is text too (0.7.6, 8.42's follow-up).
// tests/app-version-guard.test.mjs compares it with tests/fixtures/app-stamp.json (the version and fingerprint of the
// last release). After raising APP_VERSION (js/version.js and sw.js), record the new stamp:
//   node tests/tools/app-stamp.mjs --write
// No git needed. Plain Node, no packages.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep, posix } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const APP_DIR = join(ROOT, "app");
export const STAMP_FILE = join(ROOT, "tests", "fixtures", "app-stamp.json");
const TEXT = /\.(js|mjs|css|html|json|webmanifest|svg|txt|md)$/i;

// Text or binary, by name: a known text extension, or no extension at all (licence and notice files).
export function isTextFile(rel) {
  const name = posix.basename(rel);
  return TEXT.test(name) || !name.includes(".");
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
}

export function appFiles(dir = APP_DIR) {
  return walk(dir).map((f) => relative(dir, f).split(sep).join("/")).sort();
}

export function appFingerprint(dir = APP_DIR) {
  const hash = createHash("sha256");
  for (const rel of appFiles(dir)) {
    let bytes = readFileSync(join(dir, rel));
    if (isTextFile(rel)) bytes = Buffer.from(bytes.toString("utf8").replaceAll("\r\n", "\n"), "utf8");
    hash.update(`${rel}\n${bytes.length}\n`);
    hash.update(bytes);
  }
  return hash.digest("hex");
}

export function appVersion() {
  const m = readFileSync(join(APP_DIR, "js", "version.js"), "utf8").match(/APP_VERSION = "([^"]+)"/);
  return m ? m[1] : null;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1] && process.argv.includes("--write")) {
  const stamp = { version: appVersion(), fingerprint: appFingerprint(), files: appFiles().length };
  writeFileSync(STAMP_FILE, `${JSON.stringify(stamp, null, 2)}\n`);
  console.log(`Recorded app ${stamp.version}: ${stamp.files} files.`);
}
