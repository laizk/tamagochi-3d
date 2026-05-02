# Lovebirds — Second Playable Character

**Date:** 2026-05-02
**Status:** Draft (pre-implementation plan)
**Scope:** Add two baby lovebirds as a second playable character, switchable with the dino, present as NPC when not active.

---

## 1. Summary

Introduce a pair of baby lovebirds as a second playable character. The player can switch between dino and lovebirds at any time. Whichever character is not active stays in the scene as an NPC. Each character has its own stats and decays independently. The lovebirds always behave as a pair and are visually distinctive (chubby, twinkly-eyed, W-shaped mouth, rainbow gradient bodies, no black/white/gray/brown).

## 2. Goals

- Give the player a second pet to care for, with full feed/bath/sleep/pet loop.
- Keep care load meaningful but not overwhelming for a 9-year-old: separate stats, but inactive character decays at half rate.
- Maintain the "always together" rule: both birds visually, motion, and emotionally bonded.
- Reuse existing world / area / control / decay infrastructure as much as possible. No new 3D engine, no new state library.

## 3. Non-goals (v1)

- Per-area cloud perch placement (one shared offset is fine for v1).
- Multiple bird sounds (only one chirp asset).
- Bird-specific bath visual or unique sleep prop beyond the cloud.
- Breeding / egg-laying / additional birds.
- Active-bird vertical flight (Y stays ~0.5 above ground).
- Multi-character thought bubbles (only active character shows one).

## 4. Player-facing behavior

### 4.1 Switching characters

- Top-right pill HUD shows two icons: 🦖 (dino) and 🐦 (lovebirds). Active icon highlighted, inactive tappable.
- In-world: tapping the inactive character switches control to it. Tapping the active character pets it.
- On switch, the camera (OrbitControls target) eases to the new active character's position over ~0.5s.

### 4.2 Lovebirds — visuals

Two birds, identical geometry, different rainbow gradients (no black, white, gray, or brown):

- **Bird 1 (leader):** top `#FF7AB6` (pink) → bottom `#FFD86B` (yellow).
- **Bird 2 (partner):** top `#7AD3FF` (sky blue) → bottom `#9CFF7A` (lime).

Per-bird primitives:

- Body: chubby sphere, scale `[1.0, 0.9, 1.1]`, gradient via two stacked half-spheres (top + bottom colors).
- Head: smaller sphere blended with body color.
- Beak: small yellow cone pointing forward.
- Eyes: twinkly — white sclera + small dark pupil + tiny white highlight dot. Both eyes.
- Mouth: black W-shape just below beak (3 short segments or simple shaped plane).
- Wings: two flat ellipsoids per side, flap-driven by `sin(t)` in `useFrame`. ~8 Hz when flying, ~2 Hz when perched.
- Tail: tiny sphere at the back.
- No legs visible when flying; optional dot legs when perched on cloud.

Both birds always within ~0.4 world units of each other.

### 4.3 Lovebirds — movement when active

- Movement plane: ground X/Z controlled by the existing joystick / autoroam / tap controls. Y locked to ~0.5 (glide just above ground) plus a small sin-driven hover bob.
- Leader bird = bird 1 (left). Position written to `pos.lovebirds` in the store.
- Partner bird lerps toward `leaderPos + offset`, where `offset = [0.35, 0.05, -0.1]` (to leader's right and slightly behind), with small lerp delay so it visibly trails.
- Slight roll/bank on hard turns (rotate around Z by `clamp(turnRate, -0.2, 0.2)`).

### 4.4 Lovebirds — NPC behavior

When dino is active, lovebirds orbit a small floating cloud perch (one `<CloudPerch>` placed at a fixed offset, e.g. `[3, 2.5, -2]`, in `World.tsx`). Both birds circle the cloud on opposite phases of a small ellipse (`r ≈ 0.6`). Every ~8 seconds they land on the cloud for ~3 seconds (wings slow to ~2 Hz) before resuming.

**Active → NPC transition:** when the player switches away from the lovebirds, the birds smoothly ease from their current position up to the cloud orbit over ~0.8s (lerp position, ramp wing flap up). `pos.lovebirds` is left at its last ground value but is not used while NPC; the orbit reads from the cloud anchor.

**NPC → Active transition:** when the player switches to lovebirds, the leader eases from its current cloud orbit position down to ground glide height (~0.5y) over ~0.8s, then control engages. Position writes resume to `pos.lovebirds`.

### 4.5 Dino — NPC behavior

When lovebirds are active, the dino remains at its last `pos.dino`. Existing idle bob, limb wiggle, mood-driven face logic continues to run. Controls are simply not connected to it.

### 4.6 Stats and decay

Per-character `Stats { hunger, happy, energy, clean, health }`. Lovebirds share one stat sheet (the pair counts as one creature for stats).

Initial values: full (100s) at first load and on fresh start.

Decay: in each `tick()`, iterate over both characters. For each, compute the actionable-stat decay deltas via `computeDecay(seconds, multiplier * (charId === active ? 1 : 0.5))`, apply them, then recompute `health` via `computeHealth(stats)` for that character. `ageBy` runs for both characters (inactive still ages, just slower decay). Active = full rate. Inactive = half rate.

### 4.7 Interactions

All four actions accept an optional `charId`, defaulting to active:

- `pet(charId)` — `+8 happy` on charId. Fires `onPet(charId)` event. Plays chirp sound if `charId === 'lovebirds'`. Triggers happy spin animation.
- `bath(charId)` — `+50 clean`, `-5 happy`. Same for both characters.
- `sleep(charId)` — `+60 energy`. Birds visually settle on the cloud during sleep.
- `feed(food, charId)` — Food menu depends on active character:
  - Dino: existing `apple` (h25/p0), `meat` (h45/p5), `cake` (h35/p15).
  - Lovebirds: `seed` (h25/p0), `berry` (h35/p10), `mango` (h50/p15).

Petting symmetry: tapping any character (active or not) adds happy to **the petted character's** stats, not the player's active character.

For the lovebirds pair, both birds are independently tappable, but they share one stat sheet. Tapping either bird applies one `+8 happy` to the pair (no double-counting on near-simultaneous taps — debounce per pair, ~250ms). Only the tapped bird plays the spin animation; the partner does a small cheer wing-flap.

### 4.8 Onboarding

First-time / post-migration users see a one-time `WelcomeBirds` card:

> "Meet your lovebirds! These two are best friends. Tap the 🐦 button to play as them. They love seeds, berries, and mango!"

Dismissed via OK button, sets `intro.lovebirdsSeen = true`.

The existing `Onboarding` flow gains a step explaining the top-right toggle pill.

## 5. Architecture

### 5.1 Store reshape (`src/game/store.ts`)

The current shape is a single top-level `dino: Dino` record. Generalize to a `characters` map keyed by `CharacterId`. Each character keeps the existing per-pet fields (id, name, species, skinId, stage, age, stats, position).

```ts
type CharacterId = 'dino' | 'lovebirds';

type Pet = {
  id: string;
  name: string;
  species: 'dino' | 'lovebirds';
  skinId: SkinId;
  stage: 'egg' | 'baby' | 'teen' | 'adult';
  age: number;          // seconds
  stats: Record<StatKey, Stat>;
  position: [number, number, number];
};

interface GameState {
  active: CharacterId;
  characters: Record<CharacterId, Pet>;
  currentArea: AreaId;
  controlMode: ControlMode;
  lastSeenAt: number;
  settings: { soundOn: boolean; theme: ThemeId };
  intro: { lovebirdsSeen: boolean };
  version: 2;
}

interface GameActions {
  setActive(id: CharacterId): void;
  applyStatDelta(charId: CharacterId, key: StatKey, delta: number): void;
  setStat(charId: CharacterId, key: StatKey, value: Stat): void;
  setPosition(charId: CharacterId, p: [number, number, number]): void;
  ageBy(charId: CharacterId, seconds: number): void;
  setArea(a: AreaId): void;
  setControlMode(m: ControlMode): void;
  hydrate(s: GameState): void;
  touchSeenAt(): void;
}
```

All character-mutating actions become `charId`-aware. To keep call sites short, also export thin helpers `applyToActive(key, delta)`, `setActivePosition(p)`, etc., that read `active` first.

Existing `state.dino` consumers (HUD, controls, motion hooks, tests) update to `state.characters[charId]` or `state.characters[state.active]`. No backward-compatibility shim — migrate all call sites in the same change set.

### 5.2 Save migration (`src/lib/persistence.ts`)

- Bump key from `tamagochi-3d:save:v1` to `tamagochi-3d:save:v2`.
- On load:
  1. If v2 exists, load it.
  2. Else if v1 exists, migrate: copy v1 `dino` into `characters.dino` verbatim; build `characters.lovebirds` with defaults (full stats, stage `baby`, age 0, position `spawn`, species `'lovebirds'`, skin `'default'`, name `'Lovebirds'`); preserve `currentArea`, `controlMode`, `lastSeenAt`, `settings`; set `active = 'dino'` and `intro.lovebirdsSeen = false`. Back up v1 under `tamagochi-3d:save:v1.bak`, then remove the v1 key.
  3. Else fresh start with defaults (both characters full).

Migration is idempotent: re-running it with v2 already present is a no-op.

### 5.3 File layout

New files:

```
src/game/world/Lovebirds.tsx                  // orchestrator: 2 birds, NPC vs active mode
src/game/world/lovebird-cute/Lovebird.tsx     // single bird primitives
src/game/world/lovebird-cute/LovebirdEyes.tsx // twinkly mood-driven
src/game/world/lovebird-cute/LovebirdMouth.tsx// W-mouth mood-driven
src/game/world/props/CloudPerch.tsx           // small floating cloud
src/game/world/useLovebirdMotion.ts           // leader/partner motion + glide bob
src/game/systems/audio.ts                     // minimal HTMLAudioElement player
src/game/HUD/CharacterToggle.tsx              // top-right 🦖 / 🐦 pill
src/game/HUD/WelcomeBirds.tsx                 // one-time intro card
public/sounds/chirp.mp3                       // ~0.3s chirp asset
tests/unit/lovebirds-store.test.ts
tests/unit/lovebirds-decay.test.ts
tests/unit/lovebirds-interactions.test.ts
tests/unit/lovebirds-persistence.test.ts
tests/unit/audio.test.ts
tests/e2e/lovebirds.spec.ts
tests/e2e/lovebirds-areas.spec.ts
```

Modified files:

```
src/game/store.ts             // per-character shape, setActive, applyStatDelta(charId, ...)
src/lib/persistence.ts        // v1 → v2 migration
src/game/systems/tick.ts      // decay both characters; half rate for inactive
src/game/systems/interactions.ts // accept charId; bird-specific feed menu
src/game/world/World.tsx      // render Dino + Lovebirds + CloudPerch always
src/game/world/Dino.tsx       // read dino character; only attach controls when active
src/game/world/useDinoMotion.ts // (if needed) decouple from "always active" assumption
src/game/controls/index.tsx   // ActiveSceneControls writes to pos[active]
src/game/HUD/StatsBar.tsx     // show active char's stats + char icon
src/game/HUD/ActionBar.tsx    // route actions to active char; swap food menu
src/game/HUD/MiniMap.tsx      // 2 dots: active solid, inactive outlined
src/game/HUD/Onboarding.tsx   // mention toggle pill
src/app/page.tsx              // mount CharacterToggle, WelcomeBirds
```

### 5.4 Audio (`src/game/systems/audio.ts`)

```ts
import { useGame } from '@/src/game/store';

const cache = new Map<string, HTMLAudioElement>();

export function play(name: 'chirp'): void {
  if (typeof window === 'undefined') return;
  if (!useGame.getState().settings.soundOn) return;
  let a = cache.get(name);
  if (!a) {
    a = new Audio(`/sounds/${name}.mp3`);
    cache.set(name, a);
  }
  a.currentTime = 0;
  a.play().catch(() => {
    // iOS Safari blocks autoplay before first user gesture; subsequent taps work.
  });
}
```

Single asset for v1: `chirp.mp3`, short (~0.3s), royalty-free.

### 5.5 World render

`World.tsx` always renders `<Dino />`, `<Lovebirds />`, and `<CloudPerch />`. Each character component reads `useGame((s) => s.active)` and switches between active and NPC behavior internally. Controls (`ActiveSceneControls`) write to `pos[active]`.

Cloud perch placement v1: fixed offset `[3, 2.5, -2]` in every area. Per-area placement is non-goal for v1.

### 5.6 Camera

OrbitControls target eases to `pos[active]` over ~0.5s when `active` changes (use a small lerp inside a `useFrame` driven by a transition timestamp). Cap ease distance to avoid sickness; clamp travel time.

## 6. HUD details

- **CharacterToggle** (new): `fixed top-3 right-3`. Two pill buttons. Active filled, inactive outlined. Tap → `setActive(id)`.
- **StatsBar** (modified): adds a small leading icon (🦖 / 🐦) showing whose stats are on display. Bars unchanged.
- **ActionBar** (modified): feed sub-menu reads `active`; shows dino menu or bird menu accordingly. Other buttons (bath/sleep/pet) unchanged in shape, route to active.
- **MiniMap** (modified): two dots, character-colored (dino green, birds pink). Active solid, inactive outlined.
- **WelcomeBirds** (new): modal card, dismissed once, sets `intro.lovebirdsSeen`.
- **Onboarding** (modified): one extra step explaining the toggle pill.

## 7. Testing

### 7.1 Unit (Vitest)

- `lovebirds-store.test.ts` — `setActive`, per-character `applyStatDelta`, position writes are scoped to `active`.
- `lovebirds-decay.test.ts` — over N ticks, active char loses full decay; inactive char loses half. Cross-stat effects (low hunger → health drop) apply per character.
- `lovebirds-interactions.test.ts` — `pet('lovebirds')` adds 8 happy to lovebirds only; `feed('seed', 'lovebirds')` adjusts bird hunger only; bird food menu rejects dino foods and vice versa where relevant.
- `lovebirds-persistence.test.ts` — v1 → v2 migration: dino stats preserved, lovebirds default full, v1.bak created, v1 removed; idempotent on re-run.
- `audio.test.ts` — `play('chirp')` constructs no `Audio` when `soundOn=false`; constructs once and reuses on repeat calls.

### 7.2 E2E (Playwright, mobile viewport)

- `lovebirds.spec.ts` — load app, dismiss WelcomeBirds, see toggle pill, tap 🐦, joystick now drives bird position (assert via store), tap dino in world → switches back, pet birds → bird happy bar increases.
- `lovebirds-areas.spec.ts` — for each of the 7 areas, assert both characters render and cloud perch present.

### 7.3 Manual mobile sanity

`bun run show` on a real phone:

- Toggle pill is tappable, both chars render in every area, switch feels snappy.
- Chirp audible after first user gesture (ignore first failure on iOS).
- No z-fighting between birds and cloud perch.
- W-mouth + beak readable at min and max camera distance.

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| iOS Safari blocks `Audio.play()` before first user gesture | Existing `.catch(() => {})` swallows the rejection; subsequent taps work. |
| Save migration corrupts user state | One-way idempotent migration; back up v1 to `:v1.bak` before delete. |
| Camera jump on switch causes motion sickness | Smooth ease (~0.5s), cap travel distance. |
| Two animated characters in every area cause perf regressions | Wing flap + orbit are pure `sin` math, no physics. Profile with `r3f-perf` before merge. |
| W-mouth and tiny beak overlap visually messy | Position mouth slightly below beak; verify at zoom extremes. |
| Kid confused which char is active | Toggle pill highlight + StatsBar icon + slightly desaturated inactive char. |
| Inactive decay surprises user ("dino got sad while I played birds") | Half-rate inactive decay (chosen) plus WelcomeBirds copy: "Both pets need love — switch back sometimes!" |

## 9. Open questions

None blocking. Per-area cloud perch placement and additional bird sounds are deferred to a v2.

## 10. Out of scope

See §3.
