import React, { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";
import { activeReference, useTripsStore } from "../state/tripsStore";
import { formatDistance, formatDuration } from "../utils/format";
import { colors, radii, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const load = useTripsStore((state) => state.load);
  const reference = useTripsStore(activeReference);
  const referenceCount = useTripsStore((state) => state.references.length);
  const tripCount = useTripsStore((state) => state.trips.length);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>GhostRoute</Text>
      <Text style={styles.subtitle}>
        Record your regular drives, save your most efficient trip as a reference, and quietly see
        how today's drive compares.
      </Text>

      {reference ? (
        <View style={styles.referenceCard}>
          <Text style={styles.referenceLabel}>Active reference route</Text>
          <Text style={styles.referenceName}>{reference.name}</Text>
          <Text style={styles.referenceMeta}>
            {formatDistance(reference.trip.distanceMeters)} · {formatDuration(reference.trip.durationSeconds)}
            {reference.trip.isDemo ? " · demo trip" : ""}
          </Text>
        </View>
      ) : (
        <View style={styles.referenceCard}>
          <Text style={styles.referenceLabel}>No reference route yet</Text>
          <Text style={styles.referenceMeta}>
            Record a trip first, then save it as your reference to compare later drives against it.
          </Text>
        </View>
      )}

      <Pressable style={styles.primaryButton} onPress={() => navigation.navigate("RecordTrip")}>
        <Text style={styles.primaryButtonText}>Record a Trip</Text>
      </Pressable>

      <Pressable
        style={[styles.secondaryButton, !reference && styles.buttonDisabled]}
        disabled={!reference}
        onPress={() => reference && navigation.navigate("GhostNavigation", { referenceId: reference.id })}
      >
        <Text style={styles.secondaryButtonText}>
          {reference ? "Drive vs. Reference" : "Drive vs. Reference (save a reference first)"}
        </Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("SavedRoutes")}>
        <Text style={styles.secondaryButtonText}>
          Saved Routes ({referenceCount} reference{referenceCount === 1 ? "" : "s"}, {tripCount} trip
          {tripCount === 1 ? "" : "s"})
        </Text>
      </Pressable>

      <Text style={styles.privacyNote}>
        Trips are stored only on this device, and only when you choose to save them.
      </Text>

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
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  referenceCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  referenceLabel: { color: colors.accent, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  referenceName: { color: colors.text, fontSize: 18, fontWeight: "700" },
  referenceMeta: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
  },
  primaryButtonText: { color: colors.background, fontWeight: "800", fontSize: 16 },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },
  secondaryButtonText: { color: colors.text, fontWeight: "700", textAlign: "center" },
  buttonDisabled: { opacity: 0.5 },
  privacyNote: { color: colors.textMuted, fontSize: 12, textAlign: "center" },
  footerLinks: {
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: spacing.md,
  },
  link: { color: colors.textMuted, fontSize: 13, textDecorationLine: "underline" },
});
