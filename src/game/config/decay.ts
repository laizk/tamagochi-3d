import type { StatKey } from '@/src/game/store';

export const DECAY_PER_MINUTE: Record<Exclude<StatKey, 'health'>, number> = {
  hunger: 5,
  happy: 3,
  energy: 4,
  clean: 2,
};

export const OFFLINE_MULTIPLIER = 0.1;

export type StatDelta = Partial<Record<StatKey, number>>;

export function computeDecay(elapsedSeconds: number, multiplier: number): StatDelta {
  const minutes = elapsedSeconds / 60;
  const delta: StatDelta = {};
  for (const k of Object.keys(DECAY_PER_MINUTE) as Array<keyof typeof DECAY_PER_MINUTE>) {
    delta[k] = -DECAY_PER_MINUTE[k] * minutes * multiplier;
  }
  return delta;
}

export function computeHealth(stats: Record<StatKey, number>): number {
  // Health is the average of the others, with a penalty if any is critical (<20).
  const others = ['hunger', 'happy', 'energy', 'clean'] as const;
  const avg = others.reduce((s, k) => s + stats[k], 0) / others.length;
  const critical = others.some((k) => stats[k] < 20);
  return Math.max(0, Math.min(100, avg - (critical ? 15 : 0)));
}
