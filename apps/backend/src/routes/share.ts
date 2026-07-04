import { FastifyInstance } from "fastify";
import { ShareStore } from "../services/shareStore";
import { createShareSchema, getShareSchema, positionUpdateSchema } from "../schemas/share";
import { isValidShareToken } from "../utils/token";
import { CreateShareRequestBody, PositionUpdateBody } from "../types";

const SHARE_CREATE_RATE_LIMIT = { max: 10, timeWindow: "1 minute" };
const POSITION_UPDATE_RATE_LIMIT = { max: 60, timeWindow: "1 minute" };

export default async function shareRoutes(fastify: FastifyInstance): Promise<void> {
  const store = new ShareStore(fastify.redis);

  fastify.post<{ Body: CreateShareRequestBody }>(
    "/share",
    { schema: createShareSchema, config: { rateLimit: SHARE_CREATE_RATE_LIMIT } },
    async (request, reply) => {
      const session = await store.create(request.body ?? {});
      const baseUrl = `${request.protocol}://${request.hostname}`;

      reply.code(201).send({
        token: session.token,
        url: `${baseUrl}/share/${session.token}`,
        expiresAt: new Date(session.expiresAt).toISOString(),
      });
    }
  );

  fastify.put<{ Params: { token: string }; Body: PositionUpdateBody }>(
    "/share/:token/position",
    { schema: positionUpdateSchema, config: { rateLimit: POSITION_UPDATE_RATE_LIMIT } },
    async (request, reply) => {
      const { token } = request.params;
      if (!isValidShareToken(token)) {
        return reply.code(400).send({ error: "invalid_token" });
      }

      const session = await store.updatePosition(token, request.body);
      if (!session) {
        return reply.code(410).send({ error: "share_expired" });
      }

      reply.send({ ok: true, expiresAt: new Date(session.expiresAt).toISOString() });
    }
  );

  fastify.get<{ Params: { token: string } }>(
    "/share/:token",
    { schema: getShareSchema },
    async (request, reply) => {
      const { token } = request.params;
      if (!isValidShareToken(token)) {
        return reply.code(400).send({ error: "invalid_token" });
      }

      const session = await store.get(token);
      if (!session) {
        return reply.code(410).send({ error: "share_expired" });
      }

      reply.send({
        destinationLabel: session.destinationLabel,
        expiresAt: new Date(session.expiresAt).toISOString(),
        lastPosition: session.lastPosition,
      });
    }
  );
}
