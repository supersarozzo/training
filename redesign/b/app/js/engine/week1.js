// Week 1: learn the moves and find your weights (plan v2 section 8, WORKFLOW C). Pure.
import { exercises } from "../plan/plan-v2.js";
import { stepUp, stepDown } from "./progression.js";

export const LEFT_CHOICES = ["0-1", "2-3", "4-6", "7+"]; // "how many more could you do?"

// The table in section 8, "After set 1 -> Set 2".
//   set1: { weight_kg, reps, left }  left is one of LEFT_CHOICES
// Returns { stepsChange, weight_kg, keep, note }.
export function week1NextSet(set1, exerciseId, settings) {
  const ex = exercises[exerciseId];
  const [low, top] = ex.range;
  if (!LEFT_CHOICES.includes(set1.left)) throw new Error(`Unknown "how many more" answer: ${set1.left}`);

  let steps;
  let note;
  if (set1.reps < low) {
    // Could not reach the bottom of the range: remove 1 to 2 steps (2 when it was 3 or more reps short).
    steps = low - set1.reps >= 3 ? -2 : -1;
    note = `Too heavy. Remove ${Math.abs(steps)} step${steps === -2 ? "s" : ""}.`;
  } else if (set1.reps >= top && set1.left === "7+") {
    steps = 2;
    note = "Too light. Add 2 steps.";
  } else if (set1.reps >= top && set1.left === "4-6") {
    steps = 1;
    note = "A bit light. Add 1 step.";
  } else if (set1.left === "0-1") {
    steps = -1;
    note = "A bit heavy. Remove 1 step.";
  } else {
    steps = 0;
    note = "Good. Keep this weight. It is your starting weight.";
  }

  let weight = set1.weight_kg;
  if (steps > 0) weight = stepUp(weight, exerciseId, settings, steps);
  if (steps < 0) weight = stepDown(weight, exerciseId, settings, -steps);
  return { stepsChange: steps, weight_kg: weight, keep: steps === 0, note };
}

// The starting weight saved for week 2. The weight that fits after set 2 is the start.
// If set 2 is still off, the app saves its best guess (the table applied to set 2); week 2 fixes the rest
// with the normal rule.
export function week1StartingWeight(set2, exerciseId, settings) {
  const second = week1NextSet(set2, exerciseId, settings);
  return { start_weight_kg: second.weight_kg, fits: second.keep, note: second.keep ? "Your starting weight for week 2." : "Best guess. Week 2 will fix it with the normal rule." };
}

// Week 1 rules (section 8): 2 working sets, RIR 3, no progression. Those numbers live in plan-v2.js
// (weeks[0]); this list is what the guided screen steps through for each exercise.
export const WEEK1_STEPS = ["learn", "warmup", "set1", "set2"];

// ---------- the guided flow of one exercise (used by ui/week1.js, kept pure here so it can be tested) ----------

// "How many more could you do?" in week 1 uses four ranges. For the rule engine each becomes a number of reps left.
export const LEFT_TO_RIR = { "0-1": 0, "2-3": 2, "4-6": 4, "7+": 4 };

// Where one exercise of the workout stands. rec: the exercise record in the session. weighted: false for
// bodyweight and timed exercises (no weight to find, so no warm-up, no "how many more", no result screen).
// Returns "learn" | "warmup" | "set1" | "left1" | "set2" | "left2" | "result" | "done".
export function week1Stage(rec, weighted) {
  const work = rec.sets.filter((s) => s.type === "work");
  const warm = rec.sets.filter((s) => s.type === "warmup").length;
  if (work.length === 0) {
    if (!rec.w1_ready) return "learn";
    if (weighted && warm === 0 && !rec.warmup_skipped) return "warmup";
    return "set1";
  }
  if (work.length === 1) {
    if (weighted && !work[0].left) return "left1";
    return "set2";
  }
  if (!weighted) return "done";
  if (!work[1].left) return "left2";
  return rec.w1_saved ? "done" : "result";
}

// The result of the exercise after both sets: the starting weight for week 2.
export function week1Result(rec, exerciseId, settings) {
  const work = rec.sets.filter((s) => s.type === "work");
  const set2 = { weight_kg: work[1].weight_kg, reps: work[1].reps, left: work[1].left };
  return week1StartingWeight(set2, exerciseId, settings);
}
