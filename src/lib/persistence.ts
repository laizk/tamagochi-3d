import { type GameState, useGame } from '@/src/game/store';

export const SAVE_KEY = 'tamagochi-3d:save:v2';

type SaveBlob = GameState;

export function save(): void {
  if (typeof localStorage === 'undefined') return;
  const state = useGame.getState();
  const blob: SaveBlob = {
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
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SaveBlob;
    return migrate(parsed);
  } catch {
    localStorage.setItem(`${SAVE_KEY}:corrupt:${Date.now()}`, raw);
    localStorage.removeItem(SAVE_KEY);
    return null;
  }
}

function migrate(blob: unknown): GameState | null {
  if (typeof blob !== 'object' || blob === null) return null;
  const b = blob as Partial<GameState>;
  if (b.version === 2) return b as GameState;
  // Future versions handled here.
  return null;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
export function scheduleSave(debounceMs = 2000): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(save, debounceMs);
}
