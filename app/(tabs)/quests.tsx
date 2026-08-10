import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mochi } from "@/components/Mochi";
import { colors } from "@/theme/tokens";

export default function QuestsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Mochi pose="thinking" size={140} />
        <Text style={styles.h1}>Quests</Text>
        <Text style={styles.hint}>
          The winding path, intention cards and evidence log land here next phase —
          the SQLite tables already exist for quests, milestones and evidence.
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
