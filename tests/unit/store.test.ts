import { beforeEach, describe, expect, it } from 'vitest';
import { INITIAL_DINO, useGame } from '@/src/game/store';

describe('game store', () => {
  beforeEach(() => useGame.setState(useGame.getInitialState(), true));

  it('starts dino as an egg with 100 in every stat', () => {
    const dino = useGame.getState().characters.dino;
    expect(dino.stage).toBe('egg');
    expect(dino.stats.hunger).toBe(100);
    expect(dino.stats.happy).toBe(100);
    expect(dino.stats.energy).toBe(100);
    expect(dino.stats.clean).toBe(100);
    expect(dino.stats.health).toBe(100);
  });

  it('starts at home', () => {
    expect(useGame.getState().currentArea).toBe('home');
  });

  it('updates a stat by delta and clamps 0..100', () => {
    useGame.getState().applyStatDelta('dino', 'hunger', -150);
    expect(useGame.getState().characters.dino.stats.hunger).toBe(0);
    useGame.getState().applyStatDelta('dino', 'hunger', 9999);
    expect(useGame.getState().characters.dino.stats.hunger).toBe(100);
  });

  it('exposes a stable INITIAL_DINO factory', () => {
    const a = INITIAL_DINO();
    const b = INITIAL_DINO();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });
});
