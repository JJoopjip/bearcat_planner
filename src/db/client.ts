import { Platform } from "react-native";
import type { SQLiteDatabase } from "expo-sqlite";
import { migrate } from "./schema";

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

  return {
    async getFirstAsync<T>(sql: string, params: unknown = []): Promise<T | null> {
      const p = params as any[];
      if (sql.includes("FROM bearcat")) return { ...bearcat } as unknown as T;
      if (sql.includes("FROM intentions")) return (intentions.has(p[0]) ? { text: intentions.get(p[0]) } : null) as T | null;
      if (sql.includes("FROM moods")) return (moods.has(p[0]) ? { value: moods.get(p[0]) } : null) as T | null;
      if (sql.includes("FROM wins")) return (wins.has(p[0]) ? { text: wins.get(p[0]) } : null) as T | null;
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
      if (sql.includes("FROM evidence")) return evidence as unknown as T[];
      return [];
    },
    async runAsync(sql: string, params: unknown = []): Promise<any> {
      const p = params as any[];
      if (sql.startsWith("UPDATE bearcat")) bearcat.berries += p[0];
      else if (sql.startsWith("INSERT INTO intentions")) intentions.set(p[0], p[1]);
      else if (sql.startsWith("INSERT INTO moods")) moods.set(p[0], p[1]);
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
      }
      // workouts / sleep_log inserts: no-op — nothing in this file reads them back yet
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

export async function getBearcat(): Promise<BearcatRow> {
  const db = await getDb();
  const row = await db.getFirstAsync<BearcatRow>("SELECT name, berries, scene, owned_scenes FROM bearcat WHERE id = 1");
  return row ?? { name: "Mochi", berries: 12, scene: null, owned_scenes: "[]" };
}

export async function addBerries(n: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE bearcat SET berries = berries + ? WHERE id = 1", [n]);
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

export async function addWorkout(id: string, date: string, type: string, minutes: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("INSERT INTO workouts (id, date, type, minutes) VALUES (?, ?, ?, ?)", [id, date, type, minutes]);
}

export async function addSleep(id: string, date: string, hours: number, quality: "rough" | "okay" | "good"): Promise<void> {
  const db = await getDb();
  await db.runAsync("INSERT INTO sleep_log (id, date, hours, quality) VALUES (?, ?, ?, ?)", [id, date, hours, quality]);
}

export async function addSession(id: string, date: string, kind: "focus" | "meditate", minutes: number, tag: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync("INSERT INTO sessions (id, date, kind, minutes, tag) VALUES (?, ?, ?, ?, ?)", [id, date, kind, minutes, tag]);
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
