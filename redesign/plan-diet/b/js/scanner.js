// The scanner layer. It opens OVER the Diet tab and never changes the page address (#/diet), because on an iPhone
// Home Screen app a change of the address could stop the camera (research 7, WebKit bug 215884). It closes the camera
// before anything else happens. In the real build: getUserMedia with playsinline + muted video, and the self-hosted
// zxing-wasm reader (answer 63 a). In this prototype the camera view is DRAWN, and three "pretend reads" stand in.
import { h } from "./app/h.js";
import { s } from "./app/svg.js";
import { icon } from "./app/icons.js";
import { SAMPLE_CODES, validEan } from "./store.js";

let open = null;
export function closeScanner() { if (open) { open.remove(); open = null; document.body.classList.remove("no-scroll"); } }

function drawnCamera() {
  // A pack on a kitchen counter, with a barcode. Our own simple drawing.
  const bars = [];
  let x = 112;
  [3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 2, 1, 3, 1, 2, 2, 1, 1, 3, 1, 2].forEach((w, i) => { if (i % 2 === 0) bars.push(s("rect", { x, y: 196, width: w * 1.6, height: 52, class: "cam-bar" })); x += w * 1.6 + 1.2; });
  return s("svg", { viewBox: "0 0 320 400", class: "cam-scene", "aria-hidden": "true", preserveAspectRatio: "xMidYMid slice" },
    s("rect", { x: 0, y: 0, width: 320, height: 400, class: "cam-bg" }),
    s("rect", { x: 0, y: 300, width: 320, height: 100, class: "cam-counter" }),
    s("rect", { x: 78, y: 70, width: 170, height: 250, rx: 10, class: "cam-pack", transform: "rotate(-4 163 195)" }),
    s("rect", { x: 96, y: 92, width: 134, height: 40, rx: 6, class: "cam-label", transform: "rotate(-4 163 195)" }),
    s("g", { transform: "rotate(-4 163 195)" }, s("rect", { x: 104, y: 188, width: 120, height: 72, rx: 4, class: "cam-white" }), bars,
      s("text", { x: 164, y: 256, class: "cam-digits", "text-anchor": "middle" }, "3 017620 422003")));
}

// onCode(code) -> Promise<{ ok, message }>. onDigits(): open "type the digits".
export function openScanner(onCode, onDigits) {
  closeScanner();
  const status = h("p", { class: "scan-status", role: "status" }, "Hold the barcode inside the frame. It reads by itself.");
  const pretend = async (code, label) => {
    status.textContent = `Read: ${label}…`;
    // A good read closes the camera first, so the next sheet (portion, lookup, check) is not hidden under it.
    // A bad read (check digit wrong) keeps the camera open with a message, like a real reader would.
    if (!validEan(code)) { const r = await onCode(code, { from: "scan" }); status.textContent = r.message; return; }
    closeScanner();
    await onCode(code, { from: "scan" });
  };
  const photo = h("input", { type: "file", accept: "image/*", capture: "environment", class: "sr-only", id: "scan-photo", onchange: () => { status.textContent = "Photo taken. Reading a still photo comes with the real reader (a later build step)."; } });
  open = h("div", { class: "scanner", role: "dialog", "aria-modal": "true", "aria-label": "Scan a barcode" },
    h("div", { class: "scan-top" },
      h("button", { class: "scan-close", type: "button", onclick: closeScanner, "aria-label": "Close the camera" }, icon("close", 22), "Close"),
      h("b", {}, "Scan a barcode"),
      h("span", { class: "scan-spacer" })),
    h("div", { class: "scan-view" },
      drawnCamera(),
      h("div", { class: "scan-frame", "aria-hidden": "true" }, h("i", { class: "c tl" }), h("i", { class: "c tr" }), h("i", { class: "c bl" }), h("i", { class: "c br" }), h("span", { class: "laser" })),
      h("span", { class: "proto-tag" }, "Drawn camera view (prototype)")),
    h("div", { class: "scan-panel" },
      status,
      h("div", { class: "scan-alt" },
        h("button", { class: "button secondary", type: "button", onclick: () => { closeScanner(); onDigits(); } }, icon("keys", 18), "Type the digits"),
        h("label", { class: "button secondary", for: "scan-photo" }, icon("camera", 18), "Take a photo"), photo),
      h("p", { class: "small muted" }, "Your iPhone may ask for the camera each time you open the app. The camera stops when you close this."),
      h("div", { class: "pretend" },
        h("span", { class: "eyebrow" }, "Prototype: pretend the camera read"),
        h("div", { class: "chips" },
          h("button", { class: "chip", type: "button", onclick: () => pretend(SAMPLE_CODES.yogurt, "a food you saved") }, "A saved food"),
          h("button", { class: "chip", type: "button", onclick: () => pretend(SAMPLE_CODES.real, "a real product") }, "A real product (asks Open Food Facts)"),
          h("button", { class: "chip", type: "button", onclick: () => pretend(SAMPLE_CODES.unknown, "an unknown barcode") }, "Unknown barcode"),
          h("button", { class: "chip", type: "button", onclick: () => pretend(SAMPLE_CODES.nonums, "a product with no numbers") }, "A product with no numbers"),
          h("button", { class: "chip", type: "button", onclick: () => pretend("3017620422004", "a misread") }, "A misread")))));
  document.body.append(open);
  document.body.classList.add("no-scroll");
}
