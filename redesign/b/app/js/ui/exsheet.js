// The exercise sheet: how the move looks (looping photos), form tips, "Watch video", the machine cards and the
// machine settings note (seat height, pin). Opened from the exercise screen, warm-up, Plan > Exercises.
import { MAX_TEXT } from "../validate.js";
import { h } from "../h.js";
import { openSheet, exerciseMedia, machineMedia, section, group, row } from "./parts.js";
import { icon } from "./icons.js";
import { model, rerender } from "./app.js";
import { exercises } from "../plan/plan-v2.js";
import { cues } from "../plan/cues.js";
import { photoNote, videoFor } from "../plan/media.js";
import { machines, machinesFor } from "../plan/machines.js";
import { openMachine, spotFor } from "./machines.js";

// A plain link out to Safari (no embed, no third-party script on our page).
export function videoButton(id, label = "Watch video") {
  const v = videoFor(id);
  if (!v) return null;
  return h("a", { class: "button secondary", href: v.url, target: "_blank", rel: "noopener noreferrer" },
    icon("play", 18), label, h("span", { class: "small", "aria-hidden": "true" }, ` · ${v.channel}`));
}

function machineRows(exId, reopen) {
  const doc = model.doc();
  const list = machinesFor(exId);
  if (!list.length) return null;
  return section(list.length === 1 ? "Machine" : "Machines and stations", group(list.map((mid) => {
    const m = machines[mid];
    const where = spotFor(doc, mid);
    return row({
      title: m.name, sub: where ? `Where: ${where}` : "Where it is: not filled in yet", lead: machineMedia(m, "thumb"),
      onclick: () => openMachine(mid, { afterSave: reopen }), chevron: true,
    });
  })));
}

// name/cue for warm-up moves (not in the exercise list) can be passed in.
export function openExercise(exId, { name = null, cue = null, editNote = false, after = null } = {}) {
  const ex = exercises[exId];
  const title = name ?? ex?.name ?? exId;
  const reopen = () => { openExercise(exId, { name, cue, editNote, after }); };
  let note = editNote ? (model.doc().exercise_state.find((x) => x.id === `x-${exId}` && !x.deleted)?.machine_note ?? "") : "";
  const close = openSheet(
    exerciseMedia(exId, title, "hero"),
    photoNote[exId] ? h("p", { class: "media-caption" }, photoNote[exId]) : null,
    h("div", { class: "ex-head" }, h("div", { class: "grow" },
      h("h2", { class: "title2" }, title),
      ex ? h("div", { class: "subhead muted" }, ex.equipment) : null)),
    h("div", { class: "card" },
      h("div", { class: "card-title" }, icon("info", 18), "How to do it"),
      h("p", { class: "callout" }, cue ?? cues[exId] ?? "Move slowly and keep good form.")),
    videoButton(exId),
    h("div", { class: "section" }),
    machineRows(exId, reopen),
    editNote ? section("My machine settings",
      h("div", { class: "field" },
        h("label", { for: "machine-note" }, "Seat height, pin, handle position"),
        h("textarea", { id: "machine-note", maxlength: MAX_TEXT, oninput: (e) => { note = e.target.value; }, value: note })),
      h("button", { class: "button", type: "button", onclick: () => { model.setExerciseState(exId, { machine_note: note.trim() }); close(); if (after) after(); else rerender(); } }, "Save settings")) : null);
  return close;
}
