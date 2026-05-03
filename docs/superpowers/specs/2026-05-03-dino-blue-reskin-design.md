# Dino Blue Reskin — Design

**Date:** 2026-05-03
**Status:** Draft
**Reference:** flat side-profile illustration of a cute light-blue cartoon dino with orange zigzag mane, dark-blue dorsal spikes, four short legs with claw dots, sleepy single-dot eye.

## Problem

Current dino is a green upright biped (sphere body, dome head, cream belly, pink cheeks, three small back-bump cones, no mane, no claws). The reference image shows a light-blue side-profile cartoon dino with two distinct ridge features (orange mane on head/neck, darker-blue spikes along back), darker legs with claw dots, elongated horizontal body silhouette. We want the playable dino to follow this look while keeping all existing systems (mood-driven face, walk cycle, action expressions, FX overlays) intact.

## Goals

- Recolor the dino to a blue palette (light blue body, darker blue legs, kept cream belly + small pink cheeks).
- Restructure the body proportions to a stylized-biped silhouette: longer in Z, shorter in Y, head moved forward + slightly lower.
- Add an orange zigzag mane along the head + neck top.
- Add dark-blue triangular spikes along the back ridge (replaces the existing inline back bumps).
- Add small dark claw dots on each foot.
- Keep the walk cycle, mood face, expression FX (sleep-Z, bath bubbles, eat sparkle), `useFacing`, and `useDinoMotion` working without rewrites.
- Keep the pre-hatch egg green.

## Non-goals

- True quadruped pose. Reference is quadruped, but we're keeping a stylized biped (option B from brainstorming) so the existing 2-arm + 2-leg walk cycle keeps working.
- Replacing primitives with a GLB/AI-generated mesh. The brainstorm conclusion was that primitive reskin matches the flat-illustration reference better than image-to-3D would.
- Touching `face/index.tsx` internals or any expression component. Face shifts via an outer wrapper group.
- Changing the egg color or the lovebirds.
- Recoloring HUD elements (dino-themed buttons in `Onboarding.tsx`, etc.) unless a quick grep finds an obvious color reference that breaks visual cohesion.

## Design

### 1. Palette

```ts
const BODY_COLOR  = '#A8D5EE';  // light blue — body, head, arms
const BELLY_COLOR = '#FFF6E0';  // cream — small belly patch (kept)
const CHEEK_COLOR = '#FF9CB8';  // pink — tiny cheeks (kept)
const LEG_COLOR   = '#5E8FB5';  // darker blue — legs
const MANE_COLOR  = '#F5B83A';  // orange / yellow — head+neck mane cones
const SPIKE_COLOR = '#3D6F94';  // dark blue — back spikes
const CLAW_COLOR  = '#1A1A1A';  // near-black — claw dots
```

### 2. Body proportions + head pose

Old (current `DinoCute.tsx`):
- Body: `position={[0, 0.55, 0]} scale={[1.0, 0.85, 1.1]}`, sphere radius 0.45.
- Head: `position={[0, 1.05, 0.25]}`, sphere radius 0.32.

New:
- Body: `position={[0, 0.55, 0]} scale={[1.1, 0.7, 1.6]}`, sphere radius 0.45 — slightly wider, shorter, longer.
- Head: `position={[0, 0.85, 0.55]}`, sphere radius 0.32 — moved down 0.20, forward 0.30.

Belly patch (kept): adjust to follow new body — `position={[0, 0.45, 0.3]} scale={[1, 0.9, 0.5]}`, sphere radius 0.30 (slightly smaller).

Cheeks (kept tiny): follow head — `position={[-0.22, 0.80, 0.62]}` and `[0.22, 0.80, 0.62]`, scale and radius unchanged.

Legs: stay at `y = 0.2` (so `LEG_BASE_Y = 0.2` in `useDinoWalkCycle.ts` is unchanged), positions `[-0.18, 0.2, 0]` and `[0.18, 0.2, 0]` unchanged. Only material color swaps to `LEG_COLOR`.

Arms: stay at `[-0.42, 0.55, 0.05]` and `[0.42, 0.55, 0.05]` — body-relative anchor still works on the elongated body. Material color stays `BODY_COLOR`.

Tail: stays at `[0, 0.5, -0.45]` → `[0, 0.45, -0.65]` → `[0, 0.4, -0.8]`. Material stays `BODY_COLOR`. The tail-swing tip ref (`tailRef`) stays.

### 3. Face anchor — outer wrapper

`face/index.tsx` hardcodes face element positions relative to the OLD head pose (eyes at y=1.18, brows at y=1.13, etc., and ZParticles/Bubbles/Sparkle at their own absolute Y values). Rewriting all of those is risky and touches recently-merged code.

Instead, `DinoCute.tsx` wraps `<DinoFace />` in an offset group:

```tsx
{/* face — wrapped to track new head position (was [0, 1.05, 0.25], now [0, 0.85, 0.55]) */}
<group position={[0, -0.2, 0.3]}>
  <DinoFace expression={expression} />
</group>
```

That single offset shifts every face element (snout, jaw, eyes, brows, tongue, ZParticles, Bubbles, Sparkle) to follow the new head. `face/index.tsx` is untouched.

### 4. Mane component

`src/game/world/dino-cute/Mane.tsx` (new):

5 small orange `coneGeometry` cones placed in a shallow zigzag along the head-top → neck-top ridge. Cones rotated alternately ±0.25 rad on Z so adjacent cones lean opposite directions (zigzag, not a straight Mohawk).

Coordinates (head-relative, then mounted at head position via `<group position={HEAD_POS}>`):
- cone 1: `[-0.04, 0.30, -0.10]`, rot.z `+0.25`
- cone 2: `[ 0.04, 0.32, -0.05]`, rot.z `-0.25`
- cone 3: `[-0.03, 0.30,  0.02]`, rot.z `+0.25`  (top of head)
- cone 4: `[ 0.03, 0.27,  0.10]`, rot.z `-0.25`  (forehead toward snout)
- cone 5: `[ 0.00, 0.20,  0.18]`, rot.z `+0.0 `   (front-top above snout, smaller)

Cone args: `[0.045, 0.10, 8]` (radius, height, segments). Cone 5 smaller: `[0.035, 0.08, 8]`.

All castShadow. Material: `MANE_COLOR`, roughness 0.6.

API:

```tsx
type Props = { color?: string };
export function Mane({ color = '#F5B83A' }: Props) { ... }
```

Mounted in `DinoCute.tsx` inside the head wrapper group:

```tsx
<group position={[0, 0.85, 0.55]}>  {/* head + mane share head origin */}
  <mesh castShadow>
    <sphereGeometry args={[0.32, 24, 24]} />
    <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
  </mesh>
  <Mane color={MANE_COLOR} />
</group>
```

(So the head sphere also moves into the group rather than living as a sibling — slightly cleaner.)

### 5. Spikes component

`src/game/world/dino-cute/Spikes.tsx` (new):

Replaces the 3 inline back-bump cones in current `DinoCute.tsx`. 5 dark-blue cones along the back ridge from front-tall (just behind head) to rear-small (above tail):

- spike 1: `[0, 0.95, 0.25]`, cone `[0.06, 0.18, 12]` (largest, behind head)
- spike 2: `[0, 0.95, 0.05]`, cone `[0.07, 0.16, 12]`
- spike 3: `[0, 0.93, -0.15]`, cone `[0.06, 0.14, 12]`
- spike 4: `[0, 0.85, -0.35]`, cone `[0.05, 0.12, 12]`
- spike 5: `[0, 0.70, -0.55]`, cone `[0.04, 0.09, 12]` (smallest, near tail)

All castShadow, `SPIKE_COLOR`, roughness 0.7.

API:

```tsx
type Props = { color?: string };
export function Spikes({ color = '#3D6F94' }: Props) { ... }
```

Mounted in `DinoCute.tsx` as a sibling of the body — these are body-relative, not head-relative.

The 3 inline back-bump cones in current `DinoCute.tsx` (lines 149–160) are removed.

### 6. Claws component

`src/game/world/dino-cute/Claws.tsx` (new):

3 tiny near-black spheres clustered on the front face of each foot, suggesting toes/claws. Foot bottom is at y=0 (capsule center y=0.2, radius 0.1, half-length 0.1 → foot bottom at y=0).

Per foot, claws at:
- claw 1: `[-0.04, 0.05, 0.10]`, sphere radius 0.025
- claw 2: `[ 0.00, 0.05, 0.11]`, sphere radius 0.025
- claw 3: `[ 0.04, 0.05, 0.10]`, sphere radius 0.025

(Claw cluster mounted on foot front-bottom; +Z is forward.)

`CLAW_COLOR`, roughness 0.4.

API:

```tsx
type Props = {
  /** Foot center x in world units. Pass leg's x position. */
  x: number;
  color?: string;
};
export function Claws({ x, color = '#1A1A1A' }: Props) { ... }
```

Mounted twice in `DinoCute.tsx`, one per foot. Static (no animation) — kid-friendly, doesn't follow walk-cycle leg lift. Acceptable: the lift amount is small (0.06).

### 7. DinoCute.tsx final shape

```tsx
return (
  <group ref={groupRef} onPointerDown={...}>
    {/* body */}
    <mesh position={[0, 0.55, 0]} scale={[1.1, 0.7, 1.6]} castShadow>
      <sphereGeometry args={[0.45, 24, 24]} />
      <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
    </mesh>

    {/* belly patch */}
    <mesh position={[0, 0.45, 0.3]} scale={[1, 0.9, 0.5]}>
      <sphereGeometry args={[0.30, 20, 20]} />
      <meshStandardMaterial color={BELLY_COLOR} roughness={0.7} />
    </mesh>

    {/* head + mane (shared origin) */}
    <group position={[0, 0.85, 0.55]}>
      <mesh castShadow>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
      <Mane color={MANE_COLOR} />
    </group>

    {/* cheeks (head-relative absolute coords) */}
    <mesh position={[-0.22, 0.80, 0.62]} scale={[1, 0.6, 0.4]}>
      <sphereGeometry args={[0.07, 16, 16]} />
      <meshStandardMaterial color={CHEEK_COLOR} roughness={0.6} />
    </mesh>
    <mesh position={[0.22, 0.80, 0.62]} scale={[1, 0.6, 0.4]}>
      <sphereGeometry args={[0.07, 16, 16]} />
      <meshStandardMaterial color={CHEEK_COLOR} roughness={0.6} />
    </mesh>

    {/* face — wrapped to track head shift (was [0, 1.05, 0.25], now [0, 0.85, 0.55]) */}
    <group position={[0, -0.2, 0.3]}>
      <DinoFace expression={expression} />
    </group>

    {/* arms (walk cycle) */}
    <mesh ref={armLRef} position={[-0.42, 0.55, 0.05]} castShadow>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
    </mesh>
    <mesh ref={armRRef} position={[0.42, 0.55, 0.05]} castShadow>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
    </mesh>

    {/* legs (walk cycle) — y must match LEG_BASE_Y in useDinoWalkCycle.ts */}
    <mesh ref={legLRef} position={[-0.18, 0.2, 0]} castShadow>
      <capsuleGeometry args={[0.1, 0.2, 8, 16]} />
      <meshStandardMaterial color={LEG_COLOR} roughness={0.7} />
    </mesh>
    <mesh ref={legRRef} position={[0.18, 0.2, 0]} castShadow>
      <capsuleGeometry args={[0.1, 0.2, 8, 16]} />
      <meshStandardMaterial color={LEG_COLOR} roughness={0.7} />
    </mesh>

    {/* claw dots */}
    <Claws x={-0.18} color={CLAW_COLOR} />
    <Claws x={ 0.18} color={CLAW_COLOR} />

    {/* tail */}
    <mesh position={[0, 0.5, -0.45]} castShadow>
      <sphereGeometry args={[0.18, 16, 16]} />
      <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
    </mesh>
    <mesh position={[0, 0.45, -0.65]} castShadow>
      <sphereGeometry args={[0.13, 16, 16]} />
      <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
    </mesh>
    <mesh ref={tailRef} position={[0, 0.4, -0.8]} castShadow>
      <sphereGeometry args={[0.09, 16, 16]} />
      <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
    </mesh>

    {/* spikes — replaces old inline back bumps */}
    <Spikes color={SPIKE_COLOR} />

    <PlayBall />
  </group>
);
```

### 8. Egg

`src/game/world/Dino.tsx` `DinoEgg` keeps `color="#6dbf6d"` (green). No change.

### 9. Tests / acceptance

**Unit:** none. Pure visual/geometry, no logic to test.

**E2E:** existing `dino-facing.spec.ts`, `play.spec.ts`, `phase5-dino-detail.spec.ts`, `phase6-park-decor.spec.ts`, `play-ball.spec.ts`, `lovebirds-areas.spec.ts`, `lovebirds.spec.ts`, `lovebirds-stay.spec.ts`, `action-lock.spec.ts` must stay green. The geometry change does not touch any state, hook, or DOM-asserted behavior.

**Manual mobile-viewport acceptance (per `dino-qa` checklist):**

- Dino body is light-blue (`#A8D5EE`), elongated horizontal silhouette.
- Orange zigzag mane visible on head + neck top.
- Dark-blue triangle spikes visible along the back ridge.
- Legs darker blue with tiny dark claw dots.
- Belly cream patch + tiny pink cheeks still present.
- Walk cycle: arms swing, legs swing+lift, tail swings when moving with joystick or tap.
- Mood face: eyes/mouth swap when stats drop or dino is petted (verify by feeding to lower hunger first).
- Action FX: sleep Z particles appear above head when sleeping; bath bubbles appear above head when bathing; eat sparkle appears next to head when eating. All in the correct screen position relative to the new head pose.
- Egg pre-hatch is still green (existing onboarding flow).
- No regressions in lovebirds (yaw, wander, pet spin), park decor, camera pan, character toggle, area transitions.

## Architecture

```
src/game/world/dino-cute/
  DinoCute.tsx       ← MOD: palette, body/head proportions, mount Mane/Spikes/Claws,
                              wrap DinoFace, remove old back bumps
  Mane.tsx           ← NEW: 5 orange zigzag cones (head-relative)
  Spikes.tsx         ← NEW: 5 dark-blue back-ridge cones (body-relative)
  Claws.tsx          ← NEW: 3 dark spheres per foot
  PlayBall.tsx       ← unchanged
  face/              ← unchanged (wrapped from outside in DinoCute)
src/game/world/Dino.tsx        ← unchanged (egg stays green)
src/game/world/useDinoWalkCycle.ts  ← unchanged (LEG_BASE_Y still 0.2)
```

## Risks

- **Face FX absolute Y values**: ZParticles position y=1.5, Bubbles y=1.0, Sparkle y=1.22 are absolute world-relative inside `DinoFace`. The outer wrapper group `[0, -0.2, 0.3]` shifts them down 0.2 and forward 0.3. New positions will be: ZParticles y≈1.3, Bubbles y≈0.8, Sparkle y≈1.02 — still above head (head top now at y≈1.17), so visually correct. Verify in manual QA.
- **Belly patch overlap on elongated body**: belly sphere radius 0.30 with scale [1, 0.9, 0.5] fits inside the new body's belly area; verify no Z-fighting. If it pokes through, drop scale Z to 0.45.
- **Mane cone clipping with head sphere**: cones at y=0.30 (head top) clip into the head sphere by ~0.02. That's the desired "rooted in fur" look. Acceptable.
- **Claws don't follow walk lift**: legs lift by 0.06 during walk; claws stay static at y=0.05. Mismatch is small and visually unnoticeable. If it's noticeable at QA, fold claws into `<group ref={legLRef}>...</group>` so they ride the leg.
- **Tail color all uniform body-blue**: image shows tail tip in slightly darker tone. Could darken last tail segment. Skip for v1; add as follow-up if requested.
- **Onboarding/HUD color refs**: a quick grep in implementation will confirm no other file hard-codes `#7FE0B0` (the old dino color). If any does (e.g. an egg-icon button), update it inline.

## Out of scope (followups)

- Move claws into leg groups so they follow walk lift.
- Tail tip darker tone.
- Restyle pre-hatch egg to a blue speckled pattern.
- Recolor the dino-themed HUD elements.
- AI-generated GLB dino (separate spec, deferred).
