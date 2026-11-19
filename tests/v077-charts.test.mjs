// Version 0.7.7 (worker 8.44): the calories chart on Progress and the body weight chart made easy to find.
// Mock-up v4 (checker PASS): https://claude.ai/artifact/Y2WQ8xGZS7EntFb9QrsmfV. Rosario's answers, 2026-11-18 ("All
// recommended"): 101 a (a 7 days | 30 days switch, 7 days first), 102 a (plain 2 px line, no glow, no shaded area),
// 103 a (Body weight, then Calories, then the workout totals).
// - Daily totals come from the food log: one value per day, a day with no food is a gap (null), never a 0.
// - "Average a day" is the same number as Diet's "Last 7 days, average" (the days before today, days with food only).
// - The target is today's profile target (the app keeps no history of targets); none: no dashed line.
// - The chart scale: at most 4 grid lines, steps 1, 2 or 5 times 10^n, the first line may sit on a half step.
// Written BEFORE the build (most fail until it). All numbers are made up; no body data.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { install } from "./fixtures/sheet-dom.mjs";
import { niceScale } from "../app/js/chartmath.js";

const { body } = install();
globalThis.requestAnimationFrame = () => 0;
globalThis.window.navigator = { standalone: true, onLine: true };
globalThis.window.matchMedia = () => ({ matches: true, addEventListener() {} });
globalThis.window.scrollY = 0;
globalThis.window.scrollTo = (x, y) => { globalThis.window.scrollY = y; };
Object.assign(globalThis.location, { hostname: "localhost", search: "?date=2026-11-18", hash: "#/progress" }); // the app's test date
if (!Object.getOwnPropertyDescriptor(globalThis.Node.prototype, "firstChild")) {
  Object.defineProperty(globalThis.Node.prototype, "firstChild", { get() { return this.childNodes[0] ?? null; } });
}
const { store } = await import("../app/js/ui/app.js");
const { validDoc } = await import("./fixtures/profiles.mjs");
const { renderProgress } = await import("../app/js/ui/progress.js");
const { food: fm, foodStore } = await import("../app/js/diet/foodapp.js");
const FM = await import("../app/js/food/foodmath.js");

const TODAY = "2026-11-18"; // a Wednesday
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
// SVG elements get their class with setAttribute; HTML elements with className.
const cls = (n) => `${n.getAttribute?.("class") ?? ""} ${n.className ?? ""}`.split(/\s+/);
const byClass = (root, c) => [...root.walk()].filter((n) => cls(n).includes(c));
const rootOf = (out) => (Array.isArray(out) ? out[0] : out);
const h2s = (root) => root.querySelectorAll("h2").map((x) => x.textContent);
const addDays = (d, n) => { const t = new Date(`${d}T12:00:00Z`); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };

function resetFood() { foodStore.save({ ...fm.doc(), foods: [], food_log: [] }); }
function logKcal(daysAgo, kcal) { fm.quickAdd({ date: addDays(TODAY, -daysAgo), meal: "lunch", name: "Made-up meal", kcal, protein_g: 10 }); }
function workout(date) {
  return { id: `s-${date.replaceAll("-", "")}-mon`, updated_at: `${date}T10:00:00.000Z`, date, plan_day: "mon", week: 1, kind: "full", swapped_from: null, status: "finished",
    started_at: `${date}T08:00:00.000Z`, finished_at: `${date}T10:00:00.000Z`, walk: null, note: "", exercises: [
      { slot: "A1", plan_exercise: "leg_press", done_exercise: "leg_press", swap_reason: null, note: "", planned_sets: 2, planned_rest: null, sets: [{ n: 1, type: "work", weight_kg: 40, reps: 10, rir: 2 }] }] };
}
// Made-up weigh-ins, never real body numbers.
const W = [[24, 82.0], [21, 81.7], [17, 81.5], [14, 81.4], [10, 81.3], [7, 81.1], [3, 80.9], [0, 80.8]];
function setDoc({ weighins = true, sessions = true, kcalTarget = 2200 } = {}) {
  const doc = validDoc();
  doc.block.start_monday = "2026-11-09";
  doc.weighins = weighins ? W.map(([ago, kg]) => ({ id: `w-${ago}`, updated_at: `${addDays(TODAY, -ago)}T07:00:00.000Z`, date: addDays(TODAY, -ago), kg })) : [];
  doc.sessions = sessions ? [workout("2026-11-10"), workout("2026-11-16")] : [];
  doc.profile.targets = kcalTarget === null ? null : { kcal: kcalTarget, protein_g: 150, goal: "recomp", source: "manual" };
  store.save(doc);
}
const cardWith = (root, title) => root.querySelectorAll(".card").find((c) => c.querySelector("h2")?.textContent === title);

// ---------- the scale ----------

test("C-1 niceScale: at most 4 lines, steps 1, 2 or 5 times 10^n, a half-step start when it needs fewer lines", () => {
  assert.deepEqual(niceScale(80.6, 82.2).ticks, [80.5, 81.5, 82.5]); // the mock-up's weight chart (live: 5 lines)
  assert.deepEqual(niceScale(0, 2600).ticks, [0, 1000, 2000, 3000]); // calories from 0
  assert.deepEqual(niceScale(8, 12).ticks, [8, 10, 12]);
  for (let i = 0; i < 400; i++) {
    const lo = Math.round((((i * 37) % 997) / 7) * 10) / 10;
    const hi = lo + Math.round((((i * 53) % 409) / 3 + 0.1) * 10) / 10;
    const s = niceScale(lo, hi);
    assert.ok(s.ticks.length >= 2 && s.ticks.length <= 4, `${lo}..${hi}: ${s.ticks}`);
    assert.ok(s.min <= lo + 1e-9 && s.max >= hi - 1e-9, `${lo}..${hi} inside ${s.min}..${s.max}`);
    assert.ok(s.min >= 0, `${lo}..${hi}: data from 0 up never gets a line below 0 (${s.min})`);
    const norm = s.step / 10 ** Math.floor(Math.log10(s.step) + 1e-9);
    assert.ok([1, 2, 5].some((x) => Math.abs(norm - x) < 1e-6), `step ${s.step}`);
    for (let k = 1; k < s.ticks.length; k++) assert.ok(Math.abs(s.ticks[k] - s.ticks[k - 1] - s.step) < 1e-6);
  }
  const flat = niceScale(80, 80);
  assert.ok(flat.min < 80 && flat.max > 80 && flat.ticks.length <= 4);
  assert.deepEqual(niceScale(NaN, 1).ticks, [0, 1]);
});

// ---------- daily totals from the food log ----------

test("C-2 dailyKcal: n days before today plus today, oldest first; a day with no food is null, never 0", () => {
  resetFood();
  logKcal(1, 1800); logKcal(1, 400); logKcal(3, 2100); logKcal(0, 900); logKcal(9, 2500);
  const zero = fm.quickAdd({ date: addDays(TODAY, -5), meal: "snack", name: "Made-up water", kcal: 0, protein_g: 0 });
  const gone = fm.quickAdd({ date: addDays(TODAY, -2), meal: "snack", name: "Made-up removed", kcal: 700, protein_g: 5 });
  fm.removeEntry(gone.id);
  fm.quickAdd({ date: addDays(TODAY, 1), meal: "lunch", name: "Made-up tomorrow", kcal: 999, protein_g: 5 });
  const d = FM.dailyKcal(fm.doc(), TODAY, 7);
  assert.equal(d.length, 8);
  assert.deepEqual(d.map((x) => x.date), [7, 6, 5, 4, 3, 2, 1, 0].map((n) => addDays(TODAY, -n)));
  assert.deepEqual(d.map((x) => x.kcal), [null, null, 0, null, 2100, null, 2200, 900], "removed entries and later days never count; 0 kcal logged is 0");
  assert.deepEqual(d.map((x) => x.today), [false, false, false, false, false, false, false, true]);
  assert.equal(FM.dailyKcal(fm.doc(), TODAY, 30).length, 31);
  assert.equal(FM.dailyKcal(fm.doc(), TODAY, 30)[21].kcal, 2500);
  assert.ok(zero.id);
});

test("C-3 averageDays: the same number as Diet's averageLast7 for 7 days; 30 days the same rule; today never counts", () => {
  resetFood();
  assert.equal(FM.averageDays(fm.doc(), TODAY, 7), null);
  logKcal(1, 2000); logKcal(2, 2300); logKcal(6, 1900); logKcal(0, 3000); logKcal(12, 2600); logKcal(31, 100);
  const a7 = FM.averageDays(fm.doc(), TODAY, 7);
  assert.deepEqual(a7, { days: 3, kcal: 2067 });
  assert.equal(a7.kcal, FM.averageLast7(fm.doc(), TODAY).kcal);
  assert.equal(a7.days, FM.averageLast7(fm.doc(), TODAY).days);
  assert.deepEqual(FM.averageDays(fm.doc(), TODAY, 30), { days: 4, kcal: 2200 }); // day 31 is outside
});

// ---------- the Progress screen ----------

test("C-4 order (answer 103 a): Body weight, then Calories, then the workout totals, the exercises, recent workouts", () => {
  resetFood(); logKcal(1, 2000);
  setDoc();
  const root = rootOf(renderProgress());
  const kids = root.childNodes;
  const at = (pred) => kids.findIndex(pred);
  const weight = at((c) => c.querySelector?.("h2")?.textContent === "Body weight");
  const kcal = at((c) => c.querySelector?.("h2")?.textContent === "Calories");
  const totals = at((c) => cls(c).includes("tiles"));
  const ex = at((c) => c.querySelector?.("h2")?.textContent === "Exercises");
  assert.ok(weight >= 0 && kcal > weight && totals > kcal && ex > totals, `order ${weight} ${kcal} ${totals} ${ex}`);
  assert.ok(!root.querySelectorAll(".eyebrow").some((e) => e.textContent === "Body weight"), "the card title is an h2, not an eyebrow");
});

test("C-5 the weight chart (answer 102 a): no glow, no shaded area, at most 4 grid lines, dates as '18 Nov', the legend line", () => {
  setDoc();
  const card = cardWith(rootOf(renderProgress()), "Body weight");
  assert.ok(card, "the Body weight card");
  assert.equal(card.querySelectorAll("linearGradient").length, 0, "no gradient");
  assert.ok(!card.querySelectorAll("path").some((p) => (p.getAttribute("fill") ?? "").startsWith("url(")), "no shaded area");
  const grid = byClass(card, "chart-grid");
  assert.ok(grid.length >= 2 && grid.length <= 4, `grid lines: ${grid.length}`);
  assert.ok(card.textContent.includes("18 Nov"), "the last weigh-in date in words");
  assert.ok(!card.textContent.includes("2026-11-18"), "no computer date");
  assert.ok(card.textContent.includes("Dots: each weigh-in. Line: the 7-day trend, the number to watch."));
  assert.ok(card.querySelector("a")?.getAttribute("href") === "#/weighin", "Weigh in stays");
});

test("C-6 the weight card with no weigh-ins draws an empty chart frame with the words inside, and a real title", () => {
  setDoc({ weighins: false });
  const card = cardWith(rootOf(renderProgress()), "Body weight");
  assert.ok(card);
  const svg = card.querySelector("svg");
  assert.ok(svg, "a chart frame is drawn");
  assert.ok(svg.textContent.includes("No data yet.") && svg.textContent.includes("Log a weigh-in to start the line."));
  assert.ok(card.querySelector("a")?.getAttribute("href") === "#/weighin");
});

test("C-7 the calories card, 7 days: bars for days with food, a gap mark for days without, today as an outline with 'so far', the target line", () => {
  resetFood();
  logKcal(1, 2100); logKcal(2, 1950); logKcal(4, 2400); logKcal(7, 2250); logKcal(0, 1240);
  setDoc();
  const card = cardWith(rootOf(renderProgress()), "Calories");
  assert.ok(card, "the Calories card");
  assert.equal(byClass(card, "chart-bar").length, 4, "one bar per day with food before today");
  assert.equal(byClass(card, "chart-gap").length, 3, "days 3, 5 and 6: a small dash, never a 0 bar");
  assert.equal(byClass(card, "chart-today").length, 1, "today as an outline");
  assert.ok(card.querySelector("svg").textContent.includes("so far"));
  assert.equal(byClass(card, "chart-target").length, 1, "the target as a dashed line");
  for (const w of ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Today"]) assert.ok(card.querySelector("svg").textContent.includes(w), w);
  const avg = FM.averageLast7(fm.doc(), TODAY).kcal;
  assert.equal(avg, 2175);
  assert.ok(card.textContent.includes("Average a day") && card.textContent.includes("2,175"), "the 7-day average, as on Diet");
  assert.ok(card.textContent.includes("7 days before today · 4 with food"));
  assert.ok(card.textContent.includes("2,200"), "the target number");
  assert.ok(card.textContent.includes("Bars: kcal eaten each day. No bar: no food logged. Today is not finished and not in the average."));
  assert.equal(card.querySelectorAll("a").find((a) => a.textContent === "Open Diet")?.getAttribute("href"), "#/diet");
  assert.ok(byClass(card, "chart-grid").length <= 4);
});

test("C-8 the 7 days | 30 days switch (answer 101 a): 7 days first; 30 days shows 31 slots, no 'so far', first date and Today", () => {
  resetFood();
  logKcal(1, 2100); logKcal(12, 1800); logKcal(29, 2500); logKcal(30, 2300); logKcal(0, 1000);
  setDoc();
  let card = cardWith(rootOf(renderProgress()), "Calories");
  const tabs = card.querySelectorAll("button").filter((b) => b.getAttribute("role") === "tab");
  assert.deepEqual(tabs.map((b) => b.textContent), ["7 days", "30 days"]);
  assert.equal(tabs[0].getAttribute("aria-selected"), "true");
  globalThis.window.scrollY = 640;
  tabs[1].click();
  assert.equal(globalThis.window.scrollY, 640, "the switch keeps your place on the page (a redraw would scroll to the top)");
  card = cardWith(rootOf(renderProgress()), "Calories");
  assert.equal(card.querySelectorAll("button").find((b) => b.textContent === "30 days").getAttribute("aria-selected"), "true");
  assert.equal(byClass(card, "chart-bar").length, 4);
  assert.equal(byClass(card, "chart-gap").length, 26);
  assert.equal(byClass(card, "chart-today").length, 1);
  const svgText = card.querySelector("svg").textContent;
  assert.ok(!svgText.includes("so far"), "no 'so far' in the 30-day view (it would cover bars)");
  assert.ok(svgText.includes("19 Oct") && svgText.includes("Today"), "first date and Today");
  assert.ok(card.textContent.includes("30 days before today · 4 with food"));
  assert.ok(card.textContent.includes("2,175"), "30-day average of the days with food");
  card.querySelectorAll("button").find((b) => b.textContent === "7 days").click(); // back to 7 for the next tests
});

test("C-9 the calories card with no target: no dashed line, the words say so", () => {
  resetFood(); logKcal(1, 2000);
  setDoc({ kcalTarget: null });
  const card = cardWith(rootOf(renderProgress()), "Calories");
  assert.equal(byClass(card, "chart-target").length, 0);
  assert.ok(card.textContent.includes("None") && card.textContent.includes("no calorie target set"));
});

test("C-10 the calories card with no food: an empty chart frame with the words inside, the switch and Open Diet", () => {
  resetFood();
  setDoc();
  const card = cardWith(rootOf(renderProgress()), "Calories");
  const svg = card.querySelector("svg");
  assert.ok(svg.textContent.includes("No food logged yet.") && svg.textContent.includes("Log food on the Diet tab to start the bars."));
  assert.equal(byClass(card, "chart-bar").length, 0);
  assert.ok(card.querySelectorAll("button").some((b) => b.textContent === "30 days"));
  assert.ok(card.querySelectorAll("a").some((a) => a.textContent === "Open Diet"));
  assert.ok(!card.textContent.includes("Average a day"), "no number to show");
});

test("C-11 food logged long ago but none in the window: the empty frame says which days", () => {
  resetFood(); logKcal(20, 2000);
  setDoc();
  const card = cardWith(rootOf(renderProgress()), "Calories");
  assert.ok(card.querySelector("svg").textContent.includes("No food logged in the last 7 days."));
});

test("C-12 every tab still draws, Progress buttons still work, with workouts, weigh-ins and food", () => {
  resetFood(); logKcal(1, 2000);
  setDoc();
  const root = rootOf(renderProgress());
  for (const b of root.querySelectorAll("button")) assert.doesNotThrow(() => b.click(), b.textContent);
  assert.ok(h2s(root).includes("Exercises") && h2s(root).includes("Recent workouts"), "nothing removed");
});

// ---------- the styles and the rules of the page ----------

test("C-13 styles: the chart line is 2 px with no glow; bar, today, gap and target styles exist; no gradient left in charts.js", () => {
  const css = read("../app/css/app.css");
  const line = css.match(/\.chart-line\s*\{([^}]*)\}/)[1];
  assert.match(line, /stroke-width:\s*2;/);
  assert.doesNotMatch(line, /filter/);
  for (const c of ["chart-bar", "chart-today", "chart-gap", "chart-target", "chart-empty-grid"]) assert.match(css, new RegExp(`\\.${c}\\s*\\{`), c);
  assert.match(css.match(/\.chart-target\s*\{([^}]*)\}/)[1], /stroke-dasharray/);
  const js = read("../app/js/ui/charts.js");
  assert.doesNotMatch(js, /linearGradient|url\(#/);
  for (const f of ["../app/js/ui/charts.js", "../app/js/ui/progress.js", "../app/js/chartmath.js"]) {
    const src = read(f);
    assert.doesNotMatch(src, /innerHTML|outerHTML|insertAdjacentHTML|eval\(|new Function|style:/, f);
  }
});

// ---------- review round 1 (checker): guards ----------

test("C-14 equal weigh-ins (float noise in the trend): the weight chart still has 2 to 4 grid lines and no NaN", () => {
  // 85.9 five times averages to 85.90000000000002: the range is not exactly 0 (checker M1, round 1).
  for (const [lo, hi] of [[85.9, 85.90000000000002], [0.1 + 0.2, 0.3], [1e6, 1e6 + 1e-9], [70, 70]]) {
    const s = niceScale(lo, hi);
    assert.ok(Number.isFinite(s.min) && Number.isFinite(s.max) && s.step > 0, `${lo}..${hi}: ${JSON.stringify(s)}`);
    assert.ok(s.ticks.length >= 2 && s.ticks.length <= 4, `${lo}..${hi}: ${s.ticks.length} lines`);
    assert.ok(s.min <= lo && s.max >= hi);
  }
  resetFood();
  const doc = validDoc();
  doc.weighins = [8, 6, 4, 2, 0].map((ago) => ({ id: `w-${ago}`, updated_at: `${addDays(TODAY, -ago)}T07:00:00.000Z`, date: addDays(TODAY, -ago), kg: 85.9 }));
  doc.sessions = [];
  store.save(doc);
  const card = cardWith(rootOf(renderProgress()), "Body weight");
  const grid = byClass(card, "chart-grid");
  assert.ok(grid.length >= 2 && grid.length <= 4, `${grid.length} grid lines`);
  for (const n of card.walk()) for (const a of ["d", "cx", "cy", "x1", "y1", "x2", "y2", "x", "y"]) {
    const v = n.getAttribute?.(a);
    if (v != null) assert.doesNotMatch(String(v), /NaN|Infinity/, `${a}="${v}"`);
  }
});

test("C-15 a target above every bar sits inside the chart: the axis reaches the target", () => {
  resetFood(); logKcal(1, 1500); logKcal(2, 1200); logKcal(0, 400);
  setDoc({ kcalTarget: 2200 });
  const card = cardWith(rootOf(renderProgress()), "Calories");
  const line = byClass(card, "chart-target")[0];
  const y = Number(line.getAttribute("y1"));
  assert.ok(y >= 24 && y <= 174, `target line at y ${y}, inside the drawing area 24..174`);
});

// ---------- review round 1 (auditor): guards ----------

test("C-16 the Trend and Target numbers in the mock-up's size (class second); 'so far' drawn over the target line with a halo; '4 with food' kept on one line", () => {
  resetFood(); logKcal(1, 2100); logKcal(2, 1900); logKcal(0, 2050);
  setDoc({ kcalTarget: 2200 });
  // C-12 tapped every button (also "30 days"): back to the 7-day view first.
  cardWith(rootOf(renderProgress()), "Calories").querySelectorAll("button").find((b) => b.textContent === "7 days").click();
  const root = rootOf(renderProgress());
  const weight = cardWith(root, "Body weight");
  const kcal = cardWith(root, "Calories");
  const trend = weight.querySelectorAll(".metric").find((m) => m.textContent.startsWith("Trend (7 days)"));
  assert.ok(trend.querySelector(".value").className.split(/\s+/).includes("second"), "Trend in the smaller size");
  const tgt = kcal.querySelectorAll(".metric").find((m) => m.textContent.startsWith("Target"));
  assert.ok(tgt.querySelector(".value").className.split(/\s+/).includes("second"), "Target in the smaller size");
  const svg = kcal.querySelector("svg");
  const all = [...svg.walk()];
  const soFar = all.find((n) => n.textContent === "so far" && cls(n).includes("chart-text"));
  assert.ok(cls(soFar).includes("halo"), "'so far' has a halo so a line under it never strikes it out");
  assert.ok(all.indexOf(soFar) > all.indexOf(byClass(svg, "chart-target")[0]), "'so far' is drawn after (over) the target line");
  const nowrap = kcal.querySelectorAll("span").find((sp) => sp.className === "nowrap" && /^\d+ with food$/.test(sp.textContent));
  assert.ok(nowrap, "'N with food' never breaks after the number");
  const css = read("../app/css/app.css");
  assert.match(css, /\.metric \.value\.second\s*\{[^}]*20px/);
  assert.match(css, /\.chart-text\.halo\s*\{[^}]*paint-order:\s*stroke/);
});
