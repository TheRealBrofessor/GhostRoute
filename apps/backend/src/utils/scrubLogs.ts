const COORDINATE_KEYS = new Set([
  "lat",
  "lon",
  "lng",
  "latitude",
  "longitude",
  "origin",
  "destination",
  "position",
  "heading",
]);

/**
 * Deep-redacts coordinate-shaped fields before anything is logged. Fastify's
 * static `redact` paths can't cover dynamically-keyed route params (e.g.
 * `/share/:token/position` bodies), so this is defense-in-depth beyond that.
 */
export function scrubCoordinates(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(scrubCoordinates);
  }
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(source)) {
      result[key] = COORDINATE_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : scrubCoordinates(entry);
    }
    return result;
  }
  return value;
}

/** Fixed pino `redact` paths for the most common coordinate-bearing fields. */
export const STATIC_REDACT_PATHS = [
  "req.body.origin",
  "req.body.destination",
  "req.body.lat",
  "req.body.lon",
  "req.body.position",
  "req.body.heading",
  "req.headers.authorization",
];
