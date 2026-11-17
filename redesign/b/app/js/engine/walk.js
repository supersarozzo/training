// Walk rules. Pure. Starting settings (build step 3) and walk progress (build step 4).
// Source: plan v2 sections 3, 4, 9 and WORKFLOW B5.
import { walkRules } from "../plan/plan-v2.js";

const round1 = (n) => Math.round(n * 10) / 10;

// Starting settings from intake question 36 ("yes" | "not_sure" | "no") for a normal day or a leg day.
// The plan starts at the low end of each range; leg days get 2 % less slope.
export function startWalk(walkFit, legDay = false) {
  const row = walkRules.start[walkFit];
  if (!row) throw new Error(`Unknown walk answer: ${walkFit}`);
  const slope = Math.max(row.slope_pct - (legDay ? walkRules.legDaySlopeLess_pct : 0), 0);
  return {
    speed_kmh: row.speed_kmh,
    slope_pct: slope,
    minutes: row.startMinutes || walkRules.minutes,
    buildUp: { ...walkRules.buildUp },
  };
}

// Energy of the walk in METs (ACSM walking formula): VO2 = 0.1 v + 1.8 v g + 3.5, with v in m/min and g as a fraction.
export function walkMets(speed_kmh, slope_pct) {
  const v = (speed_kmh * 1000) / 60;
  const vo2 = 0.1 * v + 1.8 * v * (slope_pct / 100) + 3.5;
  return round1(vo2 / 3.5);
}

// ---------- Walk progress (build step 4) ----------

// Plan v2 section 9: two walks in a row at effort 5 of 10 or easier -> add 1 % slope (up to 12 %),
// then 0.2 km/h speed (up to about 6 km/h). Leg days stay 2 % below the other days.
// Section 3: if the walk ended out of breath, the next walk is 1 % less steep.
// `base` is the normal-day setting {speed_kmh, slope_pct}. `recent` lists finished walks, newest last:
// { effort, breathless?, speed_kmh, slope_pct }.
export function nextWalkBase(base, recent, { allowProgress = true } = {}) {
  const last = recent[recent.length - 1];
  let { speed_kmh, slope_pct } = base;
  let reason = "same";
  if (last && last.breathless) {
    slope_pct = Math.max(slope_pct - 1, 0);
    reason = "breathless";
  } else if (allowProgress && recent.length >= 2) {
    const [a, b] = recent.slice(-2);
    if (a.effort <= 5 && b.effort <= 5) {
      if (slope_pct < walkRules.maxSlope_pct) {
        slope_pct += walkRules.slopeStep_pct;
        reason = "slope";
      } else if (speed_kmh < walkRules.maxSpeed_kmh) {
        speed_kmh = round1(Math.min(speed_kmh + walkRules.speedStep_kmh, walkRules.maxSpeed_kmh));
        reason = "speed";
      }
    }
  }
  return { speed_kmh, slope_pct, reason };
}

// The setting for a given day from the normal-day base.
export function walkForDay(base, legDay) {
  const slope = Math.max(base.slope_pct - (legDay ? walkRules.legDaySlopeLess_pct : 0), 0);
  return { speed_kmh: base.speed_kmh, slope_pct: slope, effortRange: legDay ? walkRules.legDayEffort : walkRules.normalEffort };
}

// Missed-time rule for the walk (plan v2 section 11).
// 2 to 4 weeks away: 2 % less slope for a week. More than 4 weeks: back to the starting settings.
export function walkAfterBreak(base, startBase, breakKind) {
  if (breakKind === "weeks_2_4") return { speed_kmh: base.speed_kmh, slope_pct: Math.max(base.slope_pct - 2, 0) };
  if (breakKind === "over_4_weeks") return { speed_kmh: startBase.speed_kmh, slope_pct: startBase.slope_pct };
  return { speed_kmh: base.speed_kmh, slope_pct: base.slope_pct };
}
