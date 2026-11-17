// Plan sheet: the whole plan v2 as tables. Prints on A4 (see the print rules in css/app.css).
// Redesign B: three parts behind a segmented control (Week, Exercises, Machines). On screen the days are inset lists
// with each exercise's photo (tap: how to do it); the A4 print still uses the same tables as before (print-only).
import { h } from "../h.js";
import { screen, navHead, segmented, section, group, row, foot, exerciseMedia, chip } from "./parts.js";
import { rerender } from "./app.js";
import { openExercise } from "./exsheet.js";
import { machinesList } from "./machines.js";
import { exercises, days, weeks, DAY_IDS, MOVE_SECONDS, walkRules } from "../plan/plan-v2.js";

function repText(ex) {
  const [lo, hi] = ex.range;
  const unit = ex.kind === "hold" ? " s" : "";
  const range = lo === hi ? `${lo}` : `${lo}-${hi}`;
  const side = ex.perSide ? " each side" : "";
  return `${range}${unit}${side}`;
}

function restText(slot) {
  if (slot.slot === "D") return `${slot.rest} s between sets`;
  if (slot.rest === null) return `${MOVE_SECONDS} s to move`;
  return `${slot.rest} s`;
}

function swapText(ex) {
  if (!ex.swaps.length) return "";
  return ex.swaps.map((s) => {
    const name = exercises[s.id].name;
    if (s.needsMachine) return `${name} (only if the gym has it)`;
    return s.note ? `${name} (${s.note})` : name;
  }).join("; ");
}

function dayTable(dayId) {
  const day = days[dayId];
  const rows = day.slots.map((slot) => {
    const ex = exercises[slot.ex];
    const swap = swapText(ex);
    return h("tr", {},
      h("td", {}, slot.slot === "D" ? "D" : slot.slot),
      h("td", {},
        h("strong", {}, ex.name),
        h("div", { class: "small muted" }, ex.equipment),
        swap ? h("div", { class: "small muted" }, `Swap: ${swap}`) : null),
      h("td", { class: "nowrap" }, `${slot.sets} × ${repText(ex)}`),
      h("td", {}, restText(slot)));
  });
  const walkText = day.walk === "easy"
    ? `Walk: easier (${walkRules.legDaySlopeLess_pct} % less slope, effort ${walkRules.legDayEffort.join(" to ")} of 10)`
    : `Walk: normal (effort ${walkRules.normalEffort.join(" to ")} of 10)`;
  return h("section", { class: "card print-only" },
    h("h2", {}, `${day.name}: ${day.focus}`),
    h("p", { class: "small muted" }, walkText),
    h("div", { class: "table-wrap" },
      h("table", {},
        h("thead", {}, h("tr", {}, h("th", {}, "Slot"), h("th", {}, "Exercise"), h("th", {}, "Sets × reps"), h("th", {}, "Rest"))),
        h("tbody", {}, rows))));
}

function rirText(rir) { return Array.isArray(rir) ? `${rir[0]}-${rir[1]}` : String(rir); }

function weeksTable() {
  const rows = weeks.map((w) => {
    return h("tr", {},
      h("td", {}, String(w.week)),
      h("td", {}, w.phase),
      h("td", {}, w.setsMode === "two" ? "2 per exercise" : w.setsMode === "easier" ? "1 set less" : w.setsMode === "build2" ? "Pair A: 4th set" : "As in the tables"),
      h("td", {}, `RIR ${rirText(w.rir)}${w.wedRir !== w.rir ? ` (Wed ${w.wedRir})` : ""}`),
      h("td", {}, w.walkNote));
  });
  return h("section", { class: "card print-only" },
    h("h2", {}, "The 12 weeks"),
    h("div", { class: "table-wrap" },
      h("table", {},
        h("thead", {}, h("tr", {}, h("th", {}, "Week"), h("th", {}, "Phase"), h("th", {}, "Sets"), h("th", {}, "Effort"), h("th", {}, "Walk"))),
        h("tbody", {}, rows))),
    h("p", { class: "small muted" }, "RIR = reps in reserve: how many more good reps you could still do when you stop."));
}

// ---------- on screen ----------
let tab = "week";
// Settings opens the plan on its Machines part.
export function showPlanPart(part) { tab = part; }
const setsText = (w) => (w.setsMode === "two" ? "2 per exercise" : w.setsMode === "easier" ? "1 set less" : w.setsMode === "build2" ? "Pair A: 4th set" : "As in the tables");

function dayGroup(dayId) {
  const day = days[dayId];
  const walk = day.walk === "easy"
    ? `Walk first: easier (${walkRules.legDaySlopeLess_pct} % less slope, effort ${walkRules.legDayEffort.join(" to ")} of 10)`
    : `Walk first: normal (effort ${walkRules.normalEffort.join(" to ")} of 10)`;
  return section(`${day.name} · ${day.focus}`,
    group(day.slots.map((slot) => {
      const ex = exercises[slot.ex];
      const swap = swapText(ex);
      return row({
        title: ex.name,
        sub: `${slot.slot} · ${slot.sets} × ${repText(ex)} · ${slot.rest === null ? restText(slot) : `rest ${restText(slot)}`}${swap ? ` · Swap: ${swap}` : ""}`,
        lead: exerciseMedia(slot.ex, ex.name, "thumb"),
        onclick: () => openExercise(slot.ex), chevron: true,
      });
    })),
    foot(walk));
}

function weeksGroup() {
  return section("The 12 weeks",
    group(weeks.map((w) => row({
      title: `Week ${w.week} · ${w.phase}`,
      sub: `${setsText(w)} · RIR ${rirText(w.rir)}${w.wedRir !== w.rir ? ` (Wed ${w.wedRir})` : ""} · ${w.walkNote}`,
    }))),
    foot("RIR = reps in reserve: how many more good reps you could still do when you stop."));
}

function exerciseList() {
  const ids = Object.keys(exercises).sort((a, b) => exercises[a].name.localeCompare(exercises[b].name));
  return [
    h("p", { class: "subhead muted" }, "Every exercise in the plan, with its swaps. Tap one to see how to do it."),
    section(`${ids.length} exercises`, group(ids.map((id) => row({
      title: exercises[id].name, sub: exercises[id].equipment,
      lead: exerciseMedia(id, exercises[id].name, "thumb"),
      onclick: () => openExercise(id), chevron: true,
    })))),
  ];
}

export function renderPlan() {
  const pick = (v) => { tab = v; rerender(); };
  // Print always prints the whole plan (the print-only tables), whichever part is open.
  const printChip = chip("Print", () => window.print(), "print", "no-print");
  const onScreen = tab === "exercises" ? exerciseList()
    : tab === "machines" ? machinesList()
    : [
      h("p", { class: "subhead muted" }, "Monday to Friday. Walk first, then weights in pairs."),
      section("The week", group(DAY_IDS.map((id) => row({ title: days[id].name, value: days[id].focus })))),
      DAY_IDS.map(dayGroup),
      weeksGroup(),
    ];
  return screen(
    navHead("Plan", null, printChip),
    h("div", { class: "no-print" }, segmented([["week", "Week"], ["exercises", "Exercises"], ["machines", "Machines"]], tab, pick, { label: "Part of the plan" })),
    h("div", { class: "screen-only" }, onScreen),
    h("div", { class: "print-only" },
      h("h1", {}, "Plan"),
      h("p", { class: "muted" }, "Monday to Friday. Walk first, then weights in pairs."),
      h("h2", {}, "The week"),
      h("div", { class: "card" },
        h("table", {}, h("tbody", {}, DAY_IDS.map((id) =>
          h("tr", {}, h("td", {}, h("strong", {}, days[id].name)), h("td", {}, days[id].focus)))))),
      DAY_IDS.map(dayTable),
      weeksTable()));
}
