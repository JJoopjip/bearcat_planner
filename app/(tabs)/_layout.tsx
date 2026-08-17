import React from "react";
import { Tabs } from "expo-router";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "@/theme/tokens";

const TAB_ITEMS: { name: string; icon: string; label: string }[] = [
  { name: "index", icon: "\u{1F3E0}", label: "Today" },
  { name: "habits", icon: "\u{1F338}", label: "Habits" },
  { name: "quests", icon: "\u{1F5FA}️", label: "Becoming" },
  { name: "money", icon: "\u{1FA99}", label: "Money" },
  { name: "me", icon: "\u{1F380}", label: "Me" },
];

// React Native has no CSS `filter`, so true desaturation of a system emoji
// glyph isn't available without rasterizing it through an image library we
// weren't asked to add. We approximate the spec's "softened" emoji look
// with opacity + the pink active chip, which reads the same in practice.
function CustomTabBar({ state, navigation }: any) {
  return (
    <View style={styles.bar}>
      {state.routes.map((route: any, index: number) => {
        const item = TAB_ITEMS.find((t) => t.name === route.name) ?? TAB_ITEMS[0];
        const focused = state.index === index;
        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Text style={[styles.icon, !focused && styles.iconInactive]}>{item.icon}</Text>
            </View>
            <Text style={[styles.label, focused && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="habits" />
      <Tabs.Screen name="quests" />
      <Tabs.Screen name="money" />
      <Tabs.Screen name="me" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    paddingTop: 6,
    paddingBottom: 10,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: colors.pinkPale,
    backgroundColor: "rgba(255,244,248,0.9)",
  },
  tab: { flex: 1, alignItems: "center", gap: 2, paddingVertical: 2 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: colors.pinkPale,
    transform: [{ translateY: -2 }, { scale: 1.08 }],
  },
  icon: { fontSize: 19 },
  iconInactive: { opacity: 0.6 },
  label: { fontSize: 10.5, fontWeight: "700", color: colors.inkSoft, marginTop: 1 },
  labelActive: { color: colors.pinkDeep },
});
