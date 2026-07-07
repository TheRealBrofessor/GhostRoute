import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useTripsStore } from "../state/tripsStore";
import { formatDistance, formatDuration, formatSpeed } from "../utils/format";
import { colors, radii, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "TripSummary">;

export default function TripSummaryScreen({ route, navigation }: Props) {
  const { trip } = route.params;
  const saveTrip = useTripsStore((state) => state.saveTrip);
  const saveReference = useTripsStore((state) => state.saveReference);
  const [busy, setBusy] = useState(false);

  async function handleSaveTrip() {
    setBusy(true);
    try {
      await saveTrip(trip);
      navigation.popToTop();
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveAsReference() {
    setBusy(true);
    try {
      await saveTrip(trip);
      await saveReference({
        id: `ref-${trip.id}`,
        name: trip.destinationLabel ?? trip.name,
        createdAt: Date.now(),
        trip,
      });
      navigation.popToTop();
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{trip.name}</Text>
      {trip.isDemo && <Text style={styles.demoBadge}>Demo trip — simulated location data</Text>}

      <View style={styles.statsCard}>
        <Stat label="Distance" value={formatDistance(trip.distanceMeters)} />
        <Stat label="Duration" value={formatDuration(trip.durationSeconds)} />
        <Stat label="Pace" value={formatSpeed(trip.averageSpeedMps)} />
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          Route consistency is calculated when you drive this route again against a saved
          reference — save this trip as your reference to enable comparisons.
        </Text>
      </View>

      <Text style={styles.privacyNote}>
        Nothing has been stored yet. Saving keeps this trip only on this device.
      </Text>

      <View style={styles.actions}>
        <Pressable style={[styles.primaryButton, busy && styles.disabled]} disabled={busy} onPress={handleSaveAsReference}>
          <Text style={styles.primaryButtonText}>Save & Set as Reference</Text>
        </Pressable>
        <Pressable style={[styles.secondaryButton, busy && styles.disabled]} disabled={busy} onPress={handleSaveTrip}>
          <Text style={styles.secondaryButtonText}>Save Trip</Text>
        </Pressable>
        <Pressable style={styles.discardButton} disabled={busy} onPress={() => navigation.popToTop()}>
          <Text style={styles.discardButtonText}>Discard</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: 20, fontWeight: "800", marginTop: spacing.sm },
  demoBadge: { color: colors.warning, fontSize: 12, fontWeight: "700" },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stat: { alignItems: "center", gap: spacing.xs },
  statValue: { color: colors.text, fontSize: 18, fontWeight: "800" },
  statLabel: { color: colors.textMuted, fontSize: 12 },
  infoCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  infoText: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  privacyNote: { color: colors.textMuted, fontSize: 12, textAlign: "center" },
  actions: { marginTop: "auto", gap: spacing.sm, paddingBottom: spacing.md },
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
  },
  secondaryButtonText: { color: colors.text, fontWeight: "700" },
  discardButton: { paddingVertical: spacing.sm, alignItems: "center" },
  discardButtonText: { color: colors.textMuted, textDecorationLine: "underline" },
  disabled: { opacity: 0.6 },
});
