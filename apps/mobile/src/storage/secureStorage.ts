import * as SecureStore from "expo-secure-store";
import { clearAllTripData } from "./tripStorage";

/**
 * Thin JSON wrapper over expo-secure-store, which persists to the platform
 * keystore/keychain (encrypted at rest, not readable by other apps). Only
 * small sensitive preferences live here — trip/location data is far too large
 * for the keystore and lives in tripStorage.ts instead.
 */

export const STORAGE_KEYS = {
  preferences: "ghostroute.preferences",
} as const;

export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setJSON<T>(key: string, value: T): Promise<void> {
  await SecureStore.setItemAsync(key, JSON.stringify(value));
}

export async function removeItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

/**
 * Wipes every value GhostRoute has ever written locally — secure preferences
 * AND all trips/references in local storage. Used by the Privacy Dashboard's
 * "Delete Everything".
 */
export async function deleteEverything(): Promise<void> {
  await Promise.all([
    ...Object.values(STORAGE_KEYS).map((key) => removeItem(key)),
    clearAllTripData(),
  ]);
}
