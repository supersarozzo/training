// Made-up people for tests. None of these is a real person. Never put real numbers here.
export function intake(overrides = {}) {
  return {
    q20_parq_all_no: true,
    q21_age: 30,
    q22_sex: "male",
    q23_height_cm: 175,
    q24_weight_kg: 80,
    q25_unit: "kg",
    q26_goal: "cut",
    q27_goal_weight_kg: null,
    q28_waist_cm: null,
    q29_focus: "balanced",
    q30_activity: "a",
    q31_sleep_h: 7,
    q32_food: "targets",
    q33_diet: "no_limits",
    q34_scale: true,
    q35_walk: "before",
    q36_walk_fit: "no",
    q37_avoid: [],
    q38_photos: true,
    ...overrides,
  };
}

// A small person: the calorie floor must apply.
export const smallWoman = () => intake({ q21_age: 60, q22_sex: "female", q23_height_cm: 150, q24_weight_kg: 45, q26_goal: "cut" });
// BMI over 30: protein uses the weight at BMI 25.
export const heavyPerson = () => intake({ q23_height_cm: 165, q24_weight_kg: 95, q26_goal: "cut" });
// BMI under 20: no cut is offered.
export const slimPerson = () => intake({ q23_height_cm: 180, q24_weight_kg: 60, q26_goal: "cut" });

export function validDoc() {
  return {
    format: 1,
    app: "training",
    profile: { updated_at: "2026-01-05T08:00:00.000Z", intake: intake(), targets: null },
    shared_settings: { updated_at: "2026-01-05T08:00:00.000Z", body_unit: "kg", dumbbell_steps_kg: [2, 4, 6], stack_step_kg: { default: 5 }, extra_machines: { lat_pulldown: true, seated_row: null, leg_curl: false, pec_deck: null, calf_raise: null }, shortcut: { on: false, name: "Log Training" } },
    block: { updated_at: "2026-01-05T08:00:00.000Z", plan_id: "plan-v2", number: 1, start_monday: "2026-01-12" },
    sessions: [],
    weighins: [{ id: "w-2026-01-05", updated_at: "2026-01-05T07:00:00.000Z", date: "2026-01-05", kg: 80.4 }],
    measurements: [],
    exercise_state: [],
  };
}

// A fake localStorage. `limit` = max number of characters in total, then it throws like a full phone.
export function fakeStorage(limit = Infinity) {
  const map = new Map();
  const size = () => [...map.values()].reduce((n, v) => n + v.length, 0);
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem(k, v) {
      const next = size() - (map.get(k)?.length ?? 0) + String(v).length;
      if (next > limit) { const e = new Error("full"); e.name = "QuotaExceededError"; throw e; }
      map.set(k, String(v));
    },
    removeItem: (k) => map.delete(k),
  };
}
