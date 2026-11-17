// Screenshots of every screen at 375 x 812 (2x), light or dark, through Chrome headless and the DevTools protocol.
// usage: node shoot.mjs <outDir> <light|dark> <seedFile> [baseUrl]
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const [, , outDir, theme = "light", seedFile, base = "http://localhost:8103/?date=2026-11-23"] = process.argv;
const here = dirname(fileURLToPath(import.meta.url));
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const port = theme === "dark" ? 9336 : 9335;
const prof = join(here, `profile-${theme}`);
rmSync(prof, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--disable-extensions", "about:blank"], { stdio: "ignore" });

async function getJSON(path, method = "GET") {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}${path}`, { method }); return await r.json(); } catch { await sleep(250); }
  }
  throw new Error("Chrome did not start");
}
const target = await getJSON("/json/new?about:blank", "PUT");
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
});
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: theme }, { name: "prefers-reduced-motion", value: "reduce" }] });

const HELP = `const $c = (sel, text) => { const el = [...document.querySelectorAll(sel)].find((e) => !text || e.textContent.includes(text)); if (!el) throw new Error("not found: " + sel + " " + (text || "")); el.click(); return true; };
const $w = (ms) => new Promise((r) => setTimeout(r, ms));`;
async function js(code) {
  const r = await send("Runtime.evaluate", { expression: `(async () => { ${HELP}\n${code}\n})()`, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  return r.result.value;
}
async function go(url) { await send("Page.navigate", { url }); await sleep(1400); }
async function reload() { await send("Page.reload", { ignoreCache: true }); await sleep(1600); }
const made = [];
async function shot(name, { full = false } = {}) {
  await sleep(500);
  const params = { format: "jpeg", quality: 80 };
  if (full) {
    // Make the window as tall as the page, so the fixed bottom bar sits at the very bottom of the picture.
    const m = await send("Page.getLayoutMetrics");
    const h = Math.max(812, Math.ceil(m.cssContentSize.height));
    await send("Emulation.setDeviceMetricsOverride", { width: 375, height: h, deviceScaleFactor: 2, mobile: true });
    await sleep(400);
    const m2 = await send("Page.getLayoutMetrics");
    const h2 = Math.max(812, Math.ceil(m2.cssContentSize.height));
    if (h2 !== h) { await send("Emulation.setDeviceMetricsOverride", { width: 375, height: h2, deviceScaleFactor: 2, mobile: true }); await sleep(300); }
  }
  const r = await send("Page.captureScreenshot", params);
  if (full) { await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 2, mobile: true }); await sleep(200); }
  const file = join(outDir, `${name}-${theme}.jpg`);
  writeFileSync(file, Buffer.from(r.data, "base64"));
  made.push(file);
}
async function step(label, fn) {
  try { await fn(); } catch (e) { console.log(`FAILED ${label}: ${e.message.split("\n")[0]}`); }
}
const seed = readFileSync(seedFile, "utf8").split(/\r?\n/).filter((l) => !l.trim().startsWith("//")).join("\n");
const seedNow = async () => { await js(`return await ${seed.trim().replace(/;$/, "")}`); await js(`await (async () => { const regs = await navigator.serviceWorker?.getRegistrations?.() ?? []; for (const r of regs) await r.unregister(); })();`); };
const closeSheet = `if (document.querySelector("[data-sheet]")) { $c(".sheet button", "Close"); await $w(500); }`;

// ---------- tabs and sheets ----------
await go(base);
await seedNow();
await reload();
await step("today", async () => { await go(`${base}#/today`); await reload(); await shot("01-today", { full: true }); });
await step("progress", async () => { await go(`${base}#/progress`); await shot("02-progress", { full: true }); });
await step("progress-open", async () => { await js(`$c(".ex-row", "Chest press"); await $w(400); const el = document.querySelector(".ex-item.open"); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 70);`); await shot("03-progress-exercise"); });
await step("gym", async () => { await go(`${base}#/gym`); await js(`window.scrollTo(0,0)`); await shot("04-gym", { full: true }); });
await step("machine", async () => { await js(`$c(".list-row", "Chest press machine"); await $w(600);`); await shot("05-machine-card"); });
await step("machine-add", async () => { await js(`${closeSheet} $c(".list-row", "Leg press"); await $w(600);`); await shot("06-machine-card-add-where"); await js(closeSheet); });
await step("plan", async () => { await go(`${base}#/plan`); await shot("07-plan", { full: true }); });
await step("exercise-sheet-plan", async () => { await js(`$c(".plan-row", "Romanian deadlift"); await $w(600);`); await shot("08-exercise-sheet"); await js(closeSheet); });
await step("settings", async () => { await go(`${base}#/settings`); await shot("09-settings", { full: true }); });
await step("weighin", async () => { await go(`${base}#/weighin`); await shot("10-weigh-in", { full: true }); });
await step("weekly", async () => { await go(`${base}#/weekly`); await shot("11-weekly", { full: true }); });
await step("targets", async () => { await go(`${base}#/targets`); await shot("12-your-numbers", { full: true }); });

// ---------- the workout ----------
await step("walk", async () => { await go(`${base}#/today`); await js(`$c("button", "Start workout"); await $w(800);`); await shot("13-walk"); });
await step("walk-run", async () => { await js(`$c("button", "Start walk"); await $w(800);`); await shot("14-walk-running"); });
await step("walk-result", async () => { await js(`$c("button", "Done walking"); await $w(700);`); await shot("15-walk-result"); });
await step("changeover", async () => { await js(`$c(".choice-row button", "6"); await $w(300); $c(".bar button", "Save walk"); await $w(800);`); await shot("16-change-over"); });
await step("warmup", async () => { await js(`$c("button", "Start warm-up"); await $w(800);`); await shot("17-lift-warm-up"); });
await step("set-warmup", async () => { await js(`$c("button", "Start weights"); await $w(900);`); await shot("18-set-table-warm-up"); });
await step("set-table", async () => { await js(`for (let i = 0; i < 2; i++) { $c(".set-line.current .check"); await $w(700); } window.scrollTo(0, 0);`); await shot("19-set-table"); });
await step("set-pr", async () => { await js(`const b = document.querySelectorAll(".set-edit .step-btn"); b[1].click(); await $w(150); for (let i = 0; i < 4; i++) { b[3].click(); await $w(80); } await $w(300);`); await shot("20-set-table-new-best"); });
await step("exercise-sheet", async () => { await js(`$c(".chip", "Tips"); await $w(600);`); await shot("21-exercise-sheet-tips"); await js(closeSheet); });
await step("swap", async () => { await js(`$c(".chip", "Swap"); await $w(600);`); await shot("22-swap-why"); await js(`$c(".sheet .list-row", "Machine busy"); await $w(600);`); await shot("23-swap-pick"); await js(`document.querySelectorAll("[data-sheet]").forEach((e) => e.remove());`); });
await step("rest", async () => { await js(`$c(".bar .button"); await $w(900);`); await shot("24-rest"); });
await step("pair2", async () => { await js(`$c(".rir-box button", "2"); await $w(300); $c(".bar button", "Skip rest"); await $w(900); window.scrollTo(0,0);`); await shot("25-set-table-partner"); });
await step("finish", async () => { await js(`const a = await import("/js/active.js"); a.patchActive({ phase: "finish", rest: null, hold: null }); (await import("/js/ui/app.js")).rerender(); await $w(900); window.scrollTo(0,0);`); await shot("26-finish", { full: true }); });
await step("saved", async () => { await js(`$c(".bar button", "Save"); await $w(1200); window.scrollTo(0,0);`); await shot("27-today-after-workout"); });

// ---------- week 1 (a block that starts today) ----------
await step("week1", async () => {
  await seedNow();
  await js(`const d = JSON.parse(localStorage.getItem("trn.data.v1")); d.block.start_monday = "2026-11-23"; d.sessions = []; localStorage.setItem("trn.data.v1", JSON.stringify(d));`);
  await go(`${base}#/today`); await reload();
  await shot("28-today-week-1", { full: true });
  await js(`$c("button", "Start workout"); await $w(800); $c("button", "Skip walk"); await $w(800); $c("button", "Skip warm-up"); await $w(900);`);
  await shot("29-week-1-learn");
  await js(`$c(".bar button", "Start warm-up"); await $w(800);`);
  await shot("30-week-1-warm-up");
  await js(`$c(".bar button", "Done"); await $w(800);`);
  await shot("31-week-1-set-1");
  await js(`$c(".bar button", "Done"); await $w(800);`);
  await shot("32-week-1-how-many-more");
});

// ---------- first start ----------
await step("setup", async () => {
  await js(`localStorage.clear();`);
  await go(`${base}#/setup`); await reload();
  await shot("33-first-start", { full: true });
  await js(`$c("button", "Start fresh"); await $w(800);`);
  await shot("34-intake");
});

console.log(`made ${made.length} screenshots`);
ws.close();
proc.kill();
