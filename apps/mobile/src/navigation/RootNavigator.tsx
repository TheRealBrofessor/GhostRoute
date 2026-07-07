import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import RecordTripScreen from "../screens/RecordTripScreen";
import TripSummaryScreen from "../screens/TripSummaryScreen";
import SavedRoutesScreen from "../screens/SavedRoutesScreen";
import GhostNavigationScreen from "../screens/GhostNavigationScreen";
import ComparisonScreen from "../screens/ComparisonScreen";
import PrivacyDashboardScreen from "../screens/PrivacyDashboardScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { RootStackParamList } from "./types";
import { colors } from "../theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RecordTrip" component={RecordTripScreen} options={{ title: "Record Trip" }} />
      <Stack.Screen
        name="TripSummary"
        component={TripSummaryScreen}
        options={{ title: "Trip Summary", headerBackVisible: false }}
      />
      <Stack.Screen name="SavedRoutes" component={SavedRoutesScreen} options={{ title: "Saved Routes" }} />
      <Stack.Screen name="GhostNavigation" component={GhostNavigationScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Comparison"
        component={ComparisonScreen}
        options={{ title: "Trip Comparison", headerBackVisible: false }}
      />
      <Stack.Screen name="PrivacyDashboard" component={PrivacyDashboardScreen} options={{ title: "Privacy" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
    </Stack.Navigator>
  );
}
