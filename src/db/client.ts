import * as SQLite from "expo-sqlite";
import { migrate } from "./schema";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
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
