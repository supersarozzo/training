// The rest timer: starts by itself after Done (about 30 s to move inside a pair, then the pair's rest).
import { h } from "../h.js";
import { workoutScreen, topBar, actionBar, mainButton, timerView } from "./parts.js";
import { model, rerender } from "./app.js";
import { patchActive, getActive } from "../active.js";
import { askEnd, nextText } from "./flow.js";
import { adjustTimer } from "../timer.js";

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
  const nextLine = nextText(ctx, pos.entry);
  return [
    workoutScreen(
      topBar("Rest", () => askEnd(ctx)),
      h("h1", { class: "center" }, rest.kind === "move" ? "Move to the next exercise" : "Rest"),
      timerView({
        end: rest.end, total: rest.total,
        // The end of the rest only clears THIS rest, never a newer one.
        onEnd: () => { const cur = getActive(); if (cur && cur.rest && cur.rest.end === rest.end) clear(); },
      }),
      h("div", { class: "row" },
        h("button", { class: "button secondary", type: "button", onclick: () => change(-30) }, "−30 s"),
        h("button", { class: "button secondary", type: "button", onclick: () => change(30) }, "+30 s")),
      nextLine ? h("p", { class: "center" }, h("span", { class: "muted small" }, "Next: "), nextLine) : null,
      h("div", { class: "text-link-row" },
        h("button", { class: "text-button", type: "button", onclick: () => { model.undoLastSet(ctx.session.id, rest.slot); clear(); } }, "Undo that set"))),
    actionBar(mainButton("Skip", clear)),
  ];
}
