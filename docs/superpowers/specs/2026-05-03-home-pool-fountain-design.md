# Home — Pool + Fountain — Design

**Date:** 2026-05-03
**Status:** Draft
**Roadmap context:** Sub-spec **B1** of the larger restructure (see chat decomposition: A1 dino upright ✅, B1 pool+fountain (this), B2 home interior, C1 food objects, C2 seek-target actions). Visual props only — wiring to bath actions lives in C2.

## Problem

The Home area is currently a single cottage box + roof + portal on a flat ground plane. The roadmap calls for the dino to bathe in a pool and the lovebirds to bathe in a fountain. To prepare the world for the C2 seek-target overhaul, this spec adds the two world objects as static-but-animated props in the Home outdoor scene. No behavior wiring yet.

## Goals

- Add a round natural pond behind the cottage as the dino's eventual bath target.
- Add a classic 3-tier stone fountain in the front-right yard as the lovebirds' eventual bath target.
- Animate both subtly: lily pads rotating + ripple ring pulsing on the pond; jet column pulsing on the fountain.
- Keep the Home area's existing cottage + portal untouched and reachable.

## Non-goals

- Wiring either prop to the bath action — that's spec C2.
- Reusing or modifying `park-decor/Pond.tsx`. The two ponds are deliberately separate so Home's pond can diverge (stones rim, ripple ring) without touching park decor.
- Adding interaction handlers, physics, or particles. Animation is procedural (sin/scale).
- Recoloring the cottage or changing its position.
- Touching the lovebirds, dino, camera, HUD, or other areas.

## Design

### 1. Pond (behind house — dino bath)

`src/game/world/areas/home-decor/Pond.tsx` (new):

- Group anchor: `position={[0, 0.01, -6]}` — directly behind cottage (cottage center is `[0, 1, -3]`, so 3 units further back).
- Disc: `circleGeometry args={[1.6, 32]}` rotated `[-π/2, 0, 0]`, color `#5BA8C8`, roughness 0.2.
- 2 lily pads (rotated slowly):
  - lily 1: `position={[0.45, 0.02, 0.25]}`, `circleGeometry args={[0.20, 16]}`, color `#3f8a3a`, rotates `t * 0.30`.
  - lily 2: `position={[-0.55, 0.02, -0.45]}`, `circleGeometry args={[0.16, 16]}`, color `#3f8a3a`, rotates `-t * 0.25`.
- Ripple ring: thin `torusGeometry args={[1.2, 0.015, 8, 64]}` rotated `[-π/2, 0, 0]`, color `#FFFFFF`, `transparent opacity={0.35}`. `scale.setScalar` oscillates 0.55 → 1.05 over 2s sine; the visual is a wave expanding from the center toward the rim.
- Stone rim: 8 small dark spheres arranged at radius 1.7, evenly spaced (angle `i * π / 4`):
  - For each i in 0..7: `position={[Math.cos(angle) * 1.7, 0.04, Math.sin(angle) * 1.7]}`, `sphereGeometry args={[0.08, 8, 8]}`, color `#5C5854`, roughness 0.9.

Animation in a single `useFrame` reading `performance.now() / 1000` once. No state.

### 2. Fountain (front-right yard — lovebird bath)

`src/game/world/areas/home-decor/Fountain.tsx` (new):

Position `[2.5, 0, 1.5]` — front-right of cottage, well clear of the portal at `[6, 0.7, 0]`.

Geometry (all cylinders unless noted), all `castShadow`, materials `meshStandardMaterial roughness={0.8}`:

- Base bowl: `position={[0, 0.10, 0]}`, `cylinderGeometry args={[1.0, 1.0, 0.20, 24]}`, color stone grey `#B8B0A6`.
- Base water disc: `position={[0, 0.21, 0]}`, `cylinderGeometry args={[0.92, 0.92, 0.02, 24]}`, color water-blue `#5BA8C8`, roughness 0.2.
- Mid pillar: `position={[0, 0.55, 0]}`, `cylinderGeometry args={[0.15, 0.15, 0.70, 16]}`, color stone grey.
- Mid bowl: `position={[0, 0.97, 0]}`, `cylinderGeometry args={[0.50, 0.50, 0.15, 24]}`, color stone grey.
- Mid water disc: `position={[0, 1.05, 0]}`, `cylinderGeometry args={[0.45, 0.45, 0.02, 24]}`, color water-blue.
- Top pillar: `position={[0, 1.30, 0]}`, `cylinderGeometry args={[0.08, 0.08, 0.40, 16]}`, color stone grey.
- Top bowl: `position={[0, 1.55, 0]}`, `cylinderGeometry args={[0.25, 0.25, 0.10, 16]}`, color stone grey.
- Top water disc: `position={[0, 1.61, 0]}`, `cylinderGeometry args={[0.22, 0.22, 0.02, 16]}`, color water-blue.
- Center jet (animated): `position={[0, 1.86, 0]}`, `cylinderGeometry args={[0.04, 0.06, 0.50, 12]}`, color water-blue, roughness 0.2. A `useRef<Mesh>` drives `scale.y` over a 1.2s sine cycle (0.85 → 1.15), so the jet looks like it's pulsing.

Group anchor at `[2.5, 0, 1.5]`; all child meshes use group-relative coords.

### 3. `Home.tsx` integration

Modify `src/game/world/areas/Home.tsx` to import and mount the two new components after the cottage and before the portal:

```tsx
'use client';
import { Portal } from '@/src/game/world/Portal';
import { Fountain } from '@/src/game/world/areas/home-decor/Fountain';
import { Pond } from '@/src/game/world/areas/home-decor/Pond';
import { Ground } from '@/src/game/world/props/Ground';
import { Sky } from '@/src/game/world/props/Sky';

export function Home() {
  return (
    <>
      <Sky />
      <Ground color="#a98e6a" />
      <mesh position={[0, 1, -3]} castShadow>
        <boxGeometry args={[3, 2, 2]} />
        <meshStandardMaterial color="#d97a5e" />
      </mesh>
      <mesh position={[0, 2.5, -3]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.2, 1.2, 4]} />
        <meshStandardMaterial color="#7e3f2c" />
      </mesh>
      <Pond />
      <Fountain />
      <Portal to="town" position={[6, 0.7, 0]} />
    </>
  );
}
```

### 4. Architecture

```
src/game/world/areas/
  Home.tsx                  ← MOD: import + mount Pond + Fountain
  home-decor/
    Pond.tsx                ← NEW: disc + lilies + ripple ring + stone rim
    Fountain.tsx            ← NEW: 3-tier stone fountain + pulsing jet
  park-decor/
    Pond.tsx                ← unchanged (parallel implementation)
```

### 5. Tests / acceptance

**Unit:** none — pure visual / geometry.

**E2E:** existing `play.spec.ts` (Home as starting area), `phase5-dino-detail.spec.ts`, `lovebirds-areas.spec.ts`, `lovebirds-stay.spec.ts`, `dino-facing.spec.ts`, `action-lock.spec.ts` must stay green. No state, hooks, or DOM behavior changes.

**Manual mobile-viewport acceptance (per `dino-qa`):**

- Home area shows cottage + new pond behind it + new fountain to front-right.
- Pond is round, blue, behind the cottage. Two lily pads rotate slowly. A faint ripple ring expands outward.
- Stone rim (8 dark spheres) visible around the pond edge.
- Fountain stands tall in the front-right yard with three stacked stone bowls and a blue jet column on top.
- Jet column subtly pulses up/down (~1.2s cycle).
- Portal to Town still visible at front-right and reachable by tap.
- Cottage unchanged.
- No regressions in dino (T-rex pose), lovebirds (yaw/wander), camera pan, character toggle, area transitions.

## Risks

- **Pond may overlap or shadow the cottage.** Pond center `z=-6`, radius 1.6 → northern edge at `z=-7.6`. Cottage at `z=-3` extends back to `z=-4`. Gap is 2 units — no overlap.
- **Fountain may overlap the dino spawn.** Dino spawns at `[0, 0, 0]` (Home `spawn` in registry). Fountain at `[2.5, 0, 1.5]` with base radius 1.0 → fountain edge at `[1.5, 0, 1.5]` and `[3.5, 0, 1.5]`. Dino spawn 0,0 is 2.5 + 1.5 = ~2.9 units from fountain center. Clear.
- **Camera pan extent for Home is 8 in registry.** Pond at z=-6 (within ±8) and fountain at x=2.5, z=1.5 (within ±8) — both reachable when player pans. ✓
- **Transparent ripple ring may render behind opaque disc due to draw order.** If invisible in QA, set `renderOrder={1}` on the ring. Defer.
- **TreeAnimated and similar park-decor patterns use `useFrame` hooks.** New Pond + Fountain each register one `useFrame`. Two extra hooks per Home render. Mobile-cheap.

## Out of scope (followups)

- Wiring pond to dino bath action (spec C2).
- Wiring fountain to lovebirds bath action (spec C2).
- Particle splash on bath start.
- Procedural water shader / shaderMaterial.
- Cottage redesign (spec B2).
