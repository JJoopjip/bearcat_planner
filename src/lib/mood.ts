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
