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

export function feed(food: FoodId): void {
  const f = FOODS[food];
  const s = useGame.getState();
  s.applyStatDelta('hunger', f.hungerRestored);
  if (f.happyBonus) s.applyStatDelta('happy', f.happyBonus);
}

type Listener = () => void;
const listeners = new Set<Listener>();
export function onPet(listener: Listener): () => boolean {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function pet(): void {
  useGame.getState().applyStatDelta('happy', 8);
  for (const l of listeners) l();
}

export function bath(): void {
  useGame.getState().applyStatDelta('clean', 50);
  useGame.getState().applyStatDelta('happy', -5); // dino doesn't love it
}

export function sleep(): void {
  useGame.getState().applyStatDelta('energy', 60);
}
