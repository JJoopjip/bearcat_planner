# CLAUDE.md

Guidance for any Claude Code agent (or human) picking up work in this repo.

## What this is

**Bearcat Planner** — a personal daily planner combining habits, long-term
goals, mood, money and focus time, with a pink bearcat mascot named Mochi
whose pose reflects the time of day and how the week is going. Single user,
Expo/React Native, iOS-only, everything on-device (SQLite, no backend, no
accounts, no sync).

The full product spec is `reference/claude_code_prompt.md` — read it before
making product decisions. `reference/bearcat_planner.jsx` is the original
web prototype and is the visual/interaction reference for layout, palette,
copy tone, and animation; port its feel faithfully, don't reinterpret it.
**Never edit either reference file** — they're the source of truth, not
scratch space.

## Start here

**Before writing any code, read `SESSION_HANDOFF.md`.** It has the current
state, what's done, what's broken, and what to do next. It is more current
than this file for anything about project status.

## Non-negotiable design rules

These matter more than any feature — most habit apps get abandoned in week
three because they punish the user. Do not let these slip:

1. **No daily streaks.** Habits use weekly targets. Streaks count *weeks*.
2. **Streaks decay, never reset.** Miss a week → counter drops by one, never
   to zero.
3. **No red anywhere.** Missed days are a faint dotted outline, never a
   warning colour or a cross.
4. **One "cozy day" per habit per week** — a rest token in muted lilac.
   Deliberate rest must look different from failure.
5. **Mochi is never sad and never guilt-trips.** `sad`/`scared`/`confused`/
   `angry` exist only for the user's own mood check-in (self-report), never
   as feedback on performance. Mochi reads the *week*, not the day, and
   only the daily core — optional modules (money, focus, workouts) never
   affect the mascot's pose.
6. **Progress is measured in actions taken, never outcomes.** Nothing shows
   a completion percentage for something the user doesn't fully control.
7. **Empty states invite, they don't scold.**

## The mascot

Sixteen poses in `assets/mochi/*.png`, 300×300, transparent background,
decorations (Zzz, moon, thought bubbles, etc.) already baked into the
files. **Never draw, generate, recolour, or composite anything onto these
images** — scenes/backdrops go *behind* them (see `Mochi.tsx`'s `scene`
prop), never on them. The precedence logic for Mochi's own pose lives in
`src/lib/mood.ts` (`moodForToday`) — read the comment there before changing
it; it encodes an ordered rule table from the spec, not an arbitrary if/else
chain.

## Stack

Expo SDK 52, expo-router (file-based tabs), expo-sqlite, expo-image,
react-native-reanimated, TypeScript, react-native-health (iOS HealthKit,
steps/heart-rate/workouts/sleep, read-only). See `README.md` for the
one-time Expo/Apple/EAS setup needed to actually build and install this on
a device.

## Repo layout

```
app/(tabs)/       expo-router screens, one file per tab
src/components/   Mochi.tsx and shared UI
src/db/           schema.ts (CREATE TABLE), client.ts (typed queries)
src/lib/          dates, mood/pose precedence, Health bridge
src/theme/        design tokens (colors, mood scale, radius)
assets/mochi/     the 16 mascot PNGs — read-only, see above
reference/        original prototype + full product spec — read-only
```

## Design tokens

Fixed Pantone spec, defined in `src/theme/tokens.ts` — use those constants,
don't hardcode hex values in components. Mood check-in scale (low → high):
`sad → confused → happy → thumbsup → love`. Radius 22px on cards, 99px on
chips.

## Working style

- **Ask before adding a dependency** that isn't already in `package.json`.
- **Don't add features that weren't asked for.** If something looks
  missing, check `SESSION_HANDOFF.md` and `TASKS.md` before assuming it
  needs building — it may be intentionally deferred.
- **Work in phases, stop between them.** Land one coherent slice, update
  the handoff, let it be reviewed before continuing to the next.
- This environment (and possibly yours) has **no Node.js installed** —
  code is written by hand, not validated with `tsc`/`npm install` locally.
  Say so explicitly if you're in the same situation rather than claiming
  something was tested when it wasn't. GitHub Codespaces (has Node
  preinstalled) is the fallback for actually running the app.

## Mandatory hygiene

**Every agent that touches this repo must update `SESSION_HANDOFF.md`
before ending its turn** — what you did, what you verified vs. assumed, and
what the next task should be. This is not optional. A handoff that doesn't
reflect the current state is worse than no handoff, because the next agent
will trust it. If you update `TASKS.md`, keep it in sync with the handoff's
"what's next" pointer.
