// Finish: summary (time, sets, new bests, what changes next time), optional effort and note, Save.
// Save writes on the phone first, then starts a sync (if GitHub is set up). The sync never blocks the screen.
import { MAX_TEXT } from "../validate.js";
import { h } from "../h.js";
import { workoutScreen, topBar, actionBar, mainButton, choiceRow, tile, section, group, row, iconTile } from "./parts.js";
import { icon } from "./icons.js";
import { countUp } from "./motion.js";
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

  const minutesEl = h("span", {}, sum.minutes ? String(sum.minutes) : "–");
  const setsEl = h("span", {}, String(sum.sets));
  requestAnimationFrame(() => { if (sum.minutes) countUp(minutesEl, sum.minutes); countUp(setsEl, sum.sets); });
  const pickEffort = (v) => { draft.effort = draft.effort === v ? null : v; rerender(); };
  return [
    workoutScreen(
      topBar("Finish"),
      h("div", { class: "center" },
        h("div", { class: "hero-icon green check-draw", "aria-hidden": "true" }, icon("check", 52, { stroke: 3 })),
        h("h1", { class: "title1" }, "Well done"),
        h("p", { class: "subhead muted" }, "Check the summary, then save.")),
      h("div", { class: "tiles" },
        tile({ label: "Time", value: minutesEl, unit: "min", color: "accent", iconName: "clock" }),
        tile({ label: "Sets", value: setsEl, color: "green", iconName: "check" })),
      sum.bests.length ? section("New bests", group(sum.bests.map((b) => row({ title: b, lead: iconTile("star", "orange") })))) : null,
      sum.next.length ? section("Next time", group(sum.next.map((n) => row({ title: n })))) : null,
      h("h2", { class: "group-head" }, "How hard was the whole workout? (optional)"),
      choiceRow([[1, "1"], [2, "2"], [3, "3"], [4, "4"], [5, "5"]], draft.effort, pickEffort),
      choiceRow([[6, "6"], [7, "7"], [8, "8"], [9, "9"], [10, "10"]], draft.effort, pickEffort),
      h("div", { class: "field" }, h("label", { for: "f-note" }, "Note (optional)"),
        h("textarea", { id: "f-note", maxlength: MAX_TEXT, value: draft.note, oninput: (e) => { draft.note = e.target.value; } })),
      h("div", { class: "card info" }, h("div", { class: "card-title" }, icon("watch", 18), "Apple Watch"), h("p", {}, "Stop the workout on your Apple Watch now."))),
    actionBar(mainButton("Save workout", save, { iconName: "check" })),
  ];
}
