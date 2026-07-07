import { create } from "zustand";
import { getJSON, setJSON, STORAGE_KEYS } from "../storage/secureStorage";
import { DEFAULT_PREFERENCES, Preferences } from "../types";

interface PreferencesState extends Preferences {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setEmergencyContact: (contact: string) => Promise<void>;
  reset: () => void;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  ...DEFAULT_PREFERENCES,
  hydrated: false,

  hydrate: async () => {
    const stored = await getJSON<Preferences>(STORAGE_KEYS.preferences);
    set({ ...DEFAULT_PREFERENCES, ...stored, hydrated: true });
  },

  setEmergencyContact: async (contact) => {
    set({ emergencyContact: contact });
    await setJSON(STORAGE_KEYS.preferences, { emergencyContact: contact });
  },

  reset: () => set({ ...DEFAULT_PREFERENCES, hydrated: true }),
}));
