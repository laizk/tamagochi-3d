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
