import React, { useCallback, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, PanResponder } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Mochi } from "@/components/Mochi";
import { colors, habitStickers } from "@/theme/tokens";
import type { MochiPose } from "@/lib/mood";
import { dkey, addDays, weekDays, uid } from "@/lib/dates";
import {
  getHabits, getHabitLogForRange, setHabitLog, addHabit, addBerries, setHabitSticker,
  type HabitRow, type HabitLogRow,
} from "@/db/client";

const today = dkey();
const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
// Stored in the (still NOT NULL) `emoji` column for any pre-sticker habits
// and as a DB-layer fallback only — never rendered. Every habit now shows a
// Mochi sticker instead, per the owner's "use Mochi instead of emoji" ask.
const DEFAULT_EMOJI = "\u{1F43B}";
const DEFAULT_STICKER = "happy";
const WEEKS_BACK = 8;

export default function HabitsScreen() {
  const [habits, setHabits] = useState<HabitRow[]>([]);
  const [habitLog, setHabitLogState] = useState<HabitLogRow[]>([]);
  const [name, setName] = useState("");
  const [sticker, setSticker] = useState<string>(DEFAULT_STICKER);
  const [target, setTarget] = useState(4);
  // habit id whose sticker grid is open, or null if none is
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    const rangeStart = weekDays(addDays(new Date(), -7 * WEEKS_BACK))[0];
    const rangeEnd = weekDays(new Date())[6];
    const [hb, log] = await Promise.all([getHabits(), getHabitLogForRange(rangeStart, rangeEnd)]);
    setHabits(hb);
    setHabitLogState(log);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const week = weekDays();

  function hitsInWeek(habitId: string, days: string[]): number {
    return days.filter((d) => habitLog.some((l) => l.habit_id === habitId && l.date === d)).length;
  }

  function streakOf(h: HabitRow): number {
    let streak = 0;
    for (let w = WEEKS_BACK; w >= 1; w--) {
      const days = weekDays(addDays(new Date(), -7 * w));
      const hits = hitsInWeek(h.id, days);
      streak = hits >= h.target ? streak + 1 : Math.max(0, streak - 1);
    }
    return streak;
  }

  const allMet = habits.length > 0 && habits.every((h) => hitsInWeek(h.id, week) >= h.target);

  async function onCycleDay(h: HabitRow, date: string) {
    const cur = habitLog.find((l) => l.habit_id === h.id && l.date === date)?.status ?? null;
    const cozyThisWeek = habitLog.filter((l) => l.habit_id === h.id && l.status === "cozy" && week.includes(l.date)).length;
    let next: "done" | "cozy" | null;
    if (!cur) next = "done";
    else if (cur === "done") next = cozyThisWeek < 1 ? "cozy" : null;
    else next = null;

    await setHabitLog(h.id, date, next);
    setHabitLogState((prev) => {
      const rest = prev.filter((l) => !(l.habit_id === h.id && l.date === date));
      return next ? [...rest, { habit_id: h.id, date, status: next }] : rest;
    });
    if (next === "done") await addBerries(3);
    if (next === "cozy") await addBerries(1);
  }

  async function onAddHabit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = uid();
    await addHabit(id, trimmed, DEFAULT_EMOJI, target, sticker);
    setHabits((prev) => [...prev, { id, name: trimmed, emoji: DEFAULT_EMOJI, target, sticker }]);
    setName("");
    setTarget(4);
    setSticker(DEFAULT_STICKER);
  }

  async function onPickExistingSticker(habitId: string, next: string) {
    await setHabitSticker(habitId, next);
    setHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, sticker: next } : h)));
    setPickerFor(null);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.pagehead}>
          <View style={styles.pageheadText}>
            <Text style={styles.h1}>Habits</Text>
            <Text style={styles.hint}>Weekly targets, not daily chains. A missed Tuesday is invisible.</Text>
          </View>
          <Mochi pose={allMet ? "excited" : "playing"} size={78} />
        </View>

        {habits.length === 0 && (
          <View style={[styles.card, styles.emptyCard]}>
            <Mochi pose="curious" mini size={40} />
            <Text style={styles.empty}>
              No habits yet. Add one below — small and doable beats big and abandoned.
            </Text>
          </View>
        )}

        {habits.map((h) => {
          const hits = hitsInWeek(h.id, week);
          const met = hits >= h.target;
          const streak = streakOf(h);
          return (
            <View key={h.id} style={styles.card}>
              <View style={styles.habitHead}>
                <Pressable onPress={() => setPickerFor(pickerFor === h.id ? null : h.id)}>
                  <Mochi pose={(h.sticker as MochiPose) ?? DEFAULT_STICKER} mini size={40} />
                </Pressable>
                <View style={styles.habitMeta}>
                  <Text style={styles.h3}>{h.name}</Text>
                  <Text style={styles.hint}>
                    {hits} of {h.target} this week{met ? " · target met \u{1F353}" : ""}
                  </Text>
                </View>
                <View style={styles.streakBadge}>
                  <Text style={styles.streakNum}>{streak}</Text>
                  <Text style={styles.streakLabel}>wk</Text>
                </View>
              </View>
              {pickerFor === h.id && (
                <View style={styles.stickerPanel}>
                  <Text style={styles.hint}>Pick a sticker for this habit</Text>
                  <View style={styles.stickerGrid}>
                    {habitStickers.map((s) => (
                      <Pressable
                        key={s}
                        style={[styles.stickerChip, h.sticker === s && styles.stickerChipOn]}
                        onPress={() => onPickExistingSticker(h.id, s)}
                      >
                        <Mochi pose={s as MochiPose} mini size={34} />
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
              <View style={styles.weekGrid}>
                {week.map((d, i) => {
                  const status = habitLog.find((l) => l.habit_id === h.id && l.date === d)?.status;
                  const future = d > today;
                  return (
                    <Pressable
                      key={d}
                      disabled={future}
                      onPress={() => onCycleDay(h, d)}
                      style={[
                        styles.day,
                        status === "done" && styles.dayDone,
                        status === "cozy" && styles.dayCozy,
                        future && styles.dayFuture,
                      ]}
                    >
                      <Text style={[styles.dayText, !!status && styles.dayTextOn]}>{DAY_LETTERS[i]}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.cardHeadTitle}>
              <Mochi pose="playful" mini size={28} />
              <Text style={styles.h2}>Add a habit</Text>
            </View>
            <Text style={styles.hint}>four or five is plenty</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.hint}>Pick a sticker</Text>
            <View style={styles.stickerGrid}>
              {habitStickers.map((s) => (
                <Pressable
                  key={s}
                  style={[styles.stickerChip, sticker === s && styles.stickerChipOn]}
                  onPress={() => setSticker(s)}
                >
                  <Mochi pose={s as MochiPose} mini size={34} />
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="What habit?"
              placeholderTextColor="#D3A8BE"
              onSubmitEditing={onAddHabit}
            />
            <Text style={styles.hint}>Target: {target}× per week</Text>
            <TargetSlider value={target} onChange={setTarget} />
            {habits.length >= 5 && (
              <Text style={styles.nudge}>
                You've got {habits.length} going — four or five tends to feel like plenty. No pressure to stop, just a gentle nudge.
              </Text>
            )}
            <Pressable style={[styles.btn, !name.trim() && styles.btnDisabled]} onPress={onAddHabit} disabled={!name.trim()}>
              <Text style={styles.btnText}>Add habit</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TargetSlider({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [width, setWidth] = useState(0);

  function updateFromX(x: number) {
    if (!width) return;
    const clamped = Math.max(0, Math.min(width, x));
    const step = Math.round((clamped / width) * 6) + 1;
    onChange(Math.max(1, Math.min(7, step)));
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => updateFromX(e.nativeEvent.locationX),
    onPanResponderMove: (e) => updateFromX(e.nativeEvent.locationX),
  });

  const pct = ((value - 1) / 6) * 100;

  return (
    <View>
      <View
        style={styles.sliderTrack}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <View style={[styles.sliderFill, { width: `${pct}%` }]} />
        <View style={[styles.sliderThumb, { left: `${pct}%`, transform: [{ translateX: -11 }] }]} />
      </View>
      <View style={styles.sliderTicks}>
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <Text key={n} style={[styles.sliderTick, n === value && styles.sliderTickOn]}>{n}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 14, paddingBottom: 40 },
  pagehead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  pageheadText: { flex: 1 },
  h1: { fontSize: 26, fontWeight: "700", color: colors.ink },
  h2: { fontSize: 16, fontWeight: "700", color: colors.ink },
  h3: { fontSize: 16, fontWeight: "700", color: colors.ink },
  hint: { fontSize: 12.5, color: colors.inkSoft },
  empty: { flex: 1, fontSize: 13.5, color: colors.inkSoft, paddingVertical: 6 },
  card: { backgroundColor: colors.card, borderRadius: 22, padding: 15, marginBottom: 12 },
  emptyCard: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 },
  cardHeadTitle: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardBody: { gap: 9 },
  habitHead: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 11 },
  stickerPanel: { marginBottom: 11 },
  stickerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  stickerChip: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: colors.pixel,
    alignItems: "center", justifyContent: "center",
  },
  stickerChipOn: { backgroundColor: colors.pink },
  habitMeta: { flex: 1, minWidth: 0 },
  streakBadge: { alignItems: "center", backgroundColor: colors.bg, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 6 },
  streakNum: { fontSize: 19, fontWeight: "800", color: colors.pinkDeep, lineHeight: 22 },
  streakLabel: { fontSize: 10, color: colors.inkSoft, fontWeight: "700" },
  weekGrid: { flexDirection: "row", gap: 6 },
  day: {
    flex: 1, aspectRatio: 1, borderWidth: 2, borderColor: colors.pinkPale, borderStyle: "dotted",
    backgroundColor: colors.cream, borderRadius: 12, alignItems: "center", justifyContent: "center",
  },
  dayText: { fontSize: 11.5, fontWeight: "700", color: colors.inkSoft },
  dayTextOn: { color: "#fff" },
  dayDone: { backgroundColor: colors.pink, borderColor: colors.pinkDeep, borderStyle: "solid" },
  dayCozy: { backgroundColor: colors.lilac, borderColor: colors.lilac, borderStyle: "solid" },
  dayFuture: { opacity: 0.4 },
  input: {
    borderWidth: 1.5, borderColor: colors.pinkPale, backgroundColor: colors.cream, borderRadius: 14,
    paddingHorizontal: 13, paddingVertical: 11, fontSize: 15, color: colors.ink,
  },
  sliderTrack: { height: 10, borderRadius: 99, backgroundColor: colors.pinkPale, marginTop: 6, justifyContent: "center" },
  sliderFill: { position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 99, backgroundColor: colors.pinkDeep },
  sliderThumb: {
    position: "absolute", width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff",
    borderWidth: 2, borderColor: colors.pinkDeep,
  },
  sliderTicks: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingHorizontal: 2 },
  sliderTick: { fontSize: 11, color: colors.inkSoft, fontWeight: "600" },
  sliderTickOn: { color: colors.pinkDeep, fontWeight: "800" },
  nudge: { fontSize: 12.5, color: colors.inkSoft, fontStyle: "italic" },
  btn: { backgroundColor: colors.pinkDeep, borderRadius: 14, paddingVertical: 13, alignItems: "center", marginTop: 4 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
