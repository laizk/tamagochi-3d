import type { CharacterId } from '@/src/game/store';
import { useGame } from '@/src/game/store';

export type FoodId = 'apple' | 'meat' | 'cake';

export const FOODS: Record<
  FoodId,
  { name: string; emoji: string; hungerRestored: number; happyBonus: number }
> = {
  apple: { name: 'Apple', emoji: '🍎', hungerRestored: 25, happyBonus: 0 },
  meat: { name: 'Meat', emoji: '🍖', hungerRestored: 45, happyBonus: 5 },
  cake: { name: 'Cake', emoji: '🍰', hungerRestored: 35, happyBonus: 15 },
};

export function feed(food: FoodId, charId: CharacterId = 'dino'): void {
  const f = FOODS[food];
  const s = useGame.getState();
  s.applyStatDelta(charId, 'hunger', f.hungerRestored);
  if (f.happyBonus) s.applyStatDelta(charId, 'happy', f.happyBonus);
}

type Listener = (charId: CharacterId) => void;
const listeners = new Set<Listener>();
export function onPet(listener: Listener): () => boolean {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function pet(charId: CharacterId = 'dino'): void {
  useGame.getState().applyStatDelta(charId, 'happy', 8);
  for (const l of listeners) l(charId);
}

export function bath(charId: CharacterId = 'dino'): void {
  useGame.getState().applyStatDelta(charId, 'clean', 50);
  useGame.getState().applyStatDelta(charId, 'happy', -5);
}

export function sleep(charId: CharacterId = 'dino'): void {
  useGame.getState().applyStatDelta(charId, 'energy', 60);
}
