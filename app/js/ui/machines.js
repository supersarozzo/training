// Gym tab and machine cards (Rosario's choice 55 a; merge plan redesign/JUDGING.md 3.2 "Machines list and card").
// - Gym tab (builder C): every machine and station the plan uses, grouped by gym area, with C's "x of 15 noted" counter.
//   Machines the first visit said the gym does not have (shared_settings.extra_machines = false) are hidden (builder D).
// - Machine card (builder B): picture, the USUAL sign name with D's caveat (never stated as fact), the area, one set-up
//   tip (D), and Rosario's own "Where it is in my gym" note with B's quick-word chips. The note is a gym_spots record
//   (model.setGymSpot): saved at once, synced and backed up like other records. The card never opens the keyboard by
//   itself (JUDGING.md 3.6 item 5). All text goes in through h(), never innerHTML.
import { h } from "../h.js";
import { MAX_TEXT } from "../validate.js";
import { screen, openSheet } from "./parts.js";
import { model, rerender } from "./app.js";
import { machines, machineOf, AREAS, AREA_ORDER, SIGN_CAVEAT, exercisesOn } from "../plan/media.js";
import { gymSpotId } from "../ids.js";
import { flip, thumb, nameOf } from "./media.js";
import { icon } from "./icons.js";
import { stagger, onMount } from "./motion.js";
import { exerciseGroups } from "./gymexercises.js";

const QUICK = ["Front", "Back", "Left side", "Right side", "Middle", "Upstairs", "Downstairs", "By the mirrors", "By the windows", "Near the entrance"];

// The saved note of a machine ("" when none). A missing list (data from the old app) counts as empty.
export function whereOf(doc, machineId) {
  const rec = (doc.gym_spots ?? []).find((n) => n.id === gymSpotId(machineId) && !n.deleted);
  return rec && typeof rec.where === "string" ? rec.where : "";
}
export function machineFor(exerciseId) { return machineOf[exerciseId] ?? null; }

// false only when the first visit said the gym does not have this extra machine.
function inGym(doc, m) {
  return !m.check || doc.shared_settings?.extra_machines?.[m.check] !== false;
}
function visibleMachines(doc) {
  return Object.keys(machines).filter((id) => inGym(doc, machines[id]));
}

function checkText(doc, m) {
  if (!m.check) return null;
  const v = doc.shared_settings?.extra_machines?.[m.check];
  if (v === true) return h("span", { class: "check-yes" }, "Your gym has it");
  if (v === false) return h("span", { class: "check-no" }, "Your gym does not have it");
  return h("span", { class: "muted" }, "Not checked yet (first visit: Settings > Gym weights)");
}

// The machine card as a bottom sheet. `edit`: open with the note editor shown (the one-tap "Add where it is"); the
// keyboard still waits for a tap in the box.
export function openMachineCard(machineId, { edit = false, onSaved = null } = {}) {
  const m = machines[machineId];
  if (!m) return;
  const doc = model.doc();
  let saved = whereOf(doc, machineId);
  let text = saved;
  let editing = edit || !saved;
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
    const addWord = (q) => {
      text = text.trim() ? `${text.trim()}, ${q.toLowerCase()}` : q;
      field.value = text.slice(0, MAX_TEXT);
      text = field.value;
    };
    whereBox.replaceChildren(h("div", { class: `where-box ${saved ? "" : "empty"}` },
      h("label", { for: "m-where", class: "eyebrow" }, icon("pin", 15), saved ? " Where it is in my gym" : " Where it is in my gym: not noted yet"),
      h("p", { class: "small muted" }, "On your first visit, write where you found it. Tap a word to add it."),
      h("div", { class: "quick-spots" }, QUICK.map((q) => h("button", { class: "chip", type: "button", onclick: () => addWord(q) }, q))),
      field,
      h("button", { class: "button", type: "button", onclick: () => {
        model.setGymSpot(machineId, text);
        saved = whereOf(model.doc(), machineId);
        text = saved;
        editing = false;
        drawWhere();
        if (onSaved) onSaved();
      } }, "Save where it is")));
  };
  drawWhere();

  const used = exercisesOn(machineId);
  openSheet(
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
    used.length ? h("ul", { class: "list-plain" }, used.map((id) => h("li", {}, h("span", { class: "row" }, thumb(id, { small: true }), h("span", {}, nameOf(id)))))) : null);
}

// The Gym tab: one switch, Machines | Exercises (build step 2, docs/DESIGN.md 15.7). Machines: the 0.4.1 list and
// cards, word for word; the machines the first visit said the gym does not have stay hidden, with one line that names
// them and opens their cards (so the old Plan tab's full Machines list loses nothing). Exercises: gymexercises.js.
let part = "machines";

function machineGroups(doc) {
  const ids = visibleMachines(doc);
  const noted = ids.filter((id) => whereOf(doc, id)).length;
  const hidden = Object.keys(machines).filter((id) => !inGym(doc, machines[id]));
  const groups = AREA_ORDER.map((areaId) => {
    const list = ids.filter((id) => machines[id].area === areaId);
    if (!list.length) return null;
    return [
      h("div", { class: "area-head" }, h("span", { class: "area-icon" }, icon(areaId, 20)), h("h2", {}, AREAS[areaId].name), h("span", { class: "badge" }, String(list.length))),
      h("div", { class: "card" }, list.map((id) => {
        const m = machines[id];
        const where = whereOf(doc, id);
        return h("button", { class: "mach-row", type: "button", onclick: () => openMachineCard(id, { onSaved: rerender }) },
          thumb(m.photo),
          h("span", { class: "grow" },
            h("b", {}, m.name),
            h("span", { class: "small muted" }, `Usual sign: ${m.sign}`),
            where
              ? h("span", { class: "small where-line" }, icon("pin", 15), h("span", { class: "ellipsis" }, where))
              : h("span", { class: "small add-where" }, icon("plus", 15), "Add where it is")),
          h("span", { class: "muted" }, icon("chevron", 18)));
      })),
    ];
  });
  const pct = ids.length ? Math.round((noted / ids.length) * 100) : 0;
  const bar = h("div", { class: "noted-bar", role: "img", "aria-label": `${noted} of ${ids.length} noted` }, h("span", {}));
  bar.firstChild.style.width = `${pct}%`;
  return [
    h("p", { class: "muted" }, "What each one looks like, the usual name on its sign, and where it is in your gym."),
    h("div", { class: "card noted" },
      h("div", { class: "noted-count" }, h("span", { class: "big-num" }, String(noted)), h("span", { class: "muted" }, ` of ${ids.length} noted`)),
      bar,
      h("p", { class: "small muted" }, noted < ids.length ? "Add where each one is on your first visit." : "Every machine has your note.")),
    groups,
    hidden.length ? h("p", { class: "small muted hidden-machines" }, "Not in your gym (first visit): ",
      hidden.map((id, n) => [n ? ", " : "", h("button", { class: "text-button inline", type: "button", onclick: () => openMachineCard(id, { onSaved: rerender }) }, machines[id].name)]), ".") : null,
  ];
}

export function renderGym() {
  const doc = model.doc();
  const pick = (v) => { part = v; rerender(); };
  const main = screen(
    h("div", { class: "gym-head" }, h("span", { class: "eyebrow accent" }, "My gym"), h("h1", {}, "Gym")),
    h("div", { class: "segmented two", role: "tablist", "aria-label": "Part of the gym" },
      [["machines", "Machines"], ["exercises", "Exercises"]].map(([value, label]) =>
        h("button", { type: "button", role: "tab", "aria-selected": value === part ? "true" : "false", onclick: () => pick(value) }, label))),
    part === "exercises" ? exerciseGroups() : machineGroups(doc));
  onMount(() => stagger(main.querySelectorAll(".mach-row")));
  return main;
}
