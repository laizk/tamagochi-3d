import { create } from 'zustand';

export type StatKey = 'hunger' | 'happy' | 'energy' | 'clean' | 'health';
export type Stat = number; // 0..100
export type AreaId = 'home' | 'town' | 'park' | 'beach' | 'forest' | 'cave' | 'sky';
export type ControlMode = 'tap' | 'joystick' | 'auto';
export type ThemeId = 'default';
export type SkinId = 'default';

export type Dino = {
  id: string;
  name: string;
  species: 'dino';
  skinId: SkinId;
  stage: 'egg' | 'baby' | 'teen' | 'adult';
  age: number; // seconds
  stats: Record<StatKey, Stat>;
  position: [number, number, number];
};

export type GameState = {
  dino: Dino;
  currentArea: AreaId;
  controlMode: ControlMode;
  lastSeenAt: number;
  settings: { soundOn: boolean; theme: ThemeId };
  version: 1;
};

export type GameActions = {
  applyStatDelta: (k: StatKey, delta: number) => void;
  setStat: (k: StatKey, value: Stat) => void;
  setArea: (a: AreaId) => void;
  setControlMode: (m: ControlMode) => void;
  setPosition: (p: [number, number, number]) => void;
  ageBy: (seconds: number) => void;
  hydrate: (s: GameState) => void;
  touchSeenAt: () => void;
};

export const INITIAL_DINO = (): Dino => ({
  id: 'dino-1',
  name: 'Dino',
  species: 'dino',
  skinId: 'default',
  stage: 'egg',
  age: 0,
  stats: { hunger: 100, happy: 100, energy: 100, clean: 100, health: 100 },
  position: [0, 0, 0],
});

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));

const initialState: GameState = {
  dino: INITIAL_DINO(),
  currentArea: 'home',
  controlMode: 'tap',
  lastSeenAt: Date.now(),
  settings: { soundOn: true, theme: 'default' },
  version: 1,
};

export const useGame = create<GameState & GameActions>((set) => ({
  ...initialState,
  applyStatDelta: (k, delta) =>
    set((s) => ({
      dino: { ...s.dino, stats: { ...s.dino.stats, [k]: clamp(s.dino.stats[k] + delta) } },
    })),
  setStat: (k, value) =>
    set((s) => ({
      dino: { ...s.dino, stats: { ...s.dino.stats, [k]: clamp(value) } },
    })),
  setArea: (a) => set({ currentArea: a }),
  setControlMode: (m) => set({ controlMode: m }),
  setPosition: (p) => set((s) => ({ dino: { ...s.dino, position: p } })),
  ageBy: (seconds) => set((s) => ({ dino: { ...s.dino, age: s.dino.age + seconds } })),
  hydrate: (next) => set(next),
  touchSeenAt: () => set({ lastSeenAt: Date.now() }),
}));

// Capture the snapshot of actions from the live store so getInitialState returns
// real action closures (not stubs), allowing setState(getInitialState(), true) to reset
// state while keeping actions functional.
const _initialSnapshot = useGame.getState();

(useGame as unknown as { getInitialState: () => GameState & GameActions }).getInitialState =
  () => ({
    ..._initialSnapshot,
    dino: INITIAL_DINO(),
    lastSeenAt: initialState.lastSeenAt,
  });
