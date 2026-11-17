// Made-up demo data for the screenshots (not a real person; no real body numbers).
// Run in the page's console at http://localhost:8103/?date=2026-11-23 then reload:
//   await (await import("/../screens/seed-demo.js")) — or paste this whole file into the console.
// It fills weeks 1 to 3 (block start Monday 2026-11-02) with finished workouts, weigh-ins and a few gym notes.
(async () => {
  const { planForDay } = await import("/js/engine/schedule.js");
  const { exercises, DAY_IDS } = await import("/js/plan/plan-v2.js");
  const T = (date, hh = 18) => `${date}T${String(hh).padStart(2, "0")}:00:00.000Z`;
  const addDays = (d, n) => { const t = new Date(`${d}T12:00:00Z`); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
  const base = { chest_press: 30, pulldown: 35, shoulder_press_machine: 20, one_arm_db_row: 14, db_curl: 8, triceps_pushdown: 20, leg_press: 60, cable_crunch: 25, romanian_deadlift: 14, face_pull: 15, hip_thrust: 30, leg_extension: 25, goblet_squat: 14, db_bench_press: 14, lateral_raise: 6, hammer_curl: 8, overhead_triceps_ext: 15, incline_db_press: 12, seated_cable_row: 35, seated_db_shoulder_press: 10, smith_squat: 30, cable_pull_through: 20, calf_raise_standing: 30 };
  const sessions = [];
  const start = "2026-11-02";
  for (let week = 1; week <= 3; week++) {
    DAY_IDS.forEach((day, i) => {
      if (week === 3 && day === "wed") return; // one missed day, to show the week strip
      const date = addDays(start, (week - 1) * 7 + i);
      const plan = planForDay(day, week, "full");
      sessions.push({
        id: `s-${date.replace(/-/g, "")}-demo${week}${i}`, updated_at: T(date, 19), date, plan_day: day, week, kind: "full", swapped_from: null,
        status: "finished", started_at: T(date, 17), finished_at: T(date, 18), walk: { speed_kmh: 5 + week * 0.1, slope_pct: 5 + week, minutes: 30, effort: 6, distance_km: null, avg_hr: null },
        exercises: plan.slots.map((s) => {
          const ex = exercises[s.ex];
          const w = ex.step === "bodyweight" ? 0 : (base[s.ex] ?? 10) + (week - 1) * (ex.step === "dumbbell" ? 2 : 2.5);
          return {
            slot: s.slot, plan_exercise: s.ex, done_exercise: s.ex, swap_reason: null, note: "",
            sets: Array.from({ length: s.sets }, (_, k) => ({ n: k + 1, type: "work", weight_kg: w, reps: ex.kind === "hold" ? null : Math.max(ex.range[0], ex.range[1] - k - (week === 1 ? 2 : 0)), seconds: ex.kind === "hold" ? ex.range[0] + week * 5 : null, rir: 2, done_at: T(date, 17) })),
          };
        }),
        effort: 6, note: "",
      });
    });
  }
  const weighins = [];
  for (let d = 0; d < 21; d++) {
    const date = addDays(start, d);
    weighins.push({ id: `w-${date}`, updated_at: T(date, 7), date, kg: Math.round((84 - d * 0.07 + Math.sin(d * 1.7) * 0.4) * 10) / 10 });
  }
  const doc = {
    format: 1, app: "training",
    profile: { updated_at: T(start, 8), intake: { q20_parq_all_no: true, q21_age: 35, q22_sex: "male", q23_height_cm: 178, q24_weight_kg: 84, q25_unit: "kg", q26_goal: "cut", q27_goal_weight_kg: null, q28_waist_cm: null, q29_focus: "balanced", q30_activity: "a", q31_sleep_h: 7, q32_food: "targets", q33_diet: "no_limits", q34_scale: true, q35_walk: "before", q36_walk_fit: "not_sure", q37_avoid: [], q38_photos: true },
      targets: { kcal: 2100, protein_g: 150, goal: "cut", source: "computed", walk_start: { speed_kmh: 4.5, slope_pct: 4 } } },
    shared_settings: { updated_at: T(start, 8), body_unit: "kg", dumbbell_steps_kg: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20], stack_step_kg: { default: 2.5 }, extra_machines: { lat_pulldown: true, seated_row: null, leg_curl: false, pec_deck: null, calf_raise: null }, shortcut: { on: false, name: "Log Training" } },
    block: { updated_at: T(start, 8), plan_id: "plan-v2", number: 1, start_monday: start },
    sessions, weighins, measurements: [{ id: "m-20261102-demo01", updated_at: T(start, 7), date: start, waist_cm: 92, chest_cm: 102, arm_cm: 34, thigh_cm: 58 }],
    exercise_state: [],
    gym_spots: [
      { id: "g-chest_press", updated_at: T(start, 9), machine: "chest_press", where: "Resistance area, second row, next to the pillar" },
      { id: "g-treadmill", updated_at: T(start, 9), machine: "treadmill", where: "Front windows, row of 10" },
      { id: "g-cable_station", updated_at: T(start, 9), machine: "cable_station", where: "Middle of the gym, two of them" },
    ],
  };
  localStorage.setItem("trn.data.v1", JSON.stringify(doc));
  localStorage.setItem("trn.device.v1", JSON.stringify({ install_hint_dismissed: true }));
  return "seeded";
})();
