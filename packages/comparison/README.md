# @ghostroute/comparison

Ghost reference comparison engine, shared by the mobile app (and anything
else) — pure TypeScript, no React Native or network dependencies.

## What it does

- `buildProgressPoints(samples)` — turns a recorded trip's location samples
  into cumulative-distance/elapsed-time progress points
- `locateOnRoute(points, position)` — nearest-point/segment projection of a
  position onto the reference polyline (**MVP/demo logic, not map-matching**)
- `computeLiveDelta(reference, position, elapsed)` — real-time `LiveGhostDelta`:
  positive = behind the reference, negative = ahead, plus off-route flagging
- `formatLiveDelta(seconds)` — neutral display strings such as
  `+0:42 behind reference` / `-0:18 ahead of reference` / `on pace with reference`
- `compareTrips(reference, trip)` — post-drive `TripComparison`: total delta,
  segment-by-segment deltas, consistency score (0–100, pace evenness — a
  uniformly slower trip still scores 100), deviation notes, neutral insights

The comparison is always by **route progress** ("when the reference was at
this point, what did its clock read?"), never instantaneous speed, and all
generated wording avoids competitive/racing language — tests enforce this.

## Data models

`LocationSample`, `TripRecord`, `GhostRouteReference`, `RouteProgressPoint`,
`LiveGhostDelta`, `TripSegmentDelta`, `TripComparison` — see `src/types.ts`.

```bash
npm run build --workspace packages/comparison
npm test --workspace packages/comparison
```
