// Finish: summary (time, sets, new bests, what changes next time), optional effort and note, Save.
// Save writes on the phone first, then starts a sync (if GitHub is set up). The sync never blocks the screen.
import { h } from "../h.js";
import { workoutScreen, topBar, actionBar, mainButton, choiceRow } from "./parts.js";
import { model, go, rerender } from "./app.js";
import { exercises } from "../plan/plan-v2.js";
import { leaveWorkout } from "./flow.js";
import { performances, suggestFor, workSets, isNewBest } from "../engine/workout.js";
import { setSavedMessage } from "./today.js";
import { syncer } from "../syncer.js";

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
    model.finishSession(session.id, { effort: draft.effort, note: draft.note.trim() });
    draft = null;
    leaveWorkout();
    setSavedMessage("Workout saved on this phone. Stop your Apple Watch workout.");
    go("#/today");
    if (syncer.isConfigured()) syncer.request("full");
  };

  return [
    workoutScreen(
      topBar("Finish"),
      h("h1", {}, "Well done"),
      h("div", { class: "card" },
        h("div", { class: "row" },
          h("div", { class: "metric" }, h("div", { class: "label" }, "Time"), h("div", { class: "value" }, sum.minutes ? String(sum.minutes) : "–", h("span", { class: "unit" }, " min"))),
          h("div", { class: "metric" }, h("div", { class: "label" }, "Sets"), h("div", { class: "value" }, String(sum.sets))))),
      sum.bests.length ? h("div", { class: "card" }, h("h2", {}, "New bests"), h("ul", { class: "list-plain" }, sum.bests.map((b) => h("li", {}, b)))) : null,
      sum.next.length ? h("div", { class: "card" }, h("h2", {}, "Next time"), h("ul", { class: "list-plain" }, sum.next.map((n) => h("li", {}, n)))) : null,
      h("h3", {}, "How hard was the whole workout? (optional)"),
      choiceRow([[1, "1"], [2, "2"], [3, "3"], [4, "4"], [5, "5"]], draft.effort, (v) => { draft.effort = draft.effort === v ? null : v; rerender(); }),
      choiceRow([[6, "6"], [7, "7"], [8, "8"], [9, "9"], [10, "10"]], draft.effort, (v) => { draft.effort = draft.effort === v ? null : v; rerender(); }),
      h("div", { class: "field" }, h("label", { for: "f-note" }, "Note (optional)"),
        h("textarea", { id: "f-note", value: draft.note, oninput: (e) => { draft.note = e.target.value; } })),
      h("p", { class: "small muted" }, "Stop the workout on your Apple Watch now.")),
    actionBar(mainButton("Save", save)),
  ];
}
