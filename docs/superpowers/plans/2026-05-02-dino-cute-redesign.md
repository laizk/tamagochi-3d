# Dino Cute Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current static green-sphere dino with a primitives-built "cute dino" whose eyes, mouth, and posture react to its mood (driven by the existing five-stat needs system and pet events).

**Architecture:** A pure `getMood` function maps `(stats, secondsSincePet)` → one of four moods. A new `<DinoCute>` R3F component composes ~17 primitive meshes (body, head, belly, cheeks, eyes, mouth, arms, legs, tail, back-bumps) and feeds the mood into mood-aware `<DinoEyes>` and `<DinoMouth>` subcomponents. A shared `useDinoMotion` hook drives bob, pet-bounce, and sad-lean for both the pre-hatch egg and the post-hatch dino. No new assets, no GLB.

**Tech Stack:** TypeScript, React 19, react-three-fiber, drei, three.js, Zustand (existing store), Vitest (unit), Playwright (e2e), Bun, Biome.

---

## Repo context (read once before starting)

- This worktree is at `worktrees/feat-dino-cute/`, branch `feat/dino-cute`, cut from `origin/main`.
- The current `src/game/world/Dino.tsx` is a single green sphere with inline bob/bounce/sad-lean (no hook, no egg-vs-hatched split). It is what we replace.
- Stage transition exists in the store: `dino.stage` flips from `'egg'` → `'baby'` when the user finishes onboarding (see `src/game/HUD/Onboarding.tsx:35`). Today the visual is the same sphere either way; we'll branch on stage after this plan.
- Pet event bus: `onPet(listener)` / `pet()` in `src/game/systems/interactions.ts`. Listeners get called when the user taps the Pet action button.
- Stats live at `useGame.getState().dino.stats` with keys `hunger | happy | energy | clean | health`, all 0–100.
- A separate branch `feat/dino-glb` is open against main with a different visual approach (T-Rex GLB). If it merges first, this plan still works — Task 6 is a wholesale replacement of `Dino.tsx`. The rebase conflict is straightforward: delete the GLB-related code and `public/models/dino/`, then apply Task 6's `Dino.tsx`.

## File map (decomposition lock-in)

Files created:

- `src/game/systems/mood.ts` — pure `getMood` function + `Mood` and `MoodInputs` types.
- `src/game/world/dino-cute/DinoCute.tsx` — root group: composes anatomy, subscribes to stats + pet events, computes mood, renders eye/mouth, drives limb wiggle.
- `src/game/world/dino-cute/DinoEyes.tsx` — mood-aware eye assembly (4 variants).
- `src/game/world/dino-cute/DinoMouth.tsx` — mood-aware mouth (4 variants).
- `src/game/world/useDinoMotion.ts` — shared motion hook (bob + pet-bounce + sad-lean), extracted from current `Dino.tsx`.
- `tests/unit/mood.test.ts` — 8-case table-driven test for `getMood`.

Files modified:

- `src/game/world/Dino.tsx` — split into `DinoEgg` (the existing sphere, retained as pre-hatch placeholder) + `DinoCute` (post-hatch). Both share `useDinoMotion`.

No files deleted. Asset cleanup from the spec (`public/models/dino/t-rex.glb`) does not apply on this base branch — those files do not exist here.

---

## Task 1: Pure `mood.ts` module (TDD)

**Files:**
- Create: `src/game/systems/mood.ts`
- Test: `tests/unit/mood.test.ts`

- [ ] **Step 1.1: Write the failing tests**

Create `tests/unit/mood.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getMood } from '@/src/game/systems/mood';

const fullStats = { hunger: 100, happy: 100, energy: 100, clean: 100, health: 100 };

describe('getMood', () => {
  it('returns happy when all stats are full and no recent pet', () => {
    expect(getMood({ stats: fullStats, secondsSincePet: Infinity })).toBe('happy');
  });

  it('returns sleepy when energy is below 40 and no other stat is critical', () => {
    expect(
      getMood({ stats: { ...fullStats, energy: 30 }, secondsSincePet: Infinity }),
    ).toBe('sleepy');
  });

  it('returns sad when any non-energy stat is below 25', () => {
    expect(
      getMood({ stats: { ...fullStats, hunger: 20 }, secondsSincePet: Infinity }),
    ).toBe('sad');
  });

  it('prefers sad over sleepy when both apply', () => {
    expect(
      getMood({
        stats: { ...fullStats, hunger: 20, energy: 30 },
        secondsSincePet: Infinity,
      }),
    ).toBe('sad');
  });

  it('returns bouncy within 1s after a pet, regardless of stats', () => {
    expect(getMood({ stats: fullStats, secondsSincePet: 0.5 })).toBe('bouncy');
    expect(
      getMood({ stats: { ...fullStats, hunger: 20 }, secondsSincePet: 0.5 }),
    ).toBe('bouncy');
  });

  it('returns to non-bouncy after 1s post-pet', () => {
    expect(getMood({ stats: fullStats, secondsSincePet: 1.5 })).toBe('happy');
  });

  it('treats sleepy as a strict less-than-40 threshold', () => {
    expect(
      getMood({ stats: { ...fullStats, energy: 39 }, secondsSincePet: Infinity }),
    ).toBe('sleepy');
    expect(
      getMood({ stats: { ...fullStats, energy: 40 }, secondsSincePet: Infinity }),
    ).toBe('happy');
  });

  it('treats sad as a strict less-than-25 threshold', () => {
    expect(
      getMood({ stats: { ...fullStats, hunger: 24 }, secondsSincePet: Infinity }),
    ).toBe('sad');
    expect(
      getMood({ stats: { ...fullStats, hunger: 25 }, secondsSincePet: Infinity }),
    ).toBe('happy');
  });

  it('treats the bouncy boundary as inclusive at exactly 1s', () => {
    expect(getMood({ stats: fullStats, secondsSincePet: 1.0 })).toBe('bouncy');
    expect(getMood({ stats: fullStats, secondsSincePet: 1.0001 })).toBe('happy');
  });
});
```

- [ ] **Step 1.2: Run tests — verify they fail with "module not found"**

Run: `bun run test tests/unit/mood.test.ts`
Expected: FAIL — `Cannot find module '@/src/game/systems/mood'` or similar resolution error.

- [ ] **Step 1.3: Implement `mood.ts`**

Create `src/game/systems/mood.ts`:

```ts
export type Mood = 'happy' | 'sleepy' | 'sad' | 'bouncy';

export interface MoodInputs {
  stats: {
    hunger: number;
    happy: number;
    energy: number;
    clean: number;
    health: number;
  };
  /** Seconds since the most recent pet event. Pass `Infinity` if the dino has never been petted this session. */
  secondsSincePet: number;
}

const SAD_THRESHOLD = 25;
const SLEEPY_THRESHOLD = 40;
const BOUNCY_WINDOW_S = 1.0;

export function getMood({ stats, secondsSincePet }: MoodInputs): Mood {
  if (secondsSincePet <= BOUNCY_WINDOW_S) return 'bouncy';
  const minStat = Math.min(stats.hunger, stats.happy, stats.energy, stats.clean, stats.health);
  if (minStat < SAD_THRESHOLD) return 'sad';
  if (stats.energy < SLEEPY_THRESHOLD) return 'sleepy';
  return 'happy';
}
```

- [ ] **Step 1.4: Run tests — verify they pass**

Run: `bun run test tests/unit/mood.test.ts`
Expected: PASS — 9 tests pass (8 spec cases plus the 1.0-boundary check).

- [ ] **Step 1.5: Commit**

```bash
git add src/game/systems/mood.ts tests/unit/mood.test.ts
git commit -m "feat(mood): pure getMood with priority bouncy>sad>sleepy>happy"
```

---

## Task 2: Extract `useDinoMotion` hook

**Files:**
- Create: `src/game/world/useDinoMotion.ts`
- Modify: `src/game/world/Dino.tsx` (lines 1–38, full replacement of motion logic)

The current `Dino.tsx` mixes motion (bob/bounce/sad-lean) with the sphere mesh. We extract the motion into a reusable hook so both the egg placeholder and `<DinoCute>` can share it. The hook also adds `health` to the sad-lean min-set per spec.

- [ ] **Step 2.1: Create the hook**

Create `src/game/world/useDinoMotion.ts`:

```ts
'use client';

import { useFrame } from '@react-three/fiber';
import { type RefObject, useEffect, useRef, useState } from 'react';
import type { Object3D } from 'three';
import { useGame } from '@/src/game/store';
import { onPet } from '@/src/game/systems/interactions';

/**
 * Drives idle bob, pet-bounce y-offset, and sad-lean tilt for a dino mesh/group.
 *
 * @param ref   - ref to the Object3D to animate.
 * @param baseY - vertical offset added to `dino.position[1]` (the world baseline).
 *                Use 0.5 for the pre-hatch egg sphere (center-origin).
 *                Use 0 for the post-hatch DinoCute (feet-origin group).
 *
 * Reads the dino position and stats imperatively from the store on each frame
 * so the hook does not re-register on every state change.
 */
export function useDinoMotion(ref: RefObject<Object3D | null>, baseY: number) {
  const [bounce, setBounce] = useState(0);
  const bounceRef = useRef(bounce);

  useEffect(() => {
    const unsub = onPet(() => setBounce(performance.now()));
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    bounceRef.current = bounce;
  }, [bounce]);

  useFrame(() => {
    if (!ref.current) return;
    const now = performance.now();
    const bob = Math.sin(now / 400) * 0.05;
    const bouncePhase = (now - bounceRef.current) / 1000;
    const bounceY =
      bouncePhase < 0.6 ? Math.sin((bouncePhase * Math.PI) / 0.6) * 0.4 : 0;

    const { position, stats } = useGame.getState().dino;
    ref.current.position.set(position[0], position[1] + baseY + bob + bounceY, position[2]);

    const sad =
      Math.min(stats.hunger, stats.happy, stats.energy, stats.clean, stats.health) < 25;
    ref.current.rotation.x = sad ? 0.2 : 0;
  });
}
```

- [ ] **Step 2.2: Refactor `Dino.tsx` to use the hook (egg-only stub for now)**

Replace the entire contents of `src/game/world/Dino.tsx` with:

```tsx
'use client';

import { useRef } from 'react';
import type { Mesh } from 'three';
import { useGame } from '@/src/game/store';
import { useDinoMotion } from '@/src/game/world/useDinoMotion';

function DinoEgg() {
  const ref = useRef<Mesh>(null);
  // Sphere is center-origin, so baseY is sphere radius (0.5).
  useDinoMotion(ref, 0.5);
  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[0.5, 24, 24]} />
      <meshStandardMaterial color="#6dbf6d" roughness={0.6} />
    </mesh>
  );
}

export function Dino() {
  const stage = useGame((s) => s.dino.stage);
  // Post-hatch DinoCute is wired in Task 6. Until then, render egg for all stages.
  if (stage === 'egg') return <DinoEgg />;
  return <DinoEgg />;
}
```

- [ ] **Step 2.3: Run typecheck + unit tests + lint**

Run:
```bash
bun run typecheck && bun run test && bun run lint
```
Expected: all clean. The existing e2e test that checks the sphere is rendered after onboarding still passes because both stages currently render `<DinoEgg />`.

- [ ] **Step 2.4: Commit**

```bash
git add src/game/world/useDinoMotion.ts src/game/world/Dino.tsx
git commit -m "refactor(dino): extract useDinoMotion hook; include health in sad-lean"
```

---

## Task 3: `DinoEyes` mood-aware component

**Files:**
- Create: `src/game/world/dino-cute/DinoEyes.tsx`

This component renders a single eye assembly. The parent (`DinoCute`) instantiates two of them mirrored on the x-axis. Each variant is a small sub-tree of primitive meshes whose visual differences communicate the mood. All sizes are in local space; the parent scales/positions the head appropriately.

Visual targets (local-space eye dimensions):

| Mood    | Composition |
|---------|-------------|
| `happy` | white sphere `r=0.06` + black sphere `r=0.035` offset `z=+0.04` + white sparkle sphere `r=0.012` offset `(x=-0.02, y=0.02, z=0.05)` |
| `sleepy` | dark torus arc rotated so it looks like `⌒` — `args=[0.05, 0.012, 8, 16, Math.PI]`, rotated `x=Math.PI/2, z=Math.PI` |
| `sad`   | same as `happy` but scaled `1.15`, plus soft-blue tear sphere `r=0.02` offset `(x=0.02, y=-0.07, z=0.04)` |
| `bouncy` | dark torus arc looking like `^` — same args as sleepy but rotated `x=Math.PI/2, z=0` |

- [ ] **Step 3.1: Create `DinoEyes.tsx`**

Create `src/game/world/dino-cute/DinoEyes.tsx`:

```tsx
'use client';

import type { Mood } from '@/src/game/systems/mood';

const PUPIL_COLOR = '#1A1A24';
const TEAR_COLOR = '#9CD0FF';
const SPARKLE_COLOR = '#FFFFFF';

export function DinoEyes({ mood }: { mood: Mood }) {
  if (mood === 'sleepy') {
    return (
      <mesh rotation={[Math.PI / 2, 0, Math.PI]}>
        <torusGeometry args={[0.05, 0.012, 8, 16, Math.PI]} />
        <meshStandardMaterial color={PUPIL_COLOR} roughness={0.5} />
      </mesh>
    );
  }

  if (mood === 'bouncy') {
    return (
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.05, 0.012, 8, 16, Math.PI]} />
        <meshStandardMaterial color={PUPIL_COLOR} roughness={0.5} />
      </mesh>
    );
  }

  // happy or sad — same structure, different scale + optional tear
  const scale = mood === 'sad' ? 1.15 : 1;

  return (
    <group scale={scale}>
      {/* eye white */}
      <mesh>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
      </mesh>
      {/* pupil */}
      <mesh position={[0, 0, 0.04]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial color={PUPIL_COLOR} roughness={0.5} />
      </mesh>
      {/* sparkle */}
      <mesh position={[-0.02, 0.02, 0.05]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color={SPARKLE_COLOR} roughness={0.2} />
      </mesh>
      {/* tear (sad only) */}
      {mood === 'sad' && (
        <mesh position={[0.02, -0.07, 0.04]}>
          <sphereGeometry args={[0.02, 12, 12]} />
          <meshStandardMaterial color={TEAR_COLOR} roughness={0.2} />
        </mesh>
      )}
    </group>
  );
}
```

- [ ] **Step 3.2: Run typecheck and lint**

Run: `bun run typecheck && bun run lint`
Expected: clean.

- [ ] **Step 3.3: Commit**

```bash
git add src/game/world/dino-cute/DinoEyes.tsx
git commit -m "feat(dino): mood-aware DinoEyes (happy/sleepy/sad/bouncy)"
```

---

## Task 4: `DinoMouth` mood-aware component

**Files:**
- Create: `src/game/world/dino-cute/DinoMouth.tsx`

Variants (local-space dimensions):

| Mood    | Composition |
|---------|-------------|
| `happy` | dark torus arc as smile — `args=[0.07, 0.012, 8, 16, Math.PI]`, rotation `x=Math.PI/2, z=Math.PI` |
| `sleepy` | thin dark flat box — `args=[0.08, 0.012, 0.012]` |
| `sad`   | dark torus arc as frown — same args as happy, rotation `x=Math.PI/2, z=0` |
| `bouncy` | dark sphere (open mouth) — `r=0.05`, no other geometry |

- [ ] **Step 4.1: Create `DinoMouth.tsx`**

Create `src/game/world/dino-cute/DinoMouth.tsx`:

```tsx
'use client';

import type { Mood } from '@/src/game/systems/mood';

const MOUTH_COLOR = '#1A1A24';

export function DinoMouth({ mood }: { mood: Mood }) {
  if (mood === 'bouncy') {
    return (
      <mesh>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color={MOUTH_COLOR} roughness={0.6} />
      </mesh>
    );
  }

  if (mood === 'sleepy') {
    return (
      <mesh>
        <boxGeometry args={[0.08, 0.012, 0.012]} />
        <meshStandardMaterial color={MOUTH_COLOR} roughness={0.5} />
      </mesh>
    );
  }

  // happy = smile (rotation z=PI flips the arc upward); sad = frown (z=0)
  const zRot = mood === 'happy' ? Math.PI : 0;
  return (
    <mesh rotation={[Math.PI / 2, 0, zRot]}>
      <torusGeometry args={[0.07, 0.012, 8, 16, Math.PI]} />
      <meshStandardMaterial color={MOUTH_COLOR} roughness={0.5} />
    </mesh>
  );
}
```

- [ ] **Step 4.2: Run typecheck and lint**

Run: `bun run typecheck && bun run lint`
Expected: clean.

- [ ] **Step 4.3: Commit**

```bash
git add src/game/world/dino-cute/DinoMouth.tsx
git commit -m "feat(dino): mood-aware DinoMouth (smile/flat/frown/open)"
```

---

## Task 5: `DinoCute` root component

**Files:**
- Create: `src/game/world/dino-cute/DinoCute.tsx`

This is the largest single file in the plan. It composes anatomy, subscribes to stats and pet events, computes mood (using `getMood`), passes it down to `DinoEyes` and `DinoMouth`, runs limb wiggle in `useFrame`, and uses `useDinoMotion` for global bob/bounce/lean.

Anatomy spec (all in local-space, group origin = feet):

| Part | Geometry | Position (x, y, z) | Scale | Color |
|---|---|---|---|---|
| Body | sphere `r=0.45` | `(0, 0.55, 0)` | `(1.0, 0.85, 1.1)` | `#7FE0B0` |
| Belly | sphere `r=0.32` | `(0, 0.5, 0.18)` | `(1, 0.9, 0.4)` | `#FFF6E0` |
| Head | sphere `r=0.32` | `(0, 1.05, 0.25)` | `(1, 1, 1)` | `#7FE0B0` |
| Cheek L | sphere `r=0.07` | `(-0.22, 1.0, 0.32)` | `(1, 0.6, 0.4)` | `#FF9CB8` |
| Cheek R | sphere `r=0.07` | `(0.22, 1.0, 0.32)` | `(1, 0.6, 0.4)` | `#FF9CB8` |
| Eye L | DinoEyes | `(-0.12, 1.13, 0.45)` | — | — |
| Eye R | DinoEyes | `(0.12, 1.13, 0.45)` | — | — |
| Mouth | DinoMouth | `(0, 0.95, 0.5)` | — | — |
| Arm L (wiggle) | sphere `r=0.1` | `(-0.42, 0.55, 0.05)` | — | `#7FE0B0` |
| Arm R (wiggle) | sphere `r=0.1` | `(0.42, 0.55, 0.05)` | — | `#7FE0B0` |
| Leg L | capsule `r=0.1, len=0.2` | `(-0.18, 0.2, 0)` | — | `#7FE0B0` |
| Leg R | capsule `r=0.1, len=0.2` | `(0.18, 0.2, 0)` | — | `#7FE0B0` |
| Tail seg 1 | sphere `r=0.18` | `(0, 0.5, -0.45)` | — | `#7FE0B0` |
| Tail seg 2 | sphere `r=0.13` | `(0, 0.45, -0.65)` | — | `#7FE0B0` |
| Tail tip (wiggle) | sphere `r=0.09` | `(0, 0.4, -0.8)` | — | `#7FE0B0` |
| Bump 1 | cone `r=0.06, h=0.1` | `(0, 0.95, -0.1)` | — | `#7FE0B0` |
| Bump 2 | cone `r=0.07, h=0.12` | `(0, 0.95, -0.3)` | — | `#7FE0B0` |
| Bump 3 | cone `r=0.05, h=0.08` | `(0, 0.7, -0.5)` | — | `#7FE0B0` |

The two **arm** meshes and the **tail tip** mesh have refs and get their rotation updated each frame for the limb wiggle.

- [ ] **Step 5.1: Create `DinoCute.tsx`**

Create `src/game/world/dino-cute/DinoCute.tsx`:

```tsx
'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { Group, Mesh } from 'three';
import { useGame } from '@/src/game/store';
import { onPet } from '@/src/game/systems/interactions';
import { getMood, type Mood } from '@/src/game/systems/mood';
import { useDinoMotion } from '@/src/game/world/useDinoMotion';
import { DinoEyes } from './DinoEyes';
import { DinoMouth } from './DinoMouth';

const BODY_COLOR = '#7FE0B0';
const BELLY_COLOR = '#FFF6E0';
const CHEEK_COLOR = '#FF9CB8';

const NEVER_PETTED = Number.POSITIVE_INFINITY;

export function DinoCute() {
  const groupRef = useRef<Group>(null);
  const armLRef = useRef<Mesh>(null);
  const armRRef = useRef<Mesh>(null);
  const tailTipRef = useRef<Mesh>(null);

  // Track the most recent pet timestamp via a ref so the useFrame loop reads
  // the latest value without retriggering frame-effect registration.
  const lastPetAtRef = useRef<number>(NEVER_PETTED);

  useEffect(() => {
    const unsub = onPet(() => {
      lastPetAtRef.current = performance.now();
    });
    return () => {
      unsub();
    };
  }, []);

  // Mood is React state so eye/mouth subtrees rerender only on transition.
  const [mood, setMood] = useState<Mood>('happy');

  useFrame(() => {
    // --- mood derivation (called every frame; setState only on change) ---
    const stats = useGame.getState().dino.stats;
    const last = lastPetAtRef.current;
    const secondsSincePet =
      last === NEVER_PETTED ? Number.POSITIVE_INFINITY : (performance.now() - last) / 1000;
    const next = getMood({ stats, secondsSincePet });
    if (next !== mood) setMood(next);

    // --- limb wiggle (always runs; tiny rotations) ---
    const now = performance.now();
    if (armLRef.current) armLRef.current.rotation.z = Math.sin(now / 500) * 0.05;
    if (armRRef.current) armRRef.current.rotation.z = -Math.sin(now / 500) * 0.05;
    if (tailTipRef.current) tailTipRef.current.rotation.y = Math.sin(now / 600) * 0.08;
  });

  // Drive global bob, pet-bounce, and sad-lean. baseY=0 because this group is feet-origin.
  useDinoMotion(groupRef, 0);

  return (
    <group ref={groupRef}>
      {/* body */}
      <mesh position={[0, 0.55, 0]} scale={[1.0, 0.85, 1.1]} castShadow>
        <sphereGeometry args={[0.45, 24, 24]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>

      {/* belly patch */}
      <mesh position={[0, 0.5, 0.18]} scale={[1, 0.9, 0.4]}>
        <sphereGeometry args={[0.32, 20, 20]} />
        <meshStandardMaterial color={BELLY_COLOR} roughness={0.7} />
      </mesh>

      {/* head */}
      <mesh position={[0, 1.05, 0.25]} castShadow>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>

      {/* cheeks */}
      <mesh position={[-0.22, 1.0, 0.32]} scale={[1, 0.6, 0.4]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color={CHEEK_COLOR} roughness={0.6} />
      </mesh>
      <mesh position={[0.22, 1.0, 0.32]} scale={[1, 0.6, 0.4]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color={CHEEK_COLOR} roughness={0.6} />
      </mesh>

      {/* eyes */}
      <group position={[-0.12, 1.13, 0.45]}>
        <DinoEyes mood={mood} />
      </group>
      <group position={[0.12, 1.13, 0.45]}>
        <DinoEyes mood={mood} />
      </group>

      {/* mouth */}
      <group position={[0, 0.95, 0.5]}>
        <DinoMouth mood={mood} />
      </group>

      {/* arms (wiggle) */}
      <mesh ref={armLRef} position={[-0.42, 0.55, 0.05]} castShadow>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
      <mesh ref={armRRef} position={[0.42, 0.55, 0.05]} castShadow>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>

      {/* legs — capsule center at y=0.2 puts feet at y=0 (radius 0.1 + half-length 0.1) */}
      <mesh position={[-0.18, 0.2, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.2, 8, 16]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
      <mesh position={[0.18, 0.2, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.2, 8, 16]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>

      {/* tail */}
      <mesh position={[0, 0.5, -0.45]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.45, -0.65]} castShadow>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
      <mesh ref={tailTipRef} position={[0, 0.4, -0.8]} castShadow>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>

      {/* back bumps */}
      <mesh position={[0, 0.95, -0.1]} castShadow>
        <coneGeometry args={[0.06, 0.1, 12]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.95, -0.3]} castShadow>
        <coneGeometry args={[0.07, 0.12, 12]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.7, -0.5]} castShadow>
        <coneGeometry args={[0.05, 0.08, 12]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 5.2: Run typecheck + lint**

Run: `bun run typecheck && bun run lint`
Expected: clean. Note `DinoCute` is created but not yet imported anywhere — that is fine for this commit. Biome's `noUnusedImports` rule applies to imports, not to module exports.

- [ ] **Step 5.3: Commit**

```bash
git add src/game/world/dino-cute/DinoCute.tsx
git commit -m "feat(dino): DinoCute primitives composition + mood + limb wiggle"
```

---

## Task 6: Wire `DinoCute` into `Dino.tsx`

**Files:**
- Modify: `src/game/world/Dino.tsx`

Replace the post-hatch branch (currently the egg fallback) with `<DinoCute />`. Keep `<DinoEgg />` for `stage === 'egg'`.

- [ ] **Step 6.1: Update `Dino.tsx`**

Replace the entire contents of `src/game/world/Dino.tsx` with:

```tsx
'use client';

import { useRef } from 'react';
import type { Mesh } from 'three';
import { useGame } from '@/src/game/store';
import { DinoCute } from '@/src/game/world/dino-cute/DinoCute';
import { useDinoMotion } from '@/src/game/world/useDinoMotion';

function DinoEgg() {
  const ref = useRef<Mesh>(null);
  // Sphere is center-origin, so baseY is sphere radius (0.5).
  useDinoMotion(ref, 0.5);
  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[0.5, 24, 24]} />
      <meshStandardMaterial color="#6dbf6d" roughness={0.6} />
    </mesh>
  );
}

export function Dino() {
  const stage = useGame((s) => s.dino.stage);
  if (stage === 'egg') return <DinoEgg />;
  return <DinoCute />;
}
```

- [ ] **Step 6.2: Run typecheck + lint + unit tests**

Run: `bun run typecheck && bun run lint && bun run test`
Expected: all clean. The mood unit tests still pass; nothing else is touched.

- [ ] **Step 6.3: Run e2e tests**

Run: `bun run test:e2e`
Expected: PASS. The existing `tests/e2e/play.spec.ts` exercises both pre-hatch (egg) and post-hatch states. Since neither path makes assertions about specific 3D mesh contents (it only checks DOM/HUD), both should still pass with the new dino. If a check fails, capture the failure and stop — do not silently mute the test.

- [ ] **Step 6.4: Commit**

```bash
git add src/game/world/Dino.tsx
git commit -m "feat(dino): swap green sphere for DinoCute on hatch"
```

---

## Task 7: Visual sanity + final verification

**Files:** none (verification only)

- [ ] **Step 7.1: Run all checks together one last time**

Run:
```bash
bun run typecheck && bun run lint && bun run test && bun run test:e2e
```
Expected: all green.

- [ ] **Step 7.2: Manual visual smoke test (LAN)**

Run: `bun run show`

In a phone or desktop browser:
1. Hatch the egg via onboarding.
2. Confirm the cute mint-green dino appears (body, head with eyes/mouth, cheeks, arms, legs, tail, back bumps). Default mood should be `happy` (sparkle eyes, smile mouth) since stats start at 100.
3. Tap the **Pet** action: dino should bounce vertically AND eye/mouth should briefly switch to bouncy (closed-arch eyes + open-mouth sphere) for ~1s, then return to happy.
4. Use any debug or stats-decay path to drop hunger below 25 — eye/mouth should switch to sad (larger eyes + tear sphere + frown), and the body should tilt forward slightly (`rotation.x = 0.2`).
5. Reset stats; drop only energy below 40 (without dropping any other stat below 25) — eye/mouth should switch to sleepy (half-arc eyes + flat mouth).
6. Open the browser console: there should be **no** errors or warnings other than React Strict Mode double-mount notices, if any.

If any of (2)–(6) fail, capture the issue (screenshot or console excerpt) and stop the plan to fix before merging.

- [ ] **Step 7.3: No commit needed**

Verification only — proceed to PR after the optional QA / reviewer subagent passes.

---

## Self-review checklist (run after writing the plan)

- Spec coverage:
  - [x] Palette (mint/cream/pink/tear-blue) → Tasks 3, 4, 5 use the exact hex codes.
  - [x] Anatomy (body/belly/head/cheeks/eyes/mouth/arms/legs/tail/back bumps) → Task 5 table.
  - [x] Mood-driven eyes (4 variants) → Task 3.
  - [x] Mood-driven mouth (4 variants) → Task 4.
  - [x] `getMood` priority bouncy>sad>sleepy>happy → Task 1.
  - [x] Sad-lean extended to include `health` → Task 2.
  - [x] Pet event subscription pattern → Task 5 (via `lastPetAtRef`).
  - [x] Limb wiggle (arms + tail tip) with the spec's exact frequencies → Task 5.
  - [x] Component file structure (`dino-cute/` folder + `mood.ts`) → matches Task 1, 3, 4, 5 paths.
  - [x] Asset cleanup of `t-rex.glb` — N/A on this base branch (file does not exist on `main`); plan flags this in Repo Context.
  - [x] Unit tests (8+ cases) → Task 1.
  - [x] Existing e2e still passes → Task 6 step 6.3.
- Placeholder scan: no TBD/TODO/"add appropriate error handling"/"similar to Task N" — every step has full code or full commands.
- Type/name consistency: `Mood` type and `getMood` signature match between Task 1, 3, 4, 5; refs (`groupRef`, `armLRef`, `armRRef`, `tailTipRef`) are declared and used in Task 5; `useDinoMotion(ref, baseY)` signature is consistent across Task 2 (definition) and Tasks 2, 5 (usage).
