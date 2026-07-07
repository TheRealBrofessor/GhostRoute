# GhostRoute

GhostRoute is a privacy-first, navigation-first mobile app for **personal reference routes**: record your real-world trips, save your most efficient run as a "ghost" reference, and on later drives see a passive reference-progress indicator and a real-time `+/- time` delta against that saved trip. All comparison is by **route progress**, never instantaneous speed — GhostRoute deliberately avoids racing mechanics, alerts, rewards, or anything that pressures you while driving. The detailed analysis (segment deltas, consistency score, deviation notes) appears only after the drive ends.

No accounts, no third-party analytics, no ad SDKs. Trips and location samples stay on-device and are stored only when you explicitly save them. The only server-side state is short-lived, opt-in Emergency Share sessions, hard-capped at 12 hours.

---

## Working now

- **Record a trip** — location samples are collected only while a trip is actively recording (device GPS, or a keyless demo simulator).
- **Trip summary** — distance, duration, average pace; save/discard is always an explicit user choice.
- **Save a ghost reference** — mark any saved trip as your active reference route.
- **Drive vs. reference** — minimal, passive in-drive screen: reference name, your progress vs. the ghost's progress, live `+0:42 behind reference` / `-0:18 ahead of reference` delta, elapsed time, End Trip. Share ETA is available as a secondary opt-in action.
- **Post-drive comparison** — total delta, segment-by-segment deltas, consistency score (0–100, measures pace evenness — a uniformly slower trip still scores high), route deviation notes, neutral efficiency insights, and a "save as new reference" option.
- **Saved Routes** — list, re-reference, and delete individual trips/references.
- **Privacy Dashboard** — exactly what's stored, with per-trip delete and a true Delete Everything.
- **Emergency Share backend** — Fastify + Redis, opt-in per trip, 12h hard TTL cap (position updates never extend expiry), rate limits, coordinate scrubbing in logs.

## Demo mode

The app runs fully **without any API keys**. The default provider is a demo provider with fixed sample routes and a drive simulator (played back at 6× so a demo drive takes ~1 minute), so the whole record → reference → compare loop works in a simulator with no GPS movement. Demo trips are labeled as demo data everywhere.

**Route matching is demo-level**: live/ post-drive comparison uses a nearest-point progress approximation against the reference polyline, not true map-matching. It works well when the drive roughly follows the reference and degrades gracefully (off-route positions are flagged and noted).

## Roadmap

- Real geocoding/routing providers (Mapbox / Google Routes / OSRM) behind the existing `RouteProvider` interface
- True map-matching for route progress
- Background location recording (currently foreground-only)
- Map rendering of routes (currently progress bars, no map tiles — keeps demo mode keyless)
- Multiple references per route with automatic "most efficient" selection

## Provider integration

`apps/mobile/src/providers/` defines the abstraction:

- `types.ts` — `RouteProvider` (geocode + planRoute) and `LocationSource` (GPS or demo) interfaces
- `demo.ts` — keyless demo provider + drive simulator (default)
- `mapbox.ts` — skeleton showing where a real provider plugs in; reads `EXPO_PUBLIC_MAPBOX_TOKEN` from env only
- Selection is env-driven: `EXPO_PUBLIC_ROUTE_PROVIDER=demo|mapbox` (falls back to demo without a token). **Never hardcode keys** — see `apps/mobile/.env.example`.

---

## Repository structure

```
/apps/mobile          React Native (Expo, TypeScript) app
/apps/backend         Fastify API — Emergency Share sessions (Redis), legacy route scoring endpoint
/apps/site            Static one-page marketing/demo site (plain HTML)
/packages/comparison  Ghost comparison engine — route progress, live delta, post-drive analysis
/packages/scoring     Route scoring engine (safety/comfort factors, used by the backend /route endpoint)
```

---

## Getting started

Requirements: Node ≥ 18 (CI uses 20), npm, and Redis for the backend.

```bash
npm install
npm run build      # compiles packages/comparison, packages/scoring, and the backend
npm run lint       # typechecks all workspaces
npm test           # comparison, scoring, and backend test suites
```

### Backend + Redis

```bash
# Start Redis locally (pick one):
redis-server                                  # native install
docker run --rm -p 6379:6379 redis:7-alpine   # docker

cp apps/backend/.env.example apps/backend/.env   # optional — defaults work
npm run dev:backend                              # http://localhost:3000, GET /health
```

The mobile app only needs the backend for Emergency Share; everything else works offline.

### Mobile (local Expo testing)

```bash
cp apps/mobile/.env.example apps/mobile/.env   # optional — demo mode needs nothing
npm run dev:mobile                             # starts the Expo dev server
```

- **iOS Simulator** (macOS + Xcode installed): press `i` in the Expo terminal, or `npm run ios --workspace apps/mobile`.
- **Physical iPhone**: install **Expo Go** from the App Store, make sure the phone and computer share a Wi-Fi network, and scan the QR code from the Expo terminal. For Emergency Share, set `EXPO_PUBLIC_API_BASE_URL` to your computer's LAN IP (see `.env.example`).
- **Android**: install **Expo Go** from Google Play and scan the QR code, or press `a` with an emulator running (`npm run android --workspace apps/mobile`).

### iPhone build (EAS)

`apps/mobile/eas.json` defines `development` (simulator), `preview` (internal device install), and `production` profiles.

```bash
npm install -g eas-cli
eas login
cd apps/mobile
eas build --profile preview --platform ios
```

> **Note:** installing on a physical iPhone via EAS, and any App Store / TestFlight release, requires a paid [Apple Developer Program](https://developer.apple.com/programs/) account ($99/year). Simulator builds and Expo Go testing do not.

### Android build (EAS)

```bash
cd apps/mobile
eas build --profile preview --platform android   # produces an installable APK
```

### CI

`.github/workflows/ci.yml` runs install → build → lint → test on Node 20 with no secrets. Run the same locally with the four root commands above.

---

## Privacy model

- **No accounts, no fingerprinting, no analytics/ad SDKs.**
- **Location is sampled only during an actively recording trip** — never in the background, never at rest.
- **Nothing is stored without an explicit Save** — after each trip you choose Save / Save as Reference / Discard.
- **Trip data never leaves the device** unless you explicitly share it. Trips/references live in local app storage; the emergency contact preference lives in the OS keystore (`expo-secure-store`). Large trip histories are deliberately *not* kept in secure-store (keystore entries are size-limited).
- **Delete controls**: individual trip/reference delete in Saved Routes; **Delete Everything** in the Privacy Dashboard wipes preferences, trips, and references.
- **Emergency Share is separate and ephemeral**: opt-in per trip, Redis-only server state with a 12-hour hard TTL cap, position updates can never extend a session past its original expiry, coordinates are scrubbed from server logs, endpoints are rate-limited.

## Safety model

- The in-drive screen is minimal and passive: progress, `+/- time` vs. reference, elapsed time, End Trip. Nothing else.
- No alerts, sounds, rewards, speed prompts, or aggressive visuals during a drive.
- Neutral language only: *reference route*, *ghost reference*, *ahead/behind reference*, *route consistency* — never racing terms.
- The delta compares **route progress against your own past trip**, not speed; driving faster than your reference on a segment is reported after the drive as a neutral observation, never celebrated.
- Detailed analysis is deferred to the post-drive screen, and its insights describe where time differed without recommending unsafe behavior.

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | mobile | Backend URL for Emergency Share (default `http://localhost:3000`) |
| `EXPO_PUBLIC_ROUTE_PROVIDER` | mobile | `demo` (default, keyless) or `mapbox` |
| `EXPO_PUBLIC_MAPBOX_TOKEN` | mobile | Only if using the Mapbox provider — never commit it |
| `PORT`, `HOST`, `REDIS_URL` | backend | Server binding and Redis connection |
| `SHARE_TTL_MAX_SECONDS` | backend | Hard cap on Emergency Share lifetime (default 43200 = 12h) |
| `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`, `LOG_LEVEL` | backend | Rate limiting and logging |

See `apps/mobile/.env.example` and `apps/backend/.env.example`. No secrets are committed to this repo.
