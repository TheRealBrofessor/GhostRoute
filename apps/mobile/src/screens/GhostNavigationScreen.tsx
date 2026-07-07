import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  buildProgressPoints,
  compareTrips,
  computeLiveDelta,
  progressAtElapsed,
  totalDistanceMeters,
} from "@ghostroute/comparison";
import { createShare, postSharePosition } from "../api/client";
import { RootStackParamList } from "../navigation/types";
import { createDemoDriveSource, createGpsLocationSource } from "../providers";
import { TripRecorder } from "../services/tripRecorder";
import { usePreferencesStore } from "../state/preferencesStore";
import { useTripsStore } from "../state/tripsStore";
import { LiveGhostDelta } from "../types";
import { formatClock } from "../utils/format";
import { colors, radii, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "GhostNavigation">;

/**
 * Active drive against a saved reference. Deliberately minimal and passive:
 * a progress indicator, the current +/- time vs. the reference, and an End
 * Trip button. No alerts, no prompts, no rewards while driving — the detailed
 * analysis waits until the drive ends.
 */
export default function GhostNavigationScreen({ route, navigation }: Props) {
  const { referenceId } = route.params;
  const reference = useTripsStore((state) => state.references.find((r) => r.id === referenceId));
  const emergencyContact = usePreferencesStore((state) => state.emergencyContact);

  const referencePoints = useMemo(
    () => (reference ? buildProgressPoints(reference.trip.samples) : []),
    [reference]
  );
  const referenceTotalMeters = useMemo(() => totalDistanceMeters(referencePoints), [referencePoints]);

  const [driving, setDriving] = useState(false);
  const [delta, setDelta] = useState<LiveGhostDelta | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [shareActive, setShareActive] = useState(false);
  const [sharePending, setSharePending] = useState(false);

  const recorderRef = useRef<TripRecorder | null>(null);
  const shareTokenRef = useRef<string | null>(null);

  useEffect(() => {
    return () => recorderRef.current?.abort();
  }, []);

  if (!reference) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Reference route not found.</Text>
        <Pressable style={styles.endButton} onPress={() => navigation.popToTop()}>
          <Text style={styles.endButtonText}>Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  async function handleStart(useDemo: boolean) {
    if (!reference) return;
    setError(null);

    const recorder = new TripRecorder((snapshot) => {
      setElapsedSeconds(snapshot.elapsedSeconds);
      if (snapshot.lastSample) {
        setDelta(computeLiveDelta(referencePoints, snapshot.lastSample, snapshot.elapsedSeconds));
        if (shareTokenRef.current) {
          const sample = snapshot.lastSample;
          postSharePosition(shareTokenRef.current, {
            lat: sample.lat,
            lon: sample.lon,
            headingDegrees: sample.headingDegrees,
            speedKph: sample.speedMps !== undefined ? sample.speedMps * 3.6 : undefined,
          }).catch(() => {
            // Best-effort — a missed position update isn't worth surfacing to the driver.
          });
        }
      }
    });
    recorderRef.current = recorder;

    const source = useDemo
      ? createDemoDriveSource(
          `Demo drive of ${reference.name}`,
          reference.trip.samples,
          reference.trip.durationSeconds,
          { paceFactor: 0.95 + Math.random() * 0.2 }
        )
      : createGpsLocationSource();

    try {
      await recorder.start(source);
      setDriving(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the trip.");
      recorderRef.current = null;
    }
  }

  function handleEndTrip() {
    if (!reference) return;
    const recorder = recorderRef.current;
    if (!recorder) return;

    const trip = recorder.stop({
      name: `${reference.name} — ${new Date().toLocaleString()}`,
      destinationLabel: reference.trip.destinationLabel ?? reference.name,
      ghostRouteId: reference.id,
      isDemo: reference.trip.isDemo,
    });
    recorderRef.current = null;
    shareTokenRef.current = null;

    if (!trip) {
      navigation.popToTop();
      return;
    }
    navigation.replace("Comparison", { trip, comparison: compareTrips(reference, trip) });
  }

  async function handleShareEta() {
    if (!reference) return;
    setSharePending(true);
    try {
      const share = await createShare({
        destinationLabel: reference.name,
        emergencyContact: emergencyContact || undefined,
        durationMinutes: Math.max(15, Math.ceil(reference.trip.durationSeconds / 60) + 15),
      });
      shareTokenRef.current = share.token;
      setShareActive(true);
      await Share.share({ message: `I'm on my way (${reference.name}). Follow my ETA: ${share.url}` });
    } catch {
      setError("Could not start ETA sharing — is the backend reachable?");
    } finally {
      setSharePending(false);
    }
  }

  const ghostFraction =
    referenceTotalMeters > 0
      ? Math.min(1, progressAtElapsed(referencePoints, elapsedSeconds) / referenceTotalMeters)
      : 0;
  const youFraction = delta?.progressFraction ?? 0;

  if (!driving) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.overline}>Reference route</Text>
        <Text style={styles.title}>{reference.name}</Text>
        <Text style={styles.meta}>
          Reference time: {formatClock(reference.trip.durationSeconds)}
          {reference.trip.isDemo ? " · demo trip" : ""}
        </Text>

        <Text style={styles.note}>
          While driving, GhostRoute shows only your progress and a passive time comparison. It
          never prompts you to change how you drive; the full breakdown appears after the trip
          ends.
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={() => handleStart(false)}>
            <Text style={styles.primaryButtonText}>Start with Device GPS</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => handleStart(true)}>
            <Text style={styles.secondaryButtonText}>Start Demo Drive (simulated)</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.overline}>Driving vs. reference</Text>
      <Text style={styles.title}>{reference.name}</Text>

      <View style={styles.deltaCard}>
        <Text style={styles.deltaValue}>{delta ? delta.label : "waiting for position…"}</Text>
        <Text style={styles.elapsed}>elapsed {formatClock(elapsedSeconds)}</Text>
        {delta?.offRoute && (
          <Text style={styles.offRouteNote}>away from reference path — comparison approximate</Text>
        )}
      </View>

      <View style={styles.progressBlock}>
        <ProgressRow label="You" fraction={youFraction} color={colors.text} />
        <ProgressRow label="Ghost" fraction={ghostFraction} color={colors.textMuted} />
      </View>

      {shareActive && (
        <View style={styles.shareBanner}>
          <Text style={styles.shareBannerText}>ETA sharing active</Text>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          style={styles.secondaryButton}
          onPress={handleShareEta}
          disabled={sharePending || shareActive}
        >
          <Text style={styles.secondaryButtonText}>
            {sharePending ? "Starting share…" : shareActive ? "Sharing ETA" : "Share ETA"}
          </Text>
        </Pressable>
        <Pressable style={styles.endButton} onPress={handleEndTrip}>
          <Text style={styles.endButtonText}>End Trip</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function ProgressRow({ label, fraction, color }: { label: string; fraction: number; color: string }) {
  return (
    <View style={styles.progressRow}>
      <Text style={styles.progressLabel}>{label}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(fraction * 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.progressPct}>{Math.round(fraction * 100)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.md },
  overline: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: spacing.md,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  meta: { color: colors.textMuted, fontSize: 13 },
  note: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  error: { color: colors.danger, fontSize: 13 },
  deltaCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  deltaValue: { color: colors.text, fontSize: 24, fontWeight: "800", textAlign: "center" },
  elapsed: { color: colors.textMuted, fontSize: 13 },
  offRouteNote: { color: colors.warning, fontSize: 12 },
  progressBlock: { gap: spacing.sm, marginTop: spacing.sm },
  progressRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  progressLabel: { color: colors.textMuted, fontSize: 12, width: 44 },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  progressFill: { height: 8, borderRadius: 4 },
  progressPct: { color: colors.textMuted, fontSize: 12, width: 40, textAlign: "right" },
  shareBanner: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  shareBannerText: { color: colors.accent, fontSize: 12, fontWeight: "700" },
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
  endButton: {
    backgroundColor: colors.danger,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
  },
  endButtonText: { color: colors.background, fontWeight: "800" },
});
