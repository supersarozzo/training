// Plan sheet: the whole plan v2 as tables. Prints on A4 (see the print rules in css/app.css).
import { h } from "../h.js";
import { screen } from "./parts.js";
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
        h("button", { class: "plan-ex", type: "button", onclick: () => openExerciseInfo(slot.ex, { settingsNote: false }), "aria-label": `${ex.name}: pictures, tips and video` },
          thumb(slot.ex, { small: true, still: true }), h("strong", {}, ex.name)),
        h("div", { class: "small muted" }, ex.equipment),
        swap ? h("div", { class: "small muted" }, `Swap: ${swap}`) : null),
      h("td", { class: "nowrap" }, `${slot.sets} × ${repText(ex)}`),
      h("td", {}, restText(slot)));
  });
  const walkText = day.walk === "easy"
    ? `Walk: easier (${walkRules.legDaySlopeLess_pct} % less slope, effort ${walkRules.legDayEffort.join(" to ")} of 10)`
    : `Walk: normal (effort ${walkRules.normalEffort.join(" to ")} of 10)`;
  return h("section", { class: "card" },
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
  return h("section", { class: "card" },
    h("h2", {}, "The 12 weeks"),
    h("div", { class: "table-wrap" },
      h("table", {},
        h("thead", {}, h("tr", {}, h("th", {}, "Week"), h("th", {}, "Phase"), h("th", {}, "Sets"), h("th", {}, "Effort"), h("th", {}, "Walk"))),
        h("tbody", {}, rows))),
    h("p", { class: "small muted" }, "RIR = reps in reserve: how many more good reps you could still do when you stop."));
}

export function renderPlan() {
  return screen(
    h("span", { class: "eyebrow accent no-print" }, "Plan v2 · 12 weeks"),
    h("h1", {}, "Plan"),
    h("p", { class: "muted" }, "Monday to Friday. Walk first, then weights in pairs. Tap an exercise for pictures, tips and a video."),
    h("a", { class: "button no-print", href: "#/machines" }, icon("pin", 20), "Machines and where they are"),
    h("button", { class: "button secondary no-print", type: "button", onclick: () => window.print() }, "Print"),
    h("h2", {}, "The week"),
    h("div", { class: "card" },
      h("table", {}, h("tbody", {}, DAY_IDS.map((id) =>
        h("tr", {}, h("td", {}, h("strong", {}, days[id].name)), h("td", {}, days[id].focus)))))),
    DAY_IDS.map(dayTable),
    weeksTable());
}
