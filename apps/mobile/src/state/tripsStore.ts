import { create } from "zustand";
import * as tripStorage from "../storage/tripStorage";
import { GhostRouteReference, TripRecord } from "../types";

/**
 * In-memory view over local trip storage. All persistence stays on-device
 * (see storage/tripStorage.ts); this store just keeps screens in sync.
 */
interface TripsState {
  trips: TripRecord[];
  references: GhostRouteReference[];
  activeReferenceId: string | null;
  loaded: boolean;
  load: () => Promise<void>;
  saveTrip: (trip: TripRecord) => Promise<void>;
  deleteTrip: (tripId: string) => Promise<void>;
  saveReference: (reference: GhostRouteReference, makeActive?: boolean) => Promise<void>;
  deleteReference: (referenceId: string) => Promise<void>;
  setActiveReference: (referenceId: string | null) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useTripsStore = create<TripsState>((set, get) => ({
  trips: [],
  references: [],
  activeReferenceId: null,
  loaded: false,

  load: async () => {
    const [trips, references, activeReferenceId] = await Promise.all([
      tripStorage.getTrips(),
      tripStorage.getReferences(),
      tripStorage.getActiveReferenceId(),
    ]);
    set({ trips, references, activeReferenceId, loaded: true });
  },

  saveTrip: async (trip) => {
    set({ trips: await tripStorage.saveTrip(trip) });
  },

  deleteTrip: async (tripId) => {
    set({ trips: await tripStorage.deleteTrip(tripId) });
  },

  saveReference: async (reference, makeActive = true) => {
    const references = await tripStorage.saveReference(reference);
    if (makeActive) {
      await tripStorage.setActiveReferenceId(reference.id);
      set({ references, activeReferenceId: reference.id });
    } else {
      set({ references });
    }
  },

  deleteReference: async (referenceId) => {
    const references = await tripStorage.deleteReference(referenceId);
    const activeReferenceId =
      get().activeReferenceId === referenceId ? null : get().activeReferenceId;
    set({ references, activeReferenceId });
  },

  setActiveReference: async (referenceId) => {
    await tripStorage.setActiveReferenceId(referenceId);
    set({ activeReferenceId: referenceId });
  },

  clearAll: async () => {
    await tripStorage.clearAllTripData();
    set({ trips: [], references: [], activeReferenceId: null });
  },
}));

export function activeReference(state: TripsState): GhostRouteReference | null {
  return state.references.find((r) => r.id === state.activeReferenceId) ?? null;
}
