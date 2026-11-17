// Gym tab: Machines (moved from the old Plan tab's Machines part; the app's Gym tab already had the same cards) and
// Exercises (moved from the old Plan tab's Exercises part). Copied from app/js/ui/machines.js, with the prototype store.
// The where-note is a gym_spots record, saved at once (as model.setGymSpot does). All text through h(), never innerHTML.
import { h } from "./app/h.js";
import { icon } from "./app/icons.js";
import { machines, AREAS, AREA_ORDER, SIGN_CAVEAT, exercisesOn } from "./app/plan-media.js";
import { exercises, days } from "./app/plan-v2.js";
import { stagger, onMount } from "./app/motion.js";
import { loadDoc, update } from "./store.js";
import { flip, thumb, nameOf } from "./media-ui.js";
import { openSheet, screen, head, segmented, rerender } from "./ui.js";
import { EX_MUSCLES, GROUPS, EQUIP, names } from "./data/muscles.js";
import { bodyMap, bestView } from "./bodymap.js";
import { exerciseLevels, baseSlots, DAY_IDS, repText } from "./planlogic.js";

const MAX_TEXT = 2000;
const QUICK = ["Front", "Back", "Left side", "Right side", "Middle", "Upstairs", "Downstairs", "By the mirrors", "By the windows", "Near the entrance"];
const spotId = (mid) => `g-${mid}`;

export function whereOf(doc, machineId) {
  const rec = (doc.gym_spots ?? []).find((n) => n.id === spotId(machineId) && !n.deleted);
  return rec && typeof rec.where === "string" ? rec.where : "";
}
function setSpot(machineId, text) {
  update((doc, t) => {
    doc.gym_spots = doc.gym_spots ?? [];
    const clean = String(text).trim().slice(0, MAX_TEXT);
    const rec = doc.gym_spots.find((n) => n.id === spotId(machineId));
    if (rec) Object.assign(rec, { where: clean, updated_at: t, deleted: undefined });
    else doc.gym_spots.push({ id: spotId(machineId), updated_at: t, where: clean });
  });
}
const inGym = (doc, m) => !m.check || doc.shared_settings?.extra_machines?.[m.check] !== false;
function checkText(doc, m) {
  if (!m.check) return null;
  const v = doc.shared_settings?.extra_machines?.[m.check];
  if (v === true) return h("span", { class: "check-yes" }, "Your gym has it");
  if (v === false) return h("span", { class: "check-no" }, "Your gym does not have it");
  return h("span", { class: "muted" }, "Not checked yet (first visit: Settings > Gym)");
}

export function openMachineCard(machineId, { onSaved = null } = {}) {
  const m = machines[machineId];
  if (!m) return;
  const doc = loadDoc();
  let saved = whereOf(doc, machineId);
  let text = saved;
  let editing = !saved;
  const area = AREAS[m.area];
  const whereBox = h("div", {});
  const drawWhere = () => {
    if (!editing) {
      whereBox.replaceChildren(h("div", { class: "where-box" },
        h("div", { class: "eyebrow" }, icon("pin", 15), " Where it is in my gym"),
        h("div", { class: "where-text" }, saved),
        h("button", { class: "text-button", type: "button", onclick: () => { editing = true; drawWhere(); } }, "Change")));
      return;
    }
    const field = h("textarea", { id: "m-where", maxlength: MAX_TEXT, rows: 2, placeholder: "For example: upstairs, back left, by the mirrors", value: text, oninput: (e) => { text = e.target.value; } });
    const addWord = (q) => { text = text.trim() ? `${text.trim()}, ${q.toLowerCase()}` : q; field.value = text.slice(0, MAX_TEXT); text = field.value; };
    whereBox.replaceChildren(h("div", { class: `where-box ${saved ? "" : "empty"}` },
      h("label", { for: "m-where", class: "eyebrow" }, icon("pin", 15), saved ? " Where it is in my gym" : " Where it is in my gym: not noted yet"),
      h("p", { class: "small muted" }, "On your first visit, write where you found it. Tap a word to add it."),
      h("div", { class: "quick-spots" }, QUICK.map((q) => h("button", { class: "chip", type: "button", onclick: () => addWord(q) }, q))),
      field,
      h("button", { class: "button", type: "button", onclick: () => { setSpot(machineId, text); saved = whereOf(loadDoc(), machineId); text = saved; editing = false; drawWhere(); if (onSaved) onSaved(); } }, "Save where it is")));
  };
  drawWhere();
  const used = exercisesOn(machineId).filter((id) => exercises[id] || id === "uphill_walk");
  openSheet([
    h("div", { class: "eyebrow accent" }, area.name),
    h("h2", {}, m.name),
    flip(m.photo, { cls: "big-flip", tag: true }),
    h("dl", { class: "kv" },
      h("dt", {}, "Usual sign"), h("dd", {}, h("span", { class: "sign" }, m.sign)),
      h("dt", {}, "Usual area"), h("dd", {}, area.name),
      m.check ? h("dt", {}, "First visit") : null, m.check ? h("dd", {}, checkText(doc, m)) : null),
    h("p", { class: "small muted caveat" }, icon("info", 15), " ", SIGN_CAVEAT),
    m.tip ? h("p", { class: "tip" }, h("b", {}, "Tip: "), m.tip) : null,
    h("p", { class: "small muted" }, `${m.look} ${area.hint}`),
    whereBox,
    used.length ? h("div", { class: "eyebrow" }, "Used for") : null,
    used.length ? h("ul", { class: "list-plain" }, used.map((id) => h("li", {}, h("span", { class: "row" }, thumb(id, { small: true }), h("span", {}, nameOf(id)))))) : null,
  ], { label: "Machine" });
}

let part = "machines";
let filter = "all";

function machineList(doc) {
  const ids = Object.keys(machines).filter((id) => inGym(doc, machines[id]));
  const noted = ids.filter((id) => whereOf(doc, id)).length;
  const bar = h("div", { class: "noted-bar", role: "img", "aria-label": `${noted} of ${ids.length} noted` }, h("span", {}));
  bar.firstChild.style.width = `${ids.length ? Math.round((noted / ids.length) * 100) : 0}%`;
  return [
    h("p", { class: "muted" }, "What each one looks like, the usual name on its sign, and where it is in your gym."),
    h("div", { class: "card noted" },
      h("div", { class: "noted-count" }, h("span", { class: "big-num" }, String(noted)), h("span", { class: "muted" }, ` of ${ids.length} noted`)),
      bar, h("p", { class: "small muted" }, noted < ids.length ? "Add where each one is on your first visit." : "Every machine has your note.")),
    AREA_ORDER.map((areaId) => {
      const list = ids.filter((id) => machines[id].area === areaId);
      if (!list.length) return null;
      return [
        h("div", { class: "area-head" }, h("span", { class: "area-icon" }, icon(areaId, 20)), h("h2", {}, AREAS[areaId].name), h("span", { class: "badge" }, String(list.length))),
        h("div", { class: "card" }, list.map((id) => {
          const m = machines[id];
          const where = whereOf(doc, id);
          return h("button", { class: "mach-row", type: "button", onclick: () => openMachineCard(id, { onSaved: rerender }) },
            thumb(m.photo),
            h("span", { class: "grow" }, h("b", {}, m.name), h("span", { class: "small muted" }, `Usual sign: ${m.sign}`),
              where ? h("span", { class: "small where-line" }, icon("pin", 15), h("span", { class: "ellipsis" }, where)) : h("span", { class: "small add-where" }, icon("plus", 15), "Add where it is")),
            h("span", { class: "muted" }, icon("chevron", 18)));
        })),
      ];
    }),
  ];
}

const FILTERS = [["all", "All"], ["chest", "Chest"], ["back", "Back"], ["shoulders", "Shoulders"], ["arms", "Arms"], ["legs", "Legs"], ["abs", "Abs"]];
const FILTER_GROUPS = { chest: ["chest"], back: ["lats", "mid_back"], shoulders: ["front_delts", "side_delts", "rear_delts"], arms: ["biceps", "triceps"], legs: ["quads", "hamstrings", "glutes", "calves"], abs: ["abs"] };

function exerciseList(doc, openLayer) {
  const ids = Object.keys(exercises).filter((id) => filter === "all" || EX_MUSCLES[id].p.some((g) => FILTER_GROUPS[filter].includes(g)))
    .sort((a, b) => exercises[a].name.localeCompare(exercises[b].name));
  const usedDays = (id) => DAY_IDS.filter((d) => baseSlots(doc, d).some((s) => s.ex === id)).map((d) => days[d].name.slice(0, 3));
  return [
    h("p", { class: "muted" }, "Every exercise in the plan and its swaps. Tap one for pictures, tips and the muscles it works."),
    h("div", { class: "chips filter-chips", role: "group", "aria-label": "Show exercises for" }, FILTERS.map(([v, label]) =>
      h("button", { class: `chip ${filter === v ? "accent" : ""}`, type: "button", "aria-pressed": filter === v ? "true" : "false", onclick: () => { filter = v; rerender(); } }, label))),
    h("div", { class: "card" }, ids.map((id) => {
      const lv = exerciseLevels(id);
      const used = usedDays(id);
      return h("button", { class: "mach-row", type: "button", onclick: () => openLayer(id) },
        thumb(id, { small: true }),
        h("span", { class: "grow" }, h("b", {}, exercises[id].name),
          h("span", { class: "small muted" }, `${EQUIP[EX_MUSCLES[id].equip].name} · ${names(EX_MUSCLES[id].p).join(", ")}`),
          h("span", { class: `small ${used.length ? "accent-words" : "muted"}` }, used.length ? `In the plan: ${used.join(", ")}` : "Swap only")),
        bodyMap(lv, { view: bestView(lv), cls: "mini", label: `Works ${names(EX_MUSCLES[id].p).join(", ")}` }));
    })),
  ];
}

export function renderGym(openLayer) {
  const doc = loadDoc();
  const main = screen(
    head("My gym", "Gym"),
    segmented([["machines", "Machines"], ["exercises", "Exercises"]], part, (v) => { part = v; rerender(); }, "Part of the Gym tab"),
    part === "machines" ? machineList(doc) : exerciseList(doc, openLayer));
  onMount(() => stagger(main.querySelectorAll(".mach-row")));
  return main;
}
export { repText, GROUPS };
