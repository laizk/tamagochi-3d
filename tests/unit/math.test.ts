import { describe, expect, it } from 'vitest';
import { clampPan, lerpAngle } from '@/src/lib/math';

describe('lerpAngle', () => {
  it('returns a when t=0', () => {
    expect(lerpAngle(1, 2, 0)).toBe(1);
  });

  it('returns b when t=1', () => {
    expect(lerpAngle(1, 2, 1)).toBeCloseTo(2);
  });

  it('returns midpoint when t=0.5 with no wrap', () => {
    expect(lerpAngle(0, Math.PI / 2, 0.5)).toBeCloseTo(Math.PI / 4);
  });

  it('takes the short path across +pi/-pi boundary', () => {
    // From 3.0 (just under +pi) to -3.0 (just over -pi) — short path is forward, ~0.28 rad.
    const result = lerpAngle(3.0, -3.0, 0.5);
    // Halfway should be near +pi (or equivalently -pi), NOT near 0.
    const distToPi = Math.min(
      Math.abs(result - Math.PI),
      Math.abs(result + Math.PI),
    );
    expect(distToPi).toBeLessThan(0.2);
  });

  it('returns a when a equals b', () => {
    expect(lerpAngle(1.5, 1.5, 0.5)).toBe(1.5);
  });
});

describe('clampPan', () => {
  it('leaves a point inside the box untouched', () => {
    const t = { x: 1, z: -2 };
    clampPan(t, 5);
    expect(t).toEqual({ x: 1, z: -2 });
  });

  it('clamps +x beyond extent', () => {
    const t = { x: 10, z: 0 };
    clampPan(t, 5);
    expect(t).toEqual({ x: 5, z: 0 });
  });

  it('clamps -x beyond extent', () => {
    const t = { x: -10, z: 0 };
    clampPan(t, 5);
    expect(t).toEqual({ x: -5, z: 0 });
  });

  it('clamps +z beyond extent', () => {
    const t = { x: 0, z: 10 };
    clampPan(t, 5);
    expect(t).toEqual({ x: 0, z: 5 });
  });

  it('clamps -z beyond extent', () => {
    const t = { x: 0, z: -10 };
    clampPan(t, 5);
    expect(t).toEqual({ x: 0, z: -5 });
  });

  it('clamps both axes when beyond corner', () => {
    const t = { x: 100, z: -100 };
    clampPan(t, 5);
    expect(t).toEqual({ x: 5, z: -5 });
  });

  it('does not touch y', () => {
    const t = { x: 100, z: 100, y: 7 } as unknown as { x: number; z: number };
    clampPan(t, 5);
    expect((t as unknown as { y: number }).y).toBe(7);
  });
});
