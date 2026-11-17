// Plan v2 sections 3, 9 and 11: the walk. Starting settings are tested in nutrition.test.mjs (question 36 rows).
import test from "node:test";
import assert from "node:assert/strict";
import { nextWalkBase, walkForDay, walkAfterBreak, startWalk } from "../app/js/engine/walk.js";
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
  const atTwelve = nextWalkBase({ speed_kmh: 5.0, slope_pct: 12 }, [walk(5), walk(5)]);
  assert.deepEqual([atTwelve.speed_kmh, atTwelve.slope_pct, atTwelve.reason], [5.2, 12, "speed"]);
  assert.equal(nextWalkBase({ speed_kmh: 5.0, slope_pct: 11 }, [walk(5), walk(5)]).slope_pct, 12);
});

test("speed stops at about 6 km/h (still walking)", () => {
  const near = nextWalkBase({ speed_kmh: 5.9, slope_pct: 12 }, [walk(5), walk(5)]);
  assert.equal(near.speed_kmh, 6);
  const top = nextWalkBase({ speed_kmh: 6, slope_pct: 12 }, [walk(5), walk(5)]);
  assert.deepEqual([top.speed_kmh, top.slope_pct, top.reason], [6, 12, "same"]);
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
  assert.equal(walkRules.maxSpeed_kmh, 6);
});
