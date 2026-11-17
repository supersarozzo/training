// Pairs and sets: one exercise at a time, as a compact set table (SET · PREVIOUS · KG · REPS · ✓), with the current
// set's weight and reps steppers under it. Also used for abs and the "on its own" exercise.
// One tap logs a set: the ✓ on the current row or the big Done at the bottom (both do the same thing).
import { h } from "../h.js";
import { workoutScreen, topBar, actionBar, mainButton, stepper, openSheet, timerView, choiceRow, progressBar, sparkline, chip, icon, toast } from "./parts.js";
import { model, rerender } from "./app.js";
import { patchActive } from "../active.js";
import { exercises } from "../plan/plan-v2.js";
import { stepUp, stepDown, warmupSets } from "../engine/progression.js";
import { slotRecord, workSets, warmupDone, wantsWarmup, unitLabel, targetText } from "../engine/workout.js";
import { askEnd, nextText } from "./flow.js";
import { openSwap } from "./swap.js";
import { startTimer } from "../timer.js";
import { prime } from "../sound.js";
import { flip, thumb, openExercise, openMachine, whereOf } from "./media-ui.js";
import { machineFor, machines, videos } from "../plan/media.js";
import { previousSets, bestBefore, beatsBest, seriesFor, setText, fmtKg } from "./stats.js";

let draft = { key: null, weight: 0, reps: 0 };
let justDone = null; // `${slot}:${n}` of the set saved a moment ago (for the check animation)

// "How many more could you do?" after a set. Optional. The set is already saved.
export function askRir(sessionId, slot, ex) {
  const hold = ex.kind === "hold";
  const close = openSheet(
    h("h2", {}, hold ? "Could you have held longer?" : "How many more could you do?"),
    rirRow(hold, null, (v) => { model.setLastRir(sessionId, slot, v); close(); }),
    h("button", { class: "text-button", type: "button", onclick: () => close() }, "Skip"));
}
export function rirRow(hold, selected, pick) {
  return hold
    ? choiceRow([[0, "No"], [1, "A bit"], [3, "Yes, easily"]], selected, pick)
    : choiceRow([[0, "0"], [1, "1"], [2, "2"], [3, "3"], [4, "4+"]], selected, pick, { columns: 5 });
}

// How far the whole weights block is: sets saved / sets planned.
export function setsProgress(ctx) {
  const total = ctx.seq.length;
  const done = ctx.seq.filter((e) => workSets(slotRecord(ctx.session, e.slot)).length >= e.setNumber).length;
  return total ? done / total : 0;
}

// Swipe a done row to the left to show "Undo" (only the newest set can be undone). The text button stays too.
function swipeable(row, onUndo) {
  const act = h("button", { class: "swipe-act", type: "button", onclick: onUndo, tabindex: "-1" }, icon("undo", "sm"), "Undo");
  const wrap = h("div", { class: "swipe" }, act, row);
  let x0 = null, dx = 0, open = false;
  row.addEventListener("pointerdown", (e) => { x0 = e.clientX; dx = 0; row.style.transition = "none"; });
  row.addEventListener("pointermove", (e) => {
    if (x0 === null) return;
    dx = Math.min(0, Math.max(-110, e.clientX - x0 + (open ? -96 : 0)));
    if (Math.abs(e.clientX - x0) > 6) row.style.transform = `translateX(${dx}px)`;
  });
  const end = () => {
    if (x0 === null) return;
    x0 = null;
    row.style.transition = "";
    open = dx < -48;
    row.style.transform = open ? "translateX(-96px)" : "";
  };
  row.addEventListener("pointerup", end);
  row.addEventListener("pointercancel", end);
  return wrap;
}

export function renderPair(ctx, pos) {
  const { session, units, seq, doc } = ctx;
  const entry = pos.entry;
  const unit = units[entry.unitIndex];
  const rec = slotRecord(session, entry.slot);
  const exId = rec.done_exercise;
  const ex = exercises[exId];
  const sg = ctx.sugg(exId);
  const hold = ex.kind === "hold";
  const bodyweight = ex.step === "bodyweight";
  const done = workSets(rec);
  const startKg = rec.swap_reason === "hurts" && rec.swap_weight_kg != null ? rec.swap_weight_kg : sg.weight_kg;
  const prev = previousSets(doc.sessions, exId);
  const best = bestBefore(doc.sessions, exId);
  const mId = machineFor(exId);

  // Warm-up sets: first exercise of each pair, from the suggested working weight.
  const wantW = wantsWarmup(entry, units) && !rec.warmup_skipped && !bodyweight && !hold;
  const wsets = wantW && startKg ? warmupSets(startKg, exId, ctx.settings) : [];
  const wDone = warmupDone(rec);
  const warmupPending = wsets.length > 0 && wDone < wsets.length;

  // The numbers in the steppers for this set. Reset when the set changes.
  const key = `${session.id}:${entry.slot}:${entry.setNumber}:${exId}`;
  if (draft.key !== key) {
    const last = done[done.length - 1];
    draft = {
      key,
      weight: last ? last.weight_kg : startKg ?? 0,
      reps: last ? (hold ? last.seconds ?? sg.range[0] : last.reps ?? sg.reps) : sg.reps,
    };
  }

  const title = `${unitLabel(unit)} · set ${entry.setNumber} of ${entry.sets}`;

  const saveWork = () => {
    const set = hold
      ? { type: "work", weight_kg: 0, seconds: draft.reps }
      : { type: "work", weight_kg: bodyweight ? 0 : draft.weight, reps: draft.reps };
    const pr = beatsBest(exId, set, best);
    model.logSet(session.id, entry.slot, set);
    justDone = `${entry.slot}:${done.length + 1}`;
    const nextEntry = seq[pos.index + 1] ?? null;
    if (!nextEntry) patchActive({ phase: "finish", rest: null, hold: null });
    else if (entry.restAfter) patchActive({ rest: { end: startTimer(entry.restAfter, Date.now()), total: entry.restAfter * 1000, kind: entry.restKind, slot: entry.slot }, hold: null });
    else patchActive({ hold: null });
    rerender();
    if (pr) toast(`New best: ${ex.name} ${setText(exId, set)}`, 3500, { pr: true });
    // The rest screen asks "how many more" on its own page; without a rest the sheet asks.
    if (!nextEntry || !entry.restAfter) askRir(session.id, entry.slot, ex);
  };
  const saveWarmup = () => {
    const w = wsets[wDone];
    model.logSet(session.id, entry.slot, { type: "warmup", weight_kg: w.weight_kg, reps: w.reps });
    justDone = `${entry.slot}:W${wDone + 1}`;
    rerender();
  };
  const undo = () => { model.undoLastSet(session.id, entry.slot); rerender(); };

  // ----- the set table -----
  const tableCls = hold ? "sets hold" : bodyweight ? "sets bw" : "sets";
  const valCols = (w, r, { unitR = null } = {}) => [
    hold || bodyweight ? h("span", {}) : h("span", { class: "val" }, w),
    h("span", { class: "val" }, r, unitR ? h("small", {}, unitR) : null),
  ];
  const prevText = (n) => (prev[n - 1] ? setText(exId, prev[n - 1]) : "–");
  const rows = [];
  let prLive = null;
  let editSlot = null; // the steppers open right under the current row

  wsets.forEach((w, i) => {
    const isDone = i < wDone;
    const cur = warmupPending && i === wDone;
    const row = h("div", { class: `set-line ${isDone ? "done" : cur ? "current" : "future"}${justDone === `${entry.slot}:W${i + 1}` ? " just-done" : ""}` },
      h("span", { class: "n w" }, `W${i + 1}`),
      h("span", { class: "prev" }, "warm-up"),
      ...valCols(fmtKg(w.weight_kg), String(w.reps)),
      h("button", { class: "check", type: "button", "aria-label": isDone ? `Warm-up set ${i + 1} done` : `Done, warm-up set ${i + 1}`, disabled: !cur, onclick: cur ? saveWarmup : null }, icon("check")));
    rows.push(h("div", { class: "swipe" }, row));
  });

  for (let n = 1; n <= entry.sets; n++) {
    const s = done[n - 1];
    const cur = !warmupPending && n === done.length + 1;
    let row;
    if (s) {
      const isPr = beatsBest(exId, s, best);
      const left = s.rir == null || hold ? null : `${s.rir >= 4 ? "4+" : s.rir} left`;
      row = h("div", { class: `set-line done${justDone === `${entry.slot}:${n}` ? " just-done" : ""}` },
        h("span", { class: "n" }, String(n)),
        h("span", { class: "prev" }, prevText(n)),
        ...valCols(fmtKg(s.weight_kg), String(hold ? s.seconds : s.reps), { unitR: hold ? "s" : left }),
        h("span", { class: "tags" }, isPr ? h("span", { class: "badge pr" }, "PR") : null),
        h("span", { class: "check", role: "img", "aria-label": `Set ${n} done` }, icon("check")));
      rows.push(n === done.length ? swipeable(row, undo) : h("div", { class: "swipe" }, row));
    } else {
      const p = prev[n - 1];
      const copyPrev = cur && p ? () => {
        draft.weight = hold || bodyweight ? draft.weight : p.weight_kg;
        draft.reps = hold ? p.seconds ?? draft.reps : p.reps ?? draft.reps;
        rerender();
      } : null;
      if (cur) prLive = h("span", { class: "badge pr pr-live", hidden: !beatsBest(exId, hold ? { seconds: draft.reps } : { weight_kg: draft.weight, reps: draft.reps }, best) }, "PR");
      const wVal = cur ? fmtKg(draft.weight) : fmtKg(n > 1 && done.length ? done[done.length - 1].weight_kg : startKg ?? 0);
      const rVal = cur ? String(draft.reps) : String(hold ? sg.range[0] : sg.reps);
      const wEl = h("span", { class: "val" }, wVal), rEl = h("span", { class: "val" }, rVal, hold ? h("small", {}, "s") : null);
      if (cur) { draft.wEl = wEl; draft.rEl = rEl; }
      row = h("div", { class: `set-line ${cur ? "current" : "future"}` },
        h("span", { class: "n" }, String(n)),
        h("button", { class: "prev", type: "button", disabled: !copyPrev, onclick: copyPrev, "aria-label": copyPrev ? `Use last time: ${prevText(n)}` : `Last time: ${prevText(n)}` }, prevText(n)),
        hold || bodyweight ? h("span", {}) : wEl, rEl,
        h("span", { class: "tags" }, prLive && cur ? prLive : null),
        h("button", { class: "check", type: "button", "aria-label": cur ? `Done, set ${n}` : `Set ${n}, later`, disabled: !cur, onclick: cur ? saveWork : null }, icon("check")));
      rows.push(h("div", { class: "swipe" }, row));
      if (cur) { editSlot = h("div", { class: "set-edit" }); rows.push(editSlot); }
    }
  }
  justDone = null;

  const table = h("div", { class: tableCls, role: "table", "aria-label": "Sets" },
    h("div", { class: "sets-head", role: "row" }, h("span", {}, "Set"), h("span", {}, "Previous"), hold || bodyweight ? h("span", {}) : h("span", {}, "kg"), h("span", {}, hold ? "Secs" : ex.perSide ? "Reps/side" : "Reps"), h("span", {})),
    rows);

  // live update of the table row and the PR badge while the steppers move
  let doneBtn = null;
  const live = () => {
    if (draft.wEl) draft.wEl.textContent = fmtKg(draft.weight);
    if (draft.rEl) draft.rEl.firstChild.textContent = String(draft.reps);
    const sub = doneBtn && doneBtn.querySelector(".sub");
    if (sub && !warmupPending) sub.textContent = hold ? `${draft.reps} s` : bodyweight ? `${draft.reps} reps` : `${fmtKg(draft.weight)} kg × ${draft.reps}`;
    if (prLive) prLive.hidden = !beatsBest(exId, hold ? { seconds: draft.reps } : { weight_kg: draft.weight, reps: draft.reps }, best);
  };

  // Controls for the current set
  let controls = null;
  if (!warmupPending) {
    const weightStep = bodyweight || hold ? null : stepper({
      label: "Weight", unit: "kg", value: draft.weight, min: 0, max: 400,
      next: (v, dir) => (dir > 0 ? stepUp(v, exId, ctx.settings) : stepDown(v, exId, ctx.settings)),
      onChange: (v) => { draft.weight = v; live(); },
    });
    const repsStep = stepper({
      label: hold ? "Seconds" : "Reps", unit: hold ? "s" : ex.perSide ? "each side" : "reps", value: draft.reps, step: hold ? 5 : 1, min: 0, max: hold ? 600 : 100, decimals: 0,
      onChange: (v) => { draft.reps = v; live(); },
    });
    let holdBox = null;
    if (hold) {
      const hd = ctx.act.hold;
      holdBox = hd
        ? [
          timerView({ end: hd.end, total: hd.total, big: false, cap: "hold", onEnd: () => { const cur = ctx.act.hold; if (cur && cur.end === hd.end) { patchActive({ hold: null }); rerender(); } } }),
          h("div", { class: "text-link-row" }, h("button", { class: "text-button", type: "button", onclick: () => { patchActive({ hold: null }); rerender(); } }, "Stop countdown")),
        ]
        : h("button", { class: "button tinted", type: "button", onclick: () => { prime(); patchActive({ hold: { end: startTimer(draft.reps, Date.now()), total: draft.reps * 1000 } }); rerender(); } }, icon("clock"), `Start ${draft.reps} s countdown`);
    }
    controls = [h("div", { class: `editor${weightStep ? "" : " one big"}` }, weightStep, repsStep), holdBox];
    if (editSlot) { editSlot.append(...[controls].flat(3).filter(Boolean)); controls = null; }
  }

  // the other exercise of the pair (what comes after this set)
  const nextEntry = seq[pos.index + 1] ?? null;
  const nextLine = nextEntry ? nextText(ctx, nextEntry) : null;
  let partner = null;
  if (unit.type === "pair") {
    const other = unit.slots.find((x) => x.slot !== entry.slot);
    if (other) {
      const orec = slotRecord(session, other.slot);
      const oex = exercises[orec.done_exercise];
      const odone = workSets(orec).length;
      partner = h("div", { class: "next-card" },
        thumb(orec.done_exercise, { size: "sm", onclick: () => openExercise(orec.done_exercise, { noteFor: orec.done_exercise }) }),
        h("div", { class: "grow" },
          h("div", { class: "k" }, `Pair partner · ${other.slot}`),
          h("div", { class: "t ellipsis" }, oex.name),
          h("div", { class: "set-dots", "aria-label": `${odone} of ${other.sets} sets done` }, Array.from({ length: other.sets }, (_, i) => h("i", { class: i < odone ? "on" : "" })))));
    }
  }

  const unknown = !hold && !bodyweight && !startKg && !done.length;
  const series = seriesFor(doc.sessions, exId).slice(-10).map((p) => p.y);
  const where = mId ? whereOf(doc, mId) : "";
  const machineNote = ctx.state(exId)?.machine_note;
  const doneLabel = warmupPending
    ? `Done · warm-up set ${wDone + 1}`
    : "Done";
  const doneSub = warmupPending ? `${fmtKg(wsets[wDone].weight_kg)} kg × ${wsets[wDone].reps}` : hold ? `${draft.reps} s` : bodyweight ? `${draft.reps} reps` : `${fmtKg(draft.weight)} kg × ${draft.reps}`;

  const main = workoutScreen(
    topBar(title, () => askEnd(ctx), { startedAt: session.started_at }),
    progressBar(setsProgress(ctx)),
    h("div", { class: "ex-head" },
      flip(exId, { size: "lg", onclick: () => openExercise(exId, { noteFor: exId }) }),
      h("div", { class: "grow" },
        h("div", { class: "eyebrow" }, entry.slot, rec.swap_reason ? " · swapped in" : ""),
        h("h1", {}, ex.name),
        h("div", { class: "meta" }, ex.equipment)),
      series.length > 1 ? h("div", { class: "spark-box" }, sparkline(series, { w: 56, h: 26, area: true }), h("div", { class: "tiny faint" }, `${series.length} workouts`)) : null),
    h("div", { class: "chips one-line" },
      chip("info", "Tips", () => openExercise(exId, { noteFor: exId })),
      videos[exId] ? chip("play", "Video", null, { href: videos[exId].url }) : null,
      mId ? chip("pin", where ? "Machine" : "Where is it?", () => openMachine(mId), { cls: where ? "" : "warn" }) : null,
      chip("swap", "Swap", () => openSwap(ctx, rec))),
    h("div", { class: "target" }, targetText(exId, entry.sets, ctx.plan.rir)),
    h("div", { class: "info-lines" },
      sg.lastText ? h("div", {}, icon("clock", "sm"), sg.lastText) : null,
      sg.note && !(sg.action === "unknown") ? h("div", {}, icon("progress", "sm"), sg.note) : null,
      machineNote ? h("div", {}, icon("note", "sm"), `Machine: ${machineNote}`) : null,
      where ? h("div", {}, icon("pin", "sm"), `${machines[mId].name}: ${where}`) : null,
      rec.swap_reason === "hurts" ? h("div", { class: "warn" }, icon("warn", "sm"), "You swapped because it hurt. Start light.") : null,
      unknown ? h("div", { class: "warn" }, icon("warn", "sm"), "Pick a light weight you can lift with good form.") : null),
    table,
    controls,
    partner,
    nextLine ? h("p", { class: "small muted" }, "Next: ", h("b", {}, nextLine)) : null,
    warmupPending ? h("div", { class: "text-link-row" }, h("button", { class: "text-button", type: "button", onclick: () => { model.skipWarmup(session.id, entry.slot); rerender(); } }, "Skip warm-up sets")) : null,
    done.length ? h("div", { class: "text-link-row" }, h("button", { class: "text-button muted", type: "button", onclick: undo }, icon("undo", "sm"), "Undo last set")) : null);
  main.dataset.key = `pair:${entry.slot}`;
  doneBtn = mainButton(doneLabel, warmupPending ? saveWarmup : saveWork, { ic: "check", sub: doneSub });
  return [main, actionBar(doneBtn)];
}
