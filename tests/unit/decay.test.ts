import { describe, expect, it } from 'vitest';
import { DECAY_PER_MINUTE, OFFLINE_MULTIPLIER, computeDecay } from '@/src/game/config/decay';

describe('decay config', () => {
  it('exports per-minute rates for all actionable stats', () => {
    expect(DECAY_PER_MINUTE.hunger).toBeGreaterThan(0);
    expect(DECAY_PER_MINUTE.happy).toBeGreaterThan(0);
    expect(DECAY_PER_MINUTE.energy).toBeGreaterThan(0);
    expect(DECAY_PER_MINUTE.clean).toBeGreaterThan(0);
  });

  it('offline multiplier slows drain ≥ 5x', () => {
    expect(OFFLINE_MULTIPLIER).toBeLessThanOrEqual(0.2);
  });

  it('computeDecay returns negative deltas proportional to elapsed minutes', () => {
    const d = computeDecay(60, 1.0); // 60 sec live
    expect(d.hunger).toBeCloseTo(-DECAY_PER_MINUTE.hunger, 5);
  });

  it('computeDecay scales by multiplier', () => {
    const live = computeDecay(60, 1.0);
    const offline = computeDecay(60, OFFLINE_MULTIPLIER);
    expect(Math.abs(offline.hunger!)).toBeLessThan(Math.abs(live.hunger!));
  });
});
