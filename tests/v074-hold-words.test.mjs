// Version 0.7.4 (worker 8.41): a hold exercise (plank, side plank) never says "reps". Rosario on the plank: "says 2 sets
// and rep is 20-40, what does that mean?" The exercise layer showed a "Reps" tile with "seconds" under it.
// Drives the real screens on a fake page (tests/fixtures/sheet-dom.mjs). Written before the fix (tests first).
// All values are made up. No body data.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { install } from "./fixtures/sheet-dom.mjs";

const { body } = install();
globalThis.location.hash = "#/plan";
globalThis.requestAnimationFrame = () => 0;
const { store } = await import("../app/js/ui/app.js");
const { validDoc } = await import("./fixtures/profiles.mjs");
const { exercises, days } = await import("../app/js/plan/plan-v2.js");
const { openExerciseLayer } = await import("../app/js/ui/exlayer.js");
const { renderPlan, resetPlanPage } = await import("../app/js/ui/planday.js");
const pe = await import("../app/js/ui/planedit.js");
const { week1Stage } = await import("../app/js/engine/week1.js");

store.save(validDoc());

const REPS = /\breps?\b/i;
// Everything a person sees or hears: the text, and every aria-label (VoiceOver).
const words = (n) => [n.textContent, ...[...n.walk()].map((x) => x.getAttribute?.("aria-label") ?? "").filter(Boolean)].join(" | ");
const sheet = () => body.querySelector("[data-sheet]");
const clear = () => { for (const s of body.querySelectorAll("[data-sheet]")) s.remove(); for (const t of body.querySelectorAll(".toast")) t.remove(); };
const tiles = () => sheet().querySelectorAll(".ex-tile").map((t) => t.childNodes.map((c) => c.textContent));

// Every slot of the plan that holds a hold exercise: [day, slot, exercise id].
const HOLDS = Object.entries(days).flatMap(([d, day]) => day.slots.filter((s) => exercises[s.ex].kind === "hold").map((s) => [d, s.slot, s.ex]));

test("H0 the plan has hold exercises to check (plank and side plank)", () => {
  assert.ok(HOLDS.some(([, , ex]) => ex === "plank"));
  assert.ok(HOLDS.some(([, , ex]) => ex === "side_plank"));
});

test("H1 the exercise layer of every hold slot: a Hold tile with seconds, and no word 'reps' anywhere", () => {
  for (const [day, slot, exId] of HOLDS) {
    clear();
    openExerciseLayer(exId, { day, week: 1, slot });
    const all = words(sheet());
    assert.doesNotMatch(all, REPS, `${day} ${slot} ${exId}: ${all.match(/.{0,40}\breps?\b.{0,20}/i)?.[0]}`);
    const [lo, hi] = exercises[exId].range;
    const hold = tiles().find((t) => t[0] === "Hold");
    assert.ok(hold, `${exId}: a tile labelled "Hold"`);
    assert.equal(hold[1], `${lo}–${hi} s`, `${exId}: the value says seconds`);
    assert.equal(hold[2], exercises[exId].perSide ? "seconds each side" : "seconds each set");
    assert.ok(!tiles().some((t) => t[0] === "Reps"), `${exId}: no "Reps" tile`);
  }
  clear();
});

test("H2 the exercise layer opened outside a day (Gym tab, swap list): no 'reps' for a hold", () => {
  for (const exId of ["plank", "side_plank"]) {
    clear();
    openExerciseLayer(exId);
    assert.doesNotMatch(words(sheet()), REPS, exId);
  }
  clear();
});

test("H3 a non-hold exercise keeps its Reps tile (the fix is for holds only)", () => {
  const [day, slot] = Object.entries(days).flatMap(([d, x]) => x.slots.filter((s) => exercises[s.ex].kind !== "hold").map((s) => [d, s.slot]))[0];
  clear();
  openExerciseLayer(days[day].slots.find((s) => s.slot === slot).ex, { day, week: 1, slot });
  assert.ok(tiles().some((t) => t[0] === "Reps"));
  clear();
});

// The Plan tab on one day, in Edit mode, so the card's Change, Swap and Remove buttons are there too.
function planDay(day) {
  resetPlanPage(); // Edit mode hides the day strip
  let r = renderPlan();
  r = Array.isArray(r) ? r[0] : r;
  r.querySelectorAll("button").find((b) => (b.getAttribute("aria-label") ?? "").startsWith(days[day].name)).click();
  r = renderPlan();
  r = Array.isArray(r) ? r[0] : r;
  if (!r.querySelector(".ecard")) { r.querySelectorAll("button").find((b) => b.textContent.trim() === "Edit").click(); r = renderPlan(); }
  return Array.isArray(r) ? r[0] : r;
}

test("H4 the Plan card of every hold (and its Change, Swap, Remove buttons): no 'reps'", () => {
  for (const [day, , exId] of HOLDS) {
    const page = planDay(day);
    const card = page.querySelectorAll(".ecard").find((c) => words(c).includes(exercises[exId].name));
    assert.ok(card, `${day}: the ${exId} card in Edit mode`);
    assert.doesNotMatch(words(card), REPS, `${day} ${exId}: ${words(card).match(/.{0,40}\breps?\b.{0,20}/i)?.[0]}`);
  }
});

test("H5 the Change sheet of a hold: no 'reps' (sets and seconds only)", () => {
  for (const [day, slot, exId] of HOLDS) {
    clear();
    pe.openDoseSheet(day, 1, slot);
    assert.ok(sheet(), `${day} ${slot}: the Change sheet opens`);
    assert.doesNotMatch(words(sheet()), REPS, `${day} ${exId}: ${words(sheet()).match(/.{0,40}\breps?\b.{0,20}/i)?.[0]}`);
  }
  clear();
});

test("H6 the Swap sheet from a hold: its own lines say seconds, not reps (other exercises in the list keep their reps)", () => {
  for (const [day, slot, exId] of HOLDS) {
    clear();
    pe.openSwapSheet(day, 1, slot);
    const inButton = (n) => { for (let x = n.parent; x; x = x.parent) if (x.tagName === "BUTTON") return true; return false; };
    const lines = sheet().querySelectorAll("p").filter((p) => !inButton(p)).map((p) => p.textContent).join(" | ");
    assert.match(lines, /Keeps the slot's/, "the sheet's own line is checked");
    assert.doesNotMatch(lines, REPS, `${day} ${exId}: ${lines}`);
  }
  clear();
});

test("H7 the 'workout running' toast of a hold's Change sheet says seconds, not reps", () => {
  assert.equal(typeof pe.doseRunningText, "function", "planedit.js exports doseRunningText(exercise)");
  assert.doesNotMatch(pe.doseRunningText(exercises.plank), REPS);
  assert.match(pe.doseRunningText(exercises.plank), /seconds/);
  assert.match(pe.doseRunningText(exercises.dead_bug), /reps/, "a non-hold keeps its words");
  const src = readFileSync(new URL("../app/js/ui/planedit.js", import.meta.url), "utf8");
  const open = src.slice(src.indexOf("export function openDoseSheet"), src.indexOf("export function openDoseSheet") + 900);
  assert.match(open, /toast\(doseRunningText\(/, "openDoseSheet shows it");
});

test("H8 week 1 (learn the moves): a hold's set screen says seconds, and a hold never reaches the 'how many more reps' question", () => {
  const src = readFileSync(new URL("../app/js/ui/week1.js", import.meta.url), "utf8");
  const line = src.split("\n").find((l) => l.includes("stop with about 3"));
  assert.ok(line, "the set screen's target line");
  assert.match(line, /hold \?/, "the target line has a hold version");
  // Holds are not weighted: set 1 -> set 2 -> done, never "left1" or "left2" (the reps question).
  const rec = (n) => ({ w1_ready: true, sets: Array.from({ length: n }, () => ({ type: "work", weight_kg: 0, seconds: 30 })) });
  assert.deepEqual([0, 1, 2].map((n) => week1Stage(rec(n), false)), ["set1", "set2", "done"]);
});
