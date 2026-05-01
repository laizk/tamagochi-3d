import { beforeEach, describe, expect, it } from 'vitest';
import { useGame } from '@/src/game/store';
import { FOODS, feed } from '@/src/game/systems/interactions';

describe('feed', () => {
  beforeEach(() => useGame.setState(useGame.getInitialState(), true));

  it("raises hunger by the food's value, clamped at 100", () => {
    useGame.getState().setStat('hunger', 30);
    feed('apple');
    const food = FOODS.apple;
    expect(useGame.getState().dino.stats.hunger).toBe(Math.min(100, 30 + food.hungerRestored));
  });

  it('does not raise above 100', () => {
    useGame.getState().setStat('hunger', 95);
    feed('cake');
    expect(useGame.getState().dino.stats.hunger).toBe(100);
  });

  it('also raises happy by happyBonus', () => {
    useGame.getState().setStat('happy', 50);
    feed('cake');
    expect(useGame.getState().dino.stats.happy).toBeGreaterThan(50);
  });
});
