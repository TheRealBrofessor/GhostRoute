import { RouteSegment } from "../types";
import { formatDistance } from "./format";

const PATH_TYPE_PHRASES: Record<string, string> = {
  footway: "Continue on the footpath",
  pedestrian: "Continue on the pedestrian path",
  cycleway: "Continue on the bike lane",
  path: "Continue on the path",
  living_street: "Continue on the local street",
  residential: "Continue on the residential street",
  service: "Continue on the service road",
  tertiary: "Continue on the road",
  secondary: "Continue on the main road",
  primary: "Continue on the primary road",
  trunk: "Continue on the highway",
  unclassified: "Continue straight",
  unknown: "Continue straight",
};

export interface NavigationStep {
  id: string;
  instruction: string;
  distanceLabel: string;
}

/** Turns raw route segments into simple turn-by-turn style instructions for the Navigation screen. */
export function buildSteps(segments: RouteSegment[]): NavigationStep[] {
  return segments.map((segment, index) => ({
    id: segment.id,
    instruction:
      index === segments.length - 1
        ? "Arrive at your destination"
        : PATH_TYPE_PHRASES[segment.pathType] ?? "Continue straight",
    distanceLabel: formatDistance(segment.distanceMeters),
  }));
}
