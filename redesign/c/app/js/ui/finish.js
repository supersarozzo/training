// Finish: summary (time, sets, new bests, what changes next time), optional effort and note, Save.
// Save writes on the phone first, then starts a sync (if GitHub is set up). The sync never blocks the screen.
import { MAX_TEXT } from "../validate.js";
import { h } from "../h.js";
import { workoutScreen, topBar, actionBar, mainButton, choiceRow, stat, icon } from "./parts.js";
import { s } from "./svg.js";
import { thumb } from "./media-ui.js";
import { setText, volumeOf } from "./stats.js";
import { motionOk } from "./prefs.js";
import { model, go, rerender } from "./app.js";
import { exercises } from "../plan/plan-v2.js";
import { leaveWorkout } from "./flow.js";
import { performances, suggestFor, workSets, isNewBest } from "../engine/workout.js";
import { setSavedMessage } from "./today.js";
import { syncer } from "../syncer.js";
import { shortcutUrl } from "../shortcuts.js";

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

  // A check mark that draws itself (stroke only); with animations off it is just there.
  const tick = s("path", { d: "M15 27 L23 35 L38 18", class: "tick" });
  const badge = h("div", { class: "done-badge", "aria-hidden": "true" }, s("svg", { viewBox: "0 0 52 52" }, s("circle", { cx: 26, cy: 26, r: 24 }), tick));
  if (motionOk()) {
    tick.style.strokeDasharray = "40 40";
    const run = tick.animate([{ strokeDashoffset: 40 }, { strokeDashoffset: 0 }], { duration: 600, delay: 200, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" });
    run.onfinish = () => { tick.style.strokeDasharray = ""; };
    badge.animate([{ transform: "scale(.6)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: 420, easing: "cubic-bezier(.34,1.56,.64,1)" });
  }
  const volume = volumeOf(session);
  const recap = session.exercises.filter((r) => workSets(r).length);

  const main = workoutScreen(
    topBar("Finish"),
    h("div", { class: "finish-head" }, badge, h("h1", {}, "Well done"), h("p", { class: "muted" }, `${session.kind === "short" ? "Short workout" : "Workout"} done. Here is what you did.`)),
    h("div", { class: "stats four" },
      stat("Time", sum.minutes ? String(sum.minutes) : "–", "min"),
      stat("Sets", String(sum.sets)),
      stat("Lifted", String(volume), "kg"),
      stat("New bests", String(sum.bests.length))),
    sum.bests.length ? h("div", { class: "card bests" }, h("h2", {}, icon("star", "sm"), " New bests"), h("ul", { class: "list-plain" }, sum.bests.map((b) => h("li", {}, b)))) : null,
    recap.length ? [h("div", { class: "section-head" }, h("h2", {}, "What you did")),
      h("div", { class: "list" }, recap.map((r) => h("div", { class: "ex-row static" },
        thumb(r.done_exercise, { size: "sm" }),
        h("div", { class: "grow" }, h("div", { class: "title" }, exercises[r.done_exercise].name), h("div", { class: "sub num" }, workSets(r).map((x) => setText(r.done_exercise, x)).join(" · "))))))] : null,
    sum.next.length ? h("div", { class: "card" }, h("h2", {}, "Next time"), h("ul", { class: "list-plain next-list" }, sum.next.map((n) => h("li", {}, n)))) : null,
    h("h3", {}, "How hard was the whole workout? (optional)"),
    choiceRow([[1, "1"], [2, "2"], [3, "3"], [4, "4"], [5, "5"]], draft.effort, (v) => { draft.effort = draft.effort === v ? null : v; rerender(); }),
    choiceRow([[6, "6"], [7, "7"], [8, "8"], [9, "9"], [10, "10"]], draft.effort, (v) => { draft.effort = draft.effort === v ? null : v; rerender(); }),
    h("div", { class: "field" }, h("label", { for: "f-note" }, "Note (optional)"),
      h("textarea", { id: "f-note", maxlength: MAX_TEXT, value: draft.note, oninput: (e) => { draft.note = e.target.value; } })),
    h("div", { class: "card warn" }, h("p", {}, icon("watch", "sm"), " Stop the workout on your Apple Watch now.")));
  main.dataset.key = "finish";
  return [main, actionBar(mainButton("Save", save, { ic: "check" }))];
}
