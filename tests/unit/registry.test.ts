import { describe, expect, it } from 'vitest';
import { AREAS } from '@/src/game/world/areas/registry';

describe('area registry', () => {
  it('has 7 areas', () => {
    expect(Object.keys(AREAS)).toHaveLength(7);
  });
  it('every exit references a valid area id', () => {
    for (const a of Object.values(AREAS)) {
      for (const exit of a.exits) {
        expect(AREAS[exit]).toBeDefined();
      }
    }
  });
  it('sky island is locked in phase 1', () => {
    expect(AREAS.sky.locked).toBe(true);
  });
});
