// The barcode scanner (build step 8, answer 63 a). The reader is zxing-wasm 3.1.7 from our own site
// (app/vendor/zxing-wasm/), loaded only when the scanner opens. Rules (DESIGN 15.8, research 7):
//  - prepareZXingModule is pointed at our own .wasm: nothing is loaded from another site;
//  - the camera stops the moment a good code is read, when the scanner closes, and before any route change
//    (the Diet screen calls stop(); on iPhone a hash change can stop the camera by itself);
//  - the check digit is tested before the code is passed on: a misread keeps the camera open and costs no lookup;
//  - the video plays inline and muted (or iOS goes full screen).
import { normalizeBarcode } from "./barcode.js";

export const ZXING_VERSION = "3.1.7";
export const WASM_SHA256 = "33c8c50be17d0bb05454b4fd3ffb5b5ab9a8e8d1c0ebeb21a1adf4a89c1a8b59";
const READER_JS = new URL("../../vendor/zxing-wasm/reader/index.js", import.meta.url).href;
const READER_WASM = new URL("../../vendor/zxing-wasm/reader/zxing_reader.wasm", import.meta.url).href;

// Food packs only: EAN-13, EAN-8 and UPC-A, one code at a time.
export const READ_OPTIONS = Object.freeze({ formats: ["EAN13", "EAN8", "UPCA"], maxNumberOfSymbols: 1, tryHarder: true });

let readerPromise = null;
// Load the reader once (when the scanner first opens). importFn is passed in by the tests.
export async function loadReader(importFn = (url) => import(url)) {
  const z = await importFn(READER_JS);
  if (z.ZXING_WASM_VERSION !== ZXING_VERSION) throw new Error("reader version");
  await z.prepareZXingModule({
    overrides: { locateFile: (path, prefix) => (path.endsWith(".wasm") ? READER_WASM : prefix + path) },
    fireImmediately: true,
  });
  return z;
}
export function sharedReader() {
  readerPromise ??= loadReader().catch((e) => { readerPromise = null; throw e; });
  return readerPromise;
}

// Read the middle band of the video into pixels (the barcode sits in the frame drawn there).
export function grabFrame(video, canvas) {
  const w = video.videoWidth, hgt = video.videoHeight;
  if (!w || !hgt) return null;
  const bandH = Math.round(hgt * 0.5);
  const y = Math.round((hgt - bandH) / 2);
  canvas.width = w;
  canvas.height = bandH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(video, 0, y, w, bandH, 0, 0, w, bandH);
  return ctx.getImageData(0, 0, w, bandH);
}

const browserSchedule = (fn) => { const t = setTimeout(fn, 120); return () => clearTimeout(t); };
const MISREAD_GAP_MS = 2000;

// reader: { readBarcodes(image, options) }. media: { getUserMedia(constraints) }. grab(video): pixels or null.
// onCode(code) after the camera is stopped; onMisread(reason) while it stays open; onError("denied" | "no_camera" | "failed").
export function createScanner({ reader, media, grab, schedule = browserSchedule, now = Date.now, onCode, onMisread, onError }) {
  let stream = null;
  let video = null;
  let live = false;
  let cancel = null;
  let lastMisread = -Infinity;
  let session = 0;

  function stopTracks(s) { try { s.getTracks().forEach((t) => t.stop()); } catch { /* already stopped */ } }

  function stop() {
    session += 1; // a camera that arrives after this is stopped at once
    live = false;
    if (cancel) { cancel(); cancel = null; }
    if (stream) { stopTracks(stream); stream = null; }
    if (video) { try { video.srcObject = null; } catch { /* ignore */ } }
  }

  async function frame(my) {
    if (!live || my !== session) return;
    let found = null;
    try {
      const img = grab(video);
      if (img) {
        const res = await reader.readBarcodes(img, READ_OPTIONS);
        found = Array.isArray(res) ? res.find((r) => r && r.isValid !== false && typeof r.text === "string" && r.text) : null;
      }
    } catch { found = null; }
    if (!live || my !== session) return;
    if (found) {
      const n = normalizeBarcode(found.text);
      if (n.ok) { stop(); onCode(n.code); return; }
      if (now() - lastMisread >= MISREAD_GAP_MS) { lastMisread = now(); onMisread(n.reason); }
    }
    cancel = schedule(() => frame(my));
  }

  async function start(videoEl) {
    stop();
    const my = session;
    video = videoEl;
    let s;
    try {
      s = await media.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    } catch (e) {
      if (my === session) onError(e && (e.name === "NotAllowedError" || e.name === "SecurityError") ? "denied" : e && e.name === "NotFoundError" ? "no_camera" : "failed");
      return;
    }
    if (my !== session) { stopTracks(s); return; } // closed while the phone asked about the camera
    stream = s;
    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");
    video.muted = true;
    video.srcObject = s;
    try { await video.play(); } catch { /* iOS may refuse play() before the stream is ready; frames still come */ }
    if (my !== session) return;
    live = true;
    cancel = schedule(() => frame(my));
  }

  return { start, stop, running: () => live };
}

// A still photo (the "Take a photo" fallback): { ok: true, code } | { ok: false, reason }.
export async function readPhoto(reader, file) {
  let res;
  try { res = await reader.readBarcodes(file, READ_OPTIONS); } catch { return { ok: false, reason: "none" }; }
  const found = Array.isArray(res) ? res.find((r) => r && r.isValid !== false && r.text) : null;
  if (!found) return { ok: false, reason: "none" };
  return normalizeBarcode(found.text);
}
