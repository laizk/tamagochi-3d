import {
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
