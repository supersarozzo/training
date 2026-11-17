// Machine card (Rosario's choice 55 a): what it looks like, the usual name on its sign, the gym area, which exercises
// use it, and the "Where it is in my gym" note. The note is saved data (machine_spots): it syncs and backs up.
// Opened as a sheet from the exercise screen (chip "Machine") and from the Gym tab.
import { MAX_TEXT } from "../validate.js";
import { h } from "../h.js";
import { openSheet } from "./parts.js";
import { model, rerender } from "./app.js";
import { machines, AREAS, exercisesOn, spotFor } from "../plan/machines.js";
import { exercises } from "../plan/plan-v2.js";
import { videoFor } from "../plan/videos.js";
import { demo } from "./demo.js";
import { icon } from "./icons.js";

const QUICK = ["By the entrance", "Upstairs", "Downstairs", "Back wall", "Next to the mirrors", "Near the cables", "Near the free weights", "By the treadmills"];
const EXTRA_TEXT = { true: "The gym has it", false: "The gym does not have it", null: "Not checked yet (first visit)" };

export function openMachine(machineId, { edit = false } = {}) {
  const m = machines[machineId];
  if (!m) return;
  const doc = model.doc();
  const where = spotFor(doc, machineId);
  const used = exercisesOn(machineId).map((id) => exercises[id].name);
  let draft = where;

  const save = () => {
    model.setMachineSpot(machineId, draft);
    close();
    rerender();
  };
  const editor = () => {
    const area = h("textarea", { id: "where-note", maxlength: MAX_TEXT, placeholder: "For example: upstairs, back left, next to the mirrors", value: draft, oninput: (e) => { draft = e.target.value; } });
    const box = h("div", { class: "where-box" },
      h("label", { class: "label", for: "where-note" }, "Where it is in my gym"),
      h("div", { class: "quick" }, QUICK.map((q) => h("button", { class: "chip", type: "button", onclick: () => { draft = draft.trim() ? `${draft.trim()}, ${q.toLowerCase()}` : q; area.value = draft; } }, q))),
      area,
      h("button", { class: "button", type: "button", onclick: save, style: null }, "Save where it is"));
    setTimeout(() => { try { area.focus({ preventScroll: true }); } catch { /* old browser */ } }, 360);
    return box;
  };
  const shown = () => h("div", { class: "where-box" },
    h("span", { class: "eyebrow brand" }, "Where it is in my gym"),
    h("div", { class: "where-text" }, where),
    h("button", { class: "button soft", type: "button", onclick: () => slot.replaceChildren(editor()) }, "Change"));
  const empty = () => h("div", { class: "where-box" },
    h("span", { class: "eyebrow brand" }, "Where it is in my gym"),
    h("p", { class: "small" }, "Not saved yet. Find it on your first visit, then add one line. You will see it every time after."),
    h("button", { class: "button", type: "button", onclick: () => slot.replaceChildren(editor()) }, icon("pin"), "Add where it is"));
  const slot = h("div", {}, edit ? editor() : where ? shown() : empty());

  const video = videoFor(m.photo);
  const close = openSheet(
    h("div", { class: "machine-card" },
      demo(m.photo),
      h("span", { class: "eyebrow" }, AREAS[m.area]),
      h("h2", {}, m.name),
      h("div", { class: "chips" },
        h("span", { class: "tag brand" }, `Sign: ${m.sign}`),
        m.extra ? h("span", { class: "tag" }, EXTRA_TEXT[String(doc.shared_settings?.extra_machines?.[m.extra] ?? null)]) : null),
      slot,
      h("h3", {}, "What it looks like"),
      h("p", {}, m.look),
      h("p", { class: "small muted" }, `Tip: ${m.tip}`),
      used.length ? [h("h3", {}, "Used for"), h("ul", { class: "list-plain" }, used.map((n) => h("li", {}, n)))] : null,
      video ? h("a", { class: "button secondary", href: video.url, target: "_blank", rel: "noopener noreferrer" }, icon("video"), `Watch how to use it (${video.source})`) : null,
      h("p", { class: "small muted" }, "The sign name is the usual name in UK gyms. Your gym's sign may differ a little.")));
}
