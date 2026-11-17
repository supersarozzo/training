// Progress: the weight trend chart, then one small chart per exercise (the heaviest working set over time).
import { h } from "../h.js";
import { screen, emptyState } from "./parts.js";
import { model, rerender } from "./app.js";
import { lineChart } from "./charts.js";
import { trendSeries, activeWeighins } from "../engine/trend.js";
import { finishedSessions, workSets } from "../engine/workout.js";
import { exercises } from "../plan/plan-v2.js";
import { formatBody } from "./units.js";
import { thumb } from "./demo.js";
import { icon } from "./icons.js";

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

export function renderProgress() {
  const doc = model.doc();
  const unit = doc.shared_settings.body_unit ?? "kg";
  const weighins = activeWeighins(doc.weighins);
  const series = trendSeries(doc.weighins);
  const last = weighins[weighins.length - 1];
  const lastTrend = series.length ? series[series.length - 1].trend : null;

  const body = h("section", { class: "card" },
    h("span", { class: "eyebrow brand" }, "Body weight"),
    last ? h("div", { class: "row" },
      h("div", { class: "metric" }, h("div", { class: "label" }, "Trend (7 days)"), h("div", { class: "value" }, formatBody(lastTrend, unit))),
      h("div", { class: "metric" }, h("div", { class: "label" }, "Last weigh-in"), h("div", { class: "value" }, formatBody(last.kg, unit)), h("div", { class: "small muted" }, last.date))) : null,
    lineChart({
      series: [
        { points: series.map((x) => ({ date: x.date, y: x.kg })), line: false },
        { points: series.map((x) => ({ date: x.date, y: x.trend })), line: true },
      ],
      unit: "kg", label: "Body weight in kg: single weigh-ins as dots, the 7-day trend as a line",
      emptyText: "No data yet. Log a weigh-in to start the line.",
    }),
    h("p", { class: "small muted" }, "Dots: single weigh-ins. Line: the 7-day trend."),
    h("a", { class: "button secondary", href: "#/weighin" }, icon("scale"), "Weigh in"));

  const done = [...new Set(finishedSessions(doc.sessions).flatMap((s) => s.exercises.filter((r) => workSets(r).length).map((r) => r.done_exercise)))]
    .filter((id) => exercises[id]).sort((a, b) => exercises[a].name.localeCompare(exercises[b].name));

  const list = done.length
    ? [h("h2", {}, "Exercises"), h("p", { class: "small muted" }, "Best working set per workout. Tap one to see its chart."),
      h("div", { class: "list" }, done.map((id) => {
        const ex = exercises[id];
        const pts = exerciseSeries(doc.sessions, id);
        const open = openExercise === id;
        const best = pts.length ? Math.max(...pts.map((p) => p.y)) : null;
        return [
          h("button", { class: "list-row", type: "button", "aria-expanded": open ? "true" : "false", onclick: () => { openExercise = open ? null : id; rerender(); } },
            thumb(id),
            h("span", { class: "grow" }, h("span", { class: "title" }, ex.name),
              h("span", { class: "sub" }, `${pts.length} workout${pts.length === 1 ? "" : "s"}${best !== null ? ` · best ${best} ${unitFor(ex)}` : ""}`)),
            icon("chevron", "chev")),
          open ? h("div", { class: "list-chart" }, lineChart({ series: [{ points: pts, line: true }], unit: unitFor(ex), label: `${ex.name}: best working set over time in ${unitFor(ex)}`, emptyText: "No data yet." })) : null,
        ];
      }))]
    : emptyState("No exercises yet", "After your first workout, each exercise shows a chart here.");

  const meas = doc.measurements.filter((m) => !m.deleted);
  const lastM = meas[meas.length - 1];
  const main = screen(
    h("div", { class: "page-head" }, h("div", {}, h("span", { class: "eyebrow" }, "Your log"), h("h1", {}, "Progress"))),
    body,
    lastM ? h("div", { class: "card" }, h("span", { class: "eyebrow" }, "Last measurements"), h("p", { class: "small muted" }, lastM.date),
      h("ul", { class: "list-plain" }, [["Waist", lastM.waist_cm], ["Chest", lastM.chest_cm], ["Upper arm", lastM.arm_cm], ["Thigh", lastM.thigh_cm]]
        .filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => h("li", {}, h("span", {}, k), h("span", {}, `${v} cm`))))) : null,
    list);
  main.dataset.view = "progress";
  return main;
}
