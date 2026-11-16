// Create, update and delete records. Screens never write storage directly: they call these.
// Every change stamps `updated_at` and is saved at once (docs/ARCHITECTURE.md section 6).
import { nowUtc } from "./ids.js";
import { hasData } from "./store.js";
import { validateDocument } from "./validate.js";

// Monday of the current week (local), or the next Monday. Used for a new block's start.
// If today is Monday, the block starts today. Otherwise the next Monday.
export function nextMonday(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 Sunday ... 6 Saturday
  const add = day === 1 ? 0 : (8 - day) % 7;
  d.setDate(d.getDate() + add);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function createModel(store, clock = () => new Date()) {
  const stamp = () => nowUtc(clock());

  // Load, change, save at once. `fn` returns nothing; it edits the document it gets.
  function update(fn) {
    const doc = store.load();
    fn(doc, stamp());
    store.save(doc);
    return doc;
  }

  return {
    doc: () => store.load(),

    // Intake answers are stored as given. Targets start empty until Rosario confirms them.
    setProfile(intake) {
      return update((doc, t) => {
        doc.profile = { updated_at: t, intake, targets: doc.profile?.targets ?? null };
        ensureBlock(doc, t, clock());
      });
    },

    setTargets(targets) {
      return update((doc, t) => {
        if (!doc.profile) throw new Error("No profile yet");
        doc.profile = { ...doc.profile, updated_at: t, targets };
      });
    },

    updateSettings(patch) {
      return update((doc, t) => { doc.shared_settings = { ...doc.shared_settings, ...patch, updated_at: t }; });
    },

    setBlockStart(start_monday) {
      return update((doc, t) => {
        doc.block = { ...(doc.block ?? { plan_id: "plan-v2", number: 1 }), start_monday, updated_at: t };
      });
    },

    // Restore from a backup file into an EMPTY phone. If the phone has data, refuse for now:
    // the merge-restore comes with the sync work (build steps 9 and 10).
    restoreIntoEmpty(rawDoc) {
      const current = store.load();
      if (hasData(current)) {
        return { ok: false, error: "This phone already has data. Restoring over existing data is not ready yet (it comes after sync is set up). Nothing was changed." };
      }
      const checked = validateDocument(rawDoc);
      if (!checked.ok) return { ok: false, error: checked.error };
      const doc = checked.doc;
      const t = stamp();
      store.savePrev();
      ensureBlock(doc, t, clock());
      store.save(doc);
      return { ok: true, doc };
    },
  };
}

function ensureBlock(doc, t, now) {
  if (!doc.block && doc.profile) {
    doc.block = { updated_at: t, plan_id: "plan-v2", number: 1, start_monday: nextMonday(now) };
  }
}
