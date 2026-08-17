import { Platform } from "react-native";
import type { SQLiteDatabase } from "expo-sqlite";
import { migrate } from "./schema";
import { moodDayStats } from "@/lib/mood";

// expo-sqlite ~15 (this SDK 52 pin) has no web implementation at all —
// requireNativeModule("ExpoSQLite") throws the instant the module is
// evaluated, which crashes the whole web build before React can render.
// So on web we skip importing it entirely and use this in-memory
// stand-in instead, covering exactly the queries this file issues. It's
// seeded to match `migrate()`'s defaults but doesn't persist across
// reloads — fine for a demo link, not a substitute for the real app.
type Db = Pick<SQLiteDatabase, "getFirstAsync" | "getAllAsync" | "runAsync">;

function createWebStore(): Db {
  const bearcat = { name: "Mochi", berries: 12, scene: null as string | null, owned_scenes: "[]" };
  const intentions = new Map<string, string>();
  const moods = new Map<string, number>();
  const moodLog: MoodLogRow[] = [];
  const wins = new Map<string, string>();
  const priorities: PriorityRow[] = [];
  const habits: HabitRow[] = [
    { id: "h1", name: "Meditate", emoji: "\u{1F9D8}", target: 5 },
    { id: "h2", name: "Workout", emoji: "\u{1F3C3}", target: 4 },
    { id: "h3", name: "Read", emoji: "\u{1F4D6}", target: 4 },
    { id: "h4", name: "Walk outside", emoji: "\u{1F33F}", target: 5 },
  ];
  const habitLog: HabitLogRow[] = [];
  const sessions: { kind: string; minutes: number }[] = [];
  const quests: QuestRow[] = [
    { id: "q1", name: "Find a role I'm excited about", intention: "I'm someone who reaches out before I feel ready.", pinned: 1, resting: 0, moves: 0 },
  ];
  const milestones: MilestoneRow[] = [
    { id: "m1", quest_id: "q1", text: "Refresh my resume", done: 0, sort_order: 0 },
    { id: "m2", quest_id: "q1", text: "Reach out to 5 people", done: 0, sort_order: 1 },
    { id: "m3", quest_id: "q1", text: "Tailor 3 applications", done: 0, sort_order: 2 },
    { id: "m4", quest_id: "q1", text: "Have 2 real conversations", done: 0, sort_order: 3 },
  ];
  const evidence: EvidenceRow[] = [];
  // Not seeded — schema.ts's migrate() doesn't seed money/notes/reflections
  // either, so an empty web demo here matches the real app's empty state.
  const money: MoneyRow[] = [];
  const sleepLog: SleepRow[] = [];
  const notes: NoteRow[] = [];
  const reflections = new Map<string, ReflectionRow>();
  const inbox: InboxRow[] = [];

  return {
    async getFirstAsync<T>(sql: string, params: unknown = []): Promise<T | null> {
      const p = params as any[];
      if (sql.includes("FROM bearcat")) return { ...bearcat } as unknown as T;
      if (sql.includes("FROM intentions")) return (intentions.has(p[0]) ? { text: intentions.get(p[0]) } : null) as T | null;
      if (sql.includes("FROM moods")) return (moods.has(p[0]) ? { value: moods.get(p[0]) } : null) as T | null;
      if (sql.includes("FROM wins")) return (wins.has(p[0]) ? { text: wins.get(p[0]) } : null) as T | null;
      if (sql.includes("FROM reflections")) return (reflections.get(p[0]) ?? null) as T | null;
      if (sql.includes("SUM(minutes)")) {
        const total = sessions.filter((s) => s.kind === p[0]).reduce((sum, s) => sum + s.minutes, 0);
        return { total } as unknown as T;
      }
      return null;
    },
    async getAllAsync<T>(sql: string, params: unknown = []): Promise<T[]> {
      const p = params as any[];
      if (sql.includes("FROM priorities")) return priorities.filter((row) => row.date === p[0]) as unknown as T[];
      if (sql.includes("FROM habits")) return habits as unknown as T[];
      if (sql.includes("FROM habit_log")) {
        const [start, end] = p;
        return habitLog.filter((row) => row.date >= start && row.date <= end) as unknown as T[];
      }
      if (sql.includes("FROM quests")) return quests as unknown as T[];
      if (sql.includes("FROM milestones")) return milestones as unknown as T[];
      // Real query is "ORDER BY date DESC" — the array is push-appended in
      // insertion order, so it must be re-sorted here to match, otherwise a
      // reload on the web demo shows evidence oldest-first instead of newest.
      if (sql.includes("FROM evidence")) return [...evidence].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0)) as unknown as T[];
      // getAllMoods() has no ORDER BY (callers only ever group/filter it in
      // JS), so no sort needed here to match.
      if (sql.includes("FROM moods")) return Array.from(moods.entries()).map(([date, value]) => ({ date, value })) as unknown as T[];
      // Real query is "ORDER BY ts" (ascending — oldest check-in first).
      if (sql.includes("FROM mood_log")) return moodLog.filter((row) => row.date === p[0]).sort((a, b) => a.ts - b.ts) as unknown as T[];
      // Real query is "ORDER BY date DESC", same reasoning as evidence above.
      if (sql.includes("FROM money")) return [...money].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0)) as unknown as T[];
      // Real query is "ORDER BY date DESC LIMIT ?" — sort then slice to match.
      if (sql.includes("FROM sleep_log")) {
        const sorted = [...sleepLog].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
        return (p[0] != null ? sorted.slice(0, p[0]) : sorted) as unknown as T[];
      }
      // Real query is "ORDER BY date DESC".
      if (sql.includes("FROM notes")) return [...notes].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0)) as unknown as T[];
      // Real query is "ORDER BY rowid" — insertion order already matches.
      if (sql.includes("FROM inbox")) return inbox as unknown as T[];
      return [];
    },
    async runAsync(sql: string, params: unknown = []): Promise<any> {
      const p = params as any[];
      // NB: "UPDATE bearcat" alone used to be the match here, which would have
      // silently swallowed the more specific bearcat updates added below
      // (scene purchases/equips) since if/else-if checks top to bottom and
      // this was first. Narrowed to the literal berries-delta query it's
      // actually meant for.
      if (sql.startsWith("UPDATE bearcat SET berries = berries + ?")) bearcat.berries += p[0];
      else if (sql.startsWith("UPDATE bearcat SET berries = berries - ?")) {
        bearcat.berries -= p[0];
        bearcat.owned_scenes = p[1];
        bearcat.scene = p[2];
      } else if (sql.startsWith("UPDATE bearcat SET scene = ?")) bearcat.scene = p[0];
      else if (sql.startsWith("UPDATE bearcat SET name = ?")) bearcat.name = p[0];
      else if (sql.startsWith("INSERT INTO intentions")) intentions.set(p[0], p[1]);
      else if (sql.startsWith("INSERT INTO moods")) moods.set(p[0], p[1]);
      else if (sql.startsWith("INSERT INTO mood_log")) {
        const [id, date, value, ts] = p;
        moodLog.push({ id, date, value, ts });
      }
      else if (sql.startsWith("INSERT INTO wins")) wins.set(p[0], p[1]);
      else if (sql.startsWith("INSERT INTO priorities")) priorities.push({ id: p[0], date: p[1], text: p[2], done: 0 });
      else if (sql.startsWith("UPDATE priorities")) {
        const row = priorities.find((r) => r.id === p[1]);
        if (row) row.done = p[0];
      } else if (sql.startsWith("INSERT INTO habits")) {
        const [id, name, emoji, target] = p;
        habits.push({ id, name, emoji, target });
      } else if (sql.startsWith("DELETE FROM habit_log")) {
        const idx = habitLog.findIndex((r) => r.habit_id === p[0] && r.date === p[1]);
        if (idx !== -1) habitLog.splice(idx, 1);
      } else if (sql.startsWith("INSERT INTO habit_log")) {
        const [habitId, date, status] = p;
        const existing = habitLog.find((r) => r.habit_id === habitId && r.date === date);
        if (existing) existing.status = status;
        else habitLog.push({ habit_id: habitId, date, status });
      } else if (sql.startsWith("INSERT INTO sessions")) {
        const [, , kind, minutes] = p;
        sessions.push({ kind, minutes });
      } else if (sql.startsWith("INSERT INTO quests")) {
        const [id, name] = p;
        quests.push({ id, name, intention: "", pinned: 0, resting: 0, moves: 0 });
      } else if (sql.startsWith("DELETE FROM quests WHERE id = ?")) {
        const idx = quests.findIndex((r) => r.id === p[0]);
        if (idx !== -1) quests.splice(idx, 1);
      } else if (sql.startsWith("DELETE FROM milestones WHERE quest_id = ?")) {
        for (let i = milestones.length - 1; i >= 0; i--) {
          if (milestones[i].quest_id === p[0]) milestones.splice(i, 1);
        }
      } else if (sql.startsWith("DELETE FROM evidence WHERE quest_id = ?")) {
        for (let i = evidence.length - 1; i >= 0; i--) {
          if (evidence[i].quest_id === p[0]) evidence.splice(i, 1);
        }
      } else if (sql.startsWith("UPDATE quests SET pinned = 0")) {
        quests.forEach((q) => (q.pinned = 0));
      } else if (sql.startsWith("UPDATE quests SET pinned = 1 WHERE id = ?")) {
        const q = quests.find((r) => r.id === p[0]);
        if (q) q.pinned = 1;
      } else if (sql.startsWith("UPDATE quests SET resting = ? WHERE id = ?")) {
        const q = quests.find((r) => r.id === p[1]);
        if (q) q.resting = p[0];
      } else if (sql.startsWith("UPDATE quests SET intention = ? WHERE id = ?")) {
        const q = quests.find((r) => r.id === p[1]);
        if (q) q.intention = p[0];
      } else if (sql.startsWith("UPDATE quests SET moves = moves + ? WHERE id = ?")) {
        const q = quests.find((r) => r.id === p[1]);
        if (q) q.moves += p[0];
      } else if (sql.startsWith("INSERT INTO milestones")) {
        const [id, questId, text, sortOrder] = p;
        milestones.push({ id, quest_id: questId, text, done: 0, sort_order: sortOrder });
      } else if (sql.startsWith("UPDATE milestones SET done = ? WHERE id = ?")) {
        const m = milestones.find((r) => r.id === p[1]);
        if (m) m.done = p[0];
      } else if (sql.startsWith("INSERT INTO evidence")) {
        const [id, questId, date, text] = p;
        evidence.push({ id, quest_id: questId, date, text });
      } else if (sql.startsWith("INSERT INTO money")) {
        const [id, date, amount, dir, category] = p;
        money.push({ id, date, amount, dir, category });
      } else if (sql.startsWith("INSERT INTO sleep_log")) {
        const [id, date, hours, quality] = p;
        sleepLog.push({ id, date, hours, quality });
      } else if (sql.startsWith("INSERT INTO notes")) {
        const [id, date, text] = p;
        notes.push({ id, date, text });
      } else if (sql.startsWith("INSERT INTO reflections")) {
        const [weekKey, proud, learned, next] = p;
        reflections.set(weekKey, { week_key: weekKey, proud, learned, next });
      } else if (sql.startsWith("INSERT INTO inbox")) {
        const [id, text] = p;
        inbox.push({ id, text });
      } else if (sql.startsWith("DELETE FROM inbox")) {
        const idx = inbox.findIndex((r) => r.id === p[0]);
        if (idx !== -1) inbox.splice(idx, 1);
      }
      // workouts inserts: still a no-op — nothing in this file reads workouts
      // back yet (the Me screen's Health widget is a separate HealthKit read,
      // not this table); addWorkout()'s berries grant still works since it's
      // a separate runAsync call to the (now-specific) bearcat berries branch.
      return undefined as any;
    },
  };
}

let dbPromise: Promise<Db> | null = null;

export function getDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = (async () => {
      if (Platform.OS === "web") return createWebStore();
      const SQLite = require("expo-sqlite") as typeof import("expo-sqlite");
      const db = await SQLite.openDatabaseAsync("bearcat-planner.db");
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
}

export type BearcatRow = {
  name: string;
  berries: number;
  scene: string | null;
  owned_scenes: string;
};

export type HabitRow = { id: string; name: string; emoji: string; target: number };
export type HabitLogRow = { habit_id: string; date: string; status: "done" | "cozy" };
export type PriorityRow = { id: string; date: string; text: string; done: number };
export type QuestRow = { id: string; name: string; intention: string; pinned: number; resting: number; moves: number };
export type MilestoneRow = { id: string; quest_id: string; text: string; done: number; sort_order: number };
export type EvidenceRow = { id: string; quest_id: string; date: string; text: string };
export type MoneyRow = { id: string; date: string; amount: number; dir: "in" | "out"; category: string };
export type MoodRow = { date: string; value: number };
export type MoodLogRow = { id: string; date: string; value: number; ts: number };
export type SleepRow = { id: string; date: string; hours: number; quality: "rough" | "okay" | "good" };
export type NoteRow = { id: string; date: string; text: string };
export type ReflectionRow = { week_key: string; proud: string; learned: string; next: string };
export type InboxRow = { id: string; text: string };

export async function getBearcat(): Promise<BearcatRow> {
  const db = await getDb();
  const row = await db.getFirstAsync<BearcatRow>("SELECT name, berries, scene, owned_scenes FROM bearcat WHERE id = 1");
  return row ?? { name: "Mochi", berries: 12, scene: null, owned_scenes: "[]" };
}

export async function addBerries(n: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE bearcat SET berries = berries + ? WHERE id = 1", [n]);
}

export async function setBearcatName(name: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE bearcat SET name = ? WHERE id = 1", [name]);
}

export async function getIntention(date: string): Promise<string> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ text: string }>("SELECT text FROM intentions WHERE date = ?", [date]);
  return row?.text ?? "";
}

export async function setIntention(date: string, text: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO intentions (date, text) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET text = excluded.text",
    [date, text]
  );
}

export async function getMood(date: string): Promise<number | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: number }>("SELECT value FROM moods WHERE date = ?", [date]);
  return row?.value ?? null;
}

export async function setMood(date: string, value: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO moods (date, value) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET value = excluded.value",
    [date, value]
  );
}

export async function getMoodLog(date: string): Promise<MoodLogRow[]> {
  const db = await getDb();
  return db.getAllAsync<MoodLogRow>("SELECT * FROM mood_log WHERE date = ? ORDER BY ts", [date]);
}

// Logs one check-in (mood can now be recorded as many times a day as the
// user likes, not just once) and rolls the day's weighted average back into
// `moods` — the single-value-per-day summary every other screen (Mochi's
// pose, the year-in-pixels grid, Money's mood-vs-spend insight) already
// reads, via the same moodDayStats() math the Today screen uses to show the
// running percentage. Keeps every other consumer of getMood/getAllMoods
// working unchanged.
export async function addMoodCheckIn(id: string, date: string, value: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("INSERT INTO mood_log (id, date, value, ts) VALUES (?, ?, ?, ?)", [id, date, value, Date.now()]);
  const entries = await getMoodLog(date);
  const stats = moodDayStats(entries.map((e) => e.value))!;
  await setMood(date, stats.dayValue);
}

export async function getWin(date: string): Promise<string> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ text: string }>("SELECT text FROM wins WHERE date = ?", [date]);
  return row?.text ?? "";
}

export async function setWin(date: string, text: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO wins (date, text) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET text = excluded.text",
    [date, text]
  );
}

export async function getPriorities(date: string): Promise<PriorityRow[]> {
  const db = await getDb();
  return db.getAllAsync<PriorityRow>("SELECT * FROM priorities WHERE date = ? ORDER BY rowid", [date]);
}

export async function addPriority(id: string, date: string, text: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("INSERT INTO priorities (id, date, text, done) VALUES (?, ?, ?, 0)", [id, date, text]);
}

export async function togglePriority(id: string, done: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE priorities SET done = ? WHERE id = ?", [done ? 1 : 0, id]);
}

export async function getHabits(): Promise<HabitRow[]> {
  const db = await getDb();
  return db.getAllAsync<HabitRow>("SELECT * FROM habits ORDER BY rowid");
}

export async function getHabitLogForRange(startDate: string, endDate: string): Promise<HabitLogRow[]> {
  const db = await getDb();
  return db.getAllAsync<HabitLogRow>("SELECT * FROM habit_log WHERE date >= ? AND date <= ?", [startDate, endDate]);
}

export async function addHabit(id: string, name: string, emoji: string, target: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("INSERT INTO habits (id, name, emoji, target) VALUES (?, ?, ?, ?)", [id, name, emoji, target]);
}

export async function setHabitLog(habitId: string, date: string, status: "done" | "cozy" | null): Promise<void> {
  const db = await getDb();
  if (status === null) {
    await db.runAsync("DELETE FROM habit_log WHERE habit_id = ? AND date = ?", [habitId, date]);
  } else {
    await db.runAsync(
      "INSERT INTO habit_log (habit_id, date, status) VALUES (?, ?, ?) ON CONFLICT(habit_id, date) DO UPDATE SET status = excluded.status",
      [habitId, date, status]
    );
  }
}

// Berries live inside these two functions rather than at each call site —
// there wasn't a call site at all yet (Phase 2's "as it happens" quick-log
// row, which is where the spec's TimerSheet/WorkoutSheet berries() calls
// live in the reference, hasn't been built). Wiring it here means whichever
// screen calls addWorkout/addSession next (the eventual quick-log sheets,
// or Me's manual entries) gets the berries grant for free, matching the
// spec's table (workout +5, focus/meditation session +5) without every
// future caller needing to remember it.
export async function addWorkout(id: string, date: string, type: string, minutes: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("INSERT INTO workouts (id, date, type, minutes) VALUES (?, ?, ?, ?)", [id, date, type, minutes]);
  await addBerries(5);
}

// Sleep log intentionally does NOT grant berries — the spec's berries table
// (reference/claude_code_prompt.md, "Berries and scenes") lists habit/cozy/
// mood/win/focus-or-meditation/workout/milestone only; a manual sleep entry
// isn't on it, in either the spec or the reference prototype (which has no
// sleep-log UI at all, only a HealthKit-style paste import for workouts).
export async function addSleep(id: string, date: string, hours: number, quality: "rough" | "okay" | "good"): Promise<void> {
  const db = await getDb();
  await db.runAsync("INSERT INTO sleep_log (id, date, hours, quality) VALUES (?, ?, ?, ?)", [id, date, hours, quality]);
}

export async function addSession(id: string, date: string, kind: "focus" | "meditate", minutes: number, tag: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync("INSERT INTO sessions (id, date, kind, minutes, tag) VALUES (?, ?, ?, ?, ?)", [id, date, kind, minutes, tag]);
  await addBerries(5);
}

export async function getRecentSleep(limit: number): Promise<SleepRow[]> {
  const db = await getDb();
  return db.getAllAsync<SleepRow>("SELECT * FROM sleep_log ORDER BY date DESC LIMIT ?", [limit]);
}

export async function getMinutesByKind(kind: "focus" | "meditate"): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number | null }>(
    "SELECT SUM(minutes) as total FROM sessions WHERE kind = ?",
    [kind]
  );
  return row?.total ?? 0;
}

export async function getQuests(): Promise<QuestRow[]> {
  const db = await getDb();
  return db.getAllAsync<QuestRow>("SELECT * FROM quests ORDER BY rowid");
}

export async function addQuest(id: string, name: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("INSERT INTO quests (id, name, intention, pinned, resting, moves) VALUES (?, ?, '', 0, 0, 0)", [id, name]);
}

export async function removeQuest(id: string): Promise<void> {
  const db = await getDb();
  // No FK cascade in schema.ts, so children are deleted explicitly.
  await db.runAsync("DELETE FROM evidence WHERE quest_id = ?", [id]);
  await db.runAsync("DELETE FROM milestones WHERE quest_id = ?", [id]);
  await db.runAsync("DELETE FROM quests WHERE id = ?", [id]);
}

export async function pinQuest(id: string): Promise<void> {
  const db = await getDb();
  // Only one quest can be pinned at a time (mirrors the reference prototype).
  await db.runAsync("UPDATE quests SET pinned = 0");
  await db.runAsync("UPDATE quests SET pinned = 1 WHERE id = ?", [id]);
}

export async function setQuestResting(id: string, resting: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE quests SET resting = ? WHERE id = ?", [resting ? 1 : 0, id]);
}

export async function setQuestIntention(id: string, text: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE quests SET intention = ? WHERE id = ?", [text, id]);
}

export async function adjustQuestMoves(id: string, delta: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE quests SET moves = moves + ? WHERE id = ?", [delta, id]);
}

export async function getAllMilestones(): Promise<MilestoneRow[]> {
  const db = await getDb();
  return db.getAllAsync<MilestoneRow>("SELECT * FROM milestones ORDER BY sort_order");
}

export async function addMilestone(id: string, questId: string, text: string, sortOrder: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("INSERT INTO milestones (id, quest_id, text, done, sort_order) VALUES (?, ?, ?, 0, ?)", [id, questId, text, sortOrder]);
}

export async function setMilestoneDone(id: string, done: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE milestones SET done = ? WHERE id = ?", [done ? 1 : 0, id]);
}

export async function getAllEvidence(): Promise<EvidenceRow[]> {
  const db = await getDb();
  return db.getAllAsync<EvidenceRow>("SELECT * FROM evidence ORDER BY date DESC");
}

export async function addEvidence(id: string, questId: string, date: string, text: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("INSERT INTO evidence (id, quest_id, date, text) VALUES (?, ?, ?, ?)", [id, questId, date, text]);
}

// ---- Money ----

export async function getAllMoney(): Promise<MoneyRow[]> {
  const db = await getDb();
  return db.getAllAsync<MoneyRow>("SELECT * FROM money ORDER BY date DESC");
}

export async function addMoney(id: string, date: string, amount: number, dir: "in" | "out", category: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("INSERT INTO money (id, date, amount, dir, category) VALUES (?, ?, ?, ?, ?)", [id, date, amount, dir, category]);
}

// ---- Moods (full range, for the year-in-pixels grid and the money screen's
// low-mood-vs-good-day insight — getMood/setMood above only ever handle a
// single date) ----

export async function getAllMoods(): Promise<MoodRow[]> {
  const db = await getDb();
  return db.getAllAsync<MoodRow>("SELECT * FROM moods");
}

// ---- Notes journal ----

export async function getNotes(): Promise<NoteRow[]> {
  const db = await getDb();
  return db.getAllAsync<NoteRow>("SELECT * FROM notes ORDER BY date DESC");
}

export async function addNote(id: string, date: string, text: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("INSERT INTO notes (id, date, text) VALUES (?, ?, ?)", [id, date, text]);
}

// ---- Sunday reflection ----
// Whole-row upsert (not a per-field one like setIntention/setMood/setWin)
// because the screen reads the current week's row, merges the edited field
// in JS, then writes all three back — the same shape as the reference
// prototype's setRefl, and it avoids interpolating a column name into SQL.

export async function getReflection(weekKey: string): Promise<ReflectionRow> {
  const db = await getDb();
  const row = await db.getFirstAsync<ReflectionRow>("SELECT * FROM reflections WHERE week_key = ?", [weekKey]);
  return row ?? { week_key: weekKey, proud: "", learned: "", next: "" };
}

export async function setReflection(weekKey: string, proud: string, learned: string, next: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO reflections (week_key, proud, learned, next) VALUES (?, ?, ?, ?)
     ON CONFLICT(week_key) DO UPDATE SET proud = excluded.proud, learned = excluded.learned, next = excluded.next`,
    [weekKey, proud, learned, next]
  );
}

// ---- Mochi's scene shop ----

export async function buyScene(id: string, cost: number): Promise<boolean> {
  const db = await getDb();
  const bc = await getBearcat();
  if (bc.berries < cost) return false;
  const owned: string[] = JSON.parse(bc.owned_scenes || "[]");
  if (!owned.includes(id)) owned.push(id);
  await db.runAsync(
    "UPDATE bearcat SET berries = berries - ?, owned_scenes = ?, scene = ? WHERE id = 1",
    [cost, JSON.stringify(owned), id]
  );
  return true;
}

// Equip/unequip a scene already owned (id === null clears the backdrop).
export async function setScene(id: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE bearcat SET scene = ? WHERE id = 1", [id]);
}

// ---- Brain dump inbox (Today's "Dump" quick-log sheet) ----
// No berries — parking a thought isn't an action worth rewarding, it's
// just getting it out of the way so "three things, at most" stays honest.

export async function getInbox(): Promise<InboxRow[]> {
  const db = await getDb();
  return db.getAllAsync<InboxRow>("SELECT * FROM inbox ORDER BY rowid");
}

export async function addInboxItem(id: string, text: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("INSERT INTO inbox (id, text) VALUES (?, ?)", [id, text]);
}

export async function removeInboxItem(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM inbox WHERE id = ?", [id]);
}
