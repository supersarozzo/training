// Gym: every machine and station the plan uses, grouped by gym area, each with its picture, the name on its sign and
// "Where it is in my gym" (Rosario's own note: one tap to add on the first visit, shown every time after).
import { h } from "../h.js";
import { screen, icon } from "./parts.js";
import { model } from "./app.js";
import { machines, AREAS, exerciseMedia } from "../plan/media.js";
import { thumb, openMachine, whereOf } from "./media-ui.js";

const ORDER = ["cardio", "machines", "cables", "free", "functional"];

export function renderGym() {
  const doc = model.doc();
  const ids = Object.keys(machines);
  const noted = ids.filter((id) => whereOf(doc, id)).length;
  const groups = ORDER.map((area) => [area, ids.filter((id) => machines[id].area === area)]).filter(([, list]) => list.length);
  const uses = (id) => Object.values(exerciseMedia).filter((x) => x.machine === id).length + (id === "treadmill" ? 1 : 0);

  const main = screen(
    h("div", { class: "eyebrow" }, "My gym"),
    h("h1", {}, "Machines"),
    h("p", { class: "muted small" }, "What each one looks like, the name on its sign, and where it is. Add where it is on your first visit."),
    h("div", { class: "stats two" },
      h("div", { class: "stat" }, h("div", { class: "k" }, "Machines and stations"), h("div", { class: "v" }, String(ids.length))),
      h("div", { class: "stat" }, h("div", { class: "k" }, "Where noted"), h("div", { class: "v" }, `${noted}`, h("span", { class: "unit" }, `of ${ids.length}`)))),
    groups.map(([area, list]) => [
      h("div", { class: "area-head" }, h("h2", {}, AREAS[area]), h("span", { class: "badge muted" }, String(list.length))),
      h("div", { class: "list" }, list.map((id) => {
        const m = machines[id];
        const where = whereOf(doc, id);
        const extra = m.optional ? doc.shared_settings?.extra_machines?.[id] : undefined;
        return h("button", { class: "list-row", type: "button", onclick: () => openMachine(id) },
          thumb(m.photo),
          h("div", { class: "grow" },
            h("div", { class: "title" }, m.name),
            h("div", { class: "sub" }, `Sign: ${m.sign} · ${uses(id)} exercise${uses(id) === 1 ? "" : "s"}${m.optional ? (extra === true ? " · in my gym" : extra === false ? " · not in my gym" : " · only if the gym has it") : ""}`),
            where
              ? h("div", { class: "where" }, icon("pin", "sm"), h("span", { class: "ellipsis" }, where))
              : h("div", { class: "where empty" }, icon("plus", "sm"), "Add where it is")),
          icon("chev", "chev"));
      })),
    ]));
  main.dataset.key = "gym";
  return main;
}
