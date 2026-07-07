import React, { useCallback } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";
import { useTripsStore } from "../state/tripsStore";
import { GhostRouteReference, TripRecord } from "../types";
import { formatDistance, formatDuration } from "../utils/format";
import { colors, radii, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "SavedRoutes">;

export default function SavedRoutesScreen({ navigation }: Props) {
  const load = useTripsStore((state) => state.load);
  const trips = useTripsStore((state) => state.trips);
  const references = useTripsStore((state) => state.references);
  const activeReferenceId = useTripsStore((state) => state.activeReferenceId);
  const setActiveReference = useTripsStore((state) => state.setActiveReference);
  const deleteReference = useTripsStore((state) => state.deleteReference);
  const deleteTrip = useTripsStore((state) => state.deleteTrip);
  const saveReference = useTripsStore((state) => state.saveReference);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function confirmDeleteReference(reference: GhostRouteReference) {
    Alert.alert("Delete reference?", `"${reference.name}" will be removed from this device.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteReference(reference.id) },
    ]);
  }

  function confirmDeleteTrip(trip: TripRecord) {
    Alert.alert("Delete trip?", `"${trip.name}" will be removed from this device.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTrip(trip.id) },
    ]);
  }

  async function makeTripReference(trip: TripRecord) {
    await saveReference({
      id: `ref-${trip.id}`,
      name: trip.destinationLabel ?? trip.name,
      createdAt: Date.now(),
      trip,
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Reference routes</Text>
        {references.length === 0 && (
          <Text style={styles.empty}>No references yet — save a recorded trip as one.</Text>
        )}
        {references.map((reference) => {
          const isActive = reference.id === activeReferenceId;
          return (
            <View key={reference.id} style={[styles.card, isActive && styles.cardActive]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{reference.name}</Text>
                {isActive && <Text style={styles.activeBadge}>active</Text>}
              </View>
              <Text style={styles.cardMeta}>
                {formatDistance(reference.trip.distanceMeters)} · {formatDuration(reference.trip.durationSeconds)}
                {reference.trip.isDemo ? " · demo" : ""}
              </Text>
              <View style={styles.cardActions}>
                {!isActive && (
                  <Pressable onPress={() => setActiveReference(reference.id)}>
                    <Text style={styles.actionLink}>Use as active reference</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => navigation.navigate("GhostNavigation", { referenceId: reference.id })}
                >
                  <Text style={styles.actionLink}>Drive vs. this</Text>
                </Pressable>
                <Pressable onPress={() => confirmDeleteReference(reference)}>
                  <Text style={styles.deleteLink}>Delete</Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        <Text style={styles.sectionTitle}>Saved trips</Text>
        {trips.length === 0 && <Text style={styles.empty}>No saved trips yet.</Text>}
        {trips.map((trip) => (
          <View key={trip.id} style={styles.card}>
            <Text style={styles.cardTitle}>{trip.name}</Text>
            <Text style={styles.cardMeta}>
              {formatDistance(trip.distanceMeters)} · {formatDuration(trip.durationSeconds)}
              {trip.isDemo ? " · demo" : ""}
            </Text>
            <View style={styles.cardActions}>
              <Pressable onPress={() => makeTripReference(trip)}>
                <Text style={styles.actionLink}>Set as reference</Text>
              </Pressable>
              <Pressable onPress={() => confirmDeleteTrip(trip)}>
                <Text style={styles.deleteLink}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <Text style={styles.privacyNote}>Everything on this screen lives only on this device.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "800", marginTop: spacing.sm },
  empty: { color: colors.textMuted, fontSize: 13 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardActive: { borderColor: colors.accent },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { color: colors.text, fontWeight: "700", fontSize: 14, flexShrink: 1 },
  activeBadge: { color: colors.accent, fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  cardMeta: { color: colors.textMuted, fontSize: 12 },
  cardActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xs, flexWrap: "wrap" },
  actionLink: { color: colors.accent, fontSize: 13, fontWeight: "600" },
  deleteLink: { color: colors.danger, fontSize: 13, fontWeight: "600" },
  privacyNote: { color: colors.textMuted, fontSize: 12, textAlign: "center", marginTop: spacing.md },
});
