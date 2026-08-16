# SESSION_HANDOFF.md

**Last updated:** 2026-08-13, by a Claude Code session that built and QA'd
Phase 2's remaining piece, the "as it happens" quick-log row (chat-based,
no Node.js available in its environment — see "Environment constraints"
below). Read `CLAUDE.md` first if you haven't; it explains the hygiene
rule that keeps this file current.

## tl;dr for the next agent

**All five feature phases (1–5) are now built.** Phase 2 (Today screen) is
now fully done: the daily core (from earlier sessions) plus this session's
"as it happens" quick-log row — Focus/Breathe/Workout/Money/Dump buttons
opening bottom sheets (`src/components/QuickLog.tsx`), with manual sleep
logging folded into the Breathe sheet as a mode toggle. Phases 3, 4, 5 were
already built+QA'd pass/pass-with-notes in the prior session. Phase 6
(notifications) is the only phase not started.

**The single highest-priority next step for whoever picks this up:**
nothing in this repo has ever actually been run — no session that's
touched it has had Node.js available, so `npm install`, `tsc --noEmit`,
and `expo start`/`expo run:ios` have never executed against this code
once, across five phases. Every QA pass so far (including this one) has
been a careful hand/programmatic review, not a real compile or render.
Get it onto a real Node.js environment (GitHub Codespaces is the known-
free option) or a Mac with Xcode, run `tsc --noEmit` first, then actually
launch it — that will surface real issues faster than any further code
review can, and everything built on top of this unverified foundation
inherits its risk until someone does. Full detail in `TASKS.md`.

## What's been done, and how sure we are it works

| Area | Status | Confidence |
|---|---|---|
| Expo/TS project setup, `expo-router` tabs, SQLite schema | Written | Not run — see below |
| Mochi component, all 16 poses, precedence logic | Written | Not run |
| Today: intention, mood, priorities, habits, one small win | Written, persists to SQLite | Not run |
| Today: "as it happens" quick-log row (Focus/Breathe/Workout/Money/Dump sheets, sleep folded into Breathe) | Written, persists to SQLite (and web demo store) | Not run |
| Me: Apple Health widgets (steps/HR/exercise/sleep) | Written | Not run, and can only ever be tested on a real device with a paid Apple account (see README) |
| Habits screen (Phase 3) | Written, persists to SQLite (and to the web demo's in-memory store) | Not run |
| Quests screen (Phase 4) | Written, QA'd (pass with notes), persists to SQLite (and to the web demo's in-memory store) | Not run |
| Money screen (Phase 5) | Written, persists to SQLite (and web demo store) | Not run |
| Me screen's remaining cards (Phase 5) | Written: year-in-pixels, manual Sleep, Notes, Sunday reflection, scene shop | Not run |
| Berries economy | Fully wired: habit/cozy/mood/win (earlier phases) + quest milestone +25 (Phase 4) + workout/focus/meditation +5 (Phase 5, embedded in `client.ts`'s `addWorkout`/`addSession`) | Not run |
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

All five feature phases (1–5) are now built. See `TASKS.md` for the full
backlog, but in priority order as of this handoff:

1. **Get the project actually running, for the first time ever, on a real
   Node.js machine (GitHub Codespaces is the known-free option) or a Mac
   with Xcode for the iOS side.** Every phase so far — 1 through 5 — has
   been written by hand without `npm install`/`tsc --noEmit`/`expo start`
   ever running against this code once, across six sessions now. Run
   `tsc --noEmit` first (fast, catches typos/type mismatches) before
   spending time on the device/simulator step. This is still the single
   highest-leverage thing anyone touching this repo could do next.
2. On-device/simulator specifically, check: the Habits screen's
   `PanResponder` slider, Quests' `QuestPath` (View-based winding path),
   Phase 5's year-in-pixels grid and scene-shop backdrops, and now this
   session's `Modal`-based bottom sheets in `QuickLog.tsx` — specifically
   whether the countdown timer's `setInterval`-recreated-every-tick
   pattern behaves smoothly on-device, and whether tapping the sheet's
   scrim vs. its body correctly distinguishes close-vs-no-op (relies on
   RN's touch responder system, which is untestable without a device).
3. Phase 6 (notifications) is the only remaining unbuilt feature phase —
   low priority per `TASKS.md` until the above verification work is done.
4. ~~Build the Today screen's "as it happens" quick-log row~~ — **done**
   this session, see the Handoff log entry below.

## Handoff log

- **2026-08-13** — Built and QA'd Phase 2's remaining piece: the "as it
  happens" quick-log row on Today. New file `src/components/QuickLog.tsx`
  (kept separate from `index.tsx` rather than inline, since it's five
  sheets' worth of UI) exports `QuickRow` (the 5-button row — Focus/
  Breathe/Workout/Money/Dump, using the `reading`/`sleeping`/`exercising`/
  `drink`/`thinking` Mochi poses the spec assigns them) and `TimerSheet`/
  `WorkoutSheet`/`MoneySheet`/`InboxSheet`, ported from the reference's
  same-named components almost line-for-line (same `OPTS` arrays for
  focus/meditation minutes, same countdown mechanics, same "Stop early —
  no harm done" no-penalty exit, same workout/money/inbox form fields and
  copy). Sheets are built on core RN `Modal` (`transparent` +
  `animationType="slide"`, a scrim `Pressable` behind a sheet `Pressable`
  that stops propagation) — no new dependency, continuing the same
  substitution pattern as Habits' hand-built slider, Quests' `QuestPath`,
  and Money's category bars (all cases where the spec wanted a component
  this project doesn't have a library for, and adding one wasn't
  approved).
  **Sleep log folded into the Breathe sheet**: this is this session's own
  design decision, not literally present in
  `reference/bearcat_planner.jsx` (which has no sleep-log UI at all, only
  a HealthKit-style workout paste-import) — the spec's quick-log row only
  has five slots and five assigned poses, and manual sleep entry doesn't
  get its own. Since Breathe (meditation) and sleep are both "winding
  down" moments, `TimerSheet` shows a "Timer / Log sleep" segmented toggle
  when `kind === "meditate"` (never for `kind === "focus"`); "Log sleep"
  swaps in the same hours + rough/okay/good-quality-chips form the Me
  screen's Sleep card already uses, calling the existing `addSleep`
  (still correctly grants no berries — confirmed against the spec's
  berries table again, same finding as Phase 5's QA).
  **Bug found and fixed during the build** (not a separate QA pass — this
  was code review of my own diff before considering it done):
  `TimerSheet` is one mounted React component instance shared between the
  Focus and Breathe quick-log buttons — the `Modal` only toggles
  `visible`, it doesn't unmount, so component state persists across
  reopenings with a different `kind` prop. Two consequences, both fixed:
  (1) if a user picked "Log sleep" mode inside Breathe, closed the sheet,
  then opened Focus next, the raw `mode` state would still read `"sleep"`
  and the Focus sheet would incorrectly render the sleep-log form instead
  of a timer — fixed with `effectiveMode = kind === "meditate" ? mode :
  "timer"`, so Focus can never see sleep mode regardless of leftover
  state. (2) `mins`' `useState` initializer only runs once on mount, so
  after visiting Breathe (default 5 min) and then opening Focus, the
  minute options would start on 5 instead of Focus's own default 25 —
  fixed with a reset-on-open `useEffect` (`[open]` dependency) that snaps
  `mode` back to `"timer"` and `mins` back to the correct per-kind default
  every time the sheet transitions from closed to open. Also added: an
  effect that force-stops the countdown (`setLeft(null)`) if the sheet is
  closed mid-run, so a dismissed timer doesn't keep ticking (and
  eventually auto-log a session) in the background.
  **`src/db/client.ts` additions**: `getInbox`, `addInboxItem`,
  `removeInboxItem` — the last remaining schema table (`inbox`) without
  client functions. No berries (parking a thought isn't a rewarded
  action, matching the spec's berries table and the reference's own
  inbox, which doesn't call `berries()` either). Matching
  `createWebStore()` branches added: `getAllAsync`'s `FROM inbox` returns
  the array as-is (real query is `ORDER BY rowid`, i.e. insertion order,
  same as `getHabits`/`getPriorities` — no re-sort needed, unlike
  evidence/money/notes/sleep_log which needed the `ORDER BY date DESC`
  fix in earlier phases' QA passes), and `runAsync` gained `INSERT INTO
  inbox`/`DELETE FROM inbox` branches, checked against every existing
  `startsWith(...)` prefix in both directions for collisions (none — no
  other branch starts with or is a prefix of either literal string).
  **`app/(tabs)/index.tsx` changes**: added `inbox` and `sheet` state,
  `getInbox()` added to the `Promise.all` in `load()`, a new "As it
  happens" card rendering `QuickRow`, and the four sheets mounted after
  `</ScrollView>` (inside `SafeAreaView`, matching where the reference
  mounts its sheets — siblings of the scrollable content, not nested
  inside it, so they can overlay the whole screen). Added `refreshBerries`
  (re-fetches the berries count without granting) alongside the existing
  `grantBerries` (grants then re-fetches) — needed because `addWorkout`/
  `addSession` already call `addBerries` internally (wired that way back
  in the Phase 5 session specifically so this session wouldn't have to
  remember to grant separately); calling `grantBerries` from these sheets
  instead would have double-granted.
  **Design rules, checked against `CLAUDE.md` directly**: `grep -ni
  "red\|danger\|warning\|guilt\|shame\|behind\|fail"` on both new/changed
  files came back clean (only false positives on the words "shared" and
  a code comment's "Focus / Breathe... shared timer engine"); no
  completion percentage anywhere in the new UI; Workout/Money/Inbox
  copy matches the reference verbatim ("Minutes and type only. No weight,
  no calories — effort is the point.", "Park it here so today stays to
  three things.", "Empty, which is a good sign.", "Stop early — no harm
  done"); tapping an inbox row deletes it with no confirmation dialog and
  no warning styling, matching the reference's own "dump and clear"
  affordance exactly.
  Verified by hand (no Node.js — see Environment constraints, unchanged
  from every prior session): balanced braces/parens/brackets confirmed
  programmatically for `index.tsx`, `QuickLog.tsx`, `client.ts` (all
  even); every new `client.ts` query's columns checked against
  `schema.ts`'s `inbox` table (`id`, `text` — matches); `addSession`'s
  call signature (`id, date, kind, minutes, tag`) checked against how
  `TimerSheet` calls it, including passing `null` for `tag` on meditation
  sessions (schema's `sessions.tag` column is nullable, no `NOT NULL`).
  Not verified, flagged in "What's next" above rather than blocking: the
  actual on-device feel of the `Modal` bottom sheets (slide animation,
  scrim-tap-to-close, whether the countdown UI reads clearly at real
  phone size) — first time this repo has used `Modal` at all, so there's
  no prior on-device experience with it to lean on, unlike the
  `PanResponder`/View-based substitutions in earlier phases which at
  least reuse patterns already spot-checked once.
- **2026-08-13** — Added `IMPROVEMENT_ADVICE.md`: a standalone market/
  competitive research + strategic advice doc for the owner (not a build
  log, doesn't affect the priorities above — the "get it running on real
  Node.js/Xcode" item is still the top engineering priority regardless).
- **2026-08-13** — QA pass on Phase 5 (Money screen + remaining Me cards),
  the last QA of the three-phase session. Applied `QUALITY_METRICS.md` as-
  is plus the extra checks called out for this phase specifically.
  **Verdict: pass with notes** — no crash-level or design-rule-violating
  issues, nothing fixed, three nitpicks logged in `TASKS.md`.
  Checked `which node`/`command -v node`/`npm`/`npx`/`nvm` myself first
  (per the rubric's explicit instruction not to assume) — genuinely
  absent again (the only `node` hits on the machine were `/proc/irq/*/node`
  kernel entries, not the runtime), so `tsc --noEmit` could not be run;
  fell back to a programmatic brace/paren/bracket balance check on all
  four changed files (`money.tsx`, `me.tsx`, `client.ts`, `tokens.ts` —
  all balanced) plus a full line-by-line read of `client.ts` end to end
  (all three phases' additions together, not just Phase 5's).
  Specifically verified:
  - **Money's low-mood-vs-good-day insight copy** (`money.tsx:129-138`):
    the literal strings ("On low-mood days you spend about $X. On good
    days, $Y." + "Worth noticing."/"Nicely steady.") are a byte-for-byte
    match of `reference/bearcat_planner.jsx:1113-1118`'s `spendOn()`/JSX,
    including the conditional-render guard (`low !== null && high !==
    null`) and the same `low > high * 1.2` threshold. No color coding, no
    icon, no "overspending" language — reads as observation either way,
    genuinely the least shame-coded pattern I've seen this rubric applied
    to. This was the single highest-risk item in the phase per the task
    brief, and it checks out clean.
  - Every new `client.ts` query's columns checked against `schema.ts`:
    `money` (id/date/amount/dir/category), `notes` (id/date/text),
    `reflections` (week_key/proud/learned/next), `sleep_log`
    (id/date/hours/quality), and `bearcat`'s `owned_scenes`/`scene`
    columns used by `buyScene`/`setScene` — all match exactly, including
    nullability (`scene TEXT` nullable, `setScene(null)` clears it
    correctly).
  - **All `createWebStore()` branches, read top to bottom** (not just
    Phase 5's additions) for prefix collisions, in both directions:
    `INSERT INTO money`/`sleep_log`/`notes`/`reflections` are each
    distinct enough from every existing table prefix (specifically
    checked `money` vs `moods` — they diverge at the 3rd character after
    `INSERT INTO mo`, so neither `startsWith` swallows the other) and the
    three `UPDATE bearcat` branches are ordered specific-to-general
    correctly (`berries = berries + ?` / `berries = berries - ?` /
    `scene = ?`, in that order, each diverging immediately after
    `UPDATE bearcat SET `). The builder's own claimed fix — narrowing a
    bare `"UPDATE bearcat"` check to `"UPDATE bearcat SET berries =
    berries + ?"` — is real and correct, verified by reading the current
    file (`client.ts:94`), not just trusting the commit message. Every
    `getAllAsync` branch with a real `ORDER BY date DESC` (`evidence`,
    `money`, `notes`) or `ORDER BY date DESC LIMIT ?` (`sleep_log`) has a
    matching `.sort(...)` (and `.slice(0, p[0])` for the `LIMIT`) in its
    web-store branch — confirmed each one, not just evidence (which
    Phase 4's QA already fixed).
  - **Berries wiring**: `addWorkout`/`addSession` each call `addBerries(5)`
    exactly once per function, matching the spec's table (workout +5,
    focus-or-meditation session +5) — and neither function is called
    anywhere in `app/` or `src/` yet (grepped for both), so there's no
    live double-grant risk today; the risk is purely theoretical until
    Phase 2's quick-log row exists and calls them, at which point each
    call still only grants once. Sleep logs correctly grant nothing (not
    in the spec's berries table, and the reference prototype has no
    sleep-log UI at all) — confirmed by reading `addSleep` (`client.ts:
    317-320`), no `addBerries` call present.
  - **Scene shop** (`buyScene`/`setScene`, `client.ts:455-472`, called
    from `me.tsx`'s `onScenePress`): buying reads `owned_scenes` fresh via
    `getBearcat()` (not from stale client state), parses it, appends the
    new id only if not already present, and writes back
    `JSON.stringify(owned)` — no corruption path found. A scene can only
    ever be equipped via `setScene`, which `me.tsx` only calls for ids
    already in the local `owned` array; the unowned branch always goes
    through `buyScene` first, which itself sets `scene = id` as part of
    the same purchase write — matching
    `reference/bearcat_planner.jsx:1147-1158`'s `buy()` exactly (buying
    auto-equips, same as the original). No path exists in the UI to equip
    an unowned scene.
  - **Design rules**: grepped `money.tsx`/`me.tsx`/`client.ts` for
    red/danger/warning/error/guilt/shame/behind/fail — no real hits (the
    grep noise was all `reduce`/`error`-free false positives, unlike
    Phase 4's "meaSURED" near-miss there was nothing here at all). No
    completion percentage anywhere. Mochi's pose on Me
    (`me.tsx:67-73`'s `catMood`) is computed from `moodForToday()` fed
    only `todayMood`/`todayWin`/`hasDoneAnyPriority`/
    `hasLoggedAnyHabitToday`/`weekScore` — confirmed none of money, sleep,
    notes, or scene data is threaded into that call anywhere in the file,
    which is exactly what CLAUDE.md rule 5 requires. Empty states invite
    ("Nothing here yet. Jot down a thought whenever one shows up." for
    Notes, "Log something below and it appears here." for Money's
    category bars) rather than scold.
  - **Year-in-pixels grid** (`me.tsx:87-99`): 371 cells from
    `startOfWeek(jan1)`, column-major grouping (`cells.slice(c*7, c*7+7)`
    for 53 columns) to stand in for the reference's CSS
    `grid-auto-flow: column`, `inYear` opacity-0.25 padding — hand-traced
    against `reference/bearcat_planner.jsx:1128-1134` and it's a faithful
    port, not just visually similar.
  Three non-blocking nitpicks logged in `TASKS.md` instead of fixed
  (nothing here crashes or breaks a design rule):
  1. Me's "Time you've given yourself" card shows Focus/Breathing but
     drops the reference's third "Moving" (workout minutes) stat
     (`reference/bearcat_planner.jsx:1201-1204`) — defensible (workout
     time is already shown via the HealthKit "Exercise today" widget on
     the same screen, and the manual `workouts` table has no reader
     function since nothing writes to it yet), but it's an undisclosed
     deviation from the reference, not called out in the build handoff.
  2. Money's empty-category-bars copy changed from the reference's "Log
     something from Today and it appears here" to "Log something below
     and it appears here" (`money.tsx:117`) — correct given the entry
     form now lives on this screen rather than Today's still-unbuilt
     quick-log row, but also undisclosed as a deliberate change.
  3. `#5FB595` (the "In" stat's green) is hardcoded directly in
     `money.tsx:102` rather than added to `tokens.ts` as a named
     constant, even though it's semantically reused from an existing
     hardcoded occurrence in `me.tsx:192`'s Health widget — matches the
     reference's literal `.bc-stat.mint{color:#5FB595}` value exactly, so
     it's not a stray invention, just ungrouped; worth promoting to a
     token if a third use ever shows up.
- **2026-08-13** — Built Phase 5: the Money screen and the rest of the Me
  screen, the last of the three requested phases. No Node.js in this
  sandbox either (checked `which node`/`npm`/`npx`/`nvm` myself, all
  absent) — same caveat as every prior session, code written by hand and
  checked programmatically for balanced braces/parens/brackets, not
  compiled.
  **Money** (`app/(tabs)/money.tsx`, replacing the placeholder): period
  selector (month/quarter/half/year, a hand-built segmented control, no
  new deps), in/out/kept totals, category bars (`View`/`StyleSheet`
  width-percentage fills, same no-chart-library substitution pattern as
  Habits' slider and Quests' path), an entry form (amount, in/out toggle,
  category chips — spend categories from the existing `tokens.ts` list,
  income categories are the new `"Shift income"`/`"Other income"` per the
  spec's income-splitting note), and the low-mood-vs-good-day spend
  insight ported from the reference's `spendOn()` almost verbatim
  (average out-spend on days where that day's mood value is ≤2 vs ≥4,
  using the app's own `moodPoses` scale). Framed as an observation, not a
  judgment: "On low-mood days you spend about $X. On good days, $Y.
  Worth noticing." / "...Nicely steady." — matching the reference's exact
  wording, no warning color, no red, no "you're overspending" framing.
  **Me** (`app/(tabs)/me.tsx`): added the year-in-pixels mood grid (53
  columns × 7 rows, column-major to mirror the reference's CSS
  `grid-auto-flow: column`, built with plain `View`s since RN has no CSS
  grid — each cell colored by `moodColors[value-1]` via the new
  `getAllMoods()`, padding days outside the current year at 25% opacity,
  same swatch legend row as the reference), a manual Sleep card
  (7-night average via the new `getRecentSleep(7)`, a log form with
  rough/okay/good quality chips, distinct from the existing HealthKit
  sleep widget above it), a Notes journal card (`getNotes`/`addNote`,
  newest first, invite-toned empty state), a Sunday reflection card
  (`getReflection`/`setReflection`, three blur-to-save prompts keyed to
  `dkey(startOfWeek())`), and Mochi's scene shop (`buyScene`/`setScene` —
  tapping an unowned scene buys and equips it if there are enough
  berries, tapping an owned one toggles it on/off; the actual backdrop
  rendering behind Mochi already existed in `Mochi.tsx`/`mood.ts` from an
  earlier phase, only the buy/equip data layer and shop UI were
  missing). The shop card's Mochi pose/stage now come from the same
  `moodForToday`/`stageFromMilestones` logic Today uses (mood, win,
  priorities, habit log, week score — all daily-core inputs only, per
  design rule 5), computed fresh in `me.tsx`'s own `load()` rather than
  shared global state, matching how each screen in this codebase already
  independently loads its own data.
  **`client.ts` additions**: `getAllMoney`/`addMoney`, `getAllMoods`
  (full range — `getMood`/`setMood` only ever handled one date at a
  time), `getRecentSleep`, `getNotes`/`addNote`,
  `getReflection`/`setReflection` (a whole-row upsert rather than a
  per-field one, to avoid interpolating a column name into raw SQL — the
  screen reads the current week's row, merges the edited field in JS on
  blur, writes all three back, same shape as the reference prototype's
  own `setRefl`), `buyScene`/`setScene`. Every one of these got a
  matching `createWebStore()` branch, seeded empty to match
  `schema.ts`'s `migrate()` (money/notes/reflections aren't seeded there
  either, so empty is correct, not an oversight).
  **Berries economy**: quest milestones were already wired in Phase 4.
  This session embedded the workout (+5) and focus/meditation-session
  (+5) grants **inside** `addWorkout()`/`addSession()` in `client.ts`
  itself, rather than at a UI call site — there wasn't a UI call site to
  wire it into yet, since Phase 2's "as it happens" quick-log row (the
  spec's actual home for logging a workout or starting a focus timer)
  still isn't built. Embedding the grant in the DB function means
  whichever screen calls it next — the eventual quick-log sheets, most
  likely — gets the berries grant automatically, without every future
  caller needing to remember to also call `addBerries`. Manual sleep log
  entries (the new Me card) deliberately do **not** grant berries: the
  spec's berries table (`reference/claude_code_prompt.md`, "Berries and
  scenes") lists habit/cozy/mood/win/focus-or-meditation/workout/
  milestone only, and the reference prototype has no sleep-log UI at all
  (only a HealthKit-style paste-import for workouts) — so this is
  following the table literally, not a gap.
  **Bug fixed while wiring the scene shop into the web store**: the web
  store's `runAsync` had `if (sql.startsWith("UPDATE bearcat")) bearcat
  .berries += p[0];` as its very first condition — a bare prefix match
  on the table name, not the actual query, that would have silently
  swallowed *any* future `UPDATE bearcat...` statement into the
  berries-delta branch. `buyScene`/`setScene` both needed their own
  `UPDATE bearcat...` queries (deduct berries + set owned_scenes + set
  scene; set scene alone), which would have hit that overly broad check
  first and misread their params as a berries delta. Narrowed the
  original check to its actual literal query text
  (`"UPDATE bearcat SET berries = berries + ?"`) before adding the two
  new, more specific branches after it — same class of bug as the
  evidence-ordering one the Phase 4 QA pass found, caught this time
  during the build rather than a separate QA pass.
  **Design rules, checked against `CLAUDE.md` directly**: no red
  anywhere (`grep -ni "red|error|danger|warning"` across both new/changed
  screen files came back clean, one false positive on the substring
  "red" inside "Entered"); no completion percentage displayed as a grade
  (the only `%` usage is bar-fill `width` styling, same non-displayed
  pattern already used for the Today ring and Quests path); Mochi's pose
  on the Me screen's shop card is derived only from daily-core signals
  (mood/win/priorities/habits/week-score), never from money, sleep, or
  notes — money/sleep/notes/reflections are optional modules and must
  not (and don't) feed the mascot's pose, per design rule 5; Money's
  Mochi (header, `"drink"` pose) is fixed, not performance-derived;
  empty states invite (bars: "Log something below and it appears here.",
  notes: "Nothing here yet. Jot down a thought whenever one shows up.").
  One pre-existing, not-newly-introduced nitpick worth flagging: the
  `"#5FB595"` hex used for the Money screen's "In" stat color (and the
  Me screen's pre-existing "Exercise today" stat) isn't a `tokens.ts`
  constant — it's a darker text-legible variant of the pale `mint`
  token, matching the reference CSS's own `.bc-stat.mint{color:#5FB595}`
  (a deliberately different, more readable shade than the pale
  background token). This convention already existed in `me.tsx` before
  this session; I reused it for consistency in `money.tsx` rather than
  inventing a third way to color a stat number, but it's still a
  hardcoded hex outside `tokens.ts`, worth promoting to a token
  (`colors.mintDeep` or similar) in a later pass rather than fixing
  ad hoc mid-phase.
  Verified by hand (no Node.js — see Environment constraints): every new
  `client.ts` query's columns against `schema.ts`'s `money`/`sleep_log`/
  `notes`/`reflections` tables (all match); every new `createWebStore()`
  `runAsync`/`getAllAsync` branch's literal SQL prefix checked against
  the real query text side by side, specifically re-verifying the
  now-narrowed bearcat branches don't collide with each other or with
  quest-related `UPDATE`s; balanced braces/parens/brackets confirmed
  programmatically for `money.tsx`, `me.tsx`, `client.ts`, `tokens.ts`.
  Not verified: the actual on-screen look of the year-in-pixels grid
  (whether 53 columns of 7 tiny squares each stay legible at real phone
  widths), the scene backdrops behind Mochi (first time the shop UI that
  triggers them exists, though the backdrop rendering itself predates
  this session), and general layout/scroll behavior of both screens —
  all flagged in "What's next" above rather than blocking on them, per
  the standing instruction that this is a "verify on device" gap, not a
  correctness bug.
- **2026-08-13** — QA pass on Phase 4 (Quests screen), applying the
  existing `QUALITY_METRICS.md` rubric as-is (not rewritten). **Verdict:
  pass with notes — one bug found and fixed, everything else clean.**
  Checked `which node`/`npm`/`npx`/`nvm` myself first (per the rubric's
  explicit instruction not to assume) — still genuinely unavailable in
  this sandbox, so `tsc --noEmit` could not be run for real; fell back to
  a programmatic brace/paren/bracket balance check on
  `app/(tabs)/quests.tsx` and `src/db/client.ts` (both balanced, matching
  counts for `()`, `{}`, `[]`) plus a full line-by-line read against the
  reference (`reference/bearcat_planner.jsx` lines 826-1042) and the spec
  (`reference/claude_code_prompt.md`).
  **Bug found and fixed**: `src/db/client.ts`'s `createWebStore()` —
  `getAllAsync`'s `if (sql.includes("FROM evidence"))` branch returned
  the in-memory `evidence` array in raw insertion order, but the real
  query (`getAllEvidence` in `client.ts`) is `SELECT * FROM evidence
  ORDER BY date DESC`. On the GitHub Pages web demo this meant a page
  reload or revisiting the Quests tab (triggering `useFocusEffect`'s
  `load()`) would silently show evidence oldest-first instead of
  newest-first — not a crash, but a real behavioral mismatch from the
  real app, and the kind of thing the rubric's web-demo-parity section
  specifically warns is "easy to miss because nothing crashes." Fixed by
  sorting a copy of the array by `date` descending before returning it,
  matching the real SQL (`src/db/client.ts`, the `FROM evidence` branch
  inside `createWebStore`).
  Everything else checked out clean:
  - **Data-layer correctness**: every column in the new `client.ts`
    `getQuests`/`addQuest`/`pinQuest`/`setQuestResting`/
    `setQuestIntention`/`adjustQuestMoves`/`getAllMilestones`/
    `addMilestone`/`setMilestoneDone`/`getAllEvidence`/`addEvidence`
    queries matches `schema.ts`'s `quests`/`milestones`/`evidence`
    `CREATE TABLE` columns and types exactly (`pinned`/`resting`/`done`
    all `INTEGER`, coerced 0/1 the same way `habit_log.status` already
    is).
  - **Web-store branch collisions**: checked every new
    `createWebStore()` `runAsync` `sql.startsWith(...)` prefix against
    the literal SQL string in the corresponding `client.ts` function,
    side by side, in both directions. `"UPDATE quests SET pinned = 0"`
    (unpin-all, no params) vs. `"UPDATE quests SET pinned = 1 WHERE id =
    ?"` (pin-one) vs. `"...SET resting = ..."` / `"...SET intention =
    ..."` / `"...SET moves = moves + ..."` all share the `"UPDATE quests
    SET "` prefix but diverge immediately after — none swallows another,
    confirmed by reading the actual strings, not just the function
    names. Same check for `"INSERT INTO quests"` vs. `"INSERT INTO
    milestones"` vs. `"INSERT INTO evidence"` — no collision.
  - **Web demo seed data**: `createWebStore()`'s in-memory `quests`/
    `milestones` arrays (client.ts) are seeded with the same "q1" quest
    ("Find a role I'm excited about") and its 4 milestones that
    `schema.ts`'s `migrate()` seeds for the real SQLite database — the
    public demo won't be empty on first load.
  - **Berries**: milestone-done +25, evidence-added +3 — both match
    `reference/claude_code_prompt.md`'s berries table ("quest milestone
    +25") and the reference prototype's literal `berries(25,
    "milestone!")` / `berries(3, "evidence")` calls (note the spec table
    itself doesn't list an "evidence" line item, only the reference code
    does — not a discrepancy, just the table being non-exhaustive).
  - **`QuestPath` hand-built winding path** (`quests.tsx:246-326`): the
    sine-curve formula (`y = baseY + sin(t * 1.25) * amplitude`) and the
    furthest-milestone-reached logic (`[...pts].reverse().find(p =>
    p.done) ?? pts[0]`) are faithful ports of the reference's `QuestPath`
    (lines 1007-1042), just with different base/amplitude constants
    since it's laid out in RN `View`s instead of an SVG viewBox — that's
    fine, the shape/logic is what needed to match, not the exact pixel
    values. Traced the x/y math by hand for 1, 2, and 4-milestone cases,
    no divide-by-zero (`Math.max(n - 1, 1)` guards it) and node/Mochi
    positions stay within the `150`px path height and full width. Worth
    calling out as a **positive finding**: the reference's own
    `QuestPath` has a latent crash bug — when `milestones.length === 0`,
    `pts` is `[]`, so `here = [...pts].reverse().find(...) || pts[0]` is
    `undefined`, and the next line does `here.x`/`here.y`, which would
    throw in the original web prototype. The port sidesteps this by
    special-casing `milestones.length === 0` into an invite-copy empty
    state before any of that math runs (`quests.tsx:270-276`) — not
    called out as a deliberate deviation in the build handoff, but it's
    a strict improvement, not a bug, so nothing to fix.
  - **Design rules** (all 7, checked against `CLAUDE.md` directly): no
    red anywhere (`grep -ni "red\|error\|danger\|warning"` on the diff
    came back clean); no completion percentage (`grep` for `%`,
    `toFixed`, `Math.round` in the screen found nothing); Mochi's poses
    on this screen (`thinking` in the header, `happy` inside
    `QuestPath`) are both fixed/reference-matched constants, never
    derived from missed/failed milestones — no violation of rule 5;
    empty-quests copy invites rather than scolds ("No quests yet. What's
    something you're growing toward? Add one below — you can always
    start small."); progress reads as "N/M milestones · N moves made,"
    an action count, never a percentage or grade; daily-streak/cozy-day
    rules don't apply to this screen (no habit concept here) — correctly
    not implemented, not silently missing.
  - **Codebase conventions**: `quests.tsx` follows the same
    `SafeAreaView`/`ScrollView` + `useFocusEffect`-driven `load()` +
    optimistic local-state-after-write shape as `index.tsx`/`habits.tsx`;
    all colors resolve to `src/theme/tokens.ts` (the one raw hex,
    `#D3A8BE` for `placeholderTextColor`, is an existing established
    pattern already used identically in `index.tsx` and `habits.tsx`,
    not a new invention); IDs via `uid()`, dates via `dkey()`; no unused
    imports (`LayoutChangeEvent`, `dkey`, `uid` are all genuinely used).
  - Confirmed neither reference file was touched
    (`git diff --stat` on `reference/` across the Phase 4 commit is
    empty).
  Not newly verified (unchanged from the build handoff's own caveat, no
  Node.js this session either): the actual on-screen look of `QuestPath`
  — node spacing, dot-trail legibility, whether Mochi visually sits "on"
  the furthest node — still needs a real device/simulator check. Logged
  in `TASKS.md`'s Phase 4 section rather than blocking on it, since it's
  a "verify on device" item, not a correctness bug.
  Phase 5 is clear to proceed regardless of that open item, per the
  owner's standing instruction. — Claude Code (chat session, no Node.js
  access; verified via `which node`/`npm`/`npx`/`nvm` rather than
  assuming)
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
