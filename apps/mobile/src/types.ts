import type {
  GhostRouteReference,
  LatLon,
  LiveGhostDelta,
  LocationSample,
  RouteProgressPoint,
  TripComparison,
  TripRecord,
  TripSegmentDelta,
} from "@ghostroute/comparison";

export type {
  GhostRouteReference,
  LatLon,
  LiveGhostDelta,
  LocationSample,
  RouteProgressPoint,
  TripComparison,
  TripRecord,
  TripSegmentDelta,
};

export interface Place {
  label: string;
  location: LatLon;
}

export interface Preferences {
  emergencyContact: string;
}

export const DEFAULT_PREFERENCES: Preferences = {
  emergencyContact: "",
};
