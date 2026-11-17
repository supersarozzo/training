// The rest timer: starts by itself after Done (about 30 s to move inside a pair, then the pair's rest).
// Under the ring: −30 s / +30 s, the optional "How many more could you do?" for the set just saved (one tap, or
// leave it), and the next set with its picture and numbers.
import { h } from "../h.js";
import { workoutScreen, topBar, actionBar, mainButton, timerView, progressBar, icon } from "./parts.js";
import { model, rerender } from "./app.js";
import { patchActive, getActive } from "../active.js";
import { askEnd, nextText } from "./flow.js";
import { adjustTimer } from "../timer.js";
import { exercises } from "../plan/plan-v2.js";
import { slotRecord, workSets } from "../engine/workout.js";
import { rirRow, setsProgress } from "./pair.js";
import { thumb, openExercise } from "./media-ui.js";
import { setText } from "./stats.js";

export function renderRest(ctx, pos) {
  const rest = ctx.act.rest;
  const clear = () => { patchActive({ rest: null }); rerender(); };
  const change = (delta) => {
    const now = Date.now();
    const end = adjustTimer(rest.end, delta, now);
    const total = delta > 0 ? Math.max(rest.total + delta * 1000, end - now) : Math.max(rest.total + delta * 1000, 1000);
    patchActive({ rest: { ...rest, end, total } });
    rerender();
  };
  const nextLine = pos.label ?? nextText(ctx, pos.entry);

  // The set just saved (week 1 has its own "how many more" steps, so it is not asked here).
  const rec = rest.slot ? slotRecord(ctx.session, rest.slot) : null;
  const last = rec ? workSets(rec).slice(-1)[0] : null;
  const ex = rec ? exercises[rec.done_exercise] : null;
  const askHere = Boolean(pos.entry && last && ex && ctx.session.week !== 1);
  const rirBox = askHere
    ? h("div", { class: "rir-box" },
      h("div", { class: "k" }, h("span", {}, ex.kind === "hold" ? "Could you have held longer?" : "How many more could you do?"), h("span", { class: "small muted" }, "optional")),
      rirRow(ex.kind === "hold", last.rir, (v) => { model.setLastRir(ctx.session.id, rest.slot, v); rerender(); }))
    : null;

  // The next set: picture, name, numbers.
  let nextCard = null;
  if (pos.entry) {
    const nrec = slotRecord(ctx.session, pos.entry.slot);
    nextCard = h("div", { class: "next-card" },
      thumb(nrec.done_exercise, { onclick: () => openExercise(nrec.done_exercise, { noteFor: nrec.done_exercise }) }),
      h("div", { class: "grow" },
        h("div", { class: "k" }, `Next · set ${pos.entry.setNumber} of ${pos.entry.sets}`),
        h("div", { class: "t" }, exercises[nrec.done_exercise].name),
        h("div", { class: "s" }, nextLine)));
  }

  const main = workoutScreen(
    topBar("Rest", () => askEnd(ctx), { startedAt: ctx.session.started_at }),
    pos.entry ? progressBar(setsProgress(ctx)) : null,
    h("h1", { class: "center" }, rest.kind === "move" ? "Move to the next exercise" : "Rest"),
    last && ex ? h("p", { class: "just-set" }, "Saved: ", h("b", {}, `${ex.name} ${setText(rec.done_exercise, last)}`)) : null,
    timerView({
      end: rest.end, total: rest.total, cap: rest.kind === "move" ? "move" : "rest",
      // The end of the rest only clears THIS rest, never a newer one.
      onEnd: () => { const cur = getActive(); if (cur && cur.rest && cur.rest.end === rest.end) clear(); },
    }),
    h("div", { class: "timer-btns" },
      h("button", { class: "button secondary", type: "button", onclick: () => change(-30) }, "−30 s"),
      h("button", { class: "button secondary", type: "button", onclick: () => change(30) }, "+30 s")),
    rirBox,
    nextCard ?? (nextLine ? h("p", { class: "center" }, h("span", { class: "muted small" }, "Next: "), nextLine) : null),
    h("div", { class: "text-link-row" },
      h("button", { class: "text-button muted", type: "button", onclick: () => { model.undoLastSet(ctx.session.id, rest.slot); clear(); } }, icon("undo", "sm"), "Undo that set")));
  main.dataset.key = `rest:${rest.end - rest.total}`;
  return [main, actionBar(mainButton("Skip rest", clear))];
}
