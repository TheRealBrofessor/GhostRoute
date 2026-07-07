export interface LatLon {
  lat: number;
  lon: number;
}

/** One GPS (or simulated) fix captured during an active trip. */
export interface LocationSample extends LatLon {
  /** Epoch milliseconds. */
  timestamp: number;
  speedMps?: number;
  headingDegrees?: number;
  accuracyMeters?: number;
}

/** A completed, locally-stored trip. Samples never leave the device unless the user shares them. */
export interface TripRecord {
  id: string;
  name: string;
  /** Epoch ms. */
  startedAt: number;
  /** Epoch ms. */
  endedAt: number;
  samples: LocationSample[];
  distanceMeters: number;
  durationSeconds: number;
  averageSpeedMps: number;
  destinationLabel?: string;
  /** Set when this trip was driven against a saved reference. */
  ghostRouteId?: string;
  /** True when the trip came from the built-in demo simulator, not real GPS. */
  isDemo?: boolean;
}

/** A saved reference ("ghost") route — the trip the user chose as their personal baseline. */
export interface GhostRouteReference {
  id: string;
  name: string;
  createdAt: number;
  /** The full source trip; embedded so a reference survives deleting the original trip. */
  trip: TripRecord;
}

/** A point along the reference route with cumulative distance and elapsed time. */
export interface RouteProgressPoint extends LatLon {
  cumulativeDistanceMeters: number;
  elapsedSeconds: number;
}

/**
 * Live comparison of the current trip against the reference at one moment.
 * Positive deltaSeconds = current trip is behind the reference;
 * negative = ahead of the reference.
 */
export interface LiveGhostDelta {
  deltaSeconds: number;
  /** Distance covered along the reference route, meters. */
  progressMeters: number;
  /** 0-1 fraction of the reference route covered. */
  progressFraction: number;
  /** What the reference trip's clock read at this route position. */
  referenceElapsedSeconds: number;
  currentElapsedSeconds: number;
  /** Straight-line distance from the current position to the reference path. */
  distanceFromRouteMeters: number;
  /** True when the current position is farther from the reference path than the deviation threshold. */
  offRoute: boolean;
  /** Neutral display string, e.g. "+0:42 behind reference". */
  label: string;
}

/** Time difference over one distance slice of the reference route. */
export interface TripSegmentDelta {
  index: number;
  startDistanceMeters: number;
  endDistanceMeters: number;
  referenceDurationSeconds: number;
  currentDurationSeconds: number;
  /** Positive = slower than reference over this slice. */
  deltaSeconds: number;
}

/** Full post-drive comparison of a trip against its reference. */
export interface TripComparison {
  referenceId: string;
  referenceName: string;
  /** Positive = current trip took longer overall (over the portion completed). */
  totalDeltaSeconds: number;
  currentDistanceMeters: number;
  currentDurationSeconds: number;
  referenceDurationSeconds: number;
  /** 0-1 fraction of the reference route the current trip covered. */
  completedFraction: number;
  segmentDeltas: TripSegmentDelta[];
  /** 0-100. Higher = more even pace relative to the reference across segments. */
  consistencyScore: number;
  deviationNotes: string[];
  /** Neutral post-drive observations, e.g. which segment accounted for the difference. */
  insights: string[];
}
