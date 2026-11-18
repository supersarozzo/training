// Grams or Pieces: the mode used last for each food (0.7.4; the sheet opens in it: Pieces for eggs, Grams for rice).
// Kept on this phone only, in the device box (trn.device.v1, key food_amount_mode), like the look settings: never in
// the synced food file, never in a backup, so no file format, merge or older app is touched. Another phone starts from
// the food's own data (a piece weight means Pieces). A capped list: the oldest foods go first.
import { pieceOf } from "./foodmath.js";

export const MAX_MODES = 300;
export const MODE_KEY = "food_amount_mode";
const MODES = new Set(["grams", "pieces"]);
const FOOD_ID = /^(fo-\d{8}-[a-z0-9]{6}|fb-\d{8,14})$/; // own foods and barcode foods (foodmodel ids)
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

export function readMode(device, foodId) {
  if (!isObj(device) || !isObj(device[MODE_KEY]) || typeof foodId !== "string" || !Object.hasOwn(device[MODE_KEY], foodId)) return null;
  const m = device[MODE_KEY][foodId];
  return MODES.has(m) ? m : null;
}

// A new device box with this food's mode (the box itself is not changed). Odd ids or modes change nothing.
export function withMode(device, foodId, mode) {
  const box = isObj(device) ? device : {};
  if (!MODES.has(mode) || typeof foodId !== "string" || !FOOD_ID.test(foodId)) return box;
  const old = isObj(box[MODE_KEY]) ? box[MODE_KEY] : {};
  const list = Object.entries(old).filter(([k, v]) => k !== foodId && FOOD_ID.test(k) && MODES.has(v));
  list.push([foodId, mode]);
  return { ...box, [MODE_KEY]: Object.fromEntries(list.slice(-MAX_MODES)) };
}

// The sheet's first mode: the one used last; with none, Pieces when the food has a piece weight, else Grams.
export const startMode = (food, remembered) => (MODES.has(remembered) ? remembered : pieceOf(food) ? "pieces" : "grams");
