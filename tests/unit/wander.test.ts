import { describe, expect, it } from 'vitest';
import { pickWanderTarget } from '@/src/game/systems/wander';

describe('pickWanderTarget', () => {
  it('returns a point within radius of the anchor in xz', () => {
    const anchor: [number, number, number] = [2, 3, -1];
    for (let i = 0; i < 100; i++) {
      const [x, y, z] = pickWanderTarget(anchor, 3);
      expect(Math.hypot(x - anchor[0], z - anchor[2])).toBeLessThanOrEqual(3 + 1e-9);
      expect(y).toBeGreaterThanOrEqual(1.5);
      expect(y).toBeLessThanOrEqual(4);
    }
  });
});
