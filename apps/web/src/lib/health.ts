import type { V3PositionRaw } from "./api.js";

export type Health = "green" | "amber" | "red";

// Placeholder heuristic until phase 3 IL math lands. We use the raw
// collected fees vs deposited tokens as a quick proxy. Real classification
// will come from the agent's IL reconstruction output.
export function classifyHealth(p: V3PositionRaw): Health {
  const dep0 = parseFloat(p.depositedToken0);
  const dep1 = parseFloat(p.depositedToken1);
  const fee0 = parseFloat(p.collectedFeesToken0);
  const fee1 = parseFloat(p.collectedFeesToken1);
  const total = dep0 + dep1;
  if (total === 0) return "amber";
  const ratio = (fee0 + fee1) / total;
  if (ratio > 0.005) return "green";
  if (ratio > 0) return "amber";
  return "red";
}

export const HEALTH_COLORS: Record<Health, string> = {
  green: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  amber: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  red: "bg-rose-500/20 text-rose-300 border-rose-500/40",
};
