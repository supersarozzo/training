// The page side of updates (0.7.3, docs/ARCHITECTURE.md section 7). No screen code here, so tests can run it with
// fakes. ui/update.js draws the "New version ready" bar and the Settings version card from it.
// Rules: ask for an update at start, on coming to the front and on pageshow; see a worker that was already installing
// when the page registered; show the bar whenever a worker waits; reload only after the user tapped Update.
// This file never reads or writes the phone's saved data (workouts, food, settings): only the app's file caches.

import { redrawAfterSync } from "./autosync.js";

// May the updater redraw the screen now? The sync's rule (never a workout or the Plan, never while typing, the Diet
// tab only without a sheet or the scanner) plus: no sheet open on any screen (review round 1).
export function mayRedraw(hash, doc) {
  return redrawAfterSync(hash, doc) && !doc.querySelector("[data-sheet], [data-scan]");
}

// The worker runs on GitHub Pages (https). On localhost it runs only with ?sw=1, so development files never get stuck.
export function workerWanted(loc, nav) {
  if (!nav || !("serviceWorker" in nav)) return false;
  if (loc.protocol === "https:") return true;
  return loc.hostname === "localhost" && new URLSearchParams(loc.search).has("sw");
}

const WORDS = {
  idle: "",
  checking: "Looking for a new version…",
  downloading: "Downloading the new version…",
  ready: "A new version is ready. Tap Update.",
  restarting: "Starting the new version…",
  siteupdating: "The website is still updating. Try again in 10 minutes.",
  none: "You have the newest version.",
  offline: "No signal. Try again later.",
  reinstalling: "Getting the new version from the website…",
  workout: "Finish the workout first, then tap Update.",
};
export function updateWords(status) {
  return WORDS[status] ?? "";
}

// "0.7.10" is newer than "0.7.3". Anything that is not a version number is never newer.
export function isNewer(a, b) {
  const x = String(a).split(".").map(Number);
  const y = String(b).split(".").map(Number);
  if (x.some((n) => !Number.isInteger(n) || n < 0) || y.some((n) => !Number.isInteger(n))) return false;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d !== 0) return d > 0;
  }
  return false;
}

const SHORT_WAIT = 20000; // no new worker at all after this: the fallback
const LONG_WAIT = 90000; // a worker that is still downloading gets this long in total
const TAKEOVER_WAIT = 10000; // after SKIP_WAITING, reload anyway if the new worker has not taken over
const STEP = 500;
const CHECK_GAP = 15 * 60000; // automatic checks (front, pageshow) at most this often: a failing install re-downloads

// sw = navigator.serviceWorker (or null), doc = document, win = window; onChange() redraws the screen.
// fetch, caches, version, inWorkout, sleep and now are for the Update button (tests pass fakes).
export function createUpdater({ sw, doc, win, onChange = () => {}, fetch = null, caches = null, version = "", inWorkout = () => false,
  sleep = (ms) => new Promise((done) => setTimeout(done, ms)), now = () => Date.now() }) {
  let reg = null;
  let waiting = null; // a new worker that is ready and waits for the tap on Update
  let status = "idle"; // what the Settings card says
  let updating = false; // true only after a tap on Update, so the page never reloads by itself
  let reloaded = false;
  let busy = false;
  let lastCheck = -Infinity;

  const set = (next) => { if (status !== next) { status = next; onChange(); } };
  // Never during a workout, also when one started after the tap (review round 3): the next open runs the new version.
  const reload = () => {
    if (reloaded) return;
    if (inWorkout()) { set("workout"); return; }
    reloaded = true;
    win.location.reload();
  };

  // A worker that finished installing waits. With no controller this is the very first install: nothing to update.
  function see(worker) {
    if (!worker) return;
    if (worker.state === "installed" && sw && sw.controller && waiting !== worker) {
      waiting = worker;
      onChange();
    } else if (waiting === worker && worker.state !== "installed") {
      // It took over without the tap (the app was closed, or Safari restored it as active), or it failed: no bar.
      waiting = null;
      onChange();
    }
  }
  const followed = new WeakSet();
  function follow(worker) {
    if (!worker) return;
    if (!followed.has(worker)) { followed.add(worker); worker.addEventListener("statechange", () => see(worker)); }
    see(worker);
  }
  function look() {
    if (reg) follow(reg.waiting);
  }

  // An update check. Automatic ones (front, pageshow) at most every 15 minutes; a waiting worker is looked at always.
  async function check(force = false) {
    if (!reg) return;
    look();
    if (!force && now() - lastCheck < CHECK_GAP) return;
    lastCheck = now();
    try { await reg.update(); } catch { /* offline or the server did not answer: the next check tries again */ }
    look();
  }

  function start() {
    if (!sw) return Promise.resolve();
    sw.addEventListener("controllerchange", () => { if (updating) reload(); });
    return sw.register("sw.js", { updateViaCache: "none" }).then((r) => {
      reg = r;
      follow(reg.installing); // already installing when the page registered: its updatefound has passed
      look();
      reg.addEventListener("updatefound", () => follow(reg.installing));
      doc.addEventListener("visibilitychange", () => { if (!doc.hidden) check(); });
      win.addEventListener("pageshow", () => check());
      check(true);
    }).catch(() => { /* no worker: the app still works online */ });
  }

  // The waiting worker takes over, then the page reloads once (controllerchange, or after 10 s anyway).
  function takeOver(worker) {
    updating = true;
    worker.postMessage("SKIP_WAITING");
    sleep(TAKEOVER_WAIT).then(() => reload());
  }

  // The tap on Update in the bar. A bar still drawn after its worker took over by itself: the tap reloads into it.
  function apply() {
    if (inWorkout()) { set("workout"); return; }
    if (waiting && waiting.state === "installed") takeOver(waiting);
    else { updating = true; reload(); }
  }

  // A file from the live site, never from a cache: cache "no-store", and "live=" in the address, which the worker
  // never answers (in case Safari does not pass the cache mode on to the worker; review round 2). null: no signal.
  async function liveText(file) {
    try {
      const res = await fetch(`${file}?live=${now()}`, { cache: "no-store" });
      if (!res || !res.ok) return null;
      return await res.text();
    } catch {
      return null;
    }
  }
  // What the live site says its version is; null with no signal or no good answer.
  async function liveVersion() {
    const text = await liveText("js/version.js");
    const found = text === null ? null : /APP_VERSION\s*=\s*"([^"]+)"/.exec(text);
    return found ? found[1] : null;
  }

  // Wait for a worker that is ready. 20 s when nothing is downloading, up to 90 s while a worker downloads.
  // A new install that started and then failed (a file keeps failing on the site) sets installFailed (round 3).
  let installFailed = false;
  async function waitForWorker() {
    const begin = now();
    let seen = null;
    installFailed = false;
    for (;;) {
      look();
      if (waiting) return waiting;
      if (reg && reg.installing && reg.installing !== seen) seen = reg.installing;
      if (seen && seen.state === "redundant") { installFailed = true; return null; }
      const downloading = reg && reg.installing && reg.installing.state !== "redundant";
      const spent = now() - begin;
      if (spent >= LONG_WAIT || (!downloading && spent >= SHORT_WAIT)) return null;
      await sleep(STEP);
    }
  }

  // The Update button at the top of Settings (Rosario's wish, 2026-11-18).
  async function updateNow() {
    if (busy) return;
    if (inWorkout()) { set("workout"); return; }
    busy = true;
    try {
      set("checking");
      const live = await liveVersion();
      if (live === null) { set("offline"); return; }
      if (!isNewer(live, version)) { set("none"); return; }
      // The new version already took over (a reload was held back by a workout): only the reload is missing.
      if (updating) { reload(); return; }
      set("downloading");
      if (reg) {
        try { await reg.update(); } catch { /* the wait below decides */ }
        const worker = await waitForWorker();
        // A workout may have started during the wait (20-90 s): then change nothing; the worker waits for the bar.
        if (inWorkout()) { set("workout"); return; }
        if (worker) { set("restarting"); takeOver(worker); return; }
      }
      if (inWorkout()) { set("workout"); return; }
      // Before deleting anything: the website's sw.js must already be the live version. Right after a release a CDN
      // copy can still serve the old sw.js; a fresh start would then fail and leave the app online-only (round 2).
      // A failed install would fail again after a fresh start, without the working cache: change nothing (round 3).
      if (installFailed) { set("siteupdating"); return; }
      const swText = await liveText("sw.js");
      if (swText === null) { set("offline"); return; }
      // The version the live sw.js declares (not any text in it: its comments name other versions; round 3).
      const swVersion = /APP_VERSION\s*=\s*"([^"]+)"/.exec(swText);
      if (!swVersion || swVersion[1] !== live) { set("siteupdating"); return; }
      // No new worker came: start clean from the website. Only the app's file caches go; saved data stays.
      if (inWorkout()) { set("workout"); return; } // a workout may have started while sw.js was read (round 3)
      set("reinstalling");
      try {
        const names = await caches.keys();
        // Only this app's version caches ("training-0.7.3"); other projects share the github.io address (round 2).
        await Promise.all(names.filter((k) => /^training-\d+(\.\d+)*$/.test(k)).map((k) => caches.delete(k)));
      } catch { /* the reload still gets fresh files from the network */ }
      try { if (reg) await reg.unregister(); } catch { /* same */ }
      reload();
    } finally {
      busy = false;
    }
  }

  return { start, check, apply, updateNow, waiting: () => waiting, status: () => status };
}
