# Dino Cute Redesign

**Date:** 2026-05-02
**Status:** Spec
**Supersedes (visual layer only):** Quaternius T-Rex GLB swap from `2026-05-01-phase-1-skeleton.md`

## Problem

The current post-hatch dino is the Quaternius T-Rex GLB. The kid playtester reports it as "too small and serious." The game's tone (mobile, kid-friendly, parent-co-built) wants a soft, approachable character — closer to a Yoshi-cousin than a predator silhouette.

## Goal

Replace the T-Rex GLB with a hand-composed, primitives-only "cute dino" rendered directly in R3F. Bring expressive eyes that react to the dino's mood, so the visual character reflects the existing five-stat needs system instead of a single static model.

## Non-goals

- Walking, locomotion, or per-area animations. The dino remains stationary with idle bob (Phase 1 scope).
- Full skeletal rig. We use grouped primitives, not skinned meshes.
- Resemblance to any trademarked character (Yoshi, Pokémon, etc.). Visual language draws on a generic "cute round dino" archetype with a deliberately distinct palette.
- Custom GLB authored in Blender. Out of scope; the design is "code-only" so a 9-year-old can tweak a color and see the result instantly.

## Visual design

### Palette

| Element | Color | Hex |
|---|---|---|
| Body | Mint green | `#7FE0B0` |
| Belly | Cream | `#FFF6E0` |
| Cheeks | Pink | `#FF9CB8` |
| Eye whites | White | `#FFFFFF` |
| Pupils | Near-black | `#1A1A24` |
| Mouth | Same as pupils |
| Highlight (sparkle) | White | `#FFFFFF` |
| Tear (sad eye) | Soft blue | `#9CD0FF` |

Palette is intentionally not Yoshi-green-and-red. Avoids IP overlap and gives the project its own identity.

### Anatomy (all R3F primitives)

A `<group>` rooted at the dino's feet (origin = ground), composed of:

- **Body**: `<sphereGeometry>` scaled `[1.0, 0.85, 1.1]`, mint. Sits ~0.55 units above feet.
- **Belly patch**: smaller `<sphereGeometry>` flattened in z, cream, parented to body and offset slightly forward.
- **Head**: `<sphereGeometry>`, mint, offset above-front of body. Slightly smaller than body.
- **Cheeks**: 2 × small flattened `<sphereGeometry>`, pink, on either side of the head.
- **Eyes**: 2 × eye assemblies (white + pupil + optional sparkle/lid). See "Mood-driven eyes" below.
- **Mouth**: torus segment or stretched flat sphere. See "Mood-driven mouth".
- **Arms**: 2 × stub `<sphereGeometry>` (low-poly) on body sides.
- **Legs**: 2 × short `<capsuleGeometry>` under body.
- **Tail**: 3 × `<sphereGeometry>` chain, descending in size, mint, behind body.
- **Back bumps**: 3 × low `<coneGeometry>`, mint, soft (rounded tips), running along the spine. Decorative, not spiky.

Total visible mesh count is small (~15–18 primitives). All use `meshStandardMaterial` (low roughness, no metalness) so the existing scene lights apply consistently.

### Mood-driven eyes

A `<DinoEyes>` component takes a `mood` prop and renders one of four eye styles. Implemented via conditional JSX — each variant is a small composed sub-tree of primitives.

| Mood | Eye style | Implementation sketch |
|---|---|---|
| `happy` | Big round white sphere with black pupil and a small white sparkle highlight | Two spheres + tiny offset sphere |
| `sleepy` | Half-moon (top half hidden) | White sphere clipped by a mint-colored half-sphere or a thin horizontal black arc |
| `sad` | Larger eye whites, larger pupil, watery sheen (slightly oversized + a small blue tear-drop sphere) | Scale variant of happy, plus tear primitive |
| `bouncy` | Closed-smile arches `^^` | Two small dark torus segments, no eye whites |

The mouth and overall expression scale together — see next section.

### Mood-driven mouth

`<DinoMouth>` mirrors the eye mood:

| Mood | Mouth shape |
|---|---|
| `happy` | Soft upward smile arc |
| `sleepy` | Small flat line |
| `sad` | Downward arc |
| `bouncy` | Wide open-smile (small inner sphere with darker color to suggest mouth opening) |

## Mood system

A new pure module `src/game/systems/mood.ts`:

```ts
export type Mood = 'happy' | 'sleepy' | 'sad' | 'bouncy';

export interface MoodInputs {
  stats: { hunger: number; happy: number; energy: number; clean: number; health: number };
  /** Seconds since the most recent pet event. `Infinity` if dino was never petted this session. */
  secondsSincePet: number;
}

export function getMood(input: MoodInputs): Mood;
```

### Priority rules (highest wins)

1. **`bouncy`** if `secondsSincePet <= 1.0`.
2. **`sad`** if `min(hunger, happy, energy, clean, health) < 25`.
3. **`sleepy`** if `energy < 40`.
4. **`happy`** otherwise.

`bouncy` overrides everything because the immediate post-pet feedback is the strongest UX signal. `sad` overrides `sleepy` because critical needs are more important to surface than tiredness.

### Wiring into the component

The new `<DinoCute>` component:

- Subscribes to `dino.stats` via the existing `useGame` selector.
- Tracks `lastPetAt` via the existing `onPet` event subscription pattern (same as `useDinoMotion`).
- Each `useFrame` tick (or via a `useState` driven by `useFrame` at low frequency to avoid thrash) computes `secondsSincePet = (now - lastPetAt) / 1000`, calls `getMood`, and stores the result in a ref. The eye/mouth subcomponents read this ref and rerender only when the mood actually changes.
- Optionally, to keep React render counts low, `<DinoEyes>` and `<DinoMouth>` accept `moodRef` and mutate their own subtree imperatively — but the simpler "pass mood as prop, rely on `useState` updates only on transition" path is preferred for readability. We will use the simpler path unless profiling shows churn.

## Animation

Reuses the existing `useDinoMotion(ref, baseY)` hook with `baseY = 0` (feet origin). The hook continues to drive:

- Idle vertical bob.
- Pet-bounce y-offset.
- Sad-lean (`rotation.x = 0.2` when `min(stats) < 25`). The sad-lean must trigger on the same set of stats as the `sad` mood — both use `min(hunger, happy, energy, clean, health) < 25`. The current implementation in `useDinoMotion` omits `health`; this change extends it to include `health` so posture and face stay in sync. The egg also benefits (sad-lean now reflects critical health pre-hatch).

A new lightweight idle limb wiggle is added inside `<DinoCute>`:

- Arms rotate `Math.sin(now / 500) * 0.05` rad on z-axis.
- Tail tip sphere rotates `Math.sin(now / 600) * 0.08` rad on y-axis.

Both are sub-degree motions on top of the global bob. Implemented in a single `useFrame` inside `<DinoCute>` to avoid scattered animation drivers.

## Component structure

```
src/game/world/Dino.tsx                    # routes egg vs post-hatch
src/game/world/dino-cute/DinoCute.tsx      # root group: mood + limb wiggle + composition
src/game/world/dino-cute/DinoEyes.tsx      # mood-aware eye assembly
src/game/world/dino-cute/DinoMouth.tsx     # mood-aware mouth
src/game/systems/mood.ts                   # pure getMood + types
```

Why split into a folder rather than one file: the eye/mouth variants double the file's size and obscure the composition. Each subcomponent is small and individually understandable. `mood.ts` is pure and unit-testable without React.

`Dino.tsx` shrinks: `useGLTF`, `useAnimations`, `SkeletonUtils.clone`, `Suspense`, `LoadedGLTF` type, and `DINO_SCALE` are removed. The egg branch and `useDinoMotion` stay. The post-hatch branch becomes `<DinoCute position={position} />` directly — no Suspense fallback needed since there's no async asset.

## Asset cleanup

- `public/models/dino/t-rex.glb` and `public/models/dino/ATTRIBUTION.md` are no longer referenced.
- We **delete** them in this change rather than leaving orphaned ~MBs of asset on disk and in `public/`. Vercel ships everything in `public/`, so removal also trims the deploy.
- If a future task re-introduces a GLB-based dino, it can be re-added under the same path.

## Tests

### Unit (`tests/unit/mood.test.ts`)

Table-driven, 8 cases:

1. All stats 100, no pet → `happy`
2. Energy 30, others 100 → `sleepy`
3. Energy 80, hunger 20 → `sad`
4. Energy 30, hunger 20 (sad and sleepy both apply) → `sad`
5. Stats all 100, `secondsSincePet = 0.5` → `bouncy`
6. Stats all 100, `secondsSincePet = 1.5` → `happy`
7. Hunger 20, `secondsSincePet = 0.5` → `bouncy` (priority over sad)
8. Energy 39 boundary → `sleepy`; energy 40 → `happy`. Hunger 24 → `sad`; hunger 25 → not sad.

### E2E (existing tests must still pass, no new ones required)

- `dino-egg.spec.ts` — egg renders + tap to hatch.
- `dino-interactions.spec.ts` — feed/pet/persistence behavior.
- The "no 404 for `/models/dino/t-rex.glb`" expectation is removed/updated since the GLB no longer exists.

### Manual

- `bun run show` on a phone, after hatching: confirm cute dino renders, mood transitions visible by feeding/starving via debug, no console errors.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Eyes/mouth re-render on every frame, causing jank | Compute mood in a ref; only call `setMood` on transition. Profile if needed. |
| Many primitives slow down low-end phones | Keep mesh count ≤ 20. Use shared `meshStandardMaterial` instances where colors match. |
| Removing the GLB breaks an in-flight branch (`feat/dino-glb` PR is open) | This branch (`feat/dino-cute`) is cut from `main`, not from `feat/dino-glb`. Once `feat/dino-glb` merges, this branch rebases; conflict will be limited to `Dino.tsx` and is straightforward (we replace the post-hatch branch wholesale). |
| Mood priority disagrees with player intuition | Spec locked the rules with the user; revisit only if playtesting flags it. |

## Out-of-scope follow-ups

- Skin variants reusing the same primitive composition with palette swaps (Phase 1.5 customization story).
- Eye-blink micro-animation (close eyelids briefly every ~6s).
- Per-mood SFX hooks.
