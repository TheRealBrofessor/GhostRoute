import * as Location from "expo-location";
import { LatLon } from "../types";

export async function getCurrentLocation(): Promise<LatLon | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return null;

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return { lat: position.coords.latitude, lon: position.coords.longitude };
}

export function watchLocation(
  onUpdate: (location: LatLon & { headingDegrees?: number; speedKph?: number }) => void
): Promise<Location.LocationSubscription> {
  return Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 20 },
    (position) => {
      onUpdate({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        headingDegrees: position.coords.heading ?? undefined,
        speedKph: position.coords.speed ? position.coords.speed * 3.6 : undefined,
      });
    }
  );
}
