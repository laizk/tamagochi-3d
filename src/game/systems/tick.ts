import { computeDecay, computeHealth } from '@/src/game/config/decay';
import { type StatKey, useGame } from '@/src/game/store';

const ACTIONABLE: Array<Exclude<StatKey, 'health'>> = ['hunger', 'happy', 'energy', 'clean'];

export function tick(elapsedSeconds: number, multiplier = 1): void {
  if (elapsedSeconds < 0) return;
  const delta = computeDecay(elapsedSeconds, multiplier);
  const state = useGame.getState();
  for (const k of ACTIONABLE) {
    const v = delta[k];
    if (v !== undefined) state.applyStatDelta('dino', k, v);
  }
  const stats = useGame.getState().characters.dino.stats;
  state.setStat('dino', 'health', computeHealth(stats));
  if (elapsedSeconds > 0) state.ageBy('dino', elapsedSeconds);
}
