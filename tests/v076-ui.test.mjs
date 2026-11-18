// Version 0.7.6 (worker 8.43): small items from the later list (docs/HANDOVER.md).
// - W: one wording for a first-try weight everywhere, the D12 wording "Try <kg>" (the Today list said "20 kg · first
//   try", the exercise sheet's Weight tile "20 kg / first try", while the Plan card says "Try 20 kg").
// - T: the Undo message after "Stop this exercise here" sat at the bottom, close to "Undo last set" (0.6.0 screen
//   checker): on the workout screen it shows at the top, where the other messages show.
// - F: with a stuck food file Today said "Synced" while new food waited: a short food line on Today, with a link to Diet.
// Driven on the real screens (tests/fixtures/sheet-dom.mjs). Written before the build. All values are made up.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { install } from "./fixtures/sheet-dom.mjs";

const { body } = install();
globalThis.requestAnimationFrame = () => 0;
globalThis.window.navigator = { standalone: true, onLine: true };
globalThis.window.matchMedia = () => ({ matches: true, addEventListener() {} });
Object.assign(globalThis.location, { hostname: "localhost", search: "?date=2026-11-18" }); // Wednesday, week 2
const { store } = await import("../app/js/ui/app.js");
const { validDoc } = await import("./fixtures/profiles.mjs");
const { renderToday } = await import("../app/js/ui/today.js");
const { openExerciseLayer } = await import("../app/js/ui/exlayer.js");
const { undoToast } = await import("../app/js/ui/planedit.js");
const { foodHint } = await import("../app/js/sync/foodsync.js");

const src = (p) => readFileSync(new URL(`../app/${p}`, import.meta.url), "utf8");
const textOf = (out) => (Array.isArray(out) ? out : [out]).filter(Boolean).map((x) => x.textContent).join(" ");
const CONNECTED = { token: "made-up-test-token", owner: "someone", repo: "training-data", last_sync_result: "ok", last_sync_at: "2026-11-18T08:00:00.000Z" };
function fresh(device = {}) {
  const doc = validDoc();
  doc.block.start_monday = "2026-11-09";
  store.save(doc);
  store.saveDevice(device);
  for (const s of body.querySelectorAll("[data-sheet], .toast")) s.remove();
}

// ---------- W: "Try <kg>" ----------

test("W-1 the Today list says 'Try 20 kg' for a first-try weight and never 'first try'", () => {
  fresh();
  globalThis.location.hash = "#/today";
  const list = textOf(renderToday());
  assert.match(list, /Try \d+(\.\d)? kg/, "the D12 wording on Today");
  assert.ok(!/first try/i.test(list), "no 'first try' on the list");
  const rows = (Array.isArray(renderToday()) ? renderToday()[0] : renderToday()).querySelectorAll(".ex-row");
  const tried = rows.filter((r) => /Try \d/.test(r.textContent));
  assert.ok(tried.length >= 3, "the weighted exercises of the day show it");
  for (const r of tried) assert.match(r.getAttribute("aria-label"), /, Try \d+(\.\d)? kg\. Open tips\.$/, "VoiceOver says the same words");
});

test("W-2 the exercise sheet's weight tile reads 'Try' above the kg, never 'first try'", () => {
  fresh();
  openExerciseLayer("goblet_squat", { day: "wed", slot: "A1", week: 2 }); // as the Plan day opens it
  const sheet = body.querySelectorAll("[data-sheet]").slice(-1)[0];
  assert.ok(sheet, "the sheet opened");
  const tile = sheet.querySelectorAll(".ex-tile").find((t) => /kg/.test(t.textContent));
  assert.ok(tile, "a weight tile");
  assert.equal(tile.querySelector(".eyebrow").textContent, "Try");
  assert.match(tile.querySelector("b").textContent, /^\d+(\.\d)? kg$/);
  assert.ok(!/first try/i.test(sheet.textContent));
});

// ---------- T: the Undo message on the workout screen ----------

test("T-1 the stop Undo message on the workout screen shows at the top, away from 'Undo last set'", () => {
  fresh();
  undoToast("Made-up exercise: stopped after 1 of 3 sets.", () => {}, 8000, { top: true });
  const t = body.querySelectorAll(".toast").slice(-1)[0];
  assert.ok(t.classList.contains("undo-toast") && t.classList.contains("at-top"));
  undoToast("Plan change.", () => {});
  const plain = body.querySelectorAll(".toast").slice(-1)[0];
  assert.ok(!plain.classList.contains("at-top"), "Plan edits keep the bottom place of the mock-up");
  assert.match(src("js/ui/pair.js"), /undoToast\(`\$\{ex\.name\}: stopped after [^)]*\), 8000, \{ top: true \}\)/);
  const css = src("css/app.css");
  assert.match(css, /\.toast\.undo-toast\.at-top \{[^}]*top: calc\(var\(--s3\) \+ var\(--top-clear\) \+ env\(safe-area-inset-top\)\)[^}]*bottom: auto/);
});

// ---------- F: the food hint on Today ----------

test("F-1 foodHint: a line only when GitHub is set up and the last food sync had a problem", () => {
  assert.equal(foodHint({}), null, "not set up: the sync line already says so");
  assert.equal(foodHint({ ...CONNECTED }), null, "no food sync yet");
  assert.equal(foodHint({ ...CONNECTED, food_last_sync_result: "ok" }), null);
  for (const r of ["conflict", "error", "offline", "auth", "damaged"]) {
    assert.equal(foodHint({ ...CONNECTED, food_last_sync_result: r }), "Food did not sync. See Diet.", r);
  }
  assert.equal(foodHint({ food_last_sync_result: "error" }), null, "no connection: no food hint");
});

test("F-2 Today shows the food hint with a link to Diet under the sync line; none when food is fine", () => {
  fresh({ ...CONNECTED, food_last_sync_result: "error" });
  globalThis.location.hash = "#/today";
  const out = renderToday();
  const root = Array.isArray(out) ? out[0] : out;
  const line = root.querySelectorAll("p").find((p) => p.textContent.includes("Food did not sync."));
  assert.ok(line, "the food hint");
  assert.ok(line.classList.contains("status-warning"));
  assert.equal(line.querySelector("a")?.getAttribute("href"), "#/diet");
  fresh({ ...CONNECTED, food_last_sync_result: "ok" });
  assert.ok(!textOf(renderToday()).includes("Food did not sync."));
});
