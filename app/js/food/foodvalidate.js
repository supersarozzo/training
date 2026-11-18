// Checks a food document (the phone's food box, or food.json from GitHub) before the app uses it.
// food.json is untrusted data: every known field is checked; unknown fields are kept (a newer app may add some),
// except dangerous key names. A tombstone (deleted: true) needs only its id and time.
// Pure: no page, no storage, no network. Shape: docs/ARCHITECTURE.md section 4.4 (food).

export const FOOD_FORMAT = 1;
export const FOOD_APP = "training-food";
export const MEALS = ["breakfast", "lunch", "dinner", "snack"];
// Hard limits of the check. The model is stricter when it saves (text 120 letters, kcal per 100 g 900, ...),
// so the phone never holds what this check refuses.
export const CHECK = {
  text: 200, id: 80,
  per100: { kcal: 900, macro: 100 },
  amount_g: 5000, servings: 100,
  entry: { kcal: 20000, macro: 2000 },
};
const MAX_RECORDS = 50000;
const BAD_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export function emptyFoodDoc() {
  return { format: FOOD_FORMAT, app: FOOD_APP, foods: [], food_log: [] };
}

class Bad extends Error {}
const fail = (msg) => { throw new Bad(msg); };
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isTime = (v) => typeof v === "string" && v.length <= 40 && !Number.isNaN(Date.parse(v));
const isDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

function clean(value, depth = 0) {
  if (depth > 12) fail("The food file is nested too deeply");
  if (Array.isArray(value)) return value.map((x) => clean(x, depth + 1));
  if (isObj(value)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) if (!BAD_KEYS.has(k)) out[k] = clean(v, depth + 1);
    return out;
  }
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return value;
  fail("The food file has a value that is not plain data");
}

function text(v, where, { max = CHECK.text, allowEmpty = true, nullable = false } = {}) {
  if (v === null && nullable) return;
  if (typeof v !== "string") fail(`${where} must be text`);
  if (v.length > max) fail(`${where} is too long`);
  if (!allowEmpty && v.trim().length === 0) fail(`${where} is empty`);
}
function num(v, where, min, max, { nullable = false } = {}) {
  if ((v === null || v === undefined) && nullable) return;
  if (typeof v !== "number" || !Number.isFinite(v)) fail(`${where} must be a number`);
  if (v < min || v > max) fail(`${where} is out of range`);
}

function checkBase(r, where) {
  if (!isObj(r)) fail(`${where} must be an object`);
  text(r.id, `${where} id`, { max: CHECK.id, allowEmpty: false });
  if (!isTime(r.updated_at)) fail(`${where} needs a time`);
  if (r.deleted !== undefined && typeof r.deleted !== "boolean") fail(`${where} deleted must be yes or no`);
  return r.deleted === true; // a tombstone: nothing else to check
}

function checkFoodRecord(r, n) {
  const where = `food ${n}`;
  if (checkBase(r, where)) return r;
  text(r.name, `${where} name`, { allowEmpty: false });
  if (r.brand !== undefined) text(r.brand, `${where} brand`, { nullable: true });
  if (r.barcode !== undefined && r.barcode !== null && !(typeof r.barcode === "string" && /^\d{8,14}$/.test(r.barcode))) fail(`${where} barcode must be 8 to 14 digits`);
  if (!isObj(r.per100g)) fail(`${where} needs numbers per 100 g`);
  num(r.per100g.kcal, `${where} calories`, 0, CHECK.per100.kcal, { nullable: true });
  for (const k of ["protein_g", "carbs_g", "fat_g"]) num(r.per100g[k], `${where} ${k}`, 0, CHECK.per100.macro, { nullable: true });
  num(r.serving_g, `${where} serving`, 0, CHECK.amount_g, { nullable: true });
  if (r.serving_label !== undefined) text(r.serving_label, `${where} serving words`, { nullable: true });
  num(r.last_amount_g, `${where} last amount`, 0, CHECK.amount_g, { nullable: true });
  if (r.fav !== undefined && typeof r.fav !== "boolean") fail(`${where} favourite must be yes or no`);
  if (r.source !== undefined) text(r.source, `${where} source`, { max: 20 });
  return r;
}

function checkEntry(r, n) {
  const where = `food log ${n}`;
  if (checkBase(r, where)) return r;
  if (!isDate(r.date)) fail(`${where} date must be a date`);
  if (r.meal !== null && r.meal !== undefined && !MEALS.includes(r.meal)) fail(`${where} meal has an unknown value`);
  if (r.food !== undefined) text(r.food, `${where} food`, { max: CHECK.id, nullable: true });
  text(r.name, `${where} name`);
  num(r.amount_g, `${where} amount`, 0, CHECK.amount_g, { nullable: true });
  num(r.servings, `${where} servings`, 0, CHECK.servings, { nullable: true });
  num(r.kcal, `${where} calories`, 0, CHECK.entry.kcal);
  num(r.protein_g, `${where} protein`, 0, CHECK.entry.macro);
  num(r.carbs_g, `${where} carbs`, 0, CHECK.entry.macro, { nullable: true });
  num(r.fat_g, `${where} fat`, 0, CHECK.entry.macro, { nullable: true });
  if (r.per100g !== undefined && r.per100g !== null) {
    if (!isObj(r.per100g)) fail(`${where} numbers per 100 g must be an object`);
    num(r.per100g.kcal, `${where} calories per 100 g`, 0, CHECK.per100.kcal, { nullable: true });
    for (const k of ["protein_g", "carbs_g", "fat_g"]) num(r.per100g[k], `${where} ${k} per 100 g`, 0, CHECK.per100.macro, { nullable: true });
  }
  if (r.source !== undefined) text(r.source, `${where} source`, { max: 20 });
  return r;
}

const CHECKS = { foods: checkFoodRecord, food_log: checkEntry };

// { ok: true, doc } with a clean copy, or { ok: false, error, tooNew? } in plain words.
export function validateFoodDoc(raw) {
  try {
    if (!isObj(raw) || raw.app !== FOOD_APP) fail("The file is not a training food file");
    if (typeof raw.format !== "number" || !Number.isInteger(raw.format) || raw.format < 1) fail("The food file has no valid format number");
    if (raw.format > FOOD_FORMAT) return { ok: false, tooNew: true, error: "The food file is from a newer version of the app. Update the app first." };
    const src = clean(raw);
    const doc = { ...src, format: FOOD_FORMAT, app: FOOD_APP };
    delete doc.device; // never load device data (the key) from a file
    delete doc.token;
    for (const name of Object.keys(CHECKS)) {
      const list = src[name] ?? [];
      if (!Array.isArray(list)) fail(`${name} must be a list`);
      if (list.length > MAX_RECORDS) fail(`${name} has too many records`);
      doc[name] = list.map((r, n) => CHECKS[name](r, n + 1));
    }
    return { ok: true, doc };
  } catch (e) {
    if (e instanceof Bad) return { ok: false, error: `${e.message[0].toUpperCase()}${e.message.slice(1)}.` };
    throw e;
  }
}
