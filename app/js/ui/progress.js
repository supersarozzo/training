// Progress: the body weight chart, the calories chart (0.7.7), the totals, the last measurements, one row per exercise
// (tap: its chart, with new bests in gold, and the last three workouts) and the recent workouts.
// Base: redesign A (photo thumbnails). From builder C: totals, gold best dots, history, recent workouts.
// 0.7.7 (mock-up v4, Rosario's answers 101 to 103 a, 2026-11-18): both charts first, card titles as h2, an empty chart
// frame when there is no data, a 7 days | 30 days switch on the calories chart.
import { h } from "../h.js";
import { screen, emptyState, settingsButton } from "./parts.js";
import { model, rerender } from "./app.js";
import { lineChart, emptyChart, barChart, dayNumber, shortDate } from "./charts.js";
import { food } from "../diet/foodapp.js";
import { dailyKcal, averageDays } from "../food/foodmath.js";
import { today } from "../clock.js";
import { trendSeries, activeWeighins } from "../engine/trend.js";
import { finishedSessions, workSets } from "../engine/workout.js";
import { nSets } from "../words.js";
import { exercises, days } from "../plan/plan-v2.js";
import { setText, volumeOf, fmtKg } from "./stats.js";
import { formatBody } from "./units.js";
import { thumb } from "./media.js";
import { icon } from "./icons.js";
import { onMount, stagger } from "./motion.js";

let openExercise = null;
let kcalDays = 7; // the calories chart: 7 or 30 days before today (answer 101 a); this phone, this visit only

// One value per workout for an exercise: the heaviest working set (weight), or the best reps or seconds.
export function exerciseSeries(sessions, exerciseId) {
  const ex = exercises[exerciseId];
  const points = [];
  for (const s of finishedSessions(sessions).slice().reverse()) {
    for (const rec of s.exercises) {
      if (rec.done_exercise !== exerciseId) continue;
      const work = workSets(rec);
      if (!work.length) continue;
      let y;
      if (ex.kind === "hold") y = Math.max(...work.map((x) => x.seconds ?? 0));
      else if (ex.step === "bodyweight") y = Math.max(...work.map((x) => x.reps ?? 0));
      else y = Math.max(...work.map((x) => x.weight_kg ?? 0));
      points.push({ date: s.date, y });
    }
  }
  return points;
}
const unitFor = (ex) => (ex.kind === "hold" ? "seconds" : ex.step === "bodyweight" ? "reps" : "kg");

// Mark the points that beat every earlier point (the first point is never a "best").
export function withBests(points) {
  let top = null;
  return points.map((p) => {
    const pr = top !== null && p.y > top;
    if (top === null || p.y > top) top = p.y;
    return { ...p, pr };
  });
}
const fmt = (n) => Math.round(n).toLocaleString("en-GB");
const withUnit = (cls, value, unit) => h("div", { class: cls }, value, unit ? h("span", { class: "unit" }, ` ${unit}`) : null);
// "80.8" big and "kg" small (DESIGN.md section 4); stones and pounds stay as one text.
const bodyParts = (kg, unit) => (unit === "st" ? [formatBody(kg, "st"), null] : [(Math.round(kg * 10) / 10).toFixed(1), "kg"]);

function weightCard(doc, unit) {
  const weighins = activeWeighins(doc.weighins);
  const series = trendSeries(doc.weighins);
  const last = weighins[weighins.length - 1];
  const lastTrend = series.length ? series[series.length - 1].trend : null;
  return h("div", { class: "card" },
    h("h2", {}, "Body weight"),
    last ? h("div", { class: "row" },
      h("div", { class: "metric" }, h("div", { class: "label" }, "Last weigh-in"), withUnit("big-number", ...bodyParts(last.kg, unit)), h("div", { class: "small muted" }, shortDate(dayNumber(last.date)))),
      h("div", { class: "metric" }, h("div", { class: "label" }, "Trend (7 days)"), withUnit("value second", ...bodyParts(lastTrend, unit)), h("div", { class: "small muted" }, "the line"))) : null,
    series.length ? [
      lineChart({
        series: [
          { points: series.map((x) => ({ date: x.date, y: x.kg })), line: false },
          { points: series.map((x) => ({ date: x.date, y: x.trend })), line: true },
        ],
        unit: "kg", label: "Body weight in kg: single weigh-ins as dots, the 7-day trend as a line",
      }),
      h("p", { class: "small muted chart-legend" }, "Dots: each weigh-in. Line: the 7-day trend, the number to watch."),
    ] : emptyChart(["No data yet.", "Log a weigh-in to start the line."], "Body weight chart: no weigh-ins yet"),
    h("a", { class: "button secondary", href: "#/weighin" }, "Weigh in"));
}

// The calories card (0.7.7). The big number is the average of the days before today with food, the same rule as
// Diet's "Last 7 days, average"; today is drawn but not counted. The target is today's (no history of targets is kept).
function kcalCard(doc) {
  let fdoc;
  try { fdoc = food.doc(); } catch { fdoc = { food_log: [] }; } // a phone that blocks storage: the empty chart
  const date = today();
  const days = dailyKcal(fdoc, date, kcalDays);
  const avg = averageDays(fdoc, date, kcalDays);
  const target = doc.profile?.targets?.kcal ?? null;
  const tabs = h("div", { class: "segmented two", role: "tablist", "aria-label": "Days shown" },
    [7, 30].map((n) => h("button", { type: "button", role: "tab", "aria-selected": n === kcalDays ? "true" : "false",
      // a redraw scrolls to the top: keep the place, as the update banner does (ui/update.js)
      onclick: () => { if (kcalDays === n) return; kcalDays = n; const y = window.scrollY ?? 0; rerender(); window.scrollTo?.(0, y); } }, `${n} days`)));
  const openDiet = h("a", { class: "button secondary", href: "#/diet" }, "Open Diet");
  if (!days.some((d) => d.kcal !== null)) {
    const none = (fdoc.food_log ?? []).some((r) => r && r.deleted !== true) ? `No food logged in the last ${kcalDays} days.` : "No food logged yet.";
    return h("div", { class: "card" }, h("h2", {}, "Calories"), tabs,
      emptyChart([none, "Log food on the Diet tab to start the bars."], `Calories chart: ${none}`), openDiet);
  }
  return h("div", { class: "card" },
    h("h2", {}, "Calories"),
    tabs,
    h("div", { class: "row" },
      h("div", { class: "metric" }, h("div", { class: "label" }, "Average a day"),
        avg ? withUnit("big-number", fmt(avg.kcal), "kcal") : withUnit("big-number", "–", null),
        h("div", { class: "small muted" }, `${kcalDays} days before today · `, h("span", { class: "nowrap" }, `${avg ? avg.days : 0} with food`))),
      h("div", { class: "metric" }, h("div", { class: "label" }, "Target"),
        target ? withUnit("value second", fmt(target), "kcal") : withUnit("value second", "None", null),
        h("div", { class: "small muted" }, target ? "the dashed line" : "no calorie target set"))),
    barChart({ days, target,
      label: `Calories eaten each day, the last ${kcalDays} days and today; ${target ? "the target as a dashed line" : "no target"}; days with no food have no bar` }),
    h("p", { class: "small muted chart-legend" }, "Bars: kcal eaten each day. No bar: no food logged. Today is not finished and not in the average."),
    openDiet);
}

const stat = (label, value, unit = null) => h("div", { class: "tile" }, h("div", { class: "label" }, label), h("div", { class: "value" }, value, unit ? h("span", { class: "unit" }, ` ${unit}`) : null));

export function renderProgress() {
  const doc = model.doc();
  const unit = doc.shared_settings.body_unit ?? "kg";
  const finished = finishedSessions(doc.sessions);
  const totalSets = finished.reduce((n, x) => n + x.exercises.reduce((m, r) => m + workSets(r).length, 0), 0);
  const totalVolume = finished.reduce((n, x) => n + volumeOf(x), 0);
  const totals = finished.length ? h("div", { class: "tiles three" },
    stat("Workouts", String(finished.length)),
    stat("Sets", String(totalSets)),
    totalVolume >= 10000 ? stat("Lifted", fmtKg(Math.round(totalVolume / 100) / 10), "t") : stat("Lifted", String(totalVolume), "kg")) : null;

  const done = [...new Set(finishedSessions(doc.sessions).flatMap((s) => s.exercises.filter((r) => workSets(r).length).map((r) => r.done_exercise)))]
    .filter((id) => exercises[id]).sort((a, b) => exercises[a].name.localeCompare(exercises[b].name));

  const list = done.length
    ? h("div", { class: "card" }, h("h2", {}, "Exercises"), done.map((id) => {
      const ex = exercises[id];
      const pts = withBests(exerciseSeries(doc.sessions, id));
      const open = openExercise === id;
      const bests = pts.filter((x) => x.pr).length;
      const recent = finished.filter((x) => x.exercises.some((r) => r.done_exercise === id && workSets(r).length)).slice(0, 3);
      return [
        h("button", { class: "exercise-row", type: "button", "aria-expanded": open ? "true" : "false", onclick: () => { openExercise = open ? null : id; rerender(); } },
          thumb(id, { small: true }),
          h("span", { class: "grow" }, h("span", { class: "title" }, ex.name, bests ? h("span", { class: "badge pr", "aria-label": `${bests} new best${bests === 1 ? "" : "s"}` }, icon("star", 13, { fill: true, strokeWidth: 0 }), String(bests)) : null),
            h("span", { class: "small muted" }, `${pts.length} workout${pts.length === 1 ? "" : "s"}${pts.length ? ` · best ${Math.max(...pts.map((x) => x.y))} ${unitFor(ex)}` : ""}`)),
          h("span", { class: `chev ${open ? "open" : ""}` }, icon("chevron", 18))),
        open ? h("div", { class: "ex-detail" },
          lineChart({ series: [{ points: pts, line: true }], unit: unitFor(ex), label: `${ex.name}: best working set over time in ${unitFor(ex)}; new bests in gold`, emptyText: "No data yet." }),
          h("table", { class: "hist" },
            h("thead", {}, h("tr", {}, h("th", {}, "Date"), h("th", {}, "Sets"))),
            h("tbody", {}, recent.map((x) => {
              const sets = x.exercises.filter((r) => r.done_exercise === id).flatMap((r) => workSets(r)); // every record (review R8)
              return h("tr", {}, h("td", {}, shortDate(dayNumber(x.date))), h("td", {}, sets.map((w) => setText(id, w)).join(" · ")));
            })))) : null,
      ];
    }))
    : emptyState("No exercises yet", "After your first workout, each exercise shows a chart here.");

  const meas = doc.measurements.filter((m) => !m.deleted);
  const lastM = meas[meas.length - 1];
  const recentWorkouts = finished.length ? h("div", { class: "card" }, h("h2", {}, "Recent workouts"),
    finished.slice(0, 6).map((x) => {
      const sets = x.exercises.reduce((m, r) => m + workSets(r).length, 0);
      return h("div", { class: "mach-row static" },
        h("span", { class: "date-box" }, h("b", {}, String(Number(x.date.slice(8)))), h("span", {}, shortDate(dayNumber(x.date)).split(" ")[1])),
        h("span", { class: "grow" }, h("b", {}, days[x.plan_day]?.focus ?? "Workout", x.kind === "short" ? " · short" : ""),
          h("span", { class: "small muted" }, `${nSets(sets)} · ${volumeOf(x)} kg lifted${x.walk ? ` · walk ${x.walk.minutes} min` : ""}`)));
    })) : null;

  onMount(() => stagger(document.querySelectorAll(".screen > .card, .screen > .tiles")));
  return screen(
    settingsButton(),
    h("span", { class: "eyebrow accent" }, "Your 12 weeks"),
    h("h1", {}, "Progress"),
    weightCard(doc, unit),
    kcalCard(doc),
    totals,
    lastM ? h("div", { class: "card" }, h("h2", {}, "Last measurements"), h("p", { class: "small muted" }, lastM.date),
      h("ul", { class: "list-plain" }, [["Waist", lastM.waist_cm], ["Chest", lastM.chest_cm], ["Upper arm", lastM.arm_cm], ["Thigh", lastM.thigh_cm]]
        .filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => h("li", {}, h("span", {}, k), h("span", {}, `${v} cm`))))) : null,
    list,
    recentWorkouts);
}
