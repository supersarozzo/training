// Coach-style parts shared by the workout screens: the session progress bar, the guide card, "Up next",
// the chips (Tips, Swap, Video, Machine) and the friendly coach line.
import { h } from "../h.js";
import { exercises } from "../plan/plan-v2.js";
import { cues } from "../plan/cues.js";
import { videoFor } from "../plan/videos.js";
import { machineFor, spotFor } from "../plan/machines.js";
import { unitLabel, workSets, slotRecord } from "../engine/workout.js";
import { icon } from "./icons.js";
import { thumb } from "./demo.js";
import { fillFrom } from "./motion.js";
import { openMachine } from "./machinecard.js";

const PHASE_INDEX = { walk: 0, walk_result: 0, changeover: 1, warmup: 2 };

// Segments of the whole session: walk, change-over, warm-up, each pair or abs unit, finish.
export function sessionSegments(ctx) {
  const { session, units, act } = ctx;
  const segs = [
    { id: "walk", label: "Walk" },
    { id: "changeover", label: "Change-over" },
    { id: "warmup", label: "Warm-up" },
    ...units.map((u, i) => ({ id: `u${i}`, label: unitLabel(u), unit: u })),
    { id: "finish", label: "Finish" },
  ];
  const phase = act.phase;
  let current;
  if (phase in PHASE_INDEX) current = PHASE_INDEX[phase];
  else if (phase === "finish") current = segs.length - 1;
  else {
    const pos = ctx.position();
    current = pos ? 3 + pos.entry.unitIndex : segs.length - 1;
    if (session.week === 1) {
      const firstOpen = units.findIndex((u) => u.slots.some((sl) => workSets(slotRecord(session, sl.slot)).length < Math.min(sl.sets, 2) || !slotRecord(session, sl.slot)?.w1_saved));
      current = firstOpen >= 0 ? 3 + firstOpen : segs.length - 1;
    }
  }
  return segs.map((seg, i) => {
    let fill = i < current ? 1 : 0;
    if (seg.unit) {
      const total = seg.unit.slots.reduce((n, sl) => n + sl.sets, 0);
      const done = seg.unit.slots.reduce((n, sl) => n + Math.min(sl.sets, workSets(slotRecord(session, sl.slot)).length), 0);
      fill = i < current ? 1 : total ? done / total : 0;
    }
    if (i === 0 && session.walk) fill = 1;
    return { ...seg, fill, now: i === current };
  });
}

const lastFill = new Map(); // "session:segment" -> fill shown last time, so the bar grows instead of jumping

// Top of every workout screen: what step this is, an End button, and the session bar.
export function guideTop(ctx, stepText, onEnd) {
  const segs = sessionSegments(ctx);
  const nowIndex = segs.findIndex((x) => x.now);
  const bar = h("div", { class: "segments", role: "progressbar", "aria-label": "Workout progress", "aria-valuemin": "0", "aria-valuemax": String(segs.length), "aria-valuenow": String(nowIndex + 1), "aria-valuetext": `${segs[nowIndex]?.label ?? ""}, step ${nowIndex + 1} of ${segs.length}` },
    segs.map((seg) => {
      const fillEl = h("i", {});
      fillEl.style.setProperty("--fill", String(seg.fill)); // CSSOM: allowed by the page's CSP
      const key = `${ctx.session.id}:${seg.id}`;
      const before = lastFill.get(key);
      if (before !== undefined && before < seg.fill) queueMicrotask(() => fillFrom(fillEl, before, seg.fill));
      lastFill.set(key, seg.fill);
      return h("div", { class: `seg ${seg.now ? "now" : ""}` }, fillEl);
    }));
  return h("header", { class: "g-top" },
    h("div", { class: "g-top-row" },
      h("div", { class: "g-step" }, stepText),
      onEnd ? h("button", { class: "text-button", type: "button", onclick: onEnd }, "End") : null),
    bar);
}

// The first sentence of the form tip, as a friendly line from the coach.
export function coachLine(text) {
  if (!text) return null;
  return h("div", { class: "coach" }, icon("coach"), h("div", {}, text));
}
export function firstTip(exId) {
  const t = cues[exId];
  if (!t) return null;
  const m = t.match(/^[^.!?]+[.!?]/);
  return m ? m[0] : t;
}

// "Up next" card with a photo.
export function nextUp(exId, what, detail, { big = false, label = "Up next" } = {}) {
  return h("div", { class: `next-up ${big ? "big" : ""}` },
    exId ? thumb(exId, big ? "lg" : "") : null,
    h("div", { class: "grow" }, h("span", { class: "eyebrow" }, label), h("div", { class: "what" }, what), detail ? h("div", { class: "detail" }, detail) : null));
}

// Chips under the exercise name: Tips, Swap, Watch video (opens Safari), Machine (card with "where it is").
export function exerciseChips(ctx, exId, { onTips, onSwap }) {
  const v = videoFor(exId);
  const m = machineFor(exId);
  return h("div", { class: "chips" },
    onTips ? h("button", { class: "chip", type: "button", onclick: onTips }, icon("tips"), "Tips") : null,
    onSwap ? h("button", { class: "chip", type: "button", onclick: onSwap }, icon("swap"), "Swap") : null,
    v ? h("a", { class: "chip", href: v.url, target: "_blank", rel: "noopener noreferrer", "aria-label": `Watch a video of ${exercises[exId]?.name ?? "this exercise"} (opens Safari)` }, icon("video"), "Video") : null,
    m ? h("button", { class: "chip", type: "button", onclick: () => openMachine(m.id) }, icon("pin"), "Machine") : null);
}

// "Where it is in my gym" line on the exercise card (or a quiet prompt to add it).
export function whereLine(doc, exId) {
  const m = machineFor(exId);
  if (!m || m.id === "mats") return null;
  const where = spotFor(doc, m.id);
  if (where) return h("div", { class: "where-line" }, icon("pin"), h("span", {}, `${m.sign}: ${where}`));
  return h("button", { class: "text-button where-add", type: "button", onclick: () => openMachine(m.id) }, icon("pin", "ico"), " Where is it in your gym? Add a note");
}
