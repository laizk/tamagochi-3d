# Dino detail + park polish — design

**Date:** 2026-05-02
**Status:** Draft (awaiting user approval)
**Touches:** `src/game/store.ts`, `src/game/systems/{interactions,tick}.ts`, `src/game/world/**`, `src/game/HUD/ActionBar.tsx`, `src/game/controls/TapControls.tsx`

## Goal

Make the dino feel alive: a real expressive face that reacts to actions, a real walk cycle, characters that face their travel direction, lovebirds that wander naturally instead of teleporting back to a cloud, and a park full of friendly background motion.

## Scope

In scope:
- Full dino face overhaul: snout, jaw with teeth, blinking eyelids, brows, nostrils, tongue.
- Action expression states for `eat / bath / sleep / play` (override mood).
- 3–5 second action animation that locks input.
- Walk cycle: alternating legs, tail sway, arm swing — driven by movement.
- Smooth facing rotation (~0.2 s lerp) on direction change for dino and lovebirds.
- Lovebirds: replace cloud-perch orbit with independent wander around a per-bird anchor (radius 3); birds keep their position when the player switches to dino.
- New `Play` action button (🎾) with ball-chase animation.
- Park: 10 decor families (butterflies, flowers, bunny, kite, clouds, animated trees, mushrooms, balloons, pond, swing).

Out of scope:
- Skin variants, new areas, or new species.
- Persistence schema migration beyond adding the `action` field (action is transient — does not need to round-trip through localStorage).
- Sound design beyond the existing `chirp` cue.

## Architecture

### State (store)

Add a per-character transient action field:

```ts
type ActionKind = 'eat' | 'bath' | 'sleep' | 'play';
type Action = { kind: ActionKind; startedAt: number; durationMs: number } | null;

// Pet now has: action: Action
```

New setters:
- `startAction(charId, kind, durationMs)` — sets `action`.
- `clearAction(charId)` — sets `action = null`.

Action is **runtime-only**: not serialized to localStorage. On load, action is always `null`.

### Action lock

While `action !== null` for the active character:
- `TapControls` ignores ground taps for that character.
- `useDinoMotion` skips the position write (body bob/bounce still apply). Walking auto-stops as a side effect: `useDinoWalkCycle` derives speed from position deltas, so a frozen position reads as idle.
- `ActionBar` buttons (including pet 🤗) render disabled (dimmed, `pointer-events-none`).

`pet` does **not** start an action — it keeps its existing 0.6 s bounce/bouncy-mood path. Only `eat / bath / sleep / play` lock. Pet is disabled in the UI during another action only because tapping a sleeping dino is confusing.

Durations: `eat 3000` · `bath 4000` · `sleep 5000` · `play 4000`.

### Action lifecycle

`tick.ts` runs once per second already. Extend it: for each character, if `action && now - action.startedAt >= action.durationMs`, call `clearAction(charId)`. No new system file.

(Sub-second cleanup is acceptable: the lock visually clears within ~1 s of the duration ending — adequate for a 3–5 s action.)

## Components

### Face — `src/game/world/dino-cute/face/`

Replaces the current `DinoEyes.tsx` and `DinoMouth.tsx`. Both old files are deleted.

- `Eyes.tsx` — sphere + pupil + sparkle + an eyelid (top hemisphere) that rotates to close.
  Variants: `open` · `half` · `closed` · `squint` · `wide`.
  Idle blink: when variant is `open` or `wide`, schedule a 150 ms close every 3–5 s (random per eye render to avoid synchronized flicker).
- `Brows.tsx` — two small box meshes above the eyes. Mood drives angle: `down-in` (sad) · `up` (surprise/play/eat) · `flat` (sleepy/bath/sleep) · `neutral`.
- `Snout.tsx` — cone protruding ~0.25 forward from the head sphere; two small dark dot meshes near the tip for nostrils.
- `Jaw.tsx` — half-sphere lower jaw hinged at the snout base, animated via `rotation.x`. Holds 4 small white cones (teeth) inside.
- `Tongue.tsx` — small pink torus segment, slid in/out via `position`.
- `index.tsx` — exports `<DinoFace mood action />`. Composes all parts. Routes `action` first; falls back to `mood`.

#### Expression table

| State    | Eyes               | Brows    | Jaw            | Tongue | Extras       |
|----------|--------------------|----------|----------------|--------|--------------|
| `happy`  | open + sparkle     | neutral  | closed         | hidden | —            |
| `sad`    | wide + tear        | down-in  | closed slight  | hidden | —            |
| `sleepy` | half               | flat     | closed         | hidden | —            |
| `bouncy` | wide               | up       | open small     | hidden | —            |
| `eat`    | open               | up       | chew @ 4 Hz    | peek   | sparkle ✨   |
| `bath`   | closed             | flat     | small "o"      | hidden | bubbles 🫧   |
| `sleep`  | closed             | flat     | open little    | hidden | Z's float    |
| `play`   | squint             | up       | open wide      | out    | —            |

Action overrides mood. `bouncy` mood remains pet's response.

#### Head shape

Keep the main head sphere; attach a snout cone forward and a hinged jaw beneath it. Eyes shift slightly forward and up to sit on the new face plane (currently at `[±0.12, 1.13, 0.45]`; new approximate `[±0.13, 1.18, 0.48]`).

### Walk cycle — `src/game/world/useDinoWalkCycle.ts`

New hook. Takes `{ armL, armR, legL, legR, tail }` refs.

- Reads `position` from the store each frame; tracks frame-to-frame delta to estimate speed.
- When `speed > 0.05`:
  - Walk frequency: 4 Hz.
  - Arms: `rotation.x = ±sin(t * 2π * 4) * 0.4`, opposite phase L/R.
  - Legs: `position.y = ±sin(t) * 0.06` plus `rotation.x` swing ±0.2, opposite phase.
  - Tail: `rotation.y = sin(t) * 0.2`.
- When idle: revert arms to the existing subtle wiggle (`Math.sin(now / 500) * 0.05`), legs to neutral, tail to its current slow sway.

`DinoCute` adds `legL` and `legR` refs to its capsule legs and wires them into this hook.

### Facing — `src/game/world/useFacing.ts`

New generic hook: `useFacing(ref, getPos)`.
- `getPos: () => [x, y, z]` so callers can pass either a store reader (dino, active leader) or a velocity tracker (NPC birds).
- Each frame: compute `dx, dz` from previous read. If `√(dx² + dz²) > 0.001`, target heading `= atan2(dx, dz)`.
- Lerp `ref.current.rotation.y` toward target heading at `Math.min(1, dt * 10)` (~0.2 s response).

Used by:
- `DinoCute` root group (store position).
- Each `Lovebird` group (active mode: store position; NPC mode: per-bird velocity).

### Lovebirds — wander rewrite

#### `useLovebirdWander(leaderRef, partnerRef)` — new hook

Runs only when `active !== 'lovebirds'`. Per-bird internal state:

```ts
{ anchor: [x, y, z]; target: [x, y, z]; pickedAt: number }
```

- Anchor capture: when the previous frame had `active === 'lovebirds'` and this frame doesn't, store the bird's current position as its anchor. On first NPC frame after mount with no anchor, snap anchor to current position.
- Target picking: random point within radius 3 of anchor; `y ∈ [1.5, 4]`. Re-pick when `dist < 0.2` or `now - pickedAt > 6 s`.
- Motion: lerp position toward target at `dt * 1.5` (gentle flight). Each bird picks independently → split allowed.

Pure helper extracted for testability:
```ts
pickWanderTarget(anchor: [number, number, number], radius: number): [number, number, number]
```

#### `useLovebirdMotion` — minor change

Active mode preserved (leader follows store, partner trails). Add facing via `useFacing` for both.

#### Removed behavior

The current orbit-cloud-perch loop in `Lovebirds.tsx` is replaced by `useLovebirdWander`. `CloudPerch` stays as a static decoration; birds no longer reference it.

### Play action — new

`interactions.ts`:
```ts
export function play(charId: CharacterId): void {
  applyStatDelta(charId, 'happy', +20);
  applyStatDelta(charId, 'energy', -10);
  startAction(charId, 'play', 4000);
}
```

`feed`, `bath`, `sleep` similarly call `startAction(charId, kind, durationMs)` after their existing stat changes. `pet` is **not** changed.

`ActionBar`:
- Add a 🎾 button calling `play(active)`.
- Available in all areas (not gated by `homeOnly`).
- All four locked-action buttons render dimmed and disabled when `action !== null`.

`PlayBall.tsx` — new component under `dino-cute/`. Renders only while the dino's `action.kind === 'play'`. Small sphere positioned ~0.5 in front of the dino, bouncing in y; uses dino position + facing rotation to stay anchored.

### Park decor — `src/game/world/areas/park-decor/`

`Park.tsx` becomes a composition that imports each decor element. The current inline tree code moves into `TreesAnimated`.

| File | Geometry | Animation | Count |
|------|----------|-----------|-------|
| `Butterfly.tsx` | 2 wing planes + body sphere | Wing flap @ 8 Hz, Lissajous loop | 4 |
| `Flowers.tsx` | Cylinder stem + 5 colored spheres | Static | 8 patches |
| `Bunny.tsx` | Body + ear cones + tail | Hop every 2 s, new random target every 4 s within ground bounds | 1 |
| `Kite.tsx` | Diamond plane + thin string cylinder | Figure-8 sway in sky, anchored to ground stake | 1 |
| `Clouds.tsx` | 3-sphere puffs | Slow X-axis drift, wraps off-screen | 4 |
| `TreesAnimated.tsx` | Existing tree geom (cylinder + cone) | `rotation.z = sin(t + phase) * 0.03`, per-tree phase | 5–7 |
| `Mushrooms.tsx` | Red dome + white dots + stem | Static | 4 patches |
| `Balloons.tsx` | Sphere + line | Drift up + sway, respawn at ground when y > 8 | 3 |
| `Pond.tsx` | Blue circle plane + 2 lily discs | Lily pads slow rotate | 1 |
| `Swing.tsx` | 2 posts + bar + seat on lines | Seat rotates `sin(t * 1.5) * 0.4` | 1 |

#### Performance budget

Approx 120 meshes total — within mobile budget. Materials are shared where colors repeat. If frame-rate dips on low-end devices, `Butterfly` and `Flowers` are the candidates for `<Instances>` from drei (deferred until measured).

## Data flow

```
ActionBar tap (eat/bath/sleep/play)
  → interactions.ts: stat deltas + startAction(charId, kind, ms)
  → store.action set
  → DinoCute reads action via store hook → DinoFace renders action expression
  → useDinoMotion sees action !== null → skips position write (lock)
  → TapControls reads action via store.getState() in onPointerDown → ignores
  → ActionBar buttons read action → render disabled
  → tick.ts (next second tick) → now - startedAt >= durationMs → clearAction
  → unlock cascades back through the same readers
```

## Testing

### Unit (Vitest, `tests/unit/`)

- `tick.ts` clears action when `now - startedAt >= durationMs`; leaves it alone otherwise.
- `pickWanderTarget(anchor, radius)` — output is within `radius` of anchor in xz, y ∈ [1.5, 4].
- `headingFromDelta(dx, dz)` — exported pure helper used by `useFacing`. Verify atan2 mapping for the four cardinal directions.
- Action override decision: a small pure function `chooseExpression(mood, actionKind)` (where `actionKind: ActionKind | null`) returning the expression key — verify action wins when set.

### E2E (Playwright mobile, `tests/e2e/`)

- Tap feed in home → action buttons disabled and dino frozen for ~3 s, then re-enabled.
- Tap 🎾 in park → ball mesh visible during action; not visible after.
- Switch to lovebirds, walk them off the cloud, switch back to dino → birds remain wandering near where they were (no teleport to cloud perch).
- Tap a far ground point → dino rotates smoothly to face the target before/while moving.

## File map

### New (20)

```
src/game/world/dino-cute/face/Eyes.tsx
src/game/world/dino-cute/face/Brows.tsx
src/game/world/dino-cute/face/Snout.tsx
src/game/world/dino-cute/face/Jaw.tsx
src/game/world/dino-cute/face/Tongue.tsx
src/game/world/dino-cute/face/index.tsx
src/game/world/dino-cute/PlayBall.tsx
src/game/world/useDinoWalkCycle.ts
src/game/world/useFacing.ts
src/game/world/useLovebirdWander.ts
src/game/world/areas/park-decor/Butterfly.tsx
src/game/world/areas/park-decor/Flowers.tsx
src/game/world/areas/park-decor/Bunny.tsx
src/game/world/areas/park-decor/Kite.tsx
src/game/world/areas/park-decor/Clouds.tsx
src/game/world/areas/park-decor/TreesAnimated.tsx
src/game/world/areas/park-decor/Mushrooms.tsx
src/game/world/areas/park-decor/Balloons.tsx
src/game/world/areas/park-decor/Pond.tsx
src/game/world/areas/park-decor/Swing.tsx
```

### Edited (10)

```
src/game/store.ts                     (action field + setters)
src/game/systems/interactions.ts      (startAction integration; play())
src/game/systems/tick.ts              (auto-clear action)
src/game/world/dino-cute/DinoCute.tsx (snout + jaw + walk refs + face composition)
src/game/world/Lovebirds.tsx          (wander replaces orbit; per-bird facing)
src/game/world/useDinoMotion.ts       (skip position write while action active)
src/game/world/useLovebirdMotion.ts   (facing wiring)
src/game/controls/TapControls.tsx     (suppress taps while action active)
src/game/HUD/ActionBar.tsx            (Play button + disabled state)
src/game/world/areas/Park.tsx         (compose decor)
```

### Deleted (2)

```
src/game/world/dino-cute/DinoEyes.tsx
src/game/world/dino-cute/DinoMouth.tsx
```

## Open risks

- **Animation budget on mobile:** 120 meshes plus per-frame transforms on butterflies, balloons, clouds, bunny, kite, and the dino's walk cycle could stutter on low-end devices. Mitigation: measure on a real phone after Park composes; fall back to drei `<Instances>` for butterflies/flowers/clouds if needed.
- **Action lock UX on slow taps:** A 5 s sleep lock can feel long if a kid changes their mind. Mitigation considered but rejected: tapping the dino during action could short-circuit it. Holding the line on cinematic feel for now; revisit if play-testing flags it.
- **Lovebird anchor on first load:** If the player starts in `home` with active = dino, birds have never been "lovebirds-active" so anchor is unset. Handled by the on-mount default: anchor snaps to current position, which itself defaults to the cloud perch on initial state. Birds wander near the cloud at first, and re-anchor whenever the player switches away from them later.
