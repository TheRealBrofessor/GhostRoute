import Constants from "expo-constants";

/** Backend base URL. Override via `expo start` extra config or EXPO_PUBLIC_API_BASE_URL. */
export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  "http://localhost:3000";
