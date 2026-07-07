import { haversineMeters, projectOntoSegment } from "./geo";
import { LatLon, LocationSample, RouteProgressPoint } from "./types";

/**
 * MVP/demo route-position logic: nearest-segment projection onto the reference
 * polyline, not real map-matching. Good enough while the current trip roughly
 * follows the reference; a routing provider with map-matching replaces this
 * behind the same signatures.
 */

/** Distance from the reference path beyond which a position counts as off-route. */
export const OFF_ROUTE_THRESHOLD_METERS = 75;

/** Converts a recorded trip's samples into progress points (cumulative distance + elapsed time). */
export function buildProgressPoints(samples: LocationSample[]): RouteProgressPoint[] {
  if (samples.length === 0) return [];

  const startTime = samples[0].timestamp;
  const points: RouteProgressPoint[] = [];
  let cumulative = 0;

  for (let i = 0; i < samples.length; i += 1) {
    if (i > 0) {
      cumulative += haversineMeters(samples[i - 1], samples[i]);
    }
    points.push({
      lat: samples[i].lat,
      lon: samples[i].lon,
      cumulativeDistanceMeters: cumulative,
      elapsedSeconds: (samples[i].timestamp - startTime) / 1000,
    });
  }

  return points;
}

export function totalDistanceMeters(points: RouteProgressPoint[]): number {
  return points.length === 0 ? 0 : points[points.length - 1].cumulativeDistanceMeters;
}

export function totalDurationSeconds(points: RouteProgressPoint[]): number {
  return points.length === 0 ? 0 : points[points.length - 1].elapsedSeconds;
}

export interface RouteLocation {
  /** Distance along the reference route of the closest path point, meters. */
  progressMeters: number;
  /** Straight-line distance from the position to the reference path, meters. */
  distanceFromRouteMeters: number;
}

/**
 * Finds where a position sits along the reference route by projecting it onto
 * every segment and keeping the closest. O(n) per fix — fine at MVP sample
 * counts (a fix every few seconds over a drive).
 */
export function locateOnRoute(points: RouteProgressPoint[], position: LatLon): RouteLocation | null {
  if (points.length === 0) return null;
  if (points.length === 1) {
    return {
      progressMeters: 0,
      distanceFromRouteMeters: haversineMeters(points[0], position),
    };
  }

  let best: RouteLocation = { progressMeters: 0, distanceFromRouteMeters: Number.POSITIVE_INFINITY };

  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const projection = projectOntoSegment(position, a, b);

    if (projection.distanceMeters < best.distanceFromRouteMeters) {
      const segmentLength = b.cumulativeDistanceMeters - a.cumulativeDistanceMeters;
      best = {
        progressMeters: a.cumulativeDistanceMeters + projection.t * segmentLength,
        distanceFromRouteMeters: projection.distanceMeters,
      };
    }
  }

  return best;
}

/** Reference trip elapsed time at a given distance along the route, linearly interpolated. */
export function elapsedAtProgress(points: RouteProgressPoint[], progressMeters: number): number {
  if (points.length === 0) return 0;
  if (progressMeters <= 0) return points[0].elapsedSeconds;

  const last = points[points.length - 1];
  if (progressMeters >= last.cumulativeDistanceMeters) return last.elapsedSeconds;

  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    if (progressMeters <= b.cumulativeDistanceMeters) {
      const span = b.cumulativeDistanceMeters - a.cumulativeDistanceMeters;
      const fraction = span === 0 ? 0 : (progressMeters - a.cumulativeDistanceMeters) / span;
      return a.elapsedSeconds + fraction * (b.elapsedSeconds - a.elapsedSeconds);
    }
  }

  return last.elapsedSeconds;
}

/** Inverse of elapsedAtProgress: distance the reference had covered at a given elapsed time. */
export function progressAtElapsed(points: RouteProgressPoint[], elapsedSeconds: number): number {
  if (points.length === 0) return 0;
  if (elapsedSeconds <= points[0].elapsedSeconds) return points[0].cumulativeDistanceMeters;

  const last = points[points.length - 1];
  if (elapsedSeconds >= last.elapsedSeconds) return last.cumulativeDistanceMeters;

  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    if (elapsedSeconds <= b.elapsedSeconds) {
      const span = b.elapsedSeconds - a.elapsedSeconds;
      const fraction = span === 0 ? 0 : (elapsedSeconds - a.elapsedSeconds) / span;
      return a.cumulativeDistanceMeters + fraction * (b.cumulativeDistanceMeters - a.cumulativeDistanceMeters);
    }
  }

  return last.cumulativeDistanceMeters;
}
