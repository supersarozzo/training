// The rest timer: starts by itself after Done (about 30 s to move inside a pair, then the pair's rest).
// Redesign A: a full-screen glowing ring, round −30 s / +30 s buttons, and the next exercise with its picture.
import { h } from "../h.js";
import { workoutScreen, topBar, actionBar, mainButton, timerView } from "./parts.js";
import { model, rerender } from "./app.js";
import { patchActive, getActive } from "../active.js";
import { askEnd, nextText } from "./flow.js";
import { adjustTimer } from "../timer.js";
import { slotRecord } from "../engine/workout.js";
import { thumb } from "./media.js";

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
  const nextId = pos.entry ? slotRecord(ctx.session, pos.entry.slot)?.done_exercise : null;
  const move = rest.kind === "move";
  const progress = pos.entry && ctx.seq ? { done: pos.index, total: ctx.seq.length } : null;
  return [
    workoutScreen(
      topBar(move ? "Move" : "Rest", () => askEnd(ctx), progress),
      h("h1", { class: "rest-title" }, move ? "Move to the next exercise" : "Rest"),
      timerView({
        end: rest.end, total: rest.total, sub: move ? "to move" : "rest left",
        // The end of the rest only clears THIS rest, never a newer one.
        onEnd: () => { const cur = getActive(); if (cur && cur.rest && cur.rest.end === rest.end) clear(); },
      }),
      h("div", { class: "round-row" },
        h("button", { class: "round-btn", type: "button", "aria-label": "30 seconds less", onclick: () => change(-30) }, "−30 s"),
        h("button", { class: "round-btn", type: "button", "aria-label": "30 seconds more", onclick: () => change(30) }, "+30 s")),
      nextLine ? h("div", { class: "next-card" }, nextId ? thumb(nextId) : null,
        h("div", { class: "what" }, h("span", { class: "eyebrow accent" }, "Next"), h("b", {}, nextLine))) : null,
      h("div", { class: "text-link-row" },
        h("button", { class: "text-button", type: "button", onclick: () => { model.undoLastSet(ctx.session.id, rest.slot); clear(); } }, "Undo that set"))),
    actionBar(mainButton("Skip", clear)),
  ];
}
