// Settings > GitHub sync: connect, test, get, send, forget the key. Also the "Restore from GitHub" form of first start.
// SAFETY: the key is typed in a password field, goes straight to the device box (js/sync/sync.js saveConnection) and is
// never shown again, never put in a URL, a message or a log. The draft below holds it only while the form is open.
import { h } from "../h.js";
import { openSheet } from "./parts.js";
import { store, model, rerender } from "./app.js";
import { syncer, fakeInfo } from "../syncer.js";
import { saveConnection, forgetKey, statusText, keyEndsSoon, connectionOf } from "../sync/sync.js";
import { FOOD_MESSAGES, foodStatusText } from "../sync/foodsync.js";

// A damaged or too-new food box must never stop Settings from drawing (wave 3 F2): it then counts as "nothing new".
const foodUnsynced = () => { try { return syncer.food.hasUnsynced(); } catch { return false; } };
import { today } from "../clock.js";

let draft = null; // { owner, repo, token, expires } while the form is open
let message = null; // { kind: "ok" | "error", text }
let busy = null; // label of what is running
let fakeHint = null; // text shown on localhost in fake mode only

fakeInfo().then((info) => { if (info) { fakeHint = `Test mode (pretend GitHub). Account: ${info.fake.owner}. Key: ${info.token}.`; rerender(); } });

function startDraft() {
  const dev = store.loadDevice();
  draft = { owner: dev.owner ?? "", repo: dev.repo ?? "training-data", token: "", expires: dev.token_expires ?? "" };
}

export function resetSyncDraft() { draft = null; message = null; }

// The fields. Used by Settings and by first start.
export function connectionFields() {
  if (!draft) startDraft();
  const saved = connectionOf(store.loadDevice()) !== null;
  return [
    fakeHint ? h("p", { class: "small muted" }, fakeHint) : null,
    h("div", { class: "field" }, h("label", { for: "sy-owner" }, "GitHub account name"),
      h("input", { type: "text", id: "sy-owner", autocomplete: "off", autocapitalize: "none", autocorrect: "off", spellcheck: "false", value: draft.owner, oninput: (e) => { draft.owner = e.target.value; } })),
    h("div", { class: "field" }, h("label", { for: "sy-repo" }, "Private repo name"),
      h("input", { type: "text", id: "sy-repo", autocomplete: "off", autocapitalize: "none", autocorrect: "off", spellcheck: "false", value: draft.repo, oninput: (e) => { draft.repo = e.target.value; } })),
    h("div", { class: "field" }, h("label", { for: "sy-token" }, saved ? "New GitHub key (leave empty to keep the saved one)" : "GitHub key (paste it here)"),
      h("input", { type: "password", id: "sy-token", autocomplete: "off", autocapitalize: "none", autocorrect: "off", spellcheck: "false", value: draft.token, oninput: (e) => { draft.token = e.target.value; } })),
    h("div", { class: "field" }, h("label", { for: "sy-exp" }, "Key ends on (optional, like 2027-11-16)"),
      h("input", { type: "text", id: "sy-exp", inputmode: "numeric", autocomplete: "off", placeholder: "yyyy-mm-dd", value: draft.expires, oninput: (e) => { draft.expires = e.target.value; } })),
  ];
}

// Save what is typed. Returns { ok } or { ok: false, error }.
export function saveDraft() {
  if (!draft) startDraft();
  const r = saveConnection(store, { owner: draft.owner, repo: draft.repo, token: draft.token, token_expires: draft.expires.trim() });
  if (r.ok) draft.token = ""; // the key is not kept in memory a moment longer than needed
  return r;
}

async function run(label, work) {
  if (busy) return;
  busy = label; message = null; rerender();
  try { message = await work(); } catch { message = { kind: "error", text: "Something went wrong. Nothing was lost." }; }
  busy = null;
  rerender();
}

const asMessage = (res, okText) => ({ kind: res.result === "ok" ? "ok" : "error", text: res.result === "ok" ? okText : res.message });

// The combined syncer (both.js) puts the food result in `res.food`. "Synced" is said only when the food part is fine too (0.7.1).
// Pure: used by Get and Send.
export function syncOutcome(res, okText) {
  const food = res.food;
  if (res.result !== "ok" || !food || food.result === "ok") return asMessage(res, okText);
  const why = food.message ?? FOOD_MESSAGES[food.result] ?? FOOD_MESSAGES.error;
  return { kind: "error", text: `Workouts synced. Food did not sync: ${why}` };
}

const saveAndTest = () => run("test", async () => {
  const saved = saveDraft();
  if (!saved.ok) return { kind: "error", text: saved.error };
  const res = await syncer.test();
  return asMessage(res, "Saved. Connected: the key works.");
});
const getNow = () => run("get", async () => {
  const res = await syncer.request("get");
  return syncOutcome(res, res.found === false ? "Nothing on GitHub yet. Your phone data is unchanged." : "Got the latest from GitHub and merged it into this phone.");
});
export { getNow as getFromGithub };
const sendNow = () => run("send", async () => syncOutcome(await syncer.request("full"), "Synced: the phone and GitHub now have the same data."));

function confirmForget() {
  const close = openSheet(
    h("h2", {}, "Forget the GitHub key?"),
    h("p", { class: "muted" }, "The key is removed from this phone. Your workouts stay here and on GitHub. You can paste a key again later."),
    h("button", { class: "button", type: "button", onclick: () => { close(); forgetKey(store); resetSyncDraft(); message = { kind: "ok", text: "The GitHub key is gone from this phone." }; rerender(); } }, "Forget the key"),
    h("button", { class: "button secondary", type: "button", onclick: close }, "Keep it"));
}

export function syncCard() {
  const device = store.loadDevice();
  const configured = connectionOf(device) !== null;
  const unsynced = configured && syncer.hasUnsynced();
  const ends = keyEndsSoon(device, today());
  const disabled = busy !== null;
  return h("div", { class: "card" },
    h("h2", {}, "GitHub sync"),
    h("p", { class: busy || (device.last_sync_result && device.last_sync_result !== "ok") ? "status-warning" : "muted", role: "status" }, busy ? "Working…" : statusText(device, unsynced, "settings")),
    // Food has its own line (0.7.1), as on the Diet tab, so a failed food.json never hides behind "Synced".
    !busy && connectionOf(device) ? h("p", { class: device.food_last_sync_result && device.food_last_sync_result !== "ok" ? "small status-warning" : "small muted" }, foodStatusText(device, foodUnsynced(), "settings")) : null,
    ends ? h("p", { class: "status-warning" }, ends.days < 0 ? `The GitHub key ended on ${ends.date}. Make a new one.` : `The GitHub key ends on ${ends.date}.`) : null,
    h("p", { class: "small muted" }, "Your data syncs to your private GitHub repo when you save a workout and when you open the app. It can not sync while the app is closed."),
    connectionFields(),
    message ? h("div", { class: message.kind === "error" ? "error-text" : "status-success", role: "status" }, message.text) : null,
    h("button", { class: "button", type: "button", disabled, onclick: saveAndTest }, configured ? "Save and test connection" : "Connect to GitHub"),
    configured ? [
      h("button", { class: "button secondary", type: "button", disabled, onclick: getNow }, "Get from GitHub"),
      h("button", { class: "button secondary", type: "button", disabled, onclick: sendNow }, "Send to GitHub"),
      h("p", { class: "small muted" }, "Both buttons merge. Neither one overwrites anything."),
      h("button", { class: "button secondary", type: "button", disabled, onclick: confirmForget }, "Forget GitHub key"),
    ] : null);
}

// First start: Restore from GitHub. `onDone(doc)` is called when data arrived.
export function restoreFromGithub(onDone) {
  return run("restore", async () => {
    const saved = saveDraft();
    if (!saved.ok) return { kind: "error", text: saved.error };
    const res = await syncer.request("get");
    if (res.result !== "ok") return { kind: "error", text: res.message };
    if (res.found === false) return { kind: "error", text: "Nothing is saved on GitHub yet. Use Start fresh, or Restore from file." };
    const doc = model.ensureBlock();
    if (!doc.profile) return { kind: "error", text: "The GitHub file has no profile. Use Start fresh, or Restore from file." };
    onDone(doc);
    return { kind: "ok", text: "Restored." };
  });
}

export const syncMessage = () => message;
export const syncBusy = () => busy !== null;
