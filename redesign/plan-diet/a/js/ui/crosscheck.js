// PROTOTYPE 8.28 (builder A). The whole-plan muscle cross-check (research 5.3-5.5): weekly sets per muscle, shown
// honestly. Two counts: direct (the muscle is the main one) and with helpers (a helping muscle counts half a set).
// Band: at least 10 direct sets on at least 2 days; 10-20 normal; above about 20 more than a beginner needs.
// It includes Rosario's own Plan edits. It never changes the plan: it only shows the numbers.
import { h } from "../h.js";
import { rerender } from "./app.js";
import { days, DAY_IDS, weekInfo } from "../plan/plan-v2.js";
import { slotsOf, weekSets, editRecord } from "../proto/plandays.js";
import { musclesOf, GROUP_NAME, GROUP_LONG } from "../proto/muscles.js";
import { bodyMap, legend } from "../proto/bodymap.js";
import { icon } from "./icons.js";
import { planState, fmtSets } from "./plan2.js";
import { onMount, stagger } from "./motion.js";

const ROWS = ["chest", "back", "shoulders", "biceps", "triceps", "quads", "hamstrings", "glutes", "calves", "abs", "lower_back", "forearms"];
const MAIN = new Set(["chest", "back", "shoulders", "biceps", "triceps", "quads", "hamstrings", "glutes", "calves", "abs"]);
const NAME = { ...GROUP_NAME, shoulders: "Shoulders (all)" };
const PHASES = [[1, "Week 1"], [3, "Weeks 2–5"], [6, "Week 6"], [8, "Weeks 7–11"], [12, "Week 12"]];
const phaseOf = (w) => (w === 1 ? 1 : w <= 5 ? 3 : w === 6 ? 6 : w <= 11 ? 8 : 12);
const toRow = (g) => (g.startsWith("shoulders_") ? "shoulders" : g);

export function weeklyCounts(doc, week) {
  const acc = {};
  const get = (g) => (acc[g] ??= { direct: 0, weighted: 0, days: new Set(), split: {} });
  for (const d of DAY_IDS) {
    for (const s of slotsOf(doc, d)) {
      const n = weekSets(week, s);
      const { main, helpers } = musclesOf(s.ex);
      for (const g of main) {
        const r = get(toRow(g)); r.direct += n; r.weighted += n; r.days.add(d);
        if (g.startsWith("shoulders_")) r.split[g] = (r.split[g] ?? 0) + n;
      }
      for (const g of helpers) get(toRow(g)).weighted += 0.5 * n;
    }
  }
  const rows = ROWS.map((g) => {
    const r = acc[g] ?? { direct: 0, weighted: 0, days: new Set(), split: {} };
    const dayList = DAY_IDS.filter((d) => r.days.has(d));
    let verdict = "ok"; let words = "In range";
    if (!MAIN.has(g)) { verdict = "info"; words = "No own exercise; fine for a beginner"; }
    else if (r.direct < 10 && r.weighted >= 10) { verdict = "near"; words = "Under 10 direct; 10+ counting helpers"; }
    else if (r.direct < 10) { verdict = "low"; words = "Under 10"; }
    else if (r.direct > 20) { verdict = "high"; words = "More than 20: more than needed"; }
    if (MAIN.has(g) && dayList.length < 2) { verdict = "low"; words += dayList.length === 1 ? " · only 1 day" : " · no day"; }
    return { group: g, main: MAIN.has(g), direct: r.direct, weighted: r.weighted, days: dayList, split: r.split, verdict, words };
  });
  return { rows };
}

function bar(row) {
  const MAX = 30;
  const el = h("div", { class: "cc-bar", "aria-hidden": "true" },
    h("span", { class: "band" }), h("span", { class: "with" }), h("span", { class: "direct" }),
    h("span", { class: "mark m10" }), h("span", { class: "mark m20" }));
  // Widths come from data: set through CSSOM (the CSP blocks style attributes).
  const pct = (n) => `${Math.min(100, (n / MAX) * 100)}%`;
  el.querySelector(".band").style.left = pct(10);
  el.querySelector(".band").style.width = pct(10);
  el.querySelector(".with").style.width = pct(row.weighted);
  el.querySelector(".direct").style.width = pct(row.direct);
  el.querySelector(".m10").style.left = pct(10);
  el.querySelector(".m20").style.left = pct(20);
  return el;
}

export function renderMuscles(doc, week, currentWeek) {
  const st = planState();
  const { rows } = weeklyCounts(doc, week);
  const flags = rows.filter((r) => r.main && (r.verdict === "low" || r.verdict === "high"));
  const levels = {};
  for (const r of rows) {
    const lv = r.direct === 0 ? (r.weighted ? 1 : 0) : r.direct < 5 ? 1 : r.direct < 10 ? 2 : 3;
    if (r.group === "shoulders") for (const [g, n] of Object.entries(r.split)) levels[g] = n < 5 ? 1 : n < 10 ? 2 : 3;
    else levels[r.group] = lv;
  }
  const edited = DAY_IDS.filter((d) => editRecord(doc, d));
  const sh = rows.find((r) => r.group === "shoulders").split;
  const main = h("main", { class: "screen has-tabs cc" },
    h("button", { class: "text-button back-link", type: "button", onclick: () => { st.view = "day"; rerender(); } }, icon("back", 18), "Plan"),
    h("span", { class: "eyebrow accent" }, "Whole plan · Monday to Friday"),
    h("h1", {}, "Muscles"),
    h("div", { class: "choice-row phase-row", role: "radiogroup", "aria-label": "Which weeks" },
      PHASES.map(([w, label]) => h("button", { class: "pick", type: "button", role: "radio", "aria-checked": phaseOf(week) === w ? "true" : "false", "aria-pressed": phaseOf(week) === w ? "true" : "false", onclick: () => { st.week = w; rerender(); } },
        label, phaseOf(currentWeek) === w ? h("span", { class: "now-dot", "aria-label": " (this week)" }) : null))),
    h("p", { class: "small muted" }, `${weekInfo(week).phase}. Sets a week, Monday to Friday${edited.length ? `, with your changes to ${edited.map((d) => days[d].name).join(", ")}` : ""}.`),
    flags.length ? h("div", { class: "card warn cc-flags" },
      h("h2", {}, `${flags.length} things stand out`),
      h("ul", { class: "list-plain" }, flags.map((r) => h("li", {}, h("span", {}, h("b", {}, NAME[r.group]), `: ${fmtSets(r.direct)} direct sets${r.days.length ? ` on ${r.days.map((d) => days[d].name.slice(0, 3)).join(", ")}` : ""}`), h("span", { class: "small muted" }, r.verdict === "high" ? "a lot" : "low"))))) : h("div", { class: "card" }, h("p", {}, "Every main muscle has 10 to 20 direct sets on 2 or more days.")),
    h("div", { class: "card" },
      h("div", { class: "bm-row one" }, bodyMap(levels, { title: "Direct sets this week", words: null, cls: "wide" })),
      legend([[3, "10 or more"], [2, "5–9"], [1, "under 5 / helping only"]])),
    h("div", { class: "card cc-list" },
      h("div", { class: "cc-key small muted" }, h("span", {}, h("i", { class: "k direct" }), "direct"), h("span", {}, h("i", { class: "k with" }), "with helpers (½)"), h("span", {}, h("i", { class: "k band" }), "10–20")),
      rows.map((r) => h("div", { class: `cc-row ${r.verdict}` },
        h("div", { class: "cc-head" }, h("b", {}, GROUP_LONG[r.group] ?? NAME[r.group]), h("span", { class: "cc-num" }, h("b", {}, fmtSets(r.direct)), h("span", { class: "unit" }, ` · ${fmtSets(r.weighted)}`))),
        bar(r),
        h("div", { class: "cc-words small" },
          h("span", { class: `verdict ${r.verdict}` }, r.words),
          h("span", { class: "muted" }, r.days.length ? r.days.map((d) => days[d].name.slice(0, 3)).join(" ") : "–")),
        r.group === "shoulders" ? h("div", { class: "small muted" }, `Front ${sh.shoulders_front ?? 0} · side ${sh.shoulders_side ?? 0} · rear ${sh.shoulders_rear ?? 0} direct`) : null))),
    h("div", { class: "card" },
      h("h3", {}, "How this is counted"),
      h("p", { class: "small" }, "Direct: a set where the muscle is the main one counts 1. With helpers: a set where it only helps counts ½. Main and helping muscles come from the free exercise database the photos come from."),
      h("p", { class: "small" }, "Yardstick: at least 10 direct sets a week, on at least 2 days; 10 to 20 is the normal range; above about 20 is more than a beginner needs (ACSM 2026, Schoenfeld 2017, research 5.1)."),
      h("p", { class: "small muted" }, "The database lists calves and back thighs as helpers in squats and the leg press, which flatters them: trust the direct number for those two. The uphill walk is not counted: it is endurance work, not hard sets."),
      h("p", { class: "small muted" }, h("b", {}, "This screen only shows numbers. It never changes the plan."), " Changes are made day by day with Edit.")));
  onMount(() => stagger(main.querySelectorAll(".cc-row")));
  return main;
}
