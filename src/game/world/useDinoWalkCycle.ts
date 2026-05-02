'use client';

import { useFrame } from '@react-three/fiber';
import { type RefObject, useRef } from 'react';
import type { Mesh } from 'three';
import { useGame } from '@/src/game/store';

const WALK_FREQ_HZ = 4;
const SPEED_THRESHOLD = 0.05;

type Refs = {
  armL: RefObject<Mesh | null>;
  armR: RefObject<Mesh | null>;
  legL: RefObject<Mesh | null>;
  legR: RefObject<Mesh | null>;
  tail: RefObject<Mesh | null>;
};

const LEG_BASE_Y = 0.2;

/**
 * Drives a walk cycle on the dino's limbs while moving, idle wiggle otherwise.
 */
export function useDinoWalkCycle({ armL, armR, legL, legR, tail }: Refs) {
  const lastPos = useRef<readonly [number, number, number] | null>(null);

  useFrame((_state, dt) => {
    const { position } = useGame.getState().characters.dino;
    const prev = lastPos.current;
    lastPos.current = position;
    const dx = prev ? position[0] - prev[0] : 0;
    const dz = prev ? position[2] - prev[2] : 0;
    const speed = Math.hypot(dx, dz) / Math.max(dt, 1e-3);

    const t = performance.now() / 1000;
    const phase = t * WALK_FREQ_HZ * Math.PI * 2;

    if (speed > SPEED_THRESHOLD) {
      if (armL.current) armL.current.rotation.x = Math.sin(phase) * 0.4;
      if (armR.current) armR.current.rotation.x = -Math.sin(phase) * 0.4;
      if (legL.current) {
        legL.current.position.y = LEG_BASE_Y + Math.sin(phase) * 0.06;
        legL.current.rotation.x = Math.sin(phase) * 0.2;
      }
      if (legR.current) {
        legR.current.position.y = LEG_BASE_Y - Math.sin(phase) * 0.06;
        legR.current.rotation.x = -Math.sin(phase) * 0.2;
      }
      if (tail.current) tail.current.rotation.y = Math.sin(phase) * 0.2;
    } else {
      // idle: mild arm wiggle, neutral legs
      const slow = performance.now() / 500;
      if (armL.current) {
        armL.current.rotation.x = 0;
        armL.current.rotation.z = Math.sin(slow) * 0.05;
      }
      if (armR.current) {
        armR.current.rotation.x = 0;
        armR.current.rotation.z = -Math.sin(slow) * 0.05;
      }
      if (legL.current) {
        legL.current.position.y = LEG_BASE_Y;
        legL.current.rotation.x = 0;
      }
      if (legR.current) {
        legR.current.position.y = LEG_BASE_Y;
        legR.current.rotation.x = 0;
      }
      if (tail.current) tail.current.rotation.y = Math.sin(performance.now() / 600) * 0.08;
    }
  });
}
