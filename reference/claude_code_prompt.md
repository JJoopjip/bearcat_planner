# Bearcat Planner — build prompt for Claude Code

## How to use this

1. Make a folder: `mkdir bearcat && cd bearcat`
2. Put these files inside it:
   - `bearcat_planner.jsx` — the working prototype, your visual reference
   - the sixteen `mochi-*.png` poses — transparent background, all normalized to a 300×300 canvas so Mochi never jumps position when the pose changes
3. Run `claude` in that folder
4. Paste everything below the line as your first message

Work in phases. Claude Code does much better with "build Phase 1, let me look, now Phase 2" than one giant request. After each phase, run it, use it for a day, then continue.

---

I want to build a personal daily planner app called **Bearcat Planner**. I'm the only user. There's a working single-file React prototype in this folder at `bearcat_planner.jsx` — read it first. It's the reference for layout, palette, copy tone, animation and every interaction. Port that feel faithfully.

The five `mochi-*.png` files in this folder are the mascot. **Do not draw or generate any character art** — use these images only.

## Stack

An **Expo (React Native) app targeting iOS**, using:

- Expo SDK with `expo-router` for bottom-tab navigation
- `expo-sqlite` for local storage — everything stays on device, no accounts, no backend, no sync
- `expo-image` for the mascot pose images
- `react-native-reanimated` for the mascot motion
- TypeScript

Expo rather than a web app for one reason: Apple Health is only readable from a native iOS app, and I want that eventually. Set the project up so adding `react-native-health` later is easy, but **do not build the Health integration yet.**

## What the app is

A gentle daily planner combining habits, long-term goals, mood, money and focus time, with a pink bearcat named Mochi whose pose reflects the time of day and how my week is going.

## Non-negotiable design rules

These matter more than any feature. Most habit apps get abandoned in week three because they punish you. Do not let these slip:

1. **No daily streaks.** Habits use weekly targets (e.g. 4×/week). Streaks count *weeks*, not days.
2. **Streaks decay, never reset.** Miss a week and the counter drops by one, never to zero.
3. **No red anywhere.** Missed days are a faint dotted outline. Never a warning colour, never a cross.
4. **One "cozy day" per habit per week** — a rest token filling the square in muted lilac. Deliberate rest must look different from failure.
5. **Mochi is never sad and never guilt-trips.** There is no sad pose and you must not invent one. Mochi reads my *week*, not my day, and only the daily core. Optional modules can never affect the mascot.
6. **Progress is measured in actions I control, never outcomes.** Nothing may show a completion percentage for a goal whose outcome isn't mine to decide.
7. **Empty states invite, they don't scold.** Copy the prototype's tone.

## The mascot

Sixteen poses, each a separate PNG, all on an identical 300×300 canvas with a transparent background. Decorations belonging to a pose (thought bubbles, Zzz and moon, lightbulb, sweat drops, book, mugs, yarn ball, pencil) are already baked into the file. **Never draw, generate, recolour or composite anything onto these images.**

`angry` `sad` `scared` `confused` `happy` `icecream` `drink` `love` `reading` `playing` `thinking` `waving` `exercising` `thumbsup` `sleeping` `peeking`

**Mochi's own state.** Pick with this precedence — first match wins:

| Pose | When |
|---|---|
| `sleeping` | After 9pm, any day. Also the meditation timer. |
| `waving` | Before 11am and nothing logged yet today. |
| `love` | Today's daily core is done and the week is going well (weekly habit progress over 50%). |
| `thumbsup` | Weekly habit progress over 40%. Also on Habits when every target is met. |
| `happy` | Default. Also the small marker on the quest path. |
| `reading` | Focus timer running. |
| `thinking` | Quests screen header. |
| `playing` | Habits header when not every target is met yet. |
| `peeking` | App loading state — Mochi peers over the bottom edge. |

**`angry`, `sad`, `scared` and `confused` are never Mochi's own state.** They appear only in the mood check-in, where *I* am reporting how *I* feel — self-expression, not the app judging me. Never use them as feedback on my performance. There is no state in which the app shows me an unhappy mascot because I missed something.

**Other placements.** Mood check-in buttons, low to high: `sad` `scared` `confused` `happy` `love`. Quick-log buttons: `reading` (Focus), `sleeping` (Breathe), `exercising` (Workout), `drink` (Money), `thinking` (Dump). Spare: `icecream` and `angry` — `icecream` suits a reward or treat moment.

**Mood is expressed around the artwork, not by changing it.** Each pose gets a soft circular backdrop tint and its own motion:

| Pose | Tint | Motion |
|---|---|---|
| `happy` `love` `drink` | `#FBDCE8` `#FAD0DE` `#EDF0DC` | gentle bob, 3.4s |
| `waving` | `#FAD3E4` | rocks side to side |
| `thumbsup` `exercising` `playing` | `#FBE7C4` `#FBDDD2` `#FBE0D6` | hop on a spring curve |
| `sleeping` | `#E6DFF3` | slow breathing scale |
| `reading` `thinking` | `#E3F0EA` `#FBEFC9` | slow sway |
| `peeking` | `#FBE4EC` | rises and settles |
| `sad` `scared` `confused` | `#DCE5F2` `#E6E6F2` `#EFE7F0` | gentle bob |

Extras: `love` and `thumbsup` emit four small confetti pieces, stage 2 adds a slow dashed halo, stage 3 adds three orbiting dots. Respect the OS reduce-motion setting by disabling all of it.

## Feature tiers

Respect this tiering — it's what keeps the app usable long-term.

**Daily core (~30 seconds, the whole Today screen)**
- "Today I am ___" single-line intention
- Mood check-in: 5 faces, one tap
- Max 3 priorities for today, hard capped at 3
- Habit chips: tap once = done, twice = cozy day
- One small win — free text, the day's evidence

**As it happens (only touched when it occurs, never an empty slot)**
- Focus timer: 15/25/50 min with an optional tag (study / applications / admin / making)
- Meditation timer: same engine, 3/5/10/20 min, slow breathing animation
- Workout log: type chip (run/gym/yoga/walk/other) plus minutes. **Minutes and type only — no weight, no calories.**
- Money entry: amount, in/out, category. Income splits into "shift income" vs "other income" because my income is uneven.
- Brain dump inbox: park anything so Today stays at three things

**Weekly**
- Sunday reflection: three prompts (proud of / learned / one thing next week)

## Screens

**Today** — Mochi hero with the week's progress bar, then the daily core, then a horizontal row of "as it happens" quick buttons opening bottom sheets.

**Habits** — One card per habit: emoji, name, "3 of 4 this week", week-streak badge, and a 7-square week grid you can backfill. Add-habit form with a 1–7 weekly target slider. Nudge me toward 4–5 habits maximum.

**Quests** — Long-term goals taking months. Each has a name, an **intention card** in present-tense identity language ("I'm someone who reaches out before I feel ready"), **milestones** that are steps within my control, a **moves made** counter that only increases, and an **evidence log** of dated one-line entries proving the intention is true. Quests can be **pinned** (offers "one small move today?" on Today and pulls the next milestone into my priorities) or **resting** (goes quiet, never decays, explicitly different from failing). Visualise each as a winding pastel path with milestone stops and Mochi standing at the furthest one reached.

**Money** — Period selector (month / quarter / half / year), in/out/kept totals, horizontal category bars. One computed insight: average spend on low-mood days versus good days, since mood is already logged.

**Me** — Year in pixels (365 squares, one per day, coloured by that day's mood), total focus / meditation / workout minutes, Sunday reflection, and Mochi's corner.

## Berries and scenes

- **Berries** (currency): habit done +3, cozy day +1, mood check-in +1, small win +3, focus or meditation session +5, workout +5, quest milestone +25. Note a small win still earns berries on a day with zero habits done — showing up counts.
- **Scenes**, not outfits: berries buy a circular pastel backdrop behind Mochi — Blossom 30, Garden 60, Night sky 120, Cafe corner 250. Build these from flat colour plus a few small dots. **Never draw anything onto the mascot artwork.**
- A good later addition: unlock extra poses with berries rather than only scenes, since `icecream` and `angry` are unused by default.
- **Growth stages**: 3 stages unlocked by **quest milestones**, not habit streaks. Stage 2 adds the dashed halo, stage 3 adds orbiting dots. Growth should mean something real happened.

## Design tokens

The palette is a fixed Pantone spec. Use these exact values:

```
--pink       #EA96B4   Pantone 2333 C          body
--pink-pale  #F8CEDE   Pantone 2331 U          belly, snout, fills, tracks
--pink-deep  #EA768E   Pantone 701 C           ears, pads, primary action
--ink        #5A285A   Pantone 2627 C          eyes, and all text
--line       #230F23   Pantone Neutral Black C outlines
--blush      #F08080   Pantone 7416 C          cheeks, warm accent
```

Supporting colours, not part of the spec: `--bg #FFF4F8`, `--card #FFFFFF`, `--cream #FFF8F3`, `--lilac #C9B6E4` (cozy days and rest), `--mint #A8DCC6` (positive amounts), `--butter #F9E1A8` (celebration), `--ink-soft #A184A1`, `--path #F6DCE7`, `--pixel #F7E6EE`.

Text is `--ink`, never pure black. Type: **Baloo 2** for headings and numbers, **Nunito** for body. Radius 22px on cards, 99px on chips. Shadows are soft pink, never grey.

Mood colours, low to high: `#CBD8EC` `#D9CDEA` `#F6E3B8` `#F9C2D6` `#F295B8` — the low end is a calm blue, never a warning colour.

**Tab bar**: emoji icons 🏠 Today, 🌸 Habits, 🗺️ Quests, 🪙 Money, 🎀 Me. Emoji can't be recoloured, so soften them: desaturate to about 55% and lift brightness slightly, drop inactive tabs to 60% opacity, and give the active one a soft pink circular chip behind it that lifts and scales up. Keep this treatment — don't substitute an icon library, and don't replace them with the mascot.

Everywhere else in the UI, use the mascot stickers rather than emoji. The only exception is the habit chips, where I pick an emoji per habit myself.

## Build order

**Phase 1** — Project setup, SQLite schema, tab navigation, and the Mochi component: all sixteen poses loading from the PNGs, with the backdrop tint and per-pose animation. Put it on a placeholder screen with buttons to switch pose so I can check every one before anything else is built.

**Phase 2** — Today screen, complete daily core, working persistence, the pose-selection logic including the time-of-day rules, the sticker mood check-in, and the sticker quick-log row.

**Phase 3** — Habits screen with weekly targets, decaying streaks, cozy days.

**Phase 4** — Quests, including the winding path and the evidence log.

**Phase 5** — Money and Me screens, year in pixels, berries and scenes.

**Phase 6** — Local notifications: one gentle evening check-in, opt-in, and it must never mention a broken streak or use guilt language.

**Later, only if I ask** — Apple HealthKit via `react-native-health` for steps, sleep and workouts. Note that Suunto's cloud API needs a registered developer app and a publicly reachable server, and exposes no sleep data at all, so it's a much bigger job than HealthKit and probably not worth it.

## Working style

Clean readable TypeScript, small components. Ask me before adding any dependency. Don't add features I didn't ask for. Stop at the end of each phase and let me try it before continuing.
