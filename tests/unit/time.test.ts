import { beforeEach, describe, expect, it } from 'vitest';
import { DECAY_PER_MINUTE, OFFLINE_MULTIPLIER } from '@/src/game/config/decay';
import { useGame } from '@/src/game/store';
import { applyOfflineDrain } from '@/src/lib/time';

describe('applyOfflineDrain', () => {
  beforeEach(() => useGame.setState(useGame.getInitialState(), true));

  it('drains hunger proportionally for elapsed minutes × OFFLINE_MULTIPLIER', () => {
    const lastSeen = Date.now() - 60_000; // 1 minute ago
    applyOfflineDrain(lastSeen);
    const expectedDrop = DECAY_PER_MINUTE.hunger * 1 * OFFLINE_MULTIPLIER;
    expect(useGame.getState().characters.dino.stats.hunger).toBeCloseTo(100 - expectedDrop, 4);
  });

  it('caps elapsed at 7 days to prevent insane drains', () => {
    const lastSeen = Date.now() - 30 * 24 * 60 * 60_000; // 30 days
    applyOfflineDrain(lastSeen);
    // 7 days × 5 hunger/min × 0.1 = 7 × 24 × 60 × 5 × 0.1 = 5040 → clamped to 0
    expect(useGame.getState().characters.dino.stats.hunger).toBe(0);
  });

  it('returns the human-readable summary of biggest drop', () => {
    const lastSeen = Date.now() - 10 * 60_000; // 10 min
    const summary = applyOfflineDrain(lastSeen);
    expect(summary).toMatchObject({ biggestDrop: expect.any(String) });
  });

  it('no-ops when lastSeen is in the future', () => {
    applyOfflineDrain(Date.now() + 10_000);
    expect(useGame.getState().characters.dino.stats.hunger).toBe(100);
  });
});
