// Diet tab (build step 7): static checks on the new page files. Files are read as text (no page needed).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = (p) => readFileSync(new URL(`../app/${p}`, import.meta.url), "utf8");
const FILES = ["js/diet/diet.js", "js/diet/sheets.js", "js/diet/scan.js", "js/diet/foodapp.js"];

test("D1 no innerHTML, outerHTML, insertAdjacentHTML, eval or new Function; no style attributes", () => {
  for (const f of [...FILES, "css/diet.css"]) {
    const t = src(f);
    if (f.endsWith(".js")) {
      assert.doesNotMatch(t, /innerHTML|outerHTML|insertAdjacentHTML|\beval\s*\(|new Function/, f);
      assert.doesNotMatch(t, /style\s*=|\.style\./, f);
      assert.doesNotMatch(t, /\bstyle:\s*/, f);
    }
  }
});

test("D2 the credit line and both links", () => {
  const t = src("js/diet/sheets.js");
  assert.match(t, /"Contains data from "/);
  assert.match(t, /"Open Food Facts"/);
  assert.match(t, /", available under the "/);
  assert.match(t, /"Open Database License"/);
  assert.match(t, /target: "_blank", rel: "noopener noreferrer"/);
  assert.match(t, /OFF_CREDIT_LINKS\.off/);
  assert.match(t, /OFF_CREDIT_LINKS\.odbl/);
  assert.match(src("js/diet/diet.js"), /creditLine\(\)/);
});

test("D3 off.search runs only in a submit or a tap, never while typing", () => {
  const t = src("js/diet/sheets.js");
  const calls = [...t.matchAll(/off\.search\(/g)];
  assert.equal(calls.length, 1);
  // the only caller of runSearch is the form's submit handler; the input handler only redraws your own foods
  assert.equal([...t.matchAll(/runSearch\(\)/g)].length, 2); // the definition's call site in onsubmit, and no other
  assert.match(t, /onsubmit: \(e\) => \{ e\.preventDefault\(\); runSearch\(\); \}/);
  const inputHandler = t.match(/oninput: \(e\) => \{ q = e\.target\.value; drawMine\(\); \}/);
  assert.ok(inputHandler);
  assert.doesNotMatch(inputHandler[0], /off\./);
});

test("D4 the scanner stops on hashchange, pagehide and visibilitychange, and exports stopScanner", () => {
  const t = src("js/diet/scan.js");
  assert.match(t, /export function stopScanner/);
  for (const ev of ["hashchange", "pagehide"]) {
    assert.ok(t.includes(`window.addEventListener("${ev}", close)`), ev);
    assert.ok(t.includes(`window.removeEventListener("${ev}", close)`), ev);
  }
  assert.match(t, /document\.addEventListener\("visibilitychange", onVisibility\)/);
  assert.match(t, /document\.removeEventListener\("visibilitychange", onVisibility\)/);
  assert.match(t, /document\.hidden/);
  assert.match(t, /scanner\.stop\(\)/);
  assert.doesNotMatch(t, /location\.hash\s*=/);
});

test("D5 main.js stops the scanner first in render(), draws Diet, and redraws it after a sync", () => {
  const t = src("js/main.js");
  assert.match(t, /function render\(\) \{\s*const root = document\.getElementById\("app"\);\s*stopScanner\(\)/);
  assert.match(t, /diet: renderDiet/);
  assert.match(t, /"#\/diet"/);
});

test("D6 the tab order is Today, Plan, Gym, Diet, Progress", () => {
  const t = src("js/ui/parts.js");
  const m = t.match(/const TABS = \[(.*)\];/)[1];
  assert.deepEqual([...m.matchAll(/\["(\w+)"/g)].map((x) => x[1]), ["today", "plan", "gym", "diet", "progress"]);
});

test("D7 diet.css uses only tokens that exist in app.css (raw colours only in the dark scanner block)", () => {
  const css = src("css/diet.css");
  const app = src("css/app.css");
  const defined = new Set([...app.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  for (const m of css.matchAll(/var\((--[\w-]+)/g)) assert.ok(defined.has(m[1]), `${m[1]} is not defined in app.css`);
  const outside = css.replace(/\/\* scanner[\s\S]*?(?=\n\/\* backup)/, ""); // the scanner block
  assert.doesNotMatch(outside.replace(/\/\*[\s\S]*?\*\//g, ""), /#[0-9a-fA-F]{3,8}\b/, "raw hex colour outside the scanner block");
});

test("D8 the page loads diet.css and the Open Food Facts address stays in the CSP", () => {
  const html = src("index.html");
  assert.match(html, /css\/diet\.css/);
  assert.match(html, /connect-src[^"]*https:\/\/world\.openfoodfacts\.org/);
});
