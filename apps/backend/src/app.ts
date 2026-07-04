import fastify, { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { config } from "./config";
import redisPlugin from "./plugins/redis";
import routeRoutes from "./routes/route";
import shareRoutes from "./routes/share";
import { scrubCoordinates, STATIC_REDACT_PATHS } from "./utils/scrubLogs";

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: {
      level: config.logLevel,
      redact: { paths: STATIC_REDACT_PATHS, censor: "[REDACTED]" },
      serializers: {
        req(request) {
          return {
            method: request.method,
            url: request.url,
            body: scrubCoordinates((request as { body?: unknown }).body),
          };
        },
      },
    },
  });

  await app.register(redisPlugin);
  await app.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindowMs,
  });

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(routeRoutes);
  await app.register(shareRoutes);

  return app;
}
