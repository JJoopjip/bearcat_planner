import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Mochi } from "@/components/Mochi";
import { colors, moodColors, scenes } from "@/theme/tokens";
import { dkey, addDays, startOfWeek, weekDays, uid } from "@/lib/dates";
import { moodForToday, stageFromMilestones } from "@/lib/mood";
import { getHealthSnapshot, type HealthSnapshot } from "@/lib/health";
import {
  getBearcat, getMinutesByKind, getMood, getWin, getPriorities, getHabits, getHabitLogForRange,
  getAllMoods, getAllMilestones, getRecentSleep, addSleep, getNotes, addNote,
  getReflection, setReflection, buyScene, setScene,
  type BearcatRow, type MoodRow, type MilestoneRow, type SleepRow, type NoteRow, type ReflectionRow,
} from "@/db/client";

const today = dkey();
const YEAR = new Date().getFullYear();

const possessive = (name: string): string => (name.endsWith("s") ? `${name}'` : `${name}'s`);

export default function MeScreen() {
  const [health, setHealth] = useState<HealthSnapshot | null>(null);
  const [focusMin, setFocusMin] = useState(0);
  const [meditateMin, setMeditateMin] = useState(0);
  const [bearcat, setBearcat] = useState<BearcatRow | null>(null);
  const [moods, setMoods] = useState<MoodRow[]>([]);
  const [milestones, setMilestones] = useState<MilestoneRow[]>([]);
  const [catMood, setCatMood] = useState<ReturnType<typeof moodForToday>>("happy");
  const [sleep, setSleep] = useState<SleepRow[]>([]);
  const [sleepHours, setSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState<"rough" | "okay" | "good">("okay");
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [reflection, setReflectionState] = useState<ReflectionRow | null>(null);

  const load = useCallback(async () => {
    const week = weekDays();
    const [h, focus, meditate, bc, mo, ml, sl, nt, mood, win, pri, hb, log] = await Promise.all([
      getHealthSnapshot(),
      getMinutesByKind("focus"),
      getMinutesByKind("meditate"),
      getBearcat(),
      getAllMoods(),
      getAllMilestones(),
      getRecentSleep(7),
      getNotes(),
      getMood(today),
      getWin(today),
      getPriorities(today),
      getHabits(),
      getHabitLogForRange(week[0], week[6]),
    ]);
    setHealth(h);
    setFocusMin(focus);
    setMeditateMin(meditate);
    setBearcat(bc);
    setMoods(mo);
    setMilestones(ml);
    setSleep(sl);
    setNotes(nt);

    let need = 0, hit = 0;
    hb.forEach((hab) => {
      need += hab.target;
      hit += log.filter((l) => l.habit_id === hab.id && week.includes(l.date)).length;
    });
    const weekScore = need ? Math.min(1, hit / need) : 0;
    setCatMood(moodForToday({
      todayMood: mood,
      todayWin: win,
      hasDoneAnyPriority: pri.some((p) => p.done),
      hasLoggedAnyHabitToday: log.some((l) => l.date === today),
      weekScore,
    }));

    const wk = dkey(startOfWeek());
    setReflectionState(await getReflection(wk));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const moodByDate = useMemo(() => {
    const map: Record<string, number> = {};
    moods.forEach((m) => { map[m.date] = m.value; });
    return map;
  }, [moods]);

  const cells = useMemo(() => {
    const jan1 = new Date(YEAR, 0, 1);
    const start = startOfWeek(jan1);
    return Array.from({ length: 371 }, (_, i) => {
      const d = addDays(start, i);
      return { key: dkey(d), inYear: d.getFullYear() === YEAR };
    });
  }, []);
  const columns = useMemo(() => {
    const cols: (typeof cells)[] = [];
    for (let c = 0; c < 53; c++) cols.push(cells.slice(c * 7, c * 7 + 7));
    return cols;
  }, [cells]);

  const doneMilestones = milestones.filter((m) => m.done).length;
  const stage = stageFromMilestones(doneMilestones);

  const sleepAvg = sleep.length ? sleep.reduce((a, b) => a + b.hours, 0) / sleep.length : null;

  async function onLogSleep() {
    const hours = parseFloat(sleepHours);
    if (!Number.isFinite(hours) || hours <= 0) return;
    const id = uid();
    await addSleep(id, today, hours, sleepQuality);
    setSleep((prev) => [{ id, date: today, hours, quality: sleepQuality }, ...prev].slice(0, 7));
    setSleepHours("");
  }

  async function onAddNote() {
    const text = noteDraft.trim();
    if (!text) return;
    const id = uid();
    await addNote(id, today, text);
    setNotes((prev) => [{ id, date: today, text }, ...prev]);
    setNoteDraft("");
  }

  async function onBlurReflection(field: "proud" | "learned" | "next", value: string) {
    if (!reflection) return;
    const wk = dkey(startOfWeek());
    const next = { ...reflection, [field]: value };
    setReflectionState(next);
    await setReflection(wk, next.proud, next.learned, next.next);
  }

  const owned: string[] = bearcat ? JSON.parse(bearcat.owned_scenes || "[]") : [];

  async function onScenePress(id: string, cost: number) {
    if (!bearcat) return;
    if (owned.includes(id)) {
      const next = bearcat.scene === id ? null : id;
      await setScene(next);
      setBearcat({ ...bearcat, scene: next });
    } else {
      const ok = await buyScene(id, cost);
      if (ok) setBearcat({ ...bearcat, berries: bearcat.berries - cost, owned_scenes: JSON.stringify([...owned, id]), scene: id });
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.pagehead}>
          <Text style={styles.h1}>Me</Text>
          <Text style={styles.sub}>A year of you, at a glance.</Text>
        </View>

        <Card title="Year in pixels" pose="awestruck" hint="one square, one day">
          <View style={styles.pixels}>
            {columns.map((col, ci) => (
              <View key={ci} style={styles.pixelCol}>
                {col.map((c) => {
                  const m = moodByDate[c.key];
                  return (
                    <View
                      key={c.key}
                      style={[
                        styles.pixel,
                        { backgroundColor: m ? moodColors[m - 1] : colors.pixel, opacity: c.inYear ? 1 : 0.25 },
                      ]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
          <View style={styles.legend}>
            {moodColors.map((c, i) => (
              <View key={i} style={[styles.legendDot, { backgroundColor: c }]} />
            ))}
            <Text style={styles.hint}>  low → bright</Text>
          </View>
        </Card>

        <Card title="From Health" pose="curious" hint={Platform.OS === "ios" ? "read-only" : "iOS only"}>
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
              <Stat label="Last night (auto)" value={health.lastNightSleepHours != null ? `${health.lastNightSleepHours}h` : "—"} color={colors.lilac} />
            </View>
          )}
        </Card>

        <Card title="Sleep quality" pose="tired" hint="Health tracks hours above — this is for how it felt">
          <View style={styles.statsRow}>
            <Stat label="Your 7-night avg" value={sleepAvg != null ? `${sleepAvg.toFixed(1)}h` : "—"} color={colors.lilac} />
          </View>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, styles.flex1]}
              value={sleepHours}
              onChangeText={setSleepHours}
              placeholder="Hours last night"
              placeholderTextColor="#D3A8BE"
              keyboardType="decimal-pad"
            />
            <Pressable style={styles.btnSmall} onPress={onLogSleep}>
              <Text style={styles.btnText}>Log</Text>
            </Pressable>
          </View>
          <View style={styles.chips}>
            {(["rough", "okay", "good"] as const).map((q) => (
              <Pressable key={q} style={[styles.chip, sleepQuality === q && styles.chipDone]} onPress={() => setSleepQuality(q)}>
                <Text style={[styles.chipText, sleepQuality === q && styles.chipTextOn]}>{q}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card title="Time you've given yourself" pose="determined">
          <View style={styles.statsRow}>
            <Stat label="Focus" value={`${focusMin}m`} />
            <Stat label="Breathing" value={`${meditateMin}m`} color={colors.lilac} />
          </View>
        </Card>

        <Card title="Notes" pose="giggling" hint="a running journal">
          {notes.length === 0 && (
            <View style={styles.emptyRow}>
              <Mochi pose="peeking" mini size={26} />
              <Text style={styles.empty}>Nothing here yet. Jot down a thought whenever one shows up.</Text>
            </View>
          )}
          {notes.map((n) => (
            <Text key={n.id} style={styles.noteRow}>
              <Text style={styles.noteDate}>{n.date}</Text> {n.text}
            </Text>
          ))}
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, styles.flex1]}
              value={noteDraft}
              onChangeText={setNoteDraft}
              placeholder="Write a line"
              placeholderTextColor="#D3A8BE"
              onSubmitEditing={onAddNote}
            />
            <Pressable style={styles.btnSmall} onPress={onAddNote}>
              <Text style={styles.btnText}>Add</Text>
            </Pressable>
          </View>
        </Card>

        <Card title="Sunday reflection" pose="proud" hint="once a week is enough">
          {[
            ["proud", "What am I proud of?"],
            ["learned", "What did I learn about myself?"],
            ["next", "What's one thing for next week?"],
          ].map(([key, question]) => (
            <View key={key} style={styles.reflectBlock}>
              <Text style={styles.reflectLabel}>{question}</Text>
              <TextInput
                key={`${key}-${reflection?.week_key ?? ""}`}
                style={[styles.input, styles.area]}
                defaultValue={reflection ? (reflection as any)[key] : ""}
                onBlur={(e) => onBlurReflection(key as "proud" | "learned" | "next", e.nativeEvent.text)}
                multiline
                placeholder="…"
                placeholderTextColor="#D3A8BE"
              />
            </View>
          ))}
        </Card>

        <Card title="Strawberry points" hint={`\u{1F353} ${bearcat?.berries ?? 0}`}>
          <View style={styles.berryRow}>
            <Mochi pose="giggling" mini size={30} />
            <Text style={styles.berryText}>
              Earn: a habit done <Text style={styles.bold}>+3</Text> · a cozy day{" "}
              <Text style={styles.bold}>+1</Text> · checking in on your mood, once a day{" "}
              <Text style={styles.bold}>+1</Text> · a small win <Text style={styles.bold}>+3</Text>
            </Text>
          </View>
          <View style={styles.berryRow}>
            <Mochi pose="proud" mini size={30} />
            <Text style={styles.berryText}>
              A quest milestone <Text style={styles.bold}>+25</Text> · adding evidence{" "}
              <Text style={styles.bold}>+3</Text> · a focus or breathing session{" "}
              <Text style={styles.bold}>+5</Text> · a workout <Text style={styles.bold}>+5</Text>
            </Text>
          </View>
          <View style={styles.berryRow}>
            <Mochi pose="awestruck" mini size={30} />
            <Text style={styles.berryText}>
              Spend them on a backdrop scene for {bearcat?.name ?? "Mochi"} below — nothing else to buy, no way to lose them.
            </Text>
          </View>
        </Card>

        <Card title={`${possessive(bearcat?.name ?? "Mochi")} corner`} hint={`\u{1F353} ${bearcat?.berries ?? 0}`}>
          <View style={styles.shopcat}>
            <Mochi pose={catMood} stage={stage} scene={(bearcat?.scene as any) ?? null} size={140} />
            <Text style={styles.hint}>Stage {stage} of 3 — grows with milestones, not streaks.</Text>
          </View>
          <Text style={styles.hint}>Tap a scene to see it, buy it, or wear it.</Text>
          <View style={styles.sceneGrid}>
            {scenes.map((o) => {
              const isOwned = owned.includes(o.id);
              const isOn = bearcat?.scene === o.id;
              return (
                <Pressable
                  key={o.id}
                  style={[styles.sceneCard, isOn && styles.sceneCardOn]}
                  onPress={() => onScenePress(o.id, o.cost)}
                >
                  <View style={[styles.sceneSwatch, { backgroundColor: o.color }]}>
                    <View style={[styles.sceneDot, { left: "22%", top: "28%", backgroundColor: o.dots[0] }]} />
                    <View style={[styles.sceneDot, { right: "20%", bottom: "24%", backgroundColor: o.dots[1] }]} />
                  </View>
                  <Text style={styles.sceneName}>{o.name}</Text>
                  <Text style={styles.sceneTagline}>{o.tagline}</Text>
                  <Text style={styles.scenePrice}>
                    {isOn ? "Wearing · tap to take off" : isOwned ? "Tap to wear" : `\u{1F353} ${o.cost}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({
  title, hint, pose, children,
}: { title: string; hint?: string; pose?: React.ComponentProps<typeof Mochi>["pose"]; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.cardHeadTitle}>
          {pose && <Mochi pose={pose} mini size={28} />}
          <Text style={styles.h2}>{title}</Text>
        </View>
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
  hint: { fontSize: 12.5, color: colors.inkSoft },
  empty: { flex: 1, fontSize: 13.5, color: colors.inkSoft, paddingVertical: 6 },
  emptyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  card: { backgroundColor: colors.card, borderRadius: 22, padding: 15, marginBottom: 12 },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 },
  cardHeadTitle: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardBody: { gap: 9 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statsRow: { flexDirection: "row", gap: 12 },
  stat: { flex: 1, minWidth: "40%", alignItems: "center" },
  statLabel: { fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: colors.inkSoft, fontWeight: "700" },
  statValue: { fontSize: 23, fontWeight: "700", color: colors.ink, marginTop: 3 },
  shopcat: { alignItems: "center", gap: 8, marginBottom: 10 },
  berryRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  berryText: { flex: 1, fontSize: 13, color: colors.ink, lineHeight: 18 },
  bold: { fontWeight: "700", color: colors.pinkDeep },

  pixels: { flexDirection: "row", gap: 2 },
  pixelCol: { flex: 1, gap: 2 },
  pixel: { aspectRatio: 1, borderRadius: 2, width: "100%" },
  legend: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 9 },
  legendDot: { width: 13, height: 13, borderRadius: 3 },

  addRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  flex1: { flex: 1 },
  input: {
    borderWidth: 1.5, borderColor: colors.pinkPale, backgroundColor: colors.cream, borderRadius: 14,
    paddingHorizontal: 13, paddingVertical: 11, fontSize: 15, color: colors.ink,
  },
  area: { minHeight: 56, textAlignVertical: "top" },
  btnSmall: { backgroundColor: colors.pinkDeep, borderRadius: 14, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: {
    borderWidth: 1.5, borderColor: colors.pinkPale, backgroundColor: colors.cream, borderRadius: 99,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  chipDone: { backgroundColor: colors.pink, borderColor: colors.pinkDeep },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.ink },
  chipTextOn: { color: "#fff" },

  sceneGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  sceneCard: {
    width: "47%", borderWidth: 1.5, borderColor: colors.pinkPale, backgroundColor: colors.cream,
    borderRadius: 16, padding: 10, alignItems: "center", gap: 3,
  },
  sceneCardOn: { borderColor: colors.pinkDeep, backgroundColor: "#fff" },
  sceneSwatch: { width: 48, height: 48, borderRadius: 24, marginBottom: 4 },
  sceneDot: { position: "absolute", width: 7, height: 7, borderRadius: 4 },
  sceneName: { fontSize: 13.5, fontWeight: "700", color: colors.ink },
  sceneTagline: { fontSize: 11.5, color: colors.inkSoft, fontStyle: "italic" },
  scenePrice: { fontSize: 12, fontWeight: "700", color: colors.pinkDeep, marginTop: 2 },

  noteRow: { fontSize: 13.5, color: colors.ink, marginBottom: 4 },
  noteDate: { color: colors.inkSoft, fontSize: 11, fontWeight: "700" },

  reflectBlock: { gap: 5, marginBottom: 4 },
  reflectLabel: { fontSize: 13, fontWeight: "700", color: colors.inkSoft },
});
