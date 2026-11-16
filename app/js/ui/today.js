// Today: the day, the blocks, the buttons (Start, Short day, Swap day), the missed-days message, your numbers.
import { h } from "../h.js";
import { tabActionBar, mainButton, secondaryButton, openSheet } from "./parts.js";
import { model, go, rerender } from "./app.js";
import { today } from "../clock.js";
import { getActive, setActive } from "../active.js";
import { dayLabel, sessionLayout, expectedMinutes, canStartWorkout, swapOptions, missedRule } from "../engine/schedule.js";
import { finishedSessions } from "../engine/workout.js";
import { days } from "../plan/plan-v2.js";
import { startWorkout } from "./flow.js";
import { activeWeighins, weeklySummary } from "../engine/trend.js";
import { seenWeek } from "./weekly.js";
import { installHintShown, dismissInstallHint } from "./update.js";

let savedMessage = null; // shown once, after a workout was saved
export function setSavedMessage(text) { savedMessage = text; }

const BLOCK_NAMES = {
  walk: "Walk", changeover: "Change-over", lift_warmup: "Lift warm-up", pairs: "Weights (3 pairs)", abs: "Abs and holds",
  finish: "Finish and save", pairs_ab: "Weights (pairs A and B)", abs_first: "First abs exercise",
};

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
  return { card: h("div", { class: "card warn" }, h("h2", {}, `Continue ${when} workout?`), h("p", { class: "muted" }, "Every set you did is saved.")), button: mainButton("Continue workout", resume) };
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

export function renderToday() {
  const doc = model.doc();
  const targets = doc.profile?.targets;
  const t = today();
  const label = dayLabel(doc.block.start_monday, t);
  const open = doc.sessions.find((s) => !s.deleted && s.status === "in_progress");
  const children = [h("h1", {}, "Today"), h("div", { class: "label" }, label.text)];
  let bar = null;

  if (savedMessage) {
    children.push(h("div", { class: "card" }, h("p", { class: "status-success" }, savedMessage)));
    savedMessage = null;
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
    children.push(h("div", { class: "card" },
      h("h2", {}, days[label.planDay].focus),
      layout.map((b) => h("div", { class: "block-line" }, h("span", {}, BLOCK_NAMES[b.id] ?? b.id), h("span", { class: "muted" }, `${b.minutes} min`))),
      h("p", { class: "small muted" }, `About ${expectedMinutes(kind, label.week)} minutes. Start a Strength workout on your Apple Watch at minute 0.`)));
    if (label.week === 1) children.push(h("div", { class: "card" }, h("p", {}, "Week 1: learn the moves and find your weights. Two sets of each exercise. It will feel easy on purpose."), h("p", { class: "small muted" }, "In Settings, fill in the gym's dumbbell sizes and weight steps when you know them.")));
    if (lastFinished && missed.kind !== "carry_on") children.push(h("div", { class: "card warn" }, h("p", {}, missed.message)));
    if (!check.ok) {
      children.push(h("div", { class: "card" }, h("p", { class: "status-success" }, "Done for today."), h("p", { class: "muted" }, check.reason)));
    } else {
      bar = mainButton("Start workout", () => { const r = startWorkout({ kind: "full", planDay: label.planDay }); if (!r.ok) rerender(); });
      children.push(secondaryButton("Short day (60 min)", () => { const r = startWorkout({ kind: "short", planDay: label.planDay }); if (!r.ok) rerender(); }));
      const swaps = swapOptions({ startMonday: doc.block.start_monday, today: t, sessions: doc.sessions });
      if (swaps.length) children.push(secondaryButton("Swap day", () => openSwapDay(doc, t, label)));
    }
  }

  // Weigh-in, the weekly summary (Mondays, once per week) and the 4-weekly measurement reminder.
  const lastWeigh = activeWeighins(doc.weighins).slice(-1)[0];
  const weighedToday = lastWeigh && lastWeigh.date === t;
  if (label.state === "running" && label.week >= 2) {
    const sum = weeklySummary(doc, { startMonday: doc.block.start_monday, today: t });
    if (sum && seenWeek() !== sum.week) {
      children.push(h("div", { class: "card warn" }, h("h2", {}, "Last week is ready"), h("p", { class: "muted" }, "Workouts, weight trend and a food suggestion."),
        h("a", { class: "button secondary", href: "#/weekly" }, "See last week")));
    }
  }
  const measureWeek = label.state === "running" && [1, 4, 8, 12].includes(label.week) && label.day === "mon";
  if (!weighedToday) {
    children.push(h("div", { class: "card" }, h("h2", {}, "Weigh-in"),
      h("p", { class: "muted" }, measureWeek ? "Weigh in, and measure your waist, chest, arm and thigh today." : "Weigh in after the toilet, before food and drink."),
      h("a", { class: "button secondary", href: "#/weighin" }, "Weigh in")));
  }

  if (targets) {
    children.push(h("div", { class: "card" },
      h("div", { class: "label" }, "Your numbers"),
      targets.kcal !== null ? h("div", { class: "metric" }, h("div", { class: "value" }, String(targets.kcal), h("span", { class: "unit" }, " kcal a day"))) : null,
      targets.protein_g !== null ? h("div", { class: "metric" }, h("div", { class: "value" }, String(targets.protein_g), h("span", { class: "unit" }, " g protein a day"))) : null,
      h("div", { class: "small muted" }, `Starting walk: ${targets.walk_start.speed_kmh} km/h, ${targets.walk_start.slope_pct} % slope`)));
  }
  if (!open && installHintShown()) {
    children.push(h("div", { class: "card warn" }, h("h2", {}, "Add this app to your Home Screen"),
      h("p", {}, "In Safari, tap the Share button, then Add to Home Screen. Open the app from there."),
      h("p", { class: "small muted" }, "Safari can delete the data of a web page you do not open for 7 days. An app on the Home Screen keeps it."),
      h("button", { class: "button secondary", type: "button", onclick: () => { dismissInstallHint(); rerender(); } }, "I did this")));
  }
  children.push(h("p", { class: "small muted" }, "Only on this phone. Set up GitHub in Settings."));

  const main = h("main", { class: "screen has-bar" }, ...children);
  return bar ? [main, tabActionBar(bar)] : [h("main", { class: "screen has-tabs" }, ...children)];
}
