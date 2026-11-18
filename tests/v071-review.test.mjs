// Version 0.7.1 (worker 8.39): fixes for the independent auditor's round-1 findings (docs/checks/2026-11-18-wave4.md).
//  R1  Undo with a sheet open redrew only the Diet list; the rings, "Log again", "Copy yesterday" and the food line
//      stayed old until the next redraw (auditor finding 1).
//  R2  Behaviour tests for two helpers that were only checked by their source text (auditor finding 4).
//  R3  The bigger bottom room of 0.7.1 is only for screens with a tab bar under the action bar (auditor finding 5).
// All values are made up. No body data.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { foodWords } from "../app/js/ui/settings-sync.js";
import { pageFor } from "../app/js/engine/planpage.js";

const src = (p) => readFileSync(new URL(`../app/${p}`, import.meta.url), "utf8").replaceAll("\r\n", "\n");

test("R1 Undo with a sheet open redraws the whole Diet screen behind it (rings, Log again, Copy yesterday, food line)", () => {
  const t = src("js/diet/diet.js");
  const hook = t.slice(t.indexOf("setListRedraw("), t.indexOf("export function renderDiet"));
  assert.match(hook, /const \[fresh\] = renderDiet\(\);/);
  assert.match(hook, /\.replaceChildren\(\.\.\.fresh\.childNodes\)/);
  assert.match(hook, /querySelector\("main\.screen"\)/);
  assert.match(hook, /\.diet-list/, "only while the Diet screen is the one drawn");
});

test("R2-1 the Settings food line always says it is about food", () => {
  assert.equal(foodWords("Synced 18 Nov, 12:53."), "Food: Synced 18 Nov, 12:53.");
  assert.equal(foodWords("Food is only on this phone. Set up GitHub below."), "Food is only on this phone. Set up GitHub below.");
  assert.equal(foodWords("Food synced 18 Nov."), "Food synced 18 Nov.");
  assert.equal(foodWords("Foodstuff"), "Food: Foodstuff", "a word that only starts with 'Food' is not enough");
});

test("R2-2 'this week' for the Plan sheets: the running week, else week 1 before the start", () => {
  assert.equal(pageFor("2026-01-12", "2026-01-21").week, 2);
  assert.equal(pageFor("2026-01-12", "2026-01-07").week, 1);
});

test("R3 workout and setup screens keep their old bottom room; Today and the Plan's edit mode get room for the tab bar too", () => {
  const css = src("css/app.css");
  assert.match(css, /\.screen\.has-bar \{ padding-bottom: calc\(var\(--tap-main\) \* 2 \+ var\(--s8\) \+ var\(--s4\) \+ env\(safe-area-inset-bottom\)\); \}/);
  assert.match(css, /\.screen\.has-bar\.over-tabs \{ padding-bottom: calc\(var\(--tap-main\) \* 3 \+ var\(--s6\) \+ env\(safe-area-inset-bottom\)\); \}/);
  assert.match(src("js/ui/today.js"), /h\("main", \{ class: "screen has-bar over-tabs" \}/);
  assert.match(src("js/ui/planday.js"), /"screen has-bar over-tabs plan-screen"/);
  assert.match(src("js/ui/parts.js"), /class: "screen has-bar" \}/, "flowScreen unchanged");
  assert.match(src("js/ui/parts.js"), /class: "screen has-bar workout" \}/, "workoutScreen unchanged");
});
