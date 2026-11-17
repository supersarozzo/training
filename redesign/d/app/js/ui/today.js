// Today: the day, the blocks, the buttons (Start, Short day, Swap day), the missed-days message, your numbers.
// Coach style: one big "today's session" card with the first exercise's photo and the session as a timeline,
// then smaller cards (weigh-in, last week, your numbers), and the sync line.
import { h } from "../h.js";
import { tabActionBar, mainButton, openSheet } from "./parts.js";
import { model, go, rerender } from "./app.js";
import { today } from "../clock.js";
import { getActive, setActive } from "../active.js";
import { dayLabel, sessionLayout, expectedMinutes, canStartWorkout, swapOptions, missedRule, planForDay } from "../engine/schedule.js";
import { finishedSessions } from "../engine/workout.js";
import { days, weekInfo } from "../plan/plan-v2.js";
import { startWorkout } from "./flow.js";
import { activeWeighins, weeklySummary } from "../engine/trend.js";
import { seenWeek } from "./weekly.js";
import { installHintShown, dismissInstallHint } from "./update.js";
import { store } from "./app.js";
import { syncer } from "../syncer.js";
import { statusText, keyEndsSoon, connectionOf } from "../sync/sync.js";
import { demo, thumb, nameOf } from "./demo.js";
import { icon } from "./icons.js";

let savedMessage = null; // shown once, after a workout was saved
let savedLink = null; // the Log to Health link, only when that button is on
export function setSavedMessage(text, link = null) { savedMessage = text; savedLink = link; }

const BLOCK_NAMES = {
  walk: "Walk", changeover: "Change-over", lift_warmup: "Lift warm-up", pairs: "Weights (3 pairs)", abs: "Abs and holds",
  finish: "Finish and save", pairs_ab: "Weights (pairs A and B)", abs_first: "First abs exercise",
};
const BLOCK_ICONS = { walk: "walk", changeover: "timer", lift_warmup: "warmup", pairs: "weights", pairs_ab: "weights", abs: "abs", abs_first: "abs", finish: "flag" };
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function dateWords(t) {
  const [y, m, d] = t.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${WEEKDAYS[dt.getDay()]} ${d} ${MONTHS[m - 1]}`;
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
  const first = session.exercises[0]?.done_exercise;
  return {
    card: h("section", { class: "hero" },
      first ? h("div", { class: "hero-media" }, demo(first, { label: false }), h("span", { class: "tag warn hero-badge" }, "In progress")) : null,
      h("div", { class: "hero-body" },
        h("span", { class: "eyebrow brand" }, days[session.plan_day]?.focus ?? "Workout"),
        h("h1", {}, `Continue ${when} workout?`),
        h("p", { class: "muted" }, `Every set you did is saved${sets ? ` (${sets} so far)` : ""}. Pick up where you left off.`))),
    button: mainButton("Continue workout", resume),
  };
}

function openSwapDay(doc, t, pos) {
  const options = swapOptions({ startMonday: doc.block.start_monday, today: t, sessions: doc.sessions });
  const close = openSheet(
    h("h2", {}, "Swap day"),
    h("p", { class: "muted" }, "Do the workout of an earlier day that you missed this week, in place of today's."),
    options.length
      ? h("div", { class: "choices" }, options.map((d) => h("button", { class: "choice", type: "button", onclick: () => { close(); const r = startWorkout({ planDay: d, swappedFrom: pos.planDay }); if (!r.ok) rerender(); } },
        thumb(planForDay(d, pos.week, "full").slots[0].ex), h("span", {}, h("b", {}, days[d].name), h("br"), h("span", { class: "small muted" }, days[d].focus)))))
      : h("p", {}, "No missed day this week to swap in."));
}

function staggered(list) {
  list.forEach((el, i) => { el.classList.add("fade-up"); el.style.setProperty("--i", String(i)); });
  return list;
}

export function renderToday() {
  const doc = model.doc();
  const targets = doc.profile?.targets;
  const t = today();
  const label = dayLabel(doc.block.start_monday, t);
  const open = doc.sessions.find((s) => !s.deleted && s.status === "in_progress");
  const children = [
    h("div", { class: "page-head" },
      h("div", {}, h("div", { class: "date-line" }, dateWords(t)), h("h1", {}, "Today")),
      label.state === "running" ? h("span", { class: "tag brand" }, `Week ${label.week} of 12`) : null),
  ];
  let bar = null;

  if (savedMessage) {
    children.push(h("div", { class: "card tint card-row" }, icon("check"),
      h("div", { class: "grow" }, h("p", { class: "status-success" }, h("b", {}, savedMessage)),
        savedLink ? h("a", { class: "button secondary", href: savedLink }, "Log to Health") : null)));
    savedMessage = null;
    savedLink = null;
  }

  if (open) {
    const r = resumeCard(doc, open);
    children.push(r.card);
    bar = r.button;
  } else if (label.state === "before") {
    children.push(h("div", { class: "card" }, h("span", { class: "eyebrow brand" }, "Coming up"), h("h2", {}, "Your plan has not started"), h("p", { class: "muted" }, `It starts on Monday ${doc.block.start_monday}.`)));
  } else if (label.state === "after") {
    children.push(h("div", { class: "card" }, h("span", { class: "eyebrow brand" }, "Block done"), h("h2", {}, "The 12 weeks are done"), h("p", { class: "muted" }, "Time for the review. Talk to the Training chat about the next block.")));
  } else if (!label.planDay) {
    children.push(h("section", { class: "hero" },
      h("div", { class: "hero-body" },
        h("span", { class: "eyebrow brand" }, label.text),
        h("h1", {}, "Rest day"),
        h("p", { class: "muted" }, "A relaxed walk outside is fine. Weigh in in the morning."))));
  } else {
    const kind = "full";
    const check = canStartWorkout(doc.sessions, t);
    const lastFinished = finishedSessions(doc.sessions)[0];
    const missed = missedRule(lastFinished ? lastFinished.date : null, t);
    const layout = sessionLayout(kind, label.week);
    const firstEx = planForDay(label.planDay, label.week, kind).slots[0]?.ex;
    const phase = weekInfo(label.week).phase;
    children.push(h("section", { class: "hero" },
      firstEx ? h("div", { class: "hero-media" }, demo(firstEx, { label: false }), h("span", { class: "tag brand hero-badge" }, `First: ${nameOf(firstEx)}`)) : null,
      h("div", { class: "hero-body" },
        h("span", { class: "eyebrow brand" }, label.text),
        h("h1", {}, days[label.planDay].focus),
        h("div", { class: "g-sub" }, `About ${expectedMinutes(kind, label.week)} minutes · ${phase}`),
        h("ul", { class: "timeline", "aria-label": "Today's blocks" }, staggered(layout.map((b) =>
          h("li", {}, h("span", { class: "dot" }, icon(BLOCK_ICONS[b.id] ?? "sparkle")), h("span", { class: "grow" }, BLOCK_NAMES[b.id] ?? b.id), h("span", { class: "mins" }, `${b.minutes} min`))))),
        h("div", { class: "coach" }, icon("timer"), h("div", {}, "Start a Strength workout on your Apple Watch at minute 0.")))));
    if (label.week === 1) children.push(h("div", { class: "card tint" }, h("span", { class: "eyebrow brand" }, "Week 1"), h("p", {}, "Learn the moves and find your weights. Two sets of each exercise. It will feel easy on purpose."), h("p", { class: "small muted" }, "In Settings, fill in the gym's dumbbell sizes and weight steps when you know them.")));
    if (lastFinished && missed.kind !== "carry_on") children.push(h("div", { class: "card warn" }, h("span", { class: "eyebrow" }, "Welcome back"), h("p", {}, missed.message)));
    if (!check.ok) {
      children.push(h("div", { class: "card tint card-row" }, icon("check"), h("div", { class: "grow" }, h("p", { class: "status-success" }, h("b", {}, "Done for today.")), h("p", { class: "muted" }, check.reason))));
    } else {
      bar = mainButton("Start workout", () => { const r = startWorkout({ kind: "full", planDay: label.planDay }); if (!r.ok) rerender(); });
      const swaps = swapOptions({ startMonday: doc.block.start_monday, today: t, sessions: doc.sessions });
      children.push(h("div", { class: swaps.length ? "button-row" : "" },
        h("button", { class: "button secondary", type: "button", onclick: () => { const r = startWorkout({ kind: "short", planDay: label.planDay }); if (!r.ok) rerender(); } }, "Short day (60 min)"),
        swaps.length ? h("button", { class: "button secondary", type: "button", onclick: () => openSwapDay(doc, t, label) }, "Swap day") : null));
    }
  }

  // Weigh-in, the weekly summary (Mondays, once per week) and the 4-weekly measurement reminder.
  const lastWeigh = activeWeighins(doc.weighins).slice(-1)[0];
  const weighedToday = lastWeigh && lastWeigh.date === t;
  if (label.state === "running" && label.week >= 2) {
    const sum = weeklySummary(doc, { startMonday: doc.block.start_monday, today: t });
    if (sum && seenWeek() !== sum.week) {
      children.push(h("a", { class: "card card-row", href: "#/weekly" }, h("span", { class: "dot-ico" }, icon("progress")),
        h("div", { class: "grow" }, h("b", {}, "Last week is ready"), h("div", { class: "small muted" }, "Workouts, weight trend and a food suggestion.")), icon("chevron", "chev")));
    }
  }
  const measureWeek = label.state === "running" && [1, 4, 8, 12].includes(label.week) && label.day === "mon";
  if (!weighedToday) {
    children.push(h("a", { class: "card card-row", href: "#/weighin" }, h("span", { class: "dot-ico" }, icon("scale")),
      h("div", { class: "grow" }, h("b", {}, "Weigh-in"), h("div", { class: "small muted" }, measureWeek ? "Weigh in, and measure your waist, chest, arm and thigh today." : "Weigh in after the toilet, before food and drink.")), icon("chevron", "chev")));
  }

  if (targets) {
    children.push(h("div", { class: "card" },
      h("span", { class: "eyebrow" }, "Your numbers"),
      h("div", { class: "food" },
        targets.kcal !== null ? h("div", {}, h("div", { class: "value" }, String(targets.kcal)), h("div", { class: "small muted" }, "kcal a day")) : null,
        targets.protein_g !== null ? h("div", {}, h("div", { class: "value" }, String(targets.protein_g), h("span", { class: "unit" }, " g")), h("div", { class: "small muted" }, "protein a day")) : null),
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
  if (ends) children.push(h("p", { class: "small status-warning center" }, ends.days < 0 ? `GitHub key ended on ${ends.date}. Make a new one.` : `GitHub key ends on ${ends.date}.`));
  const configured = connectionOf(device) !== null;
  const bad = configured && device.last_sync_result && device.last_sync_result !== "ok";
  const unsynced = configured && syncer.hasUnsynced();
  children.push(h("p", { class: `sync-line small ${bad ? "bad status-warning" : configured && !unsynced ? "ok muted" : "muted"}`, role: "status" },
    h("span", { class: "dot", "aria-hidden": "true" }),
    h("span", {}, statusText(device, unsynced), " ", configured ? null : h("a", { href: "#/settings" }, "Settings"), bad ? h("a", { href: "#/settings" }, "Settings") : null)));

  const main = h("main", { class: bar ? "screen has-bar has-tabs" : "screen has-tabs", dataset: { view: "today" } }, ...children);
  return bar ? [main, tabActionBar(bar)] : [main];
}
