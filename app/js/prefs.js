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

// patch: { theme?, motionOff? }. An unknown theme is saved as "auto".
export function savePrefs(store, patch) {
  const next = { ...store.loadDevice() };
  if ("theme" in patch) next.theme = THEMES.includes(patch.theme) ? patch.theme : "auto";
  if ("motionOff" in patch) next.motion_off = patch.motionOff === true;
  store.saveDevice(next);
  return readPrefs(store);
}
