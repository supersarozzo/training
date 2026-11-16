// Body weight is stored in kg. Stones and pounds are only for showing and typing.
import { kgToStonesPounds } from "../engine/nutrition.js";

export function formatBody(kg, unit = "kg") {
  if (kg === null || kg === undefined || Number.isNaN(kg)) return "–";
  if (unit === "st") {
    const { stones, pounds } = kgToStonesPounds(kg);
    return `${stones} st ${Math.round(pounds * 10) / 10} lb`;
  }
  return `${(Math.round(kg * 10) / 10).toFixed(1)} kg`;
}

// A kg change shown with a sign, in the chosen unit ("−0.6 kg", "−1.3 lb").
export function formatChange(kgChange, unit = "kg") {
  if (kgChange === null || kgChange === undefined) return "–";
  const value = unit === "st" ? kgChange * 2.2046226218 : kgChange;
  const text = (Math.round(Math.abs(value) * 10) / 10).toFixed(1);
  const sign = value < -0.049 ? "−" : value > 0.049 ? "+" : "";
  return `${sign}${text} ${unit === "st" ? "lb" : "kg"}`;
}
