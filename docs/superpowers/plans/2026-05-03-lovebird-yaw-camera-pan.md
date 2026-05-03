# Lovebird Yaw + Camera Pan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lovebirds rotate to face direction of travel; camera target gains 2-finger-drag pan bounded per-area with auto-recenter on character/area switch.

**Architecture:** Pure math helpers in `src/lib/math.ts` (testable, no Three deps). `CameraRig` component reads OrbitControls via `useThree(s => s.controls)` — clamps target each frame, recenters on `useEffect`. Lovebird yaw is added to existing motion paths by storing prev-position refs and applying smoothed `atan2` heading after position is set.

**Tech Stack:** React 19 + Next.js 16, react-three-fiber, drei `OrbitControls`, three.js, Zustand, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-05-03-lovebird-yaw-camera-pan-design.md`

---

## File Structure

**New**
- `src/lib/math.ts` — `lerpAngle(a, b, t)` and `clampPan(target, extent)`. Pure, no Three imports.
- `src/game/world/CameraRig.tsx` — clamps OrbitControls target each frame; recenters on character/area change.
- `tests/unit/math.test.ts` — covers `lerpAngle` + `clampPan`.

**Modified**
- `src/game/world/areas/registry.ts` — `AreaConfig` gains `extent: number`; per-area values added.
- `src/game/world/World.tsx` — `OrbitControls` `enablePan={true}` + `screenSpacePanning={false}`; mount `<CameraRig/>`.
- `src/game/world/useLovebirdMotion.ts` — yaw for active leader + partner.
- `src/game/world/Lovebirds.tsx` — yaw in NPC orbit `useFrame`.

---

## Task 1: Math helpers (`lerpAngle` + `clampPan`)

**Files:**
- Create: `src/lib/math.ts`
- Test: `tests/unit/math.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/math.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { clampPan, lerpAngle } from '@/src/lib/math';

describe('lerpAngle', () => {
  it('returns a when t=0', () => {
    expect(lerpAngle(1, 2, 0)).toBe(1);
  });

  it('returns b when t=1', () => {
    expect(lerpAngle(1, 2, 1)).toBeCloseTo(2);
  });

  it('returns midpoint when t=0.5 with no wrap', () => {
    expect(lerpAngle(0, Math.PI / 2, 0.5)).toBeCloseTo(Math.PI / 4);
  });

  it('takes the short path across +pi/-pi boundary', () => {
    // From 3.0 (just under +pi) to -3.0 (just over -pi) — short path is forward, ~0.28 rad.
    const result = lerpAngle(3.0, -3.0, 0.5);
    // Halfway should be near +pi (or equivalently -pi), NOT near 0.
    const distToPi = Math.min(
      Math.abs(result - Math.PI),
      Math.abs(result + Math.PI),
    );
    expect(distToPi).toBeLessThan(0.2);
  });

  it('returns a when a equals b', () => {
    expect(lerpAngle(1.5, 1.5, 0.5)).toBe(1.5);
  });
});

describe('clampPan', () => {
  it('leaves a point inside the box untouched', () => {
    const t = { x: 1, z: -2 };
    clampPan(t, 5);
    expect(t).toEqual({ x: 1, z: -2 });
  });

  it('clamps +x beyond extent', () => {
    const t = { x: 10, z: 0 };
    clampPan(t, 5);
    expect(t).toEqual({ x: 5, z: 0 });
  });

  it('clamps -x beyond extent', () => {
    const t = { x: -10, z: 0 };
    clampPan(t, 5);
    expect(t).toEqual({ x: -5, z: 0 });
  });

  it('clamps +z beyond extent', () => {
    const t = { x: 0, z: 10 };
    clampPan(t, 5);
    expect(t).toEqual({ x: 0, z: 5 });
  });

  it('clamps -z beyond extent', () => {
    const t = { x: 0, z: -10 };
    clampPan(t, 5);
    expect(t).toEqual({ x: 0, z: -5 });
  });

  it('clamps both axes when beyond corner', () => {
    const t = { x: 100, z: -100 };
    clampPan(t, 5);
    expect(t).toEqual({ x: 5, z: -5 });
  });

  it('does not touch y', () => {
    const t = { x: 100, z: 100, y: 7 } as unknown as { x: number; z: number };
    clampPan(t, 5);
    expect((t as unknown as { y: number }).y).toBe(7);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test math`
Expected: FAIL — module `@/src/lib/math` not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/math.ts`:

```ts
/**
 * Lerp between two angles (radians), taking the shortest path across +/-pi.
 * t in [0, 1]. Returns `a` when t=0, `b` when t=1.
 */
export function lerpAngle(a: number, b: number, t: number): number {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

/**
 * Clamp `target.x` and `target.z` into [-extent, extent]. Mutates in place.
 * `target.y` is untouched. Used to bound camera-pan target to area extents.
 */
export function clampPan(target: { x: number; z: number }, extent: number): void {
  if (target.x > extent) target.x = extent;
  else if (target.x < -extent) target.x = -extent;
  if (target.z > extent) target.z = extent;
  else if (target.z < -extent) target.z = -extent;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test math`
Expected: PASS — all 12 cases green.

- [ ] **Step 5: Type-check**

Run: `bun run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/math.ts tests/unit/math.test.ts
git commit -m "feat(lib): add lerpAngle + clampPan helpers"
```

---

## Task 2: Add `extent` to `AreaConfig`

**Files:**
- Modify: `src/game/world/areas/registry.ts`

- [ ] **Step 1: Add `extent` to the type and per-area values**

Edit `src/game/world/areas/registry.ts`. Add `extent: number` to the type, and the per-area numbers below. Final file:

```ts
import type { ComponentType } from 'react';
import type { AreaId } from '@/src/game/store';
import { Beach } from './Beach';
import { Cave } from './Cave';
import { Forest } from './Forest';
import { Home } from './Home';
import { Park } from './Park';
import { SkyIsland } from './SkyIsland';
import { Town } from './Town';

export type AreaConfig = {
  id: AreaId;
  name: string;
  emoji: string;
  Component: ComponentType;
  spawn: [number, number, number];
  exits: AreaId[];
  /** Half-width of the square region (world units) the camera target may roam. */
  extent: number;
  locked?: boolean;
};

export const AREAS: Record<AreaId, AreaConfig> = {
  home: {
    id: 'home',
    name: 'Home',
    emoji: '🏠',
    Component: Home,
    spawn: [0, 0, 0],
    exits: ['town'],
    extent: 8,
  },
  town: {
    id: 'town',
    name: 'Town Square',
    emoji: '🏘️',
    Component: Town,
    spawn: [0, 0, 0],
    exits: ['home', 'park', 'beach', 'forest'],
    extent: 18,
  },
  park: {
    id: 'park',
    name: 'Park',
    emoji: '🌳',
    Component: Park,
    spawn: [0, 0, 0],
    exits: ['town'],
    extent: 16,
  },
  beach: {
    id: 'beach',
    name: 'Beach',
    emoji: '🏖️',
    Component: Beach,
    spawn: [0, 0, 0],
    exits: ['town', 'cave'],
    extent: 18,
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    emoji: '🌲',
    Component: Forest,
    spawn: [0, 0, 0],
    exits: ['town', 'cave'],
    extent: 16,
  },
  cave: {
    id: 'cave',
    name: 'Cave',
    emoji: '⛰️',
    Component: Cave,
    spawn: [0, 0, 0],
    exits: ['beach', 'forest'],
    extent: 12,
  },
  sky: {
    id: 'sky',
    name: 'Sky Island',
    emoji: '☁️',
    Component: SkyIsland,
    spawn: [0, 0, 0],
    exits: ['town'],
    locked: true,
    extent: 14,
  },
};
```

- [ ] **Step 2: Type-check**

Run: `bun run typecheck`
Expected: no errors. (If any code reads `AREAS[id]` without `.extent`, this won't break — the new field is additive.)

- [ ] **Step 3: Commit**

```bash
git add src/game/world/areas/registry.ts
git commit -m "feat(areas): add per-area camera-pan extent"
```

---

## Task 3: `CameraRig` component

**Files:**
- Create: `src/game/world/CameraRig.tsx`

- [ ] **Step 1: Create the component**

Create `src/game/world/CameraRig.tsx`:

```tsx
'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import type { Vector3 } from 'three';
import { useGame } from '@/src/game/store';
import { AREAS } from '@/src/game/world/areas/registry';
import { clampPan } from '@/src/lib/math';

type ControlsLike = { target: Vector3 } | null;

/**
 * Bounds OrbitControls' pan target to per-area extents and recenters on
 * the active pet whenever the player switches characters or areas.
 */
export function CameraRig() {
  const controls = useThree((s) => s.controls) as ControlsLike;
  const area = useGame((s) => s.currentArea);
  const active = useGame((s) => s.active);

  useEffect(() => {
    if (!controls) return;
    const pos = useGame.getState().characters[active].position;
    controls.target.set(pos[0], pos[1] + 0.5, pos[2]);
  }, [active, area, controls]);

  useFrame(() => {
    if (!controls) return;
    const ext = AREAS[useGame.getState().currentArea].extent;
    clampPan(controls.target, ext);
  });

  return null;
}
```

- [ ] **Step 2: Type-check**

Run: `bun run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/game/world/CameraRig.tsx
git commit -m "feat(camera): add CameraRig — clamp pan + auto-recenter"
```

---

## Task 4: Wire `OrbitControls` + mount `CameraRig`

**Files:**
- Modify: `src/game/world/World.tsx`

- [ ] **Step 1: Edit `World.tsx`**

Replace the contents of `src/game/world/World.tsx` with:

```tsx
'use client';
import { OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import { ActiveSceneControls } from '@/src/game/controls';
import { useGame } from '@/src/game/store';
import { AREAS } from '@/src/game/world/areas/registry';
import { CameraRig } from '@/src/game/world/CameraRig';
import { Dino } from '@/src/game/world/Dino';
import { Lovebirds } from '@/src/game/world/Lovebirds';
import { CloudPerch } from '@/src/game/world/props/CloudPerch';

export function World() {
  const areaId = useGame((s) => s.currentArea);
  const Area = AREAS[areaId].Component;
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight castShadow position={[5, 10, 5]} intensity={1.2} />
      <Suspense fallback={null}>
        <Area />
      </Suspense>
      <Dino />
      <Lovebirds />
      <CloudPerch />
      <ActiveSceneControls />
      <OrbitControls
        makeDefault
        enablePan={true}
        screenSpacePanning={false}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={4}
        maxDistance={14}
      />
      <CameraRig />
    </>
  );
}
```

`<CameraRig/>` MUST sit after `<OrbitControls makeDefault>` so `useThree(s => s.controls)` resolves on first frame.

- [ ] **Step 2: Manual smoke (dev server)**

Run: `bun run dev`
Open http://localhost:3000 in a mobile-emulating browser viewport.

- 1-finger drag: rotates camera (unchanged).
- 2-finger drag: pans the world along the ground plane.
- Pan stops at area edges (~8 units in Home).
- 1-finger tap on ground: dino still walks (TapControls still works).
- Switch character via toggle: camera target jumps to new active pet.

Stop the dev server.

- [ ] **Step 3: Type-check + lint**

Run in parallel:
- `bun run typecheck`
- `bun run lint:fix`

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/game/world/World.tsx
git commit -m "feat(camera): enable 2-finger pan + mount CameraRig"
```

---

## Task 5: Lovebird yaw — active mode (`useLovebirdMotion`)

**Files:**
- Modify: `src/game/world/useLovebirdMotion.ts`

- [ ] **Step 1: Edit the hook**

Replace the contents of `src/game/world/useLovebirdMotion.ts` with:

```ts
'use client';

import { useFrame } from '@react-three/fiber';
import { type RefObject, useRef } from 'react';
import { type Group, Vector3 } from 'three';
import { useGame } from '@/src/game/store';
import { lerpAngle } from '@/src/lib/math';

const GLIDE_Y = 0.5;
const PARTNER_OFFSET: [number, number, number] = [0.35, 0.05, -0.1];
const YAW_LERP_RATE = 6; // per second
const SPEED_EPS = 0.001;

/**
 * Drives the leader/partner lovebirds in active mode.
 * Leader follows `pos.lovebirds`, partner trails leader with delay.
 * Both yaw to face their direction of travel.
 */
export function useLovebirdMotion(
  leaderRef: RefObject<Group | null>,
  partnerRef: RefObject<Group | null>,
) {
  const prevLeader = useRef(new Vector3());
  const prevPartner = useRef(new Vector3());

  useFrame((_state, dt) => {
    const { position } = useGame.getState().characters.lovebirds;
    const now = performance.now();
    const bob = Math.sin(now / 400) * 0.04;

    if (leaderRef.current) {
      const target = [position[0], position[1] + GLIDE_Y + bob, position[2]] as const;
      leaderRef.current.position.lerp(
        { x: target[0], y: target[1], z: target[2] } as never,
        Math.min(1, dt * 8),
      );
      applyYaw(leaderRef.current, prevLeader.current, dt);
    }
    if (partnerRef.current && leaderRef.current) {
      const lp = leaderRef.current.position;
      const target = {
        x: lp.x + PARTNER_OFFSET[0],
        y: lp.y + PARTNER_OFFSET[1] + Math.sin(now / 380) * 0.02,
        z: lp.z + PARTNER_OFFSET[2],
      };
      partnerRef.current.position.lerp(target as never, Math.min(1, dt * 6));
      applyYaw(partnerRef.current, prevPartner.current, dt);
    }
  });
}

function applyYaw(group: Group, prev: Vector3, dt: number): void {
  const cur = group.position;
  const dx = cur.x - prev.x;
  const dz = cur.z - prev.z;
  if (Math.hypot(dx, dz) > SPEED_EPS) {
    const targetYaw = Math.atan2(dx, dz);
    group.rotation.y = lerpAngle(group.rotation.y, targetYaw, Math.min(1, dt * YAW_LERP_RATE));
  }
  prev.copy(cur);
}
```

- [ ] **Step 2: Type-check**

Run: `bun run typecheck`
Expected: no errors.

- [ ] **Step 3: Manual smoke**

Run: `bun run dev`. Switch active character to lovebirds. Use joystick to fly them. Verify both birds turn to face direction of travel as you change heading. Snap-back to forward should NOT happen on stop — birds keep last heading.

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add src/game/world/useLovebirdMotion.ts
git commit -m "feat(lovebirds): yaw to face travel direction in active mode"
```

---

## Task 6: Lovebird yaw — NPC orbit mode (`Lovebirds.tsx`)

**Files:**
- Modify: `src/game/world/Lovebirds.tsx`

- [ ] **Step 1: Edit `Lovebirds.tsx`**

Apply two changes:

1. Add prev-position refs near the existing refs.
2. Inside the orbit `useFrame`, reuse the same `applyYaw` pattern.

Replace the contents of `src/game/world/Lovebirds.tsx` with:

```tsx
'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { type Group, Vector3 } from 'three';
import { useGame } from '@/src/game/store';
import { onPet, pet } from '@/src/game/systems/interactions';
import { getMood, type Mood } from '@/src/game/systems/mood';
import { lerpAngle } from '@/src/lib/math';
import { Lovebird } from '@/src/game/world/lovebird-cute/Lovebird';
import { useLovebirdMotion } from '@/src/game/world/useLovebirdMotion';

const NEVER = Number.POSITIVE_INFINITY;
const PERCH: [number, number, number] = [3, 2.5, -2];
const ORBIT_R = 0.6;
const YAW_LERP_RATE = 6;
const SPEED_EPS = 0.001;

const BIRD1 = { top: '#FF7AB6', bottom: '#FFD86B' };
const BIRD2 = { top: '#7AD3FF', bottom: '#9CFF7A' };

export function Lovebirds() {
  const active = useGame((s) => s.active);
  const leaderRef = useRef<Group>(null);
  const partnerRef = useRef<Group>(null);
  const prevLeader = useRef(new Vector3());
  const prevPartner = useRef(new Vector3());
  const [spinAtLeader, setSpinAtLeader] = useState<number>(NaN);
  const [spinAtPartner, setSpinAtPartner] = useState<number>(NaN);
  const [mood, setMood] = useState<Mood>('happy');

  useEffect(() => {
    const unsub = onPet((charId) => {
      if (charId !== 'lovebirds') return;
      const ts = performance.now();
      setSpinAtLeader(ts);
      setSpinAtPartner(ts);
    });
    return () => {
      unsub();
    };
  }, []);

  useFrame(() => {
    const stats = useGame.getState().characters.lovebirds.stats;
    const next = getMood({ stats, secondsSincePet: NEVER });
    if (next !== mood) setMood(next);
  });

  // Active mode: leader controlled by pos; partner trails. Hook owns its own yaw.
  useLovebirdMotion(leaderRef, partnerRef);

  // NPC mode: orbit cloud perch when not active. Yaw to follow tangent.
  useFrame((_state, dt) => {
    if (active === 'lovebirds') return;
    const t = performance.now() / 1000;
    if (leaderRef.current) {
      leaderRef.current.position.x = PERCH[0] + Math.cos(t * 0.7) * ORBIT_R;
      leaderRef.current.position.y = PERCH[1] + Math.sin(t * 0.5) * 0.08;
      leaderRef.current.position.z = PERCH[2] + Math.sin(t * 0.7) * ORBIT_R;
      applyYaw(leaderRef.current, prevLeader.current, dt);
    }
    if (partnerRef.current) {
      partnerRef.current.position.x = PERCH[0] + Math.cos(t * 0.7 + Math.PI) * ORBIT_R;
      partnerRef.current.position.y = PERCH[1] + Math.sin(t * 0.5 + Math.PI) * 0.08;
      partnerRef.current.position.z = PERCH[2] + Math.sin(t * 0.7 + Math.PI) * ORBIT_R;
      applyYaw(partnerRef.current, prevPartner.current, dt);
    }
  });

  const onLeaderClick = () => {
    if (active !== 'lovebirds') {
      useGame.getState().setActive('lovebirds');
      return;
    }
    setSpinAtLeader(performance.now());
    pet('lovebirds');
  };
  const onPartnerClick = () => {
    if (active !== 'lovebirds') {
      useGame.getState().setActive('lovebirds');
      return;
    }
    setSpinAtPartner(performance.now());
    pet('lovebirds');
  };

  const flapHz = active === 'lovebirds' ? 8 : 4;

  return (
    <>
      <Lovebird
        groupRef={leaderRef}
        topColor={BIRD1.top}
        bottomColor={BIRD1.bottom}
        mood={mood}
        flapHz={flapHz}
        spinAt={spinAtLeader}
        onClick={onLeaderClick}
      />
      <Lovebird
        groupRef={partnerRef}
        topColor={BIRD2.top}
        bottomColor={BIRD2.bottom}
        mood={mood}
        flapHz={flapHz}
        spinAt={spinAtPartner}
        onClick={onPartnerClick}
      />
    </>
  );
}

function applyYaw(group: Group, prev: Vector3, dt: number): void {
  const cur = group.position;
  const dx = cur.x - prev.x;
  const dz = cur.z - prev.z;
  if (Math.hypot(dx, dz) > SPEED_EPS) {
    const targetYaw = Math.atan2(dx, dz);
    group.rotation.y = lerpAngle(group.rotation.y, targetYaw, Math.min(1, dt * YAW_LERP_RATE));
  }
  prev.copy(cur);
}
```

Note: the `applyYaw` helper is duplicated in `useLovebirdMotion.ts` and `Lovebirds.tsx` (3 lines of duplication). Acceptable — extracting to a shared module would mean exporting a Three-aware utility, and the bodies are tiny. If a third caller appears later, extract.

- [ ] **Step 2: Type-check + lint**

Run in parallel:
- `bun run typecheck`
- `bun run lint:fix`

Expected: clean.

- [ ] **Step 3: Manual smoke**

Run: `bun run dev`. Active character = dino (default). Open Home area. The two lovebirds orbit the cloud perch. Verify they yaw smoothly so the beak follows the orbit tangent (not facing fixed +Z).

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add src/game/world/Lovebirds.tsx
git commit -m "feat(lovebirds): yaw along orbit tangent in NPC mode"
```

---

## Task 7: Run full test suite

**Files:**
- (none — verification only)

- [ ] **Step 1: Run unit tests**

Run: `bun run test`
Expected: all green, including the new `tests/unit/math.test.ts` cases.

- [ ] **Step 2: Run e2e**

Run: `bun run test:e2e`
Expected: all green. No regressions in existing mobile-viewport tests (tap-to-move, joystick, character switch, action bar).

- [ ] **Step 3: Final type-check + lint**

Run in parallel:
- `bun run typecheck`
- `bun run lint:fix`

Expected: clean. If `lint:fix` makes changes, commit them.

```bash
git add -A
git status   # verify only formatting changes
git commit -m "chore: lint:fix" || true
```

---

## Task 8: Final manual QA (per `dino-qa` checklist)

**Files:**
- (none — verification only)

- [ ] **Step 1: Run dev server in mobile viewport**

Run: `bun run dev`. Open in a phone-sized viewport (Chrome DevTools mobile emulator at 390x844).

- [ ] **Step 2: Verify each acceptance criterion**

- [ ] Lovebirds active mode: birds rotate to face direction of travel.
- [ ] Lovebirds NPC orbit (Home, dino active): birds face tangent.
- [ ] 2-finger drag pans the world along the ground.
- [ ] Pan stops at area edges (Home ~8, Town ~18) — no infinite drift.
- [ ] Switching dino ↔ lovebirds recenters camera on the new active pet.
- [ ] Walking dino with joystick: pan independent of dino direction.
- [ ] Egg stage: no regressions; camera recenters on egg position.
- [ ] 1-finger tap on ground: dino still walks (TapControls unchanged).
- [ ] Existing pet/click interactions still fire on lovebirds and dino.

- [ ] **Step 3: Stop dev server**

- [ ] **Step 4: Push branch + open PR**

```bash
git push -u origin feat/spec-lovebird-yaw-camera-pan
gh pr create --title "feat: lovebird yaw + camera pan" --body "$(cat <<'EOF'
## Summary
- Lovebirds rotate to face direction of travel in both active and NPC orbit modes.
- Camera target gains 2-finger-drag pan, bounded per-area, with auto-recenter on character/area switch.

Spec: docs/superpowers/specs/2026-05-03-lovebird-yaw-camera-pan-design.md

## Test plan
- [x] Unit: `bun run test` (math helpers — 12 cases)
- [x] E2E: `bun run test:e2e`
- [x] Type-check: `bun run typecheck`
- [x] Lint: `bun run lint:fix`
- [x] Manual mobile-viewport sanity (see Task 8 checklist)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
