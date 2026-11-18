// Today: the day, the blocks, today's exercises with suggested weights, the buttons (Start, Short day, Swap day), the
// missed-days message, your numbers. Base: redesign A. From builder C: the list of today's exercises. The walk minutes
// come from dayLayout() (dayplan.js), the same engine call as the walk screen (Rosario's answer 60 a: display only).
import { h } from "../h.js";
import { tabActionBar, mainButton, secondaryButton, openSheet, gearLink } from "./parts.js";
import { model, go, rerender } from "./app.js";
import { today } from "../clock.js";
import { getActive, setActive } from "../active.js";
import { dayLabel, canStartWorkout, swapOptions, missedRule } from "../engine/schedule.js";
import { finishedSessions, suggestFor, buildUnits } from "../engine/workout.js";
import { days, exercises } from "../plan/plan-v2.js";
import { dayLayout } from "../dayplan.js";
import { exerciseStateId } from "../ids.js";
import { thumb } from "./media.js";
import { openExerciseInfo } from "./exinfo.js";
import { fmtKg } from "./stats.js";
import { startWorkout } from "./flow.js";
import { activeWeighins, weeklySummary } from "../engine/trend.js";
import { seenWeek } from "./weekly.js";
import { installHintShown, dismissInstallHint } from "./update.js";
import { store } from "./app.js";
import { syncer } from "../syncer.js";
import { statusText, keyEndsSoon, connectionOf } from "../sync/sync.js";
import { weekInfo, DAY_IDS, weeks } from "../plan/plan-v2.js";
import { planForDay } from "../engine/schedule.js";
import { photosFor } from "../plan/media.js";
import { icon } from "./icons.js";
import { onMount, stagger } from "./motion.js";

let savedMessage = null; // shown once, after a workout was saved
let savedLink = null; // the Log to Health link, only when that button is on
export function setSavedMessage(text, link = null) { savedMessage = text; savedLink = link; }

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
  const done = session.exercises.reduce((n, e) => n + e.sets.filter((x) => x.type === "work").length, 0);
  return { card: h("div", { class: "card accent" }, h("span", { class: "eyebrow accent" }, "Workout in progress"), h("h2", {}, `Continue ${when} workout?`), h("p", { class: "muted" }, `Every set you did is saved${done ? ` (${done} so far)` : ""}.`)), button: mainButton("Continue workout", resume) };
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

// The 12 weeks as a row of small bars: done weeks dim, this week glowing (redesign A).
function blockBar(week) {
  const bar = h("div", { class: "block-bar grow", role: "img", "aria-label": `Week ${week} of ${weeks.length}` },
    weeks.map((w) => h("span", { class: w.week < week ? "done" : w.week === week ? "now" : "" })));
  bar.querySelectorAll("span").forEach((el, i) => { el.style.animationDelay = `${i * 30}ms`; });
  return bar;
}

// Monday to Friday of this week: a filled circle for each day with a finished workout.
function weekStrip(doc, label) {
  if (label.state !== "running") return null;
  const doneDays = new Set(doc.sessions.filter((s) => !s.deleted && s.week === label.week && s.status === "finished").map((s) => s.plan_day));
  return h("div", { class: "week-strip", role: "img", "aria-label": `This week: ${doneDays.size} of 5 workouts done` },
    DAY_IDS.map((d) => h("div", { class: `${doneDays.has(d) ? "done" : ""} ${label.planDay === d ? "today" : ""}` }, days[d].name.slice(0, 3), h("i", {}))));
}

// Today's exercises (builder C): picture, slot, sets × reps and the suggested weight. A tap opens the exercise sheet.
function exerciseList(doc, planDay, week, missed) {
  const plan = planForDay(planDay, week, "full");
  return h("div", { class: "card ex-list" },
    h("span", { class: "eyebrow" }, "Today's exercises"),
    buildUnits(plan.slots).map((u) => h("div", { class: "pair-group" }, u.slots.map((slot) => {
      const exId = slot.ex;
      const ex = exercises[exId];
      const st = doc.exercise_state.find((x) => x.id === exerciseStateId(exId) && !x.deleted);
      const sg = suggestFor(doc, exId, { week, missed, exerciseState: st });
      const [lo, hi] = ex.range;
      const reps = `${lo === hi ? lo : `${lo}–${hi}`}${ex.kind === "hold" ? " s" : ""}`;
      const end = ex.kind === "hold" ? `${sg.range[0]} s` : ex.step === "bodyweight" ? `${sg.reps}` : sg.weight_kg ? `${fmtKg(sg.weight_kg)} kg` : "–";
      const what = ex.kind === "hold" ? "hold" : ex.step === "bodyweight" ? "reps" : sg.weight_kg ? "suggested" : "pick light";
      return h("button", { class: "ex-row", type: "button", "aria-label": `${slot.slot} ${ex.name}: ${slot.sets} sets of ${reps}${ex.perSide ? " each side" : ""}, ${end} ${what}. Open tips.`, onclick: () => openExerciseInfo(exId, { settingsNote: false }) },
        thumb(exId, { small: true }),
        h("span", { class: "grow" },
          h("span", { class: "title" }, h("span", { class: "badge slot" }, slot.slot), h("span", {}, ex.name)),
          h("span", { class: "sub small muted" }, `${slot.sets} × ${reps}${ex.perSide ? " each side" : ""}`)),
        h("span", { class: "end" }, h("b", {}, end), h("small", {}, what)));
    }))));
}

// Today's workout as a hero card: photos of the pairs' first exercises, the focus, time, and the blocks.
function dayHero(label, layout, minutes, doc) {
  const plan = planForDay(label.planDay, label.week, "full");
  const leads = plan.slots.filter((s) => /^[A-D]1$/.test(s.slot) || s.slot === "D").map((s) => s.ex);
  const strip = leads.map((id) => photosFor(id)).filter(Boolean).slice(0, 3);
  const rir = Array.isArray(plan.rir) ? plan.rir.join("-") : plan.rir;
  return h("div", { class: "hero" },
    strip.length ? h("div", { class: "hero-strip", "aria-hidden": "true" }, strip.map((ph) => h("img", { src: ph[0], alt: "", decoding: "async" }))) : null,
    h("div", { class: "hero-body" },
      h("span", { class: "eyebrow" }, "Today's workout"),
      h("div", { class: "hero-title" }, days[label.planDay].focus),
      h("div", { class: "hero-meta" },
        h("span", {}, h("b", {}, String(minutes)), " min"),
        h("span", {}, h("b", {}, String(plan.slots.length)), " exercises"),
        rir !== undefined ? h("span", {}, "Stop with ", h("b", {}, String(rir)), " left") : null),
      h("ul", { class: "timeline" }, layout.map((b) => h("li", {}, h("span", {}, BLOCK_NAMES[b.id] ?? b.id), h("span", { class: "min" }, `${b.minutes} min`)))),
      h("p", { class: "small muted" }, `About ${minutes} minutes. Start a Strength workout on your Apple Watch at minute 0.`),
      weekStrip(doc, label)));
}

export function renderToday() {
  const doc = model.doc();
  const targets = doc.profile?.targets;
  const t = today();
  const label = dayLabel(doc.block.start_monday, t);
  const open = doc.sessions.find((s) => !s.deleted && s.status === "in_progress");
  const dayName = label.planDay ? days[label.planDay].name : new Date(`${t}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long" });
  const running = label.state === "running";
  const children = [
    gearLink(),
    h("div", { class: "today-head" },
      h("div", {},
        h("span", { class: "eyebrow accent" }, running ? `Week ${label.week} of ${weeks.length} · ${weekInfo(label.week).phase}` : "Today"),
        h("h1", {}, dayName))),
    running ? blockBar(label.week) : null,
    h("p", { class: "small muted" }, label.text),
  ];
  let bar = null;

  if (savedMessage) {
    children.push(h("div", { class: "card accent" }, h("p", { class: "status-success status-line" }, icon("check", 18), savedMessage),
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
    children.push(h("div", { class: "hero" }, h("div", { class: "hero-body" }, h("span", { class: "eyebrow" }, "Recover"), h("div", { class: "hero-title" }, "Rest day"), h("p", { class: "muted" }, "A relaxed walk outside is fine. Weigh in in the morning."), weekStrip(doc, label))));
  } else {
    const kind = "full";
    const check = canStartWorkout(doc.sessions, t);
    const lastFinished = finishedSessions(doc.sessions)[0];
    const missed = missedRule(lastFinished ? lastFinished.date : null, t);
    const day = dayLayout(doc, { planDay: label.planDay, week: label.week, today: t, kind });
    children.push(dayHero(label, day.layout, day.minutes, doc));
    if (label.week === 1) children.push(h("div", { class: "card" }, h("p", {}, "Week 1: learn the moves and find your weights. Two sets of each exercise. It will feel easy on purpose."), h("p", { class: "small muted" }, "In Settings, fill in the gym's dumbbell sizes and weight steps when you know them.")));
    if (lastFinished && missed.kind !== "carry_on") children.push(h("div", { class: "card warn" }, h("p", {}, missed.message)));
    children.push(exerciseList(doc, label.planDay, label.week, missed));
    if (!check.ok) {
      children.push(h("div", { class: "card" }, h("p", { class: "status-success" }, "Done for today."), h("p", { class: "muted" }, check.reason)));
    } else {
      bar = mainButton(["Start workout", icon("chevron", 20, { strokeWidth: 2.6 })], () => { const r = startWorkout({ kind: "full", planDay: label.planDay }); if (!r.ok) rerender(); });
      const swaps = swapOptions({ startMonday: doc.block.start_monday, today: t, sessions: doc.sessions });
      children.push(h("div", { class: "day-actions" },
        secondaryButton("Short day (60 min)", () => { const r = startWorkout({ kind: "short", planDay: label.planDay }); if (!r.ok) rerender(); }),
        swaps.length ? secondaryButton("Swap day", () => openSwapDay(doc, t, label)) : null));
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
    children.push(h("div", { class: "card" }, h("h2", { class: "status-line" }, h("span", { class: "area-icon" }, icon("scale", 20)), "Weigh-in"),
      h("p", { class: "muted" }, measureWeek ? "Weigh in, and measure your waist, chest, arm and thigh today." : "Weigh in after the toilet, before food and drink."),
      h("a", { class: "button secondary", href: "#/weighin" }, "Weigh in")));
  }

  if (targets) {
    children.push(h("span", { class: "eyebrow" }, "Your numbers"), h("div", { class: "tiles" },
      targets.kcal !== null ? h("div", { class: "tile" }, h("div", { class: "label" }, "Food a day"), h("div", { class: "value" }, String(targets.kcal), h("span", { class: "unit" }, " kcal"))) : null,
      targets.protein_g !== null ? h("div", { class: "tile" }, h("div", { class: "label" }, "Protein a day"), h("div", { class: "value" }, String(targets.protein_g), h("span", { class: "unit" }, " g"))) : null,
      targets.walk_start ? h("div", { class: "tile wide small muted" }, `Starting walk: ${targets.walk_start.speed_kmh} km/h, ${targets.walk_start.slope_pct} % slope`) : null)); // a restored file may have none (review F4)
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
  const unsynced = configured && syncer.hasUnsynced();
  children.push(h("p", { class: `status-line ${bad ? "small status-warning" : "small muted"}`, role: "status" },
    h("span", { class: `dot ${configured && !bad && !unsynced ? "ok" : ""}` }),
    statusText(device, unsynced), " ", configured ? null : h("a", { href: "#/settings" }, "Settings"), bad ? h("a", { href: "#/settings" }, "Settings") : null));

  onMount(() => stagger(document.querySelectorAll(".screen > .hero, .screen > .card, .screen > .tiles, .screen > .day-actions")));
  const main = h("main", { class: "screen has-bar" }, ...children);
  return bar ? [main, tabActionBar(bar)] : [h("main", { class: "screen has-tabs" }, ...children)];
}
