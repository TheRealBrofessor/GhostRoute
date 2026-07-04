import { ConfidenceDisclosure } from "./types";

export type ConfidenceLabel = "high" | "medium" | "low";

/** Maps a 0-1 confidence score to a UI-facing label for the explanation sheet. */
export function confidenceLabel(overall: number): ConfidenceLabel {
  if (overall >= 0.75) return "high";
  if (overall >= 0.4) return "medium";
  return "low";
}

/** Human-readable disclosure sentence for the Route Explanation sheet. */
export function confidenceMessage(confidence: ConfidenceDisclosure): string {
  const label = confidenceLabel(confidence.overall);
  if (label === "high") {
    return "This score is backed by solid map data for lighting, path type, and openness.";
  }
  if (confidence.degradedFactors.length === 0) {
    return "This score has moderate confidence; some map data along this route is incomplete.";
  }
  const names = confidence.degradedFactors.join(", ");
  return `Map data is incomplete for: ${names}. Those factors used neutral defaults, so this score is a ${label}-confidence estimate.`;
}
