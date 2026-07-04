import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../theme";

function colorForScore(score: number): string {
  if (score >= 75) return colors.accent;
  if (score >= 50) return colors.warning;
  return colors.danger;
}

export default function ScoreBadge({ score }: { score: number }) {
  const backgroundColor = colorForScore(score);
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={styles.text}>{Math.round(score)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { color: "#0F1115", fontWeight: "800", fontSize: 16 },
});
