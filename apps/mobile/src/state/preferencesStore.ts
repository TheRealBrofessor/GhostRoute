import { create } from "zustand";
import { getJSON, setJSON, STORAGE_KEYS } from "../storage/secureStorage";
import { DEFAULT_PREFERENCES, Preferences, RouteMode } from "../types";

interface PreferencesState extends Preferences {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setDefaultMode: (mode: RouteMode) => Promise<void>;
  setEmergencyContact: (contact: string) => Promise<void>;
  setHistoryEnabled: (enabled: boolean) => Promise<void>;
  reset: () => void;
}

async function persist(prefs: Preferences): Promise<void> {
  await setJSON(STORAGE_KEYS.preferences, prefs);
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  ...DEFAULT_PREFERENCES,
  hydrated: false,

  hydrate: async () => {
    const stored = await getJSON<Preferences>(STORAGE_KEYS.preferences);
    set({ ...DEFAULT_PREFERENCES, ...stored, hydrated: true });
  },

  setDefaultMode: async (mode) => {
    set({ defaultMode: mode });
    await persist(currentPreferences(get()));
  },

  setEmergencyContact: async (contact) => {
    set({ emergencyContact: contact });
    await persist(currentPreferences(get()));
  },

  setHistoryEnabled: async (enabled) => {
    set({ historyEnabled: enabled });
    await persist(currentPreferences(get()));
  },

  reset: () => set({ ...DEFAULT_PREFERENCES, hydrated: true }),
}));

function currentPreferences(state: PreferencesState): Preferences {
  return {
    defaultMode: state.defaultMode,
    emergencyContact: state.emergencyContact,
    historyEnabled: state.historyEnabled,
  };
}
