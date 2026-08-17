import React, { useCallback, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Mochi } from "@/components/Mochi";
import { QuickRow, TimerSheet, WorkoutSheet, MoneySheet, InboxSheet, type QuickSheetKey } from "@/components/QuickLog";
import { colors, moodPoses, moodColors } from "@/theme/tokens";
import { dkey, prettyDate, uid, weekDays } from "@/lib/dates";
import { moodForToday, moodDayStats } from "@/lib/mood";
import {
  getBearcat, addBerries, setBearcatName, getIntention, setIntention, getMood, getWin, setWin,
  getMoodLog, addMoodCheckIn,
  getPriorities, addPriority, togglePriority, getHabits, getHabitLogForRange, setHabitLog,
  getInbox,
  type BearcatRow, type HabitRow, type PriorityRow, type HabitLogRow, type InboxRow, type MoodLogRow,
} from "@/db/client";

const today = dkey();

export default function TodayScreen() {
  const [berries, setBerriesCount] = useState(12);
  const [bearcat, setBearcatState] = useState<BearcatRow | null>(null);
  const [nameInput, setNameInput] = useState("Mochi");
  const [intention, setIntentionText] = useState("");
  const [mood, setMoodValue] = useState<number | null>(null);
  const [moodLog, setMoodLogState] = useState<MoodLogRow[]>([]);
  const [win, setWinText] = useState("");
  const [priorities, setPriorities] = useState<PriorityRow[]>([]);
  const [newPriority, setNewPriority] = useState("");
  const [habits, setHabits] = useState<HabitRow[]>([]);
  const [habitLog, setHabitLogState] = useState<HabitLogRow[]>([]);
  const [inbox, setInboxState] = useState<InboxRow[]>([]);
  const [sheet, setSheet] = useState<QuickSheetKey>(null);

  const load = useCallback(async () => {
    const week = weekDays();
    const [bc, intentionText, moodVal, ml, winText, pri, hb, log, ib] = await Promise.all([
      getBearcat(),
      getIntention(today),
      getMood(today),
      getMoodLog(today),
      getWin(today),
      getPriorities(today),
      getHabits(),
      getHabitLogForRange(week[0], week[6]),
      getInbox(),
    ]);
    setBerriesCount(bc.berries);
    setBearcatState(bc);
    setNameInput(bc.name);
    setIntentionText(intentionText);
    setMoodValue(moodVal);
    setMoodLogState(ml);
    setWinText(winText);
    setPriorities(pri);
    setHabits(hb);
    setHabitLogState(log);
    setInboxState(ib);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const moodStats = moodDayStats(moodLog.map((m) => m.value));

  const week = weekDays();
  let need = 0, hit = 0;
  habits.forEach((h) => {
    need += h.target;
    hit += habitLog.filter((l) => l.habit_id === h.id && week.includes(l.date)).length;
  });
  const weekScore = need ? Math.min(1, hit / need) : 0;

  const catMood = moodForToday({
    todayMood: mood,
    todayWin: win,
    hasDoneAnyPriority: priorities.some((p) => p.done),
    hasLoggedAnyHabitToday: habitLog.some((l) => l.date === today),
    weekScore,
  });

  async function grantBerries(n: number) {
    await addBerries(n);
    const bc = await getBearcat();
    setBerriesCount(bc.berries);
  }

  // For sheets whose db.client function already grants berries itself
  // (addWorkout, addSession) — just re-pull the count rather than granting
  // a second time.
  async function refreshBerries() {
    const bc = await getBearcat();
    setBerriesCount(bc.berries);
  }

  async function onPickMood(value: number) {
    const first = moodLog.length === 0;
    const id = uid();
    await addMoodCheckIn(id, today, value);
    const [ml, dayVal] = await Promise.all([getMoodLog(today), getMood(today)]);
    setMoodLogState(ml);
    setMoodValue(dayVal);
    if (first) await grantBerries(1);
  }

  async function onBlurIntention() {
    await setIntention(today, intention);
  }

  async function onBlurName() {
    const trimmed = nameInput.trim() || "Mochi";
    setNameInput(trimmed);
    if (bearcat && trimmed !== bearcat.name) {
      await setBearcatName(trimmed);
      setBearcatState({ ...bearcat, name: trimmed });
    }
  }

  async function onBlurWin() {
    if (!win.trim()) return;
    const wasEmpty = (await getWin(today)) === "";
    await setWin(today, win.trim());
    if (wasEmpty) await grantBerries(3);
  }

  async function onAddPriority() {
    const text = newPriority.trim();
    if (!text || priorities.length >= 3) return;
    const id = uid();
    await addPriority(id, today, text);
    setNewPriority("");
    setPriorities((p) => [...p, { id, date: today, text, done: 0 }]);
  }

  async function onTogglePriority(p: PriorityRow) {
    const done = !p.done;
    await togglePriority(p.id, done);
    setPriorities((prev) => prev.map((x) => (x.id === p.id ? { ...x, done: done ? 1 : 0 } : x)));
  }

  async function onCycleHabit(h: HabitRow) {
    const cur = habitLog.find((l) => l.habit_id === h.id && l.date === today)?.status ?? null;
    const cozyThisWeek = habitLog.filter((l) => l.habit_id === h.id && l.status === "cozy" && week.includes(l.date)).length;
    let next: "done" | "cozy" | null;
    if (!cur) next = "done";
    else if (cur === "done") next = cozyThisWeek < 1 ? "cozy" : null;
    else next = null;

    await setHabitLog(h.id, today, next);
    setHabitLogState((prev) => {
      const rest = prev.filter((l) => !(l.habit_id === h.id && l.date === today));
      return next ? [...rest, { habit_id: h.id, date: today, status: next }] : rest;
    });
    if (next === "done") await grantBerries(3);
    if (next === "cozy") await grantBerries(1);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Mochi pose={catMood} size={140} />
          <View style={styles.heroMeta}>
            <Text style={styles.eyebrow}>{prettyDate()}</Text>
            <TextInput
              style={styles.h1Input}
              value={nameInput}
              onChangeText={setNameInput}
              onBlur={onBlurName}
              placeholder="Mochi"
              placeholderTextColor={colors.inkSoft}
              maxLength={20}
            />
            <Text style={styles.berries}>{"\u{1F353}"} {berries} berries</Text>
            <View style={styles.ring}>
              <View style={[styles.ringFill, { width: `${Math.round(weekScore * 100)}%` }]} />
            </View>
            <Text style={styles.hint}>This week, together</Text>
          </View>
        </View>

        <Card title="Today I am…">
          <TextInput
            style={styles.input}
            value={intention}
            onChangeText={setIntentionText}
            onBlur={onBlurIntention}
            placeholder="someone who starts before feeling ready"
            placeholderTextColor="#D3A8BE"
          />
        </Card>

        <Card title="How are you?" hint="tap anytime, as often as you like">
          <View style={styles.moodRow}>
            {moodPoses.map((pose, i) => {
              const on = moodLog.length > 0 && moodLog[moodLog.length - 1].value === i + 1;
              return (
                <Pressable
                  key={pose}
                  onPress={() => onPickMood(i + 1)}
                  style={[styles.moodBtn, on && { backgroundColor: moodColors[i], transform: [{ translateY: -3 }, { scale: 1.06 }] }]}
                >
                  <Mochi pose={pose} size={52} mini />
                </Pressable>
              );
            })}
          </View>
          {moodStats && (
            <Text style={styles.moodStats}>
              {moodStats.percent}% today · {moodLog.length} check-in{moodLog.length === 1 ? "" : "s"}
            </Text>
          )}
        </Card>

        <Card title="Three things, at most" hint={`${priorities.length}/3`}>
          {priorities.length === 0 && <Text style={styles.empty}>Pick what would make today feel done.</Text>}
          {priorities.map((p) => (
            <Pressable key={p.id} onPress={() => onTogglePriority(p)} style={[styles.row, !!p.done && styles.rowDone]}>
              <View style={[styles.check, !!p.done && styles.checkDone]}>
                {!!p.done && <Text style={styles.checkMark}>{"✓"}</Text>}
              </View>
              <Text style={[styles.rowText, !!p.done && styles.rowTextDone]}>{p.text}</Text>
            </Pressable>
          ))}
          {priorities.length < 3 && (
            <View style={styles.addRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={newPriority}
                onChangeText={setNewPriority}
                placeholder="Add one"
                placeholderTextColor="#D3A8BE"
                onSubmitEditing={onAddPriority}
              />
              <Pressable style={styles.btn} onPress={onAddPriority}>
                <Text style={styles.btnText}>Add</Text>
              </Pressable>
            </View>
          )}
        </Card>

        <Card title="Habits" hint="tap once for done, twice to rest">
          <View style={styles.chips}>
            {habits.map((h) => {
              const status = habitLog.find((l) => l.habit_id === h.id && l.date === today)?.status;
              return (
                <Pressable
                  key={h.id}
                  onPress={() => onCycleHabit(h)}
                  style={[styles.chip, status === "done" && styles.chipDone, status === "cozy" && styles.chipCozy]}
                >
                  <Text style={styles.chipEmoji}>{h.emoji}</Text>
                  <Text style={[styles.chipText, !!status && styles.chipTextOn]}>{h.name}</Text>
                  {status === "cozy" && <Text style={styles.chipTag}>rest</Text>}
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card title="One small win" hint="your evidence">
          <TextInput
            style={[styles.input, styles.area]}
            value={win}
            onChangeText={setWinText}
            onBlur={onBlurWin}
            placeholder="Something true about today, however small."
            placeholderTextColor="#D3A8BE"
            multiline
          />
        </Card>

        <Card title="As it happens" hint="only when it happens">
          <QuickRow onPick={setSheet} />
        </Card>
      </ScrollView>

      <TimerSheet
        open={sheet === "timer" || sheet === "meditate"}
        kind={sheet === "meditate" ? "meditate" : "focus"}
        onClose={() => setSheet(null)}
        onLogged={refreshBerries}
      />
      <WorkoutSheet open={sheet === "workout"} onClose={() => setSheet(null)} onLogged={refreshBerries} />
      <MoneySheet open={sheet === "money"} onClose={() => setSheet(null)} onLogged={refreshBerries} />
      <InboxSheet open={sheet === "inbox"} onClose={() => setSheet(null)} inbox={inbox} onChange={setInboxState} />
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 14, paddingBottom: 40 },
  hero: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  heroMeta: { flex: 1, marginLeft: 8 },
  eyebrow: { fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: colors.inkSoft, fontWeight: "700" },
  h1Input: {
    fontSize: 26, fontWeight: "700", color: colors.ink, padding: 0, marginTop: 1,
    borderBottomWidth: 1, borderBottomColor: colors.pinkPale, borderStyle: "dashed", alignSelf: "flex-start",
  },
  h2: { fontSize: 16, fontWeight: "700", color: colors.ink },
  berries: { fontSize: 13, color: colors.pinkDeep, fontWeight: "700", marginTop: 2 },
  ring: { height: 10, borderRadius: 99, backgroundColor: colors.pinkPale, marginVertical: 8, overflow: "hidden" },
  ringFill: { height: "100%", borderRadius: 99, backgroundColor: colors.pinkDeep },
  hint: { fontSize: 12.5, color: colors.inkSoft },
  empty: { fontSize: 13.5, color: colors.inkSoft, paddingVertical: 6 },
  card: { backgroundColor: colors.card, borderRadius: 22, padding: 15, marginBottom: 12 },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 },
  cardBody: { gap: 9 },
  input: {
    borderWidth: 1.5, borderColor: colors.pinkPale, backgroundColor: colors.cream, borderRadius: 14,
    paddingHorizontal: 13, paddingVertical: 11, fontSize: 15, color: colors.ink,
  },
  area: { minHeight: 62, textAlignVertical: "top" },
  moodRow: { flexDirection: "row", gap: 8, justifyContent: "space-between" },
  moodBtn: { flex: 1, height: 78, borderRadius: 16, backgroundColor: colors.pixel, alignItems: "center", justifyContent: "center" },
  moodStats: { fontSize: 12.5, color: colors.inkSoft, textAlign: "center", marginTop: 8 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: colors.cream,
    borderWidth: 1.5, borderColor: colors.pinkPale, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12,
  },
  rowDone: { backgroundColor: "#FDF2F6" },
  rowText: { fontSize: 15, color: colors.ink, flex: 1 },
  rowTextDone: { color: colors.inkSoft, textDecorationLine: "line-through" },
  check: { width: 21, height: 21, borderRadius: 11, borderWidth: 2, borderColor: colors.pink, alignItems: "center", justifyContent: "center" },
  checkDone: { backgroundColor: colors.pinkDeep, borderColor: colors.pinkDeep },
  checkMark: { color: "#fff", fontSize: 12, fontWeight: "800" },
  addRow: { flexDirection: "row", gap: 8 },
  btn: { backgroundColor: colors.pinkDeep, borderRadius: 14, paddingHorizontal: 17, paddingVertical: 11, justifyContent: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 14.5 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1.5, borderColor: colors.pinkPale,
    backgroundColor: colors.cream, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 9,
  },
  chipDone: { backgroundColor: colors.pink, borderColor: colors.pinkDeep },
  chipCozy: { backgroundColor: colors.lilac, borderColor: colors.lilac },
  chipEmoji: { fontSize: 16 },
  chipText: { fontSize: 14, fontWeight: "600", color: colors.ink },
  chipTextOn: { color: "#fff" },
  chipTag: { fontSize: 10, fontWeight: "700", color: "#fff", opacity: 0.85, textTransform: "uppercase" },
});
