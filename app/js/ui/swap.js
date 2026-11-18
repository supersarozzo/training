// Swap an exercise: "Machine busy", "Don't like it", "It hurts" (WORKFLOW D5).
// Look from builder B (redesign/JUDGING.md 3.2): the reasons and the swaps are lists of 44 px+ rows in the sheet, a
// coloured icon per reason (always with its word), a photo per swap. The steps and the data saved are unchanged.
import { MAX_TEXT } from "../validate.js";
import { h } from "../h.js";
import { openSheet } from "./parts.js";
import { model, rerender } from "./app.js";
import { exercises } from "../plan/plan-v2.js";
import { painSwapStart, workSets } from "../engine/workout.js";
import { thumb } from "./media.js";
import { icon } from "./icons.js";

const REASONS = [["busy", "Machine busy"], ["dislike", "Don't like it"], ["hurts", "It hurts"]];
const row = (lead, title, sub, onclick) => h("button", { class: "mach-row", type: "button", onclick },
  lead, h("span", { class: "grow" }, h("b", {}, title), sub ? h("span", { class: "small muted" }, sub) : null), h("span", { class: "muted" }, icon("chevron", 18)));

// Swaps for a slot: the plan's swaps, plus the planned exercise itself when something else is being done now.
// An extra machine (question 17) only shows once the first visit found it.
export function swapChoices(rec, settings) {
  const planned = exercises[rec.plan_exercise];
  const ids = planned.swaps.filter((s) => !s.needsMachine || settings?.extra_machines?.[s.needsMachine] === true).map((s) => s.id);
  if (rec.done_exercise !== rec.plan_exercise) ids.unshift(rec.plan_exercise);
  return ids.filter((id) => id !== rec.done_exercise && exercises[id]);
}

export function openSwap(ctx, rec) {
  const reasons = () => openSheet(
    h("h2", {}, "Swap this exercise"),
    h("p", { class: "muted" }, "Why do you want to swap?"),
    h("div", { class: "card" }, REASONS.map(([id, label]) => row(h("span", { class: `reason-icon ${id}` }, icon(id, 22)), label, null, () => choose(id)))));

  const choose = (reason) => {
    const options = swapChoices(rec, ctx.settings);
    let note = "";
    const hurts = reason === "hurts";
    const list = h("div", { class: "card" });
    const noteBox = hurts ? h("textarea", { id: "swap-note", maxlength: MAX_TEXT, "aria-label": "What hurts?", placeholder: "What hurts? Where?", oninput: (e) => { note = e.target.value.trim(); } }) : null;
    const go = (id) => {
      if (hurts && !note) { warn.textContent = "Write a short note first, so you remember what hurt."; return; }
      const last = workSets(rec).slice(-1)[0];
      const startKg = hurts ? painSwapStart(id, { lastWorkKg: last?.weight_kg, origSugg: ctx.sugg(rec.done_exercise), newSugg: ctx.sugg(id) }, ctx.settings) : null;
      model.swapExercise(ctx.session.id, rec.slot, id, reason, note, startKg);
      document.querySelectorAll("[data-sheet]").forEach((el) => el.remove());
      rerender();
    };
    const warn = h("div", { class: "error-text", role: "alert" }, "");
    options.forEach((id) => {
      const ex = exercises[id];
      list.append(row(thumb(id, { small: true }), ex.name, ex.equipment, () => go(id)));
    });
    openSheet(
      h("h2", {}, hurts ? "Stop this exercise" : "Pick a swap"),
      hurts ? h("div", { class: "card warn" }, h("p", {}, "Stop now. Joint pain is not normal. The swap starts with a lighter weight. Write down what hurt.")) : null,
      noteBox, warn,
      options.length ? list : h("p", { class: "muted" }, "No swap is available for this exercise."),
      h("button", { class: "button secondary", type: "button", onclick: reasons }, "Back"));
  };
  reasons();
}
