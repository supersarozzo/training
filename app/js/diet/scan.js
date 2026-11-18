// The barcode scanner: a full-screen dark overlay on the SAME route (#/diet). The hash never changes while the camera
// runs. The camera stops on Close, on "Type the digits", on a photo, on a good code, and whenever the page goes away
// (hashchange, pagehide, hidden tab). main.js calls stopScanner() at the start of every render().
import { h } from "../h.js";
import { icon } from "../ui/icons.js";
import { sharedReader, createScanner, grabFrame, readPhoto } from "../food/scanner.js";
import { BARCODE_WORDS } from "../food/barcode.js";
import { off, food } from "./foodapp.js";
import { savedFoods } from "../food/foodmath.js";
import { foodIdFor } from "../food/barcode.js";
import { openDigits, openLookupResult, openCheck } from "./sheets.js";

const WORDS = {
  denied: "The camera is turned off for this app. Type the digits instead, or take a photo.",
  no_camera: "This phone has no camera the app can use. Type the digits instead, or take a photo.",
  failed: "The camera did not start. Type the digits instead, or take a photo.",
  photo: "No barcode was found in that photo. Try again, or type the digits.",
};

let active = null; // { close() } while the overlay is open

export function stopScanner() {
  if (active) active.close();
}

export function openScanner() {
  stopScanner();
  const video = h("video", { class: "scan-video", playsinline: "", muted: "", autoplay: "" });
  video.muted = true;
  const canvas = document.createElement("canvas");
  const msg = h("p", { class: "scan-msg", role: "status", "aria-live": "polite" }, "Hold the barcode inside the frame.");
  const file = h("input", { class: "scan-file", type: "file", accept: "image/*", capture: "environment", "aria-label": "Take a photo of the barcode" });
  let scanner = null;
  let closed = false;
  // The photo picker: iOS may hide the page while its camera or photo picker is open. That must not close the
  // overlay (the photo would then be lost), so "hidden" is ignored while picking. The live camera is stopped first
  // (two cameras at once fail on iOS) and started again after a cancelled or unreadable photo.
  let picking = false;
  let camWasOn = false;

  function close() {
    if (closed) return;
    closed = true;
    if (scanner) scanner.stop();
    window.removeEventListener("hashchange", close);
    window.removeEventListener("pagehide", close);
    document.removeEventListener("visibilitychange", onVisibility);
    overlay.remove();
    if (active === me) active = null;
  }
  function onVisibility() { if (document.hidden && !picking) close(); }
  function resumeCamera() {
    picking = false;
    if (!closed && camWasOn && scanner) { camWasOn = false; scanner.start(video); }
  }
  function pickPhoto() {
    camWasOn = !!(scanner && scanner.running());
    if (scanner) scanner.stop();
    picking = true;
    file.click();
  }
  const me = { close };

  async function looked(code) {
    const saved = savedFoods(food.doc()).find((f) => f.id === foodIdFor(code));
    if (saved) { close(); openCheck({ mode: "saved", food: saved }); return; } // already saved: no lookup
    msg.textContent = "Looking it up · Only the barcode number is sent.";
    const res = await off.lookup(code);
    if (closed) return; // closed while waiting: show nothing
    close();
    openLookupResult(code, res);
  }

  const overlay = h("div", { class: "scan", role: "dialog", "aria-modal": "true", "aria-label": "Scan a barcode", dataset: { scan: "1" } },
    h("div", { class: "scan-head" },
      h("button", { class: "scan-x", type: "button", onclick: close }, icon("close", 18), "Close"),
      h("b", {}, "Scan a barcode"), h("span", { class: "scan-gap" })),
    h("div", { class: "scan-cam" }, video, h("div", { class: "scan-frame", "aria-hidden": "true" }), h("div", { class: "scan-laser", "aria-hidden": "true" })),
    h("div", { class: "scan-low" },
      msg,
      h("button", { class: "button", type: "button", onclick: () => { close(); openDigits(); } }, icon("digits", 20), "Type the digits"),
      h("button", { class: "button secondary", type: "button", onclick: pickPhoto }, icon("camera", 20), "Take a photo of the barcode"),
      file));
  file.addEventListener("cancel", resumeCamera);
  file.addEventListener("change", async () => {
    picking = false;
    const f = file.files && file.files[0];
    if (!f) { resumeCamera(); return; }
    if (scanner) scanner.stop();
    msg.textContent = "Reading the photo…";
    let found = false;
    try {
      const reader = await sharedReader();
      const r = await readPhoto(reader, f);
      if (closed) return;
      if (r.ok) { found = true; await looked(r.code); }
      else msg.textContent = r.reason === "none" ? WORDS.photo : BARCODE_WORDS[r.reason] ?? WORDS.photo;
    } catch { if (!closed) msg.textContent = WORDS.photo; }
    file.value = "";
    if (!found) resumeCamera(); // the message stays; the camera (if it was on) looks again
  });

  document.body.append(overlay);
  active = me;
  window.addEventListener("hashchange", close);
  window.addEventListener("pagehide", close);
  document.addEventListener("visibilitychange", onVisibility);

  (async () => {
    const media = navigator.mediaDevices;
    if (!media || !media.getUserMedia) { msg.textContent = WORDS.failed; return; }
    let reader;
    try { reader = await sharedReader(); } catch { if (!closed) msg.textContent = WORDS.failed; return; }
    if (closed) return;
    scanner = createScanner({
      reader, media, grab: (v) => grabFrame(v, canvas),
      onCode: (code) => { looked(code); },
      onMisread: () => { if (!closed) msg.textContent = BARCODE_WORDS.misread; },
      onError: (kind) => { if (!closed) msg.textContent = WORDS[kind] ?? WORDS.failed; },
    });
    scanner.start(video);
  })();
  return close;
}
