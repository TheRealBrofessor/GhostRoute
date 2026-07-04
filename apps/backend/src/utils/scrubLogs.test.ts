import { describe, expect, it } from "vitest";
import { scrubCoordinates } from "./scrubLogs";

describe("scrubCoordinates", () => {
  it("redacts known coordinate fields at any depth", () => {
    const input = {
      mode: "safest",
      origin: { lat: 40.0, lon: -73.9 },
      nested: { position: { lat: 1, lon: 2 } },
    };

    const result = scrubCoordinates(input) as Record<string, unknown>;

    expect(result.mode).toBe("safest");
    expect(result.origin).toBe("[REDACTED]");
    expect((result.nested as Record<string, unknown>).position).toBe("[REDACTED]");
  });

  it("leaves non-coordinate fields untouched", () => {
    const input = { destinationLabel: "Home", durationMinutes: 30 };
    expect(scrubCoordinates(input)).toEqual(input);
  });
});
