import { h } from "../h.js";

const TABS = [["today", "Today"], ["progress", "Progress"], ["plan", "Plan"], ["settings", "Settings"]];

export function tabBar(active) {
  return h("nav", { class: "bar", "aria-label": "Main" },
    h("div", { class: "tabs" },
      TABS.map(([id, label]) =>
        h("a", { class: "tab", href: `#/${id}`, "aria-current": id === active ? "page" : false }, label))));
}

// A standard screen wrapper (with room for the tab bar).
export function screen(...children) {
  return h("main", { class: "screen has-tabs" }, ...children);
}

// A screen without tabs, with room for the bottom action bar (setup, intake, targets).
export function flowScreen(...children) {
  return h("main", { class: "screen has-bar" }, ...children);
}

// The fixed bottom bar with the one main action (and an optional secondary button above it).
export function actionBar(...buttons) {
  return h("div", { class: "bar action-bar no-tabs" }, h("div", { class: "bar-inner" }, ...buttons));
}

export function mainButton(label, onclick, { disabled = false } = {}) {
  return h("button", { class: "button", type: "button", disabled, onclick }, label);
}

export function secondaryButton(label, onclick) {
  return h("button", { class: "button secondary", type: "button", onclick }, label);
}

export function emptyState(title, text) {
  return h("div", { class: "card" }, h("h2", {}, title), h("p", { class: "muted" }, text));
}

export function errorState(message) {
  return h("main", { class: "screen" },
    h("h1", {}, "Something is wrong"),
    h("div", { class: "card warn" }, h("p", {}, message)),
    h("p", { class: "muted small" }, "Your data was not changed."));
}
