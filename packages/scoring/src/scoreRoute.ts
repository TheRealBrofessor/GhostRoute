import { scoreLighting, scoreOpenness, scorePathType, scoreTime } from "./factors";
import { FACTOR_LABELS, weightsFor } from "./weights";
import {
  ConfidenceDisclosure,
  FactorKey,
  FactorScore,
  RouteMode,
  RouteScore,
  RouteSegment,
  TravelMode,
} from "./types";

const FACTOR_KEYS: FactorKey[] = ["time", "pathType", "lighting", "openness"];

interface AggregatedFactor {
  weightedScoreSum: number;
  weightedConfidenceSum: number;
  totalDistance: number;
}

/**
 * Scores a full route: aggregates per-segment factor scores distance-weighted
 * across the route, then blends them using the mode's weight profile.
 */
export function scoreRoute(
  segments: RouteSegment[],
  mode: RouteMode,
  travelMode: TravelMode
): RouteScore {
  const distanceMeters = sum(segments.map((s) => s.distanceMeters));
  const durationSeconds = sum(segments.map((s) => s.durationSeconds));
  const weights = weightsFor(mode);

  const aggregates: Record<FactorKey, AggregatedFactor> = {
    time: emptyAggregate(),
    pathType: emptyAggregate(),
    lighting: emptyAggregate(),
    openness: emptyAggregate(),
  };

  for (const segment of segments) {
    const distance = Math.max(segment.distanceMeters, 0);
    accumulate(aggregates.time, scoreTime(segment, travelMode), distance);
    accumulate(aggregates.pathType, scorePathType(segment, travelMode), distance);
    accumulate(aggregates.lighting, scoreLighting(segment), distance);
    accumulate(aggregates.openness, scoreOpenness(segment), distance);
  }

  const factors: FactorScore[] = FACTOR_KEYS.map((key) => {
    const agg = aggregates[key];
    const score = agg.totalDistance > 0 ? agg.weightedScoreSum / agg.totalDistance : 50;
    const confidence = agg.totalDistance > 0 ? agg.weightedConfidenceSum / agg.totalDistance : 0;
    const weight = weights[key];
    return {
      factor: key,
      score: round(score),
      weight,
      contribution: round(score * weight),
      confidence: round(confidence, 2),
      label: FACTOR_LABELS[key],
    };
  });

  const overallScore = round(sum(factors.map((f) => f.contribution)));

  const confidence: ConfidenceDisclosure = {
    overall: round(
      sum(factors.map((f) => f.confidence * f.weight)) || 0,
      2
    ),
    byFactor: Object.fromEntries(factors.map((f) => [f.factor, f.confidence])) as Record<
      FactorKey,
      number
    >,
    degradedFactors: factors.filter((f) => f.confidence < 0.5).map((f) => f.factor),
  };

  return {
    score: clampScore(overallScore),
    mode,
    travelMode,
    factors,
    confidence,
    distanceMeters,
    durationSeconds,
  };
}

function accumulate(
  agg: AggregatedFactor,
  result: { score: number; confidence: number },
  distanceWeight: number
): void {
  // Zero-length segments (e.g. a maneuver node) still contribute their factor
  // score, just with a minimal nominal weight so they aren't silently dropped.
  const weight = distanceWeight > 0 ? distanceWeight : 1e-6;
  agg.weightedScoreSum += result.score * weight;
  agg.weightedConfidenceSum += result.confidence * weight;
  agg.totalDistance += weight;
}

function emptyAggregate(): AggregatedFactor {
  return { weightedScoreSum: 0, weightedConfidenceSum: 0, totalDistance: 0 };
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
