'use client';

import { useFrame } from '@react-three/fiber';
import { type RefObject, useRef } from 'react';
import type { Object3D } from 'three';
import { headingFromDelta } from '@/src/game/systems/heading';

const TURN_SPEED = 10; // dt * 10 → ~0.2s response

/**
 * Smoothly rotates `ref.current.rotation.y` to face the travel direction
 * derived from `getPos`. Caller supplies any position source (store reader,
 * a velocity-based getter, etc.).
 */
export function useFacing(
  ref: RefObject<Object3D | null>,
  getPos: () => readonly [number, number, number],
) {
  const last = useRef<readonly [number, number, number] | null>(null);

  useFrame((_state, dt) => {
    if (!ref.current) return;
    const cur = getPos();
    const prev = last.current;
    last.current = cur;
    if (!prev) return;
    const dx = cur[0] - prev[0];
    const dz = cur[2] - prev[2];
    const target = headingFromDelta(dx, dz);
    if (target === null) return;
    const cur_y = ref.current.rotation.y;
    let diff = target - cur_y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    ref.current.rotation.y = cur_y + diff * Math.min(1, dt * TURN_SPEED);
  });
}
