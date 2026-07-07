import { formatClock } from "./liveDelta";
import {
  OFF_ROUTE_THRESHOLD_METERS,
  buildProgressPoints,
  elapsedAtProgress,
  locateOnRoute,
  totalDistanceMeters,
} from "./progress";
import {
  GhostRouteReference,
  RouteProgressPoint,
  TripComparison,
  TripRecord,
  TripSegmentDelta,
} from "./types";

const DEFAULT_SEGMENT_COUNT = 8;

/**
 * Elapsed time of the current trip at each distance-along-reference boundary.
 * Maps every current sample to its reference progress, forced monotonic so a
 * brief off-route wobble can't make progress run backwards.
 */
function currentElapsedByProgress(
  reference: RouteProgressPoint[],
  current: RouteProgressPoint[]
): Array<{ progressMeters: number; elapsedSeconds: number; distanceFromRouteMeters: number }> {
  const mapped: Array<{ progressMeters: number; elapsedSeconds: number; distanceFromRouteMeters: number }> = [];
  let maxProgress = 0;

  for (const sample of current) {
    const location = locateOnRoute(reference, sample);
    if (!location) continue;
    maxProgress = Math.max(maxProgress, location.progressMeters);
    mapped.push({
      progressMeters: maxProgress,
      elapsedSeconds: sample.elapsedSeconds,
      distanceFromRouteMeters: location.distanceFromRouteMeters,
    });
  }

  return mapped;
}

function interpolateElapsed(
  mapped: Array<{ progressMeters: number; elapsedSeconds: number }>,
  progressMeters: number
): number | null {
  if (mapped.length === 0) return null;
  if (progressMeters > mapped[mapped.length - 1].progressMeters) return null;
  if (progressMeters <= mapped[0].progressMeters) return mapped[0].elapsedSeconds;

  for (let i = 0; i < mapped.length - 1; i += 1) {
    const a = mapped[i];
    const b = mapped[i + 1];
    if (progressMeters <= b.progressMeters) {
      const span = b.progressMeters - a.progressMeters;
      const fraction = span === 0 ? 0 : (progressMeters - a.progressMeters) / span;
      return a.elapsedSeconds + fraction * (b.elapsedSeconds - a.elapsedSeconds);
    }
  }

  return mapped[mapped.length - 1].elapsedSeconds;
}

/**
 * Route consistency, 0-100: how evenly the trip's pace tracked the reference
 * across segments. 100 = identical pace ratio everywhere; large swings between
 * segments lower it. A neutral measure — a uniformly slower trip still scores high.
 */
export function consistencyScore(segments: TripSegmentDelta[]): number {
  const usable = segments.filter((s) => s.referenceDurationSeconds > 0);
  if (usable.length === 0) return 0;

  const ratios = usable.map((s) => s.currentDurationSeconds / s.referenceDurationSeconds);
  const mean = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
  const variance = ratios.reduce((sum, r) => sum + (r - mean) ** 2, 0) / ratios.length;
  const std = Math.sqrt(variance);

  return Math.max(0, Math.min(100, Math.round(100 - std * 200)));
}

/**
 * Full post-drive comparison of a trip against a saved reference.
 * All wording in notes/insights stays neutral and descriptive — insights
 * describe where time differed, never suggest driving faster.
 */
export function compareTrips(reference: GhostRouteReference, current: TripRecord): TripComparison {
  const referencePoints = buildProgressPoints(reference.trip.samples);
  const currentPoints = buildProgressPoints(current.samples);
  const referenceTotal = totalDistanceMeters(referencePoints);

  const mapped = currentElapsedByProgress(referencePoints, currentPoints);
  const reachedMeters = mapped.length > 0 ? mapped[mapped.length - 1].progressMeters : 0;
  const completedFraction = referenceTotal > 0 ? Math.min(1, reachedMeters / referenceTotal) : 0;

  // Slice only the portion of the reference the current trip actually covered,
  // so an ended-early trip is compared over comparable distance.
  const comparedMeters = Math.min(reachedMeters, referenceTotal);
  const segmentDeltas: TripSegmentDelta[] = [];

  if (comparedMeters > 0 && mapped.length > 1) {
    const segmentLength = comparedMeters / DEFAULT_SEGMENT_COUNT;
    let prevRefElapsed = elapsedAtProgress(referencePoints, 0);
    let prevCurElapsed = interpolateElapsed(mapped, 0) ?? 0;

    for (let i = 0; i < DEFAULT_SEGMENT_COUNT; i += 1) {
      const end = (i + 1) * segmentLength;
      const refElapsed = elapsedAtProgress(referencePoints, end);
      const curElapsed = interpolateElapsed(mapped, end);
      if (curElapsed === null) break;

      const referenceDurationSeconds = refElapsed - prevRefElapsed;
      const currentDurationSeconds = curElapsed - prevCurElapsed;

      segmentDeltas.push({
        index: i,
        startDistanceMeters: i * segmentLength,
        endDistanceMeters: end,
        referenceDurationSeconds,
        currentDurationSeconds,
        deltaSeconds: currentDurationSeconds - referenceDurationSeconds,
      });

      prevRefElapsed = refElapsed;
      prevCurElapsed = curElapsed;
    }
  }

  const referenceDurationSeconds = elapsedAtProgress(referencePoints, comparedMeters);
  const currentDurationSeconds =
    mapped.length > 0 ? mapped[mapped.length - 1].elapsedSeconds : current.durationSeconds;
  const totalDeltaSeconds = currentDurationSeconds - referenceDurationSeconds;

  return {
    referenceId: reference.id,
    referenceName: reference.name,
    totalDeltaSeconds,
    currentDistanceMeters: current.distanceMeters,
    currentDurationSeconds,
    referenceDurationSeconds,
    completedFraction,
    segmentDeltas,
    consistencyScore: consistencyScore(segmentDeltas),
    deviationNotes: buildDeviationNotes(mapped, completedFraction),
    insights: buildInsights(segmentDeltas, totalDeltaSeconds),
  };
}

function buildDeviationNotes(
  mapped: Array<{ distanceFromRouteMeters: number }>,
  completedFraction: number
): string[] {
  const notes: string[] = [];

  if (mapped.length > 0) {
    const offRouteCount = mapped.filter(
      (m) => m.distanceFromRouteMeters > OFF_ROUTE_THRESHOLD_METERS
    ).length;
    const offRouteShare = offRouteCount / mapped.length;
    if (offRouteShare > 0.05) {
      notes.push(
        `This trip was away from the reference path for about ${Math.round(offRouteShare * 100)}% of its samples, so the comparison is approximate there.`
      );
    }
  }

  if (completedFraction < 0.95) {
    notes.push(
      `This trip covered about ${Math.round(completedFraction * 100)}% of the reference route; the comparison only spans the shared portion.`
    );
  }

  return notes;
}

function buildInsights(segments: TripSegmentDelta[], totalDeltaSeconds: number): string[] {
  const insights: string[] = [];
  if (segments.length === 0) return insights;

  const slowest = segments.reduce((a, b) => (b.deltaSeconds > a.deltaSeconds ? b : a));
  const fastest = segments.reduce((a, b) => (b.deltaSeconds < a.deltaSeconds ? b : a));

  if (Math.abs(totalDeltaSeconds) <= 5) {
    insights.push("Overall time was almost identical to the reference trip.");
  } else if (totalDeltaSeconds > 0) {
    insights.push(`Overall this trip took ${formatClock(totalDeltaSeconds)} longer than the reference.`);
  } else {
    insights.push(`Overall this trip took ${formatClock(totalDeltaSeconds)} less than the reference.`);
  }

  if (slowest.deltaSeconds > 5) {
    insights.push(
      `Most of the extra time came in segment ${slowest.index + 1} (+${formatClock(slowest.deltaSeconds)}) — often a signal of traffic or stops there.`
    );
  }
  if (fastest.deltaSeconds < -5) {
    insights.push(
      `Segment ${fastest.index + 1} went ${formatClock(fastest.deltaSeconds)} smoother than the reference.`
    );
  }

  return insights;
}
