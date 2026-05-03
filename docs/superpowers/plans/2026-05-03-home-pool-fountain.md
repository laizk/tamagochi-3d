# Home Pool + Fountain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a round natural pond behind the cottage and a 3-tier stone fountain in the front-right yard of the Home area, with subtle procedural animation, as visual placeholders for the dino's and lovebirds' future bath targets.

**Architecture:** Two new self-contained components in a new `src/game/world/areas/home-decor/` folder, mirroring the existing `park-decor/` pattern. `Home.tsx` mounts them between the cottage and the portal. No shared abstraction with `park-decor/Pond.tsx` — the home pond diverges with a stone rim + ripple ring, so a parallel implementation is simpler than a shared one.

**Tech Stack:** React 19 + Next.js 16, react-three-fiber, three.js. No new deps.

**Spec:** `docs/superpowers/specs/2026-05-03-home-pool-fountain-design.md`

---

## File Structure

**New**
- `src/game/world/areas/home-decor/Pond.tsx` — disc + 2 lily pads + ripple-ring + 8 stone-rim spheres. Position hardcoded `[0, 0.01, -6]` (group anchor).
- `src/game/world/areas/home-decor/Fountain.tsx` — base bowl + mid pillar + mid bowl + top pillar + top bowl + 3 water discs + pulsing center jet. Position hardcoded `[2.5, 0, 1.5]`.

**Modified**
- `src/game/world/areas/Home.tsx` — import + mount `<Pond/>` and `<Fountain/>` between cottage and portal.

**Untouched**
- `src/game/world/areas/park-decor/Pond.tsx`
- All systems, store, HUD, lovebirds, dino, camera, other areas

---

## Task 1: `Pond` component

**Files:**
- Create: `src/game/world/areas/home-decor/Pond.tsx`

- [ ] **Step 1: Create the component**

Create `src/game/world/areas/home-decor/Pond.tsx` with these exact contents:

```tsx
'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';

const POND_POS: [number, number, number] = [0, 0.01, -6];
const POND_RADIUS = 1.6;
const RIM_RADIUS = 1.7;
const RIPPLE_TORUS_R = 1.2;
const STONE_COUNT = 8;
const RIPPLE_PERIOD_S = 2.0;
const RIPPLE_MIN = 0.55;
const RIPPLE_MAX = 1.05;

const stones = Array.from({ length: STONE_COUNT }, (_, i) => {
  const angle = (i * Math.PI * 2) / STONE_COUNT;
  return {
    key: i,
    pos: [Math.cos(angle) * RIM_RADIUS, 0.04, Math.sin(angle) * RIM_RADIUS] as [
      number,
      number,
      number,
    ],
  };
});

export function Pond() {
  const lily1 = useRef<Mesh>(null);
  const lily2 = useRef<Mesh>(null);
  const ripple = useRef<Mesh>(null);

  useFrame(() => {
    const t = performance.now() / 1000;
    if (lily1.current) lily1.current.rotation.y = t * 0.3;
    if (lily2.current) lily2.current.rotation.y = -t * 0.25;
    if (ripple.current) {
      const phase = (t % RIPPLE_PERIOD_S) / RIPPLE_PERIOD_S; // 0..1
      const scale = RIPPLE_MIN + (RIPPLE_MAX - RIPPLE_MIN) * phase;
      ripple.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={POND_POS}>
      {/* water disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[POND_RADIUS, 32]} />
        <meshStandardMaterial color="#5BA8C8" roughness={0.2} />
      </mesh>

      {/* lily pads */}
      <mesh ref={lily1} position={[0.45, 0.02, 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 16]} />
        <meshStandardMaterial color="#3f8a3a" />
      </mesh>
      <mesh ref={lily2} position={[-0.55, 0.02, -0.45]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.16, 16]} />
        <meshStandardMaterial color="#3f8a3a" />
      </mesh>

      {/* ripple ring (expanding torus) */}
      <mesh ref={ripple} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[RIPPLE_TORUS_R, 0.015, 8, 64]} />
        <meshStandardMaterial color="#FFFFFF" transparent opacity={0.35} />
      </mesh>

      {/* stone rim */}
      {stones.map((s) => (
        <mesh key={s.key} position={s.pos} castShadow>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#5C5854" roughness={0.9} />
        </mesh>
      ))}
    </group>
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
git add src/game/world/areas/home-decor/Pond.tsx
git commit -m "feat(home): add pond decor (dino bath placeholder)"
```

---

## Task 2: `Fountain` component

**Files:**
- Create: `src/game/world/areas/home-decor/Fountain.tsx`

- [ ] **Step 1: Create the component**

Create `src/game/world/areas/home-decor/Fountain.tsx` with these exact contents:

```tsx
'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';

const FOUNTAIN_POS: [number, number, number] = [2.5, 0, 1.5];
const STONE_COLOR = '#B8B0A6';
const WATER_COLOR = '#5BA8C8';
const JET_PERIOD_S = 1.2;
const JET_MIN = 0.85;
const JET_MAX = 1.15;

export function Fountain() {
  const jet = useRef<Mesh>(null);

  useFrame(() => {
    const t = performance.now() / 1000;
    if (jet.current) {
      const phase = (Math.sin((t / JET_PERIOD_S) * Math.PI * 2) + 1) / 2; // 0..1
      jet.current.scale.y = JET_MIN + (JET_MAX - JET_MIN) * phase;
    }
  });

  return (
    <group position={FOUNTAIN_POS}>
      {/* base bowl */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[1.0, 1.0, 0.2, 24]} />
        <meshStandardMaterial color={STONE_COLOR} roughness={0.8} />
      </mesh>
      {/* base water */}
      <mesh position={[0, 0.21, 0]}>
        <cylinderGeometry args={[0.92, 0.92, 0.02, 24]} />
        <meshStandardMaterial color={WATER_COLOR} roughness={0.2} />
      </mesh>

      {/* mid pillar */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.7, 16]} />
        <meshStandardMaterial color={STONE_COLOR} roughness={0.8} />
      </mesh>
      {/* mid bowl */}
      <mesh position={[0, 0.97, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.15, 24]} />
        <meshStandardMaterial color={STONE_COLOR} roughness={0.8} />
      </mesh>
      {/* mid water */}
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.02, 24]} />
        <meshStandardMaterial color={WATER_COLOR} roughness={0.2} />
      </mesh>

      {/* top pillar */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.4, 16]} />
        <meshStandardMaterial color={STONE_COLOR} roughness={0.8} />
      </mesh>
      {/* top bowl */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.1, 16]} />
        <meshStandardMaterial color={STONE_COLOR} roughness={0.8} />
      </mesh>
      {/* top water */}
      <mesh position={[0, 1.61, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.02, 16]} />
        <meshStandardMaterial color={WATER_COLOR} roughness={0.2} />
      </mesh>

      {/* center jet (animated scale.y) */}
      <mesh ref={jet} position={[0, 1.86, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.5, 12]} />
        <meshStandardMaterial color={WATER_COLOR} roughness={0.2} />
      </mesh>
    </group>
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
git add src/game/world/areas/home-decor/Fountain.tsx
git commit -m "feat(home): add fountain decor (lovebird bath placeholder)"
```

---

## Task 3: Mount in `Home.tsx`

**Files:**
- Modify: `src/game/world/areas/Home.tsx`

- [ ] **Step 1: Replace `Home.tsx` contents**

Replace the entire contents of `src/game/world/areas/Home.tsx` with:

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

- [ ] **Step 2: Type-check**

Run: `bun run typecheck`
Expected: clean.

- [ ] **Step 3: Lint**

Run: `bun run lint:fix`
Expected: clean. (Biome may sort imports — accept.)

- [ ] **Step 4: Commit**

```bash
git add src/game/world/areas/Home.tsx
git commit -m "feat(home): mount pond + fountain in Home area"
```

---

## Task 4: Full test suite

**Files:**
- (none — verification only)

- [ ] **Step 1: Unit tests**

Run: `bun run test`
Expected: all green. Pure visual additions; no logic changes.

- [ ] **Step 2: E2E**

Run: `bun run test:e2e`
Expected: all green. `play.spec.ts` (Home is the starting area), `phase5-dino-detail.spec.ts`, `lovebirds-areas.spec.ts`, `dino-facing.spec.ts`, `action-lock.spec.ts`, `lovebirds-stay.spec.ts`, `phase6-park-decor.spec.ts`, `play-ball.spec.ts` should all stay green.

If any fails, do NOT mark complete — investigate.

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

## Task 5: Manual mobile-viewport QA + open PR

**Files:**
- (none — verification only)

- [ ] **Step 1: Run dev server in mobile viewport**

Run: `bun run dev`. Open in a phone-sized viewport (Chrome DevTools mobile emulator at 390x844).

- [ ] **Step 2: Verify each acceptance criterion**

Reference: `docs/superpowers/specs/2026-05-03-home-pool-fountain-design.md` — Section 5 (Tests / acceptance) — Manual mobile-viewport acceptance.

- [ ] Home area shows cottage + new pond behind it + new fountain to front-right.
- [ ] Pond is round, blue, behind the cottage. Two lily pads rotate slowly. A faint ripple ring expands outward.
- [ ] Stone rim (8 dark spheres) visible around the pond edge.
- [ ] Fountain stands tall in the front-right yard with three stacked stone bowls and a blue jet column on top.
- [ ] Jet column subtly pulses up/down (~1.2s cycle).
- [ ] Portal to Town still visible at front-right and reachable by tap.
- [ ] Cottage unchanged.
- [ ] No regressions in dino (T-rex pose), lovebirds (yaw/wander), camera pan, character toggle, area transitions.

- [ ] **Step 3: Stop dev server**

- [ ] **Step 4: Push branch + open PR**

```bash
git push -u origin feat/spec-home-pool-fountain
gh pr create --title "feat(home): pool + fountain decor" --body "$(cat <<'EOF'
## Summary
Sub-spec B1 of the larger home/world restructure. Adds a round natural pond behind the cottage and a 3-tier stone fountain in the front-right yard of the Home area. Visual props only — wiring to bath actions lives in spec C2.

## Implementation
- `src/game/world/areas/home-decor/Pond.tsx` (NEW): water disc, 2 rotating lily pads, expanding ripple ring, 8 stone-rim spheres.
- `src/game/world/areas/home-decor/Fountain.tsx` (NEW): base bowl + mid pillar + mid bowl + top pillar + top bowl + 3 water discs + pulsing center jet.
- `src/game/world/areas/Home.tsx`: import + mount `<Pond/>` and `<Fountain/>` between cottage and portal.

No state, hooks, or systems modified.

Spec: `docs/superpowers/specs/2026-05-03-home-pool-fountain-design.md`
Plan: `docs/superpowers/plans/2026-05-03-home-pool-fountain.md`

## Test plan
- [x] Unit: full suite green
- [x] E2E: full mobile-viewport suite green
- [x] Type-check + lint clean
- [ ] Manual mobile-viewport sanity (Vercel preview)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
