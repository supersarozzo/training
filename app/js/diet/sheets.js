// The Diet sheets (DESIGN 15.8 to 15.10): Quick add, Your foods and search, the check step, Type the digits, the
// change-an-entry sheet, and the Undo toast. Open Food Facts text is untrusted: it only ever goes in through h() as text.
// Search runs ONLY when Search is tapped (or the form is sent), never while typing.
import { h, mount } from "../h.js";
import { openSheet, mainButton, secondaryButton, stepper } from "../ui/parts.js";
import { icon } from "../ui/icons.js";
import { rerender } from "../ui/app.js";
import { food as fm, off } from "./foodapp.js";
import { OFF_CREDIT_LINKS } from "../food/off.js";
import { MEALS } from "../food/foodvalidate.js";
import { MEAL_WORDS, mealAt, savedFoods, checkFood, startAmount, cleanText, servingOf, gramsForCount, countForGrams, stepCount, maxCount } from "../food/foodmath.js";
import { normalizeBarcode, BARCODE_WORDS, foodIdFor } from "../food/barcode.js";
import { now, today } from "../clock.js";

const link = (text, href) => h("a", { href, target: "_blank", rel: "noopener noreferrer" }, text);

// The credit line (DESIGN 15.10). On every sheet that shows Open Food Facts data and at the foot of the Diet tab.
export function creditLine() {
  return h("p", { class: "credit small muted" },
    "Contains data from ", link("Open Food Facts", OFF_CREDIT_LINKS.off), ", available under the ", link("Open Database License", OFF_CREDIT_LINKS.odbl), ".");
}

const errText = (e) => (e && e.message ? e.message : "That did not work. Nothing was changed.");
const num = (text) => {
  const t = String(text ?? "").trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};
const show = (n) => (n === null || n === undefined ? "?" : String(Math.round(n * 10) / 10));
let uid = 0;

// The Diet page gives its list redraw here: Undo with a sheet open redraws the list behind it and leaves the sheet open.
let redrawList = () => {};
export function setListRedraw(fn) { redrawList = fn; }

// A message with an Undo button that goes away after 8 seconds. One at a time.
export function undoToast(text, onUndo, ms = 8000) {
  document.querySelectorAll(".undo-toast").forEach((el) => el.remove());
  const el = h("div", { class: "toast undo-toast", role: "status" },
    h("span", { class: "undo-text" }, text),
    h("button", {
      class: "text-button", type: "button",
      onclick: () => {
        el.remove();
        try { onUndo(); } catch (e) { messageToast(errText(e)); }
        document.querySelector("[data-sheet], [data-scan]") ? redrawList() : rerender(); // a sheet stays open (typed text): only the list behind it is redrawn
      },
    }, icon("undo", 18), "Undo"));
  document.body.append(el);
  setTimeout(() => el.remove(), ms);
}
export function messageToast(text, ms = 6000) {
  const el = h("div", { class: "toast", role: "status" }, text);
  document.body.append(el);
  setTimeout(() => el.remove(), ms);
}

// Four meal buttons, one chosen. Classes only (the page allows no style attributes).
export function mealRow(selected, onPick) {
  let cur = selected;
  const row = h("div", { class: "meals", role: "group", "aria-label": "Meal" });
  const draw = () => row.replaceChildren(...MEALS.map((m) =>
    h("button", { class: "pick", type: "button", "aria-pressed": m === cur ? "true" : "false", onclick: () => { cur = m; onPick(m); draw(); } }, MEAL_WORDS[m])));
  draw();
  return row;
}

function field(label, input, id) {
  return h("div", { class: "field" }, h("label", { for: id }, label), input);
}
const numInput = (id, value, oninput, label) =>
  h("input", { id, type: "number", inputmode: "decimal", step: "any", min: "0", value: value ?? "", "aria-label": label, oninput });

// ---------- Quick add ----------
export function openQuickAdd() {
  const id = `q${++uid}`;
  let meal = mealAt(now());
  const v = { name: "", kcal: "", protein: "", carbs: "", fat: "" };
  const error = h("p", { class: "error-text", role: "alert" });
  const close = openSheet(
    h("h2", {}, "Quick add"),
    h("p", { class: "muted small" }, "Type the numbers you know. No food is saved."),
    field("Name (you can leave it empty)", h("input", { id: `${id}n`, type: "text", maxlength: "120", autocomplete: "off", oninput: (e) => { v.name = e.target.value; } }), `${id}n`),
    h("div", { class: "grid2" },
      field("Calories (kcal)", numInput(`${id}k`, "", (e) => { v.kcal = e.target.value; }, "Calories"), `${id}k`),
      field("Protein (g)", numInput(`${id}p`, "", (e) => { v.protein = e.target.value; }, "Protein"), `${id}p`),
      field("Carbs (g, optional)", numInput(`${id}c`, "", (e) => { v.carbs = e.target.value; }, "Carbs"), `${id}c`),
      field("Fat (g, optional)", numInput(`${id}f`, "", (e) => { v.fat = e.target.value; }, "Fat"), `${id}f`)),
    h("div", { class: "label" }, "Meal"),
    mealRow(meal, (m) => { meal = m; }),
    error,
    mainButton("Add", () => {
      const kcal = num(v.kcal);
      const protein_g = num(v.protein);
      if (kcal === null || protein_g === null) { error.textContent = "Type the calories and the protein."; return; }
      try {
        const e = fm.quickAdd({ date: today(), meal, name: cleanText(v.name), kcal, protein_g, carbs_g: num(v.carbs), fat_g: num(v.fat) });
        close(); rerender();
        undoToast(`Added ${e.name} · ${e.kcal} kcal`, () => fm.removeEntry(e.id));
      } catch (e) { error.textContent = errText(e); }
    }));
  return close;
}

// ---------- Type the digits ----------
export function openDigits() {
  const id = `d${++uid}`;
  const input = h("input", { id, type: "text", inputmode: "numeric", autocomplete: "off", maxlength: "20", "aria-label": "Barcode digits" });
  const note = h("p", { class: "error-text", role: "alert" });
  const status = h("div", { class: "lookup-wait", role: "status" });
  const go = async () => {
    const n = normalizeBarcode(input.value);
    if (!n.ok) { note.textContent = BARCODE_WORDS[n.reason]; mount(status); return; } // no lookup is made
    note.textContent = "";
    const saved = savedFoods(fm.doc()).find((f) => f.id === foodIdFor(n.code));
    if (saved) { openCheck({ mode: "saved", food: saved }); return; } // already saved: no lookup
    await lookupCode(n.code, status);
  };
  const form = h("form", { onsubmit: (e) => { e.preventDefault(); go(); } },
    field("The digits under the bars", input, id), note, status,
    h("button", { class: "button", type: "submit" }, "Look it up"));
  return openSheet(h("h2", {}, "Type the digits"), form);
}

// Look a barcode up (one network call, only the number is sent). `host`: where "Looking it up" shows. Opens the check step.
export async function lookupCode(code, host) {
  if (host) mount(host, h("p", { class: "muted" }, icon("clock", 16), " Looking it up · Only the barcode number is sent."));
  const res = await off.lookup(code);
  if (host && !host.isConnected) return;
  openLookupResult(code, res, host);
}
export function openLookupResult(code, res, host = null) {
  if (res.ok) { openCheck({ mode: "off", product: res.product }); return; }
  const box = [h("p", { class: "error-text", role: "alert" }, res.message),
    secondaryButton("Make a new food", () => openCheck({ mode: "own", prefill: { barcode: code } }))];
  if (host) mount(host, ...box);
  else openSheet(h("h2", {}, "Not found"), ...box);
}

// ---------- Your foods and search ----------
export function openSearch() {
  let q = "";
  let seq = 0;
  const mine = h("div", { class: "foods-mine" });
  const online = h("div", { class: "foods-online", "aria-live": "polite" });
  const input = h("input", {
    type: "text", inputmode: "search", enterkeyhint: "search", autocomplete: "off", maxlength: "120",
    placeholder: "Food name or barcode digits", "aria-label": "Food name or barcode digits",
    oninput: (e) => { q = e.target.value; drawMine(); }, // typing only filters your own foods on this phone
  });
  const row = (title, sub, right, onclick) => h("button", { class: "fl", type: "button", onclick },
    h("span", { class: "nm" }, h("b", {}, title), sub ? h("small", { class: "muted" }, sub) : null), h("span", { class: "kc muted small" }, right));

  function drawMine() {
    const word = q.trim().toLowerCase();
    const list = savedFoods(fm.doc()).filter((f) => !word || `${f.name} ${f.brand ?? ""} ${f.barcode ?? ""}`.toLowerCase().includes(word)).slice(0, 30);
    mount(mine,
      h("h3", {}, "Your foods (work offline)"),
      list.length ? list.map((f) => row(f.name, f.brand, `${show(f.per100g.kcal)} kcal / 100 g`, () => openCheck({ mode: "saved", food: f })))
        : h("p", { class: "muted small" }, word ? "None of your foods match." : "No saved foods yet. Foods you save show here."));
  }

  async function runSearch() {
    const text = cleanText(q);
    if (!text) { mount(online, h("p", { class: "muted small" }, "Type a food name or barcode digits first.")); return; }
    const my = ++seq;
    if (/^[\d\s-]+$/.test(text)) { // digits: a barcode lookup, after the check digit test
      const n = normalizeBarcode(text);
      if (!n.ok) { mount(online, h("p", { class: "error-text", role: "alert" }, BARCODE_WORDS[n.reason])); return; }
      const saved = savedFoods(fm.doc()).find((f) => f.id === foodIdFor(n.code));
      if (saved) { openCheck({ mode: "saved", food: saved }); return; }
      mount(online, h("p", { class: "muted" }, icon("clock", 16), " Looking it up · Only the barcode number is sent."));
      const res = await off.lookup(n.code);
      if (my !== seq || !online.isConnected) return;
      openLookupResult(n.code, res, online);
      return;
    }
    mount(online, h("p", { class: "muted" }, icon("clock", 16), " Looking it up · Only the word is sent."));
    const res = await off.search(text);
    if (my !== seq || !online.isConnected) return;
    if (!res.ok) { mount(online, h("p", { class: "error-text", role: "alert" }, res.message)); return; }
    mount(online,
      h("h3", {}, "From Open Food Facts"),
      res.products.length ? res.products.map((p) => row(p.name, p.brand, `${show(p.per100g.kcal)} kcal / 100 g`, () => openCheck({ mode: "off", product: p })))
        : h("p", { class: "muted small" }, "Nothing found. Try another word, or make a new food."));
  }

  const form = h("form", { class: "searchbar", onsubmit: (e) => { e.preventDefault(); runSearch(); } },
    input, h("button", { class: "button search-btn", type: "submit" }, icon("search", 18), "Search"));
  drawMine();
  return openSheet(
    h("h2", {}, "Your foods"),
    form,
    h("p", { class: "muted small" }, "Search runs when you tap Search. UK products only."),
    mine, online,
    secondaryButton("Make a new food", () => openCheck({ mode: "own", prefill: q.trim() && !/^[\d\s-]+$/.test(q) ? { name: cleanText(q) } : {} })),
    creditLine());
}

// ---------- The check step ----------
// mode "off": a product from Open Food Facts (check before saving). "own": a new food. "saved": a food already saved.
export function openCheck({ mode = "own", product = null, food: rec = null, prefill = {} } = {}) {
  const src = mode === "off" ? product : mode === "saved" ? rec : prefill;
  const text = (v) => (v === null || v === undefined ? "" : String(v));
  const per0 = src.per100g ?? {};
  const st = {
    name: text(src.name), brand: text(src.brand), quantity: text(src.quantity), barcode: text(src.barcode),
    kcal: text(per0.kcal), protein: text(per0.protein_g), carbs: text(per0.carbs_g), fat: text(per0.fat_g),
    amount: String(startAmount({ serving_g: src.serving_g, last_amount_g: rec ? rec.last_amount_g : null })), meal: mealAt(now()),
  };
  const id = `c${++uid}`;
  const per100g = () => ({ kcal: num(st.kcal), protein_g: num(st.protein), carbs_g: num(st.carbs), fat_g: num(st.fat) });
  const amountG = () => { const a = num(st.amount); return a !== null && a > 0 ? a : null; };
  const edited = () => mode === "off" && (st.name !== text(product.name) || st.kcal !== text(per0.kcal) || st.protein !== text(per0.protein_g) || st.carbs !== text(per0.carbs_g) || st.fat !== text(per0.fat_g));
  const fields = () => ({
    ...(rec ? { id: rec.id } : {}),
    name: cleanText(st.name), brand: cleanText(st.brand), barcode: st.barcode || undefined, per100g: per100g(),
    serving_g: src.serving_g ?? null, serving_label: src.serving_label ?? "",
    source: mode === "own" ? "own" : (src.source ?? "own"), off_fetched_at: mode === "off" ? product.off_fetched_at : undefined,
    edited: edited() ? true : undefined,
  });

  const result = h("div", { class: "check-result", "aria-live": "polite" });
  const error = h("p", { class: "error-text", role: "alert" });
  const btn = mainButton("Save and add", () => save(true));
  const second = secondaryButton("Save without adding", () => save(false));

  function refresh() {
    const c = checkFood({ per100g: per100g(), serving_g: src.serving_g ?? null, quantity: mode === "off" ? src.quantity ?? null : null });
    mount(result, c.ok ? h("p", { class: "okline" }, c.line)
      : h("div", { class: "warnbox" }, c.warnings.map((w) => h("p", {}, icon("warn", 16), " ", w))));
    const a = amountG();
    btn.querySelector(".btn-main").textContent = a ? `Save and add ${show(a)} g` : "Save and add";
    btn.disabled = a === null;
  }
  function save(add) {
    error.textContent = "";
    try {
      if (!add) { const f = fm.saveFood(fields()); close(); rerender(); messageToast(`Saved ${f.name}.`); return; }
      const r = fm.saveAndLog(fields(), { date: today(), meal: st.meal, amount_g: amountG() });
      close(); rerender();
      undoToast(`Added ${r.entry.name} · ${r.entry.kcal} kcal`, () => fm.removeEntry(r.entry.id));
    } catch (e) { error.textContent = errText(e); }
  }
  const bind = (key) => (e) => { st[key] = e.target.value; refresh(); };
  const textIn = (key, label, max) => field(label, h("input", { id: `${id}${key}`, type: "text", maxlength: max, autocomplete: "off", value: st[key], oninput: bind(key) }), `${id}${key}`);
  const numIn = (key, label) => field(label, numInput(`${id}${key}`, st[key], bind(key), label), `${id}${key}`);
  const pack = [st.brand, st.quantity, st.barcode].filter(Boolean).join(" · ");

  // "How many" (0.7.4): with a serving, a count stepper next to the grams; each one sets the other. Grams are saved.
  const serving = servingOf(src);
  let countBox = null;
  const gramsBox = stepper({
    label: "Portion", unit: "g", value: num(st.amount) ?? 100, step: 10, min: 1, max: 5000, decimals: 1,
    onChange: (n) => { st.amount = String(n); const c = serving ? countForGrams(n, serving.g) : null; if (countBox && c !== null) countBox.setValue(c); refresh(); },
  });
  if (serving) {
    countBox = stepper({
      label: "How many", value: countForGrams(num(st.amount) ?? serving.g, serving.g) ?? 1, min: 0.1, max: maxCount(serving.g), decimals: 1,
      next: (v, dir) => stepCount(v, dir),
      onChange: (n) => { const g = gramsForCount(n, serving.g); if (g === null) return; st.amount = String(g); gramsBox.setValue(g); refresh(); },
    });
  }
  const amountRow = serving
    ? [h("div", { class: "dose-pair" }, countBox, gramsBox), h("p", { class: "small muted" }, `1 = ${serving.label}`)]
    : gramsBox;

  const heading = mode === "off" ? "From Open Food Facts · check before saving" : mode === "saved" ? "Your food" : "Make a new food";
  const close = openSheet(
    h("h2", {}, heading),
    mode === "off" ? h("p", { class: "muted small" }, "Anyone can add products to Open Food Facts, so numbers can be wrong. Compare with the pack. You can change anything.") : null,
    textIn("name", "Name", "120"),
    pack ? h("p", { class: "pack-line muted small" }, pack) : null,
    h("h3", {}, "Per 100 g"),
    h("div", { class: "grid2" }, numIn("kcal", "Calories (kcal)"), numIn("protein", "Protein (g)"), numIn("carbs", "Carbs (g)"), numIn("fat", "Fat (g)")),
    result,
    h("h3", {}, "How much did you have?"),
    amountRow,
    h("div", { class: "label" }, "Meal"),
    mealRow(st.meal, (m) => { st.meal = m; }),
    error, btn, second,
    mode === "off" || (mode === "saved" && rec && rec.source === "off") ? creditLine() : null);
  refresh();
  return close;
}

// ---------- Change one entry of today ----------
export function openEntry(entry) {
  let amount = entry.amount_g;
  let meal = MEALS.includes(entry.meal) ? entry.meal : "snack";
  const error = h("p", { class: "error-text", role: "alert" });
  const close = openSheet(
    h("h2", {}, entry.name),
    h("p", { class: "muted" }, `${entry.kcal} kcal · ${show(entry.protein_g)} g protein`),
    typeof amount === "number"
      ? stepper({ label: "Amount", unit: "g", value: amount, step: 10, min: 1, max: 5000, decimals: 1, onChange: (n) => { amount = n; } })
      : h("p", { class: "muted small" }, "A quick add has no amount to change."),
    h("div", { class: "label" }, "Meal"),
    mealRow(meal, (m) => { meal = m; }),
    error,
    mainButton("Save", () => {
      try { fm.updateEntry(entry.id, typeof amount === "number" ? { amount_g: amount, meal } : { meal }); close(); rerender(); } catch (e) { error.textContent = errText(e); }
    }),
    secondaryButton("Remove", () => {
      try { fm.removeEntry(entry.id); close(); rerender(); undoToast(`Removed ${entry.name}`, () => fm.undoRemove(entry.id)); } catch (e) { error.textContent = errText(e); }
    }));
  return close;
}
