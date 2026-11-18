// Today: the gym day. A day picker (Monday to Friday of this week) picks the plan day to train; the heading, the
// blocks, the exercises with reps and suggested weights and the buttons (Start, Short day) follow the picked day. Also
// the missed-days message and your numbers. 0.6.0 (Rosario, 2026-11-18): "so I can start any day of the week"; the
// day picker replaces the old Swap day sheet. Base: redesign A. From builder C: the list of today's exercises. The walk minutes
// come from dayLayout() (dayplan.js), the same engine call as the walk screen (Rosario's answer 60 a: display only).
import { h } from "../h.js";
import { tabActionBar, mainButton, secondaryButton } from "./parts.js";
import { model, go, rerender } from "./app.js";
import { today } from "../clock.js";
import { getActive, setActive } from "../active.js";
import { dayLabel, canStartWorkout, missedRule, PRACTICE_LABEL, practiceLine, sessionWeek } from "../engine/schedule.js";
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
import { weekInfo, weeks } from "../plan/plan-v2.js";
import { planForDay } from "../engine/schedule.js";
import { photosFor } from "../plan/media.js";
import { icon } from "./icons.js";
import { editOf, editedMinutes, dayChoices, rangeFor, rangeText } from "../planview.js";
import { onMount, stagger } from "./motion.js";

let savedMessage = null; // shown once, after a workout was saved
let savedLink = null; // the Log to Health link, only when that button is on
let picked = { date: null, day: null }; // the day picked on Today; it counts only on the date it was picked
let calm = false; // true for the redraw after a day pick: no fade-in of the whole screen
export function setSavedMessage(text, link = null) { savedMessage = text; savedLink = link; }

const BLOCK_NAMES = {
  walk: "Walk", changeover: "Change-over", lift_warmup: "Lift warm-up", pairs: "Weights (3 pairs)", abs: "Abs and holds",
  finish: "Finish and save", pairs_ab: "Weights (pairs A and B)", abs_first: "First abs exercise",
  edits: "Your Plan changes",
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

// The 12 weeks as a row of small bars: done weeks dim, this week glowing (redesign A).
function blockBar(week) {
  const bar = h("div", { class: "block-bar grow", role: "img", "aria-label": `Week ${week} of ${weeks.length}` },
    weeks.map((w) => h("span", { class: w.week < week ? "done" : w.week === week ? "now" : "" })));
  bar.querySelectorAll("span").forEach((el, i) => { el.style.animationDelay = `${i * 30}ms`; });
  return bar;
}

// The plan day Today shows when nothing is picked: the calendar's day; after a done day (done earlier this week,
// for example in place of another day) the first day not done yet; a workout finished today keeps its day, so
// "Done for today" shows what was trained. Saturday, Sunday and dates outside the 12 weeks: null (rest day).
export function defaultShown(doc, date) {
  const choices = dayChoices(doc, date);
  if (!choices.length) return null;
  const doneToday = (doc.sessions ?? []).find((s) => !s.deleted && s.date === date && s.status === "finished");
  if (doneToday && choices.some((c) => c.day === doneToday.plan_day)) return doneToday.plan_day;
  const cal = choices.find((c) => c.today);
  if (!cal) return null;
  if (!cal.done) return cal.day;
  return choices.find((c) => !c.done)?.day ?? cal.day;
}

// Monday to Friday of this week as chips: a tick on each day done, "Today" under the calendar's day, the picked day
// filled. A tap shows that day on Today; Start then trains it.
function dayPicker(choices, shown, t) {
  return h("div", { class: "day-picker", role: "group", "aria-label": "Pick the day to train" },
    choices.map((c) => h("button", {
      class: `day-chip${c.done ? " done" : ""}${c.today ? " today" : ""}`, type: "button",
      "aria-pressed": c.day === shown ? "true" : "false",
      "aria-label": `${days[c.day].name}${c.today ? ", today" : ""}${c.done ? ", done" : ""}: ${days[c.day].focus}`,
      onclick: () => { picked = { date: t, day: c.day }; calm = true; rerender(); },
    },
    h("span", { class: "d" }, c.done ? icon("check", 13, { strokeWidth: 3.2 }) : null, days[c.day].name.slice(0, 3)),
    h("span", { class: "s" }, c.today ? "Today" : c.done ? "Done" : ""))));
}

// Today's exercises (builder C): picture, slot, sets × reps and the suggested weight. A tap opens the exercise sheet.
function exerciseList(doc, planDay, week, missed) {
  const plan = planForDay(planDay, week, "full", editOf(doc, planDay));
  return h("div", { class: "card ex-list" },
    h("span", { class: "eyebrow" }, "Today's exercises"),
    buildUnits(plan.slots).map((u) => h("div", { class: "pair-group" }, u.slots.map((slot) => {
      const exId = slot.ex;
      const ex = exercises[exId];
      const st = doc.exercise_state.find((x) => x.id === exerciseStateId(exId) && !x.deleted);
      const sg = suggestFor(doc, exId, { week, missed, exerciseState: st });
      // The reps set in the Plan for this exercise count on every day (0.6.0), else the plan's range.
      const reps = `${rangeText(rangeFor(doc, exId))}${ex.kind === "hold" ? " s" : ""}`;
      const end = ex.kind === "hold" ? `${sg.range[0]} s` : ex.step === "bodyweight" ? `${sg.reps}` : sg.weight_kg ? `${fmtKg(sg.weight_kg)} kg` : "–";
      const what = ex.kind === "hold" ? "hold" : ex.step === "bodyweight" ? "reps" : sg.weight_kg ? (sg.action === "mine" ? "your weight" : sg.action === "first_try" ? "first try" : "suggested") : "start light";
      return h("button", { class: "ex-row", type: "button", "aria-label": `${slot.slot} ${ex.name}: ${slot.sets} sets of ${reps}${ex.perSide ? " each side" : ""}, ${end} ${what}. Open tips.`, onclick: () => openExerciseInfo(exId, { settingsNote: false }) },
        thumb(exId, { small: true }),
        h("span", { class: "grow" },
          h("span", { class: "title" }, h("span", { class: "badge slot" }, slot.slot), h("span", {}, ex.name)),
          h("span", { class: "sub small muted" }, `${slot.sets} × ${reps}${ex.perSide ? " each side" : ""}`)),
        h("span", { class: "end" }, h("b", {}, end), h("small", {}, what)));
    }))));
}

// The shown day's workout as a hero card: photos of the pairs' first exercises, time, and the blocks. The focus is the
// screen's heading.
function dayHero(planDay, week, layout, minutes, doc) {
  const plan = planForDay(planDay, week, "full", editOf(doc, planDay));
  const leads = plan.slots.filter((s) => /^[A-D]1$/.test(s.slot) || s.slot === "D").map((s) => s.ex);
  const strip = leads.map((id) => photosFor(id)).filter(Boolean).slice(0, 3);
  const rir = Array.isArray(plan.rir) ? plan.rir.join("-") : plan.rir;
  return h("div", { class: "hero" },
    strip.length ? h("div", { class: "hero-strip", "aria-hidden": "true" }, strip.map((ph) => h("img", { src: ph[0], alt: "", decoding: "async" }))) : null,
    h("div", { class: "hero-body" },
      h("span", { class: "eyebrow" }, `${days[planDay].name}'s workout`),
      h("div", { class: "hero-meta" },
        h("span", {}, h("b", {}, String(minutes)), " min"),
        h("span", {}, h("b", {}, String(plan.slots.length)), " exercises"),
        rir !== undefined ? h("span", {}, "Stop with ", h("b", {}, String(rir)), " left") : null),
      h("ul", { class: "timeline" }, layout.map((b) => h("li", {}, h("span", {}, BLOCK_NAMES[b.id] ?? b.id), h("span", { class: "min" }, b.id === "edits" ? `${b.minutes > 0 ? "+" : "−"}${Math.abs(b.minutes)} min` : `${b.minutes} min`)))),
      h("p", { class: "small muted" }, `About ${minutes} minutes. Start a Strength workout on your Apple Watch at minute 0.`)));
}

export function renderToday() {
  const doc = model.doc();
  const targets = doc.profile?.targets;
  const t = today();
  const label = dayLabel(doc.block.start_monday, t);
  const open = doc.sessions.find((s) => !s.deleted && s.status === "in_progress");
  const dayName = label.planDay ? days[label.planDay].name : new Date(`${t}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long" });
  const running = label.state === "running";
  // Before the block's first Monday every day is a practice day (trainer D11, 0.7.1): the same Start and day picker,
  // the week-1 rules, saved as week 0. The start date never moves.
  const practice = label.state === "before";
  const active = running || practice;
  const week = sessionWeek(label); // the week the day is planned and saved with: 0 on a practice day
  // The plan day Today shows: the one picked today, else defaultShown. Start and Short day train this day.
  const choices = active ? dayChoices(doc, t) : [];
  const shown = picked.date === t && choices.some((c) => c.day === picked.day) ? picked.day : defaultShown(doc, t);
  const swapFrom = shown !== label.planDay ? label.planDay : null; // saved on the workout: done in place of that day
  const heading = open ? dayName : shown ? days[shown].focus : active ? "Rest day" : dayName;
  const sub = !active || (open && running) ? label.text
    : open ? null
    : !shown ? `${dayName} · no workout planned`
    : shown === label.planDay ? null // the hero card already says "Wednesday's workout"
    : label.planDay ? `${days[shown].name}'s workout, today in place of ${days[label.planDay].name}'s`
    : `${days[shown].name}'s workout, on ${dayName}`;
  const children = [
    h("div", { class: "today-head" },
      h("div", {},
        h("span", { class: "eyebrow accent" }, running ? `Week ${label.week} of ${weeks.length} · ${weekInfo(label.week).phase}` : practice ? PRACTICE_LABEL : "Today"),
        h("h1", { class: shown && !open ? "focus" : "" }, heading))),
    running ? blockBar(label.week) : null,
    practice ? h("p", { class: "small muted" }, practiceLine(doc.block.start_monday)) : null,
    sub ? h("p", { class: "small muted" }, sub) : null,
    active && !open ? dayPicker(choices, shown, t) : null,
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
  } else if (label.state === "after") {
    children.push(h("div", { class: "card" }, h("h2", {}, "The 12 weeks are done"), h("p", { class: "muted" }, "Time for the review. Talk to the Training chat about the next block.")));
  } else if (!shown) {
    // Saturday or Sunday with no day picked: the rest day. The picker above can still start any day.
    children.push(h("div", { class: "hero" }, h("div", { class: "hero-body" }, h("span", { class: "eyebrow" }, "Recover"),
      h("p", { class: "muted" }, "A relaxed walk outside is fine. Weigh in in the morning."),
      h("p", { class: "small muted" }, "Missed a day this week? Pick it above to train it today."))));
  } else {
    const kind = "full";
    const check = canStartWorkout(doc.sessions, t);
    const lastFinished = finishedSessions(doc.sessions)[0];
    const missed = missedRule(lastFinished ? lastFinished.date : null, t);
    const day = dayLayout(doc, { planDay: shown, week, today: t, kind });
    // A saved Plan edit with more or fewer sets changes the time (about 8 minutes for an added exercise).
    const total = editedMinutes(day.minutes, shown, week, editOf(doc, shown));
    const blocks = total === day.minutes ? day.layout : [...day.layout.slice(0, -1), { id: "edits", minutes: total - day.minutes }, day.layout[day.layout.length - 1]];
    children.push(dayHero(shown, week, blocks, total, doc));
    if (check.ok && choices.find((c) => c.day === shown)?.done) children.push(h("div", { class: "card" }, h("p", {}, `You did ${days[shown].name}'s workout this week already. You can do it again.`)));
    if (week <= 1) children.push(h("div", { class: "card" }, h("p", {}, `${practice ? "Practice" : "Week 1"}: learn the moves and find your weights. Two sets of each exercise. It will feel easy on purpose.`), h("p", { class: "small muted" }, "In Settings, fill in the gym's dumbbell sizes and weight steps when you know them.")));
    if (lastFinished && missed.kind !== "carry_on") children.push(h("div", { class: "card warn" }, h("p", {}, missed.message)));
    children.push(exerciseList(doc, shown, week, missed));
    if (!check.ok) {
      children.push(h("div", { class: "card" }, h("p", { class: "status-success" }, "Done for today."), h("p", { class: "muted" }, check.reason)));
    } else {
      bar = mainButton(["Start workout", icon("chevron", 20, { strokeWidth: 2.6 })], () => { const r = startWorkout({ kind: "full", planDay: shown, swappedFrom: swapFrom }); if (!r.ok) rerender(); });
      children.push(h("div", { class: "day-actions" },
        secondaryButton("Short day (60 min)", () => { const r = startWorkout({ kind: "short", planDay: shown, swappedFrom: swapFrom }); if (!r.ok) rerender(); })));
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

  if (!calm) onMount(() => stagger(document.querySelectorAll(".screen > .hero, .screen > .card, .screen > .tiles, .screen > .day-actions")));
  calm = false;
  const main = h("main", { class: "screen has-bar" }, ...children);
  return bar ? [main, tabActionBar(bar)] : [h("main", { class: "screen has-tabs" }, ...children)];
}
