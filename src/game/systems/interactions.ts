import type { ActionKind, CharacterId } from '@/src/game/store';
import { useGame } from '@/src/game/store';
import { play as playAudio } from '@/src/game/systems/audio';

export type DinoFoodId = 'apple' | 'meat' | 'cake';
export type BirdFoodId = 'seed' | 'berry' | 'mango';
export type FoodId = DinoFoodId | BirdFoodId;

type FoodDef = { name: string; emoji: string; hungerRestored: number; happyBonus: number };

const ACTION_DURATION_MS: Record<ActionKind, number> = {
  eat: 3000,
  bath: 4000,
  sleep: 5000,
  play: 4000,
};

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
  if (useGame.getState().characters[charId].action) return;
  const def =
    charId === 'dino'
      ? (FOODS as Record<string, FoodDef>)[food]
      : (BIRD_FOODS as Record<string, FoodDef>)[food];
  if (!def) return; // unknown food for this species
  const s = useGame.getState();
  s.applyStatDelta(charId, 'hunger', def.hungerRestored);
  if (def.happyBonus) s.applyStatDelta(charId, 'happy', def.happyBonus);
  s.startAction(charId, 'eat', ACTION_DURATION_MS.eat);
}

type PetListener = (charId: CharacterId) => void;
const listeners = new Set<PetListener>();

export function onPet(listener: PetListener): () => boolean {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const PET_DEBOUNCE_MS = 250;
const lastPetAt: Partial<Record<CharacterId, number>> = {};

export function _resetPetDebounce(): void {
  for (const k of Object.keys(lastPetAt)) {
    delete lastPetAt[k as CharacterId];
  }
}

export function pet(charId: CharacterId): void {
  const now = performance.now();
  const last = lastPetAt[charId] ?? -Infinity;
  if (now - last < PET_DEBOUNCE_MS) {
    for (const l of listeners) l(charId);
    return; // listener fires (visual reaction) but no stat double-count
  }
  lastPetAt[charId] = now;
  useGame.getState().applyStatDelta(charId, 'happy', 8);
  if (charId === 'lovebirds') playAudio('chirp');
  for (const l of listeners) l(charId);
}

export function bath(charId: CharacterId): void {
  if (useGame.getState().characters[charId].action) return;
  const s = useGame.getState();
  s.applyStatDelta(charId, 'clean', 50);
  s.applyStatDelta(charId, 'happy', -5);
  s.startAction(charId, 'bath', ACTION_DURATION_MS.bath);
}

export function sleep(charId: CharacterId): void {
  if (useGame.getState().characters[charId].action) return;
  const s = useGame.getState();
  s.applyStatDelta(charId, 'energy', 60);
  s.startAction(charId, 'sleep', ACTION_DURATION_MS.sleep);
}

export function play(charId: CharacterId): void {
  if (useGame.getState().characters[charId].action) return;
  const s = useGame.getState();
  s.applyStatDelta(charId, 'happy', 20);
  s.applyStatDelta(charId, 'energy', -10);
  s.startAction(charId, 'play', ACTION_DURATION_MS.play);
}
