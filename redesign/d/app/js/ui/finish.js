// Finish: summary (time, sets, new bests, what changes next time), optional effort and note, Save.
// Save writes on the phone first, then starts a sync (if GitHub is set up). The sync never blocks the screen.
import { MAX_TEXT } from "../validate.js";
import { h } from "../h.js";
import { guideScreen, actionBar, mainButton, choiceRow } from "./parts.js";
import { s as svg } from "./svg.js";
import { guideTop } from "./coach.js";
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

  const num = (value, unit) => {
    const v = h("span", {}, value === null ? "–" : String(value));
    if (value !== null) queueMicrotask(() => countUp(v, value));
    return h("div", { class: "value" }, v, unit ? h("span", { class: "unit" }, ` ${unit}`) : null);
  };
  const badge = svg("svg", { viewBox: "0 0 96 96", "aria-hidden": "true" },
    svg("circle", { cx: 48, cy: 48, r: 42, fill: "var(--bg-tint)" }),
    svg("circle", { cx: 48, cy: 48, r: 42, fill: "none", stroke: "var(--brand-primary)", "stroke-width": 6, "stroke-linecap": "round", pathLength: 1, class: "finish-ring", transform: "rotate(-90 48 48)" }),
    svg("path", { d: "M31 49l11 11 23-24", fill: "none", stroke: "var(--brand-primary)", "stroke-width": 7, "stroke-linecap": "round", "stroke-linejoin": "round", pathLength: 1, class: "finish-check" }));
  const pick = (v) => { draft.effort = draft.effort === v ? null : v; rerender(); };

  return [
    guideScreen(`finish:${session.id}`,
      guideTop(ctx, [h("b", {}, "Finish"), " · save your workout"]),
      h("div", { class: "finish-hero" }, badge,
        h("h1", {}, "Workout done"),
        h("p", { class: "muted" }, "Nice work. Save it, and it goes to your log.")),
      h("div", { class: "tiles" },
        h("div", { class: "tile" }, h("div", { class: "label" }, "Time"), num(sum.minutes, "min")),
        h("div", { class: "tile" }, h("div", { class: "label" }, "Sets"), num(sum.sets, null))),
      sum.bests.length ? h("div", { class: "card" }, h("span", { class: "eyebrow brand" }, "New bests"), sum.bests.map((b) => h("div", { class: "best" }, icon("star"), h("span", {}, b)))) : null,
      sum.next.length ? h("div", { class: "card" }, h("span", { class: "eyebrow" }, "Next time"), h("ul", { class: "list-plain" }, sum.next.map((n) => h("li", {}, n)))) : null,
      h("h3", {}, "How hard was the whole workout? (optional)"),
      choiceRow([[1, "1"], [2, "2"], [3, "3"], [4, "4"], [5, "5"]], draft.effort, pick),
      choiceRow([[6, "6"], [7, "7"], [8, "8"], [9, "9"], [10, "10"]], draft.effort, pick),
      h("div", { class: "field" }, h("label", { for: "f-note" }, "Note (optional)"),
        h("textarea", { id: "f-note", maxlength: MAX_TEXT, value: draft.note, oninput: (e) => { draft.note = e.target.value; } })),
      h("div", { class: "coach" }, icon("timer"), h("div", {}, "Stop the workout on your Apple Watch now."))),
    actionBar(mainButton("Save workout", save)),
  ];
}
