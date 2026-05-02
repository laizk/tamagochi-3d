import { describe, expect, it } from 'vitest';
import { headingFromDelta } from '@/src/game/systems/heading';

const TAU = Math.PI * 2;
const close = (a: number, b: number, eps = 1e-6) =>
  Math.abs(((a - b) % TAU) + TAU) % TAU < eps || Math.abs(a - b) < eps;

describe('headingFromDelta', () => {
  it('returns null for negligible motion', () => {
    expect(headingFromDelta(0, 0)).toBeNull();
    expect(headingFromDelta(0.0005, 0.0005)).toBeNull();
  });

  it('forward (+z) is 0', () => {
    const h = headingFromDelta(0, 1);
    expect(h).not.toBeNull();
    expect(close(h as number, 0)).toBe(true);
  });

  it('right (+x) is PI/2', () => {
    const h = headingFromDelta(1, 0);
    expect(h).not.toBeNull();
    expect(close(h as number, Math.PI / 2)).toBe(true);
  });

  it('back (-z) is PI', () => {
    const h = headingFromDelta(0, -1);
    expect(h).not.toBeNull();
    expect(close(Math.abs(h as number), Math.PI)).toBe(true);
  });

  it('left (-x) is -PI/2', () => {
    const h = headingFromDelta(-1, 0);
    expect(h).not.toBeNull();
    expect(close(h as number, -Math.PI / 2)).toBe(true);
  });
});
