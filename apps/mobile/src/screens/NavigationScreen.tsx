import React, { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { createShare, postSharePosition } from "../api/client";
import { RootStackParamList } from "../navigation/types";
import { usePreferencesStore } from "../state/preferencesStore";
import { useTripHistoryStore } from "../state/tripHistoryStore";
import { buildSteps } from "../utils/steps";
import { watchLocation } from "../utils/location";
import { colors, radii, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Navigation">;

export default function NavigationScreen({ route, navigation }: Props) {
  const { destination, route: option } = route.params;
  const emergencyContact = usePreferencesStore((state) => state.emergencyContact);
  const historyEnabled = usePreferencesStore((state) => state.historyEnabled);
  const addTrip = useTripHistoryStore((state) => state.addTrip);

  const steps = useMemo(() => buildSteps(option.segments), [option.segments]);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharePending, setSharePending] = useState(false);
  const watchSubscription = useRef<{ remove: () => void } | null>(null);
  const shareTokenRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      watchSubscription.current?.remove();
    };
  }, []);

  async function handleShareEta() {
    setSharePending(true);
    try {
      const share = await createShare({
        destinationLabel: destination.label,
        emergencyContact: emergencyContact || undefined,
        durationMinutes: Math.max(15, Math.ceil(option.durationSeconds / 60) + 15),
      });
      shareTokenRef.current = share.token;
      setShareUrl(share.url);

      watchSubscription.current = await watchLocation((position) => {
        if (shareTokenRef.current) {
          postSharePosition(shareTokenRef.current, position).catch(() => {
            // Best-effort — a missed position update isn't worth surfacing to the driver.
          });
        }
      });

      await Share.share({ message: `I'm on my way to ${destination.label}. Track my ETA: ${share.url}` });
    } finally {
      setSharePending(false);
    }
  }

  async function handleEndTrip() {
    watchSubscription.current?.remove();
    watchSubscription.current = null;
    shareTokenRef.current = null;

    if (historyEnabled) {
      await addTrip({
        id: `${option.id}-${Date.now()}`,
        destinationLabel: destination.label,
        mode: route.params.mode,
        score: option.score,
        distanceMeters: option.distanceMeters,
        durationSeconds: option.durationSeconds,
        completedAt: Date.now(),
      });
    }

    navigation.popToTop();
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Navigating to {destination.label}</Text>

      <FlatList
        data={steps}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.md }}
        renderItem={({ item, index }) => (
          <View style={styles.step}>
            <Text style={styles.stepIndex}>{index + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepInstruction}>{item.instruction}</Text>
              <Text style={styles.stepDistance}>{item.distanceLabel}</Text>
            </View>
          </View>
        )}
      />

      {shareUrl && (
        <View style={styles.shareBanner}>
          <Text style={styles.shareBannerText}>ETA sharing active</Text>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable style={styles.shareButton} onPress={handleShareEta} disabled={sharePending}>
          <Text style={styles.shareButtonText}>
            {sharePending ? "Starting share…" : shareUrl ? "Sharing ETA" : "Share ETA"}
          </Text>
        </Pressable>
        <Pressable style={styles.endButton} onPress={handleEndTrip}>
          <Text style={styles.endButtonText}>End Trip</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { color: colors.text, fontSize: 20, fontWeight: "800" },
  step: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  stepIndex: { color: colors.accent, fontWeight: "800", width: 20 },
  stepInstruction: { color: colors.text, fontSize: 15, fontWeight: "600" },
  stepDistance: { color: colors.textMuted, fontSize: 12 },
  shareBanner: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  shareBannerText: { color: colors.accent, fontSize: 12, fontWeight: "700" },
  actions: { flexDirection: "row", gap: spacing.sm },
  shareButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
  },
  shareButtonText: { color: colors.text, fontWeight: "700" },
  endButton: {
    flex: 1,
    backgroundColor: colors.danger,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
  },
  endButtonText: { color: colors.background, fontWeight: "800" },
});
