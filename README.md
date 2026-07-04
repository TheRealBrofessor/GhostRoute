# GhostRoute

GhostRoute is a privacy-first navigation app that scores routes on safety and comfort, not just speed. Instead of a single "fastest" path, GhostRoute proposes 2-3 routes and explains *why* each one is Fastest, Balanced, or Safest — using lighting proxies, path type, openness, and road-network data, with full transparency about confidence when underlying map data is incomplete.

GhostRoute has no accounts, no third-party analytics, and no ad SDKs. Trip history is off by default, stored only on-device and encrypted. The only server-side state is short-lived Emergency Share sessions, capped at 12 hours and never persisted after expiry.

---

## Core Principles

- **No accounts** — nothing to sign up for, nothing tied to an identity
- **On-device by default** — route scoring runs on the phone; the backend only proposes candidate routes
- **Off by default** — trip history is opt-in; Emergency Share is a deliberate, per-trip action
- **Ephemeral by design** — share sessions hard-expire at 12h; no durable coordinate storage server-side
- **Transparent scoring** — every route score comes with a factor breakdown and a confidence disclosure

---

## Repository Structure

```
/apps/mobile       React Native (TypeScript) app — screens, navigation, local encrypted storage
/apps/backend      Node.js/Fastify API — route proposals, Emergency Share sessions (Redis-backed)
/packages/scoring  Shared route scoring engine used on-device and (for parity) on the server
```

See each package's README for details:

- [apps/mobile/README.md](apps/mobile/README.md)
- [apps/backend/README.md](apps/backend/README.md)
- [packages/scoring/README.md](packages/scoring/README.md)

---

## Features (MVP)

**Mobile**
- Home screen: destination search + Fastest / Balanced / Safest mode selector
- Route Options: 2-3 scored route cards (score badge, time, distance, one-line summary)
- Route Explanation sheet: per-factor breakdown and confidence disclosure
- Navigation screen: turn-by-turn, Share ETA, End Trip
- Privacy Dashboard: exactly what's stored, with a Delete Everything button
- Settings: default mode, emergency contact, history toggle (default OFF)
- All prefs/history stored locally, encrypted at rest

**Backend**
- `POST /route` — origin/destination/mode/travel type → 2-3 scored routes
- `POST /share` — create an Emergency Share session → token URL
- `PUT /share/:token/position` — traveler posts live position
- `GET /share/:token` — recipient view; `410 Gone` after expiry
- Redis-backed share sessions, 12h hard TTL cap, rate-limited endpoints, coordinate scrubbing in logs

**Scoring engine**
- Weighted-sum scoring per route segment: time, path type, lighting proxy, openness
- Three mode weight profiles: Fastest / Balanced / Safest
- Confidence scoring that degrades gracefully when OSM tags are missing
- 0-100 score + factor breakdown for the explanation card

---

## Getting Started

```bash
npm install
npm run build   # compiles packages/scoring, which both apps depend on

# Backend (requires a local Redis instance)
npm run dev:backend

# Mobile (Expo)
npm run dev:mobile
```

## Privacy & Data Handling

- No accounts, no login, no device fingerprinting
- No third-party analytics or advertising SDKs of any kind
- Trip history is disabled by default; when enabled, it is stored locally with encryption and never leaves the device
- Emergency Share is opt-in per trip, auto-expires (12h hard cap), and is never written to durable storage server-side
- Server logs scrub coordinates before they are written
- Privacy Dashboard screen always shows exactly what is stored, with a one-tap "Delete Everything"
