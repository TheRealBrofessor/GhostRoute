import { haversineMeters } from "@ghostroute/comparison";
import { LatLon, LocationSample, Place } from "../types";
import { LocationSource, PlannedRoute, RouteProvider } from "./types";

/**
 * Keyless demo provider: fixed demo routes plus a location simulator, so the
 * whole record → save reference → drive-vs-reference loop works in a simulator
 * with no GPS movement and no API keys. All of this is clearly demo data — a
 * real provider replaces it behind the RouteProvider interface.
 */

/** Demo drives play back this many times faster than simulated time. */
const DEMO_TIME_SCALE = 6;

/** Densifies a sparse waypoint list so progress math has a smooth polyline. */
function interpolatePath(waypoints: LatLon[], stepMeters = 40): LatLon[] {
  const path: LatLon[] = [];
  for (let i = 0; i < waypoints.length - 1; i += 1) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const distance = haversineMeters(a, b);
    const steps = Math.max(1, Math.round(distance / stepMeters));
    for (let s = 0; s < steps; s += 1) {
      const t = s / steps;
      path.push({ lat: a.lat + (b.lat - a.lat) * t, lon: a.lon + (b.lon - a.lon) * t });
    }
  }
  path.push(waypoints[waypoints.length - 1]);
  return path;
}

function pathDistanceMeters(path: LatLon[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i += 1) total += haversineMeters(path[i - 1], path[i]);
  return total;
}

interface DemoRouteSeed {
  id: string;
  name: string;
  description: string;
  waypoints: LatLon[];
  estimatedDurationSeconds: number;
}

// Fictional drives laid out over lower Manhattan-ish coordinates.
const DEMO_ROUTE_SEEDS: DemoRouteSeed[] = [
  {
    id: "demo-riverside",
    name: "Riverside Loop",
    description: "Demo drive: ~2.4 km loop along the waterfront grid.",
    estimatedDurationSeconds: 360,
    waypoints: [
      { lat: 40.7052, lon: -74.0169 },
      { lat: 40.7079, lon: -74.0146 },
      { lat: 40.7107, lon: -74.0121 },
      { lat: 40.7133, lon: -74.0086 },
      { lat: 40.7147, lon: -74.0043 },
      { lat: 40.7128, lon: -74.006 },
    ],
  },
  {
    id: "demo-crosstown",
    name: "Crosstown Run",
    description: "Demo drive: ~3.1 km east-west crossing with a mid-route turn.",
    estimatedDurationSeconds: 480,
    waypoints: [
      { lat: 40.7218, lon: -74.0048 },
      { lat: 40.7222, lon: -73.9989 },
      { lat: 40.7198, lon: -73.9936 },
      { lat: 40.7229, lon: -73.9891 },
      { lat: 40.7264, lon: -73.9852 },
    ],
  },
];

export const DEMO_ROUTES: PlannedRoute[] = DEMO_ROUTE_SEEDS.map((seed) => {
  const path = interpolatePath(seed.waypoints);
  return {
    id: seed.id,
    name: seed.name,
    description: seed.description,
    path,
    distanceMeters: Math.round(pathDistanceMeters(path)),
    estimatedDurationSeconds: seed.estimatedDurationSeconds,
  };
});

export const demoRouteProvider: RouteProvider = {
  id: "demo",
  disclosure: "Demo routing — fixed sample routes, no live map data.",

  async geocode(query: string): Promise<Place[]> {
    const q = query.trim().toLowerCase();
    const matches = DEMO_ROUTES.filter(
      (route) => q.length === 0 || route.name.toLowerCase().includes(q)
    );
    return (matches.length > 0 ? matches : DEMO_ROUTES).map((route) => ({
      label: route.name,
      location: route.path[route.path.length - 1],
    }));
  },

  async planRoute(_origin: LatLon, destination: LatLon): Promise<PlannedRoute> {
    // Demo mode: return the demo route whose endpoint is closest to the destination.
    let best = DEMO_ROUTES[0];
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const route of DEMO_ROUTES) {
      const d = haversineMeters(route.path[route.path.length - 1], destination);
      if (d < bestDistance) {
        best = route;
        bestDistance = d;
      }
    }
    return best;
  },
};

export interface DemoDriveOptions {
  /** Overall pace vs. the base duration: 1 = same, 1.1 = 10% slower. */
  paceFactor?: number;
  /** Adds per-segment pace wobble so demo drives differ realistically. */
  paceJitter?: number;
}

/**
 * Simulated drive along a path. Emits samples with *simulated* timestamps at
 * DEMO_TIME_SCALE× real time; all trip math derives elapsed time from sample
 * timestamps, so recordings stay internally consistent.
 */
export function createDemoDriveSource(
  label: string,
  path: LatLon[],
  baseDurationSeconds: number,
  options: DemoDriveOptions = {}
): LocationSource {
  const paceFactor = options.paceFactor ?? 1;
  const paceJitter = options.paceJitter ?? 0.15;

  return {
    kind: "demo",
    label,

    async start(onSample: (sample: LocationSample) => void): Promise<() => void> {
      const totalDistance = pathDistanceMeters(path);
      const startTimestamp = Date.now();
      let index = 0;
      let simElapsedMs = 0;
      let stopped = false;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const emit = () => {
        if (stopped || index >= path.length) return;

        const point = path[index];
        onSample({
          lat: point.lat,
          lon: point.lon,
          timestamp: startTimestamp + simElapsedMs,
          accuracyMeters: 5,
        });

        index += 1;
        if (index >= path.length) return;

        const segmentMeters = haversineMeters(path[index - 1], path[index]);
        const jitter = 1 + (Math.random() * 2 - 1) * paceJitter;
        const segmentSimSeconds =
          (segmentMeters / Math.max(totalDistance, 1)) * baseDurationSeconds * paceFactor * jitter;

        simElapsedMs += segmentSimSeconds * 1000;
        timer = setTimeout(emit, (segmentSimSeconds * 1000) / DEMO_TIME_SCALE);
      };

      emit();

      return () => {
        stopped = true;
        if (timer) clearTimeout(timer);
      };
    },
  };
}
