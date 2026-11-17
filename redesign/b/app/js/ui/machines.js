// Machine cards (Rosario's choice 55 a): what the machine looks like, the usual name on its sign, the gym area,
// and "Where it is in my gym": Rosario's own note, filled on the first visit and shown every time after.
// The note is a gym_spots record (model.setGymSpot): saved at once, synced and backed up like other records.
import { MAX_TEXT } from "../validate.js";
import { h } from "../h.js";
import { openSheet, machineMedia, exerciseMedia, section, group, row, chip, foot } from "./parts.js";
import { icon } from "./icons.js";
import { model, rerender } from "./app.js";
import { machines, AREAS, exercisesOn } from "../plan/machines.js";
import { exercises, days, DAY_IDS } from "../plan/plan-v2.js";

const QUICK = ["Front", "Back", "Left side", "Right side", "Middle", "Upstairs", "Downstairs", "By the mirrors", "By the windows", "Near the entrance"];

export function spotFor(doc, machineId) {
  const rec = (doc.gym_spots ?? []).find((r) => r.id === `g-${machineId}` && !r.deleted);
  return rec && rec.where ? rec.where : "";
}

// Exercises on this machine that the plan uses on a day (not swap-only), for "Used for".
function usedFor(machineId) {
  const inPlan = new Set(DAY_IDS.flatMap((d) => days[d].slots.map((s) => s.ex)));
  return exercisesOn(machineId).filter((id) => exercises[id]).sort((a, b) => Number(inPlan.has(b)) - Number(inPlan.has(a)));
}

// The "where" box: the note big and green when filled; an orange "not filled in yet" box with the editor when empty.
function spotEditor(machineId, { startOpen = false, onSaved = null } = {}) {
  const doc = model.doc();
  const saved = spotFor(doc, machineId);
  const box = h("div", {});
  let editing = startOpen || !saved;
  let text = saved;

  const draw = () => {
    if (!editing) {
      box.replaceChildren(
        h("div", { class: "spot-box" },
          h("div", { class: "label" }, "Where it is in my gym"),
          h("div", { class: "spot-text" }, saved)),
        h("div", { class: "text-link-row" }, h("button", { class: "text-button", type: "button", onclick: () => { editing = true; draw(); } }, "Change")));
      return;
    }
    const area = h("textarea", { id: `spot-${machineId}`, maxlength: MAX_TEXT, rows: 2, placeholder: "Back left, next to the mirrors", value: text, oninput: (e) => { text = e.target.value; } });
    box.replaceChildren(
      h("div", { class: `spot-box ${saved ? "" : "empty"}` },
        h("label", { class: "label", for: `spot-${machineId}` }, saved ? "Where it is in my gym" : "Where it is in my gym: not filled in yet"),
        h("p", { class: "small muted" }, "On your first visit, write where you found it. Tap a word to add it."),
        h("div", { class: "quick-spots" }, QUICK.map((q) => chip(q, () => { text = text.trim() ? `${text.trim()}, ${q.toLowerCase()}` : q; area.value = text; area.focus(); }))),
        area),
      h("button", { class: "button", type: "button", onclick: () => {
        model.setGymSpot(machineId, text);
        editing = false;
        if (onSaved) onSaved(); else rerender();
      } }, "Save where it is"));
  };
  draw();
  return box;
}

// The whole card (used in the sheet and could be used inline).
export function machineCard(machineId, opts = {}) {
  const m = machines[machineId];
  if (!m) return null;
  const used = usedFor(machineId);
  return h("div", {},
    machineMedia(m, "hero"),
    h("div", { class: "ex-head" },
      h("div", { class: "grow" },
        h("h2", { class: "title2" }, m.name),
        h("span", { class: "area-chip" }, icon("pin", 13, { stroke: 2.4 }), AREAS[m.area] ?? m.area))),
    section(null, group(
      row({ title: "Usual sign", value: m.sign }),
      row({ title: "Gym area", value: AREAS[m.area] ?? m.area })),
    foot(m.look)),
    spotEditor(machineId, opts),
    used.length ? section("Used for", group(used.map((id) => row({ title: exercises[id].name, sub: exercises[id].equipment, lead: exerciseMedia(id, exercises[id].name, "thumb") })))) : null);
}

export function openMachine(machineId, { afterSave = null } = {}) {
  const close = openSheet(machineCard(machineId, { onSaved: () => { close(); if (afterSave) afterSave(); else rerender(); } }));
  return close;
}

// The Machines list (Plan tab > Machines, and Settings > Gym). Grouped by gym area.
export function machinesList() {
  const doc = model.doc();
  const byArea = Object.keys(AREAS).map((area) => [area, Object.keys(machines).filter((id) => machines[id].area === area)]).filter(([, list]) => list.length);
  const filled = Object.keys(machines).filter((id) => spotFor(doc, id)).length;
  return [
    h("p", { class: "subhead muted" }, `Every machine and station in your plan. Write where each one is on your first visit: ${filled} of ${Object.keys(machines).length} done.`),
    byArea.map(([area, list]) => section(AREAS[area], group(list.map((id) => {
      const m = machines[id];
      const where = spotFor(doc, id);
      return row({
        title: m.name,
        sub: where ? `Where: ${where}` : `Sign: ${m.sign} · where not filled in yet`,
        lead: machineMedia(m, "thumb"),
        onclick: () => openMachine(id), chevron: true,
      });
    })))),
  ];
}
