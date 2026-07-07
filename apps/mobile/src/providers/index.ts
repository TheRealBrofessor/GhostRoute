import { demoRouteProvider } from "./demo";
import { MAPBOX_TOKEN, mapboxRouteProvider } from "./mapbox";
import { RouteProvider } from "./types";

export type { LocationSource, PlannedRoute, RouteProvider } from "./types";
export { DEMO_ROUTES, createDemoDriveSource } from "./demo";
export { createGpsLocationSource } from "./deviceLocation";

/**
 * Provider selection is env-driven and defaults to the keyless demo provider,
 * so the app always runs without credentials. EXPO_PUBLIC_ROUTE_PROVIDER=mapbox
 * plus EXPO_PUBLIC_MAPBOX_TOKEN switches to Mapbox once that provider is
 * implemented (see providers/mapbox.ts).
 */
export function getRouteProvider(): RouteProvider {
  const requested = process.env.EXPO_PUBLIC_ROUTE_PROVIDER ?? "demo";
  if (requested === "mapbox" && MAPBOX_TOKEN) {
    return mapboxRouteProvider;
  }
  return demoRouteProvider;
}
