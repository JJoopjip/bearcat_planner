# TASKS.md

Backlog, organized by the phase plan in `reference/claude_code_prompt.md`.
Check items off as they're verified working, not just written — see
`SESSION_HANDOFF.md` for the distinction between "coded" and "confirmed."

## Phase 1 — Project setup ✅ done

- [x] Expo/TypeScript project scaffolded, `expo-router` tab navigation
- [x] SQLite schema for the full data model (`src/db/schema.ts`)
- [x] Mochi component: all 16 poses, backdrop tints, per-pose motion,
      growth-stage halo/orbit, reduce-motion support
- [ ] **Not done**: the Phase 1 spec also asks for a placeholder screen
      with buttons to switch through every pose, specifically so poses can
      be checked before building on top of them. This was skipped in favor
      of moving straight to Phase 2. Consider adding it retroactively if a
      pose ever looks wrong on-device — it's cheap and was cut for time,
      not because it's a bad idea.

## Phase 2 — Today screen — partially done

- [x] Daily core: intention, mood check-in (sticker buttons), 3 priorities,
      habit chips (done/cozy), one small win — all persisted to SQLite
- [x] Pose-selection precedence logic (`src/lib/mood.ts`)
- [ ] **"As it happens" quick-log row is NOT built yet.** The spec calls
      for a horizontal row of sticker buttons (Focus / Breathe / Workout /
      Money / Dump) opening bottom sheets — focus+meditation timer,
      workout log, money entry, brain-dump inbox, and the sleep-log tab
      folded into the Breathe sheet. None of this exists in
      `app/(tabs)/index.tsx` yet. The web demo (see
      `SESSION_HANDOFF.md` for its URL) has this fully built and validated
      in JS — port its interaction logic, don't redesign it.
- [ ] `src/db/client.ts` has no read/write functions yet for: money,
      sessions (partially — `addSession`/`getMinutesByKind` exist but no
      list reader), sleep_log (write-only, no reads), notes, inbox,
      reflections. Add these alongside the sheets that need them.

## Phase 3 — Habits screen — not started

`app/(tabs)/habits.tsx` is a placeholder. Needs: one card per habit
(emoji, name, "N of M this week", week-streak badge via decaying-streak
logic, 7-square backfillable week grid), add-habit form with 1–7 target
slider, nudge toward 4–5 habits max. The web demo's `HabitsScreen` and
`streakOf()` have this validated already — port, don't redesign.

## Phase 4 — Quests screen — not started

`app/(tabs)/quests.tsx` is a placeholder. Needs: quest cards with
intention card, milestones, moves-made counter, evidence log, pin/rest
toggle, and the winding-path SVG visualization with Mochi (`happy` pose)
at the furthest milestone reached. `milestones` and `evidence` tables
already exist in the schema; `quests` table exists but `client.ts` has no
CRUD for any of the three yet.

## Phase 5 — Money and Me screens — Me partially done

- [x] Me: Health widgets (steps, heart rate, exercise, sleep) via
      HealthKit, "Time you've given yourself" focus/breathing minutes
- [ ] Me is missing, vs. the web demo: year-in-pixels mood grid, the
      manual Sleep card (7-night average from `sleep_log`, distinct from
      the Health widget's live HealthKit reading — the app supports both a
      manual log and an automatic HealthKit source), Notes journal card,
      Sunday reflection, Mochi's scene shop (spend berries on backdrops)
- [ ] Money screen (`app/(tabs)/money.tsx`) is a placeholder. Needs: period
      selector, in/out/kept totals, category bars, the
      low-mood-vs-good-day spend insight
- [ ] Berries economy isn't wired up for most actions yet — `addBerries`
      exists and Today's mood/win/habit actions call it, but quest
      milestones, workouts, sleep logs, and focus/meditation sessions
      don't grant berries natively yet (the web demo's berries table is
      the reference for exact amounts)

## Phase 6 — Notifications — not started

One gentle evening check-in, opt-in, no guilt language, no streak
mentions. Not started; low priority until earlier phases are solid.

## Cross-cutting / infrastructure

- [ ] **Nothing in this repo has been run.** No Node.js has been available
      in any session that's touched it so far, so there's no
      `package-lock.json`, and `tsc`/`expo start` have never actually been
      run against this code. Treat all of the above as "should compile"
      rather than "verified" until someone runs it (GitHub Codespaces is
      the known-free way to get Node — see README). This is the single
      highest-value next step regardless of which feature phase is next:
      catching type errors and typos before building more on top of them.
- [ ] EAS Build / Apple Developer Program setup is deliberately deferred
      (costs money) — see README's one-time setup section. The GitHub
      Actions workflow is manual-trigger-only (`workflow_dispatch`) so it
      doesn't fail automatically on every push in the meantime.
- [ ] Add a `.github/workflows/` CI job that at least runs `tsc --noEmit`
      on push (free, doesn't need EAS/Apple) once a `package-lock.json`
      exists — would have caught issues far earlier than "someone runs it
      on a device."
