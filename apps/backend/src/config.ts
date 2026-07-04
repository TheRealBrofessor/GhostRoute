function int(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  port: int(process.env.PORT, 3000),
  host: process.env.HOST ?? "0.0.0.0",
  redisUrl: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  /** Hard cap on Emergency Share session lifetime — never extended past this. */
  shareTtlMaxSeconds: int(process.env.SHARE_TTL_MAX_SECONDS, 12 * 60 * 60),
  rateLimitMax: int(process.env.RATE_LIMIT_MAX, 100),
  rateLimitWindowMs: int(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  logLevel: process.env.LOG_LEVEL ?? "info",
};
