import { beforeEach, describe, expect, it } from 'vitest';
import { useGame } from '@/src/game/store';

describe('store: characters + active', () => {
  beforeEach(() => useGame.setState(useGame.getInitialState(), true));

  it('starts with dino active', () => {
    expect(useGame.getState().active).toBe('dino');
  });

  it('has both characters with full stats at init', () => {
    const { characters } = useGame.getState();
    expect(characters.dino.stats.hunger).toBe(100);
    expect(characters.lovebirds.stats.hunger).toBe(100);
    expect(characters.lovebirds.species).toBe('lovebirds');
    expect(characters.dino.species).toBe('dino');
  });

  it('switches active character', () => {
    useGame.getState().setActive('lovebirds');
    expect(useGame.getState().active).toBe('lovebirds');
  });

  it('applyStatDelta scopes to charId', () => {
    useGame.getState().applyStatDelta('dino', 'hunger', -30);
    expect(useGame.getState().characters.dino.stats.hunger).toBe(70);
    expect(useGame.getState().characters.lovebirds.stats.hunger).toBe(100);
  });

  it('setPosition scopes to charId', () => {
    useGame.getState().setPosition('lovebirds', [1, 2, 3]);
    expect(useGame.getState().characters.lovebirds.position).toEqual([1, 2, 3]);
    expect(useGame.getState().characters.dino.position).toEqual([0, 0, 0]);
  });

  it('intro.lovebirdsSeen defaults to false', () => {
    expect(useGame.getState().intro.lovebirdsSeen).toBe(false);
  });
});
