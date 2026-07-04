import { LatLon, Place } from "../types";

const REFERENCE_CENTER: LatLon = { lat: 40.7128, lon: -74.006 };

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Stands in for a real geocoding provider (Mapbox/Google/Nominatim), which
 * needs an API key this scaffold doesn't have. Deterministically maps a
 * query string to a nearby point so the rest of the app has something real
 * to route against during development.
 */
export async function geocode(query: string): Promise<Place> {
  const trimmed = query.trim();
  const hash = hashString(trimmed || "ghostroute");
  const latOffset = ((hash % 1000) / 1000 - 0.5) * 0.08;
  const lonOffset = (((hash >> 8) % 1000) / 1000 - 0.5) * 0.08;

  return {
    label: trimmed || "Destination",
    location: {
      lat: REFERENCE_CENTER.lat + latOffset,
      lon: REFERENCE_CENTER.lon + lonOffset,
    },
  };
}
