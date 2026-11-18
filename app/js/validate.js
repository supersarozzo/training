// Checks a data document (backup file or synced file) before the app uses it.
// A backup file is untrusted data: every known field is checked, nothing is trusted.
// Unknown fields are kept (a newer app version may add some), except dangerous key names.
// Pure: no page, no storage, no network.

export const FORMAT = 1;
const APP = "training";
const BAD_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const LISTS = ["sessions", "weighins", "measurements", "exercise_state", "gym_spots", "plan_days"];
// Lists added after the first version (additive, same format 1). A file without them is valid and comes back unchanged.
const OPTIONAL_LISTS = new Set(["gym_spots", "plan_days"]);
// Same list as LEFT_CHOICES in engine/week1.js (kept here so this file stays small; tests/review-low.test.mjs checks they match).
const LEFT_CHOICES = ["0-1", "2-3", "4-6", "7+"];
export const MAX_TEXT = 2000;

// Cut a text to the limit the check allows, without splitting an emoji in half.
// The app uses this before it saves a note, so it never saves what this file would refuse later.
export function clipText(value, max = MAX_TEXT) {
  let s = String(value ?? "");
  if (s.length <= max) return s;
  s = s.slice(0, max);
  const last = s.charCodeAt(s.length - 1);
  return last >= 0xd800 && last <= 0xdbff ? s.slice(0, -1) : s;
}

export function emptyDoc() {
  return {
    format: FORMAT,
    app: APP,
    profile: null,
    shared_settings: defaultSettings(),
    block: null,
    sessions: [],
    weighins: [],
    measurements: [],
    exercise_state: [],
    gym_spots: [],
    plan_days: [],
  };
}

export function defaultSettings() {
  return {
    updated_at: null,
    body_unit: "kg",
    dumbbell_steps_kg: [],
    stack_step_kg: { default: 0 },
    extra_machines: { lat_pulldown: null, seated_row: null, leg_curl: null, pec_deck: null, calf_raise: null },
    shortcut: { on: false, name: "Log Training" },
  };
}

class Bad extends Error {}
const fail = (msg) => { throw new Bad(msg); };

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isTime = (v) => typeof v === "string" && v.length <= 40 && !Number.isNaN(Date.parse(v));
const isDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

function text(v, where, { max = MAX_TEXT, allowEmpty = true } = {}) {
  if (typeof v !== "string") fail(`${where} must be text`);
  if (v.length > max) fail(`${where} is too long`);
  if (!allowEmpty && v.length === 0) fail(`${where} is empty`);
  return v;
}
function num(v, where, min, max) {
  if (typeof v !== "number" || !Number.isFinite(v)) fail(`${where} must be a number`);
  if (v < min || v > max) fail(`${where} is out of range`);
  return v;
}
const numOrNull = (v, where, min, max) => (v === null || v === undefined ? null : num(v, where, min, max));
function oneOf(v, list, where) {
  if (!list.includes(v)) fail(`${where} has an unknown value`);
  return v;
}

// Copy plain JSON only; drop dangerous key names; limit depth.
function clean(value, depth = 0) {
  if (depth > 12) fail("The file is nested too deeply");
  if (Array.isArray(value)) return value.map((x) => clean(x, depth + 1));
  if (isObj(value)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) if (!BAD_KEYS.has(k)) out[k] = clean(v, depth + 1);
    return out;
  }
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return value;
  fail("The file has a value that is not plain data");
}

function checkIntake(i) {
  if (!isObj(i)) fail("profile.intake must be an object");
  const out = { ...i };
  if ("q20_parq_all_no" in i && typeof i.q20_parq_all_no !== "boolean") fail("q20 must be yes or no");
  num(i.q21_age, "age", 16, 90);
  oneOf(i.q22_sex, ["male", "female", "unspecified"], "sex");
  num(i.q23_height_cm, "height", 120, 230);
  num(i.q24_weight_kg, "weight", 35, 250);
  oneOf(i.q25_unit ?? "kg", ["kg", "st"], "unit");
  oneOf(i.q26_goal, ["bulk", "recomp", "cut", "suggest"], "goal");
  out.q27_goal_weight_kg = numOrNull(i.q27_goal_weight_kg, "goal weight", 35, 250);
  out.q28_waist_cm = numOrNull(i.q28_waist_cm, "waist", 50, 200);
  oneOf(i.q29_focus ?? "balanced", ["balanced", "arms", "chest", "back", "shoulders", "legs"], "focus");
  oneOf(i.q30_activity, ["a", "b", "c", "d"], "activity");
  num(i.q31_sleep_h, "sleep", 3, 12);
  oneOf(i.q32_food, ["targets", "protein", "none"], "food");
  text(i.q33_diet ?? "", "diet", { max: 200 });
  if (typeof i.q34_scale !== "boolean") fail("q34 must be yes or no");
  text(i.q35_walk ?? "before", "walk placement", { max: 40 });
  oneOf(i.q36_walk_fit, ["yes", "not_sure", "no"], "walk fitness");
  if (!Array.isArray(i.q37_avoid) || i.q37_avoid.length > 50) fail("q37 must be a short list");
  out.q37_avoid = i.q37_avoid.map((x, n) => text(x, `avoid ${n + 1}`, { max: 100 }));
  if (typeof i.q38_photos !== "boolean") fail("q38 must be yes or no");
  return out;
}

function checkTargets(t) {
  if (t === null || t === undefined) return null;
  if (!isObj(t)) fail("profile.targets must be an object");
  const out = { ...t };
  out.kcal = numOrNull(t.kcal, "calories", 800, 6000);
  out.protein_g = numOrNull(t.protein_g, "protein", 20, 400);
  oneOf(t.goal, ["bulk", "recomp", "cut"], "target goal");
  oneOf(t.source, ["computed", "manual"], "target source");
  if (t.walk_start !== undefined) {
    if (!isObj(t.walk_start)) fail("walk_start must be an object");
    num(t.walk_start.speed_kmh, "walk speed", 2, 8);
    num(t.walk_start.slope_pct, "walk slope", 0, 15);
  }
  return out;
}

function checkProfile(p) {
  if (p === null || p === undefined) return null;
  if (!isObj(p)) fail("profile must be an object");
  const out = { ...p };
  if (!isTime(p.updated_at)) fail("profile.updated_at must be a time");
  out.intake = checkIntake(p.intake);
  out.targets = checkTargets(p.targets);
  return out;
}

function checkSettings(s) {
  const base = defaultSettings();
  if (s === null || s === undefined) return base;
  if (!isObj(s)) fail("shared_settings must be an object");
  const out = { ...base, ...s };
  if (s.updated_at !== null && s.updated_at !== undefined && !isTime(s.updated_at)) fail("shared_settings.updated_at must be a time");
  oneOf(out.body_unit, ["kg", "st"], "body unit");
  if (!Array.isArray(out.dumbbell_steps_kg) || out.dumbbell_steps_kg.length > 40) fail("dumbbell steps must be a short list");
  out.dumbbell_steps_kg = out.dumbbell_steps_kg.map((x, n) => num(x, `dumbbell step ${n + 1}`, 0.5, 100));
  if (!isObj(out.stack_step_kg)) fail("stack steps must be an object");
  for (const [k, v] of Object.entries(out.stack_step_kg)) num(v, `stack step ${k}`, 0, 50);
  if (!isObj(out.extra_machines)) fail("extra machines must be an object");
  for (const [k, v] of Object.entries(out.extra_machines)) if (v !== null && typeof v !== "boolean") fail(`machine ${k} must be yes, no or not checked`);
  if (!isObj(out.shortcut) || typeof out.shortcut.on !== "boolean") fail("shortcut settings are not valid");
  text(out.shortcut.name ?? "", "shortcut name", { max: 80 });
  return out;
}

function checkBlock(b) {
  if (b === null || b === undefined) return null;
  if (!isObj(b)) fail("block must be an object");
  if (!isTime(b.updated_at)) fail("block.updated_at must be a time");
  text(b.plan_id, "block plan", { max: 40 });
  num(b.number, "block number", 1, 1000);
  if (!isDate(b.start_monday)) fail("block start must be a date");
  return { ...b };
}

function checkSet(s, where) {
  if (!isObj(s)) fail(`${where} must be an object`);
  num(s.n, `${where} number`, 1, 50);
  oneOf(s.type, ["warmup", "work"], `${where} type`);
  numOrNull(s.weight_kg, `${where} weight`, 0, 1000);
  numOrNull(s.reps, `${where} reps`, 0, 1000);
  numOrNull(s.seconds, `${where} seconds`, 0, 3600);
  numOrNull(s.rir, `${where} reps left`, 0, 20);
  if (s.left !== undefined && s.left !== null) oneOf(s.left, LEFT_CHOICES, `${where} "how many more"`); // the week 1 screen needs a known answer
  return s;
}

function checkSession(s, where) {
  if (!isObj(s)) fail(`${where} must be an object`);
  text(s.id, `${where} id`, { max: 80, allowEmpty: false });
  if (!isTime(s.updated_at)) fail(`${where} updated_at must be a time`);
  if (s.deleted !== undefined && typeof s.deleted !== "boolean") fail(`${where} deleted must be true or false`);
  if (s.deleted) return s; // a tombstone needs nothing else
  if (!isDate(s.date)) fail(`${where} date must be a date`);
  oneOf(s.plan_day, ["mon", "tue", "wed", "thu", "fri"], `${where} day`);
  num(s.week, `${where} week`, 1, 1000);
  oneOf(s.kind, ["full", "short"], `${where} kind`);
  oneOf(s.status, ["in_progress", "finished", "abandoned"], `${where} status`);
  if (s.walk !== undefined && s.walk !== null) {
    if (!isObj(s.walk)) fail(`${where} walk must be an object`);
    numOrNull(s.walk.speed_kmh, `${where} walk speed`, 0, 20);
    numOrNull(s.walk.slope_pct, `${where} walk slope`, 0, 30);
    numOrNull(s.walk.minutes, `${where} walk minutes`, 0, 300);
    numOrNull(s.walk.effort, `${where} walk effort`, 0, 10);
  }
  if (!Array.isArray(s.exercises) || s.exercises.length > 40) fail(`${where} exercises must be a list`);
  s.exercises.forEach((e, n) => {
    const w = `${where} exercise ${n + 1}`;
    if (!isObj(e)) fail(`${w} must be an object`);
    text(e.slot, `${w} slot`, { max: 10 });
    text(e.plan_exercise, `${w} plan exercise`, { max: 60 });
    text(e.done_exercise, `${w} done exercise`, { max: 60 });
    text(e.note ?? "", `${w} note`);
    if (!Array.isArray(e.sets) || e.sets.length > 30) fail(`${w} sets must be a list`);
    e.sets.forEach((st, k) => checkSet(st, `${w} set ${k + 1}`));
  });
  text(s.note ?? "", `${where} note`);
  return s;
}

function checkRecord(r, where, extra) {
  if (!isObj(r)) fail(`${where} must be an object`);
  text(r.id, `${where} id`, { max: 80, allowEmpty: false });
  if (!isTime(r.updated_at)) fail(`${where} updated_at must be a time`);
  if (r.deleted !== undefined && typeof r.deleted !== "boolean") fail(`${where} deleted must be true or false`);
  if (!r.deleted && extra) extra(r);
  return r;
}

const CHECKS = {
  sessions: (r, n) => checkSession(r, `session ${n}`),
  weighins: (r, n) => checkRecord(r, `weigh-in ${n}`, (x) => {
    if (!isDate(x.date)) fail(`weigh-in ${n} date must be a date`);
    num(x.kg, `weigh-in ${n} weight`, 20, 400);
  }),
  measurements: (r, n) => checkRecord(r, `measurement ${n}`, (x) => {
    if (!isDate(x.date)) fail(`measurement ${n} date must be a date`);
    for (const k of ["waist_cm", "chest_cm", "arm_cm", "thigh_cm"]) numOrNull(x[k], `measurement ${n} ${k}`, 10, 300);
  }),
  exercise_state: (r, n) => checkRecord(r, `exercise state ${n}`, (x) => {
    numOrNull(x.start_weight_kg, `exercise state ${n} start weight`, 0, 1000);
    text(x.machine_note ?? "", `exercise state ${n} note`);
    numOrNull(x.fail_streak ?? 0, `exercise state ${n} fail streak`, 0, 100);
  }),
  gym_spots: (r, n) => checkRecord(r, `gym spot ${n}`, (x) => {
    text(x.machine, `gym spot ${n} machine`, { max: 60, allowEmpty: false });
    text(x.where ?? "", `gym spot ${n} note`);
  }),
  // Saved Plan edits (engine/planedits.js). Only the record itself is checked here: the slots are checked by the engine
  // before use, and a record it cannot use (for example from a newer app) is kept and synced, never refused or dropped.
  plan_days: (r, n) => checkRecord(r, `plan day ${n}`),
};

const MAX_RECORDS = 20000;

// Returns { ok: true, doc } with a clean copy, or { ok: false, error, tooNew? } in plain words.
export function validateDocument(raw) {
  try {
    if (!isObj(raw)) fail("The file is not a training backup");
    if (raw.app !== APP) fail("The file is not a training backup");
    if (typeof raw.format !== "number" || !Number.isInteger(raw.format) || raw.format < 1) fail("The file has no valid format number");
    if (raw.format > FORMAT) return { ok: false, tooNew: true, error: "The file is from a newer version of the app. Update the app first." };
    const src = clean(raw);
    const doc = {
      ...src,
      format: FORMAT,
      app: APP,
      profile: checkProfile(src.profile),
      shared_settings: checkSettings(src.shared_settings),
      block: checkBlock(src.block),
    };
    delete doc.device; // never load device data (token) from a file
    delete doc.token;
    for (const name of LISTS) {
      if (OPTIONAL_LISTS.has(name) && src[name] === undefined) continue; // old data stays exactly as it was
      const list = src[name] ?? [];
      if (!Array.isArray(list)) fail(`${name} must be a list`);
      if (list.length > MAX_RECORDS) fail(`${name} has too many records`);
      doc[name] = list.map((r, n) => CHECKS[name](r, n + 1));
    }
    return { ok: true, doc };
  } catch (e) {
    if (e instanceof Bad) return { ok: false, error: `${e.message[0].toUpperCase()}${e.message.slice(1)}${e.message.endsWith(".") ? "" : "."}` };
    throw e;
  }
}
