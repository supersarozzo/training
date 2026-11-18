// The opened exercise (build step 2, docs/DESIGN.md 15.4; mock-up "Exercise open"): B's layout with A's words.
// From a Plan day card (ctx = { day, week, slot }): the eyebrow "Tuesday · Pair B · first of the pair", the Video chip,
// two body maps ("This exercise", "Day so far · 3 of 7") with words, the 3-step legend, 4 tiles (Sets, Reps, Rest,
// Stop with), Previous / Next named after the neighbour. From Gym › Exercises (no ctx): one map, "In the plan" line.
// Below, unchanged from the 0.4.1 exercise sheet: the moving photo, start and end photos, How to do it, the video link,
// the machine row; plus "The plan's own swap". Read-only in this step: Swap and Remove come with build step 4.
import { h } from "../h.js";
import { openSheet, closeSheets } from "./parts.js";
import { rerender } from "./app.js";
import { exercises, days, rirFor } from "../plan/plan-v2.js";
import { cues } from "../plan/cues.js";
import { videoFor } from "../plan/media.js";
import { flip, photoNote, photoPair } from "./media.js";
import { videoButton, machineRow } from "./exinfo.js";
import { icon } from "./icons.js";
import { bodyMap, mapLegend } from "./bodymap.js";
import {
  daySets, daySoFar, exerciseLevels, muscleWords, slotRole, restTile, neighbours, planDaysOf,
} from "../engine/planpage.js";

export function repRange(ex) {
  const [lo, hi] = ex.range;
  return lo === hi ? `${lo}` : `${lo}–${hi}`;
}
// "3 sets × 10–12 reps", "3 sets × 20–40 s hold", "3 sets × 8 reps each side"
export function doseParts(ex, sets) {
  const unit = ex.kind === "hold" ? " s hold" : " reps";
  return [h("b", {}, String(sets)), " sets × ", h("b", {}, repRange(ex)), `${unit}${ex.perSide ? " each side" : ""}`];
}

// The plan's own swaps, with the 0.4.1 notes ("only if the gym has it", "light").
export function planSwapText(exId) {
  const ex = exercises[exId];
  return ex.swaps.map((sw) => {
    const name = exercises[sw.id].name;
    if (sw.needsMachine) return `${name} (only if the gym has it)`;
    return sw.note ? `${name} (${sw.note})` : name;
  }).join("; ");
}

export function inPlanText(exId) {
  const list = planDaysOf(exId);
  return list.length ? `In the plan: ${list.map((d) => days[d].name.slice(0, 3)).join(", ")}` : "Swap only";
}

const tile = (label, value, note) => h("div", { class: "ex-tile" }, h("span", { class: "eyebrow" }, label), h("b", {}, value), note ? h("small", {}, note) : null);

export function openExerciseLayer(exId, ctx = null) {
  const ex = exercises[exId];
  if (!ex) return null;
  const video = videoFor(exId);
  const words = muscleWords(exId);
  const slots = ctx ? daySets(ctx.day, ctx.week) : null;
  const slot = slots ? slots.find((x) => x.slot === ctx.slot) : null;
  const thisMap = h("div", { class: "mp" },
    h("span", { class: "eyebrow" }, "This exercise"),
    bodyMap(exerciseLevels(exId), { label: `${ex.name} works: main ${words.main}${words.helpers ? `, helped by ${words.helpers}` : ""}.` }),
    h("p", {}, h("b", {}, "Main: "), words.main || "–", words.helpers ? [h("br"), h("b", {}, "Helps: "), words.helpers] : null));

  let maps;
  let extra = null;
  if (slot) {
    const sofar = daySoFar(ctx.day, ctx.week, ctx.slot);
    maps = h("div", { class: "maps" }, thisMap,
      h("div", { class: "mp" },
        h("span", { class: "eyebrow" }, `Day so far · ${sofar.position} of ${sofar.total}`),
        bodyMap(sofar.levels, { label: `${days[ctx.day].name} up to this exercise: ${sofar.text}.` }),
        h("p", {}, h("b", {}, "Sets so far: "), sofar.text)));
    const rest = restTile(slot);
    const rir = rirFor(ctx.week, ctx.day);
    const nb = neighbours(ctx.day, ctx.week, ctx.slot);
    const go = (x) => openExerciseLayer(x.ex, { ...ctx, slot: x.slot });
    extra = [
      h("div", { class: "ex-tiles" },
        tile("Sets", String(slot.sets)),
        tile("Reps", repRange(ex), ex.kind === "hold" ? "seconds" : ex.perSide ? "each side" : null),
        tile("Rest", rest.value, rest.note),
        tile("Stop with", Array.isArray(rir) ? `${rir[0]}–${rir[1]}` : String(rir), "reps left")),
      h("div", { class: "layer-nav" },
        h("button", { class: "button secondary", type: "button", disabled: !nb.prev, onclick: () => nb.prev && go(nb.prev), "aria-label": nb.prev ? `Previous exercise: ${exercises[nb.prev.ex].name}` : "No previous exercise" },
          icon("back", 18), h("span", {}, nb.prev ? exercises[nb.prev.ex].name : "First")),
        h("button", { class: "button secondary", type: "button", disabled: !nb.next, onclick: () => nb.next && go(nb.next), "aria-label": nb.next ? `Next exercise: ${exercises[nb.next.ex].name}` : "No next exercise" },
          h("span", {}, nb.next ? exercises[nb.next.ex].name : "Last"), icon("chevron", 18))),
    ];
  } else {
    maps = h("div", { class: "maps one" }, thisMap);
    extra = h("p", { class: "small muted" }, `${inPlanText(exId)} · ${repRange(ex)}${ex.kind === "hold" ? " s hold" : " reps"}${ex.perSide ? " each side" : ""}`);
  }

  const swaps = planSwapText(exId);
  const machine = machineRow(exId, { onSaved: () => { closeSheets(); rerender(); } });
  return openSheet(
    h("div", { class: "eyebrow accent" }, slot ? `${days[ctx.day].name} · ${slotRole(ctx.day, ctx.slot)}` : "Exercise"),
    h("h2", { class: "layer-title" }, ex.name),
    h("p", { class: "small muted layer-equip" }, ex.equipment),
    video ? h("div", { class: "chips layer-chips" }, videoButton(exId, { chip: true })) : null,
    maps,
    mapLegend(),
    extra,
    flip(exId, { cls: "big-flip", tag: true }),
    photoNote(exId),
    photoPair(exId),
    h("h3", {}, "How to do it"),
    h("p", {}, cues[exId] ?? "Move slowly and keep good form."),
    videoButton(exId),
    video ? h("p", { class: "small muted" }, `Video by ${video.channel}. Opens in Safari; needs signal.`) : null,
    machine ? [h("h3", {}, "Machine"), h("div", { class: "card" }, machine)] : null,
    swaps ? h("p", { class: "small muted" }, `The plan's own swap: ${swaps}.`) : null);
}
