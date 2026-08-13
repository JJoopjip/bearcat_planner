# IMPROVEMENT_ADVICE.md

Market/competitive research and strategic advice, written 2026-08-13 while
Phases 3–5 (Habits, Quests, Money+Me) were freshly built and QA'd. This is
a standalone advice document, not a build log — it doesn't replace
`SESSION_HANDOFF.md`'s "what's next" (get it running on real Node.js/Xcode
is still the top engineering priority). This is about product direction:
what the market says about apps like this one, and what to protect, add,
or refuse as the app grows.

Owner context: solo, non-technical, built this as a personal tool. Advice
below assumes "personal tool first," with commercial angle flagged
separately and clearly optional.

---

## What's working / worth protecting

These are design choices already in `CLAUDE.md` that the research
independently validates. The risk to them isn't that they're wrong — it's
that six months from now, a plausible-sounding feature request will erode
one of them a little at a time. Treat this section as a checklist to
re-read before saying yes to anything that touches Habits, Quests, or
Mochi's pose logic.

- **No daily streaks / streaks decay instead of resetting.** This is the
  single most consistent complaint across the whole category. Multiple
  2026 write-ups on why habit trackers get abandoned point to the exact
  mechanic Bearcat Planner refuses to build: "one slip causes the streak
  to reset to zero... the app quietly becomes a source of guilt instead of
  support" — researchers call the follow-on effect the "what-the-hell
  effect," where a broken streak makes people quit entirely rather than
  just miss a day (togetherwithkai.com, habitpath.xyz). Apps launching
  *right now* explicitly market against this: "Streak-Free" and "CalmTrack:
  Cozy Habit Tracker" exist purely to sell the "no guilt, momentum not
  reset" pitch bearcat already ships natively. This app doesn't need a
  marketing page to say it — the mechanic itself is the pitch.
- **No red, no warning colors, dotted-not-crossed misses.** Confirmed by
  the same research: shame-coded visual language (red X's, broken chain
  icons) is called out repeatedly as what turns a tracker into an anxiety
  source. Bearcat's dotted pale outline for a miss is a genuinely rare
  choice — most competitors still use red or grey-strikethrough.
- **Cozy days, visually distinct from misses.** Finch's core mechanic —
  "missing a day doesn't punish you, your bird just waits" — is the
  closest direct comparable, and Finch is not a niche app: 4.9 stars
  across ~1.3M combined App Store + Play ratings as of Aug 2026, with
  reviewers specifically saying "this is the first self-care app I've
  kept using" after bouncing off others. Cozy days are bearcat's version
  of the same insight, applied to habits specifically (Finch's version is
  looser/pet-based). Keep the *one per week, capped* rule — an uncapped
  "always fine to skip" reads as no accountability at all, which is a
  different failure mode.
- **Max 3 priorities / nudge toward 4-5 habits max.** Directly answers a
  named cause of abandonment: "almost every abandoned habit tracker fails
  for the same two reasons: too many habits at once, and no social
  accountability" (habit-tracker-fail blog roundups, 2026). Bearcat
  already solves the first half by design. Don't let this cap quietly
  disappear if "add unlimited habits" ever gets requested — it's load
  bearing, not a limitation to fix later.
- **Progress as actions, not outcomes/percentages.** No comparable app in
  this research does this cleanly — even Habitica, which claims to be
  "gamified" rather than punitive, still tracks HP loss for missed dailies,
  and its own reviews say the "HP loss mechanic creates anxiety instead
  of motivation." Bearcat's refusal to ever show a completion percentage
  for something outside the user's control is more disciplined than any
  comparable app found in this research.
- **Money insight framed as observation, not judgment** ("On low-mood
  days you spend about $X... Worth noticing," no red, no "overspending"
  language). No budget app found in this research (Copilot, Cleo, Monarch)
  does mood-correlated spending at all — Cleo's whole personality is
  built around a chatbot that "roasts your spending," which is the exact
  opposite instinct. This is a genuinely novel, differentiated feature,
  and it's already built in a way that avoids the shame trap other money
  apps lean into for engagement. Don't let anyone talk you into adding
  color-coded "you overspent" framing later — the neutral framing *is*
  the feature.

## Gaps vs. comparable apps

Real, specific things users of comparable apps expect that bearcat
currently doesn't have. None of these violate the design philosophy —
they're plumbing/accessibility gaps, not feature-bloat.

- **Widgets and quick-log speed.** 2026 coverage of habit trackers treats
  home-screen widgets and Apple Watch complications as close to table
  stakes now ("apps with Apple Watch complications score higher because
  they offer quick entry methods... under 5 seconds," multiple 2026 habit
  tracker roundups). Bearcat's whole "daily core in ~30 seconds" premise
  is exactly the kind of app that benefits from a lock-screen widget for
  the mood check-in or a single habit chip — this is arguably *more*
  aligned with bearcat's philosophy than most trackers', since a
  frictionless one-tap log from the lock screen removes exactly the kind
  of friction that turns "forgot to open the app" into a missed day. Not
  urgent (native build isn't even running yet), but worth keeping on the
  long-term list once the app is actually running on a device.
- **The Today screen's "as it happens" row is still unbuilt** (per
  `SESSION_HANDOFF.md`) — this isn't a market gap so much as the app's own
  spec being incomplete, but it's worth naming here too: the fast,
  low-friction one-tap logging habit trackers succeed on ("Streaks"
  users specifically praise how few taps a check-in takes) is exactly
  what Money/Workout/Focus logging currently lacks, since they only live
  on their own full screens. Finishing Phase 2 closes a real usability
  gap, not just a spec-completeness one.
- **Syncing across devices.** Not a design-rule conflict (still on-device,
  still no accounts) but worth naming: several Streaks reviews complain
  about watch/widget sync inconsistency, and separately, "no social
  accountability" is named as one of the two most common reasons trackers
  get abandoned. Bearcat deliberately has no backend and no accounts —
  that's a feature, not a bug, for a personal single-device tool — but if
  the owner ever gets a second device (new phone, iPad), there's currently
  no story for moving data over except manual iOS backup/restore. Worth a
  one-time "how do I move this to a new phone" note in the README even
  without building sync, just so it's not a nasty surprise on a hardware
  upgrade.
- **Reminder/notification timing control.** Phase 6 (not started) is
  exactly this. Once built, comparable apps' reviews suggest the bar is
  "prompts at the right time without being annoying, customizable, easy to
  snooze" — the spec already commits to "opt-in, no guilt language," which
  is the harder and rarer part to get right; the timing/snooze mechanics
  are the easy part by comparison.
- **A way to *see* all 16 Mochi poses before they show up organically.**
  This was in the original Phase 1 spec and got explicitly skipped for
  time (`TASKS.md`). It's cheap, harmless, and directly useful for the
  next step (verifying poses look right on a real device) — worth
  reviving as a low-effort settings-screen easter egg ("meet Mochi") even
  outside its original QA purpose.

## Quick wins

Small, cheap, high-visible-polish items:

1. **Finish the Phase 1 "pose gallery" screen** (skipped for time, still
   in `TASKS.md`). A few hours of work, makes the app feel considered
   rather than unfinished the first time it's opened, and doubles as a
   settings/about screen home.
2. **Promote the two hardcoded hex colors to `tokens.ts`** (`#5FB595` used
   in both `money.tsx` and `me.tsx`, flagged twice in QA notes as a
   nitpick, never fixed). Ten-minute fix, removes a "we know but didn't
   do it" item that's been logged three times now.
3. **Restore or explicitly cut the "Moving" (workout minutes) stat** on
   Me's "Time you've given yourself" card — currently silently dropped
   vs. the reference prototype, flagged in QA but not resolved. Either
   choice is fine; leaving it undecided is the only bad option, since it's
   an undisclosed deviation from the reference right now.
4. **A one-screen "meet Mochi" / about page** doubles as the pose gallery
   above and gives the app an identity moment — comparable apps in this
   category (Finch especially) lean hard into mascot personality as the
   emotional hook, and bearcat has the asset (16 poses) already paid for
   but not shown off anywhere outside organic use.
5. **A short "moving to a new phone" note in README** — cheap, prevents a
   real "oh no, is my data gone" moment later, given there's no
   sync/backend by design.

## Bigger bets (optional, long-term — only if the owner ever wants more than a personal tool)

Flagged explicitly as optional. None of this should happen before the app
is even running on a real device.

- **The Quests screen is the most differentiated single feature found in
  this entire research pass.** Nothing in the comparable-app research
  combines "long-term identity-framed goals" with "no failure state,
  resting ≠ quitting" the way bearcat's Quests do. The nearest things
  found (RPGLife.ai, PORTAL, Life Quest Journal) are XP/skill-tree/RPG
  systems layered onto to-do lists — mechanically similar surface
  (a "path," milestones) but philosophically opposite: they gamify with
  points/levels/loss-aversion, which is exactly the punishment-adjacent
  pattern bearcat's design rules exist to avoid. If there's ever a
  commercial angle, Quests — not Habits — is the wedge: "goal tracking
  that doesn't panic when you pause" is a real, searched-for, currently
  under-served niche.
  a scene shop with a small IAP layer would be the least-invasive way to
  monetize without touching the no-guilt mechanics at all — Finch's own
  monetization (Finch Plus subscription, cosmetic-adjacent) is the
  closest working precedent, though note its Trustpilot score (2.4/5,
  labelled "Poor") is dragged down specifically by *subscription/billing*
  complaints, not the core app — a lesson to keep any future monetization
  simple and transparent (one-time purchase over subscription, no
  price-parity gaps across platforms like Finch has today between iOS and
  Android).
- **Widgets/Watch complications**, discussed above as a gap, would also be
  the single most-requested feature if this ever had outside users, per
  every 2026 habit-tracker comparison found in this research.

## What NOT to add

An explicit warning list — these are the exact anti-patterns this app's
own design rules exist to prevent, and they're also the patterns that
generate the *worst* reviews for comparable apps, so there's no upside
case for any of them:

- **Daily streaks, or any all-or-nothing counter that resets to zero.**
  This is the single most-cited cause of habit-tracker abandonment found
  in this research. Already forbidden by rule 1/2 — just flagging that
  this is not a hypothetical risk, it's the #1 documented failure mode of
  the entire category.
- **Red/warning color coding on anything**, including "helpful" ones like
  a red budget-overspend indicator on Money. Already forbidden by rule 3;
  the Money screen's neutral spend-insight copy is currently the app's
  best example of resisting this — protect it specifically if a future
  request says "can you highlight when I overspend."
- **A sad/disappointed Mochi pose tied to missed habits or goals**, or any
  path where an optional module (money, sleep, workouts) feeds Mochi's
  pose. Already forbidden by rule 5 and independently confirmed clean in
  every QA pass logged in `SESSION_HANDOFF.md` — the risk isn't that this
  exists today, it's a "just this once" request later (e.g. "can Mochi
  look tired if I haven't slept enough" — sleep is optional-module data,
  and this would violate the rule even framed gently).
- **HP/health-loss mechanics or any lose-able resource tied to inaction.**
  Habitica's own users cite its HP-loss mechanic as creating "anxiety
  instead of motivation" — this is a real, documented complaint about the
  single most direct RPG-comparable app in the whole category, not a
  hypothetical risk.
- **Engagement-bait or guilt-adjacent push notifications** ("You haven't
  logged in 3 days!", "Your bearcat misses you!" framed as sad rather than
  neutral). Phase 6's own spec already commits to "no guilt language, no
  streak mentions" — hold that line even under pressure to "just add one
  reminder that mentions the streak, it's more effective." It measurably
  is more effective at engagement and measurably is what makes people
  quit trackers for good, per the "what-the-hell effect" research above.
- **Ads, or any monetization that depends on time-on-app or notification
  frequency**, if the commercial angle is ever explored. This would create
  a direct incentive to weaken the anti-guilt design (more notifications,
  more streak pressure = more sessions = more ad revenue) — structurally
  opposed to the app's whole premise. If monetized at all, keep it a flat
  one-time or cosmetic purchase (scenes, poses), the way `TASKS.md`
  already envisions with the berries economy, never anything tied to
  engagement metrics.
- **Social/leaderboard/comparison features.** Not currently planned, and
  worth actively declining if requested — "no social accountability" is
  cited as a reason trackers get abandoned, but the alternative research
  surfaced (guild/community features) comes with its own failure mode:
  Habitica's own removal of guilds/Tavern in 2023 was cited as a loss by
  users who valued that community, meaning social features are a real
  maintenance and moderation burden, not a quick add — reasonable to skip
  entirely for a single-user personal tool, and worth resisting even if
  the app goes commercial later, since it cuts against the "no comparison,
  no guilt" premise this app is built around.

---

*Research method: web search across App Store/Play Store review
summaries, Reddit-adjacent blog roundups (2025-2026), and direct
comparison of Finch, Habitica, Streaks, RPGLife.ai/PORTAL/Life Quest
Journal (RPG-style goal apps), and Copilot/Cleo (money apps) against this
app's design rules in `CLAUDE.md`. No app store reviews were read
verbatim in full — findings reflect aggregator/blog summaries of review
themes, which is a real limitation; treat specific star-rating figures as
approximate/current-as-of-search-date rather than independently
re-verified.*
