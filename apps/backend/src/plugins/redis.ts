import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import Redis from "ioredis";
import { config } from "../config";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
}

export default fp(async function redisPlugin(fastify: FastifyInstance) {
  const redis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  });

  redis.on("error", (err) => {
    fastify.log.error({ err: err.message }, "redis connection error");
  });

  fastify.decorate("redis", redis);

  fastify.addHook("onClose", async () => {
    await redis.quit();
  });
});
