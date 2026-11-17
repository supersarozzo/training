// Today: the day, the week strip, the blocks, today's exercises with suggested weights, the buttons (Start, Short day,
// Swap day), the missed-days message, weigh-in, weekly summary, your numbers, the sync line.
import { h } from "../h.js";
import { tabActionBar, mainButton, secondaryButton, openSheet, stat, sparkline, icon } from "./parts.js";
import { model, go, rerender } from "./app.js";
import { today } from "../clock.js";
import { getActive, setActive } from "../active.js";
import { dayLabel, sessionLayout, expectedMinutes, canStartWorkout, swapOptions, missedRule, planForDay } from "../engine/schedule.js";
import { finishedSessions, suggestFor, buildUnits } from "../engine/workout.js";
import { days, exercises, weekInfo } from "../plan/plan-v2.js";
import { startWorkout } from "./flow.js";
import { activeWeighins, weeklySummary, trendSeries } from "../engine/trend.js";
import { seenWeek } from "./weekly.js";
import { installHintShown, dismissInstallHint } from "./update.js";
import { store } from "./app.js";
import { syncer } from "../syncer.js";
import { statusText, keyEndsSoon, connectionOf } from "../sync/sync.js";
import { thumb, openExercise } from "./media-ui.js";
import { seriesFor, weekDays, fmtKg } from "./stats.js";
import { formatBody, formatChange } from "./units.js";

let savedMessage = null; // shown once, after a workout was saved
let savedLink = null; // the Log to Health link, only when that button is on
export function setSavedMessage(text, link = null) { savedMessage = text; savedLink = link; }

const BLOCK_NAMES = {
  walk: "Walk", changeover: "Change-over", lift_warmup: "Lift warm-up", pairs: "Weights (3 pairs)", abs: "Abs and holds",
  finish: "Finish and save", pairs_ab: "Weights (pairs A and B)", abs_first: "First abs exercise",
};
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function dateLine(t) {
  const [y, m, d] = t.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${DOW[dt.getUTCDay()]} ${d} ${MON[m - 1]}`;
}

function resumeCard(doc, session) {
  const act = getActive();
  const when = session.date === today() ? "today's" : `the unfinished (${session.date})`;
  const resume = () => {
    if (!act || act.session_id !== session.id) {
      const phase = session.exercises.some((e) => e.sets.length) ? "weights" : session.walk ? "changeover" : "walk";
      setActive({ session_id: session.id, phase, timer_end: null, timer_total: null, rest: null, hold: null });
    }
    go("#/workout");
  };
  const sets = session.exercises.reduce((n, e) => n + e.sets.filter((x) => x.type === "work").length, 0);
  return {
    card: h("div", { class: "card accent" }, h("h2", {}, `Continue ${when} workout?`),
      h("p", { class: "muted" }, `Every set you did is saved${sets ? ` (${sets} set${sets === 1 ? "" : "s"} so far)` : ""}.`)),
    button: mainButton("Continue workout", resume, { ic: "play" }),
  };
}

function openSwapDay(doc, t, pos) {
  const options = swapOptions({ startMonday: doc.block.start_monday, today: t, sessions: doc.sessions });
  const close = openSheet(
    h("h2", {}, "Swap day"),
    h("p", { class: "muted" }, "Do the workout of an earlier day that you missed this week, in place of today's."),
    options.length
      ? options.map((d) => h("button", { class: "button secondary", type: "button", onclick: () => { close(); const r = startWorkout({ planDay: d, swappedFrom: pos.planDay }); if (!r.ok) rerender(); } }, `${days[d].name}: ${days[d].focus}`))
      : h("p", {}, "No missed day this week to swap in."));
}

function weekStrip(doc, t) {
  return h("div", { class: "week-strip", "aria-label": "This week" },
    weekDays(doc.sessions, t).map((d) => h("div", { class: `day-cell ${d.state}` },
      h("span", {}, d.letter),
      h("span", { class: "c" }, d.state.startsWith("done") ? icon("check", "sm") : String(d.day)))));
}

function timeline(layout) {
  const total = layout.reduce((n, b) => n + b.minutes, 0);
  const bars = layout.map((b) => { const i = h("i", { class: `grow-x ${b.id === "walk" ? "walk" : ""}` }); i.style.flex = `${b.minutes} 1 0`; void total; return i; });
  return [
    h("div", { class: "timeline", "aria-hidden": "true" }, bars),
  ];
}

// Today's exercises: thumbnail, slot, sets × reps, suggested weight, a sparkline of past workouts.
function exerciseList(doc, planDay, week, missed) {
  const plan = planForDay(planDay, week, "full");
  const units = buildUnits(plan.slots);
  return h("div", { class: "list" }, units.map((u) => h("div", { class: "pair-group" }, u.slots.map((slot) => {
    const exId = slot.ex;
    const ex = exercises[exId];
    const st = doc.exercise_state.find((x) => x.id === `x-${exId}` && !x.deleted);
    const sg = suggestFor(doc, exId, { week, missed, exerciseState: st });
    const series = seriesFor(doc.sessions, exId).slice(-8).map((p) => p.y);
    const [lo, hi] = ex.range;
    const reps = `${lo === hi ? lo : `${lo}–${hi}`}${ex.kind === "hold" ? " s" : ""}`;
    const end = ex.kind === "hold" ? `${sg.range[0]} s` : ex.step === "bodyweight" ? `${sg.reps}` : sg.weight_kg ? `${fmtKg(sg.weight_kg)} kg` : "–";
    return h("button", { class: "ex-row", type: "button", onclick: () => openExercise(exId, { noteFor: exId }) },
      thumb(exId, { size: "sm" }),
      h("div", { class: "grow" },
        h("div", { class: "title" }, h("span", { class: "badge slot" }, slot.slot), h("span", {}, ex.name)),
        h("div", { class: "sub" }, `${slot.sets} × ${reps}${ex.perSide ? " each side" : ""}`)),
      series.length > 1 ? sparkline(series, { w: 36, h: 18 }) : null,
      h("div", { class: "end" }, end, h("small", {}, ex.kind === "hold" ? "hold" : ex.step === "bodyweight" ? "reps" : sg.weight_kg ? "suggested" : "pick light")));
  }))));
}

export function renderToday() {
  const doc = model.doc();
  const targets = doc.profile?.targets;
  const t = today();
  const label = dayLabel(doc.block.start_monday, t);
  const open = doc.sessions.find((s) => !s.deleted && s.status === "in_progress");
  const unit = doc.shared_settings.body_unit ?? "kg";
  const headline = label.planDay ? days[label.planDay].focus : label.state === "before" ? "Plan starts soon" : label.state === "after" ? "Block done" : "Rest day";
  const children = [
    h("div", { class: "eyebrow" }, dateLine(t)),
    h("h1", {}, headline),
    h("div", { class: "label muted" }, label.text),
  ];
  if (label.state === "running") children.push(weekStrip(doc, t));
  let bar = null;
  const extraButtons = [];

  if (savedMessage) {
    children.push(h("div", { class: "card rise" }, h("p", { class: "status-success" }, icon("check", "sm"), " ", savedMessage),
      savedLink ? h("a", { class: "button secondary", href: savedLink }, "Log to Health") : null));
    savedMessage = null;
    savedLink = null;
  }

  if (open) {
    const r = resumeCard(doc, open);
    children.push(r.card);
    bar = r.button;
  } else if (label.state === "before") {
    children.push(h("div", { class: "card" }, h("h2", {}, "Your plan has not started"), h("p", { class: "muted" }, `It starts on Monday ${doc.block.start_monday}.`)));
  } else if (label.state === "after") {
    children.push(h("div", { class: "card" }, h("h2", {}, "The 12 weeks are done"), h("p", { class: "muted" }, "Time for the review. Talk to the Training chat about the next block.")));
  } else if (!label.planDay) {
    children.push(h("div", { class: "card" }, h("h2", {}, "Rest day"), h("p", { class: "muted" }, "A relaxed walk outside is fine. Weigh in in the morning.")));
  } else {
    const kind = "full";
    const check = canStartWorkout(doc.sessions, t);
    const lastFinished = finishedSessions(doc.sessions)[0];
    const missed = missedRule(lastFinished ? lastFinished.date : null, t);
    const layout = sessionLayout(kind, label.week);
    const wk = weekInfo(label.week);
    children.push(h("div", { class: "card" },
      h("div", { class: "row" },
        h("div", {}, h("div", { class: "eyebrow" }, "Session"), h("div", { class: "num" }, h("b", { class: "display" }, String(expectedMinutes(kind, label.week))), h("span", { class: "unit" }, " min"))),
        h("div", { class: "center" }, h("div", { class: "eyebrow" }, "Effort"), h("div", { class: "small" }, `stop with ${Array.isArray(wk.rir) ? `${wk.rir[0]}–${wk.rir[1]}` : (label.planDay === "wed" ? wk.wedRir : wk.rir)} left`))),
      timeline(layout),
      h("ul", { class: "blocks" }, layout.map((b) => h("li", {}, h("i", { class: b.id === "walk" ? "walk" : "" }), h("span", {}, BLOCK_NAMES[b.id] ?? b.id), h("b", {}, `${b.minutes}`), h("span", { class: "muted" }, " min")))),
      h("p", { class: "small muted" }, icon("watch", "sm"), ` About ${expectedMinutes(kind, label.week)} minutes. Start a Strength workout on your Apple Watch at minute 0.`)));
    if (label.week === 1) children.push(h("div", { class: "card accent" }, h("p", {}, "Week 1: learn the moves and find your weights. Two sets of each exercise. It will feel easy on purpose."), h("p", { class: "small muted" }, "In Settings, fill in the gym's dumbbell sizes and weight steps when you know them.")));
    if (lastFinished && missed.kind !== "carry_on") children.push(h("div", { class: "card warn" }, h("p", {}, icon("warn", "sm"), " ", missed.message)));
    if (!check.ok) {
      children.push(h("div", { class: "card" }, h("p", { class: "status-success" }, icon("check", "sm"), " Done for today."), h("p", { class: "muted" }, check.reason)));
    } else {
      bar = mainButton("Start workout", () => { const r = startWorkout({ kind: "full", planDay: label.planDay }); if (!r.ok) rerender(); }, { ic: "play" });
      const swaps = swapOptions({ startMonday: doc.block.start_monday, today: t, sessions: doc.sessions });
      extraButtons.push(h("div", { class: swaps.length ? "btn-row" : "" },
        secondaryButton("Short day (60 min)", () => { const r = startWorkout({ kind: "short", planDay: label.planDay }); if (!r.ok) rerender(); }, { cls: "compact" }),
        swaps.length ? secondaryButton("Swap day", () => openSwapDay(doc, t, label), { cls: "compact", ic: "swap" }) : null));
      children.push(...extraButtons);
    }
    children.push(h("div", { class: "section-head" }, h("h2", {}, "Today's exercises"), h("span", { class: "small muted" }, "Tap for photos")));
    children.push(exerciseList(doc, label.planDay, label.week, missed));
  }

  // Weigh-in, the weekly summary (Mondays, once per week) and the 4-weekly measurement reminder.
  const list = activeWeighins(doc.weighins);
  const lastWeigh = list.slice(-1)[0];
  const weighedToday = lastWeigh && lastWeigh.date === t;
  if (label.state === "running" && label.week >= 2) {
    const sum = weeklySummary(doc, { startMonday: doc.block.start_monday, today: t });
    if (sum && seenWeek() !== sum.week) {
      children.push(h("div", { class: "card warn" }, h("h2", {}, "Last week is ready"), h("p", { class: "muted" }, "Workouts, weight trend and a food suggestion."),
        h("a", { class: "button secondary", href: "#/weekly" }, "See last week")));
    }
  }
  const measureWeek = label.state === "running" && [1, 4, 8, 12].includes(label.week) && label.day === "mon";
  children.push(h("div", { class: "section-head" }, h("h2", {}, "Body and food")));
  const trend = trendSeries(doc.weighins);
  const lastTrend = trend.length ? trend[trend.length - 1].trend : null;
  const weekAgo = trend.length > 7 ? trend[trend.length - 8].trend : null;
  children.push(h("div", { class: "stats" },
    stat("Weight", lastWeigh ? formatBody(lastWeigh.kg, unit).replace(/ (kg|lb)$/, "") : "–", lastWeigh && unit === "kg" ? "kg" : null, { d: lastWeigh ? lastWeigh.date.slice(5) : "no weigh-in", spark: sparkline(trend.slice(-14).map((x) => x.trend), { w: 72, h: 18 }) }),
    stat("Trend", lastTrend !== null ? formatBody(lastTrend, unit).replace(/ (kg|lb)$/, "") : "–", lastTrend !== null && unit === "kg" ? "kg" : null, { d: weekAgo !== null ? `${formatChange(lastTrend - weekAgo, unit)} / 7 d` : "7-day average" }),
    targets && targets.kcal !== null ? stat("Calories", targets.kcal, null, { d: "kcal a day" }) : stat("Workouts", finishedSessions(doc.sessions).length, null, { d: "done so far" })));
  if (!weighedToday) {
    children.push(h("div", { class: "card tight" }, h("div", { class: "row" },
      h("div", { class: "grow" }, h("h2", {}, "Weigh-in"), h("p", { class: "small muted" }, measureWeek ? "Weigh in, and measure your waist, chest, arm and thigh today." : "Weigh in after the toilet, before food and drink.")),
      h("a", { class: "button tinted compact", href: "#/weighin" }, icon("scale", "sm"), "Weigh in"))));
  }

  if (targets) {
    children.push(h("div", { class: "card tight" },
      h("div", { class: "label" }, "Your numbers"),
      h("div", { class: "row" },
        targets.kcal !== null ? h("div", { class: "metric" }, h("div", { class: "value" }, String(targets.kcal), h("span", { class: "unit" }, " kcal a day"))) : null,
        targets.protein_g !== null ? h("div", { class: "metric" }, h("div", { class: "value" }, String(targets.protein_g), h("span", { class: "unit" }, " g protein a day"))) : null),
      targets.walk_start ? h("div", { class: "small muted" }, `Starting walk: ${targets.walk_start.speed_kmh} km/h, ${targets.walk_start.slope_pct} % slope`) : null)); // a restored file may have none (review F4)
  }
  if (!open && installHintShown()) {
    children.push(h("div", { class: "card warn" }, h("h2", {}, "Add this app to your Home Screen"),
      h("p", {}, "In Safari, tap the Share button, then Add to Home Screen. Open the app from there."),
      h("p", { class: "small muted" }, "Safari can delete the data of a web page you do not open for 7 days. An app on the Home Screen keeps it."),
      h("button", { class: "button secondary", type: "button", onclick: () => { dismissInstallHint(); rerender(); } }, "I did this")));
  }
  const device = store.loadDevice();
  const ends = keyEndsSoon(device, t);
  if (ends) children.push(h("p", { class: "small status-warning" }, ends.days < 0 ? `GitHub key ended on ${ends.date}. Make a new one.` : `GitHub key ends on ${ends.date}.`));
  const configured = connectionOf(device) !== null;
  const bad = configured && device.last_sync_result && device.last_sync_result !== "ok";
  children.push(h("p", { class: bad ? "small status-warning" : "small muted", role: "status" },
    h("span", { class: `dot ${!configured ? "" : bad ? "warn" : "ok"}` }), " ",
    statusText(device, configured && syncer.hasUnsynced()), " ", configured ? null : h("a", { href: "#/settings" }, "Settings"), bad ? h("a", { href: "#/settings" }, "Settings") : null));

  const main = h("main", { class: "screen has-bar with-tabs" }, ...children);
  return bar ? [main, tabActionBar(bar)] : [h("main", { class: "screen has-tabs" }, ...children)];
}
