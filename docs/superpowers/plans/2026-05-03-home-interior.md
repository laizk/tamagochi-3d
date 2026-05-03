# Home Interior 2-Storey Dollhouse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Home into a 2-storey dollhouse interior (dining + bathroom downstairs, 2 bedrooms upstairs, beds, dining table, picture frames with rendered pet portraits, visual stairs, no roof) and split the outdoor cottage + Pond + Fountain into a new Yard area between Home and Town.

**Architecture:** Eight new self-contained components in a new `src/game/world/areas/home-interior/` folder + one new `Yard.tsx` area + small additive store/registry changes. Picture frames use drei's `<RenderTexture frames={1}>` to bake static pet portraits once at mount. No behavior, motion, or persistence changes — `home` stays in `AreaId`, `yard` is added.

**Tech Stack:** React 19 + Next.js 16, react-three-fiber, three.js, @react-three/drei (already used). No new deps.

**Spec:** `docs/superpowers/specs/2026-05-03-home-interior-design.md`

---

## File Structure

**New**
- `src/game/world/areas/Yard.tsx` — outdoor area with cottage exterior + Pond + Fountain + portals.
- `src/game/world/areas/home-interior/Walls.tsx` — perimeter + half-wall dividers.
- `src/game/world/areas/home-interior/Floor.tsx` — floor 1 + floor 2 wood planes.
- `src/game/world/areas/home-interior/Stairs.tsx` — 5 visual steps against back wall.
- `src/game/world/areas/home-interior/Bed.tsx` — frame + mattress + pillow + sheet (color prop).
- `src/game/world/areas/home-interior/DiningTable.tsx` — table + 4 legs + 2 chairs.
- `src/game/world/areas/home-interior/portraits/DinoPortrait.tsx` — head-only happy mini scene.
- `src/game/world/areas/home-interior/portraits/LovebirdPortrait.tsx` — head-only happy mini scene.
- `src/game/world/areas/home-interior/PictureFrame.tsx` — wood border + RenderTexture inner plane.

**Modified**
- `src/game/store.ts` — `AreaId` adds `'yard'`.
- `src/game/world/areas/registry.ts` — add `yard` entry, update `home.exits` and `home.extent`, swap `town.exits` `home → yard`.
- `src/game/world/areas/Town.tsx` — portal target `home → yard`.
- `src/game/world/areas/Home.tsx` — replace cottage exterior with interior dollhouse layout.

**Untouched**
- All systems, persistence, HUD, lovebirds, dino, camera, motion, walk cycle.
- `home-decor/Pond.tsx`, `home-decor/Fountain.tsx` (mounted from Yard via group offset).

---

## Task 1: Add `yard` area (AreaId + registry + Yard component + Town portal swap)

**Files:**
- Modify: `src/game/store.ts`
- Modify: `src/game/world/areas/registry.ts`
- Create: `src/game/world/areas/Yard.tsx`
- Modify: `src/game/world/areas/Town.tsx`

This task adds Yard as a new accessible area. Home stays outdoor for now (interior comes in Task 5). Yard reachable via MiniMap and via Town's portal.

- [ ] **Step 1: Widen `AreaId` in `store.ts`**

In `src/game/store.ts`, find:
```ts
export type AreaId = 'home' | 'town' | 'park' | 'beach' | 'forest' | 'cave' | 'sky';
```
Replace with:
```ts
export type AreaId = 'home' | 'yard' | 'town' | 'park' | 'beach' | 'forest' | 'cave' | 'sky';
```

- [ ] **Step 2: Create `Yard.tsx`**

Create `src/game/world/areas/Yard.tsx` with these exact contents:

```tsx
'use client';
import { Portal } from '@/src/game/world/Portal';
import { Fountain } from '@/src/game/world/areas/home-decor/Fountain';
import { Pond } from '@/src/game/world/areas/home-decor/Pond';
import { Ground } from '@/src/game/world/props/Ground';
import { Sky } from '@/src/game/world/props/Sky';

export function Yard() {
  return (
    <>
      <Sky />
      <Ground color="#a98e6a" />
      {/* cottage exterior — sized 6×2×6 to match the interior footprint */}
      <mesh position={[0, 1, -3]} castShadow>
        <boxGeometry args={[6, 2, 6]} />
        <meshStandardMaterial color="#d97a5e" />
      </mesh>
      <mesh position={[0, 2.5, -3]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[4.5, 1.5, 4]} />
        <meshStandardMaterial color="#7e3f2c" />
      </mesh>
      {/* Pond wrapped to push it 3.5u further back so it clears the bigger cottage */}
      <group position={[0, 0, -3.5]}>
        <Pond />
      </group>
      <Fountain />
      <Portal to="home" position={[0, 0.7, 0.3]} />
      <Portal to="town" position={[8, 0.7, 0]} />
    </>
  );
}
```

- [ ] **Step 3: Register `yard` in `registry.ts`**

Edit `src/game/world/areas/registry.ts`. Add the import + entry + update town/home:

Add import line (alphabetic with siblings):
```ts
import { Yard } from './Yard';
```

In the `AREAS` map:
- Update `home`:
  ```ts
  home: {
    id: 'home',
    name: 'Home',
    emoji: '🏠',
    Component: Home,
    spawn: [0, 0, 0],
    exits: ['yard'],
    extent: 10,
  },
  ```
  (Was `extent: 8` and `exits: ['town']`.)
- Update `town.exits` from `['home', 'park', 'beach', 'forest']` to `['yard', 'park', 'beach', 'forest']`. Leave the rest of `town` unchanged.
- Add `yard` entry between `home` and `town`:
  ```ts
  yard: {
    id: 'yard',
    name: 'Yard',
    emoji: '🌿',
    Component: Yard,
    spawn: [0, 0, 2],
    exits: ['home', 'town'],
    extent: 12,
  },
  ```

- [ ] **Step 4: Update Town's portal target**

Edit `src/game/world/areas/Town.tsx`. Find the line `<Portal to="home" position={[-8, 0.7, 0]} />` and change `to="home"` to `to="yard"`. Other portals unchanged.

- [ ] **Step 5: Type-check + lint**

```bash
bun run typecheck   # clean
bun run lint:fix    # clean
```

- [ ] **Step 6: Commit**

```bash
git add src/game/store.ts src/game/world/areas/registry.ts src/game/world/areas/Yard.tsx src/game/world/areas/Town.tsx
git commit -m "feat(yard): add yard area between home and town"
```

---

## Task 2: home-interior shell — Walls + Floor + Stairs

**Files:**
- Create: `src/game/world/areas/home-interior/Walls.tsx`
- Create: `src/game/world/areas/home-interior/Floor.tsx`
- Create: `src/game/world/areas/home-interior/Stairs.tsx`

Three sibling presentational components. No props, no logic. Mounted later in Task 5.

- [ ] **Step 1: Create `Walls.tsx`**

Create `src/game/world/areas/home-interior/Walls.tsx`:

```tsx
'use client';

const WALL_COLOR = '#F5E8D6';
const FULL_HEIGHT = 5;
const HALF_HEIGHT = 1.25;

export function Walls() {
  return (
    <>
      {/* north (back) wall */}
      <mesh position={[0, FULL_HEIGHT / 2, -3]} castShadow>
        <boxGeometry args={[6, FULL_HEIGHT, 0.1]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* west wall */}
      <mesh position={[-3, FULL_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[0.1, FULL_HEIGHT, 6]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* east wall */}
      <mesh position={[3, FULL_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[0.1, FULL_HEIGHT, 6]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* south wall — split with 1.5u doorway gap centered on x=0 */}
      <mesh position={[-1.875, FULL_HEIGHT / 2, 3]} castShadow>
        <boxGeometry args={[2.25, FULL_HEIGHT, 0.1]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      <mesh position={[1.875, FULL_HEIGHT / 2, 3]} castShadow>
        <boxGeometry args={[2.25, FULL_HEIGHT, 0.1]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* floor 1 divider — half-height so pet roams freely */}
      <mesh position={[0, HALF_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[0.1, HALF_HEIGHT, 6]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* floor 2 divider — half-height */}
      <mesh position={[0, 2.5 + HALF_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[0.1, HALF_HEIGHT, 6]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
    </>
  );
}
```

- [ ] **Step 2: Create `Floor.tsx`**

Create `src/game/world/areas/home-interior/Floor.tsx`:

```tsx
'use client';

const FLOOR_COLOR = '#D9B98A';

export function Floor() {
  return (
    <>
      {/* floor 1 (ground) */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[6, 0.05, 6]} />
        <meshStandardMaterial color={FLOOR_COLOR} />
      </mesh>
      {/* floor 2 */}
      <mesh position={[0, 2.5, 0]} receiveShadow castShadow>
        <boxGeometry args={[6, 0.05, 6]} />
        <meshStandardMaterial color={FLOOR_COLOR} />
      </mesh>
    </>
  );
}
```

- [ ] **Step 3: Create `Stairs.tsx`**

Create `src/game/world/areas/home-interior/Stairs.tsx`:

```tsx
'use client';

const STAIR_COLOR = '#C49A6C';
const STEP_RISE = 0.5;
const STEP_DEPTH = 0.6;
const STEPS = 5;

export function Stairs() {
  return (
    <>
      {Array.from({ length: STEPS }, (_, i) => (
        <mesh
          key={i}
          position={[2.0, (STEP_RISE * (i + 1)) / 2, -3 + 0.3 + i * STEP_DEPTH]}
          castShadow
        >
          <boxGeometry args={[1.0, STEP_RISE * (i + 1), STEP_DEPTH]} />
          <meshStandardMaterial color={STAIR_COLOR} />
        </mesh>
      ))}
    </>
  );
}
```

(Each step extrudes from the floor up to its tread height — simpler than stacking individual blocks and gives the same visual silhouette.)

- [ ] **Step 4: Type-check + lint**

```bash
bun run typecheck   # clean
bun run lint:fix    # clean
```

- [ ] **Step 5: Commits (one per file)**

```bash
git add src/game/world/areas/home-interior/Walls.tsx
git commit -m "feat(home): add interior walls component"

git add src/game/world/areas/home-interior/Floor.tsx
git commit -m "feat(home): add interior floor component (2 floors)"

git add src/game/world/areas/home-interior/Stairs.tsx
git commit -m "feat(home): add visual stairs component"
```

---

## Task 3: home-interior furniture — Bed + DiningTable

**Files:**
- Create: `src/game/world/areas/home-interior/Bed.tsx`
- Create: `src/game/world/areas/home-interior/DiningTable.tsx`

- [ ] **Step 1: Create `Bed.tsx`**

Create `src/game/world/areas/home-interior/Bed.tsx`:

```tsx
'use client';

const FRAME_COLOR = '#7E5A3A';
const MATTRESS_COLOR = '#FFFFFF';
const PILLOW_COLOR = '#FFFFFF';

type Props = {
  /** Sheet color — kid-readable, e.g. #7AC0FF or #FF9CB8. */
  sheetColor: string;
  position: [number, number, number];
  rotation?: [number, number, number];
};

export function Bed({ sheetColor, position, rotation = [0, 0, 0] }: Props) {
  return (
    <group position={position} rotation={rotation}>
      {/* frame */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.8, 0.4, 1.6]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.8} />
      </mesh>
      {/* mattress */}
      <mesh position={[0, 0.475, 0]} castShadow>
        <boxGeometry args={[0.7, 0.15, 1.5]} />
        <meshStandardMaterial color={MATTRESS_COLOR} roughness={0.7} />
      </mesh>
      {/* sheet */}
      <mesh position={[0, 0.575, 0.25]} castShadow>
        <boxGeometry args={[0.71, 0.05, 1.0]} />
        <meshStandardMaterial color={sheetColor} roughness={0.7} />
      </mesh>
      {/* pillow */}
      <mesh position={[0, 0.65, -0.55]} castShadow>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color={PILLOW_COLOR} roughness={0.7} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 2: Create `DiningTable.tsx`**

Create `src/game/world/areas/home-interior/DiningTable.tsx`:

```tsx
'use client';

const WOOD_COLOR = '#7E5A3A';

type Props = {
  position: [number, number, number];
};

export function DiningTable({ position }: Props) {
  return (
    <group position={position}>
      {/* table top */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[1.2, 0.05, 0.8]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
      </mesh>
      {/* 4 legs */}
      <mesh position={[-0.55, 0.35, -0.35]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[0.55, 0.35, -0.35]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[-0.55, 0.35, 0.35]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[0.55, 0.35, 0.35]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
      </mesh>
      {/* chair 1 (west side) */}
      <mesh position={[-0.85, 0.2, 0]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[-1.05, 0.45, 0]} castShadow>
        <boxGeometry args={[0.05, 0.5, 0.4]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
      </mesh>
      {/* chair 2 (east side) */}
      <mesh position={[0.85, 0.2, 0]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[1.05, 0.45, 0]} castShadow>
        <boxGeometry args={[0.05, 0.5, 0.4]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 3: Type-check + lint**

```bash
bun run typecheck   # clean
bun run lint:fix    # clean
```

- [ ] **Step 4: Commits**

```bash
git add src/game/world/areas/home-interior/Bed.tsx
git commit -m "feat(home): add bed component (sheet color prop)"

git add src/game/world/areas/home-interior/DiningTable.tsx
git commit -m "feat(home): add dining table + 2 chairs component"
```

---

## Task 4: Portraits + PictureFrame

**Files:**
- Create: `src/game/world/areas/home-interior/portraits/DinoPortrait.tsx`
- Create: `src/game/world/areas/home-interior/portraits/LovebirdPortrait.tsx`
- Create: `src/game/world/areas/home-interior/PictureFrame.tsx`

- [ ] **Step 1: Create `DinoPortrait.tsx`**

Create `src/game/world/areas/home-interior/portraits/DinoPortrait.tsx`:

```tsx
'use client';

const BODY_COLOR = '#A8D5EE';
const CHEEK_COLOR = '#FF9CB8';
const EYE_COLOR = '#1A1A1A';
const SMILE_COLOR = '#1A1A1A';

/**
 * Static smiling dino head for the picture-frame portrait.
 * Centered at origin so a camera at [0, 0, 1.2] looking at origin frames it well.
 */
export function DinoPortrait() {
  return (
    <>
      {/* head */}
      <mesh>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
      {/* cheeks */}
      <mesh position={[-0.2, -0.05, 0.27]} scale={[1, 0.6, 0.4]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color={CHEEK_COLOR} roughness={0.6} />
      </mesh>
      <mesh position={[0.2, -0.05, 0.27]} scale={[1, 0.6, 0.4]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color={CHEEK_COLOR} roughness={0.6} />
      </mesh>
      {/* closed-happy eyes (small dark dots) */}
      <mesh position={[-0.12, 0.08, 0.3]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial color={EYE_COLOR} />
      </mesh>
      <mesh position={[0.12, 0.08, 0.3]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial color={EYE_COLOR} />
      </mesh>
      {/* smile (thin curved bar approximated as a flat torus segment) */}
      <mesh position={[0, -0.1, 0.32]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.08, 0.012, 8, 24, Math.PI]} />
        <meshStandardMaterial color={SMILE_COLOR} />
      </mesh>
    </>
  );
}
```

- [ ] **Step 2: Create `LovebirdPortrait.tsx`**

Create `src/game/world/areas/home-interior/portraits/LovebirdPortrait.tsx`:

```tsx
'use client';

const TOP_COLOR = '#FF7AB6';
const BEAK_COLOR = '#FFD24A';
const EYE_COLOR = '#1A1A1A';

/**
 * Static smiling lovebird head for the picture-frame portrait.
 * Centered at origin so a camera at [0, 0, 1.2] looking at origin frames it well.
 */
export function LovebirdPortrait() {
  return (
    <>
      {/* head — bigger than in-game so it fills the frame */}
      <mesh>
        <sphereGeometry args={[0.3, 24, 24]} />
        <meshStandardMaterial color={TOP_COLOR} roughness={0.7} />
      </mesh>
      {/* beak */}
      <mesh position={[0, -0.05, 0.32]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.07, 0.14, 8]} />
        <meshStandardMaterial color={BEAK_COLOR} roughness={0.5} />
      </mesh>
      {/* eyes */}
      <mesh position={[-0.12, 0.07, 0.27]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color={EYE_COLOR} />
      </mesh>
      <mesh position={[0.12, 0.07, 0.27]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color={EYE_COLOR} />
      </mesh>
    </>
  );
}
```

- [ ] **Step 3: Create `PictureFrame.tsx`**

Create `src/game/world/areas/home-interior/PictureFrame.tsx`:

```tsx
'use client';

import { PerspectiveCamera, RenderTexture } from '@react-three/drei';
import { DinoPortrait } from './portraits/DinoPortrait';
import { LovebirdPortrait } from './portraits/LovebirdPortrait';

const FRAME_COLOR = '#7E5A3A';
const BG_COLOR = '#FFE0F0';

type Props = {
  subject: 'dino' | 'lovebird';
  position: [number, number, number];
  rotation?: [number, number, number];
};

/**
 * Wood-bordered picture frame with a baked-once portrait of the dino or
 * lovebird. Uses drei's RenderTexture(frames=1) so the inner scene renders
 * a single time at mount and is cached as the inner plane's `.map`.
 */
export function PictureFrame({ subject, position, rotation = [0, 0, 0] }: Props) {
  return (
    <group position={position} rotation={rotation}>
      {/* wood border (4 thin boxes) */}
      <mesh position={[0, 0.275, 0]} castShadow>
        <boxGeometry args={[0.6, 0.05, 0.05]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.275, 0]} castShadow>
        <boxGeometry args={[0.6, 0.05, 0.05]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[-0.275, 0, 0]} castShadow>
        <boxGeometry args={[0.05, 0.55, 0.05]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[0.275, 0, 0]} castShadow>
        <boxGeometry args={[0.05, 0.55, 0.05]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.8} />
      </mesh>
      {/* inner plane with baked portrait */}
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[0.5, 0.5]} />
        <meshStandardMaterial>
          <RenderTexture frames={1} attach="map" width={256} height={256}>
            <color attach="background" args={[BG_COLOR]} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[2, 2, 2]} intensity={0.8} />
            <PerspectiveCamera makeDefault position={[0, 0, 1.2]} fov={50} />
            {subject === 'dino' ? <DinoPortrait /> : <LovebirdPortrait />}
          </RenderTexture>
        </meshStandardMaterial>
      </mesh>
    </group>
  );
}
```

- [ ] **Step 4: Type-check + lint**

```bash
bun run typecheck   # clean
bun run lint:fix    # clean
```

- [ ] **Step 5: Commits**

```bash
git add src/game/world/areas/home-interior/portraits/DinoPortrait.tsx
git commit -m "feat(home): add dino portrait for picture frames"

git add src/game/world/areas/home-interior/portraits/LovebirdPortrait.tsx
git commit -m "feat(home): add lovebird portrait for picture frames"

git add src/game/world/areas/home-interior/PictureFrame.tsx
git commit -m "feat(home): add picture frame with baked portrait (RenderTexture)"
```

---

## Task 5: Replace `Home.tsx` with interior

**Files:**
- Modify: `src/game/world/areas/Home.tsx`

This task swaps the outdoor Home for the dollhouse interior. Yard already exists from Task 1. After this commit, players selecting Home land inside.

- [ ] **Step 1: Replace `Home.tsx` contents**

Replace the entire contents of `src/game/world/areas/Home.tsx` with:

```tsx
'use client';
import { Portal } from '@/src/game/world/Portal';
import { Bed } from '@/src/game/world/areas/home-interior/Bed';
import { DiningTable } from '@/src/game/world/areas/home-interior/DiningTable';
import { Floor } from '@/src/game/world/areas/home-interior/Floor';
import { PictureFrame } from '@/src/game/world/areas/home-interior/PictureFrame';
import { Stairs } from '@/src/game/world/areas/home-interior/Stairs';
import { Walls } from '@/src/game/world/areas/home-interior/Walls';
import { Sky } from '@/src/game/world/props/Sky';

export function Home() {
  return (
    <>
      <Sky />
      <Walls />
      <Floor />
      <Stairs />
      <DiningTable position={[-1.5, 0, 0]} />
      <Bed sheetColor="#7AC0FF" position={[-1.5, 2.5, -1]} />
      <Bed sheetColor="#FF9CB8" position={[1.5, 2.5, -1]} />
      <PictureFrame subject="dino" position={[-2.95, 1.6, 0]} rotation={[0, Math.PI / 2, 0]} />
      <PictureFrame subject="lovebird" position={[2.95, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <PictureFrame subject="lovebird" position={[-2.95, 4.1, 0]} rotation={[0, Math.PI / 2, 0]} />
      <PictureFrame subject="dino" position={[2.95, 4.1, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <Portal to="yard" position={[0, 0.7, 3.5]} />
    </>
  );
}
```

- [ ] **Step 2: Type-check + lint**

```bash
bun run typecheck   # clean
bun run lint:fix    # clean (Biome may sort imports)
```

- [ ] **Step 3: Commit**

```bash
git add src/game/world/areas/Home.tsx
git commit -m "feat(home): replace cottage with 2-storey dollhouse interior"
```

---

## Task 6: Full test suite + Manual mobile QA + open PR

**Files:**
- (none — verification only)

- [ ] **Step 1: Unit tests**

Run: `bun run test`
Expected: all green. Pure visual additions; no logic.

- [ ] **Step 2: E2E**

Run: `bun run test:e2e`
Expected: all green.

- `play.spec.ts` `travel to town via portal works` — uses MiniMap to teleport to Town directly. MiniMap shows ALL areas in `AREAS`, not just exits, so adding Yard adds another button but doesn't break the Town-tap. Should pass.
- `lovebirds-areas.spec.ts` iterates a hardcoded `['home', 'town', 'park', 'beach', 'forest', 'cave']` list; doesn't touch yard. Should pass.
- Other specs (`phase5-dino-detail`, `phase6-park-decor`, etc.) don't touch Home navigation. Should pass.

If any fails, do NOT mark complete — investigate.

- [ ] **Step 3: Final type-check + lint**

```bash
bun run typecheck
bun run lint:fix
```

If `lint:fix` made changes, commit:

```bash
git add -A
git status   # verify only formatting changes
git commit -m "chore: lint:fix" || true
```

- [ ] **Step 4: Manual mobile-viewport QA**

Run `bun run dev`, open at 390×844 mobile viewport.

- [ ] Selecting Home shows interior dollhouse: walls visible, no roof, floor 1 + floor 2 simultaneously visible from default camera.
- [ ] Floor 1: dining (left half) with table + 2 chairs; bathroom (right half) empty.
- [ ] Floor 2: 2 bedrooms (left + right), each with a bed (different sheet color: blue + pink).
- [ ] Visual stairs at back-east corner ascending from floor 1 to floor 2.
- [ ] 4 picture frames on walls, each showing a smiling pet portrait (dino or lovebird).
- [ ] Pet (dino + lovebirds) spawns inside on floor 1.
- [ ] Walking south to the doorway → portal (visible torus at z=3.5) → tapping or walking into it travels to Yard.
- [ ] Yard shows cottage exterior (bigger 6×6 footprint), pond behind cottage (well clear), fountain front-right, 2 portals (to Home, to Town).
- [ ] Town's portal to Yard works (replaces old Home target).
- [ ] No regressions in dino (T-rex pose), lovebirds (yaw/wander), camera pan, character toggle, mood face, action FX.

Stop dev server.

- [ ] **Step 5: Push branch + open PR**

```bash
git push -u origin feat/spec-home-interior
gh pr create --title "feat(home): 2-storey dollhouse interior + yard area" --body "$(cat <<'EOF'
## Summary
Sub-spec B2a of the larger restructure. Turns Home into a 2-storey dollhouse interior (no roof, dollhouse-style view): dining + bathroom downstairs, 2 bedrooms upstairs, beds, dining table, picture frames showing baked portraits of the pets, visual stairs. Outdoor cottage + Pond + Fountain move to a new Yard area between Home and Town.

## Implementation
- New `src/game/world/areas/Yard.tsx` — outdoor area with cottage 6×2×6 + Pond (offset back to clear cottage) + Fountain + 2 portals.
- New `src/game/world/areas/home-interior/` folder: `Walls.tsx`, `Floor.tsx`, `Stairs.tsx`, `Bed.tsx`, `DiningTable.tsx`, `PictureFrame.tsx`, `portraits/DinoPortrait.tsx`, `portraits/LovebirdPortrait.tsx`.
- `PictureFrame` uses drei `<RenderTexture frames={1}>` to bake the portrait once at mount.
- `Home.tsx` replaced with interior layout.
- `store.ts`: `AreaId += 'yard'`.
- `registry.ts`: add yard, update home.exits, home.extent, town.exits.
- `Town.tsx`: portal `to="home"` → `to="yard"`.

No state, motion, walk-cycle, or persistence changes. Functional stairs deferred to spec B2b.

Spec: `docs/superpowers/specs/2026-05-03-home-interior-design.md`
Plan: `docs/superpowers/plans/2026-05-03-home-interior.md`

## Test plan
- [x] Unit: full suite green
- [x] E2E: full mobile-viewport suite green
- [x] Type-check + lint clean
- [ ] Manual mobile-viewport sanity (Vercel preview):
  - [ ] Home opens to dollhouse interior (open roof, 2 floors visible)
  - [ ] Furniture: dining table + chairs, 2 beds (blue + pink sheets), 4 picture frames with portraits
  - [ ] Visual stairs against back wall
  - [ ] Walking out south doorway → portal → Yard
  - [ ] Yard cottage (6×6) + pond behind (cleared) + fountain front + portals to Home + Town
  - [ ] Town → Yard portal works

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
