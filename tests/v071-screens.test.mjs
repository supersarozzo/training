// Version 0.7.1, the plain screen and word fixes (worker 8.39 helper). Plan: docs/steps/2026-11-18-wave4-gaps.md, A1-A3, C1-C3, C6.
//  S1 A1 the Today page clears the floating button and the tab bar
//  S2-S4 A2 "Set up GitHub" words by place (inside Settings, elsewhere), workout and food
//  S5 A3 the Add sheet says "in week N" when another week is picked
//  S6-S7 C1 Send to GitHub never says "Synced" when food failed
//  S8-S9 C2 Undo redraws the Diet list behind an open sheet
//  S10 C3 Diet rows: protein in bold, the time, then kcal
//  S11-S15 C6 small words and CSS minors
// All values are made up. No body data.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { statusText, MESSAGES } from "../app/js/sync/sync.js";
import { foodStatusText, FOOD_MESSAGES } from "../app/js/sync/foodsync.js";
import * as settingsSync from "../app/js/ui/settings-sync.js";
import * as dietPage from "../app/js/diet/diet.js";
import * as planedit from "../app/js/ui/planedit.js";
import * as walk from "../app/js/ui/walk.js";
import { weightLine } from "../app/js/planview.js";

const src = (p) => readFileSync(new URL(`../app/${p}`, import.meta.url), "utf8");
const css = src("css/app.css");

// ---------- S1: A1 ----------
test("S1 .screen.has-bar leaves room for the tab bar, the floating button and some air above it", () => {
  const rule = css.match(/\.screen\.has-bar\s*\{\s*padding-bottom:\s*calc\(([^;]+)\);\s*\}/);
  assert.ok(rule, "the has-bar rule");
  const tokens = { "--tap-main": 58, "--s3": 12, "--s2": 8, "--s4": 16, "--s6": 24, "--s8": 32, "--s12": 48 };
  const expr = rule[1].replace(/env\(safe-area-inset-bottom\)/g, "0").replace(/var\((--[a-z0-9-]+)\)/g, (_, n) => String(tokens[n]));
  assert.match(expr, /^[\d\s+*.-]+$/, `only numbers left: ${expr}`);
  const room = Function(`return (${expr})`)();
  const tabBar = 58 + 4; // .bar.action-bar bottom offset: tap-main + 4
  const actionBar = 12 + 58 + 8; // bar-inner padding top, the main button, padding bottom
  assert.ok(room >= tabBar + actionBar + 32, `room ${room} must be at least ${tabBar + actionBar + 32}`);
});

// ---------- S2-S4: A2 ----------
const OLD = /Set up GitHub in Settings/;
test("S2 workout words: inside Settings 'below', elsewhere the real path", () => {
  assert.match(statusText({}, false, "settings"), /Only on this phone\. Set up GitHub below\./);
  assert.match(statusText({}), /Only on this phone\. Set up GitHub in Progress › Settings\./);
  assert.match(MESSAGES.not_set_up, /Progress › Settings/);
  assert.doesNotMatch(statusText({}, false, "settings"), OLD);
  assert.doesNotMatch(statusText({}), OLD);
});
test("S3 food words: inside Settings 'below', elsewhere the real path", () => {
  assert.match(foodStatusText({}, false, "settings"), /Food is only on this phone\. Set up GitHub below\./);
  assert.match(foodStatusText({}), /Food is only on this phone\. Set up GitHub in Progress › Settings\./);
  assert.match(FOOD_MESSAGES.not_set_up, /Progress › Settings/);
});
test("S4 Settings asks for the 'settings' place; Today and Diet use the default", () => {
  assert.match(src("js/ui/settings-sync.js"), /statusText\(device, unsynced, "settings"\)/);
  assert.doesNotMatch(src("js/ui/today.js"), /statusText\([^)]*"settings"/);
  assert.doesNotMatch(src("js/diet/diet.js"), /foodStatusText\([^)]*"settings"/);
  for (const f of ["js/ui/settings-sync.js", "js/ui/today.js", "js/diet/diet.js", "js/sync/sync.js", "js/sync/foodsync.js"]) assert.doesNotMatch(src(f), OLD, f);
});

// ---------- S5: A3 ----------
test("S5 the Add sheet says 'in week N' for another week, 'this week' for this one", () => {
  const a = { setsThisWeek: 3, setsNormal: 2 };
  assert.match(planedit.setsWords(a, 5, 5), /^3 sets this week \(2 in a normal week\)/);
  assert.match(planedit.setsWords(a, 7, 5), /^3 sets in week 7 \(2 in a normal week\)/);
  assert.doesNotMatch(planedit.setsWords(a, 7, 5), /this week/);
  assert.match(planedit.setsWords(a, 7, undefined), /this week/); // "this week" not known: the old words
  assert.match(src("js/ui/planday.js"), /openAddSheet\(day, week, page\.week\)/);
});

// ---------- S6-S7: C1 ----------
test("S6 Send to GitHub: food failed means never 'Synced'", () => {
  const ok = { result: "ok", food: { result: "ok" } };
  const bad = { result: "ok", food: { result: "conflict" } };
  const off = { result: "ok", food: { result: "error" } };
  assert.match(settingsSync.syncOutcome(ok, "Synced: all good.").text, /^Synced/);
  assert.equal(settingsSync.syncOutcome(ok, "x").kind, "ok");
  for (const res of [bad, off]) {
    const m = settingsSync.syncOutcome(res, "Synced: all good.");
    assert.equal(m.kind, "error");
    assert.doesNotMatch(m.text, /Synced/);
    assert.match(m.text, /food/i);
    assert.match(m.text, /Workouts/);
  }
  assert.ok(settingsSync.syncOutcome(bad, "x").text.includes(FOOD_MESSAGES.conflict));
});
test("S7 workout failed or an old syncer without food: as before", () => {
  const w = settingsSync.syncOutcome({ result: "offline", message: "Saved on phone. Will sync when online.", food: { result: "offline", skipped: true } }, "x");
  assert.deepEqual(w, { kind: "error", text: "Saved on phone. Will sync when online." });
  assert.deepEqual(settingsSync.syncOutcome({ result: "ok" }, "Synced: all good."), { kind: "ok", text: "Synced: all good." });
});

// ---------- S8-S9: C2 ----------
test("S8 Undo with a sheet open redraws the list behind and leaves the sheet alone", () => {
  const t = src("js/diet/sheets.js");
  assert.match(t, /export function setListRedraw\(/);
  const body = t.slice(t.indexOf("export function undoToast"), t.indexOf("export function messageToast"));
  assert.match(body, /document\.querySelector\("\[data-sheet\], \[data-scan\]"\)\s*\?\s*redrawList\(\)\s*:\s*rerender\(\)/);
  assert.doesNotMatch(body, /closeSheets/);
});
test("S9 diet.js registers the list redraw and the list has its own place", () => {
  const t = src("js/diet/diet.js");
  assert.match(t, /setListRedraw\(/);
  assert.match(t, /diet-list/);
});

// ---------- S10: C3 ----------
test("S10 entry rows: protein in bold, then the time and the amount, kcal small", () => {
  const at = new Date(2026, 10, 18, 8, 10, 0).toISOString(); // local 08:10, whatever the zone
  const e = { name: "Porridge oats", amount_g: 40, kcal: 150, protein_g: 4.44, updated_at: at };
  assert.deepEqual(dietPage.entryParts(e), { sub: "08:10 · 40 g", big: "4.4 g", small: "150 kcal" });
  assert.deepEqual(dietPage.entryParts({ ...e, amount_g: null }), { sub: "08:10 · Quick add", big: "4.4 g", small: "150 kcal" });
  assert.equal(dietPage.entryParts({ ...e, updated_at: undefined }).sub, "40 g"); // no time: none shown
  assert.equal(dietPage.entryParts({ ...e, updated_at: "not a time" }).sub, "40 g");
  assert.equal(dietPage.entryParts({ ...e, protein_g: 46.5 }).big, "46.5 g");
  assert.equal(dietPage.entryParts({ ...e, protein_g: 7 }).big, "7 g");
});

// ---------- S11-S15: C6 ----------
test("S11 'no weight yet' has one wording in the Plan; the Change sheet starts empty, not at 0 kg", () => {
  const doc = { exercise_state: [] };
  for (const week of [1, 2, 6]) assert.equal(weightLine(doc, "leg_press", week).text, "Pick a light weight");
  assert.doesNotMatch(src("js/planview.js"), /Find it in week 1/);
  const pe = src("js/ui/planedit.js");
  assert.match(pe, /w\.kg === null/);
  assert.match(pe, /placeholder/);
});
test("S12 the week chip stays on one line", () => {
  const rule = css.match(/\.week-chip\s*\{[^}]*\}/)[0];
  assert.match(rule, /white-space:\s*nowrap/);
});
test("S13 Today's Settings link has a 44 px tap area (padding, no look change)", () => {
  const rule = css.match(/\.status-line > a\s*\{[^}]*\}/);
  assert.ok(rule, "a rule for links in the status line");
  assert.match(rule[0], /padding:\s*var\(--s3\) var\(--s2\)/);
  assert.match(rule[0], /margin:\s*calc\(var\(--s3\) \* -1\) calc\(var\(--s2\) \* -1\)/);
});
test("S14 the walk tile and the stepper show the same number", () => {
  assert.equal(walk.fmt(5), "5");
  assert.equal(walk.fmt(5.5), "5.5");
  assert.equal(walk.fmt(4.5), "4.5");
});
test("S15 the dark body map is lighter than before", () => {
  const dark = css.match(/--map-base:\s*#[0-9a-f]{6}; --map-muscle:\s*#[0-9a-f]{6}; --map-line:\s*#121419/gi);
  assert.equal(dark.length, 2, "two dark blocks (phone dark and chosen dark)");
  for (const d of dark) {
    const [base, muscle] = [...d.matchAll(/#[0-9a-f]{6}/gi)].map((m) => parseInt(m[0].slice(1), 16));
    assert.ok(base > 0x1c1f26 && muscle > 0x2c313b, d);
  }
});
