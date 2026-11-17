// The tabs this prototype does not redesign: a short Today (to show where food and the plan link in), Progress (stub)
// and Settings (reached by the gear now; Look and Animations work, so light/dark and Reduce Motion can be tried).
import { h } from "./app/h.js";
import { icon } from "./app/icons.js";
import { days, weekInfo } from "./app/plan-v2.js";
import { blockPosition } from "./app/schedule.js";
import { loadDoc, TODAY, loadDevice, saveDevice } from "./store.js";
import { screen, head, rerender, fmt } from "./ui.js";
import { daySlots, minutesFor, loadOf, levelsFromLoad } from "./planlogic.js";
import { bodyMap, levelWords } from "./bodymap.js";

export function renderToday() {
  const doc = loadDoc();
  const pos = blockPosition(doc.block.start_monday, TODAY);
  const d = pos.planDay;
  const slots = daySlots(doc, d, pos.week);
  const lv = levelsFromLoad(loadOf(slots));
  const food = (doc.food_log ?? []).filter((e) => !e.deleted && e.date === TODAY);
  const k = food.reduce((n, e) => n + e.kcal, 0), p = food.reduce((n, e) => n + (e.protein_g || 0), 0);
  const t = doc.profile.targets;
  return screen(
    head(`Week ${pos.week} of 12 · ${weekInfo(pos.week).phase}`, days[d].name),
    h("div", { class: "card proto-note" }, h("p", { class: "small muted" }, "Prototype: Today is not redesigned in this round. It shows the two links into the new tabs.")),
    h("a", { class: "card link-card", href: "#/plan" },
      bodyMap(lv, { cls: "link-map", label: "Today's muscles" }),
      h("span", { class: "grow" }, h("span", { class: "eyebrow" }, "Today's workout"), h("b", { class: "big-line" }, days[d].focus), h("span", { class: "small muted" }, `${minutesFor(doc, d, pos.week).minutes} min · ${levelWords(lv).slice(0, 3).join(", ")}`)),
      icon("chevron", 18)),
    h("a", { class: "card link-card", href: "#/diet" },
      h("span", { class: "area-icon" }, icon("diet", 20)),
      h("span", { class: "grow" }, h("span", { class: "eyebrow" }, "Food today"), h("b", { class: "big-line" }, `${fmt(Math.round(p))} of ${t.protein_g} g protein`), h("span", { class: "small muted" }, `${fmt(k)} of ${fmt(t.kcal)} kcal (sample numbers)`)),
      icon("chevron", 18)));
}

export function renderProgress() {
  return screen(head("Your progress", "Progress"), h("div", { class: "card" }, h("p", { class: "muted" }, "Not part of this prototype. Progress stays as it is in app 0.4.1.")));
}

export function renderSettings() {
  const dev = loadDevice();
  const theme = dev.theme === "light" || dev.theme === "dark" ? dev.theme : "auto";
  const off = dev.motion_off === true;
  const setTheme = (v) => { saveDevice({ theme: v }); if (v === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", v); rerender(); };
  const row = h("div", { class: "choice-row" }, [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]].map(([v, l]) => h("button", { class: "pick", type: "button", "aria-pressed": v === theme ? "true" : "false", onclick: () => setTheme(v) }, l)));
  row.style.gridTemplateColumns = "repeat(3, 1fr)";
  return screen(
    h("a", { class: "text-button back-link", href: "#/today" }, icon("back", 18), "Back"),
    h("span", { class: "eyebrow accent" }, "Moved off the tab bar"), h("h1", {}, "Settings"),
    h("p", { class: "muted" }, "Settings now opens from the gear at the top right of every tab, so Diet fits in the bar with five tabs."),
    h("div", { class: "card" }, h("h2", {}, "Look"), row,
      h("div", { class: "switch-row" }, h("span", { class: "grow" }, h("b", {}, "Animations"), h("span", { class: "small muted" }, "Off also when the iPhone asks for Reduce Motion.")),
        h("button", { class: "switch", type: "button", role: "switch", "aria-checked": off ? "false" : "true", "aria-label": "Animations", onclick: () => { saveDevice({ motion_off: !off }); document.documentElement.setAttribute("data-motion", off ? "on" : "off"); rerender(); } }, h("span", { class: "knob" })))),
    h("div", { class: "card" }, h("h2", {}, "Sync, Backup, Gym, Sound, Shortcuts"), h("p", { class: "muted small" }, "Unchanged from app 0.4.1 (not drawn in this prototype).")),
    h("div", { class: "card" }, h("h2", {}, "Prototype"), h("p", { class: "small muted" }, "Sample data only, made-up numbers. The date is fixed to Tuesday 17 November 2026 (week 3)."),
      h("a", { class: "button secondary", href: "?reset=1#/plan" }, icon("refresh", 18), "Reset the sample data")));
}
