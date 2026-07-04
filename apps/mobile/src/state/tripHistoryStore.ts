import { create } from "zustand";
import { getJSON, setJSON, STORAGE_KEYS } from "../storage/secureStorage";
import { TripRecord } from "../types";

interface TripHistoryState {
  trips: TripRecord[];
  loaded: boolean;
  load: () => Promise<void>;
  /** No-op when history is disabled — callers should check preferences first. */
  addTrip: (trip: TripRecord) => Promise<void>;
  clear: () => Promise<void>;
}

export const useTripHistoryStore = create<TripHistoryState>((set, get) => ({
  trips: [],
  loaded: false,

  load: async () => {
    const stored = await getJSON<TripRecord[]>(STORAGE_KEYS.tripHistory);
    set({ trips: stored ?? [], loaded: true });
  },

  addTrip: async (trip) => {
    const trips = [trip, ...get().trips].slice(0, 200);
    set({ trips });
    await setJSON(STORAGE_KEYS.tripHistory, trips);
  },

  clear: async () => {
    set({ trips: [] });
    await setJSON(STORAGE_KEYS.tripHistory, []);
  },
}));
