// The rest timer: starts by itself after Done (about 30 s to move inside a pair, then the pair's rest).
// Coach style: the saved set is confirmed with a check, the ring counts down, and the next exercise is shown big,
// with its first form tip, so the rest time is also "get ready" time.
import { h } from "../h.js";
import { s } from "./svg.js";
import { guideScreen, actionBar, mainButton, timerView } from "./parts.js";
import { model, rerender } from "./app.js";
import { patchActive, getActive } from "../active.js";
import { askEnd, nextText } from "./flow.js";
import { adjustTimer } from "../timer.js";
import { exercises } from "../plan/plan-v2.js";
import { slotRecord, workSets } from "../engine/workout.js";
import { guideTop, nextUp, coachLine, firstTip } from "./coach.js";

function savedText(ctx, slot) {
  const rec = slotRecord(ctx.session, slot);
  const last = workSets(rec).slice(-1)[0];
  if (!rec || !last) return null;
  const ex = exercises[rec.done_exercise];
  const what = ex.kind === "hold" ? `${last.seconds} s` : ex.step === "bodyweight" ? `${last.reps} reps` : `${last.weight_kg} kg × ${last.reps}`;
  return `Saved: ${ex.name}, ${what}`;
}

function check() {
  return s("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": 2.6, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" },
    s("path", { d: "M5 12.5l4.5 4.5L19 7.5", class: "check-path" }));
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
  const moving = rest.kind === "move";
  const nextLine = pos.label ?? nextText(ctx, pos.entry);
  const nextEx = pos.entry ? slotRecord(ctx.session, pos.entry.slot)?.done_exercise : slotRecord(ctx.session, rest.slot)?.done_exercise;
  const saved = savedText(ctx, rest.slot);
  return [
    guideScreen(`rest:${rest.end - rest.total}`,
      guideTop(ctx, [h("b", {}, moving ? "Move" : "Rest"), moving ? " · walk to the next exercise" : " · breathe and get ready"], () => askEnd(ctx)),
      h("div", { class: "rest-head" },
        h("h1", {}, moving ? "Move to the next exercise" : "Rest"),
        saved ? h("div", { class: "saved-chip", role: "status" }, check(), saved) : null),
      timerView({
        end: rest.end, total: rest.total, sub: "left",
        // The end of the rest only clears THIS rest, never a newer one.
        onEnd: () => { const cur = getActive(); if (cur && cur.rest && cur.rest.end === rest.end) clear(); },
      }),
      h("div", { class: "adjust" },
        h("button", { class: "button secondary", type: "button", onclick: () => change(-30) }, "−30 s"),
        h("button", { class: "button secondary", type: "button", onclick: () => change(30) }, "+30 s")),
      nextLine ? nextUp(nextEx, nextLine, null, { big: true }) : null,
      nextEx ? coachLine(firstTip(nextEx)) : null,
      h("div", { class: "text-link-row" },
        h("button", { class: "text-button", type: "button", onclick: () => { model.undoLastSet(ctx.session.id, rest.slot); clear(); } }, "Undo that set"))),
    actionBar(mainButton(moving ? "I'm there · skip" : "Skip rest", clear)),
  ];
}
