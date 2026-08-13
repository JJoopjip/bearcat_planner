import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Mochi } from "@/components/Mochi";
import { colors, spendCategories, incomeCategories } from "@/theme/tokens";
import { dkey, addDays, uid } from "@/lib/dates";
import { getAllMoney, addMoney, getAllMoods, type MoneyRow, type MoodRow } from "@/db/client";

const PERIODS: { months: number; label: string }[] = [
  { months: 1, label: "Month" },
  { months: 3, label: "Quarter" },
  { months: 6, label: "Half" },
  { months: 12, label: "Year" },
];

export default function MoneyScreen() {
  const [money, setMoney] = useState<MoneyRow[]>([]);
  const [moods, setMoods] = useState<MoodRow[]>([]);
  const [periodMonths, setPeriodMonths] = useState(1);
  const [dir, setDir] = useState<"in" | "out">("out");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(spendCategories[0]);

  const load = useCallback(async () => {
    const [m, mo] = await Promise.all([getAllMoney(), getAllMoods()]);
    setMoney(m);
    setMoods(mo);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const categories = dir === "out" ? spendCategories : incomeCategories;

  const since = useMemo(() => dkey(addDays(new Date(), -30 * periodMonths)), [periodMonths]);
  const rows = useMemo(() => money.filter((m) => m.date >= since), [money, since]);

  const inSum = useMemo(() => rows.filter((r) => r.dir === "in").reduce((a, b) => a + b.amount, 0), [rows]);
  const outSum = useMemo(() => rows.filter((r) => r.dir === "out").reduce((a, b) => a + b.amount, 0), [rows]);

  const byCat = useMemo(() => {
    const map: Record<string, number> = {};
    rows.filter((r) => r.dir === "out").forEach((r) => { map[r.category] = (map[r.category] ?? 0) + r.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [rows]);
  const maxCat = Math.max(1, ...byCat.map(([, v]) => v));

  // Mood x spending — an observation, not a judgment. Same 5-point mood
  // scale as the check-in (moodPoses): 1-2 is a low-mood day, 4-5 a good one.
  const insight = useMemo(() => {
    const spendOn = (low: boolean) => {
      const days = moods.filter((m) => (low ? m.value <= 2 : m.value >= 4)).map((m) => m.date);
      if (days.length === 0) return null;
      const tot = money.filter((r) => r.dir === "out" && days.includes(r.date)).reduce((a, b) => a + b.amount, 0);
      return tot / days.length;
    };
    return { low: spendOn(true), high: spendOn(false) };
  }, [money, moods]);

  async function onAddMoney() {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    const id = uid();
    const date = dkey();
    await addMoney(id, date, n, dir, category);
    setMoney((prev) => [{ id, date, amount: n, dir, category }, ...prev]);
    setAmount("");
  }

  function onSwitchDir(next: "in" | "out") {
    setDir(next);
    setCategory(next === "out" ? spendCategories[0] : incomeCategories[0]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.pagehead}>
          <View style={styles.pageheadText}>
            <Text style={styles.h1}>Money</Text>
            <Text style={styles.hint}>Entered by hand, on purpose. Nothing syncs, nothing leaks.</Text>
          </View>
          <Mochi pose="drink" size={78} />
        </View>

        <View style={styles.seg}>
          {PERIODS.map((p) => (
            <Pressable
              key={p.months}
              style={[styles.segBtn, periodMonths === p.months && styles.segBtnOn]}
              onPress={() => setPeriodMonths(p.months)}
            >
              <Text style={[styles.segText, periodMonths === p.months && styles.segTextOn]}>{p.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.eyebrow}>In</Text>
              <Text style={[styles.statValue, { color: "#5FB595" }]}>${inSum.toFixed(0)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.eyebrow}>Out</Text>
              <Text style={styles.statValue}>${outSum.toFixed(0)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.eyebrow}>Kept</Text>
              <Text style={[styles.statValue, { color: colors.pinkDeep }]}>${(inSum - outSum).toFixed(0)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.h2}>Where it went</Text>
          {byCat.length === 0 && <Text style={styles.empty}>Log something below and it appears here.</Text>}
          {byCat.map(([cat, v]) => (
            <View key={cat} style={styles.barRow}>
              <Text style={styles.barLabel}>{cat}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(v / maxCat) * 100}%` }]} />
              </View>
              <Text style={styles.barValue}>${v.toFixed(0)}</Text>
            </View>
          ))}
        </View>

        {insight.low !== null && insight.high !== null && (
          <View style={styles.card}>
            <Text style={styles.h2}>A pattern</Text>
            <Text style={styles.insightText}>
              On low-mood days you spend about <Text style={styles.bold}>${insight.low.toFixed(0)}</Text>. On good
              days, <Text style={styles.bold}>${insight.high.toFixed(0)}</Text>.
              {insight.low > insight.high * 1.2 ? " Worth noticing." : " Nicely steady."}
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.h2}>Log an entry</Text>
          <View style={styles.seg}>
            <Pressable style={[styles.segBtn, dir === "out" && styles.segBtnOn]} onPress={() => onSwitchDir("out")}>
              <Text style={[styles.segText, dir === "out" && styles.segTextOn]}>Out</Text>
            </Pressable>
            <Pressable style={[styles.segBtn, dir === "in" && styles.segBtnOn]} onPress={() => onSwitchDir("in")}>
              <Text style={[styles.segText, dir === "in" && styles.segTextOn]}>In</Text>
            </Pressable>
          </View>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="Amount"
            placeholderTextColor="#D3A8BE"
            keyboardType="decimal-pad"
          />
          <View style={styles.chips}>
            {categories.map((c) => (
              <Pressable key={c} style={[styles.chip, category === c && styles.chipDone]} onPress={() => setCategory(c)}>
                <Text style={[styles.chipText, category === c && styles.chipTextOn]}>{c}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.btn} onPress={onAddMoney}>
            <Text style={styles.btnText}>Add</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 14, paddingBottom: 40 },
  pagehead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  pageheadText: { flex: 1 },
  h1: { fontSize: 26, fontWeight: "700", color: colors.ink },
  h2: { fontSize: 16, fontWeight: "700", color: colors.ink, marginBottom: 10 },
  hint: { fontSize: 13.5, color: colors.inkSoft, marginTop: 4 },
  empty: { fontSize: 13.5, color: colors.inkSoft, paddingVertical: 6 },
  card: { backgroundColor: colors.card, borderRadius: 22, padding: 15, marginBottom: 12 },

  seg: { flexDirection: "row", backgroundColor: "#FBE9F0", borderRadius: 14, padding: 4, gap: 4, marginBottom: 12 },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: "center" },
  segBtnOn: { backgroundColor: "#fff" },
  segText: { fontSize: 13.5, fontWeight: "700", color: colors.inkSoft },
  segTextOn: { color: colors.pinkDeep },

  stats: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  stat: { flex: 1, alignItems: "center" },
  eyebrow: { fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: colors.inkSoft, fontWeight: "700" },
  statValue: { fontSize: 23, fontWeight: "700", color: colors.ink, marginTop: 3 },

  barRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  barLabel: { width: 70, fontSize: 13, color: colors.ink, fontWeight: "600" },
  barTrack: { flex: 1, height: 10, borderRadius: 99, backgroundColor: colors.pinkPale, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 99, backgroundColor: colors.pinkDeep },
  barValue: { width: 46, fontSize: 13, color: colors.ink, fontWeight: "700", textAlign: "right" },

  insightText: { fontSize: 14, color: colors.ink, lineHeight: 20 },
  bold: { fontWeight: "700" },

  input: {
    borderWidth: 1.5, borderColor: colors.pinkPale, backgroundColor: colors.cream, borderRadius: 14,
    paddingHorizontal: 13, paddingVertical: 11, fontSize: 15, color: colors.ink, marginBottom: 10,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: {
    borderWidth: 1.5, borderColor: colors.pinkPale, backgroundColor: colors.cream, borderRadius: 99,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  chipDone: { backgroundColor: colors.pink, borderColor: colors.pinkDeep },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.ink },
  chipTextOn: { color: "#fff" },
  btn: { backgroundColor: colors.pinkDeep, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
