import { describe, expect, it } from "vitest";
import {
  buildProgressPoints,
  elapsedAtProgress,
  locateOnRoute,
  progressAtElapsed,
  totalDistanceMeters,
} from "./progress";
import { LocationSample } from "./types";

/** Straight west-to-east line near the equator: ~111m per 0.001 deg lon. */
function straightLineSamples(count: number, secondsPerPoint: number): LocationSample[] {
  return Array.from({ length: count }, (_, i) => ({
    lat: 0,
    lon: i * 0.001,
    timestamp: 1_000_000 + i * secondsPerPoint * 1000,
  }));
}

describe("buildProgressPoints", () => {
  it("returns empty for no samples", () => {
    expect(buildProgressPoints([])).toEqual([]);
  });

  it("accumulates distance and elapsed time", () => {
    const points = buildProgressPoints(straightLineSamples(5, 10));
    expect(points).toHaveLength(5);
    expect(points[0].cumulativeDistanceMeters).toBe(0);
    expect(points[0].elapsedSeconds).toBe(0);
    expect(points[4].elapsedSeconds).toBe(40);
    // 4 * ~111.3m segments
    expect(points[4].cumulativeDistanceMeters).toBeGreaterThan(440);
    expect(points[4].cumulativeDistanceMeters).toBeLessThan(450);
  });
});

describe("locateOnRoute", () => {
  const points = buildProgressPoints(straightLineSamples(5, 10));

  it("finds progress at the midpoint of the route", () => {
    const total = totalDistanceMeters(points);
    const location = locateOnRoute(points, { lat: 0, lon: 0.002 });
    expect(location).not.toBeNull();
    expect(location!.progressMeters).toBeCloseTo(total / 2, 0);
    expect(location!.distanceFromRouteMeters).toBeLessThan(1);
  });

  it("reports distance from route for an offset position", () => {
    // ~111m north of the path
    const location = locateOnRoute(points, { lat: 0.001, lon: 0.002 });
    expect(location!.distanceFromRouteMeters).toBeGreaterThan(100);
    expect(location!.distanceFromRouteMeters).toBeLessThan(125);
  });

  it("clamps progress before the start and past the end", () => {
    const total = totalDistanceMeters(points);
    expect(locateOnRoute(points, { lat: 0, lon: -0.01 })!.progressMeters).toBe(0);
    expect(locateOnRoute(points, { lat: 0, lon: 0.05 })!.progressMeters).toBeCloseTo(total, 0);
  });

  it("returns null for an empty route", () => {
    expect(locateOnRoute([], { lat: 0, lon: 0 })).toBeNull();
  });
});

describe("elapsedAtProgress / progressAtElapsed", () => {
  const points = buildProgressPoints(straightLineSamples(5, 10));
  const total = totalDistanceMeters(points);

  it("interpolates elapsed time linearly along the route", () => {
    expect(elapsedAtProgress(points, 0)).toBe(0);
    expect(elapsedAtProgress(points, total)).toBe(40);
    expect(elapsedAtProgress(points, total / 2)).toBeCloseTo(20, 1);
  });

  it("clamps outside the route bounds", () => {
    expect(elapsedAtProgress(points, -50)).toBe(0);
    expect(elapsedAtProgress(points, total + 500)).toBe(40);
  });

  it("inverts back to distance", () => {
    expect(progressAtElapsed(points, 20)).toBeCloseTo(total / 2, 0);
    expect(progressAtElapsed(points, 0)).toBe(0);
    expect(progressAtElapsed(points, 999)).toBeCloseTo(total, 5);
  });
});
