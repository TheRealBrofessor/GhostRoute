import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ScoreBadge from "./ScoreBadge";
import { RouteOption } from "../types";
import { colors, radii, spacing } from "../theme";
import { formatDistance, formatDuration } from "../utils/format";

interface Props {
  route: RouteOption;
  selected: boolean;
  onSelect: () => void;
  onExplain: () => void;
}

export default function RouteCard({ route, selected, onSelect, onExplain }: Props) {
  return (
    <Pressable
      onPress={onSelect}
      style={[styles.card, selected && styles.cardSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <ScoreBadge score={route.score} />
      <View style={styles.body}>
        <Text style={styles.meta}>
          {formatDuration(route.durationSeconds)} · {formatDistance(route.distanceMeters)}
        </Text>
        <Text style={styles.summary} numberOfLines={2}>
          {route.summary}
        </Text>
        <Pressable onPress={onExplain} hitSlop={8}>
          <Text style={styles.explainLink}>Why this score?</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSelected: { borderColor: colors.accent },
  body: { flex: 1, gap: spacing.xs },
  meta: { color: colors.text, fontWeight: "700", fontSize: 15 },
  summary: { color: colors.textMuted, fontSize: 13 },
  explainLink: { color: colors.accent, fontSize: 13, fontWeight: "600", marginTop: spacing.xs },
});
