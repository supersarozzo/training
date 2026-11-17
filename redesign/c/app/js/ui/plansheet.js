// Plan sheet: the whole plan v2 as tables. Prints on A4 (see the print rules in css/app.css).
import { h } from "../h.js";
import { screen, icon, secondaryButton } from "./parts.js";
import { thumb, openExercise } from "./media-ui.js";
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

function dayList(dayId) {
  const day = days[dayId];
  const walkText = day.walk === "easy"
    ? `Walk: easier (${walkRules.legDaySlopeLess_pct} % less slope, effort ${walkRules.legDayEffort.join(" to ")} of 10)`
    : `Walk: normal (effort ${walkRules.normalEffort.join(" to ")} of 10)`;
  return h("section", { class: "plan-day", id: `day-${dayId}` },
    h("div", { class: "section-head" }, h("h2", {}, h("span", { class: "eyebrow" }, day.name), h("br"), day.focus)),
    h("p", { class: "small muted walk-line" }, icon("walk", "sm"), " ", walkText),
    h("div", { class: "list" }, day.slots.map((slot) => {
      const ex = exercises[slot.ex];
      const swap = swapText(ex);
      return h("button", { class: "ex-row plan-row", type: "button", onclick: () => openExercise(slot.ex) },
        h("span", { class: "badge slot" }, slot.slot),
        thumb(slot.ex, { size: "sm" }),
        h("div", { class: "grow" },
          h("div", { class: "title" }, ex.name),
          h("div", { class: "sub" }, ex.equipment),
          swap ? h("div", { class: "sub faint" }, `Swap: ${swap}`) : null),
        h("div", { class: "end" }, h("div", { class: "num-strong" }, `${slot.sets} × ${repText(ex)}`), h("div", { class: "tiny muted" }, restText(slot))));
    })));
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
  const main = screen(
    h("div", { class: "eyebrow" }, "Plan v2 · 12 weeks"),
    h("h1", {}, "Plan"),
    h("p", { class: "muted" }, "Monday to Friday. Walk first, then weights in pairs. Tap an exercise for photos and tips."),
    h("div", { class: "list" }, DAY_IDS.map((id) => h("a", { class: "list-row", href: `#/plan`, onclick: (e) => { e.preventDefault(); document.getElementById(`day-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); } },
      h("div", { class: "date-box" }, h("b", {}, days[id].name.slice(0, 3))),
      h("div", { class: "grow" }, h("div", { class: "title" }, days[id].focus), h("div", { class: "sub" }, `${days[id].slots.length} exercises · walk ${days[id].walk === "easy" ? "easier" : "normal"}`)),
      icon("chev", "chev")))),
    DAY_IDS.map(dayList),
    weeksTable(),
    h("div", { class: "no-print" }, secondaryButton("Print the plan", () => window.print(), { ic: "print" })));
  main.dataset.key = "plan";
  return main;
}
