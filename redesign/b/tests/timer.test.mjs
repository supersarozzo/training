import test from "node:test";
import assert from "node:assert/strict";
import { remainingMs, startTimer, adjustTimer, ringFraction, formatClock, endedLongAgo } from "../app/js/timer.js";

test("a timer is an end time: the time left is right however long the page was paused", () => {
  const t0 = 1_000_000;
  const end = startTimer(90, t0);
  assert.equal(end, t0 + 90_000);
  assert.equal(remainingMs(end, t0), 90_000);
  // the phone is locked for 50 seconds: no ticks happened, the answer is still right
  assert.equal(remainingMs(end, t0 + 50_000), 40_000);
  assert.equal(remainingMs(end, t0 + 200_000), 0); // never negative
});

test("format: whole seconds rounded up, so 0:00 only shows when the time is over", () => {
  assert.equal(formatClock(90_000), "1:30");
  assert.equal(formatClock(89_001), "1:30");
  assert.equal(formatClock(1), "0:01");
  assert.equal(formatClock(0), "0:00");
  assert.equal(formatClock(600_000), "10:00");
});

test("+30 s and -30 s; the end never goes before now", () => {
  const now = 5_000_000;
  assert.equal(adjustTimer(now + 60_000, 30, now), now + 90_000);
  assert.equal(adjustTimer(now + 60_000, -30, now), now + 30_000);
  assert.equal(adjustTimer(now + 10_000, -30, now), now);
});

test("ring fraction and the quiet end after a long lock", () => {
  const end = 100_000;
  assert.equal(ringFraction(end, 100_000, 0), 0);
  assert.equal(ringFraction(end, 100_000, 50_000), 0.5);
  assert.equal(ringFraction(end, 100_000, 150_000), 1);
  assert.equal(ringFraction(end, 0, 0), 1);
  assert.equal(endedLongAgo(end, end + 1000), false);
  assert.equal(endedLongAgo(end, end + 10_000), true);
});
