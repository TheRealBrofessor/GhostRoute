import { Place, RouteMode, RouteOption, TravelMode } from "../types";

export type RootStackParamList = {
  Home: undefined;
  RouteOptions: {
    origin: { lat: number; lon: number };
    destination: Place;
    mode: RouteMode;
    travelMode: TravelMode;
  };
  RouteExplanation: { route: RouteOption };
  Navigation: {
    destination: Place;
    route: RouteOption;
    mode: RouteMode;
  };
  PrivacyDashboard: undefined;
  Settings: undefined;
};
