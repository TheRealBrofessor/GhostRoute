# GhostRoute operationalization roadmap

GhostRoute is not ready to be presented as an operational navigation/safety product yet. The repository has a coherent mobile/backend/scoring structure, but two pieces that determine whether the product actually works in the real world are still placeholders: geocoding and live candidate-route enrichment.

This document is the build order. Complete and verify each gate before moving to the next one.

## 0. Keep it private while the safety model is unproven

Do not market route labels such as "Safest" as factual safety guarantees. Until the routing inputs, weighting, confidence model, and real-world validation are complete, treat the project as an experimental route-comparison system.

Before any public release:

- remove or qualify claims that imply a route is objectively safe;
- document exactly which signals are used and which are unavailable;
- test privacy claims against actual network/log behavior;
- threat-model Emergency Share;
- decide what location-provider terms and usage limits apply.

## 1. Establish a reproducible local baseline

From the repository root:

```bash
npm install
npm run build
npm run test
npm run lint
```

Record the Node/npm versions used. Fix dependency, TypeScript, lint, and test failures before feature work.

Start Redis locally and then run:

```bash
npm run dev:backend
npm run dev:mobile
```

Confirm the mobile app can reach the backend on a physical device as well as an emulator/simulator. `localhost` from a phone is the phone, not the development machine; configure `EXPO_PUBLIC_API_BASE_URL` accordingly.

## 2. Replace placeholder geocoding

The mobile README currently says geocoding is a placeholder. Implement a provider behind the existing geocoding abstraction rather than coupling UI code directly to one vendor.

Requirements:

- forward geocoding for destination search;
- reverse geocoding only if the UX truly needs it;
- request throttling and caching;
- clear attribution where required;
- no location data in analytics because the product currently promises no third-party analytics;
- provider errors surfaced as useful user messages;
- tests with recorded/synthetic responses so CI does not depend on a live service.

Do not commit API keys. Use environment configuration and keep a safe `.env.example`.

## 3. Replace placeholder candidate-route generation

`apps/backend/src/services/candidateRoutes.ts` is documented as a placeholder. Replace it with a real routing adapter.

Recommended architecture:

1. routing engine returns 2-3 viable candidate geometries;
2. route geometry is segmented;
3. map/context data enriches those segments;
4. `@ghostroute/scoring` scores the enriched candidates;
5. the API returns both the score and the evidence/confidence used to compute it.

Keep the routing engine and enrichment source behind interfaces so OSRM, Valhalla, commercial routing APIs, or local services can be swapped without rewriting the product.

## 4. Make the safety/comfort signals defensible

Current factors include time, path type, lighting proxy, and openness. For each factor, create a data contract that states:

- source;
- update frequency;
- geographic coverage;
- units/normalization;
- missing-data behavior;
- confidence penalty;
- known failure modes.

Never convert "unknown" into "safe." Missing data must reduce confidence.

Add fixture-based tests for:

- complete data;
- partially missing OSM tags;
- contradictory tags;
- rural/urban edge cases;
- walking vs. cycling/driving where supported;
- routes whose score changes when the mode changes.

## 5. Reframe user-facing route language

Until empirical validation exists, labels should describe the scoring preference, not promise safety. For example:

- Fastest: prioritizes travel time;
- Balanced: balances time and available comfort/context signals;
- Cautious: prioritizes available context signals with confidence disclosure.

If the product keeps the word "Safest," every relevant screen must explain that it is a model score based on incomplete map/context data and is not a guarantee of personal safety.

## 6. Finish turn-by-turn navigation behavior

Verify that the Navigation screen is backed by real route instructions rather than scaffold data.

Required behaviors:

- current-position updates;
- route progress;
- next maneuver;
- off-route detection;
- reroute behavior;
- background/foreground transitions;
- permission denial;
- GPS loss;
- low-connectivity behavior;
- end-trip cleanup.

Decide explicitly whether navigation continues when the backend is unreachable after a route has been downloaded.

## 7. Harden Emergency Share

Emergency Share handles live location and therefore needs a separate security review.

Verify:

- high-entropy unguessable tokens;
- hard TTL that cannot be extended past the original expiry;
- rate limits for create/update/read;
- no coordinates in normal logs, traces, error reporters, URLs, or analytics;
- TLS in production;
- recipient view cannot enumerate sessions;
- expired/unknown token behavior does not leak useful distinctions;
- abuse controls do not require durable user identity;
- explicit stop-sharing action deletes the Redis record immediately;
- app termination and network loss have understandable user behavior.

Add automated tests around TTL, replay, token guessing resistance assumptions, and log scrubbing.

## 8. Validate privacy claims against implementation

The project claims no accounts, no third-party analytics/ad SDKs, local encrypted trip history, and ephemeral server-side share state.

Before release, inspect the final dependency graph and network traffic and verify those claims literally.

Create a data inventory covering:

- location sent to routing/geocoding providers;
- location sent to the GhostRoute backend;
- Redis data;
- device-local data;
- logs;
- crash reporting, if added later;
- retention/expiry for every item.

The Privacy Dashboard should be generated from this actual model rather than maintained as marketing copy.

## 9. Field-test the scoring model

Do not tune weights only by intuition.

Create a test protocol using known routes and multiple reviewers. Record:

- route options;
- input data coverage;
- factor scores;
- confidence;
- reviewer observations;
- obvious false positives/negatives.

The goal is not to claim scientific proof of safety. The goal is to identify whether the model produces useful, explainable route differences without hiding uncertainty.

## 10. Deployment

Backend:

- production Redis with TLS/auth/network restriction;
- HTTPS reverse proxy or managed platform;
- health/readiness endpoints;
- environment-based configuration;
- structured logs with location scrubbing verified;
- dependency/security updates;
- resource/rate-limit monitoring that does not collect route coordinates.

Mobile:

- production backend URL;
- release signing kept outside git;
- Android/iOS permission copy reviewed;
- store privacy disclosures match actual behavior;
- physical-device tests on current Android/iOS versions.

## 11. Release gate

GhostRoute is operational only when all of these are true:

- real geocoding works;
- real candidate routes work;
- enrichment/scoring works on real route data;
- missing data lowers confidence rather than implying safety;
- navigation handles reroutes and degraded connectivity;
- Emergency Share passes security/privacy tests;
- privacy claims match observed network/storage behavior;
- Android and iOS release builds are tested on physical devices;
- user-facing language does not overstate what the model knows.

Until then, keep the repository private and treat it as an experimental build rather than a deployed safety service.
