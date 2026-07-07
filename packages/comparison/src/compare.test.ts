import { describe, expect, it } from "vitest";
import { compareTrips, consistencyScore } from "./compare";
import { GhostRouteReference, LocationSample, TripRecord, TripSegmentDelta } from "./types";

function straightLineSamples(count: number, secondsPerPoint: number): LocationSample[] {
  return Array.from({ length: count }, (_, i) => ({
    lat: 0,
    lon: i * 0.001,
    timestamp: 1_000_000 + i * secondsPerPoint * 1000,
  }));
}

function makeTrip(id: string, samples: LocationSample[]): TripRecord {
  const durationSeconds = (samples[samples.length - 1].timestamp - samples[0].timestamp) / 1000;
  return {
    id,
    name: id,
    startedAt: samples[0].timestamp,
    endedAt: samples[samples.length - 1].timestamp,
    samples,
    distanceMeters: 111.32 * (samples.length - 1),
    durationSeconds,
    averageSpeedMps: durationSeconds > 0 ? (111.32 * (samples.length - 1)) / durationSeconds : 0,
  };
}

function makeReference(samples: LocationSample[]): GhostRouteReference {
  return { id: "ref-1", name: "Morning commute", createdAt: Date.now(), trip: makeTrip("ref-trip", samples) };
}

describe("consistencyScore", () => {
  it("is 100 for identical pace across segments", () => {
    const segments: TripSegmentDelta[] = [0, 1, 2].map((index) => ({
      index,
      startDistanceMeters: index * 100,
      endDistanceMeters: (index + 1) * 100,
      referenceDurationSeconds: 30,
      currentDurationSeconds: 30,
      deltaSeconds: 0,
    }));
    expect(consistencyScore(segments)).toBe(100);
  });

  it("is 100 for a uniformly slower trip (consistency, not speed)", () => {
    const segments: TripSegmentDelta[] = [0, 1, 2].map((index) => ({
      index,
      startDistanceMeters: index * 100,
      endDistanceMeters: (index + 1) * 100,
      referenceDurationSeconds: 30,
      currentDurationSeconds: 45,
      deltaSeconds: 15,
    }));
    expect(consistencyScore(segments)).toBe(100);
  });

  it("drops for uneven pacing and stays within 0-100", () => {
    const segments: TripSegmentDelta[] = [
      { index: 0, startDistanceMeters: 0, endDistanceMeters: 100, referenceDurationSeconds: 30, currentDurationSeconds: 10, deltaSeconds: -20 },
      { index: 1, startDistanceMeters: 100, endDistanceMeters: 200, referenceDurationSeconds: 30, currentDurationSeconds: 90, deltaSeconds: 60 },
      { index: 2, startDistanceMeters: 200, endDistanceMeters: 300, referenceDurationSeconds: 30, currentDurationSeconds: 30, deltaSeconds: 0 },
    ];
    const score = consistencyScore(segments);
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it("is 0 with no usable segments", () => {
    expect(consistencyScore([])).toBe(0);
  });
});

describe("compareTrips", () => {
  it("reports ~zero delta for an identical trip", () => {
    const samples = straightLineSamples(21, 10);
    const comparison = compareTrips(makeReference(samples), makeTrip("current", samples));

    expect(Math.abs(comparison.totalDeltaSeconds)).toBeLessThan(1);
    expect(comparison.completedFraction).toBeCloseTo(1, 2);
    expect(comparison.segmentDeltas).toHaveLength(8);
    expect(comparison.consistencyScore).toBeGreaterThan(95);
  });

  it("reports a positive total delta for a slower trip", () => {
    const reference = makeReference(straightLineSamples(21, 10)); // 200s total
    const current = makeTrip("current", straightLineSamples(21, 12)); // 240s total

    const comparison = compareTrips(reference, current);
    expect(comparison.totalDeltaSeconds).toBeGreaterThan(30);
    expect(comparison.referenceDurationSeconds).toBeCloseTo(200, 0);
    expect(comparison.currentDurationSeconds).toBeCloseTo(240, 0);
  });

  it("reports a negative total delta for a quicker trip and attributes segments", () => {
    const reference = makeReference(straightLineSamples(21, 12));
    const current = makeTrip("current", straightLineSamples(21, 10));

    const comparison = compareTrips(reference, current);
    expect(comparison.totalDeltaSeconds).toBeLessThan(-30);
    expect(comparison.segmentDeltas.every((s) => s.deltaSeconds < 0)).toBe(true);
    expect(comparison.insights.join(" ")).toContain("less than the reference");
  });

  it("notes when a trip only covers part of the reference route", () => {
    const reference = makeReference(straightLineSamples(21, 10));
    const current = makeTrip("current", straightLineSamples(11, 10)); // half the route

    const comparison = compareTrips(reference, current);
    expect(comparison.completedFraction).toBeLessThan(0.6);
    expect(comparison.deviationNotes.join(" ")).toContain("% of the reference route");
  });

  it("keeps insights free of competitive language", () => {
    const reference = makeReference(straightLineSamples(21, 10));
    const current = makeTrip("current", straightLineSamples(21, 14));

    const comparison = compareTrips(reference, current);
    const text = [...comparison.insights, ...comparison.deviationNotes].join(" ").toLowerCase();
    for (const banned of ["race", "beat", "win", "faster", "speed up"]) {
      expect(text).not.toContain(banned);
    }
  });
});
