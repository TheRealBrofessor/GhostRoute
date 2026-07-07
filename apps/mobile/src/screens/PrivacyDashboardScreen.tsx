import React, { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";
import { usePreferencesStore } from "../state/preferencesStore";
import { useTripsStore } from "../state/tripsStore";
import { deleteEverything } from "../storage/secureStorage";
import { colors, radii, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "PrivacyDashboard">;

export default function PrivacyDashboardScreen({ navigation }: Props) {
  const emergencyContact = usePreferencesStore((state) => state.emergencyContact);
  const resetPreferences = usePreferencesStore((state) => state.reset);
  const load = useTripsStore((state) => state.load);
  const trips = useTripsStore((state) => state.trips);
  const references = useTripsStore((state) => state.references);
  const clearAll = useTripsStore((state) => state.clearAll);
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function confirmDeleteEverything() {
    Alert.alert(
      "Delete everything?",
      "This permanently removes your preferences, saved trips, and reference routes from this device. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete Everything", style: "destructive", onPress: handleDeleteEverything },
      ]
    );
  }

  async function handleDeleteEverything() {
    setDeleting(true);
    try {
      await deleteEverything();
      resetPreferences();
      await clearAll();
      navigation.popToTop();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Privacy Dashboard</Text>
      <Text style={styles.subtitle}>Exactly what GhostRoute stores, and where.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>On this device</Text>
        <Row label="Saved trips (with location samples)" value={`${trips.length}`} />
        <Row label="Reference routes" value={`${references.length}`} />
        <Row label="Emergency contact" value={emergencyContact || "Not set"} />
        <Text style={styles.note}>
          Trips are stored only when you tap Save after a drive, and location is sampled only while
          a trip is actively recording. Trip data never leaves this device unless you explicitly
          share it. The emergency contact is kept in the OS keystore/keychain.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>On GhostRoute's server</Text>
        <Row label="Accounts" value="None — GhostRoute has no login" />
        <Row label="Trips / reference routes" value="Never uploaded" />
        <Row label="Emergency Share" value="Live position only, opt-in, auto-deleted within 12h" />
        <Row label="Analytics / ad SDKs" value="None" />
      </View>

      <Pressable
        style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
        onPress={confirmDeleteEverything}
        disabled={deleting}
      >
        <Text style={styles.deleteButtonText}>{deleting ? "Deleting…" : "Delete Everything"}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: 24, fontWeight: "800", marginTop: spacing.sm },
  subtitle: { color: colors.textMuted, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardTitle: { color: colors.text, fontWeight: "800", marginBottom: spacing.xs },
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  rowLabel: { color: colors.textMuted, fontSize: 13, flexShrink: 1 },
  rowValue: { color: colors.text, fontSize: 13, fontWeight: "600", flexShrink: 1, textAlign: "right" },
  note: { color: colors.textMuted, fontSize: 11, marginTop: spacing.xs, lineHeight: 16 },
  deleteButton: {
    marginTop: "auto",
    backgroundColor: colors.danger,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  deleteButtonDisabled: { opacity: 0.6 },
  deleteButtonText: { color: colors.background, fontWeight: "800", fontSize: 16 },
});
