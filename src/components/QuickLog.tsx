import React, { useEffect, useRef, useState } from "react";
import { Modal, View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { Mochi } from "@/components/Mochi";
import { colors, spendCategories, incomeCategories } from "@/theme/tokens";
import { dkey, uid } from "@/lib/dates";
import { addSession, addWorkout, addMoney, addSleep, addInboxItem, removeInboxItem, type InboxRow } from "@/db/client";

// The "As it happens" row on Today — five quick-log buttons opening bottom
// sheets, ported from reference/bearcat_planner.jsx's Today quickrow +
// TimerSheet/WorkoutSheet/MoneySheet/InboxSheet. Manual sleep logging is
// folded into the Breathe sheet (a mode toggle alongside the meditation
// timer) rather than getting its own quick-log button — the spec's five
// quick-log poses (reading/sleeping/exercising/drink/thinking) only leave
// room for one Breathe-shaped entry point, and sleep is naturally a
// "before/after Breathe" moment.

const QUICK_ITEMS = [
  { key: "timer", pose: "reading", label: "Focus" },
  { key: "meditate", pose: "sleeping", label: "Breathe" },
  { key: "workout", pose: "exercising", label: "Workout" },
  { key: "money", pose: "drink", label: "Money" },
  { key: "inbox", pose: "thinking", label: "Dump" },
] as const;

export type QuickSheetKey = (typeof QUICK_ITEMS)[number]["key"] | null;

export function QuickRow({ onPick }: { onPick: (key: QuickSheetKey) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
      {QUICK_ITEMS.map((item) => (
        <Pressable key={item.key} style={styles.quickBtn} onPress={() => onPick(item.key)}>
          <Mochi pose={item.pose} size={42} mini />
          <Text style={styles.quickLabel}>{item.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.grip} />
          <Text style={styles.sheetTitle}>{title}</Text>
          {children}
          <Pressable style={styles.ghostBtn} onPress={onClose}>
            <Text style={styles.ghostBtnText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, on && styles.chipOn]} onPress={onPress}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

/* ---------- Focus / Breathe (shared timer engine, Breathe also logs sleep) ---------- */

const FOCUS_OPTS = [15, 25, 50];
const MEDITATE_OPTS = [3, 5, 10, 20];
const FOCUS_TAGS = ["study", "applications", "admin", "making"] as const;

export function TimerSheet({
  open, kind, onClose, onLogged,
}: {
  open: boolean;
  kind: "focus" | "meditate";
  onClose: () => void;
  onLogged: () => void;
}) {
  const opts = kind === "meditate" ? MEDITATE_OPTS : FOCUS_OPTS;
  // "sleep" mode only exists for kind "meditate" — this sheet is one
  // mounted instance reused for both Focus and Breathe (Modal just toggles
  // `visible`), so state persists across kind switches unless reset below.
  const [mode, setMode] = useState<"timer" | "sleep">("timer");
  const [mins, setMins] = useState(kind === "meditate" ? 5 : 25);
  const [left, setLeft] = useState<number | null>(null);
  const [tag, setTag] = useState<(typeof FOCUS_TAGS)[number]>("study");
  const [sleepHours, setSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState<"rough" | "okay" | "good">("okay");
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const effectiveMode = kind === "meditate" ? mode : "timer";

  useEffect(() => {
    if (left === null) return;
    if (left <= 0) {
      if (interval.current) clearInterval(interval.current);
      addSession(uid(), dkey(), kind, mins, kind === "focus" ? tag : null).then(onLogged);
      setLeft(null);
      return;
    }
    interval.current = setInterval(() => setLeft((v) => (v ?? 1) - 1), 1000);
    return () => { if (interval.current) clearInterval(interval.current); };
  }, [left]);

  useEffect(() => () => { if (interval.current) clearInterval(interval.current); }, []);

  // Reset per-kind state whenever the sheet opens fresh, so leftover state
  // from a Focus session doesn't leak into a later Breathe session (or vice
  // versa) since the component instance is shared between them.
  useEffect(() => {
    if (open) {
      setMode("timer");
      setMins(kind === "meditate" ? 5 : 25);
    } else if (left !== null) {
      // Closing mid-run should stop the clock, not leave it ticking in the
      // background while the sheet is hidden.
      setLeft(null);
    }
  }, [open]);

  const mm = String(left !== null ? Math.floor(left / 60) : mins).padStart(2, "0");
  const ss = String(left !== null ? left % 60 : 0).padStart(2, "0");

  async function onLogSleep() {
    const hours = parseFloat(sleepHours);
    if (!Number.isFinite(hours) || hours <= 0) return;
    await addSleep(uid(), dkey(), hours, sleepQuality);
    setSleepHours("");
    onClose();
  }

  return (
    <Sheet open={open} title={kind === "meditate" ? "Breathe together" : "Focus together"} onClose={onClose}>
      {kind === "meditate" && (
        <View style={styles.seg}>
          <Pressable style={[styles.segBtn, mode === "timer" && styles.segBtnOn]} onPress={() => setMode("timer")}>
            <Text style={[styles.segText, mode === "timer" && styles.segTextOn]}>Timer</Text>
          </Pressable>
          <Pressable style={[styles.segBtn, mode === "sleep" && styles.segBtnOn]} onPress={() => setMode("sleep")}>
            <Text style={[styles.segText, mode === "sleep" && styles.segTextOn]}>Log sleep</Text>
          </Pressable>
        </View>
      )}

      {effectiveMode === "sleep" ? (
        <>
          <TextInput
            style={styles.input}
            value={sleepHours}
            onChangeText={setSleepHours}
            placeholder="Hours"
            placeholderTextColor="#D3A8BE"
            keyboardType="decimal-pad"
          />
          <View style={styles.chips}>
            {(["rough", "okay", "good"] as const).map((q) => (
              <Chip key={q} label={q} on={sleepQuality === q} onPress={() => setSleepQuality(q)} />
            ))}
          </View>
          <Pressable style={styles.btn} onPress={onLogSleep}>
            <Text style={styles.btnText}>Log it</Text>
          </Pressable>
        </>
      ) : (
        <>
          <View style={styles.timerBox}>
            <Mochi pose={kind === "meditate" ? "sleeping" : "reading"} size={130} />
            <Text style={styles.clock}>{mm}:{ss}</Text>
          </View>
          {left === null ? (
            <>
              <View style={styles.chips}>
                {opts.map((m) => (
                  <Chip key={m} label={`${m} min`} on={mins === m} onPress={() => setMins(m)} />
                ))}
              </View>
              {kind === "focus" && (
                <View style={styles.chips}>
                  {FOCUS_TAGS.map((t) => (
                    <Chip key={t} label={t} on={tag === t} onPress={() => setTag(t)} />
                  ))}
                </View>
              )}
              <Pressable style={styles.btn} onPress={() => setLeft(mins * 60)}>
                <Text style={styles.btnText}>Start</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.ghostBtn} onPress={() => setLeft(null)}>
              <Text style={styles.ghostBtnText}>Stop early — no harm done</Text>
            </Pressable>
          )}
        </>
      )}
    </Sheet>
  );
}

/* ---------- Workout ---------- */

const WORKOUT_TYPES = ["run", "gym", "yoga", "walk", "other"] as const;

export function WorkoutSheet({ open, onClose, onLogged }: { open: boolean; onClose: () => void; onLogged: () => void }) {
  const [type, setType] = useState<(typeof WORKOUT_TYPES)[number]>("run");
  const [minutes, setMinutes] = useState("30");

  async function onLog() {
    const m = parseInt(minutes, 10);
    if (!m) return;
    await addWorkout(uid(), dkey(), type, m);
    onLogged();
    onClose();
  }

  return (
    <Sheet open={open} title="Log a workout" onClose={onClose}>
      <View style={styles.chips}>
        {WORKOUT_TYPES.map((t) => (
          <Chip key={t} label={t} on={type === t} onPress={() => setType(t)} />
        ))}
      </View>
      <TextInput
        style={styles.input}
        value={minutes}
        onChangeText={setMinutes}
        placeholder="minutes"
        placeholderTextColor="#D3A8BE"
        keyboardType="number-pad"
      />
      <Text style={styles.hint}>Minutes and type only. No weight, no calories — effort is the point.</Text>
      <Pressable style={styles.btn} onPress={onLog}>
        <Text style={styles.btnText}>Log it</Text>
      </Pressable>
    </Sheet>
  );
}

/* ---------- Money ---------- */

export function MoneySheet({ open, onClose, onLogged }: { open: boolean; onClose: () => void; onLogged: () => void }) {
  const [dir, setDir] = useState<"in" | "out">("out");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(spendCategories[0]);

  function onSwitchDir(next: "in" | "out") {
    setDir(next);
    setCategory(next === "out" ? spendCategories[0] : incomeCategories[0]);
  }

  async function onSave() {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    await addMoney(uid(), dkey(), n, dir, category);
    onLogged();
    setAmount("");
    onClose();
  }

  const categories = dir === "out" ? spendCategories : incomeCategories;

  return (
    <Sheet open={open} title="Money" onClose={onClose}>
      <View style={styles.seg}>
        <Pressable style={[styles.segBtn, dir === "out" && styles.segBtnOn]} onPress={() => onSwitchDir("out")}>
          <Text style={[styles.segText, dir === "out" && styles.segTextOn]}>Spent</Text>
        </Pressable>
        <Pressable style={[styles.segBtn, dir === "in" && styles.segBtnOn]} onPress={() => onSwitchDir("in")}>
          <Text style={[styles.segText, dir === "in" && styles.segTextOn]}>Earned</Text>
        </Pressable>
      </View>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        placeholderTextColor="#D3A8BE"
        keyboardType="decimal-pad"
      />
      <View style={styles.chips}>
        {categories.map((c) => (
          <Chip key={c} label={c} on={category === c} onPress={() => setCategory(c)} />
        ))}
      </View>
      <Pressable style={styles.btn} onPress={onSave}>
        <Text style={styles.btnText}>Save</Text>
      </Pressable>
    </Sheet>
  );
}

/* ---------- Brain dump ---------- */

export function InboxSheet({
  open, onClose, inbox, onChange,
}: {
  open: boolean;
  onClose: () => void;
  inbox: InboxRow[];
  onChange: (next: InboxRow[]) => void;
}) {
  const [text, setText] = useState("");

  async function onAdd() {
    const t = text.trim();
    if (!t) return;
    const id = uid();
    await addInboxItem(id, t);
    onChange([...inbox, { id, text: t }]);
    setText("");
  }

  async function onRemove(id: string) {
    await removeInboxItem(id);
    onChange(inbox.filter((i) => i.id !== id));
  }

  return (
    <Sheet open={open} title="Brain dump" onClose={onClose}>
      <Text style={styles.hint}>Park it here so today stays to three things.</Text>
      <View style={styles.addRow}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          value={text}
          onChangeText={setText}
          placeholder="Anything on your mind"
          placeholderTextColor="#D3A8BE"
          onSubmitEditing={onAdd}
        />
        <Pressable style={styles.smallBtn} onPress={onAdd}>
          <Text style={styles.btnText}>Add</Text>
        </Pressable>
      </View>
      {inbox.length === 0 && <Text style={styles.empty}>Empty, which is a good sign.</Text>}
      {inbox.map((i) => (
        <Pressable key={i.id} style={styles.row} onPress={() => onRemove(i.id)}>
          <View style={styles.check} />
          <Text style={styles.rowText}>{i.text}</Text>
        </Pressable>
      ))}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  quickRow: { flexDirection: "row", gap: 8, paddingBottom: 2 },
  quickBtn: { width: 70, alignItems: "center", gap: 2, paddingVertical: 6, borderRadius: 18, backgroundColor: "#FDF2F7" },
  quickLabel: { fontSize: 11, fontWeight: "700", color: colors.inkSoft },

  scrim: { flex: 1, backgroundColor: "rgba(90,40,90,0.35)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 34, gap: 10 },
  grip: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.pinkPale, alignSelf: "center", marginBottom: 6 },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: colors.ink, marginBottom: 4 },

  seg: { flexDirection: "row", backgroundColor: "#FBE9F0", borderRadius: 14, padding: 4, gap: 4 },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: "center" },
  segBtnOn: { backgroundColor: "#fff" },
  segText: { fontSize: 13.5, fontWeight: "700", color: colors.inkSoft },
  segTextOn: { color: colors.pinkDeep },

  input: {
    borderWidth: 1.5, borderColor: colors.pinkPale, backgroundColor: colors.cream, borderRadius: 14,
    paddingHorizontal: 13, paddingVertical: 11, fontSize: 15, color: colors.ink,
  },
  hint: { fontSize: 12.5, color: colors.inkSoft },
  empty: { fontSize: 13.5, color: colors.inkSoft, paddingVertical: 6 },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1.5, borderColor: colors.pinkPale, backgroundColor: colors.cream, borderRadius: 99,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  chipOn: { backgroundColor: colors.pink, borderColor: colors.pinkDeep },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.ink },
  chipTextOn: { color: "#fff" },

  btn: { backgroundColor: colors.pinkDeep, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  smallBtn: { backgroundColor: colors.pinkDeep, borderRadius: 14, paddingHorizontal: 17, justifyContent: "center" },
  ghostBtn: { borderRadius: 14, paddingVertical: 12, alignItems: "center", borderWidth: 1.5, borderColor: colors.pinkPale },
  ghostBtnText: { color: colors.inkSoft, fontWeight: "700", fontSize: 14.5 },

  timerBox: { alignItems: "center", gap: 8, paddingVertical: 6 },
  clock: { fontSize: 34, fontWeight: "700", color: colors.ink, letterSpacing: 1 },

  addRow: { flexDirection: "row", gap: 8 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: colors.cream,
    borderWidth: 1.5, borderColor: colors.pinkPale, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12,
  },
  rowText: { fontSize: 15, color: colors.ink, flex: 1 },
  check: { width: 21, height: 21, borderRadius: 11, borderWidth: 2, borderColor: colors.pink },
});
