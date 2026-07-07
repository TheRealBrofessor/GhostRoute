import { describe, expect, it } from "vitest";
import { computeLiveDelta, formatClock, formatLiveDelta } from "./liveDelta";
import { buildProgressPoints } from "./progress";
import { LocationSample } from "./types";

function straightLineSamples(count: number, secondsPerPoint: number): LocationSample[] {
  return Array.from({ length: count }, (_, i) => ({
    lat: 0,
    lon: i * 0.001,
    timestamp: 1_000_000 + i * secondsPerPoint * 1000,
  }));
}

describe("formatClock", () => {
  it("formats minutes and seconds", () => {
    expect(formatClock(42)).toBe("0:42");
    expect(formatClock(78)).toBe("1:18");
    expect(formatClock(600)).toBe("10:00");
  });

  it("formats hours when needed", () => {
    expect(formatClock(3661)).toBe("1:01:01");
  });

  it("uses the magnitude of negative values", () => {
    expect(formatClock(-18)).toBe("0:18");
  });
});

describe("formatLiveDelta", () => {
  it("labels behind-reference with a plus sign and neutral wording", () => {
    expect(formatLiveDelta(42)).toBe("+0:42 behind reference");
  });

  it("labels ahead-of-reference with a minus sign and neutral wording", () => {
    expect(formatLiveDelta(-18)).toBe("-0:18 ahead of reference");
  });

  it("reads on-pace within the small band", () => {
    expect(formatLiveDelta(0)).toBe("on pace with reference");
    expect(formatLiveDelta(4)).toBe("on pace with reference");
    expect(formatLiveDelta(-5)).toBe("on pace with reference");
  });

  it("never uses competitive language", () => {
    for (const delta of [-300, -30, 0, 30, 300]) {
      const label = formatLiveDelta(delta).toLowerCase();
      for (const banned of ["race", "beat", "win", "lose", "faster", "speed"]) {
        expect(label).not.toContain(banned);
      }
    }
  });
});

describe("computeLiveDelta", () => {
  // Reference covers the line in 40s (10s per point).
  const reference = buildProgressPoints(straightLineSamples(5, 10));

  it("is positive (behind) when the current trip reaches a point later than the reference", () => {
    // Midpoint of the route; reference was here at 20s, we arrive at 35s.
    const delta = computeLiveDelta(reference, { lat: 0, lon: 0.002 }, 35);
    expect(delta).not.toBeNull();
    expect(delta!.deltaSeconds).toBeCloseTo(15, 1);
    expect(delta!.label).toContain("behind reference");
    expect(delta!.progressFraction).toBeCloseTo(0.5, 2);
  });

  it("is negative (ahead) when the current trip reaches a point sooner", () => {
    const delta = computeLiveDelta(reference, { lat: 0, lon: 0.002 }, 8);
    expect(delta!.deltaSeconds).toBeCloseTo(-12, 1);
    expect(delta!.label).toContain("ahead of reference");
  });

  it("flags off-route positions beyond the threshold", () => {
    const onRoute = computeLiveDelta(reference, { lat: 0, lon: 0.002 }, 20);
    const offRoute = computeLiveDelta(reference, { lat: 0.002, lon: 0.002 }, 20);
    expect(onRoute!.offRoute).toBe(false);
    expect(offRoute!.offRoute).toBe(true);
    expect(offRoute!.distanceFromRouteMeters).toBeGreaterThan(75);
  });

  it("returns null when the reference has no points", () => {
    expect(computeLiveDelta([], { lat: 0, lon: 0 }, 10)).toBeNull();
  });
});
