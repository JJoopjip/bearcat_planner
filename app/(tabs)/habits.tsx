import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mochi } from "@/components/Mochi";
import { colors } from "@/theme/tokens";

export default function HabitsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Mochi pose="playing" size={140} />
        <Text style={styles.h1}>Habits</Text>
        <Text style={styles.hint}>
          Weekly targets, decaying streaks and cozy days land here next phase —
          the SQLite tables already exist and Today's habit chips already write to them.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 30 },
  h1: { fontSize: 26, fontWeight: "700", color: colors.ink },
  hint: { fontSize: 13.5, color: colors.inkSoft, textAlign: "center", maxWidth: 280 },
});
