import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { confidenceMessage, scoreRoute } from "@ghostroute/scoring";
import ModeSelector from "../components/ModeSelector";
import RouteCard from "../components/RouteCard";
import { fetchRoutes } from "../api/client";
import { RootStackParamList } from "../navigation/types";
import { RouteMode, RouteOption } from "../types";
import { colors, radii, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "RouteOptions">;

export default function RouteOptionsScreen({ route, navigation }: Props) {
  const { origin, destination, travelMode } = route.params;
  const [mode, setMode] = useState<RouteMode>(route.params.mode);
  const [routes, setRoutes] = useState<RouteOption[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetchRoutes(origin, destination.location, mode, travelMode)
      .then((quote) => {
        if (cancelled) return;
        setRoutes(quote.routes);
        setSelectedId(quote.routes[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't reach GhostRoute right now. Check your connection and try again.");
      });
    return () => {
      cancelled = true;
    };
    // Only re-fetch on the initial mode/origin/destination — switching modes
    // afterwards re-scores on-device instead of hitting the network again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination, travelMode]);

  const displayedRoutes = useMemo(() => {
    if (!routes) return null;
    if (mode === route.params.mode) return sortByScore(routes);

    // Re-rank on-device for the newly selected mode using the same segments
    // the server returned — no network round trip needed.
    const rescored = routes.map((option) => {
      const score = scoreRoute(option.segments, mode, travelMode);
      return {
        ...option,
        score: score.score,
        factors: score.factors,
        confidence: { ...score.confidence, message: confidenceMessage(score.confidence) },
      };
    });
    return sortByScore(rescored);
  }, [routes, mode, travelMode, route.params.mode]);

  const selectedRoute = displayedRoutes?.find((r) => r.id === selectedId) ?? displayedRoutes?.[0];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Route Options</Text>
      <Text style={styles.subtitle}>To {destination.label}</Text>

      <ModeSelector value={mode} onChange={setMode} />

      {error && <Text style={styles.error}>{error}</Text>}

      {!displayedRoutes && !error && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}

      {displayedRoutes && (
        <FlatList
          data={displayedRoutes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.md }}
          renderItem={({ item }) => (
            <RouteCard
              route={item}
              selected={item.id === selectedId}
              onSelect={() => setSelectedId(item.id)}
              onExplain={() => navigation.navigate("RouteExplanation", { route: item })}
            />
          )}
        />
      )}

      <Pressable
        style={[styles.cta, !selectedRoute && styles.ctaDisabled]}
        disabled={!selectedRoute}
        onPress={() =>
          selectedRoute &&
          navigation.navigate("Navigation", { destination, route: selectedRoute, mode })
        }
      >
        <Text style={styles.ctaText}>Start Navigation</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function sortByScore(routes: RouteOption[]): RouteOption[] {
  return [...routes].sort((a, b) => b.score - a.score);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { color: colors.text, fontSize: 24, fontWeight: "800" },
  subtitle: { color: colors.textMuted, marginBottom: spacing.md },
  loading: { paddingVertical: spacing.xl },
  error: { color: colors.danger, marginVertical: spacing.md },
  cta: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: colors.background, fontWeight: "800", fontSize: 16 },
});
