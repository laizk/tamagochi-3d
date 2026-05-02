import { beforeEach, describe, expect, it } from 'vitest';
import { useGame } from '@/src/game/store';
import { bath, FOODS, feed, pet, play, sleep } from '@/src/game/systems/interactions';

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

describe('action guard', () => {
  beforeEach(() => useGame.setState(useGame.getInitialState(), true));

  it('feed is a no-op when an action is already active', () => {
    useGame.getState().setStat('dino', 'hunger', 50);
    useGame.getState().startAction('dino', 'sleep', 5000);
    feed('apple', 'dino');
    // hunger unchanged, action still sleep
    expect(useGame.getState().characters.dino.stats.hunger).toBe(50);
    expect(useGame.getState().characters.dino.action?.kind).toBe('sleep');
  });

  it('bath is a no-op when an action is already active', () => {
    useGame.getState().setStat('dino', 'clean', 30);
    useGame.getState().startAction('dino', 'eat', 3000);
    bath('dino');
    expect(useGame.getState().characters.dino.stats.clean).toBe(30);
    expect(useGame.getState().characters.dino.action?.kind).toBe('eat');
  });

  it('sleep is a no-op when an action is already active', () => {
    useGame.getState().setStat('dino', 'energy', 20);
    useGame.getState().startAction('dino', 'play', 4000);
    sleep('dino');
    expect(useGame.getState().characters.dino.stats.energy).toBe(20);
    expect(useGame.getState().characters.dino.action?.kind).toBe('play');
  });

  it('play is a no-op when an action is already active', () => {
    useGame.getState().setStat('dino', 'happy', 50);
    useGame.getState().setStat('dino', 'energy', 50);
    useGame.getState().startAction('dino', 'eat', 3000);
    play('dino');
    expect(useGame.getState().characters.dino.stats.happy).toBe(50);
    expect(useGame.getState().characters.dino.stats.energy).toBe(50);
    expect(useGame.getState().characters.dino.action?.kind).toBe('eat');
  });
});
