import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import FactorBar from "../components/FactorBar";
import ScoreBadge from "../components/ScoreBadge";
import { RootStackParamList } from "../navigation/types";
import { colors, radii, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "RouteExplanation">;

export default function RouteExplanationSheet({ route, navigation }: Props) {
  const { route: option } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ScoreBadge score={option.score} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Why this score?</Text>
          <Text style={styles.summary}>{option.summary}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingVertical: spacing.md }}>
        <Text style={styles.sectionLabel}>Factor breakdown</Text>
        {option.factors.map((factor) => (
          <FactorBar key={factor.factor} factor={factor} />
        ))}

        <View style={styles.confidenceBox}>
          <Text style={styles.confidenceTitle}>Confidence</Text>
          <Text style={styles.confidenceMessage}>{option.confidence.message}</Text>
        </View>
      </ScrollView>

      <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeButtonText}>Close</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  header: { flexDirection: "row", gap: spacing.md, alignItems: "center", marginBottom: spacing.sm },
  title: { color: colors.text, fontSize: 20, fontWeight: "800" },
  summary: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  sectionLabel: { color: colors.textMuted, fontSize: 13, fontWeight: "700", marginBottom: spacing.sm },
  confidenceBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confidenceTitle: { color: colors.text, fontWeight: "700", marginBottom: spacing.xs },
  confidenceMessage: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  closeButton: {
    paddingVertical: spacing.md,
    alignItems: "center",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeButtonText: { color: colors.text, fontWeight: "700" },
});
