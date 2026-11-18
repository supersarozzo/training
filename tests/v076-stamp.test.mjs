// Version 0.7.6 (worker 8.43): the stamp tool (tests/tools/app-stamp.mjs) must read files with no extension (the
// LICENSE and NOTICE files in app/vendor) as text, so a checkout with other line ends (git autocrlf on Windows, LF
// elsewhere) gives the same fingerprint (8.42's follow-up). Binary files (images, .wasm) stay byte for byte.
// Written before the fix (S-1 and S-2 fail until it). No personal data.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { isTextFile, appFingerprint, appFiles } from "./tools/app-stamp.mjs";

test("S-1 files with no extension (LICENSE, NOTICE, LICENSE-zxing-cpp) count as text; images and wasm do not", () => {
  for (const f of ["vendor/body-muscles/LICENSE", "vendor/body-muscles/NOTICE", "vendor/zxing-wasm/LICENSE-zxing-cpp", "js/main.js", "css/app.css", "index.html", "manifest.webmanifest", "icons/icon.svg"]) {
    assert.equal(isTextFile(f), true, f);
  }
  for (const f of ["icons/icon-192.png", "media/x.jpg", "media/y.webp", "vendor/zxing-wasm/zxing_reader.wasm", "media/z.mp4"]) {
    assert.equal(isTextFile(f), false, f);
  }
});

test("S-2 the fingerprint is the same with Windows or Unix line ends in LICENSE and NOTICE, and differs when a binary byte changes", () => {
  const base = mkdtempSync(join(tmpdir(), "stamp-"));
  try {
    const make = (name, eol, png) => {
      const dir = join(base, name);
      mkdirSync(join(dir, "vendor", "lib"), { recursive: true });
      mkdirSync(join(dir, "js"), { recursive: true });
      writeFileSync(join(dir, "vendor", "lib", "LICENSE"), ["MIT License", "", "Copyright (c) made-up"].join(eol));
      writeFileSync(join(dir, "vendor", "lib", "NOTICE"), ["Notice line 1", "Notice line 2"].join(eol));
      writeFileSync(join(dir, "js", "a.js"), ["export const a = 1;", ""].join(eol));
      writeFileSync(join(dir, "icon.png"), Buffer.from(png));
      return dir;
    };
    const crlf = make("crlf", "\r\n", [137, 80, 13, 10, 26, 10]);
    const lf = make("lf", "\n", [137, 80, 13, 10, 26, 10]);
    const otherPng = make("png", "\n", [137, 80, 10, 26, 10, 0]);
    assert.deepEqual(appFiles(crlf), ["icon.png", "js/a.js", "vendor/lib/LICENSE", "vendor/lib/NOTICE"]);
    assert.equal(appFingerprint(crlf), appFingerprint(lf), "line ends never change the fingerprint");
    assert.notEqual(appFingerprint(lf), appFingerprint(otherPng), "a binary file is read byte for byte (its \\r\\n stays)");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("S-3 the real app folder still has its LICENSE and NOTICE files, and the default folder is app/", () => {
  const files = appFiles();
  assert.ok(files.includes("vendor/body-muscles/LICENSE"));
  assert.ok(files.includes("vendor/body-muscles/NOTICE"));
  assert.match(appFingerprint(), /^[0-9a-f]{64}$/);
});
