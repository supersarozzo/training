// The Plan tab (build step 2, docs/DESIGN.md 15.3; mock-up "Plan day"): one day per page, read like Today, opened on
// today with the real sets of this week. Base: builder A's day page; B's focus words, done ticks and the "Whole plan
// check" card. Top: week chip (opens the 12 weeks), the gear. Then the day name with "Today", the day strip, focus and
// meta line, the walk card first, pair headers in words, cards with a small body map, the "Whole plan check" card.
// No day arrows at the bottom since 0.6.0 (Rosario: the day strip at the top already picks the day). Plan is the plan to
// edit and the overview; the workout starts from Today. Each card shows the weight to use (0.6.0). No big day map (70 a).
// Read-only in this step: Edit comes with build steps 3 and 4. No Print (removed by Rosario, PRD F3).
// All text through h(); no innerHTML; no style attributes.
import { h } from "../h.js";
import { screen, openSheet, closeSheets } from "./parts.js";
import { model, rerender, go } from "./app.js";
import { today } from "../clock.js";
import { dayLayout } from "../dayplan.js";
import { days, exercises, weeks, weekInfo, rirFor, DAY_IDS, walkRules } from "../plan/plan-v2.js";
import { thumb } from "./media.js";
import { icon } from "./icons.js";
import { onMount, stagger } from "./motion.js";
import { miniMap } from "./bodymap.js";
import { openExerciseLayer, doseParts } from "./exlayer.js";
import { pageFor, muscleWords } from "../engine/planpage.js";
import { ADDED_SLOTS, MAX_ADDED } from "../engine/planedits.js";
import { viewDay, unitsIn, editedMinutes, rangeFor, weightLine } from "../planview.js";
import { renderMuscleCheck } from "./musclecheck.js";
import { dayState, openSwapSheet, openAddSheet, removeSlot, changedCard, openDoseSheet } from "./planedit.js";

// The page remembers the picked day and week while you stay on the tab; coming back to the tab opens today again.
// `edit`: Edit mode (build step 4). It is page state: it ends when the day changes or the tab is left.
const state = { day: null, week: null, edit: false };
export function resetPlanPage() { state.day = null; state.week = null; state.edit = false; }

const dayShort = (d) => days[d].name.slice(0, 3);
// "Upper body A" -> "Upper A", "Full body (a bit lighter)" -> "Full" (builder B's strip words).
const focusShort = (d) => days[d].focus.replace(/\s*\(.*\)/, "").replace(" body", "");
const rirText = (r) => (Array.isArray(r) ? `${r[0]}–${r[1]}` : String(r));
const setsRule = (w) => (w.setsMode === "two" ? "2 per exercise" : w.setsMode === "easier" ? "1 set less" : w.setsMode === "build2" ? "Pair A: 4th set" : "Sets as shown on each day");

function openWeeks(thisWeek, shown) {
  openSheet(
    h("h2", {}, "The 12 weeks"),
    h("p", { class: "small muted" }, "Pick a week to see its real sets on every day."),
    h("div", { class: "card weeks-list" }, weeks.map((w) => h("button", {
      class: "mach-row", type: "button", "aria-current": w.week === shown ? "true" : null,
      "aria-label": `Week ${w.week}${w.week === thisWeek ? ", this week" : ""}: ${w.phase}. ${setsRule(w)}, RIR ${rirText(w.rir)}. Show this week's sets.`,
      onclick: () => { state.week = w.week === thisWeek ? null : w.week; closeSheets(); rerender(); },
    },
    h("span", { class: `week-num ${w.week === thisWeek ? "now" : ""}` }, String(w.week)),
    h("span", { class: "grow" },
      h("b", {}, w.phase, w.week === thisWeek ? h("span", { class: "badge slot inline" }, "This week") : null),
      h("span", { class: "small muted" }, `${setsRule(w)} · RIR ${rirText(w.rir)}${w.wedRir !== w.rir ? ` (Wed ${w.wedRir})` : ""} · ${w.walkNote}`)),
    w.week === shown ? h("span", { class: "accent-text" }, icon("check", 20)) : null))),
    h("p", { class: "small muted" }, "RIR = reps in reserve: how many more good reps you could still do when you stop."));
}

function dayStrip(doc, shown, todayDay, week) {
  const changed = new Set(DAY_IDS.filter((d) => viewDay(doc, d, week).edited));
  const done = new Set(doc.sessions.filter((x) => !x.deleted && x.week === week && x.status === "finished").map((x) => x.plan_day));
  return h("div", { class: "day-strip", role: "tablist", "aria-label": "Day of the plan" },
    DAY_IDS.map((d) => h("button", {
      class: `${d === todayDay ? "is-today" : ""} ${done.has(d) ? "is-done" : ""}`.trim() || null, type: "button", role: "tab",
      "aria-selected": d === shown ? "true" : "false",
      "aria-label": `${days[d].name}, ${days[d].focus}${d === todayDay ? ", today" : ""}${done.has(d) ? ", done" : ""}${changed.has(d) ? ", changed" : ""}`,
      onclick: () => { if (d !== shown) state.edit = false; state.day = d; rerender(); },
    }, h("b", {}, dayShort(d)), h("small", {}, focusShort(d)), h("i", { "aria-hidden": "true" }, done.has(d) ? icon("check", 12, { strokeWidth: 3.2 }) : null),
    changed.has(d) ? h("span", { class: "badge chg-mark", "aria-hidden": "true" }, "changed") : null)));
}

function walkCard(minutes, day) {
  const easy = days[day].walk === "easy";
  return h("div", { class: "pcard walk" },
    h("span", { class: "tile-ic" }, icon("walk", 26)),
    h("span", { class: "grow" },
      h("b", {}, "Walk first"),
      h("span", { class: "walk-min" }, h("b", {}, String(minutes)), " min uphill"),
      h("span", { class: "small muted" }, easy
        ? `Easier: ${walkRules.legDaySlopeLess_pct} % less slope, effort ${walkRules.legDayEffort.join(" to ")} of 10`
        : `Normal: effort ${walkRules.normalEffort.join(" to ")} of 10`)));
}

// `edit`: Edit mode, with Swap and Remove under the card. A swapped or added place carries a badge (build step 4).
function exCard(doc, day, week, slot, edit = false) {
  const ex = exercises[slot.ex];
  const range = rangeFor(doc, slot.ex);
  const wl = weightLine(doc, slot.ex, week);
  const words = muscleWords(slot.ex);
  const added = ADDED_SLOTS.includes(slot.slot);
  const planned = days[day].slots.find((x) => x.slot === slot.slot);
  const badge = added ? "Added" : planned && planned.ex !== slot.ex ? "Swapped" : null;
  const card = h("button", {
    class: "pcard ex", type: "button",
    "aria-label": `${ex.name}${badge ? ` (${badge.toLowerCase()})` : ""}: ${slot.sets} sets of ${range[0] === range[1] ? range[0] : `${range[0]} to ${range[1]}`}${ex.kind === "hold" ? " seconds" : " reps"}${ex.perSide ? " each side" : ""}. Weight: ${wl.text}. ${words.card}. Open muscles, photos and tips.`,
    onclick: () => openExerciseLayer(slot.ex, { day, week, slot: slot.slot }),
  },
  thumb(slot.ex),
  h("span", { class: "grow" },
    h("b", { class: "pc-name" }, ex.name, badge ? h("span", { class: "badge inline acc" }, badge) : null),
    h("span", { class: "dose" }, doseParts(ex, slot.sets, range)),
    h("span", { class: `weight-line${wl.kg ? "" : " muted"}` }, wl.kg ? [h("b", {}, wl.text), wl.note === "Your weight, set in the Plan." ? " · yours" : ""] : wl.text),
    h("span", { class: "small muted" }, words.card)),
  miniMap(slot.ex),
  h("span", { class: "chev" }, icon("chevron", 18)));
  if (!edit) return card;
  return h("div", { class: "ecard" }, card,
    h("div", { class: "ebtns" },
      h("button", { type: "button", "aria-label": `Change sets, reps or weight of ${ex.name}`, onclick: () => openDoseSheet(day, week, slot.slot) }, icon("edit", 18), "Change"),
      h("button", { type: "button", "aria-label": `Swap ${ex.name}`, onclick: () => openSwapSheet(day, week, slot.slot) }, icon("swap", 18), "Swap"),
      h("button", { type: "button", "aria-label": `Remove ${ex.name} from ${days[day].name}`, onclick: () => removeSlot(day, slot.slot) }, icon("close", 18), "Remove")));
}

// "2 November": the block's start date in words (a date-only string read at noon, so no time zone shifts the day).
const startWords = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long" });

export function renderPlan() {
  if (location.hash.startsWith("#/plan/muscles")) return renderMuscleCheck(); // the whole-plan muscle check (build step 5)
  const doc = model.doc();
  const t = today();
  const page = pageFor(doc.block.start_monday, t);
  const day = state.day ?? page.day;
  const week = state.week ?? page.week;
  const wi = weekInfo(week);
  const view = dayState(doc, day, week);
  const slots = view.slots;
  const edit = state.edit && view.canEdit;
  const totalSets = slots.reduce((n, x) => n + x.sets, 0);
  const lay = dayLayout(doc, { planDay: day, week, today: t });
  const minutes = editedMinutes(lay.minutes, day, week, view.record);
  const addedLeft = MAX_ADDED - slots.filter((x) => ADDED_SLOTS.includes(x.slot)).length;
  const dayWord = days[day].name;
  const isToday = day === page.todayDay && week === page.week;

  const units = unitsIn(slots).map((u) => [
    h("div", { class: "unit-head" }, u.title),
    u.slots.map((x) => exCard(doc, day, week, x, edit)),
  ]);
  const addButton = edit ? (addedLeft > 0
    ? h("button", { class: "button secondary add-ex", type: "button", onclick: () => openAddSheet(day, week, page.week) }, icon("plus", 20), `Add an exercise (${addedLeft} of ${MAX_ADDED} left)`)
    : h("button", { class: "button secondary add-ex", type: "button", disabled: true }, `${MAX_ADDED} added: the most for one day`)) : null;
  const editCard = edit ? h("div", { class: "card changed-card" },
    h("p", {}, h("b", {}, `Editing ${dayWord}.`), ` Each change saves at once and lasts: every ${dayWord} from now on, in every week. Past workouts stay as they were.`),
    h("p", { class: "small muted" }, `About ${minutes} minutes now; the plan's day is about ${lay.minutes}.`)) : null;
  const lockCard = view.locked ? h("div", { class: "card lock-card" }, icon("info", 20), h("p", {}, "Workout running. This day can be changed after the workout ends.")) : null;
  const newerLine = view.newerVersion ? h("div", { class: "note-line" }, icon("info", 16), h("span", {}, "This day was changed on a newer app version. Update the app to change it.")) : null;
  const editChip = view.canEdit ? h("button", {
    class: "chip edit-chip", type: "button", "aria-pressed": edit ? "true" : "false",
    "aria-label": edit ? "Done editing this day" : `Edit ${dayWord}`,
    onclick: () => { state.edit = !edit; rerender(); },
  }, edit ? "Done" : "Edit") : null;

  const main = screen(
    h("div", { class: "plan-flow" },
      h("div", { class: "plan-top" },
        h("button", { class: "week-chip", type: "button", onclick: () => openWeeks(page.week, week), "aria-label": `Week ${week} of ${weeks.length}, ${wi.phase}. Open the 12 weeks.` },
          `Week ${week} · ${wi.phase}`, icon("chevron", 16, { strokeWidth: 2.6 })),
        editChip),
      h("div", { class: "plan-day" }, h("h1", {}, days[day].name), isToday ? h("span", { class: "today-tag" }, "Today") : null),
      edit ? null : dayStrip(doc, day, week === page.week ? page.todayDay : null, week), // Edit mode: as the mock-up, the first exercise in view
      h("div", { class: "plan-sum" },
        h("div", { class: "plan-focus" }, days[day].focus),
        h("div", { class: "plan-meta" },
          h("span", {}, "about ", h("b", {}, String(minutes)), " min"),
          h("span", {}, h("b", {}, String(totalSets)), " sets"),
          h("span", {}, "stop with ", h("b", {}, rirText(rirFor(week, day))), " left"))),
      week !== page.week ? h("div", { class: "note-line" }, icon("info", 16), h("span", {}, `Showing week ${week}. This week is week ${page.week}.`),
        h("button", { class: "text-button", type: "button", onclick: () => { state.week = null; rerender(); } }, "Back to this week")) : null,
      page.state === "before" && week === page.week ? h("p", { class: "small muted" }, `Your plan starts on Monday ${startWords(doc.block.start_monday)}.`) : null,
      page.state === "after" && week === page.week ? h("p", { class: "small muted" }, "The 12 weeks are done. This is week 12 of the plan.") : null,
      editCard,
      lockCard,
      newerLine,
      !edit && view.edited ? changedCard(day, view.record, { canReset: view.canEdit }) : null,
      edit ? null : walkCard(lay.walk.minutes, day),
      units,
      addButton,
      h("button", { class: "pcard check", type: "button", onclick: () => go("#/plan/muscles") },
        h("span", { class: "tile-ic" }, icon("body", 26)),
        h("span", { class: "grow" }, h("b", {}, "Whole plan check"), h("span", { class: "small muted" }, "Weekly sets per muscle, Monday to Friday")),
        h("span", { class: "chev" }, icon("chevron", 18))),
      h("p", { class: "small muted center" }, "Tap an exercise for its muscles, photos and tips.")));
  main.className = edit ? "screen has-bar plan-screen" : "screen has-tabs plan-screen";
  onMount(() => stagger(main.querySelectorAll(".pcard")));

  if (!edit) return main;
  const bar = h("div", { class: "bar action-bar day-bar" }, h("div", { class: "bar-inner" },
    h("button", { class: "button", type: "button", onclick: () => { state.edit = false; rerender(); } }, icon("check", 22), "Done editing")));
  return [main, bar];
}
