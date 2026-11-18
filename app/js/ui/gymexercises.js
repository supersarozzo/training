// Gym › Exercises (build step 2, docs/DESIGN.md 15.7; answer 75 a): every exercise in the app, grouped by main muscle
// (the same groups as the swap list and the muscle check), each row with its photo, equipment, "In the plan: Mon" or
// "Swap only", the helper words and a small map. A tap opens the exercise sheet with one map. Moved here from the
// 0.4.1 Plan tab's Exercises part (nothing lost: same rows, same sheet content, plus muscles).
import { h } from "../h.js";
import { exercises } from "../plan/plan-v2.js";
import { thumb } from "./media.js";
import { openExerciseLayer, inPlanText } from "./exlayer.js";
import { miniMap } from "./bodymap.js";
import { GYM_GROUPS, gymGroupOf, muscleWords } from "../engine/planpage.js";

export function exerciseGroups() {
  const ids = Object.keys(exercises).sort((a, b) => exercises[a].name.localeCompare(exercises[b].name));
  return [
    h("p", { class: "muted" }, "Every exercise in the app, with its swaps. Tap one for how to do it, its muscles and its machine."),
    GYM_GROUPS.map((g) => {
      const list = ids.filter((id) => gymGroupOf(id) === g.id);
      if (!list.length) return null;
      return [
        h("div", { class: "area-head" }, h("h2", {}, g.name), h("span", { class: "badge" }, String(list.length))),
        h("div", { class: "card" }, list.map((id) => {
          const ex = exercises[id];
          const w = muscleWords(id);
          return h("button", { class: "mach-row ex-pick", type: "button", onclick: () => openExerciseLayer(id) },
            thumb(id, { small: true }),
            h("span", { class: "grow" },
              h("b", {}, ex.name),
              h("span", { class: "small muted" }, ex.equipment),
              h("span", { class: "small" }, inPlanText(id), w.helpers ? ` · helps ${w.helpers}` : "")),
            miniMap(id));
        })),
      ];
    }),
  ];
}
