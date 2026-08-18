import React, { useCallback, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, LayoutChangeEvent, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Mochi } from "@/components/Mochi";
import { colors } from "@/theme/tokens";
import { dkey, uid } from "@/lib/dates";
import {
  getQuests, getAllMilestones, getAllEvidence,
  addQuest, removeQuest, pinQuest, setQuestResting, setQuestIntention, adjustQuestMoves,
  addMilestone, setMilestoneDone, addEvidence, addBerries,
  type QuestRow, type MilestoneRow, type EvidenceRow,
} from "@/db/client";

export default function QuestsScreen() {
  const [quests, setQuests] = useState<QuestRow[]>([]);
  const [milestones, setMilestones] = useState<MilestoneRow[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [newQuestName, setNewQuestName] = useState("");
  const [milestoneDraft, setMilestoneDraft] = useState<Record<string, string>>({});
  const [evidenceDraft, setEvidenceDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [q, m, e] = await Promise.all([getQuests(), getAllMilestones(), getAllEvidence()]);
    setQuests(q);
    setMilestones(m);
    setEvidence(e);
    setOpenId((cur) => cur ?? q[0]?.id ?? null);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function milestonesFor(qid: string): MilestoneRow[] {
    return milestones.filter((m) => m.quest_id === qid).sort((a, b) => a.sort_order - b.sort_order);
  }
  function evidenceFor(qid: string): EvidenceRow[] {
    return evidence.filter((e) => e.quest_id === qid);
  }

  async function onAddQuest() {
    const trimmed = newQuestName.trim();
    if (!trimmed) return;
    const id = uid();
    await addQuest(id, trimmed);
    setQuests((prev) => [...prev, { id, name: trimmed, intention: "", pinned: 0, resting: 0, moves: 0 }]);
    setNewQuestName("");
    setOpenId(id);
  }

  async function onToggleMilestone(q: QuestRow, m: MilestoneRow) {
    const nowDone = !m.done;
    await setMilestoneDone(m.id, nowDone);
    setMilestones((prev) => prev.map((x) => (x.id === m.id ? { ...x, done: nowDone ? 1 : 0 } : x)));
    // Moves only ever increase, mirroring the reference: unchecking a milestone
    // doesn't take a move back — the effort already happened.
    if (nowDone) {
      await adjustQuestMoves(q.id, 1);
      setQuests((prev) => prev.map((x) => (x.id === q.id ? { ...x, moves: x.moves + 1 } : x)));
      await addBerries(25);
    }
  }

  async function onAddMilestone(q: QuestRow) {
    const text = (milestoneDraft[q.id] ?? "").trim();
    if (!text) return;
    const id = uid();
    const existing = milestonesFor(q.id);
    const sortOrder = existing.length ? Math.max(...existing.map((m) => m.sort_order)) + 1 : 0;
    await addMilestone(id, q.id, text, sortOrder);
    setMilestones((prev) => [...prev, { id, quest_id: q.id, text, done: 0, sort_order: sortOrder }]);
    setMilestoneDraft((prev) => ({ ...prev, [q.id]: "" }));
  }

  async function onAddEvidence(q: QuestRow) {
    const text = (evidenceDraft[q.id] ?? "").trim();
    if (!text) return;
    const id = uid();
    const date = dkey();
    await addEvidence(id, q.id, date, text);
    setEvidence((prev) => [{ id, quest_id: q.id, date, text }, ...prev]);
    await adjustQuestMoves(q.id, 1);
    setQuests((prev) => prev.map((x) => (x.id === q.id ? { ...x, moves: x.moves + 1 } : x)));
    await addBerries(3);
    setEvidenceDraft((prev) => ({ ...prev, [q.id]: "" }));
  }

  function onRemove(q: QuestRow) {
    Alert.alert(
      "Remove this one?",
      `"${q.name}" and its milestones/evidence will be gone for good.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await removeQuest(q.id);
            setQuests((prev) => prev.filter((x) => x.id !== q.id));
            setMilestones((prev) => prev.filter((m) => m.quest_id !== q.id));
            setEvidence((prev) => prev.filter((e) => e.quest_id !== q.id));
            setOpenId((cur) => (cur === q.id ? null : cur));
          },
        },
      ]
    );
  }

  async function onPin(q: QuestRow) {
    await pinQuest(q.id);
    setQuests((prev) => prev.map((x) => ({ ...x, pinned: x.id === q.id ? 1 : 0 })));
  }

  async function onToggleResting(q: QuestRow) {
    const next = !q.resting;
    await setQuestResting(q.id, next);
    setQuests((prev) => prev.map((x) => (x.id === q.id ? { ...x, resting: next ? 1 : 0 } : x)));
  }

  async function onIntentionBlur(q: QuestRow, text: string) {
    if (text === q.intention) return;
    await setQuestIntention(q.id, text);
    setQuests((prev) => prev.map((x) => (x.id === q.id ? { ...x, intention: text } : x)));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.pagehead}>
          <View style={styles.pageheadText}>
            <Text style={styles.h1}>Becoming</Text>
            <Text style={styles.hint}>The long things. Measured in moves you control, never in outcomes you don't.</Text>
          </View>
          <Mochi pose="thinking" size={78} />
        </View>

        {quests.length === 0 && (
          <View style={[styles.card, styles.emptyCard]}>
            <Mochi pose="curious" mini size={40} />
            <Text style={styles.empty}>
              Nothing here yet. What's something you're growing toward? Add one below — you can always start small.
            </Text>
          </View>
        )}

        {quests.map((q) => {
          const qMilestones = milestonesFor(q.id);
          const qEvidence = evidenceFor(q.id);
          const doneCount = qMilestones.filter((m) => m.done).length;
          const open = openId === q.id;
          return (
            <View key={q.id} style={styles.card}>
              <Pressable style={styles.questHead} onPress={() => setOpenId(open ? null : q.id)}>
                <View style={styles.questHeadText}>
                  <Text style={styles.h3}>{q.pinned ? "\u{1F4CC} " : ""}{q.name}</Text>
                  <Text style={styles.hint}>
                    {doneCount}/{qMilestones.length} milestones · {q.moves} moves made
                    {q.resting ? " · resting" : ""}
                  </Text>
                </View>
                <Text style={styles.caret}>{open ? "▾" : "▸"}</Text>
              </Pressable>

              <QuestPath milestones={qMilestones} />

              {open && (
                <>
                  <View style={styles.intentionBlock}>
                    <Text style={styles.eyebrow}>Intention</Text>
                    <TextInput
                      key={q.id}
                      style={[styles.input, styles.italic]}
                      defaultValue={q.intention}
                      placeholder="I'm someone who…"
                      placeholderTextColor="#D3A8BE"
                      onBlur={(e) => onIntentionBlur(q, e.nativeEvent.text)}
                    />
                    <Text style={styles.hint}>Present tense. Describe who you are, not what you want.</Text>
                  </View>

                  {qMilestones.map((m) => (
                    <Pressable
                      key={m.id}
                      style={[styles.milestoneRow, !!m.done && styles.milestoneRowDone]}
                      onPress={() => onToggleMilestone(q, m)}
                    >
                      <View style={[styles.checkCircle, !!m.done && styles.checkCircleDone]}>
                        {!!m.done && <Text style={styles.checkMark}>✓</Text>}
                      </View>
                      <Text style={[styles.milestoneText, !!m.done && styles.milestoneTextDone]}>{m.text}</Text>
                    </Pressable>
                  ))}

                  <View style={styles.addRow}>
                    <TextInput
                      style={[styles.input, styles.flex1]}
                      value={milestoneDraft[q.id] ?? ""}
                      onChangeText={(t) => setMilestoneDraft((prev) => ({ ...prev, [q.id]: t }))}
                      placeholder="A step you control"
                      placeholderTextColor="#D3A8BE"
                      onSubmitEditing={() => onAddMilestone(q)}
                    />
                    <Pressable style={styles.btnSmall} onPress={() => onAddMilestone(q)}>
                      <Text style={styles.btnText}>Add</Text>
                    </Pressable>
                  </View>

                  <View style={styles.evidenceBlock}>
                    <Text style={styles.eyebrow}>Evidence</Text>
                    {qEvidence.length === 0 && (
                      <View style={styles.evidenceEmptyRow}>
                        <Mochi pose="peeking" mini size={26} />
                        <Text style={styles.evidenceEmpty}>Proof goes here. Start with one line.</Text>
                      </View>
                    )}
                    {qEvidence.map((e) => (
                      <Text key={e.id} style={styles.evidenceRow}>
                        <Text style={styles.evidenceDate}>{e.date}</Text> {e.text}
                      </Text>
                    ))}
                    <View style={styles.addRow}>
                      <TextInput
                        style={[styles.input, styles.flex1]}
                        value={evidenceDraft[q.id] ?? ""}
                        onChangeText={(t) => setEvidenceDraft((prev) => ({ ...prev, [q.id]: t }))}
                        placeholder="Something I did that proves it"
                        placeholderTextColor="#D3A8BE"
                        onSubmitEditing={() => onAddEvidence(q)}
                      />
                      <Pressable style={styles.btnSmall} onPress={() => onAddEvidence(q)}>
                        <Text style={styles.btnText}>Add</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.questFoot}>
                    <Pressable style={styles.btnGhost} onPress={() => onPin(q)}>
                      <Text style={styles.btnGhostText}>Pin to Today</Text>
                    </Pressable>
                    <Pressable style={styles.btnGhost} onPress={() => onToggleResting(q)}>
                      <Text style={styles.btnGhostText}>{q.resting ? "Wake it up" : "Let it rest"}</Text>
                    </Pressable>
                    <Pressable style={styles.btnGhost} onPress={() => onRemove(q)}>
                      <Text style={styles.btnGhostText}>Remove</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          );
        })}

        <View style={styles.card}>
          <View style={styles.cardHeadTitle}>
            <Mochi pose="determined" mini size={28} />
            <Text style={styles.h2}>Something new to grow into</Text>
          </View>
          <View style={[styles.addRow, styles.addRowTop]}>
            <TextInput
              style={[styles.input, styles.flex1]}
              value={newQuestName}
              onChangeText={setNewQuestName}
              placeholder="What are you growing toward?"
              placeholderTextColor="#D3A8BE"
              onSubmitEditing={onAddQuest}
            />
            <Pressable style={styles.btnSmall} onPress={onAddQuest}>
              <Text style={styles.btnText}>Add</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// No SVG library is installed and adding one wasn't approved this session
// (see SESSION_HANDOFF.md), so this is a hand-built substitute for the
// reference prototype's winding SVG path: milestone nodes are laid out
// along the same sine-wave curve as `QuestPath` in
// reference/bearcat_planner.jsx, connected by a trail of small dots
// (sampled continuously along that same curve) instead of a stroked
// <path>, with Mochi (`happy` pose) placed at the furthest milestone
// reached, same as the reference.
const PATH_HEIGHT = 150;
const PATH_PAD = 22;
const PATH_BASE_Y = 95;
const PATH_AMPLITUDE = 20;

function curveY(t: number): number {
  return PATH_BASE_Y + Math.sin(t * 1.25) * PATH_AMPLITUDE;
}

function QuestPath({ milestones }: { milestones: MilestoneRow[] }) {
  const [width, setWidth] = useState(0);

  function onLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  if (milestones.length === 0) {
    return (
      <View style={styles.pathWrap} onLayout={onLayout}>
        <Text style={styles.pathEmpty}>No milestones yet — add a small step below to start the path.</Text>
      </View>
    );
  }

  const n = Math.max(milestones.length, 2);
  const span = width - PATH_PAD * 2;

  function xAt(t: number): number {
    return PATH_PAD + (t * span) / Math.max(n - 1, 1);
  }

  const pts = milestones.map((m, i) => ({ x: xAt(i), y: curveY(i), done: !!m.done }));
  const here = [...pts].reverse().find((p) => p.done) ?? pts[0];

  const dots: { x: number; y: number }[] = [];
  if (width > 0 && milestones.length > 1) {
    const steps = 28;
    for (let s = 0; s <= steps; s++) {
      const t = (s / steps) * (milestones.length - 1);
      dots.push({ x: xAt(t), y: curveY(t) });
    }
  }

  return (
    <View style={styles.pathWrap} onLayout={onLayout}>
      {width > 0 && (
        <View style={{ height: PATH_HEIGHT }}>
          {dots.map((d, i) => (
            <View key={i} style={[styles.pathDot, { left: d.x - 2, top: d.y - 2 }]} />
          ))}
          {pts.map((p, i) => {
            const size = p.done ? 24 : 18;
            return (
              <View
                key={i}
                style={[
                  styles.pathNode,
                  { width: size, height: size, borderRadius: size / 2, left: p.x - size / 2, top: p.y - size / 2 },
                  p.done ? styles.pathNodeDone : styles.pathNodeOpen,
                ]}
              >
                {p.done && <Text style={styles.pathCheck}>✓</Text>}
              </View>
            );
          })}
          <View style={[styles.pathMochi, { left: here.x - 23, top: here.y - 40 }]} pointerEvents="none">
            <Mochi pose="happy" size={46} mini />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 14, paddingBottom: 40 },
  pagehead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  pageheadText: { flex: 1 },
  h1: { fontSize: 26, fontWeight: "700", color: colors.ink },
  h2: { fontSize: 16, fontWeight: "700", color: colors.ink, marginBottom: 10 },
  h3: { fontSize: 16, fontWeight: "700", color: colors.ink },
  hint: { fontSize: 12.5, color: colors.inkSoft },
  empty: { flex: 1, fontSize: 13.5, color: colors.inkSoft, paddingVertical: 6 },
  card: { backgroundColor: colors.card, borderRadius: 22, padding: 15, marginBottom: 12 },
  emptyCard: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardHeadTitle: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  questHead: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 4 },
  questHeadText: { flex: 1, minWidth: 0 },
  caret: { color: colors.pinkDeep, fontSize: 14 },

  pathWrap: { marginVertical: 4 },
  pathEmpty: { fontSize: 12.5, color: colors.inkSoft, paddingVertical: 10 },
  pathDot: { position: "absolute", width: 4, height: 4, borderRadius: 2, backgroundColor: colors.path },
  pathNode: { position: "absolute", alignItems: "center", justifyContent: "center" },
  pathNodeOpen: { backgroundColor: colors.path },
  pathNodeDone: { backgroundColor: colors.pinkDeep },
  pathCheck: { color: "#fff", fontSize: 11, fontWeight: "800" },
  pathMochi: { position: "absolute" },

  eyebrow: { fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: colors.inkSoft, fontWeight: "700", marginBottom: 6 },
  intentionBlock: { marginTop: 10, marginBottom: 12, gap: 4 },
  italic: { fontStyle: "italic" },
  input: {
    borderWidth: 1.5, borderColor: colors.pinkPale, backgroundColor: colors.cream, borderRadius: 14,
    paddingHorizontal: 13, paddingVertical: 11, fontSize: 15, color: colors.ink,
  },
  flex1: { flex: 1 },

  milestoneRow: {
    flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: colors.cream,
    borderWidth: 1.5, borderColor: colors.pinkPale, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12,
    marginBottom: 8,
  },
  milestoneRowDone: { backgroundColor: colors.bg },
  checkCircle: {
    width: 21, height: 21, borderRadius: 11, borderWidth: 2, borderColor: colors.pink,
    alignItems: "center", justifyContent: "center",
  },
  checkCircleDone: { backgroundColor: colors.pinkDeep, borderColor: colors.pinkDeep },
  checkMark: { color: "#fff", fontSize: 12, fontWeight: "800" },
  milestoneText: { flex: 1, fontSize: 15, color: colors.ink },
  milestoneTextDone: { color: colors.inkSoft, textDecorationLine: "line-through" },

  addRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  addRowTop: { marginTop: 2 },
  btnSmall: { backgroundColor: colors.pinkDeep, borderRadius: 14, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  evidenceBlock: { marginTop: 12, gap: 7 },
  evidenceEmptyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  evidenceEmpty: { fontSize: 13, color: colors.inkSoft, fontStyle: "italic" },
  evidenceRow: { fontSize: 13.5, color: colors.ink },
  evidenceDate: { color: colors.inkSoft, fontSize: 11, fontWeight: "700" },

  questFoot: { flexDirection: "row", gap: 8, marginTop: 12 },
  btnGhost: {
    flex: 1, borderWidth: 1.5, borderColor: colors.pinkPale, borderRadius: 14, paddingVertical: 11,
    alignItems: "center", backgroundColor: colors.cream,
  },
  btnGhostText: { color: colors.pinkDeep, fontWeight: "700", fontSize: 13.5 },
});
