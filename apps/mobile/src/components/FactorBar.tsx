import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FactorScore } from "../types";
import { colors, radii, spacing } from "../theme";

const FACTOR_LABELS: Record<string, string> = {
  time: "Travel time",
  pathType: "Path type",
  lighting: "Lighting",
  openness: "Openness",
};

export default function FactorBar({ factor }: { factor: FactorScore }) {
  const label = FACTOR_LABELS[factor.factor] ?? factor.factor;
  const lowConfidence = factor.confidence < 0.5;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {Math.round(factor.score)} · weight {Math.round(factor.weight * 100)}%
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${factor.score}%` }]} />
      </View>
      {lowConfidence && <Text style={styles.lowConfidence}>Estimated — map data was incomplete here</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs, marginBottom: spacing.md },
  headerRow: { flexDirection: "row", justifyContent: "space-between" },
  label: { color: colors.text, fontWeight: "600" },
  value: { color: colors.textMuted, fontSize: 12 },
  track: {
    height: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: colors.accent, borderRadius: radii.sm },
  lowConfidence: { color: colors.warning, fontSize: 11 },
});
