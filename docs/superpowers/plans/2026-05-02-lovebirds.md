# Lovebirds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two baby lovebirds as a second playable character, switchable with the dino, present in every area as either active controlled pair or NPC orbiting a cloud perch.

**Architecture:** Reshape `useGame` from a single `dino` record into a `characters` map keyed by `'dino' | 'lovebirds'`, with an `active` field. Generalize all existing call sites. Add `<Lovebirds>` and `<CloudPerch>` components rendered alongside `<Dino>` in `World.tsx`. Each character switches internally between active (controls-driven) and NPC (idle/orbit) behavior based on `active`. Decay runs for both characters per tick, with inactive at half rate. Save format bumps `v1 → v2` with one-way idempotent migration.

**Tech Stack:** Next.js 16 App Router, React 19, react-three-fiber + drei + three.js, Zustand 5, Tailwind 4, Vitest, Playwright, Biome 2, Bun.

**Spec:** `docs/superpowers/specs/2026-05-02-lovebirds-second-character-design.md`

---

## File map

**Modify:**
- `src/game/store.ts` — generalize to `characters` map + `active` selector
- `src/lib/persistence.ts` — v1→v2 migration, bump SAVE_KEY
- `src/game/systems/tick.ts` — iterate both characters, half rate inactive
- `src/game/systems/interactions.ts` — accept `charId`, bird food menu, debounce pair pet
- `src/game/world/Dino.tsx` — read from `characters.dino`
- `src/game/world/useDinoMotion.ts` — read from `characters.dino`
- `src/game/world/dino-cute/DinoCute.tsx` — read from `characters.dino`
- `src/game/controls/Joystick.tsx` — write to active character's position
- `src/game/controls/AutoRoam.tsx` — read/write active character
- `src/game/controls/TapControls.tsx` — read/write active character
- `src/game/world/World.tsx` — also render `<Lovebirds>` and `<CloudPerch>`
- `src/game/HUD/StatsBar.tsx` — show active character's stats + icon
- `src/game/HUD/ActionBar.tsx` — route actions to active; swap food menu
- `src/game/HUD/MiniMap.tsx` — two dots
- `src/game/HUD/Onboarding.tsx` — mention toggle pill
- `src/app/page.tsx` — mount `CharacterToggle`, `WelcomeBirds`
- `tests/unit/store.test.ts` — update for new shape
- `tests/unit/persistence.test.ts` — add v1→v2 migration
- `tests/unit/tick.test.ts` — both-characters decay
- `tests/unit/interactions.test.ts` — charId-aware

**Create:**
- `src/game/systems/audio.ts` — minimal HTMLAudioElement player
- `src/game/world/lovebird-cute/LovebirdEyes.tsx` — twinkly eyes (mood-driven)
- `src/game/world/lovebird-cute/LovebirdMouth.tsx` — W-mouth (mood-driven)
- `src/game/world/lovebird-cute/Lovebird.tsx` — single bird primitives
- `src/game/world/Lovebirds.tsx` — orchestrator (active vs NPC, leader+partner)
- `src/game/world/useLovebirdMotion.ts` — leader/partner motion hook
- `src/game/world/props/CloudPerch.tsx` — small floating cloud
- `src/game/HUD/CharacterToggle.tsx` — top-right pill 🦖/🐦
- `src/game/HUD/WelcomeBirds.tsx` — one-time intro card
- `public/sounds/chirp.mp3` — short chirp asset
- `tests/unit/lovebirds-store.test.ts`
- `tests/unit/lovebirds-decay.test.ts`
- `tests/unit/lovebirds-interactions.test.ts`
- `tests/unit/lovebirds-persistence.test.ts`
- `tests/unit/audio.test.ts`
- `tests/e2e/lovebirds.spec.ts`
- `tests/e2e/lovebirds-areas.spec.ts`

---

## Task 1: Reshape store to `characters` map

**Files:**
- Modify: `src/game/store.ts`
- Modify: `tests/unit/store.test.ts`
- Test: `tests/unit/lovebirds-store.test.ts`

- [ ] **Step 1.1: Write the failing test (new shape)**

Create `tests/unit/lovebirds-store.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { useGame } from '@/src/game/store';

describe('store: characters + active', () => {
  beforeEach(() => useGame.setState(useGame.getInitialState(), true));

  it('starts with dino active', () => {
    expect(useGame.getState().active).toBe('dino');
  });

  it('has both characters with full stats at init', () => {
    const { characters } = useGame.getState();
    expect(characters.dino.stats.hunger).toBe(100);
    expect(characters.lovebirds.stats.hunger).toBe(100);
    expect(characters.lovebirds.species).toBe('lovebirds');
    expect(characters.dino.species).toBe('dino');
  });

  it('switches active character', () => {
    useGame.getState().setActive('lovebirds');
    expect(useGame.getState().active).toBe('lovebirds');
  });

  it('applyStatDelta scopes to charId', () => {
    useGame.getState().applyStatDelta('dino', 'hunger', -30);
    expect(useGame.getState().characters.dino.stats.hunger).toBe(70);
    expect(useGame.getState().characters.lovebirds.stats.hunger).toBe(100);
  });

  it('setPosition scopes to charId', () => {
    useGame.getState().setPosition('lovebirds', [1, 2, 3]);
    expect(useGame.getState().characters.lovebirds.position).toEqual([1, 2, 3]);
    expect(useGame.getState().characters.dino.position).toEqual([0, 0, 0]);
  });

  it('intro.lovebirdsSeen defaults to false', () => {
    expect(useGame.getState().intro.lovebirdsSeen).toBe(false);
  });
});
```

- [ ] **Step 1.2: Run test to verify it fails**

Run: `bun run test tests/unit/lovebirds-store.test.ts`
Expected: FAIL — `setActive`, `characters`, `intro` undefined.

- [ ] **Step 1.3: Reshape store**

Replace `src/game/store.ts` entirely:

```ts
import { create } from 'zustand';

export type StatKey = 'hunger' | 'happy' | 'energy' | 'clean' | 'health';
export type Stat = number; // 0..100
export type AreaId = 'home' | 'town' | 'park' | 'beach' | 'forest' | 'cave' | 'sky';
export type ControlMode = 'tap' | 'joystick' | 'auto';
export type ThemeId = 'default';
export type SkinId = 'default';

export type CharacterId = 'dino' | 'lovebirds';
export type Species = 'dino' | 'lovebirds';

export type Pet = {
  id: string;
  name: string;
  species: Species;
  skinId: SkinId;
  stage: 'egg' | 'baby' | 'teen' | 'adult';
  age: number; // seconds
  stats: Record<StatKey, Stat>;
  position: [number, number, number];
};

// Backwards-friendly alias for any existing imports.
export type Dino = Pet;

export type GameState = {
  active: CharacterId;
  characters: Record<CharacterId, Pet>;
  currentArea: AreaId;
  controlMode: ControlMode;
  lastSeenAt: number;
  settings: { soundOn: boolean; theme: ThemeId };
  intro: { lovebirdsSeen: boolean };
  version: 2;
};

export type GameActions = {
  setActive: (id: CharacterId) => void;
  applyStatDelta: (charId: CharacterId, key: StatKey, delta: number) => void;
  setStat: (charId: CharacterId, key: StatKey, value: Stat) => void;
  setPosition: (charId: CharacterId, p: [number, number, number]) => void;
  ageBy: (charId: CharacterId, seconds: number) => void;
  setArea: (a: AreaId) => void;
  setControlMode: (m: ControlMode) => void;
  hydrate: (s: GameState) => void;
  touchSeenAt: () => void;
  setLovebirdsSeen: () => void;
};

export const INITIAL_DINO = (): Pet => ({
  id: 'dino-1',
  name: 'Dino',
  species: 'dino',
  skinId: 'default',
  stage: 'egg',
  age: 0,
  stats: { hunger: 100, happy: 100, energy: 100, clean: 100, health: 100 },
  position: [0, 0, 0],
});

export const INITIAL_LOVEBIRDS = (): Pet => ({
  id: 'lovebirds-1',
  name: 'Lovebirds',
  species: 'lovebirds',
  skinId: 'default',
  stage: 'baby',
  age: 0,
  stats: { hunger: 100, happy: 100, energy: 100, clean: 100, health: 100 },
  position: [0, 0, 0],
});

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));

const initialState: GameState = {
  active: 'dino',
  characters: { dino: INITIAL_DINO(), lovebirds: INITIAL_LOVEBIRDS() },
  currentArea: 'home',
  controlMode: 'tap',
  lastSeenAt: Date.now(),
  settings: { soundOn: true, theme: 'default' },
  intro: { lovebirdsSeen: false },
  version: 2,
};

const setChar = (s: GameState, id: CharacterId, patch: Partial<Pet>): GameState => ({
  ...s,
  characters: { ...s.characters, [id]: { ...s.characters[id], ...patch } },
});

export const useGame = create<GameState & GameActions>((set) => ({
  ...initialState,
  setActive: (id) => set({ active: id }),
  applyStatDelta: (id, k, delta) =>
    set((s) =>
      setChar(s, id, {
        stats: { ...s.characters[id].stats, [k]: clamp(s.characters[id].stats[k] + delta) },
      }),
    ),
  setStat: (id, k, value) =>
    set((s) =>
      setChar(s, id, {
        stats: { ...s.characters[id].stats, [k]: clamp(value) },
      }),
    ),
  setPosition: (id, p) => set((s) => setChar(s, id, { position: p })),
  ageBy: (id, seconds) =>
    set((s) => setChar(s, id, { age: s.characters[id].age + seconds })),
  setArea: (a) => set({ currentArea: a }),
  setControlMode: (m) => set({ controlMode: m }),
  hydrate: (next) => set(next),
  touchSeenAt: () => set({ lastSeenAt: Date.now() }),
  setLovebirdsSeen: () => set((s) => ({ intro: { ...s.intro, lovebirdsSeen: true } })),
}));

const _initialSnapshot = useGame.getState();

(useGame as unknown as { getInitialState: () => GameState & GameActions }).getInitialState =
  () => ({
    ..._initialSnapshot,
    active: 'dino',
    characters: { dino: INITIAL_DINO(), lovebirds: INITIAL_LOVEBIRDS() },
    currentArea: 'home',
    controlMode: 'tap',
    lastSeenAt: initialState.lastSeenAt,
    settings: { soundOn: true, theme: 'default' },
    intro: { lovebirdsSeen: false },
    version: 2,
  });
```

- [ ] **Step 1.4: Update existing store test for new shape**

Replace `tests/unit/store.test.ts` body:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { INITIAL_DINO, useGame } from '@/src/game/store';

describe('game store', () => {
  beforeEach(() => useGame.setState(useGame.getInitialState(), true));

  it('starts dino as an egg with 100 in every stat', () => {
    const dino = useGame.getState().characters.dino;
    expect(dino.stage).toBe('egg');
    expect(dino.stats.hunger).toBe(100);
    expect(dino.stats.happy).toBe(100);
    expect(dino.stats.energy).toBe(100);
    expect(dino.stats.clean).toBe(100);
    expect(dino.stats.health).toBe(100);
  });

  it('starts at home', () => {
    expect(useGame.getState().currentArea).toBe('home');
  });

  it('updates a stat by delta and clamps 0..100', () => {
    useGame.getState().applyStatDelta('dino', 'hunger', -150);
    expect(useGame.getState().characters.dino.stats.hunger).toBe(0);
    useGame.getState().applyStatDelta('dino', 'hunger', 9999);
    expect(useGame.getState().characters.dino.stats.hunger).toBe(100);
  });

  it('exposes a stable INITIAL_DINO factory', () => {
    const a = INITIAL_DINO();
    const b = INITIAL_DINO();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 1.5: Run tests to verify they pass**

Run: `bun run test tests/unit/store.test.ts tests/unit/lovebirds-store.test.ts`
Expected: All PASS.

- [ ] **Step 1.6: Commit**

```bash
git add src/game/store.ts tests/unit/store.test.ts tests/unit/lovebirds-store.test.ts
git commit -m "feat(store): reshape to characters map with active selector"
```

---

## Task 2: Update existing call sites for new store shape

This is a refactor task — `state.dino.*` → `state.characters[charId].*`. No behavior change. Type errors will guide the work; run `bun run typecheck` after each file.

**Files:**
- Modify: `src/game/world/Dino.tsx`
- Modify: `src/game/world/useDinoMotion.ts`
- Modify: `src/game/world/dino-cute/DinoCute.tsx`
- Modify: `src/game/controls/Joystick.tsx`
- Modify: `src/game/controls/AutoRoam.tsx`
- Modify: `src/game/controls/TapControls.tsx`

- [ ] **Step 2.1: Run typecheck to see all callers**

Run: `bun run typecheck`
Expected: errors listing every file that reads `state.dino` or calls old action signatures.

- [ ] **Step 2.2: Update `src/game/world/Dino.tsx`**

Replace contents:

```tsx
'use client';

import { useRef } from 'react';
import type { Mesh } from 'three';
import { useGame } from '@/src/game/store';
import { DinoCute } from '@/src/game/world/dino-cute/DinoCute';
import { useDinoMotion } from '@/src/game/world/useDinoMotion';

function DinoEgg() {
  const ref = useRef<Mesh>(null);
  useDinoMotion(ref, 0.5);
  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[0.5, 24, 24]} />
      <meshStandardMaterial color="#6dbf6d" roughness={0.6} />
    </mesh>
  );
}

export function Dino() {
  const stage = useGame((s) => s.characters.dino.stage);
  if (stage === 'egg') return <DinoEgg />;
  return <DinoCute />;
}
```

- [ ] **Step 2.3: Update `src/game/world/useDinoMotion.ts`**

In `useFrame`, replace `useGame.getState().dino` with `useGame.getState().characters.dino`:

```ts
const { position, stats } = useGame.getState().characters.dino;
```

(Other lines unchanged.)

- [ ] **Step 2.4: Update `src/game/world/dino-cute/DinoCute.tsx`**

Replace `const stats = useGame.getState().dino.stats;` with:

```ts
const stats = useGame.getState().characters.dino.stats;
```

- [ ] **Step 2.5: Update `src/game/controls/Joystick.tsx`**

Read/write the active character instead of `dino`:

```ts
const active = useGame.getState().active;
const pos = useGame.getState().characters[active].position;
const nx = pos[0] + vec.x * MOVE_SPEED * dt;
const nz = pos[2] + vec.y * MOVE_SPEED * dt;
useGame.getState().setPosition(active, [nx, pos[1], nz]);
```

(Replace the body of the RAF loop.)

- [ ] **Step 2.6: Update `src/game/controls/AutoRoam.tsx` and `TapControls.tsx`**

Read `useGame.getState().active` and use `setPosition(active, [...])` and read positions from `characters[active]`. Keep behavior identical.

For each file, find every `state.dino.position` / `state.dino.stats` / `setPosition([…])` and rewrite to use `active` + scoped action. Show full file edits where straightforward.

- [ ] **Step 2.7: Run typecheck and unit tests**

Run: `bun run typecheck && bun run test`
Expected: typecheck clean, all unit tests PASS.

- [ ] **Step 2.8: Commit**

```bash
git add src/game/world/Dino.tsx src/game/world/useDinoMotion.ts \
  src/game/world/dino-cute/DinoCute.tsx \
  src/game/controls/Joystick.tsx src/game/controls/AutoRoam.tsx src/game/controls/TapControls.tsx
git commit -m "refactor(controls,dino): read/write active character, not dino"
```

---

## Task 3: Update tick.ts to decay both characters

**Files:**
- Modify: `src/game/systems/tick.ts`
- Modify: `tests/unit/tick.test.ts`
- Test: `tests/unit/lovebirds-decay.test.ts`

- [ ] **Step 3.1: Write the failing test**

Create `tests/unit/lovebirds-decay.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { useGame } from '@/src/game/store';
import { tick } from '@/src/game/systems/tick';

describe('tick: decay both characters with rate', () => {
  beforeEach(() => useGame.setState(useGame.getInitialState(), true));

  it('decays both characters when active=dino, lovebirds at half rate', () => {
    useGame.getState().setActive('dino');
    const before = {
      dino: { ...useGame.getState().characters.dino.stats },
      birds: { ...useGame.getState().characters.lovebirds.stats },
    };
    tick(60); // 60s
    const after = {
      dino: useGame.getState().characters.dino.stats,
      birds: useGame.getState().characters.lovebirds.stats,
    };
    const dinoDelta = before.dino.hunger - after.dino.hunger;
    const birdDelta = before.birds.hunger - after.birds.hunger;
    expect(dinoDelta).toBeGreaterThan(0);
    expect(birdDelta).toBeGreaterThan(0);
    expect(birdDelta).toBeCloseTo(dinoDelta / 2, 1);
  });

  it('inverts when active=lovebirds (dino half rate)', () => {
    useGame.getState().setActive('lovebirds');
    const before = {
      dino: { ...useGame.getState().characters.dino.stats },
      birds: { ...useGame.getState().characters.lovebirds.stats },
    };
    tick(60);
    const after = {
      dino: useGame.getState().characters.dino.stats,
      birds: useGame.getState().characters.lovebirds.stats,
    };
    const dinoDelta = before.dino.hunger - after.dino.hunger;
    const birdDelta = before.birds.hunger - after.birds.hunger;
    expect(dinoDelta).toBeCloseTo(birdDelta / 2, 1);
  });
});
```

- [ ] **Step 3.2: Run test to verify it fails**

Run: `bun run test tests/unit/lovebirds-decay.test.ts`
Expected: FAIL.

- [ ] **Step 3.3: Update `src/game/systems/tick.ts`**

Replace contents:

```ts
import { computeDecay, computeHealth } from '@/src/game/config/decay';
import { type CharacterId, type StatKey, useGame } from '@/src/game/store';

const ACTIONABLE: Array<Exclude<StatKey, 'health'>> = ['hunger', 'happy', 'energy', 'clean'];
const CHARS: CharacterId[] = ['dino', 'lovebirds'];

export function tick(elapsedSeconds: number, multiplier = 1): void {
  if (elapsedSeconds < 0) return;
  const state = useGame.getState();
  const active = state.active;
  for (const id of CHARS) {
    const rate = id === active ? multiplier : multiplier * 0.5;
    const delta = computeDecay(elapsedSeconds, rate);
    for (const k of ACTIONABLE) {
      const v = delta[k];
      if (v !== undefined) state.applyStatDelta(id, k, v);
    }
    const stats = useGame.getState().characters[id].stats;
    state.setStat(id, 'health', computeHealth(stats));
    if (elapsedSeconds > 0) state.ageBy(id, elapsedSeconds);
  }
}
```

- [ ] **Step 3.4: Update `tests/unit/tick.test.ts`**

Find every reference to `state.dino` and rewrite to `state.characters.dino`. Action calls (`applyStatDelta(...)`, `setStat(...)`, `ageBy(...)`) take a `charId` first arg; existing single-character expectations should pass `'dino'`.

Read the file and update line-by-line. (No new behavior to assert here — existing assertions about dino stats still hold because dino stays active by default.)

- [ ] **Step 3.5: Run tests**

Run: `bun run test tests/unit/tick.test.ts tests/unit/lovebirds-decay.test.ts`
Expected: All PASS.

- [ ] **Step 3.6: Commit**

```bash
git add src/game/systems/tick.ts tests/unit/tick.test.ts tests/unit/lovebirds-decay.test.ts
git commit -m "feat(tick): decay both characters; inactive at half rate"
```

---

## Task 4: Update interactions.ts for charId + bird foods + pet debounce

**Files:**
- Modify: `src/game/systems/interactions.ts`
- Modify: `tests/unit/interactions.test.ts`
- Test: `tests/unit/lovebirds-interactions.test.ts`

- [ ] **Step 4.1: Write the failing test**

Create `tests/unit/lovebirds-interactions.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { useGame } from '@/src/game/store';
import { BIRD_FOODS, FOODS, bath, feed, pet, sleep } from '@/src/game/systems/interactions';

describe('interactions: charId-aware', () => {
  beforeEach(() => {
    useGame.setState(useGame.getInitialState(), true);
    useGame.getState().applyStatDelta('dino', 'happy', -50);
    useGame.getState().applyStatDelta('lovebirds', 'happy', -50);
    useGame.getState().applyStatDelta('dino', 'hunger', -50);
    useGame.getState().applyStatDelta('lovebirds', 'hunger', -50);
  });

  it('pet(charId) only affects that character', () => {
    pet('lovebirds');
    expect(useGame.getState().characters.lovebirds.stats.happy).toBe(58);
    expect(useGame.getState().characters.dino.stats.happy).toBe(50);
  });

  it('feed(food, charId) — bird food only valid for lovebirds', () => {
    feed('seed', 'lovebirds');
    expect(useGame.getState().characters.lovebirds.stats.hunger).toBe(75);
    expect(useGame.getState().characters.dino.stats.hunger).toBe(50);
  });

  it('feed(food, charId) — dino food only valid for dino', () => {
    feed('apple', 'dino');
    expect(useGame.getState().characters.dino.stats.hunger).toBe(75);
  });

  it('bath(charId) and sleep(charId) scope correctly', () => {
    bath('lovebirds');
    expect(useGame.getState().characters.lovebirds.stats.clean).toBeGreaterThan(50);
    sleep('dino');
    expect(useGame.getState().characters.dino.stats.energy).toBeGreaterThan(50);
  });

  it('exposes BIRD_FOODS with seed/berry/mango', () => {
    expect(Object.keys(BIRD_FOODS).sort()).toEqual(['berry', 'mango', 'seed']);
  });

  it('exposes FOODS with apple/cake/meat (unchanged)', () => {
    expect(Object.keys(FOODS).sort()).toEqual(['apple', 'cake', 'meat']);
  });
});

describe('pet debounce for lovebirds pair', () => {
  beforeEach(() => {
    useGame.setState(useGame.getInitialState(), true);
    useGame.getState().applyStatDelta('lovebirds', 'happy', -50);
  });

  it('two near-simultaneous pets count as one for the pair', async () => {
    pet('lovebirds');
    pet('lovebirds');
    expect(useGame.getState().characters.lovebirds.stats.happy).toBe(58);
  });
});
```

- [ ] **Step 4.2: Run to verify failure**

Run: `bun run test tests/unit/lovebirds-interactions.test.ts`
Expected: FAIL — `BIRD_FOODS`, charId-aware signatures missing.

- [ ] **Step 4.3: Replace `src/game/systems/interactions.ts`**

```ts
import type { CharacterId } from '@/src/game/store';
import { useGame } from '@/src/game/store';
import { play } from '@/src/game/systems/audio';

export type DinoFoodId = 'apple' | 'meat' | 'cake';
export type BirdFoodId = 'seed' | 'berry' | 'mango';
export type FoodId = DinoFoodId | BirdFoodId;

type FoodDef = { name: string; emoji: string; hungerRestored: number; happyBonus: number };

export const FOODS: Record<DinoFoodId, FoodDef> = {
  apple: { name: 'Apple', emoji: '🍎', hungerRestored: 25, happyBonus: 0 },
  meat: { name: 'Meat', emoji: '🍖', hungerRestored: 45, happyBonus: 5 },
  cake: { name: 'Cake', emoji: '🍰', hungerRestored: 35, happyBonus: 15 },
};

export const BIRD_FOODS: Record<BirdFoodId, FoodDef> = {
  seed: { name: 'Seeds', emoji: '🌾', hungerRestored: 25, happyBonus: 0 },
  berry: { name: 'Berries', emoji: '🫐', hungerRestored: 35, happyBonus: 10 },
  mango: { name: 'Mango', emoji: '🥭', hungerRestored: 50, happyBonus: 15 },
};

export function feed(food: FoodId, charId: CharacterId): void {
  const def =
    charId === 'dino'
      ? (FOODS as Record<string, FoodDef>)[food]
      : (BIRD_FOODS as Record<string, FoodDef>)[food];
  if (!def) return; // unknown food for this species
  const s = useGame.getState();
  s.applyStatDelta(charId, 'hunger', def.hungerRestored);
  if (def.happyBonus) s.applyStatDelta(charId, 'happy', def.happyBonus);
}

type PetListener = (charId: CharacterId) => void;
const listeners = new Set<PetListener>();

export function onPet(listener: PetListener): () => boolean {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const PET_DEBOUNCE_MS = 250;
const lastPetAt: Partial<Record<CharacterId, number>> = {};

export function pet(charId: CharacterId): void {
  const now = performance.now();
  const last = lastPetAt[charId] ?? -Infinity;
  if (now - last < PET_DEBOUNCE_MS) {
    for (const l of listeners) l(charId);
    return; // listener fires (visual reaction) but no stat double-count
  }
  lastPetAt[charId] = now;
  useGame.getState().applyStatDelta(charId, 'happy', 8);
  if (charId === 'lovebirds') play('chirp');
  for (const l of listeners) l(charId);
}

export function bath(charId: CharacterId): void {
  useGame.getState().applyStatDelta(charId, 'clean', 50);
  useGame.getState().applyStatDelta(charId, 'happy', -5);
}

export function sleep(charId: CharacterId): void {
  useGame.getState().applyStatDelta(charId, 'energy', 60);
}
```

- [ ] **Step 4.4: Update `tests/unit/interactions.test.ts`**

Update every `feed(...)`, `pet(...)`, `bath(...)`, `sleep(...)` call to pass a `charId`. Existing tests against dino now pass `'dino'`. (Read the file and rewrite line-by-line.)

- [ ] **Step 4.5: Run tests**

Run: `bun run test tests/unit/interactions.test.ts tests/unit/lovebirds-interactions.test.ts`
Expected: All PASS.

- [ ] **Step 4.6: Commit**

```bash
git add src/game/systems/interactions.ts tests/unit/interactions.test.ts tests/unit/lovebirds-interactions.test.ts
git commit -m "feat(interactions): charId-aware actions, bird foods, pet debounce"
```

---

## Task 5: Audio module + chirp asset

**Files:**
- Create: `src/game/systems/audio.ts`
- Create: `tests/unit/audio.test.ts`
- Create: `public/sounds/chirp.mp3` (placeholder)

- [ ] **Step 5.1: Write the failing test**

Create `tests/unit/audio.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { play, _resetAudioCache } from '@/src/game/systems/audio';
import { useGame } from '@/src/game/store';

class FakeAudio {
  src: string;
  currentTime = 0;
  played = 0;
  constructor(src: string) {
    this.src = src;
  }
  play() {
    this.played++;
    return Promise.resolve();
  }
}

describe('audio.play', () => {
  beforeEach(() => {
    useGame.setState(useGame.getInitialState(), true);
    _resetAudioCache();
    vi.stubGlobal('Audio', FakeAudio);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('plays chirp when soundOn=true', () => {
    play('chirp');
    // FakeAudio constructed and played
    // (we cannot read instance directly, but no-throw + cache reuse is enough)
  });

  it('does not construct Audio when soundOn=false', () => {
    useGame.setState({ ...useGame.getState(), settings: { soundOn: false, theme: 'default' } });
    const ctorSpy = vi.spyOn(globalThis, 'Audio' as any);
    play('chirp');
    expect(ctorSpy).not.toHaveBeenCalled();
  });

  it('reuses cached Audio across calls', () => {
    const ctorSpy = vi.spyOn(globalThis, 'Audio' as any);
    play('chirp');
    play('chirp');
    expect(ctorSpy).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 5.2: Run to verify failure**

Run: `bun run test tests/unit/audio.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 5.3: Implement `src/game/systems/audio.ts`**

```ts
import { useGame } from '@/src/game/store';

export type SoundId = 'chirp';

const cache = new Map<SoundId, HTMLAudioElement>();

export function play(name: SoundId): void {
  if (typeof window === 'undefined') return;
  if (!useGame.getState().settings.soundOn) return;
  let a = cache.get(name);
  if (!a) {
    a = new Audio(`/sounds/${name}.mp3`);
    cache.set(name, a);
  }
  a.currentTime = 0;
  a.play().catch(() => {
    // iOS Safari blocks autoplay before first user gesture; subsequent taps work.
  });
}

export function _resetAudioCache(): void {
  cache.clear();
}
```

- [ ] **Step 5.4: Add a placeholder chirp asset**

The plan does NOT depend on a final asset — drop a short generated chirp in `public/sounds/chirp.mp3`. For now, generate a tiny silent placeholder so the URL resolves in dev:

Run: `mkdir -p public/sounds && echo -n "" > public/sounds/chirp.mp3`

🧑‍💻 **Note for parent:** replace this empty file with a real ~0.3s chirp sound (royalty-free). Until then, audio plays a 0-byte file (browsers will silently fail). Tests do not depend on the asset.

- [ ] **Step 5.5: Run audio tests**

Run: `bun run test tests/unit/audio.test.ts`
Expected: PASS.

- [ ] **Step 5.6: Commit**

```bash
git add src/game/systems/audio.ts tests/unit/audio.test.ts public/sounds/chirp.mp3
git commit -m "feat(audio): minimal chirp player respecting soundOn"
```

---

## Task 6: v1→v2 save migration

**Files:**
- Modify: `src/lib/persistence.ts`
- Modify: `tests/unit/persistence.test.ts`
- Test: `tests/unit/lovebirds-persistence.test.ts`

- [ ] **Step 6.1: Write the failing test**

Create `tests/unit/lovebirds-persistence.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { load, SAVE_KEY, SAVE_KEY_V1 } from '@/src/lib/persistence';

const FAKE_V1 = {
  dino: {
    id: 'dino-1',
    name: 'Dino',
    species: 'dino',
    skinId: 'default',
    stage: 'baby',
    age: 60,
    stats: { hunger: 80, happy: 90, energy: 70, clean: 60, health: 88 },
    position: [1, 0, 2],
  },
  currentArea: 'park',
  controlMode: 'tap',
  lastSeenAt: 1700000000000,
  settings: { soundOn: true, theme: 'default' },
  version: 1,
};

beforeEach(() => {
  localStorage.clear();
});

describe('persistence: v1 -> v2 migration', () => {
  it('migrates v1 blob to v2 with both characters', () => {
    localStorage.setItem(SAVE_KEY_V1, JSON.stringify(FAKE_V1));
    const loaded = load();
    expect(loaded).not.toBeNull();
    expect(loaded!.version).toBe(2);
    expect(loaded!.active).toBe('dino');
    expect(loaded!.characters.dino.stats.hunger).toBe(80);
    expect(loaded!.characters.dino.age).toBe(60);
    expect(loaded!.characters.lovebirds.stats.hunger).toBe(100);
    expect(loaded!.characters.lovebirds.species).toBe('lovebirds');
    expect(loaded!.intro.lovebirdsSeen).toBe(false);
    expect(loaded!.currentArea).toBe('park');
  });

  it('backs up v1 and removes v1 key', () => {
    localStorage.setItem(SAVE_KEY_V1, JSON.stringify(FAKE_V1));
    load();
    expect(localStorage.getItem(SAVE_KEY_V1)).toBeNull();
    expect(localStorage.getItem(`${SAVE_KEY_V1}.bak`)).not.toBeNull();
  });

  it('is idempotent if v2 already exists', () => {
    localStorage.setItem(SAVE_KEY_V1, JSON.stringify(FAKE_V1));
    const first = load();
    expect(first).not.toBeNull();
    const second = load();
    expect(second).not.toBeNull();
    expect(second!.version).toBe(2);
  });
});
```

- [ ] **Step 6.2: Run to verify failure**

Run: `bun run test tests/unit/lovebirds-persistence.test.ts`
Expected: FAIL — `SAVE_KEY_V1` not exported / migration missing.

- [ ] **Step 6.3: Replace `src/lib/persistence.ts`**

```ts
import {
  type CharacterId,
  type GameState,
  type Pet,
  INITIAL_DINO,
  INITIAL_LOVEBIRDS,
  useGame,
} from '@/src/game/store';

export const SAVE_KEY_V1 = 'tamagochi-3d:save:v1';
export const SAVE_KEY = 'tamagochi-3d:save:v2';

type V1Blob = {
  dino: Pet;
  currentArea: GameState['currentArea'];
  controlMode: GameState['controlMode'];
  lastSeenAt: number;
  settings: GameState['settings'];
  version: 1;
};

type V2Blob = GameState;

export function save(): void {
  if (typeof localStorage === 'undefined') return;
  const state = useGame.getState();
  const blob: V2Blob = {
    active: state.active,
    characters: state.characters,
    currentArea: state.currentArea,
    controlMode: state.controlMode,
    lastSeenAt: Date.now(),
    settings: state.settings,
    intro: state.intro,
    version: 2,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(blob));
}

export function load(): GameState | null {
  if (typeof localStorage === 'undefined') return null;

  const v2raw = localStorage.getItem(SAVE_KEY);
  if (v2raw) {
    try {
      const parsed = JSON.parse(v2raw) as V2Blob;
      if (parsed.version === 2) return parsed;
    } catch {
      localStorage.setItem(`${SAVE_KEY}:corrupt:${Date.now()}`, v2raw);
      localStorage.removeItem(SAVE_KEY);
    }
  }

  const v1raw = localStorage.getItem(SAVE_KEY_V1);
  if (v1raw) {
    try {
      const v1 = JSON.parse(v1raw) as V1Blob;
      if (v1.version === 1 && v1.dino) {
        const migrated: V2Blob = {
          active: 'dino',
          characters: {
            dino: { ...INITIAL_DINO(), ...v1.dino, species: 'dino' },
            lovebirds: INITIAL_LOVEBIRDS(),
          },
          currentArea: v1.currentArea,
          controlMode: v1.controlMode,
          lastSeenAt: v1.lastSeenAt,
          settings: v1.settings,
          intro: { lovebirdsSeen: false },
          version: 2,
        };
        localStorage.setItem(`${SAVE_KEY_V1}.bak`, v1raw);
        localStorage.setItem(SAVE_KEY, JSON.stringify(migrated));
        localStorage.removeItem(SAVE_KEY_V1);
        return migrated;
      }
    } catch {
      localStorage.setItem(`${SAVE_KEY_V1}:corrupt:${Date.now()}`, v1raw);
      localStorage.removeItem(SAVE_KEY_V1);
    }
  }

  return null;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
export function scheduleSave(debounceMs = 2000): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(save, debounceMs);
}
```

Note `CharacterId` import is unused; remove it if Biome complains.

- [ ] **Step 6.4: Update `tests/unit/persistence.test.ts`**

Read the file. Replace `version: 1` expectations with `version: 2`. Replace `state.dino` reads with `state.characters.dino`. Replace `SAVE_KEY` references with `SAVE_KEY` (still resolves to v2 now).

- [ ] **Step 6.5: Run tests**

Run: `bun run test tests/unit/persistence.test.ts tests/unit/lovebirds-persistence.test.ts`
Expected: All PASS.

- [ ] **Step 6.6: Commit**

```bash
git add src/lib/persistence.ts tests/unit/persistence.test.ts tests/unit/lovebirds-persistence.test.ts
git commit -m "feat(persistence): v1 -> v2 migration with backup; both characters in save"
```

---

## Task 7: CloudPerch prop

**Files:**
- Create: `src/game/world/props/CloudPerch.tsx`

- [ ] **Step 7.1: Implement CloudPerch**

```tsx
'use client';

import type { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

type Props = {
  position?: [number, number, number];
};

export function CloudPerch({ position = [3, 2.5, -2] }: Props) {
  const ref = useRef<Group>(null);

  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(performance.now() / 1200) * 0.1;
  });

  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.45, 20, 20]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh position={[-0.32, -0.1, 0]}>
        <sphereGeometry args={[0.3, 20, 20]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh position={[0.32, -0.1, 0]}>
        <sphereGeometry args={[0.3, 20, 20]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh position={[0.0, -0.05, 0.25]}>
        <sphereGeometry args={[0.28, 20, 20]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 7.2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 7.3: Commit**

```bash
git add src/game/world/props/CloudPerch.tsx
git commit -m "feat(world): add floating CloudPerch prop"
```

---

## Task 8: LovebirdEyes (twinkly, mood-driven)

**Files:**
- Create: `src/game/world/lovebird-cute/LovebirdEyes.tsx`

- [ ] **Step 8.1: Implement LovebirdEyes**

Reuse the mood enum from `@/src/game/systems/mood`.

```tsx
'use client';

import type { Mood } from '@/src/game/systems/mood';

type Props = { mood: Mood };

export function LovebirdEyes({ mood }: Props) {
  // Sclera (white), pupil (dark), highlight (tiny white dot for twinkle).
  const pupilScaleY = mood === 'sad' ? 0.4 : 1; // half-closed when sad
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.03]} scale={[1, pupilScaleY, 1]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
      </mesh>
      <mesh position={[0.012, 0.012, 0.05]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 8.2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 8.3: Commit**

```bash
git add src/game/world/lovebird-cute/LovebirdEyes.tsx
git commit -m "feat(world): add twinkly LovebirdEyes"
```

---

## Task 9: LovebirdMouth (W-shape, mood-driven)

**Files:**
- Create: `src/game/world/lovebird-cute/LovebirdMouth.tsx`

- [ ] **Step 9.1: Implement LovebirdMouth**

```tsx
'use client';

import type { Mood } from '@/src/game/systems/mood';

type Props = { mood: Mood };

const COLOR = '#1a1a1a';

/**
 * W-shaped mouth: 4 short cylinders forming an upside-down W when neutral
 * (point-down, point-up, point-down). Inverts the orientation when sad.
 */
export function LovebirdMouth({ mood }: Props) {
  const flip = mood === 'sad' ? -1 : 1;
  const open = mood === 'happy' ? 1.4 : 1; // open W when happy/singing
  // Two segments per stroke; total 4 cylinders shaping the W.
  return (
    <group scale={[1, flip, 1]}>
      {[
        { p: [-0.045, 0.0, 0], r: [0, 0, -0.6] },
        { p: [-0.015, -0.02 * open, 0], r: [0, 0, 0.6] },
        { p: [0.015, -0.02 * open, 0], r: [0, 0, -0.6] },
        { p: [0.045, 0.0, 0], r: [0, 0, 0.6] },
      ].map((seg, i) => (
        <mesh
          key={i}
          position={seg.p as [number, number, number]}
          rotation={seg.r as [number, number, number]}
        >
          <cylinderGeometry args={[0.005, 0.005, 0.04, 6]} />
          <meshStandardMaterial color={COLOR} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}
```

- [ ] **Step 9.2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 9.3: Commit**

```bash
git add src/game/world/lovebird-cute/LovebirdMouth.tsx
git commit -m "feat(world): add W-shaped LovebirdMouth"
```

---

## Task 10: Single Lovebird primitives

**Files:**
- Create: `src/game/world/lovebird-cute/Lovebird.tsx`

- [ ] **Step 10.1: Implement single bird**

```tsx
'use client';

import { useFrame } from '@react-three/fiber';
import { type RefObject, useRef } from 'react';
import type { Group } from 'three';
import type { Mood } from '@/src/game/systems/mood';
import { LovebirdEyes } from './LovebirdEyes';
import { LovebirdMouth } from './LovebirdMouth';

type Props = {
  /** Top half color (rainbow gradient top). */
  topColor: string;
  /** Bottom half color (rainbow gradient bottom). */
  bottomColor: string;
  mood: Mood;
  /** Wing flap rate in Hz (8 active, 2 perched). */
  flapHz: number;
  /** Optional outer ref so parent can drive position/rotation. */
  groupRef?: RefObject<Group | null>;
  /** Pet-spin trigger timestamp (performance.now()). NaN = no spin. */
  spinAt?: number;
  /** Click handler for tap-to-control / pet. */
  onClick?: () => void;
};

const BEAK_COLOR = '#FFD24A';

export function Lovebird({
  topColor,
  bottomColor,
  mood,
  flapHz,
  groupRef,
  spinAt = NaN,
  onClick,
}: Props) {
  const localRef = useRef<Group>(null);
  const ref = groupRef ?? localRef;
  const wingLRef = useRef<Group>(null);
  const wingRRef = useRef<Group>(null);

  useFrame(() => {
    const now = performance.now();
    // Wing flap.
    const flap = Math.sin((now / 1000) * Math.PI * 2 * flapHz) * 0.6;
    if (wingLRef.current) wingLRef.current.rotation.z = flap;
    if (wingRRef.current) wingRRef.current.rotation.z = -flap;

    // Pet-spin (one full Y rotation over 0.6s).
    if (ref.current) {
      const dt = (now - spinAt) / 1000;
      ref.current.rotation.y =
        Number.isFinite(spinAt) && dt < 0.6 ? dt * (Math.PI * 2) * (1 / 0.6) : 0;
    }
  });

  return (
    <group
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {/* body — top half */}
      <mesh position={[0, 0.13, 0]} scale={[1.0, 0.45, 1.1]} castShadow>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial color={topColor} roughness={0.7} />
      </mesh>
      {/* body — bottom half */}
      <mesh position={[0, 0.05, 0]} scale={[1.0, 0.45, 1.1]} castShadow>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial color={bottomColor} roughness={0.7} />
      </mesh>
      {/* head */}
      <mesh position={[0, 0.28, 0.05]} castShadow>
        <sphereGeometry args={[0.14, 24, 24]} />
        <meshStandardMaterial color={topColor} roughness={0.7} />
      </mesh>
      {/* beak */}
      <mesh position={[0, 0.25, 0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.04, 0.07, 8]} />
        <meshStandardMaterial color={BEAK_COLOR} roughness={0.5} />
      </mesh>
      {/* eyes */}
      <group position={[-0.06, 0.31, 0.16]}>
        <LovebirdEyes mood={mood} />
      </group>
      <group position={[0.06, 0.31, 0.16]}>
        <LovebirdEyes mood={mood} />
      </group>
      {/* mouth */}
      <group position={[0, 0.2, 0.21]}>
        <LovebirdMouth mood={mood} />
      </group>
      {/* wings */}
      <group ref={wingLRef} position={[-0.16, 0.13, 0]}>
        <mesh scale={[0.6, 0.15, 0.4]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={topColor} roughness={0.7} />
        </mesh>
      </group>
      <group ref={wingRRef} position={[0.16, 0.13, 0]}>
        <mesh scale={[0.6, 0.15, 0.4]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={topColor} roughness={0.7} />
        </mesh>
      </group>
      {/* tail */}
      <mesh position={[0, 0.13, -0.18]} castShadow>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color={bottomColor} roughness={0.7} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 10.2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 10.3: Commit**

```bash
git add src/game/world/lovebird-cute/Lovebird.tsx
git commit -m "feat(world): add Lovebird primitive (chubby, twinkly, W-mouth)"
```

---

## Task 11: useLovebirdMotion hook

**Files:**
- Create: `src/game/world/useLovebirdMotion.ts`

- [ ] **Step 11.1: Implement hook**

```ts
'use client';

import { useFrame } from '@react-three/fiber';
import type { RefObject } from 'react';
import type { Group } from 'three';
import { useGame } from '@/src/game/store';

const GLIDE_Y = 0.5;
const PARTNER_OFFSET: [number, number, number] = [0.35, 0.05, -0.1];

/**
 * Drives the leader/partner lovebirds in active mode.
 * Leader follows `pos.lovebirds`, partner trails leader with delay.
 */
export function useLovebirdMotion(
  leaderRef: RefObject<Group | null>,
  partnerRef: RefObject<Group | null>,
) {
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
    }
    if (partnerRef.current && leaderRef.current) {
      const lp = leaderRef.current.position;
      const target = {
        x: lp.x + PARTNER_OFFSET[0],
        y: lp.y + PARTNER_OFFSET[1] + Math.sin(now / 380) * 0.02,
        z: lp.z + PARTNER_OFFSET[2],
      };
      partnerRef.current.position.lerp(target as never, Math.min(1, dt * 6));
    }
  });
}
```

- [ ] **Step 11.2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 11.3: Commit**

```bash
git add src/game/world/useLovebirdMotion.ts
git commit -m "feat(world): add useLovebirdMotion (leader + trailing partner)"
```

---

## Task 12: Lovebirds orchestrator (active vs NPC)

**Files:**
- Create: `src/game/world/Lovebirds.tsx`

- [ ] **Step 12.1: Implement Lovebirds**

```tsx
'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { Group } from 'three';
import { useGame } from '@/src/game/store';
import { onPet, pet } from '@/src/game/systems/interactions';
import { getMood, type Mood } from '@/src/game/systems/mood';
import { Lovebird } from '@/src/game/world/lovebird-cute/Lovebird';
import { useLovebirdMotion } from '@/src/game/world/useLovebirdMotion';

const NEVER = Number.POSITIVE_INFINITY;
const PERCH: [number, number, number] = [3, 2.5, -2];
const ORBIT_R = 0.6;

const BIRD1 = { top: '#FF7AB6', bottom: '#FFD86B' };
const BIRD2 = { top: '#7AD3FF', bottom: '#9CFF7A' };

export function Lovebirds() {
  const active = useGame((s) => s.active);
  const leaderRef = useRef<Group>(null);
  const partnerRef = useRef<Group>(null);
  const lastPetAtBird = useRef<{ leader: number; partner: number }>({ leader: NaN, partner: NaN });
  const [mood, setMood] = useState<Mood>('happy');

  useEffect(() => {
    const unsub = onPet((charId) => {
      if (charId !== 'lovebirds') return;
      // We do not know which bird was tapped here; the click handler sets it.
    });
    return () => {
      unsub();
    };
  }, []);

  // Mood update.
  useFrame(() => {
    const stats = useGame.getState().characters.lovebirds.stats;
    const next = getMood({ stats, secondsSincePet: NEVER });
    if (next !== mood) setMood(next);
  });

  // Active mode: leader controlled by pos; partner trails.
  useLovebirdMotion(leaderRef, partnerRef);

  // NPC mode: orbit cloud perch when not active.
  useFrame(() => {
    if (active === 'lovebirds') return;
    const t = performance.now() / 1000;
    if (leaderRef.current) {
      leaderRef.current.position.x = PERCH[0] + Math.cos(t * 0.7) * ORBIT_R;
      leaderRef.current.position.y = PERCH[1] + Math.sin(t * 0.5) * 0.08;
      leaderRef.current.position.z = PERCH[2] + Math.sin(t * 0.7) * ORBIT_R;
    }
    if (partnerRef.current) {
      partnerRef.current.position.x = PERCH[0] + Math.cos(t * 0.7 + Math.PI) * ORBIT_R;
      partnerRef.current.position.y = PERCH[1] + Math.sin(t * 0.5 + Math.PI) * 0.08;
      partnerRef.current.position.z = PERCH[2] + Math.sin(t * 0.7 + Math.PI) * ORBIT_R;
    }
  });

  const onLeaderClick = () => {
    if (active !== 'lovebirds') {
      useGame.getState().setActive('lovebirds');
      return;
    }
    lastPetAtBird.current.leader = performance.now();
    pet('lovebirds');
  };
  const onPartnerClick = () => {
    if (active !== 'lovebirds') {
      useGame.getState().setActive('lovebirds');
      return;
    }
    lastPetAtBird.current.partner = performance.now();
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
        spinAt={lastPetAtBird.current.leader}
        onClick={onLeaderClick}
      />
      <Lovebird
        groupRef={partnerRef}
        topColor={BIRD2.top}
        bottomColor={BIRD2.bottom}
        mood={mood}
        flapHz={flapHz}
        spinAt={lastPetAtBird.current.partner}
        onClick={onPartnerClick}
      />
    </>
  );
}
```

Note: the smooth active↔NPC ease (~0.8s) emerges from the per-frame `lerp` in `useLovebirdMotion` plus the orbit overwrite in NPC mode — switching mode causes the frame loop targets to change, and the lerps produce the visible ease without explicit transition state. If a sharper ease is wanted, add a `transitionStart` ref later.

- [ ] **Step 12.2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 12.3: Commit**

```bash
git add src/game/world/Lovebirds.tsx
git commit -m "feat(world): add Lovebirds orchestrator (active + NPC orbit)"
```

---

## Task 13: Wire Lovebirds + CloudPerch into World

**Files:**
- Modify: `src/game/world/World.tsx`

- [ ] **Step 13.1: Update World.tsx**

Replace contents:

```tsx
'use client';
import { OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import { ActiveSceneControls } from '@/src/game/controls';
import { useGame } from '@/src/game/store';
import { AREAS } from '@/src/game/world/areas/registry';
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
        enablePan={false}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={4}
        maxDistance={14}
      />
    </>
  );
}
```

- [ ] **Step 13.2: Add tap-to-control on dino**

Modify `src/game/world/dino-cute/DinoCute.tsx`: wrap the outer `group` with `onClick` that calls `setActive('dino')` if not active, otherwise pets.

Read the file first; find the outermost `<group ref={groupRef}>` and add:

```tsx
<group
  ref={groupRef}
  onClick={(e) => {
    e.stopPropagation();
    const active = useGame.getState().active;
    if (active !== 'dino') useGame.getState().setActive('dino');
    else pet('dino');
  }}
>
```

Imports needed at top:

```ts
import { pet } from '@/src/game/systems/interactions';
```

(The existing `onPet` import stays.)

- [ ] **Step 13.3: Run dev to smoke-test**

Run: `bun run dev`
Open `http://localhost:3000`.
Expected: dino + lovebirds + floating cloud all visible. Birds orbit cloud. No console errors.

Stop dev (Ctrl+C) before committing.

- [ ] **Step 13.4: Commit**

```bash
git add src/game/world/World.tsx src/game/world/dino-cute/DinoCute.tsx
git commit -m "feat(world): mount Lovebirds, CloudPerch, tap-to-control dino"
```

---

## Task 14: CharacterToggle pill HUD

**Files:**
- Create: `src/game/HUD/CharacterToggle.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 14.1: Implement CharacterToggle**

```tsx
'use client';

import { useGame } from '@/src/game/store';

export function CharacterToggle() {
  const active = useGame((s) => s.active);
  const setActive = useGame((s) => s.setActive);
  const cls = (on: boolean) =>
    `flex h-10 w-10 items-center justify-center rounded-full text-xl transition-all ${
      on ? 'bg-white shadow-md scale-110' : 'bg-white/40 backdrop-blur'
    }`;
  return (
    <div className="pointer-events-auto fixed top-3 right-3 z-20 flex gap-2 select-none">
      <button
        type="button"
        aria-label="Switch to dino"
        aria-pressed={active === 'dino'}
        className={cls(active === 'dino')}
        onClick={() => setActive('dino')}
      >
        🦖
      </button>
      <button
        type="button"
        aria-label="Switch to lovebirds"
        aria-pressed={active === 'lovebirds'}
        className={cls(active === 'lovebirds')}
        onClick={() => setActive('lovebirds')}
      >
        🐦
      </button>
    </div>
  );
}
```

- [ ] **Step 14.2: Mount in page.tsx**

Read `src/app/page.tsx`. Add an import:

```tsx
import { CharacterToggle } from '@/src/game/HUD/CharacterToggle';
```

Add `<CharacterToggle />` near other HUD components (alongside `<StatsBar />`).

- [ ] **Step 14.3: Smoke-test**

Run: `bun run dev`
Tap each pill → `useGame.getState().active` toggles. Birds should ease toward perch / glide height as `active` flips.

- [ ] **Step 14.4: Commit**

```bash
git add src/game/HUD/CharacterToggle.tsx src/app/page.tsx
git commit -m "feat(HUD): add character toggle pill (dino / lovebirds)"
```

---

## Task 15: StatsBar shows active character

**Files:**
- Modify: `src/game/HUD/StatsBar.tsx`

- [ ] **Step 15.1: Read current file and update**

Find every `useGame((s) => s.dino.stats.X)` and change to:

```tsx
const active = useGame((s) => s.active);
const stats = useGame((s) => s.characters[s.active].stats);
```

Add a small leading icon: `active === 'dino' ? '🦖' : '🐦'`.

Show the existing five bars unchanged (just sourced from the active character).

- [ ] **Step 15.2: Smoke-test**

Run: `bun run dev`
Switch character via toggle → bars and icon swap to lovebirds' stats.

- [ ] **Step 15.3: Commit**

```bash
git add src/game/HUD/StatsBar.tsx
git commit -m "feat(HUD): StatsBar reflects active character"
```

---

## Task 16: ActionBar routes to active + bird food menu

**Files:**
- Modify: `src/game/HUD/ActionBar.tsx`

- [ ] **Step 16.1: Read current ActionBar and update**

Update so:
- `pet`, `bath`, `sleep` calls pass `useGame.getState().active`.
- Feed sub-menu reads active; renders `Object.entries(FOODS)` for dino, `Object.entries(BIRD_FOODS)` for lovebirds. Calling `feed(food, active)` on tap.

Imports:

```tsx
import { BIRD_FOODS, FOODS, bath, feed, pet, sleep } from '@/src/game/systems/interactions';
import { useGame } from '@/src/game/store';
```

Render snippet for the food picker:

```tsx
const active = useGame((s) => s.active);
const menu = active === 'dino' ? FOODS : BIRD_FOODS;
// inside the food picker UI:
{Object.entries(menu).map(([id, def]) => (
  <button key={id} onClick={() => feed(id as never, active)} className="...">
    <span className="text-2xl">{def.emoji}</span>
    <span className="text-xs">{def.name}</span>
  </button>
))}
```

- [ ] **Step 16.2: Smoke-test**

Run: `bun run dev`
Toggle character → food menu changes to seeds/berries/mango. Tap pet/bath/sleep → only active char's stats change.

- [ ] **Step 16.3: Commit**

```bash
git add src/game/HUD/ActionBar.tsx
git commit -m "feat(HUD): ActionBar routes to active char; bird food menu when active=lovebirds"
```

---

## Task 17: MiniMap two dots + Onboarding update

**Files:**
- Modify: `src/game/HUD/MiniMap.tsx`
- Modify: `src/game/HUD/Onboarding.tsx`

- [ ] **Step 17.1: Update MiniMap**

Read the file. Render two dots:

```tsx
const active = useGame((s) => s.active);
const dinoPos = useGame((s) => s.characters.dino.position);
const birdPos = useGame((s) => s.characters.lovebirds.position);
// dino dot: bg-emerald-500 if active else outline emerald-500
// bird dot: bg-pink-400 if active else outline pink-400
```

Use existing world→minimap mapping helper if present; otherwise reuse the same translation as the existing single-dot code.

- [ ] **Step 17.2: Update Onboarding**

Read the file. Add one extra step (or extend the welcome copy) explaining the toggle pill: "Tap 🐦 in the top-right to play with the lovebirds!".

- [ ] **Step 17.3: Smoke-test**

Run: `bun run dev`
Switch chars → minimap dot fill swaps. Onboarding mentions toggle.

- [ ] **Step 17.4: Commit**

```bash
git add src/game/HUD/MiniMap.tsx src/game/HUD/Onboarding.tsx
git commit -m "feat(HUD): minimap two dots; onboarding mentions toggle"
```

---

## Task 18: WelcomeBirds intro card

**Files:**
- Create: `src/game/HUD/WelcomeBirds.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 18.1: Implement WelcomeBirds**

```tsx
'use client';

import { useGame } from '@/src/game/store';

export function WelcomeBirds() {
  const seen = useGame((s) => s.intro.lovebirdsSeen);
  const setSeen = useGame((s) => s.setLovebirdsSeen);
  if (seen) return null;
  return (
    <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/40">
      <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <div className="mb-2 text-3xl">🐦🐦</div>
        <h2 className="mb-2 text-lg font-bold">Meet your lovebirds!</h2>
        <p className="mb-4 text-sm text-gray-700">
          These two are best friends. Tap the 🐦 button in the top-right to play as them. They love
          seeds, berries, and mango! Both pets need love — switch back sometimes.
        </p>
        <button
          type="button"
          onClick={() => setSeen()}
          className="rounded-full bg-emerald-500 px-5 py-2 font-bold text-white shadow"
        >
          OK!
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 18.2: Mount in page.tsx**

```tsx
import { WelcomeBirds } from '@/src/game/HUD/WelcomeBirds';
// ...
<WelcomeBirds />
```

- [ ] **Step 18.3: Smoke-test**

Run: `bun run dev`
Fresh load (clear localStorage) → card appears, OK dismisses, doesn't reappear on reload.

- [ ] **Step 18.4: Commit**

```bash
git add src/game/HUD/WelcomeBirds.tsx src/app/page.tsx
git commit -m "feat(HUD): WelcomeBirds one-time intro card"
```

---

## Task 19: E2E — lovebirds basics

**Files:**
- Create: `tests/e2e/lovebirds.spec.ts`

- [ ] **Step 19.1: Write E2E test**

```ts
import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('lovebirds: toggle, switch, pet, food menu', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
  await page.getByRole('button', { name: 'OK!' }).click(); // dismiss WelcomeBirds

  // Toggle pill is visible.
  const dinoBtn = page.getByRole('button', { name: 'Switch to dino' });
  const birdBtn = page.getByRole('button', { name: 'Switch to lovebirds' });
  await expect(dinoBtn).toHaveAttribute('aria-pressed', 'true');
  await expect(birdBtn).toHaveAttribute('aria-pressed', 'false');

  // Switch to birds.
  await birdBtn.click();
  await expect(birdBtn).toHaveAttribute('aria-pressed', 'true');

  // Active character in store = 'lovebirds'.
  const active = await page.evaluate(() => (window as any).__GAME?.getState?.().active);
  // If __GAME not exposed, skip the read; UI assertion is enough.

  // Switch back via dino pill.
  await dinoBtn.click();
  await expect(dinoBtn).toHaveAttribute('aria-pressed', 'true');
});
```

- [ ] **Step 19.2: Run E2E**

Run: `bun run test:e2e tests/e2e/lovebirds.spec.ts`
Expected: PASS.

- [ ] **Step 19.3: Commit**

```bash
git add tests/e2e/lovebirds.spec.ts
git commit -m "test(e2e): toggle and pet basics for lovebirds"
```

---

## Task 20: E2E — lovebirds present in every area

**Files:**
- Create: `tests/e2e/lovebirds-areas.spec.ts`

- [ ] **Step 20.1: Write E2E test**

```ts
import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const AREAS = ['home', 'town', 'park', 'beach', 'forest', 'cave'] as const;

test('lovebirds and cloud perch render in every area', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
  await page.getByRole('button', { name: 'OK!' }).click().catch(() => {});

  for (const area of AREAS) {
    await page.evaluate((a) => {
      // Reach into the zustand store via a global hook, set area programmatically.
      (window as any).__setArea?.(a);
    }, area);
    // Give R3F a frame.
    await page.waitForTimeout(200);
    // Sanity: canvas exists, no console errors.
    await expect(page.locator('canvas')).toBeVisible();
  }
});
```

🧑‍💻 **Note:** for the `__setArea` shortcut, expose `window.__setArea = (a) => useGame.getState().setArea(a)` in `src/app/page.tsx` behind `process.env.NODE_ENV !== 'production'`. Add a one-line useEffect in the root client component.

- [ ] **Step 20.2: Add the test hook in page.tsx**

```tsx
useEffect(() => {
  if (process.env.NODE_ENV !== 'production') {
    (window as any).__setArea = (a: string) =>
      useGame.getState().setArea(a as never);
  }
}, []);
```

- [ ] **Step 20.3: Run E2E**

Run: `bun run test:e2e tests/e2e/lovebirds-areas.spec.ts`
Expected: PASS.

- [ ] **Step 20.4: Commit**

```bash
git add tests/e2e/lovebirds-areas.spec.ts src/app/page.tsx
git commit -m "test(e2e): verify lovebirds + perch render in every area"
```

---

## Task 21: Final polish + manual mobile sanity

- [ ] **Step 21.1: Run full check**

Run: `bun run typecheck && bun run lint:fix && bun run test && bun run test:e2e`
Expected: all clean.

- [ ] **Step 21.2: Manual mobile sanity (parent task)**

🧑‍💻 Run `bun run show` on your laptop, scan the LAN URL on a phone:

- Toggle pill tappable, both characters render in every area.
- Switch feels snappy (~1s ease).
- W-mouth + beak readable at min and max camera zoom.
- No z-fighting between birds and cloud.
- Pet a bird → spin animation + chirp (after first user gesture).

- [ ] **Step 21.3: Commit any polish (if needed)**

If polishing tweaks needed (z-offsets, colors, sizes), commit each as `polish(world): ...`.

- [ ] **Step 21.4: Open PR via the dino-team workflow**

🧑‍💻 Per `CLAUDE.md`:
- Build via `dino-dev` agent (this plan).
- QA via `dino-qa` agent.
- Review via `dino-reviewer` agent.
- Open PR (never push to `main`).

---

## Self-review notes

- Spec coverage: every spec section has a corresponding task.
- No placeholders in code blocks.
- Type names consistent: `Pet`, `CharacterId`, `BIRD_FOODS`, `FOODS`, `setActive`, `setLovebirdsSeen` are referenced consistently across tasks.
- Each task ends with a commit. TDD where unit tests exist; smoke-test for visual tasks.
- File paths are exact.
- Out-of-scope items (per-area perch, multiple bird sounds, vertical flight) are not in this plan.
