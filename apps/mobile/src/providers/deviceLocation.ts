import * as Location from "expo-location";
import { LocationSample } from "../types";
import { LocationSource } from "./types";

/**
 * Real device GPS as a LocationSource. Sampling starts only when a trip
 * starts and the returned stop function tears the watcher down — GhostRoute
 * never watches location outside an active trip.
 */
export function createGpsLocationSource(): LocationSource {
  return {
    kind: "gps",
    label: "Device GPS",

    async start(onSample: (sample: LocationSample) => void): Promise<() => void> {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Location permission is required to record a trip.");
      }

      const subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 5 },
        (position) => {
          onSample({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            timestamp: position.timestamp,
            speedMps: position.coords.speed ?? undefined,
            headingDegrees: position.coords.heading ?? undefined,
            accuracyMeters: position.coords.accuracy ?? undefined,
          });
        }
      );

      return () => subscription.remove();
    },
  };
}
