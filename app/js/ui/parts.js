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

export function emptyState(title, text) {
  return h("div", { class: "card" }, h("h2", {}, title), h("p", { class: "muted" }, text));
}
