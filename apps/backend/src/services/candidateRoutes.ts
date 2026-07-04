import { PathType, ScoredRouteCandidate, TravelMode } from "@ghostroute/scoring";
import { LatLon } from "../types";

const EARTH_RADIUS_METERS = 6_371_000;

function haversineMeters(a: LatLon, b: LatLon): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

const REFERENCE_SPEED_KPH: Record<TravelMode, number> = {
  walk: 4.5,
  bike: 16,
  drive: 40,
};

interface Archetype {
  id: string;
  summary: string;
  /** Multiplier applied to the direct-line distance to approximate routing detour. */
  distanceMultiplier: number;
  segmentPlan: Array<{
    share: number;
    pathType: PathType;
    lighting: "yes" | "no" | "sunset-sunrise" | "unknown";
    openness: "open" | "moderate" | "enclosed" | "unknown";
    /** Relative pace vs. reference speed, 1 = free-flow. */
    paceFactor: number;
  }>;
}

const ARCHETYPES: Archetype[] = [
  {
    id: "arterial",
    summary: "Most direct route, mostly along main roads.",
    distanceMultiplier: 1.05,
    segmentPlan: [
      { share: 0.15, pathType: "residential", lighting: "yes", openness: "open", paceFactor: 0.95 },
      { share: 0.6, pathType: "primary", lighting: "sunset-sunrise", openness: "open", paceFactor: 0.85 },
      { share: 0.25, pathType: "secondary", lighting: "yes", openness: "moderate", paceFactor: 0.9 },
    ],
  },
  {
    id: "residential-mix",
    summary: "Balanced mix of residential streets, avoids the busiest roads.",
    distanceMultiplier: 1.15,
    segmentPlan: [
      { share: 0.4, pathType: "residential", lighting: "yes", openness: "open", paceFactor: 0.9 },
      { share: 0.3, pathType: "tertiary", lighting: "yes", openness: "moderate", paceFactor: 0.9 },
      { share: 0.3, pathType: "residential", lighting: "unknown", openness: "moderate", paceFactor: 0.85 },
    ],
  },
  {
    id: "well-lit-detour",
    summary: "Longer but stays on well-lit, open streets the whole way.",
    distanceMultiplier: 1.3,
    segmentPlan: [
      { share: 0.5, pathType: "residential", lighting: "yes", openness: "open", paceFactor: 0.85 },
      { share: 0.3, pathType: "living_street", lighting: "yes", openness: "open", paceFactor: 0.8 },
      { share: 0.2, pathType: "footway", lighting: "yes", openness: "open", paceFactor: 0.75 },
    ],
  },
];

/**
 * Stands in for a real OSRM (routing) + Overpass (OSM tag) pipeline. Produces
 * plausible candidate routes sized from the origin/destination great-circle
 * distance, each following a distinct archetype (direct/arterial, balanced
 * residential mix, well-lit detour) so the scoring engine has real variation
 * to differentiate between Fastest / Balanced / Safest.
 */
export function generateCandidateRoutes(
  origin: LatLon,
  destination: LatLon,
  travelMode: TravelMode
): ScoredRouteCandidate[] {
  const directDistance = Math.max(haversineMeters(origin, destination), 50);
  const referenceSpeedKph = REFERENCE_SPEED_KPH[travelMode];

  return ARCHETYPES.map((archetype) => {
    const totalDistance = directDistance * archetype.distanceMultiplier;

    const segments = archetype.segmentPlan.map((plan, index) => {
      const distanceMeters = totalDistance * plan.share;
      const speedKph = referenceSpeedKph * plan.paceFactor;
      const durationSeconds = (distanceMeters / 1000 / speedKph) * 3600;

      return {
        id: `${archetype.id}-${index}`,
        distanceMeters,
        durationSeconds,
        pathType: plan.pathType,
        lighting: plan.lighting,
        openness: plan.openness,
        referenceSpeedKph: referenceSpeedKph * plan.paceFactor,
      };
    });

    return {
      id: archetype.id,
      segments,
      distanceMeters: totalDistance,
      durationSeconds: segments.reduce((total, s) => total + s.durationSeconds, 0),
      summary: archetype.summary,
    };
  });
}
