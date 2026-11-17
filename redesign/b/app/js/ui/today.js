// Today: the day, the blocks, the buttons (Start, Short day, Swap day), the missed-days message, your numbers.
// Redesign B: Apple Fitness "Summary" look: large title with the date, a 12-week progress line, one big workout card
// with the day's exercise photos, grouped rows for the weigh-in, tiles for the food numbers.
import { h } from "../h.js";
import { tabActionBar, mainButton, secondaryButton, openSheet, navHead, exerciseMedia, section, group, row, iconTile, tile, statusDot } from "./parts.js";
import { icon } from "./icons.js";
import { countUp, growIn } from "./motion.js";
import { model, go, rerender } from "./app.js";
import { today } from "../clock.js";
import { getActive, setActive } from "../active.js";
import { dayLabel, sessionLayout, expectedMinutes, canStartWorkout, swapOptions, missedRule, planForDay } from "../engine/schedule.js";
import { finishedSessions } from "../engine/workout.js";
import { days, exercises, weekInfo } from "../plan/plan-v2.js";
import { startWorkout } from "./flow.js";
import { activeWeighins, weeklySummary } from "../engine/trend.js";
import { seenWeek } from "./weekly.js";
import { installHintShown, dismissInstallHint } from "./update.js";
import { store } from "./app.js";
import { syncer } from "../syncer.js";
import { statusText, keyEndsSoon, connectionOf } from "../sync/sync.js";
import { openExercise } from "./exsheet.js";

let savedMessage = null; // shown once, after a workout was saved
let savedLink = null; // the Log to Health link, only when that button is on
export function setSavedMessage(text, link = null) { savedMessage = text; savedLink = link; }

const BLOCK_NAMES = {
  walk: "Walk", changeover: "Change-over", lift_warmup: "Lift warm-up", pairs: "Weights (3 pairs)", abs: "Abs and holds",
  finish: "Finish and save", pairs_ab: "Weights (pairs A and B)", abs_first: "First abs exercise",
};
const BLOCK_DOT = { walk: "cardio", changeover: "gray", lift_warmup: "orange", pairs: "", pairs_ab: "", abs: "green", abs_first: "green", finish: "gray" };

function longDate(t) {
  const [y, m, d] = t.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
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
    card: h("div", { class: "card info" },
      h("div", { class: "card-title" }, icon("play", 18), `Continue ${when} workout?`),
      h("p", { class: "muted subhead" }, `${days[session.plan_day].focus}. ${sets} set${sets === 1 ? "" : "s"} done. Every set you did is saved.`)),
    button: mainButton("Continue workout", resume, { iconName: "play" }),
  };
}

function openSwapDay(doc, t, pos) {
  const options = swapOptions({ startMonday: doc.block.start_monday, today: t, sessions: doc.sessions });
  const close = openSheet(
    h("h2", {}, "Swap day"),
    h("p", { class: "muted" }, "Do the workout of an earlier day that you missed this week, in place of today's."),
    options.length
      ? group(options.map((d) => row({ title: days[d].name, sub: days[d].focus, chevron: true, onclick: () => { close(); const r = startWorkout({ planDay: d, swappedFrom: pos.planDay }); if (!r.ok) rerender(); } })))
      : h("p", {}, "No missed day this week to swap in."));
}

function weekBar(week) {
  const segs = Array.from({ length: 12 }, (_, i) => h("span", { class: i + 1 < week ? "done" : i + 1 === week ? "now" : "" }));
  requestAnimationFrame(() => growIn(segs));
  return h("div", { class: "weekbar", role: "img", "aria-label": `Week ${week} of 12` }, segs);
}

function workoutCard(label, kind) {
  const plan = planForDay(label.planDay, label.week, kind);
  const layout = sessionLayout(kind, label.week);
  const exIds = [...new Set(plan.slots.map((s) => s.ex))];
  return h("div", { class: "card today-card" },
    h("div", { class: "today-top" },
      h("p", { class: "eyebrow" }, "Today's workout"),
      h("div", { class: "focus" }, days[label.planDay].focus),
      h("div", { class: "subhead muted" }, `About ${expectedMinutes(kind, label.week)} minutes · ${exIds.length} exercises · walk first`),
      h("div", { class: "media-strip", role: "list", "aria-label": "Today's exercises" },
        exIds.map((id) => exerciseMedia(id, exercises[id].name, "strip", { onclick: () => openExercise(id) })))),
    h("div", { class: "blocks" },
      layout.map((b) => h("div", { class: "block-line" },
        h("span", { class: `block-dot ${BLOCK_DOT[b.id] ?? ""}`, "aria-hidden": "true" }),
        h("span", { class: "grow" }, BLOCK_NAMES[b.id] ?? b.id),
        h("span", { class: "muted" }, `${b.minutes} min`)))),
    h("div", { class: "today-foot" },
      h("div", { class: "info-line accent" }, icon("watch", 18), h("span", {}, "Start a Strength workout on your Apple Watch at minute 0."))));
}

export function renderToday() {
  const doc = model.doc();
  const targets = doc.profile?.targets;
  const t = today();
  const label = dayLabel(doc.block.start_monday, t);
  const open = doc.sessions.find((s) => !s.deleted && s.status === "in_progress");
  const running = label.state === "running" && label.week;
  const children = [
    navHead("Today", longDate(t)),
    h("div", { class: "subhead", role: "heading", "aria-level": "2" }, label.text),
    running ? weekBar(label.week) : null,
    running ? h("p", { class: "small muted" }, `Week ${label.week} of 12 · ${weekInfo(label.week).phase}`) : h("div", { class: "section" }),
  ];
  let bar = null;

  if (savedMessage) {
    children.push(h("div", { class: "card good" },
      h("div", { class: "card-title status-success" }, icon("check", 20, { stroke: 2.6 }), "Workout saved"),
      h("p", {}, savedMessage),
      savedLink ? h("a", { class: "button secondary", href: savedLink }, icon("heart", 18), "Log to Health") : null));
    savedMessage = null;
    savedLink = null;
  }

  if (open) {
    const r = resumeCard(doc, open);
    children.push(r.card);
    bar = r.button;
  } else if (label.state === "before") {
    children.push(h("div", { class: "card" }, h("div", { class: "card-title" }, icon("calendar", 18), "Your plan has not started"), h("p", { class: "muted" }, `It starts on Monday ${doc.block.start_monday}.`)));
  } else if (label.state === "after") {
    children.push(h("div", { class: "card" }, h("div", { class: "card-title" }, icon("star", 18), "The 12 weeks are done"), h("p", { class: "muted" }, "Time for the review. Talk to the Training chat about the next block.")));
  } else if (!label.planDay) {
    children.push(h("div", { class: "card" }, h("div", { class: "card-title" }, icon("heart", 18), "Rest day"), h("p", { class: "muted" }, "A relaxed walk outside is fine. Weigh in in the morning.")));
  } else {
    const kind = "full";
    const check = canStartWorkout(doc.sessions, t);
    const lastFinished = finishedSessions(doc.sessions)[0];
    const missed = missedRule(lastFinished ? lastFinished.date : null, t);
    if (lastFinished && missed.kind !== "carry_on") children.push(h("div", { class: "card warn" }, h("div", { class: "card-title status-warning" }, icon("info", 18), "Welcome back"), h("p", {}, missed.message)));
    children.push(workoutCard(label, kind));
    if (label.week === 1) children.push(h("div", { class: "card info" }, h("div", { class: "card-title" }, icon("sparkle", 18), "Week 1: learn and find your weights"), h("p", {}, "Learn the moves and find your weights. Two sets of each exercise. It will feel easy on purpose."), h("p", { class: "small muted" }, "In Settings, fill in the gym's dumbbell sizes and weight steps when you know them. Write where each machine is in Plan, Machines.")));
    if (!check.ok) {
      children.push(h("div", { class: "card good" }, h("div", { class: "card-title status-success" }, icon("check", 20, { stroke: 2.6 }), "Done for today."), h("p", { class: "muted" }, check.reason)));
    } else {
      bar = mainButton("Start workout", () => { const r = startWorkout({ kind: "full", planDay: label.planDay }); if (!r.ok) rerender(); }, { iconName: "play" });
      const swaps = swapOptions({ startMonday: doc.block.start_monday, today: t, sessions: doc.sessions });
      const shortBtn = secondaryButton("Short day (60 min)", () => { const r = startWorkout({ kind: "short", planDay: label.planDay }); if (!r.ok) rerender(); }, { iconName: "clock" });
      children.push(swaps.length
        ? h("div", { class: "button-row section" }, shortBtn, secondaryButton("Swap day", () => openSwapDay(doc, t, label), { iconName: "swap" }))
        : h("div", { class: "section" }, shortBtn));
    }
  }

  // Weigh-in, the weekly summary (Mondays, once per week) and the 4-weekly measurement reminder.
  const lastWeigh = activeWeighins(doc.weighins).slice(-1)[0];
  const weighedToday = lastWeigh && lastWeigh.date === t;
  if (label.state === "running" && label.week >= 2) {
    const sum = weeklySummary(doc, { startMonday: doc.block.start_monday, today: t });
    if (sum && seenWeek() !== sum.week) {
      children.push(section("This week", group(row({ title: "Last week is ready", sub: "Workouts, weight trend and a food suggestion.", lead: iconTile("progress", "indigo"), href: "#/weekly", chevron: true }))));
    }
  }
  const measureWeek = label.state === "running" && [1, 4, 8, 12].includes(label.week) && label.day === "mon";
  if (!weighedToday) {
    children.push(section("Weigh-in", group(row({
      title: measureWeek ? "Weigh in and measure" : "Weigh in",
      sub: measureWeek ? "Weigh in, and measure your waist, chest, arm and thigh today." : "Weigh in after the toilet, before food and drink.",
      lead: iconTile("scale", "teal"), href: "#/weighin", chevron: true,
    }))));
  }

  if (targets) {
    const tiles = [];
    if (targets.kcal !== null) { const v = h("span", {}, String(targets.kcal)); tiles.push(tile({ label: "Calories", value: v, unit: "kcal a day", color: "orange", iconName: "flame" })); requestAnimationFrame(() => countUp(v, targets.kcal)); }
    if (targets.protein_g !== null) { const v = h("span", {}, String(targets.protein_g)); tiles.push(tile({ label: "Protein", value: v, unit: "g a day", color: "green", iconName: "food" })); requestAnimationFrame(() => countUp(v, targets.protein_g)); }
    children.push(h("h2", { class: "group-head" }, "Your numbers"));
    if (tiles.length) children.push(h("div", { class: "tiles" }, tiles));
    if (targets.walk_start) children.push(h("div", { class: "section" }, group(row({ title: "Starting walk", value: `${targets.walk_start.speed_kmh} km/h · ${targets.walk_start.slope_pct} %`, lead: iconTile("walk", "mint") })))); // a restored file may have none (review F4)
  }
  if (!open && installHintShown()) {
    children.push(h("div", { class: "card warn" }, h("div", { class: "card-title" }, icon("download", 18), "Add this app to your Home Screen"),
      h("p", {}, "In Safari, tap the Share button, then Add to Home Screen. Open the app from there."),
      h("p", { class: "small muted" }, "Safari can delete the data of a web page you do not open for 7 days. An app on the Home Screen keeps it."),
      h("button", { class: "button gray", type: "button", onclick: () => { dismissInstallHint(); rerender(); } }, "I did this")));
  }
  const device = store.loadDevice();
  const ends = keyEndsSoon(device, t);
  if (ends) children.push(h("p", { class: "small status-warning center" }, ends.days < 0 ? `GitHub key ended on ${ends.date}. Make a new one.` : `GitHub key ends on ${ends.date}.`));
  const configured = connectionOf(device) !== null;
  const bad = configured && device.last_sync_result && device.last_sync_result !== "ok";
  const unsynced = configured && syncer.hasUnsynced();
  children.push(h("p", { class: `sync-line ${bad ? "status-warning" : ""}`, role: "status" },
    statusDot(!configured ? "" : bad ? "bad" : unsynced ? "warn" : "ok"),
    h("span", {}, statusText(device, unsynced)), configured && !bad ? null : h("a", { href: "#/settings" }, "Settings")));

  const main = h("main", { class: `screen ${bar ? "has-bar has-tabs" : "has-tabs"}` }, ...children);
  return bar ? [main, tabActionBar(bar)] : [main];
}
