import { describe, expect, it } from "vitest";
import { rankRoutes } from "./rankRoutes";
import { scoreRoute } from "./scoreRoute";
import { RouteSegment } from "./types";

const litResidential: RouteSegment = {
  id: "seg-1",
  distanceMeters: 500,
  durationSeconds: 400,
  pathType: "residential",
  lighting: "yes",
  openness: "open",
  referenceSpeedKph: 4.5,
};

const darkAlley: RouteSegment = {
  id: "seg-2",
  distanceMeters: 500,
  durationSeconds: 380,
  pathType: "path",
  lighting: "no",
  openness: "enclosed",
  referenceSpeedKph: 4.5,
};

const noDataSegment: RouteSegment = {
  id: "seg-3",
  distanceMeters: 300,
  durationSeconds: 240,
  pathType: "unknown",
};

describe("scoreRoute", () => {
  it("scores a well-lit, open residential route higher on Safest than a dark enclosed one", () => {
    const good = scoreRoute([litResidential], "safest", "walk");
    const bad = scoreRoute([darkAlley], "safest", "walk");
    expect(good.score).toBeGreaterThan(bad.score);
  });

  it("weighs time much more heavily under Fastest than Safest", () => {
    const fastest = scoreRoute([litResidential], "fastest", "walk");
    const safest = scoreRoute([litResidential], "safest", "walk");
    const fastestTimeFactor = fastest.factors.find((f) => f.factor === "time")!;
    const safestTimeFactor = safest.factors.find((f) => f.factor === "time")!;
    expect(fastestTimeFactor.weight).toBeGreaterThan(safestTimeFactor.weight);
  });

  it("lowers confidence and flags degraded factors when tags are missing", () => {
    const result = scoreRoute([noDataSegment], "balanced", "walk");
    expect(result.confidence.overall).toBeLessThan(0.5);
    expect(result.confidence.degradedFactors).toContain("lighting");
    expect(result.confidence.degradedFactors).toContain("openness");
    expect(result.confidence.degradedFactors).toContain("pathType");
  });

  it("keeps the overall score within 0-100", () => {
    for (const mode of ["fastest", "balanced", "safest"] as const) {
      const result = scoreRoute([litResidential, darkAlley, noDataSegment], mode, "walk");
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    }
  });
});

describe("rankRoutes", () => {
  it("returns candidates sorted best score first", () => {
    const ranked = rankRoutes(
      [
        { id: "a", segments: [darkAlley], distanceMeters: 500, durationSeconds: 380, summary: "Dark alley shortcut" },
        { id: "b", segments: [litResidential], distanceMeters: 500, durationSeconds: 400, summary: "Lit residential streets" },
      ],
      "safest",
      "walk"
    );
    expect(ranked[0].id).toBe("b");
    expect(ranked[0].score.score).toBeGreaterThan(ranked[1].score.score);
  });
});
