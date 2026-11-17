// Progress: the weight trend chart, then one small chart per exercise (the heaviest working set over time).
// Redesign B (Apple Health style): two number tiles over a filled trend chart, measurements as an inset list,
// each exercise as a row with its photo and a tiny line; tap a row to open its full chart.
import { h } from "../h.js";
import { screen, emptyState, navHead, tile, section, group, row, foot, iconTile, exerciseMedia } from "./parts.js";
import { icon } from "./icons.js";
import { model, rerender } from "./app.js";
import { lineChart, sparkline } from "./charts.js";
import { trendSeries, activeWeighins } from "../engine/trend.js";
import { finishedSessions, workSets } from "../engine/workout.js";
import { exercises } from "../plan/plan-v2.js";
import { formatBody } from "./units.js";

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

  const body = section("Body weight",
    h("div", { class: "tiles" },
      tile({ label: "Last weigh-in", value: last ? formatBody(last.kg, unit) : "–", note: last ? last.date : "No weigh-in yet", color: "accent", iconName: "scale" }),
      tile({ label: "Trend (7 days)", value: formatBody(lastTrend, unit), note: "Smooths out water days", color: "accent", iconName: "progress" })),
    h("div", { class: "card chart-card" },
      lineChart({
        series: [
          { points: series.map((x) => ({ date: x.date, y: x.kg })), line: false },
          { points: series.map((x) => ({ date: x.date, y: x.trend })), line: true },
        ],
        unit: "kg", label: "Body weight in kg: single weigh-ins as dots, the 7-day trend as a line",
        emptyText: "No data yet. Log a weigh-in to start the line.",
      }),
      h("p", { class: "chart-summary" }, "Dots: single weigh-ins. Line: the 7-day trend.")),
    group(row({ title: "Weigh in", sub: "One number, under 10 seconds", lead: iconTile("scale", "accent"), href: "#/weighin", chevron: true })));

  const done = [...new Set(finishedSessions(doc.sessions).flatMap((s) => s.exercises.filter((r) => workSets(r).length).map((r) => r.done_exercise)))]
    .filter((id) => exercises[id]).sort((a, b) => exercises[a].name.localeCompare(exercises[b].name));

  const list = done.length
    ? section("Exercises", group(done.map((id) => {
      const ex = exercises[id];
      const pts = exerciseSeries(doc.sessions, id);
      const open = openExercise === id;
      const best = pts.length ? Math.max(...pts.map((p) => p.y)) : null;
      const sub = `${pts.length} workout${pts.length === 1 ? "" : "s"}${best !== null ? ` · best ${best} ${unitFor(ex)}` : ""}`;
      return [
        h("button", { class: "row with-thumb exercise-row", type: "button", "aria-expanded": open ? "true" : "false", onclick: () => { openExercise = open ? null : id; rerender(); } },
          exerciseMedia(id, ex.name, "thumb"),
          h("span", { class: "grow" }, ex.name, h("span", { class: "sub" }, sub)),
          sparkline(pts),
          h("span", { class: `chev ${open ? "open" : ""}` }, icon("chevron", 16, { stroke: 2.4 }))),
        open ? h("div", { class: "row-chart" }, lineChart({ series: [{ points: pts, line: true }], unit: unitFor(ex), label: `${ex.name}: best working set over time in ${unitFor(ex)}`, emptyText: "No data yet." })) : null,
      ];
    })), foot("The best working set of each workout. Tap an exercise to see its chart."))
    : emptyState("No exercises yet", "After your first workout, each exercise shows a chart here.");

  const meas = doc.measurements.filter((m) => !m.deleted);
  const lastM = meas[meas.length - 1];
  const measRows = lastM ? [["Waist", lastM.waist_cm], ["Chest", lastM.chest_cm], ["Upper arm", lastM.arm_cm], ["Thigh", lastM.thigh_cm]]
    .filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => row({ title: k, value: `${v} cm`, lead: iconTile("ruler", "") })) : [];
  const main = screen(
    navHead("Progress"),
    body,
    lastM ? section("Last measurements", group(measRows), foot(`Measured on ${lastM.date}. Every 4 weeks, on the weigh-in screen.`)) : null,
    list);
  return main;
}
