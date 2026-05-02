'use client';

import { useFrame } from '@react-three/fiber';
import type { RefObject } from 'react';
import type { Group } from 'three';
import { useGame } from '@/src/game/store';

const GLIDE_Y = 0.5;
const PARTNER_OFFSET: [number, number, number] = [0.35, 0.05, -0.1];

/**
 * Drives the leader/partner lovebirds in active mode.
 * Leader follows `pos.lovebirds`, partner trails leader with delay.
 */
export function useLovebirdMotion(
  leaderRef: RefObject<Group | null>,
  partnerRef: RefObject<Group | null>,
) {
  useFrame((_state, dt) => {
    const { position } = useGame.getState().characters.lovebirds;
    const now = performance.now();
    const bob = Math.sin(now / 400) * 0.04;

    if (leaderRef.current) {
      const target = [position[0], position[1] + GLIDE_Y + bob, position[2]] as const;
      leaderRef.current.position.lerp(
        { x: target[0], y: target[1], z: target[2] } as never,
        Math.min(1, dt * 8),
      );
    }
    if (partnerRef.current && leaderRef.current) {
      const lp = leaderRef.current.position;
      const target = {
        x: lp.x + PARTNER_OFFSET[0],
        y: lp.y + PARTNER_OFFSET[1] + Math.sin(now / 380) * 0.02,
        z: lp.z + PARTNER_OFFSET[2],
      };
      partnerRef.current.position.lerp(target as never, Math.min(1, dt * 6));
    }
  });
}
