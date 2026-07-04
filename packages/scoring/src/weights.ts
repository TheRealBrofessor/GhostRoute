import { FactorKey, RouteMode } from "./types";

/** Per-mode weight profiles. Each profile's weights sum to 1. */
export const MODE_WEIGHTS: Record<RouteMode, Record<FactorKey, number>> = {
  fastest: {
    time: 0.7,
    pathType: 0.15,
    lighting: 0.05,
    openness: 0.1,
  },
  balanced: {
    time: 0.35,
    pathType: 0.25,
    lighting: 0.2,
    openness: 0.2,
  },
  safest: {
    time: 0.15,
    pathType: 0.25,
    lighting: 0.35,
    openness: 0.25,
  },
};

export const FACTOR_LABELS: Record<FactorKey, string> = {
  time: "Travel time",
  pathType: "Path type",
  lighting: "Lighting",
  openness: "Openness",
};

export function weightsFor(mode: RouteMode): Record<FactorKey, number> {
  return MODE_WEIGHTS[mode];
}
