import { LatLon, Place } from "../types";
import { PlannedRoute, RouteProvider } from "./types";

/**
 * Skeleton for a real Mapbox-backed provider. Not implemented in the MVP —
 * it exists to show where a live provider plugs in and how credentials are
 * handled: the token comes from EXPO_PUBLIC_MAPBOX_TOKEN only (see
 * .env.example), never hardcoded. Selecting "mapbox" without a token falls
 * back to the demo provider in providers/index.ts.
 */
export const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

export const mapboxRouteProvider: RouteProvider = {
  id: "mapbox",
  disclosure: "Mapbox routing",

  async geocode(_query: string): Promise<Place[]> {
    // TODO: GET https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json?access_token=MAPBOX_TOKEN
    throw new Error("Mapbox provider is not implemented yet — run in demo mode (EXPO_PUBLIC_ROUTE_PROVIDER=demo).");
  },

  async planRoute(_origin: LatLon, _destination: LatLon): Promise<PlannedRoute> {
    // TODO: GET https://api.mapbox.com/directions/v5/mapbox/driving/... with access_token=MAPBOX_TOKEN
    throw new Error("Mapbox provider is not implemented yet — run in demo mode (EXPO_PUBLIC_ROUTE_PROVIDER=demo).");
  },
};
