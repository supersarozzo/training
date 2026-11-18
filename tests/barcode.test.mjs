// Barcode scan (build step 8, delicate; answer 63 a). Written before the code (tests first).
// - The check digit is tested before any lookup ("No lookup was made").
// - The reader is zxing-wasm 3.1.7, served from our own site, with its licence files; prepareZXingModule is pointed at
//   our own .wasm (never the jsDelivr default); no script from another site.
// - The camera stops when a good code is read, when the scanner closes, and before any route change.
// - CSP: only script-src 'self' 'wasm-unsafe-eval' and connect-src + https://world.openfoodfacts.org change.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { checkDigitOk, normalizeBarcode, foodIdFor, BARCODE_WORDS } from "../app/js/food/barcode.js";
import { createScanner, loadReader, READ_OPTIONS, ZXING_VERSION, WASM_SHA256 } from "../app/js/food/scanner.js";

const app = (p) => new URL(`../app/${p}`, import.meta.url);
const read = (p) => readFileSync(app(p), "utf8");
const VENDOR = "vendor/zxing-wasm/";

// ---------- check digit ----------

test("B1 check digit: EAN-13, EAN-8 and UPC-A right ones pass, a changed digit fails", () => {
  for (const ok of ["5000159484695", "4006381333931", "96385074", "036000291452", "5000000000012"]) assert.equal(checkDigitOk(ok), true, ok);
  for (const bad of ["5000159484696", "4006381333932", "96385075", "036000291453", "5000000000017"]) assert.equal(checkDigitOk(bad), false, bad);
  assert.equal(checkDigitOk(""), false);
  assert.equal(checkDigitOk("abc"), false);
});

test("B2 normalize: spaces and dashes go; UPC-A becomes its 13-digit form; wrong length or check digit says why", () => {
  assert.deepEqual(normalizeBarcode(" 5000 1594-84695 "), { ok: true, code: "5000159484695" });
  assert.deepEqual(normalizeBarcode("036000291452"), { ok: true, code: "0036000291452" });
  assert.deepEqual(normalizeBarcode("96385074"), { ok: true, code: "96385074" });
  assert.deepEqual(normalizeBarcode("00036000291452"), { ok: true, code: "0036000291452" }, "a 14-digit GTIN with a leading 0");
  assert.deepEqual(normalizeBarcode("5000159484696"), { ok: false, reason: "check" });
  assert.deepEqual(normalizeBarcode("12345"), { ok: false, reason: "length" });
  assert.deepEqual(normalizeBarcode("12345678901234567"), { ok: false, reason: "length" });
  assert.deepEqual(normalizeBarcode("5000a59484695"), { ok: false, reason: "digits" });
  assert.deepEqual(normalizeBarcode(""), { ok: false, reason: "length" });
  assert.equal(foodIdFor("5000159484695"), "fb-5000159484695");
});

test("B3 the words for each problem, in plain words; the check-digit one says no lookup was made", () => {
  assert.match(BARCODE_WORDS.check, /last digit does not match/);
  assert.match(BARCODE_WORDS.check, /No lookup was made\./);
  assert.match(BARCODE_WORDS.length, /8, 12 or 13 digits/);
  assert.match(BARCODE_WORDS.misread, /^That read looks wrong\. Hold the phone still and try again\.$/);
});

// ---------- the scanner with a pretend camera and a pretend reader ----------

function fakeCamera({ deny = false } = {}) {
  const tracks = [{ stopped: false, stop() { this.stopped = true; } }, { stopped: false, stop() { this.stopped = true; } }];
  const asked = [];
  return {
    tracks, asked,
    media: { async getUserMedia(c) { asked.push(c); if (deny) { const e = new Error("no"); e.name = "NotAllowedError"; throw e; } return { getTracks: () => tracks }; } },
  };
}
function fakeVideo() {
  const attrs = {};
  return { attrs, srcObject: "none", setAttribute(k, v) { attrs[k] = v; }, async play() { this.playing = true; }, videoWidth: 640, videoHeight: 480, readyState: 4 };
}
function frames(texts) {
  let i = 0;
  const seen = [];
  return { seen, reader: { async readBarcodes(img, opts) { seen.push(opts); const t = texts[Math.min(i, texts.length - 1)]; i += 1; return t === null ? [] : [{ isValid: true, text: t, format: "EAN13" }]; } } };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function runFrames(n) { for (let i = 0; i < n; i++) await tick(); }
const schedule = (fn) => { const t = setTimeout(fn, 0); return () => clearTimeout(t); };

test("B4 start asks for the back camera only (no sound) and makes the video play inline and muted", async () => {
  const cam = fakeCamera();
  const v = fakeVideo();
  const { reader } = frames([null]);
  const s = createScanner({ reader, media: cam.media, grab: () => ({}), schedule, onCode() {}, onMisread() {}, onError() {} });
  await s.start(v);
  assert.equal(cam.asked.length, 1);
  assert.equal(cam.asked[0].audio, false);
  assert.deepEqual(cam.asked[0].video.facingMode, { ideal: "environment" });
  assert.equal(v.attrs.playsinline, "");
  assert.equal(v.attrs.muted, "");
  assert.equal(v.playing, true);
  assert.equal(s.running(), true);
  s.stop();
});

test("B5 a misread (wrong check digit) keeps the camera open and says so; no code is passed on", async () => {
  const cam = fakeCamera();
  const codes = [], misreads = [];
  const { reader } = frames(["5000159484696", "5000159484696", null]);
  const s = createScanner({ reader, media: cam.media, grab: () => ({}), schedule, onCode: (c) => codes.push(c), onMisread: (m) => misreads.push(m), onError() {} });
  await s.start(fakeVideo());
  await runFrames(8);
  assert.equal(codes.length, 0);
  assert.ok(misreads.length >= 1);
  assert.equal(misreads[0], "check");
  assert.equal(cam.tracks.some((t) => t.stopped), false, "the camera stays open");
  assert.equal(s.running(), true);
  s.stop();
});

test("B6 a good read stops every camera track first, then passes the clean code on once", async () => {
  const cam = fakeCamera();
  const codes = [];
  let stoppedWhenCalled = null;
  const { reader } = frames([null, "036000291452", "036000291452"]);
  const s = createScanner({ reader, media: cam.media, grab: () => ({}), schedule, onCode: (c) => { codes.push(c); stoppedWhenCalled = cam.tracks.every((t) => t.stopped); }, onMisread() {}, onError() {} });
  const v = fakeVideo();
  await s.start(v);
  await runFrames(10);
  assert.deepEqual(codes, ["0036000291452"]);
  assert.equal(stoppedWhenCalled, true);
  assert.equal(v.srcObject, null);
  assert.equal(s.running(), false);
});

test("B7 stop() stops every track, reads no more frames, and is safe to call twice", async () => {
  const cam = fakeCamera();
  const f = frames([null]);
  const s = createScanner({ reader: f.reader, media: cam.media, grab: () => ({}), schedule, onCode() {}, onMisread() {}, onError() {} });
  await s.start(fakeVideo());
  await runFrames(3);
  s.stop();
  const n = f.seen.length;
  await runFrames(5);
  assert.equal(f.seen.length, n);
  assert.ok(cam.tracks.every((t) => t.stopped));
  s.stop();
});

test("B8 camera refused: a plain error code, nothing left running", async () => {
  const cam = fakeCamera({ deny: true });
  const errors = [];
  const s = createScanner({ reader: frames([null]).reader, media: cam.media, grab: () => ({}), schedule, onCode() {}, onMisread() {}, onError: (e) => errors.push(e) });
  await s.start(fakeVideo());
  assert.deepEqual(errors, ["denied"]);
  assert.equal(s.running(), false);
});

test("B9 stop during the camera question: the camera that arrives late is stopped at once", async () => {
  const tracks = [{ stopped: false, stop() { this.stopped = true; } }];
  let release;
  const media = { getUserMedia: () => new Promise((r) => { release = () => r({ getTracks: () => tracks }); }) };
  const s = createScanner({ reader: frames([null]).reader, media, grab: () => ({}), schedule, onCode() {}, onMisread() {}, onError() {} });
  const p = s.start(fakeVideo());
  s.stop();
  release();
  await p;
  assert.equal(tracks[0].stopped, true);
  assert.equal(s.running(), false);
});

test("B10 the reader only looks for food barcodes (EAN-13, EAN-8, UPC-A), one at a time", () => {
  assert.deepEqual(READ_OPTIONS.formats, ["EAN13", "EAN8", "UPCA"]);
  assert.equal(READ_OPTIONS.maxNumberOfSymbols, 1);
});

test("B11 loadReader points zxing at our own .wasm, checks the version, never the jsDelivr default", async () => {
  const calls = [];
  const fakeModule = {
    ZXING_WASM_VERSION: "3.1.7",
    async prepareZXingModule(arg) { calls.push(arg); return {}; },
  };
  let imported = null;
  const z = await loadReader(async (url) => { imported = url; return fakeModule; });
  assert.equal(z, fakeModule);
  assert.match(imported, /\/vendor\/zxing-wasm\/reader\/index\.js$/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].fireImmediately, true);
  const where = calls[0].overrides.locateFile("zxing_reader.wasm", "https://fastly.jsdelivr.net/whatever/");
  assert.match(where, /\/vendor\/zxing-wasm\/reader\/zxing_reader\.wasm$/);
  assert.ok(!where.includes("jsdelivr"));
  await assert.rejects(loadReader(async () => ({ ...fakeModule, ZXING_WASM_VERSION: "3.1.6" })));
});

// ---------- the copied files and the page rules ----------

test("B12 zxing-wasm 3.1.7 reader files are ours, unchanged, with LICENSE, NOTICE and CHANGES next to them", () => {
  assert.equal(ZXING_VERSION, "3.1.7");
  for (const f of ["reader/index.js", "share.js", "reader/zxing_reader.wasm", "LICENSE", "NOTICE", "CHANGES.md"]) assert.ok(existsSync(app(VENDOR + f)), f);
  const wasm = readFileSync(app(`${VENDOR}reader/zxing_reader.wasm`));
  const sha = createHash("sha256").update(wasm).digest("hex");
  assert.equal(sha, WASM_SHA256);
  assert.equal(sha, "33c8c50be17d0bb05454b4fd3ffb5b5ab9a8e8d1c0ebeb21a1adf4a89c1a8b59");
  const index = read(`${VENDOR}reader/index.js`);
  assert.ok(index.includes(`"${WASM_SHA256}"`), "the library's own fingerprint of its wasm matches");
  assert.deepEqual([...index.matchAll(/from\s*"([^"]+)"/g)].map((m) => m[1]), ["../share.js"]);
  assert.match(read(`${VENDOR}LICENSE`), /MIT License/);
  assert.match(read(`${VENDOR}NOTICE`), /zxing-cpp/);
  assert.match(read(`${VENDOR}NOTICE`), /Apache License/);
  assert.match(read(`${VENDOR}CHANGES.md`), /3\.1\.7/);
  assert.match(read(`${VENDOR}CHANGES.md`), /sha512-LI94ndlOY\+xoqlkNcc0EwByrMpUXKrCX171EQ38kGWqpiRq\/gcnC\+ZrbRipvxI3uV4LaDtNlKo1p9Uayg1sesQ==/);
});

test("B13 the vendor JS has no eval, no Function(), no Worker and no blob links", () => {
  for (const f of ["reader/index.js", "share.js"]) {
    const t = read(VENDOR + f);
    assert.doesNotMatch(t, /\beval\s*\(|new Function\s*\(|new Worker\s*\(|createObjectURL/, f);
  }
});

test("B14 CSP: only script-src gains 'wasm-unsafe-eval' and connect-src gains Open Food Facts; the rest is unchanged", () => {
  const html = read("index.html");
  const csp = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)[1];
  const parts = Object.fromEntries(csp.split(";").map((s) => s.trim()).filter(Boolean).map((s) => { const [k, ...v] = s.split(/\s+/); return [k, v.join(" ")]; }));
  assert.deepEqual(parts, {
    "default-src": "'self'",
    "script-src": "'self' 'wasm-unsafe-eval'",
    "style-src": "'self'",
    "img-src": "'self' data:",
    "connect-src": "'self' https://api.github.com https://world.openfoodfacts.org",
    "object-src": "'none'",
    "base-uri": "'none'",
    "form-action": "'none'",
  });
});

test("B15 the offline list holds the reader files, so the scanner works with no signal after the first visit", () => {
  const sw = read("sw.js");
  for (const f of ["reader/index.js", "share.js", "reader/zxing_reader.wasm", "LICENSE", "NOTICE", "CHANGES.md"]) assert.ok(sw.includes(`"./${VENDOR}${f}"`), f);
  assert.ok(sw.includes(`"./js/food/scanner.js"`));
  assert.ok(sw.includes(`"./js/food/barcode.js"`));
});

test("B16 scanner.js: no innerHTML or eval; reader loaded only when asked (dynamic import); no other site named", () => {
  const s = read("js/food/scanner.js");
  assert.doesNotMatch(s, /innerHTML|outerHTML|insertAdjacentHTML|\beval\s*\(/);
  assert.doesNotMatch(s, /^import .*vendor/m, "no static import of the reader: it loads when the scanner opens");
  assert.doesNotMatch(s, /https?:\/\//);
});

// ---------- a real decode in Node with our own copied reader ----------

// Draw an EAN-13 barcode as grey pixels (pure code, made-up digits) and read it with the copied zxing files.
const L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const G = L.map((p) => [...p].reverse().map((b) => (b === "0" ? "1" : "0")).join(""));
const R = L.map((p) => [...p].map((b) => (b === "0" ? "1" : "0")).join(""));
const PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];
function ean13Bits(code) {
  const d = [...code].map(Number);
  let bits = "101";
  for (let i = 1; i <= 6; i++) bits += (PARITY[d[0]][i - 1] === "L" ? L : G)[d[i]];
  bits += "01010";
  for (let i = 7; i <= 12; i++) bits += R[d[i]];
  return `${bits}101`;
}
function drawBarcode(code, scale = 3, height = 80) {
  const bits = `${"0".repeat(11)}${ean13Bits(code)}${"0".repeat(11)}`;
  const width = bits.length * scale;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const v = bits[Math.floor(x / scale)] === "1" ? 0 : 255;
    const i = (y * width + x) * 4;
    data[i] = data[i + 1] = data[i + 2] = v; data[i + 3] = 255;
  }
  return { data, width, height, colorSpace: "srgb" };
}

test("B17 the copied reader really reads an EAN-13 in Node (our own .wasm), and the scanner logic passes it on", async () => {
  const z = await import(new URL(`../app/${VENDOR}reader/index.js`, import.meta.url).href);
  const wasmBytes = readFileSync(app(`${VENDOR}reader/zxing_reader.wasm`));
  await z.prepareZXingModule({ overrides: { wasmBinary: wasmBytes.buffer.slice(wasmBytes.byteOffset, wasmBytes.byteOffset + wasmBytes.byteLength) }, fireImmediately: true });
  const res = await z.readBarcodes(drawBarcode("5000159484695"), READ_OPTIONS);
  assert.equal(res.length, 1);
  assert.equal(res[0].text, "5000159484695");
  assert.equal(normalizeBarcode(res[0].text).ok, true);
});
