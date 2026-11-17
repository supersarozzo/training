// Diet tab (builder B). Today's food against the calorie and protein targets (protein first and as big as calories),
// "Log again" (one tap adds the last portion), the add ways (scan, type the digits, search, quick add, copy
// yesterday), today's list by meal, and the check step before a looked-up food is saved. Open Food Facts credit line
// wherever its data is shown. Sample numbers only (made up). All text through h(), never innerHTML.
import { h } from "./app/h.js";
import { s } from "./app/svg.js";
import { icon } from "./app/icons.js";
import { reduced, onMount, stagger, bump } from "./app/motion.js";
import { loadDoc, update, TODAY, NOW_HOUR, entryFrom, dayStr, validEan } from "./store.js";
import { screenWithBar, head, tabActionBar, mainButton, openSheet, closeSheets, toast, rerender, fmt, pill } from "./ui.js";
import { lookupBarcode, searchFoods, checkNumbers, cleanText, OFF_LINKS } from "./off.js";
import { openScanner } from "./scanner.js";

const MEALS = [["breakfast", "Breakfast"], ["lunch", "Lunch"], ["dinner", "Dinner"], ["snack", "Snacks"]];
const mealNow = () => (NOW_HOUR < 11 ? "breakfast" : NOW_HOUR < 15 ? "lunch" : NOW_HOUR < 21 ? "dinner" : "snack");
const live = (list) => (list ?? []).filter((x) => !x.deleted);
const dayEntries = (doc, date) => live(doc.food_log).filter((e) => e.date === date);
const sum = (list, k) => list.reduce((n, e) => n + (Number(e[k]) || 0), 0);
const r1 = (n) => Math.round(n * 10) / 10;

export function credit() {
  return h("p", { class: "off-credit small muted" }, "Contains data from ",
    h("a", { href: OFF_LINKS.site, target: "_blank", rel: "noopener noreferrer" }, "Open Food Facts"),
    ", available under the ", h("a", { href: OFF_LINKS.odbl, target: "_blank", rel: "noopener noreferrer" }, "Open Database License"), ".");
}

// ---------- the two rings ----------
function ring(label, eaten, target, unit, cls) {
  const R = 44, C = 2 * Math.PI * R;
  const frac = target ? Math.min(1, eaten / target) : 0;
  const arc = s("circle", { class: "arc", cx: 50, cy: 50, r: R, fill: "none", "stroke-width": 9, "stroke-linecap": "round", "stroke-dasharray": C, "stroke-dashoffset": C * (1 - frac), transform: "rotate(-90 50 50)" });
  const left = target - eaten;
  const words = left > 0 ? `${fmt(Math.round(left))} ${unit} ${unit === "g" ? "to go" : "left"}` : left === 0 ? "On target" : `${fmt(Math.round(-left))} ${unit} over`;
  const el = h("div", { class: `food-ring ${cls} ${frac >= 1 ? "full" : ""}`, role: "img", "aria-label": `${label}: ${fmt(Math.round(eaten))} of ${fmt(target)} ${unit}. ${words}.` },
    s("svg", { viewBox: "0 0 100 100", "aria-hidden": "true" }, s("circle", { cx: 50, cy: 50, r: R, fill: "none", class: "track", "stroke-width": 9 }), arc),
    h("div", { class: "ring-in", "aria-hidden": "true" },
      h("span", { class: "eyebrow" }, label),
      h("b", { class: "ring-num" }, fmt(Math.round(eaten))),
      h("span", { class: "ring-of" }, `of ${fmt(target)} ${unit}`)),
    h("p", { class: "ring-words", "aria-hidden": "true" }, words));
  if (!reduced() && arc.animate) onMount(() => arc.animate([{ strokeDashoffset: C }, { strokeDashoffset: C * (1 - frac) }], { duration: 700, easing: "cubic-bezier(.2,.8,.2,1)" }));
  return el;
}

function weekAverage(doc) {
  const days = [];
  for (let i = 1; i <= 7; i++) days.push(dayEntries(doc, dayStr(-i)));
  const logged = days.filter((d) => d.length);
  if (!logged.length) return null;
  return { kcal: Math.round(logged.reduce((n, d) => n + sum(d, "kcal"), 0) / logged.length), protein: Math.round(logged.reduce((n, d) => n + sum(d, "protein_g"), 0) / logged.length), n: logged.length };
}

// ---------- recent foods ("Log again") ----------
function recentFoods(doc) {
  const foods = live(doc.foods);
  const lastUse = {};
  for (const e of live(doc.food_log)) if (e.food && (!lastUse[e.food] || e.date > lastUse[e.food])) lastUse[e.food] = e.date + e.updated_at;
  return foods.filter((f) => lastUse[f.id]).sort((a, b) => (b.fav - a.fav) || lastUse[b.id].localeCompare(lastUse[a.id])).slice(0, 6);
}

function portionText(f, g) {
  const k = g / 100;
  return `${fmt(g)} g · ${fmt(Math.round(f.per100g.kcal * k))} kcal · ${fmt(r1(f.per100g.protein_g * k))} g protein`;
}

function addEntry(food, grams, meal) {
  let id = null;
  update((doc, t) => {
    const e = entryFrom(food, grams, TODAY, meal, t);
    id = e.id;
    doc.food_log.push(e);
    const f = doc.foods.find((x) => x.id === food.id);
    if (f) { f.last_amount_g = grams; f.updated_at = t; }
  });
  return id;
}
function tombstone(entryId) {
  update((doc, t) => { const e = doc.food_log.find((x) => x.id === entryId); if (e) Object.assign(e, { deleted: true, deleted_at: t, updated_at: t }); });
}

function logAgainTile(f) {
  const quick = () => { const id = addEntry(f, f.last_amount_g, mealNow()); rerender(); toast(`Added ${f.name}, ${f.last_amount_g} g.`, () => { tombstone(id); rerender(); }); };
  return h("div", { class: "again-tile" },
    h("button", { class: "again-main", type: "button", onclick: () => openPortion(f), "aria-label": `${f.name}. Choose the amount.` },
      h("b", {}, f.name), h("span", { class: "small muted" }, portionText(f, f.last_amount_g))),
    h("button", { class: "again-add", type: "button", onclick: quick, "aria-label": `Add ${f.name}, ${f.last_amount_g} g, now` }, icon("plus", 22, { strokeWidth: 2.4 })));
}

// ---------- sheets ----------
// "13:05" from the entry's time stamp (local time), or nothing when the stamp is missing or odd.
function timeOf(e) {
  const d = new Date(e.eaten_at ?? e.updated_at);
  return Number.isFinite(d.getTime()) ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : "";
}

function mealRow(current, onPick) {
  const row = h("div", { class: "choice-row meal-row" }, MEALS.map(([v, label]) => h("button", { class: "pick", type: "button", "aria-pressed": v === current ? "true" : "false", onclick: () => onPick(v) }, label)));
  row.style.gridTemplateColumns = "repeat(4, 1fr)";
  return row;
}

function gramsStepper(value, onChange) {
  const input = h("input", { type: "number", class: "step-input", inputmode: "decimal", value: String(value), "aria-label": "Amount in grams", oninput: (e) => { const n = parseFloat(e.target.value); if (Number.isFinite(n) && n > 0 && n <= 3000) onChange(n, false); } });
  const set = (n) => { const v = Math.min(3000, Math.max(1, Math.round(n))); input.value = String(v); bump(input); onChange(v, true); };
  return { el: h("div", { class: "stepper" },
    h("button", { class: "step-btn", type: "button", "aria-label": "10 grams less", onclick: () => set(Number(input.value) - 10) }, "−"),
    h("div", { class: "step-value" }, input, h("span", { class: "unit" }, "g")),
    h("button", { class: "step-btn", type: "button", "aria-label": "10 grams more", onclick: () => set(Number(input.value) + 10) }, "+")), set };
}

// Portion of a saved food (also the end of a scan of a food you saved before).
export function openPortion(f, { fromScan = false } = {}) {
  let grams = f.last_amount_g || f.serving_g || 100;
  let meal = mealNow();
  const result = h("p", { class: "portion-result" });
  const drawResult = () => { result.replaceChildren(h("b", {}, `${fmt(Math.round(f.per100g.kcal * grams / 100))} kcal`), " · ", h("b", {}, `${fmt(r1(f.per100g.protein_g * grams / 100))} g protein`), h("span", { class: "muted" }, ` · this portion`)); };
  const st = gramsStepper(grams, (n) => { grams = n; drawResult(); });
  const chips = [f.last_amount_g ? [f.last_amount_g, `Last time ${f.last_amount_g} g`] : null, f.serving_g && f.serving_g !== f.last_amount_g ? [f.serving_g, `1 serving ${f.serving_g} g`] : null, [100, "100 g"]].filter(Boolean);
  const meals = h("div", {});
  const drawMeals = () => meals.replaceChildren(mealRow(meal, (v) => { meal = v; drawMeals(); }));
  drawMeals(); drawResult();
  const sheet = openSheet([
    fromScan ? h("div", { class: "eyebrow accent" }, icon("check", 14), " Found in your foods") : h("div", { class: "eyebrow accent" }, f.source === "off" ? "Saved from Open Food Facts" : "Your food"),
    h("h2", {}, f.name),
    f.brand ? h("p", { class: "small muted" }, f.brand) : null,
    h("p", { class: "small muted" }, `Per 100 g: ${f.per100g.kcal} kcal · ${f.per100g.protein_g} g protein · ${f.per100g.carbs_g} g carbs · ${f.per100g.fat_g} g fat`),
    h("label", { class: "label" }, "How much"),
    st.el,
    h("div", { class: "chips" }, chips.map(([g, label]) => h("button", { class: "chip", type: "button", onclick: () => st.set(g) }, label))),
    result,
    h("label", { class: "label" }, "Meal"), meals,
    h("button", { class: "button", type: "button", onclick: () => { const id = addEntry(f, grams, meal); sheet.close(); rerender(); toast(`Added ${f.name}, ${grams} g.`, () => { tombstone(id); rerender(); }); } }, icon("plus", 20), "Add"),
    f.source === "off" ? credit() : null,
  ], { label: "Amount" });
}

// The check step: a looked-up (or new) food is shown with editable numbers before it is saved (research 9.5).
export function openCheck(draft, warnings, { source = "off", note = null } = {}) {
  const d = { ...draft, per100g: { ...draft.per100g } };
  let grams = d.serving_g || 100;
  let meal = mealNow();
  const warnBox = h("div", {});
  const result = h("p", { class: "portion-result" });
  const drawWarn = () => {
    const w = checkNumbers(d.per100g);
    warnBox.replaceChildren(w.length ? h("div", { class: "card warn check-warn" }, h("b", {}, "Check these numbers"), h("ul", {}, w.map((x) => h("li", { class: "small" }, x)))) : h("p", { class: "small ok-line" }, icon("check", 16), " The numbers add up."));
  };
  const drawResult = () => {
    const k = (Number(d.per100g.kcal) || 0) * grams / 100, p = (Number(d.per100g.protein_g) || 0) * grams / 100;
    result.replaceChildren(h("b", {}, `${fmt(Math.round(k))} kcal`), " · ", h("b", {}, `${fmt(r1(p))} g protein`), h("span", { class: "muted" }, " · this portion"));
  };
  const numField = (key, label, unit) => h("label", { class: "num-field" }, h("span", { class: "label" }, label),
    h("span", { class: "num-in" }, h("input", { type: "number", inputmode: "decimal", value: d.per100g[key] ?? "", "aria-label": `${label} per 100 g`, oninput: (e) => { const n = parseFloat(e.target.value); d.per100g[key] = Number.isFinite(n) && n >= 0 ? n : null; drawWarn(); drawResult(); } }), h("span", { class: "unit" }, unit)));
  const nameIn = h("input", { type: "text", value: d.name, maxlength: 120, "aria-label": "Name", oninput: (e) => { d.name = cleanText(e.target.value) ; } });
  const st = gramsStepper(grams, (n) => { grams = n; drawResult(); });
  const meals = h("div", {});
  const drawMeals = () => meals.replaceChildren(mealRow(meal, (v) => { meal = v; drawMeals(); }));
  drawMeals(); drawWarn(); drawResult();
  const save = (andAdd = true) => {
    const w = checkNumbers(d.per100g);
    if (w.some((x) => x.startsWith("Missing"))) { warnBox.querySelector(".card")?.classList.add("shake"); return; }
    let food = null;
    update((doc, t) => {
      const id = d.barcode ? `fb-${d.barcode}` : `fo-${TODAY.replaceAll("-", "")}-${Math.random().toString(36).slice(2, 8)}`;
      food = { id, updated_at: t, name: d.name || "My food", brand: d.brand || "", barcode: d.barcode || null, per100g: { kcal: Number(d.per100g.kcal), protein_g: Number(d.per100g.protein_g), carbs_g: Number(d.per100g.carbs_g), fat_g: Number(d.per100g.fat_g) }, serving_g: d.serving_g, serving_label: d.serving_label, last_amount_g: grams, fav: false, source, off_fetched_at: source === "off" ? t : null, edited: JSON.stringify(d.per100g) !== JSON.stringify(draft.per100g) || d.name !== draft.name };
      const i = doc.foods.findIndex((x) => x.id === id);
      if (i >= 0) doc.foods[i] = food; else doc.foods.push(food);
    });
    closeSheets();
    if (!andAdd) { rerender(); toast(`Saved ${food.name} to your foods. Nothing added to today.`); return; }
    const id = addEntry(food, grams, meal);
    rerender();
    toast(`Saved ${food.name} to your foods and added ${grams} g.`, () => { tombstone(id); rerender(); });
  };
  openSheet([
    h("div", { class: "eyebrow accent" }, source === "off" ? "From Open Food Facts · check before saving" : "New food · your own numbers"),
    note ? h("p", { class: "small muted" }, note) : null,
    h("label", { class: "label" }, "Name"), nameIn,
    d.brand ? h("p", { class: "small muted" }, `Brand: ${d.brand}`) : null,
    d.barcode ? h("p", { class: "small muted" }, icon("barcode", 14), ` Barcode ${d.barcode}`) : null,
    h("h3", {}, "Per 100 g"),
    h("div", { class: "num-grid" }, numField("kcal", "Calories", "kcal"), numField("protein_g", "Protein", "g"), numField("carbs_g", "Carbs", "g"), numField("fat_g", "Fat", "g")),
    warnBox,
    h("label", { class: "label" }, "How much"), st.el,
    h("div", { class: "chips" }, [d.serving_g ? [d.serving_g, `1 serving ${d.serving_g} g`] : null, [30, "30 g"], [50, "50 g"], [100, "100 g"]].filter(Boolean).map(([g, label]) => h("button", { class: "chip", type: "button", onclick: () => st.set(g) }, label))),
    result,
    h("label", { class: "label" }, "Meal"), meals,
    h("button", { class: "button", type: "button", onclick: () => save(true) }, icon("check", 20), "Save food and add"),
    h("button", { class: "button secondary", type: "button", onclick: () => save(false) }, "Save without adding"),
    h("p", { class: "small muted center" }, "Saved to your foods, so it works with no signal next time."),
    source === "off" ? credit() : null,
  ], { tall: true, label: "Check the food" });
}

// What happens after a barcode is known (from the camera, a photo or typed digits).
export async function handleBarcode(code, { from = "scan" } = {}) {
  if (!validEan(code)) return { ok: false, message: from === "typed" ? "That number is not a valid barcode (the last digit does not match). Check the digits." : "That read looks wrong. Hold the phone still and try again." };
  const doc = loadDoc();
  const saved = live(doc.foods).find((f) => f.barcode === code);
  if (saved) { closeSheets(); openPortion(saved, { fromScan: true }); return { ok: true }; }
  const wait = openSheet([h("div", { class: "eyebrow accent" }, "Looking up"), h("h2", {}, `Barcode ${code}`), h("p", { class: "muted loading-line" }, h("span", { class: "spinner", "aria-hidden": "true" }), "Asking Open Food Facts. Only the barcode is sent."), credit()], { label: "Looking up" });
  const res = await lookupBarcode(code);
  wait.close();
  if (res.status === "found") { openCheck(res.draft, res.warnings); return { ok: true }; }
  const empty = { name: "", brand: "", barcode: code, per100g: { kcal: null, protein_g: null, carbs_g: null, fat_g: null }, serving_g: null, serving_label: null };
  if (res.status === "not_found") { openCheck(empty, [], { source: "own", note: "Not in Open Food Facts. Type the numbers from the pack: next time this barcode finds your food." }); return { ok: true }; }
  const text = res.status === "limit" ? "Too many lookups in a minute. Wait a moment, then try again." : res.status === "busy" ? "Open Food Facts is busy. Try again in a minute." : "No signal, or Open Food Facts did not answer. Try again, or use Quick add.";
  openSheet([h("h2", {}, "Not looked up"), h("p", {}, text), h("button", { class: "button secondary", type: "button", onclick: () => openQuick() }, "Quick add instead")], { label: "Not looked up" });
  return { ok: true };
}

function openDigits() {
  const err = h("p", { class: "error-text", role: "alert" });
  const input = h("input", { type: "text", inputmode: "numeric", pattern: "[0-9]*", maxlength: 13, autocomplete: "off", placeholder: "13 digits under the bars", "aria-label": "Barcode digits" });
  const go = async () => {
    const code = input.value.replace(/\D/g, "");
    const r = await handleBarcode(code, { from: "typed" });
    if (!r.ok) err.textContent = r.message;
  };
  openSheet([
    h("h2", {}, "Type the barcode"),
    h("p", { class: "small muted" }, "For when the camera cannot read it: a dark room, a creased pack, or no camera permission."),
    input, err,
    h("button", { class: "button", type: "button", onclick: go }, icon("search", 20), "Look up"),
    h("p", { class: "small muted" }, "Your saved foods are checked first, with no signal needed. Only a new barcode is sent to Open Food Facts."),
  ], { label: "Type the barcode" });
}

function openSearch(initial = "") {
  const doc = loadDoc();
  let word = initial;
  const mine = h("div", {});
  const offBox = h("div", {});
  const drawMine = () => {
    const w = word.trim().toLowerCase();
    const list = live(doc.foods).filter((f) => !w || f.name.toLowerCase().includes(w)).slice(0, 8);
    mine.replaceChildren(h("h3", {}, "Your foods"), list.length ? h("div", { class: "card" }, list.map((f) => h("button", { class: "mach-row", type: "button", onclick: () => openPortion(f) },
      h("span", { class: "food-dot", "aria-hidden": "true" }, icon(f.barcode ? "barcode" : "food", 18)),
      h("span", { class: "grow" }, h("b", {}, f.name), h("span", { class: "small muted" }, `${f.per100g.kcal} kcal · ${f.per100g.protein_g} g protein per 100 g`)), icon("chevron", 18)))) : h("p", { class: "small muted" }, "None of your foods match."));
  };
  const runOff = async () => {
    const digits = word.replace(/\s/g, "");
    if (/^\d{8,13}$/.test(digits)) {
      // Digits in the search box are a barcode: same path as a scan (saved foods first, then Open Food Facts).
      const r = await handleBarcode(digits, { from: "typed" });
      if (!r.ok) offBox.replaceChildren(h("p", { class: "error-text", role: "alert" }, r.message));
      return;
    }
    if (word.trim().length < 2) return;
    offBox.replaceChildren(h("p", { class: "muted loading-line" }, h("span", { class: "spinner", "aria-hidden": "true" }), `Searching Open Food Facts for “${cleanText(word, 60)}”. Only this word is sent.`));
    const res = await searchFoods(word);
    if (res.status !== "ok") { offBox.replaceChildren(h("p", { class: "small muted" }, res.status === "limit" ? "Too many searches in a minute. Wait a moment." : res.status === "short" ? "Type at least 2 letters." : "Open Food Facts did not answer (no signal, or its name search is busy). Scan or type the barcode instead: that works more often. Or make your own food.")); return; }
    offBox.replaceChildren(h("h3", {}, "Open Food Facts"), res.items.length ? h("div", { class: "card" }, res.items.map((it) => h("button", { class: "mach-row", type: "button", onclick: () => openCheck(it.draft, it.warnings) },
      h("span", { class: "food-dot", "aria-hidden": "true" }, icon("search", 18)),
      h("span", { class: "grow" }, h("b", {}, it.draft.name), h("span", { class: "small muted" }, [it.draft.brand, it.draft.per100g.kcal !== null ? `${it.draft.per100g.kcal} kcal / 100 g` : "no calories listed"].filter(Boolean).join(" · ")),
        it.warnings.length ? h("span", { class: "small status-warning" }, "Numbers need a check") : null), icon("chevron", 18)))) : h("p", { class: "small muted" }, "Nothing found. Try another word, or make your own food."), credit());
  };
  const input = h("input", { type: "search", value: word, placeholder: "Food name or barcode digits", enterkeyhint: "search", "aria-label": "Food name", oninput: (e) => { word = e.target.value; drawMine(); }, onkeydown: (e) => { if (e.key === "Enter") runOff(); } });
  drawMine();
  openSheet([
    h("h2", {}, "Search foods"),
    h("div", { class: "search-row" }, input, h("button", { class: "button search-go", type: "button", onclick: runOff }, "Search")),
    h("p", { class: "small muted" }, "Your foods show as you type. Open Food Facts is asked only when you tap Search. Digits look up a barcode."),
    mine, offBox,
    h("button", { class: "button secondary", type: "button", onclick: () => openCheck({ name: cleanText(word), brand: "", barcode: null, per100g: { kcal: null, protein_g: null, carbs_g: null, fat_g: null }, serving_g: null, serving_label: null }, [], { source: "own" }) }, icon("plus", 18), "Make my own food"),
  ], { tall: true, label: "Search foods" });
  if (initial) runOff();
}

function openQuick() {
  let kcal = "", protein = "", name = "";
  let meal = mealNow();
  const err = h("p", { class: "error-text", role: "alert" });
  const meals = h("div", {});
  const drawMeals = () => meals.replaceChildren(mealRow(meal, (v) => { meal = v; drawMeals(); }));
  drawMeals();
  const sheet = openSheet([
    h("h2", {}, "Quick add"),
    h("p", { class: "small muted" }, "Just the numbers, for a meal out or a food with no label. Not saved as a food."),
    h("div", { class: "num-grid two" },
      h("label", { class: "num-field" }, h("span", { class: "label" }, "Calories"), h("span", { class: "num-in" }, h("input", { type: "number", inputmode: "numeric", "aria-label": "Calories", oninput: (e) => { kcal = e.target.value; } }), h("span", { class: "unit" }, "kcal"))),
      h("label", { class: "num-field" }, h("span", { class: "label" }, "Protein"), h("span", { class: "num-in" }, h("input", { type: "number", inputmode: "decimal", "aria-label": "Protein", oninput: (e) => { protein = e.target.value; } }), h("span", { class: "unit" }, "g")))),
    h("label", { class: "label" }, "Name (optional)"), h("input", { type: "text", maxlength: 60, placeholder: "For example: pub lunch", oninput: (e) => { name = e.target.value; } }),
    h("label", { class: "label" }, "Meal"), meals, err,
    h("button", { class: "button", type: "button", onclick: () => {
      const k = Number(kcal), p = Number(protein || 0);
      if (!(k > 0 && k < 5000) || !(p >= 0 && p < 400)) { err.textContent = "Type the calories (and protein if you know it)."; return; }
      let id = null;
      update((doc, t) => { const e = { id: `f-${TODAY.replaceAll("-", "")}-${Math.random().toString(36).slice(2, 8)}`, updated_at: t, date: TODAY, meal, food: null, name: cleanText(name, 60) || "Quick add", amount_g: null, servings: null, kcal: Math.round(k), protein_g: r1(p), carbs_g: null, fat_g: null, source: "quick" }; id = e.id; doc.food_log.push(e); });
      sheet.close(); rerender(); toast(`Added ${Math.round(k)} kcal.`, () => { tombstone(id); rerender(); });
    } }, icon("plus", 20), "Add"),
  ], { label: "Quick add" });
}

function openCopyYesterday() {
  const doc = loadDoc();
  const y = dayEntries(doc, dayStr(-1));
  const s2 = openSheet([
    h("h2", {}, "Copy yesterday"),
    y.length ? [h("p", { class: "small muted" }, `${y.length} foods, ${fmt(sum(y, "kcal"))} kcal, ${fmt(Math.round(sum(y, "protein_g")))} g protein.`),
      h("ul", { class: "list-plain small" }, y.map((e) => h("li", {}, h("span", {}, e.name), h("span", { class: "muted" }, `${e.amount_g ? `${e.amount_g} g · ` : ""}${e.kcal} kcal`)))),
      h("button", { class: "button", type: "button", onclick: () => { const ids = []; update((d, t) => { for (const e of y) { const c = { ...e, id: `f-${TODAY.replaceAll("-", "")}-${Math.random().toString(36).slice(2, 8)}`, date: TODAY, updated_at: t }; ids.push(c.id); d.food_log.push(c); } }); s2.close(); rerender(); toast(`Copied ${ids.length} foods to today.`, () => { ids.forEach(tombstone); rerender(); }); } }, icon("copy", 20), `Add all ${y.length} to today`)]
      : h("p", { class: "muted" }, "Nothing logged yesterday."),
  ], { label: "Copy yesterday" });
}

function openEntry(e) {
  const doc = loadDoc();
  const food = e.food ? live(doc.foods).find((f) => f.id === e.food) : null;
  let grams = e.amount_g ?? 100;
  let meal = e.meal ?? mealNow();
  const meals = h("div", {});
  const drawMeals = () => meals.replaceChildren(mealRow(meal, (v) => { meal = v; drawMeals(); }));
  drawMeals();
  const st = food ? gramsStepper(grams, (n) => { grams = n; }) : null;
  const sheet = openSheet([
    h("h2", {}, e.name),
    h("p", { class: "small muted" }, `${e.kcal} kcal · ${e.protein_g} g protein${e.amount_g ? ` · ${e.amount_g} g` : ""}`),
    st ? [h("label", { class: "label" }, "How much"), st.el] : h("p", { class: "small muted" }, "A quick add: change it by deleting and adding again."),
    h("label", { class: "label" }, "Meal"), meals,
    h("button", { class: "button", type: "button", onclick: () => {
      update((d, t) => { const x = d.food_log.find((y) => y.id === e.id); if (!x) return; if (food) { const n = entryFrom(food, grams, x.date, meal, t); Object.assign(x, { amount_g: n.amount_g, kcal: n.kcal, protein_g: n.protein_g, carbs_g: n.carbs_g, fat_g: n.fat_g }); } x.meal = meal; x.updated_at = t; });
      sheet.close(); rerender();
    } }, "Save"),
    h("button", { class: "button secondary danger-text", type: "button", onclick: () => { tombstone(e.id); sheet.close(); rerender(); toast(`Deleted ${e.name}.`, () => { update((d, t) => { const x = d.food_log.find((y) => y.id === e.id); if (x) { delete x.deleted; delete x.deleted_at; x.updated_at = t; } }); rerender(); }); } }, icon("trash", 18), "Delete"),
  ], { label: "Food entry" });
}

export function openAddMenu() {
  const way = (ic, title, sub, fn) => h("button", { class: "mach-row", type: "button", onclick: fn }, h("span", { class: "area-icon" }, icon(ic, 20)), h("span", { class: "grow" }, h("b", {}, title), h("span", { class: "small muted" }, sub)), icon("chevron", 18));
  openSheet([h("h2", {}, "Add food"), h("div", { class: "card" },
    way("scan", "Scan a barcode", "Camera; reads by itself", () => { closeSheets(); openScanner(handleBarcode, openDigits); }),
    way("keys", "Type the barcode", "The digits under the bars", openDigits),
    way("search", "Search by name", "Your foods, then Open Food Facts", () => openSearch()),
    way("bolt", "Quick add", "Calories and protein only", openQuick),
    way("copy", "Copy yesterday", "Every food from yesterday", openCopyYesterday))], { label: "Add food" });
}

// ---------- the Diet tab ----------
export function renderDiet() {
  const doc = loadDoc();
  const t = doc.profile?.targets ?? { kcal: 2000, protein_g: 140 };
  const today = dayEntries(doc, TODAY);
  const kcal = sum(today, "kcal"), protein = sum(today, "protein_g");
  const avg = weekAverage(doc);
  const recent = recentFoods(doc);
  const date = new Date(`${TODAY}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const main = screenWithBar(
    head(`Food · ${date}`, "Diet"),
    h("section", { class: "food-hero card" },
      h("div", { class: "rings" }, ring("Protein", protein, t.protein_g, "g", "protein"), ring("Calories", kcal, t.kcal, "kcal", "kcal")),
      h("div", { class: "macro-line small muted" }, `Carbs ${fmt(Math.round(sum(today, "carbs_g")))} g · Fat ${fmt(Math.round(sum(today, "fat_g")))} g`),
      avg ? h("div", { class: "avg-line" }, h("span", { class: "eyebrow" }, "Last 7 days, average"), h("span", {}, h("b", {}, fmt(avg.protein)), " g protein · ", h("b", {}, fmt(avg.kcal)), " kcal")) : null),
    h("div", { class: "add-ways" },
      h("button", { class: "way", type: "button", onclick: () => openScanner(handleBarcode, openDigits) }, icon("scan", 24), "Scan"),
      h("button", { class: "way", type: "button", onclick: () => openSearch() }, icon("search", 24), "Search"),
      h("button", { class: "way", type: "button", onclick: openDigits }, icon("keys", 24), "Digits"),
      h("button", { class: "way", type: "button", onclick: openQuick }, icon("bolt", 24), "Quick")),
    recent.length ? [h("div", { class: "section-head" }, h("h2", {}, "Log again"), h("button", { class: "text-button", type: "button", onclick: openCopyYesterday }, icon("copy", 16), " Copy yesterday")),
      h("p", { class: "small muted" }, "Tap + to add the same amount as last time."),
      h("div", { class: "again-grid" }, recent.map(logAgainTile))] : null,
    h("h2", {}, "Today"),
    today.length ? MEALS.map(([m, label]) => {
      const list = today.filter((e) => (e.meal ?? "snack") === m);
      if (!list.length) return null;
      return h("div", { class: "card meal-card" },
        h("div", { class: "meal-head" }, h("b", {}, label), h("span", { class: "small muted" }, `${fmt(sum(list, "kcal"))} kcal · ${fmt(Math.round(sum(list, "protein_g")))} g protein`)),
        list.map((e) => h("button", { class: "food-row", type: "button", onclick: () => openEntry(e), "aria-label": `${e.name}, ${e.kcal} kcal, ${e.protein_g} g protein. Change or delete.` },
          h("span", { class: "grow" }, h("b", {}, e.name), h("span", { class: "small muted" }, [timeOf(e), e.amount_g ? `${e.amount_g} g` : "Quick add"].filter(Boolean).join(" · "))),
          h("span", { class: "food-nums" }, h("b", {}, `${e.protein_g} g`), h("span", { class: "small muted" }, `${e.kcal} kcal`)))));
    }) : h("div", { class: "card" }, h("p", { class: "muted" }, "Nothing logged today. Scan a pack, or tap + on a food you had before.")),
    credit(),
  );
  onMount(() => stagger(main.querySelectorAll(".again-tile, .meal-card")));
  return [main, tabActionBar(mainButton([icon("scan", 22), "Scan a barcode"], () => openScanner(handleBarcode, openDigits)))];
}
export { openSearch, openQuick, openDigits, pill };
