// Phone storage. Three boxes in localStorage (docs/ARCHITECTURE.md sections 4.3 and 6):
//   trn.data.v1    the log and profile (same shape as progress.json)
//   trn.device.v1  device-only data: token, sync state (never synced, never in a backup)
//   trn.prev.v1    a full copy of the data from just before the last merge, restore or migration
// `createStore(storage)` takes any localStorage-like object, so tests can use a fake.
import { emptyDoc, FORMAT } from "./validate.js";

export const KEYS = { data: "trn.data.v1", device: "trn.device.v1", prev: "trn.prev.v1" };

export class StoreError extends Error {
  // code: "broken" | "too_new" | "full" | "unavailable"
  constructor(code, message) { super(message); this.code = code; }
}

const isQuotaError = (e) => e && (e.name === "QuotaExceededError" || e.code === 22 || e.code === 1014);

// Migrations: key = the format they upgrade FROM. None yet (format 1 is the first).
export const migrations = {};

export function migrate(doc) {
  let current = doc;
  while (current.format < FORMAT) {
    const step = migrations[current.format];
    if (!step) throw new StoreError("broken", "The saved data can not be upgraded. Nothing was changed.");
    current = step(current);
  }
  return current;
}

export function createStore(storage) {
  function read(key) {
    let raw;
    try { raw = storage.getItem(key); } catch { throw new StoreError("unavailable", "This browser blocks storage. The app can not save your data."); }
    return raw;
  }
  function write(key, value) {
    try { storage.setItem(key, value); } catch (e) {
      if (isQuotaError(e)) throw new StoreError("full", "Phone storage full. Download a backup, then tell the Training chat.");
      throw new StoreError("unavailable", "This browser blocks storage. The app can not save your data.");
    }
  }

  return {
    // The data document. A missing box gives an empty document. A damaged or too-new box throws and is never overwritten.
    load() {
      const raw = read(KEYS.data);
      if (raw === null) return emptyDoc();
      let doc;
      try { doc = JSON.parse(raw); } catch { throw new StoreError("broken", "The saved data looks damaged. Nothing was changed. Ask the Training chat."); }
      if (!doc || typeof doc !== "object" || doc.app !== "training" || typeof doc.format !== "number") {
        throw new StoreError("broken", "The saved data looks damaged. Nothing was changed. Ask the Training chat.");
      }
      if (doc.format > FORMAT) throw new StoreError("too_new", "The saved data is from a newer app version. Update the app first.");
      if (doc.format < FORMAT) {
        write(KEYS.prev, raw); // copy first, then rewrite
        doc = migrate(doc);
        write(KEYS.data, JSON.stringify(doc));
      }
      return doc;
    },
    save(doc) { write(KEYS.data, JSON.stringify(doc)); },
    // One-step safety net: keep what is stored now before a merge or a restore.
    savePrev() {
      const raw = read(KEYS.data);
      if (raw !== null) write(KEYS.prev, raw);
    },
    loadPrev() {
      const raw = read(KEYS.prev);
      return raw === null ? null : JSON.parse(raw);
    },
    // Device-only box.
    loadDevice() {
      const raw = read(KEYS.device);
      if (raw === null) return {};
      try { const d = JSON.parse(raw); return d && typeof d === "object" ? d : {}; } catch { return {}; }
    },
    saveDevice(device) { write(KEYS.device, JSON.stringify(device)); },
  };
}

// True when the document holds anything of the user's (profile, settings that were set, or any record).
export function hasData(doc) {
  if (doc.profile) return true;
  if (doc.block) return true;
  if (doc.shared_settings && doc.shared_settings.updated_at) return true;
  return ["sessions", "weighins", "measurements", "exercise_state", "machine_spots"].some((k) => Array.isArray(doc[k]) && doc[k].length > 0);
}
