# @ghostroute/backend

Fastify API server. Proposes scored routes and hosts short-lived Emergency
Share sessions. Holds no durable coordinate storage — everything location-
related lives in Redis with a hard TTL cap and is scrubbed from logs.

## Endpoints

| Method | Path                     | Description |
|--------|--------------------------|-------------|
| POST   | `/route`                 | `{ origin, destination, mode, travelMode }` → 2-3 scored routes |
| POST   | `/share`                 | Creates an Emergency Share session → `{ token, url, expiresAt }` |
| PUT    | `/share/:token/position` | Traveler posts a live position update |
| GET    | `/share/:token`          | Recipient view; `410` once expired or unknown |

`/route` delegates scoring to [`@ghostroute/scoring`](../../packages/scoring);
candidate route generation in `src/services/candidateRoutes.ts` is a
placeholder for a real OSRM (routing) + Overpass (OSM tags) pipeline.

## Emergency Share sessions

- Stored in Redis as `share:<token>`, TTL-bound — no separate deletion job.
- `SHARE_TTL_MAX_SECONDS` (default 12h) is a **hard** cap: a client can
  request a shorter session but never longer, and posting position updates
  never extends the TTL past the original expiry.
- `GET /share/:token` returns `410 Gone` once the Redis key has expired.

## Privacy

- No coordinates are ever written to durable storage — only to Redis, TTL-bound.
- Request logging redacts coordinate-shaped fields (`src/utils/scrubLogs.ts`)
  both via static pino `redact` paths and a recursive scrub for dynamic route bodies.
- Rate limiting is enforced globally and additionally tightened on `/share`
  creation and position updates.

## Running locally

```bash
cp .env.example .env
# requires a local Redis on REDIS_URL
npm run dev
```
