import { TripComparison, TripRecord } from "../types";

export type RootStackParamList = {
  Home: undefined;
  RecordTrip: undefined;
  TripSummary: { trip: TripRecord };
  SavedRoutes: undefined;
  GhostNavigation: { referenceId: string };
  Comparison: { trip: TripRecord; comparison: TripComparison };
  PrivacyDashboard: undefined;
  Settings: undefined;
};
