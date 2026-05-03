# Dino Upright + T-Rex Arms — Design

**Date:** 2026-05-03
**Status:** Draft
**Predecessor:** PR #8 (`feat(dino): blue reskin — mane, spikes, claws`) — established Mane / Spikes / Claws components and the elongated-horizontal body. This spec walks back the horizontal body to a T-rex stance and replaces the arm spheres with two-segment T-rex arms.

## Problem

Current dino body is elongated horizontal (`scale={[1.1, 0.7, 1.6]}`) with sphere arms at the sides. The user wants a T-rex-style upright pose: body taller, slight forward lean, head perched on top jutting slightly forward, with iconic tiny T-rex arms (upper-arm + bent forearm + claw dots) jutting from the upper chest and animating naturally with the walk cycle and idle wiggle.

## Goals

- Restore an upright body (taller than wide, comparable to the original DinoCute proportions).
- Apply a small forward lean (~7°) to the upper body / torso for the T-rex profile, while keeping the legs vertical so the dino still stands stably on the ground.
- Replace the two side-mounted arm spheres with two `TRexArm` components, each rendering an upper-arm sphere + a bent forearm sphere + 3 claw dots.
- Keep the existing walk-cycle swing on the arms by using the forearm as the moving ref (`armLRef` / `armRRef` continue to drive `rotation.x` + `rotation.z`).
- Preserve all systems: mood face, action FX, walk cycle, useFacing, useDinoMotion, mane, back spikes, foot claws, tail, belly, cheeks, egg.

## Non-goals

- Adding any new behavior (food-seeking, navigation, area changes — those are later C1/C2 specs).
- Touching the lovebirds, camera, areas, or HUD.
- Restructuring the egg pre-hatch.
- Changing palette colors. The PR #8 palette stays.
- Replacing the walk-cycle hook. Refs migrate from arm spheres to forearm meshes; cycle code unchanged.
- Removing the head wrapper group introduced in PR #8 — it carries the mane and stays in this spec.

## Design

### 1. Body proportions + torso lean

Old (current `DinoCute.tsx` after PR #8):
- Body: `position={[0, 0.55, 0]} scale={[1.1, 0.7, 1.6]}`, sphere radius 0.45.
- Head: `position={[0, 0.85, 0.55]}`.
- Cheeks: `[±0.22, 0.80, 0.62]`.
- Face wrapper offset: `[0, -0.2, 0.3]`.
- Arms: side-mounted sphere meshes at `[±0.42, 0.55, 0.05]`.

New:
- Body: `position={[0, 0.55, 0]} scale={[1.0, 1.0, 1.1]}`, sphere radius 0.45.
- Head: `position={[0, 1.05, 0.30]}` (back near pre-PR-#8 vertical position, plus a small +0.05 z bias so the snout reads forward when leaned).
- Cheeks: `[±0.22, 1.00, 0.37]` (follows head delta).
- Face wrapper offset: `[0, 0, 0.05]` (face hardcoded coords were tuned to old head `[0, 1.05, 0.25]` → new head `[0, 1.05, 0.30]` is delta `(0, 0, +0.05)`).
- Belly: `position={[0, 0.5, 0.18]} scale={[1, 0.9, 0.4]}`, sphere radius 0.32 (back to pre-PR-#8 belly).

A new inner `<group rotation={[0.12, 0, 0]}>` wraps the leaned-torso geometry only:
- body, belly, head wrapper (with mane), cheeks, face wrapper, spikes, both `TRexArm`.

Outside the lean group (root-direct children, vertical):
- legs, foot claws, tail, `<PlayBall/>`.

This keeps the legs square to the ground (stable stance) and the tail at its proper altitude. The lean carries the upper body, head, and arms forward into a T-rex silhouette.

```
<group ref={groupRef}>                 ← root (motion, facing, click)
  <group rotation={[0.12, 0, 0]}>      ← torso lean (~7°)
    body
    belly
    <group position={[0, 1.05, 0.30]}> ← head wrapper
      head sphere
      <Mane/>
    </group>
    cheek L, cheek R
    <group position={[0, 0, 0.05]}>    ← face wrapper (delta from old head)
      <DinoFace expression={expression}/>
    </group>
    <Spikes/>
    <TRexArm x={-0.30} forearmRef={armLRef} ... />
    <TRexArm x={+0.30} forearmRef={armRRef} ... />
  </group>
  leg L (ref legLRef)
  leg R (ref legRRef)
  <Claws x={-0.18}/>
  <Claws x={+0.18}/>
  tail x3 (last is ref tailRef)
  <PlayBall/>
</group>
```

### 2. `TRexArm` component

`src/game/world/dino-cute/TRexArm.tsx` (new):

A small group with three meshes: upper-arm, forearm (with forwarded ref), and three claw dots. Coordinates are arm-anchor-relative (the parent supplies the world `x` of the chest side; y / z are baked in).

Geometry (all body-relative, mounted as a child of the leaned torso group):
- Upper-arm sphere: `position={[x, 0.70, 0.32]}`, sphere radius 0.07.
- Forearm sphere: `position={[x, 0.55, 0.42]}`, sphere radius 0.06. Bent forward + down from the upper arm.
- Three claw dots clustered at the forearm tip:
  - `[x - 0.03, 0.50, 0.50]`
  - `[x + 0.00, 0.50, 0.51]`
  - `[x + 0.03, 0.50, 0.50]`
  - sphere radius 0.018 each.

Materials: upper + forearm = `BODY_COLOR` (light blue), claws = `CLAW_COLOR` (near-black). Roughness 0.7 / 0.7 / 0.4.

API:

```tsx
type Props = {
  /** Chest-side world x (use ±0.30). */
  x: number;
  color?: string;        // body-color sphere material
  clawColor?: string;    // claw-dot material
  /** Forearm mesh ref so walk-cycle can rotate it. */
  forearmRef?: RefObject<Mesh | null>;
};

export function TRexArm({
  x,
  color = '#A8D5EE',
  clawColor = '#1A1A1A',
  forearmRef,
}: Props) {
  return (
    <>
      {/* upper-arm */}
      <mesh position={[x, 0.70, 0.32]} castShadow>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* forearm — driven by walk cycle */}
      <mesh ref={forearmRef ?? undefined} position={[x, 0.55, 0.42]} castShadow>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* 3 claw dots */}
      <mesh position={[x - 0.03, 0.50, 0.50]} castShadow>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color={clawColor} roughness={0.4} />
      </mesh>
      <mesh position={[x, 0.50, 0.51]} castShadow>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color={clawColor} roughness={0.4} />
      </mesh>
      <mesh position={[x + 0.03, 0.50, 0.50]} castShadow>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color={clawColor} roughness={0.4} />
      </mesh>
    </>
  );
}
```

### 3. Walk-cycle integration

`useDinoWalkCycle.ts` is unchanged. The hook drives `armL.current.rotation.x` (forward swing) and `armL.current.rotation.z` (idle sway) on whatever mesh `armL` references. We migrate the ref from the old side-arm sphere to the new forearm sphere by passing `forearmRef={armLRef}` into `<TRexArm />`.

The forearm mesh pivots around its own center (sphere center), not at the elbow. With the small swing amplitudes (`WALK_ARM_AMP = 0.4`, idle `0.05`), the visual is "forearm waggle", which reads as T-rex bobbing rather than full elbow rotation. If during manual QA the swing looks weird (forearm shears off the upper-arm), the fix is one line: wrap the forearm mesh in a group whose origin is at the elbow, ref the group, and the forearm sphere displaces from there. Defer until QA.

### 4. Cheeks + face anchor math

- Old head Y was `0.85`; new head Y is `1.05`. Old face wrapper offset was `[0, -0.2, 0.3]` (which converted face hardcoded coords from old absolute head `[0, 1.05, 0.25]` to PR #8 head `[0, 0.85, 0.55]`).
- New head is `[0, 1.05, 0.30]`. Delta from face hardcoded coords (which still target `[0, 1.05, 0.25]`) is `(0, 0, +0.05)`. So new face wrapper offset is `[0, 0, 0.05]`.
- Cheeks were `[±0.22, 0.80, 0.62]` after the +`(0, -0.2, 0.3)` PR #8 shift. Reverting to head-side cheeks at the new head pose: cheeks at the head's left/right side, slightly forward of the head sphere. New cheek pos `[±0.22, 1.00, 0.37]` (Y matches head 1.05 minus 0.05, Z matches head 0.30 plus 0.07 to push to face front).

### 5. Files

```
src/game/world/dino-cute/
  TRexArm.tsx           ← NEW
  DinoCute.tsx          ← MOD: body scale, head pos, cheek pos, face offset,
                                wrap torso in lean group, replace arms with TRexArm
  Mane.tsx              ← unchanged
  Spikes.tsx            ← unchanged
  Claws.tsx             ← unchanged
  PlayBall.tsx          ← unchanged
  face/                 ← unchanged
src/game/world/useDinoWalkCycle.ts  ← unchanged
src/game/world/useDinoMotion.ts     ← unchanged
src/game/world/useFacing.ts         ← unchanged
src/game/world/Dino.tsx             ← unchanged (egg stays green)
```

### 6. Tests / acceptance

**Unit:** none — pure visual/geometry.

**E2E:** existing `dino-facing.spec.ts` (which reads `__getDinoRotationY` from `groupRef`), `play.spec.ts`, `phase5-dino-detail.spec.ts`, `phase6-park-decor.spec.ts`, `play-ball.spec.ts`, `lovebirds*.spec.ts`, `action-lock.spec.ts` must all stay green. `groupRef` is the root group, unaffected by the lean group inside it.

**Manual mobile-viewport acceptance (per `dino-qa`):**

- Body is upright (taller than wide), slightly forward-leaning (~7°).
- Head clearly on top of body, snout reading slightly forward.
- Two T-rex arms jutting forward from upper chest. Each shows: upper-arm, bent forearm, 3 dark claw dots.
- Forearms swing forward/back when walking (joystick or tap-walk).
- Forearms gently sway sideways when idle.
- Mane (orange), spikes (dark blue), foot-claw dots, tail, belly cream, pink cheeks all still in correct positions.
- Legs are vertical (not leaned). Walk-cycle leg lift+swing unchanged.
- Tail still at back at proper altitude (not leaned forward).
- Mood face: eyes/mouth react to stat changes and pet (feed dino to lower hunger, observe).
- Action FX still appear in correct screen positions:
  - Sleep Z above head (head top now ~y=1.37; ZParticles base y=1.5 + face wrapper +0.05 → world y≈1.55, above head — good).
  - Bath bubbles cycle around head (Bubbles base y=1.0 + 0.05 → 1.05 cycling 1.05–1.65; head top 1.37 — bubbles cycle from chest to above head, reads correctly).
  - Eat sparkle next to head (Sparkle y=1.22 + 0.05 → 1.27, near head — good).
- Egg pre-hatch is still green.
- No regressions in lovebirds, park decor, camera pan, character toggle, area transitions.

## Risks

- **Forearm swing pivots on sphere center, not elbow.** Could read as detached forearm if amplitudes are too high. Current `WALK_ARM_AMP = 0.4` is small; should be fine. Manual QA decides.
- **Front-most back spike is occluded by head after lean.** With head at `[0, 1.05, 0.30]` (radius 0.32) and spike 1 of `Spikes.tsx` at body-relative `[0, 0.95, 0.25]`, after the 0.12-rad lean the spike's tip lands inside the head sphere (~0.075 from head center). Three.js depth-test will hide spike 1 from front view; spike will still be visible from back/side. Acceptable: the head naturally covers the base of the back ridge from the front, which reads correctly. `Spikes.tsx` stays unchanged. Verify in manual QA — if the missing-from-front spike reads wrong, the follow-up fix is to drop spike 1 in `Spikes.tsx` (out of scope here).
- **Face FX absolute positions inside `face/index.tsx`.** With new face wrapper offset `[0, 0, 0.05]` (smaller delta than PR #8's `[0, -0.2, 0.3]`), the FX coordinates are very close to their pre-PR-#8 values — Z-particles at y≈1.55, Bubbles at 1.05–1.65, Sparkle at 1.27. All read above/around head. Verify in manual QA.
- **Tail stays unleaned**, so torso top tilts forward but tail stays pointing back at the same altitude. Visually this is correct for a T-rex (tail counterbalances forward lean), but if a kid sees a "broken-spine" effect, the fix is to bring the rear-most spike outside the lean group (so the spine continues smoothly into the tail). Defer to QA.

## Out of scope (followups)

- Reach-forward arm motion when food nearby (lands in the C2 seek-target spec).
- Tail-tip darker tone.
- Bigger / more sculpted T-rex jaw geometry.
- Re-animating the lovebirds in T-rex stance (they're separate species).
