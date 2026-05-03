# Home Interior — 2-Storey Dollhouse — Design

**Date:** 2026-05-03
**Status:** Draft
**Roadmap context:** Sub-spec **B2a** of the larger restructure (A1 dino upright ✅, B1 pool/fountain ✅, B2a interior shell + furniture (this), B2b functional stairs, C1 food objects, C2 seek-target). This spec turns the Home area into the interior of a 2-storey house and moves the outdoor decor (cottage exterior, pool, fountain) into a new "Yard" area.

## Problem

The Home area is currently a small outdoor scene with a cottage box, roof, pond (B1), and fountain (B1). The roadmap calls for selecting "Home" to drop the player INSIDE the house — a 2-storey dollhouse with bedrooms upstairs, dining + bathroom downstairs, beds, dining table, picture frames showing portraits of the pets, and visual stairs. The outdoor cottage exterior + pond + fountain need a new home: a "Yard" area between Home and Town.

## Goals

- Replace `Home.tsx` with a 2-storey interior view: floor 1 (dining left + bathroom right), floor 2 (2 bedrooms), perimeter walls, an interior divider per floor, no roof.
- Use a "dollhouse" view: existing OrbitControls + CameraRig sees through the open top.
- Add furniture: 1 dining table + 4 legs + 2 chairs in dining; 2 beds (different sheet colors) one per upstairs bedroom; 4 picture frames mounted on walls.
- Picture frames render a static portrait of either the dino's head or the lovebird's head using `drei <RenderTexture frames={1}>` so the texture is baked once at mount and cached.
- Visual stairs against the back wall (not functional — pet stays on floor 1).
- Add a new `Yard` area with the cottage exterior + Pond + Fountain (moved from B1 Home), plus portals to Home and Town.
- Update area registry: `home.exits = ['yard']`, `yard.exits = ['home', 'town']`, `town.exits` swaps `home` for `yard`.
- Town's portal targeting `home` is renamed to target `yard`.

## Non-goals

- Functional stairs (pet walks upstairs). Deferred to spec B2b.
- Room-specific behavior (eating only happens in dining, sleeping only in bedrooms). Deferred to spec C2.
- Bathroom fixtures (sink, toilet). Empty room placeholder for B2a.
- Animated portraits. RenderTexture is `frames={1}` — one shot at mount, never re-renders.
- Wall culling / cutaway. Open-roof view sidesteps the need.
- New camera math, new motion behavior, new persistence schema (AreaId widens but old saves load fine since `home` still exists).
- Kid co-pilot opens a JSON config to redesign rooms — for now coords are inline literals, same pattern as the rest of the code.

## Design

### 1. Areas + nav

| area | spawn | exits | extent | emoji |
|---|---|---|---|---|
| home (interior) | `[0, 0, 0]` | `['yard']` | 10 (was 8) | 🏠 |
| **yard (NEW)** | `[0, 0, 2]` | `['home', 'town']` | 12 | 🌿 |
| town | `[0, 0, 0]` | `['yard', 'park', 'beach', 'forest']` | 18 | 🏘️ |

`AreaId` in `src/game/store.ts` widens to include `'yard'`. Existing localStorage saves with `currentArea: 'home'` keep working (Home still exists).

`Town.tsx` portal `<Portal to="home" position={[-8, 0.7, 0]} />` becomes `<Portal to="yard" position={[-8, 0.7, 0]} />` (same physical position; just a different target area).

### 2. House geometry

Footprint: 6×6 units, centered at origin.
- x range: -3..3
- z range: -3..3
- Floor 1 from y=0 to y=2.5
- Floor 2 from y=2.5 to y=5
- No roof.

**Floors (`Floor.tsx`):**
- Floor 1 plane: `[6, 0.05, 6]` box at `[0, 0, 0]`, color light wood `#D9B98A`. (Slightly thick to cast shadow.)
- Floor 2 plane: `[6, 0.05, 6]` box at `[0, 2.5, 0]`, color same.

**Walls (`Walls.tsx`):**
- Perimeter walls: 4 thin boxes (0.1u thick) running the full 5u height.
  - North (back) wall at z=-3: `boxGeometry args={[6, 5, 0.1]}` at `[0, 2.5, -3]`, color cream `#F5E8D6`.
  - West wall at x=-3: `boxGeometry args={[0.1, 5, 6]}` at `[-3, 2.5, 0]`, same.
  - East wall at x=+3: same on opposite side.
  - South (front) wall: SPLIT into two segments leaving a doorway gap (1.5u wide) centered on x=0:
    - Left: `boxGeometry args={[2.25, 5, 0.1]}` at `[-1.875, 2.5, 3]`.
    - Right: `boxGeometry args={[2.25, 5, 0.1]}` at `[1.875, 2.5, 3]`.
- Interior dividers:
  - Floor 1: vertical wall splitting dining (left) from bathroom (right). `boxGeometry args={[0.1, 2.5, 6]}` at `[0, 1.25, 0]`, height 2.5 (one floor only). Has a 1.0u doorway gap at center (z=-0.5..0.5)? Actually for visual simplicity, omit doorway and just have full divider — pets don't navigate floor 1 between rooms in this spec (deferred to C2 with seek-target).
  - Wait — pet must be able to move freely in floor 1 since they walk to e.g. the bed (later) or food (later). For B2a (no behavior wiring), pet just stands. But future-proof: add a doorway in the floor 1 divider so the pet CAN walk between dining and bathroom for free roam.
  - Decision: floor-1 divider is a half-wall (1.25u tall, half the floor's 2.5u) so the pet is unconstrained but the rooms read as separate from above. Geometry: `boxGeometry args={[0.1, 1.25, 6]}` at `[0, 0.625, 0]`.
  - Floor 2 divider (between bedrooms): same half-wall pattern. `boxGeometry args={[0.1, 1.25, 6]}` at `[0, 3.125, 0]`.

**Stairs (`Stairs.tsx`):**
- 5 steps against the back-east corner, going from floor 1 (y=0) to floor 2 (y=2.5). Step rise = 0.5, step depth = 0.6.
- Each step: `boxGeometry args={[1.0, 0.5, 0.6]}` at `[2.0, stepY/2, -3 + 0.3 + (i * 0.6)]` for i in 0..4.
- Color light wood `#C49A6C`.
- Visual only.

### 3. Furniture

**Bed (`Bed.tsx`):**
- Frame: `boxGeometry args={[0.8, 0.4, 1.6]}` at `[0, 0.2, 0]`, color brown `#7E5A3A`.
- Mattress: `boxGeometry args={[0.7, 0.15, 1.5]}` at `[0, 0.475, 0]`, color white.
- Pillow: `sphereGeometry args={[0.18, 12, 12]}` at `[0, 0.65, -0.55]`, color white.
- Sheet (color prop): `boxGeometry args={[0.71, 0.05, 1.0]}` at `[0, 0.575, 0.25]`, color = `sheetColor` prop.

API:
```tsx
type Props = { sheetColor: string; position: [number, number, number]; rotation?: [number, number, number] };
```

**DiningTable (`DiningTable.tsx`):**
- Top: `boxGeometry args={[1.2, 0.05, 0.8]}` at `[0, 0.7, 0]`, color brown `#7E5A3A`.
- 4 legs: `cylinderGeometry args={[0.04, 0.04, 0.7, 8]}` at corners `[±0.55, 0.35, ±0.35]`, same brown.
- Chair 1: small `boxGeometry args={[0.4, 0.4, 0.4]}` seat at `[-0.85, 0.2, 0]` + back `boxGeometry args={[0.4, 0.5, 0.05]}` at `[-1.05, 0.45, 0]`, color same brown.
- Chair 2: mirror at `+0.85` x.

API:
```tsx
type Props = { position: [number, number, number] };
```

**PictureFrame (`PictureFrame.tsx`):**
- Outer wood border: 4 thin boxes forming a 0.6×0.6 square frame, depth 0.05.
  - top: `boxGeometry args={[0.6, 0.05, 0.05]}` at `[0, 0.275, 0]`, color brown `#7E5A3A`.
  - bottom: same at `[0, -0.275, 0]`.
  - left: `boxGeometry args={[0.05, 0.55, 0.05]}` at `[-0.275, 0, 0]`.
  - right: same at `[0.275, 0, 0]`.
- Inner plane: `planeGeometry args={[0.5, 0.5]}` at `[0, 0, 0.005]`, with a `meshStandardMaterial` using `<RenderTexture frames={1} attach="map">`.
- Wall mount: parent supplies position + rotation so the frame sits flat against a wall.

API:
```tsx
type Props = {
  subject: 'dino' | 'lovebird';
  position: [number, number, number];
  rotation?: [number, number, number];
};
```

The RenderTexture body picks the right portrait based on `subject`:
```tsx
<meshStandardMaterial>
  <RenderTexture frames={1} attach="map" width={256} height={256}>
    <color attach="background" args={['#FFE0F0']} />
    <ambientLight intensity={0.6} />
    <directionalLight position={[2, 2, 2]} intensity={0.8} />
    <PerspectiveCamera makeDefault position={[0, 0, 1.2]} />
    {subject === 'dino' ? <DinoPortrait /> : <LovebirdPortrait />}
  </RenderTexture>
</meshStandardMaterial>
```

`drei` exports `RenderTexture` and `PerspectiveCamera`. `drei` is already used elsewhere (`OrbitControls`).

**Portraits (`portraits/DinoPortrait.tsx`, `portraits/LovebirdPortrait.tsx`):**
- Tiny scenes with just the head + face of the character, scaled to fit the camera frustum at distance 1.2.
- `DinoPortrait`: light-blue head sphere `[0.32, 24, 24]` + simple closed-eye + smile-line + cheeks. Mane optional.
- `LovebirdPortrait`: pink/blue lovebird head sphere `[0.14, 24, 24]` + beak + eye + smile.
- Both centered at origin so the camera at `[0, 0, 1.2]` looking at origin frames them nicely.
- These are NEW small components — they do NOT reuse `face/Eyes`, `face/Snout`, etc. (those depend on world coords + expression system; portraits are static smile).

**Picture-frame placements** (mounted in `Home.tsx`):
- Dining left wall: `<PictureFrame subject="dino" position={[-2.95, 1.6, 0]} rotation={[0, Math.PI / 2, 0]} />` — facing +x (into room).
- Bathroom right wall: `<PictureFrame subject="lovebird" position={[2.95, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]} />`.
- Bedroom 1 (upstairs left) west wall: `<PictureFrame subject="lovebird" position={[-2.95, 4.1, 0]} rotation={[0, Math.PI / 2, 0]} />`.
- Bedroom 2 (upstairs right) east wall: `<PictureFrame subject="dino" position={[2.95, 4.1, 0]} rotation={[0, -Math.PI / 2, 0]} />`.

Frame x is at the wall surface (wall at x=±3, frame depth 0.05 → center at ±2.95). Y at 1.6 for floor 1 (mid-wall), 4.1 for floor 2.

### 4. `Home.tsx` (interior)

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
      <Bed sheetColor="#7AC0FF" position={[-1.5, 2.5, -1]} rotation={[0, 0, 0]} />
      <Bed sheetColor="#FF9CB8" position={[1.5, 2.5, -1]} rotation={[0, 0, 0]} />
      <PictureFrame subject="dino" position={[-2.95, 1.6, 0]} rotation={[0, Math.PI / 2, 0]} />
      <PictureFrame subject="lovebird" position={[2.95, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <PictureFrame subject="lovebird" position={[-2.95, 4.1, 0]} rotation={[0, Math.PI / 2, 0]} />
      <PictureFrame subject="dino" position={[2.95, 4.1, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <Portal to="yard" position={[0, 0.7, 3.5]} />
    </>
  );
}
```

The doorway gap is at z=3 (south wall split). The portal sits just outside the doorway at z=3.5, y=0.7 — pet walks south into the portal to travel to Yard.

No `Ground` — the floor IS the ground inside.

### 5. `Yard.tsx` (NEW)

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

Cottage exterior is sized 6×2×6 to match the new 6×6 interior footprint, so the outside view reads consistent with what the player will see inside. Roof cone scaled up proportionally (radius 4.5, height 1.5).

The bigger cottage now occupies `z=-6..0`. Pond was previously at `z=-6` (radius 1.6 → would intersect cottage rear). Pond is wrapped in `<group position={[0, 0, -3.5]}>` inside `Yard.tsx` so its effective position becomes `z=-9.5` (rim at `z=-11.1..-7.9`) — 1.9u clear of cottage rear. `Pond.tsx` itself stays unchanged. Yard extent is 12 → camera pan still reaches the pond.

Fountain stays at `[2.5, 0, 1.5]` — already in front of the cottage south face (`z=0`), no overlap with the bigger cottage.

Portal `home` at `[0, 0.7, 0.3]` — directly in front of the cottage south face (the "front door"). Portal `town` at `[8, 0.7, 0]` — east edge.

### 6. Registry update

```ts
home: { ..., spawn: [0, 0, 0], exits: ['yard'], extent: 10 },
yard: {
  id: 'yard', name: 'Yard', emoji: '🌿',
  Component: Yard, spawn: [0, 0, 2], exits: ['home', 'town'], extent: 12,
},
town: { ..., exits: ['yard', 'park', 'beach', 'forest'], extent: 18 },
```

Add `import { Yard } from './Yard';` at the top.

### 7. Files

```
src/game/world/areas/
  Home.tsx                         ← MOD: interior dollhouse
  Yard.tsx                         ← NEW: outdoor (was Home content)
  Town.tsx                         ← MOD: portal target home → yard
  registry.ts                      ← MOD: add yard, update exits, bump home extent
  home-interior/                   ← NEW folder
    Walls.tsx                      ← perimeter + dividers
    Floor.tsx                      ← floor 1 + floor 2 planes
    Stairs.tsx                     ← 5 visual steps
    Bed.tsx                        ← takes sheetColor + position + rotation
    DiningTable.tsx                ← table + 2 chairs
    PictureFrame.tsx               ← wood border + RenderTexture inner plane
    portraits/
      DinoPortrait.tsx             ← head-only happy mini scene
      LovebirdPortrait.tsx         ← head-only happy mini scene
src/game/store.ts                  ← MOD: AreaId += 'yard'
```

### 8. Tests / acceptance

**Unit:** none — pure visual + config.

**E2E:**
- Existing `play.spec.ts` `travel to town via portal` test currently asserts Home → Town directly. New flow: Home → Yard → Town. Update that test to walk through Yard, OR change the test's assertion to match the new chain. Concrete update: expand the test to tap the Yard portal first (in Home), then tap the Town portal (in Yard), assert area name `Town Square`.
- Existing `lovebirds-areas.spec.ts` exercises Home + cloud perch — Home no longer has a cloud perch (clouds were a Sky thing, kept). Lovebirds in Home now stand inside. Manual QA confirms they fit.
- Other e2e specs (`phase5-dino-detail`, `phase6-park-decor`, etc.) don't touch Home navigation — should pass unchanged.

**Manual mobile-viewport acceptance:**
- Selecting Home shows interior dollhouse: walls visible, no roof, you can see floor 1 + floor 2 simultaneously.
- Floor 1 has dining (left) with table+chairs, bathroom (right) empty.
- Floor 2 has 2 bedrooms (left + right), each with a bed of different sheet color (blue, pink).
- Stairs visible at back-east corner going up.
- 4 picture frames on walls, each showing a smiling dino or lovebird portrait (RenderTexture should bake on first mount; portraits visible immediately).
- Pet (dino + lovebirds) spawns inside on floor 1.
- Walking south to the doorway → portal (visible torus at z=3.5) → tapping or walking into it travels to Yard.
- Yard shows cottage exterior + pond behind + fountain front-right + 2 portals (one back to Home, one to Town).
- Town's portal (formerly to Home) now shows it goes to Yard (player taps it → Yard, not Home).
- No regressions in dino (T-rex pose), lovebirds, camera pan, character toggle, mood face, action FX.

## Architecture / data flow

```
[player taps Home toggle]
      |
      v
useGame.currentArea = 'home'
      |
      v
World.tsx renders <Home/>  -->  open dollhouse:
                                  Walls + Floor (×2) + Stairs +
                                  DiningTable + 2× Bed + 4× PictureFrame
                                  + Portal(yard)

Each PictureFrame mounts a RenderTexture(frames=1) the first time
the component renders -> drei renders the embedded portrait scene
once into a WebGLRenderTarget -> texture is bound as the .map of
the inner plane material -> never re-renders unless Frame remounts.

Pet (Dino + Lovebirds) is rendered by World.tsx as before, position
unchanged -- sits on the floor at y=0 in the dining area by default
(spawn [0,0,0]).

Camera (OrbitControls + CameraRig) recenters target to pet+0.5y on
area change -> still works inside the house since pet is at y=0.
Player can pan up to see floor 2 via two-finger drag.
```

## Risks

- **`AreaId` widening** — existing localStorage saves persist `currentArea: 'home'` (still valid). If a save persists `currentArea: 'yard'` from a future state and is loaded into an older build, persistence load would fail the validator. Persistence layer migration is unaffected here since `'yard'` is new — old saves don't reference it.
- **Dollhouse view at default camera** — camera at `[0, 4, 8]` with target `[0, 0.5, 0]` and polar limit `π/2.2` (~82°) means camera can rotate down to nearly horizontal but not below. From `[0, 4, 8]` looking at `[0, 0.5, 0]`, the floor 2 (y=2.5..5) sits BELOW the camera so player sees it from above — works. Floor 1 visible too. If parts of floor 2 obscure floor 1, panning lets player see around. Verify in QA.
- **Walls obscuring view** — perimeter walls at x=±3 height 5u may block the camera when player rotates around. Default OrbitControls limits help, but if walls feel oppressive a follow-up could add front-wall culling. For B2a, accept any minor cases of wall-view interference.
- **RenderTexture mobile cost** — 4 frames × 256×256 × 1 frame each = 4 one-shot render passes at mount. drei's RenderTexture is well-optimized; mobile cost should be sub-ms total. Verify in QA.
- **Beds + bedrooms at y=2.5+** — floor 2 plane is at y=2.5 with 0.05 thickness. Beds positioned at y=2.5 (bottom of frame) sit ON the plane. ✓
- **Stairs intersecting east wall** — stairs at x=2.0 (offset from x=3 east wall by 1u), within house footprint. Steps depth 0.6, going from z=-2.7 to z=-0.3 (back wall to mid-house). Doesn't touch east wall. ✓
- **Picture frames at y=1.6 floor 1 and y=4.1 floor 2** — between floor surface and ceiling. ✓
- **Portal at z=3.5** — outside the south wall (south wall front face at z=3.05 since wall is 0.1 thick centered at z=3). Portal floats just past the doorway. Pet walks south through doorway gap to reach it. ✓
- **`lovebirds-areas.spec.ts` cloud perch** — looking at the file, it iterates each area and asserts Lovebirds + CloudPerch render. CloudPerch is mounted in `World.tsx`, not `Home.tsx`. So it always renders regardless of area. Test should pass.
- **`play.spec.ts` portal test breaks** — confirmed above. Plan must explicitly include updating this test as part of the migration.

## Out of scope (followups)

- Functional stairs + vertical pet navigation (spec B2b).
- Bathroom fixtures (sink, toilet) (later).
- Portrait-as-live-mini-render (currently frames=1 static).
- Per-room behavior (eat in dining, sleep in bedroom) (spec C2).
- Wall culling / cutaway (open-roof handles it).
- Splitting interior over a `home-interior/` portrait pose system — small scope, kept inline.
