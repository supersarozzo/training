// The page's shared food handles (build step 7): the food store, the food model and the Open Food Facts client.
// Same blocked-storage fallback as ui/app.js: a phone that blocks storage gets plain-words errors, not a blank page.
import { createFoodStore } from "../food/foodstore.js";
import { createFoodModel } from "../food/foodmodel.js";
import { createOff } from "../food/off.js";
import { APP_VERSION } from "../version.js";
import { now } from "../clock.js";
import { withSaveSignal, noteSaved } from "../autosync.js";

function pickStorage() {
  try {
    const s = window.localStorage;
    s.getItem("trn.probe");
    return s;
  } catch {
    const blocked = () => { throw new Error("blocked"); };
    return { getItem: blocked, setItem: blocked, removeItem: blocked };
  }
}

// As in ui/app.js (0.7.2): the food syncer uses the plain handle, the screens the signalling one.
export const foodSyncStore = createFoodStore(pickStorage());
export const foodStore = withSaveSignal(foodSyncStore, noteSaved);
export const food = createFoodModel(foodStore, now);
// The only network call of the Diet tab besides the syncer. Only a barcode number or a typed word is sent.
export const off = createOff({ fetch: (...args) => fetch(...args), version: APP_VERSION });
