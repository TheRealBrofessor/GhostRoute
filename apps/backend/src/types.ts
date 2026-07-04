import { RouteMode, TravelMode } from "@ghostroute/scoring";

export interface LatLon {
  lat: number;
  lon: number;
}

export interface RouteRequestBody {
  origin: LatLon;
  destination: LatLon;
  mode: RouteMode;
  travelMode: TravelMode;
}

export interface CreateShareRequestBody {
  /** Requested lifetime in minutes. Clamped to `config.shareTtlMaxSeconds`. */
  durationMinutes?: number;
  destinationLabel?: string;
  emergencyContact?: string;
}

export interface PositionUpdateBody {
  lat: number;
  lon: number;
  headingDegrees?: number;
  speedKph?: number;
  etaSeconds?: number;
}

export interface ShareSession {
  token: string;
  createdAt: number;
  expiresAt: number;
  destinationLabel?: string;
  emergencyContact?: string;
  lastPosition?: {
    lat: number;
    lon: number;
    headingDegrees?: number;
    speedKph?: number;
    etaSeconds?: number;
    updatedAt: number;
  };
}
