import { beforeEach, describe, expect, it } from 'vitest';
import { useGame } from '@/src/game/store';
import { tick } from '@/src/game/systems/tick';

describe('tick', () => {
  beforeEach(() => useGame.setState(useGame.getInitialState(), true));

  it('reduces stats by per-second decay over a 60s tick', () => {
    tick(60);
    const { hunger, happy, energy, clean } = useGame.getState().characters.dino.stats;
    expect(hunger).toBeLessThan(100);
    expect(happy).toBeLessThan(100);
    expect(energy).toBeLessThan(100);
    expect(clean).toBeLessThan(100);
  });

  it('ages dino by elapsed seconds', () => {
    tick(10);
    expect(useGame.getState().characters.dino.age).toBe(10);
  });

  it('recomputes health after decay', () => {
    useGame.getState().setStat('dino', 'hunger', 5);
    tick(0);
    expect(useGame.getState().characters.dino.stats.health).toBeLessThan(100);
  });

  it('clamps stats at 0', () => {
    useGame.getState().setStat('dino', 'hunger', 1);
    tick(60 * 60); // an hour
    expect(useGame.getState().characters.dino.stats.hunger).toBe(0);
  });
});
