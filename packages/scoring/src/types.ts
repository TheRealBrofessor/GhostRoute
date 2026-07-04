export type TravelMode = "walk" | "bike" | "drive";

export type RouteMode = "fastest" | "balanced" | "safest";

export type FactorKey = "time" | "pathType" | "lighting" | "openness";

/** Coarse OSM `highway=*` classification, collapsed to what the scorer cares about. */
export type PathType =
  | "footway"
  | "pedestrian"
  | "cycleway"
  | "path"
  | "living_street"
  | "residential"
  | "service"
  | "tertiary"
  | "secondary"
  | "primary"
  | "trunk"
  | "unclassified"
  | "unknown";

/** Proxy for OSM `lit=*`. `unknown` means the tag was absent, not that it's unlit. */
export type LightingTag = "yes" | "sunset-sunrise" | "no" | "unknown";

/** Proxy for surrounding openness (frontage/landuse density vs. walled/isolated). */
export type OpennessTag = "open" | "moderate" | "enclosed" | "unknown";

/**
 * A single leg of a candidate route, as derived from OSM way data.
 * Any optional/tag-derived field left `undefined` degrades that segment's
 * confidence rather than being treated as a bad score.
 */
export interface RouteSegment {
  id: string;
  distanceMeters: number;
  durationSeconds: number;
  pathType: PathType;
  lighting?: LightingTag;
  openness?: OpennessTag;
  /** Free-flow reference speed for this segment/travel mode, km/h, if known from OSM tags. */
  referenceSpeedKph?: number;
}

export interface FactorScore {
  factor: FactorKey;
  /** 0-100, higher is better along that dimension. */
  score: number;
  /** Mode-specific weight applied to this factor, 0-1. */
  weight: number;
  /** score * weight, contribution to the overall 0-100 score. */
  contribution: number;
  /** 0-1, how much real tag data backed this factor vs. neutral defaults. */
  confidence: number;
  label: string;
}

export interface ConfidenceDisclosure {
  /** 0-1 overall confidence, distance-weighted across segments and factors. */
  overall: number;
  byFactor: Record<FactorKey, number>;
  /** Human-readable notes about which factors used fallback/neutral defaults. */
  degradedFactors: FactorKey[];
}

export interface RouteScore {
  score: number;
  mode: RouteMode;
  travelMode: TravelMode;
  factors: FactorScore[];
  confidence: ConfidenceDisclosure;
  distanceMeters: number;
  durationSeconds: number;
}

export interface ScoredRouteCandidate {
  id: string;
  segments: RouteSegment[];
  distanceMeters: number;
  durationSeconds: number;
  /** One-line human summary, e.g. "Mostly lit residential streets, avoids the highway on-ramp." */
  summary: string;
}

/** A candidate route plus its computed score, ready for the route cards UI. */
export interface RankedRoute {
  id: string;
  summary: string;
  distanceMeters: number;
  durationSeconds: number;
  score: RouteScore;
}
