// The running workout, kept in the device box (trn.device.v1.active). It says where the workout screen is:
//   { session_id, phase: "walk" | "walk_result" | "changeover" | "warmup" | "weights" | "finish",
//     timer_end, timer_total (ms), rest: { end, total, kind } | null, hold: { end, total } | null }
// The sets themselves live in the data document; the position in the weights is worked out from them.
import { store } from "./ui/app.js";

export function getActive() {
  try { return store.loadDevice().active ?? null; } catch { return null; }
}
export function setActive(next) {
  const device = store.loadDevice();
  store.saveDevice({ ...device, active: next });
  return next;
}
export function patchActive(patch) {
  const cur = getActive();
  if (!cur) return null;
  return setActive({ ...cur, ...patch });
}
export function clearActive() {
  const device = store.loadDevice();
  delete device.active;
  store.saveDevice(device);
}
export function soundOn() {
  try { return store.loadDevice().sound_on !== false; } catch { return true; }
}
export function setSound(on) {
  store.saveDevice({ ...store.loadDevice(), sound_on: on });
}
