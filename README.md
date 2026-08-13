# Bearcat Planner

A gentle daily planner: habits, quests, mood, money, focus — and Mochi, a pink
bearcat who reads your week, never your day, and never guilt-trips you.

This is the real Expo/iOS app. See `bearcat_planner.jsx` and the web demo
artifact for the interaction reference; this project ports that faithfully
to native, backed by on-device SQLite, with real Apple Health widgets
(steps, heart rate, workouts, sleep).

## Running it on your phone (no Expo Go)

This project deliberately does not use Expo Go for trying the app — instead
it's built as a standalone app via Expo's **prebuild** (bare workflow), run
straight through Xcode. You need a Mac with Xcode installed.

1. Install dependencies: `npm install` (creates `package-lock.json` the
   first time, since this repo was scaffolded without Node.js available).
2. Generate the native project: `npx expo prebuild -p ios`. This creates an
   `ios/` folder with a real Xcode project — commit it or regenerate it as
   needed, it's derived from `app.json` and the Expo plugins already
   configured there.
3. Connect your iPhone via USB (or use a paired Wi-Fi connection in Xcode),
   then run: `npx expo run:ios --device`. Xcode will prompt you to sign in
   with your Apple ID the first time; a free Apple ID is enough to install
   and run on your own device for 7 days (Xcode re-signs it automatically
   each time you rebuild, no App Store review, no cost).
4. The app installs and launches directly on your phone — this includes the
   Apple Health widgets (steps, heart rate, workouts, sleep), since
   `react-native-health` is a native module that only works in this kind of
   build, never under Expo Go.

A paid Apple Developer Program membership ($99/yr) is only needed later, if
you want to distribute the app beyond your own device (TestFlight, App
Store, or EAS cloud builds for other testers) — not for trying it yourself
on your own phone via a cable.

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
