import { beforeEach, describe, expect, it } from 'vitest';
import { useGame } from '@/src/game/store';
import { tick } from '@/src/game/systems/tick';

describe('tick: decay both characters with rate', () => {
  beforeEach(() => useGame.setState(useGame.getInitialState(), true));

  it('decays both characters when active=dino, lovebirds at half rate', () => {
    useGame.getState().setActive('dino');
    const before = {
      dino: { ...useGame.getState().characters.dino.stats },
      birds: { ...useGame.getState().characters.lovebirds.stats },
    };
    tick(60); // 60s
    const after = {
      dino: useGame.getState().characters.dino.stats,
      birds: useGame.getState().characters.lovebirds.stats,
    };
    const dinoDelta = before.dino.hunger - after.dino.hunger;
    const birdDelta = before.birds.hunger - after.birds.hunger;
    expect(dinoDelta).toBeGreaterThan(0);
    expect(birdDelta).toBeGreaterThan(0);
    expect(birdDelta).toBeCloseTo(dinoDelta / 2, 1);
  });

  it('inverts when active=lovebirds (dino half rate)', () => {
    useGame.getState().setActive('lovebirds');
    const before = {
      dino: { ...useGame.getState().characters.dino.stats },
      birds: { ...useGame.getState().characters.lovebirds.stats },
    };
    tick(60);
    const after = {
      dino: useGame.getState().characters.dino.stats,
      birds: useGame.getState().characters.lovebirds.stats,
    };
    const dinoDelta = before.dino.hunger - after.dino.hunger;
    const birdDelta = before.birds.hunger - after.birds.hunger;
    expect(dinoDelta).toBeCloseTo(birdDelta / 2, 1);
  });
});
