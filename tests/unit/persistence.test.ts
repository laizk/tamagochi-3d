import { beforeEach, describe, expect, it } from 'vitest';
import { useGame } from '@/src/game/store';
import { load, SAVE_KEY, save } from '@/src/lib/persistence';

describe('persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    useGame.setState(useGame.getInitialState(), true);
  });

  it('save writes a versioned blob to localStorage under SAVE_KEY', () => {
    save();
    const raw = localStorage.getItem(SAVE_KEY);
    expect(raw).not.toBeNull();
    const blob = JSON.parse(raw!);
    expect(blob.version).toBe(1);
    expect(blob.dino.stats.hunger).toBe(100);
    expect(typeof blob.lastSeenAt).toBe('number');
  });

  it('load returns null when no save exists', () => {
    expect(load()).toBeNull();
  });

  it('load returns the persisted state when present', () => {
    useGame.getState().setStat('hunger', 42);
    save();
    const loaded = load();
    expect(loaded).not.toBeNull();
    expect(loaded!.dino.stats.hunger).toBe(42);
  });

  it('load backs up corrupt save and returns null', () => {
    localStorage.setItem(SAVE_KEY, 'not-json{');
    const result = load();
    expect(result).toBeNull();
    const corruptKeys = Object.keys(localStorage).filter((k) =>
      k.startsWith(`${SAVE_KEY}:corrupt:`),
    );
    expect(corruptKeys.length).toBe(1);
  });
});
