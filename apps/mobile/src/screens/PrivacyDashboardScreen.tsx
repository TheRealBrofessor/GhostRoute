import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { usePreferencesStore } from "../state/preferencesStore";
import { useTripHistoryStore } from "../state/tripHistoryStore";
import { deleteEverything } from "../storage/secureStorage";
import { colors, radii, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "PrivacyDashboard">;

export default function PrivacyDashboardScreen({ navigation }: Props) {
  const historyEnabled = usePreferencesStore((state) => state.historyEnabled);
  const emergencyContact = usePreferencesStore((state) => state.emergencyContact);
  const resetPreferences = usePreferencesStore((state) => state.reset);
  const trips = useTripHistoryStore((state) => state.trips);
  const loadTrips = useTripHistoryStore((state) => state.load);
  const clearTrips = useTripHistoryStore((state) => state.clear);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  function confirmDeleteEverything() {
    Alert.alert(
      "Delete everything?",
      "This permanently removes your saved preferences and trip history from this device. This can't be undone.",
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
      await clearTrips();
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
        <Row label="Preferences" value="Mode default, travel type, emergency contact" />
        <Row label="Emergency contact" value={emergencyContact || "Not set"} />
        <Row label="Trip history" value={historyEnabled ? "On" : "Off (default)"} />
        <Row label="Trips stored locally" value={`${trips.length}`} />
        <Text style={styles.note}>
          All of the above is encrypted at rest via the OS keystore/keychain. Nothing here ever
          leaves this device.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>On GhostRoute's server</Text>
        <Row label="Accounts" value="None — GhostRoute has no login" />
        <Row label="Route requests" value="Not retained after a response is sent" />
        <Row label="Emergency Share" value="Live position only, auto-deleted within 12h" />
        <Row label="Analytics / ad SDKs" value="None" />
      </View>

      <Pressable
        style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
        onPress={confirmDeleteEverything}
        disabled={deleting}
      >
        <Text style={styles.deleteButtonText}>
          {deleting ? "Deleting…" : "Delete Everything"}
        </Text>
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
