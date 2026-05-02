import { beforeEach, describe, expect, it } from 'vitest';
import { useGame } from '@/src/game/store';
import {
  _resetPetDebounce,
  BIRD_FOODS,
  bath,
  FOODS,
  feed,
  pet,
  sleep,
} from '@/src/game/systems/interactions';

describe('interactions: charId-aware', () => {
  beforeEach(() => {
    useGame.setState(useGame.getInitialState(), true);
    _resetPetDebounce();
    useGame.getState().applyStatDelta('dino', 'happy', -50);
    useGame.getState().applyStatDelta('lovebirds', 'happy', -50);
    useGame.getState().applyStatDelta('dino', 'hunger', -50);
    useGame.getState().applyStatDelta('lovebirds', 'hunger', -50);
  });

  it('pet(charId) only affects that character', () => {
    pet('lovebirds');
    expect(useGame.getState().characters.lovebirds.stats.happy).toBe(58);
    expect(useGame.getState().characters.dino.stats.happy).toBe(50);
  });

  it('feed(food, charId) — bird food only valid for lovebirds', () => {
    feed('seed', 'lovebirds');
    expect(useGame.getState().characters.lovebirds.stats.hunger).toBe(75);
    expect(useGame.getState().characters.dino.stats.hunger).toBe(50);
  });

  it('feed(food, charId) — dino food only valid for dino', () => {
    feed('apple', 'dino');
    expect(useGame.getState().characters.dino.stats.hunger).toBe(75);
  });

  it('bath(charId) and sleep(charId) scope correctly', () => {
    bath('lovebirds');
    expect(useGame.getState().characters.lovebirds.stats.clean).toBeGreaterThan(50);
    sleep('dino');
    expect(useGame.getState().characters.dino.stats.energy).toBeGreaterThan(50);
  });

  it('exposes BIRD_FOODS with seed/berry/mango', () => {
    expect(Object.keys(BIRD_FOODS).sort()).toEqual(['berry', 'mango', 'seed']);
  });

  it('exposes FOODS with apple/cake/meat (unchanged)', () => {
    expect(Object.keys(FOODS).sort()).toEqual(['apple', 'cake', 'meat']);
  });
});

describe('pet debounce for lovebirds pair', () => {
  beforeEach(() => {
    useGame.setState(useGame.getInitialState(), true);
    useGame.getState().applyStatDelta('lovebirds', 'happy', -50);
    _resetPetDebounce();
  });

  it('two near-simultaneous pets count as one for the pair', async () => {
    pet('lovebirds');
    pet('lovebirds');
    expect(useGame.getState().characters.lovebirds.stats.happy).toBe(58);
  });
});
