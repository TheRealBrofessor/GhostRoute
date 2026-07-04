# @ghostroute/scoring

Shared route scoring engine used on-device by the mobile app (so scoring never
requires a network round-trip once candidate routes exist) and mirrored on the
backend for parity when it proposes initial candidates.

## Model

A route is a list of `RouteSegment`s derived from OSM way data. Each segment
is scored on four factors, 0-100 each:

- **time** — pace relative to a free-flow reference speed for that path type
  and travel mode (a congestion/blockage proxy, not raw speed)
- **pathType** — suitability of the underlying way type for the travel mode
  (dedicated footway/cycleway scores high, high-speed arterials score low)
- **lighting** — proxy from OSM `lit=*`
- **openness** — proxy from surrounding frontage/landuse density vs.
  walled/isolated paths

Segment factor scores are aggregated distance-weighted across the route, then
blended into a single 0-100 score using one of three mode weight profiles
(`fastest` / `balanced` / `safest`, see [src/weights.ts](src/weights.ts)).

## Confidence

Any tag GhostRoute can't read from OSM (missing `lit`, unclassified highway,
etc.) falls back to a neutral default score for that factor **and** lowers
that factor's confidence. `scoreRoute()` returns a `ConfidenceDisclosure` with
an overall 0-1 confidence and which factors were degraded, so the mobile app's
Route Explanation sheet can honestly say "this score used incomplete data"
instead of presenting a guess as fact.

## Usage

```ts
import { rankRoutes } from "@ghostroute/scoring";

const ranked = rankRoutes(candidates, "safest", "walk");
// ranked[0] is the highest-scoring candidate, each with .score.factors
// for the explanation card and .score.confidence for the disclosure.
```

## Scripts

- `npm run build` — compile to `dist/`
- `npm test` — run the vitest suite
