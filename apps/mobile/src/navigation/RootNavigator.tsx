import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import RouteOptionsScreen from "../screens/RouteOptionsScreen";
import RouteExplanationSheet from "../screens/RouteExplanationSheet";
import NavigationScreen from "../screens/NavigationScreen";
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
      <Stack.Screen name="RouteOptions" component={RouteOptionsScreen} options={{ title: "Route Options" }} />
      <Stack.Screen
        name="RouteExplanation"
        component={RouteExplanationSheet}
        options={{ presentation: "modal", title: "" }}
      />
      <Stack.Screen name="Navigation" component={NavigationScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PrivacyDashboard" component={PrivacyDashboardScreen} options={{ title: "Privacy" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
    </Stack.Navigator>
  );
}
