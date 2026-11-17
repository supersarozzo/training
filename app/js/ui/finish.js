// Finish: summary (time, sets, new bests, what changes next time), optional effort and note, Save.
// Save writes on the phone first, then starts a sync (if GitHub is set up). The sync never blocks the screen.
import { MAX_TEXT } from "../validate.js";
import { h } from "../h.js";
import { workoutScreen, topBar, actionBar, mainButton, choiceRow } from "./parts.js";
import { model, go, rerender } from "./app.js";
import { exercises } from "../plan/plan-v2.js";
import { leaveWorkout } from "./flow.js";
import { performances, suggestFor, workSets, isNewBest } from "../engine/workout.js";
import { setSavedMessage } from "./today.js";
import { syncer } from "../syncer.js";
import { shortcutUrl } from "../shortcuts.js";
import { s as svg } from "./svg.js";
import { icon } from "./icons.js";
import { countUp, onMount, stagger, reduced } from "./motion.js";

// A closed ring that draws itself once: the "workout complete" mark (redesign A). No confetti, no sound.
function doneRing() {
  const R = 52, C = 2 * Math.PI * R;
  const arc = svg("circle", { class: "arc", cx: 60, cy: 60, r: R, fill: "none", stroke: "var(--accent)", "stroke-width": 9, "stroke-linecap": "round", "stroke-dasharray": C, "stroke-dashoffset": 0, transform: "rotate(-90 60 60)" });
  const el = svg("svg", { viewBox: "0 0 120 120", width: 104, height: 104, "aria-hidden": "true", class: "done-ring" },
    svg("circle", { cx: 60, cy: 60, r: R, fill: "none", stroke: "var(--ring-track)", "stroke-width": 9 }), arc,
    svg("path", { d: "M40 61l13 13 27-28", fill: "none", stroke: "var(--accent)", "stroke-width": 9, "stroke-linecap": "round", "stroke-linejoin": "round" }));
  // reduced(): the phone's Reduce Motion OR the app's Animations switch (review 8.25 R4: it checked only the phone).
  onMount(() => { if (arc.animate && !reduced()) arc.animate([{ strokeDashoffset: C }, { strokeDashoffset: 0 }], { duration: 900, easing: "cubic-bezier(.2,.8,.2,1)" }); });
  return el;
}

let draft = null;

// Facts about the workout, from the saved data. Pure enough to test: no page needed.
export function summarize(doc, session) {
  const others = doc.sessions.filter((s) => s.id !== session.id);
  const minutes = session.started_at ? Math.max(1, Math.round((Date.now() - Date.parse(session.started_at)) / 60000)) : null;
  let sets = 0;
  const bests = [];
  const next = [];
  const asIfFinished = { ...doc, sessions: [...others, { ...session, status: "finished", finished_at: new Date().toISOString() }] };
  for (const rec of session.exercises) {
    const work = workSets(rec);
    sets += work.length;
    if (!work.length) continue;
    const ex = exercises[rec.done_exercise];
    const now = performances([{ ...session, status: "finished", finished_at: "9999" }], rec.done_exercise)[0];
    const earlier = performances(others, rec.done_exercise);
    if (now && isNewBest(now, earlier, ex.kind)) {
      const last = work[work.length - 1];
      bests.push(ex.kind === "hold" ? `${ex.name}: ${last.seconds} s, a new best` : ex.step === "bodyweight" ? `${ex.name}: ${last.reps} reps, a new best` : `${ex.name}: ${last.reps} reps at ${last.weight_kg} kg, a new best`);
    }
    const state = doc.exercise_state.find((x) => x.id === `x-${rec.done_exercise}`);
    const s = suggestFor(asIfFinished, rec.done_exercise, { week: Math.min(session.week + 1, 12), missed: null, exerciseState: state });
    next.push(`${ex.name}: ${s.weight_kg ? `${s.weight_kg} kg. ` : ""}${s.note}`);
  }
  return { minutes, sets, bests, next };
}

export function renderFinish(ctx) {
  const { session, doc } = ctx;
  if (!draft || draft.id !== session.id) draft = { id: session.id, effort: null, note: "" };
  const sum = summarize(doc, session);

  const save = () => {
    const finished = model.finishSession(session.id, { effort: draft.effort, note: draft.note.trim() });
    draft = null;
    leaveWorkout();
    // The Log to Health button (off unless turned on in Settings). The link carries only the times.
    const rec = finished.sessions.find((x) => x.id === session.id);
    const minutes = rec && rec.started_at ? (Date.parse(rec.finished_at) - Date.parse(rec.started_at)) / 60000 : NaN;
    const link = rec ? shortcutUrl(finished.shared_settings, rec.started_at, minutes) : null;
    setSavedMessage("Workout saved on this phone. Stop your Apple Watch workout.", link);
    go("#/today");
    if (syncer.isConfigured()) syncer.request("full");
  };

  const minEl = h("span", {}, sum.minutes ? String(sum.minutes) : "–");
  const setEl = h("span", {}, String(sum.sets));
  const bestEl = h("span", {}, String(sum.bests.length));
  onMount(() => {
    if (sum.minutes) countUp(minEl, sum.minutes);
    countUp(setEl, sum.sets);
    stagger(document.querySelectorAll(".tile, .finish-list li"));
  });
  return [
    workoutScreen(
      topBar("Finish"),
      h("div", { class: "center" }, doneRing()),
      h("h1", { class: "center" }, "Well done"),
      h("p", { class: "center muted" }, "Workout complete. Save it to keep it."),
      h("div", { class: "tiles" },
        h("div", { class: "tile" }, h("div", { class: "label" }, "Time"), h("div", { class: "value" }, minEl, h("span", { class: "unit" }, " min"))),
        h("div", { class: "tile" }, h("div", { class: "label" }, "Sets"), h("div", { class: "value" }, setEl)),
        sum.bests.length ? h("div", { class: "tile wide" }, h("div", { class: "label" }, "New bests"), h("div", { class: "value" }, bestEl)) : null),
      sum.bests.length ? h("div", { class: "card accent" }, h("h2", {}, "New bests"), h("ul", { class: "list-plain finish-list" }, sum.bests.map((b) => h("li", {}, h("span", { class: "status-line" }, h("span", { class: "tick-sm" }, icon("bolt", 16)), b))))) : null,
      sum.next.length ? h("div", { class: "card" }, h("h2", {}, "Next time"), h("ul", { class: "list-plain finish-list" }, sum.next.map((n) => h("li", {}, n)))) : null,
      h("h3", {}, "How hard was the whole workout? (optional)"),
      choiceRow([[1, "1"], [2, "2"], [3, "3"], [4, "4"], [5, "5"]], draft.effort, (v) => { draft.effort = draft.effort === v ? null : v; rerender(); }),
      choiceRow([[6, "6"], [7, "7"], [8, "8"], [9, "9"], [10, "10"]], draft.effort, (v) => { draft.effort = draft.effort === v ? null : v; rerender(); }),
      h("div", { class: "field" }, h("label", { for: "f-note" }, "Note (optional)"),
        h("textarea", { id: "f-note", maxlength: MAX_TEXT, value: draft.note, oninput: (e) => { draft.note = e.target.value; } })),
      h("p", { class: "small muted" }, "Stop the workout on your Apple Watch now.")),
    actionBar(mainButton([icon("check", 22, { strokeWidth: 3 }), "Save"], save)),
  ];
}
