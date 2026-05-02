# Lovebird Yaw + Camera Pan — Design

**Date:** 2026-05-03
**Status:** Draft
**Scope:** Phase-1 polish. Two independent visual/UX tweaks bundled into one spec because both are small and ship together.

## Problem

1. **Lovebirds don't turn.** Their bodies stay locked to the world axes regardless of flight direction. They look like sliding stickers, not flying birds.
2. **Camera can't pan.** `OrbitControls` runs with `enablePan={false}`, so the camera always orbits around world origin (0,0,0). When the active pet walks far from origin, the player can only zoom or rotate — they can't reposition the focus point. The world feels small and tethered.

## Goals

- Lovebirds yaw (rotate around Y) to face their direction of travel in **both** active flight mode and NPC orbit mode.
- Player can pan the camera target along the ground plane via 2-finger drag (mobile) / right-click drag (desktop).
- Pan is bounded per area so the player can't drift into the void.
- Camera auto-recenters on the active pet when the player switches characters or changes area.

## Non-goals

- Bank / roll on turn (Z-tilt). Skipped — adds complexity, not needed for the "real flying bird" feel at this scale.
- Changing the lovebird mesh. Existing primitive bird (beak at +Z) is correct as-is.
- Pitch (X-tilt) when ascending/descending. Lovebirds glide at a near-constant Y; not visible enough to bother.
- Camera follow / chase mode. Pan is player-driven, not auto.
- Replacing OrbitControls with a custom gesture handler.

## Design

### 1. Lovebird yaw

**Files touched**

- `src/lib/math.ts` (new)
- `src/game/world/useLovebirdMotion.ts`
- `src/game/world/Lovebirds.tsx`

**Mechanism**

Each bird tracks its previous frame position in a `useRef<Vector3>(new Vector3())`. After the position is updated for the current frame, compute heading from the delta:

```ts
const cur = bird.position;
const dx = cur.x - prev.current.x;
const dz = cur.z - prev.current.z;
const speed = Math.hypot(dx, dz);
if (speed > 0.001) {
  const targetYaw = Math.atan2(dx, dz); // +Z heading -> 0 rad (matches mesh forward)
  bird.rotation.y = lerpAngle(bird.rotation.y, targetYaw, Math.min(1, dt * 6));
}
prev.current.copy(cur);
```

`lerpAngle(a, b, t)` lives in `src/lib/math.ts`. It handles ±π wraparound:

```ts
export function lerpAngle(a: number, b: number, t: number): number {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}
```

**Active mode** (`useLovebirdMotion`): leader and partner already have positions driven each frame via `position.lerp(...)`. After the lerp, run the yaw block above using a leader-prev ref and partner-prev ref owned by the hook.

**NPC orbit mode** (`Lovebirds.tsx` orbit `useFrame`): same logic — read positional delta and apply yaw. The orbit math already produces a tangent velocity, so `atan2(dx, dz)` naturally gives a tangent-facing heading. Two more refs (one per bird) live alongside `leaderRef`/`partnerRef`.

**Mode switch hand-off**: when the player toggles between active and NPC mode, the prev-position ref carries over (it tracks the actual mesh position regardless of who set it last frame). No explicit reset needed.

**Mesh check**: `Lovebird.tsx` places the beak at `[0, 0.25, 0.2]` (positive Z). So `targetYaw = 0` corresponds to "facing +Z" — correct for `atan2(dx, dz)` with no offset.

**Idle case**: when `speed <= 0.001`, leave rotation untouched. Birds keep last heading rather than snapping to 0.

### 2. Camera pan + bounds

**Files touched**

- `src/game/world/areas/registry.ts` — add `extent: number` to `AreaConfig`.
- `src/game/world/World.tsx` — flip `enablePan`, mount new `<CameraRig>`.
- `src/game/world/CameraRig.tsx` (new) — clamp + recenter logic.

**OrbitControls changes**

```tsx
<OrbitControls
  makeDefault
  enablePan={true}
  screenSpacePanning={false}   // pan along ground plane, not camera plane
  maxPolarAngle={Math.PI / 2.2}
  minDistance={4}
  maxDistance={14}
/>
```

Default touch behavior matches what we want: 1-finger rotate, 2-finger drag = pan + dolly together. Default mouse: left-drag rotate, right-drag pan, wheel zoom. No additional gesture wiring.

**Per-area extent**

`AreaConfig` gains `extent: number` — half-width of the square region (in world units) the camera target may roam. Default 20. Per-area:

| area   | extent |
|--------|--------|
| home   | 8      |
| town   | 18     |
| park   | 16     |
| beach  | 18     |
| forest | 16     |
| cave   | 12     |
| sky    | 14     |

**CameraRig component**

```tsx
'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import type { Vector3 } from 'three';
import { useGame } from '@/src/game/store';
import { AREAS } from '@/src/game/world/areas/registry';
import { clampPan } from '@/src/lib/math';

type ControlsLike = { target: Vector3 } | null;

export function CameraRig() {
  const controls = useThree((s) => s.controls) as ControlsLike;
  const area = useGame((s) => s.currentArea);
  const active = useGame((s) => s.active);

  // Recenter on character switch or area change.
  useEffect(() => {
    if (!controls) return;
    const pos = useGame.getState().characters[active].position;
    controls.target.set(pos[0], pos[1] + 0.5, pos[2]);
  }, [active, area, controls]);

  // Clamp pan to area extents each frame.
  useFrame(() => {
    if (!controls) return;
    const ext = AREAS[useGame.getState().currentArea].extent;
    clampPan(controls.target, ext);
  });

  return null;
}
```

`clampPan(target, extent)` lives in `src/lib/math.ts` next to `lerpAngle`. Pure function, easy to unit-test:

```ts
export function clampPan(target: { x: number; z: number }, extent: number): void {
  if (target.x > extent) target.x = extent;
  else if (target.x < -extent) target.x = -extent;
  if (target.z > extent) target.z = extent;
  else if (target.z < -extent) target.z = -extent;
}
```

Mounted inside `<World>` after `<OrbitControls makeDefault>` so `useThree(s => s.controls)` resolves.

**Recenter Y offset**: targets `pet.y + 0.5` so the camera looks at the pet's chest, not its feet.

**Edge: zoom vs pan**: `minDistance` and `maxDistance` still bound the camera-to-target distance; pan only moves the target. No interaction.

### 3. Tests

**Unit (`tests/unit/`)**

- `lerpAngle.test.ts` — wraparound (π → -π halfway = ±π), identity (a == b returns a), clamp at t=1 returns b.
- `clampPan.test.ts` — point inside (no-op), on edge (no-op), beyond +X / -X / +Z / -Z, beyond corner (both axes clamped).

**E2E (`tests/e2e/`, mobile viewport)**

- Existing tests still pass (no regressions in tap-to-move or joystick).
- Add 1 smoke: switch active character, assert camera target tracks (expose `(window as any).__controls = controls` in dev mode for the test).

**Manual mobile-viewport sanity (dino-qa)**

- Lovebirds active mode: birds rotate to face direction when flying.
- NPC orbit (Home area, lovebirds inactive): birds face tangent of orbit, not fixed forward.
- 2-finger drag on canvas pans the world.
- Pan stops at area edges (no infinite drift).
- Switching dino ↔ lovebirds recenters camera on the new active pet.
- Walking dino with joystick: pan is independent of dino direction.
- Egg stage: no regressions; camera recenters on egg.

## Architecture

```
src/
  lib/
    math.ts                   ← NEW: lerpAngle
  game/
    world/
      areas/
        registry.ts           ← MOD: AreaConfig.extent, per-area values
      CameraRig.tsx           ← NEW: clamp + recenter
      Lovebirds.tsx           ← MOD: yaw in NPC orbit useFrame
      useLovebirdMotion.ts    ← MOD: yaw in active leader/partner
      World.tsx               ← MOD: OrbitControls.enablePan, mount CameraRig
tests/
  unit/
    lerpAngle.test.ts         ← NEW
    clampPan.test.ts          ← NEW
```

## Risks

- **OrbitControls touch hijack on tap-to-move**: 1-finger tap currently routes to `TapControls` for dino movement. OrbitControls 1-finger gesture is rotate, not pan, so no new conflict from this change. Existing behavior preserved.
- **Initial camera target**: on first hydrate, `CameraRig`'s effect fires once with hydrated `active` + `area`. If the controls ref isn't ready yet, the effect skips and the next character/area change recenters. Acceptable — initial position is `[0, 4, 8]` looking at origin, which is fine for hatching scene at home origin.
- **Lovebird yaw at exactly speed = 0**: birds don't snap to forward. They keep last heading. Visually fine.

## Out of scope (followups)

- AI-generated dino mesh (separate spec).
- Bank/roll on lovebird turn.
- Camera follow mode.
