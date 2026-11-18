// Food sync (answer 78 a): the food log and saved foods sync in their OWN file, food.json, in the same private repo,
// through the same flow as progress.json (docsync.js): same key, same 409/422 retry, never PUT over a file it can
// not read, merge by id with tombstones. Its sync state has its own names in the device box (food_last_*), and its
// phone box is the food box (food/foodstore.js), so a food sync problem never changes progress.json or the workout log.
import { createDocSyncer } from "./docsync.js";
import { canonical } from "./merge.js";
import { connectionOf, MESSAGES, FOOD_SYNC_KEYS } from "./sync.js";
import { validateFoodDoc, emptyFoodDoc } from "../food/foodvalidate.js";
import { mergeFoodDocs, hasFoodData, foodChangesSince } from "../food/foodmerge.js";

export const FOOD_PATH = "food.json";

export const FOOD_MESSAGES = {
  ...MESSAGES,
  ok: "Food synced.",
  not_set_up: "Food is only on this phone. Set up GitHub in Progress › Settings.",
  not_set_up_here: "Food is only on this phone. Set up GitHub below.",
  broken_remote: "The GitHub food file looks damaged. Not changed. Ask the Training chat.",
  too_new: "The GitHub food file is from a newer app. Update the app first.",
  local_problem: "The food data on this phone could not be read. Nothing was sent. Ask the Training chat.",
  local_invalid: "Some food data on this phone does not pass the app's own check. Nothing was sent. Ask the Training chat.",
};

const [SHA, AT, RESULT, ATTEMPT] = FOOD_SYNC_KEYS;

// Same repo, branch and key as progress.json; always the file food.json.
function foodConnection(device) {
  const cfg = connectionOf(device);
  return cfg ? { ...cfg, path: FOOD_PATH } : null;
}

export function foodKind(foodStore) {
  return {
    connection: foodConnection,
    keys: { sha: SHA, at: AT, result: RESULT, attempt: ATTEMPT },
    messages: FOOD_MESSAGES,
    load: () => foodStore.load(),
    save: (doc) => foodStore.save(doc),
    savePrev: () => foodStore.savePrev(),
    validate: validateFoodDoc,
    empty: emptyFoodDoc,
    merge: mergeFoodDocs,
    canonical,
    hasData: hasFoodData,
    changesSince: foodChangesSince,
    commitMessage: (startedAt) => `Food log ${startedAt}`,
  };
}

// store: the main store (its device box holds the key and the sync state). foodStore: createFoodStore(...).
export function createFoodSyncer({ store, foodStore, getFetch, nowIso = () => new Date().toISOString() }) {
  return createDocSyncer({ kind: foodKind(foodStore), device: store, getFetch, nowIso });
}

// Today's food hint (0.7.6): the workout sync line can say "Synced" while food is stuck. Only when GitHub is set up and
// the last food sync had a problem; the Diet tab and Settings say which problem.
export const FOOD_HINT = Object.freeze({ text: "Food did not sync.", link: "See Diet." });
export function foodHint(device) {
  if (!connectionOf(device)) return null;
  const r = device[RESULT];
  return r && r !== "ok" ? `${FOOD_HINT.text} ${FOOD_HINT.link}` : null;
}

// A short line for the Diet tab. `unsynced` = food changed after the last good food sync.
// 0.7.2 (review M4): the same words and order as the workout line (sync.js statusText): a problem, then "not sent
// yet, will send automatically", then "Food synced 12:25." (today) or "Food synced 18 Nov, 12:25.".
export function foodStatusText(device, unsynced = false, place = "elsewhere", now = new Date()) {
  if (!connectionOf(device)) return place === "settings" ? FOOD_MESSAGES.not_set_up_here : FOOD_MESSAGES.not_set_up;
  const r = device[RESULT];
  if (r && r !== "ok") return FOOD_MESSAGES[r] ?? FOOD_MESSAGES.error;
  if (unsynced) return "Food: not sent yet, will send automatically.";
  if (!device[AT]) return "Food: GitHub is set up. Not synced yet.";
  const when = new Date(device[AT]);
  const time = when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return when.toDateString() === now.toDateString() ? `Food synced ${time}.` : `Food synced ${when.toLocaleDateString(undefined, { day: "numeric", month: "short" })}, ${time}.`;
}
