import { FastifyInstance } from "fastify";
import { confidenceMessage, rankRoutes } from "@ghostroute/scoring";
import { generateCandidateRoutes } from "../services/candidateRoutes";
import { routeRequestSchema } from "../schemas/route";
import { RouteRequestBody } from "../types";

const MAX_ROUTES_RETURNED = 3;

export default async function routeRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post<{ Body: RouteRequestBody }>(
    "/route",
    { schema: routeRequestSchema },
    async (request, reply) => {
      const { origin, destination, mode, travelMode } = request.body;

      const candidates = generateCandidateRoutes(origin, destination, travelMode);
      const candidatesById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
      const ranked = rankRoutes(candidates, mode, travelMode).slice(0, MAX_ROUTES_RETURNED);

      reply.send({
        mode,
        travelMode,
        routes: ranked.map((route) => ({
          id: route.id,
          score: route.score.score,
          summary: route.summary,
          distanceMeters: Math.round(route.distanceMeters),
          durationSeconds: Math.round(route.durationSeconds),
          factors: route.score.factors,
          confidence: {
            ...route.score.confidence,
            message: confidenceMessage(route.score.confidence),
          },
          // Raw segments let the client re-run @ghostroute/scoring on-device
          // (e.g. instantly re-rank when the user taps a different mode)
          // without another round trip.
          segments: candidatesById.get(route.id)?.segments ?? [],
        })),
      });
    }
  );
}
