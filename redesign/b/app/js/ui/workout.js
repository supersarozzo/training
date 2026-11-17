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

const slotSets = (session, slot) => session.exercises.find((e) => e.slot === slot)?.sets.length ?? 0;

// Mark the drawn screen with a key, so the router animates only a real change of screen (redesign B).
function keyed(result, key) {
  const main = Array.isArray(result) ? result[0] : result;
  if (main && main.dataset) main.dataset.screen = key;
  return result;
}

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
    case "walk": return keyed(renderWalk(ctx), `walk:${act.timer_end ? "run" : "start"}`);
    case "walk_result": return keyed(renderWalkResult(ctx), "walk_result");
    case "changeover": return keyed(renderChangeover(ctx), "changeover");
    case "warmup": return keyed(renderLiftWarmup(ctx), "warmup");
    case "finish": return keyed(renderFinish(ctx), "finish");
    default: {
      if (session.week === 1) {
        const screen = renderWeek1(ctx);
        if (screen) return keyed(screen, `w1:${act.rest ? "rest" : ""}:${session.exercises.map((r) => `${r.sets.length}${r.w1_ready ? "r" : ""}${r.w1_saved ? "s" : ""}${r.done_exercise}`).join(",")}`);
        act = patchActive({ phase: "finish", rest: null });
        return keyed(renderFinish(buildCtx(doc, session, act)), "finish");
      }
      const pos = ctx.position();
      if (!pos) { act = patchActive({ phase: "finish", rest: null }); return keyed(renderFinish(buildCtx(doc, session, act)), "finish"); }
      if (act.rest) return keyed(renderRest(ctx, pos), `rest:${act.rest.slot}:${slotSets(session, act.rest.slot)}`);
      return keyed(renderPair(ctx, pos), `pair:${pos.entry.slot}:${pos.entry.setNumber}:${slotSets(session, pos.entry.slot)}`);
    }
  }
}
