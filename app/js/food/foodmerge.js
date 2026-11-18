// Pure merge of two food documents (the phone's food box and food.json). Same rules as sync/merge.js
// (docs/ARCHITECTURE.md section 5.3), and the same `pick`, so both files break ties the same way:
//  - lists (foods, food_log): join by id; on both sides the later updated_at wins; same time: the tombstone wins;
//    still the same: the record whose JSON text sorts first. Lists come back sorted by id.
//  - a list of records this app does not know (from a newer app) is merged the same way; other unknown fields:
//    the same pick on both phones.
// No page, no storage, no network. It never changes its inputs.
import { pick } from "../sync/merge.js";
import { FOOD_FORMAT, FOOD_APP } from "./foodvalidate.js";

export const FOOD_LISTS = ["foods", "food_log"];

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const isRecord = (r) => isObj(r) && typeof r.id === "string";
const listLike = (v) => v === undefined || (Array.isArray(v) && v.every(isRecord));
const isRecordList = (v) => Array.isArray(v) && v.length > 0 && v.every(isRecord);

function mergeList(a = [], b = []) {
  const byId = new Map();
  for (const rec of [...a, ...b]) {
    if (!isRecord(rec)) continue; // the check refuses these before a merge
    const have = byId.get(rec.id);
    byId.set(rec.id, have ? pick(have, rec) : rec);
  }
  return [...byId.keys()].sort().map((id) => clone(byId.get(id)));
}

export function mergeFoodDocs(a, b) {
  const out = {};
  for (const key of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
    if (key === "format" || key === "app") continue;
    if (FOOD_LISTS.includes(key)) out[key] = mergeList(a[key], b[key]);
    else if (listLike(a[key]) && listLike(b[key]) && (isRecordList(a[key]) || isRecordList(b[key]))) out[key] = mergeList(a[key] ?? [], b[key] ?? []);
    else if (key in a && key in b) out[key] = clone(pick(a[key], b[key]));
    else out[key] = clone(key in a ? a[key] : b[key]);
  }
  out.format = Math.max(a.format ?? FOOD_FORMAT, b.format ?? FOOD_FORMAT);
  out.app = FOOD_APP;
  for (const name of FOOD_LISTS) if (!out[name]) out[name] = [];
  return out;
}

export function hasFoodData(doc) {
  return FOOD_LISTS.some((k) => Array.isArray(doc[k]) && doc[k].length > 0);
}

function time(r) {
  const t = isObj(r) && typeof r.updated_at === "string" ? Date.parse(r.updated_at) : NaN;
  return Number.isNaN(t) ? -Infinity : t;
}

// True when a food record was changed after `since` (an ISO time).
export function foodChangesSince(doc, since) {
  const limit = since ? Date.parse(since) : -Infinity;
  return FOOD_LISTS.some((k) => (doc[k] ?? []).some((r) => time(r) > limit));
}
