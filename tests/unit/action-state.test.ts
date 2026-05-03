import { beforeEach, describe, expect, it } from 'vitest';
import { useGame } from '@/src/game/store';
import { load, SAVE_KEY } from '@/src/lib/persistence';

describe('action state', () => {
  beforeEach(() => useGame.setState(useGame.getInitialState(), true));

  it('initializes action as null for both characters', () => {
    expect(useGame.getState().characters.dino.action).toBeNull();
    expect(useGame.getState().characters.lovebirds.action).toBeNull();
  });

  it('startAction sets the action with kind, startedAt, durationMs', () => {
    useGame.getState().startAction('dino', 'eat', 3000);
    const a = useGame.getState().characters.dino.action;
    expect(a?.kind).toBe('eat');
    expect(a?.durationMs).toBe(3000);
    expect(typeof a?.startedAt).toBe('number');
  });

  it('clearAction sets action back to null', () => {
    useGame.getState().startAction('dino', 'play', 4000);
    useGame.getState().clearAction('dino');
    expect(useGame.getState().characters.dino.action).toBeNull();
  });

  it('setting action on dino does not affect lovebirds', () => {
    useGame.getState().startAction('dino', 'sleep', 5000);
    expect(useGame.getState().characters.lovebirds.action).toBeNull();
  });
});

describe('action state — persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    useGame.setState(useGame.getInitialState(), true);
  });

  it('loaded state with stale action is cleared by the persistence layer', () => {
    const initial = useGame.getInitialState();
    const blob = {
      ...initial,
      characters: {
        ...initial.characters,
        dino: {
          ...initial.characters.dino,
          action: { kind: 'sleep', startedAt: 1, durationMs: 5000 },
        },
      },
      version: 2,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(blob));
    const loaded = load();
    expect(loaded).not.toBeNull();
    useGame.getState().hydrate(loaded as never);
    expect(useGame.getState().characters.dino.action).toBeNull();
    expect(useGame.getState().characters.lovebirds.action).toBeNull();
  });
});
