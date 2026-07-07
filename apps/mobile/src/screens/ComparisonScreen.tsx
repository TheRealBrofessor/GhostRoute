import React, { useState } from "react";
import { ScrollView, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useTripsStore } from "../state/tripsStore";
import { formatClock, formatDistance, formatDuration, formatSignedClock } from "../utils/format";
import { colors, radii, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Comparison">;

/** Post-drive analysis vs. the reference trip. Detail lives here, not while driving. */
export default function ComparisonScreen({ route, navigation }: Props) {
  const { trip, comparison } = route.params;
  const saveTrip = useTripsStore((state) => state.saveTrip);
  const saveReference = useTripsStore((state) => state.saveReference);
  const [busy, setBusy] = useState(false);

  const overallLabel =
    Math.abs(comparison.totalDeltaSeconds) <= 5
      ? "matched the reference"
      : comparison.totalDeltaSeconds > 0
        ? "behind the reference"
        : "ahead of the reference";

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
        name: comparison.referenceName,
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.overline}>vs. {comparison.referenceName}</Text>
        <View style={styles.totalCard}>
          <Text style={styles.totalDelta}>{formatSignedClock(comparison.totalDeltaSeconds)}</Text>
          <Text style={styles.totalLabel}>{overallLabel}</Text>
        </View>

        <View style={styles.statsCard}>
          <Stat label="Distance" value={formatDistance(comparison.currentDistanceMeters)} />
          <Stat label="Duration" value={formatDuration(comparison.currentDurationSeconds)} />
          <Stat label="Reference" value={formatDuration(comparison.referenceDurationSeconds)} />
          <Stat label="Consistency" value={`${comparison.consistencyScore}/100`} />
        </View>

        {comparison.insights.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Efficiency insights</Text>
            {comparison.insights.map((insight) => (
              <Text key={insight} style={styles.cardText}>
                • {insight}
              </Text>
            ))}
          </View>
        )}

        {comparison.deviationNotes.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Route notes</Text>
            {comparison.deviationNotes.map((note) => (
              <Text key={note} style={styles.cardText}>
                • {note}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Segment comparison</Text>
          {comparison.segmentDeltas.length === 0 ? (
            <Text style={styles.cardText}>Not enough overlap with the reference to split segments.</Text>
          ) : (
            comparison.segmentDeltas.map((segment) => (
              <View key={segment.index} style={styles.segmentRow}>
                <Text style={styles.segmentLabel}>
                  Seg {segment.index + 1} · {formatDistance(segment.startDistanceMeters)}–
                  {formatDistance(segment.endDistanceMeters)}
                </Text>
                <Text style={styles.segmentTimes}>
                  {formatClock(segment.currentDurationSeconds)} vs {formatClock(segment.referenceDurationSeconds)}
                </Text>
                <Text
                  style={[
                    styles.segmentDelta,
                    segment.deltaSeconds > 5 && styles.segmentBehind,
                    segment.deltaSeconds < -5 && styles.segmentAhead,
                  ]}
                >
                  {formatSignedClock(segment.deltaSeconds)}
                </Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.privacyNote}>
          This trip is not stored yet — saving keeps it only on this device.
        </Text>

        <View style={styles.actions}>
          <Pressable style={[styles.primaryButton, busy && styles.disabled]} disabled={busy} onPress={handleSaveAsReference}>
            <Text style={styles.primaryButtonText}>Save as New Reference</Text>
          </Pressable>
          <Pressable style={[styles.secondaryButton, busy && styles.disabled]} disabled={busy} onPress={handleSaveTrip}>
            <Text style={styles.secondaryButtonText}>Save Trip</Text>
          </Pressable>
          <Pressable style={styles.discardButton} disabled={busy} onPress={() => navigation.popToTop()}>
            <Text style={styles.discardButtonText}>Done (don't save)</Text>
          </Pressable>
        </View>
      </ScrollView>
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
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.md },
  overline: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  totalCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.xs,
  },
  totalDelta: { color: colors.text, fontSize: 34, fontWeight: "800" },
  totalLabel: { color: colors.textMuted, fontSize: 14 },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    gap: spacing.md,
  },
  stat: { alignItems: "center", gap: 2, minWidth: 70 },
  statValue: { color: colors.text, fontSize: 15, fontWeight: "800" },
  statLabel: { color: colors.textMuted, fontSize: 11 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: { color: colors.text, fontWeight: "800", fontSize: 15 },
  cardText: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  segmentRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  segmentLabel: { color: colors.textMuted, fontSize: 12, flex: 1.4 },
  segmentTimes: { color: colors.textMuted, fontSize: 12, flex: 1, textAlign: "right" },
  segmentDelta: { color: colors.text, fontSize: 13, fontWeight: "700", width: 64, textAlign: "right" },
  segmentBehind: { color: colors.warning },
  segmentAhead: { color: colors.accent },
  privacyNote: { color: colors.textMuted, fontSize: 12, textAlign: "center" },
  actions: { gap: spacing.sm, paddingBottom: spacing.md },
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
