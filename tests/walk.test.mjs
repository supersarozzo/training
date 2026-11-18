// Plan v2 sections 3, 9 and 11: the walk. Starting settings are tested in nutrition.test.mjs (question 36 rows).
import test from "node:test";
import assert from "node:assert/strict";
import { nextWalkBase, walkForDay, walkAfterBreak, startWalk, walkMets } from "../app/js/engine/walk.js";
import { weeks, walkRules } from "../app/js/plan/plan-v2.js";

const walk = (effort, extra = {}) => ({ effort, ...extra });
const base = { speed_kmh: 5.0, slope_pct: 6 };

test("two walks in a row at 5 of 10 or easier -> add 1 % slope", () => {
  const r = nextWalkBase(base, [walk(5), walk(4)]);
  assert.deepEqual([r.speed_kmh, r.slope_pct, r.reason], [5.0, 7, "slope"]);
});

test("one easy walk is not enough; a harder walk breaks the chain", () => {
  assert.equal(nextWalkBase(base, [walk(4)]).slope_pct, 6);
  assert.equal(nextWalkBase(base, []).slope_pct, 6);
  assert.equal(nextWalkBase(base, [walk(4), walk(6)]).slope_pct, 6);
  assert.equal(nextWalkBase(base, [walk(6), walk(4)]).slope_pct, 6);
  assert.equal(nextWalkBase(base, [walk(3), walk(5), walk(4)]).slope_pct, 7); // the last two count
});

test("slope goes up to 12 %, then speed goes up 0.2 km/h", () => {
  const atTwelve = nextWalkBase({ speed_kmh: 4.6, slope_pct: 12 }, [walk(5), walk(5)]);
  assert.deepEqual([atTwelve.speed_kmh, atTwelve.slope_pct, atTwelve.reason], [4.8, 12, "speed"]);
  assert.equal(nextWalkBase({ speed_kmh: 5.0, slope_pct: 11 }, [walk(5), walk(5)]).slope_pct, 12);
});

// Trainer decision 2026-11-18 (D3, docs/plan/2026-11-18-trainer-decisions.md): the top speed is 5.0 km/h, not 6.
// 12 % at 6 km/h is about 10 METs (vigorous); 12 % at 5 km/h is about 8.5 METs, close to the 12-3-30 walk.
test("speed stops at 5 km/h (trainer decision D3)", () => {
  const near = nextWalkBase({ speed_kmh: 4.9, slope_pct: 12 }, [walk(5), walk(5)]);
  assert.equal(near.speed_kmh, 5);
  const top = nextWalkBase({ speed_kmh: 5, slope_pct: 12 }, [walk(5), walk(5)]);
  assert.deepEqual([top.speed_kmh, top.slope_pct, top.reason], [5, 12, "same"]);
  // a speed already above the top (typed after a walk) is never raised further
  const above = nextWalkBase({ speed_kmh: 5.4, slope_pct: 12 }, [walk(5), walk(5)]);
  assert.deepEqual([above.speed_kmh, above.reason], [5.4, "same"]);
});

test("the top of the walk stays below about 8.6 METs; the old top was about 10 (trainer decision D3)", () => {
  const top = walkMets(walkRules.maxSpeed_kmh, walkRules.maxSlope_pct);
  assert.ok(top <= 8.6, `top is ${top} METs`);
  assert.ok(walkMets(6, 12) >= 9.9, "the old top (6 km/h, 12 %) was vigorous");
  assert.ok(Math.abs(top - walkMets(4.8, 12)) < 0.5, "close to the 12-3-30 walk (12 %, about 4.8 km/h)");
  // leg days: the top is 2 % lower
  assert.equal(walkForDay({ speed_kmh: 5, slope_pct: walkRules.maxSlope_pct }, true).slope_pct, 10);
});

test("finishing out of breath -> the next walk is 1 % less steep", () => {
  const r = nextWalkBase(base, [walk(5), walk(5, { breathless: true })]);
  assert.deepEqual([r.slope_pct, r.reason], [5, "breathless"]);
  assert.equal(nextWalkBase({ speed_kmh: 5, slope_pct: 0 }, [walk(7, { breathless: true })]).slope_pct, 0);
});

test("easier weeks and no-increase weeks do not progress the walk (plan v2 section 10)", () => {
  const easy = [walk(4), walk(4)];
  for (const w of weeks) {
    const r = nextWalkBase(base, easy, { allowProgress: w.walkProgress });
    assert.equal(r.slope_pct, w.walkProgress ? 7 : 6, `week ${w.week}`);
  }
  assert.equal(weeks[10].walkProgress, false); // week 11: no increase
  assert.equal(weeks[5].walkProgress, false); // week 6
});

test("leg days stay 2 % below the other days, with an easier effort", () => {
  assert.deepEqual(walkForDay({ speed_kmh: 5, slope_pct: 8 }, true), { speed_kmh: 5, slope_pct: 6, effortRange: [4, 5] });
  assert.deepEqual(walkForDay({ speed_kmh: 5, slope_pct: 8 }, false), { speed_kmh: 5, slope_pct: 8, effortRange: [5, 6] });
  assert.equal(walkForDay({ speed_kmh: 5, slope_pct: 1 }, true).slope_pct, 0);
});

test("after a break: 2 to 4 weeks -> 2 % less slope; over 4 weeks -> back to the start", () => {
  const start = { speed_kmh: 5.0, slope_pct: 6 };
  const now = { speed_kmh: 5.4, slope_pct: 10 };
  assert.deepEqual(walkAfterBreak(now, start, "weeks_2_4"), { speed_kmh: 5.4, slope_pct: 8 });
  assert.deepEqual(walkAfterBreak(now, start, "over_4_weeks"), start);
  assert.deepEqual(walkAfterBreak(now, start, "carry_on"), now);
  assert.equal(walkAfterBreak({ speed_kmh: 5, slope_pct: 1 }, start, "weeks_2_4").slope_pct, 0);
});

test("the 12-3-30 walk is a later target, not a start", () => {
  for (const fit of ["yes", "not_sure", "no"]) {
    const s = startWalk(fit);
    assert.ok(s.slope_pct < 12 && s.speed_kmh < 4.8 + 0.8);
  }
  assert.equal(walkRules.maxSlope_pct, 12);
  assert.equal(walkRules.maxSpeed_kmh, 5); // trainer decision D3 (was 6)
});

// ---------- the walk screens (app/js/ui/walk.js) ----------
// Trainer decisions D6 and D7 (docs/plan/2026-11-18-trainer-decisions.md): a small change before the walk
// (speed up to 0.5 km/h either way, slope up to 2 % either way, never above the plan's top), and the result screen
// records walking speeds only (up to 7 km/h). Drives the screens on a small pretend page. All values are made up.
import { installFakeDom } from "./fixtures/fake-dom.mjs";
import { fakeStorage } from "./fixtures/profiles.mjs";

installFakeDom();
globalThis.window = { addEventListener: () => {}, localStorage: fakeStorage(), matchMedia: () => ({ matches: false, addEventListener: () => {} }) };
const body = new Node("body");
body.querySelector = () => null;
document.body = body;
globalThis.location = { hash: "#/workout" };
Node.prototype.remove = function remove() {};
Node.prototype.querySelector = function querySelector() { return null; };
Node.prototype.querySelectorAll = function querySelectorAll() { return []; };
Object.defineProperty(Node.prototype, "style", { get() { return (this._style ??= {}); } }); // choiceRow sets a grid style

const { store } = await import("../app/js/ui/app.js");
const ui = await import("../app/js/ui/walk.js");
const { getActive } = await import("../app/js/active.js");
const { clearTickers } = await import("../app/js/timer.js");
test.after(() => clearTickers()); // even when a test fails, stop the ring's ticks so the file ends

const all = (n, out = []) => { out.push(n); for (const c of n.childNodes ?? []) all(c, out); return out; };
const text = (n) => all(n).filter((x) => x.tagName === "#TEXT").map((x) => x.textContent).join("");
const flat = (nodes) => nodes.flatMap((n) => all(n));
const byLabel = (nodes, label) => flat(nodes).find((n) => n.attributes?.["aria-label"] === label);
const buttonsIn = (nodes, words) => flat(nodes).filter((n) => n.tagName === "BUTTON" && text(n).includes(words));
const plan = (over = {}) => ({ speed_kmh: 4.6, slope_pct: 8, minutes: 30, buildUpMinutes: 3, buildUp: { speed_kmh: 4, slope_pct: 2 }, effortRange: [5, 6], note: "Same as last time.", ...over });
const session = { id: "s-20260119-abcdef", kind: "full" };
const startActive = (extra = {}) => {
  store.saveDevice({ active: { session_id: session.id, phase: "walk", timer_end: null, timer_total: null, rest: null, hold: null, ...extra } });
  return getActive();
};

test("W1 the change before the walk: 0.5 km/h and 2 % either way, never above the plan's top", () => {
  assert.deepEqual(ui.adjustRange(plan(), false), { speed: [4.1, 5], slope: [6, 10] });
  assert.deepEqual(ui.adjustRange(plan({ speed_kmh: 5, slope_pct: 12 }), false), { speed: [4.5, 5], slope: [10, 12] });
  assert.deepEqual(ui.adjustRange(plan({ speed_kmh: 5, slope_pct: 10 }), true).slope, [8, 10], "leg days: top 10 %");
  assert.deepEqual(ui.adjustRange(plan({ speed_kmh: 4, slope_pct: 1 }), false), { speed: [3.5, 4.5], slope: [0, 3] });
  // a pick already above the top (an older saved walk) can be kept, not raised
  assert.deepEqual(ui.adjustRange(plan({ speed_kmh: 5.4, slope_pct: 12 }), false).speed, [4.9, 5.4]);
});

test("W2 today's settings: the plan's pick, or the change made before the start, kept inside the range", () => {
  assert.deepEqual(ui.walkTarget(plan(), {}, false), { speed_kmh: 4.6, slope_pct: 8, changed: false });
  assert.deepEqual(ui.walkTarget(plan(), { walk_adjust: { speed_kmh: 4.2, slope_pct: 7 } }, false), { speed_kmh: 4.2, slope_pct: 7, changed: true });
  assert.deepEqual(ui.walkTarget(plan(), { walk_adjust: { speed_kmh: 9, slope_pct: 30 } }, false), { speed_kmh: 5, slope_pct: 10, changed: true });
  assert.deepEqual(ui.walkTarget(plan(), { walk_adjust: { speed_kmh: "x", slope_pct: null } }, false), { speed_kmh: 4.6, slope_pct: 8, changed: false });
});

test("W3 the walk screen offers the change; a tap on + saves it on the phone and the plan's pick stays in view", () => {
  const act = startActive();
  const nodes = ui.renderWalk({ act, session, walk: plan(), legDay: false });
  const open = buttonsIn(nodes, "Change speed or slope");
  assert.equal(open.length, 1, "one button to change speed or slope");
  assert.equal(byLabel(nodes, "More Slope"), undefined, "the steppers are hidden until asked");
  open[0].click();
  const more = byLabel(nodes, "More Slope");
  assert.ok(more, "the slope stepper is shown");
  more.click();
  assert.deepEqual(getActive().walk_adjust, { speed_kmh: 4.6, slope_pct: 9 });
  assert.ok(text({ childNodes: nodes }).includes("Plan's pick: 4.6 km/h · 8 %"), "the plan's pick stays in view");
  // the stepper stops at the range
  for (let i = 0; i < 5; i++) more.click();
  assert.equal(getActive().walk_adjust.slope_pct, 10);
});

test("W4 the result starts from the changed settings and records walking speeds only (up to 7 km/h)", () => {
  const act = startActive({ walk_adjust: { speed_kmh: 4.4, slope_pct: 7 }, timer_end: Date.now() + 60000, timer_total: 1800000 });
  assert.ok(ui.renderWalk({ act, session, walk: plan(), legDay: false }).length > 0, "the running screen draws");
  clearTickers(); // the running ring ticks every 250 ms; stop it so the test ends
  const result = ui.renderWalkResult({ act, session, walk: plan(), legDay: false });
  const speed = byLabel(result, "Speed");
  const slope = byLabel(result, "Slope");
  assert.equal(speed.attributes.value, "4.4");
  assert.equal(slope.attributes.value, "7");
  const moreSpeed = byLabel(result, "More Speed");
  for (let i = 0; i < 40; i++) moreSpeed.click();
  assert.equal(speed.value, "7");
  const moreSlope = byLabel(result, "More Slope");
  for (let i = 0; i < 40; i++) moreSlope.click();
  assert.equal(slope.value, "15");
});
