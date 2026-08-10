import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Mochi } from "@/components/Mochi";
import { colors } from "@/theme/tokens";
import { getHealthSnapshot, type HealthSnapshot } from "@/lib/health";
import { getMinutesByKind } from "@/db/client";

export default function MeScreen() {
  const [health, setHealth] = useState<HealthSnapshot | null>(null);
  const [focusMin, setFocusMin] = useState(0);
  const [meditateMin, setMeditateMin] = useState(0);

  const load = useCallback(async () => {
    const [h, focus, meditate] = await Promise.all([
      getHealthSnapshot(),
      getMinutesByKind("focus"),
      getMinutesByKind("meditate"),
    ]);
    setHealth(h);
    setFocusMin(focus);
    setMeditateMin(meditate);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.pagehead}>
          <Text style={styles.h1}>Me</Text>
          <Text style={styles.sub}>A year of you, at a glance.</Text>
        </View>

        <Card title="From Health" hint={Platform.OS === "ios" ? "read-only" : "iOS only"}>
          {!health?.available ? (
            <Text style={styles.empty}>
              {Platform.OS !== "ios"
                ? "Health data is only available on iOS."
                : "Grant Health access to see steps, heart rate, workouts and sleep here."}
            </Text>
          ) : (
            <View style={styles.statsGrid}>
              <Stat label="Steps today" value={health.steps != null ? health.steps.toLocaleString() : "—"} />
              <Stat label="Heart rate" value={health.heartRateBpm != null ? `${health.heartRateBpm} bpm` : "—"} color={colors.blush} />
              <Stat label="Exercise today" value={health.workoutMinutesToday != null ? `${health.workoutMinutesToday}m` : "—"} color="#5FB595" />
              <Stat label="Last night" value={health.lastNightSleepHours != null ? `${health.lastNightSleepHours}h` : "—"} color={colors.lilac} />
            </View>
          )}
        </Card>

        <Card title="Time you've given yourself">
          <View style={styles.statsRow}>
            <Stat label="Focus" value={`${focusMin}m`} />
            <Stat label="Breathing" value={`${meditateMin}m`} color={colors.lilac} />
          </View>
        </Card>

        <View style={styles.shopcat}>
          <Mochi pose="happy" size={140} stage={1} />
          <Text style={styles.hint}>Habits, Quests and Money screens are coming in the next phase.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.h2}>{title}</Text>
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 14, paddingBottom: 40 },
  pagehead: { padding: 6, paddingBottom: 14 },
  h1: { fontSize: 26, fontWeight: "700", color: colors.ink },
  h2: { fontSize: 16, fontWeight: "700", color: colors.ink },
  sub: { fontSize: 13.5, color: colors.inkSoft, marginTop: 4 },
  hint: { fontSize: 12.5, color: colors.inkSoft, textAlign: "center" },
  empty: { fontSize: 13.5, color: colors.inkSoft, paddingVertical: 6 },
  card: { backgroundColor: colors.card, borderRadius: 22, padding: 15, marginBottom: 12 },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 },
  cardBody: { gap: 9 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statsRow: { flexDirection: "row", gap: 12 },
  stat: { flex: 1, minWidth: "40%", alignItems: "center" },
  statLabel: { fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: colors.inkSoft, fontWeight: "700" },
  statValue: { fontSize: 23, fontWeight: "700", color: colors.ink, marginTop: 3 },
  shopcat: { alignItems: "center", gap: 8, marginTop: 8 },
});
