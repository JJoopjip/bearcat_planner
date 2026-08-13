# QUALITY_METRICS.md

A reusable QA rubric for Bearcat Planner. Run this against every phase
before it's considered "done, verified" rather than just "written." Keep
this file general — don't rewrite it to be about whichever screen you just
checked. If a category doesn't apply to a given phase, say so and move on.

How to use: read the phase's diff in full (not just a skim — line by
line), check every box below honestly, then append a verdict to
`SESSION_HANDOFF.md`'s Handoff log. Fix anything that would crash the app
or visibly break a non-negotiable design rule. Log everything else
(nitpicks, "verify on device" items) in `TASKS.md` instead of blocking on
it.

## 1. Design-rule compliance (CLAUDE.md's 7 non-negotiables)

Check each one explicitly, don't just eyeball the screen and assume:

- [ ] **No daily streaks.** Any streak/counter in the new code counts
      *weeks*, not consecutive days. Search the diff for "streak" and
      confirm the underlying loop increments per week, not per day.
- [ ] **Streaks decay, never reset.** A miss should read as
      `Math.max(0, streak - 1)` or equivalent — never `streak = 0`. Walk
      through a concrete example by hand (see below) rather than trusting
      the shape of the code.
- [ ] **No red anywhere.** Grep the diff for `red`, `#f00`/`#ff0000`-ish
      hex, `error`, `danger`, `warning` color usage, and any cross/X
      iconography on missed items. Missed states should be a faint/dotted
      outline in an existing pale token, not a warning color.
- [ ] **Cozy/rest days are capped and visually distinct from a miss** (if
      the feature has a rest concept). Confirm the cap logic (e.g. "one
      per week") is actually enforced in the handler, not just implied by
      UI, and that its color is a different token than the "done" state
      and nowhere near red.
- [ ] **Mochi is never sad and never guilt-trips.** `sad`/`scared`/
      `confused`/`angry` poses only ever come from the user's own
      self-report (mood check-in), never as a reaction to the user
      missing/failing something. If a screen picks a Mochi pose based on
      performance, it should read the *week*, not the day, and only the
      daily core — optional modules (money, focus, workouts) must not
      feed into mascot pose.
- [ ] **Progress is actions, not outcomes.** No raw completion percentage
      framed as a grade. "N of M" or a count is fine; "73%" styled as a
      score is not.
- [ ] **Empty states invite, they don't scold.** Read the actual copy
      string for every empty state the new screen introduces. It should
      suggest a next step in a warm tone, not imply the user is behind.

## 2. Fidelity to the reference material

- [ ] For any screen/component that has an equivalent in
      `reference/bearcat_planner.jsx`, diff the *logic* (not just look and
      feel) against the original: same state machine for interactive
      elements (e.g. tap-cycle order), same formulas (streak math, totals,
      thresholds), same copy tone and, where feasible, same actual copy
      strings.
- [ ] Any deliberate deviation from the reference or from
      `reference/claude_code_prompt.md`'s literal wording is called out
      explicitly in the handoff (not silently reinterpreted) with a reason
      (e.g. "no slider dependency available, hand-built a substitute").
- [ ] Neither reference file was edited. (`git diff` should show zero
      changes under `reference/`.)

## 3. Code correctness

- [ ] **Check `which node` / `command -v node` yourself before assuming
      it's unavailable** — environments differ session to session. If
      Node.js is present: run `npm install` and `npx tsc --noEmit` for
      real and report actual output, don't eyeball it. If it's genuinely
      unavailable, say so explicitly in the verdict rather than silently
      skipping this section — a rubric pass that can't check types is
      weaker evidence than one that could.
- [ ] Balanced braces/parens/brackets in every changed file (a quick
      programmatic check, e.g. a small Python/awk scan, catches copy-paste
      truncation even without a real parser).
- [ ] No unused imports left behind after edits.
- [ ] Types line up: function signatures match how they're called
      (argument count/order/nullability); state types match what's stored
      in them; nothing silently relies on `any`.
- [ ] Null/undefined checks where the data can legitimately be
      missing (e.g. `.find()` results, optional row fields) — no
      unguarded `.foo` access on something that can be `undefined`.
- [ ] No obvious off-by-one / wrong-comparison-direction bugs in date or
      range logic — walk through a concrete example by hand (see below).

## 4. Data-layer correctness

- [ ] Every column referenced in a new `client.ts` query actually exists
      in `schema.ts`'s `CREATE TABLE` for that table, with a matching
      type/nullability.
- [ ] **Web demo parity**: for every new query/mutation added to
      `client.ts`, check whether `createWebStore()` needs a matching
      branch. If the screen is reachable on the GitHub Pages web build,
      an unhandled query there means the public demo silently shows
      broken or empty data with no error — this is easy to miss because
      nothing crashes.
  - [ ] The match condition (usually `sql.startsWith(...)` or
        `sql.includes(...)`) is checked against the **actual literal SQL
        string** used in the real query, not assumed from the function
        name — read both side by side.
  - [ ] The match condition is specific enough that it does not
        accidentally also match a different, unrelated INSERT/SELECT
        (e.g. `"INSERT INTO habits"` vs. `"INSERT INTO habit_log"` —
        check both directions: does the new pattern swallow an existing
        one, and does an existing pattern swallow the new one?).
  - [ ] Branch order in the in-memory store doesn't matter for
        correctness only if conditions are truly mutually exclusive —
        confirm that, don't assume it.
- [ ] Seed data (if `schema.ts`'s `migrate()` inserts defaults) stays
      consistent with any new columns/tables the phase adds.

## 5. Consistency with existing codebase conventions

- [ ] New screen files follow the same top-level shape as
      `app/(tabs)/index.tsx` (import grouping, `SafeAreaView` +
      `ScrollView` wrapper, `useFocusEffect`-driven `load()`, local
      `useState` mirrors of DB rows, optimistic local update after a
      write).
- [ ] Colors come from `src/theme/tokens.ts` constants — grep the diff
      for raw hex codes (`#[0-9a-fA-F]{3,6}`) outside of `tokens.ts`
      itself; anything found should be justified (e.g. a one-off `#fff`
      for text-on-color is common in this codebase and fine) not a stray
      reinvention of an existing token.
- [ ] Radius/spacing roughly matches existing values (22px cards, 99px
      chips) rather than introducing new arbitrary numbers.
- [ ] IDs are generated with the existing `uid()` helper, dates with
      `dkey()`/`weekDays()`/`addDays()` from `src/lib/dates.ts`, not
      reimplemented inline.

## 6. Honesty of the handoff

- [ ] The handoff entry's claims match what was actually done — "written"
      vs. "verified" vs. "run" are not used interchangeably.
- [ ] Anything the builder flagged as untested/uncertain is still
      genuinely untested/uncertain (spot-check at least one such claim)
      rather than a boilerplate hedge covering something that was, in
      fact, checked.
- [ ] Deviations from spec are disclosed, not buried in a generic
      "should work" statement.
- [ ] `TASKS.md`'s phase checklist matches what the code actually
      contains (nothing checked off that isn't there, nothing built left
      unchecked).

## How to hand-verify streak/decay math (do this, don't just read the code)

Pick concrete numbers and trace the loop by hand, e.g.: target = 4,
8-week lookback, most recent 4 weeks are met/met/miss/met (oldest to
newest) and the older 4 weeks have no data (0 hits, below target).

```
start streak = 0
week 8 (oldest, 0 hits < 4):  max(0, 0-1) = 0
week 7 (0 hits < 4):          max(0, 0-1) = 0
week 6 (0 hits < 4):          max(0, 0-1) = 0
week 5 (0 hits < 4):          max(0, 0-1) = 0
week 4 (met):                 0 + 1 = 1
week 3 (met):                 1 + 1 = 2
week 2 (miss):                max(0, 2-1) = 1
week 1 (met, most recent):    1 + 1 = 2
final streak = 2
```

If the code under test produces a different number for this input, that's
a real bug, not a nitpick — decaying-streak math is one of the seven
non-negotiables and worth blocking on if it's actually wrong (not just
worth logging).

## Verdict format for the handoff log

End every QA pass with one of:

- **pass** — every checklist item above either passes or doesn't apply;
  no fixes needed.
- **pass with notes** — no crash-level or design-rule-violating issues;
  minor items logged in `TASKS.md` instead of fixed now.
- **fail** — something crashes, silently breaks the public web demo, or
  visibly violates one of the 7 non-negotiable design rules. Fix it
  directly (small, scoped) before logging the verdict if it's cheap;
  otherwise log the failure clearly enough that it blocks the next phase
  from building on top of it.
