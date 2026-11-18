// 0.7.4 (worker 8.41, Training Agent scope add; Rosario: "you need to disable double tap in the app so it doesnt zoom").
// The CSS `touch-action: manipulation` on every element (0.7.1, P4) stays. A small guard in app/js/ui/tapzoom.js adds a
// second line: on a second tap within 300 ms and 40 px of the first, it cancels the touchend (no double-tap zoom) and
// replays the click itself, so a quick second tap on a button still counts. It never touches typing fields, a single tap,
// a scroll or a pinch, and the viewport keeps pinch zoom (no maximum-scale, no user-scalable=no).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tz = await import("../app/js/ui/tapzoom.js");
const src = (p) => readFileSync(new URL(`../app/${p}`, import.meta.url), "utf8").replaceAll("\r\n", "\n");

// ---------- made-up elements and events (no browser needed) ----------
function el(tagName, { parent = null, attrs = {}, editable = false, disabled = false } = {}) {
  const node = {
    nodeType: 1, tagName, parentElement: parent, disabled, isContentEditable: editable, dispatched: [],
    getAttribute: (k) => (Object.hasOwn(attrs, k) ? attrs[k] : null),
    dispatchEvent(ev) { this.dispatched.push(ev); return true; },
  };
  return node;
}
function fakeDoc() {
  const on = {};
  return { on, addEventListener: (type, fn, opts) => { on[type] = { fn, opts }; } };
}
const touch = (x, y) => ({ clientX: x, clientY: y });
function tap(doc, target, t, x = 100, y = 200, { moveTo = null, fingers = 1 } = {}) {
  const prevented = { n: 0 };
  const list = Array.from({ length: fingers }, () => touch(x, y));
  doc.on.touchstart.fn({ target, touches: list, changedTouches: list, timeStamp: t });
  const end = moveTo ? touch(...moveTo) : touch(x, y);
  doc.on.touchend.fn({ target, touches: fingers > 1 ? list.slice(1) : [], changedTouches: [end], timeStamp: t + 40, preventDefault: () => { prevented.n++; } });
  return prevented.n;
}
globalThis.MouseEvent ??= class { constructor(type, init) { this.type = type; Object.assign(this, init); } };

test("D1 isDoubleTap: a second tap within 300 ms and 40 px of the first; nothing else", () => {
  const a = { t: 1000, x: 100, y: 200 };
  assert.equal(tz.isDoubleTap(a, { t: 1250, x: 110, y: 210 }), true);
  assert.equal(tz.isDoubleTap(a, { t: 1300, x: 100, y: 200 }), true, "300 ms is still a double tap");
  assert.equal(tz.isDoubleTap(a, { t: 1301, x: 100, y: 200 }), false, "slower: two single taps");
  assert.equal(tz.isDoubleTap(a, { t: 1100, x: 141, y: 200 }), false, "far apart: two places");
  assert.equal(tz.isDoubleTap(a, { t: 990, x: 100, y: 200 }), false, "time going back");
  assert.equal(tz.isDoubleTap(null, a), false, "no first tap");
  assert.equal(tz.isDoubleTap({ t: NaN, x: 0, y: 0 }, a), false);
});

test("D2 the typing filter: inputs, text areas, selects and editable text are never touched", () => {
  for (const tag of ["INPUT", "TEXTAREA", "SELECT"]) assert.equal(tz.isTypingTarget(el(tag)), true, tag);
  const box = el("DIV", { attrs: { contenteditable: "true" }, editable: true });
  assert.equal(tz.isTypingTarget(el("SPAN", { parent: box, editable: true })), true, "inside editable text");
  assert.equal(tz.isTypingTarget(el("SPAN", { parent: el("DIV", { attrs: { contenteditable: "" } }) })), true, 'contenteditable=""');
  assert.equal(tz.isTypingTarget(el("SPAN", { parent: el("DIV", { attrs: { contenteditable: "false" } }) })), false);
  assert.equal(tz.isTypingTarget(el("BUTTON")), false);
  assert.equal(tz.isTypingTarget(el("SPAN", { parent: el("LABEL", { parent: el("DIV") }) })), false);
  assert.equal(tz.isTypingTarget(null), false);
  const text = { nodeType: 3, parentElement: el("TEXTAREA") };
  assert.equal(tz.isTypingTarget(text), true, "a text node counts as its element");
});

test("D3 a single tap is never blocked and never replayed", () => {
  const doc = fakeDoc();
  tz.guardDoubleTap(doc);
  assert.equal(doc.on.touchend.opts.passive, false, "touchend can be cancelled");
  assert.equal(doc.on.touchstart.opts.passive, true);
  const b = el("BUTTON");
  assert.equal(tap(doc, b, 1000), 0);
  assert.equal(tap(doc, b, 2000), 0, "a second tap a second later is a new single tap");
  assert.equal(b.dispatched.length, 0);
});

test("D4 a quick second tap: the zoom is cancelled and the tap still counts (one click, on the tapped element)", () => {
  const doc = fakeDoc();
  tz.guardDoubleTap(doc);
  const plus = el("BUTTON", { attrs: { "aria-label": "More Portion" } });
  const icon = el("svg", { parent: plus }); // the + icon inside the button
  assert.equal(tap(doc, icon, 1000), 0);
  assert.equal(tap(doc, icon, 1200, 104, 203), 1, "second tap: touchend cancelled");
  assert.equal(icon.dispatched.length, 1);
  const ev = icon.dispatched[0];
  assert.equal(ev.type, "click");
  assert.equal(ev.bubbles, true, "it bubbles to the button's handler, like a real click");
  assert.equal(tap(doc, icon, 1400, 104, 203), 1, "a third quick tap is guarded too");
  assert.equal(icon.dispatched.length, 2, "every quick tap counts once");
  const text = el("P");
  assert.equal(tap(doc, text, 3000), 0);
  assert.equal(tap(doc, text, 3200), 1, "plain text: no zoom either");
});

test("D5 typing fields, scrolls, pinches, far taps and disabled buttons", () => {
  const doc = fakeDoc();
  tz.guardDoubleTap(doc);
  const input = el("INPUT");
  tap(doc, input, 1000);
  assert.equal(tap(doc, input, 1150), 0, "a double tap in a field selects a word: left alone");
  assert.equal(input.dispatched.length, 0);
  const p = el("P");
  tap(doc, p, 5000);
  assert.equal(tap(doc, p, 5150, 100, 200, { moveTo: [100, 260] }), 0, "a scroll is not a tap");
  tap(doc, p, 7000);
  assert.equal(tap(doc, p, 7150, 100, 200, { fingers: 2 }), 0, "a pinch is never cancelled");
  tap(doc, p, 9000, 100, 200);
  assert.equal(tap(doc, p, 9150, 300, 200), 0, "far apart");
  const off = el("BUTTON", { disabled: true });
  const inner = el("SPAN", { parent: off });
  tap(doc, inner, 11000);
  assert.equal(tap(doc, inner, 11150), 1, "no zoom");
  assert.equal(inner.dispatched.length, 0, "a disabled button gets no click");
});

test("D6 wiring: started once in main.js, in the offline list, pinch zoom kept, the CSS line kept, no data in the page", () => {
  assert.match(src("js/main.js"), /import \{ guardDoubleTap \} from "\.\/ui\/tapzoom\.js";/);
  assert.match(src("js/main.js"), /\nguardDoubleTap\(\);/);
  assert.match(src("sw.js"), /"js\/ui\/tapzoom\.js",/);
  const viewport = src("index.html").match(/<meta name="viewport" content="([^"]+)">/)[1];
  assert.doesNotMatch(viewport, /maximum-scale|user-scalable|minimum-scale/, "pinch zoom stays");
  assert.match(src("css/app.css"), /html, body, \*, \*::before, \*::after \{ touch-action: manipulation; \}/);
  const code = src("js/ui/tapzoom.js").split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  assert.doesNotMatch(code, /innerHTML|console|style/);
});

// ---------- Review gaps (auditor, 2026-11-18) ----------
test("D7 a short drag (15 to 45 px) is a scroll: never cancelled, never a first tap; a touchend that cannot be cancelled gets no replay", () => {
  const doc = fakeDoc();
  tz.guardDoubleTap(doc);
  const row = el("DIV");
  for (const d of [15, 30, 45]) {
    tap(doc, row, 1000 * d);
    assert.equal(tap(doc, row, 1000 * d + 150, 100, 200, { moveTo: [100, 200 + d] }), 0, `${d} px drag after a tap`);
    assert.equal(tap(doc, row, 1000 * d + 300), 0, `a tap right after a ${d} px drag is a first tap`);
  }
  assert.equal(row.dispatched.length, 0);
  // iOS could mark a touchend as not cancellable: then the phone's own click comes, so no second click from us.
  const b = el("BUTTON");
  tap(doc, b, 90000);
  doc.on.touchstart.fn({ target: b, touches: [touch(100, 200)], changedTouches: [touch(100, 200)], timeStamp: 90150 });
  doc.on.touchend.fn({ target: b, touches: [], changedTouches: [touch(100, 200)], timeStamp: 90190, cancelable: false, preventDefault: () => {} });
  assert.equal(b.dispatched.length, 0, "no replayed click when the tap could not be cancelled");
});

// ---------- Review gaps (checker, 2026-11-18) ----------
test("D8 the guard starts exactly once; a button that left the screen between finger down and up gets no replayed click", () => {
  const calls = src("js/main.js").split("\n").filter((l) => !l.trim().startsWith("//") && /guardDoubleTap\(\)/.test(l));
  assert.equal(calls.length, 1, "one call: every extra call would add listeners and replay extra clicks");
  const doc = fakeDoc();
  tz.guardDoubleTap(doc);
  const old = el("BUTTON");
  old.isConnected = false; // the rest timer ended and the screen changed under the finger
  tap(doc, old, 1000);
  assert.equal(tap(doc, old, 1150), 1, "still no zoom");
  assert.equal(old.dispatched.length, 0, "no click on a button that is gone");
  const field = el("INPUT");
  const plus = el("BUTTON");
  tap(doc, field, 3000);
  assert.equal(tap(doc, plus, 3150), 0, "a field tap then a button tap: the button tap is a first tap");
  assert.equal(tap(doc, plus, 3300), 1);
  assert.equal(tap(doc, plus, 3450), 1, "the fourth quick tap too");
  assert.equal(plus.dispatched.length, 2);
});
