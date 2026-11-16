// Service worker: keeps every app file on the phone so the app opens without a network.
// APP_VERSION must match js/version.js (a unit test checks this and the file list).
const APP_VERSION = "0.1.0";
const CACHE = `training-${APP_VERSION}`;
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/app.css",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "js/active.js",
  "js/chartmath.js",
  "js/clock.js",
  "js/engine/nutrition.js",
  "js/engine/progression.js",
  "js/engine/schedule.js",
  "js/engine/trend.js",
  "js/engine/walk.js",
  "js/engine/week1.js",
  "js/engine/workout.js",
  "js/h.js",
  "js/ids.js",
  "js/main.js",
  "js/model.js",
  "js/plan/cues.js",
  "js/plan/plan-v2.js",
  "js/sound.js",
  "js/store.js",
  "js/timer.js",
  "js/ui/app.js",
  "js/ui/charts.js",
  "js/ui/finish.js",
  "js/ui/flow.js",
  "js/ui/intake.js",
  "js/ui/pair.js",
  "js/ui/parts.js",
  "js/ui/plansheet.js",
  "js/ui/progress.js",
  "js/ui/rest.js",
  "js/ui/settings.js",
  "js/ui/setup.js",
  "js/ui/svg.js",
  "js/ui/swap.js",
  "js/ui/targets.js",
  "js/ui/today.js",
  "js/ui/units.js",
  "js/ui/update.js",
  "js/ui/walk.js",
  "js/ui/warmup.js",
  "js/ui/week1.js",
  "js/ui/weekly.js",
  "js/ui/weighin.js",
  "js/ui/workout.js",
  "js/validate.js",
  "js/version.js",
  "js/wakelock.js",
];

// Install: fill the cache. The new worker then waits; the app shows "New version ready" and the user taps Update.
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
});

// Activate: delete the caches of older versions. The data lives in localStorage, so this never touches it.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("training-") && k !== CACHE).map((k) => caches.delete(k))))
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

// Fetch: app files come from the cache first. Everything else (the GitHub API, other sites) goes straight to the
// network and is never cached or answered by this worker.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req)));
});
