// Create, change and delete food records. The Diet screens never write storage directly: they call these.
// Every change stamps updated_at and is saved at once, like a set (research 9.5 item 1). Deletes are tombstones.
// Text is cleaned and cut to 120 letters; numbers are range-checked, so the phone never holds what
// foodvalidate.js would refuse later.
import { nowUtc, newId } from "../ids.js";
import { MEALS } from "./foodvalidate.js";
import { cleanText, numbersFor, againAmount, entriesOn, PER100_MAX } from "./foodmath.js";
import { normalizeBarcode, foodIdFor } from "./barcode.js";

const MAX_AMOUNT = 5000; // grams in one entry
const QUICK = { kcal: 10000, macro: 1000 };
const isDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const fin = (n) => typeof n === "number" && Number.isFinite(n);

function need(ok, message) { if (!ok) throw new Error(message); }

function cleanPer100(p) {
  need(p && typeof p === "object", "The numbers per 100 g are missing.");
  const out = {};
  for (const k of ["kcal", "protein_g", "carbs_g", "fat_g"]) {
    const v = p[k];
    if (v === null || v === undefined || v === "") { out[k] = null; continue; }
    need(fin(v) && v >= 0, "Numbers can not be below 0.");
    need(v <= (k === "kcal" ? PER100_MAX.kcal : PER100_MAX.macro), k === "kcal" ? "More than 900 kcal in 100 g is not possible." : "More than 100 g in 100 g is not possible.");
    out[k] = Math.round(v * 10) / 10;
  }
  need(out.kcal !== null, "Type the calories per 100 g.");
  return out;
}
function cleanDay(date, meal) {
  need(isDate(date), "That day is not a date.");
  need(meal === null || MEALS.includes(meal), "Pick a meal.");
}
function cleanAmount(amount_g) {
  need(fin(amount_g) && amount_g > 0 && amount_g <= MAX_AMOUNT, `The amount must be between 0 and ${MAX_AMOUNT} g.`);
  return Math.round(amount_g * 10) / 10;
}

export function createFoodModel(store, clock = () => new Date()) {
  const stamp = () => nowUtc(clock());

  function update(fn) {
    const doc = store.load();
    const out = fn(doc, stamp());
    store.save(doc);
    return out;
  }
  const findLive = (list, id) => list.find((r) => r && r.id === id && r.deleted !== true);

  function upsertFood(doc, t, fields) {
    const name = cleanText(fields.name);
    need(name.length > 0, "Give the food a name.");
    let barcode = null;
    if (fields.barcode !== undefined && fields.barcode !== null && fields.barcode !== "") {
      const b = normalizeBarcode(String(fields.barcode));
      need(b.ok, "That barcode does not look right.");
      barcode = b.code;
    }
    const id = fields.id && /^fo-\d{8}-[a-z0-9]{6}$/.test(fields.id) ? fields.id : barcode ? foodIdFor(barcode) : newId("fo", clock());
    const i = doc.foods.findIndex((r) => r && r.id === id);
    const old = i >= 0 ? doc.foods[i] : {};
    const serving = fields.serving_g === undefined ? old.serving_g ?? null : fields.serving_g;
    need(serving === null || (fin(serving) && serving > 0 && serving <= MAX_AMOUNT), "The serving must be between 0 and 5000 g.");
    const rec = {
      ...old, id, updated_at: t,
      name,
      brand: cleanText(fields.brand ?? old.brand ?? "") || null,
      barcode,
      per100g: cleanPer100(fields.per100g),
      serving_g: serving === null ? null : Math.round(serving * 10) / 10,
      serving_label: cleanText(fields.serving_label ?? old.serving_label ?? "", 60) || null,
      last_amount_g: fin(old.last_amount_g) ? old.last_amount_g : null,
      fav: fields.fav === undefined ? old.fav === true : fields.fav === true,
      source: fields.source === "off" ? "off" : old.source === "off" && fields.source === undefined ? "off" : "own",
      off_fetched_at: fields.off_fetched_at ?? old.off_fetched_at ?? null,
      edited: fields.edited === true || old.edited === true,
    };
    delete rec.deleted; delete rec.deleted_at;
    if (i >= 0) doc.foods[i] = rec; else doc.foods.push(rec);
    return rec;
  }

  function makeEntry(t, { date, meal, food, name, amount_g, per100g, source }) {
    cleanDay(date, meal);
    const amount = cleanAmount(amount_g);
    return {
      id: newId("f", clock()), updated_at: t, date, meal,
      food: food ?? null,
      name: cleanText(name) || "Food",
      amount_g: amount, servings: null,
      ...numbersFor(per100g, amount),
      per100g: { ...per100g },
      source,
    };
  }

  return {
    doc: () => store.load(),

    // Save (or update) a food. A barcode food has the id fb-<barcode>, so a scan on two phones makes ONE record.
    saveFood(fields) { return update((doc, t) => upsertFood(doc, t, fields)); },

    // The check step's main button: save the food and log the portion, in one save.
    saveAndLog(fields, { date, meal, amount_g }) {
      return update((doc, t) => {
        cleanDay(date, meal);
        const amount = cleanAmount(amount_g);
        const food = upsertFood(doc, t, fields);
        food.last_amount_g = amount;
        const entry = makeEntry(t, { date, meal, food: food.id, name: food.name, amount_g: amount, per100g: food.per100g, source: food.source });
        doc.food_log.push(entry);
        return { food: { ...food }, entry: { ...entry } };
      });
    },

    // Log a saved food again (one tap): the last portion, else its serving, else 100 g.
    logAgain(foodId, { date, meal, amount_g }) {
      return update((doc, t) => {
        const food = findLive(doc.foods, foodId);
        need(food, "That food was not found.");
        const amount = cleanAmount(amount_g ?? againAmount(food));
        const entry = makeEntry(t, { date, meal, food: food.id, name: food.name, amount_g: amount, per100g: food.per100g, source: food.source === "off" ? "off" : "own" });
        food.last_amount_g = amount;
        food.updated_at = t;
        doc.food_log.push(entry);
        return { ...entry };
      });
    },

    // Quick add: calories and protein (carbs and fat optional), no saved food.
    quickAdd({ date, meal, name, kcal, protein_g, carbs_g = null, fat_g = null }) {
      return update((doc, t) => {
        cleanDay(date, meal);
        need(fin(kcal) && kcal >= 0 && kcal <= QUICK.kcal, `Calories must be between 0 and ${QUICK.kcal}.`);
        need(fin(protein_g) && protein_g >= 0 && protein_g <= QUICK.macro, `Protein must be between 0 and ${QUICK.macro} g.`);
        for (const v of [carbs_g, fat_g]) need(v === null || (fin(v) && v >= 0 && v <= QUICK.macro), `Carbs and fat must be between 0 and ${QUICK.macro} g.`);
        const r1 = (v) => (v === null ? null : Math.round(v * 10) / 10);
        const entry = { id: newId("f", clock()), updated_at: t, date, meal, food: null, name: cleanText(name) || "Quick add", amount_g: null, servings: null, kcal: Math.round(kcal), protein_g: r1(protein_g), carbs_g: r1(carbs_g), fat_g: r1(fat_g), source: "quick" };
        doc.food_log.push(entry);
        return { ...entry };
      });
    },

    // Change the portion (numbers worked out again from the entry's own numbers per 100 g) or the meal.
    updateEntry(id, { amount_g, meal } = {}) {
      return update((doc, t) => {
        const e = findLive(doc.food_log, id);
        need(e, "That food was not found.");
        if (meal !== undefined) { need(meal === null || MEALS.includes(meal), "Pick a meal."); e.meal = meal; }
        if (amount_g !== undefined) {
          const amount = cleanAmount(amount_g);
          need(fin(e.amount_g) && e.amount_g > 0, "A quick add has no amount to change.");
          const per = e.per100g && typeof e.per100g === "object" ? e.per100g : null;
          if (per) Object.assign(e, numbersFor(per, amount));
          else {
            const f = amount / e.amount_g;
            const s = (v) => (fin(v) ? Math.round(v * f * 10) / 10 : v);
            Object.assign(e, { kcal: Math.round(e.kcal * f), protein_g: s(e.protein_g), carbs_g: s(e.carbs_g), fat_g: s(e.fat_g) });
          }
          e.amount_g = amount;
        }
        e.updated_at = t;
        return { ...e };
      });
    },

    removeEntry(id) {
      return update((doc, t) => {
        const e = findLive(doc.food_log, id);
        need(e, "That food was not found.");
        Object.assign(e, { deleted: true, deleted_at: t, updated_at: t });
      });
    },
    // Undo a remove: a newer edit, so it wins a merge against the tombstone.
    undoRemove(id) {
      return update((doc, t) => {
        const e = doc.food_log.find((r) => r && r.id === id);
        need(e, "That food was not found.");
        delete e.deleted; delete e.deleted_at;
        e.updated_at = t;
      });
    },

    // Copy a day's foods to another day (Copy yesterday). New ids; returns them for Undo.
    copyDay(fromDate, toDate) {
      return update((doc, t) => {
        cleanDay(fromDate, null); cleanDay(toDate, null);
        const src = entriesOn(doc, fromDate);
        const ids = [];
        for (const e of src) {
          const copy = { ...JSON.parse(JSON.stringify(e)), id: newId("f", clock()), updated_at: t, date: toDate };
          delete copy.deleted; delete copy.deleted_at;
          doc.food_log.push(copy);
          ids.push(copy.id);
        }
        return ids;
      });
    },
    undoCopy(ids) {
      return update((doc, t) => {
        const set = new Set(ids);
        for (const e of doc.food_log) if (e && set.has(e.id) && e.deleted !== true) Object.assign(e, { deleted: true, deleted_at: t, updated_at: t });
      });
    },

    removeFood(id) {
      return update((doc, t) => {
        const f = findLive(doc.foods, id);
        need(f, "That food was not found.");
        Object.assign(f, { deleted: true, deleted_at: t, updated_at: t });
      });
    },
    setFav(id, on) {
      return update((doc, t) => {
        const f = findLive(doc.foods, id);
        need(f, "That food was not found.");
        f.fav = on === true;
        f.updated_at = t;
      });
    },
  };
}
