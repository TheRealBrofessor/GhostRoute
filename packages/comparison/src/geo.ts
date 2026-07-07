import { LatLon } from "./types";

const EARTH_RADIUS_METERS = 6_371_000;
const METERS_PER_DEGREE_LAT = 111_320;

export function haversineMeters(a: LatLon, b: LatLon): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

/**
 * Local equirectangular projection to meters around a reference latitude.
 * Accurate enough at trip scale (a few km) for point-to-segment math; this is
 * deliberately not full map-matching — see locateOnRoute in progress.ts.
 */
function toLocalMeters(p: LatLon, refLatRad: number): { x: number; y: number } {
  return {
    x: p.lon * METERS_PER_DEGREE_LAT * Math.cos(refLatRad),
    y: p.lat * METERS_PER_DEGREE_LAT,
  };
}

export interface SegmentProjection {
  /** 0-1 position of the closest point along the segment a->b. */
  t: number;
  /** Distance from the query point to that closest point, meters. */
  distanceMeters: number;
}

/** Projects point p onto segment a->b in a local planar approximation. */
export function projectOntoSegment(p: LatLon, a: LatLon, b: LatLon): SegmentProjection {
  const refLatRad = (a.lat * Math.PI) / 180;
  const P = toLocalMeters(p, refLatRad);
  const A = toLocalMeters(a, refLatRad);
  const B = toLocalMeters(b, refLatRad);

  const abx = B.x - A.x;
  const aby = B.y - A.y;
  const lengthSq = abx * abx + aby * aby;

  const t =
    lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((P.x - A.x) * abx + (P.y - A.y) * aby) / lengthSq));

  const cx = A.x + t * abx;
  const cy = A.y + t * aby;
  const dx = P.x - cx;
  const dy = P.y - cy;

  return { t, distanceMeters: Math.sqrt(dx * dx + dy * dy) };
}
