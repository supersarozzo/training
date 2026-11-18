// The food box on the phone: its own localStorage key, apart from the workout box (answer 78 a: food syncs in its
// own file, so a food problem never touches the workout log). Same rules as store.js:
//   trn.food.v1      the food document (same shape as food.json)
//   trn.foodprev.v1  a full copy of the food box from just before the last merge
// A missing box gives an empty document. A damaged or too-new box throws and is never overwritten.
import { StoreError } from "../store.js";
import { emptyFoodDoc, FOOD_APP, FOOD_FORMAT } from "./foodvalidate.js";

export const FOOD_KEYS = { data: "trn.food.v1", prev: "trn.foodprev.v1" };

const isQuotaError = (e) => e && (e.name === "QuotaExceededError" || e.code === 22 || e.code === 1014);
const BROKEN = "The saved food data looks damaged. Nothing was changed. Ask the Training chat.";

export function createFoodStore(storage) {
  function read(key) {
    try { return storage.getItem(key); } catch { throw new StoreError("unavailable", "This browser blocks storage. The app can not save your data."); }
  }
  function write(key, value) {
    try { storage.setItem(key, value); } catch (e) {
      if (isQuotaError(e)) throw new StoreError("full", "Phone storage full. Download a backup, then tell the Training chat.");
      throw new StoreError("unavailable", "This browser blocks storage. The app can not save your data.");
    }
  }
  return {
    load() {
      const raw = read(FOOD_KEYS.data);
      if (raw === null) return emptyFoodDoc();
      let doc;
      try { doc = JSON.parse(raw); } catch { throw new StoreError("broken", BROKEN); }
      if (!doc || typeof doc !== "object" || Array.isArray(doc) || doc.app !== FOOD_APP || typeof doc.format !== "number") throw new StoreError("broken", BROKEN);
      if (doc.format > FOOD_FORMAT) throw new StoreError("too_new", "The saved food data is from a newer app version. Update the app first.");
      if (!Array.isArray(doc.foods)) doc.foods = [];
      if (!Array.isArray(doc.food_log)) doc.food_log = [];
      return doc;
    },
    save(doc) { write(FOOD_KEYS.data, JSON.stringify(doc)); },
    savePrev() {
      const raw = read(FOOD_KEYS.data);
      if (raw !== null) write(FOOD_KEYS.prev, raw);
    },
    loadPrev() {
      const raw = read(FOOD_KEYS.prev);
      return raw === null ? null : JSON.parse(raw);
    },
  };
}
