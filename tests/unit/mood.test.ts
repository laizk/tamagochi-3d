import { describe, expect, it } from 'vitest';
import { getMood } from '@/src/game/systems/mood';

const fullStats = { hunger: 100, happy: 100, energy: 100, clean: 100, health: 100 };

describe('getMood', () => {
  it('returns happy when all stats are full and no recent pet', () => {
    expect(getMood({ stats: fullStats, secondsSincePet: Infinity })).toBe('happy');
  });

  it('returns sleepy when energy is below 40 and no other stat is critical', () => {
    expect(
      getMood({ stats: { ...fullStats, energy: 30 }, secondsSincePet: Infinity }),
    ).toBe('sleepy');
  });

  it('returns sad when any non-energy stat is below 25', () => {
    expect(
      getMood({ stats: { ...fullStats, hunger: 20 }, secondsSincePet: Infinity }),
    ).toBe('sad');
  });

  it('prefers sad over sleepy when both apply', () => {
    expect(
      getMood({
        stats: { ...fullStats, hunger: 20, energy: 30 },
        secondsSincePet: Infinity,
      }),
    ).toBe('sad');
  });

  it('returns bouncy within 1s after a pet, regardless of stats', () => {
    expect(getMood({ stats: fullStats, secondsSincePet: 0.5 })).toBe('bouncy');
    expect(
      getMood({ stats: { ...fullStats, hunger: 20 }, secondsSincePet: 0.5 }),
    ).toBe('bouncy');
  });

  it('returns to non-bouncy after 1s post-pet', () => {
    expect(getMood({ stats: fullStats, secondsSincePet: 1.5 })).toBe('happy');
  });

  it('treats sleepy as a strict less-than-40 threshold', () => {
    expect(
      getMood({ stats: { ...fullStats, energy: 39 }, secondsSincePet: Infinity }),
    ).toBe('sleepy');
    expect(
      getMood({ stats: { ...fullStats, energy: 40 }, secondsSincePet: Infinity }),
    ).toBe('happy');
  });

  it('treats sad as a strict less-than-25 threshold', () => {
    expect(
      getMood({ stats: { ...fullStats, hunger: 24 }, secondsSincePet: Infinity }),
    ).toBe('sad');
    expect(
      getMood({ stats: { ...fullStats, hunger: 25 }, secondsSincePet: Infinity }),
    ).toBe('happy');
  });

  it('treats the bouncy boundary as inclusive at exactly 1s', () => {
    expect(getMood({ stats: fullStats, secondsSincePet: 1.0 })).toBe('bouncy');
    expect(getMood({ stats: fullStats, secondsSincePet: 1.0001 })).toBe('happy');
  });
});
