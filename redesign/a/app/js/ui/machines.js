// Machines (redesign A, Rosario's choice 55 a): a card for every machine or station the plan uses, with a picture,
// the usual words on its sign, the gym area, and Rosario's own "Where it is in my gym" note (saved, synced, backed up).
// Route #/machines (no tab bar, Back at the top). The card also opens as a sheet from the exercise screens.
import { h } from "../h.js";
import { MAX_TEXT } from "../validate.js";
import { flowScreen, openSheet } from "./parts.js";
import { model, rerender } from "./app.js";
import { machines, machineOf, AREAS, exercisesOn } from "../plan/media.js";
import { flip, thumb, nameOf } from "./media.js";
import { icon } from "./icons.js";
import { stagger, onMount } from "./motion.js";

// The saved note of a machine ("" when none). A missing list (data from the old app) counts as empty.
export function whereOf(doc, machineId) {
  const rec = (doc.machine_notes ?? []).find((n) => n.id === `g-${machineId}` && !n.deleted);
  return rec ? rec.where : "";
}
export function machineFor(exerciseId) { return machineOf[exerciseId] ?? null; }

function checkText(doc, m) {
  if (!m.check) return null;
  const v = doc.shared_settings?.extra_machines?.[m.check];
  if (v === true) return h("span", { class: "check-yes" }, "Your gym has it");
  if (v === false) return h("span", { class: "check-no" }, "Your gym does not have it");
  return h("span", { class: "muted" }, "Not checked yet (first visit: Settings > Gym)");
}

// The machine card as a bottom sheet. `edit`: open with the note field ready (the one-tap "Add where it is").
export function openMachineCard(machineId, { edit = false, onSaved = null } = {}) {
  const m = machines[machineId];
  if (!m) return;
  const doc = model.doc();
  let where = whereOf(doc, machineId);
  let editing = edit || !where;
  const body = h("div", {});
  const area = AREAS[m.area];

  const draw = () => {
    const field = h("textarea", { id: "m-where", maxlength: MAX_TEXT, rows: 2, placeholder: "For example: upstairs, back left, next to the mirrors", value: where, oninput: (e) => { where = e.target.value; } });
    const save = () => {
      model.setMachineWhere(machineId, where.trim());
      where = where.trim();
      editing = false;
      draw();
      if (onSaved) onSaved();
    };
    body.replaceChildren(
      h("div", { class: "eyebrow accent" }, area.name),
      h("h2", {}, m.name),
      flip(m.photo, { cls: "big-flip", smooth: true, tag: true }),
      h("dl", { class: "kv" },
        h("dt", {}, "Sign says"), h("dd", {}, h("span", { class: "sign" }, m.sign)),
        h("dt", {}, "Area"), h("dd", {}, area.name),
        m.check ? h("dt", {}, "First visit") : null, m.check ? h("dd", {}, checkText(doc, m)) : null),
      h("p", { class: "small muted" }, `${m.look} ${area.hint}`),
      h("div", { class: "where-box" },
        h("div", { class: "eyebrow" }, "Where it is in my gym"),
        editing
          ? [h("label", { for: "m-where", class: "label" }, "Write where you found it, so you see it every time"), field,
            h("button", { class: "button", type: "button", onclick: save }, where.trim() ? "Save where it is" : "Save (empty)")]
          : [h("div", { class: "where-text" }, where),
            h("button", { class: "text-button", type: "button", onclick: () => { editing = true; draw(); onMount(() => document.getElementById("m-where")?.focus()); } }, "Change")]),
      h("div", { class: "eyebrow" }, "Used for"),
      h("ul", { class: "list-plain" }, exercisesOn(machineId).map((id) => h("li", {}, h("span", { class: "row" }, thumb(id, { small: true, still: true }), h("span", {}, nameOf(id)))))));
    if (editing) onMount(() => document.getElementById("m-where")?.focus());
  };
  draw();
  openSheet(body);
}

export function renderMachines() {
  const doc = model.doc();
  const groups = Object.keys(AREAS).map((areaId) => {
    const list = Object.entries(machines).filter(([, m]) => m.area === areaId);
    if (!list.length) return null;
    return [
      h("div", { class: "area-head" }, h("span", { class: "area-icon" }, icon(areaId, 20)), h("h2", {}, AREAS[areaId].name)),
      h("div", { class: "card" }, list.map(([id, m]) => {
        const where = whereOf(doc, id);
        return h("button", { class: "mach-row", type: "button", onclick: () => openMachineCard(id, { onSaved: rerender }) },
          thumb(m.photo, { still: true }),
          h("span", { class: "grow" },
            h("b", {}, m.name),
            h("span", { class: `small ${where ? "" : "muted"}` }, icon("pin", 15), where || "Tap to add where it is")),
          h("span", { class: "muted" }, icon("chevron", 18)));
      })),
    ];
  });
  const filled = Object.keys(machines).filter((id) => whereOf(doc, id)).length;
  const main = flowScreen(
    h("a", { href: "#/plan", class: "text-button", "aria-label": "Back to the plan" }, icon("back", 18), " Back"),
    h("span", { class: "eyebrow accent" }, "The Gym Group York Foss Island"),
    h("h1", {}, "Machines"),
    h("p", { class: "muted" }, `What each machine looks like, the word on its sign, and where it is. ${filled} of ${Object.keys(machines).length} have your "where" note.`),
    groups);
  onMount(() => stagger(main.querySelectorAll(".mach-row")));
  return main;
}
