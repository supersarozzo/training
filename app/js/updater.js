// The page side of updates (0.7.3, docs/ARCHITECTURE.md section 7). No screen code here, so tests can run it with
// fakes. ui/update.js draws the "New version ready" bar and the Settings line from it.
// Rules: ask for an update at start, on coming to the front and on pageshow; see a worker that was already installing
// when the page registered; show the bar whenever a worker waits; never reload unless the user tapped Update.

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
  ready: "A new version is ready. Tap Update at the top.",
  none: "You have the newest version.",
  failed: "Could not get the new version. Check the internet and try again.",
};
export function updateWords(status) {
  return WORDS[status] ?? "";
}

// sw = navigator.serviceWorker, doc = document, win = window; onChange() redraws the screen.
export function createUpdater({ sw, doc, win, onChange = () => {} }) {
  let reg = null;
  let waiting = null; // a new worker that is ready and waits for the tap on Update
  let status = "idle"; // what Settings says after Check for update
  let updating = false; // true only after the tap on Update, so the page never reloads by itself

  const set = (next) => { if (status !== next) { status = next; onChange(); } };

  // A worker that finished installing waits. With no controller this is the very first install: nothing to update.
  function see(worker) {
    if (!worker) return;
    if (worker.state === "installed" && sw.controller && waiting !== worker) {
      waiting = worker;
      if (status === "downloading" || status === "checking") status = "ready";
      onChange();
    } else if (worker.state === "redundant") {
      if (waiting === worker) { waiting = null; onChange(); }
      if (status === "downloading") set("failed");
    }
  }
  function follow(worker) {
    if (!worker) return;
    worker.addEventListener("statechange", () => see(worker));
    see(worker);
  }
  function look() {
    if (!reg) return;
    see(reg.waiting);
  }

  async function check() {
    if (!reg) return;
    try { await reg.update(); } catch { /* offline or the server did not answer: the next check tries again */ }
    look();
  }

  // The Check for update button in Settings.
  async function checkNow() {
    if (!reg) { set("failed"); return; }
    set("checking");
    try {
      await reg.update();
    } catch {
      set("failed");
      return;
    }
    look();
    if (waiting) set("ready");
    else if (reg.installing) set("downloading");
    else set("none");
  }

  function start() {
    sw.addEventListener("controllerchange", () => { if (updating) win.location.reload(); });
    return sw.register("sw.js", { updateViaCache: "none" }).then((r) => {
      reg = r;
      follow(reg.installing); // already installing when the page registered: its updatefound has passed
      look();
      reg.addEventListener("updatefound", () => follow(reg.installing));
      doc.addEventListener("visibilitychange", () => { if (!doc.hidden) check(); });
      win.addEventListener("pageshow", () => check());
      check();
    }).catch(() => { /* no worker: the app still works online */ });
  }

  // The tap on Update: the waiting worker takes over, then the page reloads once (controllerchange).
  function apply() {
    if (!waiting) return;
    updating = true;
    waiting.postMessage("SKIP_WAITING");
  }

  return { start, check, checkNow, apply, waiting: () => waiting, status: () => status };
}
