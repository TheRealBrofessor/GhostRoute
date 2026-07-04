import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { RouteMode } from "../types";
import { colors, radii, spacing } from "../theme";

const MODES: { key: RouteMode; label: string }[] = [
  { key: "fastest", label: "Fastest" },
  { key: "balanced", label: "Balanced" },
  { key: "safest", label: "Safest" },
];

const MODE_COLOR: Record<RouteMode, string> = {
  fastest: colors.fastest,
  balanced: colors.balanced,
  safest: colors.safest,
};

interface Props {
  value: RouteMode;
  onChange: (mode: RouteMode) => void;
}

export default function ModeSelector({ value, onChange }: Props) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {MODES.map(({ key, label }) => {
        const selected = key === value;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[
              styles.chip,
              selected && { backgroundColor: MODE_COLOR[key], borderColor: MODE_COLOR[key] },
            ]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.sm },
  chip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  chipText: { color: colors.textMuted, fontWeight: "600" },
  chipTextSelected: { color: colors.background },
});
