import { LatLon, LocationSample, Place } from "../types";

/** A planned route polyline from a provider (demo, Mapbox, Google Routes, OSRM, ...). */
export interface PlannedRoute {
  id: string;
  name: string;
  description: string;
  path: LatLon[];
  distanceMeters: number;
  estimatedDurationSeconds: number;
}

/**
 * Geocoding + routing abstraction. The demo provider works with no API key;
 * real providers (Mapbox/Google/OSRM) plug in behind the same interface using
 * env-var credentials only — see providers/mapbox.ts and .env.example.
 */
export interface RouteProvider {
  readonly id: string;
  /** Human note shown in the UI so demo data is never mistaken for real routing. */
  readonly disclosure: string;
  geocode(query: string): Promise<Place[]>;
  planRoute(origin: LatLon, destination: LatLon): Promise<PlannedRoute>;
}

/**
 * Where location fixes come from during an active trip: real device GPS or
 * the built-in demo simulator. start() begins emitting samples and resolves
 * to a stop function; no samples are ever produced outside start/stop.
 */
export interface LocationSource {
  kind: "gps" | "demo";
  label: string;
  start(onSample: (sample: LocationSample) => void): Promise<() => void>;
}
