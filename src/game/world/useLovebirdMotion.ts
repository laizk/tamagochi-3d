'use client';

import { useFrame } from '@react-three/fiber';
import { type RefObject, useRef } from 'react';
import type { Group, Vector3 } from 'three';
import { useGame } from '@/src/game/store';
import { lerpAngle } from '@/src/lib/math';

const GLIDE_Y = 0.5;
const PARTNER_OFFSET: [number, number, number] = [0.35, 0.05, -0.1];
const YAW_LERP_RATE = 6; // per second
const SPEED_EPS = 0.001;

/**
 * Drives the leader/partner lovebirds in active mode.
 * Leader follows `pos.lovebirds`, partner trails leader with delay.
 * Both yaw to face their direction of travel.
 */
export function useLovebirdMotion(
  leaderRef: RefObject<Group | null>,
  partnerRef: RefObject<Group | null>,
) {
  const prevLeader = useRef<Vector3 | null>(null);
  const prevPartner = useRef<Vector3 | null>(null);

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
      applyYaw(leaderRef.current, prevLeader, dt);
    }
    if (partnerRef.current && leaderRef.current) {
      const lp = leaderRef.current.position;
      const target = {
        x: lp.x + PARTNER_OFFSET[0],
        y: lp.y + PARTNER_OFFSET[1] + Math.sin(now / 380) * 0.02,
        z: lp.z + PARTNER_OFFSET[2],
      };
      partnerRef.current.position.lerp(target as never, Math.min(1, dt * 6));
      applyYaw(partnerRef.current, prevPartner, dt);
    }
  });
}

function applyYaw(group: Group, prev: { current: Vector3 | null }, dt: number): void {
  const cur = group.position;
  if (!prev.current) {
    prev.current = cur.clone();
    return;
  }
  const dx = cur.x - prev.current.x;
  const dz = cur.z - prev.current.z;
  if (Math.hypot(dx, dz) > SPEED_EPS) {
    const targetYaw = Math.atan2(dx, dz);
    group.rotation.y = lerpAngle(group.rotation.y, targetYaw, Math.min(1, dt * YAW_LERP_RATE));
  }
  prev.current.copy(cur);
}
