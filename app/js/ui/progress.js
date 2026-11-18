// Progress: totals, the weight trend chart, then one row per exercise (tap: its chart, with new bests in gold, and the
// last three workouts), the last measurements and the recent workouts.
// Base: redesign A (photo thumbnails, glowing line). From builder C: totals, gold best dots, history, recent workouts.
import { h } from "../h.js";
import { screen, emptyState, settingsButton } from "./parts.js";
import { model, rerender } from "./app.js";
import { lineChart, dayNumber, shortDate } from "./charts.js";
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
const stat = (label, value, unit = null) => h("div", { class: "tile" }, h("div", { class: "label" }, label), h("div", { class: "value" }, value, unit ? h("span", { class: "unit" }, ` ${unit}`) : null));

export function renderProgress() {
  const doc = model.doc();
  const unit = doc.shared_settings.body_unit ?? "kg";
  const weighins = activeWeighins(doc.weighins);
  const series = trendSeries(doc.weighins);
  const last = weighins[weighins.length - 1];
  const lastTrend = series.length ? series[series.length - 1].trend : null;

  const body = h("div", { class: "card" },
    h("span", { class: "eyebrow" }, "Body weight"),
    last ? h("div", { class: "row" },
      h("div", { class: "metric" }, h("div", { class: "label" }, "Last weigh-in"), h("div", { class: "big-number" }, formatBody(last.kg, unit)), h("div", { class: "small muted" }, last.date)),
      h("div", { class: "metric" }, h("div", { class: "label" }, "Trend (7 days)"), h("div", { class: "value" }, formatBody(lastTrend, unit)), h("div", { class: "small muted" }, "the line"))) : null,
    lineChart({
      series: [
        { points: series.map((x) => ({ date: x.date, y: x.kg })), line: false },
        { points: series.map((x) => ({ date: x.date, y: x.trend })), line: true },
      ],
      unit: "kg", label: "Body weight in kg: single weigh-ins as dots, the 7-day trend as a line",
      emptyText: "No data yet. Log a weigh-in to start the line.",
    }),
    h("a", { class: "button secondary", href: "#/weighin" }, "Weigh in"));

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
    totals,
    body,
    lastM ? h("div", { class: "card" }, h("h2", {}, "Last measurements"), h("p", { class: "small muted" }, lastM.date),
      h("ul", { class: "list-plain" }, [["Waist", lastM.waist_cm], ["Chest", lastM.chest_cm], ["Upper arm", lastM.arm_cm], ["Thigh", lastM.thigh_cm]]
        .filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => h("li", {}, h("span", {}, k), h("span", {}, `${v} cm`))))) : null,
    list,
    recentWorkouts);
}
