import React from "react";
import { StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import ModeSelector from "../components/ModeSelector";
import { RootStackParamList } from "../navigation/types";
import { usePreferencesStore } from "../state/preferencesStore";
import { colors, radii, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen(_props: Props) {
  const defaultMode = usePreferencesStore((state) => state.defaultMode);
  const setDefaultMode = usePreferencesStore((state) => state.setDefaultMode);
  const emergencyContact = usePreferencesStore((state) => state.emergencyContact);
  const setEmergencyContact = usePreferencesStore((state) => state.setEmergencyContact);
  const historyEnabled = usePreferencesStore((state) => state.historyEnabled);
  const setHistoryEnabled = usePreferencesStore((state) => state.setHistoryEnabled);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Default mode</Text>
        <ModeSelector value={defaultMode} onChange={setDefaultMode} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Emergency contact</Text>
        <TextInput
          style={styles.input}
          placeholder="Phone number or name"
          placeholderTextColor={colors.textMuted}
          value={emergencyContact}
          onChangeText={setEmergencyContact}
        />
        <Text style={styles.hint}>Only used to pre-fill Share ETA — never sent anywhere automatically.</Text>
      </View>

      <View style={[styles.section, styles.row]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionLabel}>Trip history</Text>
          <Text style={styles.hint}>Off by default. When on, trips are stored encrypted, only on this device.</Text>
        </View>
        <Switch
          value={historyEnabled}
          onValueChange={setHistoryEnabled}
          trackColor={{ true: colors.accent, false: colors.border }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.lg },
  title: { color: colors.text, fontSize: 24, fontWeight: "800", marginTop: spacing.sm },
  section: { gap: spacing.sm },
  sectionLabel: { color: colors.text, fontWeight: "700", fontSize: 15 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  hint: { color: colors.textMuted, fontSize: 12 },
});
