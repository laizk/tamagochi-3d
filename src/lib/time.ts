import { tick } from '@/src/game/systems/tick';
import { useGame, type StatKey } from '@/src/game/store';
import { OFFLINE_MULTIPLIER } from '@/src/game/config/decay';

const MAX_OFFLINE_SECONDS = 7 * 24 * 60 * 60;

const STAT_LABEL: Record<Exclude<StatKey, 'health'>, string> = {
  hunger: 'hungry',
  happy: 'sad',
  energy: 'sleepy',
  clean: 'stinky',
};

export type OfflineSummary = { elapsedSeconds: number; biggestDrop: string };

export function applyOfflineDrain(lastSeenAt: number): OfflineSummary {
  const before = { ...useGame.getState().dino.stats };
  const elapsedMs = Math.max(0, Date.now() - lastSeenAt);
  const elapsedSeconds = Math.min(MAX_OFFLINE_SECONDS, elapsedMs / 1000);
  if (elapsedSeconds === 0) {
    return { elapsedSeconds: 0, biggestDrop: 'okay' };
  }
  tick(elapsedSeconds, OFFLINE_MULTIPLIER);
  const after = useGame.getState().dino.stats;
  let biggestKey: keyof typeof STAT_LABEL = 'hunger';
  let biggestDelta = 0;
  for (const k of Object.keys(STAT_LABEL) as Array<keyof typeof STAT_LABEL>) {
    const drop = before[k] - after[k];
    if (drop > biggestDelta) {
      biggestDelta = drop;
      biggestKey = k;
    }
  }
  return {
    elapsedSeconds,
    biggestDrop: biggestDelta > 5 ? STAT_LABEL[biggestKey] : 'okay',
  };
}
