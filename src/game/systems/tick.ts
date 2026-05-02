import { computeDecay, computeHealth } from '@/src/game/config/decay';
import { type CharacterId, type StatKey, useGame } from '@/src/game/store';

const ACTIONABLE: Array<Exclude<StatKey, 'health'>> = ['hunger', 'happy', 'energy', 'clean'];
const CHARS: CharacterId[] = ['dino', 'lovebirds'];

export function tick(elapsedSeconds: number, multiplier = 1): void {
  if (elapsedSeconds < 0) return;
  const state = useGame.getState();
  const active = state.active;
  for (const id of CHARS) {
    const rate = id === active ? multiplier : multiplier * 0.5;
    const delta = computeDecay(elapsedSeconds, rate);
    for (const k of ACTIONABLE) {
      const v = delta[k];
      if (v !== undefined) state.applyStatDelta(id, k, v);
    }
    const stats = useGame.getState().characters[id].stats;
    state.setStat(id, 'health', computeHealth(stats));
    if (elapsedSeconds > 0) state.ageBy(id, elapsedSeconds);
    const action = useGame.getState().characters[id].action;
    if (action && performance.now() - action.startedAt >= action.durationMs) {
      state.clearAction(id);
    }
  }
}
