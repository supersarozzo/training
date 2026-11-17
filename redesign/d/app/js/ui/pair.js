// Pairs and sets: one exercise at a time with the current set's weight and reps. Also used for abs and the "on its own" exercise.
import { MAX_TEXT } from "../validate.js";
import { h } from "../h.js";
import { guideScreen, actionBar, mainButton, stepper, openSheet, timerView, choiceRow } from "./parts.js";
import { guideTop, exerciseChips, whereLine, nextUp } from "./coach.js";
import { demo } from "./demo.js";
import { videoFor } from "../plan/videos.js";
import { icon } from "./icons.js";
import { play } from "./motion.js";
import { model, rerender } from "./app.js";
import { patchActive } from "../active.js";
import { exercises } from "../plan/plan-v2.js";
import { cues } from "../plan/cues.js";
import { stepUp, stepDown, warmupSets } from "../engine/progression.js";
import { slotRecord, workSets, warmupDone, wantsWarmup, unitLabel, targetText } from "../engine/workout.js";
import { askEnd, nextText } from "./flow.js";
import { openSwap } from "./swap.js";
import { startTimer } from "../timer.js";
import { prime } from "../sound.js";

let draft = { key: null, weight: 0, reps: 0 };

// "How many more could you do?" after a set. Optional. The set is already saved.
export function askRir(sessionId, slot, ex) {
  const hold = ex.kind === "hold";
  const close = openSheet(
    h("h2", {}, hold ? "Could you have held longer?" : "How many more could you do?"),
    hold
      ? choiceRow([[0, "No"], [1, "A bit"], [3, "Yes, easily"]], null, (v) => { model.setLastRir(sessionId, slot, v); close(); })
      : choiceRow([[0, "0"], [1, "1"], [2, "2"], [3, "3"], [4, "4+"]], null, (v) => { model.setLastRir(sessionId, slot, v); close(); }, { columns: 5 }),
    h("button", { class: "text-button", type: "button", onclick: () => close() }, "Skip"));
}

function openTips(ctx, rec) {
  const ex = exercises[rec.done_exercise];
  const st = ctx.state(rec.done_exercise);
  let note = st?.machine_note ?? "";
  const video = videoFor(rec.done_exercise);
  const close = openSheet(
    demo(rec.done_exercise),
    h("span", { class: "eyebrow brand" }, "How to do it"),
    h("h2", {}, ex.name),
    h("p", {}, cues[rec.done_exercise] ?? "Move slowly and keep good form."),
    video ? h("a", { class: "button secondary", href: video.url, target: "_blank", rel: "noopener noreferrer" }, icon("video"), `Watch video (${video.source})`) : null,
    h("p", { class: "small muted" }, "The video opens in Safari. Come back to the app with the Training icon."),
    h("div", { class: "field" },
      h("label", { for: "machine-note" }, "Machine settings note (seat height, pin)"),
      h("textarea", { id: "machine-note", maxlength: MAX_TEXT, oninput: (e) => { note = e.target.value; }, value: note })),
    h("button", { class: "button", type: "button", onclick: () => { model.setExerciseState(rec.done_exercise, { machine_note: note.trim() }); close(); rerender(); } }, "Save note"));
}

export function renderPair(ctx, pos) {
  const { session, units, seq } = ctx;
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

  // Warm-up sets: first exercise of each pair, from the suggested working weight.
  const wantW = wantsWarmup(entry, units) && !rec.warmup_skipped && !bodyweight && !hold;
  const wsets = wantW && startKg ? warmupSets(startKg, exId, ctx.settings) : [];
  const wDone = warmupDone(rec);
  const warmupPending = wsets.length > 0 && wDone < wsets.length;

  // The numbers in the steppers for this set. Reset when the set changes.
  const key = `${session.id}:${entry.slot}:${entry.setNumber}:${exId}`;
  if (draft.key !== key) {
    const prev = done[done.length - 1];
    draft = {
      key,
      weight: prev ? prev.weight_kg : startKg ?? 0,
      reps: prev ? (hold ? prev.seconds ?? sg.range[0] : prev.reps ?? sg.reps) : sg.reps,
    };
  }

  const saveWorkNow = () => {
    const set = hold
      ? { type: "work", weight_kg: 0, seconds: draft.reps }
      : { type: "work", weight_kg: bodyweight ? 0 : draft.weight, reps: draft.reps };
    model.logSet(session.id, entry.slot, set);
    const nextEntry = seq[pos.index + 1] ?? null;
    if (!nextEntry) patchActive({ phase: "finish", rest: null, hold: null });
    else if (entry.restAfter) patchActive({ rest: { end: startTimer(entry.restAfter, Date.now()), total: entry.restAfter * 1000, kind: entry.restKind, slot: entry.slot }, hold: null });
    else patchActive({ hold: null });
    after = () => { rerender(); askRir(session.id, entry.slot, ex); };
  };
  const saveWarmupNow = () => {
    const w = wsets[wDone];
    model.logSet(session.id, entry.slot, { type: "warmup", weight_kg: w.weight_kg, reps: w.reps });
    after = () => rerender();
  };

  // Done: the set is saved at once; the button shows a check for a moment, then the next step comes in.
  let after = () => {};
  const confirmDone = (btn, work) => {
    if (btn.disabled) return;
    btn.disabled = true;
    work();
    btn.replaceChildren(icon("check"), "Saved");
    const anim = play(btn, [{ transform: "scale(1)" }, { transform: "scale(0.96)" }, { transform: "scale(1)" }], { duration: 170 });
    if (anim) anim.finished.then(() => after(), () => after()); else after();
  };

  // Set chips: done (with weight × reps and reps left), now, later.
  const chips = [];
  for (let n = 1; n <= entry.sets; n++) {
    const st = done[n - 1];
    if (st) {
      const what = hold ? `${st.seconds} s` : bodyweight ? `${st.reps} reps` : `${st.weight_kg} × ${st.reps}`;
      const left = st.rir == null || hold ? null : `${st.rir >= 4 ? "4+" : st.rir} left`;
      chips.push(h("div", { class: "set-chip done", "aria-label": `Set ${n} done: ${what}${left ? `, ${left}` : ""}` }, h("b", {}, `Set ${n}`), h("span", {}, what), left ? h("span", {}, left) : null));
    } else {
      const cur = n === done.length + 1 && !warmupPending;
      chips.push(h("div", { class: `set-chip ${cur ? "current" : ""}`, "aria-current": cur ? "step" : false }, h("b", {}, `Set ${n}`), h("span", {}, cur ? "Now" : "Later")));
    }
  }
  const setGrid = h("div", { class: "sets" }, chips);
  setGrid.style.gridTemplateColumns = `repeat(${Math.min(entry.sets, 5)}, 1fr)`;

  let warmGrid = null;
  if (wsets.length) {
    warmGrid = h("div", { class: "sets" }, wsets.map((w, i) => h("div", { class: `set-chip warmup ${i < wDone ? "done" : i === wDone ? "current" : ""}` },
      h("b", {}, `Warm-up ${i + 1}`), h("span", {}, `${w.weight_kg} kg × ${w.reps}`))));
    warmGrid.style.gridTemplateColumns = `repeat(${wsets.length}, 1fr)`;
  }

  // Controls for the current set
  let controls = null;
  if (!warmupPending) {
    const weightStep = bodyweight || hold ? null : stepper({
      label: "Weight", unit: "kg", value: draft.weight, min: 0, max: 400,
      next: (v, dir) => (dir > 0 ? stepUp(v, exId, ctx.settings) : stepDown(v, exId, ctx.settings)),
      onChange: (v) => { draft.weight = v; },
    });
    const repsStep = stepper({
      label: hold ? "Seconds" : "Reps", unit: hold ? "s" : ex.perSide ? "each side" : "reps", value: draft.reps, step: hold ? 5 : 1, min: 0, max: hold ? 600 : 100, decimals: 0,
      onChange: (v) => { draft.reps = v; },
    });
    let holdBox = null;
    if (hold) {
      const hd = ctx.act.hold;
      holdBox = hd
        ? [
          timerView({ end: hd.end, total: hd.total, big: false, small: true, sub: "hold", onEnd: () => { const cur = ctx.act.hold; if (cur && cur.end === hd.end) { patchActive({ hold: null }); rerender(); } } }),
          h("div", { class: "text-link-row" }, h("button", { class: "text-button", type: "button", onclick: () => { patchActive({ hold: null }); rerender(); } }, "Stop countdown")),
        ]
        : h("button", { class: "button soft", type: "button", onclick: () => { prime(); patchActive({ hold: { end: startTimer(draft.reps, Date.now()), total: draft.reps * 1000 } }); rerender(); } }, icon("timer"), `Start ${draft.reps} s countdown`);
    }
    controls = [h("div", { class: `dials ${weightStep ? "" : "one"}` }, weightStep, repsStep), holdBox];
  }

  const nextEntry = seq[pos.index + 1] ?? null;
  const unknown = !hold && !bodyweight && !startKg && !done.length;
  const machineNote = ctx.state(exId)?.machine_note;
  const nextRec = nextEntry ? slotRecord(session, nextEntry.slot) : null;
  const nextLine = nextEntry ? nextText(ctx, nextEntry) : null;
  const restWord = entry.restAfter ? (entry.restKind === "move" ? `after ${entry.restAfter} s to move` : `after ${entry.restAfter} s rest`) : null;

  const stepText = [h("b", {}, unitLabel(unit)), ` · ${entry.slot} · set ${entry.setNumber} of ${entry.sets}`];
  const mainBtn = warmupPending
    ? mainButton(`Done · warm-up set ${wDone + 1}`, (e) => confirmDone(e.currentTarget, saveWarmupNow))
    : mainButton(hold ? "Done · save hold" : "Done", (e) => confirmDone(e.currentTarget, saveWorkNow));

  return [
    guideScreen(`pair:${session.id}:${entry.slot}:${exId}`,
      guideTop(ctx, stepText, () => askEnd(ctx)),
      h("section", { class: "g-card" },
        demo(exId),
        h("div", { class: "g-body" },
          h("span", { class: "eyebrow brand" }, unit.type === "pair" ? `${entry.slot} of pair ${unit.id}` : unitLabel(unit)),
          h("h1", {}, ex.name),
          h("div", { class: "g-sub" }, `${ex.equipment}${rec.swap_reason ? " · swapped in" : ""}`),
          exerciseChips(ctx, exId, { onTips: () => openTips(ctx, rec), onSwap: () => openSwap(ctx, rec) }),
          h("div", { class: "target" }, h("b", {}, targetText(exId, entry.sets, ctx.plan.rir))),
          sg.lastText ? h("div", { class: "last-line" }, sg.lastText) : null,
          h("div", { class: "notes" },
            sg.note && !(sg.action === "unknown") ? h("div", { class: "note-line" }, sg.note) : null,
            machineNote ? h("div", { class: "note-line" }, `Machine settings: ${machineNote}`) : null,
            rec.swap_reason === "hurts" ? h("div", { class: "note-line warn" }, "You swapped because it hurt. Start light.") : null,
            unknown ? h("div", { class: "note-line warn" }, "Pick a light weight you can lift with good form.") : null),
          whereLine(ctx.doc, exId))),
      warmGrid ? [h("div", { class: "sets-label" }, h("span", { class: "label" }, "Warm-up sets first"), h("span", { class: "small muted" }, "light, then heavier")), warmGrid] : null,
      h("div", { class: "sets-label" }, h("span", { class: "label" }, "Working sets"), done.length ? h("span", { class: "small muted" }, `${done.length} of ${entry.sets} done`) : null),
      setGrid,
      controls,
      nextLine ? nextUp(nextRec?.done_exercise, `Next: ${nextLine}`, restWord) : nextUp(null, "Then: finish and save", "This is the last set."),
      warmupPending ? h("div", { class: "text-link-row" }, h("button", { class: "text-button", type: "button", onclick: () => { model.skipWarmup(session.id, entry.slot); rerender(); } }, "Skip warm-up sets")) : null,
      done.length ? h("div", { class: "text-link-row" }, h("button", { class: "text-button", type: "button", onclick: () => { model.undoLastSet(session.id, entry.slot); rerender(); } }, "Undo last set")) : null),
    actionBar(mainBtn),
  ];
}
