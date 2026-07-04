import { LightingTag, OpennessTag, PathType, RouteSegment, TravelMode } from "./types";

export interface FactorResult {
  score: number;
  /** 1 when backed by real tag data, 0 when a neutral default was used. */
  confidence: number;
}

/**
 * Free-flow reference speed (km/h) by travel mode and path type, used when a
 * segment doesn't carry its own `referenceSpeedKph`. These are deliberately
 * conservative midpoints, not authoritative — they only feed the *relative*
 * pace comparison, not an absolute ETA.
 */
const DEFAULT_REFERENCE_SPEED_KPH: Record<TravelMode, Record<PathType, number>> = {
  walk: {
    footway: 5, pedestrian: 5, cycleway: 4.5, path: 4.5, living_street: 4.5,
    residential: 4.5, service: 4, tertiary: 4, secondary: 3.5, primary: 3,
    trunk: 2.5, unclassified: 4, unknown: 4,
  },
  bike: {
    footway: 10, pedestrian: 8, cycleway: 18, path: 12, living_street: 14,
    residential: 16, service: 14, tertiary: 17, secondary: 18, primary: 18,
    trunk: 16, unclassified: 15, unknown: 14,
  },
  drive: {
    footway: 10, pedestrian: 10, cycleway: 20, path: 15, living_street: 20,
    residential: 30, service: 20, tertiary: 40, secondary: 45, primary: 55,
    trunk: 70, unclassified: 30, unknown: 35,
  },
};

/**
 * Rewards segments that are moving close to (or better than) free-flow pace,
 * i.e. a proxy for "not congested/blocked", not raw speed. A slow footway
 * segment isn't penalized just for being a footway — only for being slower
 * than a footway should be.
 */
export function scoreTime(segment: RouteSegment, travelMode: TravelMode): FactorResult {
  if (segment.distanceMeters <= 0 || segment.durationSeconds <= 0) {
    return { score: 50, confidence: 0 };
  }
  const actualSpeedKph = segment.distanceMeters / 1000 / (segment.durationSeconds / 3600);
  const referenceSpeedKph =
    segment.referenceSpeedKph ?? DEFAULT_REFERENCE_SPEED_KPH[travelMode][segment.pathType];
  const confidence = segment.referenceSpeedKph !== undefined ? 1 : 0.5;
  const ratio = actualSpeedKph / referenceSpeedKph;
  const score = clamp(ratio * 100, 0, 100);
  return { score, confidence };
}

/**
 * Suitability of the underlying way type for the chosen travel mode —
 * dedicated infrastructure scores highest, high-speed arterials lowest.
 */
const PATH_TYPE_SCORES: Record<TravelMode, Record<PathType, number>> = {
  walk: {
    footway: 95, pedestrian: 95, living_street: 85, path: 70, residential: 75,
    service: 55, cycleway: 60, unclassified: 55, tertiary: 45, secondary: 30,
    primary: 15, trunk: 5, unknown: 50,
  },
  bike: {
    cycleway: 95, path: 75, living_street: 85, residential: 70, footway: 40,
    pedestrian: 35, service: 55, unclassified: 55, tertiary: 50, secondary: 35,
    primary: 20, trunk: 8, unknown: 50,
  },
  drive: {
    residential: 80, living_street: 65, service: 60, tertiary: 80, secondary: 82,
    primary: 78, trunk: 70, unclassified: 60, cycleway: 10, footway: 5,
    pedestrian: 5, path: 10, unknown: 50,
  },
};

export function scorePathType(segment: RouteSegment, travelMode: TravelMode): FactorResult {
  const score = PATH_TYPE_SCORES[travelMode][segment.pathType];
  const confidence = segment.pathType === "unknown" ? 0 : 1;
  return { score, confidence };
}

const LIGHTING_SCORES: Record<LightingTag, number> = {
  yes: 90,
  "sunset-sunrise": 70,
  no: 20,
  unknown: 50,
};

export function scoreLighting(segment: RouteSegment): FactorResult {
  const tag = segment.lighting ?? "unknown";
  return { score: LIGHTING_SCORES[tag], confidence: tag === "unknown" ? 0 : 1 };
}

const OPENNESS_SCORES: Record<OpennessTag, number> = {
  open: 85,
  moderate: 60,
  enclosed: 25,
  unknown: 50,
};

export function scoreOpenness(segment: RouteSegment): FactorResult {
  const tag = segment.openness ?? "unknown";
  return { score: OPENNESS_SCORES[tag], confidence: tag === "unknown" ? 0 : 1 };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
