// Progress: totals, the body weight chart (dots and the 7-day trend line), one row per exercise with a small trend line
// (tap: the full chart with new bests in gold and the last three workouts), the last measurements and recent workouts.
import { h } from "../h.js";
import { screen, emptyState, stat, sparkline, chip, icon } from "./parts.js";
import { model, rerender, go } from "./app.js";
import { lineChart, dayNumber, shortDate } from "./charts.js";
import { trendSeries, activeWeighins } from "../engine/trend.js";
import { finishedSessions, workSets } from "../engine/workout.js";
import { exercises, days } from "../plan/plan-v2.js";
import { formatBody } from "./units.js";
import { thumb } from "./media-ui.js";
import { setText, volumeOf, fmtKg } from "./stats.js";

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
function withBests(points) {
  let top = null;
  return points.map((p) => {
    const pr = top !== null && p.y > top;
    if (top === null || p.y > top) top = p.y;
    return { ...p, pr };
  });
}

export function renderProgress() {
  const doc = model.doc();
  const unit = doc.shared_settings.body_unit ?? "kg";
  const weighins = activeWeighins(doc.weighins);
  const series = trendSeries(doc.weighins);
  const last = weighins[weighins.length - 1];
  const lastTrend = series.length ? series[series.length - 1].trend : null;
  const weekAgo = series.length ? series.filter((x) => dayNumber(x.date) <= dayNumber(series[series.length - 1].date) - 7).pop() : null;
  const change = weekAgo && lastTrend !== null ? lastTrend - weekAgo.trend : null;

  const finished = finishedSessions(doc.sessions);
  const totalSets = finished.reduce((n, s) => n + s.exercises.reduce((m, r) => m + workSets(r).length, 0), 0);
  const totalVolume = finished.reduce((n, s) => n + volumeOf(s), 0);

  const totals = h("div", { class: "stats" },
    stat("Workouts", String(finished.length)),
    stat("Sets", String(totalSets)),
    stat("Lifted", totalVolume >= 10000 ? `${fmtKg(Math.round(totalVolume / 100) / 10)}` : String(totalVolume), totalVolume >= 10000 ? "t" : "kg"));

  const body = h("div", { class: "card" },
    h("div", { class: "section-head" }, h("h2", {}, "Body weight"), chip("scale", "Weigh in", () => go("#/weighin"))),
    last ? h("div", { class: "stats two flat" },
      stat("Last weigh-in", formatBody(last.kg, unit), null, { d: shortDate(dayNumber(last.date)) }),
      stat("Trend (7 days)", formatBody(lastTrend, unit), null, { d: change === null ? "–" : `${change <= 0 ? "▼" : "▲"} ${formatBody(Math.abs(change), unit)} in a week` })) : null,
    lineChart({
      series: [
        { points: series.map((x) => ({ date: x.date, y: x.kg })), line: false },
        { points: series.map((x) => ({ date: x.date, y: x.trend })), line: true, area: true },
      ],
      unit: "kg", label: "Body weight in kg: single weigh-ins as dots, the 7-day trend as a line",
      emptyText: "No data yet. Log a weigh-in to start the line.",
    }),
    series.length ? h("div", { class: "chart-legend" }, h("span", {}, h("i", { class: "dot" }), "weigh-ins"), h("span", {}, h("i", { class: "line" }), "7-day trend")) : null);

  const done = [...new Set(finished.flatMap((s) => s.exercises.filter((r) => workSets(r).length).map((r) => r.done_exercise)))]
    .filter((id) => exercises[id]).sort((a, b) => exercises[a].name.localeCompare(exercises[b].name));

  const list = done.length
    ? [h("div", { class: "section-head" }, h("h2", {}, "Exercises"), h("span", { class: "badge muted" }, String(done.length))),
      h("div", { class: "list" }, done.map((id) => {
        const ex = exercises[id];
        const pts = withBests(exerciseSeries(doc.sessions, id));
        const open = openExercise === id;
        const bests = pts.filter((p) => p.pr).length;
        const recent = finished.filter((s) => s.exercises.some((r) => r.done_exercise === id && workSets(r).length)).slice(0, 3);
        const top = pts.length ? Math.max(...pts.map((p) => p.y)) : null;
        const topText = top === null ? "" : ex.kind === "hold" ? `${top} s` : ex.step === "bodyweight" ? `${top} reps` : `${fmtKg(top)} kg`;
        return h("div", { class: `ex-item${open ? " open" : ""}` },
          h("button", { class: "ex-row", type: "button", "aria-expanded": open ? "true" : "false", onclick: () => { openExercise = open ? null : id; rerender(); } },
            thumb(id, { size: "sm" }),
            h("div", { class: "grow" },
              h("div", { class: "title" }, ex.name, bests ? h("span", { class: "badge pr" }, icon("star", "xs"), String(bests)) : null),
              h("div", { class: "sub" }, `${pts.length} workout${pts.length === 1 ? "" : "s"} · best ${topText}`)),
            sparkline(pts.map((p) => p.y), { w: 48, h: 22 }),
            icon("chev", open ? "chev open" : "chev")),
          open ? h("div", { class: "ex-detail" },
            lineChart({ series: [{ points: pts, line: true, area: true }], unit: unitFor(ex), label: `${ex.name}: best working set over time in ${unitFor(ex)}; new bests in gold`, emptyText: "No data yet.", height: 170 }),
            h("table", { class: "hist" },
              h("thead", {}, h("tr", {}, h("th", {}, "Date"), h("th", {}, "Sets"))),
              h("tbody", {}, recent.map((s) => {
                const rec = s.exercises.find((r) => r.done_exercise === id && workSets(r).length);
                return h("tr", {}, h("td", {}, shortDate(dayNumber(s.date))), h("td", {}, workSets(rec).map((x) => setText(id, x)).join(" · ")));
              })))) : null);
      }))]
    : emptyState("No exercises yet", "After your first workout, each exercise shows a chart here.");

  const meas = doc.measurements.filter((m) => !m.deleted);
  const lastM = meas[meas.length - 1];
  const measCard = lastM ? h("div", { class: "card" },
    h("div", { class: "section-head" }, h("h2", {}, "Last measurements"), h("span", { class: "small muted" }, shortDate(dayNumber(lastM.date)))),
    h("dl", { class: "kv" }, [["Waist", lastM.waist_cm], ["Chest", lastM.chest_cm], ["Upper arm", lastM.arm_cm], ["Thigh", lastM.thigh_cm]]
      .filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => [h("dt", {}, k), h("dd", {}, `${v} cm`)]))) : null;

  const recentWorkouts = finished.length ? [
    h("div", { class: "section-head" }, h("h2", {}, "Recent workouts")),
    h("div", { class: "list" }, finished.slice(0, 6).map((s) => {
      const sets = s.exercises.reduce((m, r) => m + workSets(r).length, 0);
      const vol = volumeOf(s);
      return h("div", { class: "list-row static" },
        h("div", { class: "date-box" }, h("b", {}, String(Number(s.date.slice(8)))), h("span", {}, shortDate(dayNumber(s.date)).split(" ")[1])),
        h("div", { class: "grow" },
          h("div", { class: "title" }, days[s.plan_day]?.focus ?? "Workout", s.kind === "short" ? h("span", { class: "badge muted" }, "short") : null),
          h("div", { class: "sub" }, `${sets} sets · ${vol} kg lifted${s.walk ? ` · walk ${s.walk.minutes} min` : ""}`)));
    }))] : null;

  const main = screen(
    h("div", { class: "eyebrow" }, "Your numbers"),
    h("h1", {}, "Progress"),
    totals,
    body,
    list,
    measCard,
    recentWorkouts);
  main.dataset.key = "progress";
  return main;
}
