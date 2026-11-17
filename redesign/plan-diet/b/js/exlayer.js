// The exercise layer: what opens when an exercise card is tapped. Builder B's angle "see your body": the two body
// maps lead (left: this exercise; right: everything the day has worked up to and with this card), then the week's
// numbers, the photos, the tips, the video, the machine with Rosario's where-note, and the plan's swaps.
// Previous / Next walk through the day's cards, so the right map builds up card by card.
import { h } from "./app/h.js";
import { icon } from "./app/icons.js";
import { cues } from "./app/cues.js";
import { videoFor, machines, machineOf, AREAS } from "./app/plan-media.js";
import { exercises, days } from "./app/plan-v2.js";
import { EX_MUSCLES, EQUIP } from "./data/muscles.js";
import { bodyMap, exerciseWords, legend, levelWords, fmtSets } from "./bodymap.js";
import { flip, photoPair, photoNote, nameOf } from "./media-ui.js";
import { loadDoc } from "./store.js";
import { exerciseLevels, loadOf, levelsFromLoad, repText, repWord, restText, rirText, units, DAY_IDS, baseSlots } from "./planlogic.js";
import { openSheet } from "./ui.js";
import { openMachineCard, whereOf } from "./machines-b.js";

const SLOT_WORDS = { 1: "first of the pair", 2: "second of the pair" };

function slotLabel(slot) {
  if (slot.slot === "D") return "On its own";
  if (slot.slot.startsWith("Abs")) return `Abs ${slot.slot.slice(3)}`;
  return `Pair ${slot.slot[0]} · ${SLOT_WORDS[slot.slot[1]]}`;
}

export function machineRow(exId, onSaved) {
  const mid = machineOf[exId];
  const m = mid && machines[mid];
  if (!m) return null;
  const where = whereOf(loadDoc(), mid);
  return h("button", { class: "mach-row", type: "button", onclick: () => openMachineCard(mid, { onSaved }) },
    h("span", { class: "area-icon" }, icon(m.area, 20)),
    h("span", { class: "grow" }, h("b", {}, m.name),
      h("span", { class: `small ${where ? "where-line" : "muted"}` }, icon("pin", 15), where ? where : `${AREAS[m.area].name} · add where it is`)),
    h("span", { class: "muted" }, icon("chevron", 18)));
}

export function videoButton(id) {
  const v = videoFor(id);
  if (!v) return null;
  return h("a", { class: "button secondary", href: v.url, target: "_blank", rel: "noopener noreferrer", "aria-label": `Watch a form video of ${nameOf(id)} (opens Safari)` },
    icon("play", 18), "Watch video", icon("external", 16));
}

// The two maps side by side. `upTo`: the day's slots up to and with this one (null: no day, e.g. from the Gym tab).
export function mapPair(exId, upTo, prevUpTo = null) {
  const m = EX_MUSCLES[exId];
  const w = exerciseWords(m);
  const left = h("figure", { class: "map-panel" },
    h("figcaption", { class: "eyebrow" }, "This exercise"),
    bodyMap(exerciseLevels(exId), { label: `Body map of ${nameOf(exId)}. ${w.line}.` }),
    h("p", { class: "map-words" }, h("b", {}, "Main: "), w.main, h("br"), h("span", { class: "muted" }, `Helpers: ${w.help}`)));
  if (!upTo) return h("div", { class: "map-pair one" }, left);
  const load = loadOf(upTo);
  const lv = levelsFromLoad(load);
  const prev = prevUpTo ? levelsFromLoad(loadOf(prevUpTo)) : {};
  const fresh = Object.keys(lv).filter((g) => (lv[g] ?? 0) > (prev[g] ?? 0));
  const words = levelWords(lv, load).slice(0, 5);
  const right = h("figure", { class: "map-panel" },
    h("figcaption", { class: "eyebrow" }, `Day so far · ${upTo.length} of ${upTo.total}`),
    bodyMap(lv, { label: `Body map of the day so far: ${words.join(", ")} sets.`, fresh }),
    h("p", { class: "map-words" }, h("b", {}, "Sets so far: "), words.join(", "), h("br"), h("span", { class: "muted" }, "Helpers count half")));
  return h("div", { class: "map-pair" }, left, right);
}

function numberTiles(ex, slot, dayId, week) {
  const tile = (label, value, unit) => h("div", { class: "num-tile" }, h("span", { class: "label" }, label), h("b", {}, value, unit ? h("span", { class: "unit" }, unit) : null));
  return h("div", { class: "num-tiles" },
    tile("Sets", String(slot.sets), slot.sets !== slot.base ? ` (plan ${slot.base})` : null),
    tile(ex.kind === "hold" ? "Hold" : "Reps", repText(ex), ex.perSide ? " each side" : null),
    tile("Rest", slot.rest === null ? "30 s" : `${slot.rest} s`, slot.rest === null ? " to move" : null),
    tile("Stop with", rirText(week, dayId), " reps left"));
}

function planSwapsLine(exId) {
  const sw = exercises[exId].swaps ?? [];
  if (!sw.length) return null;
  return h("p", { class: "small muted" }, h("b", {}, "The plan's swaps: "),
    sw.map((s) => `${exercises[s.id].name}${s.needsMachine ? " (only if the gym has it)" : s.note ? ` (${s.note})` : ""}`).join("; "), ".");
}

function usedOn(exId) {
  const doc = loadDoc();
  const list = DAY_IDS.filter((d) => baseSlots(doc, d).some((s) => s.ex === exId)).map((d) => days[d].name);
  return list.length ? `In your plan on ${list.join(", ")}.` : "Not in your plan now: a swap or an add.";
}

// Day context: { dayId, week, slots (with week sets), index, onSwap(slot), onRemove(slot) }.
export function openExerciseLayer(exId, ctx = null) {
  let index = ctx ? ctx.index : 0;
  let sheet = null;
  const draw = () => {
    const slot = ctx ? ctx.slots[index] : null;
    const id = slot ? slot.ex : exId;
    const ex = exercises[id];
    const m = EX_MUSCLES[id];
    const upTo = ctx ? Object.assign(ctx.slots.slice(0, index + 1), { total: ctx.slots.length }) : null;
    const prevUpTo = ctx && index > 0 ? ctx.slots.slice(0, index) : null;
    const v = videoFor(id);
    const nav = ctx ? h("div", { class: "layer-nav" },
      h("button", { class: "button secondary", type: "button", disabled: index === 0, onclick: () => { index--; draw(); } }, icon("back", 18), "Previous"),
      h("button", { class: "button secondary", type: "button", disabled: index === ctx.slots.length - 1, onclick: () => { index++; draw(); } }, "Next", icon("chevron", 18))) : null;
    sheet.fill([
      h("div", { class: "eyebrow accent" }, ctx ? `${days[ctx.dayId].name} · ${slotLabel(slot)}` : `${EQUIP[m.equip].name} · ${ex.equipment}`),
      h("h2", { class: "layer-title" }, ex.name),
      mapPair(id, upTo, prevUpTo),
      legend(ctx ? ["A little", "More", "Most"] : ["Helper", "", "Main"]),
      ctx ? numberTiles(ex, slot, ctx.dayId, ctx.week) : h("p", { class: "small muted" }, `${repText(ex)} ${repWord(ex)}${ex.perSide ? " each side" : ""} · ${usedOn(id)}`),
      ctx ? h("p", { class: "small muted" }, `${restText(slot)}. Week ${ctx.week} sets.`) : null,
      flip(id, { cls: "big-flip", tag: true }),
      photoNote(id),
      photoPair(id),
      h("h3", {}, "How to do it"),
      h("p", {}, cues[id] ?? "Move slowly and keep good form."),
      videoButton(id),
      v ? h("p", { class: "small muted" }, `Video by ${v.channel}. Opens in Safari; needs signal.`) : null,
      h("h3", {}, "Machine"),
      h("div", { class: "card" }, machineRow(id, () => draw())),
      planSwapsLine(id),
      ctx ? h("div", { class: "layer-actions" },
        h("button", { class: "button secondary", type: "button", onclick: () => ctx.onSwap(slot) }, icon("swap", 18), "Swap for good"),
        h("button", { class: "button secondary danger-text", type: "button", onclick: () => ctx.onRemove(slot) }, icon("trash", 18), `Remove from ${days[ctx.dayId].name}`)) : null,
      nav,
    ]);
  };
  sheet = openSheet([], { tall: true, label: "Exercise" });
  draw();
  return sheet;
}

export { units };
