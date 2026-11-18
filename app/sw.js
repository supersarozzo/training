// Service worker: keeps every app file on the phone so the app opens without a network.
// APP_VERSION must match js/version.js (a unit test checks this and the file list).
const APP_VERSION = "0.7.3";
const CACHE = `training-${APP_VERSION}`;
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/app.css",
  "css/diet.css",
  "css/v060.css",
  "css/v060-today.css",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "js/active.js",
  "js/autosync.js",
  "js/backup.js",
  "js/boot.js",
  "js/chartmath.js",
  "js/clock.js",
  "js/dayplan.js",
  "js/diet/diet.js",
  "js/diet/foodapp.js",
  "js/diet/scan.js",
  "js/diet/sheets.js",
  "js/engine/nutrition.js",
  "js/engine/planedits.js",
  "js/engine/planpage.js",
  "js/engine/progression.js",
  "js/engine/schedule.js",
  "js/engine/trend.js",
  "js/engine/walk.js",
  "js/engine/week1.js",
  "js/engine/workout.js",
  "js/errors.js",
  "js/food/barcode.js",
  "js/food/foodbackup.js",
  "js/food/foodmath.js",
  "js/food/foodmerge.js",
  "js/food/foodmodel.js",
  "js/food/foodstore.js",
  "js/food/foodvalidate.js",
  "js/food/off.js",
  "js/food/scanner.js",
  "js/h.js",
  "js/ids.js",
  "js/main.js",
  "js/model.js",
  "js/plan/cues.js",
  "js/plan/machine-ids.js",
  "js/plan/media.js",
  "js/plan/muscles.js",
  "js/plan/plan-v2.js",
  "js/planview.js",
  "js/prefs.js",
  "js/shortcuts.js",
  "js/sound.js",
  "js/store.js",
  "js/sync/both.js",
  "js/sync/docsync.js",
  "js/sync/fake-github.js",
  "js/sync/foodsync.js",
  "js/sync/github.js",
  "js/sync/merge.js",
  "js/sync/sync.js",
  "js/syncer.js",
  "js/theme.js",
  "js/timer.js",
  "js/ui/app.js",
  "js/ui/bodymap.js",
  "js/ui/charts.js",
  "js/ui/drawings.js",
  "js/ui/exinfo.js",
  "js/ui/exlayer.js",
  "js/ui/finish.js",
  "js/ui/flow.js",
  "js/ui/gymexercises.js",
  "js/ui/icons.js",
  "js/ui/intake.js",
  "js/ui/machines.js",
  "js/ui/musclecheck.js",
  "js/ui/media.js",
  "js/ui/motion.js",
  "js/ui/pair.js",
  "js/ui/parts.js",
  "js/ui/planday.js",
  "js/ui/planedit.js",
  "js/ui/progress.js",
  "js/ui/rest.js",
  "js/ui/settings-sync.js",
  "js/ui/settings.js",
  "js/ui/setup.js",
  "js/ui/stats.js",
  "js/ui/svg.js",
  "js/ui/swap.js",
  "js/ui/targets.js",
  "js/ui/theme.js",
  "js/ui/today.js",
  "js/ui/units.js",
  "js/ui/update.js",
  "js/ui/walk.js",
  "js/ui/warmup.js",
  "js/ui/week1.js",
  "js/ui/weekly.js",
  "js/ui/weighin.js",
  "js/ui/workout.js",
  "js/updater.js",
  "js/validate.js",
  "js/version.js",
  "js/wakelock.js",
  "media/exercises/arm_circles/0.jpg",
  "media/exercises/arm_circles/1.jpg",
  "media/exercises/arm_swings/0.jpg",
  "media/exercises/arm_swings/1.jpg",
  "media/exercises/bodyweight_squats/0.jpg",
  "media/exercises/bodyweight_squats/1.jpg",
  "media/exercises/cable_crunch/0.jpg",
  "media/exercises/cable_crunch/1.jpg",
  "media/exercises/cable_curl/0.jpg",
  "media/exercises/cable_curl/1.jpg",
  "media/exercises/cable_lateral_raise/0.jpg",
  "media/exercises/cable_lateral_raise/1.jpg",
  "media/exercises/cable_leg_curl/0.jpg",
  "media/exercises/cable_leg_curl/1.jpg",
  "media/exercises/cable_pull_through/0.jpg",
  "media/exercises/cable_pull_through/1.jpg",
  "media/exercises/calf_raise_leg_press/0.jpg",
  "media/exercises/calf_raise_leg_press/1.jpg",
  "media/exercises/calf_raise_machine/0.jpg",
  "media/exercises/calf_raise_machine/1.jpg",
  "media/exercises/calf_raise_standing/0.jpg",
  "media/exercises/calf_raise_standing/1.jpg",
  "media/exercises/cat_cow/0.jpg",
  "media/exercises/cat_cow/1.jpg",
  "media/exercises/chest_press/0.jpg",
  "media/exercises/chest_press/1.jpg",
  "media/exercises/db_bench_press/0.jpg",
  "media/exercises/db_bench_press/1.jpg",
  "media/exercises/db_curl/0.jpg",
  "media/exercises/db_curl/1.jpg",
  "media/exercises/db_glute_bridge/0.jpg",
  "media/exercises/db_glute_bridge/1.jpg",
  "media/exercises/db_lying_leg_curl/0.jpg",
  "media/exercises/db_lying_leg_curl/1.jpg",
  "media/exercises/dead_bug/0.jpg",
  "media/exercises/dead_bug/1.jpg",
  "media/exercises/face_pull/0.jpg",
  "media/exercises/face_pull/1.jpg",
  "media/exercises/glute_bridges/0.jpg",
  "media/exercises/glute_bridges/1.jpg",
  "media/exercises/goblet_squat/0.jpg",
  "media/exercises/goblet_squat/1.jpg",
  "media/exercises/hammer_curl/0.jpg",
  "media/exercises/hammer_curl/1.jpg",
  "media/exercises/hip_thrust/0.jpg",
  "media/exercises/hip_thrust/1.jpg",
  "media/exercises/incline_db_press/0.jpg",
  "media/exercises/incline_db_press/1.jpg",
  "media/exercises/lat_pulldown_machine/0.jpg",
  "media/exercises/lat_pulldown_machine/1.jpg",
  "media/exercises/lateral_raise/0.jpg",
  "media/exercises/lateral_raise/1.jpg",
  "media/exercises/leg_curl_machine/0.jpg",
  "media/exercises/leg_curl_machine/1.jpg",
  "media/exercises/leg_extension/0.jpg",
  "media/exercises/leg_extension/1.jpg",
  "media/exercises/leg_press/0.jpg",
  "media/exercises/leg_press/1.jpg",
  "media/exercises/one_arm_db_row/0.jpg",
  "media/exercises/one_arm_db_row/1.jpg",
  "media/exercises/one_leg_db_calf_raise/0.jpg",
  "media/exercises/one_leg_db_calf_raise/1.jpg",
  "media/exercises/overhead_triceps_ext/0.jpg",
  "media/exercises/overhead_triceps_ext/1.jpg",
  "media/exercises/pec_deck/0.jpg",
  "media/exercises/pec_deck/1.jpg",
  "media/exercises/plank/0.jpg",
  "media/exercises/plank/1.jpg",
  "media/exercises/pulldown/0.jpg",
  "media/exercises/pulldown/1.jpg",
  "media/exercises/pushups_bench/0.jpg",
  "media/exercises/pushups_bench/1.jpg",
  "media/exercises/rear_delt_raise/0.jpg",
  "media/exercises/rear_delt_raise/1.jpg",
  "media/exercises/reverse_crunch/0.jpg",
  "media/exercises/reverse_crunch/1.jpg",
  "media/exercises/romanian_deadlift/0.jpg",
  "media/exercises/romanian_deadlift/1.jpg",
  "media/exercises/seated_cable_row/0.jpg",
  "media/exercises/seated_cable_row/1.jpg",
  "media/exercises/seated_db_shoulder_press/0.jpg",
  "media/exercises/seated_db_shoulder_press/1.jpg",
  "media/exercises/seated_row_machine/0.jpg",
  "media/exercises/seated_row_machine/1.jpg",
  "media/exercises/shoulder_press_machine/0.jpg",
  "media/exercises/shoulder_press_machine/1.jpg",
  "media/exercises/side_plank/0.jpg",
  "media/exercises/side_plank/1.jpg",
  "media/exercises/smith_squat/0.jpg",
  "media/exercises/smith_squat/1.jpg",
  "media/exercises/triceps_pushdown/0.jpg",
  "media/exercises/triceps_pushdown/1.jpg",
  "media/exercises/uphill_walk/0.jpg",
  "media/exercises/uphill_walk/1.jpg",
  "vendor/body-muscles/CHANGES.md",
  "vendor/body-muscles/LICENSE",
  "vendor/body-muscles/NOTICE",
  "vendor/body-muscles/shapes.js",
  "vendor/zxing-wasm/CHANGES.md",
  "vendor/zxing-wasm/LICENSE",
  "vendor/zxing-wasm/LICENSE-zxing-cpp",
  "vendor/zxing-wasm/LICENSE-zxing-wasm-cpp",
  "vendor/zxing-wasm/NOTICE",
  "vendor/zxing-wasm/reader/index.js",
  "vendor/zxing-wasm/reader/zxing_reader.wasm",
  "vendor/zxing-wasm/share.js",
];

// 0.7.3 (docs/ARCHITECTURE.md section 7): three rules learned on the iPhone, where an update never showed.
//  1. Install fetches every file fresh from the server (a new ?v=<version> address, cache "reload"), so an old copy in
//     the phone's HTTP cache or on GitHub's CDN can never fill the new cache. js/version.js must say APP_VERSION.
//  2. A half-filled cache is never kept: one file that still fails after 3 tries fails the install. The old version
//     keeps working and the next update check tries again.
//  3. The worker answers only from its OWN cache. Safari can make a new worker active without its activate step,
//     so an old cache can stay on the phone; searching all caches found the old files first.
const PREFIX = "training-";
const TRIES = 3;
const PARALLEL = 6;

const fileUrl = (file) => new URL(file, self.location.href).href;
// Written last, after every file: the cache is complete (review round 1). No app page ever asks for this address.
const MARK = fileUrl("sw-cache-complete");

// "0.7.2" is older than "0.7.10"; anything that is not a version number is never "older".
function isOlder(name) {
  const a = name.slice(PREFIX.length).split(".").map(Number);
  const b = APP_VERSION.split(".").map(Number);
  if (!name.startsWith(PREFIX) || a.some((n) => !Number.isInteger(n))) return false;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] || 0) - (b[i] || 0);
    if (d !== 0) return d < 0;
  }
  return false;
}

const wait = (ms) => new Promise((done) => setTimeout(done, ms));

// One file straight from the server. A 404, a 500 or a redirect counts as a failure.
async function fetchFresh(file) {
  const url = new URL(file, self.location.href);
  url.searchParams.set("v", APP_VERSION);
  let problem = null;
  for (let attempt = 1; attempt <= TRIES; attempt++) {
    try {
      const res = await fetch(url.href, { cache: "reload" });
      if (res.ok && !res.redirected) return res;
      problem = new Error(`${file}: ${res.status}${res.redirected ? " redirected" : ""}`);
    } catch (e) {
      problem = e;
    }
    if (attempt < TRIES) await wait(500 * attempt);
  }
  throw problem;
}

async function fillCache() {
  const existed = await caches.has(CACHE);
  const cache = await caches.open(CACHE);
  try {
    // js/version.js first: if the server still gives the version before this one (a CDN copy from before the push),
    // stop now; the next check tries again.
    const version = await fetchFresh("js/version.js");
    const mark = version.clone();
    if (!(await version.clone().text()).includes(`"${APP_VERSION}"`)) throw new Error("the server still has older files");
    await cache.put(fileUrl("js/version.js"), version);
    const rest = FILES.filter((f) => f !== "js/version.js");
    let next = 0;
    let failed = null;
    const lane = async () => {
      while (!failed && next < rest.length) {
        const file = rest[next++];
        try { await cache.put(fileUrl(file), await fetchFresh(file)); } catch (e) { failed = failed || e; }
      }
    };
    await Promise.all(Array.from({ length: PARALLEL }, lane));
    if (failed) throw failed;
    // An older worker's activate (0.7.2 and before deletes every other app cache) may have removed this cache while
    // it filled: then the files went nowhere. Fail, so the next check installs again (review round 1).
    if (!(await caches.has(CACHE))) throw new Error("the new cache was removed during the install");
    await cache.put(MARK, mark);
    if (!(await caches.has(CACHE)) || !(await (await caches.open(CACHE)).match(MARK))) throw new Error("the new cache was removed during the install");
  } catch (e) {
    if (!existed) await caches.delete(CACHE);
    throw e;
  }
}

// Old versions' caches go only when this version's cache is complete (its mark, written after every file, is in it).
// A newer version's cache (it may be installing now) and other caches are never touched.
let cleaned = false;
let cleaning = null; // one cleanup at a time, however many fetches arrive together
async function dropOldCaches() {
  if (!(await caches.has(CACHE))) return;
  if (!(await (await caches.open(CACHE)).match(MARK))) return;
  const keys = await caches.keys();
  await Promise.all(keys.filter(isOlder).map((k) => caches.delete(k)));
  cleaned = true;
}
function cleanOnce() {
  if (!cleaning) cleaning = dropOldCaches().catch(() => {}).then(() => { cleaning = null; });
  return cleaning;
}

// Older app caches, newest first (offline fallback only).
async function olderCaches() {
  const keys = (await caches.keys()).filter(isOlder);
  const num = (k) => k.slice(PREFIX.length).split(".").map(Number);
  return keys.sort((a, b) => { const x = num(a), y = num(b); for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (y[i] || 0) - (x[i] || 0); if (d) return d; } return 0; });
}

// Install: fill the cache. The new worker then waits; the app shows "New version ready" and the user taps Update.
self.addEventListener("install", (event) => {
  event.waitUntil(fillCache());
});

// Activate: delete the caches of older versions. The data lives in localStorage, so this never touches it.
self.addEventListener("activate", (event) => {
  event.waitUntil(cleanOnce());
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

// Own cache first, then the network. Offline with a file missing from the own cache (it was removed, or is still
// filling): the newest older app cache answers, which is better than no app at all (review round 1).
async function answer(req) {
  if (await caches.has(CACHE)) {
    const hit = await (await caches.open(CACHE)).match(req, { ignoreSearch: true });
    if (hit) return hit;
  }
  try {
    return await fetch(req);
  } catch (e) {
    for (const name of await olderCaches()) {
      const old = await (await caches.open(name)).match(req, { ignoreSearch: true });
      if (old) return old;
    }
    throw e;
  }
}

// Fetch: app files come from this version's cache first. Everything else (the GitHub API, other sites) goes straight
// to the network and is never cached or answered by this worker. Only the active worker gets fetches, so the first
// one also removes older caches (Safari may have skipped activate).
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // The Settings Update button asks the live site for js/version.js with cache "no-store": never answer that from the
  // cache. A page load (navigate) always opens from the cache, so the app still opens offline.
  if (req.cache === "no-store" && req.mode !== "navigate") return;
  event.respondWith(answer(req));
  if (!cleaned) event.waitUntil(cleanOnce());
});
