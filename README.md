# Bearcat Planner

A gentle daily planner: habits, quests, mood, money, focus — and Mochi, a pink
bearcat who reads your week, never your day, and never guilt-trips you.

This is the real Expo/iOS app. See `bearcat_planner.jsx` and the web demo
artifact for the interaction reference; this project ports that faithfully
to native, backed by on-device SQLite, with real Apple Health widgets
(steps, heart rate, workouts, sleep).

## One-time setup (do this once, in order)

1. **Expo account** — free, at [expo.dev](https://expo.dev).
2. **Apple Developer Program** — $99/year, at
   [developer.apple.com](https://developer.apple.com). Required by Apple for
   the HealthKit entitlement and for installing a non-App-Store build on
   your phone. There's no way around this cost for real Health data.
3. Push this repo to GitHub (`git remote add origin <your-repo-url>` then
   `git push -u origin main`).
4. Create an Expo access token at
   [expo.dev/settings/access-tokens](https://expo.dev/accounts/[your-account]/settings/access-tokens),
   then add it to this repo as a GitHub Actions secret named `EXPO_TOKEN`
   (repo Settings → Secrets and variables → Actions → New repository secret).
5. Locally (on any machine with Node.js — not required to be this one),
   run once to link the project and Apple credentials interactively:
   ```
   npm install -g eas-cli
   eas login
   eas build:configure
   eas credentials   # walk through Apple sign-in, EAS will create the
                      # HealthKit-enabled provisioning profile for you
   ```
   This step needs to happen interactively once so EAS can store your Apple
   signing credentials — after that, GitHub Actions can build headlessly.
6. This repo has no `package-lock.json` yet — it was scaffolded without
   Node.js available to generate one. Step 5's `npm install` (or CI's) will
   create it; commit it afterward so builds become reproducible (`npm ci`).

## Building

Every push to `main` triggers `.github/workflows/eas-build.yml`, which runs
on GitHub's own Node-equipped runners and kicks off a cloud build via EAS —
no local Node.js or Xcode needed. You can also trigger a build manually from
the GitHub Actions tab ("Run workflow") and pick a profile.

Builds land in your [Expo dashboard](https://expo.dev), where you install
the `preview` profile straight to your phone (internal distribution, no
TestFlight review needed) or submit `production` to the App Store.

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
