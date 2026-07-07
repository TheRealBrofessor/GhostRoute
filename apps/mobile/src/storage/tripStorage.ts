import AsyncStorage from "@react-native-async-storage/async-storage";
import { GhostRouteReference, TripRecord } from "../types";

/**
 * Local-only trip storage on AsyncStorage. Trips carry full location-sample
 * arrays, which is far too large for expo-secure-store (keystore entries are
 * size-limited) — so trips/references live here, while small sensitive
 * preferences stay in secureStorage.ts. Nothing in this file ever performs a
 * network call: trip and location data stays on the device unless the user
 * explicitly shares it.
 */

export const TRIP_STORAGE_KEYS = {
  trips: "ghostroute.trips",
  references: "ghostroute.references",
  activeReferenceId: "ghostroute.activeReferenceId",
} as const;

/** Oldest trips are dropped past this cap to bound local storage growth. */
const MAX_STORED_TRIPS = 50;

async function readJSON<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function getTrips(): Promise<TripRecord[]> {
  return (await readJSON<TripRecord[]>(TRIP_STORAGE_KEYS.trips)) ?? [];
}

export async function saveTrip(trip: TripRecord): Promise<TripRecord[]> {
  const trips = [trip, ...(await getTrips()).filter((t) => t.id !== trip.id)].slice(0, MAX_STORED_TRIPS);
  await AsyncStorage.setItem(TRIP_STORAGE_KEYS.trips, JSON.stringify(trips));
  return trips;
}

export async function deleteTrip(tripId: string): Promise<TripRecord[]> {
  const trips = (await getTrips()).filter((t) => t.id !== tripId);
  await AsyncStorage.setItem(TRIP_STORAGE_KEYS.trips, JSON.stringify(trips));
  return trips;
}

export async function getReferences(): Promise<GhostRouteReference[]> {
  return (await readJSON<GhostRouteReference[]>(TRIP_STORAGE_KEYS.references)) ?? [];
}

export async function saveReference(reference: GhostRouteReference): Promise<GhostRouteReference[]> {
  const references = [
    reference,
    ...(await getReferences()).filter((r) => r.id !== reference.id),
  ];
  await AsyncStorage.setItem(TRIP_STORAGE_KEYS.references, JSON.stringify(references));
  return references;
}

export async function deleteReference(referenceId: string): Promise<GhostRouteReference[]> {
  const references = (await getReferences()).filter((r) => r.id !== referenceId);
  await AsyncStorage.setItem(TRIP_STORAGE_KEYS.references, JSON.stringify(references));

  const activeId = await getActiveReferenceId();
  if (activeId === referenceId) {
    await AsyncStorage.removeItem(TRIP_STORAGE_KEYS.activeReferenceId);
  }
  return references;
}

export async function getActiveReferenceId(): Promise<string | null> {
  return AsyncStorage.getItem(TRIP_STORAGE_KEYS.activeReferenceId);
}

export async function setActiveReferenceId(referenceId: string | null): Promise<void> {
  if (referenceId === null) {
    await AsyncStorage.removeItem(TRIP_STORAGE_KEYS.activeReferenceId);
  } else {
    await AsyncStorage.setItem(TRIP_STORAGE_KEYS.activeReferenceId, referenceId);
  }
}

/** Removes every trip, reference, and related key GhostRoute keeps locally. */
export async function clearAllTripData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(TRIP_STORAGE_KEYS));
}
