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

// Swap · Remove · Video in one row under the title. From the Gym tab (no day) only Video shows.
// While the day's workout is running, Swap and Remove are replaced by a short note.
function quickActions(id, slot, ctx) {
  const v = videoFor(id);
  const video = v ? h("a", { class: "chip qa", href: v.url, target: "_blank", rel: "noopener noreferrer", "aria-label": `Watch a form video of ${nameOf(id)} (opens Safari)` }, icon("play", 16), "Video") : null;
  if (ctx?.locked) return h("div", { class: "qa-row" }, h("p", { class: "small muted grow" }, icon("clock", 14), " Running now: change it after the workout."), video);
  if (!ctx) return video ? h("div", { class: "qa-row" }, video) : null;
  return h("div", { class: "qa-row" },
    h("button", { class: "chip qa", type: "button", onclick: () => ctx.onSwap(slot), "aria-label": `Swap ${nameOf(id)} for good` }, icon("swap", 16), "Swap"),
    h("button", { class: "chip qa danger-text", type: "button", onclick: () => ctx.onRemove(slot), "aria-label": `Remove ${nameOf(id)} from ${days[ctx.dayId].name}` }, icon("trash", 16), "Remove"),
    video);
}

// Day context: { dayId, week, slots (with week sets), index, locked, onSwap(slot), onRemove(slot) }.
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
      // The actions sit at the top, before the maps and photos, so a swap needs no scrolling (idea from builder A).
      quickActions(id, slot, ctx),
      mapPair(id, upTo, prevUpTo),
      legend(ctx ? ["A little", "More", "Most"] : ["Helper", "", "Main"]),
      ctx ? numberTiles(ex, slot, ctx.dayId, ctx.week) : h("p", { class: "small muted" }, `${repText(ex)} ${repWord(ex)}${ex.perSide ? " each side" : ""} · ${usedOn(id)}`),
      ctx ? h("p", { class: "small muted" }, `${restText(slot)}. Week ${ctx.week} sets.`) : null,
      flip(id, { cls: "big-flip", tag: true }),
      photoNote(id),
      photoPair(id),
      h("h3", {}, "How to do it"),
      h("p", {}, cues[id] ?? "Move slowly and keep good form."),
      v ? h("p", { class: "small muted" }, icon("play", 14), ` Form video by ${v.channel} (the Video button at the top). Opens in Safari; needs signal.`) : null,
      h("h3", {}, "Machine"),
      h("div", { class: "card" }, machineRow(id, () => draw())),
      planSwapsLine(id),
      nav,
    ]);
  };
  sheet = openSheet([], { tall: true, label: "Exercise" });
  draw();
  return sheet;
}

export { units };
