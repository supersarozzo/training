// Swap an exercise: "Machine busy", "Don't like it", "It hurts" (WORKFLOW D5).
// Redesign B: the reasons and the swaps are inset lists in the sheet (an icon per reason, a photo per swap). Same steps.
import { MAX_TEXT } from "../validate.js";
import { h } from "../h.js";
import { openSheet, group, row, iconTile, exerciseMedia } from "./parts.js";
import { model, rerender } from "./app.js";
import { exercises } from "../plan/plan-v2.js";
import { lighterFor, workSets } from "../engine/workout.js";

const REASONS = [["busy", "Machine busy", "clock", ""], ["dislike", "Don't like it", "swap", "orange"], ["hurts", "It hurts", "info", "red"]];

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
    group(REASONS.map(([id, label, iconName, color]) => row({ title: label, lead: iconTile(iconName, color), onclick: () => choose(id), chevron: true }))));

  const choose = (reason) => {
    const options = swapChoices(rec, ctx.settings);
    let note = "";
    const hurts = reason === "hurts";
    const list = h("div", { class: "group" });
    const noteBox = hurts ? h("textarea", { id: "swap-note", maxlength: MAX_TEXT, "aria-label": "What hurts?", placeholder: "What hurts? Where?", oninput: (e) => { note = e.target.value.trim(); } }) : null;
    const go = (id) => {
      if (hurts && !note) { warn.textContent = "Write a short note first, so you remember what hurt."; return; }
      const last = workSets(rec).slice(-1)[0];
      const orig = last?.weight_kg ?? ctx.sugg(rec.done_exercise).weight_kg ?? 0;
      const own = ctx.sugg(id).last;
      const startKg = hurts && !own ? lighterFor(id, orig, ctx.settings) : null;
      model.swapExercise(ctx.session.id, rec.slot, id, reason, note, startKg);
      document.querySelectorAll("[data-sheet]").forEach((el) => el.remove());
      rerender();
    };
    const warn = h("div", { class: "error-text", role: "alert" }, "");
    options.forEach((id) => {
      const ex = exercises[id];
      list.append(row({ title: ex.name, sub: ex.equipment, lead: exerciseMedia(id, ex.name, "thumb"), onclick: () => go(id), chevron: true }));
    });
    openSheet(
      h("h2", {}, hurts ? "Stop this exercise" : "Pick a swap"),
      hurts ? h("div", { class: "card warn" }, h("p", {}, "Stop now. Joint pain is not normal. The swap starts with a lighter weight. Write down what hurt.")) : null,
      noteBox, warn,
      options.length ? list : h("p", { class: "muted" }, "No swap is available for this exercise."),
      h("button", { class: "button gray", type: "button", onclick: reasons }, "Back"));
  };
  reasons();
}
