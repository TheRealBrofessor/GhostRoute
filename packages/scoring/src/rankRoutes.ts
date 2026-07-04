import { scoreRoute } from "./scoreRoute";
import { RankedRoute, RouteMode, ScoredRouteCandidate, TravelMode } from "./types";

/**
 * Scores every candidate route for the requested mode and returns them best
 * (highest score) first. Callers typically slice to the top 2-3 for display.
 */
export function rankRoutes(
  candidates: ScoredRouteCandidate[],
  mode: RouteMode,
  travelMode: TravelMode
): RankedRoute[] {
  return candidates
    .map((candidate) => ({
      id: candidate.id,
      summary: candidate.summary,
      distanceMeters: candidate.distanceMeters,
      durationSeconds: candidate.durationSeconds,
      score: scoreRoute(candidate.segments, mode, travelMode),
    }))
    .sort((a, b) => b.score.score - a.score.score);
}
