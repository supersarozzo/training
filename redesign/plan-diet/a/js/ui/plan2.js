// PROTOTYPE 8.28 (builder A, angle "fastest at the gym"). The new Plan tab:
// - one day per page, read like Today; today's day and this week open first; the week's REAL sets (research 2 item 3);
// - day switching in the thumb zone: "‹ Monday" and "Wednesday ›" in the bottom bar, plus a Mon-Fri strip at the top
//   for a direct jump;
// - exercise cards with all the facts in words; a tap opens the exercise layer: 2 body maps (this exercise; the day up
//   to this card), photos, tips, video, machine; Swap and Remove right there (3 taps to swap for good);
// - Edit mode for remove / swap / add, saved at once, permanent (answer 65), with Undo and "Back to the plan's day";
// - the whole-plan muscle cross-check (crosscheck.js).
// No Print button, no print tables (Rosario's request). All text through h(); no innerHTML; no style attributes.
import { h } from "../h.js";
import { screen, tabActionBar, openSheet, closeSheets } from "./parts.js";
import { model, rerender } from "./app.js";
import { today } from "../clock.js";
import { dayLabel } from "../engine/schedule.js";
import { buildUnits } from "../engine/workout.js";
import { dayLayout } from "../dayplan.js";
import { days, exercises, weeks, weekInfo, DAY_IDS, MOVE_SECONDS, walkRules } from "../plan/plan-v2.js";
import { thumb, flip, photoNote, photoPair } from "./media.js";
import { cues } from "../plan/cues.js";
import { videoFor } from "../plan/media.js";
import { videoButton, machineRow } from "./exinfo.js";
import { icon } from "./icons.js";
import { onMount, stagger } from "./motion.js";
import { musclesOf, muscleWords, GROUPS, GROUP_NAME, EQ_NAME, eqOf, mainGroup } from "../proto/muscles.js";
import { bodyMap, exerciseLevels, setsByGroup, levelFor, legend, miniMap } from "../proto/bodymap.js";
import {
  slotsOf, weekSets, editRecord, runningWorkout, swapSlot, removeSlot, addExercise, restoreSlots, resetDay,
  changeSummary, matchesFor, freeAddSlot, extraMinutes, MAX_ADDED, hiddenByGym,
} from "../proto/plandays.js";
import { undoToast } from "../proto/toast.js";
import { renderMuscles, weeklyCounts } from "./crosscheck.js";

const state = { view: "day", day: null, week: null, editing: false };
export function showMuscles() { state.view = "muscles"; rerender(); }
export function showDay() { state.view = "day"; rerender(); }
export function planState() { return state; }

// ---------- words ----------
export function repText(ex) {
  const [lo, hi] = ex.range;
  const range = lo === hi ? `${lo}` : `${lo}–${hi}`;
  return `${range}${ex.kind === "hold" ? " s" : ""}`;
}
const repWord = (ex) => (ex.kind === "hold" ? "hold" : "reps");
const side = (ex) => (ex.perSide ? " each side" : "");
function restWords(slot) {
  if (slot.rest === null) return `then ${MOVE_SECONDS} s to move to the next`;
  return `rest ${slot.rest} s`;
}
const dayShort = (d) => days[d].name.slice(0, 3);
// "Upper body A" -> "Upper A", "Full body (a bit lighter)" -> "Full" (strip label; idea from builder B).
const focusShort = (d) => days[d].focus.replace(/\s*\(.*\)/, "").replace(" body", "");
const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function currentPos(doc) {
  const t = today();
  const label = dayLabel(doc.block.start_monday, t);
  const week = Math.min(Math.max(label.week, 1), 12);
  return { t, label, week, todayDay: label.state === "running" ? label.planDay : null };
}

// Slots of the day in a week, with that week's sets.
function weekSlots(doc, day, week) {
  return slotsOf(doc, day).map((s) => ({ ...s, base: s.sets, sets: weekSets(week, s) }));
}

function unitHead(unit) {
  if (unit.type === "pair") {
    const rounds = Math.max(...unit.slots.map((s) => s.sets));
    const rest = unit.slots[unit.slots.length - 1].rest ?? 60;
    return unit.slots.length > 1
      ? `Pair ${unit.id} · back and forth · ${rounds} rounds · rest ${rest} s after each round`
      : `Pair ${unit.id} · on its own now · rest ${rest} s`;
  }
  if (/^E[12]$/.test(unit.id)) return `Added by you · on its own · rest ${unit.slots[0].rest} s`;
  if (unit.id === "D") return `On its own · rest ${unit.slots[0].rest} s between sets`;
  return `Abs · rest ${unit.slots[0].rest} s`;
}

// ---------- the exercise layer (tap a card) ----------
function dayUpTo(doc, day, week, slotName) {
  const slots = weekSlots(doc, day, week);
  const i = slots.findIndex((s) => s.slot === slotName);
  return slots.slice(0, i + 1);
}

function soFarWords(weighted, direct) {
  const top = Object.entries(weighted).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return top.map(([g, n]) => `${GROUP_NAME[g].toLowerCase()} ${fmtSets(n)}${direct[g] ? "" : " (helping)"}`).join(", ");
}
export const fmtSets = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function exerciseMaps(exId, { doc, day, week, slot } = {}) {
  const w = muscleWords(exId);
  const left = bodyMap(exerciseLevels(exId), {
    title: "This exercise",
    words: [h("b", {}, "Main: "), w.main || "–", w.helpers ? [h("br"), h("b", {}, "Helps: "), w.helpers] : null],
  });
  if (!doc) return h("div", { class: "bm-row one" }, left, legend([[3, "main"], [1, "helps"]]));
  const upTo = dayUpTo(doc, day, week, slot);
  const { direct, weighted } = setsByGroup(upTo);
  const levels = Object.fromEntries(Object.entries(weighted).map(([g, n]) => [g, levelFor(n)]));
  const right = bodyMap(levels, {
    title: "Day so far",
    words: [h("b", {}, `${days[day].name}, exercise ${upTo.length} of ${weekSlots(doc, day, week).length}: `), soFarWords(weighted, direct)],
  });
  return [h("div", { class: "bm-row" }, left, right),
    legend([[3, "main / 6+ sets"], [2, "3–5 sets"], [1, "helps / under 3"]]),
    h("p", { class: "small muted" }, "Sets so far count a helping muscle as half a set.")];
}

export function openExerciseLayer(exId, ctx = null) {
  const ex = exercises[exId];
  const doc = model.doc();
  const slot = ctx ? weekSlots(doc, ctx.day, ctx.week).find((s) => s.slot === ctx.slot) : null;
  const canEdit = ctx && !runningWorkout(doc, ctx.day);
  const video = videoFor(exId);
  const planSwaps = ex.swaps.map((sw) => exercises[sw.id].name + (sw.needsMachine ? " (only if the gym has it)" : sw.note ? ` (${sw.note})` : ""));
  const close = openSheet(
    h("div", { class: "eyebrow accent" }, ex.equipment),
    h("h2", { class: "layer-title" }, ex.name),
    slot ? h("p", { class: "layer-dose" }, h("b", {}, String(slot.sets)), " sets × ", h("b", {}, repText(ex)), ` ${repWord(ex)}${side(ex)} · ${restWords(slot)}`) : null,
    canEdit ? h("div", { class: "chips layer-actions" },
      h("button", { class: "chip", type: "button", onclick: () => { close(); openSwapList(ctx.day, ctx.slot, ctx.week); } }, icon("swap", 17), "Swap"),
      h("button", { class: "chip", type: "button", onclick: () => { close(); doRemove(ctx.day, ctx.slot); } }, icon("close", 17), "Remove"),
      video ? videoButton(exId, { chip: true }) : null) : null,
    exerciseMaps(exId, slot ? { doc, day: ctx.day, week: ctx.week, slot: ctx.slot } : {}),
    slot ? layerNav(doc, ctx, () => close()) : null,
    flip(exId, { cls: "big-flip", tag: true }),
    photoNote(exId),
    photoPair(exId),
    h("h3", {}, "How to do it"),
    h("p", {}, cues[exId] ?? "Move slowly and keep good form."),
    videoButton(exId),
    video ? h("p", { class: "small muted" }, `Video by ${video.channel}. Opens in Safari; needs signal.`) : null,
    h("h3", {}, "Machine"),
    h("div", { class: "card" }, machineRow(exId, { onSaved: () => { closeSheets(); rerender(); } })),
    planSwaps.length ? h("p", { class: "small muted" }, `The plan's own swap: ${planSwaps.join("; ")}.`) : null);
  return close;
}

// Previous / Next: walk the day card by card without closing the layer; the "Day so far" map grows as you go
// (idea from builder B's review; here the buttons sit right under the maps, where the eye already is).
function layerNav(doc, ctx, close) {
  const all = weekSlots(doc, ctx.day, ctx.week);
  const i = all.findIndex((s) => s.slot === ctx.slot);
  const go = (s) => { close(); openExerciseLayer(s.ex, { ...ctx, slot: s.slot }); };
  const prev = all[i - 1];
  const next = all[i + 1];
  return h("div", { class: "layer-nav" },
    h("button", { class: "button secondary", type: "button", disabled: !prev, onclick: () => prev && go(prev), "aria-label": prev ? `Previous exercise: ${exercises[prev.ex].name}` : "No previous exercise" },
      icon("back", 18), h("span", {}, prev ? exercises[prev.ex].name : "First")),
    h("button", { class: "button secondary", type: "button", disabled: !next, onclick: () => next && go(next), "aria-label": next ? `Next exercise: ${exercises[next.ex].name}` : "No next exercise" },
      h("span", {}, next ? exercises[next.ex].name : "Last"), icon("chevron", 18)));
}

// ---------- changes (saved at once, permanent, with Undo) ----------
function withUndo(day, fn, message) {
  const doc = model.doc();
  const had = editRecord(doc, day);
  const before = slotsOf(doc, day);
  try { fn(); } catch (e) { undoToast(e.message); return; }
  rerender();
  undoToast(message, () => { if (had) restoreSlots(day, before); else resetDay(day); rerender(); });
}

function doRemove(day, slotName) {
  const ex = exercises[slotsOf(model.doc(), day).find((s) => s.slot === slotName).ex];
  withUndo(day, () => removeSlot(day, slotName), `Removed ${ex.name} from every ${days[day].name} from now on.`);
}

function swapRow(day, slotName, id, fromName, tag = null) {
  const ex = exercises[id];
  return h("button", { class: "mach-row", type: "button", onclick: () => {
    closeSheets();
    withUndo(day, () => swapSlot(day, slotName, id), `Every ${days[day].name} from now on: ${ex.name} instead of ${fromName}.`);
  } },
  thumb(id, { small: true }),
  h("span", { class: "grow" }, h("b", {}, ex.name, tag ? h("span", { class: "badge slot inline" }, tag) : null), h("span", { class: "small muted" }, `${ex.equipment} · ${repText(ex)} ${repWord(ex)}`)),
  miniMap(id),
  h("span", { class: "muted" }, icon("chevron", 18)));
}

function lastsLine(day) {
  return h("p", { class: "lasts" }, icon("info", 17), h("span", {}, h("b", {}, `Lasts: every ${days[day].name} from now on.`), " Past workouts stay as they were. You can go back to the plan's day at any time."));
}

export function openSwapList(day, slotName, week) {
  const doc = model.doc();
  const slot = slotsOf(doc, day).find((s) => s.slot === slotName);
  const from = exercises[slot.ex];
  const m = matchesFor(doc, day, slot.ex);
  const eq = EQ_NAME[eqOf(slot.ex)];
  const muscle = GROUP_NAME[m.group]?.toLowerCase() ?? from.muscle;
  // "Plan's pick" (idea from builder B): the plan's own swap for this slot, or the plan's exercise if it was swapped out.
  const planEx = days[day].slots.find((s) => s.slot === slotName)?.ex;
  const picks = new Set(planEx ? [planEx, ...exercises[planEx].swaps.map((sw) => sw.id)] : []);
  const tagFor = (id) => (id === planEx ? "The plan's exercise" : picks.has(id) ? "Plan's pick" : null);
  const all = h("div", {});
  const showAll = () => {
    const inDay = new Set(slotsOf(doc, day).map((s) => s.ex));
    const rest = Object.keys(exercises).filter((id) => id !== slot.ex && !inDay.has(id) && mainGroup(id) !== m.group && !hiddenByGym(doc, id))
      .sort((a, b) => exercises[a].name.localeCompare(exercises[b].name));
    all.replaceChildren(h("div", { class: "eyebrow" }, "Other muscles (changes what the day works)"), h("div", { class: "card" }, rest.map((id) => swapRow(day, slotName, id, from.name))));
  };
  openSheet(
    h("h2", {}, `Swap ${from.name}`),
    lastsLine(day),
    h("p", { class: "small muted" }, `Keeps the slot's ${slot.sets} sets and its rest. The reps come from the new exercise.`),
    m.same.length ? [h("div", { class: "eyebrow" }, `Same muscle (${muscle}), same kind (${eq})`), h("div", { class: "card" }, m.same.map((id) => swapRow(day, slotName, id, from.name, tagFor(id))))] : null,
    m.other.length ? [h("div", { class: "eyebrow" }, `Same muscle (${muscle}), other equipment`), h("div", { class: "card" }, m.other.map((id) => swapRow(day, slotName, id, from.name, tagFor(id))))] : null,
    !m.same.length && !m.other.length ? h("div", { class: "card warn" },
      h("p", {}, h("b", {}, `No other exercise in the app works the ${muscle} as the main muscle`), m.hidden.length ? " with the machines your gym is known to have." : "."),
      h("p", { class: "small muted" }, `Keep ${from.name}, remove it, or pick from another muscle below.`)) : null,
    m.inDay.length ? h("p", { class: "small muted" }, `Already in ${days[day].name}: ${m.inDay.map((id) => exercises[id].name).join(", ")}.`) : null,
    m.hidden.length ? h("p", { class: "small muted" }, icon("info", 15), " Not shown: ", m.hidden.map((id) => exercises[id].name).join(", "),
      ". Your first visit has not found ", m.hidden.length > 1 ? "these machines" : "this machine", " yet (Settings > Gym).") : null,
    all,
    h("button", { class: "button secondary", type: "button", onclick: (e) => { e.currentTarget.remove(); showAll(); } }, "Show exercises for other muscles"));
  void week;
}

function openAdd(day, week) {
  const doc = model.doc();
  const slot = freeAddSlot(doc, day);
  const inDay = new Set(slotsOf(doc, day).map((s) => s.ex));
  const low = weeklyCounts(doc, week).rows.filter((r) => r.main && r.verdict === "low").map((r) => r.group);
  let pick = low.find((g) => Object.keys(exercises).some((id) => mainGroup(id) === g)) ?? "chest";
  const list = h("div", {});
  const chips = h("div", { class: "chips" });
  const draw = () => {
    chips.replaceChildren(...GROUPS.filter(([g]) => Object.keys(exercises).some((id) => mainGroup(id) === g)).map(([g, name]) =>
      h("button", { class: `chip ${g === pick ? "accent" : ""}`, type: "button", "aria-pressed": g === pick ? "true" : "false", onclick: () => { pick = g; draw(); } },
        name, low.includes(g) ? h("span", { class: "badge" }, "low") : null)));
    const ids = Object.keys(exercises).filter((id) => mainGroup(id) === pick && !inDay.has(id));
    const shown = ids.filter((id) => !hiddenByGym(doc, id));
    const hidden = ids.filter((id) => hiddenByGym(doc, id));
    list.replaceChildren(
      shown.length ? h("div", { class: "card" }, shown.map((id) => h("button", { class: "mach-row", type: "button", onclick: () => {
        closeSheets();
        withUndo(day, () => addExercise(day, id), `Added ${exercises[id].name} to the end of every ${days[day].name} from now on.`);
      } }, thumb(id, { small: true }), h("span", { class: "grow" }, h("b", {}, exercises[id].name), h("span", { class: "small muted" }, exercises[id].equipment)), h("span", { class: "muted" }, icon("plus", 18)))))
        : h("p", { class: "muted" }, `${days[day].name} already has every ${GROUP_NAME[pick].toLowerCase()} exercise the app knows.`),
      hidden.length ? h("p", { class: "small muted" }, `Not shown: ${hidden.map((id) => exercises[id].name).join(", ")}. Your first visit has not found ${hidden.length > 1 ? "these machines" : "this machine"} yet (Settings > Gym).`) : null);
  };
  draw();
  openSheet(
    h("h2", {}, `Add to ${days[day].name}`),
    lastsLine(day),
    h("div", { class: "card rule" },
      h("p", {}, h("b", {}, "Where it goes: "), `at the end, after the abs, done on its own. ${weekSets(week, { slot, sets: 3 })} sets this week (3 in a normal week), 60 s rest. At most ${MAX_ADDED} added exercises a day.`),
      h("p", { class: "small muted" }, `Adds about ${Math.round(weekSets(week, { slot, sets: 3 }) * 2.5)} minutes. "low" = the Muscles screen finds this muscle short in the whole plan.`)),
    chips, list);
}

function openWeeks(current, shown) {
  const rir = (r) => (Array.isArray(r) ? `${r[0]}-${r[1]}` : String(r));
  const setsText = (w) => (w.setsMode === "two" ? "2 sets per exercise" : w.setsMode === "easier" ? "1 set less" : w.setsMode === "build2" ? "Pair A: 4th set; the single exercise: 2 sets" : "Sets as in the plan");
  openSheet(
    h("h2", {}, "The 12 weeks"),
    h("p", { class: "small muted" }, "Pick a week to see its real sets on every day."),
    h("div", { class: "card" }, weeks.map((w) => h("button", { class: `mach-row ${w.week === shown ? "picked" : ""}`, type: "button", "aria-current": w.week === shown ? "true" : null, onclick: () => { state.week = w.week; closeSheets(); rerender(); } },
      h("span", { class: `week-num ${w.week === current ? "now" : ""}` }, String(w.week)),
      h("span", { class: "grow" }, h("b", {}, w.phase, w.week === current ? h("span", { class: "badge slot inline" }, "This week") : null),
        h("span", { class: "small muted" }, `${setsText(w)} · RIR ${rir(w.rir)}${w.wedRir !== w.rir ? ` (Wed ${w.wedRir})` : ""} · Walk: ${w.walkNote.toLowerCase()}`)),
      w.week === shown ? h("span", { class: "accent-text" }, icon("check", 20)) : null))),
    h("p", { class: "small muted" }, "RIR = reps in reserve: how many more good reps you could still do when you stop."));
}

// ---------- the day page ----------
function walkCard(doc, day, week, t) {
  const lay = dayLayout(doc, { planDay: day, week, today: t });
  const easy = days[day].walk === "easy";
  return h("div", { class: "pcard walk" },
    h("span", { class: "area-icon big" }, icon("walk", 26)),
    h("span", { class: "grow" },
      h("b", {}, "Walk first"),
      h("span", { class: "dose" }, h("b", {}, String(lay.walk.minutes)), " min uphill"),
      h("span", { class: "small muted" }, easy ? `Easier: ${walkRules.legDaySlopeLess_pct} % less slope, effort ${walkRules.legDayEffort.join(" to ")} of 10` : `Normal: effort ${walkRules.normalEffort.join(" to ")} of 10`)));
}

function exCard(doc, day, week, slot, editing, canEdit, planSlot) {
  const ex = exercises[slot.ex];
  const w = muscleWords(slot.ex);
  const changed = !planSlot || planSlot.ex !== slot.ex;
  const body = [
    thumb(slot.ex),
    h("span", { class: "grow" },
      h("b", { class: "pc-name" }, ex.name, changed ? h("span", { class: "badge slot inline" }, planSlot ? "Swapped" : "Added") : null),
      h("span", { class: "dose" }, h("b", {}, String(slot.sets)), " sets × ", h("b", {}, repText(ex)), ` ${repWord(ex)}${side(ex)}`),
      h("span", { class: "small muted" }, w.main ? `${w.main[0].toUpperCase()}${w.main.slice(1)}` : "", w.helpers ? ` · helps ${w.helpers}` : "")),
  ];
  if (!editing) {
    return h("button", { class: "pcard", type: "button", "aria-label": `${ex.name}: ${slot.sets} sets of ${repText(ex)} ${repWord(ex)}${side(ex)}. Open details.`, onclick: () => openExerciseLayer(slot.ex, { day, week, slot: slot.slot }) },
      ...body, miniMap(slot.ex), h("span", { class: "muted" }, icon("chevron", 18)));
  }
  return h("div", { class: "pcard editing" }, ...body, miniMap(slot.ex),
    h("span", { class: "edit-btns" },
      h("button", { class: "icon-btn", type: "button", disabled: !canEdit, "aria-label": `Swap ${ex.name}`, onclick: () => openSwapList(day, slot.slot, week) }, icon("swap", 20), h("span", {}, "Swap")),
      h("button", { class: "icon-btn", type: "button", disabled: !canEdit, "aria-label": `Remove ${ex.name}`, onclick: () => doRemove(day, slot.slot) }, icon("close", 20), h("span", {}, "Remove"))));
}

function dayStrip(doc, shownDay, todayDay, week) {
  const done = new Set(doc.sessions.filter((s) => !s.deleted && s.week === week && s.status === "finished").map((s) => s.plan_day));
  return h("div", { class: "day-strip", role: "tablist", "aria-label": "Day of the plan" },
    DAY_IDS.map((d) => h("button", {
      class: `${d === todayDay ? "is-today" : ""} ${done.has(d) ? "is-done" : ""} ${editRecord(doc, d) ? "is-changed" : ""}`, type: "button", role: "tab",
      "aria-selected": d === shownDay ? "true" : "false", "aria-label": `${days[d].name}${d === todayDay ? ", today" : ""}${done.has(d) ? ", done" : ""}${editRecord(doc, d) ? ", changed by you" : ""}`,
      onclick: () => { state.day = d; state.editing = false; rerender(); },
    }, h("span", { class: "d" }, dayShort(d)), h("span", { class: "f" }, focusShort(d)), h("i", { "aria-hidden": "true" }, done.has(d) ? icon("check", 14, { strokeWidth: 3 }) : null))));
}

export function renderPlan() {
  const doc = model.doc();
  const pos = currentPos(doc);
  if (state.view === "muscles") return renderMuscles(doc, state.week ?? pos.week, pos.week);
  const day = state.day ?? pos.todayDay ?? (pos.label.day === "sat" || pos.label.day === "sun" ? "mon" : "mon");
  const week = state.week ?? pos.week;
  const wi = weekInfo(week);
  const slots = weekSlots(doc, day, week);
  const running = runningWorkout(doc, day);
  const canEdit = !running;
  const editing = state.editing && canEdit;
  const lay = dayLayout(doc, { planDay: day, week, today: pos.t });
  const extra = extraMinutes(doc, day, week);
  const totalSets = slots.reduce((n, s) => n + s.sets, 0);
  const rir = Array.isArray(wi.rir) ? wi.rir.join("-") : day === "wed" ? wi.wedRir : wi.rir;
  const summary = changeSummary(doc, day);
  const i = DAY_IDS.indexOf(day);
  const prev = DAY_IDS[(i + 4) % 5];
  const next = DAY_IDS[(i + 1) % 5];
  const planSlots = days[day].slots;

  const units = buildUnits(slots);
  const cards = units.map((u) => h("section", { class: "unit" },
    h("div", { class: "unit-head" }, unitHead(u)),
    u.slots.map((s) => exCard(doc, day, week, s, editing, canEdit, planSlots.find((p) => p.slot === s.slot) ?? null))));

  const main = screen(
    h("div", { class: "plan-top" },
      h("button", { class: "week-chip", type: "button", onclick: () => openWeeks(pos.week, week), "aria-label": `Week ${week} of 12, ${wi.phase}. Change week.` },
        h("span", { class: "eyebrow accent" }, `Week ${week} · ${wi.phase}`), icon("chevron", 14)),
      h("div", { class: "top-btns" },
        h("button", { class: "chip", type: "button", onclick: showMuscles }, "Muscles"),
        canEdit ? h("button", { class: `chip ${editing ? "accent" : ""}`, type: "button", "aria-pressed": editing ? "true" : "false", onclick: () => { state.editing = !state.editing; rerender(); } }, editing ? "Done" : "Edit") : null)),
    h("h1", { class: "plan-day" }, days[day].name, day === pos.todayDay && week === pos.week ? h("span", { class: "today-tag" }, "Today") : null),
    dayStrip(doc, day, pos.todayDay, week),
    h("div", { class: "hero-meta plan-meta" },
      h("span", {}, days[day].focus),
      h("span", {}, "about ", h("b", {}, String(lay.minutes + extra)), " min"),
      h("span", {}, h("b", {}, String(totalSets)), " sets"),
      h("span", {}, "stop with ", h("b", {}, String(rir)), " left")),
    week !== pos.week ? h("div", { class: "note-line" }, icon("info", 16), h("span", {}, `Showing week ${week}. This week is week ${pos.week}. `), h("button", { class: "text-button", type: "button", onclick: () => { state.week = null; rerender(); } }, "Back to this week")) : null,
    running ? h("div", { class: "card warn" }, h("p", {}, h("b", {}, `${days[day].name}'s workout is running.`), " It keeps its exercises. You can change this day after you finish it.")) : null,
    editing ? h("div", { class: "card accent edit-banner" },
      h("p", {}, h("b", {}, `Editing ${days[day].name}.`), ` Each change saves at once and lasts: every ${days[day].name} from now on, in every week. Past workouts stay as they were.`),
      h("p", { class: "small muted" }, `About ${lay.minutes + extra} minutes now; the plan's day is about ${lay.minutes}.`)) : null,
    summary && !editing ? h("div", { class: "card changed" },
      h("p", {}, h("b", {}, `Changed by you · ${fmtDate(summary.at)}`), h("br"), summary.items.join(" · ")),
      h("p", { class: "small muted" }, `Lasts every ${days[day].name}. Past workouts are not changed.`),
      canEdit ? h("button", { class: "text-button left", type: "button", onclick: () => {
        const before = slotsOf(model.doc(), day);
        resetDay(day); rerender();
        undoToast(`${days[day].name} is back to the plan's version.`, () => { restoreSlots(day, before); rerender(); });
      } }, icon("undo", 17), ` Back to the plan's ${days[day].name}`) : null) : null,
    walkCard(doc, day, week, pos.t),
    cards,
    editing ? (freeAddSlot(doc, day)
      ? h("button", { class: "button secondary add-btn", type: "button", onclick: () => openAdd(day, week) }, icon("plus", 20), `Add an exercise (${MAX_ADDED - slotsOf(doc, day).filter((s) => /^E/.test(s.slot)).length} of ${MAX_ADDED} left)`)
      : h("p", { class: "small muted center" }, `${days[day].name} has ${MAX_ADDED} added exercises, the most a day can take.`)) : null,
    !editing ? h("p", { class: "small muted center" }, "Tap an exercise for its muscles, photos and tips.") : null);

  main.className = "screen has-bar plan-screen";
  onMount(() => stagger(main.querySelectorAll(".pcard")));
  const bar = editing
    ? h("button", { class: "button", type: "button", onclick: () => { state.editing = false; rerender(); } }, icon("check", 20, { strokeWidth: 2.6 }), "Done editing")
    : h("div", { class: "day-nav" },
      h("button", { class: "button secondary", type: "button", onclick: () => { state.day = prev; rerender(); }, "aria-label": `Previous day: ${days[prev].name}` }, icon("back", 20), days[prev].name),
      h("button", { class: "button secondary", type: "button", onclick: () => { state.day = next; rerender(); }, "aria-label": `Next day: ${days[next].name}` }, days[next].name, icon("chevron", 20)));
  return [main, tabActionBar(bar)];
}
