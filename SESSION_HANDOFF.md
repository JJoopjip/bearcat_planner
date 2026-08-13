# SESSION_HANDOFF.md

**Last updated:** 2026-08-10, by a Claude Code session (chat-based, no
Node.js available in its environment — see "Environment constraints"
below). Read `CLAUDE.md` first if you haven't; it explains the hygiene
rule that keeps this file current.

## tl;dr for the next agent

Phase 1 is done. Phase 2 (Today screen) is **half** done — the daily core
works, but the "as it happens" quick-log row (focus timer, meditation+sleep
log, workout log, money entry, brain-dump inbox) doesn't exist yet, even
though the spec calls it out as part of Phase 2. That's the highest-value
next task, followed by actually running the project for the first time
(see below — this has never been done). Full detail in `TASKS.md`.

## What's been done, and how sure we are it works

| Area | Status | Confidence |
|---|---|---|
| Expo/TS project setup, `expo-router` tabs, SQLite schema | Written | Not run — see below |
| Mochi component, all 16 poses, precedence logic | Written | Not run |
| Today: intention, mood, priorities, habits, one small win | Written, persists to SQLite | Not run |
| Me: Apple Health widgets (steps/HR/exercise/sleep) | Written | Not run, and can only ever be tested on a real device with a paid Apple account (see README) |
| Habits / Quests / Money screens | Placeholder only | N/A |
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
   whatever `tsc`/`expo start` surface
2. Build the Today screen's "as it happens" quick-log row + bottom sheets
   (finishes Phase 2)
3. Port Habits screen (Phase 3)
4. Port Quests screen (Phase 4)
5. Port Money screen + finish Me screen's remaining cards (Phase 5)

## Handoff log

- **2026-08-10** — Initial scaffold (Phase 1 + partial Phase 2 + Health
  widgets), pushed to GitHub, EAS workflow set to manual-only after a
  failed auto-run. Created this file, `CLAUDE.md`, `TASKS.md`, and copied
  the two reference files into `reference/` for self-containment. —
  Claude Code (chat session, no Node.js access)
