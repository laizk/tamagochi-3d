import { create } from 'zustand';

export type StatKey = 'hunger' | 'happy' | 'energy' | 'clean' | 'health';
export type Stat = number; // 0..100
export type AreaId = 'home' | 'town' | 'park' | 'beach' | 'forest' | 'cave' | 'sky';
export type ControlMode = 'tap' | 'joystick' | 'auto';
export type ThemeId = 'default';
export type SkinId = 'default';

export type CharacterId = 'dino' | 'lovebirds';
export type Species = 'dino' | 'lovebirds';

export type ActionKind = 'eat' | 'bath' | 'sleep' | 'play';
export type Action = { kind: ActionKind; startedAt: number; durationMs: number } | null;

export type Pet = {
  id: string;
  name: string;
  species: Species;
  skinId: SkinId;
  stage: 'egg' | 'baby' | 'teen' | 'adult';
  age: number; // seconds
  stats: Record<StatKey, Stat>;
  position: [number, number, number];
  action: Action;
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
  startAction: (charId: CharacterId, kind: ActionKind, durationMs: number) => void;
  clearAction: (charId: CharacterId) => void;
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
  action: null,
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
  action: null,
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
  ageBy: (id, seconds) => set((s) => setChar(s, id, { age: s.characters[id].age + seconds })),
  setArea: (a) => set({ currentArea: a }),
  setControlMode: (m) => set({ controlMode: m }),
  hydrate: (next) => set(next),
  touchSeenAt: () => set({ lastSeenAt: Date.now() }),
  setLovebirdsSeen: () => set((s) => ({ intro: { ...s.intro, lovebirdsSeen: true } })),
  startAction: (id, kind, durationMs) =>
    set((s) => setChar(s, id, { action: { kind, startedAt: performance.now(), durationMs } })),
  clearAction: (id) => set((s) => setChar(s, id, { action: null })),
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
