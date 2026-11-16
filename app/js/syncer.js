// The page's one syncer. On localhost only, `?fake-github=1` swaps the network for the pretend GitHub
// (js/sync/fake-github.js), so the sync screens can be tested by hand. On a real phone it is always the real network.
import { store } from "./ui/app.js";
import { createSyncer } from "./sync/sync.js";

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
    window.fakeGithub = fake; // handle for hand-testing in the browser console
    return { fake, token: m.VALID_TOKEN };
  });
  return fakePromise;
}
export async function fakeInfo() { return fakeActive() ? fakeGithub() : null; }

function getFetch() {
  if (!fakeActive()) return (...args) => fetch(...args);
  fakeGithub();
  return async (...args) => (await fakeGithub()).fake.fetch(...args);
}

export const syncer = createSyncer({ store, getFetch });
if (fakeActive()) fakeGithub();
