import * as SecureStore from "expo-secure-store";

/**
 * Thin JSON wrapper over expo-secure-store, which persists to the platform
 * keystore/keychain (encrypted at rest, not readable by other apps). Used for
 * both preferences and trip history — neither ever leaves the device.
 */

export const STORAGE_KEYS = {
  preferences: "ghostroute.preferences",
  tripHistory: "ghostroute.tripHistory",
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

/** Wipes every value GhostRoute has ever written locally. Used by the Privacy Dashboard's "Delete Everything". */
export async function deleteEverything(): Promise<void> {
  await Promise.all(Object.values(STORAGE_KEYS).map((key) => removeItem(key)));
}
