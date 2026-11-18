// The whole-plan muscle check (build step 5, docs/DESIGN.md 15.6; mock-up frames t-check1 to t-check3).
// Shows numbers only: it never changes the plan. All numbers come from planview.js (which uses engine/planpage.js
// setsByMuscle, the same function as "Day so far"). Bar widths are set from code (CSSOM), never in markup.
import { h } from "../h.js";
import { screen } from "./parts.js";
import { model, rerender } from "./app.js";
import { today } from "../clock.js";
import { icon } from "./icons.js";
import { bodyMap } from "./bodymap.js";
import { pageFor, fmtSets } from "../engine/planpage.js";
import { MUSCLES } from "../plan/muscles.js";
import { CHECK_WEEKS, checkChipFor, checkRows, standOut, checkLevels, checkSub } from "../planview.js";

const state = { chip: null }; // the picked week chip while you stay on this screen
const SCALE = 36; // bars run from 0 to 36 sets
const DAY_WORDS = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday" };
// The map's words for VoiceOver: which muscles are in each of the 3 steps (never colour alone).
function mapLabel(levels) {
  const band = (lv) => Object.entries(levels).filter(([, v]) => v === lv).map(([g]) => MUSCLES[g].name.toLowerCase());
  const part = (lv, words) => (band(lv).length ? ` ${words}: ${band(lv).join(", ")}.` : "");
  return `Body map of direct sets this week.${part(3, "10 or more")}${part(2, "5 to 9")}${part(1, "Under 5 or helping only")}`;
}

const pct = (n) => `${Math.max(0, Math.min(100, (n / SCALE) * 100))}%`;

// A bar piece whose size is set with CSSOM, not a style attribute.
function piece(cls, prop, value) {
  const el = h("i", { class: cls });
  el.style[prop] = value;
  return el;
}

function bar(row) {
  const wide = row.weighted ?? row.direct;
  return h("div", { class: "ccbar", "aria-hidden": "true" },
    piece("w", "width", pct(wide)), piece("dd", "width", pct(row.direct)),
    piece("tk", "left", pct(10)), piece("tk", "left", pct(20)));
}

function rowLabel(r) {
  const days = r.days ? ` ${r.days.split(" ").map((d) => DAY_WORDS[d] ?? d).join(", ")}.` : "";
  const nums = r.weighted === null
    ? `${fmtSets(r.direct)} direct sets.`
    : `${fmtSets(r.direct)} direct sets, ${fmtSets(r.weighted)} with helpers.`;
  return `${r.name}: ${nums} ${r.verdict.text}.${days}`;
}

function ccRow(r) {
  return h("div", { class: `ccrow${r.part ? " part" : ""}`, role: "group", "aria-label": rowLabel(r) },
    h("div", { class: "top", "aria-hidden": "true" },
      h("b", {}, r.name),
      h("span", { class: "num" }, fmtSets(r.direct), r.weighted === null ? null : h("small", {}, ` · ${fmtSets(r.weighted)}`))),
    bar(r),
    h("div", { class: "vd", "aria-hidden": "true" },
      h("span", { class: `v ${r.verdict.cls}` }, r.verdict.text),
      h("span", { class: "dys" }, r.days)));
}

function standCard(items) {
  if (!items.length) return h("div", { class: "card" }, h("b", { class: "so-title" }, "Nothing stands out this week."));
  return h("div", { class: "card standout" },
    h("b", { class: "so-title" }, items.length === 1 ? "1 thing stands out" : `${items.length} things stand out`),
    items.map((it) => h("div", { class: "so" },
      h("span", {}, h("b", {}, `${it.name}:`), ` ${it.text}`),
      h("span", { class: "f" }, it.flag))));
}

function mapLegendCheck() {
  const key = (lv, text) => h("span", {}, h("i", { class: `k${lv}`, "aria-hidden": "true" }), text);
  return h("div", { class: "map-legend cc-legend" }, key(3, "10 or more"), key(2, "5–9"), key(1, "under 5 / helping only"));
}

export function renderMuscleCheck() {
  const doc = model.doc();
  const page = pageFor(doc.block.start_monday, today());
  const chipId = state.chip ?? checkChipFor(page.week);
  const chip = CHECK_WEEKS.find((c) => c.id === chipId) ?? CHECK_WEEKS[1];
  const week = chip.week;
  const rows = checkRows(doc, week);
  const levels = checkLevels(doc, week);
  const upper = rows.filter((r) => r.half === 1);
  const lower = rows.filter((r) => r.half !== 1);
  const pick = (id) => { state.chip = id; rerender(); };

  const main = screen(
    h("a", { class: "text-button back-link", href: "#/plan", onclick: () => { state.chip = null; } }, icon("back", 18), "Plan"),
    h("span", { class: "eyebrow accent" }, "Whole plan · Monday to Friday"),
    h("h1", {}, "Muscles"),
    h("div", { class: "chips cc-chips", role: "group", "aria-label": "Weeks" },
      CHECK_WEEKS.map((c) => h("button", {
        class: `chip${c.id === chip.id ? " accent" : ""}`, type: "button", "aria-pressed": c.id === chip.id ? "true" : "false",
        onclick: () => pick(c.id),
      }, c.label))),
    h("p", { class: "small muted cc-sub" }, checkSub(week)),
    standCard(standOut(rows)),
    h("div", { class: "card" },
      h("span", { class: "eyebrow" }, "Direct sets this week"),
      h("div", { class: "cc-map" }, bodyMap(levels, { view: "both", label: mapLabel(levels) })),
      mapLegendCheck()),
    h("div", { class: "map-legend cc-legend cc-rowlegend", "aria-hidden": "true" },
      h("span", {}, h("i", { class: "k3" }), "direct"),
      h("span", {}, h("i", { class: "kh" }), "with helpers (½)"),
      h("span", {}, "| 10–20")),
    h("div", { class: "card cc-list" }, upper.map(ccRow)),
    h("div", { class: "card cc-list" }, lower.map(ccRow)),
    h("p", { class: "small muted" }, "Not trained on purpose in this plan: traps, forearms, neck and inner thighs."),
    h("p", { class: "small muted" }, "This screen only shows numbers. It never changes the plan."));
  return main;
}
