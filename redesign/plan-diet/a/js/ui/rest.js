// The rest timer: starts by itself after Done (about 30 s to move inside a pair, then the pair's rest).
// Base: redesign A (a full-screen glowing ring, round −30 s / +30 s buttons, the next exercise with its picture).
// Merged in (redesign/JUDGING.md 3.2 and 3.6):
// - builder B: the "Saved · 55 kg × 10" line for the set just saved; the next exercise's MOVING photo and where-note;
// - builder C: "How many more could you do?" asked inline here, optional (no sheet over the timer, no second Skip);
// - builder D: the Skip button cannot be hit by the second tap of a double tap on Done (lockedButton);
// - "Undo that set" stays far (at least about 40 px) from Skip.
import { h } from "../h.js";
import { workoutScreen, topBar, actionBar, lockedButton, timerView, choiceRow } from "./parts.js";
import { model, rerender } from "./app.js";
import { patchActive, getActive } from "../active.js";
import { askEnd, nextText } from "./flow.js";
import { adjustTimer } from "../timer.js";
import { exercises } from "../plan/plan-v2.js";
import { slotRecord, workSets } from "../engine/workout.js";
import { machines } from "../plan/media.js";
import { thumb } from "./media.js";
import { icon } from "./icons.js";
import { setText, fmtKg } from "./stats.js";
import { whereOf, machineFor } from "./machines.js";

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

  // The set just saved. Week 1 has its own "how many more" steps, so it is not asked here.
  const rec = rest.slot ? slotRecord(ctx.session, rest.slot) : null;
  const last = rec ? workSets(rec).slice(-1)[0] : null;
  const ex = rec ? exercises[rec.done_exercise] : null;
  const hold = ex?.kind === "hold";
  const askHere = Boolean(last && ex && ctx.session.week !== 1);
  const pick = (v) => { model.setLastRir(ctx.session.id, rest.slot, v); rerender(); };
  const rirBox = askHere
    ? h("div", { class: "rir-box" },
      h("div", { class: "rir-head" }, h("span", {}, hold ? "Could you have held longer?" : "How many more could you do?"), h("span", { class: "small muted" }, "optional")),
      hold
        ? choiceRow([[0, "No"], [1, "A bit"], [3, "Yes, easily"]], last.rir ?? null, pick)
        : choiceRow([[0, "0"], [1, "1"], [2, "2"], [3, "3"], [4, "4+"]], last.rir ?? null, pick, { columns: 5 }))
    : null;

  // Where the next machine is (Rosario's own note), under the next exercise.
  const nextMid = nextId ? machineFor(nextId) : null;
  const nextWhere = nextMid && machines[nextMid] ? whereOf(ctx.doc, nextMid) : "";

  const skip = lockedButton(move ? "Skip" : "Skip rest", { key: `rest:${ctx.session.id}:${rest.slot}:${pos.index}:${last ? workSets(rec).length : 0}`, work: () => patchActive({ rest: null }), after: rerender });
  return [
    workoutScreen(
      topBar(move ? "Move" : "Rest", () => askEnd(ctx), progress),
      h("h1", { class: "rest-title" }, move ? "Move to the next exercise" : "Rest"),
      last && ex ? h("div", { class: "saved-line", role: "status" }, icon("check", 16, { strokeWidth: 3 }), `Saved · ${!hold && last.weight_kg ? `${fmtKg(last.weight_kg)} kg × ${last.reps}` : setText(rec.done_exercise, last)}`) : null,
      timerView({
        end: rest.end, total: rest.total, sub: move ? "to move" : "rest left",
        // The end of the rest only clears THIS rest, never a newer one.
        onEnd: () => { const cur = getActive(); if (cur && cur.rest && cur.rest.end === rest.end) clear(); },
      }),
      h("div", { class: "round-row" },
        h("button", { class: "round-btn", type: "button", "aria-label": "30 seconds less", onclick: () => change(-30) }, "−30 s"),
        h("button", { class: "round-btn", type: "button", "aria-label": "30 seconds more", onclick: () => change(30) }, "+30 s")),
      rirBox,
      nextLine ? h("div", { class: "next-card" }, nextId ? thumb(nextId, { moving: true }) : null,
        h("div", { class: "what" }, h("span", { class: "eyebrow accent" }, "Next"), h("b", {}, nextLine),
          nextWhere ? h("span", { class: "small where-line" }, icon("pin", 15), h("span", {}, `${machines[nextMid].name}: ${nextWhere}`)) : null)) : null,
      h("div", { class: "text-link-row undo-row" },
        h("button", { class: "text-button", type: "button", onclick: () => { model.undoLastSet(ctx.session.id, rest.slot); clear(); } }, icon("undo", 16), "Undo that set"))),
    actionBar(skip),
  ];
}
