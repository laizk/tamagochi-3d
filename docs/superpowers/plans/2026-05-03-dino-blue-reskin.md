# Dino Blue Reskin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin the playable dino to match a light-blue side-profile cartoon reference (orange zigzag mane, dark-blue back spikes, darker legs with claw dots) without breaking walk-cycle, mood-face, expression FX, facing, or motion systems.

**Architecture:** Three new tiny components (`Mane`, `Spikes`, `Claws`) own their geometry and accept a color prop. `DinoCute.tsx` is the only existing file modified — palette constants swap, body/head proportions change, head + mane share an origin group, face is wrapped in an offset group so `face/index.tsx` doesn't need to change. No state, hooks, or systems are touched.

**Tech Stack:** React 19 + Next.js 16, react-three-fiber, three.js. No new deps.

**Spec:** `docs/superpowers/specs/2026-05-03-dino-blue-reskin-design.md`

---

## File Structure

**New**
- `src/game/world/dino-cute/Mane.tsx` — 5 orange zigzag cones, mounted inside the head wrapper group.
- `src/game/world/dino-cute/Spikes.tsx` — 5 dark-blue back-ridge cones, body-relative.
- `src/game/world/dino-cute/Claws.tsx` — 3 small dark spheres per foot, takes foot-x as a prop.

**Modified**
- `src/game/world/dino-cute/DinoCute.tsx` — palette constants swap, body scale + head pose updated, mount Mane/Spikes/Claws, wrap `<DinoFace/>` in an offset group, remove the 3 inline back-bump cones, recolor legs.

**Untouched**
- `src/game/world/Dino.tsx` (egg stays green)
- `src/game/world/dino-cute/face/*` (shifted via outer wrapper group)
- `src/game/world/useDinoWalkCycle.ts` (`LEG_BASE_Y` stays 0.2)
- `src/game/world/useDinoMotion.ts`, `useFacing.ts`
- All HUD, areas, lovebirds, camera

---

## Task 1: `Mane` component

**Files:**
- Create: `src/game/world/dino-cute/Mane.tsx`

- [ ] **Step 1: Create the component**

Create `src/game/world/dino-cute/Mane.tsx` with these exact contents:

```tsx
'use client';

const DEFAULT_COLOR = '#F5B83A';

type Props = {
  /** Cone material color. Defaults to mane orange. */
  color?: string;
};

/**
 * Five orange zigzag cones along the head-top + neck-top ridge.
 * Coordinates are head-relative — mount this inside the head wrapper group.
 */
export function Mane({ color = DEFAULT_COLOR }: Props) {
  return (
    <>
      <mesh position={[-0.04, 0.30, -0.10]} rotation={[0, 0, 0.25]} castShadow>
        <coneGeometry args={[0.045, 0.10, 8]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0.04, 0.32, -0.05]} rotation={[0, 0, -0.25]} castShadow>
        <coneGeometry args={[0.045, 0.10, 8]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[-0.03, 0.30, 0.02]} rotation={[0, 0, 0.25]} castShadow>
        <coneGeometry args={[0.045, 0.10, 8]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0.03, 0.27, 0.10]} rotation={[0, 0, -0.25]} castShadow>
        <coneGeometry args={[0.045, 0.10, 8]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.20, 0.18]} castShadow>
        <coneGeometry args={[0.035, 0.08, 8]} />
        <meshStandardMaterial color={color} roughness={0.6} />
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
git add src/game/world/dino-cute/Mane.tsx
git commit -m "feat(dino): add orange zigzag mane component"
```

---

## Task 2: `Spikes` component

**Files:**
- Create: `src/game/world/dino-cute/Spikes.tsx`

- [ ] **Step 1: Create the component**

Create `src/game/world/dino-cute/Spikes.tsx` with these exact contents:

```tsx
'use client';

const DEFAULT_COLOR = '#3D6F94';

type Props = {
  /** Cone material color. Defaults to spike dark-blue. */
  color?: string;
};

/**
 * Five dark-blue cones along the back ridge from front-tall (just behind head)
 * to rear-small (above tail). Body-relative — mount as a sibling of the body.
 */
export function Spikes({ color = DEFAULT_COLOR }: Props) {
  return (
    <>
      <mesh position={[0, 0.95, 0.25]} castShadow>
        <coneGeometry args={[0.06, 0.18, 12]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.95, 0.05]} castShadow>
        <coneGeometry args={[0.07, 0.16, 12]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.93, -0.15]} castShadow>
        <coneGeometry args={[0.06, 0.14, 12]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.85, -0.35]} castShadow>
        <coneGeometry args={[0.05, 0.12, 12]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.70, -0.55]} castShadow>
        <coneGeometry args={[0.04, 0.09, 12]} />
        <meshStandardMaterial color={color} roughness={0.7} />
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
git add src/game/world/dino-cute/Spikes.tsx
git commit -m "feat(dino): add dark-blue back-ridge spikes component"
```

---

## Task 3: `Claws` component

**Files:**
- Create: `src/game/world/dino-cute/Claws.tsx`

- [ ] **Step 1: Create the component**

Create `src/game/world/dino-cute/Claws.tsx` with these exact contents:

```tsx
'use client';

const DEFAULT_COLOR = '#1A1A1A';

type Props = {
  /** Foot center x in world units (pass the leg's x position). */
  x: number;
  /** Sphere material color. Defaults to near-black. */
  color?: string;
};

/**
 * Three tiny near-black spheres clustered on the front-bottom of one foot.
 * Static — does not follow the walk-cycle leg lift (lift amount is 0.06,
 * visually unnoticeable). Mount once per foot, passing the leg's x.
 */
export function Claws({ x, color = DEFAULT_COLOR }: Props) {
  return (
    <>
      <mesh position={[x - 0.04, 0.05, 0.10]} castShadow>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <mesh position={[x, 0.05, 0.11]} castShadow>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <mesh position={[x + 0.04, 0.05, 0.10]} castShadow>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.4} />
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
git add src/game/world/dino-cute/Claws.tsx
git commit -m "feat(dino): add foot claw-dot component"
```

---

## Task 4: Reskin `DinoCute.tsx`

**Files:**
- Modify: `src/game/world/dino-cute/DinoCute.tsx`

- [ ] **Step 1: Quick grep — confirm no other file hardcodes the old dino color**

Run: `grep -rn '#7FE0B0' src/ tests/ 2>/dev/null`
Expected: only matches inside `DinoCute.tsx` (or zero matches if it's been moved). If matches appear in `Onboarding.tsx`, an icon component, etc., note them — they'll need a follow-up touchup commit but do NOT block this task.

- [ ] **Step 2: Replace `DinoCute.tsx` contents**

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

const BODY_COLOR = '#A8D5EE';   // light blue
const BELLY_COLOR = '#FFF6E0';  // cream
const CHEEK_COLOR = '#FF9CB8';  // pink
const LEG_COLOR = '#5E8FB5';    // darker blue
const MANE_COLOR = '#F5B83A';   // orange
const SPIKE_COLOR = '#3D6F94';  // dark blue
const CLAW_COLOR = '#1A1A1A';   // near-black

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
      {/* body — elongated horizontal */}
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

      {/* face — wrapped to track new head position (was [0, 1.05, 0.25], now [0, 0.85, 0.55]) */}
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

      {/* legs — y must match LEG_BASE_Y in useDinoWalkCycle.ts */}
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
      <Claws x={0.18} color={CLAW_COLOR} />

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
}
```

Note what's REMOVED vs the old file:
- Three inline back-bump cones at lines 149–160 (replaced by `<Spikes/>`).
- The standalone `head` mesh at line 95–99 (now lives inside the head wrapper group with `Mane`).
- The standalone face anchor groups (now wrapped in the face offset group).

- [ ] **Step 3: Type-check**

Run: `bun run typecheck`
Expected: clean.

- [ ] **Step 4: Lint**

Run: `bun run lint:fix`
Expected: clean. (Biome may sort imports — accept that diff.)

- [ ] **Step 5: Commit**

```bash
git add src/game/world/dino-cute/DinoCute.tsx
git commit -m "feat(dino): blue palette + elongated body + mane/spikes/claws"
```

---

## Task 5: Full test suite + final hygiene

**Files:**
- (none — verification only)

- [ ] **Step 1: Unit tests**

Run: `bun run test`
Expected: all green. The dino reskin touches only geometry/materials in `DinoCute.tsx` plus the three new pure-render components — no logic changes — so existing unit tests must stay green.

- [ ] **Step 2: E2E**

Run: `bun run test:e2e`
Expected: all green. Existing dino-facing, walk-cycle, action-lock, play-ball, lovebirds, park-decor, and area-traversal specs all assert state/DOM behavior, not geometry — so they must stay green.

If any e2e fails, do NOT mark the task complete. Investigate and fix; the most likely culprit would be a test that screenshots the canvas (none currently do, but worth checking).

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

## Task 6: Manual mobile-viewport QA + open PR

**Files:**
- (none — verification only)

- [ ] **Step 1: Run dev server in mobile viewport**

Run: `bun run dev`. Open in a phone-sized viewport (Chrome DevTools mobile emulator at 390x844).

- [ ] **Step 2: Verify each acceptance criterion**

Reference: `docs/superpowers/specs/2026-05-03-dino-blue-reskin-design.md` — Section 9 (Tests / acceptance) — Manual mobile-viewport acceptance.

- [ ] Dino body is light-blue (`#A8D5EE`), elongated horizontal silhouette.
- [ ] Orange zigzag mane visible on head + neck top.
- [ ] Dark-blue triangle spikes visible along back ridge.
- [ ] Legs darker blue with tiny dark claw dots on each foot.
- [ ] Belly cream patch + tiny pink cheeks still present.
- [ ] Walk cycle: arms swing, legs swing+lift, tail swings when moving (joystick or tap).
- [ ] Mood face: eyes/mouth swap when stats drop or dino is petted (feed to lower hunger first to test).
- [ ] Action FX:
  - [ ] Sleep Z particles appear above head when sleeping.
  - [ ] Bath bubbles appear above head when bathing.
  - [ ] Eat sparkle appears next to head when eating.
- [ ] Egg pre-hatch is still green (clear localStorage `tamagochi-3d:save:v1` to retest).
- [ ] No regressions in lovebirds (yaw, wander, pet spin), park decor, camera pan, character toggle, area transitions.

- [ ] **Step 3: Stop dev server**

- [ ] **Step 4: Push branch + open PR**

```bash
git push -u origin feat/spec-dino-blue-reskin
gh pr create --title "feat(dino): blue reskin — mane, spikes, claws" --body "$(cat <<'EOF'
## Summary
Reskin the playable dino to match the side-profile cartoon reference: light-blue elongated body, orange zigzag mane, dark-blue back-ridge spikes, darker legs with tiny claw dots. Cute belly + cheeks kept.

## Implementation
- `src/game/world/dino-cute/Mane.tsx` (NEW): 5 orange zigzag cones.
- `src/game/world/dino-cute/Spikes.tsx` (NEW): 5 dark-blue back-ridge cones (replaces inline back bumps).
- `src/game/world/dino-cute/Claws.tsx` (NEW): 3 dark spheres per foot.
- `src/game/world/dino-cute/DinoCute.tsx`: blue palette, elongated body, head moved forward+down, face wrapped in offset group so `face/index.tsx` is untouched.

No state, hooks, or systems modified — walk cycle, mood face, expression FX, facing, motion, and lovebirds/camera are untouched.

Spec: `docs/superpowers/specs/2026-05-03-dino-blue-reskin-design.md`

## Test plan
- [x] Unit: full suite green (`bun run test`)
- [x] E2E: full mobile-viewport suite green (`bun run test:e2e`)
- [x] Type-check + lint clean
- [x] Manual mobile-viewport sanity (see acceptance checklist)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
