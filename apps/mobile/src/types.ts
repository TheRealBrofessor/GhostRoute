import { FactorScore, RouteMode, RouteSegment, TravelMode } from "@ghostroute/scoring";

export type { RouteMode, TravelMode, FactorScore, RouteSegment };

export interface LatLon {
  lat: number;
  lon: number;
}

export interface Place {
  label: string;
  location: LatLon;
}

export interface ConfidenceInfo {
  overall: number;
  byFactor: Record<string, number>;
  degradedFactors: string[];
  message: string;
}

export interface RouteOption {
  id: string;
  score: number;
  summary: string;
  distanceMeters: number;
  durationSeconds: number;
  factors: FactorScore[];
  confidence: ConfidenceInfo;
  segments: RouteSegment[];
}

export interface RouteQuoteResponse {
  mode: RouteMode;
  travelMode: TravelMode;
  routes: RouteOption[];
}

export interface TripRecord {
  id: string;
  destinationLabel: string;
  mode: RouteMode;
  score: number;
  distanceMeters: number;
  durationSeconds: number;
  completedAt: number;
}

export interface Preferences {
  defaultMode: RouteMode;
  emergencyContact: string;
  historyEnabled: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  defaultMode: "balanced",
  emergencyContact: "",
  historyEnabled: false,
};
