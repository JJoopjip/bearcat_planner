# SESSION_HANDOFF.md

**Last updated:** 2026-08-13, by a Claude Code session (chat-based, no
Node.js available in its environment — see "Environment constraints"
below). Read `CLAUDE.md` first if you haven't; it explains the hygiene
rule that keeps this file current.

## tl;dr for the next agent

Phase 1, Phase 3 (Habits), and Phase 4 (Quests) are done. Phase 2 (Today
screen) is **half** done — the daily core works, but the "as it happens"
quick-log row (focus timer, meditation+sleep log, workout log, money
entry, brain-dump inbox) doesn't exist yet, even though the spec calls it
out as part of Phase 2. Phase 5 (Money, remaining Me cards) is still not
started. Nothing in this repo has ever been run — see "Environment
constraints" below — so **actually running the project for the first
time** remains the single highest-value next task regardless of which
feature phase is picked up next. Full detail in `TASKS.md`.

## What's been done, and how sure we are it works

| Area | Status | Confidence |
|---|---|---|
| Expo/TS project setup, `expo-router` tabs, SQLite schema | Written | Not run — see below |
| Mochi component, all 16 poses, precedence logic | Written | Not run |
| Today: intention, mood, priorities, habits, one small win | Written, persists to SQLite | Not run |
| Me: Apple Health widgets (steps/HR/exercise/sleep) | Written | Not run, and can only ever be tested on a real device with a paid Apple account (see README) |
| Habits screen (Phase 3) | Written, persists to SQLite (and to the web demo's in-memory store) | Not run |
| Quests screen (Phase 4) | Written, persists to SQLite (and to the web demo's in-memory store) | Not run |
| Money screen | Placeholder only | N/A |
| GitHub Actions EAS build workflow | Written, manual-trigger-only | Failed on first run — expected, since `EXPO_TOKEN` + Apple credentials aren't set up yet |

**"Written" does not mean "verified."** No session so far has had access to
Node.js, so nothing here has been through `npm install`, `tsc`, or
`expo start` even once. Treat this code as "should be correct, reviewed by
eye, balanced braces checked programmatically" — not as tested software.
If you have Node.js (or can use GitHub Codespaces, which does), **running
it for the first time and fixing whatever breaks is more valuable than any
new feature**, because everything built on top of an unverified foundation
inherits its unverified-ness.

## Environment constraints worth knowing

- The sandbox this was built in has no Node.js, no `gh` CLI. SSH access to
  GitHub was already configured (key at `~/.ssh/github`, user `JJoopjip`)
  and is how commits got pushed. If you're in a similarly bare
  environment, GitHub Codespaces on this repo is the known-working way to
  get a Node.js environment for free — see README.
- **This project intentionally does not use Expo Go.** Trying the app —
  including the Apple Health widgets, which Expo Go can't load at all
  (`react-native-health` is a native module) — is done via
  `npx expo prebuild -p ios` + `npx expo run:ios --device`, run from a Mac
  with Xcode. A free Apple ID is enough to install and run on your own
  device (7-day re-signing, no cost). See README's "Running it on your
  phone" section. A paid Apple Developer Program membership ($99/yr) is
  only needed later, for distributing to other testers (TestFlight/EAS),
  not for trying it yourself.

## Reference material (read-only, don't edit)

- `reference/claude_code_prompt.md` — the full product spec. Canonical for
  any question about intended behavior.
- `reference/bearcat_planner.jsx` — the original React web prototype.
  Canonical for exact interaction/visual feel.
- A vanilla-JS web demo was also built and published as a Claude Artifact
  during the same overall project (not part of this repo — it predates
  this Expo scaffold and was used to validate the interaction design,
  including the Habits/Quests/Money screens that are still placeholders
  here, and the sleep-log/notes additions). It is not checked in anywhere;
  if you need it, ask the user for the artifact link rather than
  rebuilding from scratch — its `Today`/`Habits`/`Quests`/`Money`/`Me`
  screen functions are the fastest reference for porting those screens to
  native, since they're already validated against the design rules.

## What's next

See `TASKS.md` for the full backlog. In priority order, as of this
handoff:

1. Get the project actually running once (Node.js/Codespaces), fix
   whatever `tsc`/`expo start` surface — this now includes checking the
   Habits screen's hand-built `PanResponder` slider **and** the new
   Quests screen's hand-built `QuestPath` (View-based winding path, no
   SVG) actually look/behave right on a real touch device/simulator,
   since those are the newest never-run pieces
2. Build the Today screen's "as it happens" quick-log row + bottom sheets
   (finishes Phase 2)
3. Port Money screen + finish Me screen's remaining cards (Phase 5)
4. QA pass on Phase 4 (Quests) against `QUALITY_METRICS.md`, same as was
   done for Phase 3

## Handoff log

- **2026-08-13** — Built Phase 4, the Quests screen
  (`app/(tabs)/quests.tsx`), replacing the placeholder. Ported from
  `reference/bearcat_planner.jsx`'s `Quests`/`QuestPath`/`MilestoneAdd`
  components almost line-for-line: quest cards with a 📌 prefix when
  pinned and a "N/M milestones · N moves made[· resting]" subtitle, a
  present-tense intention field (blur-to-save, same hint copy), a
  milestone checklist where tapping toggles done and the moves-made
  counter only ever increases on the false→true transition (never
  decrements on uncheck — this is a deliberate faithfulness to the
  reference, not a bug: "moves made" is meant to only increase, per
  `claude_code_prompt.md`), an add-milestone row, an evidence log (dated
  one-line entries, newest first, verbatim empty-state copy "Proof goes
  here. Start with one line."), an add-evidence row, and Pin-to-Today /
  Let it rest footer buttons (pinning is exclusive — pinning one quest
  unpins all others, matching the reference's `pinned: x.id === q.id`
  map). Berries: milestone +25, evidence +3, matching both
  `claude_code_prompt.md`'s table and the reference's literal
  `berries(25, "milestone!")` / `berries(3, "evidence")` calls.
  Added full CRUD to `src/db/client.ts` — `getQuests`, `addQuest`,
  `pinQuest`, `setQuestResting`, `setQuestIntention`, `adjustQuestMoves`,
  `getAllMilestones`, `addMilestone`, `setMilestoneDone`,
  `getAllEvidence`, `addEvidence` — with a matching `createWebStore()`
  branch for every one of those queries, and seeded the web store's
  in-memory `quests`/`milestones`/`evidence` arrays with the same "q1"
  quest ("Find a role I'm excited about") and its 4 milestones that
  `schema.ts`'s `migrate()` seeds for the real database, so the GitHub
  Pages demo isn't empty on first load.
  **Deliberate deviation, same pattern as Phase 3's slider substitution**:
  the spec calls for "a winding pastel path... visualise as SVG" but no
  SVG library (`react-native-svg`) is installed, and the user who'd
  approve a new dependency was unreachable this session. `QuestPath`
  inside `quests.tsx` is a hand-built substitute using only core
  `View`/`StyleSheet` with absolute positioning: milestone nodes sit on
  the *same* sine-wave curve formula the reference's SVG path used
  (`y = baseY + sin(t * 1.25) * amplitude`), connected by a trail of
  small dot Views sampled continuously along that curve (standing in for
  the dashed SVG stroke), with Mochi (`happy` pose, `mini` — no bob
  animation) positioned at the furthest milestone reached, using the same
  "reverse-find the last done point, else the first point" logic as the
  reference. This is **untested** — no Node.js this session, so nothing
  about how it actually looks (spacing, whether Mochi visually sits "on"
  the node, whether the dot trail reads as a path rather than noise) has
  been confirmed on a real screen. If `react-native-svg` gets approved
  later, `QuestPath` is fully self-contained and can be swapped for a
  literal `<Svg>`/`<Path>` implementation without touching the rest of
  the screen.
  Verified by hand (no Node.js — see Environment constraints):
  - Every column referenced in the new `client.ts` queries exists in
    `schema.ts`'s `quests`/`milestones`/`evidence` tables with matching
    types (`pinned`/`resting`/`done` as `INTEGER`, read back as 0/1 and
    coerced with `!!`/`? 1 : 0` in the screen, same convention
    `habit_log.status` uses).
  - Every new `createWebStore()` `runAsync` branch's `sql.startsWith(...)`
    prefix checked against the *actual* literal SQL string in the
    corresponding `client.ts` function, side by side — specifically
    confirmed `"UPDATE quests SET pinned = 0"` (no `WHERE`, used to unpin
    everyone) and `"UPDATE quests SET pinned = 1 WHERE id = ?"` (used to
    pin one) are distinct enough neither swallows the other, and neither
    collides with `"UPDATE quests SET resting..."` /
    `"UPDATE quests SET intention..."` / `"UPDATE quests SET moves..."`,
    which all share the `"UPDATE quests SET "` prefix but diverge
    immediately after.
  - Design rules: no red anywhere (a `grep -i red` hit was a false
    positive on the word "meaSURED"), no completion percentage displayed
    anywhere (grepped for `%` in JSX text and `Math.round`/`toFixed` —
    none), Mochi's pose on this screen (`thinking` in the header, `happy`
    on the path) is fixed/reference-based, never derived from
    missed/failed milestones, empty-quests copy invites rather than
    scolds, resting is visually and functionally distinct from failure
    (shows as a plain "· resting" suffix, not a warning state, and
    doesn't block any interaction).
  - Balanced braces/parens/brackets confirmed programmatically for both
    changed files (`app/(tabs)/quests.tsx`, `src/db/client.ts`).
  - `which node`/`npm`/`npx`/`nvm` checked myself, still genuinely absent
    in this sandbox — no `tsc --noEmit` run.
  Not yet done: a QA pass against `QUALITY_METRICS.md` (this was the
  build session, not the QA session — flagged in "What's next" above).
- **2026-08-13** — Built Phase 3, the Habits screen
  (`app/(tabs)/habits.tsx`), replacing the placeholder. Ported from
  `reference/bearcat_planner.jsx`'s `Habits` component and `streakOf()`
  almost line-for-line: one card per habit (emoji, name, "N of M this
  week" + "target met" note, decaying week-streak badge with an 8-week
  lookback), a 7-square current-week grid per habit where tapping cycles
  none → done → cozy → none (max one cozy day/week, future days disabled,
  backfilling past days of the current week works), and an add-habit form
  (emoji chips, name field, 1–7 target, "four or five is plenty" hint plus
  a non-blocking nudge line once you're at 5+ habits). Design rules
  double-checked against `CLAUDE.md`: no red anywhere (missed days are a
  dotted `colors.pinkPale` outline via `borderStyle: "dotted"`, not a
  warning color or cross), cozy days render in `colors.lilac` and are
  visually distinct from a miss, streak math only ever decrements by one
  on a miss (`Math.max(0, streak - 1)`, never resets to 0 outright unless
  it's already ≤1), copy stays invitational ("No habits yet. Add one
  below — small and doable beats big and abandoned.", never a percentage
  framed as failure). Added `addHabit()` to `src/db/client.ts` (schema's
  `habits` table only has `id/name/emoji/target`, no archived/active flag,
  so no delete/archive function was added — the reference web prototype
  doesn't have one either, and it wasn't asked for). Added a matching
  `INSERT INTO habits` branch to `createWebStore()` so habit creation also
  works on the public GitHub Pages demo, following the file's existing
  pattern exactly.
  **Deliberate deviation from the literal spec wording**: "1–7 target
  slider" — there is no slider dependency installed
  (`@react-native-community/slider` or similar) and the user who'd approve
  a new dependency was unreachable this session, so `TargetSlider` inside
  `habits.tsx` is a hand-built drag/tap track using only core
  `react-native`'s `PanResponder` (no new deps), with 1–7 tick labels
  underneath for legibility since it has none of a native slider's
  built-in affordances. It should behave equivalently (drag or tap
  anywhere on the track to set 1–7) but is **unverified** — this session
  has no Node.js, so nothing in this repo, including this new screen, has
  ever actually been run. If `@react-native-community/slider` gets
  approved later, swapping it in is scoped entirely to that one component.
  Also unverified/assumed: `borderStyle: "dotted"` rendering correctly on
  iOS (it's a documented RN style value, but never visually confirmed
  here), and the `PanResponder` recreated fresh every render (rather than
  memoized in a `useRef`) continuing a drag gesture correctly across
  re-renders — this is standard-ish RN practice but worth a real finger-on-
  glass check on first run.
- **2026-08-13** — Follow-up: the web deploy added 2026-08-12 failed CI
  twice. `npx expo export -p web` needs `expo-asset` and `expo-font`
  resolvable as *direct* node_modules entries (`@expo/metro-config`'s
  `getAssetPlugins` and `expo-router`'s `renderStaticContent.js` both
  `require()` them by name), even though both ship as transitive deps of
  `expo`/other expo-* packages — npm's install doesn't guarantee they land
  where Metro looks. Added both to `package.json` (`expo-asset ~11.0.0`,
  `expo-font ~13.0.0`). Confirmed via the Actions API that the third run
  succeeded and **the page is live and rendering** at
  https://jjoopjip.github.io/bearcat_planner/ (Today screen, tab bar, all
  visible). Diagnosed entirely from CI logs (no local Node.js) — the user
  had to download/paste log excerpts since job logs need a GitHub token to
  fetch via API. If static web export breaks again on a similar
  "module cannot be found" / "Unable to resolve module" error for another
  expo-* package, the pattern is the same: check whether
  `@expo/metro-config` or `expo-router`'s static renderer `require()`s it
  directly, and add it to `package.json` even though it "should" already
  be there transitively.
- **2026-08-12** — Added a GitHub Pages web deploy, at the user's request,
  for a public shareable demo link (like their portfolio site) — this is
  in addition to the real iOS app, not a replacement for it. Changes:
  `app.json` gained `expo.experiments.baseUrl: "/bearcat_planner"` (project
  page subpath) and `expo.web.output: "static"`; `package.json` gained
  `react-native-web`, `react-dom`, `@expo/metro-runtime` deps and a
  `build:web` script (`expo export -p web`); new
  `.github/workflows/deploy-pages.yml` runs on push to `main` (`npm
  install` — no lockfile exists yet, so not `npm ci`), exports the static
  web build, and deploys it via `actions/deploy-pages`. **Unverified**,
  same caveat as everything else in this repo: no Node.js in this session,
  so the web export has never actually been run. `react-native-health` is
  already guarded behind `Platform.OS === "ios"` in `src/lib/health.ts` and
  `expo-sqlite` claims web support via IndexedDB since SDK 49+, so both
  *should* degrade gracefully on web, but that's untested. One manual step
  the user still needs to do once: repo Settings → Pages → Source →
  "GitHub Actions" (can't be done from this sandbox, no `gh` CLI / API
  token available). First push will likely surface real build errors —
  treat those as expected, not as new regressions to panic over.
- **2026-08-10** — Initial scaffold (Phase 1 + partial Phase 2 + Health
  widgets), pushed to GitHub, EAS workflow set to manual-only after a
  failed auto-run. Created this file, `CLAUDE.md`, `TASKS.md`, and copied
  the two reference files into `reference/` for self-containment. —
  Claude Code (chat session, no Node.js access)
- **2026-08-13** — QA pass on Phase 3 (Habits screen), first QA this
  project has had. Wrote `QUALITY_METRICS.md`, a general (not
  Habits-specific) rubric covering the 7 design rules, reference
  fidelity, code correctness, data-layer/web-demo parity, codebase
  conventions, and handoff honesty — meant to be reused as-is for Phase
  4/5 QA later today. **Verdict: pass, no code changes made.**
  Checked `which node`/`npm`/`npx`/`nvm` myself first — still genuinely
  unavailable in this sandbox, so `tsc --noEmit` could not be run for
  real; fell back to a programmatic brace/paren/bracket balance check on
  `app/(tabs)/habits.tsx`, `src/db/client.ts`, and `src/db/schema.ts` (all
  balanced) plus a careful line-by-line read. Specifically verified:
  - Decaying-streak math (`streakOf` in `habits.tsx:41-49`) hand-traced
    against target=4, 8-week lookback, weeks 8-5 empty (0 hits, decays
    toward 0 and stays there), weeks 4/3 met, week 2 missed, week 1 met →
    correctly comes out to streak=2 (0,0,0,0,1,2,1,2), never negative,
    never hard-resets on a miss. Matches `reference/bearcat_planner.jsx`
    lines 713-721 almost verbatim.
  - `createWebStore()`'s new `INSERT INTO habits` branch
    (`src/db/client.ts:62-64`): confirmed the `sql.startsWith("INSERT INTO
    habits")` match is specific enough not to collide with `"INSERT INTO
    habit_log"` in either direction (diverges at the `s`/`_` character),
    and does match the real literal query text used by `addHabit()`
    (`client.ts:187-190`) — this demo-parity check is easy to get wrong by
    pattern-matching the function name instead of the actual SQL string,
    but it's correct here.
  - No red anywhere, no daily-streak framing, no completion percentage, no
    guilt-toned copy, cozy-day cap enforced in the tap handler
    (`onCycleDay`, `habits.tsx:53-68`) and rendered in `colors.lilac`
    (distinct token from both "done" pink and the dotted-pale miss
    state) — confirmed against `CLAUDE.md`'s 7 rules directly, not just
    trusted from the builder's own handoff summary.
  - Berries amounts (habit done +3, cozy +1) match
    `reference/claude_code_prompt.md`'s spec table exactly.
  - Every column in the new `client.ts` queries exists in `schema.ts`'s
    `habits`/`habit_log` tables with matching types.
  - Colors all resolve to `src/theme/tokens.ts` constants, no hardcoded
    hex in the new screen; file structure (SafeAreaView/ScrollView,
    `useFocusEffect`-driven `load()`, optimistic local state after a
    write) matches `app/(tabs)/index.tsx`'s existing conventions.
  - The prior handoff's "unverified" claims (dotted border rendering,
    hand-built `PanResponder` slider, `TargetSlider` not memoized) are
    genuinely still unverified — spot-checked that these are honest
    hedges, not boilerplate covering something actually fine.
  No crash-level or design-rule-violating issues found, so nothing was
  fixed. One nitpick logged in `TASKS.md` instead of blocking: the
  `PanResponder` slider and `borderStyle: "dotted"` still need an
  on-device check, per the existing caveat — not new information, just
  re-flagging since it's the single highest-risk unverified piece of this
  phase. — Claude Code (chat session, no Node.js access; verified via
  `which node`/`npm`/`npx`/`nvm` rather than assuming)
