import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import ModeSelector from "../components/ModeSelector";
import { RootStackParamList } from "../navigation/types";
import { usePreferencesStore } from "../state/preferencesStore";
import { RouteMode, TravelMode } from "../types";
import { geocode } from "../utils/geocode";
import { getCurrentLocation } from "../utils/location";
import { colors, radii, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const TRAVEL_MODES: { key: TravelMode; label: string }[] = [
  { key: "walk", label: "Walk" },
  { key: "bike", label: "Bike" },
  { key: "drive", label: "Drive" },
];

export default function HomeScreen({ navigation }: Props) {
  const defaultMode = usePreferencesStore((state) => state.defaultMode);
  const [destinationQuery, setDestinationQuery] = useState("");
  const [mode, setMode] = useState<RouteMode>(defaultMode);
  const [travelMode, setTravelMode] = useState<TravelMode>("drive");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFindRoutes() {
    if (!destinationQuery.trim()) {
      setError("Enter a destination first.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const [origin, destination] = await Promise.all([
        getCurrentLocation(),
        geocode(destinationQuery),
      ]);

      if (!origin) {
        setError("GhostRoute needs location access to find routes from where you are.");
        return;
      }

      navigation.navigate("RouteOptions", { origin, destination, mode, travelMode });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>GhostRoute</Text>
      <Text style={styles.subtitle}>Where are you headed?</Text>

      <TextInput
        style={styles.input}
        placeholder="Search destination"
        placeholderTextColor={colors.textMuted}
        value={destinationQuery}
        onChangeText={setDestinationQuery}
        returnKeyType="search"
        onSubmitEditing={handleFindRoutes}
      />

      <Text style={styles.sectionLabel}>Mode</Text>
      <ModeSelector value={mode} onChange={setMode} />

      <Text style={styles.sectionLabel}>Travel type</Text>
      <View style={styles.travelRow}>
        {TRAVEL_MODES.map(({ key, label }) => {
          const selected = key === travelMode;
          return (
            <Pressable
              key={key}
              onPress={() => setTravelMode(key)}
              style={[styles.travelChip, selected && styles.travelChipSelected]}
            >
              <Text style={[styles.travelChipText, selected && styles.travelChipTextSelected]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.cta, loading && styles.ctaDisabled]}
        onPress={handleFindRoutes}
        disabled={loading}
      >
        <Text style={styles.ctaText}>{loading ? "Finding routes…" : "Find Routes"}</Text>
      </Pressable>

      <View style={styles.footerLinks}>
        <Pressable onPress={() => navigation.navigate("Settings")}>
          <Text style={styles.link}>Settings</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("PrivacyDashboard")}>
          <Text style={styles.link}>Privacy Dashboard</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: 28, fontWeight: "800", marginTop: spacing.md },
  subtitle: { color: colors.textMuted, fontSize: 15, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: 16,
  },
  sectionLabel: { color: colors.textMuted, fontSize: 13, fontWeight: "600", marginTop: spacing.sm },
  travelRow: { flexDirection: "row", gap: spacing.sm },
  travelChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  travelChipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  travelChipText: { color: colors.textMuted, fontWeight: "600" },
  travelChipTextSelected: { color: colors.background },
  error: { color: colors.danger, fontSize: 13 },
  cta: {
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: colors.background, fontWeight: "800", fontSize: 16 },
  footerLinks: {
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: spacing.md,
  },
  link: { color: colors.textMuted, fontSize: 13, textDecorationLine: "underline" },
});
