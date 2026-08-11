# Bearcat Planner

A gentle daily planner: habits, quests, mood, money, focus — and Mochi, a pink
bearcat who reads your week, never your day, and never guilt-trips you.

This is the real Expo/iOS app. See `bearcat_planner.jsx` and the web demo
artifact for the interaction reference; this project ports that faithfully
to native, backed by on-device SQLite, with real Apple Health widgets
(steps, heart rate, workouts, sleep).

## Running it locally (free, no build, no account)

1. Install dependencies: `npm install` (creates `package-lock.json` the
   first time, since this repo was scaffolded without Node.js available).
2. Start the dev server: `npx expo start`.
3. Install the **Expo Go** app (free, App Store / Play Store) on your phone,
   then scan the QR code from the terminal/browser to open the app.

This is entirely free and needs no Expo account, no Apple Developer
Program, and no GitHub Actions — it's the fastest way to try the app on a
real device.

**Caveat:** the Apple Health widgets (steps, heart rate, workouts, sleep)
use `react-native-health`, a native module Expo Go can't load, so that one
screen won't work under Expo Go. Everything else runs normally. Real Health
data requires a custom dev-client build via EAS, which needs a paid Apple
Developer Program ($99/yr) — that's a later step, not needed to try the
rest of the app now.

## Project layout

```
app/                 expo-router screens (file-based routing)
  (tabs)/            the five tab screens
src/
  components/        Mochi and shared UI
  db/                SQLite schema + client
  lib/                dates, berries, mood precedence, Health bridge
  theme/              design tokens
assets/mochi/        the 16 mascot PNGs — never edit or regenerate these
```

## What's built so far

- Project setup, SQLite schema, tab navigation
- Mochi component: all 16 poses, backdrop tints, per-pose motion, growth
  stages, the full precedence table from the spec
- Today screen: complete daily core with persistence
- Health widgets on the Me screen: steps, heart rate, workouts, sleep,
  read-only from Apple Health

Habits, Quests, and Money screens are stubbed as "coming next" placeholders
for now — the interaction design for all three already exists validated in
the web demo; next phase ports them to native.
