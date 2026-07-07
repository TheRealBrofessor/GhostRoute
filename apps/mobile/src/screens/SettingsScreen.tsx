import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { usePreferencesStore } from "../state/preferencesStore";
import { colors, radii, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen(_props: Props) {
  const emergencyContact = usePreferencesStore((state) => state.emergencyContact);
  const setEmergencyContact = usePreferencesStore((state) => state.setEmergencyContact);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Emergency contact</Text>
        <TextInput
          style={styles.input}
          placeholder="Phone number or name"
          placeholderTextColor={colors.textMuted}
          value={emergencyContact}
          onChangeText={setEmergencyContact}
        />
        <Text style={styles.hint}>
          Only used to pre-fill Share ETA — never sent anywhere automatically. Stored in the OS
          keystore/keychain.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Trip storage</Text>
        <Text style={styles.hint}>
          Trips are saved only when you explicitly tap Save after a drive, and stay on this device.
          Manage or delete them from Saved Routes or the Privacy Dashboard.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.lg },
  title: { color: colors.text, fontSize: 24, fontWeight: "800", marginTop: spacing.sm },
  section: { gap: spacing.sm },
  sectionLabel: { color: colors.text, fontWeight: "700", fontSize: 15 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  hint: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
});
