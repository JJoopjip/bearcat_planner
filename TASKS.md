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

## Phase 3 — Habits screen — done (unverified, no Node in this session)

- [x] One card per habit: emoji, name, "N of M this week" (+ "target met"
      note when hit), decaying week-streak badge (`streakOf`, 8-week
      lookback, ported from `reference/bearcat_planner.jsx`'s `Habits`
      component almost verbatim)
- [x] 7-square backfillable week grid per habit (tap cycles
      none → done → cozy (max one cozy/week) → none; future days disabled;
      missed days render as a dotted `pinkPale` outline, never red)
- [x] Add-habit form: emoji picker chips, name input, 1–7 target selector,
      "four or five is plenty" hint + non-blocking nudge text at 5+ habits
- [x] `client.ts` gained `addHabit()`, plus a matching `createWebStore()`
      branch so the GitHub Pages demo can create habits too
- [ ] **Caveat**: the spec says "target slider" — there's no
      `@react-native-community/slider` dependency installed and adding one
      wasn't allowed this session (owner unreachable), so it's a hand-built
      drag/tap track using core `PanResponder` (no new deps), with 1–7 tick
      labels underneath. Behavior should match a slider; untested on
      device/simulator. If the real slider component is later approved,
      swapping it in is a self-contained change inside `TargetSlider` in
      `habits.tsx`.
- [ ] Not run — see Environment constraints, no Node.js this session.
- [x] **QA pass done** (2026-08-13, see `SESSION_HANDOFF.md` and
      `QUALITY_METRICS.md`) — verdict pass, no code changes needed. Logic
      (streak decay math, web-demo parity for `addHabit`, design-rule
      compliance) checked by hand and confirmed correct. Still worth a
      real on-device check later: the hand-built `PanResponder`
      `TargetSlider` and `borderStyle: "dotted"` rendering, since neither
      has ever been visually confirmed on iOS.

## Phase 4 — Quests screen — done (unverified, no Node in this session)

- [x] `app/(tabs)/quests.tsx` built, replacing the placeholder. Ported
      from `reference/bearcat_planner.jsx`'s `Quests`/`QuestPath`/
      `MilestoneAdd` components: quest cards (📌 prefix when pinned,
      "N/M milestones · N moves made · resting" subtitle), present-tense
      intention field (blur-to-save, hint copy verbatim), milestone
      checklist (tap toggles done, moves-made only ever increases on the
      done transition, never decrements on uncheck — matches the
      reference exactly), add-milestone row, evidence log (dated
      one-liners, newest first, empty-state invite copy verbatim: "Proof
      goes here. Start with one line."), add-evidence row, and
      Pin-to-Today / Let it rest footer buttons (pinning is exclusive
      across quests, resting is a toggle, neither awards/removes
      berries). Empty-quests state invites rather than scolds ("No
      quests yet. What's something you're growing toward? Add one below
      — you can always start small."). Berries: milestone +25, evidence
      +3 — both match `reference/claude_code_prompt.md`'s table and the
      prototype's `berries(25, "milestone!")` / `berries(3, "evidence")`
      calls.
- [x] `client.ts` gained full CRUD for quests/milestones/evidence:
      `getQuests`, `addQuest`, `pinQuest` (unpins all others first —
      only one quest can be pinned at a time, matching the reference),
      `setQuestResting`, `setQuestIntention`, `adjustQuestMoves`,
      `getAllMilestones`, `addMilestone`, `setMilestoneDone`,
      `getAllEvidence`, `addEvidence` — plus matching `createWebStore()`
      branches for every one of those queries (in-memory `quests`,
      `milestones`, `evidence` arrays), seeded with the same "q1" quest
      + 4 milestones `schema.ts`'s `migrate()` seeds, so the GitHub Pages
      demo isn't empty on first load.
- [x] **Deliberate substitution, documented in code and here**: no SVG
      library is installed and adding one (`react-native-svg`) wasn't
      approved this session (owner unreachable, same constraint as the
      Habits slider). The winding-path visualization is a hand-built
      `QuestPath` component in `quests.tsx` using only `View`/
      `StyleSheet`/absolute positioning: milestone nodes are placed along
      the *same* sine-wave curve formula as the reference's SVG `path`
      (`y = baseY + sin(t * 1.25) * amplitude`), connected by a trail of
      small dots sampled continuously along that curve (standing in for
      the stroked/dashed SVG path), with Mochi (`happy` pose, `mini`)
      positioned at the furthest milestone reached — same logic as the
      reference's `here = [...pts].reverse().find(p => p.done) ??
      pts[0]`. Visually this should read as "a winding path with a dotted
      trail and stops," not literally curved/smooth like an SVG
      `<path>`, and the exact pixel alignment of Mochi over the furthest
      node is an approximation (`top: here.y - 40`, hand-tuned to roughly
      mirror the reference's `translate(-50%, -88%)`), not something that
      could be verified without running the app. If
      `react-native-svg` is later approved, `QuestPath` is fully
      self-contained and swappable without touching the rest of the
      screen.
- [ ] Not run — see Environment constraints, no Node.js this session.
      `tsc --noEmit` could not be executed; balanced-braces check done
      programmatically instead (see handoff).

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
- [ ] Trying the app on-device uses local `expo prebuild` + `expo run:ios`
      (Mac + Xcode + free Apple ID), not Expo Go — see README. EAS Build /
      a paid Apple Developer Program membership are deliberately deferred
      until distributing beyond your own device is needed. The GitHub
      Actions workflow is manual-trigger-only (`workflow_dispatch`) so it
      doesn't fail automatically on every push in the meantime.
- [ ] Add a `.github/workflows/` CI job that at least runs `tsc --noEmit`
      on push (free, doesn't need EAS/Apple) once a `package-lock.json`
      exists — would have caught issues far earlier than "someone runs it
      on a device."
