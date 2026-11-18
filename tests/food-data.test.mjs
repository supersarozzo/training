// Food data (build step 6, delicate): the food document, its check, its merge, the phone box and the model.
// Written before the code (tests first). All numbers are made up: never Rosario's targets or body data.
import test from "node:test";
import assert from "node:assert/strict";
import { FOOD_FORMAT, FOOD_APP, MEALS, emptyFoodDoc, validateFoodDoc } from "../app/js/food/foodvalidate.js";
import { FOOD_LISTS, mergeFoodDocs, hasFoodData, foodChangesSince } from "../app/js/food/foodmerge.js";
import { createFoodStore, FOOD_KEYS } from "../app/js/food/foodstore.js";
import { createFoodModel } from "../app/js/food/foodmodel.js";
import {
  numbersFor, entriesOn, totals, byMeal, mealAt, recentFoods, averageLast7, checkFood, startAmount, againAmount,
  dayBefore, cleanText, TEXT_MAX,
} from "../app/js/food/foodmath.js";
import { canonical } from "../app/js/sync/merge.js";
import { KEYS } from "../app/js/store.js";
import { fakeStorage } from "./fixtures/profiles.mjs";

const T = (s) => `2026-03-02T${s}.000Z`;
function phone(start = "2026-03-02T08:00:00.000Z", limit = Infinity) {
  const storage = fakeStorage(limit);
  const store = createFoodStore(storage);
  let ms = Date.parse(start);
  const clock = () => new Date((ms += 1000));
  return { storage, store, model: createFoodModel(store, clock), tick: (s) => { ms += s * 1000; } };
}
const OATS = { name: "Test oats", brand: "Brand X", barcode: "5000000000012", per100g: { kcal: 370, protein_g: 11, carbs_g: 60, fat_g: 8 }, serving_g: 40, serving_label: "40 g", source: "off" };
const live = (list) => list.filter((r) => !r.deleted);

// ---------- the document and its check ----------

test("F1 the empty food document has its own app name, format 1 and the two lists", () => {
  const d = emptyFoodDoc();
  assert.equal(FOOD_FORMAT, 1);
  assert.equal(FOOD_APP, "training-food");
  assert.deepEqual(d, { format: 1, app: "training-food", foods: [], food_log: [] });
  assert.deepEqual(FOOD_LISTS, ["foods", "food_log"]);
  assert.deepEqual(MEALS, ["breakfast", "lunch", "dinner", "snack"]);
});

test("F2 the check refuses a workout file, a file of another app and garbage; a newer format says update first", () => {
  assert.equal(validateFoodDoc({ format: 1, app: "training", sessions: [] }).ok, false);
  assert.equal(validateFoodDoc(null).ok, false);
  assert.equal(validateFoodDoc([]).ok, false);
  assert.equal(validateFoodDoc({ format: "1", app: FOOD_APP }).ok, false);
  const newer = validateFoodDoc({ format: 2, app: FOOD_APP, foods: [], food_log: [] });
  assert.equal(newer.ok, false);
  assert.equal(newer.tooNew, true);
  assert.equal(validateFoodDoc(emptyFoodDoc()).ok, true);
  assert.equal(validateFoodDoc({ format: 1, app: FOOD_APP }).ok, true, "missing lists count as empty");
});

test("F3 the check refuses bad records: a bad number, a too long name, a bad meal, a bad date, a record with no id", () => {
  const entry = { id: "f-20260302-aaaaaa", updated_at: T("08:00:00"), date: "2026-03-02", meal: "lunch", food: null, name: "x", amount_g: 100, kcal: 100, protein_g: 5, carbs_g: 5, fat_g: 5, source: "quick" };
  const good = { format: 1, app: FOOD_APP, foods: [], food_log: [entry] };
  assert.equal(validateFoodDoc(good).ok, true);
  const bad = (patch) => validateFoodDoc({ ...good, food_log: [{ ...entry, ...patch }] }).ok;
  assert.equal(bad({ kcal: -1 }), false);
  assert.equal(bad({ kcal: Infinity }), false);
  assert.equal(bad({ protein_g: "5" }), false);
  assert.equal(bad({ meal: "brunch" }), false);
  assert.equal(bad({ date: "2026-3-2" }), false);
  assert.equal(bad({ name: "y".repeat(300) }), false);
  assert.equal(bad({ id: undefined }), false);
  assert.equal(bad({ updated_at: "yesterday" }), false);
  const food = { id: "fb-5000000000012", updated_at: T("08:00:00"), ...OATS };
  const okFood = validateFoodDoc({ ...good, foods: [food] });
  assert.equal(okFood.ok, true);
  assert.equal(validateFoodDoc({ ...good, foods: [{ ...food, per100g: { ...food.per100g, kcal: 5000 } }] }).ok, false);
  assert.equal(validateFoodDoc({ ...good, foods: [{ ...food, barcode: "12ab" }] }).ok, false);
  assert.equal(validateFoodDoc({ ...good, foods: [{ ...food, per100g: null }] }).ok, false);
});

test("F4 the check keeps unknown fields and tombstones, drops dangerous key names and never keeps a token", () => {
  const raw = JSON.parse(`{"format":1,"app":"training-food","token":"x","device":{"token":"y"},"later":{"a":1},
    "foods":[{"id":"fo-20260302-abcdef","updated_at":"${T("08:00:00")}","deleted":true,"deleted_at":"${T("08:00:00")}"}],
    "food_log":[{"id":"f-20260302-bbbbbb","updated_at":"${T("08:00:00")}","date":"2026-03-02","meal":null,"food":null,"name":"n","amount_g":null,"kcal":10,"protein_g":0,"carbs_g":0,"fat_g":0,"source":"quick","new_field":"kept","__proto__":{"polluted":true}}]}`);
  const res = validateFoodDoc(raw);
  assert.equal(res.ok, true);
  assert.equal(res.doc.later.a, 1);
  assert.equal(res.doc.foods[0].deleted, true, "a tombstone needs no other fields");
  assert.equal(res.doc.food_log[0].new_field, "kept");
  assert.equal(res.doc.token, undefined);
  assert.equal(res.doc.device, undefined);
  assert.equal({}.polluted, undefined);
  assert.equal(Object.prototype.hasOwnProperty.call(res.doc.food_log[0], "__proto__"), false);
});

// ---------- merge ----------

const rec = (id, at, extra = {}) => ({ id, updated_at: at, date: "2026-03-02", meal: "lunch", food: null, name: id, amount_g: null, kcal: 1, protein_g: 0, carbs_g: 0, fat_g: 0, source: "quick", ...extra });
const doc = (food_log = [], foods = []) => ({ format: 1, app: FOOD_APP, foods, food_log });

test("F5 merge joins by id, the later edit wins, a tombstone is never brought back by an older copy", () => {
  const a = doc([rec("f-1", T("08:00:00")), rec("f-2", T("09:00:00"), { kcal: 2 })]);
  const b = doc([rec("f-2", T("10:00:00"), { kcal: 3 }), rec("f-3", T("08:00:00"))]);
  const m = mergeFoodDocs(a, b);
  assert.deepEqual(m.food_log.map((r) => r.id), ["f-1", "f-2", "f-3"]);
  assert.equal(m.food_log[1].kcal, 3);
  const dead = doc([rec("f-1", T("11:00:00"), { deleted: true, deleted_at: T("11:00:00") })]);
  assert.equal(mergeFoodDocs(a, dead).food_log[0].deleted, true);
  assert.equal(mergeFoodDocs(dead, a).food_log[0].deleted, true);
  const same = doc([rec("f-1", T("08:00:00"), { deleted: true })]);
  assert.equal(mergeFoodDocs(a, same).food_log[0].deleted, true, "same time: the tombstone wins");
});

test("F6 merge properties: nothing dropped, same both ways, twice changes nothing, app and format kept", () => {
  const a = doc([rec("f-1", T("08:00:00"))], [{ id: "fb-5000000000012", updated_at: T("08:00:00"), ...OATS }]);
  const b = doc([rec("f-2", T("08:00:00")), rec("f-1", T("08:00:00"), { kcal: 9 })]);
  const ab = mergeFoodDocs(a, b), ba = mergeFoodDocs(b, a);
  assert.equal(canonical(ab), canonical(ba));
  assert.equal(canonical(mergeFoodDocs(ab, b)), canonical(ab));
  assert.equal(canonical(mergeFoodDocs(ab, ab)), canonical(ab));
  assert.equal(ab.app, FOOD_APP);
  assert.equal(ab.format, 1);
  assert.equal(ab.foods.length, 1);
  assert.equal(ab.food_log.length, 2);
  const withNew = { ...a, later_list: [{ id: "z-1", updated_at: T("08:00:00") }] };
  assert.equal(mergeFoodDocs(withNew, b).later_list.length, 1, "a list from a newer app is kept");
  assert.deepEqual(a.food_log.map((r) => r.id), ["f-1"], "inputs are not changed");
});

test("F7 hasFoodData and foodChangesSince", () => {
  assert.equal(hasFoodData(emptyFoodDoc()), false);
  assert.equal(hasFoodData(doc([rec("f-1", T("08:00:00"))])), true);
  const d = doc([rec("f-1", T("08:00:00"))]);
  assert.equal(foodChangesSince(d, null), true);
  assert.equal(foodChangesSince(d, T("07:59:59")), true);
  assert.equal(foodChangesSince(d, T("08:00:00")), false);
});

// ---------- the phone box ----------

test("F8 the food box is its own key; it never touches the workout box; a damaged box throws and is not overwritten", () => {
  assert.deepEqual(FOOD_KEYS, { data: "trn.food.v1", prev: "trn.foodprev.v1" });
  assert.notEqual(FOOD_KEYS.data, KEYS.data);
  const p = phone();
  assert.deepEqual(p.store.load(), emptyFoodDoc());
  p.model.quickAdd({ date: "2026-03-02", meal: "lunch", name: "Soup", kcal: 200, protein_g: 10 });
  assert.equal(p.storage.getItem(KEYS.data), null, "the workout box is untouched");
  assert.ok(p.storage.getItem(FOOD_KEYS.data));
  p.storage.setItem(FOOD_KEYS.data, "{ broken");
  assert.throws(() => p.store.load(), (e) => e.code === "broken");
  assert.throws(() => p.model.quickAdd({ date: "2026-03-02", meal: "lunch", kcal: 1, protein_g: 0 }));
  assert.equal(p.storage.getItem(FOOD_KEYS.data), "{ broken", "never overwritten");
  p.storage.setItem(FOOD_KEYS.data, JSON.stringify({ format: 9, app: FOOD_APP }));
  assert.throws(() => p.store.load(), (e) => e.code === "too_new");
  p.storage.setItem(FOOD_KEYS.data, JSON.stringify({ format: 1, app: "training" }));
  assert.throws(() => p.store.load(), (e) => e.code === "broken");
});

test("F9 savePrev keeps the box as it was just before a merge", () => {
  const p = phone();
  p.model.quickAdd({ date: "2026-03-02", meal: "lunch", kcal: 100, protein_g: 1 });
  const before = p.storage.getItem(FOOD_KEYS.data);
  p.store.savePrev();
  p.model.quickAdd({ date: "2026-03-02", meal: "lunch", kcal: 50, protein_g: 1 });
  assert.equal(p.storage.getItem(FOOD_KEYS.prev), before);
  assert.equal(p.store.loadPrev().food_log.length, 1);
});

test("F10 a full phone: the food is not saved, the error says full, the old box is unchanged", () => {
  const p = phone(undefined, 900);
  p.model.quickAdd({ date: "2026-03-02", meal: "lunch", kcal: 100, protein_g: 1 });
  const before = p.storage.getItem(FOOD_KEYS.data);
  assert.throws(() => { for (let i = 0; i < 50; i++) p.model.quickAdd({ date: "2026-03-02", meal: "lunch", name: "x".repeat(60), kcal: 100, protein_g: 1 }); }, (e) => e.code === "full");
  assert.ok(p.storage.getItem(FOOD_KEYS.data).length >= before.length);
  assert.equal(validateFoodDoc(JSON.parse(p.storage.getItem(FOOD_KEYS.data))).ok, true);
});

// ---------- the model: every way to add a food ----------

test("F11 saveFood: a barcode food gets the id fb-<barcode> (two phones make one record); an own food gets fo-<date>-<6>", () => {
  const p = phone();
  const f = p.model.saveFood(OATS);
  assert.equal(f.id, "fb-5000000000012");
  assert.match(f.updated_at, /^2026-03-02T08:00:01\.\d{3}Z$/);
  assert.equal(f.source, "off");
  const own = p.model.saveFood({ name: "My shake", per100g: { kcal: 80, protein_g: 10, carbs_g: 5, fat_g: 2 } });
  assert.match(own.id, /^fo-20260302-[a-z0-9]{6}$/);
  assert.equal(own.barcode, null);
  assert.equal(own.source, "own");
  const again = p.model.saveFood({ ...OATS, name: "Oats renamed" });
  assert.equal(again.id, f.id);
  assert.equal(live(p.model.doc().foods).length, 2, "saving the same barcode again updates the one record");
});

test("F12 saveFood cleans the text (control letters out, 120 letters at most) and refuses bad numbers", () => {
  const p = phone();
  const f = p.model.saveFood({ ...OATS, name: `  A\u0000B‮c${"z".repeat(200)}  `, brand: "<b>x</b>" });
  assert.equal(f.name.length, TEXT_MAX);
  assert.equal(TEXT_MAX, 120);
  assert.ok(f.name.startsWith("ABc"));
  assert.equal(f.brand, "<b>x</b>", "kept as plain text: the page shows it as text only");
  assert.throws(() => p.model.saveFood({ ...OATS, per100g: { kcal: -5, protein_g: 1, carbs_g: 1, fat_g: 1 } }));
  assert.throws(() => p.model.saveFood({ ...OATS, per100g: { kcal: 950, protein_g: 1, carbs_g: 1, fat_g: 1 } }));
  assert.throws(() => p.model.saveFood({ ...OATS, per100g: { kcal: 100, protein_g: 101, carbs_g: 1, fat_g: 1 } }));
  assert.throws(() => p.model.saveFood({ ...OATS, name: "   " }));
  assert.throws(() => p.model.saveFood({ ...OATS, barcode: "123" }));
  assert.equal(validateFoodDoc(p.model.doc()).ok, true);
});

test("F13 saveAndLog: one tap saves the food and logs the portion with numbers worked out once", () => {
  const p = phone();
  const { food, entry } = p.model.saveAndLog(OATS, { date: "2026-03-02", meal: "breakfast", amount_g: 40 });
  assert.equal(entry.food, food.id);
  assert.equal(entry.meal, "breakfast");
  assert.equal(entry.amount_g, 40);
  assert.deepEqual([entry.kcal, entry.protein_g, entry.carbs_g, entry.fat_g], [148, 4.4, 24, 3.2]);
  assert.equal(entry.source, "off");
  assert.equal(entry.name, "Test oats");
  assert.match(entry.id, /^f-20260302-[a-z0-9]{6}$/);
  assert.equal(p.model.doc().foods[0].last_amount_g, 40, "the last portion is remembered");
  // a later correction of the saved food does not change the day already logged
  p.model.saveFood({ ...OATS, per100g: { kcal: 400, protein_g: 12, carbs_g: 60, fat_g: 8 } });
  assert.equal(p.model.doc().food_log[0].kcal, 148);
});

test("F14 logAgain uses the last portion (else the serving, else 100 g); refuses a deleted food", () => {
  const p = phone();
  const { food } = p.model.saveAndLog(OATS, { date: "2026-03-01", meal: "breakfast", amount_g: 55 });
  const e = p.model.logAgain(food.id, { date: "2026-03-02", meal: "snack" });
  assert.equal(e.amount_g, 55);
  assert.equal(e.date, "2026-03-02");
  assert.equal(e.meal, "snack");
  const own = p.model.saveFood({ name: "Plain", per100g: { kcal: 100, protein_g: 1, carbs_g: 1, fat_g: 1 } });
  assert.equal(p.model.logAgain(own.id, { date: "2026-03-02", meal: "lunch" }).amount_g, 100);
  p.model.removeFood(own.id);
  assert.throws(() => p.model.logAgain(own.id, { date: "2026-03-02", meal: "lunch" }));
});

test("F15 quickAdd: calories and protein only (carbs and fat optional); range-checked", () => {
  const p = phone();
  const e = p.model.quickAdd({ date: "2026-03-02", meal: "dinner", kcal: 650, protein_g: 40 });
  assert.equal(e.food, null);
  assert.equal(e.source, "quick");
  assert.equal(e.name, "Quick add");
  assert.equal(e.carbs_g, null);
  assert.equal(e.fat_g, null);
  assert.throws(() => p.model.quickAdd({ date: "2026-03-02", meal: "dinner", kcal: -1, protein_g: 0 }));
  assert.throws(() => p.model.quickAdd({ date: "2026-03-02", meal: "dinner", kcal: 50000, protein_g: 0 }));
  assert.throws(() => p.model.quickAdd({ date: "2026-03-02", meal: "tea", kcal: 1, protein_g: 0 }));
  assert.throws(() => p.model.quickAdd({ date: "02/03/2026", meal: "lunch", kcal: 1, protein_g: 0 }));
  assert.equal(validateFoodDoc(p.model.doc()).ok, true);
});

test("F16 remove is a tombstone with Undo; edit the portion scales the stored numbers; meal can change", () => {
  const p = phone();
  const { entry } = p.model.saveAndLog(OATS, { date: "2026-03-02", meal: "breakfast", amount_g: 40 });
  p.model.removeEntry(entry.id);
  const dead = p.model.doc().food_log[0];
  assert.equal(dead.deleted, true);
  assert.ok(dead.deleted_at);
  p.model.undoRemove(entry.id);
  const back = p.model.doc().food_log[0];
  assert.equal(back.deleted, undefined);
  assert.equal(back.kcal, 148);
  assert.ok(back.updated_at > dead.updated_at, "undo is a newer edit, so it wins a merge");
  const edited = p.model.updateEntry(entry.id, { amount_g: 80, meal: "lunch" });
  assert.deepEqual([edited.kcal, edited.protein_g, edited.meal, edited.amount_g], [296, 8.8, "lunch", 80]);
});

test("F17 copyDay copies yesterday's live foods to today with new ids; Undo removes only the copies", () => {
  const p = phone();
  p.model.saveAndLog(OATS, { date: "2026-03-01", meal: "breakfast", amount_g: 40 });
  const gone = p.model.quickAdd({ date: "2026-03-01", meal: "lunch", kcal: 300, protein_g: 20 });
  p.model.quickAdd({ date: "2026-03-01", meal: "dinner", kcal: 500, protein_g: 30 });
  p.model.removeEntry(gone.id);
  p.model.quickAdd({ date: "2026-03-02", meal: "snack", kcal: 99, protein_g: 1 });
  const ids = p.model.copyDay("2026-03-01", "2026-03-02");
  assert.equal(ids.length, 2, "the deleted one is not copied");
  const today = entriesOn(p.model.doc(), "2026-03-02");
  assert.equal(today.length, 3);
  assert.ok(ids.every((id) => !p.model.doc().food_log.some((r) => r.id === id && r.date === "2026-03-01")));
  p.model.undoCopy(ids);
  assert.deepEqual(entriesOn(p.model.doc(), "2026-03-02").map((r) => r.kcal), [99]);
  assert.equal(entriesOn(p.model.doc(), "2026-03-01").length, 2, "yesterday is untouched");
});

test("F18 every save is at once: a second model on the same box sees it; unknown fields on a food are kept when it is saved again", () => {
  const p = phone();
  const f = p.model.saveFood(OATS);
  const raw = JSON.parse(p.storage.getItem(FOOD_KEYS.data));
  raw.foods[0].from_newer_app = 1;
  p.storage.setItem(FOOD_KEYS.data, JSON.stringify(raw));
  p.model.saveFood({ ...OATS, name: "Again" });
  const other = createFoodModel(createFoodStore(p.storage));
  assert.equal(other.doc().foods.find((x) => x.id === f.id).from_newer_app, 1);
  p.model.setFav(f.id, true);
  assert.equal(other.doc().foods[0].fav, true);
});

// ---------- pure food maths ----------

test("F19 numbersFor rounds once: kcal whole, grams to 0.1; missing carbs or fat stay null", () => {
  assert.deepEqual(numbersFor({ kcal: 370, protein_g: 11, carbs_g: 60, fat_g: 8 }, 43.1), { kcal: 159, protein_g: 4.7, carbs_g: 25.9, fat_g: 3.4 });
  assert.deepEqual(numbersFor({ kcal: 100, protein_g: 5, carbs_g: null, fat_g: null }, 50), { kcal: 50, protein_g: 2.5, carbs_g: null, fat_g: null });
  assert.throws(() => numbersFor({ kcal: 100, protein_g: 5 }, -1));
});

test("F20 totals, by meal (4 meals always, in order) and the day's entries leave tombstones out", () => {
  const d = doc([
    rec("f-1", T("08:00:00"), { meal: "breakfast", kcal: 300, protein_g: 20, carbs_g: 30, fat_g: 10 }),
    rec("f-2", T("08:00:00"), { meal: "snack", kcal: 100, protein_g: 5, carbs_g: null, fat_g: null }),
    rec("f-3", T("08:00:00"), { meal: "lunch", kcal: 999, deleted: true }),
    rec("f-4", T("08:00:00"), { meal: null, kcal: 50, protein_g: 1, carbs_g: 1, fat_g: 1 }),
    rec("f-5", T("08:00:00"), { date: "2026-03-01", meal: "lunch", kcal: 700 }),
  ]);
  const e = entriesOn(d, "2026-03-02");
  assert.deepEqual(e.map((r) => r.id).sort(), ["f-1", "f-2", "f-4"]);
  assert.deepEqual(totals(e), { kcal: 450, protein_g: 26, carbs_g: 31, fat_g: 11, count: 3 });
  const m = byMeal(e);
  assert.deepEqual(m.map((x) => x.meal), ["breakfast", "lunch", "dinner", "snack"]);
  assert.equal(m[3].entries.length, 2, "an entry with no meal shows under Snacks");
  assert.equal(m[3].kcal, 150);
  assert.equal(m[1].entries.length, 0);
});

test("F21 the meal is picked from the clock", () => {
  const at = (h, m = 0) => mealAt(new Date(2026, 2, 2, h, m));
  assert.equal(at(7), "breakfast");
  assert.equal(at(10, 59), "breakfast");
  assert.equal(at(11), "lunch");
  assert.equal(at(14, 59), "lunch");
  assert.equal(at(15), "snack");
  assert.equal(at(18), "dinner");
  assert.equal(at(21, 59), "dinner");
  assert.equal(at(23), "snack");
  assert.equal(at(2), "snack");
});

test("F22 recent foods come from the log (no counters): last used first, 'had today' marked, deleted foods out", () => {
  const p = phone();
  const a = p.model.saveFood(OATS);
  const b = p.model.saveFood({ name: "Skyr test", per100g: { kcal: 60, protein_g: 11, carbs_g: 4, fat_g: 0.2 } });
  const c = p.model.saveFood({ name: "Gone", per100g: { kcal: 60, protein_g: 1, carbs_g: 1, fat_g: 1 } });
  p.model.logAgain(b.id, { date: "2026-02-27", meal: "lunch" });
  p.model.logAgain(a.id, { date: "2026-03-01", meal: "breakfast" });
  p.model.logAgain(c.id, { date: "2026-03-01", meal: "breakfast" });
  p.model.logAgain(b.id, { date: "2026-03-02", meal: "snack" });
  p.model.removeFood(c.id);
  const r = recentFoods(p.model.doc(), "2026-03-02", 10);
  assert.deepEqual(r.map((x) => x.food.id), [b.id, a.id]);
  assert.equal(r[0].hadToday, true);
  assert.equal(r[1].hadToday, false);
  assert.ok(!("count" in p.model.doc().foods[0]) && !("used" in p.model.doc().foods[0]));
});

test("F23 the 7 days average counts only days with food, before today", () => {
  const d = doc([
    rec("f-1", T("08:00:00"), { date: "2026-03-01", kcal: 2000, protein_g: 100 }),
    rec("f-2", T("08:00:00"), { date: "2026-02-27", kcal: 1000, protein_g: 50 }),
    rec("f-3", T("08:00:00"), { date: "2026-03-02", kcal: 5000, protein_g: 500 }),
    rec("f-4", T("08:00:00"), { date: "2026-02-20", kcal: 9000, protein_g: 900 }),
  ]);
  assert.deepEqual(averageLast7(d, "2026-03-02"), { days: 2, kcal: 1500, protein_g: 75 });
  assert.equal(averageLast7(doc(), "2026-03-02"), null);
  assert.equal(dayBefore("2026-03-01"), "2026-02-28");
  assert.equal(dayBefore("2026-01-01"), "2025-12-31");
});

test("F24 checkFood: '✓ The numbers add up.' or soft warnings in words; it never blocks", () => {
  const good = checkFood({ per100g: { kcal: 370, protein_g: 11, carbs_g: 60, fat_g: 8 }, serving_g: 40 });
  assert.deepEqual(good, { ok: true, warnings: [], line: "✓ The numbers add up." });
  const tiny = checkFood({ per100g: { kcal: 370, protein_g: 11, carbs_g: 60, fat_g: 8 }, serving_g: 1 });
  assert.equal(tiny.ok, false);
  assert.ok(tiny.warnings.includes("The pack size says 1 gram. That is likely wrong."));
  const off = checkFood({ per100g: { kcal: 100, protein_g: 30, carbs_g: 30, fat_g: 20 }, serving_g: null });
  assert.ok(off.warnings.some((w) => /calories do not match/.test(w)));
  const over = checkFood({ per100g: { kcal: 500, protein_g: 60, carbs_g: 50, fat_g: 10 }, serving_g: null });
  assert.ok(over.warnings.some((w) => /more than 100 g/.test(w)));
  const missing = checkFood({ per100g: { kcal: null, protein_g: 5, carbs_g: null, fat_g: null }, serving_g: null });
  assert.ok(missing.warnings.some((w) => /calories are missing/i.test(w)));
});

test("F25 portions: the check step starts at the pack's serving, else the last amount, else 100 g; Log again prefers the last amount", () => {
  assert.equal(startAmount({ serving_g: 30, last_amount_g: 55 }), 30);
  assert.equal(startAmount({ serving_g: null, last_amount_g: 55 }), 55);
  assert.equal(startAmount({}), 100);
  assert.equal(againAmount({ serving_g: 30, last_amount_g: 55 }), 55);
  assert.equal(againAmount({ serving_g: 30 }), 30);
  assert.equal(againAmount({}), 100);
});

test("F26 cleanText removes control and direction letters, trims, and cuts without splitting an emoji", () => {
  assert.equal(cleanText("  a\u0007b‏c\nd  "), "abc d");
  assert.equal(cleanText(null), "");
  const s = cleanText(`${"x".repeat(119)}😀`);
  assert.equal(s, "x".repeat(119));
  assert.equal(cleanText("abc", 2), "ab");
});

// ---------- food backup file and restore (food lives only on the phone until GitHub is set up) ----------

import { makeFoodBackup, foodBackupFilename } from "../app/js/food/foodbackup.js";

test("F27 food backup: its own file name; the food box only, never the key or device data; restore on an empty phone gives the same food", () => {
  const a = phone();
  a.model.saveAndLog(OATS, { date: "2026-03-02", meal: "breakfast", amount_g: 40 });
  a.model.quickAdd({ date: "2026-03-02", meal: "lunch", kcal: 500, protein_g: 30 });
  a.storage.setItem("trn.device.v1", JSON.stringify({ token: "made-up-key-123", owner: "o" }));
  assert.equal(foodBackupFilename(new Date(2026, 2, 2)), "training-food-backup-2026-03-02.json");
  const b = makeFoodBackup(a.store, new Date(2026, 2, 2));
  assert.equal(b.filename, "training-food-backup-2026-03-02.json");
  assert.ok(!b.text.includes("made-up-key-123"));
  assert.equal(b.bytes, new TextEncoder().encode(b.text).length);
  const fresh = phone();
  const res = fresh.model.restore(JSON.parse(b.text));
  assert.equal(res.ok, true);
  assert.equal(res.merged, false);
  assert.equal(canonical(fresh.model.doc()), canonical(a.model.doc()));
});

test("F28 food restore on a phone with food merges (nothing dropped, safety copy first); twice changes nothing; bad files refused", () => {
  const a = phone();
  a.model.quickAdd({ date: "2026-03-01", meal: "lunch", kcal: 111, protein_g: 1 });
  const file = JSON.parse(makeFoodBackup(a.store).text);
  const b = phone("2026-03-02T10:00:00.000Z");
  b.model.quickAdd({ date: "2026-03-02", meal: "lunch", kcal: 222, protein_g: 2 });
  const before = b.storage.getItem(FOOD_KEYS.data);
  const res = b.model.restore(file);
  assert.equal(res.ok, true);
  assert.equal(res.merged, true);
  assert.equal(b.storage.getItem(FOOD_KEYS.prev), before);
  assert.deepEqual(b.model.doc().food_log.map((r) => r.kcal).sort(), [111, 222]);
  const once = canonical(b.model.doc());
  b.model.restore(file);
  assert.equal(canonical(b.model.doc()), once);
  assert.equal(b.model.restore({ format: 1, app: "training", sessions: [] }).ok, false, "a workout backup is not a food backup");
  assert.equal(b.model.restore({ format: 9, app: FOOD_APP }).ok, false);
  assert.match(b.model.restore("nope").error, /not a training food file/);
  assert.equal(canonical(b.model.doc()), once, "a refused file changes nothing");
});

test("F29 the model never saves an entry the food check would refuse (a huge portion is refused in words, and sync is never blocked)", () => {
  const p = phone();
  const OIL = { name: "Test oil", per100g: { kcal: 884, protein_g: 0, carbs_g: 0, fat_g: 100 }, source: "own" };
  const PROT = { name: "Test powder", per100g: { kcal: 400, protein_g: 100, carbs_g: 0, fat_g: 0 }, source: "own" };
  assert.throws(() => p.model.saveAndLog(OIL, { date: "2026-03-02", meal: "lunch", amount_g: 3000 }), /amount/i);
  assert.throws(() => p.model.saveAndLog(PROT, { date: "2026-03-02", meal: "lunch", amount_g: 2500 }), /amount/i);
  const ok = p.model.saveAndLog(OIL, { date: "2026-03-02", meal: "lunch", amount_g: 100 });
  assert.throws(() => p.model.updateEntry(ok.entry.id, { amount_g: 4000 }), /amount/i);
  const f = p.model.saveFood(PROT);
  assert.throws(() => p.model.logAgain(f.id, { date: "2026-03-02", meal: "lunch", amount_g: 5000 }), /amount/i);
  assert.equal(validateFoodDoc(p.model.doc()).ok, true, "what the phone holds always passes the check");
  assert.equal(live(p.model.doc().food_log).length, 1, "a refused entry saves nothing");
});

test("F30 checkFood also warns when the pack size text says 1 or 2 grams (the mock-up's 'Check these numbers')", () => {
  const per100g = { kcal: 280, protein_g: 3, carbs_g: 35, fat_g: 14.5 };
  const one = checkFood({ per100g, serving_g: 43.1, quantity: "1 gram" });
  assert.equal(one.ok, false);
  assert.ok(one.warnings.includes("The pack size says 1 gram. That is likely wrong."));
  assert.equal(checkFood({ per100g, serving_g: 43.1, quantity: "2g" }).warnings.at(-1), "The pack size says 2 grams. That is likely wrong.");
  assert.equal(checkFood({ per100g, serving_g: 43.1, quantity: "450 g" }).ok, true);
  assert.equal(checkFood({ per100g, serving_g: 43.1, quantity: "1 kg" }).ok, true, "kilograms are not grams");
  assert.equal(checkFood({ per100g, serving_g: 1, quantity: "1 g" }).warnings.filter((x) => x.startsWith("The pack size")).length, 1, "said once");
});
