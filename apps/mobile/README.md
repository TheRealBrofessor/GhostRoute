# @ghostroute/mobile

React Native (Expo) app. No accounts, no third-party analytics or ad SDKs —
the only network calls are to the GhostRoute backend (`@/api/client.ts`) for
route proposals and Emergency Share.

## Screens

- **Home** — destination search + Fastest/Balanced/Safest mode + travel type
- **Route Options** — 2-3 scored route cards; switching modes here re-scores
  on-device via `@ghostroute/scoring` using the segments already returned by
  the server, no extra network round trip
- **Route Explanation** (modal) — per-factor breakdown and confidence disclosure
- **Navigation** — turn-by-turn steps, Share ETA, End Trip
- **Privacy Dashboard** — exactly what's stored locally vs. server-side, Delete Everything
- **Settings** — default mode, emergency contact, trip history toggle (off by default)

## Storage

`src/storage/secureStorage.ts` wraps `expo-secure-store`, which persists to
the OS keystore/keychain (encrypted at rest). Preferences and trip history
are the only things ever written locally; both are removed in one call by
the Privacy Dashboard's "Delete Everything".

## Geocoding / OSM data

`src/utils/geocode.ts` and the backend's candidate route generator are
placeholders for a real geocoding provider and OSRM/Overpass pipeline —
neither is wired to a live provider in this scaffold since that needs API
keys this repo doesn't have. Swap them out behind the same function
signatures to go live.

## Running locally

```bash
npm run start
```

Point the app at your backend with `EXPO_PUBLIC_API_BASE_URL` (defaults to
`http://localhost:3000`).
