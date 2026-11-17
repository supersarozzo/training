// PROTOTYPE 8.28 (builder A). The Gym tab with the old Plan tab's Exercises and Machines moved in (Rosario's request,
// research 2 item 6). Two parts behind a switch: Machines (the Gym list as it is today, "x of N noted") and Exercises
// (every exercise the app knows, grouped by main muscle, with where it sits in the plan; a tap opens the same
// exercise layer as the Plan tab, with its body map).
import { h } from "../h.js";
import { rerender, model } from "./app.js";
import { renderGym } from "./machines.js";
import { exercises, days, DAY_IDS } from "../plan/plan-v2.js";
import { thumb } from "./media.js";
import { icon } from "./icons.js";
import { GROUPS, mainGroup, muscleWords } from "../proto/muscles.js";
import { slotsOf, hiddenByGym } from "../proto/plandays.js";
import { openExerciseLayer } from "./plan2.js";
import { onMount, stagger } from "./motion.js";

let part = "machines";

function segmented(current) {
  return h("div", { class: "segmented two", role: "tablist", "aria-label": "Part of the Gym tab" },
    [["machines", "Machines"], ["exercises", "Exercises"]].map(([v, label]) =>
      h("button", { type: "button", role: "tab", "aria-selected": v === current ? "true" : "false", onclick: () => { part = v; rerender(); } }, label)));
}

function exerciseList() {
  const doc = model.doc();
  const where = {};
  for (const d of DAY_IDS) for (const s of slotsOf(doc, d)) (where[s.ex] ??= []).push(days[d].name.slice(0, 3));
  return [
    h("p", { class: "muted" }, "Every exercise in the app, with its swaps. Tap one for how to do it, its muscles and its machine."),
    GROUPS.map(([g, name]) => {
      const ids = Object.keys(exercises).filter((id) => mainGroup(id) === g).sort((a, b) => exercises[a].name.localeCompare(exercises[b].name));
      if (!ids.length) return null;
      return [
        h("div", { class: "area-head" }, h("h2", {}, name), h("span", { class: "badge" }, String(ids.length))),
        h("div", { class: "card" }, ids.map((id) => {
          const ex = exercises[id];
          const w = muscleWords(id);
          return h("button", { class: "mach-row", type: "button", onclick: () => openExerciseLayer(id) },
            thumb(id, { small: true }),
            h("span", { class: "grow" },
              h("b", {}, ex.name),
              h("span", { class: "small muted" }, ex.equipment),
              h("span", { class: "small plain-line" }, where[id] ? `In the plan: ${where[id].join(", ")}` : hiddenByGym(doc, id) ? "Swap only · needs a machine the first visit checks" : "Swap only", w.helpers ? h("span", { class: "muted" }, ` · helps ${w.helpers}`) : null)),
            h("span", { class: "muted" }, icon("chevron", 18)));
        })),
      ];
    }),
  ];
}

export function renderGym2() {
  if (part === "machines") {
    const main = renderGym();
    const h1 = main.querySelector("h1");
    h1.textContent = "Gym";
    h1.after(segmented(part));
    return main;
  }
  const main = h("main", { class: "screen has-tabs" },
    h("span", { class: "eyebrow accent" }, "My gym"),
    h("h1", {}, "Gym"),
    segmented(part),
    exerciseList());
  onMount(() => stagger(main.querySelectorAll(".mach-row")));
  return main;
}
