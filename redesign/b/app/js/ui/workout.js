// The workout screen controller: picks the screen from the saved phase and the saved sets.
// Route: #/workout (no tab bar). Everything it shows comes from the data document and the device box,
// so a reload or a closed app continues in the same place.
import { h } from "../h.js";
import { model, go } from "./app.js";
import { getActive, patchActive } from "../active.js";
import { keepScreenOn } from "../wakelock.js";
import { toast } from "./parts.js";
import { buildCtx, leaveWorkout } from "./flow.js";
import { renderWalk, renderWalkResult } from "./walk.js";
import { renderChangeover, renderLiftWarmup } from "./warmup.js";
import { renderPair } from "./pair.js";
import { renderRest } from "./rest.js";
import { renderFinish } from "./finish.js";
import { renderWeek1 } from "./week1.js";

export function renderWorkout() {
  let act = getActive();
  const doc = model.doc();
  const session = act && doc.sessions.find((s) => s.id === act.session_id && !s.deleted && s.status === "in_progress");
  if (!session) {
    leaveWorkout();
    go("#/today");
    return h("main", { class: "screen" });
  }
  keepScreenOn(() => toast("Set Auto-Lock to Never during workouts, so the screen stays on."));

  // A rest that ended while the phone was locked is dropped quietly.
  if (act.rest && Date.now() - act.rest.end > 3000) { act = patchActive({ rest: null }); }
  if (act.hold && Date.now() - act.hold.end > 3000) { act = patchActive({ hold: null }); }

  const ctx = buildCtx(doc, session, act);
  switch (act.phase) {
    case "walk": return renderWalk(ctx);
    case "walk_result": return renderWalkResult(ctx);
    case "changeover": return renderChangeover(ctx);
    case "warmup": return renderLiftWarmup(ctx);
    case "finish": return renderFinish(ctx);
    default: {
      if (session.week === 1) {
        const screen = renderWeek1(ctx);
        if (screen) return screen;
        act = patchActive({ phase: "finish", rest: null });
        return renderFinish(buildCtx(doc, session, act));
      }
      const pos = ctx.position();
      if (!pos) { act = patchActive({ phase: "finish", rest: null }); return renderFinish(buildCtx(doc, session, act)); }
      if (act.rest) return renderRest(ctx, pos);
      return renderPair(ctx, pos);
    }
  }
}
