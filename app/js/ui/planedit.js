// Plan edits (build step 4, docs/DESIGN.md 15.5; mock-up frames "Edit mode", "Swap sheet", "Add an exercise",
// "Changed day"): the Swap sheet, the Add sheet, Remove, the "Back to the plan's day" sheet and the Undo toast.
// All saves go through the step 3 model calls (swapPlanSlot, removePlanSlot, addPlanSlot, savePlanDay, resetPlanDay);
// each throws a plain-words Error when it is not allowed, and the message is shown in a toast, never a crash.
// All text through h(); no innerHTML; no style attributes.
import { h } from "../h.js";
import { openSheet, closeSheets, toast, stepper } from "./parts.js";
import { model, rerender } from "./app.js";
import { getActive } from "../active.js";
import { days, exercises } from "../plan/plan-v2.js";
import { thumb } from "./media.js";
import { icon } from "./icons.js";
import { miniMap } from "./bodymap.js";
import { viewDay, swapSheet, addSheet, exName, dayChanges, changedOn, rangeFor, rangeText, weightLine, workoutRunning } from "../planview.js";
import { withSets, setsForSlot, MIN_SETS, MAX_SETS } from "../engine/planedits.js";
import { weightStepFor, validRange } from "../engine/workout.js";
import { pageFor } from "../engine/planpage.js";
import { today } from "../clock.js";

// The Change sheet's week line (0.7.1): "This week" only when the picked week is this week.
export function doseWeekWords(n, week, thisWeek) {
  return week === thisWeek ? `This week: ${n} sets (the week ${week} rule).` : `In week ${week}: ${n} sets.`;
}

const dayName = (day) => days[day].name;
const clone = (x) => JSON.parse(JSON.stringify(x));
// The day as it is saved now (for Undo): the record's own slots when the day is edited, else the plan's day. Not the
// slots as shown, which fill in the rest of a pair exercise left alone (auditor note N1).
const savedSlots = (day) => { const info = model.effectivePlanDay(day); return clone(info.edited ? info.record.slots : info.slots); };
const repsText = (ex) => {
  const [lo, hi] = ex.range;
  const r = lo === hi ? `${lo}` : `${lo}–${hi}`;
  return ex.kind === "hold" ? `${r} s hold` : `${r} reps`;
};

// What can be done to a day now. A workout running on this day locks it (the sets of a running workout are fixed);
// a day saved by a newer app is shown as the plan and cannot be edited.
export function dayState(doc, day, week) {
  const view = viewDay(doc, day, week);
  const active = getActive();
  const run = active ? doc.sessions.find((x) => x.id === active.session_id && !x.deleted) : null;
  const locked = !!run && run.plan_day === day && run.status === "in_progress";
  return { ...view, locked, canEdit: !locked && !view.newerVersion };
}

// ---------- Undo toast ----------

let toastEl = null;
let toastTimer = null;
export function undoToast(text, onUndo, ms = 8000) {
  toastEl?.remove();
  clearTimeout(toastTimer);
  const el = h("div", { class: "toast undo-toast", role: "status" },
    h("span", { class: "undo-text" }, text),
    h("button", {
      class: "undo-btn", type: "button",
      onclick: () => {
        clearTimeout(toastTimer);
        el.remove();
        if (toastEl === el) toastEl = null;
        try { onUndo(); } catch (e) { toast(e.message); }
        rerender();
      },
    }, "Undo"));
  toastEl = el;
  document.body.append(el);
  toastTimer = setTimeout(() => { el.remove(); if (toastEl === el) toastEl = null; }, ms);
}

// Run one save. On a refusal the plain-words message is shown and nothing changed. Returns true when it saved.
function save(day, doneText, work) {
  let before;
  try {
    before = savedSlots(day);
    work();
  } catch (e) { toast(e.message); return false; }
  closeSheets();
  rerender();
  undoToast(doneText, () => model.savePlanDay(day, before));
  return true;
}

export function removeSlot(day, slotName) {
  const cur = model.effectivePlanDay(day).slots.find((s) => s.slot === slotName);
  const name = cur ? exName(cur.ex) : "exercise";
  save(day, `Removed ${name} from ${dayName(day)}.`, () => model.removePlanSlot(day, slotName));
}

// ---------- shared parts ----------

const lastsBox = (day) => h("div", { class: "lasts" }, icon("info", 18),
  h("span", {}, h("b", {}, `Lasts: every ${dayName(day)} from now on.`), " Past workouts stay as they were. You can go back to the plan's day at any time."));

const hiddenLine = (names) => (names.length
  ? h("p", { class: "small muted" }, `Not shown: ${names.join(", ")}. Your first visit has not found ${names.length === 1 ? "this machine" : "these machines"} yet (Settings > Gym weights).`)
  : null);

// ---------- Swap sheet ----------

export function openSwapSheet(day, week, slotName) {
  const doc = model.doc();
  const sh = swapSheet(doc, day, slotName, doc.shared_settings);
  if (!sh) { toast("This exercise is no longer in the day."); return; }
  const oldName = exName(sh.current);
  const first = sh.same.filter((x) => !x.sameKit);
  const kin = sh.same.filter((x) => x.sameKit);

  const pick = (id) => save(day, `Swapped ${oldName} for ${exName(id)}.`, () => model.swapPlanSlot(day, slotName, id));
  const row = (id, badge) => {
    const ex = exercises[id];
    return h("button", { class: "mach-row", type: "button", "aria-label": `Swap ${oldName} for ${ex.name}${badge ? ` (${badge})` : ""}. ${ex.equipment}. ${repsText(ex)}.`, onclick: () => pick(id) },
      thumb(id, { small: true }),
      h("span", { class: "grow" },
        h("b", {}, ex.name, badge ? h("span", { class: "badge inline acc" }, badge) : null),
        h("span", { class: "small muted" }, `${ex.equipment} · ${repsText(ex)}`)),
      miniMap(id),
      h("span", { class: "muted" }, icon("chevron", 18)));
  };

  const othersBox = h("div", { class: "others-box" });
  let open = false;
  const toggle = h("button", {
    class: "button secondary", type: "button", "aria-expanded": "false",
    onclick: () => {
      open = !open;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Hide exercises for other muscles" : "Show exercises for other muscles";
      othersBox.replaceChildren(...(open ? sh.others.map((g) => h("div", {},
        h("span", { class: "eyebrow" }, g.name),
        h("div", { class: "card" }, g.items.map((id) => row(id, null))))) : []));
    },
  }, "Show exercises for other muscles");

  openSheet(
    h("h2", {}, `Swap ${oldName}`),
    lastsBox(day),
    h("p", { class: "small muted" }, `Keeps the slot's ${sh.sets} sets and its rest. The reps come from the new exercise.`),
    first.length ? [h("span", { class: "eyebrow" }, `Same muscle (${sh.muscle}), other equipment`),
      h("div", { class: "card" }, first.map((x) => row(x.id, x.pick)))] : null,
    !first.length && !kin.length ? h("p", { class: "muted" }, "No other exercise for this muscle fits here.") : null,
    kin.length ? [h("span", { class: "eyebrow" }, `Same muscle (${sh.muscle}), same kind of equipment`), h("div", { class: "card" }, kin.map((x) => row(x.id, x.pick)))] : null,
    sh.already.length ? h("p", { class: "small muted" }, `Already in ${dayName(day)}: ${sh.already.join(", ")}.`) : null,
    hiddenLine(sh.hidden),
    sh.others.length ? toggle : null,
    othersBox);
}

// ---------- Add sheet ----------

// "3 sets this week (2 in a normal week)"; for another picked week: "3 sets in week 7 (...)".
export function setsWords(a, week, thisWeek) {
  const when = thisWeek === undefined || week === thisWeek ? "this week" : `in week ${week}`;
  return `${a.setsThisWeek} sets ${when} (${a.setsNormal} in a normal week)`;
}

export function openAddSheet(day, week, thisWeek) {
  const doc = model.doc();
  const a = addSheet(doc, day, week, doc.shared_settings);
  if (a.left <= 0) { toast(`${a.max} added: the most for one day.`); return; }
  let sel = (a.groups.find((g) => g.low) ?? a.groups[0]).id;
  const chips = h("div", { class: "chips" });
  const list = h("div", { class: "add-list" });

  const add = (id) => save(day, `Added ${exName(id)} to ${dayName(day)}.`, () => model.addPlanSlot(day, id));
  const draw = () => {
    const g = a.groups.find((x) => x.id === sel);
    chips.replaceChildren(...a.groups.map((x) => h("button", {
      class: "chip", type: "button", "aria-pressed": x.id === sel ? "true" : "false",
      "aria-label": `${x.name}${x.low ? ", low in the whole plan" : ""}`,
      onclick: () => { sel = x.id; draw(); },
    }, x.name, x.low ? h("span", { class: "badge" }, "low") : null)));
    list.replaceChildren(
      g.items.length
        ? h("div", { class: "card" }, g.items.map((id) => {
          const ex = exercises[id];
          return h("button", { class: "mach-row", type: "button", "aria-label": `Add ${ex.name} to ${dayName(day)}. ${ex.equipment}.`, onclick: () => add(id) },
            thumb(id, { small: true }),
            h("span", { class: "grow" }, h("b", {}, ex.name), h("span", { class: "small muted" }, ex.equipment)),
            h("span", { class: "muted" }, icon("plus", 20)));
        }))
        : h("p", { class: "muted" }, "No more exercises for this muscle."),
      hiddenLine(g.hidden));
  };
  draw();

  openSheet(
    h("h2", {}, `Add to ${dayName(day)}`),
    lastsBox(day),
    h("div", { class: "card tight" },
      h("p", {}, h("b", {}, "Where it goes:"), ` at the end, after the abs, done on its own. ${setsWords(a, week, thisWeek)}, ${a.rest} s rest. At most ${a.max} added exercises a day.`),
      h("p", { class: "small muted" }, `Adds about ${a.minutes} minutes. "low" = the Muscles screen finds this muscle short in the whole plan.`)),
    chips,
    list);
}

// ---------- Back to the plan's day ----------

export function openBackToPlan(day) {
  const info = model.effectivePlanDay(day);
  const changes = dayChanges(day, info.record);
  const name = dayName(day);
  const back = () => {
    let before;
    try {
      const now = dayState(model.doc(), day, 1);
      // Read again at the tap: a day saved by a newer app (after a sync) or a day whose workout is running is never reset here.
      if (now.newerVersion) throw new Error("This day was changed on a newer app version. Update the app to change it.");
      if (now.locked) throw new Error("Workout running. This day can be changed after the workout ends.");
      before = savedSlots(day);
      model.resetPlanDay(day);
    } catch (e) { toast(e.message); return; }
    closeSheets();
    rerender();
    undoToast(`${name} is back to the plan's version.`, () => model.savePlanDay(day, before));
  };
  openSheet(
    h("h2", {}, `Back to the plan's ${name}?`),
    h("p", {}, "These changes go away:"),
    h("div", {}, changes.map((c) => h("p", { class: "change-line" }, `• ${c.text}`))),
    h("p", { class: "small muted" }, "Workouts already done stay as they were. Your weights and history for each exercise are kept."),
    h("button", { class: "button", type: "button", onclick: back }, `Back to the plan's ${name}`),
    h("button", { class: "button secondary", type: "button", onclick: closeSheets }, `Keep my ${name}`));
}

// The "Changed by you · 17 Nov" card (accent border).
export function changedCard(day, record, { canReset = true } = {}) {
  const name = dayName(day);
  const when = changedOn(record);
  return h("div", { class: "card changed-card" },
    h("p", {}, h("b", {}, `Changed by you${when ? ` · ${when}` : ""}`), dayChanges(day, record).map((c) => [h("br"), c.text])),
    h("p", { class: "small muted" }, `Lasts every ${name}. Past workouts are not changed.`),
    canReset ? h("button", { class: "text-button back-plan", type: "button", onclick: () => openBackToPlan(day) }, icon("undo", 18), `Back to the plan's ${name}`) : null);
}

// ---------- Sets, reps and weight (0.6.0; Rosario: the exercises "can't be edited in the sets or repetitions or weight") ----------
// Sets count for this day of the plan (a saved Plan edit: every week, the week rule still applies). Reps and weight count
// for the exercise on every day (exercise_state). One Save; one Undo puts all three back.
const lockedText = (st) => (st.locked ? "Workout running. This day can be changed after the workout ends." : "This day was changed on a newer app version. Update the app to change it.");

const RUNNING_TEXT = "Workout running. Sets, reps and weight can be changed after the workout ends.";
export function openDoseSheet(day, week, slotName) {
  const doc = model.doc();
  if (workoutRunning(doc)) { toast(RUNNING_TEXT); return; }
  const st0 = dayState(doc, day, week);
  if (!st0.canEdit) { toast(lockedText(st0)); return; }
  const slot = model.effectivePlanDay(day).slots.find((s) => s.slot === slotName);
  if (!slot) return;
  const ex = exercises[slot.ex];
  const planRange = [...ex.range];
  const stOld = clone(doc.exercise_state.find((x) => x.id === `x-${slot.ex}` && !x.deleted) ?? null);
  const cur = rangeFor(doc, slot.ex);
  const w = weightLine(doc, slot.ex, week);
  const weighted = ex.step !== "bodyweight" && ex.kind !== "hold";
  const draft = { sets: slot.sets, lo: cur[0], hi: cur[1], kg: w.kg ?? 0, kgTouched: false };
  const hold = ex.kind === "hold";
  const unit = hold ? "s" : "reps";

  const weekLine = h("p", { class: "small muted" });
  const thisWeek = pageFor(doc.block.start_monday, today()).week;
  const showWeek = () => { weekLine.textContent = doseWeekWords(setsForSlot(week, { ...slot, sets: draft.sets }, day), week, thisWeek); };
  showWeek();
  const rangeNote = h("p", { class: "small muted" });
  const showRange = () => {
    rangeNote.textContent = draft.lo > draft.hi ? "The low number must not be above the high number."
      : draft.lo === planRange[0] && draft.hi === planRange[1] ? `The plan's ${hold ? "seconds" : "reps"}: ${rangeText(planRange)}.`
        : `Yours: ${rangeText([draft.lo, draft.hi])}. The plan's: ${rangeText(planRange)}.`;
  };
  showRange();

  const saveIt = () => {
    // Audit m1-m3 (2026-11-18): check every value before anything is written, write only what changed, and keep the
    // old values as they are at Save (a sync may have landed while the sheet was open), so Undo restores exactly that.
    const range = validRange([draft.lo, draft.hi]);
    if (!range) { toast(draft.lo > draft.hi ? "The low number must not be above the high number." : `${hold ? "Seconds" : "Reps"} must be whole numbers from 1 to 100.`); return; }
    const weightOk = !weighted || !draft.kgTouched || (Number.isFinite(draft.kg) && draft.kg >= 0 && draft.kg <= 1000);
    if (!weightOk) { toast("The weight must be 0 to 1000 kg."); return; }
    const stNow = clone(model.doc().exercise_state.find((x) => x.id === `x-${slot.ex}` && !x.deleted) ?? null);
    let beforeSlots, didSets = false, didPrefs = false;
    try {
      if (workoutRunning(model.doc())) throw new Error(RUNNING_TEXT);
      const now = dayState(model.doc(), day, week);
      if (!now.canEdit) throw new Error(lockedText(now));
      beforeSlots = savedSlots(day);
      const curSets = beforeSlots.find((x) => x.slot === slotName)?.sets;
      const nextSlots = draft.sets !== curSets ? withSets(beforeSlots, slotName, draft.sets) : null; // throws on a bad number, before any write
      const ownRange = range[0] === planRange[0] && range[1] === planRange[1] ? null : range;
      const prefs = {};
      if (JSON.stringify(ownRange) !== JSON.stringify(stNow?.my_range ?? null)) prefs.range = ownRange;
      if (weighted && draft.kgTouched && draft.kg !== (stNow?.my_weight_kg ?? w.kg ?? 0)) prefs.weightKg = draft.kg;
      if (nextSlots) { model.savePlanDay(day, nextSlots); didSets = true; }
      if (Object.keys(prefs).length) { model.setExercisePrefs(slot.ex, prefs); didPrefs = true; }
    } catch (e) { toast(e.message); return; }
    closeSheets();
    if (!didSets && !didPrefs) return; // nothing changed: no write, no Undo
    rerender();
    undoToast(`${ex.name} changed.`, () => {
      if (didSets) model.savePlanDay(day, beforeSlots);
      if (didPrefs) model.setExerciseState(slot.ex, { my_range: stNow?.my_range ?? null, my_weight_kg: stNow?.my_weight_kg ?? null, my_weight_at: stNow?.my_weight_at ?? null, my_weight_time: stNow?.my_weight_time ?? null });
    });
  };

  const weightBox = weighted ? stepper({
    label: "Weight", unit: "kg", value: draft.kg, min: 0, max: 1000, decimals: 2,
    next: (v, dir) => Math.max(0, v + dir * weightStepFor(slot.ex, v, doc.shared_settings)),
    onChange: (v) => { draft.kg = v; draft.kgTouched = true; },
  }) : null;
  if (weightBox && w.kg === null) { // the app has no weight yet: an empty box, not "0 kg" (0.6.0 minor)
    const box = weightBox.querySelector(".step-input");
    box.value = "";
    box.setAttribute("placeholder", "kg");
  }
  const hasOwnWeight = typeof stOld?.my_weight_kg === "number";
  const resetWeight = () => {
    try {
      if (workoutRunning(model.doc())) throw new Error(RUNNING_TEXT);
      model.setExercisePrefs(slot.ex, { weightKg: null });
    } catch (e) { toast(e.message); return; }
    closeSheets();
    rerender();
    undoToast(`${ex.name}: the app chooses the weight again.`, () => model.setExerciseState(slot.ex, { my_weight_kg: stOld.my_weight_kg, my_weight_at: stOld.my_weight_at ?? null, my_weight_time: stOld.my_weight_time ?? null }));
  };

  openSheet(
    h("h2", {}, `Change ${ex.name}`),
    h("div", { class: "lasts" }, icon("info", 18), h("p", {}, h("b", {}, `Sets: every ${dayName(day)}. `), "Reps and weight: this exercise on every day. Past workouts stay as they were.")),
    stepper({ label: `Sets on ${dayName(day)}`, value: draft.sets, step: 1, min: MIN_SETS, max: MAX_SETS, decimals: 0, onChange: (v) => { draft.sets = v; showWeek(); } }),
    weekLine,
    h("div", { class: "dose-pair" },
      stepper({ label: hold ? "Seconds, low" : "Reps, low", unit, value: draft.lo, step: hold ? 5 : 1, min: 1, max: 100, decimals: 0, onChange: (v) => { draft.lo = v; showRange(); } }),
      stepper({ label: hold ? "Seconds, high" : "Reps, high", unit, value: draft.hi, step: hold ? 5 : 1, min: 1, max: 100, decimals: 0, onChange: (v) => { draft.hi = v; showRange(); } })),
    rangeNote,
    weighted ? [
      weightBox,
      h("p", { class: "small muted" }, w.kg
        ? `The app says ${w.text}${w.note ? ` (${w.note})` : ""}. A weight you set here is used next time; after that the app counts up from what you log.`
        : "Set the weight you will start with. After your next workout the app counts up from what you log."),
      hasOwnWeight ? h("button", { class: "text-button", type: "button", onclick: resetWeight }, "Let the app choose the weight again") : null,
    ] : h("p", { class: "small muted" }, hold ? "A hold: no weight." : "Body weight: no weight to set."),
    h("button", { class: "button", type: "button", onclick: saveIt }, "Save"),
    h("button", { class: "button secondary", type: "button", onclick: () => closeSheets() }, "Cancel"));
}
