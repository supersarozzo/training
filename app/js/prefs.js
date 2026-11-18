// Device-only look settings (JUDGING.md 3.5): Look (Auto / Light / Dark) and Animations (on / off).
// They live in the device box (trn.device.v1, keys `theme` and `motion_off`): never in the synced document, never in a
// backup file. A save reads the box first and writes it back whole, so the GitHub key and the other fields stay.
// boot.js reads the same two keys before the first paint (no flash of the wrong colours).
export const THEMES = ["auto", "light", "dark"];

export function readPrefs(store) {
  try {
    const d = store.loadDevice() ?? {};
    return { theme: THEMES.includes(d.theme) ? d.theme : "auto", motionOff: d.motion_off === true };
  } catch {
    return { theme: "auto", motionOff: false };
  }
}

// Answers to the one-tap machine offers (trainer D18, 0.7.5): { "<day>:<slot>:<exercise>": "used" | "kept" }, key
// `machine_offers` in the device box. On this phone only (never synced, never in a backup): at worst another phone
// asks once more. Anything else in the box under that key is ignored.
const OFFER_KEY = /^(mon|tue|wed|thu|fri):[A-Za-z0-9]{1,4}:[a-z_]{1,40}$/;
export function readOfferAnswers(store) {
  try {
    const raw = store.loadDevice()?.machine_offers;
    const out = {};
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      for (const [k, v] of Object.entries(raw)) if (OFFER_KEY.test(k) && (v === "used" || v === "kept")) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}
export function saveOfferAnswer(store, key, answer) {
  if (!OFFER_KEY.test(key) || (answer !== "used" && answer !== "kept")) return;
  const next = { ...store.loadDevice() };
  next.machine_offers = { ...readOfferAnswers(store), [key]: answer };
  store.saveDevice(next);
}

// patch: { theme?, motionOff? }. An unknown theme is saved as "auto".
export function savePrefs(store, patch) {
  const next = { ...store.loadDevice() };
  if ("theme" in patch) next.theme = THEMES.includes(patch.theme) ? patch.theme : "auto";
  if ("motionOff" in patch) next.motion_off = patch.motionOff === true;
  store.saveDevice(next);
  return readPrefs(store);
}
