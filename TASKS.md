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

## Phase 2 — Today screen — done (unverified, no Node in this session)

- [x] Daily core: intention, mood check-in (sticker buttons), 3 priorities,
      habit chips (done/cozy), one small win — all persisted to SQLite
- [x] Pose-selection precedence logic (`src/lib/mood.ts`)
- [x] **"As it happens" quick-log row built**, in a new
      `src/components/QuickLog.tsx` (not inline in `index.tsx`, to keep
      that file from ballooning): `QuickRow` (5 buttons: Focus/Breathe/
      Workout/Money/Dump, `reading`/`sleeping`/`exercising`/`drink`/
      `thinking` Mochi poses per the spec) plus `TimerSheet` (shared
      focus+meditation engine, ported from the reference's `TimerSheet`
      almost line-for-line — same OPTS arrays, same countdown-via-
      `setInterval` re-created every tick pattern, "Stop early — no harm
      done" ghost button that logs nothing), `WorkoutSheet`, `MoneySheet`,
      `InboxSheet`. All five open as a bottom sheet built on core RN
      `Modal` (`transparent` + `animationType="slide"`, no new dependency,
      same substitution philosophy as Habits' slider/Quests' path/Money's
      bars). Wired into `app/(tabs)/index.tsx` via a `sheet` state var and
      a `refreshBerries()` helper (separate from `grantBerries`, since
      `addWorkout`/`addSession` already grant berries themselves — calling
      `grantBerries` too would double-grant).
- [x] **Sleep log folded into the Breathe sheet** (this session's own
      design call, not literally in the reference JSX, which has no
      sleep-log UI at all — see `SESSION_HANDOFF.md`'s reasoning): when
      `kind === "meditate"`, `TimerSheet` shows a "Timer / Log sleep"
      segmented toggle above its content; "Log sleep" swaps in the same
      hours+quality-chips form the Me screen's Sleep card already uses,
      calling the existing `addSleep` (still grants no berries, per the
      Phase 5 QA's finding that it's correctly absent from the spec's
      berries table). "Timer" (default) is the focus/meditation countdown.
      The Focus sheet (`kind === "focus"`) never shows the toggle.
- [x] `src/db/client.ts` gained the last missing reads: `getInbox`,
      `addInboxItem`, `removeInboxItem` (money/sessions/sleep_log/notes/
      reflections reads already existed from Phase 5). Matching
      `createWebStore()` branches added (seed empty, `ORDER BY rowid` so
      insertion order already matches, same pattern as `getHabits`/
      `getPriorities`).
- [ ] Not run — see Environment constraints, no Node.js this session
      either. `tsc --noEmit` could not be executed; balanced-braces check
      done programmatically instead (`index.tsx`, `QuickLog.tsx`,
      `client.ts` all came out even).
- [x] **QA pass done** (2026-08-13, see `SESSION_HANDOFF.md`) — verdict
      pass with one bug found and fixed during the build itself (not a
      separate pass): `TimerSheet` is one mounted component instance
      shared between the Focus and Breathe quick-log buttons (`Modal` just
      toggles `visible`), so without a fix, picking "Log sleep" inside
      Breathe and then opening Focus next would have shown the sleep-log
      form inside the Focus sheet instead of the timer. Fixed with an
      `effectiveMode` that forces `"timer"` whenever `kind !== "meditate"`,
      plus a reset-on-open effect so `mins` snaps back to each kind's
      default (25 for focus, 5 for meditate) instead of leaking the other
      kind's last-picked value. Still worth an on-device check like every
      other unverified phase: the bottom-sheet `Modal` slide-up animation,
      whether the countdown auto-closes cleanly, and whether tapping the
      scrim vs. the sheet body correctly distinguishes close-vs-no-op on a
      real touch screen (relies on RN's responder system rather than DOM
      event bubbling, which is untestable without a device).
- [x] **Editable bearcat name** (2026-08-17, owner-requested, not part of
      the original phase plan): hero title is now a blur-to-save
      `TextInput` instead of a hardcoded "Mochi", backed by new
      `setBearcatName()` in `client.ts`. `bearcat.name` already existed in
      the schema and was already displayed (read-only) on the Me screen.
- [x] **Weighted multi-check-in mood** (2026-08-17, owner-requested): "How
      are you?" can now be tapped more than once a day — every check-in is
      logged to a new `mood_log` table and the day's `moods` value becomes
      the rounded weighted average (0/25/50/75/100 per pose, averaged), via
      new `addMoodCheckIn()`/`moodDayStats()`. Today screen shows a live
      "X% today · N check-ins" line. Mood icon size bumped 40→52.
      **Mood pose variety — done 2026-08-17**: owner uploaded a larger
      sticker set; `moodPoses` is now `sad/disappointed/bored/happy/excited`
      (a proper very-sad→very-happy 5-point scale), see `SESSION_HANDOFF.md`.
- [ ] Not run — same no-Node.js caveat as everything else this session.

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
- [x] **Habit sticker picker — done 2026-08-17**, then made the sole icon
      the same day (a follow-up request). Habits pick from a curated
      25-sticker grid **in-app**, per habit, changeable any time (tap the
      habit's icon). `habits` table has a nullable `sticker` column;
      `emoji` is still stored (`NOT NULL` schema constraint) but is
      **never rendered anymore** — every habit shows a Mochi sticker,
      falling back to a fixed default pose (`happy`) rather than emoji if
      somehow unset. See `SESSION_HANDOFF.md`'s same-day log entries (two
      of them — the picker, then the full emoji removal) for the curation
      rationale and exactly what changed.
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

> **Superseded 2026-08-17**: the Pin-to-Today / Let it rest footer buttons
> described below were removed at the owner's request (they were
> effectively non-functional outside this screen — Today never read
> `pinned`). **Quest deletion went with them and is currently unreachable
> from the UI** — see `SESSION_HANDOFF.md`'s same-day log entry, this
> wasn't confirmed as intentional. The rest of this phase's description
> (milestone checklist, evidence log, berries) is still accurate.

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
- [x] **QA pass done** (2026-08-13, see `SESSION_HANDOFF.md` and
      `QUALITY_METRICS.md`) — verdict pass with notes. One real bug found
      and fixed: `createWebStore()`'s `getAllAsync` branch for
      `FROM evidence` (`src/db/client.ts`) returned the in-memory array in
      raw push/insertion order, but the real query is
      `ORDER BY date DESC` — on the GitHub Pages demo, reloading/
      revisiting the Quests tab would show evidence oldest-first instead
      of newest-first. Fixed by sorting the array by `date` descending
      before returning it, matching the real SQL. Everything else
      checked out: no design-rule violations, all `client.ts`
      quests/milestones/evidence columns match `schema.ts` exactly, every
      other `createWebStore()` branch's `sql.startsWith(...)` prefix is
      specific enough not to collide with a sibling `UPDATE quests SET
      ...` statement, seed data for the web demo matches `migrate()`'s
      seed (same "q1" quest + 4 milestones), berries amounts (milestone
      +25, evidence +3) match the spec table and the reference's literal
      calls, and the hand-built `QuestPath` sine-curve/furthest-milestone
      logic is a faithful (if not pixel-identical) port — it also quietly
      fixes a latent crash in `reference/bearcat_planner.jsx`'s own
      `QuestPath` (accessing `here.x`/`here.y` on an `undefined` `here`
      when a quest has zero milestones, since `[...pts].reverse().find()
      || pts[0]` is `undefined` when `pts` is empty) by rendering an
      empty-path invite state instead when `milestones.length === 0`.
      Not newly verified (no Node.js this session, same as always): the
      `QuestPath` visual layout (spacing, whether Mochi sits convincingly
      "on" the node) still needs an on-device look, per the builder's own
      caveat.

## Phase 5 — Money and Me screens — done (unverified, no Node in this session)

- [x] Me: Health widgets (steps, heart rate, exercise, sleep) via
      HealthKit, "Time you've given yourself" focus/breathing minutes
- [x] Me: year-in-pixels mood grid (53 columns × 7 rows, column-major like
      the reference's CSS grid, built with plain `View`s since RN has no
      CSS grid — reads `getAllMoods()`, colors each day with
      `moodColors[value-1]`, 25% opacity for the padding days outside the
      current year, same legend row as the reference)
- [x] Me: manual Sleep card — 7-night average from `sleep_log` via the new
      `getRecentSleep(7)`, log form (hours + rough/okay/good quality chips)
      calling `addSleep`. Deliberately does **not** grant berries — the
      spec's berries table has no "sleep log" line item and the reference
      prototype has no sleep-log UI at all, so this isn't a gap, it's the
      table being followed literally.
- [x] Me: Notes journal card (`getNotes`/`addNote`, newest first, invite-toned
      empty state)
- [x] Me: Sunday reflection (`getReflection`/`setReflection`, three
      blur-to-save prompts, keyed to `dkey(startOfWeek())` same as the
      reference's `wk`)
- [x] Me: Mochi's scene shop (`buyScene`/`setScene` — tapping an unowned
      scene buys it (deducts berries, marks owned, equips it), tapping an
      owned scene toggles it on/off; scene backdrops themselves were
      already built in `Mochi.tsx` in an earlier phase, only the
      buy/equip DB functions and shop UI were missing)
- [x] Money screen (`app/(tabs)/money.tsx`) built: period selector
      (month/quarter/half/year, plain segmented control, no new deps),
      in/out/kept totals, category bars (`View`/`StyleSheet`, same
      substitution pattern as Habits' slider and Quests' path — no chart
      library), an entry form (amount, in/out toggle, category chips —
      income categories are "Shift income"/"Other income" per the spec's
      income-splitting note, spend categories are the existing
      `tokens.ts` list), and the low-mood-vs-good-day spend insight
      framed as observation ("Worth noticing" / "Nicely steady", never a
      grade or a warning color).
- [x] Berries economy: quest milestones were already wired (Phase 4).
      Workout (+5) and focus/meditation session (+5) grants are now
      **inside** `addWorkout()`/`addSession()` in `client.ts` itself,
      rather than at a call site — there wasn't a call site yet (Phase
      2's "as it happens" quick-log row still isn't built), so embedding
      the berries grant in the DB function means whichever screen calls
      it next gets the grant automatically. Sleep logs deliberately do
      not grant berries (see above — not in the spec's table).
- [x] `client.ts` gained: `getAllMoney`/`addMoney`, `getAllMoods` (full
      range, for the year-in-pixels grid and the money insight —
      `getMood`/`setMood` only ever handled one date), `getRecentSleep`,
      `getNotes`/`addNote`, `getReflection`/`setReflection` (whole-row
      upsert, not per-field, to avoid interpolating a column name into
      SQL), `buyScene`/`setScene` — plus matching `createWebStore()`
      branches for every one of those, all seeded empty to match
      `schema.ts`'s `migrate()` (which doesn't seed money/notes/
      reflections either).
- [x] **Bug fixed while adding the scene-shop web-store branches**: the
      web store's `runAsync` had a bare `sql.startsWith("UPDATE bearcat")`
      check as its very first condition, matching *any* future
      `UPDATE bearcat...` query, not just the berries-delta one it was
      written for. Adding `buyScene`/`setScene`'s own `UPDATE bearcat...`
      queries would have silently fallen into the berries-delta branch
      and misinterpreted their params. Narrowed it to
      `"UPDATE bearcat SET berries = berries + ?"` before adding the two
      new, more specific branches.
- [ ] Not run — see Environment constraints, no Node.js this session
      either. `tsc --noEmit` could not be executed; balanced-braces check
      done programmatically instead (all of `money.tsx`, `me.tsx`,
      `client.ts`, `tokens.ts` came out even).
- [x] **QA pass done** (2026-08-13, see `SESSION_HANDOFF.md` and
      `QUALITY_METRICS.md`) — verdict pass with notes. No crash-level or
      design-rule-violating issues; nothing fixed. The money-vs-mood
      insight copy (the highest-risk string in the whole app for
      guilt/shame framing) was confirmed byte-for-byte identical to the
      reference's neutral wording. Berries wiring, web-store branch
      collisions across all three phases together, and the scene shop's
      owned/equip logic were all re-verified by hand, not just trusted
      from the build handoff. Three non-blocking nitpicks (not fixed,
      logged below):
  - [ ] Me's "Time you've given yourself" card (`app/(tabs)/me.tsx`)
        drops the reference's third "Moving" (workout minutes) stat —
        reasonable since workout time already shows via the HealthKit
        "Exercise today" widget on the same screen and the manual
        `workouts` table has no reader yet (nothing writes to it), but
        this deviation from `reference/bearcat_planner.jsx` was never
        called out in the Phase 5 build handoff. Either add a
        `getWorkoutMinutes()` reader and restore the stat, or explicitly
        document the omission as intentional.
  - [ ] Money's empty-category-bars copy ("Log something below and it
        appears here", `app/(tabs)/money.tsx:117`) diverges from the
        reference's literal "Log something from Today and it appears
        here" — correct given the entry form lives on Money now, not
        Today, but also an undisclosed wording change worth noting if
        the Today quick-log row (see Phase 2) ever makes "Today" true
        again.
  - [ ] `#5FB595` (green "In" stat color) is hardcoded twice now
        (`app/(tabs)/money.tsx:102` and `app/(tabs)/me.tsx:192`) instead
        of living in `src/theme/tokens.ts`. Matches the reference's exact
        value, not a stray color, just ungrouped — promote to a named
        token (e.g. `colors.mintDeep`, since `colors.mint` is already a
        different, lighter shade) next time either file is touched.

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
