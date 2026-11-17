// The rest timer: starts by itself after Done (about 30 s to move inside a pair, then the pair's rest).
// Redesign B: one thick ring in the accent colour, big rounded digits, round −30 s / +30 s buttons beside each other,
// a "Next up" card with the next exercise's photo, weight and where its machine is. Skip at the bottom.
import { h } from "../h.js";
import { workoutScreen, topBar, actionBar, mainButton, timerView, exerciseMedia } from "./parts.js";
import { icon } from "./icons.js";
import { model, rerender } from "./app.js";
import { patchActive, getActive } from "../active.js";
import { askEnd, nextText } from "./flow.js";
import { adjustTimer } from "../timer.js";
import { slotRecord } from "../engine/workout.js";
import { exercises } from "../plan/plan-v2.js";
import { machinesFor } from "../plan/machines.js";
import { spotFor } from "./machines.js";

function savedChip(ctx, slot) {
  const rec = slotRecord(ctx.session, slot);
  const last = rec && [...rec.sets].reverse().find((x) => x.type === "work");
  if (!last) return null;
  const what = last.seconds != null ? `${last.seconds} s` : last.weight_kg ? `${last.weight_kg} kg × ${last.reps}` : `${last.reps} reps`;
  return h("div", { class: "saved-chip", role: "status" }, icon("check", 16, { stroke: 3 }), `Saved · ${what}`);
}

function nextCard(ctx, pos) {
  if (pos.label) return h("div", { class: "card next-card" }, h("div", { class: "grow" }, h("p", { class: "eyebrow" }, "Next"), h("div", { class: "headline" }, pos.label)));
  if (!pos.entry) return null;
  const rec = slotRecord(ctx.session, pos.entry.slot);
  const exId = rec.done_exercise;
  const ex = exercises[exId];
  const m = machinesFor(exId)[0];
  const where = m ? spotFor(ctx.doc, m) : "";
  return h("div", { class: "card next-card" },
    exerciseMedia(exId, ex.name, "mid"),
    h("div", { class: "grow" },
      h("p", { class: "eyebrow" }, "Next up"),
      h("div", { class: "headline" }, nextText(ctx, pos.entry)),
      where ? h("div", { class: "info-line" }, icon("pin", 15), h("span", {}, where)) : null));
}

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
  const move = rest.kind === "move";
  return [
    workoutScreen(
      topBar(move ? "Move" : "Rest", () => askEnd(ctx)),
      savedChip(ctx, rest.slot),
      h("h1", { class: "center title1" }, move ? "Move to the next exercise" : "Rest"),
      timerView({
        end: rest.end, total: rest.total, sub: move ? "to move" : "rest left", flashSub: "Next set",
        // The end of the rest only clears THIS rest, never a newer one.
        onEnd: () => { const cur = getActive(); if (cur && cur.rest && cur.rest.end === rest.end) clear(); },
      }),
      h("div", { class: "timer-controls" },
        h("button", { class: "round-btn", type: "button", "aria-label": "30 seconds less", onclick: () => change(-30) }, "−30 s"),
        h("button", { class: "round-btn", type: "button", "aria-label": "30 seconds more", onclick: () => change(30) }, "+30 s")),
      nextCard(ctx, pos),
      h("div", { class: "text-link-row" },
        h("button", { class: "text-button", type: "button", onclick: () => { model.undoLastSet(ctx.session.id, rest.slot); clear(); } }, icon("undo", 16), "Undo that set"))),
    actionBar(mainButton("Skip rest", clear)),
  ];
}
