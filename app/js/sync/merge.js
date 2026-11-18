// Pure merge of two data documents (docs/ARCHITECTURE.md section 5.3).
// No page, no storage, no network. It never changes its inputs.
//
// Rules:
//  - Lists (sessions, weighins, measurements, exercise_state, gym_spots, plan_days): join by `id`. A record on one side only is kept.
//    On both sides the later `updated_at` wins. Same time: the tombstone wins. Still the same: the record whose
//    JSON text sorts first, so both phones pick the same one.
//  - Single objects (profile, shared_settings, block): the later `updated_at` wins as a whole.
//  - Fields this app version does not know are kept.
//  - The result lists are sorted by id, so merge(a, b) and merge(b, a) are exactly equal.
import { FORMAT } from "../validate.js";

export const LISTS = ["sessions", "weighins", "measurements", "exercise_state", "gym_spots", "plan_days"];
export const SINGLES = ["profile", "shared_settings", "block"];

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

// JSON text with sorted keys: the same data always gives the same text.
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (isObj(value)) return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}

const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

// A time as a number for comparing. A missing or bad time counts as the oldest.
function time(v) {
  if (!isObj(v) || typeof v.updated_at !== "string") return -Infinity;
  const t = Date.parse(v.updated_at);
  return Number.isNaN(t) ? -Infinity : t;
}

// Which of two versions of the same thing wins. Symmetric: pick(x, y) is the same as pick(y, x).
export function pick(x, y) {
  const tx = time(x), ty = time(y);
  if (tx !== ty) return tx > ty ? x : y;
  const dx = isObj(x) && x.deleted === true, dy = isObj(y) && y.deleted === true;
  if (dx !== dy) return dx ? x : y;
  return canonical(x) <= canonical(y) ? x : y;
}

function mergeList(a = [], b = []) {
  const byId = new Map();
  for (const rec of [...a, ...b]) {
    if (!isObj(rec) || typeof rec.id !== "string") continue; // not a record: validate.js rejects these before a merge
    const have = byId.get(rec.id);
    byId.set(rec.id, have ? pick(have, rec) : rec);
  }
  return [...byId.keys()].sort().map((id) => clone(byId.get(id)));
}

function mergeSingle(a, b) {
  if (a === null || a === undefined) return clone(b ?? null);
  if (b === null || b === undefined) return clone(a);
  return clone(pick(a, b));
}

const isRecordList = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => isObj(r) && typeof r.id === "string");
// Missing, or a list whose items are all records (review F5: a list on one side and something else on the other used to throw).
const listLike = (v) => v === undefined || (Array.isArray(v) && v.every((r) => isObj(r) && typeof r.id === "string"));

export function mergeDocs(a, b) {
  const out = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of [...keys].sort()) {
    if (key === "format") continue;
    if (LISTS.includes(key)) out[key] = mergeList(a[key], b[key]);
    else if (SINGLES.includes(key)) out[key] = mergeSingle(a[key], b[key]);
    else if (listLike(a[key]) && listLike(b[key]) && (isRecordList(a[key]) || isRecordList(b[key]))) out[key] = mergeList(a[key] ?? [], b[key] ?? []); // a list from a newer app
    else if (key in a && key in b) out[key] = clone(pick(a[key], b[key])); // unknown field on both sides: the later edit wins, else the same pick on both phones
    else out[key] = clone(key in a ? a[key] : b[key]);
  }
  out.format = Math.max(a.format ?? FORMAT, b.format ?? FORMAT);
  out.app = "training";
  for (const name of LISTS) if (!out[name]) out[name] = [];
  return out;
}

// True when the document holds a record or setting newer than `since` (an ISO time). Used to decide if a sync is due.
export function hasChangesSince(doc, since) {
  const limit = since ? Date.parse(since) : -Infinity;
  const newer = (r) => time(r) > limit;
  if (SINGLES.some((k) => isObj(doc[k]) && newer(doc[k]))) return true;
  return LISTS.some((k) => (doc[k] ?? []).some(newer));
}
