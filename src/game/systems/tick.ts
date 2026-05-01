import { useGame, type StatKey } from '@/src/game/store';
import { computeDecay, computeHealth } from '@/src/game/config/decay';

const ACTIONABLE: Array<Exclude<StatKey, 'health'>> = ['hunger', 'happy', 'energy', 'clean'];

export function tick(elapsedSeconds: number, multiplier = 1): void {
  if (elapsedSeconds < 0) return;
  const delta = computeDecay(elapsedSeconds, multiplier);
  const state = useGame.getState();
  for (const k of ACTIONABLE) {
    const v = delta[k];
    if (v !== undefined) state.applyStatDelta(k, v);
  }
  const stats = useGame.getState().dino.stats;
  state.setStat('health', computeHealth(stats));
  if (elapsedSeconds > 0) state.ageBy(elapsedSeconds);
}
