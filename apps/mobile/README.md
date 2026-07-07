# @ghostroute/mobile

React Native (Expo, TypeScript) app. No accounts, no third-party analytics or
ad SDKs — the only network calls are the opt-in Emergency Share endpoints in
`src/api/client.ts`. Trip recording and ghost comparison run entirely
on-device via `@ghostroute/comparison`.

## Screens

- **Home** — active reference card, Record a Trip, Drive vs. Reference, Saved Routes, privacy/settings links
- **Record Trip** — pick a location source (device GPS or a keyless demo route), live elapsed/distance/samples, Stop Trip
- **Trip Summary** — distance, duration, average pace; Save / Save & Set as Reference / Discard (nothing is stored until you choose)
- **Ghost Navigation** — minimal passive drive screen: reference name, you-vs-ghost progress bars, real-time `+/- time` delta, elapsed time, End Trip; Share ETA as a secondary opt-in action
- **Comparison** (post-drive) — total delta, segment deltas, consistency score, deviation notes, efficiency insights, Save as New Reference
- **Saved Routes** — references and trips with per-item delete and re-reference actions
- **Privacy Dashboard** — exactly what's stored locally vs. server-side, Delete Everything
- **Settings** — emergency contact (pre-fills Share ETA)

## Storage

- `src/storage/tripStorage.ts` — trips and ghost references (full location-sample
  arrays) on AsyncStorage, local-only, capped at 50 trips. Deliberately **not**
  in secure-store: keystore entries are size-limited and unsuitable for trip
  histories.
- `src/storage/secureStorage.ts` — small sensitive preferences (emergency
  contact) in the OS keystore/keychain. `deleteEverything()` wipes both layers.

## Providers

`src/providers/` isolates geocoding/routing and location sources:

- `demo.ts` — default keyless provider: fixed demo routes + a drive simulator
  (simulated timestamps, played back at 6× real time)
- `deviceLocation.ts` — real GPS as a `LocationSource`; sampling starts/stops
  strictly with the trip
- `mapbox.ts` — unimplemented skeleton showing where a live provider plugs in;
  token comes from `EXPO_PUBLIC_MAPBOX_TOKEN` only

Route-progress matching is a nearest-point approximation (MVP/demo logic), not
true map-matching — see `packages/comparison`.

## Running locally

```bash
npm run start        # or from the repo root: npm run dev:mobile
```

Copy `.env.example` to `.env` to point Emergency Share at your backend
(`EXPO_PUBLIC_API_BASE_URL`); demo mode needs no configuration at all.
`eas.json` holds iOS/Android build profiles — see the root README for
simulator, physical-iPhone, and EAS build instructions (App Store/TestFlight
distribution requires an Apple Developer Program membership).
