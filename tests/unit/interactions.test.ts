import { beforeEach, describe, expect, it } from 'vitest';
import { useGame } from '@/src/game/store';
import { FOODS, bath, feed, pet, play, sleep } from '@/src/game/systems/interactions';

describe('feed', () => {
  beforeEach(() => useGame.setState(useGame.getInitialState(), true));

  it("raises hunger by the food's value, clamped at 100", () => {
    useGame.getState().setStat('dino', 'hunger', 30);
    feed('apple', 'dino');
    const food = FOODS.apple;
    expect(useGame.getState().characters.dino.stats.hunger).toBe(
      Math.min(100, 30 + food.hungerRestored),
    );
  });

  it('does not raise above 100', () => {
    useGame.getState().setStat('dino', 'hunger', 95);
    feed('cake', 'dino');
    expect(useGame.getState().characters.dino.stats.hunger).toBe(100);
  });

  it('also raises happy by happyBonus', () => {
    useGame.getState().setStat('dino', 'happy', 50);
    feed('cake', 'dino');
    expect(useGame.getState().characters.dino.stats.happy).toBeGreaterThan(50);
  });
});

describe('action triggers', () => {
  beforeEach(() => useGame.setState(useGame.getInitialState(), true));

  it('feed starts an "eat" action with 3000ms duration', () => {
    feed('apple', 'dino');
    const a = useGame.getState().characters.dino.action;
    expect(a?.kind).toBe('eat');
    expect(a?.durationMs).toBe(3000);
  });

  it('bath starts a "bath" action with 4000ms duration', () => {
    bath('dino');
    const a = useGame.getState().characters.dino.action;
    expect(a?.kind).toBe('bath');
    expect(a?.durationMs).toBe(4000);
  });

  it('sleep starts a "sleep" action with 5000ms duration', () => {
    sleep('dino');
    const a = useGame.getState().characters.dino.action;
    expect(a?.kind).toBe('sleep');
    expect(a?.durationMs).toBe(5000);
  });

  it('play boosts happy +20, drains energy -10, starts "play" action 4000ms', () => {
    useGame.getState().setStat('dino', 'happy', 50);
    useGame.getState().setStat('dino', 'energy', 50);
    play('dino');
    expect(useGame.getState().characters.dino.stats.happy).toBe(70);
    expect(useGame.getState().characters.dino.stats.energy).toBe(40);
    const a = useGame.getState().characters.dino.action;
    expect(a?.kind).toBe('play');
    expect(a?.durationMs).toBe(4000);
  });

  it('pet does NOT start an action', () => {
    pet('dino');
    expect(useGame.getState().characters.dino.action).toBeNull();
  });
});
