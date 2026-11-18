// The page's one syncer. On localhost only, `?fake-github=1` swaps the network for the pretend GitHub
// (js/sync/fake-github.js), so the sync screens can be tested by hand. On a real phone it is always the real network.
import { store } from "./ui/app.js";
import { createSyncer } from "./sync/sync.js";
import { createFoodSyncer } from "./sync/foodsync.js";
import { combineSyncers } from "./sync/both.js";
import { foodStore } from "./diet/foodapp.js";

export function fakeActive() {
  try {
    const host = location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1" && host !== "[::1]") return false;
    return new URLSearchParams(location.search).get("fake-github") === "1";
  } catch { return false; }
}

let fakePromise = null;
function fakeGithub() {
  fakePromise ??= import("./sync/fake-github.js").then((m) => {
    const fake = m.createFakeGithub({ storage: window.localStorage });
    // The pretend GitHub serves ONE file per instance: a second one holds food.json.
    const foodFake = m.createFakeGithub({ storage: window.localStorage, path: "food.json", storageKey: "trn.fake.food.v1" });
    window.fakeGithub = fake; // handle for hand-testing in the browser console
    window.fakeGithubFood = foodFake;
    return { fake, foodFake, token: m.VALID_TOKEN };
  });
  return fakePromise;
}
export async function fakeInfo() { return fakeActive() ? fakeGithub() : null; }

function getFetch() {
  if (!fakeActive()) return (...args) => fetch(...args);
  fakeGithub();
  return async (...args) => (await fakeGithub()).fake.fetch(...args);
}

function getFoodFetch() {
  if (!fakeActive()) return (...args) => fetch(...args);
  fakeGithub();
  return async (...args) => (await fakeGithub()).foodFake.fetch(...args);
}

// The page's one syncer runs two files: progress.json, then food.json (sync/both.js).
export const syncer = combineSyncers(createSyncer({ store, getFetch }), createFoodSyncer({ store, foodStore, getFetch: getFoodFetch }));
if (fakeActive()) fakeGithub();
