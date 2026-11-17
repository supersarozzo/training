// Gym tab (redesign D): every machine and station the plan uses, grouped by gym area, each with a photo, the usual
// sign name and Rosario's own "Where it is in my gym" note. Tap a row to open the machine card.
import { h } from "../h.js";
import { screen } from "./parts.js";
import { model } from "./app.js";
import { machineList, AREAS, AREA_ORDER, spotFor } from "../plan/machines.js";
import { thumb } from "./demo.js";
import { icon } from "./icons.js";
import { openMachine } from "./machinecard.js";

export function renderGym() {
  const doc = model.doc();
  const list = machineList(doc.shared_settings);
  const found = list.filter((m) => spotFor(doc, m.id)).length;
  const groups = AREA_ORDER.map((area) => [area, list.filter((m) => m.area === area)]).filter(([, ms]) => ms.length);
  const main = screen(
    h("div", { class: "page-head" }, h("div", {}, h("span", { class: "eyebrow" }, "The Gym Group, York Foss Island"), h("h1", {}, "Your gym"))),
    h("div", { class: "card tint card-row" },
      icon("pin"),
      h("div", { class: "grow" },
        h("b", {}, `${found} of ${list.length} machines found`),
        h("div", { class: "small muted" }, found < list.length ? "On your first visit, tap a machine and add where it is. You will see it on the exercise screen every time after." : "Every machine has a note. Tap one to change it."))),
    groups.map(([area, ms]) => [
      h("h2", { class: "area-head" }, AREAS[area]),
      h("div", { class: "list" }, ms.map((m) => {
        const where = spotFor(doc, m.id);
        return h("button", { class: "list-row", type: "button", onclick: () => openMachine(m.id) },
          thumb(m.photo),
          h("span", { class: "grow" },
            h("span", { class: "title" }, m.name),
            h("span", { class: "sub" }, `Sign: ${m.sign}`),
            where ? h("span", { class: "sub" }, `Where: ${where}`) : h("span", { class: "sub brand" }, "Where is it? Tap to add")),
          icon("chevron", "chev"));
      })),
    ]),
    h("p", { class: "small muted center" }, "Machines the gym does not have (Settings > Gym weights) are hidden."));
  main.dataset.view = "gym";
  return main;
}
