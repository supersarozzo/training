// Version 0.7.1 (worker 8.39): problems Rosario found on the iPhone with 0.7.0 (Training Agent, P1 and P4).
// P1: a soft blur at the top. iOS 26+ draws its own blur under the status bar of a Home Screen app (the scroll edge
// effect); a page can not turn it off. Ours: a green glow at the top of the page, which iOS blurs into fog, and the
// first line of every screen sat inside that blur. So: no glow, and in the Home Screen app the screen starts lower.
// P4: no double-tap zoom anywhere (Rosario's standing taste), pinch-zoom stays.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = (f) => readFileSync(new URL(`../app/css/${f}`, import.meta.url), "utf8");
const html = readFileSync(new URL("../app/index.html", import.meta.url), "utf8");

test("P1-1 the page background is one plain colour (no glow for iOS to blur at the top)", () => {
  const t = css("app.css");
  assert.doesNotMatch(t, /canvas-glow/);
  assert.match(t, /body \{\n  margin: 0; background: var\(--bg-canvas\); color/);
});

test("P1-2 in the Home Screen app the top of each screen clears the iOS blur", () => {
  const t = css("app.css");
  assert.match(t, /--top-clear: 0px;/);
  assert.match(t, /@media \(display-mode: standalone\) \{ :root \{ --top-clear: \d+px; \} \}/);
  // every place that starts below the status bar uses it
  for (const [file, re] of [
    ["app.css", /\.screen \{[^}]*padding: calc\(var\(--s4\) \+ var\(--top-clear\) \+ env\(safe-area-inset-top\)\)/],
    ["app.css", /\.gear \{\n  position: absolute; z-index: 2; top: calc\(var\(--s4\) \+ var\(--top-clear\) \+ env\(safe-area-inset-top\)\)/],
    ["v060.css", /top: calc\(var\(--s4\) \+ var\(--top-clear\) \+ env\(safe-area-inset-top\)\)/],
    ["diet.css", /\.scan-head \{[^}]*padding: calc\(var\(--s4\) \+ var\(--top-clear\) \+ env\(safe-area-inset-top\)\)/],
  ]) assert.match(css(file), re, file);
  for (const f of ["app.css", "v060.css", "diet.css"]) {
    assert.doesNotMatch(css(f), /calc\(var\(--s4\) \+ env\(safe-area-inset-top\)\)/, `${f}: a top that ignores --top-clear`);
  }
});

test("P1-3 the status bar stays 'default' (never black-translucent: iOS 26 cut 47 px off the bottom)", () => {
  assert.match(html, /<meta name="apple-mobile-web-app-status-bar-style" content="default">/);
  assert.match(css("app.css"), /html \{[^}]*background: var\(--bg-canvas\)/);
});

test("P4-1 no double-tap zoom on any part of the page; pinch-zoom stays", () => {
  const t = css("app.css");
  assert.match(t, /html, body, \*, \*::before, \*::after \{ touch-action: manipulation; \}/);
  assert.doesNotMatch(html, /user-scalable=no|maximum-scale/);
  for (const f of ["app.css", "v060.css", "diet.css"]) assert.doesNotMatch(css(f), /touch-action: none/, f);
});
