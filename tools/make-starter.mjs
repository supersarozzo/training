// Makes the private starter file from the intake answers, in the backup format (docs/ARCHITECTURE.md sections 4.2 and 10).
// This script contains NO personal data. It reads private/intake-2026-11-16.json and writes private/starter-backup.json.
// Both files are in the git-ignored private/ folder. Never commit them.
//
// Run:  node tools/make-starter.mjs
// Then on the phone: Start screen > Restore from file > choose starter-backup.json.
//
// The file holds the profile (intake answers) and the settings answers. It holds no token, no sessions
// and no targets: the app works the targets out from the answers and shows them to confirm.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { emptyDoc, validateDocument } from "../app/js/validate.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const inputPath = join(root, "private", "intake-2026-11-16.json");
const outputPath = join(root, "private", "starter-backup.json");

const MAP = {
  q22: { a: "male", b: "female", c: "unspecified" },
  q25: { a: "kg", b: "st" },
  q26: { a: "bulk", b: "recomp", c: "cut", d: "suggest" },
  q29: { a: "balanced", b: "arms", c: "chest", d: "back", e: "shoulders", f: "legs" },
  q30: { a: "a", b: "b", c: "c", d: "d" },
  q32: { a: "targets", b: "protein", c: "none" },
  q33: { a: "no_limits", b: "vegetarian", c: "vegan" },
  q34: { a: true, b: false },
  q35: { a: "after", b: "before", c: "split", d: "other" },
  q36: { a: "yes", b: "not_sure", c: "no" },
  q38: { a: true, b: false },
};

function stop(message) {
  console.error(`Stopped: ${message}`);
  process.exit(1);
}

function pick(answers, key) {
  const value = answers[key]?.value;
  const mapped = MAP[key]?.[value];
  if (mapped === undefined) stop(`${key} has an answer this tool does not know`);
  return mapped;
}
function numberOf(answers, key, ...fields) {
  const a = answers[key];
  for (const f of ["value", ...fields]) if (typeof a?.[f] === "number") return a[f];
  stop(`${key} has no number`);
}

let answers;
try {
  answers = JSON.parse(readFileSync(inputPath, "utf8"));
} catch {
  stop(`can not read ${inputPath}`);
}
if (answers.complete !== true) stop("the intake is not marked complete");
if (answers.q20?.value !== "a") stop("q20 (health check) is not 'all no': the starter file is not made for that case");

const now = new Date().toISOString();

const q27 = answers.q27?.value === "a" ? null : numberOf(answers, "q27", "kg");
const q28 = answers.q28?.value === "a" ? numberOf(answers, "q28", "amount") : null;
const q33 = answers.q33?.value === "d" ? String(answers.q33.text ?? "other").slice(0, 100) : pick(answers, "q33");
const q37 = answers.q37?.value === "a" ? [] : String(answers.q37?.text ?? "").split(",").map((s) => s.trim()).filter(Boolean);

const doc = emptyDoc();
doc.profile = {
  updated_at: now,
  intake: {
    q20_parq_all_no: true,
    q21_age: numberOf(answers, "q21"),
    q22_sex: pick(answers, "q22"),
    q23_height_cm: numberOf(answers, "q23", "cm"),
    q24_weight_kg: numberOf(answers, "q24", "kg"),
    q25_unit: pick(answers, "q25"),
    q26_goal: pick(answers, "q26"),
    q27_goal_weight_kg: q27,
    q28_waist_cm: q28,
    q29_focus: pick(answers, "q29"),
    q30_activity: pick(answers, "q30"),
    q31_sleep_h: numberOf(answers, "q31"),
    q32_food: pick(answers, "q32"),
    q33_diet: q33,
    q34_scale: pick(answers, "q34"),
    q35_walk: pick(answers, "q35"),
    q36_walk_fit: pick(answers, "q36"),
    q37_avoid: q37,
    q38_photos: pick(answers, "q38"),
  },
  targets: null,
};
// Settings answers: body unit from q25. The Shortcuts button stays off until the phone test (docs/DECISIONS.md).
doc.shared_settings = { ...doc.shared_settings, updated_at: now, body_unit: pick(answers, "q25") };

// The app's own checker must accept the file, or the phone would refuse it.
const checked = validateDocument(JSON.parse(JSON.stringify(doc)));
if (!checked.ok) stop(`the file would not pass the app's check: ${checked.error}`);

writeFileSync(outputPath, JSON.stringify(checked.doc, null, 2) + "\n", "utf8");
console.log("Wrote private/starter-backup.json (profile and settings answers; no token, no sessions, no targets).");
console.log("It is private. Do not commit it or send it anywhere except your own phone.");
