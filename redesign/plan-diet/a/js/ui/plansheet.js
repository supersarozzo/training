// Plan sheet: the whole plan v2. Look from builder B (redesign/JUDGING.md 3.2): three parts behind a segmented control
// (Week, Exercises, Machines). On screen the days are lists with each exercise's photo (tap: how to do it). Print always
// prints the whole plan as the same A4 tables as before (print-only), whichever part is open.
import { h } from "../h.js";
import { screen } from "./parts.js";
import { rerender, model } from "./app.js";
import { machines, AREA_ORDER, AREAS } from "../plan/media.js";
import { openMachineCard, whereOf } from "./machines.js";
import { exercises, days, weeks, DAY_IDS, MOVE_SECONDS, walkRules } from "../plan/plan-v2.js";
import { thumb } from "./media.js";
import { icon } from "./icons.js";
import { openExerciseInfo } from "./exinfo.js";

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
let part = "week";
const setsText = (w) => (w.setsMode === "two" ? "2 per exercise" : w.setsMode === "easier" ? "1 set less" : w.setsMode === "build2" ? "Pair A: 4th set" : "As in the tables");
const row = (lead, title, sub, onclick) => h(onclick ? "button" : "div", { class: `mach-row ${onclick ? "" : "static"}`, type: onclick ? "button" : null, onclick },
  lead, h("span", { class: "grow" }, h("b", {}, title), sub ? h("span", { class: "small muted" }, sub) : null), onclick ? h("span", { class: "muted" }, icon("chevron", 18)) : null);
const openEx = (id) => openExerciseInfo(id, { settingsNote: false });

function dayList(dayId) {
  const day = days[dayId];
  const walk = day.walk === "easy"
    ? `Walk first: easier (${walkRules.legDaySlopeLess_pct} % less slope, effort ${walkRules.legDayEffort.join(" to ")} of 10)`
    : `Walk first: normal (effort ${walkRules.normalEffort.join(" to ")} of 10)`;
  return [
    h("h2", { class: "list-head" }, `${day.name} · ${day.focus}`),
    h("div", { class: "card" }, day.slots.map((slot) => {
      const ex = exercises[slot.ex];
      const swap = swapText(ex);
      return row(thumb(slot.ex, { small: true }), ex.name,
        `${slot.slot} · ${slot.sets} × ${repText(ex)} · ${slot.rest === null ? restText(slot) : `rest ${restText(slot)}`}${swap ? ` · Swap: ${swap}` : ""}`,
        () => openEx(slot.ex));
    }),
    h("p", { class: "small muted" }, walk)),
  ];
}

function weeksList() {
  return [
    h("h2", { class: "list-head" }, "The 12 weeks"),
    h("div", { class: "card" }, weeks.map((w) => row(h("span", { class: "week-num" }, String(w.week)), w.phase,
      `${setsText(w)} · RIR ${rirText(w.rir)}${w.wedRir !== w.rir ? ` (Wed ${w.wedRir})` : ""} · ${w.walkNote}`, null)),
    h("p", { class: "small muted" }, "RIR = reps in reserve: how many more good reps you could still do when you stop.")),
  ];
}

function exerciseList() {
  const ids = Object.keys(exercises).sort((a, b) => exercises[a].name.localeCompare(exercises[b].name));
  return [
    h("p", { class: "muted" }, "Every exercise in the plan, with its swaps. Tap one to see how to do it."),
    h("div", { class: "card" }, ids.map((id) => row(thumb(id, { small: true }), exercises[id].name, exercises[id].equipment, () => openEx(id)))),
  ];
}

function machineList() {
  const doc = model.doc();
  return [
    h("p", { class: "muted" }, "Every machine and station in the plan. The Gym tab has the same cards."),
    AREA_ORDER.map((area) => {
      const ids = Object.keys(machines).filter((id) => machines[id].area === area);
      if (!ids.length) return null;
      return [h("h2", { class: "list-head" }, AREAS[area].name), h("div", { class: "card" }, ids.map((id) => {
        const where = whereOf(doc, id);
        return row(thumb(machines[id].photo, { small: true }), machines[id].name, where ? `Where: ${where}` : `Usual sign: ${machines[id].sign}`, () => openMachineCard(id, { onSaved: rerender }));
      }))];
    }),
  ];
}

function segmented(items, current, onPick) {
  return h("div", { class: "segmented", role: "tablist", "aria-label": "Part of the plan" },
    items.map(([value, label]) => h("button", { type: "button", role: "tab", "aria-selected": value === current ? "true" : "false", onclick: () => onPick(value) }, label)));
}

export function renderPlan() {
  const pick = (v) => { part = v; rerender(); };
  const onScreen = part === "exercises" ? exerciseList()
    : part === "machines" ? machineList()
    : [
      h("p", { class: "muted" }, "Monday to Friday. Walk first, then weights in pairs. Tap an exercise for pictures, tips and a video."),
      h("div", { class: "card" }, DAY_IDS.map((id) => row(h("span", { class: "week-num" }, days[id].name.slice(0, 3)), days[id].name, days[id].focus, null))),
      DAY_IDS.map(dayList),
      weeksList(),
    ];
  return screen(
    h("div", { class: "today-head no-print" },
      h("div", {}, h("span", { class: "eyebrow accent" }, "Plan v2 · 12 weeks"), h("h1", {}, "Plan")),
      h("button", { class: "chip", type: "button", onclick: () => window.print() }, icon("print", 17), "Print")),
    h("div", { class: "no-print" }, segmented([["week", "Week"], ["exercises", "Exercises"], ["machines", "Machines"]], part, pick)),
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
