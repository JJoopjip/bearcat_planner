import type { SQLiteDatabase } from "expo-sqlite";

// Full data model for the app, created up front even though not every
// screen reads/writes every table yet (Habits/Quests/Money land next phase).
export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS bearcat (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL DEFAULT 'Mochi',
      berries INTEGER NOT NULL DEFAULT 12,
      scene TEXT,
      owned_scenes TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS intentions (
      date TEXT PRIMARY KEY,
      text TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS priorities (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      text TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_priorities_date ON priorities(date);

    CREATE TABLE IF NOT EXISTS moods (
      date TEXT PRIMARY KEY,
      value INTEGER NOT NULL
    );

    -- Every individual mood check-in (multiple per day allowed). moods.value
    -- above stays the single per-day summary every other screen already
    -- reads (Mochi's pose, the year-in-pixels grid, Money's insight) — it's
    -- recomputed as the weighted average of the day's mood_log rows each
    -- time a new check-in comes in, see addMoodCheckIn() in client.ts.
    CREATE TABLE IF NOT EXISTS mood_log (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      value INTEGER NOT NULL,
      ts INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_mood_log_date ON mood_log(date);

    CREATE TABLE IF NOT EXISTS wins (
      date TEXT PRIMARY KEY,
      text TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      target INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS habit_log (
      habit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('done', 'cozy')),
      PRIMARY KEY (habit_id, date)
    );

    CREATE TABLE IF NOT EXISTS quests (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      intention TEXT NOT NULL DEFAULT '',
      pinned INTEGER NOT NULL DEFAULT 0,
      resting INTEGER NOT NULL DEFAULT 0,
      moves INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      quest_id TEXT NOT NULL,
      text TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_milestones_quest ON milestones(quest_id);

    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      quest_id TEXT NOT NULL,
      date TEXT NOT NULL,
      text TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_evidence_quest ON evidence(quest_id);

    CREATE TABLE IF NOT EXISTS money (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      dir TEXT NOT NULL CHECK (dir IN ('in', 'out')),
      category TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_money_date ON money(date);

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('focus', 'meditate')),
      minutes INTEGER NOT NULL,
      tag TEXT
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      minutes INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sleep_log (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      hours REAL NOT NULL,
      quality TEXT NOT NULL CHECK (quality IN ('rough', 'okay', 'good'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      text TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inbox (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reflections (
      week_key TEXT PRIMARY KEY,
      proud TEXT NOT NULL DEFAULT '',
      learned TEXT NOT NULL DEFAULT '',
      next TEXT NOT NULL DEFAULT ''
    );
  `);

  const bearcat = await db.getFirstAsync<{ id: number }>("SELECT id FROM bearcat WHERE id = 1");
  if (!bearcat) {
    await db.runAsync("INSERT INTO bearcat (id, name, berries, scene, owned_scenes) VALUES (1, 'Mochi', 12, NULL, '[]')");
  }

  const habitCount = await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) as n FROM habits");
  if (habitCount?.n === 0) {
    const seedHabits: [string, string, string, number][] = [
      ["h1", "Meditate", "\u{1F9D8}", 5],
      ["h2", "Workout", "\u{1F3C3}", 4],
      ["h3", "Read", "\u{1F4D6}", 4],
      ["h4", "Walk outside", "\u{1F33F}", 5],
    ];
    for (const [id, name, emoji, target] of seedHabits) {
      await db.runAsync("INSERT INTO habits (id, name, emoji, target) VALUES (?, ?, ?, ?)", [id, name, emoji, target]);
    }
  }

  const questCount = await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) as n FROM quests");
  if (questCount?.n === 0) {
    await db.runAsync(
      "INSERT INTO quests (id, name, intention, pinned, resting, moves) VALUES (?, ?, ?, 1, 0, 0)",
      ["q1", "Find a role I'm excited about", "I'm someone who reaches out before I feel ready."]
    );
    const seedMilestones: [string, string, number][] = [
      ["m1", "Refresh my resume", 0],
      ["m2", "Reach out to 5 people", 1],
      ["m3", "Tailor 3 applications", 2],
      ["m4", "Have 2 real conversations", 3],
    ];
    for (const [id, text, order] of seedMilestones) {
      await db.runAsync("INSERT INTO milestones (id, quest_id, text, done, sort_order) VALUES (?, 'q1', ?, 0, ?)", [id, text, order]);
    }
  }
}
