// The Diet tab (DESIGN 15.8): two rings (protein first, then calories), carbs and fat, the average of the last 7 days,
// the four ways to add food, "Log again", today's foods by meal, and the sync and credit lines at the foot.
import { h } from "../h.js";
import { s } from "../ui/svg.js";
import { icon } from "../ui/icons.js";
import { screen, tabActionBar, secondaryButton } from "../ui/parts.js";
import { model, store, rerender } from "../ui/app.js";
import { today, now } from "../clock.js";
import { food as fm, foodStore } from "./foodapp.js";
import { makeFoodBackup } from "../food/foodbackup.js";
import { downloadText } from "../backup.js";
import { entriesOn, totals, byMeal, MEAL_WORDS, mealAt, recentFoods, averageLast7, againAmount, numbersFor, dayBefore } from "../food/foodmath.js";
import { foodStatusText } from "../sync/foodsync.js";
import { syncer } from "../syncer.js";
import { openSearch, openDigits, openQuickAdd, openEntry, creditLine, undoToast, messageToast } from "./sheets.js";
import { openScanner } from "./scan.js";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (n) => Math.round(n).toLocaleString("en-GB");
const dayWords = () => { const d = now(); return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };

const R = 56;
const C = 2 * Math.PI * R;

// One ring in the look of the rest timer. `target` may be missing: then the ring shows only its track.
function ring({ cls, label, value, target, unit }) {
  const frac = target > 0 ? Math.min(1, value / target) : 0;
  const left = target > 0 ? target - value : null;
  const words = left === null ? "No target set" : left >= 0 ? `${fmt(left)} ${unit === "kcal" ? "kcal left" : "g to go"}` : `${fmt(-left)} ${unit === "kcal" ? "kcal" : "g"} over`;
  return h("div", { class: `dring ${cls}` },
    h("div", { class: "dring-wrap" },
      s("svg", { viewBox: "0 0 132 132", "aria-hidden": "true" },
        s("circle", { cx: 66, cy: 66, r: R, fill: "none", stroke: "var(--ring-track)", "stroke-width": 12 }),
        frac > 0 ? s("circle", { class: "arc", cx: 66, cy: 66, r: R, fill: "none", stroke: "var(--accent)", "stroke-width": 12, "stroke-linecap": "round", "stroke-dasharray": `${C * frac} ${C}`, transform: "rotate(-90 66 66)" }) : null),
      h("div", { class: "dring-in" }, h("span", { class: "eyebrow" }, label), h("b", {}, fmt(value)), h("small", { class: "muted" }, target > 0 ? `of ${fmt(target)} ${unit}` : unit))),
    h("b", { class: left !== null && left < 0 ? "status-warning" : "dring-words" }, words),
    h("span", { class: "sr-only" }, `${label}: ${fmt(value)} ${unit}. ${words}.`));
}

function saveBackup() {
  try {
    const b = makeFoodBackup(foodStore, now());
    downloadText(b.filename, b.text);
    messageToast("Food backup saved to Files.");
  } catch (e) { failToast(e); }
}
async function restoreFile(input) {
  const f = input.files && input.files[0];
  input.value = "";
  if (!f) return;
  let raw;
  try { raw = JSON.parse(await f.text()); } catch { messageToast("That file is not a food backup."); return; }
  try {
    const res = fm.restore(raw);
    if (!res.ok) { messageToast(res.error); return; }
    messageToast("Food restored. Nothing on this phone was removed.");
    rerender();
  } catch (e) { failToast(e); }
}

function failToast(e) { messageToast(e && e.message ? e.message : "That did not work. Nothing was changed."); }

export function renderDiet() {
  const date = today();
  const doc = fm.doc();
  const targets = model.doc().profile?.targets ?? {};
  const entries = entriesOn(doc, date);
  const t = totals(entries);
  const avg = averageLast7(doc, date);
  const yesterday = entriesOn(doc, dayBefore(date));
  const meal = mealAt(now());

  const logAgain = (f, btn) => {
    btn.disabled = true; // a double tap must not log twice
    try {
      const e = fm.logAgain(f.id, { date, meal });
      rerender();
      undoToast(`Added ${e.name} · ${e.kcal} kcal`, () => fm.removeEntry(e.id));
    } catch (e) { btn.disabled = false; failToast(e); }
  };
  const copyYesterday = () => {
    try {
      const ids = fm.copyDay(dayBefore(date), date);
      rerender();
      undoToast(`Copied ${ids.length} ${ids.length === 1 ? "food" : "foods"} from yesterday`, () => fm.undoCopy(ids));
    } catch (e) { failToast(e); }
  };
  const way = (name, label, onclick, { disabled = false, sub = null } = {}) =>
    h("button", { class: "way", type: "button", disabled, onclick }, icon(name, 22), h("span", {}, label), sub ? h("small", { class: "muted" }, sub) : null);

  const recent = recentFoods(doc, date, 6);
  const meals = byMeal(entries);

  const pick = h("input", { class: "scan-file", type: "file", accept: "application/json,.json", "aria-label": "Food backup file", onchange: () => restoreFile(pick) });
  const foot = h("div", { class: "diet-foot" },
    h("p", { class: "small muted" }, foodStatusText(store.loadDevice(), syncer.food.hasUnsynced())),
    h("div", { class: "backup-row" },
      secondaryButton("Download food backup", saveBackup),
      secondaryButton("Restore food from a file", () => pick.click()), pick),
    creditLine());

  return [
    screen(
      h("span", { class: "eyebrow" }, `Food · ${dayWords()}`),
      h("h1", {}, "Diet"),
      h("div", { class: "card tot" },
        h("div", { class: "rings" },
          ring({ cls: "protein", label: "Protein", value: t.protein_g, target: targets.protein_g, unit: "g" }),
          ring({ cls: "kcal", label: "Calories", value: t.kcal, target: targets.kcal, unit: "kcal" })),
        h("p", { class: "small muted center tot-line" }, `Carbs ${fmt(t.carbs_g)} g · Fat ${fmt(t.fat_g)} g`),
        avg ? h("p", { class: "small muted center" }, `Last 7 days, average: ${avg.protein_g} g protein · ${fmt(avg.kcal)} kcal a day.`) : null),
      h("div", { class: "ways" },
        way("search", "Search", openSearch),
        way("digits", "Digits", openDigits),
        way("bolt", "Quick add", openQuickAdd),
        way("copy", "Copy yesterday", copyYesterday, { disabled: yesterday.length === 0, sub: yesterday.length ? `${yesterday.length} ${yesterday.length === 1 ? "food" : "foods"}` : "none" })),
      recent.length ? h("section", { class: "card" },
        h("h2", {}, "Log again · one tap"),
        recent.map(({ food: f, hadToday }) => {
          const a = againAmount(f);
          const kcal = numbersFor(f.per100g, a).kcal;
          const btn = h("button", { class: "fl", type: "button", onclick: () => logAgain(f, btn) },
            h("span", { class: "nm" }, h("b", {}, f.name), h("small", { class: "muted" }, `${Math.round(a * 10) / 10} g · ${MEAL_WORDS[meal]}`)),
            hadToday ? h("span", { class: "chip had" }, "had today") : null,
            h("span", { class: "kc" }, h("b", {}, kcal), h("small", { class: "muted" }, "kcal")), icon("plus", 20));
          return btn;
        })) : null,
      h("h2", {}, "Today's food"),
      entries.length === 0 ? h("p", { class: "muted" }, "No food yet today. Pick a way above.") : null,
      meals.map((m) => h("section", { class: "card meal" },
        h("div", { class: "mealh" }, h("span", {}, MEAL_WORDS[m.meal]), h("small", { class: "muted" }, m.entries.length ? `${m.kcal} kcal · ${Math.round(m.protein_g)} g protein` : "Nothing yet")),
        m.entries.map((e) => h("button", { class: "fl", type: "button", onclick: () => openEntry(e) },
          h("span", { class: "nm" }, h("b", {}, e.name), h("small", { class: "muted" }, typeof e.amount_g === "number" ? `${Math.round(e.amount_g * 10) / 10} g` : "Quick add")),
          h("span", { class: "kc" }, h("b", {}, e.kcal), h("small", { class: "muted" }, `${Math.round(e.protein_g)} g protein`)),
          icon("chevron", 18))))),
      foot),
    tabActionBar(
      h("div", { class: "diet-bar" },
        secondaryButton("Your foods", openSearch),
        h("button", { class: "button", type: "button", onclick: openScanner }, icon("camera", 22), "Scan"))),
  ];
}
