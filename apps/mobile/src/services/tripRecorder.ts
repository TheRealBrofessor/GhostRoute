import { haversineMeters } from "@ghostroute/comparison";
import { LocationSource } from "../providers/types";
import { LocationSample, TripRecord } from "../types";

export interface RecorderSnapshot {
  samples: LocationSample[];
  distanceMeters: number;
  elapsedSeconds: number;
  lastSample: LocationSample | null;
}

/**
 * Accumulates location samples for one active trip. Elapsed time and distance
 * derive from the samples themselves (not a wall clock), which keeps demo
 * playback — whose timestamps are simulated — consistent with real GPS trips.
 */
export class TripRecorder {
  private samples: LocationSample[] = [];
  private distanceMeters = 0;
  private stopSource: (() => void) | null = null;

  constructor(private readonly onUpdate: (snapshot: RecorderSnapshot) => void) {}

  async start(source: LocationSource): Promise<void> {
    this.stopSource = await source.start((sample) => this.push(sample));
  }

  private push(sample: LocationSample): void {
    const previous = this.samples[this.samples.length - 1];
    if (previous) {
      // Ignore obviously noisy fixes (poor accuracy jumping the position around).
      if (sample.accuracyMeters !== undefined && sample.accuracyMeters > 50) return;
      this.distanceMeters += haversineMeters(previous, sample);
    }
    this.samples.push(sample);
    this.onUpdate(this.snapshot());
  }

  snapshot(): RecorderSnapshot {
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    return {
      samples: this.samples,
      distanceMeters: this.distanceMeters,
      elapsedSeconds: first && last ? (last.timestamp - first.timestamp) / 1000 : 0,
      lastSample: last ?? null,
    };
  }

  /** Stops sampling and finalizes the trip; returns null if too little was recorded. */
  stop(params: { name: string; destinationLabel?: string; ghostRouteId?: string; isDemo?: boolean }): TripRecord | null {
    this.stopSource?.();
    this.stopSource = null;

    if (this.samples.length < 2) return null;

    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const durationSeconds = (last.timestamp - first.timestamp) / 1000;

    return {
      id: `trip-${first.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
      name: params.name,
      startedAt: first.timestamp,
      endedAt: last.timestamp,
      samples: this.samples,
      distanceMeters: Math.round(this.distanceMeters),
      durationSeconds: Math.round(durationSeconds),
      averageSpeedMps: durationSeconds > 0 ? this.distanceMeters / durationSeconds : 0,
      destinationLabel: params.destinationLabel,
      ghostRouteId: params.ghostRouteId,
      isDemo: params.isDemo,
    };
  }

  /** Tears down sampling without producing a trip (user discarded / screen unmounted). */
  abort(): void {
    this.stopSource?.();
    this.stopSource = null;
  }
}
