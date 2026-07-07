import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { DEMO_ROUTES, createDemoDriveSource, createGpsLocationSource } from "../providers";
import { LocationSource } from "../providers/types";
import { RecorderSnapshot, TripRecorder } from "../services/tripRecorder";
import { formatClock, formatDistance } from "../utils/format";
import { colors, radii, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "RecordTrip">;

interface SourceOption {
  id: string;
  label: string;
  hint: string;
  create: () => LocationSource;
  destinationLabel?: string;
  isDemo: boolean;
}

const SOURCE_OPTIONS: SourceOption[] = [
  {
    id: "gps",
    label: "Device GPS",
    hint: "Record a real drive using this phone's location.",
    create: () => createGpsLocationSource(),
    isDemo: false,
  },
  ...DEMO_ROUTES.map((route) => ({
    id: route.id,
    label: `Demo: ${route.name}`,
    hint: route.description,
    create: () => createDemoDriveSource(route.name, route.path, route.estimatedDurationSeconds),
    destinationLabel: route.name,
    isDemo: true,
  })),
];

export default function RecordTripScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<SourceOption>(SOURCE_OPTIONS[1] ?? SOURCE_OPTIONS[0]);
  const [recording, setRecording] = useState(false);
  const [snapshot, setSnapshot] = useState<RecorderSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<TripRecorder | null>(null);

  useEffect(() => {
    return () => recorderRef.current?.abort();
  }, []);

  async function handleStart() {
    setError(null);
    const recorder = new TripRecorder(setSnapshot);
    recorderRef.current = recorder;
    try {
      await recorder.start(selected.create());
      setRecording(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start recording.");
      recorderRef.current = null;
    }
  }

  function handleStop() {
    const recorder = recorderRef.current;
    if (!recorder) return;

    const trip = recorder.stop({
      name: `${selected.isDemo ? selected.destinationLabel : "Recorded trip"} — ${new Date().toLocaleString()}`,
      destinationLabel: selected.destinationLabel,
      isDemo: selected.isDemo,
    });
    recorderRef.current = null;
    setRecording(false);

    if (!trip) {
      setError("Not enough movement was recorded to save a trip.");
      setSnapshot(null);
      return;
    }
    navigation.replace("TripSummary", { trip });
  }

  return (
    <SafeAreaView style={styles.container}>
      {!recording ? (
        <>
          <Text style={styles.sectionLabel}>Where should location samples come from?</Text>
          {SOURCE_OPTIONS.map((option) => {
            const isSelected = option.id === selected.id;
            return (
              <Pressable
                key={option.id}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => setSelected(option)}
              >
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
                <Text style={styles.optionHint}>{option.hint}</Text>
              </Pressable>
            );
          })}

          <Text style={styles.privacyNote}>
            Location is sampled only while a trip is actively recording, and nothing is stored
            until you tap Save on the summary screen.
          </Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>Start Recording</Text>
          </Pressable>
        </>
      ) : (
        <>
          <View style={styles.statusRow}>
            <View style={styles.recordingDot} />
            <Text style={styles.statusText}>Recording — {selected.label}</Text>
          </View>

          <View style={styles.statsCard}>
            <Stat label="Elapsed" value={formatClock(snapshot?.elapsedSeconds ?? 0)} />
            <Stat label="Distance" value={formatDistance(snapshot?.distanceMeters ?? 0)} />
            <Stat label="Samples" value={`${snapshot?.samples.length ?? 0}`} />
          </View>

          <Pressable style={styles.stopButton} onPress={handleStop}>
            <Text style={styles.stopButtonText}>Stop Trip</Text>
          </Pressable>
        </>
      )}
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
  sectionLabel: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  option: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  optionSelected: { borderColor: colors.accent },
  optionLabel: { color: colors.text, fontWeight: "700", fontSize: 15 },
  optionLabelSelected: { color: colors.accent },
  optionHint: { color: colors.textMuted, fontSize: 12, lineHeight: 16 },
  privacyNote: { color: colors.textMuted, fontSize: 12, lineHeight: 16 },
  error: { color: colors.danger, fontSize: 13 },
  startButton: {
    marginTop: "auto",
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  startButtonText: { color: colors.background, fontWeight: "800", fontSize: 16 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md },
  recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger },
  statusText: { color: colors.text, fontWeight: "700" },
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
  statValue: { color: colors.text, fontSize: 22, fontWeight: "800" },
  statLabel: { color: colors.textMuted, fontSize: 12 },
  stopButton: {
    marginTop: "auto",
    backgroundColor: colors.danger,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  stopButtonText: { color: colors.background, fontWeight: "800", fontSize: 16 },
});
