export type MochiPose =
  | "angry" | "confused" | "drink" | "exercising" | "happy" | "icecream"
  | "love" | "peeking" | "playing" | "reading" | "sad" | "scared"
  | "sleeping" | "thinking" | "thumbsup" | "waving";

// backdrop tint per pose, from the spec's tint table
export const poseTint: Record<MochiPose, string> = {
  happy: "#FBDCE8",
  love: "#FAD0DE",
  drink: "#EDF0DC",
  waving: "#FAD3E4",
  thumbsup: "#FBE7C4",
  exercising: "#FBDDD2",
  playing: "#FBE0D6",
  sleeping: "#E6DFF3",
  reading: "#E3F0EA",
  thinking: "#FBEFC9",
  peeking: "#FBE4EC",
  sad: "#DCE5F2",
  scared: "#E6E6F2",
  confused: "#EFE7F0",
  icecream: "#FDEFD8",
  angry: "#F3DCE0",
};

export type MochiMotion = "idle" | "rock" | "hop" | "breathe" | "sway" | "settle" | "none";

export const poseMotion: Record<MochiPose, MochiMotion> = {
  happy: "idle",
  love: "idle",
  drink: "idle",
  waving: "rock",
  thumbsup: "hop",
  exercising: "hop",
  playing: "hop",
  sleeping: "breathe",
  reading: "sway",
  thinking: "sway",
  peeking: "settle",
  sad: "idle",
  scared: "idle",
  confused: "idle",
  icecream: "none",
  angry: "none",
};

export type DailyState = {
  todayMood: number | null;
  todayWin: string;
  hasDoneAnyPriority: boolean;
  hasLoggedAnyHabitToday: boolean;
  weekScore: number; // 0..1, fraction of weekly habit targets hit so far
};

/**
 * Mochi's own state, first match wins:
 * sleeping (9pm+, or meditating) > waving (before 11am, nothing logged) >
 * love (core done + week>50%) > thumbsup (week>40%) > happy (default).
 *
 * reading/thinking/playing/peeking are each bound to one specific place in
 * the UI (focus timer, Quests header, Habits header, loading) instead of
 * this general picker — see their call sites.
 */
export function moodForToday(s: DailyState, opts: { meditating?: boolean; hour?: number } = {}): MochiPose {
  const hour = opts.hour ?? new Date().getHours();
  if (hour >= 21 || opts.meditating) return "sleeping";

  const nothingYet = !s.todayMood && !s.hasDoneAnyPriority && !s.hasLoggedAnyHabitToday && !s.todayWin;
  if (hour < 11 && nothingYet) return "waving";

  const coreDone = !!s.todayMood && !!s.todayWin;
  if (coreDone && s.weekScore > 0.5) return "love";
  if (s.weekScore > 0.4) return "thumbsup";
  return "happy";
}

export function stageFromMilestones(milestonesDone: number): 1 | 2 | 3 {
  return Math.min(3, 1 + Math.floor(milestonesDone / 3)) as 1 | 2 | 3;
}

/**
 * Rolls a day's individual mood check-ins (1-5, sad..love) into one
 * weighted percentage and a rounded 1-5 "day value" — each check-in scores
 * 0/25/50/75/100 along the mood scale, and the day is the average of all of
 * them. E.g. four "happy"(50) + one "confused"(25) checks = 45%. Returns
 * null for an empty day so callers can distinguish "no check-ins" from "0%".
 */
export function moodDayStats(values: number[]): { percent: number; dayValue: 1 | 2 | 3 | 4 | 5 } | null {
  if (values.length === 0) return null;
  const avg = values.reduce((sum, v) => sum + (v - 1) * 25, 0) / values.length;
  const dayValue = Math.min(5, Math.max(1, Math.round(avg / 25) + 1)) as 1 | 2 | 3 | 4 | 5;
  return { percent: Math.round(avg), dayValue };
}
