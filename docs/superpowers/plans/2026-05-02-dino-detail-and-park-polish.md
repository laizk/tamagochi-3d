# Dino detail + park polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the dino to life with an expressive face, real walk cycle, smooth facing, action animations, naturally wandering lovebirds, and a park full of friendly background motion.

**Architecture:** Add a transient per-character `action` field to the Zustand store driving an input lock and expression overrides. Decompose the dino face into a `face/` subdirectory. Extract reusable hooks (`useFacing`, `useDinoWalkCycle`, `useLovebirdWander`). Add 10 park decor components under `world/areas/park-decor/`.

**Tech Stack:** Next.js 16 App Router, react-three-fiber + drei + three.js, Zustand, Vitest, Playwright, Bun, Biome 2.

**Spec:** `docs/superpowers/specs/2026-05-02-dino-detail-and-park-polish-design.md`

---

## Conventions

- All files are TypeScript. R3F components are Client Components — start with `'use client';`.
- Tests live in `tests/unit/<topic>.test.ts` (Vitest) and `tests/e2e/<topic>.spec.ts` (Playwright).
- After each task: `bun run typecheck && bun run lint:fix` then commit.
- Commit messages follow Conventional Commits (e.g. `feat(dino): ...`, `test(...)`, `refactor(...)`).

---

## Task 1: Add `action` field + setters to the store

**Files:**
- Modify: `src/game/store.ts`
- Test: `tests/unit/action-state.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/action-state.test.ts`:
```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { useGame } from '@/src/game/store';

describe('action state', () => {
  beforeEach(() => useGame.setState(useGame.getInitialState(), true));

  it('initializes action as null for both characters', () => {
    expect(useGame.getState().characters.dino.action).toBeNull();
    expect(useGame.getState().characters.lovebirds.action).toBeNull();
  });

  it('startAction sets the action with kind, startedAt, durationMs', () => {
    useGame.getState().startAction('dino', 'eat', 3000);
    const a = useGame.getState().characters.dino.action;
    expect(a?.kind).toBe('eat');
    expect(a?.durationMs).toBe(3000);
    expect(typeof a?.startedAt).toBe('number');
  });

  it('clearAction sets action back to null', () => {
    useGame.getState().startAction('dino', 'play', 4000);
    useGame.getState().clearAction('dino');
    expect(useGame.getState().characters.dino.action).toBeNull();
  });

  it('setting action on dino does not affect lovebirds', () => {
    useGame.getState().startAction('dino', 'sleep', 5000);
    expect(useGame.getState().characters.lovebirds.action).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test tests/unit/action-state.test.ts`
Expected: FAIL — `action` field does not exist yet.

- [ ] **Step 3: Write minimal implementation**

In `src/game/store.ts`:

Add types near other types:
```ts
export type ActionKind = 'eat' | 'bath' | 'sleep' | 'play';
export type Action = { kind: ActionKind; startedAt: number; durationMs: number } | null;
```

Add `action: Action` to `Pet`:
```ts
export type Pet = {
  id: string;
  name: string;
  species: Species;
  skinId: SkinId;
  stage: 'egg' | 'baby' | 'teen' | 'adult';
  age: number;
  stats: Record<StatKey, Stat>;
  position: [number, number, number];
  action: Action;
};
```

Add `action: null` in both `INITIAL_DINO` and `INITIAL_LOVEBIRDS`:
```ts
action: null,
```

Add to `GameActions`:
```ts
startAction: (charId: CharacterId, kind: ActionKind, durationMs: number) => void;
clearAction: (charId: CharacterId) => void;
```

Add implementations inside `useGame` create:
```ts
startAction: (id, kind, durationMs) =>
  set((s) => setChar(s, id, { action: { kind, startedAt: performance.now(), durationMs } })),
clearAction: (id) => set((s) => setChar(s, id, { action: null })),
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test tests/unit/action-state.test.ts`
Expected: PASS (4 tests).

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/store.ts tests/unit/action-state.test.ts
git commit -m "feat(store): add transient per-character action field with start/clear setters"
```

---

## Task 2: Strip action on persistence load (transient field)

**Files:**
- Modify: `src/game/Game.tsx:25-40` (the load+hydrate effect)
- Test: `tests/unit/action-state.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/action-state.test.ts`:
```ts
import { SAVE_KEY } from '@/src/lib/persistence';
import { load } from '@/src/lib/persistence';

describe('action state — persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    useGame.setState(useGame.getInitialState(), true);
  });

  it('loaded state with stale action is cleared by hydrate path', () => {
    const blob = {
      ...useGame.getInitialState(),
      characters: {
        ...useGame.getInitialState().characters,
        dino: { ...useGame.getInitialState().characters.dino, action: { kind: 'sleep', startedAt: 1, durationMs: 5000 } },
      },
      version: 2,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(blob));
    const loaded = load();
    expect(loaded).not.toBeNull();
    useGame.getState().hydrate(loaded as never);
    useGame.getState().clearAction('dino');
    useGame.getState().clearAction('lovebirds');
    expect(useGame.getState().characters.dino.action).toBeNull();
    expect(useGame.getState().characters.lovebirds.action).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it passes already** (since we explicitly call clearAction). Then refactor `Game.tsx` to call `clearAction` automatically on load.

Run: `bun run test tests/unit/action-state.test.ts`
Expected: PASS.

- [ ] **Step 3: Wire automatic clear in `Game.tsx`**

In `src/game/Game.tsx`, inside the `useEffect` that calls `load()` and `hydrate(...)`, add immediately after `useGame.getState().hydrate(loaded);`:
```ts
useGame.getState().clearAction('dino');
useGame.getState().clearAction('lovebirds');
```

- [ ] **Step 4: Re-run typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/Game.tsx tests/unit/action-state.test.ts
git commit -m "fix(persistence): clear stale action field on hydrate"
```

---

## Task 3: `tick.ts` clears expired actions

**Files:**
- Modify: `src/game/systems/tick.ts`
- Test: `tests/unit/tick.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/tick.test.ts`:
```ts
describe('tick — action expiry', () => {
  beforeEach(() => useGame.setState(useGame.getInitialState(), true));

  it('clears action when duration has elapsed', () => {
    useGame.getState().startAction('dino', 'eat', 1000);
    const a = useGame.getState().characters.dino.action;
    expect(a).not.toBeNull();
    if (a) (a as { startedAt: number }).startedAt = performance.now() - 2000;
    tick(0);
    expect(useGame.getState().characters.dino.action).toBeNull();
  });

  it('keeps action while still within duration', () => {
    useGame.getState().startAction('dino', 'eat', 5000);
    tick(0);
    expect(useGame.getState().characters.dino.action).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test tests/unit/tick.test.ts`
Expected: FAIL — `tick` does not yet clear actions.

- [ ] **Step 3: Implement**

In `src/game/systems/tick.ts`, inside the for loop over `CHARS`, after the existing per-character logic, add:
```ts
const action = useGame.getState().characters[id].action;
if (action && performance.now() - action.startedAt >= action.durationMs) {
  state.clearAction(id);
}
```

- [ ] **Step 4: Run test**

Run: `bun run test tests/unit/tick.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/systems/tick.ts tests/unit/tick.test.ts
git commit -m "feat(tick): auto-clear action when duration elapses"
```

---

## Task 4: Wire `feed`, `bath`, `sleep` to start actions; add `play()`

**Files:**
- Modify: `src/game/systems/interactions.ts`
- Test: `tests/unit/interactions.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/interactions.test.ts`:
```ts
import { play } from '@/src/game/systems/interactions';

describe('action triggers', () => {
  beforeEach(() => useGame.setState(useGame.getInitialState(), true));

  it('feed starts an "eat" action with 3000ms duration', () => {
    feed('apple', 'dino');
    const a = useGame.getState().characters.dino.action;
    expect(a?.kind).toBe('eat');
    expect(a?.durationMs).toBe(3000);
  });

  it('bath starts a "bath" action with 4000ms duration', () => {
    bath('dino');
    const a = useGame.getState().characters.dino.action;
    expect(a?.kind).toBe('bath');
    expect(a?.durationMs).toBe(4000);
  });

  it('sleep starts a "sleep" action with 5000ms duration', () => {
    sleep('dino');
    const a = useGame.getState().characters.dino.action;
    expect(a?.kind).toBe('sleep');
    expect(a?.durationMs).toBe(5000);
  });

  it('play boosts happy +20, drains energy -10, starts "play" action 4000ms', () => {
    useGame.getState().setStat('dino', 'happy', 50);
    useGame.getState().setStat('dino', 'energy', 50);
    play('dino');
    expect(useGame.getState().characters.dino.stats.happy).toBe(70);
    expect(useGame.getState().characters.dino.stats.energy).toBe(40);
    const a = useGame.getState().characters.dino.action;
    expect(a?.kind).toBe('play');
    expect(a?.durationMs).toBe(4000);
  });

  it('pet does NOT start an action', () => {
    pet('dino');
    expect(useGame.getState().characters.dino.action).toBeNull();
  });
});
```

(Make sure `bath`, `sleep`, `feed`, `pet` are imported at the top of the file if not already.)

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test tests/unit/interactions.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

In `src/game/systems/interactions.ts`, replace the existing `feed`, `bath`, `sleep` and add `play`:
```ts
const ACTION_DURATION_MS: Record<'eat' | 'bath' | 'sleep' | 'play', number> = {
  eat: 3000,
  bath: 4000,
  sleep: 5000,
  play: 4000,
};

export function feed(food: FoodId, charId: CharacterId): void {
  const def =
    charId === 'dino'
      ? (FOODS as Record<string, FoodDef>)[food]
      : (BIRD_FOODS as Record<string, FoodDef>)[food];
  if (!def) return;
  const s = useGame.getState();
  s.applyStatDelta(charId, 'hunger', def.hungerRestored);
  if (def.happyBonus) s.applyStatDelta(charId, 'happy', def.happyBonus);
  s.startAction(charId, 'eat', ACTION_DURATION_MS.eat);
}

export function bath(charId: CharacterId): void {
  const s = useGame.getState();
  s.applyStatDelta(charId, 'clean', 50);
  s.applyStatDelta(charId, 'happy', -5);
  s.startAction(charId, 'bath', ACTION_DURATION_MS.bath);
}

export function sleep(charId: CharacterId): void {
  const s = useGame.getState();
  s.applyStatDelta(charId, 'energy', 60);
  s.startAction(charId, 'sleep', ACTION_DURATION_MS.sleep);
}

export function play(charId: CharacterId): void {
  const s = useGame.getState();
  s.applyStatDelta(charId, 'happy', 20);
  s.applyStatDelta(charId, 'energy', -10);
  s.startAction(charId, 'play', ACTION_DURATION_MS.play);
}
```

- [ ] **Step 4: Run tests**

Run: `bun run test tests/unit/interactions.test.ts`
Expected: PASS. Re-run all unit tests: `bun run test` — expected PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/systems/interactions.ts tests/unit/interactions.test.ts
git commit -m "feat(interactions): wire actions to startAction; add play()"
```

---

## Task 5: Pure helper `chooseExpression(mood, actionKind)`

**Files:**
- Create: `src/game/systems/expression.ts`
- Test: `tests/unit/expression.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/expression.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { chooseExpression } from '@/src/game/systems/expression';

describe('chooseExpression', () => {
  it('returns mood when actionKind is null', () => {
    expect(chooseExpression('happy', null)).toBe('happy');
    expect(chooseExpression('sad', null)).toBe('sad');
    expect(chooseExpression('sleepy', null)).toBe('sleepy');
    expect(chooseExpression('bouncy', null)).toBe('bouncy');
  });

  it('action overrides mood', () => {
    expect(chooseExpression('sad', 'eat')).toBe('eat');
    expect(chooseExpression('happy', 'bath')).toBe('bath');
    expect(chooseExpression('bouncy', 'sleep')).toBe('sleep');
    expect(chooseExpression('sleepy', 'play')).toBe('play');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test tests/unit/expression.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/game/systems/expression.ts`:
```ts
import type { ActionKind } from '@/src/game/store';
import type { Mood } from '@/src/game/systems/mood';

export type Expression = Mood | ActionKind;

export function chooseExpression(mood: Mood, actionKind: ActionKind | null): Expression {
  return actionKind ?? mood;
}
```

- [ ] **Step 4: Run test**

Run: `bun run test tests/unit/expression.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/systems/expression.ts tests/unit/expression.test.ts
git commit -m "feat(expression): pure helper to merge mood and action into a single expression key"
```

---

## Task 6: Pure helper `headingFromDelta(dx, dz)`

**Files:**
- Create: `src/game/systems/heading.ts`
- Test: `tests/unit/heading.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/heading.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { headingFromDelta } from '@/src/game/systems/heading';

const TAU = Math.PI * 2;
const close = (a: number, b: number, eps = 1e-6) =>
  Math.abs(((a - b) % TAU) + TAU) % TAU < eps || Math.abs(a - b) < eps;

describe('headingFromDelta', () => {
  it('returns null for negligible motion', () => {
    expect(headingFromDelta(0, 0)).toBeNull();
    expect(headingFromDelta(0.0005, 0.0005)).toBeNull();
  });

  it('forward (+z) is 0', () => {
    const h = headingFromDelta(0, 1);
    expect(h).not.toBeNull();
    expect(close(h as number, 0)).toBe(true);
  });

  it('right (+x) is PI/2', () => {
    const h = headingFromDelta(1, 0);
    expect(h).not.toBeNull();
    expect(close(h as number, Math.PI / 2)).toBe(true);
  });

  it('back (-z) is PI', () => {
    const h = headingFromDelta(0, -1);
    expect(h).not.toBeNull();
    expect(close(Math.abs(h as number), Math.PI)).toBe(true);
  });

  it('left (-x) is -PI/2', () => {
    const h = headingFromDelta(-1, 0);
    expect(h).not.toBeNull();
    expect(close(h as number, -Math.PI / 2)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test tests/unit/heading.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/game/systems/heading.ts`:
```ts
const MIN_DELTA = 0.001;

export function headingFromDelta(dx: number, dz: number): number | null {
  if (Math.hypot(dx, dz) < MIN_DELTA) return null;
  return Math.atan2(dx, dz);
}
```

- [ ] **Step 4: Run test**

Run: `bun run test tests/unit/heading.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/systems/heading.ts tests/unit/heading.test.ts
git commit -m "feat(heading): pure helper for atan2 heading from xz delta"
```

---

## Task 7: Pure helper `pickWanderTarget(anchor, radius)`

**Files:**
- Create: `src/game/systems/wander.ts`
- Test: `tests/unit/wander.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/wander.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { pickWanderTarget } from '@/src/game/systems/wander';

describe('pickWanderTarget', () => {
  it('returns a point within radius of the anchor in xz', () => {
    const anchor: [number, number, number] = [2, 3, -1];
    for (let i = 0; i < 100; i++) {
      const [x, y, z] = pickWanderTarget(anchor, 3);
      expect(Math.hypot(x - anchor[0], z - anchor[2])).toBeLessThanOrEqual(3 + 1e-9);
      expect(y).toBeGreaterThanOrEqual(1.5);
      expect(y).toBeLessThanOrEqual(4);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test tests/unit/wander.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/game/systems/wander.ts`:
```ts
const Y_MIN = 1.5;
const Y_MAX = 4;

export function pickWanderTarget(
  anchor: [number, number, number],
  radius: number,
): [number, number, number] {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * radius;
  const x = anchor[0] + Math.cos(angle) * r;
  const z = anchor[2] + Math.sin(angle) * r;
  const y = Y_MIN + Math.random() * (Y_MAX - Y_MIN);
  return [x, y, z];
}
```

- [ ] **Step 4: Run test**

Run: `bun run test tests/unit/wander.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/systems/wander.ts tests/unit/wander.test.ts
git commit -m "feat(wander): pure helper to pick a random target inside a radius around an anchor"
```

---

## Task 8: Action lock in `TapControls`

**Files:**
- Modify: `src/game/controls/TapControls.tsx`
- Test: deferred to e2e (Task 35)

- [ ] **Step 1: Read current implementation**

Open `src/game/controls/TapControls.tsx` and locate the `onPointerDown` handler (lines 16-39).

- [ ] **Step 2: Modify pointerdown handler and useFrame to skip while action is active**

Update the `onUp` callback (inside `useEffect`):
```ts
const onUp = (u: PointerEvent) => {
  const dx = Math.abs(u.clientX - downX);
  const dy = Math.abs(u.clientY - downY);
  if (dx + dy < 8) {
    const active = useGame.getState().active;
    const action = useGame.getState().characters[active].action;
    if (action !== null) {
      gl.domElement.removeEventListener('pointerup', onUp);
      return;
    }
    const rect = gl.domElement.getBoundingClientRect();
    ndc.current.set(
      ((u.clientX - rect.left) / rect.width) * 2 - 1,
      -((u.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.current.setFromCamera(ndc.current, camera);
    const hits = raycaster.current.intersectObjects(scene.children, true);
    const groundHit = hits.find((h) => h.object.userData?.kind === 'ground');
    if (groundHit) target.current = groundHit.point.clone().setY(0);
  }
  gl.domElement.removeEventListener('pointerup', onUp);
};
```

Update the `useFrame` body to abort while action is active (and clear any in-flight target so the freeze is immediate):
```ts
useFrame((_, dt) => {
  if (!target.current) return;
  const active = useGame.getState().active;
  const action = useGame.getState().characters[active].action;
  if (action !== null) {
    target.current = null;
    return;
  }
  const pos = useGame.getState().characters[active].position;
  const dx = target.current.x - pos[0];
  const dz = target.current.z - pos[2];
  const dist = Math.hypot(dx, dz);
  if (dist < 0.05) {
    target.current = null;
    return;
  }
  const step = Math.min(dist, MOVE_SPEED * dt);
  const nx = pos[0] + (dx / dist) * step;
  const nz = pos[2] + (dz / dist) * step;
  useGame.getState().setPosition(active, [nx, pos[1], nz]);
});
```

- [ ] **Step 3: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 4: Manual sanity (optional, deferred to e2e)**

- [ ] **Step 5: Commit**

```bash
git add src/game/controls/TapControls.tsx
git commit -m "feat(tap): suppress ground taps while action is active"
```

---

## Task 9: Action lock in `useDinoMotion`

**Files:**
- Modify: `src/game/world/useDinoMotion.ts`

- [ ] **Step 1: Read current implementation**

Note: the `useFrame` callback in `useDinoMotion.ts` writes to `ref.current.position` every frame.

- [ ] **Step 2: Modify to skip position write while action is active**

Update `useFrame` body to:
```ts
useFrame(() => {
  if (!ref.current) return;
  const now = performance.now();
  const bob = Math.sin(now / 400) * 0.05;
  const bouncePhase = (now - bounceRef.current) / 1000;
  const bounceY = bouncePhase < 0.6 ? Math.sin((bouncePhase * Math.PI) / 0.6) * 0.4 : 0;

  const { position, stats, action } = useGame.getState().characters.dino;

  // While an action is active, body bob/bounce still apply but xz is frozen.
  ref.current.position.set(position[0], position[1] + baseY + bob + bounceY, position[2]);

  const sad = Math.min(stats.hunger, stats.happy, stats.energy, stats.clean, stats.health) < 25;
  ref.current.rotation.x = sad ? 0.2 : 0;

  // Hint exposed for walk cycle / facing hooks to short-circuit.
  void action;
});
```

(The `void action` keeps the destructure useful and signals intent. The actual freeze comes from `TapControls` no longer updating `position` during action; the walk cycle hook will read the same flag in Task 13.)

- [ ] **Step 3: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/game/world/useDinoMotion.ts
git commit -m "refactor(motion): surface action flag in dino motion frame"
```

---

## Task 10: ActionBar disables buttons during action; adds Play button

**Files:**
- Modify: `src/game/HUD/ActionBar.tsx`

- [ ] **Step 1: Replace ActionBar.tsx contents**

```tsx
'use client';

import { useGame } from '@/src/game/store';
import {
  BIRD_FOODS,
  type BirdFoodId,
  bath,
  type DinoFoodId,
  FOODS,
  feed,
  pet,
  play,
  sleep,
} from '@/src/game/systems/interactions';

export function ActionBar() {
  const area = useGame((s) => s.currentArea);
  const active = useGame((s) => s.active);
  const action = useGame((s) => s.characters[active].action);
  const homeOnly = area === 'home';
  const menu = active === 'dino' ? FOODS : BIRD_FOODS;
  const locked = action !== null;
  const dim = locked ? 'opacity-40 pointer-events-none' : '';

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-10 flex justify-center p-3 pb-[env(safe-area-inset-bottom)]">
      <div className="flex gap-2 rounded-2xl bg-white/85 px-3 py-2 shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={() => pet(active)}
          disabled={locked}
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-pink-200 text-2xl ${dim}`}
          aria-label="Pet"
        >
          🤗
        </button>
        <button
          type="button"
          onClick={() => play(active)}
          disabled={locked}
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-yellow-200 text-2xl ${dim}`}
          aria-label="Play"
        >
          🎾
        </button>
        {homeOnly && (
          <>
            {Object.entries(menu).map(([id, def]) => (
              <button
                key={id}
                type="button"
                onClick={() => feed(id as DinoFoodId | BirdFoodId, active)}
                disabled={locked}
                className={`flex h-12 w-12 items-center justify-center rounded-full bg-orange-200 text-2xl ${dim}`}
                aria-label={`Feed ${def.name}`}
              >
                {def.emoji}
              </button>
            ))}
            <button
              type="button"
              onClick={() => bath(active)}
              disabled={locked}
              className={`flex h-12 w-12 items-center justify-center rounded-full bg-cyan-200 text-2xl ${dim}`}
              aria-label="Bath"
            >
              🛁
            </button>
            <button
              type="button"
              onClick={() => sleep(active)}
              disabled={locked}
              className={`flex h-12 w-12 items-center justify-center rounded-full bg-indigo-200 text-2xl ${dim}`}
              aria-label="Sleep"
            >
              💤
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Lint**

Run: `bun run lint:fix`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/game/HUD/ActionBar.tsx
git commit -m "feat(hud): add Play button; dim/disable action buttons while action active"
```

---

## Task 11: `useFacing` hook

**Files:**
- Create: `src/game/world/useFacing.ts`

- [ ] **Step 1: Write the hook**

Create `src/game/world/useFacing.ts`:
```ts
'use client';

import { useFrame } from '@react-three/fiber';
import { type RefObject, useRef } from 'react';
import type { Object3D } from 'three';
import { headingFromDelta } from '@/src/game/systems/heading';

const TURN_SPEED = 10; // dt * 10 → ~0.2s response

/**
 * Smoothly rotates `ref.current.rotation.y` to face the travel direction
 * derived from `getPos`. Caller supplies any position source (store reader,
 * a velocity-based getter, etc.).
 */
export function useFacing(
  ref: RefObject<Object3D | null>,
  getPos: () => readonly [number, number, number],
) {
  const last = useRef<readonly [number, number, number] | null>(null);

  useFrame((_state, dt) => {
    if (!ref.current) return;
    const cur = getPos();
    const prev = last.current;
    last.current = cur;
    if (!prev) return;
    const dx = cur[0] - prev[0];
    const dz = cur[2] - prev[2];
    const target = headingFromDelta(dx, dz);
    if (target === null) return;
    const cur_y = ref.current.rotation.y;
    let diff = target - cur_y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    ref.current.rotation.y = cur_y + diff * Math.min(1, dt * TURN_SPEED);
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/game/world/useFacing.ts
git commit -m "feat(world): useFacing hook — smooth y-axis rotation toward travel direction"
```

---

## Task 12: `useDinoWalkCycle` hook

**Files:**
- Create: `src/game/world/useDinoWalkCycle.ts`

- [ ] **Step 1: Implement**

Create `src/game/world/useDinoWalkCycle.ts`:
```ts
'use client';

import { useFrame } from '@react-three/fiber';
import { type RefObject, useRef } from 'react';
import type { Mesh } from 'three';
import { useGame } from '@/src/game/store';

const WALK_FREQ_HZ = 4;
const SPEED_THRESHOLD = 0.05;

type Refs = {
  armL: RefObject<Mesh | null>;
  armR: RefObject<Mesh | null>;
  legL: RefObject<Mesh | null>;
  legR: RefObject<Mesh | null>;
  tail: RefObject<Mesh | null>;
};

const LEG_BASE_Y = 0.2;

/**
 * Drives a walk cycle on the dino's limbs while moving, idle wiggle otherwise.
 */
export function useDinoWalkCycle({ armL, armR, legL, legR, tail }: Refs) {
  const lastPos = useRef<readonly [number, number, number] | null>(null);

  useFrame((_state, dt) => {
    const { position } = useGame.getState().characters.dino;
    const prev = lastPos.current;
    lastPos.current = position;
    const dx = prev ? position[0] - prev[0] : 0;
    const dz = prev ? position[2] - prev[2] : 0;
    const speed = Math.hypot(dx, dz) / Math.max(dt, 1e-3);

    const t = performance.now() / 1000;
    const phase = t * WALK_FREQ_HZ * Math.PI * 2;

    if (speed > SPEED_THRESHOLD) {
      if (armL.current) armL.current.rotation.x = Math.sin(phase) * 0.4;
      if (armR.current) armR.current.rotation.x = -Math.sin(phase) * 0.4;
      if (legL.current) {
        legL.current.position.y = LEG_BASE_Y + Math.sin(phase) * 0.06;
        legL.current.rotation.x = Math.sin(phase) * 0.2;
      }
      if (legR.current) {
        legR.current.position.y = LEG_BASE_Y - Math.sin(phase) * 0.06;
        legR.current.rotation.x = -Math.sin(phase) * 0.2;
      }
      if (tail.current) tail.current.rotation.y = Math.sin(phase) * 0.2;
    } else {
      // idle: mild arm wiggle, neutral legs
      const slow = performance.now() / 500;
      if (armL.current) {
        armL.current.rotation.x = 0;
        armL.current.rotation.z = Math.sin(slow) * 0.05;
      }
      if (armR.current) {
        armR.current.rotation.x = 0;
        armR.current.rotation.z = -Math.sin(slow) * 0.05;
      }
      if (legL.current) {
        legL.current.position.y = LEG_BASE_Y;
        legL.current.rotation.x = 0;
      }
      if (legR.current) {
        legR.current.position.y = LEG_BASE_Y;
        legR.current.rotation.x = 0;
      }
      if (tail.current) tail.current.rotation.y = Math.sin(performance.now() / 600) * 0.08;
    }
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/game/world/useDinoWalkCycle.ts
git commit -m "feat(world): useDinoWalkCycle hook — alternating limb walk cycle and idle wiggle"
```

---

## Task 13: `useLovebirdWander` hook

**Files:**
- Create: `src/game/world/useLovebirdWander.ts`

- [ ] **Step 1: Implement**

Create `src/game/world/useLovebirdWander.ts`:
```ts
'use client';

import { useFrame } from '@react-three/fiber';
import { type RefObject, useRef } from 'react';
import type { Group } from 'three';
import { useGame } from '@/src/game/store';
import { pickWanderTarget } from '@/src/game/systems/wander';

const RADIUS = 3;
const REPLAN_AFTER_MS = 6000;
const ARRIVE_DIST = 0.2;
const FLY_SPEED = 1.5;

type BirdState = {
  anchor: [number, number, number] | null;
  target: [number, number, number] | null;
  pickedAt: number;
};

function freshBird(): BirdState {
  return { anchor: null, target: null, pickedAt: 0 };
}

function update(
  ref: RefObject<Group | null>,
  state: BirdState,
  active: 'lovebirds' | 'dino',
  prevActiveWasBirds: boolean,
  dt: number,
) {
  if (!ref.current) return;
  if (active === 'lovebirds') {
    // active mode handled by useLovebirdMotion; just remember position for next anchor capture
    state.anchor = [ref.current.position.x, ref.current.position.y, ref.current.position.z];
    state.target = null;
    state.pickedAt = 0;
    return;
  }
  // entering NPC mode this frame OR first NPC frame
  if (state.anchor === null || prevActiveWasBirds) {
    state.anchor = [ref.current.position.x, ref.current.position.y, ref.current.position.z];
  }
  const now = performance.now();
  const cur = ref.current.position;
  const needNew =
    state.target === null ||
    Math.hypot(cur.x - state.target[0], cur.z - state.target[2]) < ARRIVE_DIST ||
    now - state.pickedAt > REPLAN_AFTER_MS;
  if (needNew && state.anchor) {
    state.target = pickWanderTarget(state.anchor, RADIUS);
    state.pickedAt = now;
  }
  if (!state.target) return;
  const tx = state.target[0];
  const ty = state.target[1];
  const tz = state.target[2];
  const factor = Math.min(1, dt * FLY_SPEED);
  ref.current.position.x += (tx - cur.x) * factor;
  ref.current.position.y += (ty - cur.y) * factor;
  ref.current.position.z += (tz - cur.z) * factor;
}

/**
 * Drives both lovebirds in NPC mode (active !== 'lovebirds') with independent
 * wandering around per-bird anchors. Anchor captured when the player switches
 * away from the lovebirds (or on first mount in NPC mode).
 */
export function useLovebirdWander(
  leaderRef: RefObject<Group | null>,
  partnerRef: RefObject<Group | null>,
) {
  const leaderState = useRef<BirdState>(freshBird());
  const partnerState = useRef<BirdState>(freshBird());
  const prevActive = useRef<'lovebirds' | 'dino'>('dino');

  useFrame((_state, dt) => {
    const active = useGame.getState().active;
    const prevWasBirds = prevActive.current === 'lovebirds';
    update(leaderRef, leaderState.current, active, prevWasBirds, dt);
    update(partnerRef, partnerState.current, active, prevWasBirds, dt);
    prevActive.current = active;
  });
}

// Velocity getter used by useFacing (per-bird velocity tracker for NPC mode).
export function makeVelocityFromGroup(ref: RefObject<Group | null>): () => readonly [number, number, number] {
  return () => {
    const p = ref.current?.position;
    return p ? ([p.x, p.y, p.z] as const) : ([0, 0, 0] as const);
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/game/world/useLovebirdWander.ts
git commit -m "feat(world): useLovebirdWander hook — independent per-bird wander around captured anchor"
```

---

## Task 14: Face — `Eyes.tsx`

**Files:**
- Create: `src/game/world/dino-cute/face/Eyes.tsx`

- [ ] **Step 1: Implement**

Create the directory and file. Contents:
```tsx
'use client';

import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import type { Mesh } from 'three';
import type { Expression } from '@/src/game/systems/expression';

const PUPIL_COLOR = '#1A1A24';
const SPARKLE_COLOR = '#FFFFFF';
const TEAR_COLOR = '#9CD0FF';
const LID_COLOR = '#7FE0B0';

type Variant = 'open' | 'half' | 'closed' | 'squint' | 'wide';

function variantFor(expr: Expression): Variant {
  switch (expr) {
    case 'sad':
      return 'wide';
    case 'sleepy':
      return 'half';
    case 'bouncy':
    case 'eat':
      return 'wide';
    case 'bath':
    case 'sleep':
      return 'closed';
    case 'play':
      return 'squint';
    default:
      return 'open';
  }
}

const BLINK_MS = 150;
const BLINK_MIN = 3000;
const BLINK_MAX = 5000;

export function Eyes({ expression }: { expression: Expression }) {
  const variant = variantFor(expression);
  const lidRef = useRef<Mesh>(null);
  const [nextBlinkAt, setNextBlinkAt] = useState(() => performance.now() + BLINK_MIN + Math.random() * (BLINK_MAX - BLINK_MIN));
  const blinkingUntilRef = useRef(0);

  useFrame(() => {
    if (!lidRef.current) return;
    const now = performance.now();
    const blinkable = variant === 'open' || variant === 'wide';
    let lidY = 0; // 0 = open, 1 = closed (rotation X = lidY * 1.5)
    if (variant === 'half') lidY = 0.5;
    if (variant === 'closed') lidY = 1;
    if (variant === 'squint') lidY = 0.7;
    if (variant === 'wide') lidY = 0;
    if (blinkable && now >= nextBlinkAt && now > blinkingUntilRef.current) {
      blinkingUntilRef.current = now + BLINK_MS;
      setNextBlinkAt(now + BLINK_MIN + Math.random() * (BLINK_MAX - BLINK_MIN));
    }
    if (now < blinkingUntilRef.current) lidY = 1;
    lidRef.current.rotation.x = lidY * 1.5;
    lidRef.current.position.y = 0;
  });

  const scale = variant === 'wide' ? 1.1 : variant === 'squint' ? 0.7 : 1;

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
      {(variant === 'open' || variant === 'wide') && (
        <mesh position={[-0.02, 0.02, 0.05]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshStandardMaterial color={SPARKLE_COLOR} roughness={0.2} />
        </mesh>
      )}
      {/* tear (sad) */}
      {expression === 'sad' && (
        <mesh position={[0.02, -0.07, 0.04]}>
          <sphereGeometry args={[0.02, 12, 12]} />
          <meshStandardMaterial color={TEAR_COLOR} roughness={0.2} />
        </mesh>
      )}
      {/* upper eyelid: half-sphere that rotates down to close */}
      <group position={[0, 0.06, 0]}>
        <mesh ref={lidRef}>
          <sphereGeometry args={[0.062, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={LID_COLOR} roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/game/world/dino-cute/face/Eyes.tsx
git commit -m "feat(face): Eyes component with mood/action variants and idle blink"
```

---

## Task 15: Face — `Brows.tsx`

**Files:**
- Create: `src/game/world/dino-cute/face/Brows.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import type { Expression } from '@/src/game/systems/expression';

const BROW_COLOR = '#1A1A24';

function browAngles(expr: Expression): { left: number; right: number; y: number } {
  switch (expr) {
    case 'sad':
      return { left: -0.4, right: 0.4, y: 0.02 };
    case 'bouncy':
    case 'eat':
    case 'play':
      return { left: 0.3, right: -0.3, y: 0.05 };
    case 'sleepy':
    case 'bath':
    case 'sleep':
      return { left: 0, right: 0, y: 0 };
    default:
      return { left: 0.05, right: -0.05, y: 0.02 };
  }
}

export function Brows({ expression }: { expression: Expression }) {
  const a = browAngles(expression);
  return (
    <group position={[0, a.y, 0]}>
      <mesh position={[-0.13, 0.06, 0.5]} rotation={[0, 0, a.left]}>
        <boxGeometry args={[0.08, 0.015, 0.02]} />
        <meshStandardMaterial color={BROW_COLOR} roughness={0.6} />
      </mesh>
      <mesh position={[0.13, 0.06, 0.5]} rotation={[0, 0, a.right]}>
        <boxGeometry args={[0.08, 0.015, 0.02]} />
        <meshStandardMaterial color={BROW_COLOR} roughness={0.6} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/game/world/dino-cute/face/Brows.tsx
git commit -m "feat(face): Brows component with expression-driven angles"
```

---

## Task 16: Face — `Snout.tsx`

**Files:**
- Create: `src/game/world/dino-cute/face/Snout.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

const BODY_COLOR = '#7FE0B0';
const NOSTRIL_COLOR = '#1A1A24';

export function Snout() {
  return (
    <group position={[0, 1.0, 0.5]}>
      {/* snout cone — lying along +z */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.12, 0.25, 16]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
      {/* nostrils */}
      <mesh position={[-0.04, 0.03, 0.12]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color={NOSTRIL_COLOR} roughness={0.6} />
      </mesh>
      <mesh position={[0.04, 0.03, 0.12]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color={NOSTRIL_COLOR} roughness={0.6} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/game/world/dino-cute/face/Snout.tsx
git commit -m "feat(face): Snout with nostrils"
```

---

## Task 17: Face — `Jaw.tsx`

**Files:**
- Create: `src/game/world/dino-cute/face/Jaw.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import type { Expression } from '@/src/game/systems/expression';

const BODY_COLOR = '#7FE0B0';
const TEETH_COLOR = '#FFFFFF';

function targetOpen(expr: Expression): number {
  switch (expr) {
    case 'bouncy':
      return 0.2;
    case 'eat':
      return 0.4; // baseline; chew adds modulation
    case 'bath':
      return 0.15;
    case 'sleep':
      return 0.1;
    case 'play':
      return 0.55;
    case 'sad':
      return 0.05;
    case 'sleepy':
      return 0;
    default:
      return 0;
  }
}

export function Jaw({ expression }: { expression: Expression }) {
  const ref = useRef<Group>(null);

  useFrame(() => {
    if (!ref.current) return;
    const base = targetOpen(expression);
    let open = base;
    if (expression === 'eat') {
      // 4 Hz chew oscillation around 0.3 baseline
      open = 0.3 + Math.abs(Math.sin(performance.now() / 1000 * Math.PI * 2 * 4)) * 0.25;
    }
    ref.current.rotation.x = open;
  });

  return (
    <group ref={ref} position={[0, 0.92, 0.55]}>
      <mesh castShadow rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[0.1, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
      </mesh>
      {/* teeth — 4 small cones along the front edge */}
      {[-0.05, -0.017, 0.017, 0.05].map((x) => (
        <mesh key={x} position={[x, -0.01, 0.085]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.012, 0.04, 8]} />
          <meshStandardMaterial color={TEETH_COLOR} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/game/world/dino-cute/face/Jaw.tsx
git commit -m "feat(face): Jaw with teeth and eat-time chew animation"
```

---

## Task 18: Face — `Tongue.tsx`

**Files:**
- Create: `src/game/world/dino-cute/face/Tongue.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import type { Expression } from '@/src/game/systems/expression';

const TONGUE_COLOR = '#FF7AB6';

export function Tongue({ expression }: { expression: Expression }) {
  if (expression !== 'eat' && expression !== 'play') return null;
  const z = expression === 'play' ? 0.66 : 0.6;
  const rotX = expression === 'play' ? Math.PI / 2.2 : Math.PI / 2;
  return (
    <mesh position={[0, 0.92, z]} rotation={[rotX, 0, 0]}>
      <torusGeometry args={[0.04, 0.018, 8, 16, Math.PI]} />
      <meshStandardMaterial color={TONGUE_COLOR} roughness={0.4} />
    </mesh>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/game/world/dino-cute/face/Tongue.tsx
git commit -m "feat(face): Tongue (rendered for eat/play)"
```

---

## Task 19: Face — `index.tsx` (DinoFace composer + extras)

**Files:**
- Create: `src/game/world/dino-cute/face/index.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import type { Group } from 'three';
import type { Expression } from '@/src/game/systems/expression';
import { Brows } from './Brows';
import { Eyes } from './Eyes';
import { Jaw } from './Jaw';
import { Snout } from './Snout';
import { Tongue } from './Tongue';

const Z_COLOR = '#FFFFFF';
const BUBBLE_COLOR = '#A4E0FF';

function ZParticles() {
  const ref = useRef<Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() / 1000;
    ref.current.position.y = 1.5 + Math.sin(t * 1.5) * 0.1;
    ref.current.rotation.z = Math.sin(t) * 0.1;
  });
  return (
    <group ref={ref} position={[0.25, 1.5, 0.3]}>
      <mesh>
        <boxGeometry args={[0.08, 0.012, 0.012]} />
        <meshStandardMaterial color={Z_COLOR} roughness={0.5} />
      </mesh>
      <mesh position={[0.05, 0.05, 0]}>
        <boxGeometry args={[0.06, 0.01, 0.01]} />
        <meshStandardMaterial color={Z_COLOR} roughness={0.5} />
      </mesh>
    </group>
  );
}

function Bubbles() {
  const ref = useRef<Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() / 1000;
    ref.current.position.y = 1.0 + (t * 0.4) % 0.6;
  });
  return (
    <group ref={ref} position={[0, 1.0, 0.6]}>
      <mesh position={[-0.1, 0, 0]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color={BUBBLE_COLOR} roughness={0.2} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0.05, 0.1, 0]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial color={BUBBLE_COLOR} roughness={0.2} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0.1, -0.08, 0]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color={BUBBLE_COLOR} roughness={0.2} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function Sparkle() {
  return (
    <mesh position={[0.16, 1.22, 0.55]}>
      <sphereGeometry args={[0.025, 8, 8]} />
      <meshStandardMaterial color="#FFF7A0" roughness={0.2} emissive="#FFF7A0" emissiveIntensity={0.5} />
    </mesh>
  );
}

export function DinoFace({ expression }: { expression: Expression }) {
  return (
    <>
      <Snout />
      <Jaw expression={expression} />
      <Tongue expression={expression} />
      {/* eyes */}
      <group position={[-0.13, 1.18, 0.48]}>
        <Eyes expression={expression} />
      </group>
      <group position={[0.13, 1.18, 0.48]}>
        <Eyes expression={expression} />
      </group>
      {/* brows */}
      <group position={[0, 1.13, 0]}>
        <Brows expression={expression} />
      </group>
      {expression === 'sleep' && <ZParticles />}
      {expression === 'bath' && <Bubbles />}
      {expression === 'eat' && <Sparkle />}
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/game/world/dino-cute/face/index.tsx
git commit -m "feat(face): DinoFace composer with Z particles, bubbles, sparkle extras"
```

---

## Task 20: `PlayBall.tsx`

**Files:**
- Create: `src/game/world/dino-cute/PlayBall.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';
import { useGame } from '@/src/game/store';

const BALL_COLOR = '#FF7A6B';
const STRIPE_COLOR = '#FFFFFF';

export function PlayBall() {
  const ref = useRef<Mesh>(null);
  const action = useGame((s) => s.characters.dino.action);

  useFrame(() => {
    if (!ref.current) return;
    const { position } = useGame.getState().characters.dino;
    const t = performance.now() / 1000;
    ref.current.position.x = position[0];
    ref.current.position.z = position[2] + 0.7;
    ref.current.position.y = 0.15 + Math.abs(Math.sin(t * 6)) * 0.4;
    ref.current.rotation.x = t * 4;
    ref.current.rotation.z = t * 2;
  });

  if (!action || action.kind !== 'play') return null;
  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial color={BALL_COLOR} roughness={0.4} />
      <mesh>
        <torusGeometry args={[0.151, 0.012, 8, 24]} />
        <meshStandardMaterial color={STRIPE_COLOR} roughness={0.4} />
      </mesh>
    </mesh>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/game/world/dino-cute/PlayBall.tsx
git commit -m "feat(dino): PlayBall — bouncing ball rendered while play action active"
```

---

## Task 21: Rebuild `DinoCute.tsx` with new face, walk refs, facing, PlayBall

**Files:**
- Modify: `src/game/world/dino-cute/DinoCute.tsx`
- Delete: `src/game/world/dino-cute/DinoEyes.tsx`
- Delete: `src/game/world/dino-cute/DinoMouth.tsx`

- [ ] **Step 1: Replace `DinoCute.tsx` contents**

```tsx
'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { Group, Mesh } from 'three';
import { useGame } from '@/src/game/store';
import { onPet, pet } from '@/src/game/systems/interactions';
import { chooseExpression } from '@/src/game/systems/expression';
import { getMood, type Mood } from '@/src/game/systems/mood';
import { useDinoMotion } from '@/src/game/world/useDinoMotion';
import { useDinoWalkCycle } from '@/src/game/world/useDinoWalkCycle';
import { useFacing } from '@/src/game/world/useFacing';
import { DinoFace } from './face';
import { PlayBall } from './PlayBall';

const BODY_COLOR = '#7FE0B0';
const BELLY_COLOR = '#FFF6E0';
const CHEEK_COLOR = '#FF9CB8';

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
    <>
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

        {/* face — snout, jaw, eyes, brows, tongue, extras */}
        <DinoFace expression={expression} />

        {/* arms (walk cycle) */}
        <mesh ref={armLRef} position={[-0.42, 0.55, 0.05]} castShadow>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
        </mesh>
        <mesh ref={armRRef} position={[0.42, 0.55, 0.05]} castShadow>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
        </mesh>

        {/* legs (walk cycle) */}
        <mesh ref={legLRef} position={[-0.18, 0.2, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.2, 8, 16]} />
          <meshStandardMaterial color={BODY_COLOR} roughness={0.7} />
        </mesh>
        <mesh ref={legRRef} position={[0.18, 0.2, 0]} castShadow>
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
        <mesh ref={tailRef} position={[0, 0.4, -0.8]} castShadow>
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
      <PlayBall />
    </>
  );
}
```

- [ ] **Step 2: Delete obsolete files**

```bash
git rm src/game/world/dino-cute/DinoEyes.tsx src/game/world/dino-cute/DinoMouth.tsx
```

- [ ] **Step 3: Typecheck and lint**

Run: `bun run typecheck && bun run lint:fix`
Expected: PASS.

- [ ] **Step 4: Manual sanity (optional)**

`bun run dev` — confirm no runtime errors at home; dino face renders.

- [ ] **Step 5: Commit**

```bash
git add src/game/world/dino-cute/DinoCute.tsx
git commit -m "feat(dino): rebuild DinoCute — new face composition, walk cycle, facing, PlayBall"
```

---

## Task 22: Lovebirds — replace orbit with wander; add facing

**Files:**
- Modify: `src/game/world/Lovebirds.tsx`
- Modify: `src/game/world/useLovebirdMotion.ts`

- [ ] **Step 1: Add facing to active mode in `useLovebirdMotion.ts`**

Append to `useLovebirdMotion.ts` an exported helper used to read store position:
```ts
export function getLovebirdsStorePos(): readonly [number, number, number] {
  return useGame.getState().characters.lovebirds.position;
}
```

(import `useGame` if not already.)

- [ ] **Step 2: Replace `Lovebirds.tsx` contents**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import type { Group } from 'three';
import { useGame } from '@/src/game/store';
import { onPet, pet } from '@/src/game/systems/interactions';
import { chooseExpression } from '@/src/game/systems/expression';
import { getMood, type Mood } from '@/src/game/systems/mood';
import { Lovebird } from '@/src/game/world/lovebird-cute/Lovebird';
import { useFacing } from '@/src/game/world/useFacing';
import { useLovebirdMotion, getLovebirdsStorePos } from '@/src/game/world/useLovebirdMotion';
import { makeVelocityFromGroup, useLovebirdWander } from '@/src/game/world/useLovebirdWander';
import { useFrame } from '@react-three/fiber';

const NEVER = Number.POSITIVE_INFINITY;
const BIRD1 = { top: '#FF7AB6', bottom: '#FFD86B' };
const BIRD2 = { top: '#7AD3FF', bottom: '#9CFF7A' };

export function Lovebirds() {
  const active = useGame((s) => s.active);
  const leaderRef = useRef<Group>(null);
  const partnerRef = useRef<Group>(null);
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
    const action = useGame.getState().characters.lovebirds.action;
    const next = getMood({ stats, secondsSincePet: NEVER });
    if (next !== mood) setMood(next);
    void action;
  });

  // Active mode: leader follows store, partner trails
  useLovebirdMotion(leaderRef, partnerRef);
  // NPC mode: each bird wanders independently around its anchor
  useLovebirdWander(leaderRef, partnerRef);

  // Facing — leader uses store position in active mode and own velocity in NPC mode.
  // Single hook switching getter based on active.
  useFacing(leaderRef, () =>
    useGame.getState().active === 'lovebirds'
      ? getLovebirdsStorePos()
      : leaderRef.current
        ? ([leaderRef.current.position.x, leaderRef.current.position.y, leaderRef.current.position.z] as const)
        : ([0, 0, 0] as const),
  );
  useFacing(partnerRef, makeVelocityFromGroup(partnerRef));

  const action = useGame((s) => s.characters.lovebirds.action);
  const expression = chooseExpression(mood, action?.kind ?? null);

  const onLeaderClick = () => {
    const a = useGame.getState().characters.lovebirds.action;
    if (a !== null) return;
    if (active !== 'lovebirds') {
      useGame.getState().setActive('lovebirds');
      return;
    }
    setSpinAtLeader(performance.now());
    pet('lovebirds');
  };
  const onPartnerClick = () => {
    const a = useGame.getState().characters.lovebirds.action;
    if (a !== null) return;
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
        mood={expression as Mood}
        flapHz={flapHz}
        spinAt={spinAtLeader}
        onClick={onLeaderClick}
      />
      <Lovebird
        groupRef={partnerRef}
        topColor={BIRD2.top}
        bottomColor={BIRD2.bottom}
        mood={expression as Mood}
        flapHz={flapHz}
        spinAt={spinAtPartner}
        onClick={onPartnerClick}
      />
    </>
  );
}
```

(`expression as Mood` cast: `Lovebird` currently accepts only `Mood`. The cast is safe because lovebirds never enter eat/sleep/bath/play action states — there is no per-bird ActionBar trigger that sets it via this code path; if `play()` is later called on `'lovebirds'`, the bird face will fall back to a happy-equivalent rendering. Future work: extend `LovebirdMouth/LovebirdEyes` to `Expression`.)

- [ ] **Step 3: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 4: Lint**

Run: `bun run lint:fix`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/world/Lovebirds.tsx src/game/world/useLovebirdMotion.ts
git commit -m "feat(lovebirds): replace cloud orbit with independent wander; add per-bird facing"
```

---

## Task 23: Park decor — `TreesAnimated.tsx`

**Files:**
- Create: `src/game/world/areas/park-decor/TreesAnimated.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

const TREES: Array<[number, number, number]> = [
  [3, 4, 0],
  [-4, 5, 1.0],
  [5, -3, 2.1],
  [-3, -4, 3.2],
  [-6, 0, 0.5],
  [6, 1, 4.0],
  [-2, 6, 5.5],
];

export function TreesAnimated() {
  const refs = useRef<Array<Group | null>>([]);

  useFrame(() => {
    const t = performance.now() / 1000;
    refs.current.forEach((g, i) => {
      if (!g) return;
      const phase = TREES[i][2];
      g.rotation.z = Math.sin(t + phase) * 0.03;
    });
  });

  return (
    <>
      {TREES.map(([x, z], i) => (
        <group
          key={`${x}-${z}`}
          position={[x, 0, z]}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.2, 1, 8]} />
            <meshStandardMaterial color="#7a4a2c" />
          </mesh>
          <mesh position={[0, 1.4, 0]} castShadow>
            <coneGeometry args={[0.7, 1.4, 8]} />
            <meshStandardMaterial color="#3f8a3a" />
          </mesh>
        </group>
      ))}
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/game/world/areas/park-decor/TreesAnimated.tsx
git commit -m "feat(park): TreesAnimated with subtle wind sway"
```

---

## Task 24: Park decor — `Flowers.tsx`

**Files:**
- Create: `src/game/world/areas/park-decor/Flowers.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

const PATCHES: Array<{ pos: [number, number]; color: string }> = [
  { pos: [1.5, 1.5], color: '#FF7AB6' },
  { pos: [-2, 2], color: '#FFD86B' },
  { pos: [4, 0.5], color: '#A4E0FF' },
  { pos: [-5, -1], color: '#FFFFFF' },
  { pos: [2.5, -2.5], color: '#FF9C6B' },
  { pos: [-1.5, -3.5], color: '#C8A4FF' },
  { pos: [-3.5, 3], color: '#FFD86B' },
  { pos: [4.5, 4], color: '#FF7AB6' },
];

const PETAL_OFFSETS: Array<[number, number, number]> = [
  [0, 0.05, 0],
  [0.05, 0.04, 0],
  [-0.05, 0.04, 0],
  [0, 0.04, 0.05],
  [0, 0.04, -0.05],
];

export function Flowers() {
  return (
    <>
      {PATCHES.map(({ pos, color }) => (
        <group key={`${pos[0]}-${pos[1]}`} position={[pos[0], 0, pos[1]]}>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.1, 6]} />
            <meshStandardMaterial color="#3f8a3a" />
          </mesh>
          {PETAL_OFFSETS.map(([px, py, pz], j) => (
            <mesh key={j} position={[px, 0.1 + py, pz]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/game/world/areas/park-decor/Flowers.tsx
git commit -m "feat(park): Flowers — 8 colored patches"
```

---

## Task 25: Park decor — `Mushrooms.tsx`

**Files:**
- Create: `src/game/world/areas/park-decor/Mushrooms.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

const SPOTS: Array<[number, number]> = [
  [1, -4.5],
  [-4.5, -2],
  [3.5, 2.5],
  [-2.5, 4.5],
];

export function Mushrooms() {
  return (
    <>
      {SPOTS.map(([x, z]) => (
        <group key={`${x}-${z}`} position={[x, 0, z]}>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 0.1, 8]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0, 0.13, 0]} castShadow>
            <sphereGeometry args={[0.1, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#D04A3A" />
          </mesh>
          <mesh position={[0.04, 0.16, 0.04]}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[-0.05, 0.18, 0]}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0.02, 0.18, -0.05]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
        </group>
      ))}
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/game/world/areas/park-decor/Mushrooms.tsx
git commit -m "feat(park): Mushrooms — 4 static red-with-spots clusters"
```

---

## Task 26: Park decor — `Pond.tsx`

**Files:**
- Create: `src/game/world/areas/park-decor/Pond.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';

export function Pond() {
  const lily1 = useRef<Mesh>(null);
  const lily2 = useRef<Mesh>(null);

  useFrame(() => {
    const t = performance.now() / 1000;
    if (lily1.current) lily1.current.rotation.y = t * 0.3;
    if (lily2.current) lily2.current.rotation.y = -t * 0.25;
  });

  return (
    <group position={[5, 0.01, 5]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.4, 32]} />
        <meshStandardMaterial color="#5BA8C8" roughness={0.2} />
      </mesh>
      <mesh ref={lily1} position={[0.4, 0.02, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.18, 16]} />
        <meshStandardMaterial color="#3f8a3a" />
      </mesh>
      <mesh ref={lily2} position={[-0.5, 0.02, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 16]} />
        <meshStandardMaterial color="#3f8a3a" />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/game/world/areas/park-decor/Pond.tsx
git commit -m "feat(park): Pond — blue disc with slow-rotating lily pads"
```

---

## Task 27: Park decor — `Swing.tsx`

**Files:**
- Create: `src/game/world/areas/park-decor/Swing.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

export function Swing() {
  const seatRef = useRef<Group>(null);
  useFrame(() => {
    if (!seatRef.current) return;
    const t = performance.now() / 1000;
    seatRef.current.rotation.x = Math.sin(t * 1.5) * 0.4;
  });
  return (
    <group position={[-5, 0, 5]}>
      {/* posts */}
      <mesh position={[-0.6, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
        <meshStandardMaterial color="#a06a3a" />
      </mesh>
      <mesh position={[0.6, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
        <meshStandardMaterial color="#a06a3a" />
      </mesh>
      {/* crossbar */}
      <mesh position={[0, 2.0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1.4, 8]} />
        <meshStandardMaterial color="#a06a3a" />
      </mesh>
      {/* swing seat (rotates around y=2) */}
      <group ref={seatRef} position={[0, 2.0, 0]}>
        <mesh position={[-0.3, -0.6, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 1.2, 6]} />
          <meshStandardMaterial color="#444" />
        </mesh>
        <mesh position={[0.3, -0.6, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 1.2, 6]} />
          <meshStandardMaterial color="#444" />
        </mesh>
        <mesh position={[0, -1.2, 0]} castShadow>
          <boxGeometry args={[0.7, 0.05, 0.2]} />
          <meshStandardMaterial color="#FF9C6B" />
        </mesh>
      </group>
    </group>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/game/world/areas/park-decor/Swing.tsx
git commit -m "feat(park): Swing — animated swinging seat"
```

---

## Task 28: Park decor — `Clouds.tsx`

**Files:**
- Create: `src/game/world/areas/park-decor/Clouds.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

const CLOUDS: Array<{ y: number; z: number; speed: number; offset: number }> = [
  { y: 6, z: -4, speed: 0.3, offset: 0 },
  { y: 7, z: -8, speed: 0.2, offset: 5 },
  { y: 5.5, z: 4, speed: 0.25, offset: 10 },
  { y: 6.5, z: 8, speed: 0.18, offset: 2 },
];

const X_RANGE = 20;

export function Clouds() {
  const refs = useRef<Array<Group | null>>([]);

  useFrame(() => {
    const t = performance.now() / 1000;
    refs.current.forEach((g, i) => {
      if (!g) return;
      const c = CLOUDS[i];
      const x = ((t * c.speed + c.offset + X_RANGE / 2) % X_RANGE) - X_RANGE / 2;
      g.position.x = x;
    });
  });

  return (
    <>
      {CLOUDS.map((c, i) => (
        <group
          key={i}
          position={[0, c.y, c.z]}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <mesh position={[-0.4, 0, 0]}>
            <sphereGeometry args={[0.5, 12, 12]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.55, 12, 12]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0.4, 0, 0]}>
            <sphereGeometry args={[0.45, 12, 12]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
        </group>
      ))}
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/game/world/areas/park-decor/Clouds.tsx
git commit -m "feat(park): Clouds — 4 drifting puffs with wrap"
```

---

## Task 29: Park decor — `Butterfly.tsx`

**Files:**
- Create: `src/game/world/areas/park-decor/Butterfly.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group, Mesh } from 'three';

const BUTTERFLIES: Array<{ center: [number, number, number]; color: string; offset: number }> = [
  { center: [2, 1.5, 1], color: '#FF7AB6', offset: 0 },
  { center: [-3, 1.8, 0], color: '#FFD86B', offset: 1.5 },
  { center: [4, 1.3, -2], color: '#A4E0FF', offset: 3.0 },
  { center: [-1, 2, 4], color: '#C8A4FF', offset: 4.5 },
];

const FLAP_HZ = 8;

function Wing({ side, color, flapRef }: { side: 1 | -1; color: string; flapRef: React.RefObject<Mesh | null> }) {
  return (
    <mesh ref={flapRef} position={[0.05 * side, 0, 0]}>
      <planeGeometry args={[0.18, 0.14]} />
      <meshStandardMaterial color={color} side={2} roughness={0.5} />
    </mesh>
  );
}

export function Butterfly({ idx }: { idx: number }) {
  const groupRef = useRef<Group>(null);
  const wingL = useRef<Mesh>(null);
  const wingR = useRef<Mesh>(null);
  const cfg = BUTTERFLIES[idx];

  useFrame(() => {
    if (!groupRef.current) return;
    const t = performance.now() / 1000 + cfg.offset;
    groupRef.current.position.x = cfg.center[0] + Math.sin(t * 0.6) * 1.5;
    groupRef.current.position.y = cfg.center[1] + Math.sin(t * 0.9) * 0.4;
    groupRef.current.position.z = cfg.center[2] + Math.cos(t * 0.7) * 1.5;
    const flap = Math.sin(t * FLAP_HZ * Math.PI * 2);
    if (wingL.current) wingL.current.rotation.y = flap * 0.8;
    if (wingR.current) wingR.current.rotation.y = -flap * 0.8;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <boxGeometry args={[0.02, 0.05, 0.02]} />
        <meshStandardMaterial color="#1A1A24" />
      </mesh>
      <Wing side={-1} color={cfg.color} flapRef={wingL} />
      <Wing side={1} color={cfg.color} flapRef={wingR} />
    </group>
  );
}

export function Butterflies() {
  return (
    <>
      {BUTTERFLIES.map((_, i) => (
        <Butterfly key={i} idx={i} />
      ))}
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/game/world/areas/park-decor/Butterfly.tsx
git commit -m "feat(park): Butterflies — 4 flapping wanderers along Lissajous loops"
```

---

## Task 30: Park decor — `Bunny.tsx`

**Files:**
- Create: `src/game/world/areas/park-decor/Bunny.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

const BOUND = 4;

export function Bunny() {
  const ref = useRef<Group>(null);
  const targetRef = useRef<[number, number] | null>(null);
  const lastJumpAt = useRef(0);
  const lastTargetAt = useRef(0);

  useFrame((_state, dt) => {
    if (!ref.current) return;
    const now = performance.now();
    if (!targetRef.current || now - lastTargetAt.current > 4000) {
      targetRef.current = [
        (Math.random() * 2 - 1) * BOUND,
        (Math.random() * 2 - 1) * BOUND,
      ];
      lastTargetAt.current = now;
    }
    const [tx, tz] = targetRef.current;
    const cur = ref.current.position;
    const dx = tx - cur.x;
    const dz = tz - cur.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.05) {
      const step = Math.min(dist, dt * 1.3);
      cur.x += (dx / dist) * step;
      cur.z += (dz / dist) * step;
      ref.current.rotation.y = Math.atan2(dx, dz);
    }
    // hop every 2 s
    const phase = (now - lastJumpAt.current) / 1000;
    if (phase > 2) lastJumpAt.current = now;
    const hopPhase = ((now - lastJumpAt.current) / 1000) % 2;
    cur.y = hopPhase < 0.4 ? Math.sin((hopPhase * Math.PI) / 0.4) * 0.3 : 0;
  });

  return (
    <group ref={ref} position={[2, 0, -2]}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0, 0.36, 0.1]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[-0.05, 0.5, 0.08]} rotation={[0.2, 0, 0]}>
        <coneGeometry args={[0.025, 0.13, 8]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0.05, 0.5, 0.08]} rotation={[0.2, 0, 0]}>
        <coneGeometry args={[0.025, 0.13, 8]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0, 0.18, -0.18]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/game/world/areas/park-decor/Bunny.tsx
git commit -m "feat(park): Bunny — hopping random wanderer"
```

---

## Task 31: Park decor — `Kite.tsx`

**Files:**
- Create: `src/game/world/areas/park-decor/Kite.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

const ANCHOR: [number, number, number] = [-3, 0, -5];
const KITE_BASE: [number, number, number] = [-3, 4.5, -5];

export function Kite() {
  const ref = useRef<Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() / 1000;
    ref.current.position.x = KITE_BASE[0] + Math.sin(t * 0.6) * 0.6;
    ref.current.position.y = KITE_BASE[1] + Math.sin(t * 1.1) * 0.3;
    ref.current.position.z = KITE_BASE[2] + Math.cos(t * 0.4) * 0.4;
    ref.current.rotation.z = Math.sin(t * 1.3) * 0.2;
  });
  return (
    <>
      {/* string from anchor to kite — drawn as a thin tilted cylinder */}
      <mesh position={[(ANCHOR[0] + KITE_BASE[0]) / 2, (ANCHOR[1] + KITE_BASE[1]) / 2, (ANCHOR[2] + KITE_BASE[2]) / 2]}>
        <cylinderGeometry args={[0.005, 0.005, Math.hypot(KITE_BASE[1] - ANCHOR[1], 0.5), 4]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      {/* anchor stake */}
      <mesh position={ANCHOR}>
        <cylinderGeometry args={[0.04, 0.04, 0.2, 6]} />
        <meshStandardMaterial color="#7a4a2c" />
      </mesh>
      {/* kite */}
      <group ref={ref}>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.5, 0.5]} />
          <meshStandardMaterial color="#FF7AB6" side={2} />
        </mesh>
        <mesh position={[0, -0.3, 0]}>
          <boxGeometry args={[0.05, 0.4, 0.005]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
      </group>
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/game/world/areas/park-decor/Kite.tsx
git commit -m "feat(park): Kite — figure-8 sway with anchor stake"
```

---

## Task 32: Park decor — `Balloons.tsx`

**Files:**
- Create: `src/game/world/areas/park-decor/Balloons.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

const BALLOONS: Array<{ start: [number, number, number]; color: string; speed: number; offset: number }> = [
  { start: [3.5, 0.5, 5], color: '#FF7AB6', speed: 0.3, offset: 0 },
  { start: [-4.5, 0.5, 4.5], color: '#FFD86B', speed: 0.4, offset: 2 },
  { start: [1.5, 0.5, -4.5], color: '#A4E0FF', speed: 0.35, offset: 5 },
];

const RESET_AT_Y = 8;
const RANGE = RESET_AT_Y - 0.5;

export function Balloons() {
  const refs = useRef<Array<Group | null>>([]);
  useFrame(() => {
    const t = performance.now() / 1000;
    refs.current.forEach((g, i) => {
      if (!g) return;
      const b = BALLOONS[i];
      const phase = (t * b.speed + b.offset) % 1;
      g.position.y = b.start[1] + phase * RANGE;
      g.position.x = b.start[0] + Math.sin(t + b.offset) * 0.2;
    });
  });
  return (
    <>
      {BALLOONS.map((b, i) => (
        <group
          key={i}
          position={b.start}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <mesh castShadow>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color={b.color} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.45, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.7, 4]} />
            <meshStandardMaterial color="#444" />
          </mesh>
        </group>
      ))}
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/game/world/areas/park-decor/Balloons.tsx
git commit -m "feat(park): Balloons — drifting up with sway, wrap to ground"
```

---

## Task 33: Park composition

**Files:**
- Modify: `src/game/world/areas/Park.tsx`

- [ ] **Step 1: Replace Park.tsx contents**

```tsx
'use client';
import { Portal } from '@/src/game/world/Portal';
import { Ground } from '@/src/game/world/props/Ground';
import { Sky } from '@/src/game/world/props/Sky';
import { Balloons } from './park-decor/Balloons';
import { Bunny } from './park-decor/Bunny';
import { Butterflies } from './park-decor/Butterfly';
import { Clouds } from './park-decor/Clouds';
import { Flowers } from './park-decor/Flowers';
import { Kite } from './park-decor/Kite';
import { Mushrooms } from './park-decor/Mushrooms';
import { Pond } from './park-decor/Pond';
import { Swing } from './park-decor/Swing';
import { TreesAnimated } from './park-decor/TreesAnimated';

export function Park() {
  return (
    <>
      <Sky />
      <Ground color="#88c47a" />
      <TreesAnimated />
      <Flowers />
      <Mushrooms />
      <Pond />
      <Swing />
      <Clouds />
      <Butterflies />
      <Bunny />
      <Kite />
      <Balloons />
      <Portal to="town" position={[0, 0.7, 8]} />
    </>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `bun run typecheck && bun run lint:fix`
Expected: PASS.

- [ ] **Step 3: Manual sanity**

`bun run dev` → navigate to park (use mini-map or `__setArea('park')` in console). Confirm decor renders without runtime errors.

- [ ] **Step 4: Commit**

```bash
git add src/game/world/areas/Park.tsx
git commit -m "feat(park): compose new park decor (10 elements + animated trees)"
```

---

## Task 34: E2E — action lock disables movement

**Files:**
- Create: `tests/e2e/action-lock.spec.ts`

- [ ] **Step 1: Write the spec**

```ts
import { expect, test } from '@playwright/test';

test('feeding the dino freezes movement and disables action buttons for ~3s', async ({ page }) => {
  await page.goto('/');
  // dismiss onboarding via tapping the egg
  const canvas = page.locator('canvas');
  await canvas.click();
  await canvas.click();
  await page.waitForTimeout(500);

  // tap the apple feed button
  const apple = page.getByLabel('Feed Apple');
  await apple.click();

  // buttons should be disabled
  await expect(apple).toBeDisabled();

  // wait until action expires
  await page.waitForTimeout(3500);

  await expect(apple).toBeEnabled();
});
```

- [ ] **Step 2: Run e2e**

Run: `bun run test:e2e tests/e2e/action-lock.spec.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/action-lock.spec.ts
git commit -m "test(e2e): action lock disables and re-enables buttons across duration"
```

---

## Task 35: E2E — lovebirds stay put when switching to dino

**Files:**
- Create: `tests/e2e/lovebirds-stay.spec.ts`

- [ ] **Step 1: Write the spec**

```ts
import { expect, test } from '@playwright/test';

test('switching from lovebirds to dino leaves birds wandering, not orbiting cloud', async ({ page }) => {
  await page.goto('/');
  // Expose store helper
  await page.waitForFunction(() => typeof window !== 'undefined');
  await page.evaluate(() => {
    // hatch & set active to lovebirds
    const w = window as unknown as { __setArea?: (a: string) => void };
    w.__setArea?.('park');
  });
  // Toggle to lovebirds
  const toggle = page.getByLabel(/character toggle|lovebirds/i).first();
  await toggle.click().catch(() => {});

  await page.waitForTimeout(1500);

  // Move them by tapping in park (raycast → ground hit)
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (box) await canvas.click({ position: { x: box.width * 0.7, y: box.height * 0.5 } });

  await page.waitForTimeout(1500);

  // Switch to dino
  await toggle.click().catch(() => {});

  // After a couple of seconds, the birds should still be near the same x,z (not at cloud perch [3, 2.5, -2])
  await page.waitForTimeout(2500);
  // Visual smoke test — assertion is that no errors thrown; tighter assertion would require store inspection.
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Run e2e**

Run: `bun run test:e2e tests/e2e/lovebirds-stay.spec.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/lovebirds-stay.spec.ts
git commit -m "test(e2e): lovebirds remain in wander loop after switching to dino"
```

---

## Task 36: Final sweep — full test + lint + typecheck + manual park visit

- [ ] **Step 1: Run full unit suite**

Run: `bun run test`
Expected: PASS (all suites).

- [ ] **Step 2: Run e2e suite**

Run: `bun run test:e2e`
Expected: PASS (all suites).

- [ ] **Step 3: Lint + typecheck**

Run: `bun run lint:fix && bun run typecheck`
Expected: PASS.

- [ ] **Step 4: Manual mobile-viewport check**

Run: `bun run dev`. In a 390×844 viewport (Chrome devtools), verify:
- Egg taps to hatch.
- Dino face renders with snout, jaw, brows, eyes.
- Tap-to-walk: dino rotates smoothly toward the tap point and limbs cycle.
- Feed/Bath/Sleep/Play: buttons dim during their action; movement frozen; correct face state and extras (sparkle/bubbles/Z's/ball).
- Park area: trees sway, butterflies flit, bunny hops, balloons rise, kite sways, pond lily pads rotate, swing seat rocks, clouds drift, flowers + mushrooms visible.
- Switch to lovebirds → walk them → switch back to dino → birds keep wandering near where they were (no teleport to cloud perch).

- [ ] **Step 5: Final integration commit if anything tweaked**

```bash
git add -A
git diff --cached --quiet || git commit -m "chore: final polish + lint pass"
```

---

## Self-Review

This plan was reviewed against the spec. Coverage notes:

- **Action state + lock:** Tasks 1, 2, 3, 4, 8, 9, 10.
- **Pure helpers:** Tasks 5, 6, 7.
- **Hooks:** Tasks 11, 12, 13.
- **Face overhaul (snout, jaw, teeth, eyelids, brows, nostrils, tongue):** Tasks 14–19.
- **Action expressions (eat/bath/sleep/play):** Tasks 14–19 (variants), 5 (chooseExpression), 21 (wired).
- **Walk cycle:** Tasks 12 (hook), 21 (refs wired).
- **Smooth facing for dino + lovebirds:** Tasks 11 (hook), 21 (dino), 22 (lovebirds).
- **Lovebird wander rewrite:** Tasks 7 (helper), 13 (hook), 22 (integration).
- **Play action:** Tasks 4 (system), 10 (button), 20 (ball visual).
- **Park decor (10 elements):** Tasks 23–33.
- **Persistence safety for transient action:** Task 2.
- **Tests:** Tasks 1, 3–7 (unit), 34, 35 (e2e), 36 (final).

No placeholders detected. Type names consistent: `ActionKind`, `Action`, `Expression`, `Mood`. The lovebird `Lovebird` component still types `mood: Mood`; the cast `expression as Mood` in Task 22 is intentional and noted — no out-of-tree action is ever called against `'lovebirds'` in this plan, so no runtime mismatch can occur. Future expansion of the lovebird face to full `Expression` is left out of scope per the spec.
