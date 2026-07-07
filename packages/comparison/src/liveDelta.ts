import {
  OFF_ROUTE_THRESHOLD_METERS,
  elapsedAtProgress,
  locateOnRoute,
  totalDistanceMeters,
} from "./progress";
import { LatLon, LiveGhostDelta, RouteProgressPoint } from "./types";

/** Deltas within this band read as "on pace" rather than ahead/behind. */
const ON_PACE_BAND_SECONDS = 5;

/** Formats seconds as m:ss (or h:mm:ss past an hour). */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(Math.abs(totalSeconds)));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * Neutral, passive delta wording. Positive = behind the reference,
 * negative = ahead of the reference. Deliberately avoids competitive or
 * speed-prompting language.
 */
export function formatLiveDelta(deltaSeconds: number): string {
  if (Math.abs(deltaSeconds) <= ON_PACE_BAND_SECONDS) {
    return "on pace with reference";
  }
  const clock = formatClock(deltaSeconds);
  return deltaSeconds > 0 ? `+${clock} behind reference` : `-${clock} ahead of reference`;
}

/**
 * Computes the live comparison for one position fix.
 *
 * The delta compares route progress: it asks "when the reference trip was at
 * this same point along the route, what did its clock read?" and subtracts
 * that from the current trip's elapsed time. It never looks at instantaneous
 * speed, so it cannot reward speeding — only overall route efficiency shows up.
 */
export function computeLiveDelta(
  reference: RouteProgressPoint[],
  position: LatLon,
  currentElapsedSeconds: number
): LiveGhostDelta | null {
  const location = locateOnRoute(reference, position);
  if (!location) return null;

  const referenceElapsedSeconds = elapsedAtProgress(reference, location.progressMeters);
  const total = totalDistanceMeters(reference);
  const deltaSeconds = currentElapsedSeconds - referenceElapsedSeconds;

  return {
    deltaSeconds,
    progressMeters: location.progressMeters,
    progressFraction: total > 0 ? Math.min(1, location.progressMeters / total) : 0,
    referenceElapsedSeconds,
    currentElapsedSeconds,
    distanceFromRouteMeters: location.distanceFromRouteMeters,
    offRoute: location.distanceFromRouteMeters > OFF_ROUTE_THRESHOLD_METERS,
    label: formatLiveDelta(deltaSeconds),
  };
}
