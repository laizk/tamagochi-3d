# Dino Upright + T-Rex Arms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the dino's upright body, add a small forward torso lean for the T-rex profile, and replace side arm spheres with two-segment T-rex arms (upper + bent forearm + 3 claw dots) without touching the walk-cycle, mood-face, expression FX, facing, or motion systems.

**Architecture:** One new tiny component (`TRexArm`) owns its geometry and forwards a `forearmRef` so the existing walk cycle drives the forearm. `DinoCute.tsx` is the only existing file modified — body proportions revert toward upright, an inner `<group rotation={[0.12, 0, 0]}>` wraps the leaned-torso geometry (body+belly+head+cheeks+face+spikes+arms) while legs+tail+claws stay outside the lean (vertical / ground-anchored). Face hardcoded coords are tracked via the same `<group position={...}>` wrapper trick used in PR #8.

**Tech Stack:** React 19 + Next.js 16, react-three-fiber, three.js. No new deps.

**Spec:** `docs/superpowers/specs/2026-05-03-dino-upright-trex-design.md`

---

## File Structure

**New**
- `src/game/world/dino-cute/TRexArm.tsx` — group rendering upper-arm sphere + forearm sphere (with forwarded ref) + 3 claw dots. Takes `x`, `color`, `clawColor`, `forearmRef`.

**Modified**
- `src/game/world/dino-cute/DinoCute.tsx` — body scale + head pos updated, cheeks moved, face wrapper offset reduced, inner lean group wraps the torso, arm spheres replaced with two `<TRexArm/>` instances, the `armLRef` / `armRRef` refs are passed in as `forearmRef`.

**Untouched**
- `src/game/world/useDinoWalkCycle.ts` (drives the same arm refs, now pointing at forearm meshes instead of side spheres)
- `src/game/world/dino-cute/Mane.tsx`, `Spikes.tsx`, `Claws.tsx`, `PlayBall.tsx`, `face/*`
- `src/game/world/Dino.tsx` (egg stays green)
- All HUD, areas, lovebirds, camera, motion/facing hooks

---

## Task 1: `TRexArm` component

**Files:**
- Create: `src/game/world/dino-cute/TRexArm.tsx`

- [ ] **Step 1: Create the component**

Create `src/game/world/dino-cute/TRexArm.tsx` with these exact contents:

```tsx
'use client';

import type { RefObject } from 'react';
import type { Mesh } from 'three';

const DEFAULT_COLOR = '#A8D5EE';
const DEFAULT_CLAW_COLOR = '#1A1A1A';

type Props = {
  /** Chest-side world x (use ±0.30). */
  x: number;
  /** Body-color sphere material. Defaults to dino blue. */
  color?: string;
  /** Claw-dot material. Defaults to near-black. */
  clawColor?: string;
  /** Forearm mesh ref so walk-cycle can rotate it. */
  forearmRef?: RefObject<Mesh | null>;
};

/**
 * Two-segment T-rex arm: upper-arm sphere, bent forearm sphere (driven by
 * walk cycle via `forearmRef`), and three small claw dots at the forearm tip.
 * Body-relative coordinates — mount inside the leaned torso group.
 */
export function TRexArm({
  x,
  color = DEFAULT_COLOR,
  clawColor = DEFAULT_CLAW_COLOR,
  forearmRef,
}: Props) {
  return (
    <>
      {/* upper-arm */}
      <mesh position={[x, 0.7, 0.32]} castShadow>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* forearm — driven by walk cycle */}
      <mesh ref={forearmRef ?? undefined} position={[x, 0.55, 0.42]} castShadow>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* 3 claw dots at forearm tip */}
      <mesh position={[x - 0.03, 0.5, 0.5]} castShadow>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color={clawColor} roughness={0.4} />
      </mesh>
      <mesh position={[x, 0.5, 0.51]} castShadow>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color={clawColor} roughness={0.4} />
      </mesh>
      <mesh position={[x + 0.03, 0.5, 0.5]} castShadow>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color={clawColor} roughness={0.4} />
      </mesh>
    </>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `bun run typecheck`
Expected: clean.

- [ ] **Step 3: Lint**

Run: `bun run lint:fix`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/game/world/dino-cute/TRexArm.tsx
git commit -m "feat(dino): add T-rex arm component"
```

---

## Task 2: Restructure `DinoCute.tsx` (upright + lean + new arms)

**Files:**
- Modify: `src/game/world/dino-cute/DinoCute.tsx`

- [ ] **Step 1: Replace `DinoCute.tsx` contents**

Replace the entire contents of `src/game/world/dino-cute/DinoCute.tsx` with:

```tsx
'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { Group, Mesh } from 'three';
import { useGame } from '@/src/game/store';
import { chooseExpression } from '@/src/game/systems/expression';
import { onPet, pet } from '@/src/game/systems/interactions';
import { getMood, type Mood } from '@/src/game/systems/mood';
import { useDinoMotion } from '@/src/game/world/useDinoMotion';
import { useDinoWalkCycle } from '@/src/game/world/useDinoWalkCycle';
import { useFacing } from '@/src/game/world/useFacing';
import { Claws } from './Claws';
import { DinoFace } from './face';
import { Mane } from './Mane';
import { PlayBall } from './PlayBall';
import { Spikes } from './Spikes';
import { TRexArm } from './TRexArm';

const BODY_COLOR = '#A8D5EE'; // light blue
const BELLY_COLOR = '#FFF6E0'; // cream
const CHEEK_COLOR = '#FF9CB8'; // pink
const LEG_COLOR = '#5E8FB5'; // darker blue
const MANE_COLOR = '#F5B83A'; // orange
const SPIKE_COLOR = '#3D6F94'; // dark blue
const CLAW_COLOR = '#1A1A1A'; // near-black

const TORSO_LEAN_X = 0.12; // ~7° forward lean

const NEVER_PETTED = Number.POSITIVE_INFINITY;

export function DinoCute() {
  const groupRef = useRef<Group>(null);
  const armLRef = useRef<Mesh>(null);
  const armRRef = useRef<Mesh>(null);
  const legLRef = useRef<Mesh>(null);
  const legRRef = useRef<Mesh>(null);
  const tailRef = useRef<Mesh>(null);

  const lastPetAtRef = useRef<number>(NEVER_PETTED);

  useEffect(() => {
    const unsub = onPet((charId) => {
      if (charId === 'dino') lastPetAtRef.current = performance.now();
    });
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    // E2E hook: read-only rotation accessor for tests asserting facing.
    (window as unknown as Record<string, unknown>).__getDinoRotationY = () =>
      groupRef.current?.rotation.y ?? null;
  }, []);

  const [mood, setMood] = useState<Mood>('happy');

  useFrame(() => {
    const stats = useGame.getState().characters.dino.stats;
    const last = lastPetAtRef.current;
    const secondsSincePet =
      last === NEVER_PETTED ? Number.POSITIVE_INFINITY : (performance.now() - last) / 1000;
    const next = getMood({ stats, secondsSincePet });
    if (next !== mood) setMood(next);
  });

  const action = useGame((s) => s.characters.dino.action);
  const expression = chooseExpression(mood, action?.kind ?? null);

  useDinoMotion(groupRef, 0);
  useDinoWalkCycle({
    armL: armLRef,
    armR: armRRef,
    legL: legLRef,
    legR: legRRef,
    tail: tailRef,
  });
  useFacing(groupRef, () => useGame.getState().characters.dino.position);

  return (
    <group
      ref={groupRef}
      onPointerDown={(e) => {
        e.stopPropagation();
        const a = useGame.getState().characters.dino.action;
        if (a !== null) return;
        const active = useGame.getState().active;
        if (active !== 'dino') useGame.getState().setActive('dino');
        else pet('dino');
      }}
    >
      {/* torso lean — body, belly, head+mane, cheeks, face wrapper, spikes, arms */}
      <group rotation={[TORSO_LEAN_X, 0, 0]}>
        {/* body — upright */}
        <mesh position={[0, 0.55, 0]} scale={[1.0, 1.0, 1.1]} castShadow>
          <sphereGeometry args={[0.45, 24, 24]} />
          <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
        </mesh>

        {/* belly patch */}
        <mesh position={[0, 0.5, 0.18]} scale={[1, 0.9, 0.4]}>
          <sphereGeometry args={[0.32, 20, 20]} />
          <meshStandardMaterial color={BELLY_COLOR} roughness={0.7} />
        </mesh>

        {/* head + mane (shared origin) */}
        <group position={[0, 1.05, 0.3]}>
          <mesh castShadow>
            <sphereGeometry args={[0.32, 24, 24]} />
            <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
          </mesh>
          <Mane color={MANE_COLOR} />
        </group>

        {/* cheeks (head-relative absolute coords) */}
        <mesh position={[-0.22, 1.0, 0.37]} scale={[1, 0.6, 0.4]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color={CHEEK_COLOR} roughness={0.6} />
        </mesh>
        <mesh position={[0.22, 1.0, 0.37]} scale={[1, 0.6, 0.4]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color={CHEEK_COLOR} roughness={0.6} />
        </mesh>

        {/* face — wrapped to track new head position (was [0, 0.85, 0.55], now [0, 1.05, 0.30]) */}
        <group position={[0, 0, 0.05]}>
          <DinoFace expression={expression} />
        </group>

        {/* spikes — body-relative, follow torso lean */}
        <Spikes color={SPIKE_COLOR} />

        {/* T-rex arms — chest-side, forearm refs driven by walk cycle */}
        <TRexArm x={-0.3} color={BODY_COLOR} clawColor={CLAW_COLOR} forearmRef={armLRef} />
        <TRexArm x={0.3} color={BODY_COLOR} clawColor={CLAW_COLOR} forearmRef={armRRef} />
      </group>

      {/* legs — vertical, NOT leaned. y must match LEG_BASE_Y in useDinoWalkCycle.ts */}
      <mesh ref={legLRef} position={[-0.18, 0.2, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.2, 8, 16]} />
        <meshStandardMaterial color={LEG_COLOR} roughness={0.7} />
      </mesh>
      <mesh ref={legRRef} position={[0.18, 0.2, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.2, 8, 16]} />
        <meshStandardMaterial color={LEG_COLOR} roughness={0.7} />
      </mesh>

      {/* claw dots on feet */}
      <Claws x={-0.18} color={CLAW_COLOR} />
      <Claws x={0.18} color={CLAW_COLOR} />

      {/* tail — ground-anchored, NOT leaned */}
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

      <PlayBall />
    </group>
  );
}
```

Key changes vs the post-PR-#8 file:
- Body scale `[1.1, 0.7, 1.6]` → `[1.0, 1.0, 1.1]`.
- Head position `[0, 0.85, 0.55]` → `[0, 1.05, 0.30]`.
- Cheek position Y `0.80` → `1.00`, Z `0.62` → `0.37`.
- Belly Y `0.45` → `0.50`, Z `0.30` → `0.18`, sphere radius `0.30` → `0.32`.
- Face wrapper offset `[0, -0.2, 0.3]` → `[0, 0, 0.05]`.
- New `<group rotation={[TORSO_LEAN_X, 0, 0]}>` wrapping body+belly+head+cheeks+face+spikes+arms.
- Old side arm sphere meshes (lines 116–122) replaced by two `<TRexArm/>` instances. The `armLRef` / `armRRef` refs now flow through `forearmRef` into the forearm mesh inside `TRexArm`.
- `<Spikes/>` and `<Claws/>` placement order reorganized: spikes inside lean group (body-relative), claws outside (foot-relative).

- [ ] **Step 2: Type-check**

Run: `bun run typecheck`
Expected: clean.

- [ ] **Step 3: Lint**

Run: `bun run lint:fix`
Expected: clean. (Biome may sort imports — accept.)

- [ ] **Step 4: Commit**

```bash
git add src/game/world/dino-cute/DinoCute.tsx
git commit -m "feat(dino): upright body + 7° torso lean + T-rex arms"
```

---

## Task 3: Full test suite

**Files:**
- (none — verification only)

- [ ] **Step 1: Unit tests**

Run: `bun run test`
Expected: all green. The dino restructure is geometry/material only — no logic changes.

- [ ] **Step 2: E2E**

Run: `bun run test:e2e`
Expected: all green. Existing dino-facing, walk, action-lock, play-ball, lovebirds, park-decor, and area specs all assert state/DOM behavior — geometry change should not affect them. The `__getDinoRotationY` window hook still reads root group rotation, so dino-facing tests must keep passing.

If any e2e fails, do NOT mark complete — investigate.

- [ ] **Step 3: Final type-check + lint**

Run in parallel:
- `bun run typecheck`
- `bun run lint:fix`

Expected: clean. If `lint:fix` made changes, commit:

```bash
git add -A
git status   # verify only formatting changes
git commit -m "chore: lint:fix" || true
```

---

## Task 4: Manual mobile-viewport QA + open PR

**Files:**
- (none — verification only)

- [ ] **Step 1: Run dev server in mobile viewport**

Run: `bun run dev`. Open in a phone-sized viewport (Chrome DevTools mobile emulator at 390x844).

- [ ] **Step 2: Verify each acceptance criterion**

Reference: `docs/superpowers/specs/2026-05-03-dino-upright-trex-design.md` — Section 6 (Tests / acceptance) — Manual mobile-viewport acceptance.

- [ ] Body upright (taller than wide), slight forward lean (~7°).
- [ ] Head clearly on top of body, snout reading slightly forward.
- [ ] Two T-rex arms jutting forward from upper chest. Each shows: upper-arm, bent forearm, 3 dark claw dots.
- [ ] Forearms swing forward/back when walking (joystick or tap-walk).
- [ ] Forearms gently sway sideways when idle.
- [ ] Mane (orange), back spikes (dark blue), foot-claw dots, tail, belly cream, pink cheeks all in correct positions.
- [ ] Legs vertical (not leaned), walk-cycle leg lift+swing unchanged.
- [ ] Tail still at back at proper altitude (not leaned forward).
- [ ] Mood face: eyes/mouth react to stat changes and pet (feed dino to lower hunger first).
- [ ] Action FX appear in correct positions:
  - [ ] Sleep Z particles above head when sleeping.
  - [ ] Bath bubbles cycle around head when bathing.
  - [ ] Eat sparkle next to head when eating.
- [ ] Egg pre-hatch is still green (clear `tamagochi-3d:save:v1` to retest).
- [ ] No regressions in lovebirds (yaw, wander, pet spin), park decor, camera pan, character toggle, area transitions.
- [ ] Front-most back spike (spike 1) may be partially occluded by head — acceptable; only flag if it reads visually wrong.
- [ ] Forearm swing pivots around forearm center — should still read as T-rex arm wave. If it looks "detached", flag for follow-up.

- [ ] **Step 3: Stop dev server**

- [ ] **Step 4: Push branch + open PR**

```bash
git push -u origin feat/spec-dino-upright
gh pr create --title "feat(dino): upright body + T-rex arms" --body "$(cat <<'EOF'
## Summary
First sub-spec (A1) of the larger dino restructure. Restores upright body proportions, adds a small ~7° forward torso lean for the T-rex profile, and replaces the side arm spheres with two-segment T-rex arms (upper + bent forearm + 3 claw dots).

## Implementation
- `src/game/world/dino-cute/TRexArm.tsx` (NEW): two-segment arm + 3 claws, takes `forearmRef` so walk cycle drives the forearm.
- `src/game/world/dino-cute/DinoCute.tsx`: body scale + head pose updated, cheeks moved, face wrapper offset reduced, inner `<group rotation={[0.12, 0, 0]}>` wraps the leaned torso. Legs + tail + foot-claws stay outside the lean (vertical / ground-anchored).

No state, hooks, or systems modified. Walk cycle unchanged — `armLRef` / `armRRef` now point at the forearm meshes.

Spec: `docs/superpowers/specs/2026-05-03-dino-upright-trex-design.md`
Plan: `docs/superpowers/plans/2026-05-03-dino-upright-trex.md`

## Test plan
- [x] Unit: full suite green (`bun run test`)
- [x] E2E: full mobile-viewport suite green (`bun run test:e2e`)
- [x] Type-check + lint clean
- [x] Manual mobile-viewport sanity (see acceptance checklist)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
