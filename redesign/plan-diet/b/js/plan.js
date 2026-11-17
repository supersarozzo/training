// Plan tab (builder B, "see your body"). One day per page like Today: arrows and a Mon-Fri strip, today marked, the
// week's real sets (week picker), the day's body map as the hero, then the day in order: walk first, warm-up, pairs,
// on its own, abs. Cards open the exercise layer. Edit: swap for a matching exercise, remove, add into a free place,
// change sets. Edits last for good (answer 65). The whole-plan check is its own screen (#/plan/check).
import { h } from "./app/h.js";
import { icon } from "./app/icons.js";
import { weeks, weekInfo, walkRules, days, exercises, DAY_IDS } from "./app/plan-v2.js";
import { liftWarmup } from "./app/schedule.js";
import { stagger, onMount, reduced } from "./app/motion.js";
import { loadDoc, loadDevice, TODAY } from "./store.js";
import { blockPosition } from "./app/schedule.js";
import { EX_MUSCLES, GROUPS, EQUIP, names, joinWords } from "./data/muscles.js";
import { bodyMap, bestView, legend, levelWords } from "./bodymap.js";
import { thumb } from "./media-ui.js";
import { openExerciseLayer } from "./exlayer.js";
import { screen, screenWithBar, head, tabActionBar, mainButton, secondaryButton, openSheet, closeSheets, toast, rerender, go, pill, segmented } from "./ui.js";
import {
  daySlots, units, repText, repWord, restText, minutesFor, rirText, loadOf, levelsFromLoad, exerciseLevels, isEdited, dayRecord,
  matchesFor, swapSlot, removeSlot, addSlot, setSlotSets, resetDay, snapshotDay, restoreDay, changeWords, freePlaces, PLACE_NAMES,
  weeklyVolume, verdict,
} from "./planlogic.js";

const pos = () => blockPosition(loadDoc().block.start_monday, TODAY);
const thisWeek = () => Math.min(Math.max(pos().week, 1), 12);
const todayDay = () => pos().planDay;

// Days done in the week shown: a finished workout for that plan day and week (idea from builder A: ticks in the strip).
const doneDays = (doc, w) => new Set((doc.sessions ?? []).filter((s) => s.status === "finished" && s.week === w).map((s) => s.plan_day));
// A day whose workout is running now cannot be edited (a running workout never changes). The app keeps the running
// workout in trn.device.v1.active. Prototype only: ?running=1 pretends today's workout is running.
function runningDay(doc) {
  const a = loadDevice().active;
  const s = a && (doc.sessions ?? []).find((x) => x.id === a.session_id && x.status !== "finished");
  if (s) return s.plan_day;
  return new URLSearchParams(location.search).has("running") ? todayDay() : null;
}

let dayId = null;
let week = null;
let editing = false;
let slideDir = 0;

function ensureState() {
  if (!dayId) dayId = todayDay() ?? "mon";
  if (!week) week = thisWeek();
}
export function resetPlanState() { editing = false; }

function moveDay(step) {
  const i = DAY_IDS.indexOf(dayId);
  const next = i + step;
  if (next < 0 || next >= DAY_IDS.length) return;
  slideDir = step;
  dayId = DAY_IDS[next];
  rerender();
}

// ---------- parts of the day page ----------

function dayStrip() {
  const t = todayDay();
  const doc = loadDoc();
  const done = doneDays(doc, week);
  return h("div", { class: "day-strip", role: "tablist", "aria-label": "Day of the plan" }, DAY_IDS.map((d) =>
    h("button", { type: "button", role: "tab", class: `${d === dayId ? "on" : ""} ${d === t && week === thisWeek() ? "today" : ""}`, "aria-selected": d === dayId ? "true" : "false",
      "aria-label": `${days[d].name}${d === t ? ", today" : ""}${done.has(d) ? ", done this week" : ""}${isEdited(doc, d) ? ", changed by you" : ""}`, onclick: () => { slideDir = DAY_IDS.indexOf(d) - DAY_IDS.indexOf(dayId); dayId = d; rerender(); } },
    h("span", { class: "d" }, days[d].name.slice(0, 3)),
    h("span", { class: "f" }, days[d].focus.replace("body ", "").replace(" (a bit lighter)", "")),
    done.has(d) ? h("span", { class: "done-tick", "aria-hidden": "true" }, icon("check", 12, { strokeWidth: 3 })) : null,
    isEdited(doc, d) ? h("i", { class: "edited-dot", "aria-hidden": "true" }) : null)));
}

function dayNav() {
  const i = DAY_IDS.indexOf(dayId);
  const isToday = dayId === todayDay() && week === thisWeek();
  return h("div", { class: "day-nav" },
    h("button", { class: "round-nav", type: "button", "aria-label": i > 0 ? `Previous day: ${days[DAY_IDS[i - 1]].name}` : "No earlier day", disabled: i === 0, onclick: () => moveDay(-1) }, icon("back", 22)),
    h("div", { class: "day-title" }, h("h1", {}, days[dayId].name), isToday ? pill("Today", "accent") : null),
    h("button", { class: "round-nav", type: "button", "aria-label": i < 4 ? `Next day: ${days[DAY_IDS[i + 1]].name}` : "No later day", disabled: i === 4, onclick: () => moveDay(1) }, icon("chevron", 22)));
}

function heroCard(doc, slots) {
  const load = loadOf(slots);
  const lv = levelsFromLoad(load);
  const most = levelWords(Object.fromEntries(Object.entries(lv).filter(([, v]) => v === 3)), load);
  const some = Object.keys(lv).filter((g) => lv[g] === 2).map((g) => GROUPS[g].name.toLowerCase());
  const also = [...some, ...Object.keys(lv).filter((g) => lv[g] === 1).map((g) => GROUPS[g].name.toLowerCase())];
  const mins = minutesFor(doc, dayId, week);
  const edited = isEdited(doc, dayId);
  return h("section", { class: "day-hero", "aria-label": "What this day works" },
    h("div", { class: "day-hero-map" }, bodyMap(lv, { label: `Body map of ${days[dayId].name}: ${most.join(", ")} sets.` })),
    h("div", { class: "day-hero-text" },
      h("span", { class: "eyebrow" }, edited ? "Your version" : "The plan's day"),
      h("div", { class: "hero-title" }, days[dayId].focus),
      h("div", { class: "hero-stats" },
        h("span", {}, h("b", {}, String(mins.minutes)), " min"),
        h("span", {}, h("b", {}, String(slots.length)), " exercises"),
        h("span", {}, h("b", {}, String(mins.sets)), " sets")),
      h("p", { class: "hero-muscles" }, h("span", { class: "eyebrow" }, "Works most"), most.map((w) => h("span", { class: "mw" }, w))),
      also.length ? h("p", { class: "small muted" }, `Less: ${joinWords(also)}`) : null,
      h("p", { class: "small muted" }, `Stop each set with ${rirText(week, dayId)} reps left.`)));
}

function editedCard(doc) {
  const words = changeWords(doc, dayId);
  if (!words.length && !dayRecord(doc, dayId).bad) return null;
  if (dayRecord(doc, dayId).bad) return h("div", { class: "card" }, h("p", { class: "small muted" }, "This day was changed on a newer app version. It shows the plan's day here."));
  return h("div", { class: "card changed-card" },
    h("div", { class: "card-head" }, h("span", { class: "area-icon" }, icon("edit", 18)), h("b", {}, `You changed ${days[dayId].name}`)),
    h("ul", { class: "change-list" }, words.map((w) => h("li", {}, w))),
    h("p", { class: "small muted" }, `This lasts: every ${days[dayId].name} from now on. Workouts already done stay as they were.`),
    h("button", { class: "button ghost", type: "button", onclick: () => confirmReset(doc) }, icon("undo", 18), `Back to the plan's ${days[dayId].name}`));
}

function lastDoneLine(doc) {
  const s = (doc.sessions ?? []).filter((x) => !x.deleted && x.status === "finished" && x.plan_day === dayId).sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!s) return null;
  const sets = s.exercises.reduce((n, e) => n + e.sets.length, 0);
  const date = new Date(`${s.date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  return h("p", { class: "small muted done-line" }, icon("check", 16), ` Done on ${date}: ${s.exercises.length} exercises, ${sets} sets. That workout stays as you did it.`);
}

function walkStep() {
  const day = days[dayId];
  const easy = day.walk === "easy";
  return h("div", { class: "flow-step walk-step" },
    h("span", { class: "flow-dot", "aria-hidden": "true" }),
    h("div", { class: "flow-body" },
      h("div", { class: "flow-head" }, h("span", { class: "area-icon" }, icon("walk", 20)), h("b", {}, "Walk first"), h("span", { class: "min" }, `${walkRules.minutes} min`)),
      h("p", { class: "small muted" }, easy ? `Easier today: ${walkRules.legDaySlopeLess_pct} % less slope, effort ${walkRules.legDayEffort.join(" to ")} of 10.` : `Normal: effort ${walkRules.normalEffort.join(" to ")} of 10. Slope and speed from Today.`)));
}
function warmStep() {
  const moves = liftWarmup(dayId, "full");
  return h("div", { class: "flow-step" },
    h("span", { class: "flow-dot", "aria-hidden": "true" }),
    h("div", { class: "flow-body" },
      h("div", { class: "flow-head" }, h("span", { class: "area-icon" }, icon("flame", 20)), h("b", {}, "Lift warm-up"), h("span", { class: "min" }, "4 min")),
      h("p", { class: "small muted" }, `${moves.length} moves: ${moves.map((m) => m.name.toLowerCase()).join(", ")}.`)));
}

function exCard(doc, slot, index, slots) {
  const ex = exercises[slot.ex];
  const m = EX_MUSCLES[slot.ex];
  const lv = exerciseLevels(slot.ex);
  const locked = runningDay(doc) === dayId && week === thisWeek();
  const open = () => openExerciseLayer(slot.ex, { dayId, week, slots, index, locked, onSwap: (s) => openSwap(s), onRemove: (s) => doRemove(s) });
  const setsChanged = slot.sets !== slot.base;
  const card = h("div", { class: `xcard ${editing ? "editing" : ""}` },
    h("button", { class: "xcard-main", type: "button", onclick: open, "aria-label": `${ex.name}: ${slot.sets} sets of ${repText(ex)} ${repWord(ex)}. ${restText(slot)}. Works ${names(m.p).join(", ")}. Open details.` },
      thumb(slot.ex, { cls: "xthumb" }),
      h("span", { class: "xcard-text" },
        h("b", { class: "xname" }, ex.name),
        h("span", { class: "xsets" }, h("b", {}, String(slot.sets)), " sets × ", h("b", {}, repText(ex)), ` ${repWord(ex)}${ex.perSide ? " each side" : ""}`),
        h("span", { class: "xrest small muted" }, icon("clock", 14), restText(slot)),
        h("span", { class: "xmus small" }, names(m.p).join(" · "))),
      bodyMap(lv, { view: bestView(lv), cls: "mini", label: "" })),
    editing ? h("div", { class: "xedit" },
      h("div", { class: "sets-step", role: "group", "aria-label": `Sets of ${ex.name}` },
        h("button", { type: "button", class: "step-sm", "aria-label": "One set less", disabled: slot.base <= 1, onclick: () => doSets(slot, slot.base - 1) }, icon("minus", 18)),
        h("span", { class: "sets-val" }, h("b", {}, String(slot.base)), " sets"),
        h("button", { type: "button", class: "step-sm", "aria-label": "One set more", disabled: slot.base >= 5, onclick: () => doSets(slot, slot.base + 1) }, icon("plus", 18))),
      h("button", { class: "chip", type: "button", onclick: () => openSwap(slot) }, icon("swap", 16), "Swap"),
      h("button", { class: "chip danger-text", type: "button", onclick: () => doRemove(slot) }, icon("trash", 16), "Remove")) : null,
    setsChanged && !editing ? h("span", { class: "sr-only" }, `Plan has ${slot.base} sets; this week ${slot.sets}.`) : null);
  return card;
}

function unitStep(doc, u, slots) {
  return h("div", { class: "flow-step" },
    h("span", { class: "flow-dot", "aria-hidden": "true" }),
    h("div", { class: "flow-body" },
      h("div", { class: "flow-head" }, h("b", {}, u.title), h("span", { class: "small muted" }, u.sub)),
      u.slots.map((s) => exCard(doc, s, slots.indexOf(s), slots))));
}

function addStep(doc, slots) {
  const free = freePlaces(slots);
  return h("div", { class: "flow-step" },
    h("span", { class: "flow-dot add", "aria-hidden": "true" }),
    h("div", { class: "flow-body" },
      free.length
        ? h("button", { class: "add-card", type: "button", onclick: () => openAdd(free) }, icon("plus", 20), h("span", {}, h("b", {}, "Add an exercise"), h("span", { class: "small muted" }, `${free.length} free ${free.length === 1 ? "place" : "places"} on this day`)))
        : h("p", { class: "small muted" }, "This day is full: 3 pairs, 1 on its own and 2 abs places are all used. Remove one to add another.")));
}

// ---------- edit actions ----------

function lastsLine() { return `This changes every ${days[dayId].name} from now on, in all weeks. Workouts already done, and a workout you have started, stay as they were.`; }

function doRemove(slot) {
  const doc = loadDoc();
  const snap = snapshotDay(doc, dayId);
  const gone = removeSlot(doc, dayId, slot.slot);
  closeSheets();
  rerender();
  toast(`Removed ${exercises[gone.ex].name} from every ${days[dayId].name}.`, () => { restoreDay(dayId, snap); rerender(); });
}
function doSets(slot, n) {
  const doc = loadDoc();
  setSlotSets(doc, dayId, slot.slot, n);
  rerender();
}

function swapRow(doc, item, slot) {
  const ex = exercises[item.id];
  const lv = exerciseLevels(item.id);
  return h("button", { class: "mach-row swap-row", type: "button", onclick: () => {
    const snap = snapshotDay(doc, dayId);
    const from = swapSlot(doc, dayId, slot.slot, item.id);
    closeSheets();
    rerender();
    toast(`${days[dayId].name} changed for good: ${exercises[from].name} → ${ex.name}.`, () => { restoreDay(dayId, snap); rerender(); });
  } },
  thumb(item.id, { small: true }),
  h("span", { class: "grow" }, h("b", {}, ex.name),
    h("span", { class: "small muted" }, `${item.equip} · ${names(EX_MUSCLES[item.id].p).join(", ")} · ${repText(ex)} ${repWord(ex)}${item.note ? ` · ${item.note}` : ""}`),
    h("span", { class: "tags" }, item.planPick ? pill("Plan's pick", "accent") : null, item.usedToday ? pill(`Already on ${days[dayId].name}`) : null)),
  bodyMap(lv, { view: bestView(lv), cls: "mini", label: "" }));
}

// True when the exercise needs no extra machine, or the first gym visit confirmed it.
function gymHas(doc, id) {
  const need = Object.values(exercises).flatMap((e) => e.swaps).find((s) => s.id === id && s.needsMachine);
  return !need || doc.shared_settings?.extra_machines?.[need.needsMachine] === true;
}

// The way out when the matches do not suit (idea from builder A): every other exercise, grouped by main muscle,
// behind a button, with a plain warning that it changes what the day works.
function otherMusclesBox(doc, slot, res) {
  const box = h("div", {});
  const inDay = new Set(daySlots(doc, dayId, week).map((s) => s.ex));
  const shown = new Set([slot.ex, ...res.same, ...res.other, ...res.hidden].map((x) => x.id ?? x));
  const ids = Object.keys(exercises).filter((id) => !shown.has(id) && !inDay.has(id) && gymHas(doc, id));
  if (!ids.length) return null;
  const draw = (open) => box.replaceChildren(...(open
    ? [h("h3", {}, "Other muscles"),
      h("p", { class: "small status-warning" }, icon("warn", 14), " These change what the day works. The body map and the whole plan check will show it."),
      h("div", { class: "card" }, ids.sort((a, b) => GROUPS[EX_MUSCLES[a].p[0]].name.localeCompare(GROUPS[EX_MUSCLES[b].p[0]].name) || exercises[a].name.localeCompare(exercises[b].name))
        .map((id) => swapRow(doc, { id, equip: EQUIP[EX_MUSCLES[id].equip].name }, slot)))]
    : [h("button", { class: "button secondary", type: "button", onclick: () => draw(true) }, icon("body", 18), "Show exercises for other muscles")]));
  draw(false);
  return box;
}

function openSwap(slot) {
  const doc = loadDoc();
  const ex = exercises[slot.ex];
  const m = EX_MUSCLES[slot.ex];
  // Prototype only: ?nomatch=1 shows the "nothing matches" state (no exercise in the app has zero matches today).
  const res = new URLSearchParams(location.search).has("nomatch") ? { same: [], other: [], hidden: [] } : matchesFor(doc, slot.ex, daySlots(doc, dayId, week));
  const muscle = joinWords(names(m.p).map((x) => x.toLowerCase()));
  const section = (title, list, emptyText) => [
    h("h3", {}, title),
    list.length ? h("div", { class: "card" }, list.map((it) => swapRow(doc, it, slot))) : h("p", { class: "small muted empty-line" }, emptyText),
  ];
  openSheet([
    h("div", { class: "eyebrow accent" }, `${days[dayId].name} · swap for good`),
    h("h2", {}, `Swap ${ex.name}`),
    h("div", { class: "lasts-box" }, icon("info", 18), h("p", {}, lastsLine(), " You can go back to the plan's day at any time.")),
    h("p", { class: "small muted" }, `Shown: exercises whose main muscle is the ${muscle}, and the plan's own swaps. It keeps ${slot.base} sets and its rest; reps come from the new exercise.`),
    !res.same.length && !res.other.length ? null : section(`Similar equipment (${EQUIP[m.equip].name.toLowerCase()})`, res.same, `No other exercise in the app works the ${muscle} with ${m.equip === "bodyweight" ? "body weight" : "this kind of equipment"}. The ones below use other equipment.`),
    !res.same.length && !res.other.length ? null : section("Other equipment", res.other, `Nothing with other equipment either.`),
    !res.same.length && !res.other.length ? h("div", { class: "card warn" }, h("p", {}, `Nothing in the app matches ${ex.name}. You can remove it, pick one for another muscle below, or ask the Training chat to add a new exercise (with photos) for the ${muscle}.`)) : null,
    res.hidden.length ? h("p", { class: "small muted" }, icon("info", 14), ` Hidden: ${res.hidden.map((x) => exercises[x.id].name).join(", ")}. ${res.hidden.some((x) => x.state === "no") ? "Your gym does not have that machine." : "It needs a machine your first gym visit has not confirmed (Settings > Gym)."}`) : null,
    otherMusclesBox(doc, slot, res),
  ], { tall: true, label: "Swap for good" });
}

let addMuscle = null;
function openAdd(free) {
  const doc = loadDoc();
  const vol = weeklyVolume(doc, week);
  // The plan's biggest gaps (research 5.4): main muscles with fewer than 5 direct sets a week. Lower back is left out
  // (0 is normal for a beginner plan) and so are the shoulder parts (all shoulders together get about 20).
  const low = vol.rows.filter((r) => r.direct < 5 && !["lower_back", "front_delts", "side_delts", "rear_delts"].includes(r.id));
  let place = free[0];
  const sheet = openSheet([], { tall: true, label: "Add an exercise" });
  const draw = () => {
    const mins = minutesFor(doc, dayId, week);
    const groups = ["chest", "lats", "mid_back", "front_delts", "side_delts", "rear_delts", "biceps", "triceps", "quads", "hamstrings", "glutes", "calves", "abs"];
    const forMuscle = addMuscle ? Object.keys(exercises).filter((id) => EX_MUSCLES[id].p.includes(addMuscle)) : [];
    const hidden = new Set(matchesFor(doc, forMuscle[0] ?? "plank").hidden.map((x) => x.id));
    const gymOk = (id) => gymHas(doc, id);
    sheet.fill([
      h("div", { class: "eyebrow accent" }, `${days[dayId].name} · add for good`),
      h("h2", {}, "Add an exercise"),
      h("div", { class: "lasts-box" }, icon("info", 18), h("p", {}, lastsLine())),
      h("h3", {}, "Where it goes"),
      h("p", { class: "small muted" }, "A day has places for 3 pairs, 1 exercise on its own after the pairs, and 2 abs exercises. An add fills a free place, so the week's set rules keep working."),
      h("div", { class: "chips" }, free.map((p) => h("button", { class: `chip ${p === place ? "accent" : ""}`, type: "button", "aria-pressed": p === place ? "true" : "false", onclick: () => { place = p; draw(); } }, PLACE_NAMES[p]))),
      h("p", { class: "small muted" }, `Now about ${mins.minutes} min. 3 more sets add about 8 minutes.`),
      h("h3", {}, "For which muscle"),
      low.length ? h("p", { class: "small muted" }, `Fewest sets a week in your plan now (marked “few”): ${low.map((r) => `${r.name.toLowerCase()} ${r.direct}`).join(", ")}. See the whole plan check.`) : null,
      h("div", { class: "chips" }, groups.map((g) => h("button", { class: `chip ${addMuscle === g ? "accent" : ""} ${low.some((r) => r.groups.includes(g)) ? "low" : ""}`, type: "button", "aria-pressed": addMuscle === g ? "true" : "false", onclick: () => { addMuscle = g; draw(); } }, GROUPS[g].name))),
      addMuscle ? h("div", { class: "card" }, forMuscle.filter(gymOk).map((id) => {
        const ex = exercises[id];
        const lv = exerciseLevels(id);
        return h("button", { class: "mach-row swap-row", type: "button", onclick: () => {
          const snap = snapshotDay(doc, dayId);
          addSlot(doc, dayId, place, id, 3);
          closeSheets(); rerender();
          toast(`Added ${ex.name} to every ${days[dayId].name} (3 sets).`, () => { restoreDay(dayId, snap); rerender(); });
        } }, thumb(id, { small: true }), h("span", { class: "grow" }, h("b", {}, ex.name), h("span", { class: "small muted" }, `${ex.equipment} · 3 sets × ${repText(ex)} ${repWord(ex)}`)), bodyMap(lv, { view: bestView(lv), cls: "mini", label: "" }));
      }), forMuscle.filter(gymOk).length ? null : h("p", { class: "small muted" }, "No exercise for this muscle in the app yet.")) : h("p", { class: "small muted" }, "Pick a muscle to see the exercises for it."),
      addMuscle && forMuscle.some((id) => !gymOk(id)) ? h("p", { class: "small muted" }, `Hidden until your first gym visit confirms the machine: ${forMuscle.filter((id) => !gymOk(id)).map((id) => exercises[id].name).join(", ")}.`) : null,
    ]);
    void hidden;
  };
  draw();
}

function confirmReset(doc) {
  const words = changeWords(doc, dayId);
  const s = openSheet([
    h("h2", {}, `Back to the plan's ${days[dayId].name}?`),
    h("p", {}, "These changes go away:"),
    h("ul", { class: "change-list" }, words.map((w) => h("li", {}, w))),
    h("p", { class: "small muted" }, "Workouts already done stay as they were. Your weights and history for each exercise are kept."),
    h("button", { class: "button", type: "button", onclick: () => { const snap = snapshotDay(loadDoc(), dayId); resetDay(dayId); s.close(); editing = false; rerender(); toast(`${days[dayId].name} is the plan's day again.`, () => { restoreDay(dayId, snap); rerender(); }); } }, `Back to the plan's ${days[dayId].name}`),
    h("button", { class: "button secondary", type: "button", onclick: () => s.close() }, `Keep my ${days[dayId].name}`),
  ], { label: "Back to the plan's day" });
}

// ---------- week picker: also holds the 12-week table that used to sit at the bottom of the Plan tab ----------

const setsRule = (w) => (w.setsMode === "two" ? "2 sets per exercise" : w.setsMode === "easier" ? "1 set less" : w.setsMode === "build2" ? "Pair A: 4th set; on its own: 2" : "As in the plan");
const rirWords = (w) => `Stop with ${Array.isArray(w.rir) ? w.rir.join("-") : w.rir} left${w.wedRir !== w.rir ? ` (Wed ${w.wedRir})` : ""}`;
function openWeeks() {
  const now = thisWeek();
  const s = openSheet([
    h("h2", {}, "The 12 weeks"),
    h("p", { class: "small muted" }, "Pick a week to see its real sets on every day."),
    h("div", { class: "card week-list" }, weeks.map((w) => h("button", { class: `mach-row ${w.week === week ? "on" : ""}`, type: "button", "aria-pressed": w.week === week ? "true" : "false", onclick: () => { week = w.week; s.close(); rerender(); } },
      h("span", { class: `week-num ${w.week === now ? "now" : ""}` }, String(w.week)),
      h("span", { class: "grow" }, h("b", {}, w.phase, w.week === now ? pill("This week", "accent") : null), h("span", { class: "small muted" }, `${setsRule(w)} · ${rirWords(w)}`), h("span", { class: "small muted" }, `Walk: ${w.walkNote}`)),
      w.week === week ? icon("check", 20) : null))),
    h("p", { class: "small muted" }, "“Stop with 2 left” (RIR, reps in reserve): how many more good reps you could still do when you stop."),
  ], { tall: true, label: "The 12 weeks" });
}

// ---------- the Plan tab ----------

export function renderPlan() {
  ensureState();
  const doc = loadDoc();
  const slots = daySlots(doc, dayId, week);
  const notThisWeek = week !== thisWeek();
  const locked = runningDay(doc) === dayId && !notThisWeek;
  if (locked) editing = false;
  const weekChip = h("button", { class: "chip week-chip", type: "button", onclick: openWeeks, "aria-label": `Showing week ${week}. Change week.` }, `Week ${week}`, icon("chevron", 14));
  const children = [
    head(`Plan · ${weekInfo(week).phase}`, "", weekChip),
    dayNav(),
    dayStrip(),
    notThisWeek ? h("div", { class: "card week-note" }, h("p", { class: "small" }, `Showing week ${week}, not this week (${thisWeek()}). Sets follow week ${week}'s rules.`), h("button", { class: "text-button", type: "button", onclick: () => { week = thisWeek(); rerender(); } }, "Back to this week")) : null,
    editing ? h("div", { class: "lasts-box edit-banner" }, icon("edit", 18), h("p", {}, h("b", {}, `Editing ${days[dayId].name}. `), lastsLine())) : null,
    locked ? h("div", { class: "card running-card" }, icon("clock", 20), h("p", {}, h("b", {}, `${days[dayId].name}'s workout is running. `), "It keeps its exercises. You can change this day after you finish it, or swap for this workout only from the workout screen.")) : null,
  ];
  const content = h("div", { class: `day-content ${slideDir > 0 ? "from-right" : slideDir < 0 ? "from-left" : ""}` },
    editing ? null : heroCard(doc, slots),
    editing ? null : editedCard(doc),
    lastDoneLine(doc),
    h("div", { class: "flow" },
      walkStep(), warmStep(),
      units(slots).map((u) => unitStep(doc, u, slots)),
      editing ? addStep(doc, slots) : null),
    editing ? null : h("a", { class: "check-link card", href: "#/plan/check" },
      h("span", { class: "area-icon" }, icon("body", 20)),
      h("span", { class: "grow" }, h("b", {}, "Whole plan check"), h("span", { class: "small muted" }, "Weekly sets per muscle, Monday to Friday")),
      icon("chevron", 18)));
  slideDir = 0;
  children.push(content);
  const bar = locked
    ? tabActionBar(secondaryButton([icon("play", 18), "Back to the workout"], () => go("#/today"), "edit-btn"))
    : editing
    ? tabActionBar(mainButton(["Done", icon("check", 20, { strokeWidth: 2.6 })], () => { editing = false; rerender(); }))
    : tabActionBar(secondaryButton([icon("edit", 18), `Edit ${days[dayId].name}`], () => { editing = true; rerender(); }, "edit-btn"));
  const main = screenWithBar(...children);
  // Swipe left or right changes the day too (the arrows and the strip are always there; swipe is never the only way).
  let x0 = null;
  main.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  main.addEventListener("touchend", (e) => { if (x0 === null || editing) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 70) moveDay(dx < 0 ? 1 : -1); }, { passive: true });
  onMount(() => { if (!reduced()) stagger(main.querySelectorAll(".flow-step")); });
  return [main, bar];
}

// ---------- the whole-plan check ----------

let checkBand = null;
let withHelpers = false;
const BANDS = [["1", "1", 1], ["2", "2–5", 2], ["6", "6", 6], ["7", "7–11", 7], ["12", "12", 12]];
function bandOf(w) { return w === 1 ? "1" : w <= 5 ? "2" : w === 6 ? "6" : w <= 11 ? "7" : "12"; }

function barRow(r, max) {
  const n = withHelpers ? r.weighted : r.direct;
  const sub = r.sub === true;
  const v = sub ? { word: "Part of shoulders", cls: "sub" } : verdict(n);
  const bar = h("div", { class: "vol-bar", "aria-hidden": "true" }, h("span", { class: `fill ${v.cls}` }), h("i", { class: "mark m10" }), h("i", { class: "mark m20" }));
  bar.firstChild.style.transform = `scaleX(${Math.min(1, n / max)})`;
  bar.querySelector(".m10").style.left = `${(10 / max) * 100}%`;
  bar.querySelector(".m20").style.left = `${(20 / max) * 100}%`;
  const dayList = DAY_IDS.filter((d) => r.days.has(d)).map((d) => days[d].name.slice(0, 3));
  return h("div", { class: `vol-row ${sub ? "sub" : ""}`, role: "listitem" },
    h("div", { class: "vol-top" },
      h("b", {}, r.name, r.note ? h("span", { class: "small muted" }, ` (${r.note})`) : null),
      h("span", { class: "vol-num" }, h("b", {}, n % 1 ? n.toFixed(1) : String(n)), h("span", { class: "unit" }, " sets"))),
    bar,
    h("div", { class: "vol-bottom small" },
      h("span", { class: `verdict ${v.cls}` }, v.word),
      h("span", { class: "muted" }, dayList.length ? `${dayList.length} ${dayList.length === 1 ? "day" : "days"}: ${dayList.join(", ")}` : "No day as the main muscle"),
      !withHelpers && r.weighted !== r.direct ? h("span", { class: "muted" }, `· ${r.weighted % 1 ? r.weighted.toFixed(1) : r.weighted} with helpers`) : null));
}

// Shoulders: the total gets the verdict; front, side and rear follow as smaller rows without one (research 5.3).
function listRows(rows, all) {
  const out = [];
  for (const r of rows) {
    if (["front_delts", "side_delts", "rear_delts"].includes(r.id)) continue;
    out.push(r);
    if (r.id === "back") { out.push({ ...all, name: "Shoulders", note: "front + side + rear" }); for (const id of ["front_delts", "side_delts", "rear_delts"]) out.push({ ...rows.find((x) => x.id === id), sub: true }); }
  }
  return out;
}

export function renderCheck() {
  ensureState();
  const doc = loadDoc();
  if (!checkBand) checkBand = bandOf(thisWeek());
  const w = BANDS.find((b) => b[0] === checkBand)[2];
  const { rows, all } = weeklyVolume(doc, w);
  const levels = {};
  for (const r of rows) for (const g of r.groups) { const n = withHelpers ? r.weighted : r.direct; levels[g] = n >= 10 ? 3 : n >= 6 ? 2 : n > 0 ? 1 : 0; }
  const max = 32;
  const editedDays = DAY_IDS.filter((d) => isEdited(doc, d));
  // The summary leaves out the shoulder parts (counted together below) and the lower back (0 is fine for a beginner).
  const mainRows = rows.filter((r) => !["lower_back", "front_delts", "side_delts", "rear_delts"].includes(r.id));
  const val = (r) => (withHelpers ? r.weighted : r.direct);
  const under = mainRows.filter((r) => val(r) < 10).sort((a, b) => val(a) - val(b)).map((r) => `${r.name.toLowerCase()} ${val(r) % 1 ? val(r).toFixed(1) : val(r)}`);
  const over = [...mainRows, all].filter((r) => val(r) > 20).map((r) => `${r.name.toLowerCase()} ${val(r) % 1 ? val(r).toFixed(1) : val(r)}`);
  const main = screen(
    h("a", { class: "text-button back-link", href: "#/plan" }, icon("back", 18), "Plan"),
    h("span", { class: "eyebrow accent" }, "Monday to Friday"),
    h("h1", {}, "Whole plan check"),
    h("p", { class: "muted" }, "How many hard sets each muscle gets in a week. This screen only shows numbers: it does not change your plan."),
    h("span", { class: "eyebrow seg-label" }, "Weeks"),
    segmented(BANDS.map(([v, label]) => [v, label]), checkBand, (v) => { checkBand = v; rerender(); }, "Which weeks"),
    segmented([["main", "Main muscle only"], ["help", "Helpers count half"]], withHelpers ? "help" : "main", (v) => { withHelpers = v === "help"; rerender(); }, "How sets are counted"),
    h("section", { class: "check-hero" },
      bodyMap(levels, { label: `Weekly sets map. Under 10: ${under.join(", ") || "none"}.` }),
      h("div", { class: "check-hero-text" },
        h("span", { class: "eyebrow" }, `Week ${w === 2 ? "2 to 5" : w === 7 ? "7 to 11" : w}`),
        h("p", {}, h("b", {}, under.length ? `Under 10 a week: ${joinWords(under)}.` : "Every main muscle has 10 or more.")),
        over.length ? h("p", {}, h("b", {}, `More than 20: ${joinWords(over)}.`)) : null,
        legend(["1 to 5 sets", "6 to 9", "10 or more"]))),
    editedDays.length ? h("p", { class: "small accent-words" }, icon("edit", 14), ` Includes your changes to ${joinWords(editedDays.map((d) => days[d].name))}.`) : null,
    h("div", { class: "card vol-list", role: "list" }, listRows(rows, all).map((r) => barRow(r, max))),
    h("p", { class: "small muted" }, "Not trained on purpose in this plan: traps, forearms, neck and inner thighs (normal for a beginner plan)."),
    h("h2", {}, "How to read it"),
    h("ul", { class: "how-list small" },
      h("li", {}, h("b", {}, "The line at 10: "), "at least about 10 hard sets a week, on 2 or more days, for each main muscle (ACSM 2026; Schoenfeld 2017)."),
      h("li", {}, h("b", {}, "10 to 20: "), "the usual range. Above about 20 is more than a beginner needs."),
      h("li", {}, h("b", {}, "Helpers count half: "), "a set where the muscle only helps counts as half a set (Pelland 2024 preprint; Hevy; Boostcamp)."),
      h("li", {}, h("b", {}, "Where the muscles come from: "), "free-exercise-db. It lists calves and hamstrings as helpers of squats and the leg press, which flatters them with helpers counted. Trust “Main muscle only” for those two."),
      h("li", {}, h("b", {}, "Want a change? "), "Talk to the Training chat. You can also add an exercise to a day with Edit.")));
  onMount(() => { if (!reduced()) main.querySelectorAll(".vol-bar .fill").forEach((el, i) => el.animate?.([{ transform: "scaleX(0)" }, { transform: el.style.transform }], { duration: 460, delay: i * 30, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" })); });
  return main;
}

export function planState() { ensureState(); return { dayId, week }; }
export function setPlanDay(d) { dayId = d; }
