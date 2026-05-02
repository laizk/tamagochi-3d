import { beforeEach, describe, expect, it } from 'vitest';
import { load, SAVE_KEY_V1 } from '@/src/lib/persistence';

const FAKE_V1 = {
  dino: {
    id: 'dino-1',
    name: 'Dino',
    species: 'dino',
    skinId: 'default',
    stage: 'baby',
    age: 60,
    stats: { hunger: 80, happy: 90, energy: 70, clean: 60, health: 88 },
    position: [1, 0, 2],
  },
  currentArea: 'park',
  controlMode: 'tap',
  lastSeenAt: 1700000000000,
  settings: { soundOn: true, theme: 'default' },
  version: 1,
};

beforeEach(() => {
  localStorage.clear();
});

describe('persistence: v1 -> v2 migration', () => {
  it('migrates v1 blob to v2 with both characters', () => {
    localStorage.setItem(SAVE_KEY_V1, JSON.stringify(FAKE_V1));
    const loaded = load();
    expect(loaded).not.toBeNull();
    expect(loaded!.version).toBe(2);
    expect(loaded!.active).toBe('dino');
    expect(loaded!.characters.dino.stats.hunger).toBe(80);
    expect(loaded!.characters.dino.age).toBe(60);
    expect(loaded!.characters.lovebirds.stats.hunger).toBe(100);
    expect(loaded!.characters.lovebirds.species).toBe('lovebirds');
    expect(loaded!.intro.lovebirdsSeen).toBe(false);
    expect(loaded!.currentArea).toBe('park');
  });

  it('backs up v1 and removes v1 key', () => {
    localStorage.setItem(SAVE_KEY_V1, JSON.stringify(FAKE_V1));
    load();
    expect(localStorage.getItem(SAVE_KEY_V1)).toBeNull();
    expect(localStorage.getItem(`${SAVE_KEY_V1}.bak`)).not.toBeNull();
  });

  it('is idempotent if v2 already exists', () => {
    localStorage.setItem(SAVE_KEY_V1, JSON.stringify(FAKE_V1));
    const first = load();
    expect(first).not.toBeNull();
    const second = load();
    expect(second).not.toBeNull();
    expect(second!.version).toBe(2);
  });
});
