// Exercise info sheet (redesign A): the moving picture, the form tips, the "Watch video" link, the machine card,
// and the machine settings note (seat height, pin) that the old Tips sheet had. Nothing of the old sheet is lost.
import { h } from "../h.js";
import { MAX_TEXT } from "../validate.js";
import { openSheet, closeSheets } from "./parts.js";
import { model, rerender } from "./app.js";
import { exercises } from "../plan/plan-v2.js";
import { cues } from "../plan/cues.js";
import { videoFor, machines, AREAS } from "../plan/media.js";
import { flip, photoPair, nameOf } from "./media.js";
import { icon } from "./icons.js";
import { openMachineCard, whereOf, machineFor } from "./machines.js";

// The "Watch video" link: opens Safari (a plain link; no embed, no third-party script on our page).
export function videoButton(id, { chip = false } = {}) {
  const v = videoFor(id);
  if (!v) return null;
  return h("a", { class: chip ? "chip" : "button secondary", href: v.url, target: "_blank", rel: "noopener noreferrer", "aria-label": `Watch a form video of ${nameOf(id)} (opens Safari)` },
    icon("play", chip ? 16 : 18, { fill: true, strokeWidth: 0 }), chip ? "Video" : "Watch video", chip ? null : icon("external", 16));
}

// A one-line machine row that opens the machine card.
export function machineRow(exId, { onSaved = rerender } = {}) {
  const mid = machineFor(exId);
  const m = mid && machines[mid];
  if (!m) return null;
  const where = whereOf(model.doc(), mid);
  return h("button", { class: "mach-row", type: "button", onclick: () => openMachineCard(mid, { onSaved }) },
    h("span", { class: "area-icon" }, icon(m.area, 20)),
    h("span", { class: "grow" }, h("b", {}, m.name),
      h("span", { class: `small ${where ? "" : "muted"}` }, icon("pin", 15), where ? where : `${AREAS[m.area].name} · add where it is`)),
    h("span", { class: "muted" }, icon("chevron", 18)));
}

// `settingsNote`: show the seat/pin note editor (exercise screens). Off for warm-up moves.
export function openExerciseInfo(exId, { settingsNote = true, state = null } = {}) {
  const ex = exercises[exId];
  let note = state?.machine_note ?? "";
  const video = videoFor(exId);
  openSheet(
    h("div", { class: "eyebrow accent" }, ex ? ex.equipment : "Warm-up move"),
    h("h2", {}, nameOf(exId)),
    flip(exId, { cls: "big-flip", smooth: true, tag: true }),
    photoPair(exId),
    h("h3", {}, "How to do it"),
    h("p", {}, cues[exId] ?? (exId === "uphill_walk" ? cues.uphill_walk : "Move slowly and keep good form.")),
    videoButton(exId),
    video ? h("p", { class: "small muted" }, `Video: ${video.title} (${video.channel}). Opens in Safari; needs signal.`) : null,
    h("h3", {}, "Machine"),
    h("div", { class: "card" }, machineRow(exId, { onSaved: () => { closeSheets(); rerender(); } })),
    settingsNote && ex ? [
      h("div", { class: "field" },
        h("label", { for: "machine-note" }, "Machine settings note (seat height, pin)"),
        h("textarea", { id: "machine-note", maxlength: MAX_TEXT, oninput: (e) => { note = e.target.value; }, value: note })),
      h("button", { class: "button", type: "button", onclick: () => { model.setExerciseState(exId, { machine_note: note.trim() }); closeSheets(); rerender(); } }, "Save note"),
    ] : null);
}
