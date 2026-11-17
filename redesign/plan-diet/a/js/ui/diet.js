// PROTOTYPE 8.28 (builder A, "fastest at the gym" — and at the table). The Diet tab:
// today's protein and calories against the targets (protein first: Rosario's goal depends on it), "Log again" with one
// tap per food (last portion remembered), today's list, and the add ways: scan (camera drawn), barcode digits, name
// search, saved foods, quick add, copy yesterday. A looked-up food is always checked before it is saved.
// The scanner is a layer on the same route: the camera must not see a hash change (research 7, WebKit bug 215884).
// No red, no shame words. All text through h(); no innerHTML; no style attributes (widths through CSSOM).
import { h } from "../h.js";
import { screen, tabActionBar, openSheet, closeSheets } from "./parts.js";
import { model, rerender } from "./app.js";
import { icon } from "./icons.js";
import { onMount, stagger, countUp, reduced } from "./motion.js";
import { undoToast } from "../proto/toast.js";
import {
  dayEntries, totals, average7, recentFoods, savedFoods, portion, addEntry, addQuick, deleteEntry, undeleteEntry, changeAmount,
  copyDay, saveFood, foodById, newOwnId, validBarcode, lookupBarcode, searchFoods, problems, clip, todayStr, addDays,
  OFF_ERRORS, lookupsLeft, r1,
} from "../proto/food.js";

const fmt = (n) => Math.round(n).toLocaleString("en-GB");
const SAMPLE_SCAN = "5000159484695"; // a real UK barcode; research 8 found its data partly wrong: good for the check step

export function offCredit() {
  return h("p", { class: "off-credit small muted" },
    "Contains data from ", h("a", { href: "https://world.openfoodfacts.org", target: "_blank", rel: "noopener noreferrer" }, "Open Food Facts"),
    ", available under the ", h("a", { href: "https://opendatacommons.org/licenses/odbl/1-0/", target: "_blank", rel: "noopener noreferrer" }, "Open Database License"), ".");
}

// ---------- the day tiles ----------
function meter(label, value, target, unit, leftWord, cls) {
  const pct = target ? Math.min(1, value / target) : 0;
  const reached = target && value >= target;
  const bar = h("div", { class: `meter-bar ${reached ? "reached" : ""}`, role: "img", "aria-label": `${fmt(value)} of ${fmt(target)} ${unit}` }, h("span", {}));
  bar.firstChild.style.transform = `scaleX(${pct})`;
  const big = h("span", { class: "meter-num" }, fmt(value));
  onMount(() => countUp(big, Math.round(value)));
  const rest = target - value;
  return h("div", { class: `meter ${cls}` },
    h("div", { class: "meter-head" }, h("span", { class: "eyebrow" }, label), h("span", { class: "small muted" }, `target ${fmt(target)} ${unit}`)),
    h("div", { class: "meter-line" }, big, h("span", { class: "unit" }, ` ${unit}`),
      h("span", { class: "meter-left" }, rest > 0 ? `${fmt(rest)} ${unit} ${leftWord}` : reached && rest === 0 ? "On target" : `${fmt(-rest)} ${unit} over target`)),
    bar);
}

// ---------- amount sheet (saved food) ----------
function amountSheet(food, { entryId = null, start = null } = {}) {
  let grams = start ?? food.last_amount_g ?? food.serving_g ?? 100;
  const out = h("p", { class: "amount-out" });
  const input = h("input", { type: "number", inputmode: "decimal", class: "amount-input", value: String(grams), min: "1", max: "2000", "aria-label": "Amount in grams",
    oninput: (e) => { const n = parseFloat(e.target.value); if (Number.isFinite(n) && n > 0) { grams = Math.min(2000, n); draw(); } } });
  const draw = () => {
    const p = portion(food, grams);
    out.replaceChildren(h("b", {}, `${fmt(p.kcal)} kcal`), ` · ${r1(p.protein_g)} g protein · ${r1(p.carbs_g)} g carbs · ${r1(p.fat_g)} g fat`);
    btn.replaceChildren(h("span", { class: "btn-main" }, entryId ? `Save ${r1(grams)} g` : `Add ${r1(grams)} g`));
  };
  const step = (d) => { grams = Math.max(5, Math.round((grams + d) / 5) * 5); input.value = String(grams); draw(); };
  const chips = [...new Set([food.serving_g, food.last_amount_g, 100].filter((x) => x))].map((g) =>
    h("button", { class: "chip", type: "button", onclick: () => { grams = g; input.value = String(g); draw(); } }, g === food.serving_g && food.serving_label ? food.serving_label : `${g} g`));
  const btn = h("button", { class: "button", type: "button", onclick: () => {
    closeSheets();
    if (entryId) { changeAmount(entryId, grams); rerender(); undoToast(`Changed to ${r1(grams)} g.`); return; }
    const id = addEntry(food, grams);
    rerender();
    undoToast(`Added ${food.name}, ${r1(grams)} g.`, () => { deleteEntry(id); rerender(); });
  } });
  draw();
  openSheet(
    h("div", { class: "eyebrow accent" }, food.source === "off" ? "Saved from Open Food Facts" : "Your food"),
    h("h2", {}, food.name),
    food.brand ? h("p", { class: "small muted" }, food.brand) : null,
    h("div", { class: "amount-row" },
      h("button", { class: "step-btn", type: "button", "aria-label": "5 g less", onclick: () => step(-5) }, "−"),
      h("div", { class: "amount-box" }, input, h("span", { class: "unit" }, "g")),
      h("button", { class: "step-btn", type: "button", "aria-label": "5 g more", onclick: () => step(5) }, "+")),
    h("div", { class: "chips" }, chips),
    out,
    h("p", { class: "small muted" }, `Per 100 g: ${food.per100g.kcal} kcal, ${food.per100g.protein_g} g protein.`),
    btn,
    entryId ? h("button", { class: "button secondary", type: "button", onclick: () => {
      closeSheets(); deleteEntry(entryId); rerender();
      undoToast(`Removed ${food.name}.`, () => { undeleteEntry(entryId); rerender(); });
    } }, "Remove from today") : null);
}

// ---------- check step (looked-up food, before it is saved) ----------
function checkSheet(result, { fromScan = false } = {}) {
  const food = { ...result.food, per100g: { ...result.food.per100g } };
  let grams = food.serving_g && food.serving_g >= 5 ? food.serving_g : 100;
  const warn = h("div", {});
  const totalsLine = h("p", { class: "amount-out" });
  const nameIn = h("input", { type: "text", id: "chk-name", maxlength: "120", value: food.name, oninput: (e) => { food.name = clip(e.target.value, 120); food.edited = true; } });
  const numIn = (key, label, max) => h("div", { class: "field" },
    h("label", { for: `chk-${key}` }, label),
    h("input", { type: "number", inputmode: "decimal", id: `chk-${key}`, min: "0", max: String(max), value: Number.isFinite(food.per100g[key]) ? String(food.per100g[key]) : "",
      oninput: (e) => { const n = parseFloat(e.target.value); food.per100g[key] = Number.isFinite(n) && n >= 0 && n <= max ? n : NaN; food.edited = true; draw(); } }));
  const gIn = h("input", { type: "number", inputmode: "decimal", id: "chk-g", value: String(grams), min: "1", max: "2000", oninput: (e) => { const n = parseFloat(e.target.value); if (Number.isFinite(n) && n > 0) { grams = Math.min(2000, n); draw(); } } });
  const ok = () => ["kcal", "protein_g", "carbs_g", "fat_g"].every((k) => Number.isFinite(food.per100g[k]));
  const btn = h("button", { class: "button", type: "button" });
  const draw = () => {
    const list = problems(food.per100g, food.serving_g, result.quantity);
    warn.replaceChildren(list.length ? h("div", { class: "card soft-warn" }, h("p", { class: "status-line" }, icon("warn", 18), h("b", {}, "Check these numbers")), h("ul", { class: "small" }, list.map((t) => h("li", {}, t)))) : null);
    if (ok()) {
      const p = portion(food, grams);
      totalsLine.replaceChildren(`${r1(grams)} g = `, h("b", {}, `${fmt(p.kcal)} kcal`), ` · ${r1(p.protein_g)} g protein`);
    } else totalsLine.replaceChildren("Fill in all four numbers to save.");
    btn.disabled = !ok();
    btn.replaceChildren(h("span", { class: "btn-main" }, `Save and add ${r1(grams)} g`));
  };
  btn.addEventListener("click", () => {
    if (!ok()) return;
    const saved = { ...food, last_amount_g: grams };
    saveFood(saved);
    const id = addEntry(saved, grams);
    closeSheets(); rerender();
    undoToast(`Saved ${saved.name} to your foods and added ${r1(grams)} g. Next time it works offline.`, () => { deleteEntry(id); rerender(); });
  });
  draw();
  openSheet(
    h("div", { class: "eyebrow accent" }, food.source === "off" ? "From Open Food Facts · check before saving" : "Your own food"),
    h("h2", {}, "Check before saving"),
    h("p", { class: "small muted" }, food.source === "off"
      ? "Anyone can add products to Open Food Facts, so numbers can be wrong. Compare with the pack. You can change anything."
      : "Type the numbers from the pack (per 100 g)."),
    food.barcode ? h("p", { class: "small" }, icon("bolt", 15), ` Barcode ${food.barcode}${fromScan ? " (scanned)" : ""}`) : null,
    h("div", { class: "field" }, h("label", { for: "chk-name" }, "Name"), nameIn),
    food.brand ? h("p", { class: "small muted" }, `Brand: ${food.brand}${result.quantity ? ` · pack: ${result.quantity}` : ""}`) : null,
    h("div", { class: "eyebrow" }, "Per 100 g"),
    h("div", { class: "grid-2" }, numIn("kcal", "Calories (kcal)", 900), numIn("protein_g", "Protein (g)", 100), numIn("carbs_g", "Carbs (g)", 100), numIn("fat_g", "Fat (g)", 100)),
    warn,
    h("div", { class: "field" }, h("label", { for: "chk-g" }, `Your portion (g)${food.serving_label ? ` · pack says one serving is ${food.serving_label}` : ""}`), gIn),
    totalsLine,
    btn,
    h("button", { class: "button secondary", type: "button", onclick: () => { if (!ok()) return; saveFood(food); closeSheets(); rerender(); undoToast(`Saved ${food.name} to your foods.`); } }, "Save without adding"),
    food.source === "off" ? offCredit() : null);
}

function ownFoodSheet(barcode = null, name = "") {
  checkSheet({ food: { id: barcode ? `fb-${barcode}` : newOwnId(), name: name || "", brand: "", barcode, per100g: { kcal: NaN, protein_g: NaN, carbs_g: NaN, fat_g: NaN }, serving_g: null, serving_label: null, last_amount_g: 100, fav: false, source: "own", edited: true }, quantity: "", problems: [] });
}

// ---------- lookups ----------
async function doLookup(code, { fromScan = false } = {}) {
  const doc = model.doc();
  const known = foodById(doc, `fb-${code}`);
  if (known) { amountSheet(known); return; } // scanned before: works offline, no lookup
  if (!validBarcode(code)) { messageSheet("That barcode does not look right", "The last digit does not match the others. Scan again or check the digits. No lookup was made."); return; }
  const l = lookupsLeft();
  if (l.left <= 0) { messageSheet("Wait a moment", `Too many lookups in one minute. Try again in ${l.waitS} seconds.`); return; }
  openSheet(h("h2", {}, "Looking it up"), h("p", { class: "status-line" }, h("span", { class: "spinner", "aria-hidden": "true" }), `Barcode ${code} on Open Food Facts…`), h("p", { class: "small muted" }, "Only the barcode number is sent."));
  const r = await lookupBarcode(code);
  if (r.result) checkSheet(r.result, { fromScan });
  else if (r.notFound) {
    const close = openSheet(h("h2", {}, "Not found"), h("p", {}, `Open Food Facts does not know barcode ${code}.`),
      h("button", { class: "button", type: "button", onclick: () => { close(); ownFoodSheet(code); } }, "Add it as your own food"),
      h("p", { class: "small muted" }, "The barcode is kept with it, so the next scan finds it at once, even offline."));
  } else if (r.error === "limit") messageSheet("Wait a moment", `Too many lookups in one minute. Try again in ${r.waitS} seconds.`);
  else messageSheet("No answer", OFF_ERRORS[r.error] ?? OFF_ERRORS.http, () => ownFoodSheet(code));
}

async function doSearch(word) {
  const l = lookupsLeft();
  if (l.left <= 0) { messageSheet("Wait a moment", `Too many lookups in one minute. Try again in ${l.waitS} seconds.`); return; }
  openSheet(h("h2", {}, `Searching “${word}”`), h("p", { class: "status-line" }, h("span", { class: "spinner", "aria-hidden": "true" }), "Open Food Facts…"), h("p", { class: "small muted" }, "Only the search word is sent."));
  const r = await searchFoods(word);
  if (r.error) { messageSheet("No answer", OFF_ERRORS[r.error] ?? `Too many lookups. Try again in ${r.waitS ?? 60} seconds.`); return; }
  openSheet(
    h("h2", {}, `“${word}”`),
    h("p", { class: "small muted" }, "From Open Food Facts. Pick one to check its numbers before it is saved."),
    r.results.length ? h("div", { class: "card" }, r.results.map((res) => h("button", { class: "mach-row", type: "button", onclick: () => checkSheet(res) },
      h("span", { class: "grow" }, h("b", {}, res.food.name), h("span", { class: "small muted" }, [res.food.brand, Number.isFinite(res.food.per100g.kcal) ? `${res.food.per100g.kcal} kcal` : "kcal missing", Number.isFinite(res.food.per100g.protein_g) ? `${res.food.per100g.protein_g} g protein per 100 g` : null].filter(Boolean).join(" · "))),
      h("span", { class: "muted" }, icon("chevron", 18))))) : h("p", {}, "Nothing found. Try a shorter word, or add it as your own food."),
    h("button", { class: "button secondary", type: "button", onclick: () => ownFoodSheet(null, word) }, "Add as my own food"),
    offCredit());
}

function messageSheet(title, text, onOwn = null) {
  const close = openSheet(h("h2", {}, title), h("p", {}, text),
    onOwn ? h("button", { class: "button secondary", type: "button", onclick: () => { close(); onOwn(); } }, "Add as my own food") : null,
    h("button", { class: "button", type: "button", onclick: () => close() }, "OK"));
}

// ---------- the scanner layer (camera drawn; real decoding is a later build step) ----------
let scanLayer = null;
function closeScanner() { if (scanLayer) { scanLayer.remove(); scanLayer = null; } }
export function openScanner({ typed: typeFirst = false } = {}) {
  closeScanner();
  const digits = h("input", { type: "text", inputmode: "numeric", pattern: "[0-9]*", maxlength: "13", id: "scan-digits", placeholder: "8, 12 or 13 digits", autocomplete: "off" });
  const typed = h("form", { class: "scan-type", hidden: true, onsubmit: (e) => { e.preventDefault(); const c = digits.value.replace(/\D/g, ""); if (!c) return; closeScanner(); doLookup(c); } },
    h("label", { for: "scan-digits" }, "Type the numbers under the barcode"), digits, h("button", { class: "button", type: "submit" }, "Look it up"));
  // The drawn camera view: a pack with a barcode, inside the guide frame.
  const bars = [];
  let x = 22;
  [3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 2, 1, 3, 1, 2, 2, 1, 1, 3, 1, 2].forEach((w, i) => { if (i % 2 === 0) bars.push(h("i", { class: `b${w}` })); else bars.push(h("i", { class: `g${w}` })); x += w; });
  scanLayer = h("div", { class: "scan-layer", role: "dialog", "aria-modal": "true", "aria-label": "Scan a barcode" },
    h("div", { class: "scan-top" },
      h("button", { class: "text-button scan-close", type: "button", onclick: closeScanner }, "Close"),
      h("span", { class: "scan-title" }, "Scan a barcode")),
    h("div", { class: "scan-view", "aria-hidden": "true" },
      h("div", { class: "scan-pack" }, h("div", { class: "scan-pack-label" }), h("div", { class: "scan-code" }, bars), h("div", { class: "scan-digits-drawn" }, "5 000159 484695")),
      h("div", { class: "scan-frame" }, h("span", { class: "c tl" }), h("span", { class: "c tr" }), h("span", { class: "c bl" }), h("span", { class: "c br" }), reduced() ? null : h("span", { class: "scan-line" }))),
    h("p", { class: "scan-help" }, "Hold the barcode inside the frame. It reads by itself, then shows the food to check."),
    h("p", { class: "scan-proto small" }, "Prototype: this camera picture is drawn. The real camera and the barcode reader come in a later build step. iPhone asks for the camera once each time the app opens."),
    h("div", { class: "scan-actions" },
      h("button", { class: "button", type: "button", onclick: () => { closeScanner(); doLookup(SAMPLE_SCAN, { fromScan: true }); } }, "Try a sample scan"),
      h("div", { class: "scan-two" },
        h("button", { class: "button ghost", type: "button", onclick: (e) => { typed.hidden = false; e.currentTarget.closest(".scan-two").hidden = true; digits.focus(); } }, "Type the digits"),
        h("button", { class: "button ghost", type: "button", onclick: () => undoToast("Take a photo: opens the camera app for one still picture; the reader looks at that. Comes with the real build.") }, "Take a photo")),
      typed));
  document.body.append(scanLayer);
  if (typeFirst) { typed.hidden = false; scanLayer.querySelector(".scan-two").hidden = true; digits.focus(); }
}
// The router closes sheets on every screen change; the scanner closes the same way (and stops the camera, in the real build).
window.addEventListener("hashchange", closeScanner);

// ---------- add sheet ----------
export function openAdd({ focus = false } = {}) {
  const doc = model.doc();
  const t = todayStr();
  const yest = dayEntries(doc, addDays(t, -1));
  const q = h("input", { type: "search", id: "food-q", placeholder: "Food name or barcode digits", enterkeyhint: "search", autocomplete: "off", maxlength: "60" });
  const form = h("form", { class: "search-form", onsubmit: (e) => {
    e.preventDefault();
    const v = q.value.trim();
    if (!v) return;
    const digits = v.replace(/\s/g, "");
    if (/^\d{8,13}$/.test(digits)) doLookup(digits);
    else doSearch(v);
  } }, h("label", { for: "food-q", class: "label" }, "Search Open Food Facts"), h("div", { class: "search-row" }, q, h("button", { class: "button search-go", type: "submit" }, "Search")));
  openSheet(
    h("h2", {}, "Add food"),
    h("div", { class: "add-ways" },
      h("button", { class: "way", type: "button", onclick: () => { closeSheets(); openScanner(); } }, icon("bolt", 22), h("span", {}, "Scan barcode")),
      h("button", { class: "way", type: "button", onclick: () => quickSheet() }, icon("plus", 22), h("span", {}, "Quick add")),
      h("button", { class: "way", type: "button", disabled: !yest.length, onclick: () => {
        closeSheets(); const ids = copyDay(addDays(t, -1), t); rerender();
        undoToast(`Copied yesterday's ${ids.length} foods to today.`, () => { ids.forEach(deleteEntry); rerender(); });
      } }, icon("undo", 22), h("span", {}, yest.length ? `Copy yesterday (${yest.length})` : "Copy yesterday"))),
    form,
    h("p", { class: "small muted" }, "Search runs when you tap Search, never while typing. Only the word or the barcode is sent."),
    h("div", { class: "eyebrow" }, "Your foods (work offline)"),
    h("div", { class: "card" }, savedFoods(doc).map((f) => h("button", { class: "mach-row", type: "button", onclick: () => amountSheet(f) },
      h("span", { class: "grow" }, h("b", {}, f.name, f.fav ? h("span", { class: "badge slot inline" }, "Favourite") : null),
        h("span", { class: "small muted" }, `${f.serving_label ?? `${f.last_amount_g} g`} · ${portion(f, f.serving_g ?? f.last_amount_g).kcal} kcal · ${portion(f, f.serving_g ?? f.last_amount_g).protein_g} g protein`)),
      h("span", { class: "muted" }, icon("chevron", 18))))),
    h("button", { class: "button secondary", type: "button", onclick: () => ownFoodSheet() }, "Make a new food"),
    offCredit());
  if (focus) setTimeout(() => q.focus(), 50);
}

function quickSheet() {
  let kcal = NaN; let protein = 0; let name = "";
  const btn = h("button", { class: "button", type: "button", disabled: true, onclick: () => {
    closeSheets(); const id = addQuick(name, kcal, protein); rerender();
    undoToast(`Added ${fmt(kcal)} kcal.`, () => { deleteEntry(id); rerender(); });
  } }, "Add");
  openSheet(
    h("h2", {}, "Quick add"),
    h("p", { class: "small muted" }, "Just the numbers, for a meal out. Not saved as a food."),
    h("div", { class: "grid-2" },
      h("div", { class: "field" }, h("label", { for: "qa-kcal" }, "Calories (kcal)"), h("input", { type: "number", id: "qa-kcal", inputmode: "numeric", min: "0", max: "5000", oninput: (e) => { kcal = parseFloat(e.target.value); btn.disabled = !(kcal > 0 && kcal <= 5000); } })),
      h("div", { class: "field" }, h("label", { for: "qa-p" }, "Protein (g)"), h("input", { type: "number", id: "qa-p", inputmode: "decimal", min: "0", max: "400", oninput: (e) => { protein = Math.max(0, Math.min(400, parseFloat(e.target.value) || 0)); } }))),
    h("div", { class: "field" }, h("label", { for: "qa-name" }, "Name (optional)"), h("input", { type: "text", id: "qa-name", maxlength: "120", placeholder: "For example: lunch out", oninput: (e) => { name = e.target.value; } })),
    btn);
}

// ---------- the Diet screen ----------
export function renderDiet() {
  const doc = model.doc();
  const t = todayStr();
  const targets = doc.profile?.targets ?? {};
  const entries = dayEntries(doc, t);
  const tot = totals(entries);
  const avg = average7(doc, t);
  const yest = dayEntries(doc, addDays(t, -1));
  const loggedToday = new Set(entries.map((e) => e.food));
  // Foods not eaten yet today come first: they are the likely next ones.
  const recent = recentFoods(doc, 8).sort((a, b) => loggedToday.has(a.id) - loggedToday.has(b.id)).slice(0, 6);
  const dayName = new Date(`${t}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });

  const main = screen(
    h("span", { class: "eyebrow accent" }, `Food · ${dayName}`),
    h("h1", {}, "Diet"),
    h("div", { class: "card meters" },
      targets.protein_g ? meter("Protein", tot.protein_g, targets.protein_g, "g", "to go", "protein") : null,
      targets.kcal ? meter("Calories", tot.kcal, targets.kcal, "kcal", "left", "kcal") : null,
      avg ? h("p", { class: "small muted avg" }, `Last ${avg.n} days: ${fmt(avg.kcal)} kcal and ${fmt(avg.protein_g)} g protein a day on average.`) : null),
    // The other ways, one tap from the tab (idea from builder B's review). Scan stays the big button in the bottom bar.
    h("div", { class: "add-ways four" },
      h("button", { class: "way", type: "button", onclick: () => openAdd({ focus: true }) }, icon("food", 20), h("span", {}, "Search")),
      h("button", { class: "way", type: "button", onclick: () => openScanner({ typed: true }) }, icon("note", 20), h("span", {}, "Digits")),
      h("button", { class: "way", type: "button", onclick: quickSheet }, icon("plus", 20), h("span", {}, "Quick add")),
      h("button", { class: "way", type: "button", disabled: !yest.length, onclick: () => {
        const ids = copyDay(addDays(t, -1), t); rerender();
        undoToast(`Copied yesterday's ${ids.length} foods to today.`, () => { ids.forEach(deleteEntry); rerender(); });
      } }, icon("undo", 20), h("span", {}, "Copy yesterday"))),
    recent.length ? [h("div", { class: "eyebrow list-eyebrow" }, "Log again · one tap"),
      h("div", { class: "card again" }, recent.map((f) => {
        const g = f.last_amount_g ?? f.serving_g ?? 100;
        const p = portion(f, g);
        return h("div", { class: "again-row" },
          h("button", { class: "again-main", type: "button", onclick: () => amountSheet(f), "aria-label": `${f.name}: change the amount` },
            h("b", {}, f.name), h("span", { class: "small muted" }, `${r1(g)} g · ${fmt(p.kcal)} kcal · ${p.protein_g} g protein${loggedToday.has(f.id) ? " · had today" : ""}`)),
          h("button", { class: "again-add", type: "button", "aria-label": `Add ${f.name}, ${r1(g)} g`, onclick: () => {
            const id = addEntry(f, g); rerender();
            undoToast(`Added ${f.name}, ${r1(g)} g.`, () => { deleteEntry(id); rerender(); });
          } }, icon("plus", 22, { strokeWidth: 2.6 })));
      }))] : null,
    h("div", { class: "eyebrow list-eyebrow" }, `Today · ${entries.length} ${entries.length === 1 ? "food" : "foods"}`),
    entries.length ? h("div", { class: "card log" }, entries.map((e) => {
      const food = e.food ? foodById(doc, e.food) : null;
      return h("button", { class: "log-row", type: "button", onclick: () => (food ? amountSheet(food, { entryId: e.id, start: e.amount_g }) : quickEdit(e)) },
        h("span", { class: "log-time small muted" }, e.time ?? ""),
        h("span", { class: "grow" }, h("b", {}, e.name), h("span", { class: "small muted" }, e.amount_g ? `${r1(e.amount_g)} g` : "quick add")),
        h("span", { class: "log-nums" }, h("b", {}, fmt(e.kcal)), h("small", {}, `${r1(e.protein_g ?? 0)} g P`)));
    })) : h("div", { class: "card" }, h("p", { class: "muted" }, "Nothing logged today. Scan a barcode or tap a food under Log again.")),
    h("p", { class: "small muted" }, "Targets come from your plan (Today shows the same). Food lives on this phone; in the real app it syncs to its own file."),
    offCredit());
  main.className = "screen has-bar diet";
  onMount(() => stagger(main.querySelectorAll(".again-row, .log-row")));
  return [main, tabActionBar(h("div", { class: "day-nav diet-nav" },
    h("button", { class: "button secondary", type: "button", onclick: () => openAdd() }, icon("plus", 20), "Your foods"),
    h("button", { class: "button", type: "button", onclick: openScanner }, icon("bolt", 20), "Scan")))];
}

function quickEdit(e) {
  const close = openSheet(h("h2", {}, e.name), h("p", {}, `${fmt(e.kcal)} kcal · ${r1(e.protein_g ?? 0)} g protein`),
    h("button", { class: "button secondary", type: "button", onclick: () => { close(); deleteEntry(e.id); rerender(); undoToast(`Removed ${e.name}.`, () => { undeleteEntry(e.id); rerender(); }); } }, "Remove from today"));
}
