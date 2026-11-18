// Plan edits (build step 4, docs/DESIGN.md 15.5; mock-up frames "Edit mode", "Swap sheet", "Add an exercise",
// "Changed day"): the Swap sheet, the Add sheet, Remove, the "Back to the plan's day" sheet and the Undo toast.
// All saves go through the step 3 model calls (swapPlanSlot, removePlanSlot, addPlanSlot, savePlanDay, resetPlanDay);
// each throws a plain-words Error when it is not allowed, and the message is shown in a toast, never a crash.
// All text through h(); no innerHTML; no style attributes.
import { h } from "../h.js";
import { openSheet, closeSheets, toast } from "./parts.js";
import { model, rerender } from "./app.js";
import { getActive } from "../active.js";
import { days, exercises } from "../plan/plan-v2.js";
import { thumb } from "./media.js";
import { icon } from "./icons.js";
import { miniMap } from "./bodymap.js";
import { viewDay, swapSheet, addSheet, exName, dayChanges, changedOn } from "../planview.js";

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

export function openAddSheet(day, week) {
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
      h("p", {}, h("b", {}, "Where it goes:"), ` at the end, after the abs, done on its own. ${a.setsThisWeek} sets this week (${a.setsNormal} in a normal week), ${a.rest} s rest. At most ${a.max} added exercises a day.`),
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
